"""
Social Worker Agent - Manages social worker assignments and follow-up care
Handles case assignments, follow-up scheduling, and care coordination
"""

from uagents import Agent, Context, Protocol
from uagents.setup import fund_agent_if_low
from .models import (
    SocialWorkerAssignment, SocialWorkerConfirmation, WorkflowUpdate
)
from typing import Dict, Any
from datetime import datetime, timedelta
import os
import json
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    agent: str
    port: int

# Initialize Social Worker Agent
social_worker_agent = Agent(
    name="social_worker_agent",
    seed="oaphdvbt feztgltk dwbrwggg fbutmfkq qdzozwmm wnlaybtg ihvzuqtk qbhhobzn ehnxdnvu fbtjxzsq chpchnpw qiipetlq",
    port=8005,
    endpoint=["http://127.0.0.1:8005/submit"],
    mailbox=True,
)

# Define Social Worker Protocol for Agentverse deployment
social_worker_protocol = Protocol(name="SocialWorkerProtocol", version="1.0.0")

@social_worker_protocol.on_message(model=SocialWorkerAssignment, replies={SocialWorkerConfirmation, WorkflowUpdate})
async def handle_social_worker_assignment(ctx: Context, sender: str, msg: SocialWorkerAssignment):
    """Social worker agent manages follow-up care"""
    ctx.logger.info(f"Processing social worker assignment for {msg.case_id}")
    
    try:
        # Step 1: Confirm assignment via Vapi call
        assignment_confirmed = await confirm_social_worker_assignment_via_vapi(msg)
        
        if assignment_confirmed:
            # Step 2: Schedule initial contact
            initial_contact = await schedule_initial_contact(msg)
            
            # Step 3: Send confirmation
            await ctx.send(
                "coordinator_agent_address",
                SocialWorkerConfirmation(
                    case_id=msg.case_id,
                    social_worker_name=msg.social_worker_name,
                    contact_phone=msg.contact_phone,
                    department=msg.department,
                    availability="Monday-Friday 8am-5pm",
                    first_contact_date=initial_contact.get("contact_date", ""),
                    case_priority="high"
                )
            )
            
            # Step 4: Update workflow status
            await ctx.send(
                "coordinator_agent_address",
                WorkflowUpdate(
                    case_id=msg.case_id,
                    step="social_worker_assigned",
                    status="completed",
                    details={
                        "social_worker": msg.social_worker_name,
                        "department": msg.department,
                        "contact_phone": msg.contact_phone,
                        "first_contact": initial_contact.get("contact_date", ""),
                        "specialization": msg.specialization
                    },
                    timestamp=datetime.now().isoformat()
                )
            )
            
            # Step 5: Schedule follow-up care
            await schedule_followup_care(ctx, msg)
            
            ctx.logger.info(f"Social worker assigned for {msg.case_id}: {msg.social_worker_name}")
        else:
            # Assignment failed, try alternative social workers
            await find_alternative_social_worker(ctx, msg)
            
    except Exception as e:
        ctx.logger.error(f"Error processing social worker assignment for {msg.case_id}: {e}")
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="social_worker_assignment",
                status="failed",
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
        )

@social_worker_protocol.on_message(model=WorkflowUpdate)
async def handle_workflow_update(ctx: Context, sender: str, msg: WorkflowUpdate):
    """Handle workflow updates that require social worker attention"""
    if msg.step == "benefits_expedited" and msg.status == "info":
        ctx.logger.info(f"Expedited benefits available for {msg.case_id}")
        # Schedule immediate follow-up for expedited benefits
        
    elif msg.step == "pharmacy_search" and msg.status == "needs_manual_intervention":
        ctx.logger.info(f"Manual intervention needed for pharmacy search: {msg.case_id}")
        # Coordinate with social worker for medication assistance

async def confirm_social_worker_assignment_via_vapi(assignment: SocialWorkerAssignment) -> bool:
    """Confirm social worker assignment via Vapi voice call"""
    # This would integrate with Vapi API
    # For demo purposes, return True
    return True

