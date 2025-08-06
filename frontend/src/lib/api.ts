// frontend/src/lib/api.ts
const API_BASE_URL = 'http://localhost:8000/api';

export interface KeyGenerationResponse {
    success: boolean;
    session_id: string;
    private_key: string;
    public_key: string;
    system_params: {
        p: string;
        q: string;
    };
    performance_metrics: {
        exp_ops: number;
        mul_ops: number;
        inv_ops: number;
        hash_ops: number;
    };
}

export interface SigningResponse {
    success: boolean;
    signature: {
        r: string;
        s: string;
        z: string;
    };
    performance_metrics: {
        exp_ops: number;
        mul_ops: number;
        inv_ops: number;
        hash_ops: number;
    };
    intermediate_values: {
        [key: string]: any;
    };
}

export interface VerificationResponse {
    success: boolean;
    is_valid: boolean;
    performance_metrics: {
        exp_ops: number;
        mul_ops: number;
        inv_ops: number;
        hash_ops: number;
    };
    verification_details: {
        [key: string]: any;
    };
}

export interface APIError {
    detail: string;
    status_code?: number;
}

class DSS_API {
    private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            return result;
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Network error occurred');
        }
    }

    async generateKeys(bitLength: number = 512, schemeType: string = 'finite_field'): Promise<KeyGenerationResponse> {
        return this.makeRequest<KeyGenerationResponse>('/generate-keys', {
            bit_length: bitLength,
            scheme_type: schemeType
        });
    }

    async signMessage(
        message: string,
        privateKey: string,
        systemParams: { p: string; q: string },
        schemeType: string = 'finite_field'
    ): Promise<SigningResponse> {
        return this.makeRequest<SigningResponse>('/sign', {
            message,
            private_key: privateKey,
            system_params: systemParams,
            scheme_type: schemeType
        });
    }

    async verifySignature(
        message: string,
        signature: { r: string; s: string; z: string },
        publicKey: string,
        systemParams: { p: string; q: string },
        schemeType: string = 'finite_field'
    ): Promise<VerificationResponse> {
        return this.makeRequest<VerificationResponse>('/verify', {
            message,
            signature,
            public_key: publicKey,
            system_params: systemParams,
            scheme_type: schemeType
        });
    }

    async healthCheck(): Promise<{ status: string; message: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.json();
        } catch (error) {
            throw new Error('Backend server is not running');
        }
    }
}

export const dssAPI = new DSS_API();