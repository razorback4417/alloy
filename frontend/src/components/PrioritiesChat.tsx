import { useState, useEffect, useMemo } from 'react';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from './ui/button';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface ExtractedComponent {
  name: string;
  quantity: string;
  specifications: string;
}

interface BOMEstimate {
  totalLineItems: number;
  estimatedCostRange: {
    min: number;
    max: number;
  };
  leadTimeRange: {
    min: number;
    max: number;
  };
  confidence: number;
  confidenceLabel: string;
  itemBreakdown: Array<{
    componentName: string;
    quantity: string;
    estimatedCostRange: {
      min: number;
      max: number;
    };
    estimatedLeadTimeDays: {
      min: number;
      max: number;
    };
    reasoning: string;
  }>;
}

interface PrioritiesChatProps {
  components: ExtractedComponent[];
  bomEstimate: BOMEstimate | null;
  onComplete: (priorities: { quality: boolean; speed: boolean; cost: boolean; spendingLimit: number; components: ExtractedComponent[] }) => void;
}

interface EditableComponent extends ExtractedComponent {
  id: string;
}

// Helper function to extract numeric quantity from string (e.g., "3 units" -> "3")
function extractQuantity(quantityStr: string): string {
  const match = quantityStr.match(/\d+/);
  return match ? match[0] : '1';
}

