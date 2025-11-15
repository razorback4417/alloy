import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface TimelineEntry {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  details?: string;
}

interface AgentTimelineProps {
  currentPhase: string;
}

export function AgentTimeline({ currentPhase }: AgentTimelineProps) {
  const phases: TimelineEntry[] = [
    { id: 'upload', label: 'Design uploaded', status: 'completed', timestamp: '14:23:10', details: 'motor_assembly_v3.pdf' },
    { id: 'parse', label: 'Parsed requirements', status: 'completed', timestamp: '14:23:15', details: '6 components identified' },
    { id: 'search', label: 'Vendor search', status: 'completed', timestamp: '14:23:22', details: '23 suppliers analyzed' },
    { id: 'pdf', label: 'PDF extraction', status: 'completed', timestamp: '14:23:28', details: 'Datasheets processed' },
    { id: 'rank', label: 'Ranking vendors', status: 'completed', timestamp: '14:23:35', details: 'Top 3 selected' },
    { id: 'rfq', label: 'RFQ generated', status: 'completed', timestamp: '14:23:40', details: 'Spec sheet finalized' },
    { id: 'policy', label: 'Mapped to Locus policy', status: currentPhase === 'approval' ? 'current' : 'completed', timestamp: currentPhase === 'approval' ? '14:23:45' : undefined, details: 'Policy Group: Engineering' },
    { id: 'po', label: 'Generating PO', status: currentPhase === 'approval' ? 'current' : currentPhase === 'crm' ? 'completed' : 'pending', details: 'Purchase order draft' },
    { id: 'approval', label: 'Awaiting approval', status: currentPhase === 'approval' ? 'current' : currentPhase === 'crm' ? 'completed' : 'pending', details: 'Human review required' },
    { id: 'execute', label: 'Executing payment', status: currentPhase === 'crm' ? 'completed' : 'pending', details: currentPhase === 'crm' ? '$1,242.50 USDC' : undefined },
    { id: 'success', label: 'Payment success', status: currentPhase === 'crm' ? 'completed' : 'pending', details: currentPhase === 'crm' ? 'TX: 0x8a3f...4d7e' : undefined },
  ];

  return (
    <div className="glass-card rounded-xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg text-white">Agent Execution Timeline</h3>
      </div>

      <div className="space-y-4">
        {phases.map((phase, index) => (
          <div key={phase.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                phase.status === 'completed' 
                  ? 'bg-green-500/20 border-green-500' 
                  : phase.status === 'current'
                  ? 'bg-blue-500/20 border-blue-500 animate-pulse'
                  : 'bg-white/5 border-white/20'
              }`}>
                {phase.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : phase.status === 'current' ? (
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-600" />
                )}
              </div>
              {index < phases.length - 1 && (
                <div className={`w-0.5 h-12 ${
                  phase.status === 'completed' ? 'bg-green-500/30' : 'bg-white/10'
                }`} />
              )}
            </div>

            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${
                  phase.status === 'pending' ? 'text-gray-500' : 'text-white/90'
                }`}>
                  {phase.label}
                </span>
                {phase.timestamp && (
                  <span className="text-xs text-gray-500">{phase.timestamp}</span>
                )}
              </div>
              {phase.details && (
                <p className="text-xs text-gray-400">{phase.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
