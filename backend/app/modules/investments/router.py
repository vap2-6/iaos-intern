import asyncio
import json
import random
from datetime import date, timedelta, datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import asc, func as sqlfunc

from app.api.deps import CurrentUser, DbSession
from app.core.database import SessionLocal
from app.core.tenancy import tenant_scoped

from .models import (
    RCMControl,
    InvestmentsException,
    SectorGuardrail,
    ComplianceTrendPoint,
    Rule,
    ProcedureRun,
    WorkingPaper,
    Finding,
    Remediation,
)
from .schemas import (
    RCMControlOut,
    RCMControlCreate,
    InvestmentsExceptionOut,
    ResolvePayload,
    SimulationPayload,
    ExceptionFromRuleCreate,
    SectorGuardrailOut,
    ComplianceTrendPointOut,
    RuleOut,
    RuleCreate,
    RuleUpdate,
    RuleStatusToggle,
    RuleEvaluationResult,
    ProcedureRunOut,
    ProcedureRunCreate,
    WorkingPaperOut,
    WorkingPaperCreate,
    WorkingPaperStatusUpdate,
    EvidenceRejectPayload,
    EvidenceApprovePayload,
    FindingOut,
    FindingCreate,
    FindingStatusUpdate,
    FindingStatusTransitionPayload,
    RemediationOut,
    RemediationCreate,
    RemediationStatusUpdate,
    KPISummary,
)
from .rule_engine import evaluate_rule, available_threshold_types

router = APIRouter()

# Module manifest — consumed by module_loader for the sidebar/sidebar metadata.
MANIFEST = {
    "name": "Investments Audit",
    "slug": "investments",
    "description": "CAAT-driven audit procedures and exception management for the investments portfolio.",
}

SAMPLE_PORTFOLIO: list[dict] = [
    {"issuer": "Tesla Inc.",       "security": "Tesla Inc. Corporate Note",       "value": 12_500_000, "rating": "BB+",  "sector": "Automotive"},
    {"issuer": "Vertex Pharma",    "security": "Vertex Pharma Commercial Paper",  "value":  8_000_000, "rating": "BBB+", "sector": "Healthcare & Pharma"},
    {"issuer": "Microsoft Corp",   "security": "Microsoft Corp Note 2029",         "value": 15_000_000, "rating": "AAA",  "sector": "Technology"},
    {"issuer": "Evergreen REIT",   "security": "Evergreen Real Estate Trust",      "value":  4_200_000, "rating": "A-",   "sector": "Real Estate"},
    {"issuer": "Amazon",           "security": "Amazon Paper 2027",                "value":  6_000_000, "rating": "AA",   "sector": "Technology"},
    {"issuer": "Goldman Sachs",    "security": "Goldman Sachs MT Note",            "value":  3_500_000, "rating": "A+",   "sector": "Financials"},
    {"issuer": "Apex Global",      "security": "Apex Global Equities",             "value":  1_500_000, "rating": "B",    "sector": "Diversified",
     "expected_coupon": 67_500, "actual_received": 36_000},
    {"issuer": "Cap Corp Logistics","security": "Cap Corp Logistics Debentures",   "value":  3_000_000, "rating": "AA-",  "sector": "Logistics"},
]

