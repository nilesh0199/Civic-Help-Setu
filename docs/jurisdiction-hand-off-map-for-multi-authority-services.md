# Jurisdiction Hand-Off Map for Multi-Authority Civic Services

## Overview
Complex civic workflows—such as commercial building permits, factory clearances, land-title mutations, or food business registrations—rarely conclude within a single government department. Instead, an application traverses multiple administrative tiers: starting at a local Ward facilitation desk, ascending to Municipal town planning scrutiny, requiring District Collectorate revenue verification, mandating State Fire & Emergency clearances, and returning to the Municipal Commissioner for final sanction.

Without end-to-end visibility, citizens become lost in administrative hand-offs, unclear on which authority owns their current milestone, which official portal handles fee payments, or which statutory appellate officer handles escalations under state Right to Public Services (RTS) acts.

The **Jurisdiction Hand-Off Map Service** (`src/services/jurisdictionHandOffMapService.js`) introduces a deterministic administrative boundary resolver, stage-to-authority hand-off graph, and multi-tier contact directory. It provides citizens and urban planners with complete transparency into administrative ownership, official contact points, SLA timelines, and escalation channels across every stage.

---

## Architectural Principles & Workflow

```
   [ Non-Sensitive Citizen Locality / PIN Code Query ]
                           |
                           v
         +-----------------------------------+
         | Multi-Tier Administrative Resolver|
         |   - Ward, Municipality, District, |
         |     State & Central Hierarchies   |
         |   - Identifies Overlap Ambiguities|
         +-----------------+-----------------+
                           |
                           v
         +-----------------------------------+
         | Stage-to-Authority Hand-Off Engine|
         |   - Stage 1: Ward Intake          |
         |   - Stage 2: Municipal Scrutiny   |
         |   - Stage 3: District Revenue     |
         |   - Stage 4: State Fire NOC       |
         |   - Stage 5: Final Sanction       |
         +-----------------+-----------------+
                           |
          +----------------+----------------+
          |                                 |
          v                                 v
+--------------------+            +--------------------+
| Layered Map & Graph|            | Accessible Table   |
| (Nodes, Edges, GIS |            | (WCAG Non-Visual   |
|  Boundary Polygons)|            |  Tabular Parity)   |
+--------------------+            +--------------------+
                           |
                           v
         +-----------------------------------+
         | Authority Contacts & Escalations  |
         |   - Official Portals & Helplines  |
         |   - Designated RTS Escalation POC |
         +-----------------------------------+
```

---

## Core Capabilities

### 1. Multi-Tier Administrative Hierarchy
Models public authorities across five formal administrative tiers (`JURISDICTION_TIER`):
- **`WARD`**: Grassroots citizen facilitation centres (CFCs) and ward administrative desks.
- **`MUNICIPAL`**: Urban local bodies (ULBs), municipal corporations, and town planning scrutiny cells.
- **`DISTRICT`**: Collectorates, sub-divisional magistrates (SDMs), and land revenue offices.
- **`STATE`**: State directorates (Fire & Emergency, Public Health, Pollution Control Boards).
- **`CENTRAL`**: Central statutory agencies (FSSAI central licensing, National Highway authorities).

### 2. Boundary Ambiguity & Overlap Detection
- `resolveJurisdictionByLocation(pinOrLocality)` deterministically resolves PIN codes to authoritative jurisdictions.
- **Surfacing Overlaps**: Locations spanning dual or ambiguous jurisdictions (such as Military Cantonment Boards, Special Economic Zones, or inter-ward corridors) are explicitly flagged `OVERLAPPING_BOUNDARY_AMBIGUOUS` with detailed guidance notes, prompting citizen confirmation rather than guessing boundaries.

### 3. Stage-to-Authority Hand-Off Pipeline
`getServiceHandOffStages(serviceId, resolvedJurisdiction)` maps each consecutive stage:
- **`INTAKE_SUBMISSION`**: Initial document receipt and statutory scrutiny fee payment.
- **`FIELD_VERIFICATION`**: Ground inspection and land revenue title checks.
- **`TECHNICAL_SCRUTINY`**: Engineering, architectural, and FSI compliance checks.
- **`STATUTORY_NOC_CLEARANCE`**: External clearances (e.g. State Fire NOC).
- **`FINAL_APPROVAL_DISPATCH`**: Executive sanction and permit issuance.
- Computes cumulative SLA timelines and enriches each stage with official portal links, physical headquarters addresses, and statutory escalation contacts.

### 4. Vector Geometry with Tabular Parity
- `generateHandOffGraphAndMapLayers` produces directed hand-off graph structures (nodes and edges) and layered boundary polygons.
- **Graceful Fallback**: If vector GIS data is absent, the system provides a clean tabular view fallback (`NO_GEOMETRY_AVAILABLE_TABULAR_VIEW_ACTIVE`).
- `getAccessibleHandOffTable` ensures screen-reader users have complete access to stage ownership, contact details, and escalation routes.

### 5. Privacy & Data Minimization
- Never requests device GPS coordinates or precise home street addresses; queries remain at the PIN code or ward level.
- Sanitizes export logs for compliance audits (`sanitizeJurisdictionLookupForExport`).

---

## Statutory Notice & Scope

> [!IMPORTANT]
> **Statutory Notice**: The Jurisdiction Hand-Off Map illustrates administrative routing and statutory authority ownership across service stages. It is a citizen journey guide and does not substitute for formal court jurisdiction or gazetted administrative boundary notifications.

---

## Verification & Metrics
- **Unit Test Suite**: `src/services/jurisdictionHandOffMapService.test.js`
- **Results**: 14/14 tests passing.
- **Linting & Security**: 0 errors, 0 warnings across ESLint and `eslint.security.config.js`.
