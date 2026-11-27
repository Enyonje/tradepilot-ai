import { env } from "../config/env.js";
import { connectorFetch } from "./http.js";

type CjEnvelope<T> = { code?: number; result?: boolean; success?: boolean; message?: string; data: T };
type CjToken = { accessToken: string; refreshToken: string; accessTokenExpiryDate?: string };
let tokenCache: { value: string; expiresAt: number } | undefined;

async function accessToken(): Promise<string> {
  if (!env.cjApiKey) throw new Error("CJdropshipping is not configured. Add CJ_API_KEY on the server.");
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;
  const result = await connectorFetch<CjEnvelope<CjToken>>("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: env.cjApiKey })
  });
  if (result.result === false || !result.data?.accessToken) throw new Error(result.message || "CJ authentication failed");
  const expiry = result.data.accessTokenExpiryDate ? Date.parse(result.data.accessTokenExpiryDate) : Date.now() + 6 * 60 * 60 * 1000;
  tokenCache = { value: result.data.accessToken, expiresAt: Number.isFinite(expiry) ? expiry : Date.now() + 6 * 60 * 60 * 1000 };
  return tokenCache.value;
}

export async function searchCjProducts(input: { keyword: string; page?: number; size?: number }) {
  const token = await accessToken();
  const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/listV2");
  url.searchParams.set("page", String(input.page ?? 1));
  url.searchParams.set("size", String(input.size ?? 20));
  url.searchParams.set("keyWord", input.keyword);
  const result = await connectorFetch<CjEnvelope<any>>(url.toString(), { headers: { "CJ-Access-Token": token } });
  if (result.result === false) throw new Error(result.message || "CJ product search failed");
  return { provider: "cjdropshipping", data: result.data, requestMessage: result.message };
}
