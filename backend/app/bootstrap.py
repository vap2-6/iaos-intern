"""First-run bootstrap: create tables, seed data, and super admin."""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.v1_models import (
    AuditUniverse,
    ComplianceRules,
    DataConnectors,
    AuditSimulations,
    ExceptionQueue,
    RemediationCAPA,
    SignatureAuditProcedures,
)


def create_all_tables():
    # Importing app.models + every module's models happens before this call,
    # so metadata already knows about all platform and module tables.
    Base.metadata.create_all(bind=engine)
    seed_initial_data()


def seed_initial_data():
    """Seeds rich relational data into normalized tables if empty."""
    db: Session = SessionLocal()
    try:
        # 1. Seed AuditUniverse
        if db.query(AuditUniverse).count() == 0:
            units = [
                AuditUniverse(unit_name="Corporate Treasury Operations", risk_level="High Risk", lead_auditor="Sarah Jenkins", status="In Progress", scope_flag=True),
                AuditUniverse(unit_name="Offshore Subsidiary Holdings", risk_level="Medium Risk", lead_auditor="David Miller", status="In Progress", scope_flag=True),
                AuditUniverse(unit_name="Commercial Paper Liquidity Pool", risk_level="Low Risk", lead_auditor="Emily Watson", status="Completed", scope_flag=False),
                AuditUniverse(unit_name="Structured Debt & Fixed Income Desk", risk_level="High Risk", lead_auditor="Michael Chang", status="Scheduled", scope_flag=True),
            ]
            db.add_all(units)

        # 2. Seed ComplianceRules
        if db.query(ComplianceRules).count() == 0:
            rules = [
                ComplianceRules(rule_name="Single Issuer Exposure Cap", description="Triggers an exception if single security exceeds 10% portfolio value.", metric_type="issuer_exposure_pct", numeric_threshold=10.0, is_active=True),
                ComplianceRules(rule_name="Minimum Issuer Credit Rating Check", description="Flags securities with credit rating below BBB+ (scale 6.0).", metric_type="min_credit_rating", numeric_threshold=6.0, is_active=True),
                ComplianceRules(rule_name="Sector Concentration Limit", description="Flags sector exposure exceeding 25% portfolio ceiling.", metric_type="sector_concentration_pct", numeric_threshold=25.0, is_active=True),
                ComplianceRules(rule_name="Dividend Receipt Variance Test", description="Flags dividend/coupon income deviating > 1.0% from expected value.", metric_type="dividend_variance_pct", numeric_threshold=1.0, is_active=False),
            ]
            db.add_all(rules)

        # 3. Seed DataConnectors
        if db.query(DataConnectors).count() == 0:
            connectors = [
                DataConnectors(source_name="NSDL / CDSL Custody API", connection_type="REST API", connection_status="Connected", last_sync_timestamp="Today at 10:45 AM"),
                DataConnectors(source_name="Bloomberg Market Pricing Feed", connection_type="FIX Protocol", connection_status="Connected", last_sync_timestamp="Today at 11:00 AM"),
                DataConnectors(source_name="SAP S/4HANA ERP Treasury Subledger", connection_type="SQL DB Integration", connection_status="Connected", last_sync_timestamp="Today at 09:30 AM"),
                DataConnectors(source_name="BNY Mellon Custodian Vault", connection_type="SFTP Secure Batch", connection_status="Connected", last_sync_timestamp="Yesterday at 11:59 PM"),
            ]
            db.add_all(connectors)

        # 4. Seed AuditSimulations
        if db.query(AuditSimulations).count() == 0:
            sims = [
                AuditSimulations(procedure_name="Holdings Reconciliation Engine", target_sample_size=500, tolerance_limit=0.01, status="Completed", logs="[System Log] Standard sample run completed with 0.02% variance."),
                AuditSimulations(procedure_name="Valuation & Fair-Value Sampling Engine", target_sample_size=250, tolerance_limit=0.05, status="Completed", logs="[System Log] Price validation tested against Bloomberg terminal feeds."),
            ]
            db.add_all(sims)

        # 5. Seed ExceptionQueue
        if db.query(ExceptionQueue).count() == 0:
            exceptions = [
                ExceptionQueue(security_description="Tesla Inc. Corporate Note 2028", asset_amount="$12.5M", mismatch_reason="Delegated authority limit breach ($12.5M execution vs $5.0M threshold)", report_date="2026-07-23", severity_level="High", status="Unresolved"),
                ExceptionQueue(security_description="Vertex Pharma Commercial Paper", asset_amount="$8.0M", mismatch_reason="Credit rating downgraded to BBB+ below investment policy target", report_date="2026-07-23", severity_level="High", status="Investigating"),
                ExceptionQueue(security_description="Evergreen Real Estate Trust", asset_amount="$4.2M", mismatch_reason="Demat custodian physical quantity discrepancy (+200 units)", report_date="2026-07-24", severity_level="Medium", status="Unresolved"),
            ]
            db.add_all(exceptions)

        # 6. Seed RemediationCAPA
        if db.query(RemediationCAPA).count() == 0:
            capas = [
                RemediationCAPA(finding_ref="OBS-INV-001", action_plan_description="Obtain retrospective Board Committee approval for Tesla Inc $12.5M purchase.", owner="CFO Office", due_date="2026-08-30", status="Open"),
                RemediationCAPA(finding_ref="OBS-INV-002", action_plan_description="Execute credit waiver review or orderly exit for Vertex Pharma paper under IPS guidelines.", owner="Risk Desk", due_date="2026-09-15", status="In Review"),
            ]
            db.add_all(capas)

        # 7. Seed SignatureAuditProcedures (All 15 procedures!)
        if db.query(SignatureAuditProcedures).count() == 0:
            signatures = [
                SignatureAuditProcedures(code="holdings_reconciliation", name="Holdings vs Custodian Reconciliation", category="Core Treasury", description="Reconciles internal ERP ledger quantities with custodian statements (NSDL/CDSL/BNY Mellon).", last_run="Today at 10:30 AM", status="Passed", sample_size=450, exceptions_found=0),
                SignatureAuditProcedures(code="valuation_testing", name="Valuation & Fair-Value Testing", category="Valuation", description="Validates security mark-to-market prices against independent pricing feeds (Bloomberg/Reuters).", last_run="Today at 09:15 AM", status="Passed", sample_size=320, exceptions_found=0),
                SignatureAuditProcedures(code="board_approval_limits", name="Board Approval & Delegated Limits Audit", category="Governance", description="Verifies transactions comply with CFO and Investment Committee delegated monetary authority caps.", last_run="Yesterday at 04:00 PM", status="Warning", sample_size=120, exceptions_found=1),
                SignatureAuditProcedures(code="income_recomputation", name="Income & Yield Recomputation", category="Income", description="Recalculates accrued interest, coupon payments, and dividend receipts against deal terms.", last_run="Today at 08:00 AM", status="Passed", sample_size=280, exceptions_found=0),
                SignatureAuditProcedures(code="concentration_exposure", name="Sector & Concentration Exposure Audit", category="Risk Management", description="Monitors single-issuer and sector concentration limits against Investment Policy Statement ceilings.", last_run="Today at 11:00 AM", status="Passed", sample_size=150, exceptions_found=0),
                SignatureAuditProcedures(code="counterparty_risk", name="Counterparty Risk & Credit Rating Monitoring", category="Risk Management", description="Tracks credit rating migrations and counterparty credit limit utilization across issuers.", last_run="Today at 10:00 AM", status="Warning", sample_size=95, exceptions_found=1),
                SignatureAuditProcedures(code="liquidity_coverage", name="Liquidity Coverage & Cash Cushion Audit", category="Treasury Ops", description="Audits short-term liquidity reserves, commercial paper maturities, and cash buffer ratios.", last_run="Yesterday at 05:30 PM", status="Passed", sample_size=75, exceptions_found=0),
                SignatureAuditProcedures(code="collateral_haircut", name="Collateral Haircut & Margin Audit", category="Derivatives", description="Evaluates haircut calculations, pledged collateral valuations, and margin call compliance.", last_run="2 days ago", status="Passed", sample_size=60, exceptions_found=0),
                SignatureAuditProcedures(code="derivatives_audit", name="Derivatives & Hedging Policy Audit", category="Derivatives", description="Verifies hedge effectiveness testing, swap valuations, and ISDA documentation compliance.", last_run="3 days ago", status="Passed", sample_size=40, exceptions_found=0),
                SignatureAuditProcedures(code="esg_compliance", name="ESG & Sustainability Policy Audit", category="Compliance", description="Audits portfolio compliance with ESG exclusion lists and green bond certification rules.", last_run="1 week ago", status="Passed", sample_size=110, exceptions_found=0),
                SignatureAuditProcedures(code="fee_structure_audit", name="Investment Fee & Management Expense Audit", category="Accounting", description="Recomputes asset management fees, custodian charges, and brokerage commission schedules.", last_run="4 days ago", status="Passed", sample_size=180, exceptions_found=0),
                SignatureAuditProcedures(code="custody_reconciliation", name="Demat & Custody Statement Audit", category="Core Treasury", description="Performs line-by-line demat account statement verification against physical ISIN registries.", last_run="Today at 09:45 AM", status="Passed", sample_size=500, exceptions_found=0),
                SignatureAuditProcedures(code="transfer_pricing", name="Inter-Company Investment & Transfer Pricing", category="Tax & Accounting", description="Audits inter-company loans, intra-group investment notes, and arm's-length interest pricing.", last_run="5 days ago", status="Passed", sample_size=30, exceptions_found=0),
                SignatureAuditProcedures(code="tax_withholding", name="Tax Withholding & Dividend TDS Audit", category="Tax & Accounting", description="Verifies tax deduction at source (TDS) calculations on interest income and foreign dividends.", last_run="3 days ago", status="Passed", sample_size=210, exceptions_found=0),
                SignatureAuditProcedures(code="corporate_actions", name="Corporate Actions & Rights Issue Audit", category="Core Treasury", description="Tracks bonus issues, rights offerings, stock splits, and warrant redemptions against ledger entries.", last_run="Yesterday at 02:00 PM", status="Passed", sample_size=85, exceptions_found=0),
            ]
            db.add_all(signatures)

        db.commit()
        print("[bootstrap] Successfully initialized centralized relational database seed data.")
    except Exception as e:
        db.rollback()
        print(f"[bootstrap] Error seeding initial data: {e}")
    finally:
        db.close()


def ensure_super_admin():
    db: Session = SessionLocal()
    try:
        existing = (
            db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        )
        if existing:
            return
        admin = User(
            email=settings.SUPERADMIN_EMAIL,
            full_name=settings.SUPERADMIN_NAME,
            hashed_password=hash_password(settings.SUPERADMIN_PASSWORD),
            role=UserRole.SUPER_ADMIN,
            tenant_id=None,
        )
        db.add(admin)
        db.commit()
        print(f"[bootstrap] created super admin: {settings.SUPERADMIN_EMAIL}")
    finally:
        db.close()
