# Investments Audit Module — Client Walkthrough

## The business use case

The Investments module gives Internal Audit, Treasury Control and Risk teams one workspace to review whether an organisation’s investment portfolio is accurate, authorised, policy-compliant and correctly reported.

It is designed for a recurring investment audit: bring together the investment ledger, custodian/Demat statements, market prices, approval evidence and policy limits; test the portfolio; turn exceptions into owned corrective actions; and retain a reviewable audit trail.

In practical terms, the module helps answer five client questions:

1. Do the securities recorded in our books exist and agree with our custodian records?
2. Are valuations, income, classifications and impairment assessments correct?
3. Did every investment comply with delegated authority, policy limits and related-party requirements?
4. Which exceptions need management attention now?
5. Can we demonstrate the audit work, approvals and remediation progress to management and the Audit Committee?

---

## Suggested 12–15 minute client demo

### 1. Begin with the management view — Dashboard & KPIs

**Say:** “This is the portfolio-audit control tower. Before an auditor opens a workpaper, management can see the current exception count, overall compliance score, and the sector limits being monitored.”

Point out:

- **Active Exceptions** — items still requiring auditor verification.
- **Compliance Score Trend** — a month-on-month indicator of portfolio control health.
- **Sector Concentration Caps** — current exposure compared with permitted limits, with breaches highlighted.

**Client value:** It converts a scattered audit status into a concise risk conversation. The team can immediately prioritise a sector-limit breach or an unresolved high-severity exception.

### 2. Define what is being audited — Scope & Audit Universe

**Say:** “An audit starts with an explicit universe, not an informal spreadsheet. Here we define the treasury desks, subsidiaries or liquidity pools that are in scope, their risk level, the last audit date and the accountable lead.”

Demonstrate **Add Unit** and show that a unit can be marked in or out of scope.

**Client value:** Repeatable, risk-based audit coverage and a visible record of why a unit is included or cycled out.

### 3. Establish the audit design — RCM, rules and data sources

Walk through these pages briefly:

| Screen | Client explanation |
| --- | --- |
| **Risk & Control Matrix** | Connects risks (for example, unauthorised investment or incorrect valuation) to controls, audit assertions and control owners. |
| **Test & Analytics Rule Library** | Defines the automated checks and thresholds used to detect deviations. |
| **Data Source & Connector Setup** | Shows the intended inputs: ERP/ledger data, custody statements and market-price sources such as Bloomberg or Refinitiv. |
| **Sampling & Population Builder** | Lets the auditor select a procedure, sample size and tolerance before running a test. |

**Say:** “This makes the audit methodology transparent. We can show not only the result, but the rule, data source and risk rationale behind it.”

### 4. Lead with the core control — Holdings vs Custodian Reconciliation

Open **Holdings vs Custodian Reconciliation**.

**Say:** “This is the foundation control. It compares security quantity and value in the ERP ledger with the external custodian or Demat statement. Any mismatch is immediately visible rather than being buried in a reconciliation workbook.”

Use the unmatched **Evergreen Real Estate Trust** example to explain the workflow:

1. The system identifies the quantity and value difference.
2. The auditor investigates the underlying settlement, corporate action or posting issue.
3. The client can refresh the ledger/custody comparison after correction.
4. Evidence and the final conclusion are retained in the workpapers.

**Client value:** Faster detection of missing, duplicated or incorrectly valued holdings, with a clear audit trail.

### 5. Show the policy and approval tests

Use these screens as a focused “portfolio compliance” tour:

- **Valuation & Fair-Value Testing** — compares ERP values with independent price sources and highlights valuation/ECL issues.
- **Board Approval vs Limits** — tests transactions against delegation caps and Board/Treasury Committee approvals.
- **Concentration & Exposure** — checks single-issuer and sector exposure against Investment Policy Statement (IPS) limits.
- **Mandate & Policy Compliance** — presents a simple checklist of portfolio-policy conditions, such as minimum credit quality and liquidity.
- **Related-Party Investment Flag** — highlights investments in affiliates/associates that need appropriate disclosure and approval.

**Say:** “The point is not merely to list transactions. Each test asks whether the transaction was permitted, correctly approved and within the client’s risk appetite.”

Use the supplied examples to make the narrative tangible:

- a Tesla note above a delegated approval cap;
- a Vertex Pharma rating downgrade below the policy threshold;
- Real Estate exposure above its configured concentration cap.

### 6. Cover financial reporting and asset-risk testing

Explain that the module also supports detailed testing around:

