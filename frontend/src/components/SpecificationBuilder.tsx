import { useState } from 'react';
import { FileText, Download, Copy, X, CheckCircle, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface SpecificationBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpecificationBuilder({ isOpen, onClose }: SpecificationBuilderProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] glass-card border-l border-white/10 shadow-2xl z-40 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 glass-card-blue border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white">Generated Specifications</h3>
            <p className="text-xs text-gray-400">AI-assisted material specs</p>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Specification Summary */}
        <div className="glass-card rounded-xl p-5 border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm text-gray-400 uppercase tracking-wider">Material Specification</h4>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
          <Textarea
            defaultValue="NEMA17 stepper motor with bipolar configuration, 1.8° step angle, minimum holding torque of 45 N·cm. Must include mounting brackets and wiring harness. RoHS compliant, suitable for industrial automation applications."
            className="glass-input min-h-[100px] text-sm text-white/90"
          />
        </div>

        {/* Technical Attributes */}
        <div className="glass-card rounded-xl p-5 border-white/10">
          <h4 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Technical Attributes</h4>
          <div className="space-y-3">
            {[
              { label: 'Part Type', value: 'Stepper Motor', suggested: false },
              { label: 'NEMA Size', value: '17', suggested: false },
              { label: 'Holding Torque', value: '≥45 N·cm', suggested: false },
              { label: 'Step Angle', value: '1.8°', suggested: true },
              { label: 'Voltage Rating', value: '12V DC', suggested: true },
              { label: 'Current Rating', value: '1.5A per phase', suggested: true },
              { label: 'Shaft Diameter', value: '5mm', suggested: true },
            ].map((attr) => (
              <div key={attr.label} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">{attr.label}</label>
                  <Input
                    defaultValue={attr.value}
                    className={`glass-input h-9 text-sm ${attr.suggested ? 'border-blue-500/30 bg-blue-500/5' : ''}`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(attr.label, attr.value)}
                  className="text-gray-400 hover:text-white h-9 w-9 p-0 flex-shrink-0"
                >
                  {copiedField === attr.label ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-400 mt-4 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
            Blue fields are AI-suggested based on your requirements
          </p>
        </div>

        {/* Compliance & Certifications */}
        <div className="glass-card rounded-xl p-5 border-white/10">
          <h4 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Compliance & Certifications</h4>
          <div className="space-y-2">
            {[
              { name: 'RoHS Compliant', status: 'Required', color: 'green' },
              { name: 'CE Certified', status: 'Preferred', color: 'blue' },
              { name: 'UL Listed', status: 'Optional', color: 'gray' },
              { name: 'ISO 9001', status: 'Preferred', color: 'blue' },
            ].map((cert) => (
              <div key={cert.name} className="flex items-center justify-between p-3 bg-white/3 rounded-lg">
                <span className="text-sm text-white/90">{cert.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  cert.color === 'green' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  cert.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                }`}>
                  {cert.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BOM Line Item */}
        <div className="glass-card rounded-xl p-5 border-white/10">
          <h4 className="text-sm text-gray-400 uppercase tracking-wider mb-4">BOM Line Item</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Part Number</label>
              <Input defaultValue="MTR-NEMA17-045" className="glass-input h-9 text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <Input defaultValue="NEMA17 Stepper Motor, 45 N·cm" className="glass-input h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Quantity</label>
                <Input defaultValue="50" type="number" className="glass-input h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Unit</label>
                <Input defaultValue="EA" className="glass-input h-9 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* RFQ Summary */}
        <div className="glass-card rounded-xl p-5 border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm text-gray-400 uppercase tracking-wider">RFQ Summary</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy('RFQ', 'RFQ for NEMA17 motors...')}
              className="h-7 text-xs text-gray-400 hover:text-white hover:bg-white/5"
            >
              {copiedField === 'RFQ' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="bg-white/3 rounded-lg p-4 font-mono text-xs text-white/80 space-y-2">
            <p><span className="text-gray-500">To:</span> Vendors</p>
            <p><span className="text-gray-500">Re:</span> RFQ - NEMA17 Stepper Motors</p>
            <p className="pt-2 border-t border-white/10">
              Requesting quote for 50 units of NEMA17 stepper motors with minimum 45 N·cm holding torque. 
              Must be RoHS compliant with 1.8° step angle. Required delivery within 7 days to San Francisco, CA.
            </p>
            <p className="pt-2 text-gray-500">Payment via Locus Network (USDC)</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 gradient-button">
            <Download className="w-4 h-4 mr-2" />
            Download Spec Sheet
          </Button>
          <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5 text-white">
            Save to BOM
          </Button>
        </div>
      </div>
    </div>
  );
}
