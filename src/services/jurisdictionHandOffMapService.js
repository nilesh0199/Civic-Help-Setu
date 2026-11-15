/**
 * Jurisdiction Hand-Off Map Service for Multi-Authority Civic Services
 *
 * Implements a deterministic administrative boundary resolver, multi-tier stage hand-off tracer,
 * and responsibility visualizer for complex public services spanning multiple government tiers:
 *
 * 1. Multi-Tier Administrative Jurisdiction Modeling:
 *    - Models authorities across WARD, MUNICIPAL, DISTRICT, STATE, and CENTRAL tiers.
 *    - Resolves citizen PIN codes and localities to authoritative jurisdiction hierarchies.
 *    - Explicitly surfaces overlapping boundaries and jurisdictional ambiguities without guessing.
 *
 * 2. Stage-to-Authority Hand-Off Engine:
 *    - Traces the sequential hand-off chain (Intake -> Field Inspection -> Technical Scrutiny -> State NOC -> Final Sanction).
 *    - Links each stage to the responsible authority, official contacts, portal URLs, and statutory escalation paths.
 *
 * 3. Multi-Modal Map & Hand-Off Timeline:
 *    - Generates layered boundary polygons/coordinates and directed hand-off graph edges.
 *    - Provides a linearized WCAG-compliant tabular alternative for non-visual and mobile access.
 *
 * 4. Human Confirmation Gatekeeper for Boundary Ambiguities:
 *    - Cantonment, Special Economic Zone (SEZ), and border overlaps are flagged OVERLAPPING_BOUNDARY_AMBIGUOUS.
 *    - Prompts citizen to confirm specific administrative pocket rather than guessing boundaries.
 *
 * 5. Privacy Safeguards & Non-PII Lookup:
 *    - Accepts only non-sensitive PIN codes or ward names (no device GPS tracking or home addresses).
 *    - Sanitizes lookup records for compliance auditing.
 */

export const JURISDICTION_TIER = {
  WARD: 'WARD',
  MUNICIPAL: 'MUNICIPAL',
  DISTRICT: 'DISTRICT',
  STATE: 'STATE',
  CENTRAL: 'CENTRAL',
};

export const STAGE_HAND_OFF_STATUS = {
  INTAKE_SUBMISSION: 'INTAKE_SUBMISSION',
  FIELD_VERIFICATION: 'FIELD_VERIFICATION',
  TECHNICAL_SCRUTINY: 'TECHNICAL_SCRUTINY',
  STATUTORY_NOC_CLEARANCE: 'STATUTORY_NOC_CLEARANCE',
  FINAL_APPROVAL_DISPATCH: 'FINAL_APPROVAL_DISPATCH',
};

export const RESOLUTION_CONFIDENCE = {
  EXACT_MATCH: 'EXACT_MATCH',
  OVERLAPPING_BOUNDARY_AMBIGUOUS: 'OVERLAPPING_BOUNDARY_AMBIGUOUS',
  UNRESOLVED_OUT_OF_SCOPE: 'UNRESOLVED_OUT_OF_SCOPE',
};

export const JURISDICTION_VIEWER_STATE = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  ERROR: 'ERROR',
  STALE_DATA_WARNING: 'STALE_DATA_WARNING',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  READY: 'READY',
};

export const STATUTORY_JURISDICTION_DISCLAIMER =
  'Statutory Notice: The Jurisdiction Hand-Off Map illustrates administrative routing and statutory authority ownership across service stages. It is a citizen journey guide and does not substitute for formal court jurisdiction or gazetted administrative boundary notifications.';

/**
 * Built-in authoritative administrative directory.
 */