- coupon and dividend **income recomputation**;
- maturity, settlement and **rollover approvals**;
- ISIN, issuer, asset-class and credit-rating **master-data governance**;
- realised gain/loss recalculation;
- overdue accrued income ageing;
- IFRS 9 expected-credit-loss / impairment screening;
- pledged or lien-marked investments;
- broker empanelment, allocation and commission controls; and
- IFRS 9 classification (amortised cost, FVOCI and FVTPL).

**Client value:** One audit workspace covers operational controls, policy compliance and financial-reporting assertions—rather than relying on disconnected teams and files.

### 7. Run the test — Sampling & Population Builder

Open **Sampling & Population Builder**.

**Say:** “For a selected procedure, the auditor chooses the sample size and tolerance, then starts the controls verification run. The result shows the procedure outcome, deviations found and the deviation rate.”

After running it, explain that the detected exception feeds the Exception Queue for triage.

**Client value:** Consistent testing parameters and a repeatable path from a test run to an actionable issue.

### 8. Convert exceptions into actions — Exception Queue, Findings and CAPA

Open **Exception & Red-Flag Queue**.

**Say:** “This is where signals become decisions. An auditor reviews each security, the amount, the reason for the exception and its severity, then marks it resolved only after it has been verified or corrected.”

Then show:

1. **Working Papers & Evidence** — attach custodian statements, pricing support, approvals and review status.
2. **Observation & Finding Log** — create a formal finding with severity, owner and target date.
3. **Remediation & CAPA Tracker** — monitor action-plan progress from pending through in-progress to resolved.

**Client value:** The client gains traceability from a data exception to evidence, management ownership, due date and closure—ready for Audit Committee reporting.

---

## End-to-end story to use with a client

“At month end, the Treasury audit team loads the investment ledger and the custodian statement. The reconciliation identifies a mismatch in a real-estate holding. At the same time, the module flags that Real Estate exposure is above its limit and that a security has fallen below the minimum credit rating. The auditor verifies the items, attaches the relevant statements and approval documents, and raises findings for the Treasury/Risk owners. Management then tracks the agreed corrective actions in one place until they are re-tested and closed.”

---

## Roles in the process

| Role | Uses the module to |
| --- | --- |
| **Treasury Operations** | Provide ledger/custodian support, explain breaks and complete corrective actions. |
| **Internal Audit** | Set scope, perform tests, retain evidence, raise findings and validate closure. |
| **Risk / Compliance** | Maintain IPS limits, review concentration and credit-risk breaches. |
| **Finance / Financial Reporting** | Support valuations, income recognition, impairment and classification checks. |
| **CFO / Audit Committee** | Review risk posture, significant exceptions and remediation progress. |

---

## Implementation note for client discussions

This build is an audit-module prototype with seeded illustrative portfolio records. Its server-backed functions currently include tenant-scoped exceptions, sector guardrails, compliance trends, exception resolution and a simulated test-run endpoint. The reconciliation refresh, workpaper storage, scope changes and findings/CAPA interactions are currently front-end demo behaviours (stored in the browser), while several procedure views display representative audit data.

For production rollout, position the next phase as integration and control hardening:

- connect approved ERP, custodian/Demat and market-data sources;
- persist workpapers, scope, findings and remediation in the central database with permissions and audit history;
- replace simulated procedures with approved rules, sampling logic and test evidence;
- configure the client’s IPS, delegation matrix, accounting policy and reporting templates; and
- validate roles, data retention and regulatory/reporting requirements.

This keeps the demo honest: the module already communicates the target operating model, while the production phase makes it operate on the client’s governed data and controls.

---

## Beginner's guide: the concepts behind every topic

This section explains the language in the walkthrough in plain English. You do not need to be an investment specialist to lead the demo: use it as your speaking notes.

### What is an investment portfolio?

An organisation does not always keep all surplus cash in a bank account. It may buy financial instruments to earn a return while keeping enough money available for operations. The collection of all these instruments is its **investment portfolio**.

Common instruments in this module include:

- **Bond / note / debenture:** the organisation lends money to a company or government. In return, it normally receives interest (called a coupon) and gets its original amount back at maturity.
- **Commercial paper:** short-term borrowing issued by a company, often used for temporary cash management.
- **Certificate of deposit:** a deposit-like instrument issued by a bank for a fixed period.
- **Equity:** shares in a company. The holder may receive dividends and can gain or lose value as the share price changes.
- **Fund or trust:** a pooled investment vehicle, such as a real-estate trust.

For each investment, an organisation needs to know the instrument name, issuer, quantity held, purchase cost, current value, maturity date, interest rate, credit rating and any restrictions. The audit module checks whether this information and the decisions behind it are reliable.

