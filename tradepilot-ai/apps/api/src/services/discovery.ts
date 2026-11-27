import { OpportunityStatus } from "@prisma/client";
import { prisma } from "../db/client.js";

export interface CandidateProduct {
  title: string;
  supplierPrice: number;
  estimatedSalePrice: number;
  currency: string;
  targetCountry: string;
  shippingCost?: number;
  platformFees?: number;
  paymentFees?: number;
  returnsReserve?: number;
  taxAndDutyReserve?: number;
  sourceName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  marketplace?: string;
  supplierId?: string;
  evidence?: Record<string, unknown>;
}

const VALID_STATUSES = new Set<string>(Object.values(OpportunityStatus));

export async function importCandidates(products: CandidateProduct[]) {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("At least one product candidate is required");
  }

  return prisma.$transaction(async (tx) => {
    const supplierIds = Array.from(
      new Set(products.map((p) => p.supplierId).filter((id): id is string => Boolean(id)))
    );

    if (supplierIds.length > 0) {
      const existingSuppliers = await tx.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true }
      });
      const foundIds = new Set(existingSuppliers.map((s) => s.id));
      const missing = supplierIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new Error(`Referenced supplierId(s) not found: ${missing.join(", ")}`);
      }
    }

    const created = [];
    for (const product of products) {
      const record = await tx.productOpportunity.create({
        data: {
          title: product.title.trim(),
          supplierPrice: product.supplierPrice,
          estimatedSalePrice: product.estimatedSalePrice,
          currency: product.currency.toUpperCase(),
          targetCountry: product.targetCountry.toUpperCase(),
          shippingCost: product.shippingCost ?? 0,
          platformFees: product.platformFees ?? 0,
          paymentFees: product.paymentFees ?? 0,
          returnsReserve: product.returnsReserve ?? 0,
          taxAndDutyReserve: product.taxAndDutyReserve ?? 0,
          sourceName: product.sourceName,
          sourceUrl: product.sourceUrl,
          imageUrl: product.imageUrl,
          marketplace: product.marketplace,
          supplierId: product.supplierId,
          evidence: product.evidence as object | undefined
        },
        include: { supplier: true }
      });
      created.push(record);
    }

    return created;
  });
}

export async function listOpportunities(filters: { country?: string; status?: string; limit?: number }) {
  const normalizedStatus = filters.status?.toUpperCase();
  if (normalizedStatus && !VALID_STATUSES.has(normalizedStatus)) {
    throw new Error(`Invalid opportunity status: ${filters.status}`);
  }

  const take =
    typeof filters.limit === "number" && Number.isFinite(filters.limit)
      ? Math.min(Math.max(Math.trunc(filters.limit), 1), 100)
      : 50;

  return prisma.productOpportunity.findMany({
    where: {
      ...(filters.country ? { targetCountry: filters.country.toUpperCase() } : {}),
      ...(normalizedStatus ? { status: normalizedStatus as OpportunityStatus } : {})
    },
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
    take
  });
}