export function PrioritiesChat({ components, bomEstimate, onComplete }: PrioritiesChatProps) {
  const [messages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: `I've analyzed your design and identified ${components.length} components. Before I source the best vendors, let me understand your priorities for this procurement.`,
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'agent',
      content: "What matters most for this order? (You can select multiple)",
      timestamp: new Date(),
    },
  ]);

  const [selectedPriorities, setSelectedPriorities] = useState({
    quality: false,
    speed: false,
    cost: false,
  });

  // Manage editable components with IDs, extracting numeric quantities
  const [editableComponents, setEditableComponents] = useState<EditableComponent[]>(() =>
    components.map((comp, idx) => ({
      ...comp,
      id: `comp-${idx}`,
      quantity: extractQuantity(comp.quantity)
    }))
  );

  const [componentsExpanded, setComponentsExpanded] = useState(true);

  // Update editable components when props change
  useEffect(() => {
    setEditableComponents(components.map((comp, idx) => ({
      ...comp,
      id: `comp-${idx}`,
      quantity: extractQuantity(comp.quantity)
    })));
  }, [components]);

  // Calculate adjusted spending limit ranges based on priorities and current quantities
  const adjustedRanges = useMemo(() => {
    if (!bomEstimate) {
      return {
        totalMin: 0,
        totalMax: 0,
        itemRanges: [],
      };
    }

    // Priority adjustment factors
    let costMultiplier = 1.0;
    if (selectedPriorities.quality) {
      costMultiplier *= 1.25; // High quality = 25% increase
    }
    if (selectedPriorities.speed) {
      costMultiplier *= 1.15; // Fast delivery = 15% increase (rush shipping)
    }
    if (selectedPriorities.cost) {
      costMultiplier *= 0.80; // Cost optimization = 20% decrease
    }

    // Match editable components with BOM estimate items and calculate adjusted ranges
    const itemRanges = editableComponents
      .map(editableComp => {
        // Find matching BOM item
        const bomItem = bomEstimate.itemBreakdown.find(
          item => item.componentName === editableComp.name
        );

        if (!bomItem) return null;

        // Parse quantities
        const baseQty = parseInt(bomItem.quantity) || 1;
        const currentQty = parseInt(editableComp.quantity) || 1;
        const qtyMultiplier = currentQty / baseQty;

        // Calculate adjusted ranges per unit, then multiply by current quantity
        const adjustedMin = Math.round(bomItem.estimatedCostRange.min * costMultiplier * qtyMultiplier);
        const adjustedMax = Math.round(bomItem.estimatedCostRange.max * costMultiplier * qtyMultiplier);

        return {
          componentName: editableComp.name,
          quantity: editableComp.quantity,
          min: adjustedMin,
          max: adjustedMax,
          baseMin: bomItem.estimatedCostRange.min,
          baseMax: bomItem.estimatedCostRange.max,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Calculate total range
    const totalMin = itemRanges.reduce((sum, item) => sum + item.min, 0);
    const totalMax = itemRanges.reduce((sum, item) => sum + item.max, 0);

    return {
      totalMin,
      totalMax,
      itemRanges,
    };
  }, [bomEstimate, selectedPriorities.quality, selectedPriorities.speed, selectedPriorities.cost, editableComponents]);

  const [spendingLimit, setSpendingLimit] = useState<string>(
    bomEstimate ? Math.round((adjustedRanges.totalMin + adjustedRanges.totalMax) / 2).toString() : "2000"
  );

  // Update spending limit when priorities or BOM estimate changes
  useEffect(() => {
    if (bomEstimate && adjustedRanges.totalMax > 0) {
      const recommended = Math.round((adjustedRanges.totalMin + adjustedRanges.totalMax) / 2);
      setSpendingLimit(recommended.toString());
    }
  }, [adjustedRanges, bomEstimate]);

  const priorityOptions = [
    { key: 'quality' as const, label: 'High Quality & Reliability', description: 'Prioritize top-rated vendors with proven reliability' },
    { key: 'speed' as const, label: 'Fast Delivery', description: 'Minimize lead times, prioritize local vendors' },
    { key: 'cost' as const, label: 'Cost Optimization', description: 'Find the best prices, optimize for bulk discounts' },
  ];

  const togglePriority = (key: 'quality' | 'speed' | 'cost') => {
    setSelectedPriorities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateQuantity = (id: string, delta: number) => {
    setEditableComponents(prev => prev.map(comp => {
      if (comp.id === id) {
        const currentQty = parseInt(comp.quantity) || 1;
        const newQty = Math.max(1, currentQty + delta);
        return { ...comp, quantity: newQty.toString() };
      }
      return comp;
    }));
  };

  const setQuantity = (id: string, value: string) => {
    const numValue = parseInt(value) || 1;
    if (numValue < 1) return;
    setEditableComponents(prev => prev.map(comp => {
      if (comp.id === id) {
        return { ...comp, quantity: numValue.toString() };
      }
      return comp;
    }));
  };

  const deleteComponent = (id: string) => {
    setEditableComponents(prev => prev.filter(comp => comp.id !== id));
  };

  const handleSpendingLimitChange = (value: string) => {
    // Allow empty string for better UX while typing
    if (value === '') {
      setSpendingLimit('');
      return;
    }
    // Only allow numbers
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setSpendingLimit(value);
    }
  };

  const handleContinue = () => {
    if (Object.values(selectedPriorities).some(v => v)) {
      const finalSpendingLimit = parseInt(spendingLimit) || adjustedRanges.totalMin;
      onComplete({
        ...selectedPriorities,
        spendingLimit: finalSpendingLimit,
        components: editableComponents.map(({ id, ...rest }) => rest)
      });
    }
  };

  const hasPriorities = Object.values(selectedPriorities).some(v => v);
  const spendingLimitNum = parseInt(spendingLimit) || 0;

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
      {/* Ambient background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Sourcing Configuration</p>
            <h2 className="text-xl text-white font-light">Define your procurement priorities</h2>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Messages */}
          <div className="space-y-6 mb-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl p-4 ${
                    message.type === 'agent'
                      ? 'glass-card border border-white/10'
                      : 'bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/20'
                  }`}
                >
                  <p className="text-white/90 text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content: Side by Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left Column: Priority Selection */}
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-white mb-4 text-lg">Procurement Priorities</h3>
                <div className="space-y-3">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => togglePriority(option.key)}
                      className={`w-full glass-card rounded-xl p-4 text-left transition-all hover:border-blue-500/30 ${
                        selectedPriorities[option.key]
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white mb-1 flex items-center gap-2 text-sm font-medium">
                            {option.label}
                            {selectedPriorities[option.key] && (
                              <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            )}
                          </h4>
                          <p className="text-xs text-gray-400">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spending Limit Control */}
              <div className="glass-card rounded-xl p-6">
                <div className="mb-4">
                  <label className="text-white mb-2 block text-lg">Set Spending Limit</label>
                  <p className="text-sm text-gray-400 mb-4">
                    Based on your priorities, the estimated range is shown below. This will be validated against your Locus policy group limits.
                  </p>
                </div>

                {/* Total Range */}
                {bomEstimate && (
                  <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Total Estimated Range</span>
                      <span className="text-white font-medium text-lg">
                        ${adjustedRanges.totalMin.toLocaleString()} - ${adjustedRanges.totalMax.toLocaleString()}
                      </span>
                    </div>
                    {Object.values(selectedPriorities).some(v => v) && (
                      <p className="text-xs text-gray-500 mt-1">
                        Adjusted based on: {[
                          selectedPriorities.quality && 'High Quality',
                          selectedPriorities.speed && 'Fast Delivery',
                          selectedPriorities.cost && 'Cost Optimization'
                        ].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={spendingLimit}
                      onChange={(e) => handleSpendingLimitChange(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-8 py-3 text-white text-lg focus:outline-none focus:border-blue-500/50"
                      placeholder="2000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">USDC</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: ${adjustedRanges.totalMin.toLocaleString()} - ${adjustedRanges.totalMax.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Policy Group Limit: $5,000 / order</p>
                </div>

                {spendingLimitNum > 5000 && (
                  <div className="px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-xs text-orange-400">⚠️ Exceeds policy limit - requires additional approval</p>
                  </div>
                )}
                {spendingLimitNum < adjustedRanges.totalMin && adjustedRanges.totalMin > 0 && spendingLimitNum > 0 && (
                  <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-400">⚠️ Below estimated minimum - may limit sourcing options</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Components List with Prices */}
            <div className="glass-card rounded-xl p-6">
              <button
                onClick={() => setComponentsExpanded(!componentsExpanded)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="text-white text-lg">
                  Components ({editableComponents.length})
                </h3>
                {componentsExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {componentsExpanded && (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {editableComponents.map((component) => {
                    const itemRange = adjustedRanges.itemRanges.find(
                      item => item.componentName === component.name
                    );
                    return (
                      <div key={component.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm mb-1">{component.name}</h4>
                            <p className="text-xs text-gray-400">{component.specifications}</p>
                          </div>
                          <button
                            onClick={() => deleteComponent(component.id)}
                            className="ml-2 p-1.5 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete component"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(component.id, -1)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              disabled={parseInt(component.quantity) <= 1}
                            >
                              <Minus className="w-4 h-4 text-gray-400" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={component.quantity}
                              onChange={(e) => setQuantity(component.id, e.target.value)}
                              className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-blue-500/50"
                            />
                            <button
                              onClick={() => updateQuantity(component.id, 1)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                              <Plus className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>

                          {itemRange && (
                            <div className="text-right">
                              <div className="text-blue-400 font-medium text-sm">
                                ${itemRange.min.toLocaleString()} - ${itemRange.max.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                per {component.quantity} {parseInt(component.quantity) === 1 ? 'unit' : 'units'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleContinue}
              disabled={!hasPriorities || editableComponents.length === 0}
              className="gradient-button px-8"
            >
              Start Autonomous Sourcing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
