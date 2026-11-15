# Citizen-Facing Service Rule Change Visual Diff with Saved-Checklist Impact

## Overview
When government authorities gazette administrative amendments to civic service delivery—such as introducing online self-declarations to replace notarized stamp-paper affidavits, revising statutory treasury processing fees, or updating Right to Public Services (RTS) SLA timelines—citizens actively preparing an application often remain unaware. When a citizen attempts to lodge an application using an outdated checklist, their submission faces immediate scrutiny queries, procedural rejections, or treasury discrepancies.

The **Citizen-Facing Service Rule Change Visual Diff Service** (`src/services/serviceRuleChangeVisualDiffService.js`) provides an automated version-comparison engine and saved-checklist impact mapper. It computes structural before-and-after diffs between immutable rule versions, tags saved citizen checklist items with actionable impact badges, delivers deduplicated in-app notifications, and provides accessible non-visual alternatives for screen readers.

---

## Architectural Principles & Workflow

```
   [ Administrator Publishes Versioned Service-Rule Revision ]
                               |
                               v
         +-------------------------------------------+
         | Deterministic Rule Diff Engine            |
         |   - Compares Previous vs New Version      |
         |   - Classifies Items: ADDED, REMOVED,     |
         |     MODIFIED, UNCHANGED                   |
         |   - Anchors to Official Gazette Citations |
         +---------------------+---------------------+
                               |
                               v
         +-------------------------------------------+
         | Saved-Checklist Impact Evaluator          |
         |   - Maps Citizen Items to Changed Rules   |
         |   - Injects New Mandatory Requirements    |
         |   - Labels Obsolete / Modified Items with |
         |     Actionable Impact Badges              |
         +---------------------+---------------------+
                               |
               +---------------+---------------+
               |                               |
               v                               v
     +-------------------+           +-------------------+
     | In-App Alert Feed |           | Accessible Table  |
     | (Deduplicated     |           | (WCAG Non-Visual  |
     |  Notifications)   |           |  Tabular Diff)    |
     +-------------------+           +-------------------+
                               |
                               v
         +-------------------------------------------+
         | Citizen Acknowledgement & Compliance Log  |
         |   - Acknowledged / Dismissed Status       |
         |   - Masked Export Sanitization            |
         +-------------------------------------------+
```

---

## Core Capabilities

### 1. Deterministic Before/After Visual Diff
- `computeServiceRuleDiff(previousRule, newRule)` systematically compares requirements across categories (`MANDATORY_DOCUMENT`, `STATUTORY_FEE`, `PROCESSING_TIMELINE`, `PROCEDURAL_STEP`).
- Identifies:
  - **`ADDED`**: Newly mandated requirements (e.g. digital self-declaration).
  - **`REMOVED`**: Obsolete documents discontinued by the state (e.g. stamp-paper affidavits).
  - **`MODIFIED`**: Value changes (e.g. statutory fee updated from INR 50 to INR 75; SLA expedited from 15 days to 7 days).
  - **`UNCHANGED`**: Requirements remaining constant across versions.
- Anchors every diff item to the official gazette citation and publication timestamp.

### 2. Saved-Checklist Impact Badges
`evaluateSavedChecklistImpact(savedChecklist, ruleDiff)` evaluates a citizen's saved preparation plan:
- **`ACTION_REQUIRED_NEW_REQUIREMENT`**: Injected for newly added requirements or modified rules needing citizen attention.
- **`OBSOLETE_REMOVED_REQUIREMENT`**: Signals that a previously required document has been waived.
- **`FEE_SCHEDULE_UPDATED`**: Highlights changes in treasury fee schedules.
- **`DEADLINE_EXTENDED_OR_SHORTENED`**: Informs citizens of statutory timeline changes.
- **`UNAFFECTED_STABLE`**: Indicates compliance remains unaffected.

### 3. Deduplicated Notification Feed
- `recordChangeNotification` alerts citizens when saved checklists are affected.
- **Deduplication**: Automatically prevents notification spam for the same rule version.
- Supports citizen lifecycle states (`DELIVERED_UNREAD`, `ACKNOWLEDGED`, `DISMISSED`).

### 4. Accessible Tabular Representation
- `getAccessibleDiffTable(ruleDiff, filterCategory)` outputs a linearized WCAG-compliant table.
- Enables screen-reader users to review changes by category without interacting with complex visual diff trees.

### 5. Privacy & Export Sanitization
- Ensures strict plan isolation between citizens.
- `sanitizeDiffNotificationForExport` scrubs citizen IDs for compliance audits.

---

## Statutory Notice & Scope

> [!IMPORTANT]
> **Statutory Notice**: Rule change visual diffs and saved checklist impact badges reflect published administrative amendments. Guidance is informational and does not constitute retroactive legal relief or guarantee official department grandfathering.

---

## Verification & Metrics
- **Unit Test Suite**: `src/services/serviceRuleChangeVisualDiffService.test.js`
- **Results**: 12/12 tests passing.
- **Linting & Security**: 0 errors, 0 warnings across ESLint and `eslint.security.config.js`.
