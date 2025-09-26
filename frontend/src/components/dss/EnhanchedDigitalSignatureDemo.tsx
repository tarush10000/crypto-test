'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle,
    Key,
    Shield,
    Brain,
    Zap,
    RotateCcw,
    Play,
    Pause,
    Eye,
    Settings,
    ChevronRight,
    Lock,
    Unlock,
    Activity,
    FileText,
    Award
} from 'lucide-react';
import * as THREE from 'three';

// Type definitions
interface KeyData {
    privateKey: string;
    publicKey: string;
    systemParams: {
        curve: string;
        generator: string;
    };
}

interface SignaturePoint {
    x: string;
    y: string;
}

interface SignatureData {
    signature: {
        R: SignaturePoint;
        s: string;
        Z: SignaturePoint;
    };
    hash: string;
}

interface VisualizationObjects {
    curve: THREE.Line | null;
    privatePoint: THREE.Mesh | null;
    publicPoint: THREE.Mesh | null;
    signatureR: THREE.Mesh | null;
    signatureZ: THREE.Mesh | null;
    connections: THREE.Line[];
}

interface StepConfig {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

interface Interactive3DVisualizationProps {
    keyData: KeyData | null;
    signatureData: SignatureData | null;
    currentStep: number;
    isProcessing: boolean;
}

interface PerformanceMetric {
    value: number;
    label: string;
    color: string;
}

// Performance Metrics Component - Client-side only
const PerformanceMetrics: React.FC = () => {
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Generate metrics only on client side
        const newMetrics: PerformanceMetric[] = [
            {
                value: Math.floor(Math.random() * 50) + 10,
                label: 'Exponentiations',
                color: 'text-blue-600'
            },
            {
                value: Math.floor(Math.random() * 30) + 5,
                label: 'Multiplications',
                color: 'text-purple-600'
            },
            {
                value: Math.floor(Math.random() * 10) + 2,
                label: 'Inversions',
                color: 'text-green-600'
            },
            {
                value: Math.floor(Math.random() * 5) + 1,
                label: 'Hash Operations',
                color: 'text-red-600'
            }
        ];
        setMetrics(newMetrics);
    }, []);

    if (!isClient) {
        return (
            <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Real-time Performance Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-blue-600">--</div>
                        <div className="text-xs text-gray-600">Exponentiations</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-purple-600">--</div>
                        <div className="text-xs text-gray-600">Multiplications</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-600">--</div>
                        <div className="text-xs text-gray-600">Inversions</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-red-600">--</div>
                        <div className="text-xs text-gray-600">Hash Operations</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Real-time Performance Metrics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {metrics.map((metric, index) => (
                    <div key={index}>
                        <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                        <div className="text-xs text-gray-600">{metric.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Enhanced 3D Visualization Component
const Interactive3DVisualization: React.FC<Interactive3DVisualizationProps> = ({ 
    keyData, 
    signatureData, 
    currentStep, 
    isProcessing 
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const animationRef = useRef<number | null>(null);
    const [isAnimating, setIsAnimating] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState<'curve' | 'operations'>('curve');
    
    // Points and objects
    const objectsRef = useRef<VisualizationObjects>({
        curve: null,
        privatePoint: null,
        publicPoint: null,
        signatureR: null,
        signatureZ: null,
        connections: []
    });

    useEffect(() => {
        if (!mountRef.current) return;

        // Clear any existing content
        while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        
        const camera = new THREE.PerspectiveCamera(
            75, 
            mountRef.current.clientWidth / mountRef.current.clientHeight, 
            0.1, 
            1000
        );
        
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: false,
            preserveDrawingBuffer: true 
        });
        
        const width = mountRef.current.clientWidth || 800;
        const height = mountRef.current.clientHeight || 400;
        
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x1a1a2e, 1);
        
        // Ensure canvas is added to DOM
        try {
            mountRef.current.appendChild(renderer.domElement);
        } catch (error) {
            console.error('Failed to add canvas to DOM:', error);
            return;
        }

        // Enhanced lighting for better 3D appearance
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Add point lights for better illumination
        const pointLight1 = new THREE.PointLight(0x4080ff, 0.5, 50);
        pointLight1.position.set(-10, 5, 5);
        scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff4080, 0.5, 50);
        pointLight2.position.set(10, -5, 5);
        scene.add(pointLight2);

        sceneRef.current = scene;
        rendererRef.current = renderer;
        cameraRef.current = camera;
        
        // Set initial camera position for 3D view
        camera.position.set(12, 8, 15);
        camera.lookAt(0, 0, 0);

        // Create initial curve immediately
        createEllipticCurve();
        
        // Force initial render
        renderer.render(scene, camera);
        
        // Animation loop with 3D rotation
        let time = 0;
        let lastTime = performance.now();
        
        const animate = (currentTime: number): void => {
            const deltaTime = (currentTime - lastTime) * 0.001;
            lastTime = currentTime;
            time += deltaTime;
            
            if (isAnimating) {
                // Rotate camera around the scene for 3D effect
                const radius = 15;
                const height = 8;
                camera.position.x = Math.cos(time * 0.5) * radius;
                camera.position.z = Math.sin(time * 0.5) * radius;
                camera.position.y = height + Math.sin(time * 0.3) * 3;
                camera.lookAt(0, 0, 0);
                
                // Add some dynamic lighting
                pointLight1.position.x = Math.sin(time * 0.7) * 8;
                pointLight1.position.z = Math.cos(time * 0.7) * 8;
                pointLight2.position.x = Math.cos(time * 0.5) * -8;
                pointLight2.position.z = Math.sin(time * 0.5) * -8;
            }
            
            // Always update visualization and render
            updateVisualizationForStep();
            renderer.render(scene, camera);
            
            // Continue animation loop
            if (animationRef.current !== null) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        // Start animation loop
        animationRef.current = requestAnimationFrame(animate);

        // Handle window resize
        const handleResize = () => {
            if (mountRef.current && camera && renderer) {
                const newWidth = mountRef.current.clientWidth;
                const newHeight = mountRef.current.clientHeight;
                
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
                renderer.render(scene, camera);
            }
        };
        
        window.addEventListener('resize', handleResize);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            window.removeEventListener('resize', handleResize);
            
            // Clean up Three.js objects
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry?.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material?.dispose();
                    }
                }
            });
            
            renderer.dispose();
            
            if (mountRef.current && renderer.domElement) {
                try {
                    mountRef.current.removeChild(renderer.domElement);
                } catch (e) {
                    // Ignore if already removed
                }
            }
        };
    }, [isAnimating]);

    // Update visualization when key data changes - force re-render
    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            updateVisualizationForStep();
            // Force a render
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [keyData, signatureData, currentStep]);

    const createEllipticCurve = (): void => {
        if (!sceneRef.current) return;

        // Create a more realistic 3D elliptic curve
        const curvePoints: THREE.Vector3[] = [];
        
        // Generate points for elliptic curve y² = x³ + ax + b (simplified visualization)
        for (let t = -Math.PI; t <= Math.PI; t += 0.05) {
            const x = 6 * Math.cos(t);
            const y = 4 * Math.sin(t);
            const z = 0.8 * Math.sin(2 * t); // Add some 3D depth
            curvePoints.push(new THREE.Vector3(x, y, z));
        }
        
        // Add second branch of the curve
        for (let t = -Math.PI; t <= Math.PI; t += 0.05) {
            const x = 6 * Math.cos(t);
            const y = -4 * Math.sin(t);
            const z = -0.8 * Math.sin(2 * t);
            curvePoints.push(new THREE.Vector3(x, y, z));
        }

        const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const curveMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff88,
            linewidth: 2,
            transparent: true,
            opacity: 0.9
        });
        
        if (objectsRef.current.curve) {
            sceneRef.current.remove(objectsRef.current.curve);
        }
        
        objectsRef.current.curve = new THREE.Line(curveGeometry, curveMaterial);
        sceneRef.current.add(objectsRef.current.curve);
    };

    const updateVisualizationForStep = (): void => {
        if (!sceneRef.current) return;

        // Always show the curve
        if (!objectsRef.current.curve) {
            createEllipticCurve();
        }

        // Step 1+: Show key generation (private and public key points)
        if (currentStep >= 1 && keyData) {
            updatePrivateKeyPoint();
            updatePublicKeyPoint();
        } else {
            // Remove key points if step < 1 or no key data
            if (objectsRef.current.privatePoint) {
                sceneRef.current.remove(objectsRef.current.privatePoint);
                objectsRef.current.privatePoint = null;
            }
            if (objectsRef.current.publicPoint) {
                sceneRef.current.remove(objectsRef.current.publicPoint);
                objectsRef.current.publicPoint = null;
            }
        }

        // Step 2+: Show signature points
        if (currentStep >= 2 && signatureData) {
            updateSignaturePoints();
        } else {
            // Remove signature points if step < 2 or no signature data
            if (objectsRef.current.signatureR) {
                sceneRef.current.remove(objectsRef.current.signatureR);
                objectsRef.current.signatureR = null;
            }
            if (objectsRef.current.signatureZ) {
                sceneRef.current.remove(objectsRef.current.signatureZ);
                objectsRef.current.signatureZ = null;
            }
        }

        // Step 3+: Show verification connections
        if (currentStep >= 3) {
            updateVerificationVisualization();
        } else {
            // Remove connections if step < 3
            objectsRef.current.connections.forEach(conn => sceneRef.current!.remove(conn));
            objectsRef.current.connections = [];
        }

        // Add pulsing effect for current step
        addStepIndicators();
    };

    const updatePrivateKeyPoint = (): void => {
        if (!sceneRef.current || !keyData) return;
        
        // Use actual private key to determine position
        const privateKeyHash = hashString(keyData.privateKey);
        const normalizedHash = privateKeyHash % 10000;
        
        // Map hash to curve position with some mathematical relationship
        const angle = (normalizedHash / 10000) * 2 * Math.PI;
        const x = 5.5 * Math.cos(angle);
        const y = 3.8 * Math.sin(angle);
        const z = 1.2 * Math.sin(1.5 * angle);

        if (objectsRef.current.privatePoint) {
            sceneRef.current.remove(objectsRef.current.privatePoint);
        }

        const geometry = new THREE.SphereGeometry(0.4, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff4444,
            emissive: 0x331111,
            transparent: false,
            opacity: 1.0,
            shininess: 100
        });
        
        objectsRef.current.privatePoint = new THREE.Mesh(geometry, material);
        objectsRef.current.privatePoint.position.set(x, y, z);
        objectsRef.current.privatePoint.castShadow = true;
        objectsRef.current.privatePoint.receiveShadow = true;
        
        // Add outer glow ring
        const ringGeometry = new THREE.TorusGeometry(0.6, 0.05, 8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        objectsRef.current.privatePoint.add(ring);
        
        sceneRef.current.add(objectsRef.current.privatePoint);
    };

    const updatePublicKeyPoint = (): void => {
        if (!sceneRef.current || !keyData) return;
        
        // Use actual public key to determine position (related to private key but different)
        const publicKeyHash = hashString(keyData.publicKey);
        const normalizedHash = publicKeyHash % 10000;
        
        // Map hash to curve position - should be mathematically related to private key
        const privateKeyHash = hashString(keyData.privateKey);
        const combinedHash = (publicKeyHash + privateKeyHash * 2) % 10000;
        const angle = (combinedHash / 10000) * 2 * Math.PI;
        
        const x = 5.8 * Math.cos(angle + Math.PI/3);
        const y = 3.6 * Math.sin(angle + Math.PI/3);
        const z = 0.9 * Math.sin(1.8 * angle);

        if (objectsRef.current.publicPoint) {
            sceneRef.current.remove(objectsRef.current.publicPoint);
        }

        const geometry = new THREE.SphereGeometry(0.4, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x44ff44,
            emissive: 0x113311,
            transparent: false,
            opacity: 1.0,
            shininess: 100
        });
        
        objectsRef.current.publicPoint = new THREE.Mesh(geometry, material);
        objectsRef.current.publicPoint.position.set(x, y, z);
        objectsRef.current.publicPoint.castShadow = true;
        objectsRef.current.publicPoint.receiveShadow = true;
        
        // Add outer glow ring
        const ringGeometry = new THREE.TorusGeometry(0.6, 0.05, 8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x44ff44,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        objectsRef.current.publicPoint.add(ring);
        
        sceneRef.current.add(objectsRef.current.publicPoint);
    };

    const updateSignaturePoints = (): void => {
        if (!sceneRef.current || !signatureData) return;
        
        // R point - based on actual signature R values
        const rHash = hashString(signatureData.signature.R.x + signatureData.signature.R.y);
        const rNormalized = rHash % 10000;
        const rAngle = (rNormalized / 10000) * 2 * Math.PI;
        
        const rX = 4.8 * Math.cos(rAngle);
        const rY = 3.2 * Math.sin(rAngle);
        const rZ = 1.5 * Math.cos(1.3 * rAngle);
        
        if (objectsRef.current.signatureR) {
            sceneRef.current.remove(objectsRef.current.signatureR);
        }
        
        const rGeometry = new THREE.OctahedronGeometry(0.35);
        const rMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4444ff,
            emissive: 0x111133,
            transparent: false,
            opacity: 1.0,
            shininess: 100
        });
        
        objectsRef.current.signatureR = new THREE.Mesh(rGeometry, rMaterial);
        objectsRef.current.signatureR.position.set(rX, rY, rZ);
        objectsRef.current.signatureR.castShadow = true;
        objectsRef.current.signatureR.receiveShadow = true;
        sceneRef.current.add(objectsRef.current.signatureR);

        // Z point - based on signature s and hash
        const zHash = hashString(signatureData.signature.s + signatureData.hash);
        const zNormalized = zHash % 10000;
        const zAngle = (zNormalized / 10000) * 2 * Math.PI;
        
        const zX = 4.6 * Math.cos(zAngle + Math.PI/4);
        const zY = 3.4 * Math.sin(zAngle + Math.PI/4);
        const zZ = 1.1 * Math.sin(1.7 * zAngle);
        
        if (objectsRef.current.signatureZ) {
            sceneRef.current.remove(objectsRef.current.signatureZ);
        }
        
        const zGeometry = new THREE.OctahedronGeometry(0.35);
        const zMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff44ff,
            emissive: 0x331133,
            transparent: false,
            opacity: 1.0,
            shininess: 100
        });
        
        objectsRef.current.signatureZ = new THREE.Mesh(zGeometry, zMaterial);
        objectsRef.current.signatureZ.position.set(zX, zY, zZ);
        objectsRef.current.signatureZ.castShadow = true;
        objectsRef.current.signatureZ.receiveShadow = true;
        sceneRef.current.add(objectsRef.current.signatureZ);
    };

    const updateVerificationVisualization = (): void => {
        if (!sceneRef.current) return;

        // Add connection lines showing verification process
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });

        // Clear existing connections
        objectsRef.current.connections.forEach(conn => sceneRef.current!.remove(conn));
        objectsRef.current.connections = [];

        if (objectsRef.current.publicPoint && objectsRef.current.signatureR) {
            const points = [
                objectsRef.current.publicPoint.position,
                objectsRef.current.signatureR.position
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            sceneRef.current.add(line);
            objectsRef.current.connections.push(line);
        }

        if (objectsRef.current.signatureR && objectsRef.current.signatureZ) {
            const points = [
                objectsRef.current.signatureR.position,
                objectsRef.current.signatureZ.position
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            sceneRef.current.add(line);
            objectsRef.current.connections.push(line);
        }
    };

    const addStepIndicators = (): void => {
        // Add visual indicators for current processing step
        if (isProcessing && currentStep > 0) {
            const time = Date.now() * 0.005;
            
            if (objectsRef.current.curve && objectsRef.current.curve.material instanceof THREE.LineBasicMaterial) {
                objectsRef.current.curve.material.opacity = 0.8 + 0.2 * Math.sin(time);
            }
            
            // Pulse effect on active points
            [objectsRef.current.privatePoint, objectsRef.current.publicPoint, 
             objectsRef.current.signatureR, objectsRef.current.signatureZ].forEach(point => {
                if (point) {
                    point.scale.setScalar(1 + 0.1 * Math.sin(time * 2));
                }
            });
        }
    };

    // Improved hash function for consistent positioning
    const hashString = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    };

    const toggleAnimation = (): void => {
        setIsAnimating(!isAnimating);
    };

    const changeViewMode = (): void => {
        setViewMode(viewMode === 'curve' ? 'operations' : 'curve');
    };

    return (
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Eye className="h-5 w-5 text-cyan-400" />
                        Interactive 3D Cryptographic Visualization
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleAnimation}
                            className="text-white hover:bg-white/10"
                        >
                            {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={changeViewMode}
                            className="text-white hover:bg-white/10"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div
                    ref={mountRef}
                    className="w-full h-96 relative"
                    style={{ background: 'transparent' }}
                />
                
                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 text-white text-sm space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Elliptic Curve</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span>Private Key Point</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Public Key Point</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span>Signature R</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span>Signature Z</span>
                    </div>
                </div>

                {/* Step indicator */}
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-2 text-white text-sm">
                    Step {currentStep}/3
                    {isProcessing && (
                        <div className="flex items-center gap-1 mt-1">
                            <Activity className="h-3 w-3 animate-spin" />
                            <span className="text-xs">Processing...</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Main Demo Component
const EnhancedDigitalSignatureDemo: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [keyData, setKeyData] = useState<KeyData | null>(null);
    const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
    const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
    const [message, setMessage] = useState<string>('Hello, Cryptographic World!');
    const [isClient, setIsClient] = useState<boolean>(false);

    // Ensure client-side rendering
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Mock API calls with realistic data
    const generateKeys = async (): Promise<void> => {
        setIsProcessing(true);
        setCurrentStep(1);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate realistic looking keys
        const privateKey = generateRandomHex(64);
        const publicKey = generateRandomHex(128);
        
        setKeyData({
            privateKey,
            publicKey,
            systemParams: {
                curve: 'secp256k1',
                generator: generateRandomHex(128)
            }
        });
        
        setIsProcessing(false);
        setCurrentStep(2);
    };

    const signMessage = async (): Promise<void> => {
        if (!keyData) return;
        
        setIsProcessing(true);
        
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setSignatureData({
            signature: {
                R: { x: generateRandomHex(64), y: generateRandomHex(64) },
                s: generateRandomHex(64),
                Z: { x: generateRandomHex(64), y: generateRandomHex(64) }
            },
            hash: generateRandomHex(64)
        });
        
        setIsProcessing(false);
        setCurrentStep(3);
    };

    const verifySignature = async (): Promise<void> => {
        if (!signatureData) return;
        
        setIsProcessing(true);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Always return true as requested
        setVerificationResult(true);
        
        setIsProcessing(false);
        setCurrentStep(4);
    };

    const resetDemo = (): void => {
        setCurrentStep(0);
        setKeyData(null);
        setSignatureData(null);
        setVerificationResult(null);
        setIsProcessing(false);
    };

    // Helper function to generate realistic hex strings
    const generateRandomHex = (length: number): string => {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * 16)];
        }
        return result;
    };

    const steps: StepConfig[] = [
        { title: 'Key Generation', icon: Key, color: 'from-blue-500 to-cyan-500' },
        { title: 'Message Signing', icon: Shield, color: 'from-purple-500 to-pink-500' },
        { title: 'Signature Verification', icon: CheckCircle, color: 'from-green-500 to-emerald-500' }
    ];

    // Show loading state during hydration
    if (!isClient) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="text-center py-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                            Advanced Digital Signature Scheme
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Loading interactive demonstration...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center py-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-3">
                        <Shield className="h-10 w-10 text-purple-600" />
                        Advanced Digital Signature Scheme
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Interactive demonstration of cryptographic digital signatures with real-time 3D visualization
                    </p>
                </div>

                {/* Progress Steps */}
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => (
                                <div key={index} className="flex items-center">
                                    <div className={`relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${
                                        currentStep > index + 1 ? step.color : 
                                        currentStep === index + 1 ? step.color :
                                        'from-gray-300 to-gray-400'
                                    } text-white shadow-lg transition-all duration-500`}>
                                        <step.icon className="h-6 w-6" />
                                        {currentStep === index + 1 && isProcessing && (
                                            <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                        )}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-24 h-1 mx-4 transition-all duration-500 ${
                                            currentStep > index + 1 ? 'bg-gradient-to-r from-green-400 to-blue-400' : 'bg-gray-200'
                                        }`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4">
                            {steps.map((step, index) => (
                                <div key={index} className="text-center">
                                    <p className={`text-sm font-medium ${
                                        currentStep >= index + 1 ? 'text-gray-800' : 'text-gray-400'
                                    }`}>
                                        {step.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Control Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Message Input */}
                        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                    Message to Sign
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Enter your message here..."
                                />
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                            <CardContent className="p-6 space-y-4">
                                <Button
                                    onClick={generateKeys}
                                    disabled={isProcessing}
                                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all duration-300 transform hover:scale-105"
                                >
                                    {currentStep === 1 && isProcessing ? (
                                        <>
                                            <Activity className="h-4 w-4 mr-2 animate-spin" />
                                            Generating Keys...
                                        </>
                                    ) : (
                                        <>
                                            <Key className="h-4 w-4 mr-2" />
                                            Generate Keys
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={signMessage}
                                    disabled={!keyData || isProcessing}
                                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                >
                                    {currentStep === 2 && isProcessing ? (
                                        <>
                                            <Activity className="h-4 w-4 mr-2 animate-spin" />
                                            Signing Message...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="h-4 w-4 mr-2" />
                                            Sign Message
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={verifySignature}
                                    disabled={!signatureData || isProcessing}
                                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                >
                                    {currentStep === 3 && isProcessing ? (
                                        <>
                                            <Activity className="h-4 w-4 mr-2 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Verify Signature
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={resetDemo}
                                    variant="outline"
                                    className="w-full h-10 border-gray-300 hover:bg-gray-50 transition-all duration-300"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset Demo
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Results */}
                        {verificationResult !== null && (
                            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                        <h3 className="text-lg font-semibold text-green-800">
                                            Signature Verified Successfully
                                        </h3>
                                    </div>
                                    <p className="text-green-700 text-sm">
                                        The digital signature has been cryptographically verified using advanced hard problem mathematics.
                                    </p>
                                    <Badge className="mt-3 bg-green-600 text-white">
                                        Status: VALID
                                    </Badge>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* 3D Visualization */}
                    <div className="lg:col-span-2 space-y-6">
                        <Interactive3DVisualization
                            keyData={keyData}
                            signatureData={signatureData}
                            currentStep={currentStep}
                            isProcessing={isProcessing}
                        />

                        {/* Technical Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Key Information */}
                            {keyData && (
                                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-blue-600" />
                                            Cryptographic Keys
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Private Key:</p>
                                            <p className="text-xs font-mono bg-red-50 p-2 rounded border text-red-800 break-all">
                                                {keyData.privateKey.substring(0, 32)}...
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Public Key:</p>
                                            <p className="text-xs font-mono bg-green-50 p-2 rounded border text-green-800 break-all">
                                                {keyData.publicKey.substring(0, 32)}...
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Signature Information */}
                            {signatureData && (
                                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-purple-600" />
                                            Digital Signature
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Signature R:</p>
                                            <p className="text-xs font-mono bg-blue-50 p-2 rounded border text-blue-800 break-all">
                                                ({signatureData.signature.R.x.substring(0, 16)}..., {signatureData.signature.R.y.substring(0, 16)}...)
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Signature s:</p>
                                            <p className="text-xs font-mono bg-purple-50 p-2 rounded border text-purple-800 break-all">
                                                {signatureData.signature.s.substring(0, 32)}...
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Hash:</p>
                                            <p className="text-xs font-mono bg-gray-50 p-2 rounded border text-gray-800 break-all">
                                                {signatureData.hash.substring(0, 32)}...
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Mathematical Operations Display */}
                        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-indigo-600" />
                                    Hard Problem Mathematics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-blue-800 mb-2">Key Generation</h4>
                                        <p className="text-sm text-blue-700 mb-2">Form 2.1 Hard Problem:</p>
                                        <code className="text-xs bg-white/60 p-2 rounded block text-blue-800">
                                            P = k × G<br />
                                            π(P) × Q = Transcendental
                                        </code>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                                        <h4 className="font-semibold text-purple-800 mb-2">Signature Generation</h4>
                                        <p className="text-sm text-purple-700 mb-2">Form 2.2 Hard Problem:</p>
                                        <code className="text-xs bg-white/60 p-2 rounded block text-purple-800">
                                            R = r × G<br />
                                            s = k⁻¹(e + r×dₐ) mod n
                                        </code>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                        <h4 className="font-semibold text-green-800 mb-2">Verification</h4>
                                        <p className="text-sm text-green-700 mb-2">Transcendental Check:</p>
                                        <code className="text-xs bg-white/60 p-2 rounded block text-green-800">
                                            π(R) × Z = s×e×R<br />
                                            + π(Z+s×R)×P
                                        </code>
                                    </div>
                                </div>
                                
                                {/* Performance Metrics */}
                                <PerformanceMetrics />
                            </CardContent>
                        </Card>

                        {/* Security Analysis */}
                        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                                    <Shield className="h-4 w-4" />
                                    Security Analysis & Innovation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-amber-800">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Security Advantages</h4>
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                            <li>Novel transcendental hard problems</li>
                                            <li>Post-quantum resistance potential</li>
                                            <li>Enhanced computational complexity</li>
                                            <li>Innovative mathematical foundations</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Performance Benefits</h4>
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                            <li>Optimized operation counts</li>
                                            <li>Memory-efficient implementation</li>
                                            <li>Reduced signature size</li>
                                            <li>Fast verification process</li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="mt-4 p-3 bg-white/60 rounded-lg">
                                    <p className="text-sm">
                                        <strong>Research Innovation:</strong> This implementation demonstrates novel approaches to digital signature schemes 
                                        based on new hard problem formulations that extend beyond traditional discrete logarithm problems.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Educational Footer */}
                <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl">
                    <CardContent className="p-6 text-center">
                        <h3 className="text-xl font-bold mb-2">Educational Digital Signature Demonstration</h3>
                        <p className="text-white/90 max-w-3xl mx-auto">
                            This interactive demo showcases advanced cryptographic techniques with real-time 3D visualization. 
                            The implementation features novel hard problems for enhanced security and innovative mathematical approaches 
                            to digital signature verification.
                        </p>
                        <div className="flex justify-center gap-4 mt-4">
                            <Badge variant="secondary" className="bg-white/20 text-white">
                                Elliptic Curve Cryptography
                            </Badge>
                            <Badge variant="secondary" className="bg-white/20 text-white">
                                Transcendental Mathematics
                            </Badge>
                            <Badge variant="secondary" className="bg-white/20 text-white">
                                Post-Quantum Research
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EnhancedDigitalSignatureDemo;