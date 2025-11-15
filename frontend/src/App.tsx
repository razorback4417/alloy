import { useState, useEffect } from 'react';
import { EngineeringAssetUpload } from './components/EngineeringAssetUpload';
import { PrioritiesChat } from './components/PrioritiesChat';
import { SourcingPipeline } from './components/SourcingPipeline';
import { RFQSpecGeneration } from './components/RFQSpecGeneration';
import { ProcurementPlan } from './components/ProcurementPlan';
import { ApprovalExecution } from './components/ApprovalExecution';
import { CRMDashboard } from './components/CRMDashboard';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import type { VendorSourcingResponse } from './lib/api';

export type Screen = 'landing' | 'upload' | 'priorities' | 'sourcing' | 'rfq' | 'procurement' | 'approval' | 'crm';

export interface ProcurementItem {
  id: string;
  partName: string;
  quantity: number;
  specifications: string;
  vendor: string;
  alternativeVendors: string[];
  pricePerUnit: number;
  leadTime: number;
  totalCost: number;
}

export interface Order {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  lifecycleState: 'draft' | 'pending-approval' | 'payment-executed' | 'vendor-confirmed' | 'in-transit' | 'delivered' | 'closed';
  transactionHash: string;
  items: ProcurementItem[];
  documents?: {
    po?: boolean;
    invoice?: boolean;
    specs?: boolean;
    chatTranscript?: boolean;
  };
  auditTrail?: {
    timestamp: string;
    event: string;
    details: string;
  }[];
}

export interface ExtractedComponent {
  name: string;
  quantity: string;
  specifications: string;
}

