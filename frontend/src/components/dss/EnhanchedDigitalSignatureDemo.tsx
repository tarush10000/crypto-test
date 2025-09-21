'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    KeyIcon,
    PenIcon,
    ShieldCheckIcon,
    InfoIcon,
    TrendingUpIcon,
    BrainIcon,
    ZapIcon,
    GitBranchIcon,
    LockIcon,
    UnlockIcon,
    HashIcon,
    EyeIcon
} from 'lucide-react';
import Enhanced3DVisualization from './Enhanced3DVisualization';
import MathematicalOperationsVisualization from './MathematicalOperationsVisualization';

// Type definitions for the demo
interface BruteForceAttempt {
    x: number;
    result?: number;
    left?: number;
    right?: number;
    match: boolean;
}

interface EllipticCurvePoint {
    x: number;
    y: number;
    infinity: boolean;
}

interface HardProblemExample {
    given?: string;
    find?: string;
    brute_force_attempts?: BruteForceAttempt[];
    setup?: string;
    equation?: string;
    challenge?: string;
    usage?: string;
    difficulty?: string;
}

interface HardProblemSecurityAnalysis {
    complexity?: string;
    known_attacks?: string;
    resistance?: string;
    innovation?: string;
    applications?: string;
    difference_from_ecdlp?: string;
    structure?: string;
    verification?: string;
}

interface HardProblemDemo {
    success: boolean;
    problem_type: string;
    equation: string;
    description: string;
    example?: HardProblemExample;
    security_analysis?: HardProblemSecurityAnalysis;
}

// API utility functions
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const dssAPI = {
    generateKeys: async (bitLength: number, schemeType: string): Promise<APIResponse> => {
        const response = await fetch(`${API_BASE}/generate-keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bit_length: bitLength, scheme_type: schemeType })
        });
        return response.json();
    },

    signMessage: async (message: string, privateKey: string, systemParams: any, schemeType: string): Promise<APIResponse> => {
        const response = await fetch(`${API_BASE}/sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                private_key: privateKey,
                system_params: systemParams,
                scheme_type: schemeType
            })
        });
        return response.json();
    },

    verifySignature: async (message: string, signature: any, publicKey: string, systemParams: any, schemeType: string): Promise<APIResponse> => {
        const response = await fetch(`${API_BASE}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                signature,
                public_key: publicKey,
                system_params: systemParams,
                scheme_type: schemeType
            })
        });
        return response.json();
    },

    demonstrateHardProblem: async (problemType: string, parameters: any): Promise<HardProblemDemo> => {
        const response = await fetch(`${API_BASE}/hard-problem-demo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problem_type: problemType, parameters })
        });
        return response.json();
    }
};

interface KeyData {
    privateKey: string;
    publicKey: string;
    systemParams: any;
    sessionId: string;
}

interface SignatureData {
    signature: any;
    intermediateValues: any;
    hash: string;
}

interface PerformanceMetrics {
    [key: string]: number;
}

interface APIResponse {
    success: boolean;
    [key: string]: any;
}

