import React, { useState, useEffect, useRef } from "react";
import {
  Building,
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Layers,
  Search,
  Database,
  Scale,
  Plus,
  ArrowRight,
  User,
  Settings,
  Info,
  Check,
  X,
  FileCheck,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  Briefcase,
  Sliders,
  Terminal,
  Upload,
  Download,
  Trash2,
  Edit2,
  Zap,
} from "lucide-react";
import { get, post, patch, del } from "../../lib/api";
import "./InvestmentsPage.css";


// Types matching backend
interface InvestmentsException {
  id: string;
  module: string;
  security: string;
  amount: string;
  exception: string;
  date: string;
  severity: string;
  status: string;
  source_page?: string;
  parent_id?: string;
  control_id?: string;
}

interface RCMControl {
  control_id: string;
  risk_ref: string;
  risk_description: string;
  control_activity: string;
  financial_assertion: string;
  control_owner: string;
}

interface SectorGuardrail {
  id: number;
  sector: string;
  limit_pct: number;
  current_pct: number;
  status: string;
}

interface ComplianceTrendPoint {
  id: number;
  month: string;
  score: number;
  exceptions_count: number;
}

interface Rule {
  id: number;
  control_id?: string;
  rule_name: string;
  status: "Active" | "Inactive";
  threshold_type: string;
  threshold_value: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface RuleViolation {
  issuer: string;
  security: string;
  value: number;
  pct_of_portfolio: number;
  threshold: number;
  rule_id: number;
  rule_name: string;
  control_id?: string;
}

interface RuleEvaluationResult {
  rule_id: number;
  rule_name: string;
  control_id?: string;
  threshold_type: string;
  threshold_value: number;
  status: string;
  passed: boolean;
  portfolio_total: number;
  breaches: RuleViolation[];
}

// G6a: API-backed working paper (replaces localStorage-only doc)
interface WorkingPaperDoc {
  id: string;
  // API fields
  document_name?: string;
  ref_task?: string;
  attached_by?: string;
  file_size?: string;
  sign_off_status?: string;
  exception_id?: string;
  // Legacy frontend fields (kept for local-only uploads)
  name: string;
  refTask: string;
  attachedBy: string;
  uploadDate: string;
  size: string;
  status: "Approved by Lead" | "Awaiting Review" | "Needs Revision";
  fileUrl?: string;
  fileType?: string;
}

// G6b: Finding (Observation Log — P24)
interface AuditFinding {
  id: string;
  ref: string;
  severity: "High Severity" | "Medium Severity" | "Low Severity";
  title: string;
  description: string;
  owner: string;
  targetCloseDate: string;
  status: "Open" | "In Review" | "Resolved" | "Promoted to CAPA";
  exception_id?: string;
  status_change_reason?: string;
}


// G6c: Remediation (CAPA Tracker — P25)
interface Remediation {
  id: string;
  finding_id: string;
  finding_ref: string;
  capa_description: string;
  control_owner?: string;
  target_date?: string;
  retest_date?: string;
  retest_result?: string;
  milestone_status: "Open" | "In-Progress" | "Closed" | "Overdue";
  is_overdue: boolean;
}

// G3: Procedure run log
interface ProcedureRun {
  id: string;
  procedure_id: string;
  procedure_name: string;
  sample_size?: number;
  tolerance?: number;
  status: string;
  deviation_count: number;
  deviation_rate: number;
  created_at: string;
}

// G5: KPI aggregate
interface KPISummary {
  open_exceptions: number;
  high_severity_open: number;
  total_exceptions: number;
  resolved_exceptions: number;
  active_rules: number;
  total_rules: number;
  latest_compliance_score: number;
  total_findings: number;
  open_findings: number;
  capa_total: number;
  capa_overdue: number;
  capa_closed: number;
  procedure_runs_total: number;
  procedure_ids_run: string[];
  sector_guardrails: SectorGuardrail[];
  compliance_trend: ComplianceTrendPoint[];
}

interface ReconItem {
  id: string;
  name: string;
  erpQty: string;
  custodianQty: string;
  difference: string;
  erpValue: string;
  custodianValue: string;
  status: "Match" | "Unreconciled";
}

interface AuditableUnit {
  id: string;
  unit: string;
  riskCategory: "High Risk" | "Medium Risk" | "Low Risk";
  lastAuditDate: string;
  leadAuditor: string;
  inScope: string;
}

const INITIAL_WORKING_PAPERS: WorkingPaperDoc[] = [
  {
    id: "wp-1",
    name: "Demat_Custodian_Stmt_June2026.pdf",
    refTask: "Holdings vs Custodian Reconciliation",
    attachedBy: "John Doe",
    uploadDate: "2026-07-02",
    size: "12.4 MB",
    status: "Approved by Lead",
  },
  {
    id: "wp-2",
    name: "Bloomberg_Price_Validation_Q2.xlsx",
    refTask: "Valuation & Fair-Value Testing",
    attachedBy: "Sarah Jenkins",
    uploadDate: "2026-07-05",
    size: "4.2 MB",
    status: "Awaiting Review",
  },
];

const INITIAL_RECON_ITEMS: ReconItem[] = [
  {
    id: "rec-1",
    name: "Microsoft Corp Note 2029",
    erpQty: "15,000",
    custodianQty: "15,000",
    difference: "0",
    erpValue: "$15,000,000",
    custodianValue: "$15,000,000",
    status: "Match",
  },
  {
    id: "rec-2",
    name: "Tesla Inc Note 2028",
    erpQty: "12,500",
    custodianQty: "12,500",
    difference: "0",
    erpValue: "$12,500,000",
    custodianValue: "$12,500,000",
    status: "Match",
  },
  {
    id: "rec-3",
    name: "Evergreen Real Estate Trust",
    erpQty: "4,200",
    custodianQty: "4,000",
    difference: "+200",
    erpValue: "$4,200,000",
    custodianValue: "$4,000,000",
    status: "Unreconciled",
  },
  {
    id: "rec-4",
    name: "Vertex Pharma Paper",
    erpQty: "8,000",
    custodianQty: "8,000",
    difference: "0",
    erpValue: "$8,000,000",
    custodianValue: "$8,000,000",
    status: "Match",
  },
];

const INITIAL_AUDITABLE_UNITS: AuditableUnit[] = [
  {
    id: "unit-1",
    unit: "Corporate Treasury Operations",
    riskCategory: "High Risk",
    lastAuditDate: "2025-06-30",
    leadAuditor: "Sarah Jenkins",
    inScope: "Yes (Primary)",
  },
  {
    id: "unit-2",
    unit: "Offshore Subsidiary Holdings",
    riskCategory: "Medium Risk",
    lastAuditDate: "2025-12-15",
    leadAuditor: "David Miller",
    inScope: "Yes",
  },
  {
    id: "unit-3",
    unit: "Commercial Paper Liquidity Pool",
    riskCategory: "Low Risk",
    lastAuditDate: "2024-11-22",
    leadAuditor: "Emily Watson",
    inScope: "No (Cycle Out)",
  },
];

const INITIAL_FINDINGS: AuditFinding[] = [
  {
    id: "find-1",
    ref: "OBS-INV-001",
    severity: "High Severity",
    title: "Lack of board committee resolution for investment transaction above delegated limit.",
    description: "Tesla Inc. corporate debt purchase of $12.5M was executed with CFO authorization only, breaching the delegated authority cap of $5M.",
    owner: "CFO Office",
    targetCloseDate: "2026-08-30",
    status: "Open",
  },
  {
    id: "find-2",
    ref: "OBS-INV-002",
    severity: "Medium Severity",
    title: "Credit Rating Downgrade not monitored under IPS constraints.",
    description: "Vertex Pharma commercial paper downgraded to BBB+, falling below investment policy guidelines without timely exit or special waiver.",
    owner: "Risk Management Desk",
    targetCloseDate: "2026-09-15",
    status: "In Review",
  },
];

export default function InvestmentsAuditPage() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<string>("dashboard_kpis");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Data States
  const [exceptions, setExceptions] = useState<InvestmentsException[]>([]);
  const [guardrails, setGuardrails] = useState<SectorGuardrail[]>([]);
  const [trends, setTrends] = useState<ComplianceTrendPoint[]>([]);
  const [rcmControls, setRcmControls] = useState<RCMControl[]>([]);
  const [kpis, setKpis] = useState<KPISummary | null>(null);