async def generate_latex_discharge_report(case_id: str, workflow_data: Dict[str, Any]) -> str:
    """Generate professional LaTeX discharge report"""
    try:
        # Extract data from workflow
        patient = workflow_data.get('patient', {})
        shelter = workflow_data.get('shelter', {})
        transport = workflow_data.get('transport', {})
        timeline = workflow_data.get('timeline', [])
        
        # Generate LaTeX report
        latex_content = f"""
\\documentclass[12pt]{{article}}
\\usepackage[utf8]{{inputenc}}
\\usepackage[margin=1in]{{geometry}}
\\usepackage{{fancyhdr}}
\\usepackage{{enumitem}}
\\usepackage{{xcolor}}
\\usepackage{{hyperref}}

\\pagestyle{{fancy}}
\\fancyhf{{}}
\\fancyhead[L]{{CareLink Discharge Coordination Report}}
\\fancyhead[R]{{Case ID: {case_id}}}
\\fancyfoot[C]{{Page \\thepage}}

\\title{{\\textbf{{Discharge Coordination Report}}}}
\\author{{CareLink Multi-Agent System}}
\\date{{\\today}}

\\begin{{document}}

\\maketitle

\\section{{Patient Information}}
\\begin{{itemize}}
    \\item \\textbf{{Name:}} {patient.get('contact_info', {}).get('name', 'N/A')}
    \\item \\textbf{{Medical Record:}} {patient.get('discharge_info', {}).get('medical_record_number', 'N/A')}
    \\item \\textbf{{Discharging Facility:}} {patient.get('discharge_info', {}).get('discharging_facility', 'N/A')}
    \\item \\textbf{{Discharge Date:}} {patient.get('discharge_info', {}).get('planned_discharge_date', 'N/A')}
\\end{{itemize}}

\\section{{Coordination Summary}}
This report documents the automated coordination of discharge services for the above patient using the CareLink Multi-Agent System.

\\subsection{{Shelter Placement}}
\\begin{{itemize}}
    \\item \\textbf{{Shelter:}} {shelter.get('name', 'N/A')}
    \\item \\textbf{{Address:}} {shelter.get('address', 'N/A')}
    \\item \\textbf{{Phone:}} {shelter.get('phone', 'N/A')}
    \\item \\textbf{{Available Beds:}} {shelter.get('available_beds', 'N/A')}
    \\item \\textbf{{Accessibility:}} {'Yes' if shelter.get('accessibility') else 'No'}
\\end{{itemize}}

\\subsection{{Transportation}}
\\begin{{itemize}}
    \\item \\textbf{{Provider:}} {transport.get('provider', 'N/A')}
    \\item \\textbf{{Vehicle Type:}} {transport.get('vehicle_type', 'N/A')}
    \\item \\textbf{{ETA:}} {transport.get('eta', 'N/A')}
    \\item \\textbf{{Status:}} {transport.get('status', 'N/A')}
\\end{{itemize}}

\\section{{Agent Coordination Timeline}}
The following agents were coordinated to ensure seamless discharge:

\\begin{{enumerate}}
"""
        
        # Add timeline events
        for i, event in enumerate(timeline, 1):
            latex_content += f"""
    \\item \\textbf{{{event.get('step', 'Unknown Step').replace('_', ' ').title()}}}
    \\begin{{itemize}}
        \\item Status: {event.get('status', 'Unknown')}
        \\item Description: {event.get('description', 'No description')}
        \\item Timestamp: {event.get('timestamp', 'Unknown')}
    \\end{{itemize}}
"""
        
        latex_content += """
\\end{enumerate}

\\section{Follow-up Care Plan}
\\begin{itemize}
    \\item Social worker assigned for ongoing case management
    \\item Regular check-ins scheduled for 30, 60, and 90 days
    \\item Medication management coordinated with pharmacy
    \\item Benefit verification completed
    \\item Community resources identified and connected
\\end{itemize}

\\section{Contact Information}
For questions about this discharge coordination, please contact:
\\begin{itemize}
    \\item CareLink System Administrator
    \\item Phone: (415) 555-CARE
    \\item Email: support@carelink.org
\\end{itemize}

\\vspace{1cm}
\\begin{center}
\\textit{This report was generated automatically by the CareLink Multi-Agent System.}
\\end{center}

\\end{document}
"""
        
        return latex_content
        
    except Exception as e:
        print(f"❌ Error generating LaTeX report: {e}")
        return f"Error generating report: {str(e)}"