### Why does the investment portfolio need an audit?

Investment activity can involve large amounts, several teams and external parties. A simple error can lead to an overstated balance, a missed interest receipt, a policy breach or an unauthorised transaction. An audit is an independent, structured review of the records and controls.

The audit does not manage the money or make trades. It asks whether Treasury and Finance did their work correctly and in line with the organisation's own rules. It uses evidence such as bank/custodian statements, trade confirmations, approval emails, Board resolutions, price reports and accounting entries.

### Dashboard & KPIs

A **dashboard** is the summary page. It is for a manager who wants the answer before reviewing all the detailed records.

- **KPI** means Key Performance Indicator: a short measure that helps someone judge the current situation.
- **Active exception** means a condition that failed a check and has not yet been confirmed as corrected or acceptable.
- **Compliance score** is a high-level indicator of how well the portfolio currently meets the configured checks. It is useful for trend discussion, but it should not replace reviewing high-risk exceptions individually.
- **Sector concentration cap** is a limit on how much of the portfolio may be invested in one industry, such as Technology or Real Estate. It prevents over-reliance on one part of the economy.

When demonstrating this page, explain that the red/amber/green indicators help management decide where to ask questions first. They do not by themselves prove wrongdoing; they point to work that needs review.

### Scope & Audit Universe

The **audit universe** is the complete list of areas that could be audited: treasury desks, subsidiaries, bank accounts, investment pools, fund managers or geographical entities. **Scope** is the smaller set selected for the current audit.

An auditor cannot usually test everything every month. They decide the scope using risk. For example, a high-value corporate treasury desk, a new subsidiary or a unit with a past issue may be included, while a stable low-risk pool may be reviewed later. Recording the decision makes the audit plan defensible and repeatable.

The module records the unit, risk category, last audit date, audit lead and whether it is in scope. In a client conversation, say: “This lets the organisation prove it is using a planned, risk-based approach rather than choosing audit areas informally.”

### Risk & Control Matrix (RCM)

An **RCM** is a structured map of what can go wrong and how the business is expected to prevent or detect it.

For example:

| RCM element | Example |
| --- | --- |
| Risk | Treasury buys a security that is not permitted by the investment policy. |
| Control | Before settlement, the system checks the asset type and rating against the policy, and the Treasury Manager approves it. |
| Evidence | System validation log and approval record. |
| Owner | Treasury Manager. |
| Audit test | Auditor selects sample trades and verifies both the check and approval. |

An **assertion** is the accounting/audit statement being tested. Common assertions are existence (the asset is real), completeness (nothing is missing), valuation (the amount is correct), rights and obligations (the entity owns it), and classification (it is recorded in the right accounting category).

### Test rules, analytics and thresholds

A **test rule** converts an audit requirement into a repeatable check. A **threshold** is the limit that determines when the check should raise an alert.

Examples:

- Flag a trade when its amount is greater than the approver's delegation limit.
- Flag a sector when current exposure is greater than the IPS limit.
- Flag an investment when its credit rating falls below the allowed rating.
- Flag a valuation when the ERP value differs from an independent price by more than the permitted tolerance.

**Analytics** means using data to run these checks across many records. It helps the auditor focus on unusual or high-risk items rather than manually reading every trade. The human auditor still investigates the result, because an exception may be a genuine error, an approved exception, or a data-quality issue.

### Data sources and connectors

The module needs reliable source data. A **connector** is the controlled link that brings data from another system into the module, either by API (an automated system-to-system connection) or by a validated file upload.

The main sources are:

- **ERP/general ledger:** the organisation's internal accounting records. This is what Finance says it owns and how it is valued in the books.
- **Custodian statement:** a report from the institution that safekeeps securities. It is independent external evidence of what is held.
- **Demat statement:** in India, an electronic record of securities held in a dematerialised account; NSDL and CDSL are major depositories.
- **Market data source:** an independent provider of prices and ratings, such as Bloomberg or Refinitiv.
- **Approval repository:** Board resolutions, committee minutes, delegated-authority approvals and supporting documents.

For a production system, client data should be linked through approved, secure integrations with access controls and a refresh schedule. A spreadsheet upload may be appropriate as an interim method, but it should include validation and an audit trail.

### Holdings vs Custodian Reconciliation

A **reconciliation** is a comparison of two records that should agree. Here, the module compares the internal ERP ledger with the external custodian/Demat statement.

The check normally compares two things:

- **Quantity:** how many units of a security are held.
- **Value:** the monetary amount recorded for that holding.