def seed_tenant_data_if_empty(db: DbSession, current_user: CurrentUser):
    tenant_id = current_user.tenant_id

    # 1. Seed Page 18 RCM Controls (Primary Governance Objects)
    if tenant_scoped(db.query(RCMControl), current_user).count() == 0:
        db.add_all([
            RCMControl(
                tenant_id=tenant_id,
                control_id="CON-INV-01",
                risk_ref="RSK-INV-01",
                risk_description="Asset Concentration Limits / Portfolio Diversity",
                control_activity="Automated single-issuer and sector concentration cap controls in ERP.",
                financial_assertion="Valuation / Allocation",
                control_owner="Compliance Head",
            ),
            RCMControl(
                tenant_id=tenant_id,
                control_id="CON-INV-02",
                risk_ref="RSK-INV-02",
                risk_description="Credit Diminution and Investment Grade Adherence",
                control_activity="Independent credit rating validation and ECL impairment trigger screening.",
                financial_assertion="Valuation / Impairment",
                control_owner="Risk Management Desk",
            ),
            RCMControl(
                tenant_id=tenant_id,
                control_id="CON-INV-03",
                risk_ref="RSK-INV-03",
                risk_description="Income Accuracy and Completeness Assertions",
                control_activity="Automated interest coupon and dividend rate recalculation vs bank inflow.",
                financial_assertion="Completeness & Accuracy",
                control_owner="Treasury Manager",
            ),
        ])
        db.commit()

    # 2. Seed Exceptions with Upstream Traceability link (control_id)
    if tenant_scoped(db.query(InvestmentsException), current_user).count() == 0:
        db.add_all([
            InvestmentsException(
                tenant_id=tenant_id,
                control_id="CON-INV-01",
                security="Tesla Inc. Note",
                amount="$12.5M",
                exception="Exposure Breach: Single issuer concentration exceeds 10% policy threshold.",
                date=date.today(),
                severity="High",
                source_page="concentration_exposure",
            ),
            InvestmentsException(
                tenant_id=tenant_id,
                control_id="CON-INV-02",
                security="Vertex Pharma",
                amount="$8M",
                exception="Rating Downgrade: Credit rating fell below investment grade floor (A-).",
                date=date.today(),
                severity="High",
                source_page="instrument_master_governance",
            ),
        ])

    if tenant_scoped(db.query(SectorGuardrail), current_user).count() == 0:
        db.add_all([
            SectorGuardrail(tenant_id=tenant_id, sector="Technology", limit_pct=25.0, current_pct=22.4),
            SectorGuardrail(tenant_id=tenant_id, sector="Real Estate", limit_pct=15.0, current_pct=18.2, status="Breached")
        ])

    if tenant_scoped(db.query(ComplianceTrendPoint), current_user).count() == 0:
        db.add_all([ComplianceTrendPoint(tenant_id=tenant_id, month=m, score=s, exceptions_count=1) 
                    for m, s in [("May", 90), ("Jun", 94), ("Jul", 96)]])

    # 3. Seed Page 19 Rule Library with Foreign Key link to Page 18 RCM Control (control_id)
    if tenant_scoped(db.query(Rule), current_user).count() == 0:
        db.add_all([
            Rule(
                tenant_id=tenant_id,
                control_id="CON-INV-01",
                rule_name="Single Issuer Exposure Threshold",
                status="Active",
                threshold_type="issuer_exposure_pct",
                threshold_value=10.0,
                description="Triggers an exception if any single security exceeds this percent of total portfolio value. (Linked to RCM: Asset Concentration Limits)",
            ),
            Rule(
                tenant_id=tenant_id,
                control_id="CON-INV-02",
                rule_name="Minimum Issuer Credit Rating Check",
                status="Active",
                threshold_type="min_credit_rating",
                threshold_value=6.0,
                description="Flags any held security whose credit rating falls below the minimum score on the S&P-style scale (BBB+ = 6). (Linked to RCM: Credit Diminution)",
            ),
            Rule(
                tenant_id=tenant_id,
                control_id="CON-INV-01",
                rule_name="Sector Concentration Cap",
                status="Active",
                threshold_type="sector_concentration_pct",
                threshold_value=25.0,
                description="Flags sectors whose aggregate exposure exceeds this percent of the portfolio. (Linked to RCM: Asset Concentration Limits)",
            ),
            Rule(
                tenant_id=tenant_id,
                control_id="CON-INV-03",
                rule_name="Dividend Receipt Variance Test",
                status="Active",
                threshold_type="dividend_variance_pct",
                threshold_value=1.0,
                description="Recomputes dividend / coupon income and flags any holding whose actual receipt deviates more than this percent from expected amount. (Linked to RCM: Income Accuracy)",
            ),
        ])
    db.commit()


# ---------------------------------------------------------------------------
# Page 18: RCM Controls Endpoints
# ---------------------------------------------------------------------------

@router.get("/rcm-controls", response_model=list[RCMControlOut])
def list_rcm_controls(current_user: CurrentUser, db: DbSession):
    seed_tenant_data_if_empty(db, current_user)
    return tenant_scoped(db.query(RCMControl), current_user).all()


