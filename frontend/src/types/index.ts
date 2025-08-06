// frontend/src/types/index.ts

export interface SystemParams {
  p: string;  // Large prime as string for precision
  q: string;  // Prime divisor of p-1 as string
}

export interface KeyPair {
  privateKey: string;
  publicKey: string;
  systemParams: SystemParams;
  sessionId?: string;
}

export interface Signature {
  r: string;
  s: string;
  z: string;
}

export interface SignatureData {
  signature: Signature;
  intermediateValues: {
    [key: string]: any;
  };
  hash?: number;
}

export interface VerificationResult {
  isValid: boolean;
  verificationDetails: {
    [key: string]: any;
  };
}

export interface OperationCounts {
  exp: number;
  mul: number;
  inv: number;
  hash: number;
}

export interface Step {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PerformanceMetrics {
  exp_ops: number;
  mul_ops: number;
  inv_ops: number;
  hash_ops: number;
}

// Component Props
export interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  onRetry: () => void;
}

export interface PerformanceDisplayProps {
  metrics: PerformanceMetrics;
  title?: string;
}

export interface KeyDisplayProps {
  keyData: KeyPair;
  showDetails?: boolean;
}

export interface SignatureDisplayProps {
  signatureData: SignatureData;
  showIntermediateValues?: boolean;
}

export interface VerificationDisplayProps {
  verificationResult: VerificationResult;
  originalMessage: string;
}