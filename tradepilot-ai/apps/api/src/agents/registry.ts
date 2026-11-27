export const agents = [
  { key: "commerce-research-orchestrator", name: "Commerce Research Orchestrator", department: "Commerce Intelligence", status: "ready", description: "Coordinates supplier catalogue, demand trend and completed-sale evidence into an auditable research run." },
  { key: "product-hunter", name: "Product Hunter", department: "Commerce Intelligence", status: "ready", description: "Finds candidate products from connected feeds and approved sources." },
  { key: "market-researcher", name: "Market Researcher", department: "Commerce Intelligence", status: "ready", description: "Evaluates demand, competition and evidence quality using connected research sources." },
  { key: "supplier-intelligence", name: "Supplier Intelligence", department: "Sourcing & Finance", status: "planned", description: "Compares supplier reliability, costs and fulfillment terms." },
  { key: "arbitrage-analyst", name: "Arbitrage Analyst", department: "Sourcing & Finance", status: "ready", description: "Compares landed cost with target-market sale estimates." },
  { key: "risk-compliance", name: "Risk & Compliance", department: "Sourcing & Finance", status: "planned", description: "Flags restricted products, brand/IP concerns and market-specific risks." },
  { key: "listing-studio", name: "Listing Studio", department: "Store Operations", status: "planned", description: "Prepares marketplace-specific listing drafts." },
  { key: "order-operations", name: "Order Operations", department: "Store Operations", status: "planned", description: "Coordinates order validation and supplier fulfillment." },
  { key: "growth-marketer", name: "Growth Marketer", department: "Growth", status: "planned", description: "Plans SEO and paid/organic campaign experiments." },
  { key: "business-intelligence", name: "Business Intelligence", department: "Executive Intelligence", status: "planned", description: "Summarizes revenue, costs, contribution margin and agent performance." }
] as const;