If the two sources agree, the item is a match. If they do not agree, the difference is a **reconciliation break**. Common causes include a trade recorded in one system but not yet settled, a sale posted incorrectly, a corporate action, a wrong security code, an omitted fee, or a timing difference.

The auditor's job is not simply to press “match.” They obtain an explanation, inspect the evidence, decide whether an accounting correction or other action is needed, and retain that conclusion. This is why reconciliation is usually the first and most important investment-audit procedure: it supports the assertion that the assets exist and that the organisation owns them.

### Valuation and fair-value testing

**Valuation** means the amount assigned to an investment in the financial statements. Purchase cost is not always the value reported today. For instruments that are measured at fair value, the reported amount should broadly reflect the price at which the instrument could be sold in an orderly market.

The module compares:

- the **ERP book price**, which Finance used;
- an **independent price**, obtained from a reputable market-data source or broker quote; and
- the variance between them.

The auditor investigates material variances. A difference may be due to stale prices, an incorrect price feed, different valuation dates, wrong quantity, a liquidity discount or a pricing-model issue. The goal is to ensure the financial statements are not materially misstated.

### Delegated authority, Board approval and limits

Organisations set an approval hierarchy called a **delegation of authority** (DOA). It specifies who may approve decisions up to particular monetary limits. For larger or more sensitive transactions, the policy may require a Treasury Committee or Board resolution.

For example, a CFO may be allowed to approve investments up to $5 million, while a $12.5 million investment requires Board approval. The test checks the trade value, the approver, and the approval reference. If the right approval is absent, the issue is a governance/control breach even when the investment itself later performs well.

### Income recomputation

Investment income is often interest (a **coupon**) on debt securities or a dividend on shares. **Recomputation** means the auditor independently calculates what should have been received and compares it to what actually arrived in the bank or was booked in the ledger.

A simplified coupon calculation is: face value x coupon rate x fraction of the year held. The fraction depends on the **day-count convention**, a market rule that determines how days are counted (for example, actual/365 or 30/360).

The test can reveal missed receipts, incorrect rates, wrong accruals or amounts recorded in the wrong period. A small difference may be due to tax withholding or timing; a material unexplained difference needs correction or a finding.

### Related-party investments

A **related party** is a person or entity with a close relationship to the organisation, such as a subsidiary, associate, director, key executive or entity controlled by them. These transactions require particular attention because the relationship may influence the decision or its terms.

The module helps identify investments in such entities and checks whether they were disclosed and approved as required. The purpose is transparency: decision-makers and financial-statement users should be able to understand relationships that could create conflicts of interest.

### Concentration and exposure limits

**Exposure** is the amount of financial risk the organisation has to an issuer, asset class, country, currency or sector. **Concentration** occurs when too much exposure sits in one place.

If much of a portfolio is invested in one real-estate issuer or sector, a downturn there can affect the entire portfolio. An Investment Policy Statement therefore sets caps, such as no more than 10% in a single issuer or no more than 20% in one sector. The screen shows current percentage against the cap and highlights breaches.

A breach should trigger review, not automatic blame. The client must determine whether it was caused by a new purchase, a market-value movement, a permitted temporary exception, or a failure to act.

### Maturity, settlement and rollover tracking

**Maturity** is the date on which a debt investment is due to repay its principal. At that point, the organisation may receive cash, sell the instrument, or reinvest/extend it. Extending or reinvesting is called a **rollover**.

This test checks whether upcoming maturities are known, cash settlement occurred as expected, and any rollover had the appropriate approval. Without this control, cash may be unexpectedly locked up, or funds may be reinvested without authority.

### Instrument master data governance

**Master data** is the core reference information that many processes use. For an investment, it includes the ISIN/security identifier, issuer, asset class, coupon, maturity, currency and credit rating.

An **ISIN** is a unique international identification code for a security. Good master data prevents a trade from being allocated to the wrong instrument and enables policy rules to work correctly. The audit checks whether reference data is complete, accurate, approved and consistent with the IPS. A rating downgrade is important because it can make a once-permitted asset non-compliant.

### Realised gain/loss testing

A **realised gain or loss** occurs when an organisation sells an investment. It is generally the sale proceeds minus the accounting cost of the units sold.

The cost may be calculated using a method such as **FIFO** (First In, First Out: the earliest purchased units are treated as sold first) or weighted average cost. The auditor recomputes the amount using the client's approved method and compares it with what Finance recorded. This helps ensure profit, loss and tax reporting are correct.

### Investment Policy Statement (IPS) compliance

The **Investment Policy Statement** is the organisation's written rulebook for investing. It may define permitted asset types, minimum credit ratings, maximum concentration, minimum liquidity, approval limits, risk appetite and reporting requirements.

