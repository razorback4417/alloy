import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Zap, Search, FileText, CheckCircle2, AlertCircle, TrendingDown, Clock, Shield, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Fragment } from 'react';

interface SourcingPipelineProps {
  onContinue: () => void;
}

export function SourcingPipeline({ onContinue }: SourcingPipelineProps) {
  const [searchPhase, setSearchPhase] = useState(0);
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [editableSpecs, setEditableSpecs] = useState({
    quantity: 50,
    torque: '≥45 N·cm',
    material: 'Aluminum housing',
    voltage: '12-24V DC',
    stepAngle: '1.8°',
  });

  const searchPhases = [
    'Parsing requirements...',
    'Searching suppliers...',
    'Extracting PDF specs...',
    'Normalizing pricing...',
    'Filtering MOQ constraints...',
    'Ranking vendors...',
  ];

  useEffect(() => {
    if (searchPhase < searchPhases.length - 1) {
      const timer = setTimeout(() => {
        setSearchPhase(searchPhase + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchPhase]);

  const toggleVendor = (vendorId: string) => {
    const newExpanded = new Set(expandedVendors);
    if (newExpanded.has(vendorId)) {
      newExpanded.delete(vendorId);
    } else {
      newExpanded.add(vendorId);
    }
    setExpandedVendors(newExpanded);
  };

  const vendors = [
    {
      id: '1',
      name: 'Acme Motors Inc.',
      initial: 'AM',
      pricePerUnit: 14.50,
      moq: 25,
      leadTime: 7,
      shipping: 35,
      reliability: 98,
      locusWhitelist: true,
      datasheetAttrs: ['Torque: 48 N·cm', 'Voltage: 12-24V', 'Steps: 200/rev', 'Housing: Aluminum', 'Certifications: CE, RoHS'],
      risks: 'None identified',
      qualityScore: 95,
    },
    {
      id: '2',
      name: 'TechParts Supply',
      initial: 'TP',
      pricePerUnit: 16.20,
      moq: 10,
      leadTime: 3,
      shipping: 25,
      reliability: 94,
      locusWhitelist: true,
      datasheetAttrs: ['Torque: 45 N·cm', 'Voltage: 12V', 'Steps: 200/rev', 'Housing: Steel', 'Certifications: UL'],
      risks: 'Slightly higher price point',
      qualityScore: 92,
    },
    {
      id: '3',
      name: 'Global Components Ltd.',
      initial: 'GC',
      pricePerUnit: 13.80,
      moq: 100,
      leadTime: 14,
      shipping: 55,
      reliability: 99,
      locusWhitelist: true,
      datasheetAttrs: ['Torque: 50 N·cm', 'Voltage: 24V', 'Steps: 200/rev', 'Housing: Aluminum', 'Certifications: CE, UL, ISO9001'],
      risks: 'High MOQ may exceed needs',
      qualityScore: 97,
    },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
      {/* Ambient background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/2 left-1/3 w-96 h-96 bg-orange-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Autonomous Sourcing</p>
            <h2 className="text-xl text-white font-light">AI agent analyzing suppliers and specifications</h2>
          </div>
          <Button onClick={onContinue} className="gradient-button px-8">
            Continue to RFQ
          </Button>
        </div>
      </div>

      <div className="px-8 py-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* A. Requirements Interpretation Panel */}
          <div className="glass-card rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <Zap className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg text-white">Requirements Interpretation</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm text-gray-400 mb-3">Parsed Specifications</h4>
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Quantity</span>
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        High confidence
                      </span>
                    </div>
                    <Input
                      type="number"
                      value={editableSpecs.quantity}
                      onChange={(e) => setEditableSpecs({ ...editableSpecs, quantity: parseInt(e.target.value) })}
                      className="glass-input"
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Holding Torque</span>
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        High confidence
                      </span>
                    </div>
                    <Input
                      value={editableSpecs.torque}
                      onChange={(e) => setEditableSpecs({ ...editableSpecs, torque: e.target.value })}
                      className="glass-input"
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Material</span>
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-xs border border-yellow-500/20 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Medium confidence
                      </span>
                    </div>
                    <Input
                      value={editableSpecs.material}
                      onChange={(e) => setEditableSpecs({ ...editableSpecs, material: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm text-gray-400 mb-3">Additional Parameters</h4>
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <span className="text-xs text-gray-400 block mb-2">Voltage Range</span>
                    <Input
                      value={editableSpecs.voltage}
                      onChange={(e) => setEditableSpecs({ ...editableSpecs, voltage: e.target.value })}
                      className="glass-input"
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <span className="text-xs text-gray-400 block mb-2">Step Angle</span>
                    <Input
                      value={editableSpecs.stepAngle}
                      onChange={(e) => setEditableSpecs({ ...editableSpecs, stepAngle: e.target.value })}
                      className="glass-input"
                    />
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-orange-400 font-medium">Missing Information</p>
                        <p className="text-xs text-white/70 mt-1">Operating temperature range not specified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* B. Vendor Search Progress Panel */}
          <div className="glass-card rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <Search className="w-5 h-5 text-blue-400 animate-pulse" />
              <h3 className="text-lg text-white">Vendor Search Progress</h3>
            </div>

            <div className="space-y-3 mb-6">
              {searchPhases.map((phase, index) => (
                <div key={index} className="flex items-center gap-3">
                  {index < searchPhase ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : index === searchPhase ? (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                  )}
                  <span className={`text-sm ${index <= searchPhase ? 'text-white/90' : 'text-gray-500'}`}>
                    {phase}
                  </span>
                </div>
              ))}
            </div>

            {/* Vendor Logos Skeleton */}
            <div className="flex gap-3">
              {vendors.map((vendor, i) => (
                <div
                  key={i}
                  className={`glass-card rounded-lg p-4 flex-1 text-center transition-all ${
                    searchPhase >= 5 ? 'opacity-100' : 'opacity-50 animate-pulse'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-white/10">
                    <span className="text-white font-medium">{vendor.initial}</span>
                  </div>
                  <p className="text-xs text-gray-400">{vendor.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sourcing Insights Panel */}
          <div className="glass-card rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <TrendingDown className="w-5 h-5 text-green-400" />
              <h3 className="text-lg text-white">Sourcing Insights</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <DollarSign className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-xs text-gray-400 mb-1">Cost Savings</p>
                <p className="text-white">$127</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <Clock className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-xs text-gray-400 mb-1">Lead Time Opt.</p>
                <p className="text-white">-4 days</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-yellow-400 mb-2" />
                <p className="text-xs text-gray-400 mb-1">MOQ Conflicts</p>
                <p className="text-white">1 vendor</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <Shield className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-xs text-gray-400 mb-1">Vendor Risks</p>
                <p className="text-white">Low</p>
              </div>
            </div>
          </div>

          {/* C. Vendor Comparison Table */}
          <div className="glass-card rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-white/5 border-b border-white/10 px-6 py-4">
              <h3 className="text-lg text-white">Vendor Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Vendor</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Price/Unit</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">MOQ</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Lead Time</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Shipping</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Reliability</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Locus</th>
                    <th className="text-center px-6 py-4 text-sm text-gray-400">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <Fragment key={vendor.id}>
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-white/10 flex-shrink-0">
                              <span className="text-white text-sm font-medium">{vendor.initial}</span>
                            </div>
                            <div>
                              <p className="text-white/90">{vendor.name}</p>
                              <p className="text-xs text-gray-500">Quality Score: {vendor.qualityScore}%</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">${vendor.pricePerUnit.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white/70">{vendor.moq} units</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-sm border border-blue-500/20">
                            {vendor.leadTime} days
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white/70">${vendor.shipping}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-400">{vendor.reliability}%</span>
                        </td>
                        <td className="px-6 py-4">
                          {vendor.locusWhitelist && (
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20 flex items-center gap-1 w-fit">
                              <Shield className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleVendor(vendor.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {expandedVendors.has(vendor.id) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedVendors.has(vendor.id) && (
                        <tr className="bg-white/3 border-b border-white/5">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-3 gap-6">
                              <div>
                                <p className="text-sm text-gray-400 mb-2">Parsed Datasheet Attributes</p>
                                <div className="space-y-1">
                                  {vendor.datasheetAttrs.map((attr, i) => (
                                    <p key={i} className="text-sm text-white/80">• {attr}</p>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400 mb-2">PDF Preview</p>
                                <div className="h-20 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                                  <FileText className="w-8 h-8 text-gray-500" />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400 mb-2">Risk Notes</p>
                                <p className="text-sm text-white/70">{vendor.risks}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}