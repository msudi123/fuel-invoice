import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

function initializeSchema(sqlite: Database.Database) {
  sqlite.pragma("foreign_keys = OFF");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "Settings" (
      "id"              TEXT     NOT NULL PRIMARY KEY,
      "companyName"     TEXT     NOT NULL DEFAULT 'Likoni Logistics Ltd',
      "companyTagline"  TEXT     NOT NULL DEFAULT 'Fuel Reseller & Transport Solutions',
      "physicalAddress" TEXT     NOT NULL DEFAULT '',
      "postalAddress"   TEXT     NOT NULL DEFAULT '',
      "phone"           TEXT     NOT NULL DEFAULT '',
      "email"           TEXT     NOT NULL DEFAULT '',
      "website"         TEXT     NOT NULL DEFAULT '',
      "kraPin"          TEXT     NOT NULL DEFAULT '',
      "vatPin"          TEXT     NOT NULL DEFAULT '',
      "logoPath"        TEXT,
      "vatEnabled"      INTEGER  NOT NULL DEFAULT 0,
      "vatRate"         REAL     NOT NULL DEFAULT 16,
      "paymentTerms"    TEXT     NOT NULL DEFAULT 'CASH',
      "invoicePrefix"   TEXT     NOT NULL DEFAULT 'LL',
      "nextSequence"    INTEGER  NOT NULL DEFAULT 1,
      "defaultCurrency" TEXT     NOT NULL DEFAULT 'USD',
      "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO "Settings" ("id") VALUES ('singleton');

    CREATE TABLE IF NOT EXISTS "BankAccount" (
      "id"            TEXT     NOT NULL PRIMARY KEY,
      "bankName"      TEXT     NOT NULL,
      "accountName"   TEXT     NOT NULL,
      "accountNumber" TEXT     NOT NULL,
      "branch"        TEXT,
      "swiftCode"     TEXT,
      "bankAddress"   TEXT,
      "currency"      TEXT     NOT NULL DEFAULT 'KES',
      "isDefault"     INTEGER  NOT NULL DEFAULT 0,
      "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Customer" (
      "id"        TEXT     NOT NULL PRIMARY KEY,
      "name"      TEXT     NOT NULL,
      "address"   TEXT,
      "kraPin"    TEXT,
      "email"     TEXT,
      "phone"     TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Invoice" (
      "id"               TEXT     NOT NULL PRIMARY KEY,
      "invoiceNumber"    TEXT     NOT NULL UNIQUE,
      "invoiceDate"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dueDate"          DATETIME NOT NULL,
      "customerId"       TEXT     NOT NULL,
      "customerRef"      TEXT,
      "bankAccountId"    TEXT,
      "fuelType"         TEXT     NOT NULL,
      "quantity"         REAL     NOT NULL,
      "unit"             TEXT     NOT NULL DEFAULT 'MT',
      "transType"        TEXT     NOT NULL DEFAULT 'Local',
      "destination"      TEXT,
      "currency"         TEXT     NOT NULL DEFAULT 'USD',
      "sellingAmount"    REAL     NOT NULL,
      "purchaseAmount"   REAL     NOT NULL DEFAULT 0,
      "purchaseQuantity" REAL,
      "purchaseUnit"     TEXT,
      "grossProfit"      REAL     NOT NULL DEFAULT 0,
      "vatEnabled"       INTEGER  NOT NULL DEFAULT 0,
      "vatRate"          REAL     NOT NULL DEFAULT 16,
      "paymentTerms"     TEXT     NOT NULL DEFAULT 'CASH',
      "notes"            TEXT,
      "status"           TEXT     NOT NULL DEFAULT 'unpaid',
      "createdAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("customerId")    REFERENCES "Customer"("id"),
      FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id")
    );

    CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");
    CREATE INDEX IF NOT EXISTS "Invoice_status_idx"     ON "Invoice"("status");
    CREATE INDEX IF NOT EXISTS "Invoice_createdAt_idx"  ON "Invoice"("createdAt");
  `);

  sqlite.pragma("foreign_keys = ON");
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  (() => {
    const sqlite = new Database(dbPath);
    initializeSchema(sqlite);
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    return new PrismaClient({ adapter } as any);
  })();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