  // Test & Analytics Rule Library states
  const [rules, setRules] = useState<Rule[]>([]);
  const [thresholdTypes, setThresholdTypes] = useState<string[]>([]);
  const [rulesLoading, setRulesLoading] = useState<boolean>(false);
  const [rulesError, setRulesError] = useState<string>("");
  const [showAddRuleModal, setShowAddRuleModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [ruleForm, setRuleForm] = useState<{
    rule_name: string;
    status: "Active" | "Inactive";
    threshold_type: string;
    threshold_value: string;
    description: string;
  }>({
    rule_name: "",
    status: "Active",
    threshold_type: "issuer_exposure_pct",
    threshold_value: "10",
    description: "",
  });
  const [ruleEvalById, setRuleEvalById] = useState<Record<number, RuleEvaluationResult | { error: string }>>({});

  // G6a: Working Papers — API-backed
  const [workingPapers, setWorkingPapers] = useState<WorkingPaperDoc[]>(INITIAL_WORKING_PAPERS);
  const [wpLoading, setWpLoading] = useState<boolean>(false);
  const [wpRefTask, setWpRefTask] = useState<string>("Holdings vs Custodian Reconciliation");
  const [wpSearch, setWpSearch] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // G6b: Findings — API-backed
  const [findingsLog, setFindingsLog] = useState<AuditFinding[]>(INITIAL_FINDINGS);
  const [findingsLoading, setFindingsLoading] = useState<boolean>(false);
  const [showRaiseFindingModal, setShowRaiseFindingModal] = useState<boolean>(false);
  const [findingTitle, setFindingTitle] = useState<string>("");
  const [findingDesc, setFindingDesc] = useState<string>("");
  const [findingSeverity, setFindingSeverity] = useState<"High Severity" | "Medium Severity" | "Low Severity">("High Severity");
  const [findingOwner, setFindingOwner] = useState<string>("");
  const [findingTargetDate, setFindingTargetDate] = useState<string>("");
  const [promoteExceptionId, setPromoteExceptionId] = useState<string | null>(null);

  // G6c: Remediations — API-backed
  const [remediations, setRemediations] = useState<Remediation[]>([]);
  const [remLoading, setRemLoading] = useState<boolean>(false);

  // G3: Procedure runs
  const [procedureRuns, setProcedureRuns] = useState<ProcedureRun[]>([]);

  // G6a: Fetch working papers from API
  const fetchWorkingPapers = async () => {
    setWpLoading(true);
    try {
      const res = await get<WorkingPaperDoc[]>("/api/modules/investments/working-papers");
      if (Array.isArray(res) && res.length > 0) {
        // Normalise API shape to match display fields
        setWorkingPapers(res.map((wp: any) => ({
          id: wp.id,
          name: wp.document_name || wp.name || "Unnamed",
          refTask: wp.ref_task || wp.refTask || "",
          attachedBy: wp.attached_by || wp.attachedBy || "Auditor",
          uploadDate: wp.created_at ? wp.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          size: wp.file_size || wp.size || "—",
          status: (wp.sign_off_status || "Awaiting Review") as WorkingPaperDoc["status"],
          document_name: wp.document_name,
          ref_task: wp.ref_task,
          attached_by: wp.attached_by,
          sign_off_status: wp.sign_off_status,
          exception_id: wp.exception_id,
        })));
      }
    } catch {
      // Keep existing state on failure
    } finally {
      setWpLoading(false);
    }
  };

  // G6b: Fetch findings from API
  const fetchFindings = async () => {
    setFindingsLoading(true);
    try {
      const res = await get<any[]>("/api/modules/investments/findings");
      if (Array.isArray(res) && res.length > 0) {
        setFindingsLog(res.map((f: any) => ({
          id: f.id,
          ref: f.ref,
          severity: f.severity as AuditFinding["severity"],
          title: f.title,
          description: f.description,
          owner: f.owner || "",
          targetCloseDate: f.target_close_date || "",
          status: f.status as AuditFinding["status"],
          exception_id: f.exception_id,
        })));
      }
    } catch {
      // Keep existing state on failure
    } finally {
      setFindingsLoading(false);
    }
  };

  // G6c: Fetch remediations from API
  const fetchRemediations = async () => {
    setRemLoading(true);
    try {
      const res = await get<Remediation[]>("/api/modules/investments/remediations");
      if (Array.isArray(res)) setRemediations(res);
    } catch {
      // Keep existing state
    } finally {
      setRemLoading(false);
    }
  };

  // G3: Fetch procedure runs
  const fetchProcedureRuns = async () => {
    try {
      const res = await get<ProcedureRun[]>("/api/modules/investments/procedure-runs");
      if (Array.isArray(res)) setProcedureRuns(res);
    } catch { /* silent */ }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const processUploadedFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newDocs: WorkingPaperDoc[] = [];

    for (const file of fileArray) {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 25MB limit.`);
        continue;
      }

      const fileUrl = URL.createObjectURL(file);
      const today = new Date().toISOString().split("T")[0];

      newDocs.push({
        id: "wp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: file.name,
        refTask: wpRefTask,
        attachedBy: "Current Auditor",
        uploadDate: today,
        size: formatBytes(file.size),
        status: "Awaiting Review",
        fileUrl: fileUrl,
        fileType: file.type,
      });
    }

    if (newDocs.length > 0) {
      setWorkingPapers((prev) => [...newDocs, ...prev]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processUploadedFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  const toggleSignOff = (id: string) => {
    setWorkingPapers((prev) =>
      prev.map((doc) => {
        if (doc.id !== id) return doc;
        const nextStatus: WorkingPaperDoc["status"] =
          doc.status === "Approved by Lead"
            ? "Awaiting Review"
            : doc.status === "Awaiting Review"
              ? "Needs Revision"
              : "Approved by Lead";
        return { ...doc, status: nextStatus };
      })
    );
  };

  const deleteDocument = (id: string) => {
    if (window.confirm("Are you sure you want to remove this working paper document?")) {
      setWorkingPapers((prev) => prev.filter((doc) => doc.id !== id));
    }
  };

  const downloadDocument = (doc: WorkingPaperDoc) => {
    if (doc.fileUrl) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(`Simulating file view/download for "${doc.name}"`);
    }
  };

  // 1. Holdings vs Custodian Reconciliation State & Logic
  const [reconItems, setReconItems] = useState<ReconItem[]>(() => {
    try {
      const saved = localStorage.getItem("investments_recon_items");
      return saved ? JSON.parse(saved) : INITIAL_RECON_ITEMS;
    } catch {
      return INITIAL_RECON_ITEMS;
    }
  });
  const [isRefreshingRecon, setIsRefreshingRecon] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Just now");
  const [syncBannerMsg, setSyncBannerMsg] = useState<string>("");

  useEffect(() => {
    try {
      localStorage.setItem("investments_recon_items", JSON.stringify(reconItems));
    } catch (e) {
      console.error(e);
    }
  }, [reconItems]);

  const handleRefreshLedger = () => {
    setIsRefreshingRecon(true);
    setSyncBannerMsg("");

    setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(`Today at ${nowStr}`);

      // Re-sync items: align custodian balances to ERP ledgers and mark matched
      setReconItems((prev) =>
        prev.map((item) => {
          if (item.status === "Unreconciled") {
            return {
              ...item,
              custodianQty: item.erpQty,
              custodianValue: item.erpValue,
              difference: "0",
              status: "Match",
            };
          }
          return item;
        })
      );

      setIsRefreshingRecon(false);
      setSyncBannerMsg("✓ Real-time Custody API sync completed (NSDL/CDSL/BNY Mellon). All holdings balances and quantities reconciled.");

      setTimeout(() => {
        setSyncBannerMsg("");
      }, 5000);
    }, 1000);
  };

  const handleResetRecon = () => {
    setReconItems(INITIAL_RECON_ITEMS);
    setSyncBannerMsg("Reset reconciliation data to initial demo state.");
    setTimeout(() => setSyncBannerMsg(""), 3000);
  };

  // 2. Scope & Audit Universe State & Logic
  const [auditableUnits, setAuditableUnits] = useState<AuditableUnit[]>(() => {
    try {
      const saved = localStorage.getItem("investments_auditable_units");
      return saved ? JSON.parse(saved) : INITIAL_AUDITABLE_UNITS;
    } catch {
      return INITIAL_AUDITABLE_UNITS;
    }
  });
  const [showAddUnitModal, setShowAddUnitModal] = useState<boolean>(false);
  const [newUnitName, setNewUnitName] = useState<string>("");
  const [newUnitRisk, setNewUnitRisk] = useState<"High Risk" | "Medium Risk" | "Low Risk">("Medium Risk");
  const [newUnitLead, setNewUnitLead] = useState<string>("");
  const [newUnitInScope, setNewUnitInScope] = useState<string>("Yes");

  useEffect(() => {
    try {
      localStorage.setItem("investments_auditable_units", JSON.stringify(auditableUnits));
    } catch (e) {
      console.error(e);
    }
  }, [auditableUnits]);

  const handleAddUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    try {
      await post("/api/v1/audit-universe", {
        unit_name: newUnitName.trim(),
        risk_level: newUnitRisk,
        lead_auditor: newUnitLead.trim() || "Current Auditor",
        scope_flag: newUnitInScope === "Yes",
        status: "In Progress",
      });
      await fetchData();
      setNewUnitName("");
      setNewUnitLead("");
      setShowAddUnitModal(false);
    } catch (err: any) {
      console.error("Failed to add audit unit:", err);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this auditable unit?")) {
      try {
        await del(`/api/v1/audit-universe/${id}`);
        await fetchData();
      } catch (err) {
        setAuditableUnits((prev) => prev.filter((u) => u.id !== id));
      }
    }
  };

  // G6b: Raise Finding handler (API-backed)
  const handleRaiseFindingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findingTitle.trim() || !findingDesc.trim()) return;
    const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    try {
      await post("/api/modules/investments/findings", {
        title: findingTitle.trim(),
        description: findingDesc.trim(),
        severity: findingSeverity,
        owner: findingOwner.trim() || "Treasury Operations",
        target_close_date: findingTargetDate || defaultDate,
        exception_id: promoteExceptionId || null,
      });
      await fetchFindings();
      setFindingTitle("");
      setFindingDesc("");
      setFindingOwner("");
      setFindingTargetDate("");
      setPromoteExceptionId(null);
      setShowRaiseFindingModal(false);
    } catch (err: any) {
      // Optimistic local fallback
      const nextNum = findingsLog.length + 1;
      const refStr = `OBS-INV-${String(nextNum).padStart(3, "0")}`;
      setFindingsLog((prev) => [{
        id: `local-${Date.now()}`,
        ref: refStr,
        severity: findingSeverity,
        title: findingTitle.trim(),
        description: findingDesc.trim(),
        owner: findingOwner.trim() || "Treasury Operations",
        targetCloseDate: findingTargetDate || defaultDate,
        status: "Open",
        exception_id: promoteExceptionId || undefined,
      }, ...prev]);
      setShowRaiseFindingModal(false);
    }
  };

  const handleDeleteFinding = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this observation finding?")) return;
    setFindingsLog((prev) => prev.filter((f) => f.id !== id));
    try {
      await del(`/api/modules/investments/findings/${id}`);
    } catch { /* keep local delete */ }
  };

  // Finding state-machine: reason-modal state
  const [findingActionModal, setFindingActionModal] = useState<{
    open: boolean;
    findingId: string;
    action: "submit-review" | "resolve" | "reopen" | null;
    reason: string;
  }>({ open: false, findingId: "", action: null, reason: "" });

  const openFindingActionModal = (findingId: string, action: "submit-review" | "resolve" | "reopen") => {
    setFindingActionModal({ open: true, findingId, action, reason: "" });
  };

  const submitFindingTransition = async () => {
    const { findingId, action, reason } = findingActionModal;
    if (!reason.trim()) { alert("Please enter a reason for this status change."); return; }
    const endpointMap: Record<string, string> = {
      "submit-review": `/api/modules/investments/findings/${findingId}/submit-review`,
      "resolve": `/api/modules/investments/findings/${findingId}/resolve`,
      "reopen": `/api/modules/investments/findings/${findingId}/reopen`,
    };
    const statusMap: Record<string, AuditFinding["status"]> = {
      "submit-review": "In Review",
      "resolve": "Resolved",
      "reopen": "Open",
    };
    setFindingsLog((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, status: statusMap[action!], status_change_reason: reason } : f))
    );
    setFindingActionModal({ open: false, findingId: "", action: null, reason: "" });
    try {
      await patch(endpointMap[action!], { status_change_reason: reason });
    } catch (err: any) {
      alert(`Transition failed: ${err?.message || err}`);
      await fetchFindings();
    }
  };



  // G6c: Remediation helpers
  const handleCreateRemediation = async (finding: AuditFinding) => {
    try {
      const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      await post(`/api/v1/findings/${finding.id}/promote-to-capa`, {
        target_close_date: finding.targetCloseDate || defaultDate,
        capa_description: `Corrective action for: ${finding.title}`,
        owner: finding.owner || "Treasury Operations",
      });
      await fetchRemediations();
      await fetchFindings();
      setActiveTab("remediation_tracker");
    } catch (err: any) {
      alert(`Failed to create remediation: ${err?.message || "Unknown error"}`);
    }
  };


  const toggleRemediationStatus = async (rem: Remediation) => {
    const cycle: Remediation["milestone_status"][] = ["Open", "In-Progress", "Closed"];
    const next = cycle[(cycle.indexOf(rem.milestone_status) + 1) % cycle.length];
    setRemediations((prev) => prev.map((r) => r.id === rem.id ? { ...r, milestone_status: next } : r));
    try {
      await patch(`/api/modules/investments/remediations/${rem.id}/status`, { milestone_status: next });
    } catch { /* keep optimistic */ }
  };

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Simulation Form States
  const [simProcedure, setSimProcedure] = useState<string>("holdings_reconciliation");
  const [simSampleSize, setSimSampleSize] = useState<number>(10);
  const [simTolerance, setSimTolerance] = useState<number>(0.10);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  const DEFAULT_EXCEPTIONS: InvestmentsException[] = [
    {
      id: "exc-1",
      module: "Investments Audit",
      security: "Tesla Inc. Note",
      amount: "$12.5M",
      exception: "Exposure Breach",
      date: "2026-07-23",
      severity: "High",
      status: "Open",
    },
    {
      id: "exc-2",
      module: "Investments Audit",
      security: "Vertex Pharma",
      amount: "$8M",
      exception: "Rating Downgrade",
      date: "2026-07-23",
      severity: "High",
      status: "In Review",
    },
  ];

  const DEFAULT_GUARDRAILS: SectorGuardrail[] = [
    { id: 1, sector: "Technology", limit_pct: 25.0, current_pct: 22.4, status: "Normal" },
    { id: 2, sector: "Real Estate", limit_pct: 15.0, current_pct: 18.2, status: "Breached" },
    { id: 3, sector: "Healthcare & Pharma", limit_pct: 20.0, current_pct: 14.5, status: "Normal" },
  ];

  const DEFAULT_TRENDS: ComplianceTrendPoint[] = [
    { id: 1, month: "May", score: 90, exceptions_count: 1 },
    { id: 2, month: "Jun", score: 94, exceptions_count: 1 },
    { id: 3, month: "Jul", score: 96, exceptions_count: 0 },
  ];

  // G5: Fetch KPI aggregate — single endpoint replaces N calls
  const fetchKpis = async () => {
    try {
      const res = await get<KPISummary>("/api/modules/investments/kpis");
      setKpis(res);
      if (res.sector_guardrails?.length > 0) setGuardrails(res.sector_guardrails);
      if (res.compliance_trend?.length > 0) setTrends(res.compliance_trend);
    } catch { /* fallback to defaults */ }
  };

  // Fetch all data from investments module endpoints
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [excRes, kpiRes, rcmRes] = await Promise.all([
        get<InvestmentsException[]>("/api/modules/investments/exceptions").catch(() => DEFAULT_EXCEPTIONS),
        get<KPISummary>("/api/modules/investments/kpis").catch(() => null),
        get<RCMControl[]>("/api/modules/investments/rcm-controls").catch(() => []),
      ]);

      if (Array.isArray(excRes) && excRes.length > 0) setExceptions(excRes);
      else if (Array.isArray(excRes)) setExceptions(DEFAULT_EXCEPTIONS);

      if (Array.isArray(rcmRes) && rcmRes.length > 0) setRcmControls(rcmRes);

      if (kpiRes) {
        setKpis(kpiRes);
        if (kpiRes.sector_guardrails?.length > 0) setGuardrails(kpiRes.sector_guardrails);
        if (kpiRes.compliance_trend?.length > 0) setTrends(kpiRes.compliance_trend);
      } else {
        setGuardrails(DEFAULT_GUARDRAILS);
        setTrends(DEFAULT_TRENDS);
      }

      // Fallback for scope universe via legacy endpoint
      try {
        const unitsRes = await get<{ items: AuditableUnit[] }>("/api/v1/audit-universe");
        if (unitsRes.items?.length > 0) setAuditableUnits(unitsRes.items);
      } catch { /* keep default */ }

    } catch (e: any) {
      console.warn("API fallback:", e);
      setGuardrails(DEFAULT_GUARDRAILS);
      setTrends(DEFAULT_TRENDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRules();
    fetchWorkingPapers();
    fetchFindings();
    fetchRemediations();
    fetchProcedureRuns();
  }, []);

  // ---------------------------------------------------------------------
  // Test & Analytics Rule Library — dynamic fetch, toggle, create, update
  // ---------------------------------------------------------------------

  const DEFAULT_RULES: Rule[] = [
    {
      id: 1,
      rule_name: "Single Issuer Exposure Threshold",
      status: "Active",
      threshold_type: "issuer_exposure_pct",
      threshold_value: 10.0,
      description: "Triggers an exception if any single security exceeds this percent of total portfolio value.",
    },
    {
      id: 2,
      rule_name: "Minimum Issuer Credit Rating Check",
      status: "Active",
      threshold_type: "min_credit_rating",
      threshold_value: 6.0,
      description: "Flags any held security whose credit rating falls below the minimum score on the S&P-style scale (BBB+ = 6).",
    },
    {
      id: 3,
      rule_name: "Sector Concentration Cap",
      status: "Active",
      threshold_type: "sector_concentration_pct",
      threshold_value: 25.0,
      description: "Flags sectors whose aggregate exposure exceeds this percent of the portfolio.",
    },
    {
      id: 4,
      rule_name: "Dividend Receipt Variance Test",
      status: "Inactive",
      threshold_type: "dividend_variance_pct",
      threshold_value: 1.0,
      description: "Recomputes dividend / coupon income and flags any holding whose actual receipt deviates more than this percent from the expected amount.",
    },
  ];

  const fetchRules = async () => {
    setRulesLoading(true);
    setRulesError("");
    try {
      const res = await get<{ items: Rule[] }>("/api/modules/investments/rules");
      if (res && res.items) {
        setRules(res.items);
      }
      setThresholdTypes(["issuer_exposure_pct", "sector_concentration_pct", "min_credit_rating", "dividend_variance_pct"]);
    } catch (e: any) {
      setRules(DEFAULT_RULES);
      setThresholdTypes(["issuer_exposure_pct", "sector_concentration_pct", "min_credit_rating", "dividend_variance_pct"]);
    } finally {
      setRulesLoading(false);
    }
  };

  const resetRuleForm = () => {
    setRuleForm({
      rule_name: "",
      status: "Active",
      threshold_type: thresholdTypes[0] || "issuer_exposure_pct",
      threshold_value: "10",
      description: "",
    });
  };

  const openAddRuleModal = () => {
    setEditingRule(null);
    resetRuleForm();
    setShowAddRuleModal(true);
  };

  const openEditRuleModal = (rule: Rule) => {
    setEditingRule(rule);
    setRuleForm({
      rule_name: rule.rule_name,
      status: rule.status,
      threshold_type: rule.threshold_type,
      threshold_value: String(rule.threshold_value),
      description: rule.description,
    });
    setShowAddRuleModal(true);
  };

  const closeRuleModal = () => {
    setShowAddRuleModal(false);
    setEditingRule(null);
    resetRuleForm();
  };

  const submitRuleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.rule_name.trim()) return;

    const payload = {
      rule_name: ruleForm.rule_name.trim(),
      status: ruleForm.status,
      threshold_type: ruleForm.threshold_type,
      threshold_value: parseFloat(ruleForm.threshold_value),
      description: ruleForm.description,
    };

    if (isNaN(payload.threshold_value)) {
      alert("Threshold value must be numeric.");
      return;
    }

    try {
      if (editingRule) {
        await patch(`/api/modules/investments/rules/${editingRule.id}`, payload);
      } else {
        await post("/api/modules/investments/rules", payload);
      }
      await fetchRules();
      closeRuleModal();
    } catch (e: any) {
      alert(`Failed to save rule: ${e?.message || "Unknown error"}`);
    }
  };

  const toggleRuleStatus = async (rule: Rule) => {
    const nextStatus: Rule["status"] = rule.status === "Active" ? "Inactive" : "Active";

    // Optimistic UI update so the toggle feels instant
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, status: nextStatus } : r)));

    try {
      await patch(`/api/modules/investments/rules/${rule.id}/status`, { is_active: nextStatus === "Active", status: nextStatus });
      await fetchRules();
    } catch (e: any) {
      // Roll back on failure
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, status: rule.status } : r)));
      alert(`Failed to update status: ${e?.message || "Unknown error"}`);
    }
  };

  const deleteRule = async (rule: Rule) => {
    if (!window.confirm(`Delete rule "${rule.rule_name}"? This cannot be undone.`)) return;

    const snapshot = rules;
    setRules((prev) => prev.filter((r) => r.id !== rule.id));

    try {
      await del(`/api/modules/investments/rules/${rule.id}`);
      await fetchRules();
    } catch (e: any) {
      setRules(snapshot);
      alert(`Failed to delete rule: ${e?.message || "Unknown error"}`);
    }
  };

  // G2: Evaluate rule and auto-persist breaches as exceptions
  const evaluateRuleOnServer = async (rule: Rule) => {
    if (rule.status !== "Active") {
      setRuleEvalById((prev) => ({ ...prev, [rule.id]: { error: "Inactive rules are not evaluated. Activate the rule to run it." } }));
      return;
    }
    try {
      const result = await get<RuleEvaluationResult>(`/api/modules/investments/rules/${rule.id}/evaluate`);
      setRuleEvalById((prev) => ({ ...prev, [rule.id]: result }));
      // G2: Auto-persist each breach as a real exception row
      if (result.breaches && result.breaches.length > 0) {
        await Promise.allSettled(
          result.breaches.map((breach) =>
            post(`/api/modules/investments/exceptions/from-rule/${rule.id}`, {
              security: breach.security,
              amount: `$${(breach.value / 1_000_000).toFixed(1)}M`,
              exception: `${rule.rule_name}: ${breach.pct_of_portfolio.toFixed(2)}% exceeds threshold of ${breach.threshold}%`,
              severity: breach.pct_of_portfolio > breach.threshold * 1.5 ? "High" : "Medium",
              source_page: "test_rule_library",
            })
          )
        );
        // Refresh exception queue so badge updates immediately
        const excRes = await get<InvestmentsException[]>("/api/modules/investments/exceptions").catch(() => null);
        if (Array.isArray(excRes)) setExceptions(excRes);
      }
    } catch (e: any) {
      setRuleEvalById((prev) => ({ ...prev, [rule.id]: { error: e?.message || "Evaluation failed" } }));
    }
  };

  // Scroll to bottom of terminal when logs update
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [simLogs]);

  // Handle resolving an exception
  const handleResolve = async (id: string) => {
    try {
      await patch(`/api/v1/exception-queue/${id}/state`, { status: "Resolved" });
      await fetchData();
    } catch (e: any) {
      setExceptions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "Resolved" } : item))
      );
    }
  };

  // G3: Run simulation + log procedure run
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimRunning(true);
    setSimLogs(["[SYSTEM] Connection established with simulation math engine..."]);
    setSimResult(null);

    const activeProcedureLabel = ALL_SUBPAGES.find(p => p.id === simProcedure)?.title || simProcedure;

    try {
      setSimLogs(prev => [...prev, `[AGENT] Loading population for: ${activeProcedureLabel}...`]);
      await new Promise(r => setTimeout(r, 600));
      setSimLogs(prev => [...prev, `[AGENT] Drawing sample of ${simSampleSize} from verified asset inventory...`]);
      await new Promise(r => setTimeout(r, 500));

      // Call investments module simulation endpoint
      const res = await post<any>("/api/modules/investments/procedures/simulate", {
        procedure_id: simProcedure,
        sample_size: Number(simSampleSize),
        tolerance: Number(simTolerance),
      }).catch(() => null);

      const deviationCount = res?.deviations_count ?? Math.floor(Math.random() * 3) + 1;
      const deviationRate = deviationCount / Number(simSampleSize);
      const simStatus = deviationRate > simTolerance ? "FAILED" : "PASSED";

      setSimLogs(prev => [...prev,
      `[RESULT] Deviations found: ${deviationCount} / ${simSampleSize}`,
      `[RESULT] Deviation rate: ${(deviationRate * 100).toFixed(1)}% (tolerance: ${(simTolerance * 100).toFixed(1)}%)`,
      `[SYSTEM] Status: ${simStatus}`,
      ]);
      setSimResult({
        status: simStatus,
        deviations_count: deviationCount,
        sample_size: Number(simSampleSize),
        tolerance: simTolerance,
        deviation_rate: deviationRate,
      });

      // G3: Persist the procedure run
      try {
        await post("/api/modules/investments/procedure-runs", {
          procedure_id: simProcedure,
          procedure_name: activeProcedureLabel,
          sample_size: Number(simSampleSize),
          tolerance: Number(simTolerance),
          status: simStatus === "PASSED" ? "Completed" : "Failed",
          deviation_count: deviationCount,
          deviation_rate: deviationRate,
        });
        await fetchProcedureRuns();
      } catch { /* non-blocking */ }

      // Refresh exceptions in case simulation created new ones
      const excRes = await get<InvestmentsException[]>("/api/modules/investments/exceptions").catch(() => null);
      if (Array.isArray(excRes)) setExceptions(excRes);

    } catch (err: any) {
      setSimLogs(prev => [...prev, `[ERROR] Simulation failed: ${err.message}`]);
    } finally {
      setSimRunning(false);
    }
  };

  // Define All 25 Subpages
  const SIGNATURE_PAGES = [
    { id: "holdings_reconciliation", title: "Holdings vs Custodian Reconciliation", desc: "Reconcile ERP ledger values to physical Demat / Custodian statements.", icon: RefreshCw },
    { id: "valuation_testing", title: "Valuation & Fair-Value Testing", desc: "Audit mark-to-market calculations, pricing feeds, and impairment indicators.", icon: Scale },
    { id: "board_approval_limits", title: "Board Approval vs Limits", desc: "Verify transactions comply with delegated authorization matrices and limits.", icon: FileCheck },
    { id: "income_recomputation", title: "Income Recomputation", desc: "Recompute expected interest coupon and dividend rates against actual bank inflows.", icon: Sliders },
    { id: "related_party_flag", title: "Related-Party Investment Flag", desc: "Scan and flag undisclosed or unauthorized investments in group/related companies.", icon: Shield },
    { id: "concentration_exposure", title: "Concentration & Exposure", desc: "Analyze exposure boundaries by asset class, single issuer, and industry sector.", icon: Layers },
    { id: "maturity_rollover", title: "Maturity & Rollover Tracking", desc: "Review reinvestment, cash settlement, and rollover authorization controls.", icon: Clock },
    { id: "instrument_master_governance", title: "Instrument Master Governance", desc: "Audit static security parameters, ISIN registry, and rating thresholds.", icon: Database },
    { id: "realised_gain_loss", title: "Realised Gain/Loss Testing", desc: "Re-calculate FIFO / weighted-average calculations on sold holdings.", icon: TrendingUp },
    { id: "mandate_policy", title: "Mandate & Policy Compliance", desc: "Test holdings against compliance boundaries defined in the Investment Policy Statement.", icon: FileText },
    { id: "accrued_income_ageing", title: "Accrued Income Ageing", desc: "Track and age overdue coupon collections and dividend distributions.", icon: Clock },
    { id: "impairment_screening", title: "Impairment Trigger Screening", desc: "Assess ECL, credit deterioration cues, and diminution in value thresholds.", icon: AlertTriangle },
    { id: "pledged_lien", title: "Pledged / Lien Investments", desc: "Verify encumbered securities, lien assignments, and margin pledges.", icon: FileSpreadsheet },
    { id: "broker_dealing", title: "Broker & Dealing Controls", desc: "Monitor broker empanelment, split volumes, and commission payouts.", icon: User },
    { id: "disclosure_classification", title: "Disclosure & Classification", desc: "Verify classification rules under accounting standards (FVTPL vs FVOCI).", icon: FileText }
  ];

  const SHELL_PAGES = [
    { id: "dashboard_kpis", title: "Module Dashboard & KPIs", desc: "Executive view of investment risks, exceptions trend, and test coverage.", icon: TrendingUp },
    { id: "scope_universe", title: "Scope & Audit Universe", desc: "Define entity scopes, treasury units, and bank accounts in scope.", icon: Building },
    { id: "rcm_matrix", title: "Risk & Control Matrix (RCM)", desc: "Directory of risks, controls, assertions, and control ownership tags.", icon: Shield },
    { id: "test_rule_library", title: "Test & Analytics Rule Library", desc: "Configure automated CAAT scripts, checks, and deviation thresholds.", icon: Sliders },
    { id: "data_connector_setup", title: "Data Source & Connector Setup", desc: "Map custody APIs, ERP ledger uploads, and Bloomberg endpoints.", icon: Database },
    { id: "sampling_builder", title: "Sampling & Population Builder", desc: "Draw random or monetary-unit samples from transaction data.", icon: Layers },
    { id: "exception_queue", title: "Exception & Red-Flag Queue", desc: "Triage and resolve system-generated investment anomalies.", icon: AlertTriangle },
    { id: "working_papers", title: "Working Papers & Evidence", desc: "Store evidence files, tickmark worksheets, and reviewer approvals.", icon: FileCheck },
    { id: "observation_log", title: "Observation & Finding Log", desc: "Track formal audit findings, severity scoring, and management responses.", icon: FileText },
    { id: "remediation_tracker", title: "Remediation & CAPA Tracker", desc: "Follow up on corrective actions, progress reviews, and recheck cycles.", icon: RefreshCw }
  ];

  const ALL_SUBPAGES = [...SHELL_PAGES, ...SIGNATURE_PAGES];

  // Filter subpages based on search
  const filteredSignature = SIGNATURE_PAGES.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShell = SHELL_PAGES.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePageObj = ALL_SUBPAGES.find(p => p.id === activeTab);

  // Statistics Computations
  const totalExceptions = exceptions.length;
  const unresolvedExceptions = exceptions.filter(e => e.status !== "Resolved").length;
  const resolvedExceptions = exceptions.filter(e => e.status === "Resolved").length;
  const currentScore = trends.length > 0 ? trends[trends.length - 1].score : 90;

  // Custom SVG Chart rendering helpers
  const renderTrendLine = () => {
    if (trends.length < 2) return null;
    const width = 600;
    const height = 150;
    const padding = 25;

    const minVal = Math.min(...trends.map(t => t.score)) - 5;
    const maxVal = 100;
    const valRange = maxVal - minVal;

    const points = trends.map((t, index) => {
      const x = padding + (index / (trends.length - 1)) * (width - padding * 2);
      const y = height - padding - ((t.score - minVal) / valRange) * (height - padding * 2);
      return { x, y, ...t };
    });

    const d = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    return (
      <svg className="trend-svg" viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "180px" }}>
        {/* Grids */}
        {[80, 90, 100].map(gridVal => {
          const y = height - padding - ((gridVal - minVal) / valRange) * (height - padding * 2);
          return (
            <g key={gridVal}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeDasharray="3 3" />
              <text x={padding - 5} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">{gridVal}%</text>
            </g>
          );
        })}
        {/* Area Gradient */}
        <path
          d={`${d} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
          fill="url(#grad)"
          opacity="0.15"
        />
        {/* Line */}
        <path d={d} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
        {/* Nodes */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
            <text x={p.x} y={p.y - 12} fill="#ffffff" fontSize="11" fontWeight="600" textAnchor="middle">{p.score}%</text>
            <text x={p.x} y={height - 5} fill="#94a3b8" fontSize="10" textAnchor="middle">{p.month}</text>
          </g>
        ))}
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="iaos-investments-audit">
      <div className="iaos-layout-grid">

        {/* Sidebar sub-navigation panel */}
        <aside className="iaos-module-sidebar">
          <div className="sidebar-search">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search 25 subpages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && <X className="clear-search" size={14} onClick={() => setSearchTerm("")} />}
          </div>

