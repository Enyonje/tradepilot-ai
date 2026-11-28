import * as PrismaClientModule from "@prisma/client";

const PrismaClient =
  PrismaClientModule.PrismaClient ??
  (PrismaClientModule as { default?: { PrismaClient?: typeof PrismaClientModule.PrismaClient } })
    .default?.PrismaClient;

if (!PrismaClient) {
  throw new Error("Unable to resolve PrismaClient from @prisma/client. Run `npx prisma generate`.");
}

export const prisma = new PrismaClient();