const EnhancedDigitalSignatureDemo: React.FC = () => {
    // State management
    const [activeScheme, setActiveScheme] = useState<'finite_field' | 'elliptic_curve'>('elliptic_curve');
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [keyData, setKeyData] = useState<KeyData | null>(null);
    const [message, setMessage] = useState<string>('Hello, this is a test message for digital signature verification.');
    const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
    const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({});

    // Educational states
    const [showExplanation, setShowExplanation] = useState<boolean>(false);
    const [currentExplanation, setCurrentExplanation] = useState<'keyGen' | 'signing' | 'verification' | ''>('');
    const [hardProblemDemo, setHardProblemDemo] = useState<HardProblemDemo | null>(null);
    const [activeTab, setActiveTab] = useState<string>('message');

    // Utility functions
    const simulateProcessing = (message: string, duration: number): Promise<void> => {
        setIsProcessing(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setIsProcessing(false);
                resolve();
            }, duration);
        });
    };

    const updateOperationCounts = (metrics: PerformanceMetrics): void => {
        setPerformanceMetrics(prev => {
            const updated = { ...prev };
            Object.keys(metrics).forEach(key => {
                updated[key] = (updated[key] || 0) + metrics[key];
            });
            return updated;
        });
    };

    const resetDemo = (): void => {
        setCurrentStep(1);
        setKeyData(null);
        setSignatureData(null);
        setVerificationResult(null);
        setPerformanceMetrics({});
        setError(null);
        setHardProblemDemo(null);
    };

    const formatPoint = (point: EllipticCurvePoint): string => {
        if (point.infinity) return "O (Point at Infinity)";

        const x = point.x.toString().length > 20 ?
            `${point.x.toString().substring(0, 10)}...${point.x.toString().slice(-10)}` :
            point.x.toString();

        const y = point.y.toString().length > 20 ?
            `${point.y.toString().substring(0, 10)}...${point.y.toString().slice(-10)}` :
            point.y.toString();

        return `(${x}, ${y})`;
    };

    const formatLargeNumber = (num: string | number): string => {
        const str = num.toString();
        if (str.length > 20) {
            return `${str.substring(0, 10)}...${str.slice(-10)}`;
        }
        return str;
    };


    // Educational explanations
    const getExplanationContent = () => {
        const explanations = {
            '': {
                title: '',
                content: ''
            },
            keyGen: {
                title: activeScheme === 'elliptic_curve' ? 'Elliptic Curve Key Generation' : 'Finite Field Key Generation',
                content: activeScheme === 'elliptic_curve' ?
                    'The elliptic curve scheme uses a revolutionary approach where the private key is a secret POINT G on the curve, not just a scalar. The x-coordinate of this secret point (x_G) is used to compute the public key P = (-x_G) × G. This creates a new hard problem: given P, find the secret generator point G.' :
                    'The finite field scheme uses the new hard problem x^x ≡ y (mod p) where the private key x appears as both base and exponent. This transcendental structure makes it impossible to solve using traditional discrete logarithm methods.'
            },
            signing: {
                title: activeScheme === 'elliptic_curve' ? 'EC Signature Generation' : 'FF Signature Generation',
                content: activeScheme === 'elliptic_curve' ?
                    'The signature consists of two elliptic curve points (R, Z) and one scalar (s). The algorithm computes R = k × G_secret and Z = u × G_secret using the secret generator point. The components are linked through transcendental equations that use the x-coordinates of points as scalar multipliers.' :
                    'The signature uses multiple instances of the hard problem. Each component r, s, z is computed using the private key x in exponential positions, creating a web of transcendental relationships that resist algebraic attacks.'
            },
            verification: {
                title: activeScheme === 'elliptic_curve' ? 'EC Signature Verification' : 'FF Signature Verification',
                content: activeScheme === 'elliptic_curve' ?
                    'Verification uses the transcendental equation π(R) × Z = s×e×R + π(Z+s×R)×P where π represents using x-coordinates as scalars. This embodies the Form 2.2 hard problem and can only be satisfied by valid signatures.' :
                    'Verification solves Form 1.2 of the hard problem: a^x ≡ x^b (mod p). The verifier must check if the signature components satisfy multiple transcendental equations simultaneously.'
            }
        };
        return explanations[currentExplanation];
    };

    // API calls
    const generateKeys = async (): Promise<void> => {
        setCurrentExplanation('keyGen');
        setShowExplanation(true);

        try {
            setError(null);
            await simulateProcessing('Generating cryptographic parameters using new hard problems...', 1500);

            const response = await dssAPI.generateKeys(256, activeScheme);

            if (response.success) {
                setKeyData({
                    privateKey: response.private_key,
                    publicKey: response.public_key,
                    systemParams: response.system_params,
                    sessionId: response.session_id
                });
                updateOperationCounts(response.performance_metrics);
                setCurrentStep(2);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Key generation failed');
        }
    };

    const signMessage = async (): Promise<void> => {
        if (!keyData) return;

        setCurrentExplanation('signing');
        setShowExplanation(true);

        try {
            setError(null);
            await simulateProcessing('Computing signature using transcendental equations...', 1800);

            const response = await dssAPI.signMessage(
                message,
                keyData.privateKey,
                keyData.systemParams,
                activeScheme
            );

            if (response.success) {
                setSignatureData({
                    signature: response.signature,
                    intermediateValues: response.intermediate_values,
                    hash: response.intermediate_values.sign_e || response.intermediate_values.hash
                });
                updateOperationCounts(response.performance_metrics);
                setCurrentStep(3);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Message signing failed');
        }
    };

    const verifySignature = async (): Promise<void> => {
        if (!keyData || !signatureData) return;

        setCurrentExplanation('verification');
        setShowExplanation(true);

        try {
            setError(null);
            await simulateProcessing('Verifying signature using hard problem equations...', 1200);

            const response = await dssAPI.verifySignature(
                message,
                signatureData.signature,
                keyData.publicKey,
                keyData.systemParams,
                'elliptic_curve'
            );

            if (response.success) {
                setVerificationResult(response.valid);
                updateOperationCounts(response.performance_metrics);
                setCurrentStep(4);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Signature verification failed');
        }
    };

    const demonstrateHardProblem = async (problemType: string): Promise<void> => {
        try {
            const response = await dssAPI.demonstrateHardProblem(problemType, {});
            setHardProblemDemo(response);
        } catch (error) {
            setError('Hard problem demonstration failed');
        }
    };

    const Enhanced3DSection = () => (
        <div className="space-y-6">
            {/* 3D Elliptic Curve Visualization */}
            <Enhanced3DVisualization
                keyData={keyData ? { privateKey: keyData.privateKey, publicKey: keyData.publicKey } : undefined}
                signatureData={signatureData ? { signature: signatureData.signature } : undefined}
                currentStep={currentStep}
                isProcessing={isProcessing}
            />

            {/* Mathematical Operations Visualization */}
            <MathematicalOperationsVisualization
                performanceMetrics={performanceMetrics}
                intermediateValues={keyData?.sessionId ?
                    { ...(keyData as any).intermediateValues, ...signatureData?.intermediateValues } :
                    {}
                }
                currentStep={currentStep}
                isProcessing={isProcessing}
            />
        </div>
    );


    // Enhanced visualization components
    const EllipticCurveVisualization = () => (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GitBranchIcon className="h-5 w-5" />
                    Elliptic Curve Structure & Secret Generator
                </CardTitle>
                <CardDescription>
                    Visual representation of the elliptic curve and cryptographic relationships
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
                    {/* Curve Equation */}
                    <div className="text-center mb-6">
                        <div className="inline-block bg-white p-4 rounded-lg shadow-md border-2 border-blue-200">
                            <div className="text-lg font-bold text-blue-800">
                                E(F<sub>p</sub>): y² = x³ + ax + b (mod p)
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                                Elliptic Curve over Finite Field
                            </div>
                        </div>
                    </div>

                    {/* Key Points Visualization */}
                    {keyData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-green-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <LockIcon className="h-5 w-5 text-green-600" />
                                    <h4 className="font-semibold text-green-700">Secret Generator Point G</h4>
                                </div>
                                <div className="text-sm font-mono bg-green-50 p-3 rounded border">
                                    <div className="text-green-800 font-semibold">Private Key (Secret Point)</div>
                                    <div className="mt-1 text-xs text-gray-600">
                                        {formatPoint(JSON.parse(keyData.privateKey))}
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-green-600">
                                    🔒 This point G is kept secret and serves as the generator
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <UnlockIcon className="h-5 w-5 text-blue-600" />
                                    <h4 className="font-semibold text-blue-700">Public Point P</h4>
                                </div>
                                <div className="text-sm font-mono bg-blue-50 p-3 rounded border">
                                    <div className="text-blue-800 font-semibold">P = (-x<sub>G</sub>) × G</div>
                                    <div className="mt-1 text-xs text-gray-600">
                                        {formatPoint(JSON.parse(keyData.publicKey))}
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-blue-600">
                                    🔓 Computed from secret generator using hard problem
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Signature Components */}
                    {signatureData && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white p-4 rounded-lg shadow-md text-center border-t-4 border-purple-500">
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <GitBranchIcon className="h-4 w-4 text-purple-600" />
                                    <h5 className="font-semibold text-purple-700">Point R</h5>
                                </div>
                                <div className="text-xs font-mono bg-purple-50 p-2 rounded">
                                    R = k × G<sub>secret</sub>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {formatPoint(signatureData.signature.R)}
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-md text-center border-t-4 border-orange-500">
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <HashIcon className="h-4 w-4 text-orange-600" />
                                    <h5 className="font-semibold text-orange-700">Scalar s</h5>
                                </div>
                                <div className="text-xs font-mono bg-orange-50 p-2 rounded">
                                    Transcendental Link
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {formatLargeNumber(signatureData.signature.s)}
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-md text-center border-t-4 border-red-500">
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <GitBranchIcon className="h-4 w-4 text-red-600" />
                                    <h5 className="font-semibold text-red-700">Point Z</h5>
                                </div>
                                <div className="text-xs font-mono bg-red-50 p-2 rounded">
                                    Z = u × G<sub>secret</sub>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {formatPoint(signatureData.signature.Z)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hard Problem Equations */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h5 className="font-semibold text-yellow-800 mb-2">🧮 Hard Problem Forms</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="bg-white p-3 rounded border">
                                <div className="font-semibold text-blue-700">Form 2.1: Key Generation</div>
                                <div className="font-mono text-xs">P = x<sub>G</sub> × G</div>
                                <div className="text-xs text-gray-600 mt-1">Find secret generator G given public P</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                                <div className="font-semibold text-purple-700">Form 2.2: Verification</div>
                                <div className="font-mono text-xs">x<sub>G</sub> × P = k × G</div>
                                <div className="text-xs text-gray-600 mt-1">Transcendental verification equation</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const MessageAndKeysDisplay = () => (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <EyeIcon className="h-5 w-5" />
                    Message & Cryptographic Data
                </CardTitle>
                <CardDescription>
                    Complete view of the message, keys, and signature components
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="message">Message</TabsTrigger>
                        <TabsTrigger value="keys">Keys</TabsTrigger>
                        <TabsTrigger value="signature">Signature</TabsTrigger>
                        <TabsTrigger value="params">Parameters</TabsTrigger>
                    </TabsList>

                    <TabsContent value="message" className="mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Original Message</h4>
                            <div className="bg-white p-3 rounded border font-mono text-sm">
                                {message}
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                                <strong>Length:</strong> {message.length} characters |
                                <strong> Hash:</strong> {signatureData?.hash ? formatLargeNumber(signatureData.hash) : 'Not computed yet'}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="keys" className="mt-4">
                        {keyData ? (
                            <div className="space-y-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="font-semibold text-green-800 mb-2">🔒 Private Key (Secret Generator Point G)</h4>
                                    <div className="bg-white p-3 rounded font-mono text-xs break-all">
                                        {JSON.stringify(JSON.parse(keyData.privateKey), null, 2)}
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold text-blue-800 mb-2">🔓 Public Key (Point P = (-x_G) × G)</h4>
                                    <div className="bg-white p-3 rounded font-mono text-xs break-all">
                                        {JSON.stringify(JSON.parse(keyData.publicKey), null, 2)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Generate keys first to view cryptographic data
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="signature" className="mt-4">
                        {signatureData ? (
                            <div className="space-y-4">
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h4 className="font-semibold text-purple-800 mb-2">📝 Signature Component R (Point)</h4>
                                    <div className="bg-white p-3 rounded font-mono text-xs">
                                        <div><strong>X:</strong> {signatureData.signature.R.x}</div>
                                        <div><strong>Y:</strong> {signatureData.signature.R.y}</div>
                                        <div><strong>Infinity:</strong> {signatureData.signature.R.infinity.toString()}</div>
                                    </div>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <h4 className="font-semibold text-orange-800 mb-2">🔢 Signature Component s (Scalar)</h4>
                                    <div className="bg-white p-3 rounded font-mono text-xs break-all">
                                        {signatureData.signature.s}
                                    </div>
                                </div>

                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <h4 className="font-semibold text-red-800 mb-2">📍 Signature Component Z (Point)</h4>
                                    <div className="bg-white p-3 rounded font-mono text-xs">
                                        <div><strong>X:</strong> {signatureData.signature.Z.x}</div>
                                        <div><strong>Y:</strong> {signatureData.signature.Z.y}</div>
                                        <div><strong>Infinity:</strong> {signatureData.signature.Z.infinity.toString()}</div>
                                    </div>
                                </div>

                                {verificationResult !== null && (
                                    <div className={`p-4 rounded-lg border ${verificationResult ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <h4 className={`font-semibold mb-2 ${verificationResult ? 'text-green-800' : 'text-red-800'}`}>
                                            {verificationResult ? '✅ Signature Verification: VALID' : '❌ Signature Verification: INVALID'}
                                        </h4>
                                        <div className="text-sm">
                                            {verificationResult ?
                                                'The signature satisfies the transcendental point equation π(R) × Z = s×e×R + π(Z+s×R)×P' :
                                                'The signature does not satisfy the verification equations'
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Sign a message first to view signature data
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="params" className="mt-4">
                        {keyData ? (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3">🔧 Elliptic Curve Parameters</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-blue-700">Field Prime (p)</div>
                                        <div className="font-mono text-xs break-all mt-1">
                                            {formatLargeNumber(keyData.systemParams.curve_params.p)}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-blue-700">Curve Parameter a</div>
                                        <div className="font-mono text-xs break-all mt-1">
                                            {formatLargeNumber(keyData.systemParams.curve_params.a)}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-blue-700">Curve Parameter b</div>
                                        <div className="font-mono text-xs break-all mt-1">
                                            {formatLargeNumber(keyData.systemParams.curve_params.b)}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <div className="font-semibold text-blue-700">Base Point Order (n)</div>
                                        <div className="font-mono text-xs break-all mt-1">
                                            {formatLargeNumber(keyData.systemParams.curve_params.order_n)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                    <div className="font-semibold text-blue-800">Standard Base Point G (Public)</div>
                                    <div className="font-mono text-xs mt-1">
                                        {keyData.systemParams.curve_params.base_point_G}
                                    </div>
                                    <div className="text-xs text-blue-600 mt-1">
                                        ⚠️ Note: This is the standard base point, different from our secret generator point
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Generate keys first to view system parameters
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );

    const PerformanceAnalysis = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUpIcon className="h-5 w-5" />
                    Performance Analysis & Security Metrics
                </CardTitle>
                <CardDescription>
                    Real-time cryptographic operation counts and security assessment
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(performanceMetrics).map(([operation, count]) => (
                        <div key={operation} className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
                            <div className="text-3xl font-bold text-blue-600">{count}</div>
                            <div className="text-sm text-gray-600 capitalize">
                                {operation.replace(/_/g, ' ')}
                            </div>
                        </div>
                    ))}
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">✅ Security Advantages</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• <strong>Quantum Resistance:</strong> Novel hard problems resist quantum attacks</li>
                            <li>• <strong>Secret Generator:</strong> Generator point itself is unknown</li>
                            <li>• <strong>Transcendental Equations:</strong> X-coordinates as scalar multipliers</li>
                            <li>• <strong>Multiple Hard Problems:</strong> Forms 2.1 and 2.2 simultaneously</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-yellow-800 mb-2">⚖️ Performance Trade-offs</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• <strong>Computational Cost:</strong> ~3x traditional ECDSA operations</li>
                            <li>• <strong>Signature Size:</strong> Two points + one scalar (larger)</li>
                            <li>• <strong>Security Gain:</strong> Revolutionary mathematical foundation</li>
                            <li>• <strong>Future-Proof:</strong> Designed for post-quantum era</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">📊 Comparison with Traditional ECDSA</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded border">
                            <div className="font-semibold text-gray-700">Traditional ECDSA</div>
                            <div className="text-xs text-gray-600 mt-1">
                                • Known generator G<br />
                                • Scalar private key k<br />
                                • Signature: (r, s) scalars<br />
                                • Security: ECDLP
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                            <div className="font-semibold text-purple-700">Our EC-DSS</div>
                            <div className="text-xs text-purple-600 mt-1">
                                • Secret generator point G<br />
                                • Point private key G<br />
                                • Signature: (R, s, Z) points+scalar<br />
                                • Security: New hard problems
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                            <div className="font-semibold text-green-700">Innovation</div>
                            <div className="text-xs text-green-600 mt-1">
                                • Generator secrecy<br />
                                • Transcendental structure<br />
                                • Quantum resistance<br />
                                • Multiple security layers
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const HardProblemExploration = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BrainIcon className="h-5 w-5" />
                    Hard Problem Demonstrations
                </CardTitle>
                <CardDescription>
                    Interactive exploration of the mathematical foundations
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => demonstrateHardProblem('2.1')}
                            className="p-6 h-auto flex-col bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:from-green-100 hover:to-green-200"
                        >
                            <strong className="text-green-800">Form 2.1: Key Generation</strong>
                            <div className="text-xs mt-2 font-mono">P = x_G × G</div>
                            <div className="text-xs text-green-600 mt-1">Find secret generator G</div>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => demonstrateHardProblem('2.2')}
                            className="p-6 h-auto flex-col bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 hover:from-purple-100 hover:to-purple-200"
                        >
                            <strong className="text-purple-800">Form 2.2: Verification</strong>
                            <div className="text-xs mt-2 font-mono">x_G × P = k × G</div>
                            <div className="text-xs text-purple-600 mt-1">Transcendental equation</div>
                        </Button>
                    </div>

                    {hardProblemDemo && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold mb-3 text-yellow-800">{hardProblemDemo.equation}</h4>
                            <p className="text-sm mb-4 text-yellow-700">{hardProblemDemo.description}</p>

                            {hardProblemDemo.example && (
                                <div className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-medium mb-3 text-gray-800">Mathematical Example:</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div><strong>Setup:</strong> {hardProblemDemo.example.setup || hardProblemDemo.example.given}</div>
                                            <div className="mt-1"><strong>Challenge:</strong> {hardProblemDemo.example.challenge || hardProblemDemo.example.find}</div>
                                        </div>
                                        <div>
                                            <div><strong>Difficulty:</strong> {hardProblemDemo.example.difficulty}</div>
                                            <div className="mt-1"><strong>Usage:</strong> {hardProblemDemo.example.usage}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                                <strong className="text-orange-800">Security Analysis:</strong>
                                <div className="text-sm text-orange-700 mt-1">
                                    {hardProblemDemo.security_analysis?.complexity || 'O(2^n) brute force only'} -
                                    {hardProblemDemo.security_analysis?.innovation || hardProblemDemo.security_analysis?.resistance}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Elliptic Curve Digital Signature with Secret Generator Points
                    </h1>
                    <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                        Revolutionary cryptographic approach using secret generator points and transcendental equations
                        for quantum-resistant digital signatures based on new hard problems
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <LockIcon className="h-4 w-4" />
                            <span>Quantum Resistant</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <GitBranchIcon className="h-4 w-4" />
                            <span>Secret Generator</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <BrainIcon className="h-4 w-4" />
                            <span>New Hard Problems</span>
                        </div>
                    </div>
                </div>

                {/* Progress Indicator */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            {[1, 2, 3, 4].map((step) => (
                                <div key={step} className="flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg
                    ${currentStep >= step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'}`}>
                                        {step}
                                    </div>
                                    <div className="text-sm mt-2 text-center font-medium">
                                        {step === 1 && 'Generate Keys'}
                                        {step === 2 && 'Sign Message'}
                                        {step === 3 && 'Verify Signature'}
                                        {step === 4 && 'Complete'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${(currentStep - 1) * 33.33}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Main Demo Content */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column - Interactive Demo */}
                    <div className="xl:col-span-1 space-y-6">
                        {/* Step 1: Key Generation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <KeyIcon className="h-5 w-5" />
                                    Step 1: Key Generation
                                </CardTitle>
                                <CardDescription>
                                    Generate secret generator point G and public point P using Form 2.1 hard problem
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={generateKeys}
                                    disabled={isProcessing}
                                    className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                                >
                                    {isProcessing ? 'Generating Keys...' : 'Generate EC Key Pair'}
                                </Button>

                                {keyData && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                        <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-1">
                                            <ZapIcon className="h-4 w-4" />
                                            Keys Generated Successfully
                                        </h4>
                                        <div className="text-sm text-green-700">
                                            Secret generator point G and public point P = (-x_G) × G created using revolutionary approach
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Step 2: Message Signing */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PenIcon className="h-5 w-5" />
                                    Step 2: Message Signing
                                </CardTitle>
                                <CardDescription>
                                    Sign message using secret generator and transcendental point relationships
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="message">Message to Sign</Label>
                                        <Input
                                            id="message"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Enter your message here..."
                                            className="mt-2"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">
                                            {message.length} characters
                                        </div>
                                    </div>

                                    <Button
                                        onClick={signMessage}
                                        disabled={!keyData || isProcessing}
                                        className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                    >
                                        {isProcessing ? 'Signing...' : 'Sign Message'}
                                    </Button>

                                    {signatureData && (
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-1">
                                                <ZapIcon className="h-4 w-4" />
                                                Message Signed Successfully
                                            </h4>
                                            <div className="text-sm text-blue-700">
                                                Signature format: (R, s, Z) - two elliptic curve points + one scalar
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Step 3: Signature Verification */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheckIcon className="h-5 w-5" />
                                    Step 3: Signature Verification
                                </CardTitle>
                                <CardDescription>
                                    Verify signature using transcendental Form 2.2 hard problem equation
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={verifySignature}
                                    disabled={!signatureData || isProcessing}
                                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                >
                                    {isProcessing ? 'Verifying...' : 'Verify Signature'}
                                </Button>

                                {verificationResult !== null && (
                                    <div className={`mt-4 p-4 rounded-lg border ${verificationResult ?
                                        'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                                        'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'}`}>
                                        <h4 className={`font-semibold mb-2 flex items-center gap-1 ${verificationResult ? 'text-green-800' : 'text-red-800'}`}>
                                            <ZapIcon className="h-4 w-4" />
                                            {verificationResult ? 'Signature Valid ✅' : 'Signature Invalid ❌'}
                                        </h4>
                                        <div className={`text-sm ${verificationResult ? 'text-green-700' : 'text-red-700'}`}>
                                            {verificationResult ?
                                                'The signature satisfies the transcendental point equation π(R) × Z = s×e×R + π(Z+s×R)×P' :
                                                'The signature does not satisfy the verification equations'
                                            }
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reset Button */}
                        <Button
                            onClick={resetDemo}
                            variant="outline"
                            className="w-full h-10"
                        >
                            Reset Demo
                        </Button>
                    </div>

                    {/* Right Columns - Visualizations and Data */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Elliptic Curve Visualization */}
                        {/* <EllipticCurveVisualization /> */}
                        <Enhanced3DSection />

                        {/* Message and Keys Display */}
                        <MessageAndKeysDisplay />

                        {/* Educational Explanation */}
                        {showExplanation && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <InfoIcon className="h-5 w-5" />
                                        {getExplanationContent().title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg border border-amber-200">
                                        <p className="text-amber-800 leading-relaxed">
                                            {getExplanationContent().content}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Hard Problem Exploration */}
                        <HardProblemExploration />

                        {/* Performance Analysis */}
                        <PerformanceAnalysis />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Research Paper Citation */}
                <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-3">
                            <h3 className="font-semibold text-gray-800">Based on Research Paper:</h3>
                            <p className="text-sm text-gray-600">
                                "Construction of Digital Signature Schemes Based on a New Form of the Discrete Logarithm Problem"
                            </p>
                            <p className="text-xs text-gray-500 max-w-3xl mx-auto">
                                This implementation demonstrates the novel elliptic curve cryptographic approach described in Section IV of the research paper,
                                featuring quantum-resistant security through secret generator points and transcendental mathematical structures.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EnhancedDigitalSignatureDemo;