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

export interface Vendor {
  name: string;
  pricePerUnit: number;
  moq: number;
  leadTime: number;
  shipping: number;
  reliability: number;
  qualityScore: number;
  locusWhitelist: boolean;
  datasheetAttrs: string[];
  risks: string;
  walletAddress?: string;
  contactId?: number;
  email?: string;
}

export interface ComponentVendorSearch {
  componentName: string;
  quantity: number;
  specifications: string;
  vendors: Vendor[];
  totalCostRange: {
    min: number;
    max: number;
  };
  reasoning: string;
}

export interface VendorSourcingRequest {
  components: Array<{
    name: string;
    quantity: number;
    specifications: string;
  }>;
  spendingLimit: number;
  priorities: {
    quality: boolean;
    speed: boolean;
    cost: boolean;
  };
}

export interface VendorSourcingResponse {
  componentSearches: ComponentVendorSearch[];
  totalEstimatedCost: {
    min: number;
    max: number;
  };
  insights: {
    costSavings?: number;
    leadTimeOptimization?: number;
    moqConflicts?: number;
    vendorRisks: 'Low' | 'Medium' | 'High';
  };
}

export interface SendEmailRequest {
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  textPart: string;
  htmlPart: string;
  customId?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageIds: string[];
  messageUUIDs: string[];
  errors?: string[];
}

export async function sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.error || error.message || `Failed to send email (${response.status})`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Failed to connect to server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function sourceVendors(request: VendorSourcingRequest): Promise<VendorSourcingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/source-vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.error || error.message || `Failed to source vendors (${response.status})`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.componentSearches || !Array.isArray(data.componentSearches)) {
      throw new Error('Invalid response format from vendor sourcing API');
    }

    return data;
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Failed to connect to server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export interface PaymentExecutionRequest {
  plan: Array<{
    id: string;
    partName: string;
    quantity: number;
    specifications: string;
    vendor: string;
    alternativeVendors: string[];
    pricePerUnit: number;
    leadTime: number;
    totalCost: number;
  }>;
}

export interface PaymentExecutionResponse {
  success: boolean;
  transactionHashes: string[];
  errors?: string[];
  simulated?: boolean;
  paymentContext?: any;
}

export async function executePayment(request: PaymentExecutionRequest): Promise<PaymentExecutionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/execute-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.error || error.message || `Failed to execute payment (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Failed to connect to server. Please ensure the backend is running.');
    }
    throw error;
  }
}

