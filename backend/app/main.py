from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
import json

from app.crypto.finite_field_dss import FiniteFieldDSS
from app.crypto.elliptic_curve_dss import EllipticCurveDSS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Advanced Digital Signature Scheme API",
    description="API for Digital Signature Schemes based on New Hard Problems - Finite Field and Elliptic Curve",
    version="2.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class KeyGenerationRequest(BaseModel):
    bit_length: int = 256
    scheme_type: str = "elliptic_curve"  # "finite_field" or "elliptic_curve"

class SigningRequest(BaseModel):
    message: str
    private_key: str
    system_params: Dict[str, Any]
    scheme_type: str = "elliptic_curve"

class VerificationRequest(BaseModel):
    message: str
    signature: Dict[str, Any]
    public_key: str
    system_params: Dict[str, Any]
    scheme_type: str = "elliptic_curve"

class HardProblemDemoRequest(BaseModel):
    problem_type: str  # "1.1", "1.2", "2.1", "2.2"
    parameters: Dict[str, Any]

# Global instances for demo
dss_instances = {}

@app.post("/api/generate-keys")
async def generate_keys(request: KeyGenerationRequest):
    try:
        logger.info(f"Generating keys for {request.scheme_type} with {request.bit_length} bits")
        
        if request.scheme_type == "elliptic_curve":
            # New elliptic curve implementation
            dss = EllipticCurveDSS(bit_length=request.bit_length)
            private_key_point, public_key_point = dss.key_generation()
            
            # Store instance for later use
            session_id = f"ec_{hash(str(private_key_point.x))}"
            dss_instances[session_id] = dss
            
            # Get educational information about hard problems
            hard_problem_info = dss.get_hard_problem_demonstrations()
            
            return {
                "success": True,
                "session_id": session_id,
                "private_key": json.dumps({
                    "x": private_key_point.x,
                    "y": private_key_point.y,
                    "infinity": private_key_point.infinity
                }),
                "public_key": json.dumps({
                    "x": public_key_point.x, 
                    "y": public_key_point.y,
                    "infinity": public_key_point.infinity
                }),
                "system_params": {
                    "scheme_type": "elliptic_curve",
                    "curve_params": dss.intermediate_values["curve_params"],
                    "bit_length": request.bit_length
                },
                "performance_metrics": dss.get_performance_metrics(),
                "intermediate_values": dss.get_intermediate_values(),
                "hard_problem_demonstrations": hard_problem_info,
                "educational_info": {
                    "key_generation_process": {
                        "step_1": "Generate elliptic curve parameters E(F_p): y² = x³ + ax + b",
                        "step_2": "Choose secret point G of prime order q on curve", 
                        "step_3": "Extract x_G (x-coordinate of secret point G)",
                        "step_4": "Compute public key P = (-x_G) × G",
                        "innovation": "Private key is a POINT, not just a scalar"
                    },
                    "security_explanation": {
                        "hard_problem": "Given P and curve, find secret generator point G",
                        "form_2_1": "P = x_G × G (secret point problem)",
                        "resistance": "Traditional ECDLP methods don't apply",
                        "complexity": "O(2^n) brute force only"
                    }
                }
            }
            
        elif request.scheme_type == "finite_field":
            # Original finite field implementation
            dss = FiniteFieldDSS(bit_length=request.bit_length)
            private_key, public_key = dss.key_generation()
            
            session_id = f"ff_{hash(str(private_key))}"
            dss_instances[session_id] = dss
            
            hard_problem_info = dss.get_hard_problem_demonstrations()
            
            return {
                "success": True,
                "session_id": session_id,
                "private_key": str(private_key),
                "public_key": str(public_key),
                "system_params": {
                    "scheme_type": "finite_field",
                    "p": str(dss.params.p),
                    "q": str(dss.params.q),
                    "bit_length": request.bit_length
                },
                "performance_metrics": dss.get_performance_metrics(),
                "intermediate_values": dss.get_intermediate_values(),
                "hard_problem_demonstrations": hard_problem_info,
                "educational_info": {
                    "key_generation_process": {
                        "step_1": "Choose large primes p, q where q divides (p-1)",
                        "step_2": "Select random private key x in [1, q-1]", 
                        "step_3": "Compute y = x^(-x) mod p (hard problem form)",
                        "innovation": "Private key appears in both base and exponent"
                    }
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Scheme type must be 'elliptic_curve' or 'finite_field'")
            
    except Exception as e:
        logger.error(f"Key generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sign")
async def sign_message(request: SigningRequest):
    try:
        logger.info(f"Signing message with {request.scheme_type}")
        
        if request.scheme_type == "elliptic_curve":
            # Elliptic curve signing
            dss = EllipticCurveDSS(bit_length=None)
            
            # Reconstruct curve parameters and keys
            curve_params = request.system_params["curve_params"]
            dss.params = dss._generate_curve_params()  # Use standard parameters
            
            # Parse private key point
            private_key_data = json.loads(request.private_key)
            from app.crypto.elliptic_curve_dss import EllipticCurvePoint
            private_key_point = EllipticCurvePoint(
                private_key_data["x"], 
                private_key_data["y"],
                private_key_data["infinity"]
            )
            
            # Sign the message
            signature = dss.sign_message(request.message, private_key_point)
            R, s, Z = signature
            
            return {
                "success": True,
                "signature": {
                    "R": {"x": R.x, "y": R.y, "infinity": R.infinity},
                    "s": str(s),
                    "Z": {"x": Z.x, "y": Z.y, "infinity": Z.infinity}
                },
                "performance_metrics": dss.get_performance_metrics(),
                "intermediate_values": dss.get_intermediate_values(),
                "educational_info": {
                    "signing_process": {
                        "step_1": "Choose random k, compute R = k × G_secret",
                        "step_2": "Choose random u, compute Z = u × G_secret", 
                        "step_3": "Compute e = H(x_R || M) (hash with R's x-coordinate)",
                        "step_4": "Solve transcendental equation for s component",
                        "step_5": "Final signature: (R, s, Z) - two points and one scalar"
                    },
                    "security_explanation": {
                        "component_linkage": "All components linked through hard problem equations",
                        "forgery_resistance": "Requires solving Form 2.1 and 2.2 simultaneously",
                        "innovation": "Signature contains elliptic curve points, not just scalars"
                    }
                }
            }
            
        elif request.scheme_type == "finite_field":
            # Original finite field signing - FIX THE PARAMETERS ISSUE
            dss = FiniteFieldDSS(bit_length=None)
            
            # Properly reconstruct the parameters from the request
            from app.crypto.finite_field_dss import FiniteFieldParams
            dss.params = FiniteFieldParams(
                p=int(request.system_params["p"]),
                q=int(request.system_params["q"]),
                bit_length=int(request.system_params["bit_length"])
            )
            
            signature = dss.sign_message(request.message, int(request.private_key))
            
            return {
                "success": True,
                "signature": {
                    "r": str(signature[0]),
                    "s": str(signature[1]),
                    "z": str(signature[2])
                },
                "performance_metrics": dss.get_performance_metrics(),
                "intermediate_values": dss.get_intermediate_values(),
                "educational_info": {
                    "signing_process": {
                        "step_1": "Choose random k, compute r = x^k mod p",
                        "step_2": "Choose random u, compute z = x^u mod p", 
                        "step_3": "Compute e = H(r || M) (hash with r and message)",
                        "step_4": "Solve transcendental equation for s component",
                        "step_5": "Final signature: (r, s, z) - three linked scalars"
                    },
                    "security_explanation": {
                        "component_linkage": "All components use private key in exponential positions",
                        "forgery_resistance": "Requires solving Forms 1.1 and 1.2 simultaneously",
                        "innovation": "Variables in both base and exponent positions"
                    }
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid scheme type")
            
    except Exception as e:
        logger.error(f"Signing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify")
async def verify_signature(request: VerificationRequest):
    try:
        logger.info(f"Verifying signature with {request.scheme_type}")
        
        if request.scheme_type == "elliptic_curve":
            # Elliptic curve verification
            dss = EllipticCurveDSS(bit_length=None)
            dss.params = dss._generate_curve_params()
            
            # Parse public key point
            public_key_data = json.loads(request.public_key)
            from app.crypto.elliptic_curve_dss import EllipticCurvePoint
            public_key_point = EllipticCurvePoint(
                public_key_data["x"],
                public_key_data["y"], 
                public_key_data["infinity"]
            )
            
            # Parse signature components
            sig_data = request.signature
            R = EllipticCurvePoint(sig_data["R"]["x"], sig_data["R"]["y"], sig_data["R"]["infinity"])
            s = int(sig_data["s"])
            Z = EllipticCurvePoint(sig_data["Z"]["x"], sig_data["Z"]["y"], sig_data["Z"]["infinity"])
            
            signature = (R, s, Z)
            
            # Verify signature
            is_valid = dss.verify_signature(request.message, signature, public_key_point)
            
            return {
                "success": True,
                "valid": is_valid,
                "performance_metrics": dss.get_performance_metrics(),
                "intermediate_values": dss.get_intermediate_values(),
                "educational_info": {
                    "verification_process": {
                        "step_1": "Recompute e = H(x_R || M)",
                        "step_2": "Check transcendental equation: π(R) × Z = s×e×R + π(Z+s×R)×P",
                        "step_3": "Equation uses Form 2.2 hard problem structure",
                        "innovation": "Verification involves elliptic curve point operations"
                    },
                    "security_validation": {
                        "hard_problem_check": "Verifies Form 2.2: x_G × P = k × G relationship",
                        "forgery_detection": "Invalid signatures fail transcendental equation",
                        "mathematical_proof": "Based on impossibility of solving new ECDLP variant"
                    }
                }
            }
            
        elif request.scheme_type == "finite_field":
            # Original finite field verification - FIX THE PARAMETERS ISSUE
            dss = FiniteFieldDSS(bit_length=None)
            
            # Properly reconstruct the parameters from the request
            from app.crypto.finite_field_dss import FiniteFieldParams
            dss.params = FiniteFieldParams(
                p=int(request.system_params["p"]),
                q=int(request.system_params["q"]),
                bit_length=int(request.system_params["bit_length"])
            )
            
            signature = (
                int(request.signature["r"]),
                int(request.signature["s"]),
                int(request.signature["z"])
            )
            
            is_valid = dss.verify_signature(request.message, signature, int(request.public_key))
            
            return {
                "success": True,
                "valid": is_valid,
                "performance_metrics": dss.get_performance_metrics(),
                "intermediate_values": dss.get_intermediate_values(),
                "educational_info": {
                    "verification_process": {
                        "step_1": "Recompute e = H(r || M)",
                        "step_2": "Check transcendental equation: r^s × z^e ≡ y^(s×e) (mod p)",
                        "step_3": "Equation uses Form 1.2 hard problem structure",
                        "innovation": "Verification involves transcendental finite field operations"
                    },
                    "security_validation": {
                        "hard_problem_check": "Verifies Form 1.2: a^x ≡ x^b (mod p) relationship",
                        "forgery_detection": "Invalid signatures fail transcendental equation",
                        "mathematical_proof": "Based on impossibility of solving new DLP variant"
                    }
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid scheme type")
    
    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/hard-problem-demo")
async def demonstrate_hard_problem(request: HardProblemDemoRequest):
    """
    Interactive demonstration of the hard problems used in both schemes
    """
    try:
        logger.info(f"Demonstrating hard problem {request.problem_type}")
        
        if request.problem_type == "1.1":
            # Finite field Form 1.1: x^x ≡ y (mod p)
            return {
                "success": True,
                "problem_type": "1.1",
                "equation": "x^x ≡ y (mod p)",
                "description": "Find x given y and p - variable appears as both base and exponent",
                "example": {
                    "given": "p = 23, y = 8",
                    "find": "x such that x^x ≡ 8 (mod 23)",
                    "brute_force_attempts": [
                        {"x": i, "result": pow(i, i, 23), "match": pow(i, i, 23) == 8}
                        for i in range(1, 12)
                    ]
                },
                "security_analysis": {
                    "complexity": "O(2^n) where n = |p|",
                    "known_attacks": "Only brute force",
                    "resistance": "Transcendental nature prevents algebraic attacks"
                }
            }
            
        elif request.problem_type == "1.2":
            # Finite field Form 1.2: a^x ≡ x^b (mod p)
            return {
                "success": True,
                "problem_type": "1.2", 
                "equation": "a^x ≡ x^b (mod p)",
                "description": "Find x given a, b, p - transcendental equation",
                "example": {
                    "given": "a = 5, b = 3, p = 23",
                    "find": "x such that 5^x ≡ x^3 (mod 23)",
                    "brute_force_attempts": [
                        {"x": i, "left": pow(5, i, 23), "right": pow(i, 3, 23), "match": pow(5, i, 23) == pow(i, 3, 23)}
                        for i in range(1, 12)
                    ]
                },
                "security_analysis": {
                    "complexity": "O(2^n) - currently unsolvable",
                    "innovation": "Variable in multiple exponential positions",
                    "applications": "Used in signature verification algorithm"
                }
            }
            
        elif request.problem_type == "2.1":
            # Elliptic curve Form 2.1: P = x_G × G
            return {
                "success": True,
                "problem_type": "2.1",
                "equation": "P = x_G × G",
                "description": "Find secret generator point G given public point P",
                "example": {
                    "setup": "Elliptic curve E(F_p): y² = x³ + ax + b",
                    "given": "Point P on curve",
                    "find": "Point G such that P = x_G × G where x_G is x-coordinate of G",
                    "difficulty": "Secret generator unknown, not just secret scalar"
                },
                "security_analysis": {
                    "complexity": "O(2^n) - only brute force known",
                    "difference_from_ecdlp": "ECDLP assumes known generator",
                    "innovation": "Generator point itself is secret",
                    "resistance": "Existing ECDLP algorithms don't apply"
                }
            }
            
        elif request.problem_type == "2.2":
            # Elliptic curve Form 2.2: x_G × P = k × G  
            return {
                "success": True,
                "problem_type": "2.2",
                "equation": "x_G × P = k × G",
                "description": "Transcendental verification equation for elliptic curves",
                "example": {
                    "setup": "Given points P, Q on elliptic curve and scalar k",
                    "equation": "x_G × P = k × G",
                    "challenge": "Find G satisfying the relationship",
                    "usage": "Used in signature verification process"
                },
                "security_analysis": {
                    "complexity": "Currently unsolvable except brute force",
                    "structure": "Combines scalar and point operations transcendentally", 
                    "verification": "Enables secure signature verification",
                    "innovation": "X-coordinate used as scalar multiplier"
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Problem type must be '1.1', '1.2', '2.1', or '2.2'")
            
    except Exception as e:
        logger.error(f"Hard problem demonstration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/educational-summary")
async def get_educational_summary():
    """
    Comprehensive educational summary of both DSS schemes and hard problems
    """
    return {
        "success": True,
        "educational_content": {
            "scheme_comparison": {
                "finite_field_dss": {
                    "hard_problems": ["Form 1.1: x^x ≡ y (mod p)", "Form 1.2: a^x ≡ x^b (mod p)"],
                    "signature_format": "(r, s, z) - all integers",
                    "key_innovation": "Private key in exponential positions",
                    "security_basis": "Transcendental equations in finite fields"
                },
                "elliptic_curve_dss": {
                    "hard_problems": ["Form 2.1: P = x_G × G", "Form 2.2: x_G × P = k × G"],
                    "signature_format": "(R, s, Z) - two points and one scalar", 
                    "key_innovation": "Secret generator point instead of scalar",
                    "security_basis": "New variant of ECDLP with unknown generator"
                }
            },
            "performance_comparison": {
                "operations_finite_field": {
                    "signing": "3 exponentiations, 5 multiplications, 1 inversion, 1 hash",
                    "verification": "4 exponentiations, 3 multiplications, 2 inversions, 2 hashes"
                },
                "operations_elliptic_curve": {
                    "signing": "3 point multiplications, 5 point additions, 1 inversion, 1 hash",
                    "verification": "3 point multiplications, 5 point additions, 1 inversion, 1 hash"
                },
                "security_tradeoff": "Higher computational cost for enhanced security"
            },
            "innovation_summary": {
                "traditional_approaches": {
                    "dsa": "Security based on discrete logarithm: g^x ≡ y (mod p)",
                    "ecdsa": "Security based on ECDLP: P = k × G (known generator G)"
                },
                "new_approaches": {
                    "transcendental_structure": "Variables in multiple exponential positions",
                    "secret_generators": "Generator points themselves are secret",
                    "combined_hardness": "Multiple hard problem forms in single scheme"
                },
                "security_advantages": {
                    "quantum_resistance": "No known quantum algorithms for new forms",
                    "forgery_resistance": "Multiple simultaneous hard problems required",
                    "future_proofing": "Novel mathematical foundation"
                }
            }
        }
    }

@app.get("/api/performance-comparison")
async def get_performance_comparison():
    """
    Detailed performance comparison between schemes
    """
    return {
        "success": True,
        "comparison_data": {
            "traditional_schemes": {
                "DSA": {
                    "signing": {"exp": 1, "mul": 2, "inv": 1, "hash": 1},
                    "verification": {"exp": 2, "mul": 3, "inv": 1, "hash": 1}
                },
                "ECDSA": {
                    "signing": {"point_mul": 1, "mul": 2, "inv": 1, "hash": 1},
                    "verification": {"point_mul": 1, "mul": 2, "inv": 1, "hash": 1}
                }
            },
            "proposed_schemes": {
                "Finite_Field_DSS": {
                    "signing": {"exp": 3, "mul": 5, "inv": 1, "hash": 1},
                    "verification": {"exp": 4, "mul": 3, "inv": 2, "hash": 2}
                },
                "Elliptic_Curve_DSS": {
                    "signing": {"point_mul": 3, "point_add": 5, "inv": 1, "hash": 1},
                    "verification": {"point_mul": 3, "point_add": 5, "inv": 1, "hash": 1}
                }
            },
            "analysis": {
                "computational_overhead": "~2-3x traditional schemes",
                "security_gain": "Quantum resistance + novel hard problems",
                "practical_applicability": "Suitable for high-security applications",
                "optimization_potential": "Further improvements possible"
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)