export const AUTHORITIES_DIRECTORY = {
  AUTH_WARD_1_CFC: {
    id: 'AUTH_WARD_1_CFC',
    name: 'Ward 1 Citizen Facilitation Centre',
    tier: JURISDICTION_TIER.WARD,
    officialPortal: 'https://citizen.municipal.gov.in/ward1',
    officeAddress: '12 Shivaji Road, Ward 1 Administrative Building',
    contactHelpline: '020-25501001',
    escalationOfficer: 'Assistant Municipal Commissioner (Ward 1)',
  },
  AUTH_MUNICIPAL_TOWN_PLANNING: {
    id: 'AUTH_MUNICIPAL_TOWN_PLANNING',
    name: 'Municipal Corporation Town Planning & Architectural Scrutiny Cell',
    tier: JURISDICTION_TIER.MUNICIPAL,
    officialPortal: 'https://townplanning.municipal.gov.in',
    officeAddress: 'Civic Centre Headquarters, 3rd Floor, Central Annex',
    contactHelpline: '020-25502002',
    escalationOfficer: 'City Engineer / Chief Town Planner',
  },
  AUTH_DISTRICT_COLLECTORATE: {
    id: 'AUTH_DISTRICT_COLLECTORATE',
    name: 'District Collectorate & Revenue Sub-Divisional Office',
    tier: JURISDICTION_TIER.DISTRICT,
    officialPortal: 'https://districtrevenue.state.gov.in',
    officeAddress: 'District Treasury Complex, Station Road',
    contactHelpline: '020-26123456',
    escalationOfficer: 'Resident Deputy Collector (RDC)',
  },
  AUTH_STATE_FIRE_SERVICES: {
    id: 'AUTH_STATE_FIRE_SERVICES',
    name: 'State Directorate of Fire & Emergency Services',
    tier: JURISDICTION_TIER.STATE,
    officialPortal: 'https://firesafety.state.gov.in',
    officeAddress: 'State Emergency Headquarters, Old Mumbai Road',
    contactHelpline: '101 / 020-25503003',
    escalationOfficer: 'Chief Fire Officer / Director Fire Services',
  },
  AUTH_MUNICIPAL_COMMISSIONER: {
    id: 'AUTH_MUNICIPAL_COMMISSIONER',
    name: 'Office of the Municipal Commissioner (Sanction Authority)',
    tier: JURISDICTION_TIER.MUNICIPAL,
    officialPortal: 'https://commissioner.municipal.gov.in',
    officeAddress: 'Main Municipal Corporation Building',
    contactHelpline: '020-25500001',
    escalationOfficer: 'Municipal Commissioner, IAS',
  },
};

/**
 * Multi-authority service pipelines.
 */
export const MULTI_AUTHORITY_SERVICES = {
  SRV_BUILDING_SANCTION_MULTI: {
    serviceId: 'SRV_BUILDING_SANCTION_MULTI',
    title: 'High-Rise Architectural Permit and Building Sanction',
    statutoryAct: 'State Town & Country Planning Act & National Building Code 2016',
    stages: [
      {
        stageNumber: 1,
        stageName: 'Application Intake & Scrutiny Fee Payment',
        statusType: STAGE_HAND_OFF_STATUS.INTAKE_SUBMISSION,
        authorityId: 'AUTH_WARD_1_CFC',
        slaDays: 2,
        actionSummary: 'Citizen submits architectural drawings and pays municipal user charges.',
      },
      {
        stageNumber: 2,
        stageName: 'Town Planning Architectural Scrutiny',
        statusType: STAGE_HAND_OFF_STATUS.TECHNICAL_SCRUTINY,
        authorityId: 'AUTH_MUNICIPAL_TOWN_PLANNING',
        slaDays: 14,
        actionSummary: 'Town planning cell verifies Floor Space Index (FSI), setbacks, and parking norms.',
      },
      {
        stageNumber: 3,
        stageName: 'Revenue Land Title & NA Clearance Verification',
        statusType: STAGE_HAND_OFF_STATUS.FIELD_VERIFICATION,
        authorityId: 'AUTH_DISTRICT_COLLECTORATE',
        slaDays: 10,
        actionSummary: 'District Collectorate verifies non-agricultural land conversion (NA) order and title deed.',
      },
      {
        stageNumber: 4,
        stageName: 'State High-Rise Provisional Fire NOC',
        statusType: STAGE_HAND_OFF_STATUS.STATUTORY_NOC_CLEARANCE,
        authorityId: 'AUTH_STATE_FIRE_SERVICES',
        slaDays: 15,
        actionSummary: 'State fire officers inspect fire hydrant provisions, staircase clear width, and fire exits.',
      },
      {
        stageNumber: 5,
        stageName: 'Final Building Permit Sanction & Commencement Certificate',
        statusType: STAGE_HAND_OFF_STATUS.FINAL_APPROVAL_DISPATCH,
        authorityId: 'AUTH_MUNICIPAL_COMMISSIONER',
        slaDays: 4,
        actionSummary: 'Municipal commissioner signs and issues the legal commencement certificate (CC).',
      },
    ],
  },
};

