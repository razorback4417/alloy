import { Download, FileText, X } from 'lucide-react';
import { Button } from './ui/button';
import { AlloyLogo } from './AlloyLogo';
import type { ProcurementItem } from '../App';
import { jsPDF } from 'jspdf';

interface POPreviewProps {
  plan: ProcurementItem[];
  onClose: () => void;
}

export function POPreview({ plan, onClose }: POPreviewProps) {
  const poNumber = `PO-${Date.now().toString().slice(-8)}`;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const subtotal = plan.reduce((sum, item) => sum + item.totalCost, 0);
  const shipping = 45;
  const total = subtotal + shipping;

  // Group by vendor
  const vendorGroups = plan.reduce((acc, item) => {
    if (!acc[item.vendor]) acc[item.vendor] = [];
    acc[item.vendor].push(item);
    return acc;
  }, {} as Record<string, ProcurementItem[]>);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const lineHeight = 7;
    const sectionSpacing = 10;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE ORDER', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight * 2;

    // PO Number and Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`PO Number: ${poNumber}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Date: ${today}`, margin, yPosition);
    yPosition += sectionSpacing * 2;

    // Company Information
    checkPageBreak(lineHeight * 8);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('From:', margin, yPosition);
    yPosition += lineHeight * 1.5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Company Name', margin, yPosition);
    yPosition += lineHeight;
    doc.text('123 Engineering Drive', margin, yPosition);
    yPosition += lineHeight;
    doc.text('San Francisco, CA 94107', margin, yPosition);
    yPosition += lineHeight;
    doc.text('Locus Wallet: 0x742d...89cf', margin, yPosition);
    yPosition += sectionSpacing * 2;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Deliver To:', margin, yPosition);
    yPosition += lineHeight * 1.5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Receiving Department', margin, yPosition);
    yPosition += lineHeight;
    doc.text('123 Engineering Drive, Dock B', margin, yPosition);
    yPosition += lineHeight;
    doc.text('San Francisco, CA 94107', margin, yPosition);
    yPosition += lineHeight;
    doc.text('Contact: procurement@yourcompany.com', margin, yPosition);
    yPosition += sectionSpacing * 2;

    // Line Items by Vendor
    Object.entries(vendorGroups).forEach(([vendor, items]) => {
      checkPageBreak(lineHeight * 15);

      // Vendor Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(vendor, margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 150, 0);
      doc.text('✓ Verified Locus Vendor • Whitelisted', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += sectionSpacing;

      // Table Header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Item', margin, yPosition);
      doc.text('Specifications', margin + 40, yPosition);
      doc.text('Qty', pageWidth - margin - 50, yPosition, { align: 'right' });
      doc.text('Unit Price', pageWidth - margin - 30, yPosition, { align: 'right' });
      doc.text('Total', pageWidth - margin - 10, yPosition, { align: 'right' });
      yPosition += lineHeight;

      // Draw line under header
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
      yPosition += 3;

      // Table Rows
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      items.forEach((item) => {
        checkPageBreak(lineHeight * 3);

        // Item name (truncate if too long)
        const itemName = doc.splitTextToSize(item.partName, 35);
        doc.text(itemName, margin, yPosition);

        // Specifications (truncate if too long)
        const specs = doc.splitTextToSize(item.specifications, 50);
        doc.text(specs, margin + 40, yPosition);

        // Quantity
        doc.text(item.quantity.toString(), pageWidth - margin - 50, yPosition, { align: 'right' });

        // Unit Price
        doc.text(`$${item.pricePerUnit.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });

        // Total
        doc.text(`$${item.totalCost.toFixed(2)}`, pageWidth - margin - 10, yPosition, { align: 'right' });

        yPosition += lineHeight * Math.max(itemName.length, specs.length, 1);
      });

      // Vendor Subtotal
      const vendorSubtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
      yPosition += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;

      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal for ${vendor}:`, margin, yPosition);
      doc.text(`$${vendorSubtotal.toFixed(2)}`, pageWidth - margin - 10, yPosition, { align: 'right' });
      yPosition += sectionSpacing * 2;
    });

    // Totals Section
    checkPageBreak(lineHeight * 8);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += sectionSpacing;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', pageWidth - margin - 50, yPosition, { align: 'right' });
    doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin - 10, yPosition, { align: 'right' });
    yPosition += lineHeight;

    doc.text('Shipping & Handling:', pageWidth - margin - 50, yPosition, { align: 'right' });
    doc.text(`$${shipping.toFixed(2)}`, pageWidth - margin - 10, yPosition, { align: 'right' });
    yPosition += lineHeight * 1.5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', pageWidth - margin - 50, yPosition, { align: 'right' });
    doc.text(`$${total.toFixed(2)} USDC`, pageWidth - margin - 10, yPosition, { align: 'right' });
    yPosition += sectionSpacing * 2;

    // Notes Section
    checkPageBreak(lineHeight * 8);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes for Vendors:', margin, yPosition);
    yPosition += lineHeight * 1.5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const notes = [
      'This purchase order was generated by Alloy Autonomous Procurement Copilot.',
      'Payment will be executed via Locus Network using USDC on Ethereum.',
      'Please confirm receipt and provide estimated delivery dates.',
      '',
      'Terms: Net 30 · Delivery FOB Destination · All items must meet specified tolerances'
    ];

    notes.forEach((note) => {
      if (note) {
        const wrappedText = doc.splitTextToSize(note, pageWidth - margin * 2);
        doc.text(wrappedText, margin, yPosition);
        yPosition += lineHeight * wrappedText.length;
      } else {
        yPosition += lineHeight;
      }
    });

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by Alloy Autonomous Procurement Copilot • Powered by Locus Network', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Document ID: ${poNumber} • Generated: ${new Date().toISOString()}`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Save the PDF
    const fileName = `${poNumber}_Purchase_Order.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="glass-card border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 glass-card-blue border-b border-white/10 px-8 py-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl text-white">Purchase Order Preview</h2>
              <p className="text-sm text-gray-400">{poNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-white"
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/5">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* PO Content */}
        <div className="p-8">
          {/* PO Header */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                <AlloyLogo className="w-12 h-12" />
                <div>
                  <h3 className="text-2xl text-white">Alloy</h3>
                  <p className="text-sm text-gray-400">Autonomous Procurement Platform</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Purchase Order</p>
                <p className="text-2xl text-white font-mono">{poNumber}</p>
                <p className="text-sm text-gray-400 mt-1">{today}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">From</p>
                <p className="text-white">Your Company Name</p>
                <p className="text-sm text-gray-400">123 Engineering Drive</p>
                <p className="text-sm text-gray-400">San Francisco, CA 94107</p>
                <p className="text-sm text-gray-400 mt-2">Locus Wallet: 0x742d...89cf</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Deliver To</p>
                <p className="text-white">Receiving Department</p>
                <p className="text-sm text-gray-400">123 Engineering Drive, Dock B</p>
                <p className="text-sm text-gray-400">San Francisco, CA 94107</p>
                <p className="text-sm text-gray-400 mt-2">Contact: procurement@yourcompany.com</p>
              </div>
            </div>
          </div>

          {/* Line Items by Vendor */}
          {Object.entries(vendorGroups).map(([vendor, items]) => (
            <div key={vendor} className="mb-6">
              <div className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-white/10 rounded-lg px-6 py-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{vendor}</p>
                    <p className="text-sm text-gray-400">Verified Locus Vendor</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-sm border border-green-500/20">
                      ✓ Whitelisted
                    </span>
                    <span className="text-orange-400 font-mono">
                      ${items.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/3 border border-white/10 rounded-lg overflow-hidden mb-4">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 uppercase">Item</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 uppercase">Specifications</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-400 uppercase">Qty</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-400 uppercase">Unit Price</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-400 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-white/5">
                        <td className="px-4 py-3 text-white">{item.partName}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{item.specifications}</td>
                        <td className="px-4 py-3 text-right text-white">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-400">${item.pricePerUnit.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-white">${item.totalCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Shipping & Handling</span>
                <span className="text-white">${shipping.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-xl text-white">Total</span>
                <span className="text-2xl bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                  ${total.toFixed(2)} USDC
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6 bg-white/3 border border-white/10 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-2">Notes for Vendors:</p>
            <p className="text-sm text-white/80">
              This purchase order was generated by <span className="text-blue-400">Alloy Autonomous Procurement Copilot</span>.
              Payment will be executed via <span className="text-orange-400">Locus Network</span> using USDC on Ethereum.
              Please confirm receipt and provide estimated delivery dates.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Terms: Net 30 · Delivery FOB Destination · All items must meet specified tolerances
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">
              Generated by Alloy Autonomous Procurement Copilot • Powered by Locus Network
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Document ID: {poNumber} • Generated: {new Date().toISOString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