The IPS page turns those rules into a checklist. For example:

- “Equities must not exceed 15% of the portfolio.”
- “Debt investments must have a rating of at least A-.”
- “At least a specified amount must remain in liquid assets.”

The audit confirms that practice matches the policy. This is central to the module because a portfolio can be profitable yet still breach its approved risk appetite.

### Accrued income ageing

**Accrued income** is interest or dividend income that has been earned but not yet received or, in some cases, not yet fully recorded. **Ageing** groups unpaid amounts by how overdue they are: not due, 1–30 days, 31–90 days, and over 90 days.

Older unpaid amounts may indicate a collection problem, a disputed entitlement, an issuer in financial difficulty or a bookkeeping error. The screen helps an auditor focus on overdue income that could need follow-up, adjustment or impairment consideration.

### Impairment and expected credit loss (ECL)

**Impairment** means recognising that an asset may not be fully recoverable. For debt investments, IFRS 9 uses an **Expected Credit Loss (ECL)** approach: the organisation estimates expected losses before an actual default occurs.

The model generally distinguishes stages:

- **Stage 1:** credit risk has not increased significantly; a lower level of expected loss is recognised.
- **Stage 2:** credit risk has increased significantly, often shown by a material rating downgrade; expected losses over the instrument's remaining life are considered.
- **Stage 3:** the asset is credit-impaired/defaulted.

The module uses risk cues such as ratings and deterioration to flag instruments needing review. It does not replace a formal finance impairment model; it helps auditors verify whether the model and resulting provision were considered.

### Pledged or lien-marked investments

An investment may be **pledged** as collateral to a bank, for example to support a working-capital facility. A **lien** is a legal claim or restriction over the asset. The organisation may still own the investment, but cannot freely sell or use it until the obligation is released.

The audit checks the asset, value, bank/lienholder, purpose and authorisation. This matters because encumbered investments may not be available for liquidity needs and should be properly disclosed.

### Broker and dealing controls

A **broker** helps execute securities transactions. Organisations normally maintain an **empanelled** list of approved brokers, based on due diligence, contracts and performance criteria.

The module checks whether transactions were placed with approved brokers, whether trade volumes are overly concentrated, and whether commission rates stay within policy. This helps manage operational risk, conflicts of interest, best-execution concerns and avoidable dealing costs.

### Disclosure and accounting classification

Financial-reporting standards require investments to be classified according to how the organisation manages them and what contractual cash flows they produce.

Under IFRS 9, the main categories shown are:

- **Amortised cost:** normally used when the asset is held to collect contractual cash flows and passes the SPPI test.
- **FVOCI (Fair Value through Other Comprehensive Income):** fair-value movements are reported outside ordinary profit/loss in other comprehensive income, subject to the applicable criteria.
- **FVTPL (Fair Value through Profit or Loss):** fair-value movements affect profit/loss; commonly used for trading assets and certain equity investments.

**SPPI** means “Solely Payments of Principal and Interest.” It asks whether the contractual cash flows are consistent with a basic lending arrangement. The audit checks that the classification and related disclosures are appropriate, because classification affects reported profit, equity and impairment treatment.

### Sampling and the simulated controls test

Auditors frequently test a sample when it is impractical to inspect every transaction. A **population** is the complete set of transactions or holdings available for testing. A **sample** is the smaller selection tested in detail.

- **Sample size:** how many items are selected.
- **Tolerance:** the allowed level of error/deviation before the control result becomes concerning.
- **Deviation rate:** the percentage of tested items that failed the defined check.

The module's simulation panel demonstrates this workflow: choose a procedure, set parameters, run the check and review the result. In the current prototype it uses a simulated backend event rather than a real audit engine; in production, it would process the client's governed data and approved test rules.

### Exception queue and triage

An **exception** is a record that failed a rule or needs review. **Triage** means sorting and assessing it so the right person handles it with the right urgency.

The auditor reviews the security, financial amount, explanation, date, severity and status. They may request evidence, correct data, escalate the item or determine that a documented waiver makes it acceptable. Marking an item resolved should mean the resolution is supported by evidence, not simply that the alert was closed.

### Working papers and evidence

**Working papers** are the files and notes that prove what the auditor did, what evidence was reviewed and why the conclusion was reached. Examples include custodian statements, price extracts, approval minutes, reconciliations, test sheets and management explanations.

The module's evidence register records the document name, related task, uploader, date, size and review/sign-off status. Review status is important because audit quality normally requires a senior person to review work before it is considered complete.

### Findings, observations and remediation (CAPA)