/**
 * Authoritative PIN code to jurisdiction mapping database.
 */
export const LOCALITY_JURISDICTION_REGISTRY = {
  '411001': {
    pinCode: '411001',
    localityName: 'Shivaji Nagar / Central',
    wardId: 'WARD_1',
    wardName: 'Ward 1 - Central Zone',
    municipality: 'Central Metro Municipal Corporation',
    district: 'Pune District',
    state: 'Maharashtra',
    confidence: RESOLUTION_CONFIDENCE.EXACT_MATCH,
    boundaryPolygon: [
      [18.52, 73.85],
      [18.53, 73.86],
      [18.52, 73.87],
      [18.51, 73.86],
    ],
  },
  '411038': {
    pinCode: '411038',
    localityName: 'Kothrud Suburb',
    wardId: 'WARD_2',
    wardName: 'Ward 2 - West Hills',
    municipality: 'Central Metro Municipal Corporation',
    district: 'Pune District',
    state: 'Maharashtra',
    confidence: RESOLUTION_CONFIDENCE.EXACT_MATCH,
    boundaryPolygon: null, // Absent geometry test case
  },
  '411999': {
    pinCode: '411999',
    localityName: 'Cantonment Board Overlap Area',
    wardId: null,
    wardName: 'Overlap Area (Military Cantonment vs Municipal)',
    municipality: 'Dual Jurisdiction / Cantonment Board',
    district: 'Pune District',
    state: 'Maharashtra',
    confidence: RESOLUTION_CONFIDENCE.OVERLAPPING_BOUNDARY_AMBIGUOUS,
    boundaryPolygon: null,
    ambiguityNote: 'Boundary overlaps with Military Cantonment Board. Municipal bylaws apply only to civil pockets.',
  },
};

/**
 * Resolves a PIN code or locality name to an administrative jurisdiction hierarchy.
 *
 * @param {string} pinOrLocality
 * @returns {Object} Resolution outcome
 */
export function resolveJurisdictionByLocation(pinOrLocality) {
  if (!pinOrLocality || typeof pinOrLocality !== 'string') {
    throw new Error('A valid PIN code or locality string is required');
  }

  const normalized = pinOrLocality.trim();
  const match = LOCALITY_JURISDICTION_REGISTRY[normalized];

  if (!match) {
    return {
      query: normalized,
      confidence: RESOLUTION_CONFIDENCE.UNRESOLVED_OUT_OF_SCOPE,
      message: `Jurisdiction could not be automatically resolved for '${normalized}'. Please choose an adjacent verified ward.`,
      resolved: null,
      statutoryNotice: STATUTORY_JURISDICTION_DISCLAIMER,
    };
  }

  return {
    query: normalized,
    confidence: match.confidence,
    isAmbiguous: match.confidence === RESOLUTION_CONFIDENCE.OVERLAPPING_BOUNDARY_AMBIGUOUS,
    ambiguityNote: match.ambiguityNote || null,
    resolved: {
      pinCode: match.pinCode,
      localityName: match.localityName,
      wardName: match.wardName,
      municipality: match.municipality,
      district: match.district,
      state: match.state,
      hasGeometry: match.boundaryPolygon !== null,
      boundaryPolygon: match.boundaryPolygon,
    },
    statutoryNotice: STATUTORY_JURISDICTION_DISCLAIMER,
  };
}

/**
 * Retrieves the complete multi-tier hand-off pipeline for a service.
 *
 * @param {string} serviceId Service identifier
 * @param {Object} resolvedJurisdiction Output of resolveJurisdictionByLocation
 * @returns {Object} Complete hand-off sequence
 */
