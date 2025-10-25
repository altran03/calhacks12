"""
Analytics Agent - System metrics and reporting
Collects non-PII metrics, performance data, and system health monitoring
"""

from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
from .models import (
    AnalyticsData, WorkflowUpdate, SystemHealthCheck
)
from typing import Dict, Any
from datetime import datetime, timedelta
import json

# Initialize Analytics Agent
analytics_agent = Agent(
    name="analytics_agent",
    seed="veofzchw ldauavmc ptqrkoey zkgngzzm aarifzdp floojxfx dtlttuhc kqhyfsge cvhptqjv nbdryvml fozndspo wlavnyjl",
    port=8010,
    endpoint=["http://127.0.0.1:8010/submit"],
    mailbox=True,
)

# Analytics agent listens to all WorkflowUpdate messages
@analytics_agent.on_message(model=WorkflowUpdate)
async def collect_analytics(ctx: Context, sender: str, msg: WorkflowUpdate):
    """Analytics agent collects non-PII metrics"""
    try:
        # Anonymize and aggregate data
        metric_data = {
            "step": msg.step,
            "status": msg.status,
            "timestamp": msg.timestamp,
            "case_id_hash": hash(msg.case_id),  # Anonymized
            "sender_agent": sender,
            "processing_time": calculate_processing_time(msg),
            "success_rate": calculate_success_rate(msg.step, msg.status)
        }
        
        # Store metrics (in production, this would go to a database or analytics service)
        await store_metric(metric_data)
        
        # Update system health metrics
        await update_system_health(ctx, msg)
        
        # Generate alerts for critical issues
        await check_for_alerts(ctx, msg)
        
        ctx.logger.info(f"Analytics: Recorded {msg.step} - {msg.status}")
        
    except Exception as e:
        ctx.logger.error(f"Error collecting analytics: {e}")

@analytics_agent.on_message(model=SystemHealthCheck)
async def handle_health_check(ctx: Context, sender: str, msg: SystemHealthCheck):
    """Handle system health check requests"""
    try:
        # Analyze agent performance
        health_status = await analyze_agent_health(msg)
        
        # Send health report
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id="system_health",
                step="health_check",
                status="completed",
                details={
                    "agent_name": msg.agent_name,
                    "health_status": health_status,
                    "performance_metrics": msg.performance_metrics,
                    "last_activity": msg.last_activity
                },
                timestamp=datetime.now().isoformat()
            )
        )
        
    except Exception as e:
        ctx.logger.error(f"Error handling health check: {e}")

async def store_metric(metric_data: Dict[str, Any]) -> None:
    """Store analytics metric (non-PII)"""
    # In production, write to database or analytics service
    # For demo, just log the metric
    print(f"Analytics Metric: {json.dumps(metric_data, indent=2)}")

async def update_system_health(ctx: Context, msg: WorkflowUpdate):
    """Update system health metrics"""
    try:
        # Track workflow completion rates
        if msg.status == "completed":
            await track_success_metric(msg.step)
        elif msg.status == "failed":
            await track_failure_metric(msg.step, msg.details.get("error", "Unknown error"))
        
        # Track processing times
        await track_processing_time(msg.step, msg.timestamp)
        
    except Exception as e:
        ctx.logger.error(f"Error updating system health: {e}")

async def check_for_alerts(ctx: Context, msg: WorkflowUpdate):
    """Check for alerts and critical issues"""
    try:
        # Alert on high failure rates
        if msg.status == "failed" and msg.step in ["shelter_matching", "transport_scheduling"]:
            await send_alert(ctx, f"Critical workflow failure: {msg.step}")
        
        # Alert on processing delays
        if await is_processing_delayed(msg):
            await send_alert(ctx, f"Processing delay detected: {msg.step}")
        
        # Alert on system errors
        if msg.status == "error":
            await send_alert(ctx, f"System error in {msg.step}: {msg.details.get('error', 'Unknown')}")
        
    except Exception as e:
        ctx.logger.error(f"Error checking alerts: {e}")

async def analyze_agent_health(health_check: SystemHealthCheck) -> Dict[str, Any]:
    """Analyze agent health and performance"""
    return {
        "overall_health": "healthy" if health_check.status == "active" else "degraded",
        "performance_score": calculate_performance_score(health_check.performance_metrics),
        "last_activity_age": calculate_activity_age(health_check.last_activity),
        "recommendations": generate_health_recommendations(health_check)
    }

async def track_success_metric(step: str):
    """Track successful workflow completions"""
    # In production, update success metrics in database
    print(f"Success tracked for step: {step}")

async def track_failure_metric(step: str, error: str):
    """Track workflow failures"""
    # In production, update failure metrics in database
    print(f"Failure tracked for step: {step}, error: {error}")

async def track_processing_time(step: str, timestamp: str):
    """Track processing times for workflow steps"""
    # In production, update processing time metrics
    print(f"Processing time tracked for step: {step}")

async def is_processing_delayed(msg: WorkflowUpdate) -> bool:
    """Check if processing is delayed"""
    # Simple delay detection - in production, use more sophisticated logic
    return False

async def send_alert(ctx: Context, message: str):
    """Send system alert"""
    await ctx.send(
        "coordinator_agent_address",
        WorkflowUpdate(
            case_id="system_alert",
            step="system_alert",
            status="info",
            details={"alert_message": message, "severity": "high"},
            timestamp=datetime.now().isoformat()
        )
    )

def calculate_processing_time(msg: WorkflowUpdate) -> float:
    """Calculate processing time for workflow step"""
    # Mock calculation - in production, use actual timing data
    return 2.5  # seconds

def calculate_success_rate(step: str, status: str) -> float:
    """Calculate success rate for workflow step"""
    # Mock calculation - in production, use historical data
    return 0.85  # 85% success rate

def calculate_performance_score(metrics: Dict[str, Any]) -> float:
    """Calculate performance score from metrics"""
    # Mock calculation - in production, use actual performance data
    return 0.92  # 92% performance score

def calculate_activity_age(last_activity: str) -> str:
    """Calculate age of last activity"""
    # Mock calculation - in production, use actual time difference
    return "2 minutes ago"

def generate_health_recommendations(health_check: SystemHealthCheck) -> list:
    """Generate health recommendations"""
    recommendations = []
    
    if health_check.status != "active":
        recommendations.append("Agent appears inactive - check connectivity")
    
    if health_check.performance_metrics.get("error_rate", 0) > 0.1:
        recommendations.append("High error rate detected - review agent logic")
    
    if not recommendations:
        recommendations.append("Agent operating normally")
    
    return recommendations

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(analytics_agent.wallet.address())
    analytics_agent.run()
