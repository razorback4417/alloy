import { useState } from 'react';
import { Upload, FileText, Check, Zap, Package } from 'lucide-react';
import { Button } from './ui/button';

interface EngineeringAssetUploadProps {
  onUploadComplete: () => void;
}

export function EngineeringAssetUpload({ onUploadComplete }: EngineeringAssetUploadProps) {
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setUploaded(true);
    }, 2000);
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0b14] relative">
      {/* Ambient background gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/2 left-1/3 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 glass-card-blue border-b border-white/5 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Engineering Assets</p>
            <h2 className="text-xl text-white font-light">Upload design files for autonomous procurement</h2>
          </div>
        </div>
      </div>

      <div className="px-8 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Upload Area */}
          {!uploaded && !processing && (
            <div className="glass-card rounded-2xl p-12 text-center border-2 border-dashed border-white/10 hover:border-orange-500/30 transition-all">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-gradient-to-br from-orange-500/20 to-blue-500/20 rounded-2xl">
                  <Upload className="w-12 h-12 text-orange-400" />
                </div>
              </div>
              <h3 className="text-xl text-white mb-3">Upload Engineering Files</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Upload CAD files, technical drawings, or design documents. Our AI will extract specifications and generate a BOM.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleFileUpload} className="gradient-button px-8">
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4">Supported: PNG, JPG, PDF, DWG, STEP</p>
            </div>
          )}

          {/* Processing State */}
          {processing && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl animate-pulse">
                  <Zap className="w-12 h-12 text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl text-white mb-3">Processing Design...</h3>
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Extracting technical specifications
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Identifying materials and components
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Generating bill of materials
                </div>
              </div>
            </div>
          )}

          {/* Upload Complete */}
          {uploaded && (
            <div className="space-y-6">
              {/* Thumbnail Preview */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10 flex items-center justify-center">
                    <FileText className="w-20 h-20 text-blue-400/50" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Check className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg text-white">motor_assembly_v3.pdf</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">Uploaded and processed successfully</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">File Size</p>
                        <p className="text-white/80">2.4 MB</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Pages</p>
                        <p className="text-white/80">3</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Components Found</p>
                        <p className="text-white/80">7</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Extracted Materials */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Package className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg text-white">Auto-Extracted Materials</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Aluminum 6061', qty: '2 sheets' },
                    { name: 'Steel bearings', qty: '8 units' },
                    { name: 'M5 bolts', qty: '24 units' },
                    { name: 'Copper wiring', qty: '5 meters' },
                    { name: 'Rubber gaskets', qty: '4 units' },
                    { name: 'Stainless screws', qty: '16 units' },
                  ].map((material, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-white/90 text-sm">{material.name}</p>
                      <p className="text-gray-400 text-xs mt-1">{material.qty}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-Generated BOM Estimate */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg text-white mb-4">Auto-Generated BOM Estimate</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Line Items</span>
                    <span className="text-white">6</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated Cost</span>
                    <span className="text-white">$1,240 - $1,680</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Lead Time Range</span>
                    <span className="text-white">5-12 days</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-white">Confidence</span>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded text-sm border border-green-500/20">
                      High (92%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <Button onClick={onUploadComplete} className="gradient-button px-8">
                  Start Autonomous Sourcing
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
