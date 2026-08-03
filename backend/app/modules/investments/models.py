import uuid
from datetime import datetime, date
from sqlalchemy import Boolean, String, Text, Float, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.core.tenancy import TenantMixin


# ---------------------------------------------------------------------------
# Page 18: RCM Controls (Primary Governance Entity)
# ---------------------------------------------------------------------------

class RCMControl(Base, TenantMixin):
    """Primary governance table defining Page 18 Risk & Control Matrix entries.

    Acts as the single source of truth for business risks, control activities,
    and financial assertions governing investment audit procedures.
    """

    __tablename__ = "mod_investments_rcm_controls"

    control_id: Mapped[str] = mapped_column(String(50), primary_key=True)  # Primary Key e.g. CON-INV-01
    risk_ref: Mapped[str] = mapped_column(String(50), nullable=False)        # e.g. RSK-INV-01
    risk_description: Mapped[str] = mapped_column(Text, nullable=False)
    control_activity: Mapped[str] = mapped_column(Text, nullable=False)
    financial_assertion: Mapped[str] = mapped_column(String(255), nullable=False)
    control_owner: Mapped[str] = mapped_column(String(255), nullable=False, default="Compliance Head")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class InvestmentsException(Base, TenantMixin):
    __tablename__ = "mod_investments_audit_exceptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module: Mapped[str] = mapped_column(String(255), default="Investments Audit")
    security: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[str] = mapped_column(String(255), nullable=False)
    exception: Mapped[str] = mapped_column(Text, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="Medium")
    status: Mapped[str] = mapped_column(String(50), default="Unresolved")
    source_page: Mapped[str] = mapped_column(String(100), nullable=True)
    parent_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("mod_investments_audit_exceptions.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Upstream Traceability Link to Page 18 RCM Control
    control_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("mod_investments_rcm_controls.control_id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class SectorGuardrail(Base, TenantMixin):
    __tablename__ = "mod_investments_audit_sector_guardrails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sector: Mapped[str] = mapped_column(String(255), nullable=False)
    limit_pct: Mapped[float] = mapped_column(Float, nullable=False)
    current_pct: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Compliant")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ComplianceTrendPoint(Base, TenantMixin):
    __tablename__ = "mod_investments_audit_compliance_trend_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    month: Mapped[str] = mapped_column(String(50), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    exceptions_count: Mapped[int] = mapped_column(Integer, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Rule(Base, TenantMixin):
    """Test & Analytics Rule Library entry (Page 19).

    Stores automated CAAT script criteria linked to Page 18 RCM Control
    via foreign key `control_id`.
    """

    __tablename__ = "mod_investments_audit_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    control_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("mod_investments_rcm_controls.control_id", ondelete="CASCADE"),
        nullable=True,
    )
    rule_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Active")
    threshold_type: Mapped[str] = mapped_column(String(100), nullable=False)
    threshold_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Procedure Run Log — tracks simulation executions
# ---------------------------------------------------------------------------

class ProcedureRun(Base, TenantMixin):
    __tablename__ = "mod_investments_procedure_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    procedure_id: Mapped[str] = mapped_column(String(100), nullable=False)
    procedure_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sample_size: Mapped[int] = mapped_column(Integer, nullable=True)
    tolerance: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="Completed")
    deviation_count: Mapped[int] = mapped_column(Integer, default=0)
    deviation_rate: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Working Papers — Evidence document registry
# ---------------------------------------------------------------------------

class WorkingPaper(Base, TenantMixin):
    __tablename__ = "mod_investments_working_papers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_name: Mapped[str] = mapped_column(String(500), nullable=False)
    ref_task: Mapped[str] = mapped_column(String(255), nullable=False)
    attached_by: Mapped[str] = mapped_column(String(255), nullable=False, default="Current Auditor")
    file_size: Mapped[str] = mapped_column(String(50), nullable=True)
    file_type: Mapped[str] = mapped_column(String(100), nullable=True)
    exception_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("mod_investments_audit_exceptions.id", ondelete="SET NULL"),
        nullable=True,
    )
    sign_off_status: Mapped[str] = mapped_column(
        String(50), default="Awaiting Review"
    )
    signed_off_by: Mapped[str] = mapped_column(String(255), nullable=True)
    signed_off_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    revision_notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Findings — Observation & Finding Log
# ---------------------------------------------------------------------------

