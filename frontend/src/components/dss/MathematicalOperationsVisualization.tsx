import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Brain,
    Calculator,
    Zap,
    TrendingUp,
    GitBranch,
    Lock,
    Unlock
} from 'lucide-react';

interface MathVisualizationProps {
    performanceMetrics: { [key: string]: number };
    intermediateValues: { [key: string]: any };
    currentStep: number;
    isProcessing: boolean;
}

const MathematicalOperationsVisualization: React.FC<MathVisualizationProps> = ({
    performanceMetrics,
    intermediateValues,
    currentStep,
    isProcessing
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeEquation, setActiveEquation] = useState<'hard_problem' | 'signing' | 'verification'>('hard_problem');
    const [animationSpeed, setAnimationSpeed] = useState(1);

    // D3-style force simulation for operation visualization
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;

        // Animation state
        let animationFrame: number;
        let time = 0;

        const drawOperationFlow = () => {
            ctx.clearRect(0, 0, width, height);

            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#f8fafc');
            gradient.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Draw operation nodes based on current step
            drawOperationNodes(ctx, width, height, time);

            // Draw connections
            drawOperationConnections(ctx, width, height, time);

            // Draw mathematical equations
            drawEquations(ctx, width, height, time);

            time += 0.02 * animationSpeed;
            animationFrame = requestAnimationFrame(drawOperationFlow);
        };

        drawOperationFlow();

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [currentStep, performanceMetrics, animationSpeed, activeEquation]);

    const drawOperationNodes = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        const operations = [
            { name: 'Key Gen', x: width * 0.2, y: height * 0.3, color: '#10b981', active: currentStep >= 1 },
            { name: 'Point Mul', x: width * 0.5, y: height * 0.2, color: '#3b82f6', active: currentStep >= 2 },
            { name: 'Hash', x: width * 0.8, y: height * 0.3, color: '#f59e0b', active: currentStep >= 2 },
            { name: 'Signature', x: width * 0.5, y: height * 0.6, color: '#8b5cf6', active: currentStep >= 2 },
            { name: 'Verify', x: width * 0.5, y: height * 0.8, color: '#ef4444', active: currentStep >= 3 }
        ];

        operations.forEach((op, index) => {
            const pulse = Math.sin(time + index) * 0.1 + 1;
            const radius = (op.active ? 25 : 15) * pulse;

            // Glow effect for active operations
            if (op.active && isProcessing) {
                ctx.shadowColor = op.color;
                ctx.shadowBlur = 20;
            } else {
                ctx.shadowBlur = 0;
            }

            // Draw node
            ctx.beginPath();
            ctx.arc(op.x, op.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = op.active ? op.color : '#94a3b8';
            ctx.fill();

            // Draw operation count
            if (op.active && performanceMetrics) {
                const count = getOperationCount(op.name);
                if (count > 0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(count.toString(), op.x, op.y + 4);
                }
            }

            // Draw label
            ctx.fillStyle = '#1f2937';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(op.name, op.x, op.y + radius + 15);
        });
    };

    const drawOperationConnections = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        const connections = [
            { from: [width * 0.2, height * 0.3], to: [width * 0.5, height * 0.2] },
            { from: [width * 0.5, height * 0.2], to: [width * 0.8, height * 0.3] },
            { from: [width * 0.5, height * 0.2], to: [width * 0.5, height * 0.6] },
            { from: [width * 0.8, height * 0.3], to: [width * 0.5, height * 0.6] },
            { from: [width * 0.5, height * 0.6], to: [width * 0.5, height * 0.8] }
        ];

        connections.forEach((conn, index) => {
            const flow = Math.sin(time - index * 0.5) * 0.5 + 0.5;
            const alpha = currentStep > index ? 0.6 : 0.2;

            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = -time * 10;

            ctx.beginPath();
            ctx.moveTo(conn.from[0], conn.from[1]);
            ctx.lineTo(conn.to[0], conn.to[1]);
            ctx.stroke();

            // Flow indicators
            if (currentStep > index) {
                const flowX = conn.from[0] + (conn.to[0] - conn.from[0]) * flow;
                const flowY = conn.from[1] + (conn.to[1] - conn.from[1]) * flow;

                ctx.beginPath();
                ctx.arc(flowX, flowY, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#3b82f6';
                ctx.fill();
            }
        });

        ctx.setLineDash([]);
    };

    const drawEquations = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        const equations = {
            hard_problem: [
                { text: 'Form 2.1: P = x_G × G', x: width * 0.1, y: height * 0.1, active: currentStep >= 1 },
                { text: 'Form 2.2: x_G × P = k × G', x: width * 0.1, y: height * 0.95, active: currentStep >= 3 }
            ],
            signing: [
                { text: 'R = k × G_secret', x: width * 0.1, y: height * 0.4, active: currentStep >= 2 },
                { text: 'Z = u × G_secret', x: width * 0.1, y: height * 0.5, active: currentStep >= 2 },
                { text: 's = (u×x_R + x_G×x_Z) / (k×(e+x_R))', x: width * 0.1, y: height * 0.6, active: currentStep >= 2 }
            ],
            verification: [
                { text: 'e = H(x_R || M)', x: width * 0.1, y: height * 0.7, active: currentStep >= 3 },
                { text: 'π(R) × Z = s×e×R + π(Z+s×R)×P', x: width * 0.1, y: height * 0.8, active: currentStep >= 3 }
            ]
        };

        const currentEquations = equations[activeEquation] || equations.hard_problem;

        currentEquations.forEach((eq, index) => {
            const alpha = eq.active ? 1 : 0.3;
            const glow = eq.active ? Math.sin(time + index) * 0.3 + 0.7 : 1;

            if (eq.active && isProcessing) {
                ctx.shadowColor = '#3b82f6';
                ctx.shadowBlur = 10 * glow;
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = `rgba(31, 41, 55, ${alpha})`;
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(eq.text, eq.x, eq.y);
        });
    };

    const getOperationCount = (operationName: string): number => {
        switch (operationName) {
            case 'Point Mul':
                return performanceMetrics.point_multiplications || 0;
            case 'Hash':
                return performanceMetrics.hash_operations || 0;
            case 'Key Gen':
                return currentStep >= 1 ? 1 : 0;
            case 'Signature':
                return currentStep >= 2 ? 1 : 0;
            case 'Verify':
                return currentStep >= 3 ? 1 : 0;
            default:
                return 0;
        }
    };

    // Real-time performance chart
    const PerformanceChart = () => {
        const maxOperations = Math.max(...Object.values(performanceMetrics), 1);

        return (
            <div className="space-y-3">
                {Object.entries(performanceMetrics).map(([operation, count]) => (
                    <div key={operation} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="capitalize">{operation.replace(/_/g, ' ')}</span>
                            <span className="font-mono">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(count / maxOperations) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Intermediate values display
    const IntermediateValuesDisplay = () => {
        const formatValue = (value: any): string => {
            if (typeof value === 'number') {
                return value.toString().length > 20 ?
                    `${value.toString().substring(0, 10)}...${value.toString().slice(-10)}` :
                    value.toString();
            }
            return value?.toString() || 'N/A';
        };

        const getRelevantValues = () => {
            const values: { [key: string]: any } = {};

            if (currentStep >= 1) {
                values['Private x_G'] = intermediateValues.x_G;
                values['Curve Prime p'] = intermediateValues.curve_params?.p;
            }

            if (currentStep >= 2) {
                values['Random k'] = intermediateValues.sign_k;
                values['Random u'] = intermediateValues.sign_u;
                values['Hash e'] = intermediateValues.sign_e;
                values['Point R.x'] = intermediateValues.sign_x_R;
                values['Point Z.x'] = intermediateValues.sign_x_Z;
            }

            if (currentStep >= 3) {
                values['Verify Hash'] = intermediateValues.verify_e;
                values['Verification'] = intermediateValues.verification_result;
            }

            return values;
        };

        const relevantValues = getRelevantValues();

        return (
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(relevantValues).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-2 rounded border">
                        <div className="text-xs font-semibold text-gray-700">{key}</div>
                        <div className="text-xs font-mono text-gray-600 break-all">
                            {formatValue(value)}
                        </div>
                    </div>
                ))}
                {Object.keys(relevantValues).length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                        Generate keys to see intermediate values
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Mathematical Operations Flow */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Real-time Mathematical Operations Flow
                    </CardTitle>
                    <CardDescription>
                        Live visualization of cryptographic operations and their relationships
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Equation Mode Selector */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant={activeEquation === 'hard_problem' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveEquation('hard_problem')}
                            >
                                Hard Problems
                            </Button>
                            <Button
                                variant={activeEquation === 'signing' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveEquation('signing')}
                            >
                                Signing
                            </Button>
                            <Button
                                variant={activeEquation === 'verification' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveEquation('verification')}
                            >
                                Verification
                            </Button>
                        </div>

                        {/* Canvas for mathematical flow */}
                        <canvas
                            ref={canvasRef}
                            className="w-full h-64 border rounded-lg bg-gradient-to-br from-slate-50 to-blue-50"
                            style={{ width: '100%', height: '256px' }}
                        />

                        {/* Current equation explanation */}
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <div className="text-sm text-yellow-800">
                                <strong>Active Equations:</strong>{' '}
                                {activeEquation === 'hard_problem' && 'Forms 2.1 & 2.2 - Secret generator point problems'}
                                {activeEquation === 'signing' && 'Signature generation using transcendental relationships'}
                                {activeEquation === 'verification' && 'Verification through hard problem equations'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance and Values Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Operation Performance
                        </CardTitle>
                        <CardDescription>
                            Real-time cryptographic operation counts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PerformanceChart />

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm text-blue-800">
                                <strong>Total Operations:</strong> {Object.values(performanceMetrics).reduce((a, b) => a + b, 0)}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                                Performance cost: ~3x traditional ECDSA for enhanced security
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Intermediate Values */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Cryptographic Values
                        </CardTitle>
                        <CardDescription>
                            Real-time intermediate computational values
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <IntermediateValuesDisplay />
                    </CardContent>
                </Card>
            </div>

            {/* Security Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Security Analysis Visualization
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Lock className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-800">Quantum Resistance</span>
                            </div>
                            <div className="text-sm text-green-700">
                                Novel hard problems resist quantum algorithms like Shor's algorithm
                            </div>
                            <div className="mt-2 text-xs text-green-600">
                                Security Level: {currentStep >= 1 ? 'Active' : 'Pending'}
                            </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <GitBranch className="h-4 w-4 text-purple-600" />
                                <span className="font-semibold text-purple-800">Secret Generator</span>
                            </div>
                            <div className="text-sm text-purple-700">
                                Generator point G itself is secret, unlike traditional ECDLP
                            </div>
                            <div className="mt-2 text-xs text-purple-600">
                                Innovation: {currentStep >= 1 ? 'Implemented' : 'Pending'}
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-blue-800">Transcendental Equations</span>
                            </div>
                            <div className="text-sm text-blue-700">
                                X-coordinates used as scalar multipliers in verification
                            </div>
                            <div className="mt-2 text-xs text-blue-600">
                                Active in: {currentStep >= 3 ? 'Verification' : 'Pending'}
                            </div>
                        </div>
                    </div>

                    {/* Hard Problem Complexity Visualization */}
                    <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-yellow-800 mb-3">Hard Problem Complexity Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="font-semibold text-yellow-700">Traditional ECDLP</div>
                                <div className="text-yellow-600">
                                    • Known generator G<br />
                                    • Secret scalar k<br />
                                    • Complexity: O(√n) with best attacks<br />
                                    • Vulnerable to quantum algorithms
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold text-orange-700">Our New Hard Problems</div>
                                <div className="text-orange-600">
                                    • Secret generator point G<br />
                                    • Transcendental relationships<br />
                                    • Complexity: O(2^n) brute force only<br />
                                    • Quantum resistant structure
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MathematicalOperationsVisualization;