An **observation** or **finding** is a formal statement of a control weakness, error or non-compliance. It should clearly state:

- the condition found;
- the expected rule or criterion;
- the cause and risk/effect;
- the responsible owner;
- severity; and
- target closure date.

**CAPA** means Corrective and Preventive Action. A corrective action fixes the current issue; a preventive action changes the process so the issue is less likely to return. The remediation tracker connects each finding to its owner, action plan, due date and status. Internal Audit then re-tests the action before closure.

For the final client message, say: “The module does not stop at finding a problem. It creates ownership and evidence for a controlled path to closure.”

---

## Every module topic explained for a first-time presenter

Use the explanations below when a client asks, “What exactly does this page do?” Each one is deliberately written in simple language and can be read almost word for word during a demo.

### 1. Module Dashboard & KPIs

This is the home page of the investment audit module, similar to a summary page in a banking or health app. It does not show every individual transaction; instead, it gives senior people the most important signals in one view. “Active Exceptions” tells us how many issues have been found but are not yet confirmed as fixed. “Compliance Score” is a simplified measure of whether the portfolio is following the checks and limits set by the organisation. The sector-cap section shows whether too much money has been placed into one industry, such as Real Estate or Technology. We use this page at the beginning of a meeting to decide which problem deserves attention first.

### 2. Scope & Audit Universe

This page answers a basic audit question: which parts of the business are we checking in this audit? A large organisation may have several treasury teams, subsidiaries, bank accounts, investment pools or foreign locations, and it may not be possible to test all of them at once. The module lists these possible areas and lets the auditor mark them as high, medium or low risk. The auditor then chooses which areas are “in scope,” meaning they will be reviewed in the current audit cycle. This is useful because it makes the audit plan transparent: a client can see what was covered, who owns it and when it was last audited.

### 3. Risk & Control Matrix (RCM)

This page is the audit team's map of risks and controls. A risk is something that could go wrong, for example buying a risky investment without proper approval. A control is the business step designed to stop or detect that problem, such as a system check or manager approval. The RCM records the risk, the control, the person responsible and the evidence that should exist. The auditor uses this map to decide what tests to perform and to avoid checking random things without a clear reason. In simple terms, it connects “what could go wrong?” to “what should prevent it?” and then to “how can we prove it worked?”

### 4. Test & Analytics Rule Library

This page is where the audit checks are defined before they are run on data. A rule might say, “Flag an investment if its rating is below A-,” or “Flag a sector if it exceeds 20% of the portfolio.” The threshold is the number or condition that changes a normal item into an exception. By storing rules in one place, every auditor applies the same logic instead of using a different spreadsheet formula. The client can also review and approve the rules, which is important because the rules should reflect the organisation's own policy. Think of it as the instruction book for the automated and repeatable parts of the audit.

### 5. Data Source & Connector Setup

This page describes where the module gets the information it needs to test investments. The ERP or general ledger provides the organisation's own accounting records, while the custodian or Demat statement gives independent evidence of securities held. Market-data providers such as Bloomberg may provide current prices and credit ratings. A connector is simply a secure, controlled way for one system to send data to another system, usually through an API or an approved file upload. This page matters because an audit conclusion is only as reliable as the data used to make it. During a demo, explain that the production version would connect to the client's approved data sources and retain a log of when data was refreshed.

### 6. Sampling & Population Builder

This page is used when there are too many transactions to inspect one by one. The population is the complete list of investments or transactions that could be tested, and a sample is the smaller set selected for detailed review. The auditor chooses a test procedure, the number of items to test and the allowed tolerance for errors. For example, the auditor might check 20 bond purchases and decide that more than one approval failure is unacceptable. Sampling saves time while still giving the audit team a disciplined way to form a conclusion. The current module demonstrates this process with a simulated run; in a real deployment it would use the client's actual population and sampling approach.

### 7. Holdings vs Custodian Reconciliation

This is one of the most important pages because it checks whether the investments recorded inside the company actually agree with what the external custodian says is being held. The ERP quantity and value come from internal records, while the custodian quantity and value come from the institution that safekeeps the securities. If both agree, the holding is marked as a match. If they do not agree, it is called a reconciliation break and the difference must be investigated. A break can happen because a trade has not settled, a sale was posted wrongly, a corporate action was missed or a record was entered against the wrong security. The auditor uses the evidence to decide whether the difference is a temporary timing matter or a real error that needs correction.

### 8. Valuation & Fair-Value Testing