@router.post("/rcm-controls", response_model=RCMControlOut, status_code=201)
def create_rcm_control(payload: RCMControlCreate, current_user: CurrentUser, db: DbSession):
    existing = tenant_scoped(db.query(RCMControl).filter(RCMControl.control_id == payload.control_id), current_user).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Control ID '{payload.control_id}' already exists.")
    
    ctrl = RCMControl(
        tenant_id=current_user.tenant_id,
        control_id=payload.control_id.strip(),
        risk_ref=payload.risk_ref.strip(),
        risk_description=payload.risk_description,
        control_activity=payload.control_activity,
        financial_assertion=payload.financial_assertion,
        control_owner=payload.control_owner,
    )
    db.add(ctrl)
    db.commit()
    db.refresh(ctrl)
    return ctrl


# ---------------------------------------------------------------------------
# Exceptions & Upstream Traceability
# ---------------------------------------------------------------------------

@router.get("/exceptions", response_model=list[InvestmentsExceptionOut])
def list_exceptions(current_user: CurrentUser, db: DbSession):
    seed_tenant_data_if_empty(db, current_user)
    return tenant_scoped(db.query(InvestmentsException), current_user).all()

@router.post("/exceptions/resolve", response_model=list[InvestmentsExceptionOut])
def resolve_exception(payload: ResolvePayload, current_user: CurrentUser, db: DbSession):
    exc = tenant_scoped(db.query(InvestmentsException).filter(InvestmentsException.id == payload.id), current_user).first()
    if exc: exc.status = "Resolved"
    db.commit()
    return tenant_scoped(db.query(InvestmentsException), current_user).all()

