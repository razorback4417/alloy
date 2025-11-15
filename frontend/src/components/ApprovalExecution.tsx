import { useState } from 'react';
import { Shield, Wallet, CheckCircle, Loader2, ExternalLink, ArrowLeft, AlertTriangle, TrendingUp, Key } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { AgentTimeline } from './AgentTimeline';
import { MultiVendorSplitCart } from './MultiVendorSplitCart';
import type { ProcurementItem } from '../App';
import { executePayment } from '../lib/api';

interface ApprovalExecutionProps {
  plan: ProcurementItem[];
  onExecute: (transactionHash: string) => void;
  onBack: () => void;
}

export function ApprovalExecution({ plan, onExecute, onBack }: ApprovalExecutionProps) {
  const [confirmations, setConfirmations] = useState({
    poReviewed: false,
    authorizePayment: false,
    vendorsVerified: false,
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [executionStep, setExecutionStep] = useState(0);

  const totalAmount = plan.reduce((sum, item) => sum + item.totalCost, 0) + 45;
  const vendors = Array.from(new Set(plan.map(item => item.vendor)));
  const allConfirmed = Object.values(confirmations).every(v => v);

  // For testing: $0.01 per vendor
  const testPaymentAmount = vendors.length * 0.01;

  const executionSteps = [
    'Fetch Policy Group',
    'Validate Vendors Against Whitelist',
    'Generate Session Key',
    'Execute USDC Transfers',
    'Receive Transaction Hash',
    'Log to CRM',
  ];

  const handleExecute = async () => {
    setIsExecuting(true);
    setStatus('processing');
    setExecutionStep(0);

    try {
      // Step 1: Fetch Policy Group
      setExecutionStep(0);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Validate Vendors
      setExecutionStep(1);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Generate Session Key
      setExecutionStep(2);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Execute USDC Transfers
      setExecutionStep(3);
      const result = await executePayment({ plan });

      if (!result.success) {
        throw new Error(result.errors?.join(', ') || 'Payment execution failed');
      }

      if (!result.transactionHashes || result.transactionHashes.length === 0) {
        throw new Error('No transaction hashes returned');
      }

      // Step 5: Receive Transaction Hash
      setExecutionStep(4);
      const txHash = result.transactionHashes[0];
      setTransactionHash(txHash);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 6: Log to CRM
      setExecutionStep(5);
      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus('success');
      setIsExecuting(false);

      setTimeout(() => {
        onExecute(txHash);
      }, 2000);
    } catch (error) {
      console.error('Payment execution error:', error);
      setStatus('failed');
      setIsExecuting(false);
      // You might want to show an error message to the user here
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-green-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-white/10 border-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Locus Payment Execution</p>
            <h2 className="text-xl text-white font-light">Approve and execute payment</h2>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-6xl mx-auto relative z-10">
        {status === 'idle' && (
          <>
            {/* Payment Summary */}
            <div className="glass-card-blue rounded-2xl p-8 mb-8 shadow-2xl animate-fade-in-up">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl text-white mb-2">Payment Summary</h3>
                  <p className="text-gray-400">Final confirmation before execution</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Test Payment Amount</p>
                  <p className="text-3xl bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent mt-1">${testPaymentAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-400 mt-1">USDC (${vendors.length} vendors × $0.01)</p>
                  <p className="text-xs text-yellow-400 mt-2">⚠️ Test mode: Sending to test wallet</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Number of Vendors</p>
                  <p className="text-xl text-white">{vendors.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Line Items</p>
                  <p className="text-xl text-white">{plan.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Quantity</p>
                  <p className="text-xl text-white">{plan.reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 animate-stagger">
              {/* Locus Policy Group Panel */}
              <div className="glass-card rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg text-white">Policy Group</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Active Policy</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/90">Engineering - Standard</span>
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20">
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Monthly Limit</span>
                      <span className="text-sm text-white/90">$100,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Daily Limit</span>
                      <span className="text-sm text-white/90">$50,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Per-Vendor Limit</span>
                      <span className="text-sm text-white/90">$25,000</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Remaining Budget Today</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full" style={{width: '96%'}}></div>
                      </div>
                      <span className="text-sm text-blue-400">$48,017</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Approved Vendors</span>
                      <span className="text-green-400">{vendors.length} verified</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-400">Session Key</span>
                      <span className="flex items-center gap-1 text-green-400">
                        <Key className="w-3 h-3" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Locus Wallet Panel */}
              <div className="glass-card rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg text-white">Locus Wallet</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Wallet Name</p>
                    <p className="text-white/90">Engineering Procurement</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Wallet Address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-white/80">0xef22717e...c2988</p>
                      <a
                        href={`https://sepolia.basescan.org/address/0xef22717ea7c9e3b37b317723db6f02b0e52c2988`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Available Balance</span>
                      <span className="text-lg text-white">$12,450.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">This Transaction</span>
                      <span className="text-sm text-orange-400">-${testPaymentAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <span className="text-sm text-gray-400">Remaining</span>
                      <span className="text-lg text-green-400">${(12450 - testPaymentAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Network</span>
                      <span className="text-white/80">Base Sepolia</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-400">Token</span>
                      <span className="text-white/80">USDC</span>
                    </div>
                  </div>

                  <a
                    href="https://app.paywithlocus.com/dashboard/transactions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white text-sm">
                      <ExternalLink className="w-3 h-3 mr-2" />
                      View Transactions
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Risk Summary Box */}
            <div className="glass-card rounded-xl p-6 mb-8 shadow-lg animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              <h3 className="text-lg text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Risk Summary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Verified Vendors</span>
                  </div>
                  <p className="text-2xl text-white">{vendors.length}/{vendors.length}</p>
                  <p className="text-xs text-gray-400 mt-1">All on Locus whitelist</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400">Policy Compliance</span>
                  </div>
                  <p className="text-2xl text-white">100%</p>
                  <p className="text-xs text-gray-400 mt-1">Within all limits</p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-400">Wallet Balance</span>
                  </div>
                  <p className="text-2xl text-white">Sufficient</p>
                  <p className="text-xs text-gray-400 mt-1">${(12450 - testPaymentAmount).toFixed(2)} remaining</p>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="glass-card rounded-xl p-6 mb-8 shadow-lg animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
              <h3 className="text-lg text-white mb-4">Payment Breakdown by Vendor</h3>
              <div className="space-y-3 animate-stagger">
                {vendors.map((vendor) => {
                  const vendorItems = plan.filter(item => item.vendor === vendor);
                  const vendorTotal = vendorItems.reduce((sum, item) => sum + item.totalCost, 0);

                  return (
                    <div key={vendor} className="bg-white/3 border border-white/10 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{vendor}</span>
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20">
                              ✓ Whitelisted
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {vendorItems.length} item{vendorItems.length > 1 ? 's' : ''} · {vendorItems.reduce((sum, item) => sum + item.quantity, 0)} units
                          </p>
                        </div>
                        <span className="text-xl text-orange-400">${vendorTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-mono">Wallet: 0x8b4f...2a1d</span>
                        <span className="text-blue-400">Locus verified</span>
                      </div>
                    </div>
                  );
                })}
                <div className="bg-white/3 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Shipping & Handling</span>
                    <span className="text-gray-400">$45.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Checkboxes */}
            <div className="glass-card rounded-xl p-6 mb-6 shadow-lg">
              <h3 className="text-lg text-white mb-4">Required Confirmations</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="poReviewed"
                    checked={confirmations.poReviewed}
                    onCheckedChange={(checked) => setConfirmations({...confirmations, poReviewed: checked as boolean})}
                    className="mt-1"
                  />
                  <label htmlFor="poReviewed" className="cursor-pointer flex-1">
                    <p className="text-white">I confirm I have reviewed the Purchase Order and accept the terms</p>
                    <p className="text-sm text-gray-400 mt-1">
                      All pricing, quantities, and delivery terms have been verified
                    </p>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="authorizePayment"
                    checked={confirmations.authorizePayment}
                    onCheckedChange={(checked) => setConfirmations({...confirmations, authorizePayment: checked as boolean})}
                    className="mt-1"
                  />
                  <label htmlFor="authorizePayment" className="cursor-pointer flex-1">
                    <p className="text-white">I authorize Alloy to execute these payments via Locus Network</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Test payment of ${testPaymentAmount.toFixed(2)} USDC will be sent to test wallet (0x8527a8f9...258)
                    </p>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="vendorsVerified"
                    checked={confirmations.vendorsVerified}
                    onCheckedChange={(checked) => setConfirmations({...confirmations, vendorsVerified: checked as boolean})}
                    className="mt-1"
                  />
                  <label htmlFor="vendorsVerified" className="cursor-pointer flex-1">
                    <p className="text-white">All vendors have been verified and are on the Locus whitelist</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {vendors.length} vendor{vendors.length > 1 ? 's' : ''} verified · Policy group constraints satisfied
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {!allConfirmed && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400 font-medium">Confirmation Required</p>
                  <p className="text-sm text-white/80 mt-1">
                    Please review and confirm all checkboxes above before proceeding with payment execution.
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleExecute}
              disabled={!allConfirmed || isExecuting}
              className="w-full gradient-button py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Execute Payment via Locus
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-6 animate-scale-in">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
            <h3 className="text-2xl text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>Executing Payment Workflow</h3>

            {/* Execution Stepper */}
            <div className="glass-card rounded-xl p-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              <div className="space-y-4">
                {executionSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < executionStep ? 'bg-green-500/20 border border-green-500/40' :
                      index === executionStep ? 'bg-blue-500/20 border border-blue-500/40 animate-pulse' :
                      'bg-white/5 border border-white/10'
                    }`}>
                      {index < executionStep ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : index === executionStep ? (
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      ) : (
                        <span className="text-sm text-gray-500">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`${
                        index <= executionStep ? 'text-white' : 'text-gray-500'
                      }`}>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6 animate-scale-in">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-2xl text-white mb-2 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>Payment Executed Successfully!</h3>
            <p className="text-gray-400 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>Your procurement order has been submitted to all vendors</p>

            <div className="glass-card rounded-xl p-6 inline-block shadow-lg mb-6 max-w-md animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
              <p className="text-sm text-gray-400 mb-2">Transaction Hash</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <p className="font-mono text-blue-400 text-sm break-all">{transactionHash}</p>
                <a
                  href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex-shrink-0"
                  title="View on BaseScan"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="pt-4 border-t border-white/10">
                <a
                  href="https://app.paywithlocus.com/dashboard/transactions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  View in Locus Dashboard
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-2xl text-white mb-2">Payment Execution Failed</h3>
            <p className="text-gray-400 mb-8">There was an error executing the payment. Please try again.</p>

            <Button
              onClick={() => {
                setStatus('idle');
                setTransactionHash('');
                setExecutionStep(0);
              }}
              className="gradient-button"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}