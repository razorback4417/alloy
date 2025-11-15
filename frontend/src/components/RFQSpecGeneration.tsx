import { useState } from 'react';
import { FileText, Download, Send, Package, X, Mail } from 'lucide-react';
import { Button } from './ui/button';
import type { VendorSourcingResponse } from '../lib/api';
import { sendEmail } from '../lib/api';
import { jsPDF } from 'jspdf';

interface RFQSpecGenerationProps {
  components: Array<{
    name: string;
    quantity: string;
    specifications: string;
  }>;
  selectedVendors: Record<string, string>;
  sourcingData: VendorSourcingResponse | null;
  onContinue: () => void;
}

export function RFQSpecGeneration({ components, selectedVendors, sourcingData, onContinue }: RFQSpecGenerationProps) {
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Get selected vendor details for each component
  const getSelectedVendorDetails = (componentName: string) => {
    if (!sourcingData) return null;

    const search = sourcingData.componentSearches.find(s => s.componentName === componentName);
    if (!search) return null;

    const vendorName = selectedVendors[componentName];
    if (!vendorName) return null;

    return search.vendors.find(v => v.name === vendorName);
  };

  // Generate email content
  const generateEmailContent = () => {
    if (!sourcingData) return '';

    const componentList = sourcingData.componentSearches
      .filter(search => selectedVendors[search.componentName])
      .map(search => {
        const vendor = getSelectedVendorDetails(search.componentName);
        const component = components.find(c => c.name === search.componentName);
        if (!vendor || !component) return null;

        const totalCost = (vendor.pricePerUnit * search.quantity) + vendor.shipping;

        return `- ${search.componentName}
  Quantity: ${search.quantity}
  Specifications: ${component.specifications}
  Unit Price: $${vendor.pricePerUnit.toFixed(2)}
  Shipping: $${vendor.shipping.toFixed(2)}
  Total: $${totalCost.toFixed(2)}
  Lead Time: ${vendor.leadTime} days`;
      })
      .filter(Boolean)
      .join('\n\n');

    const totalAmount = sourcingData.componentSearches
      .filter(search => selectedVendors[search.componentName])
      .reduce((sum, search) => {
        const vendor = getSelectedVendorDetails(search.componentName);
        if (!vendor) return sum;
        return sum + (vendor.pricePerUnit * search.quantity) + vendor.shipping;
      }, 0);

    return `Subject: Order Confirmation - Procurement Request

Dear Vendor,

We are pleased to confirm the following order for the components listed below. Please acknowledge receipt of this order and confirm the delivery timeline.

ORDER DETAILS:

${componentList}

TOTAL ORDER VALUE: $${totalAmount.toFixed(2)}

DELIVERY REQUIREMENTS:
- Please confirm delivery date within 48 hours
- All items must meet the specified technical requirements
- Payment will be processed via USDC through Locus upon delivery confirmation

Please reply to this email to confirm acceptance of this order.

Thank you for your prompt attention to this matter.

Best regards,
Procurement Team`;
  };

  const handleSendEmail = async () => {
    if (!sourcingData) return;

    try {
      // Get all selected vendors with their email addresses
      const recipients = sourcingData.componentSearches
        .filter(search => selectedVendors[search.componentName])
        .map(search => {
          const vendor = getSelectedVendorDetails(search.componentName);
          return {
            email: vendor?.email || 'theo.luu13@gmail.com', // Fallback to theo.luu13@gmail.com
            name: vendor?.name || search.componentName,
          };
        })
        .filter((recipient, index, self) =>
          // Remove duplicates based on email
          index === self.findIndex(r => r.email === recipient.email)
        );

      if (recipients.length === 0) {
        alert('No vendors selected or no email addresses available');
        return;
      }

      const emailContent = generateEmailContent();
      const htmlContent = emailContent
        .split('\n')
        .map(line => {
          if (line.startsWith('Subject:')) return '';
          if (line.startsWith('- ')) return `<li>${line.substring(2).replace(/\n/g, '<br/>')}</li>`;
          if (line.trim() === '') return '<br/>';
          return `<p>${line}</p>`;
        })
        .join('')
        .replace(/<li>/g, '<ul><li>')
        .replace(/<\/li>/g, '</li></ul>')
        .replace(/<\/ul><ul>/g, '');

      const result = await sendEmail({
        to: recipients,
        subject: 'Order Confirmation - Procurement Request',
        textPart: emailContent.replace('Subject: Order Confirmation - Procurement Request\n\n', ''),
        htmlPart: `<html><body>${htmlContent}</body></html>`,
        customId: `rfq-${Date.now()}`,
      });

      if (result.success) {
        setEmailSent(true);
        setTimeout(() => {
          setShowEmailDraft(false);
          setEmailSent(false);
        }, 3000);
      } else {
        throw new Error(result.errors?.join(', ') || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportPDF = () => {
    if (!sourcingData) return;

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
    doc.text('REQUEST FOR QUOTE (RFQ)', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight * 2;

    // RFQ Number and Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const rfqNumber = `RFQ-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
    doc.text(`RFQ Number: ${rfqNumber}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += sectionSpacing * 2;

    // Components Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPONENT SPECIFICATIONS', margin, yPosition);
    yPosition += lineHeight * 1.5;

    const filteredSearches = sourcingData.componentSearches.filter(
      search => selectedVendors[search.componentName]
    );

    filteredSearches.forEach((search, index) => {
      checkPageBreak(lineHeight * 15);

      const component = components.find(c => c.name === search.componentName);
      const vendor = getSelectedVendorDetails(search.componentName);

      if (!component || !vendor) return;

      // Component Name
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${search.componentName}`, margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Component Details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      doc.text(`Quantity: ${search.quantity} units`, margin + 5, yPosition);
      yPosition += lineHeight;

      // Specifications (wrapped)
      const specs = component.specifications;
      const splitSpecs = doc.splitTextToSize(`Specifications: ${specs}`, pageWidth - margin * 2 - 10);
      doc.text(splitSpecs, margin + 5, yPosition);
      yPosition += lineHeight * splitSpecs.length;

      // Vendor Information
      doc.setFont('helvetica', 'bold');
      doc.text('Selected Vendor:', margin + 5, yPosition);
      yPosition += lineHeight;

      doc.setFont('helvetica', 'normal');
      doc.text(`  Vendor Name: ${vendor.name}`, margin + 5, yPosition);
      yPosition += lineHeight;
      doc.text(`  Unit Price: $${vendor.pricePerUnit.toFixed(2)}`, margin + 5, yPosition);
      yPosition += lineHeight;
      doc.text(`  Shipping Cost: $${vendor.shipping.toFixed(2)}`, margin + 5, yPosition);
      yPosition += lineHeight;

      const totalCost = (vendor.pricePerUnit * search.quantity) + vendor.shipping;
      doc.setFont('helvetica', 'bold');
      doc.text(`  Total Cost: $${totalCost.toFixed(2)}`, margin + 5, yPosition);
      yPosition += lineHeight;

      doc.setFont('helvetica', 'normal');
      doc.text(`  Lead Time: ${vendor.leadTime} days`, margin + 5, yPosition);
      yPosition += lineHeight;
      doc.text(`  Quality Score: ${vendor.qualityScore}%`, margin + 5, yPosition);
      yPosition += sectionSpacing * 2;

      // Add separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += sectionSpacing;
    });

    // Summary Section
    checkPageBreak(lineHeight * 10);
    yPosition += sectionSpacing;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER SUMMARY', margin, yPosition);
    yPosition += lineHeight * 1.5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const totalAmount = filteredSearches.reduce((sum, search) => {
      const vendor = getSelectedVendorDetails(search.componentName);
      if (!vendor) return sum;
      return sum + (vendor.pricePerUnit * search.quantity) + vendor.shipping;
    }, 0);

    const selectedVendorNames = Array.from(new Set(Object.values(selectedVendors))).filter(Boolean);

    doc.text(`Total Components: ${filteredSearches.length}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Number of Vendors: ${selectedVendorNames.length}`, margin, yPosition);
    yPosition += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Order Value: $${totalAmount.toFixed(2)}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Delivery Requirements
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY REQUIREMENTS', margin, yPosition);
    yPosition += lineHeight * 1.5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('• Please confirm delivery date within 48 hours', margin, yPosition);
    yPosition += lineHeight;
    doc.text('• All items must meet the specified technical requirements', margin, yPosition);
    yPosition += lineHeight;
    doc.text('• Payment will be processed via USDC through Locus upon delivery confirmation', margin, yPosition);
    yPosition += lineHeight * 2;

    // Payment Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INFORMATION', margin, yPosition);
    yPosition += lineHeight * 1.5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Method: USDC via Locus Network', margin, yPosition);
    yPosition += lineHeight;
    doc.text('Network: Base Sepolia (Testnet)', margin, yPosition);
    yPosition += lineHeight * 2;

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('This is an automatically generated RFQ document.', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Save the PDF
    const fileName = `${rfqNumber}_Specifications.pdf`;
    doc.save(fileName);
  };

  // Get all unique selected vendors
  const selectedVendorNames = Array.from(new Set(Object.values(selectedVendors))).filter(Boolean);

  // Show message if no data available
  if (!sourcingData || selectedVendorNames.length === 0) {
    return (
      <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
        <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
          <div>
            <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">RFQ & Specification Generation</p>
            <h2 className="text-xl text-white font-light">Review and finalize technical specifications</h2>
          </div>
        </div>
        <div className="px-8 py-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="glass-card rounded-xl p-6">
              <p className="text-white/70">No vendor data available. Please go back to sourcing and select vendors.</p>
              <Button onClick={onContinue} className="gradient-button mt-4">
                Continue Anyway
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
      {/* Ambient background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/2 left-1/3 w-96 h-96 bg-orange-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">RFQ & Specification Generation</p>
            <h2 className="text-xl text-white font-light">Review and finalize technical specifications</h2>
          </div>
          <Button onClick={onContinue} className="gradient-button px-8">
            Continue to Procurement
          </Button>
        </div>
      </div>

      <div className="px-8 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-6 animate-stagger">
            {/* Technical Specification Panel */}
            <div className="glass-card rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg text-white">Technical Specifications</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/5 text-white"
                  onClick={handleExportPDF}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {sourcingData?.componentSearches
                  .filter(search => selectedVendors[search.componentName])
                  .map((search, index) => {
                    const component = components.find(c => c.name === search.componentName);
                    const vendor = getSelectedVendorDetails(search.componentName);

                    if (!component || !vendor) return null;

                    return (
                      <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-3">{search.componentName}</h4>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Quantity:</span>
                            <span className="text-white/90">{search.quantity} units</span>
                          </div>

                          <div className="mt-3">
                            <span className="text-gray-400 block mb-1">Specifications:</span>
                            <p className="text-white/80 text-xs">{component.specifications}</p>
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/10">
                            <span className="text-gray-400 block mb-2">Selected Vendor:</span>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Vendor:</span>
                                <span className="text-white/90">{vendor.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Unit Price:</span>
                                <span className="text-white/90">${vendor.pricePerUnit.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Lead Time:</span>
                                <span className="text-white/90">{vendor.leadTime} days</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Quality Score:</span>
                                <span className="text-white/90">{vendor.qualityScore}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* RFQ Preview Panel */}
            <div className="glass-card rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg text-white">Request for Quote (RFQ)</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/5 text-white"
                  onClick={() => setShowEmailDraft(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to Vendors
                </Button>
              </div>

              {/* RFQ Document Preview */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
                <div>
                  <div className="text-xs text-gray-500 mb-2">REQUEST FOR QUOTE</div>
                  <h4 className="text-white mb-1">RFQ-{new Date().toISOString().split('T')[0].replace(/-/g, '')}</h4>
                  <p className="text-xs text-gray-400">Issued: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-sm text-white mb-3">Components</h5>
                  <div className="space-y-3 text-sm">
                    {sourcingData?.componentSearches
                      .filter(search => selectedVendors[search.componentName])
                      .map((search, index) => {
                        const component = components.find(c => c.name === search.componentName);
                        const vendor = getSelectedVendorDetails(search.componentName);
                        if (!component || !vendor) return null;

                        return (
                          <div key={index} className="bg-white/5 rounded p-3">
                            <div className="font-medium text-white mb-2">{search.componentName}</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Quantity:</span>
                                <span className="text-white/90">{search.quantity}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Vendor:</span>
                                <span className="text-white/90">{vendor.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Total Cost:</span>
                                <span className="text-white/90">
                                  ${((vendor.pricePerUnit * search.quantity) + vendor.shipping).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-sm text-white mb-2">Delivery Requirements</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment method:</span>
                      <span className="text-white/90">USDC via Locus</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vendors:</span>
                      <span className="text-white/90">{selectedVendorNames.length} selected</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                  <p className="text-xs text-blue-400">
                    This RFQ will be sent to {selectedVendorNames.length} selected vendor{selectedVendorNames.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Draft Modal */}
      {showEmailDraft && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg text-white">Email Draft - Order Confirmation</h3>
              </div>
              <button
                onClick={() => setShowEmailDraft(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">To:</div>
              <div className="text-sm text-white">theo.luu13@gmail.com</div>
              <div className="text-xs text-gray-400 mt-2 mb-1">CC:</div>
              <div className="text-sm text-white">
                {selectedVendorNames.join(', ')}
              </div>
            </div>

            <div className="mb-4">
              <textarea
                readOnly
                value={generateEmailContent()}
                className="w-full h-96 bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white/90 font-mono resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEmailDraft(false)}
                className="border-white/10 hover:bg-white/5 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={emailSent}
                className="gradient-button"
              >
                {emailSent ? 'Email Sent!' : 'Send Email'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