async def schedule_initial_contact(assignment: SocialWorkerAssignment) -> Dict[str, Any]:
    """Schedule initial contact with patient"""
    # Calculate next business day
    next_business_day = datetime.now() + timedelta(days=1)
    if next_business_day.weekday() >= 5:  # Weekend
        next_business_day += timedelta(days=2)
    
    return {
        "contact_date": next_business_day.strftime("%Y-%m-%d"),
        "contact_time": "10:00 AM",
        "method": "phone_call",
        "notes": "Initial assessment and care plan development"
    }

async def schedule_followup_care(ctx: Context, assignment: SocialWorkerAssignment):
    """Schedule follow-up care activities"""
    try:
        # Schedule follow-up call via Vapi
        followup_scheduled = await schedule_followup_call_via_vapi(assignment.case_id)
        
        if followup_scheduled:
            await ctx.send(
                "coordinator_agent_address",
                WorkflowUpdate(
                    case_id=assignment.case_id,
                    step="followup_scheduled",
                    status="completed",
                    details={
                        "followup_date": followup_scheduled.get("date", ""),
                        "followup_type": "social_worker_check_in",
                        "social_worker": assignment.social_worker_name
                    },
                    timestamp=datetime.now().isoformat()
                )
            )
            
    except Exception as e:
        ctx.logger.error(f"Error scheduling follow-up care for {assignment.case_id}: {e}")

async def find_alternative_social_worker(ctx: Context, original_assignment: SocialWorkerAssignment):
    """Find alternative social workers when primary assignment fails"""
    ctx.logger.info(f"Searching for alternative social workers for {original_assignment.case_id}")
    
    # Query for alternative social workers
    alternatives = await query_alternative_social_workers(original_assignment)
    
    for alt_worker in alternatives:
        try:
            # Check availability for alternative
            availability = await check_social_worker_availability(alt_worker)
            
            if availability.get("available", False):
                # Send alternative assignment
                await ctx.send(
                    "coordinator_agent_address",
                    WorkflowUpdate(
                        case_id=original_assignment.case_id,
                        step="alternative_social_worker_found",
                        status="completed",
                        details={
                            "original_worker": original_assignment.social_worker_name,
                            "alternative_worker": alt_worker.get("name"),
                            "department": alt_worker.get("department"),
                            "specialization": alt_worker.get("specialization")
                        },
                        timestamp=datetime.now().isoformat()
                    )
                )
                return
                
        except Exception as e:
            ctx.logger.error(f"Error checking alternative social worker: {e}")
    
    # No alternatives found
    await ctx.send(
        "coordinator_agent_address",
        WorkflowUpdate(
            case_id=original_assignment.case_id,
            step="social_worker_search",
            status="failed",
            details={"reason": "No available social workers found"},
            timestamp=datetime.now().isoformat()
        )
    )

async def schedule_followup_call_via_vapi(case_id: str) -> Dict[str, Any]:
    """Schedule follow-up call via Vapi"""
    # This would integrate with Vapi API
    followup_date = datetime.now() + timedelta(days=7)
    
    return {
        "date": followup_date.strftime("%Y-%m-%d"),
        "time": "2:00 PM",
        "method": "phone_call",
        "duration": "30 minutes"
    }

async def query_alternative_social_workers(original_assignment: SocialWorkerAssignment) -> list:
    """Query for alternative social workers"""
    # This would integrate with social worker database
    return [
        {
            "name": "Michael Chen",
            "department": "SF Health Department",
            "specialization": "homeless_services",
            "phone": "(415) 555-0126"
        },
        {
            "name": "Lisa Rodriguez",
            "department": "SF Human Services",
            "specialization": "case_management",
            "phone": "(415) 555-0127"
        }
    ]

async def check_social_worker_availability(worker: Dict[str, Any]) -> Dict[str, Any]:
    """Check availability for social worker"""
    return {
        "available": True,
        "next_available": "2024-01-15",
        "specialization_match": True
    }

# Health check endpoint
@social_worker_agent.on_rest_get("/health", HealthResponse)
async def health_check(ctx: Context):
    """Health check endpoint"""
    return HealthResponse(status="healthy", agent="social_worker_agent", port=8005)

# Include protocol with manifest publishing for Agentverse deployment
social_worker_agent.include(social_worker_protocol, publish_manifest=True)

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(social_worker_agent.wallet.address())
    social_worker_agent.run()
