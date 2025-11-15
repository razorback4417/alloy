import { useState } from 'react';
import { FileText, Download, Send, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface RFQSpecGenerationProps {
  onContinue: () => void;
}

export function RFQSpecGeneration({ onContinue }: RFQSpecGenerationProps) {
  const [specs, setSpecs] = useState({
    partName: 'NEMA17 Stepper Motor',
    partNumber: 'STM-N17-48',
    quantity: 50,
    torque: '≥45 N·cm',
    voltage: '12-24V DC',
    stepAngle: '1.8°',
    material: 'Aluminum housing',
    temperature: '-10°C to +50°C',
  });

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
          <div className="grid grid-cols-2 gap-6">
            {/* Spec Sheet Panel */}
            <div className="glass-card rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg text-white">Technical Specification Sheet</h3>
                </div>
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Part Name</label>
                  <Input
                    value={specs.partName}
                    onChange={(e) => setSpecs({ ...specs, partName: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Part Number</label>
                  <Input
                    value={specs.partNumber}
                    onChange={(e) => setSpecs({ ...specs, partNumber: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Quantity Required</label>
                  <Input
                    type="number"
                    value={specs.quantity}
                    onChange={(e) => setSpecs({ ...specs, quantity: parseInt(e.target.value) })}
                    className="glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Holding Torque</label>
                    <Input
                      value={specs.torque}
                      onChange={(e) => setSpecs({ ...specs, torque: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Step Angle</label>
                    <Input
                      value={specs.stepAngle}
                      onChange={(e) => setSpecs({ ...specs, stepAngle: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Voltage Range</label>
                  <Input
                    value={specs.voltage}
                    onChange={(e) => setSpecs({ ...specs, voltage: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Housing Material</label>
                  <Input
                    value={specs.material}
                    onChange={(e) => setSpecs({ ...specs, material: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Operating Temperature</label>
                  <Input
                    value={specs.temperature}
                    onChange={(e) => setSpecs({ ...specs, temperature: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Specification Completeness</span>
                    <span className="text-sm text-green-400">95%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 w-[95%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* RFQ Preview Panel */}
            <div className="glass-card rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg text-white">Request for Quote (RFQ) Preview</h3>
                </div>
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Send to Vendors
                </Button>
              </div>

              {/* RFQ Document Preview */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
                <div>
                  <div className="text-xs text-gray-500 mb-2">REQUEST FOR QUOTE</div>
                  <h4 className="text-white mb-1">RFQ-2025-11-001</h4>
                  <p className="text-xs text-gray-400">Issued: November 15, 2025</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-sm text-white mb-3">Part Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Part Name:</span>
                      <span className="text-white/90">{specs.partName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Part Number:</span>
                      <span className="text-white/90">{specs.partNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quantity:</span>
                      <span className="text-white/90">{specs.quantity} units</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-sm text-white mb-3">Technical Requirements</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Holding Torque:</span>
                      <span className="text-white/90">{specs.torque}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Voltage:</span>
                      <span className="text-white/90">{specs.voltage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Step Angle:</span>
                      <span className="text-white/90">{specs.stepAngle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Material:</span>
                      <span className="text-white/90">{specs.material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Temperature:</span>
                      <span className="text-white/90">{specs.temperature}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-sm text-white mb-3">Delivery Requirements</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Required by:</span>
                      <span className="text-white/90">November 30, 2025</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Delivery location:</span>
                      <span className="text-white/90">San Francisco, CA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment method:</span>
                      <span className="text-white/90">USDC via Locus</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-sm text-white mb-2">Quote Submission</h5>
                  <p className="text-xs text-gray-400">
                    Please provide your best quote including unit price, total cost, lead time, and any applicable terms. 
                    Responses due within 48 hours.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                  <p className="text-xs text-blue-400">
                    This RFQ will be sent to 3 pre-qualified vendors on the Locus whitelist
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button className="flex-1 gradient-button">
                  Generate Final RFQ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
