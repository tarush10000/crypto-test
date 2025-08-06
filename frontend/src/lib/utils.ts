import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for the DSS demo
export const formatNumber = (num: string | number, maxLength: number = 12): string => {
  const str = num.toString();
  if (str.length <= maxLength) return str;
  return `${str.substring(0, 8)}...${str.substring(str.length - 4)}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const formatPerformanceMetrics = (metrics: {
  exp_ops: number;
  mul_ops: number;
  inv_ops: number;
  hash_ops: number;
}) => {
  return {
    'Exponentiations': metrics.exp_ops,
    'Multiplications': metrics.mul_ops,
    'Inversions': metrics.inv_ops,
    'Hash Operations': metrics.hash_ops,
  };
};

export const validateMessage = (message: string): { isValid: boolean; error?: string } => {
  if (!message.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  if (message.length > 1000) {
    return { isValid: false, error: 'Message too long (max 1000 characters)' };
  }
  return { isValid: true };
};

export const generateRandomMessage = (): string => {
  const samples = [
    "Hello, Digital Signature World!",
    "This is a test message for cryptographic signing.",
    "Secure communication through digital signatures.",
    "Mathematical proof of message authenticity.",
    "Demonstrating new hard problem-based DSS."
  ];
  return samples[Math.floor(Math.random() * samples.length)];
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};