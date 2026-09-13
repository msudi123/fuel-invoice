import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { calcInvoiceTotal, calcVat, fuelLabel, formatAmount } from "./calculations";
import fs from "fs";
import path from "path";

function getLogoDataUrl(): string | null {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const data = fs.readFileSync(logoPath);
    return `data:image/png;base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  logoImage: {
    width: 64,
    height: 64,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
  },
  companyTagline: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  invoiceLabel: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "1px solid #e5e7eb",
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
  },
  metaValueBold: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: "6 8",
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "10 8",
    borderBottom: "1px solid #f3f4f6",
  },
  colFuel: { width: "28%" },
  colTrans: { width: "18%" },
  colDest: { width: "18%" },
  colQty: { width: "18%", textAlign: "right" },
  colAmount: { width: "18%", textAlign: "right" },
  thText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tdText: { fontSize: 10, color: "#374151" },
  totalsSection: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 10, color: "#6b7280" },
  totalValue: { fontSize: 10, color: "#374151" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 6,
    marginTop: 4,
    borderTop: "1.5px solid #111827",
  },
  grandTotalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#111827" },
  grandTotalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1d4ed8" },
  bankSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTop: "1px solid #e5e7eb",
  },
  bankLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  bankRow: { flexDirection: "row", marginBottom: 2 },
  bankKey: { fontSize: 9, color: "#9ca3af", width: 80 },
  bankVal: { fontSize: 9, color: "#374151" },
  notes: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: "1px solid #e5e7eb",
  },
  notesLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  notesText: { fontSize: 10, color: "#6b7280", lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#d1d5db",
  },
  statusBadge: {
    marginTop: 4,
    alignSelf: "flex-end",
    backgroundColor: "#d1fae5",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 8, color: "#065f46", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
});

interface BankAccountData {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string | null;
  swiftCode?: string | null;
  currency: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate: Date | string;
  status: string;
  fuelType: string;
  quantity: number;
  unit: string;
  transType: string;
  destination?: string | null;
  currency: string;
  sellingAmount: number;
  vatEnabled: boolean;
  vatRate: number;
  paymentTerms: string;
  customerRef?: string | null;
  notes?: string | null;
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    kraPin?: string | null;
  };
  bankAccount?: BankAccountData | null;
}

function InvoicePDF({ invoice, logoDataUrl }: { invoice: InvoiceData; logoDataUrl: string | null }) {
  const vat = calcVat(invoice.sellingAmount, invoice.vatEnabled ? invoice.vatRate : 0);
  const total = calcInvoiceTotal(invoice.sellingAmount, invoice.vatEnabled, invoice.vatRate);
  const fmt = (n: number) => formatAmount(n, invoice.currency);

  const hasDestination = !!invoice.destination;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {logoDataUrl ? (
              <Image src={logoDataUrl} style={styles.logoImage} />
            ) : null}
            <View>
              <Text style={styles.companyName}>Likoni Logistics Ltd</Text>
              <Text style={styles.companyTagline}>Fuel Reseller & Transport Solutions</Text>
            </View>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Bill To</Text>
            <Text style={styles.metaValueBold}>{invoice.customer.name}</Text>
            {invoice.customer.kraPin ? <Text style={styles.metaValue}>KRA PIN: {invoice.customer.kraPin}</Text> : null}
            {invoice.customer.email ? <Text style={styles.metaValue}>{invoice.customer.email}</Text> : null}
            {invoice.customer.phone ? <Text style={styles.metaValue}>{invoice.customer.phone}</Text> : null}
            {invoice.customer.address ? <Text style={styles.metaValue}>{invoice.customer.address}</Text> : null}
          </View>
          <View style={[styles.metaBlock, { alignItems: "flex-end" }]}>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.metaLabel}>Invoice Date</Text>
              <Text style={styles.metaValue}>{new Date(invoice.invoiceDate).toLocaleDateString("en-KE")}</Text>
            </View>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{new Date(invoice.dueDate).toLocaleDateString("en-KE")}</Text>
            </View>
            {invoice.customerRef ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.metaLabel}>Customer Ref</Text>
                <Text style={styles.metaValue}>{invoice.customerRef}</Text>
              </View>
            ) : null}
            {invoice.status === "paid" && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>PAID</Text>
              </View>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colFuel]}>Fuel Type</Text>
            <Text style={[styles.thText, styles.colTrans]}>Trans. Type</Text>
            {hasDestination ? <Text style={[styles.thText, styles.colDest]}>Destination</Text> : null}
            <Text style={[styles.thText, styles.colQty]}>Quantity</Text>
            <Text style={[styles.thText, styles.colAmount]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tdText, styles.colFuel]}>{fuelLabel(invoice.fuelType)}</Text>
            <Text style={[styles.tdText, styles.colTrans]}>{invoice.transType}</Text>
            {hasDestination ? <Text style={[styles.tdText, styles.colDest]}>{invoice.destination}</Text> : null}
            <Text style={[styles.tdText, styles.colQty]}>{invoice.quantity.toLocaleString()} {invoice.unit}</Text>
            <Text style={[styles.tdText, styles.colAmount]}>{fmt(invoice.sellingAmount)}</Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(invoice.sellingAmount)}</Text>
          </View>
          {invoice.vatEnabled ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT ({invoice.vatRate}%)</Text>
              <Text style={styles.totalValue}>{fmt(vat)}</Text>
            </View>
          ) : null}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Payment terms & bank account */}
        {invoice.bankAccount ? (
          <View style={styles.bankSection}>
            <Text style={styles.bankLabel}>Payment Details — {invoice.paymentTerms}</Text>
            <View style={styles.bankRow}>
              <Text style={styles.bankKey}>Bank</Text>
              <Text style={styles.bankVal}>{invoice.bankAccount.bankName}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankKey}>Account Name</Text>
              <Text style={styles.bankVal}>{invoice.bankAccount.accountName}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankKey}>Account No.</Text>
              <Text style={styles.bankVal}>{invoice.bankAccount.accountNumber}</Text>
            </View>
            {invoice.bankAccount.branch ? (
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>Branch</Text>
                <Text style={styles.bankVal}>{invoice.bankAccount.branch}</Text>
              </View>
            ) : null}
            {invoice.bankAccount.swiftCode ? (
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>SWIFT</Text>
                <Text style={styles.bankVal}>{invoice.bankAccount.swiftCode}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Notes */}
        {invoice.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Thank you for your business. Please make payment by the due date above.
        </Text>
      </Page>
    </Document>
  );
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  const logoDataUrl = getLogoDataUrl();
  const buffer = await renderToBuffer(<InvoicePDF invoice={invoice} logoDataUrl={logoDataUrl} />);
  return buffer;
}