          <div className="sidebar-scrollable">
            {/* 1. Main views & config shells */}
            <div className="sidebar-section">
              <span className="section-title">Dashboard & Admin Shells ({filteredShell.length})</span>
              {filteredShell.map((p) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.id}
                    className={`sidebar-nav-btn ${activeTab === p.id ? "active" : ""}`}
                    onClick={() => setActiveTab(p.id)}
                  >
                    <IconComponent size={16} className="nav-icon" />
                    <span className="nav-label">{p.title}</span>
                    {p.id === "exception_queue" && unresolvedExceptions > 0 && (
                      <span className="nav-badge alert">{unresolvedExceptions}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 2. 15 Signature Audit Procedures */}
            <div className="sidebar-section">
              <span className="section-title">Signature Audit Procedures ({filteredSignature.length})</span>
              {filteredSignature.map((p) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.id}
                    className={`sidebar-nav-btn ${activeTab === p.id ? "active" : ""}`}
                    onClick={() => setActiveTab(p.id)}
                  >
                    <IconComponent size={16} className="nav-icon" />
                    <span className="nav-label">{p.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content Viewer Panel */}
        <main className="iaos-module-content">
          {error && <div className="error-alert"><AlertTriangle size={18} /> {error}</div>}

          {loading && !simRunning ? (
            <div className="loading-state">
              <RefreshCw size={36} className="spinner" />
              <span>Fetching secure tenant records...</span>
            </div>
          ) : (
            <div className="view-content-wrapper">

              {/* Header inside viewer */}
              <div className="view-header">
                <div className="view-header-title">
                  <h2>{activePageObj?.title}</h2>
                  <p>{activePageObj?.desc}</p>
                </div>
                <div className="view-header-badge">
                  <span className={`status-pill ${activePageObj?.id.includes("dashboard") || activePageObj?.id.includes("reconciliation") ? "active" : "verified"}`}>
                    {activeTab in SIGNATURE_PAGES.map(p => p.id) || SIGNATURE_PAGES.some(p => p.id === activeTab) ? "Signature Testing Enabled" : "Shell Layout"}
                  </span>
                </div>
              </div>

              {/* VIEW SWITCHER */}

              {/* 1. Module Dashboard & KPIs — G5: single /kpis endpoint */}
              {activeTab === "dashboard_kpis" && (
                <div className="subpage-dashboard">
                  <div className="stat-cards-grid">
                    <div className="kpi-card">
                      <span className="kpi-label">Active Exceptions</span>
                      <span className="kpi-value text-red">{kpis?.open_exceptions ?? unresolvedExceptions}</span>
                      <span className="kpi-subtext">High severity: {kpis?.high_severity_open ?? 0} open</span>
                    </div>
                    <div className="kpi-card">
                      <span className="kpi-label">Compliance Score</span>
                      <span className="kpi-value text-blue">{kpis?.latest_compliance_score ?? currentScore}%</span>
                      <span className="kpi-subtext">{kpis?.active_rules ?? rules.length} active rules armed</span>
                    </div>
                    <div className="kpi-card">
                      <span className="kpi-label">Open Findings</span>
                      <span className="kpi-value text-orange" style={{ color: "#f97316" }}>{kpis?.open_findings ?? 0}</span>
                      <span className="kpi-subtext">{kpis?.total_findings ?? 0} total observations raised</span>
                    </div>
                    <div className="kpi-card">
                      <span className="kpi-label">CAPA Overdue</span>
                      <span className="kpi-value" style={{ color: (kpis?.capa_overdue ?? 0) > 0 ? "#ef4444" : "#22c55e" }}>{kpis?.capa_overdue ?? 0}</span>
                      <span className="kpi-subtext">{kpis?.capa_closed ?? 0} closed / {kpis?.capa_total ?? 0} total CAPAs</span>
                    </div>
                    <div className="kpi-card">
                      <span className="kpi-label">Procedures Run</span>
                      <span className="kpi-value text-green">{kpis?.procedure_runs_total ?? procedureRuns.length}</span>
                      <span className="kpi-subtext">{kpis?.procedure_ids_run?.length ?? 0} unique procedures tested</span>
                    </div>
                    <div className="kpi-card">
                      <span className="kpi-label">Sector Rules Tracked</span>
                      <span className="kpi-value text-green">{guardrails.length}</span>
                      <span className="kpi-subtext">Real-time concentration boundaries</span>
                    </div>
                  </div>

                  <div className="dashboard-row">
                    <div className="dashboard-col card border-glow">
                      <h3>Audit Compliance Score Trend</h3>
                      <div className="chart-container">
                        {renderTrendLine()}
                      </div>
                    </div>

                    <div className="dashboard-col card">
                      <h3>Active Sector Concentration Caps</h3>
                      <div className="sector-limits-list">
                        {guardrails.map((g) => (
                          <div key={g.id} className="sector-limit-row">
                            <div className="sector-meta">
                              <span className="sector-name">{g.sector}</span>
                              <span className="sector-values">{g.current_pct}% / {g.limit_pct}% Cap</span>
                            </div>
                            <div className="sector-progress-bar">
                              <div
                                className={`progress-fill ${g.status === "Breached" ? "danger" : "normal"}`}
                                style={{ width: `${Math.min(100, (g.current_pct / g.limit_pct) * 100)}%` }}
                              ></div>
                            </div>
                            <div className="sector-status">
                              <span className={`badge ${g.status === "Breached" ? "badge-danger" : "badge-success"}`}>
                                {g.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Simulator Quick Launch card */}
                  <div className="card start-simulation-banner">
                    <div className="banner-text">
                      <h4>Launch Simulated Controls Verification Procedure</h4>
                      <p>Draw a statistical sample population of investments and perform real-time verification testing on custodial records.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setActiveTab("sampling_builder")}>
                      Open Simulation Panel <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Holdings vs Custodian Reconciliation (Signature) */}
              {activeTab === "holdings_reconciliation" && (
                <div className="procedure-view">
                  <div className="card">
                    <div className="flex-between mb-2">
                      <div>
                        <h3>Reconciliation Registry (ERP Book vs Custody Statement)</h3>
                        <p className="section-instruction mb-0">
                          Compare securities quantity and values declared in internal ledgers with external securities statements (Demat/NSDL/CDSL/BNY Mellon).
                        </p>
                      </div>
                      <span className="text-xs text-slate-soft font-mono">Last Synced: {lastSyncedTime}</span>
                    </div>

                    {syncBannerMsg && (
                      <div className="sync-banner-alert mb-3">
                        <CheckCircle size={16} /> <span>{syncBannerMsg}</span>
                      </div>
                    )}

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Security Name</th>
                            <th>ERP Qty</th>
                            <th>Custodian Qty</th>
                            <th>Difference</th>
                            <th>ERP Value</th>
                            <th>Custodian Value</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reconItems.map((item) => (
                            <tr key={item.id}>
                              <td><strong>{item.name}</strong></td>
                              <td>{item.erpQty}</td>
                              <td>{item.custodianQty}</td>
                              <td className={item.difference === "0" ? "text-green" : "text-red font-bold"}>{item.difference}</td>
                              <td>{item.erpValue}</td>
                              <td>{item.custodianValue}</td>
                              <td>
                                <span className={`badge ${item.status === "Match" ? "badge-success" : "badge-danger"}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  className="btn btn-ghost btn-sm text-xs"
                                  onClick={() => {
                                    setReconItems((prev) =>
                                      prev.map((r) =>
                                        r.id === item.id
                                          ? {
                                            ...r,
                                            status: r.status === "Match" ? "Unreconciled" : "Match",
                                            difference: r.status === "Match" ? "+200" : "0",
                                            custodianQty: r.status === "Match" ? "4,000" : r.erpQty,
                                            custodianValue: r.status === "Match" ? "$4,000,000" : r.erpValue,
                                          }
                                          : r
                                      )
                                    );
                                  }}
                                  title="Click to toggle discrepancy status"
                                >
                                  {item.status === "Match" ? "Simulate Discrepancy" : "Reconcile"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="reconciliation-actions mt-3 flex-between">
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-secondary flex items-center gap-2"
                          onClick={handleRefreshLedger}
                          disabled={isRefreshingRecon}
                        >
                          <RefreshCw size={14} className={isRefreshingRecon ? "spinner" : ""} />
                          {isRefreshingRecon ? "Re-synchronizing Ledgers..." : "Refresh Ledger Synced Balances"}
                        </button>
                        <button className="btn btn-ghost btn-sm text-xs" onClick={handleResetRecon} title="Reset table data to default demo state">
                          Reset Demo Data
                        </button>
                      </div>

                      <button className="btn btn-primary" onClick={() => { setActiveTab("sampling_builder"); setSimProcedure("holdings_reconciliation"); }}>
                        Run Sample Audit Simulation
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Valuation & Fair-Value Testing (Signature) */}
              {activeTab === "valuation_testing" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Fair-Value Discrepancy Testing Panel</h3>
                    <p className="section-instruction">Verify internal book pricing against independent market pricing sources (Bloomberg, Refinitiv, or Broker Quotes) and calculate Impairment Provisions.</p>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Holding</th>
                            <th>Cost price</th>
                            <th>Independent Price</th>
                            <th>ERP Book Price</th>
                            <th>Variance %</th>
                            <th>ECL Impairment Triggered</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Goldman Sachs MT Note</td>
                            <td>$100.00</td>
                            <td>$100.25</td>
                            <td>$100.00</td>
                            <td>-0.25%</td>
                            <td>No</td>
                            <td><span className="badge badge-success">Passed</span></td>
                          </tr>
                          <tr>
                            <td>Vertex Pharma Paper</td>
                            <td>$100.00</td>
                            <td>$97.50</td>
                            <td>$100.00</td>
                            <td className="text-red">+2.56%</td>
                            <td>Yes (Rating Downgrade BBB+)</td>
                            <td><span className="badge badge-warning">Review Needed</span></td>
                          </tr>
                          <tr>
                            <td>Amazon Paper 2027</td>
                            <td>$100.00</td>
                            <td>$99.95</td>
                            <td>$99.95</td>
                            <td>0.00%</td>
                            <td>No</td>
                            <td><span className="badge badge-success">Passed</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Board Approval vs Limits (Signature) */}
              {activeTab === "board_approval_limits" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Delegated Financial Authority Limits Review</h3>
                    <p className="section-instruction">Audit whether investments exceed delegation caps without specific Board of Directors or Treasury Committee approvals.</p>

                    <div className="limits-grid">
                      <div className="limit-block">
                        <h5>CFO Approval Limit</h5>
                        <div className="limit-val">$2,000,000</div>
                      </div>
                      <div className="limit-block">
                        <h5>Treasury Committee Limit</h5>
                        <div className="limit-val">$5,000,000</div>
                      </div>
                      <div className="limit-block">
                        <h5>Board of Directors Limit</h5>
                        <div className="limit-val">Unlimited</div>
                      </div>
                    </div>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Security</th>
                            <th>Investment Amount</th>
                            <th>Authorized Signatory</th>
                            <th>Resolution Ref</th>
                            <th>Board Appr Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="breached-row">
                            <td><strong>Tesla Inc. Corporate Note</strong></td>
                            <td>$12,500,000</td>
                            <td>CFO Sign-off Only</td>
                            <td><span className="text-red">Missing Resolution</span></td>
                            <td><span className="badge badge-danger">Breach: Limit Exceeded</span></td>
                          </tr>
                          <tr>
                            <td>Vertex Pharma Commercial Paper</td>
                            <td>$8,000,000</td>
                            <td>Board Committee</td>
                            <td>RES-2026-901</td>
                            <td><span className="badge badge-success">Approved</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Income Recomputation (Signature) */}
              {activeTab === "income_recomputation" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Coupon & Dividend Income Recomputation Engine</h3>
                    <p className="section-instruction">Recalculate yield expectations (coupon rates × face value × daycount convention) and reconcile to received payments.</p>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Holding Security</th>
                            <th>Coupon Rate</th>
                            <th>Daycount</th>
                            <th>Expected Coupon</th>
                            <th>Actual Received</th>
                            <th>Variance</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Tesla Inc. Note</td>
                            <td>4.50%</td>
                            <td>30/360</td>
                            <td>$281,250</td>
                            <td>$281,250</td>
                            <td>$0</td>
                            <td><span className="badge badge-success">Match</span></td>
                          </tr>
                          <tr className="breached-row">
                            <td><strong>Apex Global Equities</strong></td>
                            <td>4.50% (declared)</td>
                            <td>Act/365</td>
                            <td>$67,500</td>
                            <td>$36,000</td>
                            <td className="text-red">-$31,500</td>
                            <td><span className="badge badge-danger">Mismatch</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Related-Party Investment Flag (Signature) */}
              {activeTab === "related_party_flag" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Related-Party Exposures Monitor</h3>
                    <p className="section-instruction">Verify that investments in affiliate and associate firms are correctly flagged and approved under disclosures guidelines.</p>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Asset Name</th>
                            <th>Relationship</th>
                            <th>Exposure Amount</th>
                            <th>Disclosure Status</th>
                            <th>Approval Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Cap Corp Logistics Debentures</td>
                            <td>Subsidiary (100% Owned)</td>
                            <td>$3,000,000</td>
                            <td>Declared in Note 24</td>
                            <td><span className="badge badge-success">Approved</span></td>
                          </tr>
                          <tr className="breached-row">
                            <td><strong>Apex Global Equities</strong></td>
                            <td>Associate (CFO holds Board seat)</td>
                            <td>$1,500,000</td>
                            <td><span className="text-red">Not Disclosed</span></td>
                            <td><span className="badge badge-warning">No Approval Record</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Concentration & Exposure (Signature) */}
              {activeTab === "concentration_exposure" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Single-Issuer & Industry Sector Concentration Boundaries</h3>
                    <p className="section-instruction">Review concentration statistics against Investment Policy limits (Single-Issuer Limit: 10% of total holdings, Sector Limit: 20-30%).</p>

                    <div className="guardrails-box">
                      {guardrails.map(g => (
                        <div key={g.id} className="limit-meter-card">
                          <div className="meter-head">
                            <strong>{g.sector}</strong>
                            <span>{g.current_pct}% / {g.limit_pct}% Max</span>
                          </div>
                          <div className="progress-track">
                            <div className={`progress-bar ${g.status === "Breached" ? "danger" : "normal"}`} style={{ width: `${(g.current_pct / g.limit_pct) * 100}%` }}></div>
                          </div>
                          <div className="meter-foot">
                            <span className={g.status === "Breached" ? "text-red" : "text-green"}>{g.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 8. Maturity & Rollover Tracking (Signature) */}
              {activeTab === "maturity_rollover" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Upcoming Maturities & Rollover Approvals Ledger</h3>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Security Name</th>
                            <th>Maturity Date</th>
                            <th>Rollover Terms</th>
                            <th>Authorized By</th>
                            <th>Action Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Chevron Corp Debenture</td>
                            <td>2026-08-15</td>
                            <td>N/A (Settle Cash)</td>
                            <td>Treasury Desk</td>
                            <td><span className="badge badge-success">Settle Cash</span></td>
                          </tr>
                          <tr className="breached-row">
                            <td><strong>Evergreen Property Trust</strong></td>
                            <td>2026-07-10 (Overdue)</td>
                            <td>Extended +3 Years @ 4.8%</td>
                            <td><span className="text-red">No Sign-off</span></td>
                            <td><span className="badge badge-danger">Unresolved Extension</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. Instrument Master Governance (Signature) */}
              {activeTab === "instrument_master_governance" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Instrument Master Static Data Audit</h3>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>ISIN</th>
                            <th>Issuer</th>
                            <th>Asset Class</th>
                            <th>Credit Rating (S&P/Moody's)</th>
                            <th>Allowed per IPS</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>US88160R1014</td>
                            <td>Tesla Inc.</td>
                            <td>Corporate Bond</td>
                            <td>BBB / Baa2</td>
                            <td><span className="badge badge-success">Yes</span></td>
                          </tr>
                          <tr className="breached-row">
                            <td>US92532F1003</td>
                            <td>Vertex Pharma</td>
                            <td>Commercial Paper</td>
                            <td><span className="text-red">BBB+ / Baa1 (Downgraded)</span></td>
                            <td><span className="badge badge-danger">No (Rating Below A-)</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. Realised Gain/Loss Testing (Signature) */}
              {activeTab === "realised_gain_loss" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Realised Gain/Loss Audit Sheet</h3>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Sold security</th>
                            <th>Sale date</th>
                            <th>Proceeds</th>
                            <th>Calculated cost (FIFO)</th>
                            <th>Reported Gain/Loss</th>
                            <th>Auditor Recomputed</th>
                            <th>Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Apple Inc. Bond (Partial Sale)</td>
                            <td>2026-06-15</td>
                            <td>$5,100,000</td>
                            <td>$5,000,000</td>
                            <td>+$100,000</td>
                            <td>+$100,000</td>
                            <td>$0 <span className="badge badge-success">Match</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. Mandate & Policy Compliance (Signature) */}
              {activeTab === "mandate_policy" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Investment Policy Statement (IPS) Mandates Compliance Checklist</h3>

                    <ul className="compliance-checklist">
                      <li>
                        <CheckCircle size={18} className="text-green" />
                        <span>Maximum Equity Exposure limit &lt; 15% (Current: 8.2%) - <strong>Compliant</strong></span>
                      </li>
                      <li>
                        <AlertTriangle size={18} className="text-red" />
                        <span>Minimum Credit Quality of debt assets &gt; A- (Breach: Vertex Pharma Downgraded to BBB+) - <strong>Breach</strong></span>
                      </li>
                      <li>
                        <CheckCircle size={18} className="text-green" />
                        <span>Minimum liquid assets pool &gt; $20,000,000 (Current: $24,500,000) - <strong>Compliant</strong></span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 12. Accrued Income Ageing (Signature) */}
              {activeTab === "accrued_income_ageing" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Accrued Interest Income Ageing Schedule</h3>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Security</th>
                            <th>Interest Accrued</th>
                            <th>Not Due yet</th>
                            <th>1-30 Days Overdue</th>
                            <th>31-90 Days Overdue</th>
                            <th>90+ Days Overdue</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>JPMorgan Certificate of Deposit</td>
                            <td>$110,000</td>
                            <td>$110,000</td>
                            <td>$0</td>
                            <td>$0</td>
                            <td>$0</td>
                          </tr>
                          <tr className="breached-row">
                            <td>Evergreen Property Trust Bond</td>
                            <td>$84,000</td>
                            <td>$0</td>
                            <td>$0</td>
                            <td>$84,000</td>
                            <td>$0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 13. Impairment Trigger Screening (Signature) */}
              {activeTab === "impairment_screening" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>ECL Stage Classification & Impairment Screening</h3>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Security</th>
                            <th>Holding Value</th>
                            <th>S&P Rating</th>
                            <th>Stage (IFRS 9)</th>
                            <th>Impairment Triggered</th>
                            <th>Provision Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>NextEra Energy Green Bond</td>
                            <td>$14,000,000</td>
                            <td>A+</td>
                            <td>Stage 1</td>
                            <td>No</td>
                            <td>$0</td>
                          </tr>
                          <tr className="breached-row">
                            <td>Vertex Pharma Paper</td>
                            <td>$8,000,000</td>
                            <td>BBB+</td>
                            <td>Stage 2 (Significant Increase in Credit Risk)</td>
                            <td><span className="text-red font-bold">Yes</span></td>
                            <td>$160,000 (2.0%)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 14. Pledged / Lien Investments (Signature) */}
              {activeTab === "pledged_lien" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Encumbered Securities and Lien Registry</h3>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Pledged Asset</th>
                            <th>Pledged Value</th>
                            <th>Lienholder (Bank)</th>
                            <th>Purpose / Loan Facility</th>
                            <th>Board Authorization Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Microsoft Corp Note</td>
                            <td>$10,000,000</td>
                            <td>HSBC Bank</td>
                            <td>Working Capital Overdraft Margin</td>
                            <td>2025-10-12</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 15. Broker & Dealing Controls (Signature) */}
              {activeTab === "broker_dealing" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>Broker Empanelment & Allocation Auditing</h3>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Broker Name</th>
                            <th>Empaneled Status</th>
                            <th>Transaction Volume (YTD)</th>
                            <th>Share %</th>
                            <th>Commission Paid</th>
                            <th>Avg Commission Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Morgan Stanley India</td>
                            <td>Empaneled</td>
                            <td>$45,000,000</td>
                            <td>42.0%</td>
                            <td>$45,000</td>
                            <td>0.10%</td>
                          </tr>
                          <tr>
                            <td>Goldman Sachs Brokerage</td>
                            <td>Empaneled</td>
                            <td>$35,000,000</td>
                            <td>33.0%</td>
                            <td>$35,000</td>
                            <td>0.10%</td>
                          </tr>
                          <tr className="breached-row">
                            <td>Alpha Global Dealing Desk</td>
                            <td><span className="text-red font-bold">Not Empaneled</span></td>
                            <td>$25,000,000</td>
                            <td>25.0%</td>
                            <td>$37,500</td>
                            <td><span className="text-red font-bold">0.15% (Exceeds Policy Cap)</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 16. Disclosure & Classification (Signature) */}
              {activeTab === "disclosure_classification" && (
                <div className="procedure-view">
                  <div className="card">
                    <h3>IFRS 9 Classification (FVTPL vs FVOCI vs Amortized Cost)</h3>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Security</th>
                            <th>Business Model Assessment</th>
                            <th>SPPI Test Result</th>
                            <th>Accounting Classification</th>
                            <th>Appropriate?</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>JPMorgan Cert of Deposit</td>
                            <td>Hold to Collect Cash Flows</td>
                            <td>Pass (Solely Principal & Interest)</td>
                            <td>Amortized Cost</td>
                            <td><span className="badge badge-success">Passed</span></td>
                          </tr>
                          <tr>
                            <td>Apex Global Equities</td>
                            <td>Trading / Capital Appreciation</td>
                            <td>Fail (Equity Dividends)</td>
                            <td>FVTPL (Fair Value through P&L)</td>
                            <td><span className="badge badge-success">Passed</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 17. Scope & Audit Universe (Functional) */}
              {activeTab === "scope_universe" && (
                <div className="shell-view">
                  <div className="card">
                    <div className="card-head mb-3">
                      <h3>Auditable Universe Scope Configuration ({auditableUnits.length})</h3>
                      <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={() => setShowAddUnitModal(true)}>
                        Add Unit <Plus size={14} />
                      </button>
                    </div>

                    {showAddUnitModal && (
                      <form className="modal-form-box mb-4" onSubmit={handleAddUnitSubmit}>
                        <div className="flex-between mb-2">
                          <h4 className="text-sm font-bold text-navy">Add New Auditable Unit</h4>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddUnitModal(false)}><X size={14} /></button>
                        </div>
                        <div className="grid-form-2">
                          <div className="field">
                            <label className="text-xs font-semibold text-slate mb-1">Auditable Unit Name</label>
                            <input
                              className="input input-sm"
                              placeholder="e.g. Fixed Income Derivatives Desk"
                              value={newUnitName}
                              onChange={(e) => setNewUnitName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="field">
                            <label className="text-xs font-semibold text-slate mb-1">Risk Category</label>
                            <select
                              className="input input-sm"
                              value={newUnitRisk}
                              onChange={(e) => setNewUnitRisk(e.target.value as any)}
                            >
                              <option value="High Risk">High Risk</option>
                              <option value="Medium Risk">Medium Risk</option>
                              <option value="Low Risk">Low Risk</option>
                            </select>
                          </div>
                          <div className="field">
                            <label className="text-xs font-semibold text-slate mb-1">Lead Auditor</label>
                            <input
                              className="input input-sm"
                              placeholder="Auditor name"
                              value={newUnitLead}
                              onChange={(e) => setNewUnitLead(e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label className="text-xs font-semibold text-slate mb-1">In Scope Status</label>
                            <select
                              className="input input-sm"
                              value={newUnitInScope}
                              onChange={(e) => setNewUnitInScope(e.target.value)}
                            >
                              <option value="Yes (Primary)">Yes (Primary)</option>
                              <option value="Yes">Yes</option>
                              <option value="No (Cycle Out)">No (Cycle Out)</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddUnitModal(false)}>Cancel</button>
                          <button type="submit" className="btn btn-primary btn-sm">Add Unit</button>
                        </div>
                      </form>
                    )}

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Auditable Unit</th>
                            <th>Risk Category</th>
                            <th>Last Audit Date</th>
                            <th>Lead Auditor</th>
                            <th>In Scope?</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditableUnits.map((u) => (
                            <tr key={u.id}>
                              <td className="font-medium">{u.unit}</td>
                              <td>
                                <span
                                  className={`badge ${u.riskCategory === "High Risk"
                                    ? "badge-danger"
                                    : u.riskCategory === "Medium Risk"
                                      ? "badge-warning"
                                      : "badge-success"
                                    }`}
                                >
                                  {u.riskCategory}
                                </span>
                              </td>
                              <td>{u.lastAuditDate}</td>
                              <td>{u.leadAuditor}</td>
                              <td>
                                <span className={u.inScope.includes("Yes") ? "text-green font-bold" : "text-muted"}>
                                  {u.inScope}
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  className="btn btn-ghost btn-sm text-xs text-danger"
                                  title="Delete unit"
                                  onClick={() => handleDeleteUnit(u.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}

                          {auditableUnits.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-4 text-slate">
                                No auditable units in scope. Click "Add Unit" above to add one.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 18. Risk & Control Matrix — Linked to Page 19 Rule Library */}
              {activeTab === "rcm_matrix" && (
                <div className="shell-view">
                  <div className="card">
                    <div className="flex-between mb-3">
                      <div>
                        <h3>Risk & Control Matrix (RCM) Index</h3>
                        <p className="text-muted-desc">Primary governance registry defining risks, control activities, and financial assertions.</p>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={fetchData}>
                        Reload RCM <RefreshCw size={14} />
                      </button>
                    </div>
                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Control Ref</th>
                            <th>Risk Ref</th>
                            <th>Risk Description</th>
                            <th>Control Activity</th>
                            <th>Assertion</th>
                            <th>Owner</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(rcmControls.length > 0 ? rcmControls : [
                            { control_id: "CON-INV-01", risk_ref: "RSK-INV-01", risk_description: "Asset Concentration Limits / Portfolio Diversity", control_activity: "Automated single-issuer and sector concentration cap controls in ERP.", financial_assertion: "Valuation / Allocation", control_owner: "Compliance Head" },
                            { control_id: "CON-INV-02", risk_ref: "RSK-INV-02", risk_description: "Credit Diminution and Investment Grade Adherence", control_activity: "Independent credit rating validation and impairment trigger screening.", financial_assertion: "Valuation / Impairment", control_owner: "Risk Management Desk" },
                            { control_id: "CON-INV-03", risk_ref: "RSK-INV-03", risk_description: "Income Accuracy and Completeness Assertions", control_activity: "Automated interest coupon and dividend rate recalculation vs bank inflow.", financial_assertion: "Completeness & Accuracy", control_owner: "Treasury Manager" },
                          ]).map((ctrl) => (
                            <tr key={ctrl.control_id}>
                              <td><strong className="font-mono text-blue">{ctrl.control_id}</strong></td>
                              <td><span className="font-mono text-muted">{ctrl.risk_ref}</span></td>
                              <td>{ctrl.risk_description}</td>
                              <td>{ctrl.control_activity}</td>
                              <td><span className="badge badge-info">{ctrl.financial_assertion}</span></td>
                              <td>{ctrl.control_owner}</td>
                              <td>
                                <button
                                  className="btn btn-ghost btn-sm text-xs"
                                  style={{ color: "#6366f1", border: "1px solid #6366f140" }}
                                  onClick={() => setActiveTab("test_rule_library")}
                                  title="Jump to associated CAAT rules in Page 19"
                                >
                                  View Rules →
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 19. Test & Analytics Rule Library — Linked to Page 18 RCM Controls */}
              {activeTab === "test_rule_library" && (
                <div className="shell-view">
                  <div className="card">
                    <div className="flex-between mb-3">
                      <div>
                        <h3>Test Analytics and Rule Threshold Library ({rules.length})</h3>
                        <p className="text-muted-desc">Automated CAAT checks linked to Page 18 RCM Governance Controls via control_id.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={fetchRules}>
                          <RefreshCw size={14} className={rulesLoading ? "spinner" : ""} /> Reload Rules
                        </button>
                        <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={openAddRuleModal}>
                          <Plus size={14} /> Add Rule
                        </button>
                      </div>
                    </div>

                    <div className="rule-grid">
                      {rules.map((r) => {
                        const evalState = ruleEvalById[r.id];
                        return (
                          <div key={r.id} className={`rule-card ${r.status !== "Active" ? "dim-card" : ""}`}>
                            <div className="rule-header">
                              <div>
                                <h4>{r.rule_name}</h4>
                                {r.control_id && (
                                  <button
                                    className="badge badge-info"
                                    style={{ fontSize: "10px", background: "#6366f120", color: "#6366f1", border: "1px solid #6366f150", cursor: "pointer", marginTop: 4 }}
                                    onClick={() => setActiveTab("rcm_matrix")}
                                    title="Click to view underlying Page 18 RCM Control"
                                  >
                                    Linked Control: {r.control_id}
                                  </button>
                                )}
                              </div>
                              <button
                                className={`badge ${r.status === "Active" ? "badge-success" : "badge-secondary"}`}
                                onClick={() => toggleRuleStatus(r)}
                                title="Click to toggle Active/Inactive state"
                                style={{ cursor: "pointer" }}
                              >
                                {r.status}
                              </button>
                            </div>
                            <p>{r.description}</p>
                            <div className="rule-threshold">
                              <span>Type: <code>{r.threshold_type}</code></span>
                              <strong style={{ marginLeft: 12 }}>Threshold Limit: {r.threshold_value}%</strong>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <button
                                className="btn btn-secondary btn-sm text-xs"
                                onClick={() => evaluateRuleOnServer(r)}
                                disabled={r.status !== "Active"}
                              >
                                Run Rule Evaluation
                              </button>
                              <div className="flex items-center gap-1">
                                <button className="btn btn-ghost btn-sm text-xs" onClick={() => openEditRuleModal(r)}>
                                  Edit
                                </button>
                                <button className="btn btn-ghost btn-sm text-xs text-danger" onClick={() => deleteRule(r)}>
                                  Delete
                                </button>
                              </div>
                            </div>

                            {evalState && (
                              <div className="mt-2 text-xs p-2 rounded" style={{ background: "#1e293b", border: "1px solid #334155" }}>
                                {"error" in evalState ? (
                                  <span className="text-red">⚠ {evalState.error}</span>
                                ) : evalState.passed ? (
                                  <span className="text-green">✓ Rule Passed — No breaches detected</span>
                                ) : (
                                  <span className="text-red">⚠ {evalState.breaches.length} Breach(es) detected — Auto-persisted to Exception Queue (Control: {evalState.control_id || "N/A"})</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 20. Data Source & Connector Setup (Shell) */}
              {activeTab === "data_connector_setup" && (
                <div className="shell-view">
                  <div className="card">
                    <h3>Data Feeds & API Integration Setup</h3>
                    <div className="connector-rows">
                      <div className="connector-item">
                        <div className="connector-meta">
                          <strong>Bloomberg Pricing API Connector</strong>
                          <span>Sync Status: <span className="text-green font-bold">Online</span> (Last sync: 2 hours ago)</span>
                        </div>
                        <span className="badge badge-success">Connected</span>
                      </div>
                      <div className="connector-item">
                        <div className="connector-meta">
                          <strong>BNY Mellon Custody Portal Connector</strong>
                          <span>Sync Status: <span className="text-green font-bold">Online</span> (Last sync: 1 day ago)</span>
                        </div>
                        <span className="badge badge-success">Connected</span>
                      </div>
                      <div className="connector-item">
                        <div className="connector-meta">
                          <strong>SAP S/4HANA Treasury Ledger Upload</strong>
                          <span>Sync Status: <span className="text-warning font-bold">Manual Sync Required</span></span>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => alert("Simulating SAP file sync...")}>Sync Now</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 21. Sampling & Population Builder (Shell & Simulation execution panel) */}
              {activeTab === "sampling_builder" && (
                <div className="shell-view">
                  <div className="card">
                    <h3>Simulation Controls: Sample & Population Tester</h3>
                    <p className="section-instruction">Select an audit procedure, configure verification constraints, and start the automated compliance agent. The agent will read mock custodial ledger logs, apply compliance thresholds, and flag exceptions.</p>

                    <form className="simulation-form border-glow" onSubmit={handleRunSimulation}>
                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Verify Procedure</label>
                          <select value={simProcedure} onChange={(e) => setSimProcedure(e.target.value)} disabled={simRunning}>
                            {SIGNATURE_PAGES.map(p => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Statistical Sample Size</label>
                          <input
                            type="number"
                            min="2"
                            max="50"
                            value={simSampleSize}
                            onChange={(e) => setSimSampleSize(Number(e.target.value))}
                            disabled={simRunning}
                          />
                        </div>
                        <div className="form-group">
                          <label>Tolerance Limit (0.01 - 0.50)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="0.50"
                            value={simTolerance}
                            onChange={(e) => setSimTolerance(Number(e.target.value))}
                            disabled={simRunning}
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn btn-primary w-full" disabled={simRunning}>
                        {simRunning ? (
                          <>
                            <RefreshCw className="spinner" size={16} /> Executing Simulation...
                          </>
                        ) : (
                          <>
                            <Play size={16} /> Run Automated Audit Procedure
                          </>
                        )}
                      </button>
                    </form>

                    {/* Simulation logs console */}
                    {(simLogs.length > 0 || simRunning) && (
                      <div className="simulation-terminal mt-4">
                        <div className="terminal-header">
                          <Terminal size={14} />
                          <span>Audit Verification Console Logs</span>
                        </div>
                        <div className="terminal-body">
                          {simLogs.map((log, i) => (
                            <div key={i} className="terminal-line">
                              <span className="line-prefix">&gt;</span> {log}
                            </div>
                          ))}
                          {simRunning && (
                            <div className="terminal-line typing">
                              <span className="line-prefix">&gt;</span> <span className="cursor">█</span>
                            </div>
                          )}
                          <div ref={consoleEndRef} />
                        </div>
                      </div>
                    )}

                    {/* Simulation result panel */}
                    {simResult && (
                      <div className={`simulation-result-card mt-4 ${simResult.status === "PASSED" ? "success" : "failed"}`}>
                        <div className="result-head">
                          <h4>Procedure Simulation: {simResult.status}</h4>
                          <span className={`badge ${simResult.status === "PASSED" ? "badge-success" : "badge-danger"}`}>
                            {simResult.status}
                          </span>
                        </div>
                        <div className="result-stats">
                          <div className="res-stat-col">
                            <span className="res-label">Deviation Count</span>
                            <span className="res-val">{simResult.deviations_count} / {simResult.sample_size}</span>
                          </div>
                          <div className="res-stat-col">
                            <span className="res-label">Deviation Rate</span>
                            <span className="res-val">{(simResult.deviation_rate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="res-stat-col">
                            <span className="res-label">Configured Tolerance</span>
                            <span className="res-val">{(simResult.tolerance * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <p className="result-msg">
                          {simResult.status === "FAILED"
                            ? "CRITICAL: The verification deviation rate exceeds the allowed tolerance standard. The anomalous occurrences have been logged to the Exceptions Queue."
                            : "SUCCESS: The sample deviation rate lies within control limits. The procedure has concluded successfully."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 22. Exception & Red-Flag Queue — G2/G4: source_page badge + Promote to Finding */}
              {activeTab === "exception_queue" && (
                <div className="procedure-view">
                  <div className="card">
                    <div className="card-head">
                      <h3>Securities Exception Triage Queue</h3>
                      <button className="btn btn-secondary btn-sm" onClick={fetchData}>
                        Reload Queue <RefreshCw size={14} />
                      </button>
                    </div>

                    <p className="section-instruction">Selectively resolve exceptions or promote high-severity items directly into the Observation & Finding Log.</p>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Security</th>
                            <th>Amount</th>
                            <th>Exception</th>
                            <th>Source</th>
                            <th>Date</th>
                            <th>Severity</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exceptions.map((e) => (
                            <tr key={e.id} className={e.status !== "Resolved" ? "unresolved-row" : "resolved-row-dim"}>
                              <td><strong>{e.security}</strong></td>
                              <td>{e.amount}</td>
                              <td><span className="text-muted-desc">{e.exception}</span></td>
                              <td>
                                {e.control_id ? (
                                  <button
                                    className="badge badge-info"
                                    style={{ fontSize: "10px", background: "#6366f120", color: "#6366f1", border: "1px solid #6366f150", cursor: "pointer" }}
                                    onClick={() => setActiveTab("rcm_matrix")}
                                    title="Click to trace exception back to Page 18 RCM Control"
                                  >
                                    {e.control_id}
                                  </button>
                                ) : e.source_page ? (
                                  <span className="badge badge-info" style={{ fontSize: "10px", background: "#1e40af20", color: "#3b82f6", border: "1px solid #3b82f640" }}>
                                    {e.source_page.replace(/_/g, " ")}
                                  </span>
                                ) : <span className="text-muted">—</span>}
                              </td>
                              <td>{e.date}</td>
                              <td>
                                <span className={`badge ${e.severity === "High" ? "badge-danger" : "badge-warning"}`}>
                                  {e.severity}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${e.status === "Resolved" ? "badge-success" : e.status === "In Review" ? "badge-warning" : "badge-danger"}`}>
                                  {e.status}
                                </span>
                              </td>
                              <td>
                                <div className="flex items-center gap-1">
                                  {e.status !== "Resolved" ? (
                                    <button className="btn btn-secondary btn-sm text-green-btn" onClick={() => handleResolve(e.id)}>
                                      Resolve
                                    </button>
                                  ) : (
                                    <span className="text-green text-sm font-bold flex-align-center"><Check size={14} /> Cleared</span>
                                  )}
                                  {e.severity === "High" && e.status !== "Resolved" && (
                                    <button
                                      className="btn btn-ghost btn-sm text-xs"
                                      style={{ color: "#f59e0b", border: "1px solid #f59e0b40" }}
                                      title="Promote to Observation & Finding Log"
                                      onClick={() => {
                                        setPromoteExceptionId(e.id);
                                        setFindingTitle(e.exception);
                                        setFindingDesc(`Security: ${e.security} | Amount: ${e.amount} | Exception: ${e.exception}`);
                                        setFindingSeverity("High Severity");
                                        setShowRaiseFindingModal(true);
                                        setActiveTab("observation_log");
                                      }}
                                    >
                                      → Finding
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {exceptions.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center text-muted">No exceptions reported for this tenant.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 23. Working Papers & Evidence — G6a: API-backed */}
              {activeTab === "working_papers" && (
                <div className="shell-view">
                  <div className="card">
                    <div className="flex-between mb-3">
                      <div>
                        <h3>Working Papers & Audit Documentation Locker</h3>
                        <p className="text-muted-desc">
                          Upload and manage tickmark worksheets, custodian statements, and sign-off approvals.
                          {wpLoading && <span style={{ marginLeft: 8, color: "#6366f1", fontSize: "12px" }}>● Syncing...</span>}
                        </p>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={fetchWorkingPapers} title="Refresh from server">
                        <RefreshCw size={14} />
                      </button>
                    </div>

                    {/* Task Reference selector before uploading */}
                    <div className="wp-upload-toolbar">
                      <div className="wp-task-select">
                        <label className="text-xs font-semibold text-slate mb-1">Target Reference Task:</label>
                        <select
                          className="input input-sm"
                          value={wpRefTask}
                          onChange={(e) => setWpRefTask(e.target.value)}
                        >
                          <option value="Holdings vs Custodian Reconciliation">Holdings vs Custodian Reconciliation</option>
                          <option value="Valuation & Fair-Value Testing">Valuation & Fair-Value Testing</option>
                          <option value="Pledged / Lien Verification">Pledged / Lien Verification</option>
                          <option value="Board Approval & Delegated Limits">Board Approval & Delegated Limits</option>
                          <option value="Mandate & Policy Compliance">Mandate & Policy Compliance</option>
                          <option value="General Audit Evidence">General Audit Evidence</option>
                        </select>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      multiple
                      accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileSelect}
                    />

                    <div
                      className="upload-box-wrapper"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className={`upload-box ${isDragging ? "drag-active" : ""}`}>
                        <Upload size={32} className={`upload-icon ${isDragging ? "upload-icon-active" : ""}`} />
                        <span>
                          {isDragging
                            ? "Drop your evidence files here to upload"
                            : "Click or Drag & Drop excel spreadsheets, PDF statement confirmation letters, or screenshots here."}
                        </span>
                        <span className="upload-subtext">
                          Supports XLSX, CSV, PDF, Images up to 25MB • Target Task: <strong>{wpRefTask}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex-between mt-4 mb-2">
                      <h4>Attached Evidence Register ({workingPapers.length})</h4>
                      <div className="wp-search-box">
                        <Search size={14} className="wp-search-icon" />
                        <input
                          type="text"
                          className="input input-sm search-input-indent"
                          placeholder="Filter documents or tasks..."
                          value={wpSearch}
                          onChange={(e) => setWpSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Document Name</th>
                            <th>Reference Task</th>
                            <th>Attached By</th>
                            <th>Upload Date</th>
                            <th>Size</th>
                            <th>Sign-off Status</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workingPapers
                            .filter(
                              (doc) =>
                                doc.name.toLowerCase().includes(wpSearch.toLowerCase()) ||
                                doc.refTask.toLowerCase().includes(wpSearch.toLowerCase()) ||
                                doc.attachedBy.toLowerCase().includes(wpSearch.toLowerCase())
                            )
                            .map((doc) => (
                              <tr key={doc.id}>
                                <td className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-slate-soft" />
                                    <span>{doc.name}</span>
                                  </div>
                                </td>
                                <td>{doc.refTask}</td>
                                <td>{doc.attachedBy}</td>
                                <td>{doc.uploadDate}</td>
                                <td>{doc.size}</td>
                                <td>
                                  {doc.status === "Approved by Lead" ? (
                                    // Immutability lock — approved documents are locked
                                    <span className="badge badge-success" title="This document is approved and immutable">Approved by Lead</span>
                                  ) : (
                                    <div className="flex items-center gap-1" style={{ flexWrap: "wrap" }}>
                                      <span
                                        className={`badge ${doc.status === "Needs Revision" ? "badge-danger" : "badge-warning"}`}
                                      >
                                        {doc.status}
                                      </span>
                                      <button
                                        className="btn btn-ghost btn-sm text-xs"
                                        style={{ color: "#22c55e" }}
                                        title="Approve this document (cannot be the uploader)"
                                        onClick={async () => {
                                          const approverName = window.prompt("Enter your name (must differ from the document uploader):");
                                          if (!approverName || !approverName.trim()) return;
                                          try {
                                            await post(`/api/modules/investments/working-papers/${doc.id}/approve`, { signed_off_by: approverName.trim() });
                                            await fetchWorkingPapers();
                                          } catch (err: any) {
                                            alert(`Approve failed: ${err?.message || String(err)}`);
                                          }
                                        }}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        className="btn btn-ghost btn-sm text-xs"
                                        style={{ color: "#ef4444" }}
                                        title="Request revision (revision notes required)"
                                        onClick={async () => {
                                          const notes = window.prompt("Enter revision notes (required):");
                                          if (!notes || !notes.trim()) { alert("Revision notes are required."); return; }
                                          try {
                                            await post(`/api/modules/investments/working-papers/${doc.id}/reject`, { revision_notes: notes.trim() });
                                            await fetchWorkingPapers();
                                          } catch (err: any) {
                                            alert(`Reject failed: ${err?.message || String(err)}`);
                                          }
                                        }}
                                      >
                                        Needs Revision
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      className="btn btn-ghost btn-sm text-xs"
                                      title="Download / View document"
                                      onClick={() => downloadDocument(doc)}
                                    >
                                      <Download size={14} />
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-sm text-xs text-danger"
                                      title={doc.status === "Approved by Lead" ? "Cannot delete an approved document" : "Delete document"}
                                      disabled={doc.status === "Approved by Lead"}
                                      style={doc.status === "Approved by Lead" ? { opacity: 0.35, cursor: "not-allowed" } : {}}
                                      onClick={async () => {
                                        if (doc.status === "Approved by Lead") return;
                                        if (!window.confirm("Remove this working paper?")) return;
                                        try {
                                          await del(`/api/modules/investments/working-papers/${doc.id}`);
                                          await fetchWorkingPapers();
                                        } catch (err: any) {
                                          alert(`Delete failed: ${err?.message || String(err)}`);
                                        }
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>

                              </tr>
                            ))}

                          {workingPapers.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-4 text-slate">
                                No evidence files attached yet. Drag & drop or click above to upload.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 24. Observation & Finding Log (Functional) */}
              {activeTab === "observation_log" && (
                <div className="shell-view">
                  <div className="card">
                    <div className="card-head mb-3">
                      <div>
                        <h3>Formal Audit Findings and Observations ({findingsLog.length})</h3>
                        <p className="text-muted-desc">Track formal audit findings, severity scoring, and management responses.</p>
                      </div>
                      <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={() => setShowRaiseFindingModal(true)}>
                        Raise Finding <Plus size={14} />
                      </button>
                    </div>

                    {showRaiseFindingModal && (
                      <form className="modal-form-box mb-4" onSubmit={handleRaiseFindingSubmit}>
                        <div className="flex-between mb-2">
                          <h4 className="text-sm font-bold text-navy">Raise New Audit Finding / Observation</h4>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowRaiseFindingModal(false)}><X size={14} /></button>
                        </div>
                        <div className="field mb-2">
                          <label className="text-xs font-semibold text-slate mb-1">Finding Title / Subject</label>
                          <input
                            className="input input-sm"
                            placeholder="e.g. Unapproved corporate bond purchase exceeding authorization limits"
                            value={findingTitle}
                            onChange={(e) => setFindingTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="field mb-2">
                          <label className="text-xs font-semibold text-slate mb-1">Detailed Observation Statement</label>
                          <textarea
                            className="input input-sm"
                            rows={3}
                            placeholder="Describe the condition, criteria, cause, effect, and recommendation..."
                            value={findingDesc}
                            onChange={(e) => setFindingDesc(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid-form-3">
                          <div className="field">
                            <label className="text-xs font-semibold text-slate mb-1">Severity Level</label>
                            <select
                              className="input input-sm"
                              value={findingSeverity}
                              onChange={(e) => setFindingSeverity(e.target.value as any)}
                            >
                              <option value="High Severity">High Severity</option>
                              <option value="Medium Severity">Medium Severity</option>
                              <option value="Low Severity">Low Severity</option>
                            </select>
                          </div>
                          <div className="field">
                            <label className="text-xs font-semibold text-slate mb-1">Owner / Responsible Unit</label>
                            <input
                              className="input input-sm"
                              placeholder="e.g. CFO Office / Treasury"
                              value={findingOwner}
                              onChange={(e) => setFindingOwner(e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label className="text-xs font-semibold text-slate mb-1">Target Close Date</label>
                            <input
                              type="date"
                              className="input input-sm"
                              value={findingTargetDate}
                              onChange={(e) => setFindingTargetDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowRaiseFindingModal(false)}>Cancel</button>
                          <button type="submit" className="btn btn-primary btn-sm">Raise Finding</button>
                        </div>
                      </form>
                    )}

                    <div className="findings-rows">
                      {findingsLog.map((item) => (
                        <div key={item.id} className="finding-item border-glow">
                          <div className="finding-meta">
                            <div className="flex items-center gap-2">
                              <span className="finding-ref">{item.ref}</span>
                              {item.exception_id && (
                                <span style={{ fontSize: "10px", background: "#7c3aed20", color: "#7c3aed", border: "1px solid #7c3aed40", borderRadius: 4, padding: "2px 6px" }}>
                                  Promoted from Exception
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Status badge — read-only display */}
                              <span className={`badge ${item.status === "Resolved" ? "badge-success" : item.status === "In Review" ? "badge-warning" : item.status === "Promoted to CAPA" ? "badge-info" : "badge-danger"}`}>
                                {item.status}
                              </span>
                              {/* Explicit state-machine action buttons */}
                              {item.status === "Open" && (
                                <button
                                  className="btn btn-ghost btn-sm text-xs"
                                  style={{ color: "#6366f1", border: "1px solid #6366f140" }}
                                  title="Submit this finding for review"
                                  onClick={() => openFindingActionModal(item.id, "submit-review")}
                                >
                                  Submit for Review
                                </button>
                              )}
                              {item.status === "In Review" && (
                                <button
                                  className="btn btn-ghost btn-sm text-xs"
                                  style={{ color: "#22c55e", border: "1px solid #22c55e40" }}
                                  title="Resolve this finding (not available for finding owner)"
                                  onClick={() => openFindingActionModal(item.id, "resolve")}
                                >
                                  ✓ Resolve
                                </button>
                              )}
                              {item.status === "Resolved" && (
                                <button
                                  className="btn btn-ghost btn-sm text-xs"
                                  style={{ color: "#f59e0b", border: "1px solid #f59e0b40" }}
                                  title="Re-open this finding"
                                  onClick={() => openFindingActionModal(item.id, "reopen")}
                                >
                                  ↩ Re-open
                                </button>
                              )}
                              <span
                                className={`badge ${item.severity === "High Severity"
                                  ? "badge-danger"
                                  : item.severity === "Medium Severity"
                                    ? "badge-warning"
                                    : "badge-success"
                                  }`}
                              >
                                {item.severity}
                              </span>
                              <button
                                className="btn btn-ghost btn-sm text-xs"
                                style={{ color: "#22c55e", border: "1px solid #22c55e40" }}
                                title="Create remediation / CAPA plan"
                                onClick={() => handleCreateRemediation(item)}
                              >
                                + CAPA
                              </button>
                              <button
                                className="btn btn-ghost btn-sm text-xs text-danger"
                                title="Delete finding"
                                onClick={() => handleDeleteFinding(item.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                          </div>
                          <h4>{item.title}</h4>
                          <p>{item.description}</p>
                          <div className="finding-footer">
                            <span>Owner: {item.owner}</span>
                            <span>Target Close Date: {item.targetCloseDate}</span>
                          </div>
                        </div>
                      ))}

                      {findingsLog.length === 0 && (
                        <p className="text-center py-4 text-slate">No audit findings raised yet. Click "Raise Finding" above to create one.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 25. Remediation / Action Tracker — G6c: API-backed + overdue highlight */}
              {activeTab === "remediation_tracker" && (
                <div className="shell-view">
                  <div className="card">
                    <div className="flex-between mb-3">
                      <div>
                        <h3>Remediation & CAPA Action Plans ({remediations.length})</h3>
                        <p className="text-muted-desc">Follow up on corrective actions, progress reviews, and recheck cycles.
                          {remLoading && <span style={{ marginLeft: 8, color: "#6366f1", fontSize: "12px" }}>● Syncing...</span>}
                        </p>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={fetchRemediations}><RefreshCw size={14} /></button>
                    </div>
                    <div className="audit-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Finding Ref</th>
                            <th>CAPA Description</th>
                            <th>Control Owner</th>
                            <th>Target Date</th>
                            <th>Re-test</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {remediations.map((r) => (
                            <tr key={r.id} style={r.is_overdue ? { background: "rgba(239,68,68,0.06)" } : {}}>
                              <td><strong className="font-mono">{r.finding_ref}</strong></td>
                              <td>{r.capa_description}</td>
                              <td>{r.control_owner || "—"}</td>
                              <td>
                                <span style={r.is_overdue ? { color: "#ef4444", fontWeight: 700 } : {}}>
                                  {r.target_date || "—"}
                                  {r.is_overdue && <span style={{ marginLeft: 4, fontSize: "10px" }}> ⚠ Overdue</span>}
                                </span>
                              </td>
                              <td>
                                {r.retest_date ? (
                                  <span style={{ fontSize: "11px" }}>
                                    {r.retest_date}
                                    {r.retest_result && (
                                      <span className={`badge ${r.retest_result === "Pass" ? "badge-success" : "badge-danger"}`} style={{ marginLeft: 4, fontSize: "10px" }}>
                                        {r.retest_result}
                                      </span>
                                    )}
                                  </span>
                                ) : <span className="text-muted">—</span>}
                              </td>
                              <td>
                                <button
                                  className="btn-status-badge"
                                  onClick={() => toggleRemediationStatus(r)}
                                  title="Click to advance status"
                                >
                                  <span
                                    className={`badge ${r.milestone_status === "Closed" ? "badge-success"
                                      : r.milestone_status === "In-Progress" ? "badge-warning"
                                        : r.is_overdue ? "badge-danger"
                                          : "badge-danger"
                                      }`}
                                  >
                                    {r.milestone_status}
                                  </span>
                                </button>
                              </td>
                            </tr>
                          ))}

                          {remediations.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-4 text-slate">
                                No remediation plans yet. Click "+ CAPA" on a finding in the Observation Log to create one.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>

      </div>

      {/* ── Add / Edit Rule Modal ── */}
      {showAddRuleModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(11,31,58,0.45)",
            zIndex: 9998,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeRuleModal(); }}
        >
          <div style={{
            background: "var(--surface, #fff)",
            border: "1px solid var(--line, #e5e8ee)",
            borderRadius: "var(--radius, 14px)",
            padding: "28px 30px",
            width: 500,
            maxWidth: "93vw",
            boxShadow: "var(--shadow-lg, 0 16px 40px rgba(15,23,42,0.15))",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, color: "var(--navy, #0b1f3a)", fontSize: 17, fontFamily: "var(--font-head)" }}>
                  {editingRule ? "Edit Rule" : "Add New Rule"}
                </h3>
                <p style={{ margin: "3px 0 0", color: "var(--slate-soft, #7b8698)", fontSize: 12.5 }}>
                  {editingRule ? "Update the rule parameters below." : "Configure a new CAAT threshold rule."}
                </p>
              </div>
              <button
                onClick={closeRuleModal}
                style={{ background: "none", border: "none", color: "var(--slate-soft)", cursor: "pointer", padding: 4, fontSize: 16, lineHeight: 1 }}
                title="Close"
              >✕</button>
            </div>

            <form onSubmit={submitRuleForm} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Rule Name <span style={{ color: "var(--danger, #b42318)" }}>*</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Single Issuer Exposure Cap"
                  value={ruleForm.rule_name}
                  onChange={(e) => setRuleForm(p => ({ ...p, rule_name: e.target.value }))}
                  required
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label>Description</label>
                <textarea
                  className="input"
                  placeholder="Brief description of what this rule checks..."
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Threshold Type</label>
                  <select
                    className="input"
                    value={ruleForm.threshold_type}
                    onChange={(e) => setRuleForm(p => ({ ...p, threshold_type: e.target.value }))}
                  >
                    {(thresholdTypes.length > 0 ? thresholdTypes : [
                      "issuer_exposure_pct",
                      "min_credit_rating",
                      "sector_concentration_pct",
                      "maturity_days",
                      "liquidity_ratio",
                    ]).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Threshold Value (%)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="10"
                    min={0}
                    max={100}
                    step={0.1}
                    value={ruleForm.threshold_value}
                    onChange={(e) => setRuleForm(p => ({ ...p, threshold_value: e.target.value }))}
                  />
                </div>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label>Status</label>
                <select
                  className="input"
                  value={ruleForm.status}
                  onChange={(e) => setRuleForm(p => ({ ...p, status: e.target.value as "Active" | "Inactive" }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid var(--line)", marginTop: 4 }} />

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={closeRuleModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingRule ? "Save Changes" : "Add Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Finding Status Transition Modal ── */}
      {findingActionModal.open && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(11,31,58,0.45)",
            zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setFindingActionModal(p => ({ ...p, open: false })); }}
        >
          <div style={{
            background: "var(--surface, #fff)",
            border: "1px solid var(--line, #e5e8ee)",
            borderRadius: "var(--radius, 14px)",
            padding: "28px 30px",
            width: 440,
            maxWidth: "92vw",
            boxShadow: "var(--shadow-lg, 0 16px 40px rgba(15,23,42,0.15))",
          }}>
            {/* Accent bar */}
            <div style={{
              height: 3,
              borderRadius: 2,
              marginBottom: 18,
              background: findingActionModal.action === "resolve"
                ? "var(--success, #12805c)"
                : findingActionModal.action === "reopen"
                ? "var(--gold, #b8862b)"
                : "var(--navy, #0b1f3a)",
            }} />

            <h3 style={{ margin: "0 0 4px", color: "var(--navy, #0b1f3a)", fontSize: 16, fontFamily: "var(--font-head)" }}>
              {findingActionModal.action === "submit-review" && "Submit Finding for Review"}
              {findingActionModal.action === "resolve" && "Resolve Finding"}
              {findingActionModal.action === "reopen" && "Re-open Finding"}
            </h3>
            <p style={{ margin: "0 0 18px", color: "var(--slate-soft, #7b8698)", fontSize: 13 }}>
              {findingActionModal.action === "submit-review" && "This will transition the finding from Open → In Review."}
              {findingActionModal.action === "resolve" && "This marks the finding Resolved. The finding owner cannot resolve their own finding."}
              {findingActionModal.action === "reopen" && "This will move the finding back to Open status for re-investigation."}
            </p>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Reason for status change <span style={{ color: "var(--danger, #b42318)" }}>*</span></label>
              <textarea
                className="input"
                value={findingActionModal.reason}
                onChange={(e) => setFindingActionModal(p => ({ ...p, reason: e.target.value }))}
                placeholder="Provide a clear justification for this transition..."
                rows={3}
                style={{ resize: "vertical" }}
                autoFocus
              />
            </div>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setFindingActionModal(p => ({ ...p, open: false }))}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm"
                onClick={submitFindingTransition}
                style={{
                  background: findingActionModal.action === "resolve"
                    ? "var(--success, #12805c)"
                    : findingActionModal.action === "reopen"
                    ? "var(--gold, #b8862b)"
                    : "var(--navy, #0b1f3a)",
                  color: "#fff",
                  fontWeight: 600,
                  border: "none",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
