import { describe, it, expect } from 'vitest';
import {
  JURISDICTION_TIER,
  STAGE_HAND_OFF_STATUS,
  RESOLUTION_CONFIDENCE,
  STATUTORY_JURISDICTION_DISCLAIMER,
  resolveJurisdictionByLocation,
  getServiceHandOffStages,
  generateHandOffGraphAndMapLayers,
  getAccessibleHandOffTable,
  sanitizeJurisdictionLookupForExport,
} from './jurisdictionHandOffMapService.js';

describe('JurisdictionHandOffMapService', () => {
  describe('resolveJurisdictionByLocation', () => {
    it('throws error for invalid or empty input', () => {
      expect(() => resolveJurisdictionByLocation('')).toThrow('A valid PIN code or locality string is required');
      expect(() => resolveJurisdictionByLocation(null)).toThrow('A valid PIN code or locality string is required');
    });

    it('resolves valid PIN code to complete administrative hierarchy with EXACT_MATCH', () => {
      const result = resolveJurisdictionByLocation('411001');

      expect(result.confidence).toBe(RESOLUTION_CONFIDENCE.EXACT_MATCH);
      expect(result.isAmbiguous).toBe(false);
      expect(result.resolved).toBeDefined();
      expect(result.resolved.wardName).toBe('Ward 1 - Central Zone');
      expect(result.resolved.municipality).toContain('Municipal Corporation');
      expect(result.resolved.district).toBe('Pune District');
      expect(result.resolved.state).toBe('Maharashtra');
      expect(result.resolved.hasGeometry).toBe(true);
      expect(result.statutoryNotice).toBe(STATUTORY_JURISDICTION_DISCLAIMER);
    });

    it('identifies overlapping boundary zones as OVERLAPPING_BOUNDARY_AMBIGUOUS without guessing', () => {
      const result = resolveJurisdictionByLocation('411999');

      expect(result.confidence).toBe(RESOLUTION_CONFIDENCE.OVERLAPPING_BOUNDARY_AMBIGUOUS);
      expect(result.isAmbiguous).toBe(true);
      expect(result.ambiguityNote).toContain('Cantonment Board');
    });

    it('returns UNRESOLVED_OUT_OF_SCOPE for unmapped location queries', () => {
      const result = resolveJurisdictionByLocation('999999');

      expect(result.confidence).toBe(RESOLUTION_CONFIDENCE.UNRESOLVED_OUT_OF_SCOPE);
      expect(result.resolved).toBeNull();
      expect(result.message).toContain('could not be automatically resolved');
    });

    it('handles absent geometry gracefully', () => {
      const result = resolveJurisdictionByLocation('411038');
      expect(result.confidence).toBe(RESOLUTION_CONFIDENCE.EXACT_MATCH);
      expect(result.resolved.hasGeometry).toBe(false);
      expect(result.resolved.boundaryPolygon).toBeNull();
    });
  });

  describe('getServiceHandOffStages', () => {
    it('enriches multi-tier stages with authority metadata, contacts, and SLA calculations', () => {
      const jurisdiction = resolveJurisdictionByLocation('411001');
      const pipeline = getServiceHandOffStages('SRV_BUILDING_SANCTION_MULTI', jurisdiction);

      expect(pipeline.serviceId).toBe('SRV_BUILDING_SANCTION_MULTI');
      expect(pipeline.totalStages).toBe(5);
      expect(pipeline.totalSlaDays).toBeGreaterThan(0);

      // Verify cross-tier involvement
      expect(pipeline.tiersInvolved).toContain(JURISDICTION_TIER.WARD);
      expect(pipeline.tiersInvolved).toContain(JURISDICTION_TIER.MUNICIPAL);
      expect(pipeline.tiersInvolved).toContain(JURISDICTION_TIER.DISTRICT);
      expect(pipeline.tiersInvolved).toContain(JURISDICTION_TIER.STATE);

      // Verify specific stage hand-off authority metadata
      const stateFireStage = pipeline.stages.find((s) => s.statusType === STAGE_HAND_OFF_STATUS.STATUTORY_NOC_CLEARANCE);
      expect(stateFireStage).toBeDefined();
      expect(stateFireStage.authority.tier).toBe(JURISDICTION_TIER.STATE);
      expect(stateFireStage.authority.officialPortal).toContain('firesafety.state.gov.in');
      expect(stateFireStage.authority.escalationOfficer).toBeDefined();
    });

    it('throws error for unsupported service ID', () => {
      expect(() => getServiceHandOffStages('UNSUPPORTED_SERVICE')).toThrow(
        'Unsupported multi-authority service'
      );
    });
  });

  describe('generateHandOffGraphAndMapLayers', () => {
    it('generates directed hand-off graph nodes and edges between stages', () => {
      const jurisdiction = resolveJurisdictionByLocation('411001');
      const pipeline = getServiceHandOffStages('SRV_BUILDING_SANCTION_MULTI', jurisdiction);
      const visualizer = generateHandOffGraphAndMapLayers(pipeline);

      expect(visualizer.totalNodes).toBe(5);
      expect(visualizer.totalEdges).toBe(4); // 5 sequential stages = 4 hand-off edges

      const firstEdge = visualizer.edges[0];
      expect(firstEdge.source).toBe('node_stage_1');
      expect(firstEdge.target).toBe('node_stage_2');
      expect(firstEdge.label).toContain('Hands off from WARD to MUNICIPAL');

      expect(visualizer.mapLayer.hasVectorGeometry).toBe(true);
      expect(visualizer.mapLayer.boundaryPolygon).toBeDefined();
    });

    it('provides fallback string when map geometry is unavailable', () => {
      const jurisdiction = resolveJurisdictionByLocation('411038'); // absent geometry
      const pipeline = getServiceHandOffStages('SRV_BUILDING_SANCTION_MULTI', jurisdiction);
      const visualizer = generateHandOffGraphAndMapLayers(pipeline);

      expect(visualizer.mapLayer.hasVectorGeometry).toBe(false);
      expect(visualizer.mapLayer.geometryFallback).toContain('TABULAR_VIEW_ACTIVE');
    });

    it('throws error when invalid pipeline object is passed', () => {
      expect(() => generateHandOffGraphAndMapLayers(null)).toThrow(
        'Valid handOffPipeline with stages array is required'
      );
    });
  });

  describe('getAccessibleHandOffTable', () => {
    it('produces structured accessible rows for assistive technologies', () => {
      const pipeline = getServiceHandOffStages('SRV_BUILDING_SANCTION_MULTI');
      const table = getAccessibleHandOffTable(pipeline);

      expect(Array.isArray(table)).toBe(true);
      expect(table.length).toBe(5);

      const firstRow = table[0];
      expect(firstRow.stageNumber).toBe(1);
      expect(firstRow.tier).toBe(JURISDICTION_TIER.WARD);
      expect(firstRow.authority).toBeDefined();
      expect(firstRow.portal).toBeDefined();
      expect(firstRow.escalationContact).toBeDefined();
    });

    it('throws error on invalid pipeline input', () => {
      expect(() => getAccessibleHandOffTable(null)).toThrow(
        'Valid handOffPipeline with stages array is required'
      );
    });
  });

  describe('sanitizeJurisdictionLookupForExport', () => {
    it('sanitizes lookup outputs for audit logs', () => {
      const lookup = resolveJurisdictionByLocation('411001');
      const sanitized = sanitizeJurisdictionLookupForExport(lookup);

      expect(sanitized.query).toBe('411001');
      expect(sanitized.confidence).toBe(RESOLUTION_CONFIDENCE.EXACT_MATCH);
      expect(sanitized.resolvedWard).toBe('Ward 1 - Central Zone');
    });

    it('returns null on invalid input', () => {
      expect(sanitizeJurisdictionLookupForExport(null)).toBeNull();
    });
  });
});
