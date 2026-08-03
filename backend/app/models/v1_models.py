"""Centralized Relational Database Models for IAOS Core Modules."""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, String, Text, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class AuditUniverse(Base):
    """Audit Universe model tracking auditable business units."""

    __tablename__ = "mod_audit_universe"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    unit_name: Mapped[str] = mapped_column(String(255), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(50), nullable=False, default="Medium Risk")
    lead_auditor: Mapped[str] = mapped_column(String(255), nullable=False, default="Lead Auditor")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="In Progress")
    scope_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "unit_name": self.unit_name,
            "unit": self.unit_name,  # alias for UI compatibility
            "risk_level": self.risk_level,
            "riskCategory": self.risk_level,
            "lead_auditor": self.lead_auditor,
            "leadAuditor": self.lead_auditor,
            "status": self.status,
            "scope_flag": self.scope_flag,
            "inScope": "Yes" if self.scope_flag else "No",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ComplianceRules(Base):
    """Compliance Rules model governing automated audit checks."""

    __tablename__ = "mod_compliance_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    rule_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    metric_type: Mapped[str] = mapped_column(String(100), nullable=False, default="issuer_exposure_pct")
    numeric_threshold: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "rule_name": self.rule_name,
            "description": self.description,
            "metric_type": self.metric_type,
            "threshold_type": self.metric_type,
            "numeric_threshold": self.numeric_threshold,
            "threshold_value": self.numeric_threshold,
            "is_active": self.is_active,
            "status": "Active" if self.is_active else "Inactive",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DataConnectors(Base):
    """Data Connectors model tracking system integrations and sync status."""

    __tablename__ = "mod_data_connectors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    connection_type: Mapped[str] = mapped_column(String(100), nullable=False, default="REST API")
    connection_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Connected")
    last_sync_timestamp: Mapped[str] = mapped_column(String(100), nullable=False, default="Just now")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "source_name": self.source_name,
            "connection_type": self.connection_type,
            "connection_status": self.connection_status,
            "last_sync_timestamp": self.last_sync_timestamp,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class AuditSimulations(Base):
    """Audit Simulations model for sample size & tolerance testing engines."""

    __tablename__ = "mod_audit_simulations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    procedure_name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_sample_size: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    tolerance_limit: Mapped[float] = mapped_column(Float, nullable=False, default=0.05)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Pending")
    logs: Mapped[str] = mapped_column(Text, nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "procedure_name": self.procedure_name,
            "target_sample_size": self.target_sample_size,
            "tolerance_limit": self.tolerance_limit,
            "status": self.status,
            "logs": self.logs,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ExceptionQueue(Base):
    """Exception Queue model tracking flagged asset mismatches."""

    __tablename__ = "mod_exception_queue"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    security_description: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_amount: Mapped[str] = mapped_column(String(255), nullable=False, default="$0.00")
    mismatch_reason: Mapped[str] = mapped_column(Text, nullable=False, default="")
    report_date: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    severity_level: Mapped[str] = mapped_column(String(50), nullable=False, default="Medium")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Unresolved")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "security_description": self.security_description,
            "security": self.security_description,  # alias for UI compatibility
            "asset_amount": self.asset_amount,
            "amount": self.asset_amount,  # alias for UI compatibility
            "mismatch_reason": self.mismatch_reason,
            "exception": self.mismatch_reason,  # alias for UI compatibility
            "report_date": self.report_date,
            "date": self.report_date,  # alias for UI compatibility
            "severity_level": self.severity_level,
            "severity": self.severity_level,  # alias for UI compatibility
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class RemediationCAPA(Base):
    """Remediation CAPA model tracking action plans and owners."""

    __tablename__ = "mod_remediation_capa"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    finding_ref: Mapped[str] = mapped_column(String(100), nullable=False)
    action_plan_description: Mapped[str] = mapped_column(Text, nullable=False)
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Open")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "finding_ref": self.finding_ref,
            "ref": self.finding_ref,
            "action_plan_description": self.action_plan_description,
            "description": self.action_plan_description,
            "owner": self.owner,
            "due_date": self.due_date,
            "targetCloseDate": self.due_date,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SignatureAuditProcedures(Base):
    """Signature Audit Procedures model tracking all 15 audit scripts."""

    __tablename__ = "mod_signature_audit_procedures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="General")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    last_run: Mapped[str] = mapped_column(String(100), nullable=False, default="Never")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Idle")
    sample_size: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    exceptions_found: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    parameters: Mapped[str] = mapped_column(Text, nullable=False, default="{}")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "last_run": self.last_run,
            "status": self.status,
            "sample_size": self.sample_size,
            "exceptions_found": self.exceptions_found,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
