'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    CheckCircle,
    XCircle,
    Key,
    FileSignature,
    Shield,
    Clock,
    Hash,
    Calculator,
    AlertCircle,
    BookOpen,
    TrendingUp,
    Zap,
    Brain,
    Target,
    Info
} from 'lucide-react';

import { dssAPI } from '@/lib/api';

const EducationalDigitalSignatureDemo: React.FC = () => {
    // State management (same as before)
    const [message, setMessage] = useState<string>('Hello, Cryptographic World!');
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [keyData, setKeyData] = useState<any>(null);
    const [signatureData, setSignatureData] = useState<any>(null);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [operationCounts, setOperationCounts] = useState({ exp: 0, mul: 0, inv: 0, hash: 0 });
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('demo');

    // Educational content state
    const [showExplanation, setShowExplanation] = useState<boolean>(true);
    type ExplanationType = 'intro' | 'keyGen' | 'signing' | 'verification';
    const [currentExplanation, setCurrentExplanation] = useState<ExplanationType>('intro');

    const steps = [
        { title: 'Hard Problem Setup', icon: Brain, description: 'Understand the new hard problems' },
        { title: 'Generate Keys', icon: Key, description: 'Create public/private key pair' },
        { title: 'Sign Message', icon: Shield, description: 'Generate digital signature' },
        { title: 'Verify Signature', icon: CheckCircle, description: 'Validate the signature' }
    ];

    // Hard Problem Explanations
    const hardProblemExplanations = {
        intro: {
            title: "Introduction to New Hard Problems",
            content: (
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Traditional digital signature schemes rely on well-known hard problems like the
                        <strong> Discrete Logarithm Problem (DLP)</strong>. This research introduces
                        <strong> new forms of hard problems</strong> that are potentially more secure.
                    </p>

                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-semibold text-blue-800 mb-2">Traditional DLP:</h4>
                        <div className="font-mono text-sm bg-white p-2 rounded">
                            Given: g<sup>x</sup> ≡ y (mod p)<br />
                            Find: x (knowing g, y, p)
                        </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                        <h4 className="font-semibold text-red-800 mb-2">New Hard Problem (Form 1.1):</h4>
                        <div className="font-mono text-sm bg-white p-2 rounded">
                            Given: x<sup>x</sup> ≡ y (mod p)<br />
                            Find: x (knowing y, p)
                        </div>
                        <p className="text-red-700 text-sm mt-2">
                            Notice: Both the base AND the exponent are the unknown variable x!
                        </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                        <h4 className="font-semibold text-purple-800 mb-2">New Hard Problem (Form 1.2):</h4>
                        <div className="font-mono text-sm bg-white p-2 rounded">
                            Given: a<sup>x</sup> ≡ x<sup>b</sup> (mod p)<br />
                            Find: x (knowing a, b, p)
                        </div>
                        <p className="text-purple-700 text-sm mt-2">
                            Both sides have x in different positions - making it unsolvable by current methods!
                        </p>
                    </div>
                </div>
            )
        },
        keyGen: {
            title: "Key Generation Using Hard Problems",
            content: (
                <div className="space-y-4">
                    <h4 className="font-semibold text-green-800">Step-by-Step Key Generation:</h4>

                    <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                            <strong>Step 1:</strong> Generate system parameters
                            <div className="font-mono text-sm mt-1">
                                • Choose prime p and q where q|(p-1)<br />
                                • These are public domain parameters
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                            <strong>Step 2:</strong> Generate private key using hard problem
                            <div className="font-mono text-sm mt-1">
                                • Choose random a ∈ Z<sub>p</sub>*<br />
                                • Compute x = a<sup>(p-1)/q</sup> mod p<br />
                                • x is the private key (secret)
                            </div>
                        </div>

                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                            <strong>Step 3:</strong> Generate public key using NEW hard problem
                            <div className="font-mono text-sm mt-1">
                                • Compute y = x<sup>-x</sup> mod p<br />
                                • This uses Form 1.1: x<sup>x</sup> ≡ y (mod p)<br />
                                • y is the public key
                            </div>
                        </div>
                    </div>

                    <Alert>
                        <Target className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Security:</strong> An attacker knowing y and p cannot find x because
                            they would need to solve x<sup>x</sup> ≡ y (mod p), which is the new hard problem!
                        </AlertDescription>
                    </Alert>
                </div>
            )
        },
        signing: {
            title: "Signing Algorithm with Hard Problem Integration",
            content: (
                <div className="space-y-4">
                    <h4 className="font-semibold text-orange-800">Digital Signature Generation:</h4>

                    <div className="space-y-3">
                        <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                            <strong>Step 1:</strong> Generate signature component r
                            <div className="font-mono text-sm mt-1">
                                • Choose random k<br />
                                • Compute r = x<sup>k</sup> mod p<br />
                                • Uses private key x in exponent
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                            <strong>Step 2:</strong> Hash message with r
                            <div className="font-mono text-sm mt-1">
                                • Compute e = H(r||M)<br />
                                • Binds signature to specific message<br />
                                • Prevents signature reuse
                            </div>
                        </div>

                        <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
                            <strong>Step 3:</strong> Generate z component
                            <div className="font-mono text-sm mt-1">
                                • Choose random u<br />
                                • Compute z = x<sup>u</sup> mod p<br />
                                • Another use of hard problem form
                            </div>
                        </div>

                        <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                            <strong>Step 4:</strong> Compute s using complex formula
                            <div className="font-mono text-sm mt-1">
                                s = (v×r + x×w) × (k×(e+r))<sup>-1</sup> mod q
                            </div>
                            <p className="text-red-700 text-sm mt-1">
                                This links all components together cryptographically
                            </p>
                        </div>
                    </div>

                    <div className="bg-green-100 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-800 mb-2">Final Signature:</h5>
                        <div className="font-mono text-sm">
                            Signature = (r, s, z)
                        </div>
                        <p className="text-green-700 text-sm mt-2">
                            All three components are needed for verification and are cryptographically linked
                        </p>
                    </div>
                </div>
            )
        },
        verification: {
            title: "Verification Using Hard Problem Form 1.2",
            content: (
                <div className="space-y-4">
                    <h4 className="font-semibold text-indigo-800">Signature Verification Process:</h4>

                    <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                        <h5 className="font-semibold mb-2">Core Verification Equation:</h5>
                        <div className="font-mono text-sm bg-white p-2 rounded">
                            z<sup>r</sup> ≡ r<sup>s×e</sup> × y<sup>(z×r<sup>s</sup>)</sup> (mod p)
                        </div>
                        <p className="text-indigo-700 text-sm mt-2">
                            This is Form 1.2 of the hard problem: a<sup>x</sup> ≡ x<sup>b</sup> (mod p)
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded">
                            <strong>Step 1:</strong> Compute hash
                            <div className="font-mono text-sm mt-1">a = H(r||M)</div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded">
                            <strong>Step 2:</strong> Compute r̄ using complex formula
                            <div className="font-mono text-sm mt-1">
                                r̄ = (z<sup>r</sup> × y<sup>-(z×r<sup>s</sup>)</sup>)<sup>(s×a)<sup>-1</sup></sup> mod p
                            </div>
                        </div>

                        <div className="bg-green-50 p-3 rounded">
                            <strong>Step 3:</strong> Verify hash consistency
                            <div className="font-mono text-sm mt-1">
                                b = H(r̄||M)<br />
                                Valid if: a = b
                            </div>
                        </div>
                    </div>

                    <Alert>
                        <Zap className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Security Guarantee:</strong> Forging a signature would require solving
                            the hard problem Form 1.2, which has no known efficient solution!
                        </AlertDescription>
                    </Alert>
                </div>
            )
        }
    };

    // Performance comparison data
    const performanceComparison = {
        DSA: { exp: '1+2', mul: '2+3', inv: '1+1', hash: '1+1' },
        'GOST R34.10-94': { exp: '1+3', mul: '2+3', inv: '0+0', hash: '1+1' },
        'Proposed Scheme': { exp: '3+4', mul: '5+3', inv: '1+2', hash: '1+2' }
    };

    // API calls (same as before but with educational updates)
    const generateKeys = async (): Promise<void> => {
        setCurrentExplanation('keyGen');
        setShowExplanation(true);

        try {
            setError(null);
            await simulateProcessing('Generating cryptographic parameters using hard problems...', 1000);

            const response = await dssAPI.generateKeys(512, 'finite_field');

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
        setCurrentExplanation('signing');
        setShowExplanation(true);

        try {
            setError(null);
            await simulateProcessing('Computing signature using hard problem formulations...', 1200);

            const response = await dssAPI.signMessage(
                message,
                keyData.privateKey,
                keyData.systemParams,
                'finite_field'
            );

            if (response.success) {
                setSignatureData({
                    signature: response.signature,
                    intermediateValues: response.intermediate_values,
                    hash: response.intermediate_values.sign_e
                });
                updateOperationCounts(response.performance_metrics);
                setCurrentStep(3);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Message signing failed');
        }
    };

    const verifySignature = async (): Promise<void> => {
        setCurrentExplanation('verification');
        setShowExplanation(true);

        try {
            setError(null);
            await simulateProcessing('Verifying using hard problem Form 1.2...', 800);

            const response = await dssAPI.verifySignature(
                message,
                signatureData.signature,
                keyData.publicKey,
                keyData.systemParams,
                'finite_field'
            );

            if (response.success) {
                setVerificationResult({
                    isValid: response.is_valid,
                    verificationDetails: response.verification_details
                });
                updateOperationCounts(response.performance_metrics);
                setCurrentStep(4);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Signature verification failed');
        }
    };

    // Helper functions (same as before)
    const updateOperationCounts = (metrics: any) => {
        setOperationCounts({
            exp: metrics.exp_ops,
            mul: metrics.mul_ops,
            inv: metrics.inv_ops,
            hash: metrics.hash_ops
        });
    };

    const simulateProcessing = async (stepName: string, duration: number = 1000): Promise<void> => {
        setIsProcessing(true);
        setProcessingStep(stepName);
        await new Promise(resolve => setTimeout(resolve, duration));
        setIsProcessing(false);
        setProcessingStep('');
    };

    const resetDemo = (): void => {
        setCurrentStep(0);
        setKeyData(null);
        setSignatureData(null);
        setVerificationResult(null);
        setOperationCounts({ exp: 0, mul: 0, inv: 0, hash: 0 });
        setError(null);
        setCurrentExplanation('intro');
    };

    const formatLargeNumber = (num: string): string => {
        return num.length > 12 ? `${num.substring(0, 8)}...${num.substring(num.length - 4)}` : num;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <Card className="border-2 border-indigo-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <Brain className="h-8 w-8" />
                            Educational Digital Signature Scheme Demo
                        </CardTitle>
                        <p className="text-indigo-100">
                            Interactive demonstration of new hard problem-based DSS with comprehensive explanations
                        </p>
                    </CardHeader>
                </Card>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
                        <TabsTrigger value="theory">Hard Problems Theory</TabsTrigger>
                        <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
                        <TabsTrigger value="security">Security Analysis</TabsTrigger>
                    </TabsList>

                    {/* Interactive Demo Tab */}
                    <TabsContent value="demo" className="space-y-6">
                        {/* Progress Steps */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    {steps.map((step, index) => {
                                        const Icon = step.icon;
                                        const isActive = currentStep === index;
                                        const isCompleted = currentStep > index;

                                        return (
                                            <div key={index} className="flex flex-col items-center text-center flex-1">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isCompleted ? 'bg-green-500 text-white' :
                                                        isActive ? 'bg-indigo-500 text-white' :
                                                            'bg-gray-200 text-gray-400'
                                                    }`}>
                                                    {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                                                </div>
                                                <span className={`text-sm font-medium ${isActive ? 'text-indigo-600' :
                                                        isCompleted ? 'text-green-600' : 'text-gray-400'
                                                    }`}>
                                                    {step.title}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-1">{step.description}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {isProcessing && (
                                    <div className="flex items-center justify-center mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <Clock className="h-5 w-5 text-yellow-600 mr-2 animate-spin" />
                                        <span className="text-yellow-800">{processingStep}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {/* Message Input and Controls */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileSignature className="h-5 w-5" />
                                            Message Input
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Enter your message here..."
                                            className="min-h-20"
                                            disabled={currentStep > 0}
                                        />
                                        <div className="mt-4 space-y-2">
                                            <Button
                                                onClick={() => setCurrentStep(1)}
                                                className="w-full"
                                                disabled={!message.trim() || currentStep !== 0 || isProcessing}
                                            >
                                                Start Hard Problem Demo
                                            </Button>
                                            <Button onClick={resetDemo} variant="outline" className="w-full">
                                                Reset Demo
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Process Controls</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button onClick={generateKeys} disabled={currentStep !== 1 || isProcessing} className="w-full">
                                            <Key className="h-4 w-4 mr-2" />
                                            Generate Keys (Hard Problem)
                                        </Button>

                                        <Button onClick={signMessage} disabled={currentStep !== 2 || isProcessing} className="w-full" variant="secondary">
                                            <Shield className="h-4 w-4 mr-2" />
                                            Sign Message
                                        </Button>

                                        <Button onClick={verifySignature} disabled={currentStep !== 3 || isProcessing} className="w-full" variant="secondary">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Verify Signature
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Explanation Panel */}
                            <div className="space-y-6">
                                {showExplanation && (
                                    <Card className="border-2 border-purple-200">
                                        <CardHeader className="bg-purple-50">
                                            <CardTitle className="flex items-center gap-2 text-purple-800">
                                                <BookOpen className="h-5 w-5" />
                                                {hardProblemExplanations[currentExplanation]?.title}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowExplanation(false)}
                                                    className="ml-auto"
                                                >
                                                    ×
                                                </Button>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            {hardProblemExplanations[currentExplanation]?.content}
                                        </CardContent>
                                    </Card>
                                )}

                                {!showExplanation && (
                                    <Card className="border-2 border-gray-200">
                                        <CardContent className="p-4 text-center">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowExplanation(true)}
                                                className="w-full"
                                            >
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                Show Explanation
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Performance Metrics */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calculator className="h-5 w-5" />
                                            Operation Count
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{operationCounts.exp}</div>
                                                <div className="text-sm text-gray-500">Exponentiations</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{operationCounts.mul}</div>
                                                <div className="text-sm text-gray-500">Multiplications</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-600">{operationCounts.inv}</div>
                                                <div className="text-sm text-gray-500">Inversions</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-orange-600">{operationCounts.hash}</div>
                                                <div className="text-sm text-gray-500">Hash Operations</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Results Column - Only shows when there are results */}
                            {(keyData || signatureData || verificationResult) && (
                                <div className="space-y-6">
                                    {/* Results Column - Only shows when there are results */}
                                    {(keyData || signatureData || verificationResult) && (
                                        <div className="space-y-6">
                                            {/* Key Results */}
                                            {keyData && (
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <Key className="h-5 w-5" />
                                                            Generated Keys
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-600">System Parameters:</label>
                                                            <div className="bg-gray-50 p-3 rounded-lg mt-1 text-sm">
                                                                <div><strong>p:</strong> {formatLargeNumber(keyData.systemParams.p)}</div>
                                                                <div><strong>q:</strong> {formatLargeNumber(keyData.systemParams.q)}</div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-600">Private Key (x):</label>
                                                            <div className="bg-red-50 p-3 rounded-lg mt-1 font-mono text-sm">
                                                                {formatLargeNumber(keyData.privateKey)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-600">Public Key (y = x<sup>-x</sup> mod p):</label>
                                                            <div className="bg-green-50 p-3 rounded-lg mt-1 font-mono text-sm">
                                                                {formatLargeNumber(keyData.publicKey)}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Signature Results */}
                                            {signatureData && (
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <Shield className="h-5 w-5" />
                                                            Digital Signature
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-600">Message Hash (e):</label>
                                                            <div className="bg-blue-50 p-3 rounded-lg mt-1 font-mono flex items-center gap-2 text-sm">
                                                                <Hash className="h-4 w-4" />
                                                                {signatureData.hash}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-600">Signature Components:</label>
                                                            <div className="bg-gray-50 p-3 rounded-lg mt-1 space-y-2 text-sm">
                                                                <div><strong>r:</strong> {formatLargeNumber(signatureData.signature.r)}</div>
                                                                <div><strong>s:</strong> {formatLargeNumber(signatureData.signature.s)}</div>
                                                                <div><strong>z:</strong> {formatLargeNumber(signatureData.signature.z)}</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Verification Results */}
                                            {verificationResult && (
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            {verificationResult.isValid ? (
                                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                            ) : (
                                                                <XCircle className="h-5 w-5 text-red-600" />
                                                            )}
                                                            Verification Result
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="text-center">
                                                            <Badge
                                                                variant={verificationResult.isValid ? "default" : "destructive"}
                                                                className="text-lg px-4 py-2"
                                                            >
                                                                {verificationResult.isValid ? "SIGNATURE VALID" : "SIGNATURE INVALID"}
                                                            </Badge>
                                                        </div>
                                                        <Separator />
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-600">Hard Problem Verification:</label>
                                                            <div className="space-y-2 mt-2">
                                                                <div className="bg-blue-50 p-2 rounded flex justify-between text-sm">
                                                                    <span>Original Hash (a):</span>
                                                                    <span className="font-mono">{verificationResult.verificationDetails.verify_a}</span>
                                                                </div>
                                                                <div className="bg-blue-50 p-2 rounded flex justify-between text-sm">
                                                                    <span>Computed Hash (b):</span>
                                                                    <span className="font-mono">{verificationResult.verificationDetails.verify_b}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Theory Tab */}
                    <TabsContent value="theory">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {Object.entries(hardProblemExplanations).map(([key, explanation]) => (
                                <Card key={key} className="border-2 border-blue-200">
                                    <CardHeader className="bg-blue-50">
                                        <CardTitle className="text-blue-800">{explanation.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {explanation.content}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Performance Comparison with Traditional Schemes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-300 px-4 py-2 text-left">Scheme</th>
                                                <th className="border border-gray-300 px-4 py-2">Nexp (Sign + Verify)</th>
                                                <th className="border border-gray-300 px-4 py-2">Nmul (Sign + Verify)</th>
                                                <th className="border border-gray-300 px-4 py-2">Ninv (Sign + Verify)</th>
                                                <th className="border border-gray-300 px-4 py-2">Nh (Sign + Verify)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(performanceComparison).map(([scheme, metrics]) => (
                                                <tr key={scheme} className={scheme === 'Proposed Scheme' ? 'bg-yellow-50 font-semibold' : ''}>
                                                    <td className="border border-gray-300 px-4 py-2">{scheme}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-center">{metrics.exp}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-center">{metrics.mul}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-center">{metrics.inv}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-center">{metrics.hash}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Performance Trade-off:</strong> The proposed scheme has higher computational cost
                                            but provides enhanced security through the new hard problems.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-red-800 mb-2">Higher Costs:</h4>
                                            <ul className="text-red-700 text-sm space-y-1">
                                                <li>• More exponentiations (3+4 vs 1+2)</li>
                                                <li>• More multiplications (5+3 vs 2+3)</li>
                                                <li>• Additional hash operations</li>
                                            </ul>
                                        </div>

                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-green-800 mb-2">Security Benefits:</h4>
                                            <ul className="text-green-700 text-sm space-y-1">
                                                <li>• Based on new hard problems</li>
                                                <li>• No known efficient attacks</li>
                                                <li>• Enhanced forgery resistance</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Analysis Tab */}
                    <TabsContent value="security">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Security Analysis of Hard Problems
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Attack Resistance */}
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-3">Attack Resistance Analysis:</h4>

                                        <div className="space-y-4">
                                            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                                                <h5 className="font-semibold text-red-800 mb-2">Secret Key Attack</h5>
                                                <p className="text-red-700 text-sm mb-2">
                                                    An attacker tries to recover the private key x from the public key y.
                                                </p>
                                                <div className="bg-white p-2 rounded font-mono text-sm">
                                                    Known: y = x<sup>-x</sup> mod p<br />
                                                    Goal: Find x
                                                </div>
                                                <p className="text-red-700 text-sm mt-2">
                                                    <strong>Defense:</strong> Requires solving x<sup>x</sup> ≡ y (mod p), which is the new hard problem with computational complexity O(2<sup>n</sup>).
                                                </p>
                                            </div>

                                            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                                                <h5 className="font-semibold text-orange-800 mb-2">Signature Forgery Attack</h5>
                                                <p className="text-orange-700 text-sm mb-2">
                                                    An attacker tries to create a valid signature (r, s, z) without knowing the private key.
                                                </p>
                                                <div className="bg-white p-2 rounded font-mono text-sm">
                                                    Must satisfy: z<sup>r</sup> ≡ r<sup>s×e</sup> × y<sup>(z×r<sup>s</sup>)</sup> (mod p)
                                                </div>
                                                <p className="text-orange-700 text-sm mt-2">
                                                    <strong>Defense:</strong> This is Form 1.2 of the hard problem: a<sup>x</sup> ≡ x<sup>b</sup> (mod p), currently unsolvable.
                                                </p>
                                            </div>

                                            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                                <h5 className="font-semibold text-purple-800 mb-2">Known Attack Methods</h5>
                                                <div className="space-y-2 text-sm">
                                                    <div className="bg-white p-2 rounded">
                                                        <strong>Brute Force:</strong> O(2<sup>n</sup>) complexity - infeasible for large n
                                                    </div>
                                                    <div className="bg-white p-2 rounded">
                                                        <strong>Index Calculus:</strong> Not applicable to new hard problem forms
                                                    </div>
                                                    <div className="bg-white p-2 rounded">
                                                        <strong>Pohlig-Hellman:</strong> Doesn't work when base and exponent are the same variable
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Computational Complexity */}
                                    <Separator />

                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-3">Computational Complexity Comparison:</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                                <h5 className="font-semibold text-blue-800 mb-2">Traditional DLP</h5>
                                                <div className="text-2xl font-mono text-blue-600 mb-2">O(√p)</div>
                                                <p className="text-blue-700 text-sm">Sub-exponential algorithms exist</p>
                                            </div>

                                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                                <h5 className="font-semibold text-green-800 mb-2">Hard Problem 1.1</h5>
                                                <div className="text-2xl font-mono text-green-600 mb-2">O(2<sup>n</sup>)</div>
                                                <p className="text-green-700 text-sm">Only brute force known</p>
                                            </div>

                                            <div className="bg-purple-50 p-4 rounded-lg text-center">
                                                <h5 className="font-semibold text-purple-800 mb-2">Hard Problem 1.2</h5>
                                                <div className="text-2xl font-mono text-purple-600 mb-2">O(2<sup>n</sup>)</div>
                                                <p className="text-purple-700 text-sm">Currently unsolvable</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Mathematical Foundations */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mathematical Foundations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-semibold mb-2">Why Traditional Methods Fail:</h5>
                                            <ul className="text-sm space-y-2">
                                                <li>• <strong>Baby-step Giant-step:</strong> Requires known generator, not applicable when base = exponent</li>
                                                <li>• <strong>Pollard's Rho:</strong> Relies on group structure that doesn't exist in x<sup>x</sup> form</li>
                                                <li>• <strong>Index Calculus:</strong> Factor base approach fails when variables appear in both positions</li>
                                                <li>• <strong>Linear Algebra:</strong> No linear relationship exists in a<sup>x</sup> ≡ x<sup>b</sup> (mod p)</li>
                                            </ul>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h5 className="font-semibold mb-2">Research Implications:</h5>
                                            <ul className="text-sm space-y-2">
                                                <li>• First practical use of x<sup>x</sup> form in cryptography</li>
                                                <li>• Opens new research directions in hard problem-based cryptography</li>
                                                <li>• Potential foundation for post-quantum cryptographic systems</li>
                                                <li>• Demonstrates viability of novel mathematical structures in security</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default EducationalDigitalSignatureDemo;