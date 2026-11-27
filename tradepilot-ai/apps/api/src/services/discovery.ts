import { prisma } from "../db/client.js";

export interface CandidateProduct {
  title: string;
  supplierPrice: number;
  estimatedSalePrice: number;
  currency: string;
  targetCountry: string;
  shippingCost?: number;
  sourceName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  marketplace?: string;
  supplierId?: string;
  evidence?: Record<string, unknown>;
}

export async function importCandidates(products: CandidateProduct[]) {
  const created = [];
  for (const product of products) {
    created.push(await prisma.productOpportunity.create({
      data: {
        title: product.title,
        supplierPrice: product.supplierPrice,
        estimatedSalePrice: product.estimatedSalePrice,
        currency: product.currency.toUpperCase(),
        targetCountry: product.targetCountry.toUpperCase(),
        shippingCost: product.shippingCost ?? 0,
        sourceName: product.sourceName,
        sourceUrl: product.sourceUrl,
        imageUrl: product.imageUrl,
        marketplace: product.marketplace,
        supplierId: product.supplierId,
        evidence: product.evidence as object | undefined
      }
    }));
  }
  return created;
}

export async function listOpportunities(filters: { country?: string; status?: string; limit?: number }) {
  return prisma.productOpportunity.findMany({
    where: {
      ...(filters.country ? { targetCountry: filters.country.toUpperCase() } : {}),
      ...(filters.status ? { status: filters.status as never } : {})
    },
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
    take: Math.min(filters.limit ?? 50, 100)
  });
}
