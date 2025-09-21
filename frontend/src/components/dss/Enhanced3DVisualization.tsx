import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Play,
    Pause,
    RotateCcw,
    Zap,
    Eye,
    Settings,
    Maximize
} from 'lucide-react';
import * as THREE from 'three';

interface EllipticCurvePoint {
    x: number;
    y: number;
    infinity: boolean;
}

interface VisualizationProps {
    keyData?: {
        privateKey: string;
        publicKey: string;
    };
    signatureData?: {
        signature: {
            R: EllipticCurvePoint;
            s: string;
            Z: EllipticCurvePoint;
        };
    };
    currentStep: number;
    isProcessing: boolean;
}

const Enhanced3DVisualization: React.FC<VisualizationProps> = ({
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

    // Visualization state
    const [isAnimating, setIsAnimating] = useState(true);
    const [visualizationMode, setVisualizationMode] = useState<'curve' | 'operations' | 'signature'>('curve');
    const [showGrid, setShowGrid] = useState(true);
    const [animationSpeed, setAnimationSpeed] = useState(1);

    // Points and objects references
    const pointsRef = useRef<{
        secretGenerator?: THREE.Mesh;
        publicPoint?: THREE.Mesh;
        signatureR?: THREE.Mesh;
        signatureZ?: THREE.Mesh;
        curve?: THREE.Mesh | THREE.Line;
        connections?: THREE.Group;
    }>({});

    // Initialize Three.js scene
    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(15, 10, 15);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            precision: 'highp'
        });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        rendererRef.current = renderer;

        mountRef.current.appendChild(renderer.domElement);

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0x64748b, 0.5, 100);
        pointLight.position.set(-10, 10, 10);
        scene.add(pointLight);

        // Create grid
        if (showGrid) {
            const gridHelper = new THREE.GridHelper(20, 20, 0xe2e8f0, 0xf1f5f9);
            scene.add(gridHelper);
        }

        // Create coordinate axes
        const axesHelper = new THREE.AxesHelper(10);
        scene.add(axesHelper);

        // Create elliptic curve visualization
        createEllipticCurve(scene);

        // Animation loop
        const animate = () => {
            if (!isAnimating) return;

            animationRef.current = requestAnimationFrame(animate);

            // Rotate camera around the scene
            const time = Date.now() * 0.0005 * animationSpeed;

            if (visualizationMode === 'curve') {
                camera.position.x = Math.cos(time) * 20;
                camera.position.z = Math.sin(time) * 20;
                camera.lookAt(0, 0, 0);
            }

            // Animate points
            animatePoints();

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!mountRef.current || !camera || !renderer) return;

            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [showGrid, isAnimating, visualizationMode, animationSpeed]);

    // Create elliptic curve surface
    const createEllipticCurve = (scene: THREE.Scene) => {
        // Create a simplified elliptic curve surface for visualization using BufferGeometry
        const createParametricGeometry = (func: (u: number, v: number) => THREE.Vector3, slices: number, stacks: number) => {
            const geometry = new THREE.BufferGeometry();
            const vertices: number[] = [];
            const indices: number[] = [];
            const normals: number[] = [];
            const uvs: number[] = [];

            // Generate vertices
            for (let i = 0; i <= stacks; i++) {
                const v = i / stacks;
                for (let j = 0; j <= slices; j++) {
                    const u = j / slices;
                    const point = func(u, v);

                    vertices.push(point.x, point.y, point.z);
                    uvs.push(u, v);

                    // Simple normal calculation (pointing upward for now)
                    normals.push(0, 1, 0);
                }
            }

            // Generate indices for triangles
            for (let i = 0; i < stacks; i++) {
                for (let j = 0; j < slices; j++) {
                    const a = i * (slices + 1) + j;
                    const b = a + slices + 1;
                    const c = a + 1;
                    const d = b + 1;

                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }

            geometry.setIndex(indices);
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.computeVertexNormals(); // Compute proper normals

            return geometry;
        };

        // Parametric function for elliptic curve surface
        const ellipticCurveFunction = (u: number, v: number): THREE.Vector3 => {
            // Parametric representation of elliptic curve surface
            const x = (u - 0.5) * 20;
            const z = (v - 0.5) * 20;

            // Simplified elliptic curve: y² = x³ + ax + b
            const a = -3;
            const b = 5;
            const discriminant = x * x * x + a * x + b;

            // Handle negative discriminant gracefully
            let y = 0;
            if (discriminant >= 0) {
                y = Math.sqrt(discriminant) * 0.5;
            } else {
                y = -Math.sqrt(-discriminant) * 0.5;
            }

            // Add some wave-like variation for visual appeal
            y += Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.2;

            return new THREE.Vector3(x, y, z);
        };

        const geometry = createParametricGeometry(ellipticCurveFunction, 100, 100);

        const material = new THREE.MeshLambertMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            wireframe: false
        });

        const curveMesh = new THREE.Mesh(geometry, material);
        scene.add(curveMesh);
        pointsRef.current.curve = curveMesh;

        // Create wireframe overlay
        const wireframeGeometry = geometry.clone();
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x1e40af,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });
        const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        scene.add(wireframeMesh);
    };

    // Create cryptographic points
    const createCryptographicPoints = () => {
        if (!sceneRef.current) return;

        // Clear existing points
        Object.values(pointsRef.current).forEach(obj => {
            if (obj && obj !== pointsRef.current.curve) {
                sceneRef.current?.remove(obj);
            }
        });

        // Secret Generator Point (Private Key)
        if (keyData) {
            const privateKeyData = JSON.parse(keyData.privateKey);

            // Create secret generator point
            const secretGeometry = new THREE.SphereGeometry(0.5, 32, 32);
            const secretMaterial = new THREE.MeshPhongMaterial({
                color: 0x10b981,
                emissive: 0x064e3b,
                emissiveIntensity: 0.2
            });
            const secretPoint = new THREE.Mesh(secretGeometry, secretMaterial);

            // Position based on actual coordinates (scaled for visualization)
            const scaleFactor = 0.00000001;
            secretPoint.position.set(
                (privateKeyData.x * scaleFactor) % 10 - 5,
                2,
                (privateKeyData.y * scaleFactor) % 10 - 5
            );

            sceneRef.current.add(secretPoint);
            pointsRef.current.secretGenerator = secretPoint;

            // Add label
            const secretLabel = createTextLabel('G (Secret)', 0x10b981);
            secretLabel.position.copy(secretPoint.position);
            secretLabel.position.y += 1;
            sceneRef.current.add(secretLabel);

            // Public Point
            const publicKeyData = JSON.parse(keyData.publicKey);
            const publicGeometry = new THREE.SphereGeometry(0.4, 32, 32);
            const publicMaterial = new THREE.MeshPhongMaterial({
                color: 0x3b82f6,
                emissive: 0x1e3a8a,
                emissiveIntensity: 0.2
            });
            const publicPoint = new THREE.Mesh(publicGeometry, publicMaterial);

            publicPoint.position.set(
                (publicKeyData.x * scaleFactor) % 10 - 5,
                1.5,
                (publicKeyData.y * scaleFactor) % 10 - 5
            );

            sceneRef.current.add(publicPoint);
            pointsRef.current.publicPoint = publicPoint;

            // Add label
            const publicLabel = createTextLabel('P (Public)', 0x3b82f6);
            publicLabel.position.copy(publicPoint.position);
            publicLabel.position.y += 1;
            sceneRef.current.add(publicLabel);

            // Connection line showing relationship
            const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
                secretPoint.position,
                publicPoint.position
            ]);
            const connectionMaterial = new THREE.LineBasicMaterial({
                color: 0x6366f1,
                transparent: true,
                opacity: 0.6
            });
            const connectionLine = new THREE.Line(connectionGeometry, connectionMaterial);
            sceneRef.current.add(connectionLine);
        }

        // Signature Points
        if (signatureData) {
            const { R, Z } = signatureData.signature;
            const scaleFactor = 0.00000001;

            // R Point
            const rGeometry = new THREE.SphereGeometry(0.3, 32, 32);
            const rMaterial = new THREE.MeshPhongMaterial({
                color: 0x8b5cf6,
                emissive: 0x581c87,
                emissiveIntensity: 0.3
            });
            const rPoint = new THREE.Mesh(rGeometry, rMaterial);

            rPoint.position.set(
                (R.x * scaleFactor) % 8 - 4,
                3,
                (R.y * scaleFactor) % 8 - 4
            );

            sceneRef.current.add(rPoint);
            pointsRef.current.signatureR = rPoint;

            // R Label
            const rLabel = createTextLabel('R', 0x8b5cf6);
            rLabel.position.copy(rPoint.position);
            rLabel.position.y += 0.8;
            sceneRef.current.add(rLabel);

            // Z Point
            const zGeometry = new THREE.SphereGeometry(0.3, 32, 32);
            const zMaterial = new THREE.MeshPhongMaterial({
                color: 0xef4444,
                emissive: 0x991b1b,
                emissiveIntensity: 0.3
            });
            const zPoint = new THREE.Mesh(zGeometry, zMaterial);

            zPoint.position.set(
                (Z.x * scaleFactor) % 8 - 4,
                2.5,
                (Z.y * scaleFactor) % 8 - 4
            );

            sceneRef.current.add(zPoint);
            pointsRef.current.signatureZ = zPoint;

            // Z Label
            const zLabel = createTextLabel('Z', 0xef4444);
            zLabel.position.copy(zPoint.position);
            zLabel.position.y += 0.8;
            sceneRef.current.add(zLabel);

            // Signature connections
            if (pointsRef.current.secretGenerator) {
                const rConnection = new THREE.BufferGeometry().setFromPoints([
                    pointsRef.current.secretGenerator.position,
                    rPoint.position
                ]);
                const rConnectionLine = new THREE.Line(
                    rConnection,
                    new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.4 })
                );
                sceneRef.current.add(rConnectionLine);

                const zConnection = new THREE.BufferGeometry().setFromPoints([
                    pointsRef.current.secretGenerator.position,
                    zPoint.position
                ]);
                const zConnectionLine = new THREE.Line(
                    zConnection,
                    new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.4 })
                );
                sceneRef.current.add(zConnectionLine);
            }
        }
    };

    // Create text labels
    const createTextLabel = (text: string, color: number) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = 'Bold 20px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 7);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);

        return sprite;
    };

    // Animate points with pulsing and floating effects
    const animatePoints = () => {
        const time = Date.now() * 0.002 * animationSpeed;

        Object.values(pointsRef.current).forEach((point, index) => {
            if (point && point !== pointsRef.current.curve) {
                // Pulsing effect
                const pulse = Math.sin(time + index) * 0.1 + 1;
                point.scale.setScalar(pulse);

                // Floating effect
                if (point.position) {
                    const originalY = point.position.y;
                    point.position.y = originalY + Math.sin(time * 2 + index) * 0.2;
                }
            }
        });
    };

    // Update visualization when data changes
    useEffect(() => {
        createCryptographicPoints();
    }, [keyData, signatureData, currentStep]);

    // Control functions
    const toggleAnimation = () => {
        setIsAnimating(!isAnimating);
        if (!isAnimating && animationRef.current === null) {
            const animate = () => {
                animationRef.current = requestAnimationFrame(animate);
                if (rendererRef.current && cameraRef.current && sceneRef.current) {
                    const time = Date.now() * 0.0005 * animationSpeed;

                    if (visualizationMode === 'curve' && cameraRef.current) {
                        cameraRef.current.position.x = Math.cos(time) * 20;
                        cameraRef.current.position.z = Math.sin(time) * 20;
                        cameraRef.current.lookAt(0, 0, 0);
                    }

                    animatePoints();
                    rendererRef.current.render(sceneRef.current, cameraRef.current);
                }
            };
            animate();
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    };

    const resetCamera = () => {
        if (cameraRef.current) {
            cameraRef.current.position.set(15, 10, 15);
            cameraRef.current.lookAt(0, 0, 0);
        }
    };

    const switchVisualizationMode = (mode: 'curve' | 'operations' | 'signature') => {
        setVisualizationMode(mode);
        if (cameraRef.current) {
            switch (mode) {
                case 'curve':
                    cameraRef.current.position.set(15, 10, 15);
                    break;
                case 'operations':
                    cameraRef.current.position.set(0, 15, 10);
                    break;
                case 'signature':
                    cameraRef.current.position.set(10, 5, 10);
                    break;
            }
            cameraRef.current.lookAt(0, 0, 0);
        }
    };

    return (
        <Card className="h-[600px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    3D Elliptic Curve Cryptography Visualization
                </CardTitle>
                <CardDescription>
                    Interactive 3D visualization of elliptic curve operations, secret generator points, and signature components
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Controls */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleAnimation}
                            className="flex items-center gap-1"
                        >
                            {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isAnimating ? 'Pause' : 'Play'}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetCamera}
                            className="flex items-center gap-1"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset View
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowGrid(!showGrid)}
                            className="flex items-center gap-1"
                        >
                            <Settings className="h-4 w-4" />
                            Grid: {showGrid ? 'On' : 'Off'}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={visualizationMode === 'curve' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => switchVisualizationMode('curve')}
                        >
                            Curve
                        </Button>
                        <Button
                            variant={visualizationMode === 'operations' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => switchVisualizationMode('operations')}
                        >
                            Operations
                        </Button>
                        <Button
                            variant={visualizationMode === 'signature' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => switchVisualizationMode('signature')}
                        >
                            Signature
                        </Button>
                    </div>
                </div>

                <Separator className="mb-4" />

                {/* 3D Visualization Container */}
                <div
                    ref={mountRef}
                    className="w-full h-[450px] border rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden"
                    style={{ minHeight: '450px' }}
                />

                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Secret Generator G</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Public Point P</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>Signature Point R</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Signature Point Z</span>
                    </div>
                </div>

                {/* Status */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                        <strong>Current Step:</strong> {
                            currentStep === 1 ? 'Generate secret generator point G and public point P' :
                                currentStep === 2 ? 'Compute signature points R and Z using secret generator' :
                                    currentStep === 3 ? 'Verify signature using transcendental equations' :
                                        'Cryptographic process complete'
                        }
                    </div>
                    {isProcessing && (
                        <div className="text-xs text-blue-600 mt-1">
                            ⚡ Processing cryptographic operations...
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default Enhanced3DVisualization;