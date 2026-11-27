# Discovery & Sourcing Engine — current contract

## Product candidate import

`POST /api/discovery/import`

```json
{
  "products": [
    {
      "title": "Example product",
      "supplierPrice": 8.5,
      "estimatedSalePrice": 29.99,
      "currency": "USD",
      "targetCountry": "US",
      "shippingCost": 4.0,
      "sourceName": "Supplier catalog upload",
      "sourceUrl": "https://supplier.example/product/123",
      "marketplace": "eBay",
      "evidence": {
        "observedAt": "2026-11-27T00:00:00.000Z",
        "priceType": "supplier_quote",
        "verification": "unverified"
      }
    }
  ]
}
```

Records are stored as `DISCOVERED`. This endpoint does not claim that demand, sold prices, source inventory or supplier legitimacy have been independently verified.

## Supplier records

`POST /api/suppliers` accepts supplier identity and declared operating information. A new supplier is unverified by default. A human reviewer can mark the record reviewed using `PATCH /api/suppliers/:id/verification`.

## Arbitrage calculation

`POST /api/profit/calculate` requires explicit fee, shipping, returns, advertising and tax/duty assumptions. The engine never invents a global marketplace fee or tax rate. Currency conversion is not performed: all input values must already be in the same currency.

## Next connector interface

Build provider-specific adapters that normalize supplier/product feeds into `CandidateProduct`, retain source evidence and timestamps, respect each source's terms, and never treat an asking price as a completed sale.
