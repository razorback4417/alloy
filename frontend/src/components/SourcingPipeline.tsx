import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText, CheckCircle2, AlertCircle, TrendingDown, Clock, Shield, DollarSign, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Fragment } from 'react';
import { sourceVendors, type VendorSourcingResponse } from '../lib/api';
import ReactMarkdown from 'react-markdown';

interface SourcingPipelineProps {
  components: Array<{
    name: string;
    quantity: string;
    specifications: string;
  }>;
  spendingLimit: number;
  priorities: {
    quality: boolean;
    speed: boolean;
    cost: boolean;
  };
  onContinue: (selectedVendors: Record<string, string>, sourcingData: VendorSourcingResponse) => void;
}

export function SourcingPipeline({ components, spendingLimit, priorities, onContinue }: SourcingPipelineProps) {
  const [loading, setLoading] = useState(true);
  const [searchPhase, setSearchPhase] = useState(0);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string>>({}); // componentName -> vendorName
  const [sourcingData, setSourcingData] = useState<VendorSourcingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const searchPhases = [
    'Parsing requirements...',
    'Searching suppliers...',
    'Extracting PDF specs...',
    'Normalizing pricing...',
    'Filtering MOQ constraints...',
    'Ranking vendors...',
  ];

  // Initialize vendor sourcing when component mounts
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      setError(null);
      setSearchPhase(0);

      try {
        // Validate inputs
        if (!components || components.length === 0) {
          throw new Error('No components provided');
        }

        if (!spendingLimit || spendingLimit <= 0) {
          throw new Error('Invalid spending limit');
        }

        // Convert components to the format expected by API
        const componentsForAPI = components.map(comp => ({
          name: comp.name,
          quantity: parseInt(comp.quantity) || 1,
          specifications: comp.specifications,
        }));

        console.log('Starting vendor sourcing request:', {
          componentCount: componentsForAPI.length,
          spendingLimit,
          priorities,
        });

        const result = await sourceVendors({
          components: componentsForAPI,
          spendingLimit,
          priorities,
        });

        console.log('Vendor sourcing completed:', {
          componentSearches: result.componentSearches.length,
          totalCostRange: result.totalEstimatedCost,
        });

        setSourcingData(result);

        // Auto-select best vendor for each component (first vendor, typically best match)
        const initialSelections: Record<string, string> = {};
        result.componentSearches.forEach(search => {
          if (search.vendors.length > 0) {
            initialSelections[search.componentName] = search.vendors[0].name;
          }
        });
        setSelectedVendors(initialSelections);

        // Expand all components by default
        const allExpanded = new Set(result.componentSearches.map(s => s.componentName));
        setExpandedComponents(allExpanded);
      } catch (err) {
        console.error('Error sourcing vendors:', err);
        let errorMessage = err instanceof Error ? err.message : 'Failed to source vendors';

        // Provide helpful error message for connection errors
        if (errorMessage.includes('Failed to connect') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Backend server is not running. Please start it with: npm run dev:server';
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
        setSearchPhase(searchPhases.length - 1); // Complete the progress
      }
    };

    fetchVendors();
  }, [components, spendingLimit, priorities, retryTrigger]);

  // Simulate search phases while loading
  useEffect(() => {
    if (loading && searchPhase < searchPhases.length - 1) {
      const timer = setTimeout(() => {
        setSearchPhase(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, searchPhase, searchPhases.length]);

  const toggleComponent = (componentName: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentName)) {
      newExpanded.delete(componentName);
    } else {
      newExpanded.add(componentName);
    }
    setExpandedComponents(newExpanded);
  };

  const selectVendor = (componentName: string, vendorName: string) => {
    setSelectedVendors(prev => ({
      ...prev,
      [componentName]: vendorName,
    }));
  };

  const getVendorInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getTotalCost = (): number => {
    if (!sourcingData) return 0;

    return sourcingData.componentSearches.reduce((total, search) => {
      const selectedVendorName = selectedVendors[search.componentName];
      if (!selectedVendorName) return total;

      const vendor = search.vendors.find(v => v.name === selectedVendorName);
      if (!vendor) return total;

      return total + (vendor.pricePerUnit * search.quantity) + vendor.shipping;
    }, 0);
  };

  if (loading) {
    return (
      <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/2 left-1/3 w-96 h-96 bg-orange-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Autonomous Sourcing</p>
              <h2 className="text-xl text-white font-light">AI agent analyzing suppliers and specifications</h2>
            </div>
          </div>
        </div>

        <div className="px-8 py-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <h3 className="text-lg text-white">Vendor Search Progress</h3>
              </div>

              <div className="space-y-3 mb-4 animate-stagger">
                {searchPhases.map((phase, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {index < searchPhase ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : index === searchPhase ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                    )}
                    <span className={`text-sm ${index <= searchPhase ? 'text-white/90' : 'text-gray-500'}`}>
                      {phase}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400">
                  Processing {components.length} component{components.length !== 1 ? 's' : ''}... This may take a minute.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Each component requires an AI agent to search for vendors
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isConnectionError = error.includes('Backend server') || error.includes('Failed to connect') || error.includes('ERR_CONNECTION_REFUSED');

    return (
      <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
        <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
          <div>
            <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Autonomous Sourcing</p>
            <h2 className="text-xl text-white font-light">Error sourcing vendors</h2>
          </div>
        </div>

        <div className="px-8 py-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg text-white">Error</h3>
              </div>
              <p className="text-white/70 mb-4">{error}</p>

              {isConnectionError && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-400 font-medium mb-2">Backend Server Not Running</p>
                  <p className="text-sm text-white/70 mb-3">
                    The frontend cannot connect to the backend server at <code className="bg-white/10 px-2 py-1 rounded">http://localhost:3001</code>
                  </p>
                  <div className="space-y-2 text-sm text-white/70">
                    <p><strong>To fix this:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Open a new terminal window</li>
                      <li>Navigate to the project directory: <code className="bg-white/10 px-2 py-0.5 rounded">cd /Users/theol/Documents/alloy</code></li>
                      <li>Start the backend server: <code className="bg-white/10 px-2 py-0.5 rounded">npm run dev:server</code></li>
                      <li>Wait for the server to start (you should see "🚀 Server running on http://localhost:3001")</li>
                      <li>Click "Retry" below</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => window.location.reload()} className="gradient-button">
                  Retry
                </Button>
                {isConnectionError && (
                  <Button
                    onClick={() => {
                      setError(null);
                      setRetryTrigger(prev => prev + 1); // Trigger re-fetch via useEffect
                    }}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sourcingData) {
    return null;
  }

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
          <Button
            onClick={() => {
              if (sourcingData) {
                onContinue(selectedVendors, sourcingData);
              }
            }}
            disabled={!sourcingData}
            className="gradient-button px-8"
          >
            Continue to RFQ
          </Button>
        </div>
      </div>

      <div className="px-8 py-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Sourcing Insights Panel */}
          {sourcingData.insights && (
          <div className="glass-card rounded-xl p-6 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 mb-5">
              <TrendingDown className="w-5 h-5 text-green-400" />
              <h3 className="text-lg text-white">Sourcing Insights</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {sourcingData.insights.costSavings && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <DollarSign className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-xs text-gray-400 mb-1">Cost Savings</p>
                  <p className="text-white font-semibold">${sourcingData.insights.costSavings.toLocaleString()}</p>
                </div>
              )}
              <div className={`border rounded-lg p-4 ${
                sourcingData.insights.vendorRisks === 'Low' ? 'bg-green-500/10 border-green-500/20' :
                sourcingData.insights.vendorRisks === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
                'bg-red-500/10 border-red-500/20'
              }`}>
                <Shield className={`w-5 h-5 mb-2 ${
                  sourcingData.insights.vendorRisks === 'Low' ? 'text-green-400' :
                  sourcingData.insights.vendorRisks === 'Medium' ? 'text-yellow-400' :
                  'text-red-400'
                }`} />
                <p className="text-xs text-gray-400 mb-1">Vendor Risks</p>
                <p className="text-white font-semibold">{sourcingData.insights.vendorRisks}</p>
              </div>
              {sourcingData.insights.leadTimeOptimization && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <Clock className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-xs text-gray-400 mb-1">Lead Time Opt.</p>
                  <p className="text-white font-semibold">-{sourcingData.insights.leadTimeOptimization} days</p>
              </div>
              )}
              {sourcingData.insights.moqConflicts && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-yellow-400 mb-2" />
                <p className="text-xs text-gray-400 mb-1">MOQ Conflicts</p>
                  <p className="text-white font-semibold">{sourcingData.insights.moqConflicts} vendor{sourcingData.insights.moqConflicts !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
            </div>
          )}

          {/* Total Cost Summary */}
          <div className="glass-card rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Estimated Cost</p>
                <p className="text-2xl text-white font-medium">
                  ${getTotalCost().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Range: ${sourcingData.totalEstimatedCost.min.toLocaleString()} - ${sourcingData.totalEstimatedCost.max.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Spending Limit</p>
                <p className="text-xl text-white">${spendingLimit.toLocaleString()}</p>
                {getTotalCost() > spendingLimit && (
                  <p className="text-xs text-red-400 mt-1">⚠️ Exceeds limit</p>
                )}
              </div>
            </div>
          </div>

          {/* Components and Vendors */}
          <div className="space-y-4 animate-stagger">
            {sourcingData.componentSearches.map((search) => {
              const isExpanded = expandedComponents.has(search.componentName);
              const selectedVendorName = selectedVendors[search.componentName];
              const selectedVendor = search.vendors.find(v => v.name === selectedVendorName);

              return (
                <div key={search.componentName} className="glass-card rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-white/5 border-b border-white/10 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg text-white mb-1">{search.componentName}</h3>
                        <p className="text-sm text-gray-400">
                          Quantity: {search.quantity} • {search.specifications}
                        </p>
                        {selectedVendor && (
                          <p className="text-xs text-blue-400 mt-2">
                            Selected: {selectedVendor.name} • Total: ${((selectedVendor.pricePerUnit * search.quantity) + selectedVendor.shipping).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleComponent(search.componentName)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6">
                      {/* Reasoning */}
                      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Selection Reasoning</p>
                        <div className="text-sm text-white/80 max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="text-white/80">{children}</li>,
                              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="text-white/90 italic">{children}</em>,
                              code: ({ children }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                            }}
                          >
                            {search.reasoning}
                          </ReactMarkdown>
                        </div>
            </div>

                      {/* Vendor Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                              <th className="text-left px-4 py-3 text-sm text-gray-400">Select</th>
                              <th className="text-left px-4 py-3 text-sm text-gray-400">Vendor</th>
                              <th className="text-left px-4 py-3 text-sm text-gray-400">Price/Unit</th>
                              <th className="text-left px-4 py-3 text-sm text-gray-400">MOQ</th>
                              <th className="text-left px-4 py-3 text-sm text-gray-400">Lead Time</th>
                              <th className="text-left px-4 py-3 text-sm text-gray-400">Shipping</th>
                              <th className="text-left px-4 py-3 text-sm text-gray-400">Total</th>
                              <th className="text-left px-4 py-3 text-sm text-gray-400">Reliability</th>
                              <th className="text-left px-4 py-3 text-sm text-gray-400">Locus</th>
                              <th className="text-center px-4 py-3 text-sm text-gray-400">Details</th>
                  </tr>
                </thead>
                <tbody>
                            {search.vendors.map((vendor, vendorIndex) => {
                              const isSelected = selectedVendorName === vendor.name;
                              const totalCost = (vendor.pricePerUnit * search.quantity) + vendor.shipping;
                              const moqConflict = vendor.moq > search.quantity;

                              return (
                                <Fragment key={vendor.name}>
                                  <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                                    isSelected ? 'bg-blue-500/10' : ''
                                  }`}>
                                    <td className="px-4 py-4">
                                      <button
                                        onClick={() => selectVendor(search.componentName, vendor.name)}
                                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                          isSelected
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-white/30 hover:border-blue-500/50'
                                        }`}
                                      >
                                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                      </button>
                                    </td>
                                    <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-white/10 flex-shrink-0">
                                          <span className="text-white text-sm font-medium">{getVendorInitials(vendor.name)}</span>
                            </div>
                            <div>
                                          <p className="text-white/90 font-medium">{vendor.name}</p>
                                          <p className="text-xs text-gray-500">Quality: {vendor.qualityScore}%</p>
                            </div>
                          </div>
                        </td>
                                    <td className="px-4 py-4">
                          <span className="text-white font-medium">${vendor.pricePerUnit.toFixed(2)}</span>
                        </td>
                                    <td className="px-4 py-4">
                                      <span className={`${moqConflict ? 'text-yellow-400' : 'text-white/70'}`}>
                                        {vendor.moq} units
                                        {moqConflict && <span className="text-xs ml-1">⚠️</span>}
                                      </span>
                        </td>
                                    <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-sm border border-blue-500/20">
                            {vendor.leadTime} days
                          </span>
                        </td>
                                    <td className="px-4 py-4">
                          <span className="text-white/70">${vendor.shipping}</span>
                        </td>
                                    <td className="px-4 py-4">
                                      <span className="text-white font-medium">${totalCost.toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 py-4">
                          <span className="text-green-400">{vendor.reliability}%</span>
                        </td>
                                    <td className="px-4 py-4">
                          {vendor.locusWhitelist && (
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20 flex items-center gap-1 w-fit">
                              <Shield className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </td>
                                    <td className="px-4 py-4 text-center">
                          <button
                                        onClick={() => {
                                          const key = `${search.componentName}-${vendor.name}`;
                                          const newExpanded = new Set(expandedComponents);
                                          if (newExpanded.has(key)) {
                                            newExpanded.delete(key);
                                          } else {
                                            newExpanded.add(key);
                                          }
                                          setExpandedComponents(newExpanded);
                                        }}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                                        {expandedComponents.has(`${search.componentName}-${vendor.name}`) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                                  {expandedComponents.has(`${search.componentName}-${vendor.name}`) && (
                        <tr className="bg-white/3 border-b border-white/5">
                                      <td colSpan={10} className="px-4 py-4">
                            <div className="grid grid-cols-3 gap-6">
                              <div>
                                            <p className="text-sm text-gray-400 mb-2">Datasheet Attributes</p>
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
                                            <p className="text-sm text-white/70 mb-2">{vendor.risks}</p>
                                            {vendor.walletAddress && (
                                              <div className="mt-3">
                                                <p className="text-xs text-gray-400 mb-1">Locus Wallet</p>
                                                <p className="text-xs text-blue-400 font-mono">{vendor.walletAddress}</p>
                                              </div>
                                            )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                              );
                            })}
                </tbody>
              </table>
            </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
