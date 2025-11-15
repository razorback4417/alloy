import { useState, useRef } from 'react';
import { Upload, FileText, Check, Zap, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { uploadDesignFile, type FileUploadResponse } from '../lib/api';

export interface ExtractedComponent {
  name: string;
  quantity: string;
  specifications: string;
}

interface EngineeringAssetUploadProps {
  onUploadComplete: (components: ExtractedComponent[], bomEstimate: any) => void;
}

export function EngineeringAssetUpload({ onUploadComplete }: EngineeringAssetUploadProps) {
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FileUploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessing(true);
    setUploaded(false);

    try {
      const result = await uploadDesignFile(file);
      setFileData(result);
      setUploaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setUploaded(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
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
            <div className="glass-card rounded-2xl p-12 text-center border-2 border-dashed border-white/10 hover:border-orange-500/30 transition-all animate-fade-in-up">
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt,.pdf,.png,.jpg,.jpeg,.dwg,.step"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={handleFileUpload} className="gradient-button px-8">
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4">Supported: MD, TXT, PNG, JPG, PDF, DWG, STEP</p>
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
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
          {uploaded && fileData && (
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
                      <h3 className="text-lg text-white">{fileData.fileName}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">Uploaded and processed successfully</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">File Size</p>
                        <p className="text-white/80">{fileData.fileSizeFormatted}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Pages</p>
                        <p className="text-white/80">{fileData.pages}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Components Found</p>
                        <p className="text-white/80">{fileData.componentsFound}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Generated BOM Estimate */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg text-white mb-4">Auto-Generated BOM Estimate</h3>

                {/* Summary */}
                <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Line Items</span>
                    <span className="text-white">{fileData.bomEstimate.totalLineItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated Cost</span>
                    <span className="text-white">
                      ${fileData.bomEstimate.estimatedCostRange.min.toLocaleString()} - ${fileData.bomEstimate.estimatedCostRange.max.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Lead Time Range</span>
                    <span className="text-white">
                      {fileData.bomEstimate.leadTimeRange.min}-{fileData.bomEstimate.leadTimeRange.max} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-white">Confidence</span>
                    <span className={`px-3 py-1 rounded text-sm border ${
                      fileData.bomEstimate.confidence >= 80
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : fileData.bomEstimate.confidence >= 60
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {fileData.bomEstimate.confidenceLabel} ({fileData.bomEstimate.confidence}%)
                    </span>
                  </div>
                </div>

                {/* Item Breakdown */}
                {fileData.bomEstimate.itemBreakdown && fileData.bomEstimate.itemBreakdown.length > 0 && (
                  <div>
                    <h4 className="text-white mb-4 text-sm font-medium">Item Breakdown</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {fileData.bomEstimate.itemBreakdown.map((item, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="text-white font-medium text-sm">{item.componentName}</h5>
                              <p className="text-xs text-gray-400 mt-1">{item.quantity}</p>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-blue-400 text-sm font-medium">
                                ${item.estimatedCostRange.min.toLocaleString()} - ${item.estimatedCostRange.max.toLocaleString()}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {item.estimatedLeadTimeDays.min}-{item.estimatedLeadTimeDays.max} days
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-gray-400 leading-relaxed">{item.reasoning}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (fileData) {
                      const components: ExtractedComponent[] = fileData.components.map(c => ({
                        name: c.name,
                        quantity: c.quantity,
                        specifications: c.specifications,
                      }));
                      onUploadComplete(components, fileData.bomEstimate);
                    }
                  }}
                  className="gradient-button px-8"
                >
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
