import { TaskReport, StaffAnalytics, TaskAnalytics, TaskItem } from '../types';

type MetricAccumulator = {
  totalHours: number;
  createHours: number;
  fixHours: number;
  correctionHours: number;
  qualitySum: number;
  qualityCount: number;
  taskCount: number;
};

const round1Decimal = (value: number): number => Math.round(value * 10) / 10;

const aggregateTaskMetrics = (tasks: TaskItem[]): MetricAccumulator => {
  return tasks.reduce<MetricAccumulator>(
    (acc, task) => {
      const duration = typeof task.durationHrs === 'number' ? task.durationHrs : 0;
      acc.totalHours += duration;

      // 区分別に時間を集計
      if (task.taskType === 'create') {
        acc.createHours += duration;
      } else if (task.taskType === 'fix') {
        acc.fixHours += duration;
      } else if (task.taskType === 'correction') {
        acc.correctionHours += duration;
      }

      if (typeof task.qualityScore === 'number') {
        acc.qualitySum += task.qualityScore;
        acc.qualityCount += 1;
      }

      acc.taskCount += 1;
      return acc;
    },
    { totalHours: 0, createHours: 0, fixHours: 0, correctionHours: 0, qualitySum: 0, qualityCount: 0, taskCount: 0 }
  );
};

const toAnalyticsData = ({ totalHours, createHours, fixHours, correctionHours, qualitySum, qualityCount, taskCount }: MetricAccumulator) => ({
  totalHours: round1Decimal(totalHours),
  createHours: round1Decimal(createHours),
  fixHours: round1Decimal(fixHours),
  correctionHours: round1Decimal(correctionHours),
  averageQuality: qualityCount > 0 ? round1Decimal(qualitySum / qualityCount) : 0,
  taskCount,
});

const extractTasks = (reports: TaskReport[]): TaskItem[] => reports.flatMap((report) => report.tasks ?? []);

/**
 * スタッフ別の分析データを集計
 */
export const analyzeByStaff = (reports: TaskReport[]): StaffAnalytics[] => {
  const staffMap = new Map<string, TaskItem[]>();

  reports.forEach((report) => {
    const current = staffMap.get(report.userId) ?? [];
    staffMap.set(report.userId, current.concat(report.tasks ?? []));
  });

  return Array.from(staffMap.entries()).map(([staffId, tasks]) => ({
    staffId,
    staffName: `スタッフ ${staffId.substring(0, 8)}`, // TODO: 実際はスタッフ名を取得
    ...toAnalyticsData(aggregateTaskMetrics(tasks)),
  }));
};

/**
 * タスク別の分析データを集計
 */
export const analyzeByTask = (reports: TaskReport[]): TaskAnalytics[] => {
  const taskMap = new Map<string, TaskItem[]>();

  extractTasks(reports).forEach((task) => {
    const name = task.taskName || '不明なタスク';
    const current = taskMap.get(name) ?? [];
    taskMap.set(name, current.concat(task));
  });

  return Array.from(taskMap.entries()).map(([taskName, tasks]) => ({
    taskName,
    ...toAnalyticsData(aggregateTaskMetrics(tasks)),
  }));
};

/**
 * 全体のサマリーを計算
 */
export const calculateSummary = (reports: TaskReport[]) => {
  if (reports.length === 0) {
    return {
      totalHours: 0,
      createHours: 0,
      fixHours: 0,
      correctionHours: 0,
      averageQuality: 0,
      taskCount: 0,
    };
  }

  return toAnalyticsData(aggregateTaskMetrics(extractTasks(reports)));
};
