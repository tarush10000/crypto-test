from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from app.crypto.finite_field_dss import FiniteFieldDSS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Educational Digital Signature Scheme API",
    description="API for Digital Signature Schemes based on New Hard Problems with Educational Features",
    version="1.0.0"
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
    bit_length: int = 512
    scheme_type: str = "finite_field"

class SigningRequest(BaseModel):
    message: str
    private_key: str
    system_params: Dict[str, Any]
    scheme_type: str = "finite_field"

class VerificationRequest(BaseModel):
    message: str
    signature: Dict[str, Any]
    public_key: str
    system_params: Dict[str, Any]
    scheme_type: str = "finite_field"

class HardProblemDemoRequest(BaseModel):
    problem_type: str  # "1.1" or "1.2"
    parameters: Dict[str, Any]

# Global instances for demo
dss_instances = {}

@app.post("/api/generate-keys")
async def generate_keys(request: KeyGenerationRequest):
    try:
        logger.info(f"Generating keys for {request.scheme_type} with {request.bit_length} bits")
        
        if request.scheme_type == "finite_field":
            dss = FiniteFieldDSS(bit_length=request.bit_length)
            private_key, public_key = dss.key_generation()
            
            # Store instance for later use
            session_id = f"ff_{hash(str(private_key))}"
            dss_instances[session_id] = dss
            
            # Get educational information about hard problems
            hard_problem_info = dss.get_hard_problem_demonstrations()
            
            return {
                "success": True,
                "session_id": session_id,
                "private_key": str(private_key),
                "public_key": str(public_key),
                "system_params": {
                    "p": str(dss.params.p),
                    "q": str(dss.params.q)
                },
                "performance_metrics": dss.get_performance_metrics(),
                "hard_problem_demonstrations": hard_problem_info,
                "educational_info": {
                    "key_generation_process": {
                        "step_1": "Generate system parameters p, q where q|(p-1)",
                        "step_2": "Choose random a, compute x = a^((p-1)/q) mod p",
                        "step_3": "Compute y = x^(-x) mod p using Hard Problem Form 1.1",
                        "security_basis": "Finding x from y requires solving x^x ≡ y (mod p)"
                    },
                    "hard_problem_form_1_1": {
                        "equation": "x^x ≡ y (mod p)",
                        "difficulty": "O(2^n) complexity - only brute force known",
                        "why_hard": [
                            "Variable x appears as both base and exponent",
                            "No known sub-exponential algorithms",
                            "Traditional DLP methods don't apply"
                        ]
                    }
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Only finite_field scheme is currently implemented")
            
    except Exception as e:
        logger.error(f"Key generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sign")
async def sign_message(request: SigningRequest):
    try:
        logger.info(f"Signing message with {request.scheme_type}")
        
        if request.scheme_type == "finite_field":
            dss = FiniteFieldDSS(bit_length=None)
            dss.params.p = int(request.system_params["p"])
            dss.params.q = int(request.system_params["q"])
            
            signature = dss.sign(request.message, int(request.private_key))
            
            # Get educational information
            hard_problem_info = dss.get_hard_problem_demonstrations()
            
            return {
                "success": True,
                "signature": {
                    "r": str(signature[0]),
                    "s": str(signature[1]),  
                    "z": str(signature[2])
                },
                "performance_metrics": dss.get_performance_metrics(),
                "intermediate_values": dss.get_intermediate_values(),
                "hard_problem_demonstrations": hard_problem_info,
                "educational_info": {
                    "signing_process": {
                        "step_1": f"Compute r = x^k mod p (uses private key in exponent)",
                        "step_2": f"Compute e = H(r||M) (binds signature to message)",
                        "step_3": f"Compute z = x^u mod p (another hard problem use)",
                        "step_4": f"Compute s using complex linking formula",
                        "final_signature": "(r, s, z) - all components cryptographically linked"
                    },
                    "security_explanation": {
                        "component_security": "All components use private key x in exponential positions",
                        "forgery_difficulty": "Requires solving multiple instances of hard problems",
                        "linkage": "Components are mathematically linked to prevent independent forgery"
                    }
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Only finite_field scheme is currently implemented")
            
    except Exception as e:
        logger.error(f"Signing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify")
async def verify_signature(request: VerificationRequest):
    try:
        logger.info(f"Verifying signature with {request.scheme_type}")
        
        if request.scheme_type == "finite_field":
            dss = FiniteFieldDSS(bit_length=None)
            dss.params.p = int(request.system_params["p"])
            dss.params.q = int(request.system_params["q"])
            
            signature = (
                int(request.signature["r"]),
                int(request.signature["s"]),
                int(request.signature["z"])
            )
            
            is_valid = dss.verify(
                request.message, 
                signature, 
                int(request.public_key)
            )
            
            # Get educational information
            hard_problem_info = dss.get_hard_problem_demonstrations()
            verification_details = dss.get_verification_details()
            
            return {
                "success": True,
                "is_valid": is_valid,
                "performance_metrics": dss.get_performance_metrics(),
                "verification_details": verification_details,
                "hard_problem_demonstrations": hard_problem_info,
                "educational_info": {
                    "verification_process": {
                        "step_1": "Compute a = H(r||M) (recreate message hash)",
                        "step_2": "Apply verification equation using Hard Problem Form 1.2",
                        "step_3": "Check if z^r ≡ r^(s*e) * y^(z*r^s) (mod p)",
                        "step_4": "Alternative: compute r̄ and verify H(r̄||M) = H(r||M)",
                        "result": "Valid if equation holds"
                    },
                    "hard_problem_form_1_2": {
                        "equation": "a^x ≡ x^b (mod p)",
                        "verification_context": "Verification equation has this structure",
                        "security_basis": "Forging requires solving this hard problem",
                        "why_secure": [
                            "Variable x appears in both base and exponent positions",
                            "No known efficient solution methods",
                            "Currently unsolvable except by brute force"
                        ]
                    },
                    "verification_equation_breakdown": {
                        "left_side": f"z^r = {verification_details.get('verify_left_side', 'N/A')}",
                        "right_side": f"r^(s*e) * y^(z*r^s) = {verification_details.get('verify_right_side', 'N/A')}",
                        "equation_holds": verification_details.get('verify_equation_holds', False)
                    }
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Only finite_field scheme is currently implemented")
            
    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/hard-problem-demo")
async def demonstrate_hard_problem(request: HardProblemDemoRequest):
    """
    Educational endpoint to demonstrate the hard problems
    """
    try:
        if request.problem_type == "1.1":
            # Demonstrate Hard Problem Form 1.1: x^x ≡ y (mod p)
            p = request.parameters.get("p", 23)
            
            demonstration = {
                "problem_form": "x^x ≡ y (mod p)",
                "parameters": {"p": p},
                "examples": [],
                "solving_attempts": [],
                "difficulty_analysis": {
                    "brute_force_complexity": f"O(p) = O({p}) for exhaustive search",
                    "why_traditional_methods_fail": [
                        "Baby-step Giant-step: Requires known generator",
                        "Pollard's Rho: No applicable group structure", 
                        "Index Calculus: Factor base approach fails",
                        "Linear algebra: No linear relationships"
                    ]
                }
            }
            
            # Generate some examples
            for x in range(1, min(p, 10)):
                y = pow(x, x, p)
                demonstration["examples"].append({
                    "x": x,
                    "x_to_x_mod_p": y,
                    "equation": f"{x}^{x} ≡ {y} (mod {p})"
                })
            
            # Demonstrate solving difficulty
            target_y = request.parameters.get("target_y")
            if target_y and p <= 100:  # Only for small p
                found_x = None
                attempts = 0
                for x in range(1, p):
                    attempts += 1
                    if pow(x, x, p) == target_y:
                        found_x = x
                        break
                
                demonstration["solving_attempts"] = {
                    "target_y": target_y,
                    "found_x": found_x,
                    "attempts_needed": attempts,
                    "success": found_x is not None,
                    "note": "This is only feasible for very small p values"
                }
            
            return {
                "success": True,
                "demonstration": demonstration
            }
            
        elif request.problem_type == "1.2":
            # Demonstrate Hard Problem Form 1.2: a^x ≡ x^b (mod p)
            p = request.parameters.get("p", 23)
            a = request.parameters.get("a", 2)
            b = request.parameters.get("b", 3)
            
            demonstration = {
                "problem_form": "a^x ≡ x^b (mod p)",
                "parameters": {"p": p, "a": a, "b": b},
                "examples": [],
                "difficulty_analysis": {
                    "equation_structure": "Transcendental equation with x in multiple positions",
                    "why_hard": [
                        "No direct algebraic solution",
                        "Requires simultaneous solution of exponential equations",
                        "Traditional discrete log methods don't apply",
                        "Currently no known sub-exponential algorithms"
                    ]
                }
            }
            
            # Find solutions by brute force (for small p only)
            if p <= 50:
                solutions = []
                for x in range(1, p):
                    if pow(a, x, p) == pow(x, b, p):
                        solutions.append({
                            "x": x,
                            "a_to_x": pow(a, x, p),
                            "x_to_b": pow(x, b, p),
                            "equation": f"{a}^{x} ≡ {x}^{b} ≡ {pow(a, x, p)} (mod {p})"
                        })
                
                demonstration["solutions_found"] = solutions
                demonstration["total_solutions"] = len(solutions)
                demonstration["search_space"] = p - 1
            
            return {
                "success": True,
                "demonstration": demonstration
            }
        
        else:
            raise HTTPException(status_code=400, detail="Invalid problem type. Use '1.1' or '1.2'")
            
    except Exception as e:
        logger.error(f"Hard problem demonstration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/educational-summary")
async def get_educational_summary():
    """
    Comprehensive educational summary of the DSS and hard problems
    """
    return {
        "success": True,
        "educational_content": {
            "hard_problems_overview": {
                "traditional_dlp": {
                    "equation": "g^x ≡ y (mod p)",
                    "complexity": "Sub-exponential algorithms exist",
                    "security_status": "Well-studied, multiple attack methods"
                },
                "new_hard_problem_1_1": {
                    "equation": "x^x ≡ y (mod p)",
                    "complexity": "O(2^n) - only brute force known",
                    "security_status": "Novel, no known efficient attacks",
                    "innovation": "Variable appears as both base and exponent"
                },
                "new_hard_problem_1_2": {
                    "equation": "a^x ≡ x^b (mod p)",
                    "complexity": "O(2^n) - currently unsolvable",
                    "security_status": "Transcendental structure resists known methods",
                    "innovation": "Variable in multiple exponential positions"
                }
            },
            "dss_algorithm_flow": {
                "key_generation": {
                    "input": "System parameters p, q",
                    "process": [
                        "Choose random a",
                        "Compute x = a^((p-1)/q) mod p",
                        "Compute y = x^(-x) mod p using Hard Problem 1.1"
                    ],
                    "output": "Private key x, Public key y",
                    "security": "Based on Hard Problem Form 1.1"
                },
                "signing": {
                    "input": "Message M, private key x",
                    "process": [
                        "Generate random k, u, v",
                        "Compute r = x^k mod p",
                        "Compute e = H(r||M)",
                        "Compute z = x^u mod p",
                        "Compute s using linking formula"
                    ],
                    "output": "Signature (r, s, z)",
                    "security": "Multiple uses of x in exponential positions"
                },
                "verification": {
                    "input": "Message M, signature (r,s,z), public key y",
                    "process": [
                        "Compute a = H(r||M)",
                        "Apply verification equation",
                        "Check z^r ≡ r^(s*e) * y^(z*r^s) (mod p)"
                    ],
                    "output": "Valid/Invalid",
                    "security": "Based on Hard Problem Form 1.2"
                }
            },
            "security_analysis": {
                "attack_resistance": {
                    "secret_key_attack": {
                        "description": "Attacker tries to find x from y",
                        "requirement": "Solve x^x ≡ y (mod p)",
                        "difficulty": "Hard Problem Form 1.1",
                        "complexity": "O(2^n)"
                    },
                    "signature_forgery": {
                        "description": "Attacker tries to create valid (r,s,z) without x",
                        "requirement": "Satisfy verification equation",
                        "difficulty": "Hard Problem Form 1.2",
                        "complexity": "O(2^n)"
                    }
                },
                "comparison_with_traditional": {
                    "traditional_dlp_attacks": [
                        "Pollard's Rho: O(√p)",
                        "Index Calculus: Sub-exponential",
                        "Baby-step Giant-step: O(√p)"
                    ],
                    "new_hard_problem_resistance": [
                        "No sub-exponential algorithms known",
                        "Traditional methods don't apply",
                        "Only brute force feasible: O(2^n)"
                    ]
                }
            },
            "performance_trade_offs": {
                "computational_cost": "Higher than traditional schemes",
                "security_benefit": "Based on potentially stronger hard problems",
                "practical_considerations": "Suitable for high-security applications",
                "future_research": "Potential foundation for post-quantum cryptography"
            }
        }
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "message": "Educational DSS API is running",
        "features": [
            "Proper hard problem implementation",
            "Educational demonstrations",
            "Step-by-step explanations",
            "Security analysis",
            "Performance comparisons"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)