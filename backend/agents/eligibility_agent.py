"""
Eligibility Agent - Automates benefit verification and eligibility checking
Handles public benefit eligibility, expedited processing, and benefit coordination
"""

from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
from .models import (
    EligibilityRequest, EligibilityResult, WorkflowUpdate
)
from typing import Dict, Any, List
from datetime import datetime

# Initialize Eligibility Agent
eligibility_agent = Agent(
    name="eligibility_agent",
    seed="rubqvfhl pgxdhtle bmhdclik ynwoizfx yatqixta hbolgcmv vlssrism wicdapmu dfmwkmuw bvjixcuq jypwnxcc ixmihtcv",
    port=8009,
    endpoint=["http://127.0.0.1:8009/submit"],
    mailbox=True,
)

@eligibility_agent.on_message(model=EligibilityRequest)
async def handle_eligibility_check(ctx: Context, sender: str, msg: EligibilityRequest):
    """Eligibility agent verifies public benefit eligibility"""
    ctx.logger.info(f"Processing eligibility check for {msg.case_id}")
    
    try:
        # Step 1: Initialize eligibility tracking
        eligible_programs = []
        requires_manual = False
        total_monthly_benefits = 0.0
        
        # Step 2: Check Medi-Cal eligibility
        medi_cal_eligible = await check_medi_cal_eligibility(msg)
        if medi_cal_eligible.get("eligible"):
            eligible_programs.append({
                "program": "Medi-Cal",
                "status": "eligible",
                "coverage_start": medi_cal_eligible.get("start_date"),
                "benefits": medi_cal_eligible.get("benefits", []),
                "monthly_value": 0.0  # Medi-Cal is free
            })
        
        # Step 3: Check General Assistance
        ga_eligible = await check_general_assistance_eligibility(msg)
        if ga_eligible.get("eligible"):
            ga_amount = ga_eligible.get("amount", 0)
            eligible_programs.append({
                "program": "General Assistance",
                "status": "eligible",
                "monthly_amount": ga_amount,
                "monthly_value": ga_amount
            })
            total_monthly_benefits += ga_amount
        elif ga_eligible.get("needs_review"):
            requires_manual = True
        
        # Step 4: Check SNAP (CalFresh)
        snap_eligible = await check_snap_eligibility(msg)
        if snap_eligible.get("eligible"):
            snap_amount = snap_eligible.get("amount", 0)
            eligible_programs.append({
                "program": "CalFresh (SNAP)",
                "status": "eligible",
                "monthly_amount": snap_amount,
                "monthly_value": snap_amount
            })
            total_monthly_benefits += snap_amount
        
        # Step 5: Check housing assistance
        housing_eligible = await check_housing_assistance_eligibility(msg)
        if housing_eligible.get("eligible"):
            eligible_programs.append({
                "program": "Housing Assistance",
                "status": "eligible",
                "waitlist_position": housing_eligible.get("waitlist_position"),
                "monthly_value": 0.0  # Voucher value varies
            })
        
        # Step 6: Check disability benefits
        disability_eligible = await check_disability_benefits_eligibility(msg)
        if disability_eligible.get("eligible"):
            disability_amount = disability_eligible.get("amount", 0)
            eligible_programs.append({
                "program": "SSI/SSDI",
                "status": "eligible",
                "monthly_amount": disability_amount,
                "monthly_value": disability_amount
            })
            total_monthly_benefits += disability_amount
        
        # Step 7: Send results back to coordinator
        await ctx.send(
            "coordinator_agent_address",
            EligibilityResult(
                case_id=msg.case_id,
                eligible_programs=eligible_programs,
                requires_manual_review=requires_manual,
                next_steps=generate_next_steps(eligible_programs, requires_manual),
                total_monthly_benefits=total_monthly_benefits
            )
        )
        
        # Step 8: Update workflow status
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="eligibility_checked",
                status="completed" if not requires_manual else "needs_review",
                details={
                    "eligible_programs": eligible_programs,
                    "requires_manual_review": requires_manual,
                    "total_monthly_benefits": total_monthly_benefits,
                    "programs_count": len(eligible_programs),
                    "patient_name": msg.patient_name
                },
                timestamp=datetime.now().isoformat()
            )
        )
        
        # Step 9: If expedited benefits available, notify social worker
        if any(p.get("program") == "Medi-Cal" for p in eligible_programs):
            await ctx.send(
                "social_worker_agent_address",
                WorkflowUpdate(
                    case_id=msg.case_id,
                    step="benefits_expedited",
                    status="info",
                    details={
                        "message": "Patient eligible for immediate Medi-Cal coverage",
                        "coverage_start": medi_cal_eligible.get("start_date"),
                        "benefits": medi_cal_eligible.get("benefits", [])
                    },
                    timestamp=datetime.now().isoformat()
                )
            )
        
        ctx.logger.info(f"Eligibility check completed for {msg.case_id}: {len(eligible_programs)} programs eligible")
        
    except Exception as e:
        ctx.logger.error(f"Error processing eligibility check for {msg.case_id}: {e}")
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="eligibility_check",
                status="failed",
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
        )

