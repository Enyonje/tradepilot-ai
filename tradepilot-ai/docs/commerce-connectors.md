# Commerce research connectors

TradePilot now has server-side connector adapters for three research sources. Configure credentials in the API deployment environment; never place these keys in the browser bundle.

## CJdropshipping

- Environment: `CJ_API_KEY`
- Endpoint: `GET /api/research/cj/products?keyword=wireless%20charger&page=1&size=20`
- Uses CJ API v2 token authentication and Product List V2.
- CJ access tokens are cached in process memory until shortly before expiry. The cache is intentionally not persisted; a process restart simply obtains a fresh token.
- This connector searches/catalogues products only. It does not create orders, spend funds, or publish listings.
- Official docs: https://developers.cjdropshipping.com/en/api/api2/

## Google Trends (through SerpApi)

- Environment: `SERPAPI_API_KEY`
- Endpoint: `GET /api/research/trends?query=portable%20blender&geo=US&date=today%2012-m`
- Returns the upstream Google Trends response, including interest-over-time and related-query fields when available.
- SerpApi is a paid third-party API provider; usage is subject to its plan and limits.
- Docs: https://serpapi.com/google-trends-api

## eBay sold comps (through Trawl)

- Environment: `TRAWL_API_KEY`, optional `TRAWL_API_BASE` (defaults to `https://api.trawl.dev`)
- Endpoint: `GET /api/research/ebay/sold?query=wireless%20headphones&marketplace=EBAY_US&limit=50`
- Trawl is an independent third-party data provider, not an official eBay API. Sold data must be treated as third-party evidence and checked for matching condition, variant, shipping and sale date before profit decisions.
- This integration does not use the retired eBay Finding API `findCompletedItems` endpoint.
- Provider docs: https://trawl.dev/apis/ebay

## Connector status

`GET /api/integrations` reports whether each connector has its required server-side key configured. `configured: true` means a key is present, not that the remote account is valid or currently healthy. Calls perform live requests and surface provider errors; no mock data is returned.

## Safety and evidence rules

- Search results are research candidates, not approved opportunities.
- A trend index is relative interest, not sales volume or proof of demand.
- Active listing prices are not sold prices. Only the sold-comps connector is labelled as completed-sale evidence.
- Verify product identity, variant, condition, destination shipping, stock, delivery estimate, return policy, marketplace fees and local taxes before approving an opportunity.
- The API deliberately has no automatic supplier order or live listing action in this phase.
