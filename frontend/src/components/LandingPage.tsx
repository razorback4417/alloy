import { AlloyLogo } from './AlloyLogo';
import { LocusLogo } from './LocusLogo';
import referenceImage from 'figma:asset/4d0b85bea3a1bc6334723b836a09504a05d067f4.png';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0b14] text-white overflow-x-hidden flex flex-col">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <AlloyLogo className="w-full h-full" />
          </div>
          <span className="text-2xl">Alloy</span>
        </div>

        <button 
          onClick={onGetStarted}
          className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/50 transition-all text-sm backdrop-blur-sm"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-8 pb-12 max-w-7xl mx-auto flex-1 flex flex-col justify-center">
        {/* Background Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-300">Autonomous Procurement</span>
          </div>

          <h1 className="text-5xl md:text-6xl mb-4 leading-tight">
            Autonomous Sourcing and Payments
            <br />
            for Engineering Teams.
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Specify what you need. Alloy finds vendors, evaluates options, and executes payments safely.
          </p>
        </div>

        {/* 3D Card Mockups */}
        <div className="relative z-10 flex items-center justify-center gap-8 mb-12 perspective-1000">
          {/* Left Card */}
          <div 
            className="relative w-80 h-52 rounded-2xl overflow-hidden transform -rotate-6 hover:rotate-0 transition-all duration-500"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 74, 0.15) 0%, rgba(91, 155, 255, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(255, 107, 74, 0.3), inset 0 0 80px rgba(255, 107, 74, 0.05)'
            }}
          >
            {/* Orange Glow */}
            <div className="absolute top-1/2 left-0 w-40 h-40 bg-orange-500/40 rounded-full blur-[60px]" />
            
            {/* Glass gradient overlay */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 74, 0.2) 0%, rgba(91, 155, 255, 0.1) 100%)'
            }} />
            
            {/* Abstract circles */}
            <div className="absolute top-8 right-8 w-32 h-32 rounded-full border-2 border-white/20" />
            <div className="absolute top-12 right-12 w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm" />

            <div className="relative z-10 p-6">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-6 h-6">
                  <AlloyLogo className="w-full h-full" />
                </div>
                <span className="text-sm">Alloy</span>
              </div>
              
              <div className="mb-2">
                <p className="text-xs text-gray-400">Active Procurement</p>
                <p className="text-3xl mt-1">$86,320.25 USDC</p>
              </div>
              
              <div className="flex gap-4 text-xs">
                <span className="text-green-400">USDT 40.50%</span>
                <span className="text-blue-400">USDC 59.48%</span>
              </div>

              <div className="absolute bottom-4 right-6 text-xs text-gray-500">
                •••• 5678
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col gap-2 opacity-50">
            <div className="w-8 h-0.5 bg-gradient-to-r from-orange-500 to-transparent" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-orange-500 to-transparent" />
            <div className="w-8 h-0.5 bg-gradient-to-r from-orange-500 to-transparent" />
          </div>

          {/* Right Card */}
          <div 
            className="relative w-80 h-52 rounded-2xl overflow-hidden transform rotate-6 hover:rotate-0 transition-all duration-500"
            style={{
              background: 'linear-gradient(135deg, rgba(91, 155, 255, 0.15) 0%, rgba(255, 107, 74, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(91, 155, 255, 0.3), inset 0 0 80px rgba(91, 155, 255, 0.05)'
            }}
          >
            {/* Blue Glow */}
            <div className="absolute top-1/2 right-0 w-40 h-40 bg-blue-500/40 rounded-full blur-[60px]" />
            
            {/* Glass gradient overlay */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(91, 155, 255, 0.2) 0%, rgba(255, 107, 74, 0.1) 100%)'
            }} />
            
            {/* Abstract circles */}
            <div className="absolute top-8 right-8 w-32 h-32 rounded-full border-2 border-white/20" />
            <div className="absolute top-12 right-12 w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm" />

            <div className="relative z-10 p-6">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-6 h-6">
                  <AlloyLogo className="w-full h-full" />
                </div>
                <span className="text-sm">Alloy</span>
              </div>
              
              <div className="mb-2">
                <p className="text-xs text-gray-400">Total Balance</p>
                <p className="text-3xl mt-1">$74,125.76 USDC</p>
              </div>
              
              <div className="flex gap-4 text-xs">
                <span className="text-green-400">USDT 45.32%</span>
                <span className="text-blue-400">USDC 69.48%</span>
              </div>

              <div className="absolute bottom-4 right-6 text-xs text-gray-500">
                •••• 2118
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-6 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5">
              <AlloyLogo className="w-full h-full" />
            </div>
            <span className="text-gray-500">© 2025 Alloy. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">Powered by</span>
            <div className="w-20">
              <LocusLogo />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}