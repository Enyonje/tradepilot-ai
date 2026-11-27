# TradePilot Agent Orchestration

## First workflow: product research

Endpoint: `POST /api/agents/research`

```json
{
  "keyword": "wireless earbuds",
  "targetCountry": "US",
  "currency": "USD",
  "marketplace": "EBAY",
  "soldMarketplace": "EBAY_US",
  "maxProducts": 20
}
```

The workflow creates an `AgentRun` record with status `RUNNING`, then invokes CJdropshipping catalogue search, Google Trends (SerpApi), and eBay sold-comps (Trawl) concurrently. A failed connector is recorded without cancelling successful connector results. The workflow stores its final summary, AI assessment (if an AI provider is configured), errors and completion time in `AgentRun`.

## Evidence and currency rules

- CJ supplier prices are used only if the response contains an explicit currency field.
- Sold-comps prices are summarized with a median, not an asking-price average.
- Opportunity creation requires supplier currency, sold-comps currency and requested currency to match.
- The sold-data market must match the target country. Current supported sold markets are eBay US and eBay UK only.
- No FX conversion, marketplace fee estimate, tax estimate or shipping estimate is invented by this workflow.
- Provider payload formats may vary by account and API version. Validate actual payload mapping before relying on normalized product rows.

## Run history

`GET /api/agents/runs?limit=30` returns recent runs. Status is `COMPLETED` or `FAILED` after the workflow exits. Connector-specific failures can still exist on a `COMPLETED` run when other sources succeeded.

## Safety

This workflow is research-only. It does not contact suppliers, buy products, create listings, publish content or fulfill orders. The AI assessment is advisory and is never an authorization signal.
