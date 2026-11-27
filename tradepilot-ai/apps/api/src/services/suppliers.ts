import { prisma } from "../db/client.js";

export interface CreateSupplierInput {
  name: string;
  website?: string;
  countryCode: string;
  contactEmail?: string;
  sourceType?: string;
  shippingNotes?: string;
  returnPolicy?: string;
}

export async function createSupplier(input: CreateSupplierInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Supplier name is required");
  }

  const countryCode = input.countryCode.trim().toUpperCase();
  if (countryCode.length !== 2) {
    throw new Error("countryCode must be a 2-letter ISO code");
  }

  return prisma.supplier.create({
    data: {
      name,
      website: input.website?.trim() || undefined,
      countryCode,
      contactEmail: input.contactEmail?.trim() || undefined,
      sourceType: input.sourceType?.trim() || "manual",
      shippingNotes: input.shippingNotes?.trim() || undefined,
      returnPolicy: input.returnPolicy?.trim() || undefined
    },
    include: {
      _count: { select: { products: true } }
    }
  });
}

export async function getSuppliers(countryCode?: string) {
  const normalizedCountry = countryCode?.trim().toUpperCase();

  return prisma.supplier.findMany({
    where: normalizedCountry ? { countryCode: normalizedCountry } : {},
    include: {
      _count: { select: { products: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateSupplierVerification(id: string, verified: boolean) {
  const supplierId = id.trim();
  if (!supplierId) {
    throw new Error("Supplier id is required");
  }

  return prisma.supplier.update({
    where: { id: supplierId },
    data: { verified },
    include: {
      _count: { select: { products: true } }
    }
  });
}