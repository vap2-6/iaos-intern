"""Rule evaluation engine for the Test & Analytics Rule Library.

Pure-Python functions that take a portfolio (list of holdings) plus a rule's
threshold value and return a structured breach report. Kept separate from
the FastAPI router so the logic is testable and reusable.

Each evaluator accepts:
    portfolio: list[dict] with at least {issuer, security, value}
    threshold: float — the rule's configured threshold_value

Each evaluator returns a dict:
    {
      "passed": bool,
      "portfolio_total": float,
      "breaches": list[dict]   # see RuleViolation schema in schemas.py
    }
"""
from __future__ import annotations

from typing import Callable


# ---------------------------------------------------------------------------
# Public engine entry point
# ---------------------------------------------------------------------------

def evaluate_rule(threshold_type: str, portfolio: list[dict], threshold: float) -> dict:
    """Dispatch to the right evaluator based on the rule's threshold_type.

    Unknown threshold types are reported as a passed rule with no breaches
    (the engine is additive — new rule types simply opt in by registering
    below).
    """
    evaluator = EVALUATORS.get(threshold_type)
    if evaluator is None:
        return {
            "passed": True,
            "portfolio_total": _portfolio_total(portfolio),
            "breaches": [],
            "note": f"No evaluator registered for threshold_type='{threshold_type}'.",
        }
    return evaluator(portfolio, threshold)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _portfolio_total(portfolio: list[dict]) -> float:
    return float(sum(float(p.get("value", 0) or 0) for p in portfolio))


def _percentage(value: float, total: float) -> float:
    if total <= 0:
        return 0.0
    return (value / total) * 100.0


# ---------------------------------------------------------------------------
# Evaluators
# ---------------------------------------------------------------------------

def check_issuer_exposure(portfolio: list[dict], threshold: float) -> dict:
    """Single-issuer concentration rule.

    Iterates every holding, computes its percentage of the total portfolio
    value, and flags any holding whose share exceeds the configured
    `threshold` (interpreted as a percentage, e.g. 10.0 means 10%).
    """
    total = _portfolio_total(portfolio)
    breaches: list[dict] = []

    for holding in portfolio:
        issuer = str(holding.get("issuer") or holding.get("security") or "Unknown")
        security = str(holding.get("security") or issuer)
        value = float(holding.get("value", 0) or 0)
        pct = _percentage(value, total)

        if pct > float(threshold):
            breaches.append({
                "issuer": issuer,
                "security": security,
                "value": round(value, 2),
                "pct_of_portfolio": round(pct, 4),
                "threshold": float(threshold),
            })

    return {
        "passed": len(breaches) == 0,
        "portfolio_total": round(total, 2),
        "breaches": breaches,
    }


def check_sector_concentration(portfolio: list[dict], threshold: float) -> dict:
    """Sector-level concentration rule.

    Aggregates holdings by `sector`, computes each sector's share of the
    total portfolio, and flags any sector above the threshold percentage.
    """
    total = _portfolio_total(portfolio)
    sector_totals: dict[str, float] = {}
    sector_samples: dict[str, dict] = {}

    for holding in portfolio:
        sector = str(holding.get("sector") or "Unclassified")
        value = float(holding.get("value", 0) or 0)
        sector_totals[sector] = sector_totals.get(sector, 0.0) + value
        if sector not in sector_samples:
            sector_samples[sector] = holding

    breaches: list[dict] = []
    for sector, sum_value in sector_totals.items():
        pct = _percentage(sum_value, total)
        if pct > float(threshold):
            sample = sector_samples.get(sector, {})
            breaches.append({
                "issuer": sector,
                "security": sample.get("security", sector),
                "value": round(sum_value, 2),
                "pct_of_portfolio": round(pct, 4),
                "threshold": float(threshold),
            })

    return {
        "passed": len(breaches) == 0,
        "portfolio_total": round(total, 2),
        "breaches": breaches,
    }


def check_min_credit_rating(portfolio: list[dict], threshold: float) -> dict:
    """Minimum credit rating rule.

    `threshold` is the lowest acceptable numeric rating (higher = better on
    the S&P-style scale we use: AAA=10, AA=9, ..., CCC=2). Holdings without
    a numeric rating are flagged as unrated.
    """
    def _rating_to_score(rating: str | None) -> float | None:
        if not rating:
            return None
        r = str(rating).strip().upper().replace(" ", "")
        scale = {
            "AAA": 10, "AA+": 9.5, "AA": 9, "AA-": 8.5,
            "A+": 8, "A": 7, "A-": 6.5,
            "BBB+": 6, "BBB": 5, "BBB-": 4.5,
            "BB+": 4, "BB": 3, "BB-": 2.5,
            "B+": 2, "B": 1.5, "B-": 1.0,
            "CCC+": 0.5, "CCC": 0.0,
        }
        if r in scale:
            return float(scale[r])
        try:
            return float(r)
        except (TypeError, ValueError):
            return None

    breaches: list[dict] = []
    total = _portfolio_total(portfolio)
    floor = float(threshold)

    for holding in portfolio:
        score = _rating_to_score(holding.get("rating"))
        security = str(holding.get("security") or holding.get("issuer") or "Unknown")
        issuer = str(holding.get("issuer") or security)

        if score is None or score < floor:
            breaches.append({
                "issuer": issuer,
                "security": security,
                "value": round(float(holding.get("value", 0) or 0), 2),
                "pct_of_portfolio": round(_percentage(float(holding.get("value", 0) or 0), total), 4),
                "threshold": floor,
            })

    return {
        "passed": len(breaches) == 0,
        "portfolio_total": round(total, 2),
        "breaches": breaches,
    }


def check_dividend_variance(portfolio: list[dict], threshold: float) -> dict:
    """Dividend / coupon receipt variance rule.

    Flags holdings whose `actual_received` deviates from `expected_coupon`
    by more than `threshold` percent.
    """
    breaches: list[dict] = []
    total = _portfolio_total(portfolio)

    for holding in portfolio:
        expected = float(holding.get("expected_coupon", 0) or 0)
        actual = float(holding.get("actual_received", 0) or 0)
        if expected <= 0:
            continue

        variance_pct = abs(actual - expected) / expected * 100.0
        if variance_pct > float(threshold):
            security = str(holding.get("security") or holding.get("issuer") or "Unknown")
            breaches.append({
                "issuer": str(holding.get("issuer") or security),
                "security": security,
                "value": round(expected, 2),
                "pct_of_portfolio": round(variance_pct, 4),
                "threshold": float(threshold),
            })

    return {
        "passed": len(breaches) == 0,
        "portfolio_total": round(total, 2),
        "breaches": breaches,
    }


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

EVALUATORS: dict[str, Callable[[list[dict], float], dict]] = {
    "issuer_exposure_pct": check_issuer_exposure,
    "sector_concentration_pct": check_sector_concentration,
    "min_credit_rating": check_min_credit_rating,
    "dividend_variance_pct": check_dividend_variance,
}


def available_threshold_types() -> list[str]:
    """Returns the threshold types the engine knows how to evaluate."""
    return sorted(EVALUATORS.keys())