This page checks whether the value recorded for an investment is reasonable and supported by independent evidence. The company may have bought an investment for one price, but the price today can be higher or lower. For financial reporting, many investments must be shown at their current fair value rather than their original purchase cost. The module compares the value in the ERP with a price from an independent market source or broker quote. A large difference does not automatically mean fraud or an error, but it requires an explanation such as a different valuation date, an outdated price feed or a special market condition. The purpose is to reduce the risk that the financial statements show investments at the wrong amount.

### 9. Board Approval vs Limits

This page checks whether each investment was approved by someone who had enough authority to approve it. Organisations normally have a Delegation of Authority policy that says, for example, a manager can approve up to one amount and the Board must approve anything above a larger amount. The module compares the investment amount with the approving person's authority and looks for the approval or resolution reference. If a transaction above the limit has only a lower-level approval, it is a control breach. The investment might still be financially sound, but the organisation did not follow its governance process. This screen helps the client show that major decisions were properly authorised and documented.

### 10. Income Recomputation

This page checks whether the interest and dividends earned from investments have been calculated correctly. For a bond, the company expects interest based on the amount invested, the coupon rate and the time for which it held the bond. The module independently calculates the expected amount and compares it with what the bank received or what Finance recorded. If the two numbers differ, the reason could be a missed payment, an incorrect rate, a tax deduction, a timing difference or an accounting error. The auditor asks for supporting documents and determines whether the difference needs adjustment. This prevents investment income from being understated or overstated in the accounts.

### 11. Related-Party Investment Flag

This page looks for investments connected to the organisation's own group, directors or influential people. For example, investing in a subsidiary, an associate company or a company where a director has a significant interest could be a related-party transaction. These investments are not always wrong, but they need extra transparency because there may be a conflict of interest. The module records the relationship, exposure amount, disclosure status and approval status. The auditor checks whether the relationship was disclosed in the right reports and whether the appropriate people approved the deal. This protects the client from hidden conflicts and incomplete financial-statement disclosures.

### 12. Concentration & Exposure

This page checks whether the company has placed too much of its investment money in one area. An organisation can be exposed to one issuer, one sector, one country, one currency or one type of asset. Too much concentration is risky because one event can damage a large part of the portfolio at the same time. For example, if a company has many real-estate investments and the real-estate market falls, its losses could be larger than expected. The Investment Policy Statement usually sets maximum percentages, and this page compares actual exposure with those limits. If the limit is breached, Treasury and Risk must decide whether to reduce exposure, obtain a documented exception or change the policy through the proper approval process.

### 13. Maturity & Rollover Tracking

This page tracks debt investments that are nearing the date on which they must repay the original invested amount. That date is called the maturity date. When an investment matures, the company can take its cash back, buy another investment or agree to extend the existing investment; the extension is called a rollover. The module shows the maturity date, the intended action and who authorised it. This is important because Treasury needs to know when cash will become available and must not reinvest money without the right approval. It also helps prevent an overdue investment from being rolled over automatically without anyone noticing.

### 14. Instrument Master Governance

This page checks the basic reference information stored for every investment security. The record includes items such as the unique ISIN code, issuer name, asset class and credit rating. This information may look administrative, but it is very important because policy checks and accounting decisions depend on it. If the rating or asset class is wrong, the system may incorrectly approve an investment or miss a breach. The module checks whether the information is complete and whether the investment is still allowed under the Investment Policy Statement. A credit-rating downgrade is a good example: a security that was permitted when bought may become non-compliant later if its rating falls.

### 15. Realised Gain/Loss Testing

This page is used after an investment has been sold. A realised gain means the company sold it for more than its accounting cost; a realised loss means it sold it for less. The auditor recalculates the cost of the units sold using the company's approved method, such as FIFO, which means the earliest purchased units are treated as sold first. The module then compares the auditor's calculation with the gain or loss reported by Finance. If the two amounts do not agree, the difference can affect profit, tax and management reporting. This test gives confidence that the company is reporting investment sales correctly rather than relying on an unverified calculation.

### 16. Mandate & Policy Compliance

This page is a direct check against the company's Investment Policy Statement, often called the IPS. The IPS is the organisation's official rulebook for where it may invest, how much risk it may take and what approvals it needs. It might say that debt investments must have at least a certain credit rating, that equities must be below a percentage of the portfolio, or that a minimum amount must remain liquid. The module translates these written policy statements into clear compliant or breach indicators. This makes it easier for a client to see whether the portfolio is operating within its stated risk appetite. It also gives Internal Audit a simple way to report policy breaches to management and the Audit Committee.

### 17. Accrued Income Ageing