# G2 & Core Upstream Traceability: Persist rule-engine breach with control_id FK
@router.post("/exceptions/from-rule/{rule_id}", response_model=InvestmentsExceptionOut, status_code=201)
def create_exception_from_rule(
    rule_id: int,
    payload: ExceptionFromRuleCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Auto-persist a RuleViolation as an InvestmentsException with control_id back-link."""
    rule = tenant_scoped(db.query(Rule).filter(Rule.id == rule_id), current_user).first()
    control_id = payload.control_id or (rule.control_id if rule else None)

    exc = InvestmentsException(
        tenant_id=current_user.tenant_id,
        control_id=control_id,
        security=payload.security,
        amount=payload.amount,
        exception=payload.exception,
        date=date.today(),
        severity=payload.severity,
        source_page=payload.source_page or f"rule_{rule_id}",
        parent_id=payload.parent_id,
    )
    db.add(exc)
    db.commit()
    db.refresh(exc)
    return exc

@router.get("/compliance-trends", response_model=list[ComplianceTrendPointOut])
def list_compliance_trends(current_user: CurrentUser, db: DbSession):
    return tenant_scoped(db.query(ComplianceTrendPoint).order_by(ComplianceTrendPoint.id.asc()), current_user).all()

@router.get("/sector-guardrails", response_model=list[SectorGuardrailOut])
def list_sector_guardrails(current_user: CurrentUser, db: DbSession):
    return tenant_scoped(db.query(SectorGuardrail), current_user).all()

@router.post("/procedures/simulate")
async def simulate_procedure(payload: SimulationPayload, current_user: CurrentUser):
    tenant_id = current_user.tenant_id
    async def event_generator():
        db = SessionLocal()
        try:
            yield f"data: {json.dumps({'type': 'log', 'message': 'Agent Initialized...'})}\\n\\n"
            await asyncio.sleep(1)
            deviations_count = random.randint(1, 3)
            new_exc = InvestmentsException(
                tenant_id=tenant_id,
                control_id="CON-INV-01",
                security="Simulated Security",
                amount="$1.0M",
                exception=f"Simulation found issue in {payload.procedure_id}", 
                date=date.today(),
                severity="Medium",
                source_page=payload.procedure_id,
            )
            db.add(new_exc)
            db.commit()
            yield f"data: {json.dumps({'type': 'summary', 'status': 'FAILED', 'deviations_count': deviations_count, 'sample_size': payload.sample_size, 'tolerance': payload.tolerance, 'deviation_rate': 0.2})}\\n\\n"
        finally:
            db.close()
    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Test & Analytics Rule Library (Page 19)
# ---------------------------------------------------------------------------

@router.get("/rules", response_model=list[RuleOut])
def list_rules(current_user: CurrentUser, db: DbSession):
    seed_tenant_data_if_empty(db, current_user)
    return (
        tenant_scoped(db.query(Rule), current_user)
        .order_by(asc(Rule.id))
        .all()
    )


@router.post("/rules", response_model=RuleOut, status_code=201)
def create_rule(payload: RuleCreate, current_user: CurrentUser, db: DbSession):
    if payload.threshold_type not in available_threshold_types():
        raise HTTPException(
            status_code=400,
            detail=f"Unknown threshold_type '{payload.threshold_type}'. Valid options: {available_threshold_types()}",
        )

    # Downstream Validation Check against Page 18 RCM Control
    if payload.control_id:
        ctrl = tenant_scoped(db.query(RCMControl).filter(RCMControl.control_id == payload.control_id), current_user).first()
        if not ctrl:
            raise HTTPException(status_code=400, detail=f"Target RCM Control '{payload.control_id}' does not exist on Page 18.")

    rule = Rule(
        tenant_id=current_user.tenant_id,
        control_id=payload.control_id,
        rule_name=payload.rule_name.strip(),
        status=payload.status,
        threshold_type=payload.threshold_type,
        threshold_value=float(payload.threshold_value),
        description=payload.description or "",
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.patch("/rules/{rule_id}", response_model=RuleOut)
def update_rule(
    rule_id: int,
    payload: RuleUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    rule = tenant_scoped(db.query(Rule), current_user).filter(Rule.id == rule_id).first()
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")

    data = payload.model_dump(exclude_unset=True)

    if "threshold_type" in data and data["threshold_type"] not in available_threshold_types():
        raise HTTPException(
            status_code=400,
            detail=f"Unknown threshold_type '{data['threshold_type']}'. Valid options: {available_threshold_types()}",
        )

    if "control_id" in data and data["control_id"]:
        ctrl = tenant_scoped(db.query(RCMControl).filter(RCMControl.control_id == data["control_id"]), current_user).first()
        if not ctrl:
            raise HTTPException(status_code=400, detail=f"Target RCM Control '{data['control_id']}' does not exist on Page 18.")

    for field, value in data.items():
        if field == "rule_name" and isinstance(value, str):
            value = value.strip()
        if field == "threshold_value" and value is not None:
            value = float(value)
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.patch("/rules/{rule_id}/status", response_model=RuleOut)
def toggle_rule_status(
    rule_id: int,
    payload: RuleStatusToggle,
    current_user: CurrentUser,
    db: DbSession,
):
    rule = tenant_scoped(db.query(Rule), current_user).filter(Rule.id == rule_id).first()
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.status = payload.status
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}", status_code=204)
def delete_rule(rule_id: int, current_user: CurrentUser, db: DbSession):
    rule = tenant_scoped(db.query(Rule), current_user).filter(Rule.id == rule_id).first()
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return None


@router.get("/rules/threshold-types", response_model=list[str])
def list_threshold_types(current_user: CurrentUser):
    return available_threshold_types()


@router.get("/rules/{rule_id}/evaluate", response_model=RuleEvaluationResult)
def evaluate_rule_endpoint(
    rule_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    rule = tenant_scoped(db.query(Rule), current_user).filter(Rule.id == rule_id).first()
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")

    raw = evaluate_rule(rule.threshold_type, SAMPLE_PORTFOLIO, rule.threshold_value)
    breaches = [
        {
            **b,
            "rule_id": rule.id,
            "rule_name": rule.rule_name,
            "control_id": rule.control_id,
        }
        for b in raw["breaches"]
    ]
    return RuleEvaluationResult(
        rule_id=rule.id,
        rule_name=rule.rule_name,
        control_id=rule.control_id,
        threshold_type=rule.threshold_type,
        threshold_value=rule.threshold_value,
        status=rule.status,
        passed=raw["passed"],
        portfolio_total=raw["portfolio_total"],
        breaches=breaches,
    )


# ---------------------------------------------------------------------------
# Procedure Run Log
# ---------------------------------------------------------------------------

@router.get("/procedure-runs", response_model=list[ProcedureRunOut])
def list_procedure_runs(current_user: CurrentUser, db: DbSession):
    return (
        tenant_scoped(db.query(ProcedureRun), current_user)
        .order_by(ProcedureRun.created_at.desc())
        .limit(50)
        .all()
    )


@router.post("/procedure-runs", response_model=ProcedureRunOut, status_code=201)
def create_procedure_run(payload: ProcedureRunCreate, current_user: CurrentUser, db: DbSession):
    run = ProcedureRun(
        tenant_id=current_user.tenant_id,
        procedure_id=payload.procedure_id,
        procedure_name=payload.procedure_name,
        sample_size=payload.sample_size,
        tolerance=payload.tolerance,
        status=payload.status,
        deviation_count=payload.deviation_count,
        deviation_rate=payload.deviation_rate,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


# ---------------------------------------------------------------------------
# Working Papers
# ---------------------------------------------------------------------------

@router.get("/working-papers", response_model=list[WorkingPaperOut])
def list_working_papers(current_user: CurrentUser, db: DbSession):
    return (
        tenant_scoped(db.query(WorkingPaper), current_user)
        .order_by(WorkingPaper.created_at.desc())
        .all()
    )


@router.post("/working-papers", response_model=WorkingPaperOut, status_code=201)
def create_working_paper(payload: WorkingPaperCreate, current_user: CurrentUser, db: DbSession):
    wp = WorkingPaper(
        tenant_id=current_user.tenant_id,
        document_name=payload.document_name,
        ref_task=payload.ref_task,
        attached_by=payload.attached_by,
        file_size=payload.file_size,
        file_type=payload.file_type,
        exception_id=payload.exception_id,
    )
    db.add(wp)
    db.commit()
    db.refresh(wp)
    return wp


# Immutability helper
def _assert_evidence_not_locked(wp: WorkingPaper) -> None:
    """Raise 403 if the evidence document is locked (Approved by Lead)."""
    if wp.sign_off_status == "Approved by Lead":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: This document has been approved and is now immutable. DELETE and edit operations are blocked.",
        )


@router.post("/working-papers/{wp_id}/approve", response_model=WorkingPaperOut)
def approve_evidence(
    wp_id: str,
    payload: EvidenceApprovePayload,
    current_user: CurrentUser,
    db: DbSession,
):
    """POST: Approve an evidence document. Blocked for the user who uploaded the file."""
    wp = tenant_scoped(db.query(WorkingPaper), current_user).filter(WorkingPaper.id == wp_id).first()
    if wp is None:
        raise HTTPException(status_code=404, detail="Working paper not found")

    # Security Rule: Block uploader from approving their own document
    approver_name = payload.signed_off_by or getattr(current_user, "full_name", None) or getattr(current_user, "email", "")
    if wp.attached_by and approver_name and wp.attached_by.strip().lower() == approver_name.strip().lower():
        raise HTTPException(
            status_code=403,
            detail="Forbidden: The user who uploaded this document cannot approve it (no self-approval).",
        )

    # Already approved — return current state (idempotent)
    if wp.sign_off_status == "Approved by Lead":
        return wp

    wp.sign_off_status = "Approved by Lead"
    wp.signed_off_by = approver_name or "Lead Auditor"
    wp.signed_off_at = datetime.now(timezone.utc)
    wp.revision_notes = None
    db.commit()
    db.refresh(wp)
    return wp


@router.post("/working-papers/{wp_id}/reject", response_model=WorkingPaperOut)
def reject_evidence(
    wp_id: str,
    payload: EvidenceRejectPayload,
    current_user: CurrentUser,
    db: DbSession,
):
    """POST: Reject/request revision for an evidence document. Requires revision_notes."""
    wp = tenant_scoped(db.query(WorkingPaper), current_user).filter(WorkingPaper.id == wp_id).first()
    if wp is None:
        raise HTTPException(status_code=404, detail="Working paper not found")

    # Immutability check
    _assert_evidence_not_locked(wp)

    wp.sign_off_status = "Needs Revision"
    wp.signed_off_by = None
    wp.signed_off_at = None
    wp.revision_notes = payload.revision_notes
    db.commit()
    db.refresh(wp)
    return wp


@router.patch("/working-papers/{wp_id}/status", response_model=WorkingPaperOut)
def update_working_paper_status(
    wp_id: str,
    payload: WorkingPaperStatusUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Legacy PATCH — kept for backward compatibility. Blocked for Approved documents."""
    wp = tenant_scoped(db.query(WorkingPaper), current_user).filter(WorkingPaper.id == wp_id).first()
    if wp is None:
        raise HTTPException(status_code=404, detail="Working paper not found")

    _assert_evidence_not_locked(wp)

    wp.sign_off_status = payload.sign_off_status
    if payload.sign_off_status == "Approved by Lead":
        wp.signed_off_by = payload.signed_off_by or "Lead Auditor"
        wp.signed_off_at = datetime.now(timezone.utc)
    else:
        wp.signed_off_by = None
        wp.signed_off_at = None

    db.commit()
    db.refresh(wp)
    return wp


@router.delete("/working-papers/{wp_id}", status_code=204)
def delete_working_paper(wp_id: str, current_user: CurrentUser, db: DbSession):
    wp = tenant_scoped(db.query(WorkingPaper), current_user).filter(WorkingPaper.id == wp_id).first()
    if wp is None:
        raise HTTPException(status_code=404, detail="Working paper not found")
    # Immutability lock — approved documents cannot be deleted
    _assert_evidence_not_locked(wp)
    db.delete(wp)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Findings (Observation Log — P24)
# ---------------------------------------------------------------------------

@router.get("/findings", response_model=list[FindingOut])
def list_findings(current_user: CurrentUser, db: DbSession):
    return (
        tenant_scoped(db.query(Finding), current_user)
        .order_by(Finding.created_at.desc())
        .all()
    )


@router.post("/findings", response_model=FindingOut, status_code=201)
def create_finding(payload: FindingCreate, current_user: CurrentUser, db: DbSession):
    if payload.target_close_date and payload.target_close_date < date.today():
        raise HTTPException(
            status_code=422,
            detail="Target Close Date cannot be set in the past.",
        )

    count = tenant_scoped(db.query(Finding), current_user).count()
    ref = f"OBS-INV-{str(count + 1).zfill(3)}"

    finding = Finding(
        tenant_id=current_user.tenant_id,
        ref=ref,
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        owner=payload.owner,
        target_close_date=payload.target_close_date,
        exception_id=payload.exception_id,
        working_paper_id=payload.working_paper_id,
    )
    db.add(finding)
    db.commit()
    db.refresh(finding)
    return finding


@router.post("/findings/{finding_id}/promote-to-capa", status_code=201)
def promote_finding_to_capa(
    finding_id: str,
    payload: dict = None,
    current_user: CurrentUser = None,
    db: DbSession = None,
):
    payload = payload or {}
    raw_date = payload.get("target_close_date") or payload.get("targetCloseDate") or payload.get("target_date") or payload.get("due_date")
    if raw_date:
        if isinstance(raw_date, str):
            try:
                target_dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00")).date()
            except ValueError:
                try:
                    target_dt = datetime.strptime(raw_date[:10], "%Y-%m-%d").date()
                except ValueError:
                    target_dt = None
            if target_dt and target_dt < date.today():
                raise HTTPException(status_code=422, detail="Target Close Date cannot be set in the past.")
        elif isinstance(raw_date, date) and raw_date < date.today():
            raise HTTPException(status_code=422, detail="Target Close Date cannot be set in the past.")

    finding = tenant_scoped(db.query(Finding), current_user).filter(
        (Finding.id == finding_id) | (Finding.ref == finding_id)
    ).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if not raw_date and finding.target_close_date and finding.target_close_date < date.today():
        raise HTTPException(status_code=422, detail="Target Close Date cannot be set in the past.")

    desc = payload.get("capa_description") or f"Corrective action for: {finding.title}"
    owner = payload.get("control_owner") or payload.get("owner") or finding.owner or "Treasury Operations"

    target_d = None
    if raw_date:
        if isinstance(raw_date, date):
            target_d = raw_date
        elif isinstance(raw_date, str):
            try:
                target_d = datetime.fromisoformat(raw_date.replace("Z", "+00:00")).date()
            except ValueError:
                pass
    if not target_d:
        target_d = finding.target_close_date

    rem = Remediation(
        tenant_id=current_user.tenant_id,
        finding_id=finding.id,
        finding_ref=finding.ref,
        capa_description=desc,
        control_owner=owner,
        target_date=target_d,
        milestone_status="Open",
    )
    db.add(rem)

    from app.models.v1_models import RemediationCAPA
    capa_row = RemediationCAPA(
        tenant_id=current_user.tenant_id,
        finding_ref=finding.ref,
        action_plan_description=desc,
        owner=owner,
        due_date=target_d.isoformat() if target_d else date.today().isoformat(),
        status="Open",
    )
    db.add(capa_row)

    finding.status = "Promoted to CAPA"
    db.commit()
    db.refresh(finding)
    return {
        "status": "success",
        "message": f"Finding '{finding_id}' successfully promoted to CAPA.",
        "finding_id": finding.id,
        "finding_status": finding.status,
    }



# ---------------------------------------------------------------------------
# Finding State Machine — strict permission-based transitions
# ---------------------------------------------------------------------------

def _get_finding_or_404(db: DbSession, current_user, finding_id: str) -> Finding:
    finding = tenant_scoped(db.query(Finding), current_user).filter(Finding.id == finding_id).first()
    if finding is None:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding


@router.patch("/findings/{finding_id}/submit-review", response_model=FindingOut)
def submit_finding_for_review(
    finding_id: str,
    payload: FindingStatusTransitionPayload,
    current_user: CurrentUser,
    db: DbSession,
):
    """PATCH: Transition finding from Open -> In Review. Requires status_change_reason."""
    finding = _get_finding_or_404(db, current_user, finding_id)

    if finding.status != "Open":
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: Cannot submit for review. Finding must be in 'Open' status (current: '{finding.status}').",
        )

    finding.status = "In Review"
    finding.status_change_reason = payload.status_change_reason
    db.commit()
    db.refresh(finding)
    return finding


