import { ShoppingCart, TrendingDown, Clock } from 'lucide-react';

interface VendorSplit {
  vendor: string;
  units: number;
  amount: number;
}

interface MultiVendorSplitCartProps {
  splits: VendorSplit[];
  totalSavings: number;
  leadTimeImprovement: number;
}

export function MultiVendorSplitCart({ splits, totalSavings, leadTimeImprovement }: MultiVendorSplitCartProps) {
  const totalAmount = splits.reduce((sum, split) => sum + split.amount, 0);
  const totalUnits = splits.reduce((sum, split) => sum + split.units, 0);

  return (
    <div className="glass-card rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <ShoppingCart className="w-5 h-5 text-blue-400" />
        <h4 className="text-white font-medium">Multi-Vendor Split</h4>
      </div>

      <div className="space-y-3 mb-4">
        {splits.map((split, index) => (
          <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
            <div>
              <p className="text-white/90 text-sm">{split.vendor}</p>
              <p className="text-xs text-gray-400">{split.units} units</p>
            </div>
            <p className="text-white font-medium">${split.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Total ({totalUnits} units)</span>
          <span className="text-white font-medium">${totalAmount.toFixed(2)} USDC</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <TrendingDown className="w-4 h-4 text-green-400" />
          <span className="text-green-400">Savings: ${totalSavings}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400">Lead time: -{leadTimeImprovement} days</span>
        </div>
      </div>
    </div>
  );
}