class Finding(Base, TenantMixin):
    __tablename__ = "mod_investments_findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ref: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(
        String(50), nullable=False, default="High Severity"
    )
    owner: Mapped[str] = mapped_column(String(255), nullable=True)
    target_close_date: Mapped[date] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Open")
    status_change_reason: Mapped[str] = mapped_column(Text, nullable=True)
    exception_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("mod_investments_audit_exceptions.id", ondelete="SET NULL"),
        nullable=True,
    )
    working_paper_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("mod_investments_working_papers.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Remediations — CAPA Action Tracker
# ---------------------------------------------------------------------------

class Remediation(Base, TenantMixin):
    __tablename__ = "mod_investments_remediations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    finding_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("mod_investments_findings.id", ondelete="CASCADE"),
        nullable=False,
    )
    finding_ref: Mapped[str] = mapped_column(String(50), nullable=False)
    capa_description: Mapped[str] = mapped_column(Text, nullable=False)
    control_owner: Mapped[str] = mapped_column(String(255), nullable=True)
    target_date: Mapped[date] = mapped_column(Date, nullable=True)
    retest_date: Mapped[date] = mapped_column(Date, nullable=True)
    retest_result: Mapped[str] = mapped_column(String(20), nullable=True)
    milestone_status: Mapped[str] = mapped_column(
        String(30), default="Open"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Valuation & Fair-Value Testing
# ---------------------------------------------------------------------------

class ValuationRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_valuation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    holding: Mapped[str] = mapped_column(String(255), nullable=False)
    cost_price: Mapped[str] = mapped_column(String(50), nullable=False)
    independent_price: Mapped[str] = mapped_column(String(50), nullable=False)
    erp_book_price: Mapped[str] = mapped_column(String(50), nullable=False)
    variance_pct: Mapped[str] = mapped_column(String(50), nullable=False, default="0.00%")
    ecl_triggered: Mapped[str] = mapped_column(String(255), nullable=False, default="No")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Passed")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Board Approval vs Limits
# ---------------------------------------------------------------------------

class BoardApprovalRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_board_approval"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    security: Mapped[str] = mapped_column(String(255), nullable=False)
    investment_amount: Mapped[str] = mapped_column(String(100), nullable=False)
    authorized_signatory: Mapped[str] = mapped_column(String(255), nullable=False)
    resolution_ref: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    approval_status: Mapped[str] = mapped_column(String(100), nullable=False, default="Approved")
    # Limit configuration (stored per tenant)
    cfo_limit: Mapped[str] = mapped_column(String(100), nullable=False, default="$2,000,000")
    committee_limit: Mapped[str] = mapped_column(String(100), nullable=False, default="$5,000,000")
    board_limit: Mapped[str] = mapped_column(String(100), nullable=False, default="Unlimited")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Income Recomputation
# ---------------------------------------------------------------------------

class IncomeRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_income"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    holding_security: Mapped[str] = mapped_column(String(255), nullable=False)
    coupon_rate: Mapped[str] = mapped_column(String(50), nullable=False)
    daycount: Mapped[str] = mapped_column(String(50), nullable=False, default="30/360")
    expected_coupon: Mapped[str] = mapped_column(String(100), nullable=False)
    actual_received: Mapped[str] = mapped_column(String(100), nullable=False)
    variance: Mapped[str] = mapped_column(String(100), nullable=False, default="$0")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Match")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Related-Party Investment Flag
# ---------------------------------------------------------------------------

class RelatedPartyRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_related_party"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    relationship: Mapped[str] = mapped_column(String(255), nullable=False)
    exposure_amount: Mapped[str] = mapped_column(String(100), nullable=False)
    disclosure_status: Mapped[str] = mapped_column(String(255), nullable=False, default="Not Disclosed")
    approval_status: Mapped[str] = mapped_column(String(100), nullable=False, default="No Approval Record")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Maturity & Rollover Tracking
# ---------------------------------------------------------------------------

class MaturityRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_maturity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    security_name: Mapped[str] = mapped_column(String(255), nullable=False)
    maturity_date: Mapped[str] = mapped_column(String(100), nullable=False)
    rollover_terms: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A")
    authorized_by: Mapped[str] = mapped_column(String(255), nullable=False, default="Treasury Desk")
    action_required: Mapped[str] = mapped_column(String(100), nullable=False, default="Settle Cash")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Instrument Master Governance
# ---------------------------------------------------------------------------

class InstrumentRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_instrument_master"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    isin: Mapped[str] = mapped_column(String(50), nullable=False)
    issuer: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_class: Mapped[str] = mapped_column(String(100), nullable=False)
    credit_rating: Mapped[str] = mapped_column(String(100), nullable=False)
    allowed_per_ips: Mapped[str] = mapped_column(String(50), nullable=False, default="Yes")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Realised Gain/Loss Testing
# ---------------------------------------------------------------------------

class RealisedGainRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_realised_gain"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sold_security: Mapped[str] = mapped_column(String(255), nullable=False)
    sale_date: Mapped[str] = mapped_column(String(50), nullable=False)
    proceeds: Mapped[str] = mapped_column(String(100), nullable=False)
    calculated_cost_fifo: Mapped[str] = mapped_column(String(100), nullable=False)
    reported_gain_loss: Mapped[str] = mapped_column(String(100), nullable=False)
    auditor_recomputed: Mapped[str] = mapped_column(String(100), nullable=False)
    variance: Mapped[str] = mapped_column(String(100), nullable=False, default="$0")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Match")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Mandate & Policy Compliance
# ---------------------------------------------------------------------------

class MandateItem(Base, TenantMixin):
    __tablename__ = "mod_investments_mandates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Compliant")  # Compliant | Breach

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Accrued Income Ageing
# ---------------------------------------------------------------------------

class AccruedIncomeRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_accrued_income"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    security: Mapped[str] = mapped_column(String(255), nullable=False)
    interest_accrued: Mapped[str] = mapped_column(String(100), nullable=False)
    not_due: Mapped[str] = mapped_column(String(100), nullable=False, default="$0")
    overdue_1_30: Mapped[str] = mapped_column(String(100), nullable=False, default="$0")
    overdue_31_90: Mapped[str] = mapped_column(String(100), nullable=False, default="$0")
    overdue_90_plus: Mapped[str] = mapped_column(String(100), nullable=False, default="$0")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Impairment Trigger Screening
# ---------------------------------------------------------------------------

class ImpairmentRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_impairment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    security: Mapped[str] = mapped_column(String(255), nullable=False)
    holding_value: Mapped[str] = mapped_column(String(100), nullable=False)
    sp_rating: Mapped[str] = mapped_column(String(50), nullable=False)
    ifrs9_stage: Mapped[str] = mapped_column(String(100), nullable=False, default="Stage 1")
    impairment_triggered: Mapped[str] = mapped_column(String(10), nullable=False, default="No")
    provision_amount: Mapped[str] = mapped_column(String(100), nullable=False, default="$0")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Pledged / Lien Investments
# ---------------------------------------------------------------------------

class PledgedAsset(Base, TenantMixin):
    __tablename__ = "mod_investments_pledged_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pledged_asset: Mapped[str] = mapped_column(String(255), nullable=False)
    pledged_value: Mapped[str] = mapped_column(String(100), nullable=False)
    lienholder_bank: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose_facility: Mapped[str] = mapped_column(String(255), nullable=False)
    board_auth_date: Mapped[str] = mapped_column(String(50), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Broker & Dealing Controls
# ---------------------------------------------------------------------------

class BrokerRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_brokers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    broker_name: Mapped[str] = mapped_column(String(255), nullable=False)
    empaneled_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Empaneled")
    transaction_volume_ytd: Mapped[str] = mapped_column(String(100), nullable=False)
    share_pct: Mapped[str] = mapped_column(String(50), nullable=False)
    commission_paid: Mapped[str] = mapped_column(String(100), nullable=False)
    avg_commission_rate: Mapped[str] = mapped_column(String(50), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ---------------------------------------------------------------------------
# Disclosure & Classification (IFRS 9)
# ---------------------------------------------------------------------------

class DisclosureRecord(Base, TenantMixin):
    __tablename__ = "mod_investments_disclosures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    security: Mapped[str] = mapped_column(String(255), nullable=False)
    business_model: Mapped[str] = mapped_column(String(255), nullable=False)
    sppi_test_result: Mapped[str] = mapped_column(String(255), nullable=False)
    accounting_classification: Mapped[str] = mapped_column(String(100), nullable=False)
    appropriate: Mapped[str] = mapped_column(String(50), nullable=False, default="Passed")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())