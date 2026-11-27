import { prisma } from "../db/client.js";

export async function createSupplier(input: {
  name: string; website?: string; countryCode: string; contactEmail?: string;
  sourceType?: string; shippingNotes?: string; returnPolicy?: string;
}) {
  return prisma.supplier.create({ data: { ...input, countryCode: input.countryCode.toUpperCase() } });
}

export async function getSuppliers(countryCode?: string) {
  return prisma.supplier.findMany({
    where: countryCode ? { countryCode: countryCode.toUpperCase() } : {},
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateSupplierVerification(id: string, verified: boolean) {
  return prisma.supplier.update({ where: { id }, data: { verified } });
}
