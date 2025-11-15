const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export interface FileUploadResponse {
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  pages: number;
  componentsFound: number;
  components: Array<{
    name: string;
    quantity: string;
    specifications: string;
  }>;
  materials: Array<{
    name: string;
    qty: string;
  }>;
  bomEstimate: {
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
  };
}

export async function uploadDesignFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload-design`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upload file' }));
    throw new Error(error.error || error.message || 'Failed to upload file');
  }

  return response.json();
}

