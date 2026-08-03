"""Platform models. Importing this package registers them on Base.metadata."""
from app.models.tenant import Tenant  # noqa: F401
from app.models.user import User, UserRole  # noqa: F401
from app.models.v1_models import (  # noqa: F401
    AuditUniverse,
    ComplianceRules,
    DataConnectors,
    AuditSimulations,
    ExceptionQueue,
    RemediationCAPA,
    SignatureAuditProcedures,
)

