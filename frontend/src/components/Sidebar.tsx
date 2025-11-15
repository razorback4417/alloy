import { Upload, Target, Search, FileText, ShoppingCart, Wallet, LayoutDashboard } from 'lucide-react';
import { Screen } from '../App';
import { LocusLogo } from './LocusLogo';
import { AlloyLogo } from './AlloyLogo';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'upload' as Screen, label: 'Upload Design', icon: Upload },
    { id: 'priorities' as Screen, label: 'Set Priorities', icon: Target },
    { id: 'sourcing' as Screen, label: 'Autonomous Sourcing', icon: Search },
    { id: 'rfq' as Screen, label: 'RFQ Generation', icon: FileText },
    { id: 'procurement' as Screen, label: 'Procurement Plan', icon: ShoppingCart },
    { id: 'approval' as Screen, label: 'Locus Payment', icon: Wallet },
    { id: 'crm' as Screen, label: 'CRM Dashboard', icon: LayoutDashboard },
  ];

  return (
    <aside className="w-80 bg-[#12131c] border-r border-white/5 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center">
            <AlloyLogo className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl text-white font-light">Alloy</h1>
            <p className="text-xs text-gray-400">Procurement Copilot</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Navigation</p>
        </div>
        
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === currentScreen;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/5">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-3">Powered by</p>
          <div className="w-32">
            <LocusLogo />
          </div>
        </div>
      </div>
    </aside>
  );
}