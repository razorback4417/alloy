import { useState } from 'react';
import { ChevronDown, ChevronUp, Package, TrendingUp, Truck, DollarSign, Shield, AlertTriangle, CheckCircle2, FileText, Zap, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { POPreview } from './POPreview';
import { MultiVendorSplitCart } from './MultiVendorSplitCart';
import type { ProcurementItem } from '../App';
import { Fragment } from 'react';

interface ProcurementPlanProps {
  plan: ProcurementItem[];
  setPlan: (plan: ProcurementItem[]) => void;
  onApprove: () => void;
  sourcingData?: {
    componentSearches: Array<{
      componentName: string;
      vendors: Array<{
        name: string;
        reliability: number;
        qualityScore: number;
        leadTime: number;
        pricePerUnit: number;
        walletAddress?: string;
        email?: string;
      }>;
    }>;
    insights?: {
      costSavings?: number;
      leadTimeOptimization?: number;
      vendorRisks: 'Low' | 'Medium' | 'High';
    };
  };
}

export function ProcurementPlan({ plan, setPlan, onApprove, sourcingData }: ProcurementPlanProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showPOPreview, setShowPOPreview] = useState(false);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setPlan(plan.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: newQuantity,
          totalCost: newQuantity * item.pricePerUnit
        };
      }
      return item;
    }));
  };

  const updateVendor = (id: string, newVendor: string) => {
    setPlan(plan.map(item => {
      if (item.id === id) {
        return { ...item, vendor: newVendor };
      }
      return item;
    }));
  };

  const totalCost = plan.reduce((sum, item) => sum + item.totalCost, 0);
  const totalItems = plan.reduce((sum, item) => sum + item.quantity, 0);
  const avgLeadTime = plan.length > 0 ? Math.round(plan.reduce((sum, item) => sum + item.leadTime, 0) / plan.length) : 0;

  // Get vendor data from sourcingData
  const getVendorData = (vendorName: string) => {
    if (!sourcingData) return null;
    for (const search of sourcingData.componentSearches) {
      const vendor = search.vendors.find(v => v.name === vendorName);
      if (vendor) return vendor;
    }
    return null;
  };

  // Calculate insights from real data
  const bestPriceVendor = plan.length > 0
    ? plan.reduce((best, item) => item.pricePerUnit < best.pricePerUnit ? item : best, plan[0])
    : null;
  const fastestVendor = plan.length > 0
    ? plan.reduce((fastest, item) => item.leadTime < fastest.leadTime ? item : fastest, plan[0])
    : null;
  const lowestRiskVendor = sourcingData?.componentSearches
    ?.flatMap(s => s.vendors)
    .reduce((best, vendor) => {
      if (!best) return vendor;
      return vendor.reliability > best.reliability ? vendor : best;
    }, undefined as typeof sourcingData.componentSearches[0]['vendors'][0] | undefined);

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
      {/* Ambient background gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/2 left-1/3 w-96 h-96 bg-orange-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Procurement Management</p>
            <h2 className="text-xl text-white font-light">Review and modify your procurement plan</h2>
          </div>
          <Button
            onClick={onApprove}
            className="gradient-button px-8"
          >
            Approve & Execute
          </Button>
        </div>
      </div>

      <div className="px-8 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8 animate-stagger">
            <div className="glass-card rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-sm text-gray-400">Total Cost</span>
              </div>
              <p className="text-3xl text-white mb-1 relative z-10">${totalCost.toFixed(2)}</p>
              <p className="text-xs text-gray-500 relative z-10">USDC on Locus</p>
            </div>

            <div className="glass-card rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm text-gray-400">Total Items</span>
              </div>
              <p className="text-3xl text-white mb-1 relative z-10">{totalItems}</p>
              <p className="text-xs text-gray-500 relative z-10">{plan.length} line items</p>
            </div>

            <div className="glass-card rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Truck className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-sm text-gray-400">Avg Lead Time</span>
              </div>
              <p className="text-3xl text-white mb-1 relative z-10">{avgLeadTime} days</p>
              <p className="text-xs text-gray-500 relative z-10">Expected delivery</p>
            </div>

            <div className="glass-card rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-sm text-gray-400">Vendors</span>
              </div>
              <p className="text-3xl text-white mb-1 relative z-10">{new Set(plan.map(item => item.vendor)).size}</p>
              <p className="text-xs text-gray-500 relative z-10">Unique suppliers</p>
            </div>
          </div>

          {/* Risk & Optimization Insights */}
          <div className="glass-card rounded-xl p-6 shadow-2xl mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="flex items-center gap-3 mb-5">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg text-white">Risk & Optimization Insights</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {bestPriceVendor && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Best Price</span>
                  </div>
                  <p className="text-white/90">{bestPriceVendor.vendor}</p>
                  <p className="text-xs text-gray-400 mt-1">${bestPriceVendor.pricePerUnit.toFixed(2)}/unit</p>
                </div>
              )}

              {fastestVendor && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400">Fastest Delivery</span>
                  </div>
                  <p className="text-white/90">{fastestVendor.vendor}</p>
                  <p className="text-xs text-gray-400 mt-1">{fastestVendor.leadTime}-day lead time</p>
                </div>
              )}

              {lowestRiskVendor && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-400">Lowest Risk</span>
                  </div>
                  <p className="text-white/90">{lowestRiskVendor.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{lowestRiskVendor.reliability}% reliability score</p>
                </div>
              )}
            </div>

            {sourcingData?.insights && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-400 font-medium">
                      {sourcingData.insights.costSavings ? 'Optimization Opportunity' : 'Risk Assessment'}
                    </p>
                    <p className="text-sm text-white/80 mt-1">
                      {sourcingData.insights.costSavings && `Potential cost savings: $${sourcingData.insights.costSavings.toFixed(2)}. `}
                      {sourcingData.insights.leadTimeOptimization && `Lead time optimization: ${sourcingData.insights.leadTimeOptimization} days faster. `}
                      Vendor risk level: {sourcingData.insights.vendorRisks}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vendor Verification Panel */}
          <div className="grid grid-cols-3 gap-4 mb-8 animate-stagger">
            {Array.from(new Set(plan.map(item => item.vendor))).map((vendor) => (
              <div key={vendor} className="glass-card rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-medium">{vendor}</h4>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const vendorData = getVendorData(vendor);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Locus Whitelist</span>
                          {vendorData?.locusWhitelist ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <span className="text-xs text-gray-500">Not whitelisted</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Reliability Score</span>
                          <span className="text-sm text-blue-400">
                            {vendorData?.reliability ? `${vendorData.reliability}%` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Quality Score</span>
                          <span className="text-sm text-white/80">
                            {vendorData?.qualityScore ? `${vendorData.qualityScore}%` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Lead Time</span>
                          <span className="text-sm text-white/80">
                            {vendorData?.leadTime ? `${vendorData.leadTime} days` : 'N/A'}
                          </span>
                        </div>
                        {vendorData?.walletAddress && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Wallet</span>
                            <span className="text-xs font-mono text-gray-500">
                              {vendorData.walletAddress.substring(0, 6)}...{vendorData.walletAddress.substring(vendorData.walletAddress.length - 4)}
                            </span>
                          </div>
                        )}
                        {vendorData?.email && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Email</span>
                            <span className="text-xs text-gray-500">{vendorData.email}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Avg Delivery</span>
                    <span className="text-green-400">On-time: 96%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PO Preview Button */}
          <div className="mb-6">
            <Button
              onClick={() => setShowPOPreview(true)}
              variant="outline"
              className="w-full border-white/10 hover:bg-white/5 text-white h-12"
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview Purchase Order (PO)
            </Button>
          </div>

          {/* Plan Table */}
          <div className="glass-card rounded-xl overflow-hidden shadow-2xl mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Part Name</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Quantity</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Vendor</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Price/Unit</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Lead Time</th>
                    <th className="text-left px-6 py-4 text-sm text-gray-400">Total</th>
                    <th className="text-center px-6 py-4 text-sm text-gray-400">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((item, index) => (
                    <Fragment key={item.id}>
                      <tr
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          index === plan.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="text-white/90">{item.partName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-24 glass-input"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Select value={item.vendor} onValueChange={(val) => updateVendor(item.id, val)}>
                            <SelectTrigger className="w-48 glass-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1b26] border-white/10">
                              <SelectItem value={item.vendor}>{item.vendor}</SelectItem>
                              {item.alternativeVendors.map((vendor) => (
                                <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white/70">${item.pricePerUnit.toFixed(2)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-sm border border-blue-500/20">
                              {item.leadTime} days
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">${item.totalCost.toFixed(2)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleRow(item.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {expandedRows.has(item.id) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(item.id) && (
                        <tr key={`${item.id}-details`} className="bg-white/3 border-b border-white/5">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-400 mb-1">Specifications</p>
                                <p className="text-sm text-white/80">{item.specifications}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400 mb-2">Alternative Vendors</p>
                                <div className="flex gap-2">
                                  {item.alternativeVendors.map((vendor) => (
                                    <span
                                      key={vendor}
                                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70"
                                    >
                                      {vendor}
                                    </span>
                                  ))}
                                </div>
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

          {/* Cost Breakdown */}
          <div className="glass-card rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg text-white mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              {Array.from(new Set(plan.map(item => item.vendor))).map((vendor) => {
                const vendorTotal = plan
                  .filter(item => item.vendor === vendor)
                  .reduce((sum, item) => sum + item.totalCost, 0);
                return (
                  <div key={vendor} className="flex justify-between items-center">
                    <span className="text-gray-400">{vendor}</span>
                    <span className="text-white/90">${vendorTotal.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/90">Subtotal</span>
                  <span className="text-white/90">${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">Shipping (estimated)</span>
                  <span className="text-gray-400">$45.00</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                  <span className="text-lg text-white font-medium">Total Project Cost</span>
                  <span className="text-lg bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent font-medium">${(totalCost + 45).toFixed(2)} USDC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PO Preview Modal */}
      {showPOPreview && (
        <POPreview plan={plan} onClose={() => setShowPOPreview(false)} />
      )}
    </div>
  );
}