import { analyzeByStaff, analyzeByTask, calculateSummary } from '../../src/services/analytics.service';
import type { TaskReport } from '../../src/types';

const createTimestamp = (): TaskReport['createdAt'] =>
  ({
    toDate: () => new Date(),
    seconds: 0,
    nanoseconds: 0,
    valueOf: () => Date.now(),
  } as any);

const createReport = (
  report: Omit<
    TaskReport,
    | 'learnings'
    | 'ownResearchHours'
    | 'ownResearchLearnings'
    | 'competitorResearchHours'
    | 'competitorResearchLearnings'
    | 'createdAt'
  >
): TaskReport => ({
  learnings: '',
  ownResearchHours: 0,
  ownResearchLearnings: '',
  competitorResearchHours: 0,
  competitorResearchLearnings: '',
  createdAt: createTimestamp(),
  ...report,
});

const mockReports: TaskReport[] = [
  createReport({
    id: '1',
    userId: 'user1',
    date: new Date('2025-01-01'),
    tasks: [
      {
        accountName: 'さきAI',
        scheduledDate: new Date('2025-01-01'),
        taskName: 'Task A',
        taskType: 'create',
        durationHrs: 2.5,
        isCompleted: true,
        qualityScore: 4,
      },
      {
        accountName: 'さきAI',
        scheduledDate: new Date('2025-01-01'),
        taskName: 'Task B',
        taskType: 'fix',
        durationHrs: 1.0,
        isCompleted: true,
        qualityScore: 3,
      },
    ],
  }),
  createReport({
    id: '2',
    userId: 'user1',
    date: new Date('2025-01-02'),
    tasks: [
      {
        accountName: 'みさを',
        scheduledDate: new Date('2025-01-02'),
        taskName: 'Task B',
        taskType: 'create',
        durationHrs: 3.0,
        isCompleted: true,
        qualityScore: 5,
      },
    ],
  }),
  createReport({
    id: '3',
    userId: 'user2',
    date: new Date('2025-01-03'),
    tasks: [
      {
        accountName: 'れもん',
        scheduledDate: new Date('2025-01-03'),
        taskName: 'Task A',
        taskType: 'fix',
        durationHrs: 3.0,
        isCompleted: true,
        qualityScore: 3,
      },
    ],
  }),
];

describe('Analytics Service', () => {
  describe('calculateSummary', () => {
    it('should calculate correct summary for reports', () => {
      const summary = calculateSummary(mockReports);

      expect(summary.totalHours).toBe(9.5);
      expect(summary.averageQuality).toBe(3.8);
      expect(summary.createHours).toBeGreaterThanOrEqual(0);
      expect(summary.fixHours).toBeGreaterThanOrEqual(0);
      expect(summary.correctionHours).toBeGreaterThanOrEqual(0);
      expect(summary.taskCount).toBe(4);
    });

    it('should return zeros for empty reports', () => {
      const summary = calculateSummary([]);

      expect(summary.totalHours).toBe(0);
      expect(summary.averageQuality).toBe(0);
      expect(summary.createHours).toBe(0);
      expect(summary.fixHours).toBe(0);
      expect(summary.correctionHours).toBe(0);
      expect(summary.taskCount).toBe(0);
    });
  });

  describe('analyzeByStaff', () => {
    it('should group reports by staff and calculate metrics', () => {
      const staffAnalytics = analyzeByStaff(mockReports);

      expect(staffAnalytics).toHaveLength(2);

      const user1Stats = staffAnalytics.find((s) => s.staffId === 'user1');
      expect(user1Stats?.totalHours).toBe(6.5);
      expect(user1Stats?.averageQuality).toBe(4);
      expect(user1Stats?.createHours).toBeGreaterThanOrEqual(0);
      expect(user1Stats?.taskCount).toBe(3);

      const user2Stats = staffAnalytics.find((s) => s.staffId === 'user2');
      expect(user2Stats?.totalHours).toBe(3);
      expect(user2Stats?.averageQuality).toBe(3);
      expect(user2Stats?.fixHours).toBeGreaterThanOrEqual(0);
      expect(user2Stats?.taskCount).toBe(1);
    });
  });

  describe('analyzeByTask', () => {
    it('should group reports by task and calculate metrics', () => {
      const taskAnalytics = analyzeByTask(mockReports);

      expect(taskAnalytics).toHaveLength(2);

      const taskAStats = taskAnalytics.find((t) => t.taskName === 'Task A');
      expect(taskAStats?.totalHours).toBe(5.5);
      expect(taskAStats?.averageQuality).toBe(3.5);
      expect(taskAStats?.createHours).toBeGreaterThanOrEqual(0);
      expect(taskAStats?.taskCount).toBe(2);

      const taskBStats = taskAnalytics.find((t) => t.taskName === 'Task B');
      expect(taskBStats?.totalHours).toBe(4);
      expect(taskBStats?.averageQuality).toBe(4);
      expect(taskBStats?.fixHours).toBeGreaterThanOrEqual(0);
      expect(taskBStats?.taskCount).toBe(2);
    });
  });
});
