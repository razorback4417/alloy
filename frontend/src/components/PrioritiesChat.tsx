import { useState } from 'react';
import { Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface PrioritiesChatProps {
  onComplete: (priorities: { quality: boolean; speed: boolean; cost: boolean; spendingLimit: number }) => void;
}

export function PrioritiesChat({ onComplete }: PrioritiesChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: "I've analyzed your design and identified 6 components. Before I source the best vendors, let me understand your priorities for this procurement.",
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'agent',
      content: "What matters most for this order? (You can select multiple)",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [spendingLimit, setSpendingLimit] = useState(2000);
  const [selectedPriorities, setSelectedPriorities] = useState({
    quality: false,
    speed: false,
    cost: false,
  });

  const priorityOptions = [
    { key: 'quality' as const, label: 'High Quality & Reliability', description: 'Prioritize top-rated vendors with proven reliability' },
    { key: 'speed' as const, label: 'Fast Delivery', description: 'Minimize lead times, prioritize local vendors' },
    { key: 'cost' as const, label: 'Cost Optimization', description: 'Find the best prices, optimize for bulk discounts' },
  ];

  const togglePriority = (key: 'quality' | 'speed' | 'cost') => {
    setSelectedPriorities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    if (Object.values(selectedPriorities).some(v => v)) {
      onComplete({ ...selectedPriorities, spendingLimit });
    }
  };

  const hasPriorities = Object.values(selectedPriorities).some(v => v);

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
        <div className="max-w-4xl mx-auto">
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

          {/* Priority Selection Cards */}
          <div className="space-y-4 mb-8">
            {priorityOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => togglePriority(option.key)}
                className={`w-full glass-card rounded-xl p-5 text-left transition-all hover:border-blue-500/30 ${
                  selectedPriorities[option.key]
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white mb-1 flex items-center gap-2">
                      {option.label}
                      {selectedPriorities[option.key] && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Spending Limit Control */}
          <div className="glass-card rounded-xl p-6 mb-8">
            <div className="mb-4">
              <label className="text-white mb-2 block">Set Spending Limit for This Order</label>
              <p className="text-sm text-gray-400 mb-4">
                This will be validated against your Locus policy group limits
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <Input
                    type="number"
                    value={spendingLimit}
                    onChange={(e) => setSpendingLimit(parseInt(e.target.value) || 0)}
                    className="glass-input pl-8 text-lg"
                    placeholder="2000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">USDC</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Policy Group Limit</p>
                <p className="text-white">$5,000 / order</p>
              </div>
            </div>
            {spendingLimit > 5000 && (
              <div className="mt-3 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-xs text-orange-400">⚠️ Exceeds policy limit - requires additional approval</p>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleContinue}
              disabled={!hasPriorities}
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
