from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

# ---------- Page 18: RCM Controls ----------

class RCMControlOut(BaseModel):
    control_id: str
    risk_ref: str
    risk_description: str
    control_activity: str
    financial_assertion: str
    control_owner: str
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RCMControlCreate(BaseModel):
    control_id: str = Field(..., min_length=1, max_length=50)
    risk_ref: str = Field(..., min_length=1, max_length=50)
    risk_description: str
    control_activity: str
    financial_assertion: str
    control_owner: str = "Compliance Head"


# ---------- Exceptions ----------

class InvestmentsExceptionOut(BaseModel):
    id: str
    module: str
    security: str
    amount: str
    exception: str
    date: date
    severity: str
    status: str
    source_page: Optional[str] = None
    parent_id: Optional[str] = None
    control_id: Optional[str] = None
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResolvePayload(BaseModel):
    id: str


class ExceptionFromRuleCreate(BaseModel):
    """Payload for persisting a rule-engine breach as an exception."""
    security: str
    amount: str
    exception: str
    severity: str = "Medium"
    source_page: Optional[str] = None
    parent_id: Optional[str] = None
    control_id: Optional[str] = None


class SimulationPayload(BaseModel):
    procedure_id: str
    sample_size: int
    tolerance: float


class SectorGuardrailOut(BaseModel):
    id: int
    sector: str
    limit_pct: float
    current_pct: float
    status: str
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplianceTrendPointOut(BaseModel):
    id: int
    month: str
    score: int
    exceptions_count: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Test & Analytics Rule Library ----------

class RuleOut(BaseModel):
    id: int
    control_id: Optional[str] = None
    rule_name: str
    status: str
    threshold_type: str
    threshold_value: float
    description: str
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RuleCreate(BaseModel):
    control_id: Optional[str] = None
    rule_name: str = Field(..., min_length=1, max_length=255)
    status: str = Field(default="Active", pattern="^(Active|Inactive)$")
    threshold_type: str = Field(..., min_length=1, max_length=100)
    threshold_value: float
    description: str = ""


class RuleUpdate(BaseModel):
    control_id: Optional[str] = None
    rule_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    status: Optional[str] = Field(default=None, pattern="^(Active|Inactive)$")
    threshold_type: Optional[str] = Field(default=None, min_length=1, max_length=100)
    threshold_value: Optional[float] = None
    description: Optional[str] = None


class RuleStatusToggle(BaseModel):
    status: str = Field(..., pattern="^(Active|Inactive)$")


class RuleViolation(BaseModel):
    issuer: str
    security: str
    value: float
    pct_of_portfolio: float
    threshold: float
    rule_id: int
    rule_name: str
    control_id: Optional[str] = None


class RuleEvaluationResult(BaseModel):
    rule_id: int
    rule_name: str
    control_id: Optional[str] = None
    threshold_type: str
    threshold_value: float
    status: str
    passed: bool
    portfolio_total: float
    breaches: list[RuleViolation]


# ---------- Procedure Run ----------

class ProcedureRunOut(BaseModel):
    id: str
    procedure_id: str
    procedure_name: str
    sample_size: Optional[int] = None
    tolerance: Optional[float] = None
    status: str
    deviation_count: int
    deviation_rate: float
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProcedureRunCreate(BaseModel):
    procedure_id: str
    procedure_name: str
    sample_size: Optional[int] = None
    tolerance: Optional[float] = None
    status: str = "Completed"
    deviation_count: int = 0
    deviation_rate: float = 0.0


# ---------- Working Papers ----------

class WorkingPaperOut(BaseModel):
    id: str
    document_name: str
    ref_task: str
    attached_by: str
    file_size: Optional[str] = None
    file_type: Optional[str] = None
    exception_id: Optional[str] = None
    sign_off_status: str
    signed_off_by: Optional[str] = None
    signed_off_at: Optional[datetime] = None
    revision_notes: Optional[str] = None
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkingPaperCreate(BaseModel):
    document_name: str = Field(..., min_length=1, max_length=500)
    ref_task: str = Field(..., min_length=1, max_length=255)
    attached_by: str = "Current Auditor"
    file_size: Optional[str] = None
    file_type: Optional[str] = None
    exception_id: Optional[str] = None


class WorkingPaperStatusUpdate(BaseModel):
    sign_off_status: str = Field(
        ..., pattern="^(Awaiting Review|Approved by Lead|Needs Revision)$"
    )
    signed_off_by: Optional[str] = None
    revision_notes: Optional[str] = None


class EvidenceRejectPayload(BaseModel):
    revision_notes: str = Field(..., min_length=1)


class EvidenceApprovePayload(BaseModel):
    signed_off_by: Optional[str] = None


# ---------- Findings ----------

class FindingOut(BaseModel):
    id: str
    ref: str
    title: str
    description: str
    severity: str
    owner: Optional[str] = None
    target_close_date: Optional[date] = None
    status: str
    status_change_reason: Optional[str] = None
    exception_id: Optional[str] = None
    working_paper_id: Optional[str] = None
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FindingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str
    severity: str = Field(
        default="High Severity",
        pattern="^(High Severity|Medium Severity|Low Severity)$",
    )
    owner: Optional[str] = None
    target_close_date: Optional[date] = None
    exception_id: Optional[str] = None
    working_paper_id: Optional[str] = None


class FindingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Open|In Review|Resolved|Promoted to CAPA)$")





# ---------- Remediations ----------

class RemediationOut(BaseModel):
    id: str
    finding_id: str
    finding_ref: str
    capa_description: str
    control_owner: Optional[str] = None
    target_date: Optional[date] = None
    retest_date: Optional[date] = None
    retest_result: Optional[str] = None
    milestone_status: str
    is_overdue: bool = False
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RemediationCreate(BaseModel):
    finding_id: str
    finding_ref: str
    capa_description: str = Field(..., min_length=1)
    control_owner: Optional[str] = None
    target_date: Optional[date] = None


class RemediationStatusUpdate(BaseModel):
    milestone_status: str = Field(
        ..., pattern="^(Open|In-Progress|Closed|Overdue)$"
    )
    retest_date: Optional[date] = None
    retest_result: Optional[str] = Field(default=None, pattern="^(Pass|Fail)$")


# ---------- KPI Aggregate ----------

class KPISummary(BaseModel):
    open_exceptions: int
    high_severity_open: int
    total_exceptions: int
    resolved_exceptions: int
    active_rules: int
    total_rules: int
    latest_compliance_score: int
    total_findings: int
    open_findings: int
    capa_total: int
    capa_overdue: int
    capa_closed: int
    procedure_runs_total: int
    procedure_ids_run: list[str]
    sector_guardrails: list[SectorGuardrailOut]
    compliance_trend: list[ComplianceTrendPointOut]
    rcm_controls_count: int = 0


# ---------- Finding State Machine Payloads ----------

class FindingStatusTransitionPayload(BaseModel):
    """Payload for explicit finding status transitions. A non-empty reason is mandatory."""
    status_change_reason: str = Field(..., min_length=3, description="Mandatory justification for the status transition.")
    resolved_by: Optional[str] = None  # Used by /resolve to check self-approval


# ---------- Evidence Locker Approval Payloads ----------

class EvidenceApprovePayload(BaseModel):
    """Payload for approving a working-paper / evidence document."""
    signed_off_by: Optional[str] = Field(default=None, description="Name of the approver. Defaults to current user.")


class EvidenceRejectPayload(BaseModel):
    """Payload for rejecting a working-paper / evidence document. revision_notes is mandatory."""
    revision_notes: str = Field(..., min_length=5, description="Mandatory notes explaining what must be revised.")