import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = OFF');

// Drop old tables
['InvoiceItem', 'Invoice', 'Customer', 'BankAccount', 'Settings'].forEach(t => {
  db.prepare(`DROP TABLE IF EXISTS "${t}"`).run();
  console.log(`Dropped ${t}`);
});

db.pragma('foreign_keys = ON');

// Create Settings
db.prepare(`
  CREATE TABLE "Settings" (
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
  )
`).run();
db.prepare(`INSERT INTO "Settings" ("id") VALUES ('singleton')`).run();

// Create BankAccount
db.prepare(`
  CREATE TABLE "BankAccount" (
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
  )
`).run();

// Create Customer
db.prepare(`
  CREATE TABLE "Customer" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "name"      TEXT     NOT NULL,
    "address"   TEXT,
    "kraPin"    TEXT,
    "email"     TEXT,
    "phone"     TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Create Invoice
db.prepare(`
  CREATE TABLE "Invoice" (
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
  )
`).run();

db.prepare(`CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId")`).run();
db.prepare(`CREATE INDEX "Invoice_status_idx" ON "Invoice"("status")`).run();
db.prepare(`CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt")`).run();

// Verify
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('\nTables created:');
tables.forEach(t => console.log(' -', t.name));

db.close();
console.log('\nDone!');
