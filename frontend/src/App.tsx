import { useState } from 'react';
import { EngineeringAssetUpload } from './components/EngineeringAssetUpload';
import { PrioritiesChat } from './components/PrioritiesChat';
import { SourcingPipeline } from './components/SourcingPipeline';
import { RFQSpecGeneration } from './components/RFQSpecGeneration';
import { ProcurementPlan } from './components/ProcurementPlan';
import { ApprovalExecution } from './components/ApprovalExecution';
import { CRMDashboard } from './components/CRMDashboard';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';

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

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [procurementPlan, setProcurementPlan] = useState<ProcurementItem[]>([]);
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
    // Generate mock procurement plan
    const mockPlan: ProcurementItem[] = [
      {
        id: '1',
        partName: 'NEMA17 Stepper Motor',
        quantity: 50,
        specifications: 'Bipolar, 1.8° step angle, ≥45 N·cm holding torque',
        vendor: 'Acme Motors Inc.',
        alternativeVendors: ['TechParts Supply', 'Global Components'],
        pricePerUnit: 85.00,
        leadTime: 5,
        totalCost: 4250.00,
      },
      {
        id: '2',
        partName: 'Motor Mounting Brackets',
        quantity: 50,
        specifications: 'Aluminum, NEMA17 compatible',
        vendor: 'TechParts Supply',
        alternativeVendors: ['Acme Motors Inc.', 'PowerTech Solutions'],
        pricePerUnit: 12.00,
        leadTime: 3,
        totalCost: 600.00,
      },
      {
        id: '3',
        partName: 'Wiring Harness',
        quantity: 50,
        specifications: '4-wire, 1m length, JST connector',
        vendor: 'CableWorks Inc.',
        alternativeVendors: ['TechParts Supply'],
        pricePerUnit: 3.50,
        leadTime: 7,
        totalCost: 175.00,
      },
    ];
    setProcurementPlan(mockPlan);
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
              <EngineeringAssetUpload onUploadComplete={() => setCurrentScreen('priorities')} />
            )}
            {currentScreen === 'priorities' && (
              <PrioritiesChat onComplete={() => setCurrentScreen('sourcing')} />
            )}
            {currentScreen === 'sourcing' && (
              <SourcingPipeline onContinue={() => setCurrentScreen('rfq')} />
            )}
            {currentScreen === 'rfq' && (
              <RFQSpecGeneration onContinue={handlePlanGenerated} />
            )}
            {currentScreen === 'procurement' && (
              <ProcurementPlan 
                plan={procurementPlan}
                setPlan={setProcurementPlan}
                onApprove={handleApprove}
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