async def check_medi_cal_eligibility(request: EligibilityRequest) -> Dict[str, Any]:
    """Check Medi-Cal eligibility via public API"""
    # In production, integrate with CA DHCS API or county eligibility systems
    # Mock response based on income level
    if request.income_level and request.income_level.lower() in ["low", "very_low", "none"]:
        return {
            "eligible": True,
            "start_date": datetime.now().isoformat(),
            "benefits": ["medical", "dental", "vision", "prescriptions", "mental_health"]
        }
    return {"eligible": False}

async def check_general_assistance_eligibility(request: EligibilityRequest) -> Dict[str, Any]:
    """Check General Assistance eligibility"""
    # Mock response - in production, integrate with county GA systems
    return {
        "eligible": True,
        "amount": 588.00,  # SF GA monthly amount (example)
        "needs_review": False
    }

async def check_snap_eligibility(request: EligibilityRequest) -> Dict[str, Any]:
    """Check SNAP/CalFresh eligibility"""
    # Mock response - in production, integrate with CalFresh systems
    return {
        "eligible": True,
        "amount": 281.00,  # Average monthly SNAP benefit
    }

async def check_housing_assistance_eligibility(request: EligibilityRequest) -> Dict[str, Any]:
    """Check housing assistance eligibility"""
    # Mock response - in production, integrate with housing authority systems
    return {
        "eligible": True,
        "waitlist_position": 1500,  # Position on waitlist
        "estimated_wait_time": "18-24 months"
    }

async def check_disability_benefits_eligibility(request: EligibilityRequest) -> Dict[str, Any]:
    """Check SSI/SSDI eligibility"""
    # Mock response - in production, integrate with SSA systems
    return {
        "eligible": False,  # Requires medical documentation
        "amount": 0.0,
        "requires_medical_review": True
    }

def generate_next_steps(eligible_programs: List[Dict[str, Any]], requires_manual: bool) -> List[str]:
    """Generate next steps based on eligibility results"""
    next_steps = []
    
    if requires_manual:
        next_steps.append("Schedule appointment with benefits counselor")
    
    for program in eligible_programs:
        if program.get("program") == "Medi-Cal":
            next_steps.append("Apply for Medi-Cal coverage immediately")
        elif program.get("program") == "General Assistance":
            next_steps.append("Submit GA application with required documentation")
        elif program.get("program") == "CalFresh (SNAP)":
            next_steps.append("Apply for CalFresh benefits")
        elif program.get("program") == "Housing Assistance":
            next_steps.append("Join housing assistance waitlist")
    
    if not next_steps:
        next_steps.append("Contact social worker for benefit navigation assistance")
    
    return next_steps

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(eligibility_agent.wallet.address())
    eligibility_agent.run()