This page tracks interest or dividends that should be received from investments but have not yet been collected. “Accrued” means the income has been earned over time, even if the cash has not yet arrived. “Ageing” means grouping the unpaid amounts by how long they have been outstanding, such as 1–30 days or more than 90 days. An amount that is not yet due is usually normal, but an amount overdue for many days may suggest a collection problem, a dispute or an issuer experiencing financial stress. The module helps the auditor and Finance team focus on older, riskier unpaid balances. This supports correct income recording and can also signal the need to consider impairment.

### 18. Impairment Trigger Screening

This page looks for signs that an investment may not be fully recoverable. For a debt investment, the company may not receive all the interest or principal if the issuer's ability to pay becomes weaker. A rating downgrade, missed payment or serious financial difficulty can be an impairment trigger. The module shows the holding value, current rating, IFRS 9 stage and any provision that has been recorded. A provision is an amount recognised in the accounts to reflect an expected loss. The auditor uses this screen to ask whether Finance noticed the warning signs and used an appropriate impairment calculation.

### 19. Pledged / Lien Investments

This page shows investments that have been offered to a bank as security for a loan or other facility. When an investment is pledged, the organisation may still own it, but it may not be free to sell or use it without the bank's consent. A lien is the legal restriction or claim placed over that asset. The module records the pledged asset, value, bank, reason for the pledge and approval date. This is important because an investment that looks available on the balance sheet may not actually be available to meet a cash need. The audit checks that pledges were authorised, recorded correctly and disclosed when required.

### 20. Broker & Dealing Controls

This page reviews the brokers used to buy and sell investments. A broker is an external firm that helps execute a trade in the market. Companies usually keep an approved or “empanelled” broker list so they only deal with firms that have passed due diligence. The module checks whether trades were placed through approved brokers, how much volume each broker received and what commission was paid. It also helps identify unusual concentration, such as one broker receiving almost all business, or a commission rate above policy. These checks reduce the risk of poor dealing practices, unnecessary costs, conflicts of interest or trading through an unapproved party.

### 21. Disclosure & Classification

This page checks whether investments are shown in the correct accounting category in the financial statements. Different classifications can affect whether changes in value go into profit, other comprehensive income or are measured using amortised cost. The module refers to IFRS 9 categories such as FVTPL, FVOCI and Amortised Cost. It also looks at the business purpose of the investment and the SPPI test, which asks whether its cash flows are simply principal and interest. This may sound technical, but the key client message is straightforward: the way an investment is labelled changes the accounting result, so it must be reviewed carefully. The auditor checks that Finance has used the correct category and made the required disclosures.

### 22. Exception & Red-Flag Queue

This page is the working list of all investment issues identified by the module's checks. Each row tells the auditor what security is affected, the amount involved, the reason the item was flagged, its severity and its current status. A red flag is not a final conclusion; it is a prompt to investigate. The auditor reviews evidence, discusses the issue with Treasury or Finance and decides whether it is a real error, an approved exception or a data problem. Only after that work is completed should an item be marked resolved. This page gives management a single controlled list of risks instead of multiple disconnected emails and spreadsheets.

### 23. Working Papers & Evidence

This page is the audit file for the work performed in the module. Auditors need to keep evidence showing what they checked, what documents they used and why they reached their conclusion. The user can attach custodian statements, valuation reports, Board approvals, calculation sheets and other supporting files against the relevant audit task. The page records who uploaded the file, when it was added and whether a reviewer has approved it. This is important because an audit conclusion should be reviewable by someone who was not present when the work was done. For a client, it means the evidence is organised with the issue rather than stored in separate folders and email chains.

### 24. Observation & Finding Log

This page is used when an issue is serious enough to be formally reported to management. An observation or finding should clearly explain what was found, what policy or expected control was not followed, why it matters and what needs to happen next. The module records the title, detailed description, severity, responsible owner and target closure date. Severity helps management focus: a high-severity issue may involve a significant financial, compliance or governance risk, while a low-severity issue may need a smaller process improvement. The finding is more formal than an exception because it is a documented audit conclusion, not just a system alert. It becomes the basis for the client's agreed corrective action plan.

### 25. Remediation & CAPA Tracker

This page follows the issue after it has been formally raised. CAPA means Corrective and Preventive Action: correct the immediate problem and make a change that reduces the chance of it happening again. Each action has an owner, target date and progress status, such as pending, in progress or resolved. For example, a corrective action may be to obtain a missing approval, while a preventive action may be to add a system block for investments above the approval limit. Internal Audit does not close the item just because management says it is complete; it should review evidence and re-test the action. This tracker lets senior management and the Audit Committee see whether agreed improvements are actually being delivered on time.