@router.patch("/findings/{finding_id}/resolve", response_model=FindingOut)
def resolve_finding(
    finding_id: str,
    payload: FindingStatusTransitionPayload,
    current_user: CurrentUser,
    db: DbSession,
):
    """PATCH: Transition finding from In Review -> Resolved. Blocks self-approval by owner. Requires status_change_reason."""
    finding = _get_finding_or_404(db, current_user, finding_id)

    if finding.status != "In Review":
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: Cannot resolve. Finding must be in 'In Review' status (current: '{finding.status}').",
        )

    # Security Rule: Block the finding owner/creator from resolving (no self-approval)
    current_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", "")
    if finding.owner and current_name and finding.owner.strip().lower() == current_name.strip().lower():
        raise HTTPException(
            status_code=403,
            detail="Forbidden: The finding owner cannot resolve their own finding (no self-approval rule).",
        )

    finding.status = "Resolved"
    finding.status_change_reason = payload.status_change_reason
    db.commit()
    db.refresh(finding)
    return finding


@router.patch("/findings/{finding_id}/reopen", response_model=FindingOut)
def reopen_finding(
    finding_id: str,
    payload: FindingStatusTransitionPayload,
    current_user: CurrentUser,
    db: DbSession,
):
    """PATCH: Transition finding from Resolved -> Open. Requires status_change_reason."""
    finding = _get_finding_or_404(db, current_user, finding_id)

    if finding.status != "Resolved":
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: Cannot reopen. Finding must be in 'Resolved' status (current: '{finding.status}').",
        )

    finding.status = "Open"
    finding.status_change_reason = payload.status_change_reason
    db.commit()
    db.refresh(finding)
    return finding


