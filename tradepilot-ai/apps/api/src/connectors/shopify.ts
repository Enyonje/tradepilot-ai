import { OpportunityStatus } from "@prisma/client";
import { prisma } from "../db/client.js";
import { env } from "../config/env.js";

function assertShopifyConfig() {
  if (!env.shopifyStoreDomain || !env.shopifyAdminToken) {
    throw new Error("SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN must be configured in .env");
  }
}

async function shopifyGraphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  assertShopifyConfig();
  const domain = env.shopifyStoreDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const version = env.shopifyApiVersion || "2026-10";
  const url = `https://${domain}/admin/api/${version}/graphql.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": env.shopifyAdminToken
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(env.connectorTimeoutMs || 15000)
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`Shopify GraphQL HTTP ${response.status}: ${bodyText || response.statusText}`);
  }

  const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) {
    throw new Error("Shopify GraphQL response contained no data");
  }

  return json.data;
}

export async function publishOpportunityToShopify(opportunityId: string) {
  const opp = await prisma.productOpportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) {
    throw new Error(`Opportunity not found: ${opportunityId}`);
  }

  const existingEvidence =
    opp.evidence && typeof opp.evidence === "object" && !Array.isArray(opp.evidence)
      ? (opp.evidence as Record<string, unknown>)
      : {};

  if (existingEvidence.shopifyProductId) {
    const updated = await prisma.productOpportunity.update({
      where: { id: opp.id },
      data: { status: OpportunityStatus.LISTED, marketplace: "SHOPIFY" }
    });
    return { opportunity: updated, shopifyProductId: existingEvidence.shopifyProductId, alreadyCreated: true };
  }

  const draft =
    existingEvidence.listingDraft && typeof existingEvidence.listingDraft === "object"
      ? (existingEvidence.listingDraft as Record<string, unknown>)
      : null;

  const title =
    typeof draft?.optimizedTitle === "string" && draft.optimizedTitle.trim()
      ? draft.optimizedTitle.trim().slice(0, 255)
      : opp.title.slice(0, 255);

  const descriptionHtml =
    typeof draft?.description === "string" && draft.description.trim()
      ? `<p>${draft.description.trim()}</p>`
      : `<p>${opp.title}</p>`;

  const mutation = `
    mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product {
          id
          title
          handle
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const media = opp.imageUrl
    ? [{ originalSource: opp.imageUrl, alt: title, mediaContentType: "IMAGE" }]
    : undefined;

  const data = await shopifyGraphql<{
    productCreate: {
      product: { id: string; title: string; handle: string; status: string } | null;
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(mutation, {
    product: {
      title,
      descriptionHtml,
      vendor: opp.sourceName || "TradePilot AI",
      status: "ACTIVE"
    },
    media
  });

  const userErrors = data.productCreate.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(`Shopify productCreate failed: ${userErrors.map((e) => e.message).join("; ")}`);
  }

  const createdProduct = data.productCreate.product;
  if (!createdProduct) {
    throw new Error("Shopify productCreate returned no product");
  }

  const updated = await prisma.productOpportunity.update({
    where: { id: opp.id },
    data: {
      status: OpportunityStatus.LISTED,
      marketplace: "SHOPIFY",
      evidence: {
        ...existingEvidence,
        shopifyProductId: createdProduct.id,
        shopifyHandle: createdProduct.handle,
        shopifyStatus: createdProduct.status,
        listedAt: new Date().toISOString()
      } as any
    }
  });

  return { opportunity: updated, shopifyProduct: createdProduct };
}

export async function getShopifyOrders(first = 25) {
  const query = `
    query RecentOrders($first: Int!) {
      orders(first: $first, reverse: true) {
        nodes {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 10) {
            nodes {
              title
              quantity
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphql<{
    orders: {
      nodes: Array<{
        id: string;
        name: string;
        createdAt: string;
        displayFinancialStatus: string | null;
        displayFulfillmentStatus: string | null;
        currentTotalPriceSet?: {
          shopMoney?: { amount: string; currencyCode: string };
        };
        lineItems?: { nodes: Array<{ title: string; quantity: number }> };
      }>;
    };
  }>(query, { first: Math.min(Math.max(first, 1), 50) });

  return data.orders.nodes;
}