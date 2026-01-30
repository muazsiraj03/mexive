import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { Subscription } from "@/hooks/use-subscription";
import logoIcon from "@/assets/logo-icon.png";

interface InvoiceData {
  subscription: Subscription;
  planDisplayName: string;
  planPrice: number;
  userEmail?: string;
  userName?: string;
}

export async function downloadInvoice(data: InvoiceData): Promise<void> {
  const { subscription, planDisplayName, planPrice, userEmail, userName } = data;
  const invoiceNumber = `INV-${subscription.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = format(subscription.startedAt, "MMMM d, yyyy");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Load and add logo
  try {
    const img = new Image();
    img.src = logoIcon;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    doc.addImage(img, "PNG", 20, y - 8, 28, 28);
  } catch (e) {
    // Fallback to text if image fails
    doc.setFontSize(24);
    doc.setTextColor(99, 102, 241);
    doc.text("MetaGen", 20, y + 6);
  }

  // Invoice info on the right
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(invoiceNumber, pageWidth - 20, y, { align: "right" });
  doc.text(invoiceDate, pageWidth - 20, y + 5, { align: "right" });

  y += 35;

  // Billed To section
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("BILLED TO", 20, y);
  
  y += 7;
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(userName || "Customer", 20, y);
  
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(userEmail || "—", 20, y);

  y += 20;

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(20, y - 5, pageWidth - 40, 10, "F");
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("DESCRIPTION", 25, y);
  doc.text("STATUS", 110, y);
  doc.text("AMOUNT", pageWidth - 25, y, { align: "right" });

  y += 12;

  // Table row
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(`${planDisplayName} Plan`, 25, y);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Monthly subscription", 25, y + 5);

  // Status badge
  const statusColors: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
    active: { bg: [220, 252, 231], text: [22, 101, 52] },
    pending: { bg: [254, 243, 199], text: [146, 64, 14] },
    canceled: { bg: [254, 226, 226], text: [153, 27, 27] },
    expired: { bg: [243, 244, 246], text: [75, 85, 99] },
  };
  
  const statusColor = statusColors[subscription.status] || statusColors.expired;
  doc.setFillColor(...statusColor.bg);
  doc.roundedRect(105, y - 4, 30, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(...statusColor.text);
  doc.text(subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1), 120, y, { align: "center" });

  // Amount
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(`$${planPrice.toFixed(2)}`, pageWidth - 25, y, { align: "right" });

  y += 20;

  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.line(20, y, pageWidth - 20, y);

  y += 12;

  // Total
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Total", 25, y);
  doc.text(`$${planPrice.toFixed(2)}`, pageWidth - 25, y, { align: "right" });

  y += 40;

  // Footer
  doc.setDrawColor(230, 230, 230);
  doc.line(20, y, pageWidth - 20, y);
  
  y += 15;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });
  doc.text("For questions, contact support@metagen.app", pageWidth / 2, y + 6, { align: "center" });

  // Save PDF
  doc.save(`invoice-${subscription.id.slice(0, 8)}.pdf`);
}