export function getServiceHandOffStages(serviceId = 'SRV_BUILDING_SANCTION_MULTI', resolvedJurisdiction = null) {
  const service = MULTI_AUTHORITY_SERVICES[serviceId];
  if (!service) {
    throw new Error(`Unsupported multi-authority service: '${serviceId}'`);
  }

  const enrichedStages = service.stages.map((stage) => {
    const auth = AUTHORITIES_DIRECTORY[stage.authorityId];
    return {
      stageNumber: stage.stageNumber,
      stageName: stage.stageName,
      statusType: stage.statusType,
      slaDays: stage.slaDays,
      actionSummary: stage.actionSummary,
      authority: {
        id: auth ? auth.id : stage.authorityId,
        name: auth ? auth.name : stage.authorityId,
        tier: auth ? auth.tier : JURISDICTION_TIER.MUNICIPAL,
        officialPortal: auth ? auth.officialPortal : null,
        officeAddress: auth ? auth.officeAddress : null,
        contactHelpline: auth ? auth.contactHelpline : null,
        escalationOfficer: auth ? auth.escalationOfficer : null,
      },
    };
  });

  const totalSlaDays = enrichedStages.reduce((acc, s) => acc + s.slaDays, 0);
  const tiersInvolved = [...new Set(enrichedStages.map((s) => s.authority.tier))];

  return {
    serviceId: service.serviceId,
    title: service.title,
    statutoryAct: service.statutoryAct,
    totalStages: enrichedStages.length,
    totalSlaDays,
    tiersInvolved,
    resolvedJurisdiction: resolvedJurisdiction ? resolvedJurisdiction.resolved : null,
    stages: enrichedStages,
    statutoryNotice: STATUTORY_JURISDICTION_DISCLAIMER,
  };
}

/**
 * Generates directed hand-off graph structure (nodes & edges) and map layer boundaries.
 *
 * @param {Object} handOffPipeline Output of getServiceHandOffStages
 * @returns {Object} Visualizer graph and map data
 */
export function generateHandOffGraphAndMapLayers(handOffPipeline) {
  if (!handOffPipeline || !Array.isArray(handOffPipeline.stages)) {
    throw new Error('Valid handOffPipeline with stages array is required');
  }

  const nodes = [];
  const edges = [];

  handOffPipeline.stages.forEach((stage, index) => {
    nodes.push({
      id: `node_stage_${stage.stageNumber}`,
      stageNumber: stage.stageNumber,
      stageName: stage.stageName,
      authorityName: stage.authority.name,
      tier: stage.authority.tier,
      slaDays: stage.slaDays,
      escalationOfficer: stage.authority.escalationOfficer,
    });

    if (index > 0) {
      const prevStage = handOffPipeline.stages[index - 1];
      edges.push({
        id: `edge_${prevStage.stageNumber}_to_${stage.stageNumber}`,
        source: `node_stage_${prevStage.stageNumber}`,
        target: `node_stage_${stage.stageNumber}`,
        label: `Hands off from ${prevStage.authority.tier} to ${stage.authority.tier}`,
      });
    }
  });

  const mapGeometry = handOffPipeline.resolvedJurisdiction?.boundaryPolygon || null;

  return {
    serviceId: handOffPipeline.serviceId,
    nodes,
    edges,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    mapLayer: {
      hasVectorGeometry: mapGeometry !== null,
      boundaryPolygon: mapGeometry,
      geometryFallback: mapGeometry === null ? 'NO_GEOMETRY_AVAILABLE_TABULAR_VIEW_ACTIVE' : null,
    },
  };
}

/**
 * Returns an accessible, screen-reader friendly table of the hand-off pipeline.
 *
 * @param {Object} handOffPipeline Output of getServiceHandOffStages
 * @returns {Array<Object>} Accessible rows
 */
export function getAccessibleHandOffTable(handOffPipeline) {
  if (!handOffPipeline || !Array.isArray(handOffPipeline.stages)) {
    throw new Error('Valid handOffPipeline with stages array is required');
  }

  return handOffPipeline.stages.map((stage) => ({
    stageNumber: stage.stageNumber,
    stageName: stage.stageName,
    tier: stage.authority.tier,
    authority: stage.authority.name,
    portal: stage.authority.officialPortal || 'Portal offline',
    slaDays: `${stage.slaDays} days`,
    escalationContact: stage.authority.escalationOfficer || 'Not specified',
    summary: stage.actionSummary,
  }));
}

/**
 * Sanitizes a jurisdiction lookup for compliance export.
 *
 * @param {Object} lookupOutput
 * @returns {Object}
 */
export function sanitizeJurisdictionLookupForExport(lookupOutput) {
  if (!lookupOutput || typeof lookupOutput !== 'object') return null;

  return {
    query: lookupOutput.query,
    confidence: lookupOutput.confidence,
    isAmbiguous: lookupOutput.isAmbiguous,
    resolvedWard: lookupOutput.resolved ? lookupOutput.resolved.wardName : 'None',
    resolvedMunicipality: lookupOutput.resolved ? lookupOutput.resolved.municipality : 'None',
    statutoryNotice: lookupOutput.statutoryNotice,
  };
}
