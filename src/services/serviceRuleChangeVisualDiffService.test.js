import { describe, it, expect, beforeEach } from 'vitest';
import {
  DIFF_CHANGE_TYPE,
  REQUIREMENT_CATEGORY,
  CHECKLIST_IMPACT_BADGE,
  CHANGE_NOTIFICATION_STATUS,
  STATUTORY_DIFF_DISCLAIMER,
  computeServiceRuleDiff,
  evaluateSavedChecklistImpact,
  recordChangeNotification,
  acknowledgeChangeNotification,
  getAccessibleDiffTable,
  sanitizeDiffNotificationForExport,
  _resetChangeNotificationStore,
} from './serviceRuleChangeVisualDiffService.js';

describe('ServiceRuleChangeVisualDiffService', () => {
  beforeEach(() => {
    _resetChangeNotificationStore();
  });

  const ruleV1 = {
    serviceId: 'SRV_INCOME_CERT',
    version: '1.0.0',
    statutoryCitation: 'Revenue RTS Rules 2024 Gazette Notification',
    requirements: [
      {
        id: 'REQ_SALARY_SLIP',
        category: REQUIREMENT_CATEGORY.MANDATORY_DOCUMENT,
        title: 'Consecutive 3-Month Salary Slips',
        value: '3 months consecutive',
      },
      {
        id: 'REQ_FEE',
        category: REQUIREMENT_CATEGORY.STATUTORY_FEE,
        title: 'Statutory User Processing Fee',
        value: 50,
      },
      {
        id: 'REQ_TIMELINE',
        category: REQUIREMENT_CATEGORY.PROCESSING_TIMELINE,
        title: 'Statutory SLA Timeline',
        value: '15 working days',
      },
      {
        id: 'REQ_OLD_AFFIDAVIT',
        category: REQUIREMENT_CATEGORY.MANDATORY_DOCUMENT,
        title: 'Notarized Stamp Paper Affidavit',
        value: 'INR 100 Stamp Paper',
      },
    ],
  };

  const ruleV2 = {
    serviceId: 'SRV_INCOME_CERT',
    version: '2.0.0',
    publishedDate: '2026-11-15T00:00:00Z',
    statutoryCitation: 'Revenue Modernization Amendment Notification 2026',
    requirements: [
      {
        id: 'REQ_SALARY_SLIP',
        category: REQUIREMENT_CATEGORY.MANDATORY_DOCUMENT,
        title: 'Consecutive 3-Month Salary Slips',
        value: '3 months consecutive', // Unchanged
      },
      {
        id: 'REQ_FEE',
        category: REQUIREMENT_CATEGORY.STATUTORY_FEE,
        title: 'Statutory User Processing Fee',
        value: 75, // Modified: fee increased from 50 to 75
      },
      {
        id: 'REQ_TIMELINE',
        category: REQUIREMENT_CATEGORY.PROCESSING_TIMELINE,
        title: 'Statutory SLA Timeline',
        value: '7 working days', // Modified: expedited from 15 to 7 days
      },
      // REQ_OLD_AFFIDAVIT is removed in V2
      {
        id: 'REQ_SELF_DECLARATION',
        category: REQUIREMENT_CATEGORY.MANDATORY_DOCUMENT,
        title: 'Self-Declaration Form replacing Affidavit',
        value: 'Digital e-Sign Self Declaration', // Added in V2
      },
    ],
  };

  describe('computeServiceRuleDiff', () => {
    it('throws error when rules or requirements are missing', () => {
      expect(() => computeServiceRuleDiff(null, ruleV2)).toThrow(
        'Both previousRule and newRule are required'
      );
      expect(() => computeServiceRuleDiff({ requirements: [] }, {})).toThrow(
        'Rules must contain a requirements array'
      );
    });

    it('identifies added, removed, modified, and unchanged requirement items', () => {
      const diff = computeServiceRuleDiff(ruleV1, ruleV2);

      expect(diff.serviceId).toBe('SRV_INCOME_CERT');
      expect(diff.previousVersion).toBe('1.0.0');
      expect(diff.newVersion).toBe('2.0.0');
      expect(diff.hasChanges).toBe(true);
      expect(diff.counts.added).toBe(1);
      expect(diff.counts.removed).toBe(1);
      expect(diff.counts.modified).toBe(2);
      expect(diff.counts.unchanged).toBe(1);

      // Verify added item
      const added = diff.diffItems.find((d) => d.id === 'REQ_SELF_DECLARATION');
      expect(added.changeType).toBe(DIFF_CHANGE_TYPE.ADDED);
      expect(added.previousValue).toBeNull();

      // Verify removed item
      const removed = diff.diffItems.find((d) => d.id === 'REQ_OLD_AFFIDAVIT');
      expect(removed.changeType).toBe(DIFF_CHANGE_TYPE.REMOVED);
      expect(removed.newValue).toBeNull();

      // Verify modified fee
      const feeMod = diff.diffItems.find((d) => d.id === 'REQ_FEE');
      expect(feeMod.changeType).toBe(DIFF_CHANGE_TYPE.MODIFIED);
      expect(feeMod.previousValue).toBe(50);
      expect(feeMod.newValue).toBe(75);

      expect(diff.advisorySummary.isAdvisory).toBe(true);
      expect(diff.advisorySummary.totalChanges).toBe(4);
      expect(diff.statutoryNotice).toBe(STATUTORY_DIFF_DISCLAIMER);
    });

    it('handles identical rules with zero structural changes', () => {
      const diff = computeServiceRuleDiff(ruleV1, ruleV1);
      expect(diff.hasChanges).toBe(false);
      expect(diff.counts.unchanged).toBe(4);
      expect(diff.counts.added).toBe(0);
      expect(diff.counts.modified).toBe(0);
    });
  });

  describe('evaluateSavedChecklistImpact', () => {
    it('evaluates saved checklist items and injects newly mandated requirements', () => {
      const diff = computeServiceRuleDiff(ruleV1, ruleV2);

      const savedChecklist = {
        planId: 'plan_9988',
        citizenId: 'cit_raj_44',
        serviceId: 'SRV_INCOME_CERT',
        items: [
          {
            id: 'chk_1',
            ruleRequirementId: 'REQ_SALARY_SLIP',
            title: 'Consecutive 3-Month Salary Slips',
            isCompleted: true,
          },
          {
            id: 'chk_2',
            ruleRequirementId: 'REQ_FEE',
            title: 'Statutory Fee',
            isCompleted: false,
          },
          {
            id: 'chk_3',
            ruleRequirementId: 'REQ_OLD_AFFIDAVIT',
            title: 'Notarized Stamp Paper',
            isCompleted: false,
          },
        ],
      };

      const evaluated = evaluateSavedChecklistImpact(savedChecklist, diff);

      expect(evaluated.planId).toBe('plan_9988');
      expect(evaluated.actionRequiredCount).toBeGreaterThan(0);

      // Verify stable unchanged item
      const salaryItem = evaluated.items.find((i) => i.ruleRequirementId === 'REQ_SALARY_SLIP');
      expect(salaryItem.impactBadge).toBe(CHECKLIST_IMPACT_BADGE.UNAFFECTED_STABLE);

      // Verify updated fee item
      const feeItem = evaluated.items.find((i) => i.ruleRequirementId === 'REQ_FEE');
      expect(feeItem.impactBadge).toBe(CHECKLIST_IMPACT_BADGE.FEE_SCHEDULE_UPDATED);
      expect(feeItem.guidance).toContain('50 to 75');

      // Verify removed affidavit item
      const affItem = evaluated.items.find((i) => i.ruleRequirementId === 'REQ_OLD_AFFIDAVIT');
      expect(affItem.impactBadge).toBe(CHECKLIST_IMPACT_BADGE.OBSOLETE_REMOVED_REQUIREMENT);

      // Verify newly injected requirement
      const newItem = evaluated.items.find((i) => i.ruleRequirementId === 'REQ_SELF_DECLARATION');
      expect(newItem).toBeDefined();
      expect(newItem.impactBadge).toBe(CHECKLIST_IMPACT_BADGE.ACTION_REQUIRED_NEW_REQUIREMENT);
    });

    it('throws error when savedChecklist or diff is invalid', () => {
      expect(() => evaluateSavedChecklistImpact(null, {})).toThrow(
        'Valid savedChecklist with items array is required'
      );
    });
  });

  describe('Notification Dispatch & Deduplication', () => {
    it('creates in-app change notification with deduplication', () => {
      const diff = computeServiceRuleDiff(ruleV1, ruleV2);

      const notif1 = recordChangeNotification({
        citizenId: 'cit_raj_44',
        planId: 'plan_9988',
        ruleDiff: diff,
      });

      expect(notif1.notificationId).toBeDefined();
      expect(notif1.status).toBe(CHANGE_NOTIFICATION_STATUS.DELIVERED_UNREAD);

      // Attempt duplicate dispatch for same version
      const notif2 = recordChangeNotification({
        citizenId: 'cit_raj_44',
        planId: 'plan_9988',
        ruleDiff: diff,
      });

      expect(notif2.notificationId).toBe(notif1.notificationId); // Deduplicated!
    });

    it('acknowledges and dismisses notifications properly', () => {
      const diff = computeServiceRuleDiff(ruleV1, ruleV2);
      const notif = recordChangeNotification({
        citizenId: 'cit_raj_44',
        planId: 'plan_9988',
        ruleDiff: diff,
      });

      const ack = acknowledgeChangeNotification(
        notif.notificationId,
        'cit_raj_44',
        CHANGE_NOTIFICATION_STATUS.ACKNOWLEDGED
      );

      expect(ack.status).toBe(CHANGE_NOTIFICATION_STATUS.ACKNOWLEDGED);
      expect(ack.acknowledgedAt).toBeDefined();
    });

    it('throws error when acknowledging non-existent notification', () => {
      expect(() =>
        acknowledgeChangeNotification('unknown_notif', 'cit_raj_44')
      ).toThrow('Notification \'unknown_notif\' not found');
    });
  });

  describe('getAccessibleDiffTable', () => {
    it('produces accessible tabular summary with optional category filter', () => {
      const diff = computeServiceRuleDiff(ruleV1, ruleV2);
      const table = getAccessibleDiffTable(diff);

      expect(Array.isArray(table)).toBe(true);
      expect(table.length).toBe(diff.diffItems.length);

      // Test category filter
      const docTable = getAccessibleDiffTable(diff, REQUIREMENT_CATEGORY.MANDATORY_DOCUMENT);
      docTable.forEach((row) => {
        expect(row.category).toBe(REQUIREMENT_CATEGORY.MANDATORY_DOCUMENT);
      });
    });

    it('throws error on invalid diff object', () => {
      expect(() => getAccessibleDiffTable(null)).toThrow('Valid ruleDiff is required');
    });
  });

  describe('Export Sanitization', () => {
    it('sanitizes notification record for compliance export', () => {
      const diff = computeServiceRuleDiff(ruleV1, ruleV2);
      const notif = recordChangeNotification({
        citizenId: 'cit_raj_44',
        planId: 'plan_9988',
        ruleDiff: diff,
      });

      const exported = sanitizeDiffNotificationForExport(notif);
      expect(exported.maskedCitizenId).toBe('cit_***__44');
      expect(exported.citizenId).toBeUndefined();
    });

    it('returns null on invalid input', () => {
      expect(sanitizeDiffNotificationForExport(null)).toBeNull();
    });
  });
});