export interface BOMEstimate {
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

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [procurementPlan, setProcurementPlan] = useState<ProcurementItem[]>([]);
  const [extractedComponents, setExtractedComponents] = useState<ExtractedComponent[]>([]);
  const [bomEstimate, setBomEstimate] = useState<BOMEstimate | null>(null);
  const [priorities, setPriorities] = useState<{ quality: boolean; speed: boolean; cost: boolean } | null>(null);
  const [spendingLimit, setSpendingLimit] = useState<number>(0);
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string>>({});
  const [sourcingData, setSourcingData] = useState<VendorSourcingResponse | null>(null);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-001',
      date: '2025-11-10',
      vendor: 'Acme Motors Inc.',
      amount: 2850.00,
      status: 'completed',
      lifecycleState: 'closed',
      transactionHash: '0x742d35...89cf',
      items: [],
      documents: { po: true, invoice: true, specs: true, chatTranscript: true },
      auditTrail: [
        { timestamp: '2025-11-10T09:15:00Z', event: 'Agent generated plan', details: 'Alloy identified best suppliers' },
        { timestamp: '2025-11-10T09:18:30Z', event: 'User approved', details: 'All confirmations checked' },
        { timestamp: '2025-11-10T09:18:45Z', event: 'Policy group fetched', details: 'Engineering - Standard' },
        { timestamp: '2025-11-10T09:19:00Z', event: 'Payment executed', details: '$2,850.00 USDC transferred' },
        { timestamp: '2025-11-10T09:19:15Z', event: 'Transaction hash received', details: '0x742d35...89cf' },
        { timestamp: '2025-11-10T09:19:20Z', event: 'Logged to CRM', details: 'Order ORD-001 created' },
      ]
    },
    {
      id: 'ORD-002',
      date: '2025-11-08',
      vendor: 'TechParts Supply',
      amount: 1250.00,
      status: 'completed',
      lifecycleState: 'delivered',
      transactionHash: '0x8a3f21...4d7e',
      items: [],
      documents: { po: true, invoice: true, specs: true, chatTranscript: false },
      auditTrail: [
        { timestamp: '2025-11-08T14:20:00Z', event: 'Agent generated plan', details: 'Found 2 qualified vendors' },
        { timestamp: '2025-11-08T14:23:10Z', event: 'User approved', details: 'Procurement plan confirmed' },
        { timestamp: '2025-11-08T14:23:25Z', event: 'Payment executed', details: '$1,250.00 USDC transferred' },
        { timestamp: '2025-11-08T14:23:40Z', event: 'Transaction hash received', details: '0x8a3f21...4d7e' },
      ]
    },
    {
      id: 'ORD-003',
      date: '2025-11-05',
      vendor: 'Global Components',
      amount: 3420.50,
      status: 'completed',
      lifecycleState: 'in-transit',
      transactionHash: '0x1f9c82...6a3b',
      items: [],
      documents: { po: true, invoice: false, specs: true, chatTranscript: true },
      auditTrail: [
        { timestamp: '2025-11-05T11:05:00Z', event: 'Agent generated plan', details: 'Optimized for best pricing' },
        { timestamp: '2025-11-05T11:08:45Z', event: 'User approved', details: 'All vendors verified' },
        { timestamp: '2025-11-05T11:09:00Z', event: 'Payment executed', details: '$3,420.50 USDC transferred' },
        { timestamp: '2025-11-05T11:09:15Z', event: 'Transaction hash received', details: '0x1f9c82...6a3b' },
      ]
    }
  ]);

  const handlePlanGenerated = () => {
    // Generate procurement plan from actual RFQ data
    if (!sourcingData || !selectedVendors || extractedComponents.length === 0) {
      console.error('Missing data for procurement plan');
      return;
    }

    const plan: ProcurementItem[] = sourcingData.componentSearches
      .filter(search => selectedVendors[search.componentName])
      .map((search, index) => {
        const component = extractedComponents.find(c => c.name === search.componentName);
        const vendor = search.vendors.find(v => v.name === selectedVendors[search.componentName]);

        if (!component || !vendor) return null;

        // Get alternative vendors (all other vendors for this component)
        const alternativeVendors = search.vendors
          .filter(v => v.name !== vendor.name)
          .map(v => v.name);

        const quantity = parseInt(search.quantity.toString()) || 1;

        return {
          id: `item-${index + 1}`,
          partName: search.componentName,
          quantity,
          specifications: component.specifications,
          vendor: vendor.name,
          alternativeVendors,
          pricePerUnit: vendor.pricePerUnit,
          leadTime: vendor.leadTime,
          totalCost: (vendor.pricePerUnit * quantity) + vendor.shipping,
        };
      })
      .filter((item): item is ProcurementItem => item !== null);

    setProcurementPlan(plan);
    setCurrentScreen('procurement');
  };

  const handleApprove = () => {
    setCurrentScreen('approval');
  };

  const handleExecutePayment = (transactionHash: string) => {
    const newOrder: Order = {
      id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      vendor: procurementPlan[0]?.vendor || 'Multiple Vendors',
      amount: procurementPlan.reduce((sum, item) => sum + item.totalCost, 0),
      status: 'completed',
      lifecycleState: 'payment-executed',
      transactionHash,
      items: procurementPlan
    };
    setOrders([newOrder, ...orders]);
    setTimeout(() => setCurrentScreen('crm'), 1500);
  };

  // Check for test mode (skip to sourcing)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'sourcing') {
      // Set up test data
      setExtractedComponents([
        { name: 'NEMA23 Stepper Motor', quantity: '3', specifications: '425 oz-in torque, 3.0 A, 56 mm frame' },
        { name: '6061-T6 Aluminum Plate', quantity: '1', specifications: '500×400×10 mm, precision cut' },
      ]);
      setSpendingLimit(2500);
      setPriorities({ quality: false, speed: false, cost: true });
      setCurrentScreen('sourcing');
    }
  }, []); // Only run once on mount

  return (
    <div className="dark min-h-screen bg-[#0a0b14] text-white">
      {currentScreen === 'landing' ? (
        <LandingPage onGetStarted={() => setCurrentScreen('upload')} />
      ) : (
        <div className="flex min-h-screen">
          <Sidebar
            currentScreen={currentScreen}
            onNavigate={setCurrentScreen}
          />

          <main className="flex-1 overflow-auto">
            {currentScreen === 'upload' && (
              <EngineeringAssetUpload
                onUploadComplete={(components, bomEstimate) => {
                  setExtractedComponents(components);
                  setBomEstimate(bomEstimate);
                  setCurrentScreen('priorities');
                }}
              />
            )}
            {currentScreen === 'priorities' && (
              <PrioritiesChat
                components={extractedComponents}
                bomEstimate={bomEstimate}
                onComplete={(prioritiesData) => {
                  // Store priorities, components, and spending limit for later use
                  setExtractedComponents(prioritiesData.components);
                  setPriorities({
                    quality: prioritiesData.quality,
                    speed: prioritiesData.speed,
                    cost: prioritiesData.cost,
                  });
                  setSpendingLimit(prioritiesData.spendingLimit);
                  setCurrentScreen('sourcing');
                }}
              />
            )}
            {currentScreen === 'sourcing' && (
              <SourcingPipeline
                components={extractedComponents}
                spendingLimit={spendingLimit}
                priorities={priorities || { quality: false, speed: false, cost: false }}
                onContinue={(vendors, data) => {
                  setSelectedVendors(vendors);
                  setSourcingData(data);
                  setCurrentScreen('rfq');
                }}
              />
            )}
            {currentScreen === 'rfq' && (
              <RFQSpecGeneration
                components={extractedComponents}
                selectedVendors={selectedVendors}
                sourcingData={sourcingData}
                onContinue={handlePlanGenerated}
              />
            )}
            {currentScreen === 'procurement' && (
              <ProcurementPlan
                plan={procurementPlan}
                setPlan={setProcurementPlan}
                onApprove={handleApprove}
                sourcingData={sourcingData}
              />
            )}
            {currentScreen === 'approval' && (
              <ApprovalExecution
                plan={procurementPlan}
                onExecute={handleExecutePayment}
                onBack={() => setCurrentScreen('procurement')}
              />
            )}
            {currentScreen === 'crm' && (
              <CRMDashboard orders={orders} />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;