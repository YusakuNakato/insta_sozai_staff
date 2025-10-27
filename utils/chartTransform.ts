type DailyWorkTimeMap = Record<string, Record<string, number>>;
type DeliveriesMap = Record<string, number>;
type AvgTaskTimeMap = Record<string, number>;

export type TotalTimePerTask = {
  taskName: string;
  totalHours: number;
};

export type CompletionStats = {
  staffName: string;
  completed: number;
  totalTasks: number;
  fixHours: number;
  totalHours: number;
};

export interface ChartReadyData {
  dailyLine: Array<{ x: string; y: number; staff: string }>;
  deliveryBars: Array<{ label: string; value: number }>;
  avgTaskDonut: Array<{ label: string; value: number }>;
  taskTimeline: Array<{ task: string; totalHours: number }>;
  completionDonut: Array<{ label: string; value: number }>;
  fixRateDonut: Array<{ label: string; value: number }>;
}

export function transformKpiForCharts(params: {
  dailyWorkTimePerStaff: DailyWorkTimeMap;
  totalDeliveredPerStaff: DeliveriesMap;
  avgTaskTimePerStaff: AvgTaskTimeMap;
  totalTimePerTask: TotalTimePerTask[];
  completionStats: CompletionStats[];
}): ChartReadyData {
  const {
    dailyWorkTimePerStaff,
    totalDeliveredPerStaff,
    avgTaskTimePerStaff,
    totalTimePerTask,
    completionStats,
  } = params;

  const dailyLine = Object.entries(dailyWorkTimePerStaff).flatMap(
    ([staff, days]) =>
      Object.entries(days).map(([date, hours]) => ({
        x: date,
        y: hours,
        staff,
      }))
  );

  const deliveryBars = Object.entries(totalDeliveredPerStaff).map(
    ([label, value]) => ({
      label,
      value,
    })
  );

  const avgTaskDonut = Object.entries(avgTaskTimePerStaff).map(
    ([label, value]) => ({
      label,
      value,
    })
  );

  const taskTimeline = totalTimePerTask.map(({ taskName, totalHours }) => ({
    task: taskName,
    totalHours,
  }));

  const completionDonut = completionStats.map(({ staffName, completed, totalTasks }) => ({
    label: staffName,
    value: totalTasks > 0 ? Number(((completed / totalTasks) * 100).toFixed(1)) : 0,
  }));

  const fixRateDonut = completionStats.map(({ staffName, fixHours, totalHours }) => ({
    label: staffName,
    value: totalHours > 0 ? Number(((fixHours / totalHours) * 100).toFixed(1)) : 0,
  }));

  return {
    dailyLine,
    deliveryBars,
    avgTaskDonut,
    taskTimeline,
    completionDonut,
    fixRateDonut,
  };
}
