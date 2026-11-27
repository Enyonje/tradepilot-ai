export interface MarketDefinition {
  countryCode: string;
  country: string;
  currency: string;
  marketplaces: string[];
}

export const markets: MarketDefinition[] = [
  { countryCode: "US", country: "United States", currency: "USD", marketplaces: ["Amazon", "eBay", "Shopify", "Walmart"] },
  { countryCode: "GB", country: "United Kingdom", currency: "GBP", marketplaces: ["Amazon", "eBay", "Shopify"] },
  { countryCode: "CA", country: "Canada", currency: "CAD", marketplaces: ["Amazon", "eBay", "Shopify"] },
  { countryCode: "AU", country: "Australia", currency: "AUD", marketplaces: ["Amazon", "eBay", "Shopify"] },
  { countryCode: "DE", country: "Germany", currency: "EUR", marketplaces: ["Amazon", "eBay", "Shopify"] },
  { countryCode: "FR", country: "France", currency: "EUR", marketplaces: ["Amazon", "eBay", "Shopify"] },
  { countryCode: "IT", country: "Italy", currency: "EUR", marketplaces: ["Amazon", "eBay", "Shopify"] },
  { countryCode: "ES", country: "Spain", currency: "EUR", marketplaces: ["Amazon", "eBay", "Shopify"] },
  { countryCode: "NL", country: "Netherlands", currency: "EUR", marketplaces: ["Amazon", "eBay", "Shopify"] },
  { countryCode: "IE", country: "Ireland", currency: "EUR", marketplaces: ["Amazon", "eBay", "Shopify"] },
  { countryCode: "KE", country: "Kenya", currency: "KES", marketplaces: ["Jumia", "Shopify", "WooCommerce"] },
  { countryCode: "ZA", country: "South Africa", currency: "ZAR", marketplaces: ["Takealot", "Shopify"] },
  { countryCode: "NG", country: "Nigeria", currency: "NGN", marketplaces: ["Jumia", "Shopify"] },
  { countryCode: "AE", country: "United Arab Emirates", currency: "AED", marketplaces: ["Amazon", "Noon", "Shopify"] },
  { countryCode: "SG", country: "Singapore", currency: "SGD", marketplaces: ["Amazon", "Shopee", "Shopify"] },
  { countryCode: "JP", country: "Japan", currency: "JPY", marketplaces: ["Amazon", "Rakuten", "Shopify"] },
  { countryCode: "IN", country: "India", currency: "INR", marketplaces: ["Amazon", "Flipkart", "Shopify"] },
  { countryCode: "BR", country: "Brazil", currency: "BRL", marketplaces: ["Mercado Livre", "Amazon", "Shopify"] },
  { countryCode: "MX", country: "Mexico", currency: "MXN", marketplaces: ["Amazon", "Mercado Libre", "Shopify"] }
];