@router.patch("/findings/{finding_id}/status", response_model=FindingOut)
def update_finding_status(
    finding_id: str,
    payload: FindingStatusUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Legacy PATCH — kept for backward compatibility. Prefer the explicit transition endpoints."""
    finding = _get_finding_or_404(db, current_user, finding_id)
    finding.status = payload.status
    db.commit()
    db.refresh(finding)
    return finding


@router.delete("/findings/{finding_id}", status_code=204)
def delete_finding(finding_id: str, current_user: CurrentUser, db: DbSession):
    finding = _get_finding_or_404(db, current_user, finding_id)
    db.delete(finding)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Remediations (CAPA Tracker — P25)
# ---------------------------------------------------------------------------

def _compute_overdue(rem: Remediation) -> bool:
    if rem.target_date and rem.milestone_status not in ("Closed",):
        return rem.target_date < date.today()
    return False


@router.get("/remediations", response_model=list[RemediationOut])
def list_remediations(current_user: CurrentUser, db: DbSession):
    rems = tenant_scoped(db.query(Remediation), current_user).order_by(Remediation.created_at.desc()).all()
    result = []
    for r in rems:
        out = RemediationOut.model_validate(r)
        out.is_overdue = _compute_overdue(r)
        result.append(out)
    return result


@router.post("/remediations", response_model=RemediationOut, status_code=201)
def create_remediation(payload: RemediationCreate, current_user: CurrentUser, db: DbSession):
    rem = Remediation(
        tenant_id=current_user.tenant_id,
        finding_id=payload.finding_id,
        finding_ref=payload.finding_ref,
        capa_description=payload.capa_description,
        control_owner=payload.control_owner,
        target_date=payload.target_date,
    )
    db.add(rem)
    db.commit()
    db.refresh(rem)
    out = RemediationOut.model_validate(rem)
    out.is_overdue = _compute_overdue(rem)
    return out


@router.patch("/remediations/{rem_id}/status", response_model=RemediationOut)
def update_remediation_status(
    rem_id: str,
    payload: RemediationStatusUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    rem = tenant_scoped(db.query(Remediation), current_user).filter(Remediation.id == rem_id).first()
    if rem is None:
        raise HTTPException(status_code=404, detail="Remediation not found")

    rem.milestone_status = payload.milestone_status
    if payload.retest_date:
        rem.retest_date = payload.retest_date
    if payload.retest_result:
        rem.retest_result = payload.retest_result

    db.commit()
    db.refresh(rem)
    out = RemediationOut.model_validate(rem)
    out.is_overdue = _compute_overdue(rem)
    return out


@router.delete("/remediations/{rem_id}", status_code=204)
def delete_remediation(rem_id: str, current_user: CurrentUser, db: DbSession):
    rem = tenant_scoped(db.query(Remediation), current_user).filter(Remediation.id == rem_id).first()
    if rem is None:
        raise HTTPException(status_code=404, detail="Remediation not found")
    db.delete(rem)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Module KPI Rollup
# ---------------------------------------------------------------------------

@router.get("/kpis", response_model=KPISummary)
def get_kpis(current_user: CurrentUser, db: DbSession):
    seed_tenant_data_if_empty(db, current_user)

    exc_q = tenant_scoped(db.query(InvestmentsException), current_user)
    total_exceptions = exc_q.count()
    open_exceptions = exc_q.filter(InvestmentsException.status != "Resolved").count()
    high_severity_open = exc_q.filter(
        InvestmentsException.severity == "High",
        InvestmentsException.status != "Resolved",
    ).count()
    resolved_exceptions = exc_q.filter(InvestmentsException.status == "Resolved").count()

    rule_q = tenant_scoped(db.query(Rule), current_user)
    total_rules = rule_q.count()
    active_rules = rule_q.filter(Rule.status == "Active").count()

    latest_trend = (
        tenant_scoped(db.query(ComplianceTrendPoint), current_user)
        .order_by(ComplianceTrendPoint.id.desc())
        .first()
    )
    latest_compliance_score = latest_trend.score if latest_trend else 90

    finding_q = tenant_scoped(db.query(Finding), current_user)
    total_findings = finding_q.count()
    open_findings = finding_q.filter(Finding.status != "Resolved").count()

    rem_q = tenant_scoped(db.query(Remediation), current_user)
    capa_total = rem_q.count()
    capa_closed = rem_q.filter(Remediation.milestone_status == "Closed").count()
    today = date.today()
    capa_overdue = rem_q.filter(
        Remediation.target_date < today,
        Remediation.milestone_status != "Closed",
    ).count()

    run_q = tenant_scoped(db.query(ProcedureRun), current_user)
    procedure_runs_total = run_q.count()
    procedure_ids_run_rows = (
        tenant_scoped(
            db.query(ProcedureRun.procedure_id).distinct(), current_user
        ).all()
    )
    procedure_ids_run = [r[0] for r in procedure_ids_run_rows]

    sector_guardrails = tenant_scoped(db.query(SectorGuardrail), current_user).all()
    compliance_trend = (
        tenant_scoped(db.query(ComplianceTrendPoint), current_user)
        .order_by(ComplianceTrendPoint.id.asc())
        .all()
    )
    rcm_controls_count = tenant_scoped(db.query(RCMControl), current_user).count()

    return KPISummary(
        open_exceptions=open_exceptions,
        high_severity_open=high_severity_open,
        total_exceptions=total_exceptions,
        resolved_exceptions=resolved_exceptions,
        active_rules=active_rules,
        total_rules=total_rules,
        latest_compliance_score=latest_compliance_score,
        total_findings=total_findings,
        open_findings=open_findings,
        capa_total=capa_total,
        capa_overdue=capa_overdue,
        capa_closed=capa_closed,
        procedure_runs_total=procedure_runs_total,
        procedure_ids_run=procedure_ids_run,
        sector_guardrails=[SectorGuardrailOut.model_validate(g) for g in sector_guardrails],
        compliance_trend=[ComplianceTrendPointOut.model_validate(t) for t in compliance_trend],
        rcm_controls_count=rcm_controls_count,
    )