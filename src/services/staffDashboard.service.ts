import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { TaskReport, StaffPerformance, TeamSummary, User } from '../types';

/**
 * 実際の日報データからスタッフパフォーマンスを計算
 */
export async function getStaffPerformanceFromReports(
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<StaffPerformance[]> {
  try {
    // クエリ作成
    let q = query(collection(db, 'taskReports'));

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(endDate)));
    }

    const snapshot = await getDocs(q);
    const reports: TaskReport[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt || Timestamp.now()
    })) as TaskReport[];

    // ユーザーIDごとにグループ化
    const staffMap = new Map<string, {
      userId: string;
      userName: string;
      reports: TaskReport[];
    }>();

    for (const report of reports) {
      if (!staffMap.has(report.userId)) {
        staffMap.set(report.userId, {
          userId: report.userId,
          userName: '', // 後で取得
          reports: []
        });
      }
      staffMap.get(report.userId)!.reports.push(report);
    }

    // 各スタッフのパフォーマンスを計算
    const performances: StaffPerformance[] = [];

    for (const [userId, data] of staffMap) {
      // ユーザー名を取得
      const userName = await getUserName(userId);
      const performance = calculateStaffPerformanceFromReports(userId, userName, data.reports);
      performances.push(performance);
    }

    return performances;
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    return [];
  }
}

/**
 * ユーザー名を取得
 */
async function getUserName(userId: string): Promise<string> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      return userData.name || userId;
    }
    return userId;
  } catch (error) {
    console.error('Error fetching user name:', error);
    return userId;
  }
}

/**
 * 日報データからスタッフパフォーマンスを計算
 */
function calculateStaffPerformanceFromReports(
  userId: string,
  userName: string,
  reports: TaskReport[]
): StaffPerformance {
  // 日別の稼働時間を計算（最新30日分）
  const dailyHoursMap = new Map<string, number>();
  const sortedReports = [...reports].sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const report of sortedReports) {
    const dateKey = report.date.toISOString().split('T')[0];
    const totalHours = report.tasks.reduce((sum, task) => sum + task.durationHrs, 0);

    if (!dailyHoursMap.has(dateKey)) {
      dailyHoursMap.set(dateKey, totalHours);
    }
  }

  // 最新31日分の配列を作成
  const dailyHours: number[] = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    dailyHours.push(dailyHoursMap.get(dateKey) || 0);
  }

  // 基本統計
  const totalTasks = reports.reduce((sum, r) => sum + r.tasks.length, 0);
  const totalHours = reports.reduce((sum, r) =>
    sum + r.tasks.reduce((s, t) => s + t.durationHrs, 0), 0
  );
  const avgDailyHours = totalHours / 31; // 月間を31日として計算

  // 完了したタスクのみカウント
  const completedTasks = reports.reduce((sum, r) =>
    sum + r.tasks.filter(t => t.isCompleted).length, 0
  );

  // 品質スコアの計算（評価済みタスクのみ）
  const tasksWithQuality = reports.flatMap(r => r.tasks)
    .filter(t => t.qualityScore && t.qualityScore !== '-');
  const avgQuality = tasksWithQuality.length > 0
    ? tasksWithQuality.reduce((sum, t) => sum + (t.qualityScore as number), 0) / tasksWithQuality.length
    : 3.0;

  // 平均制作時間
  const avgTimePerTask = totalTasks > 0 ? totalHours / totalTasks : 4.0;

  // 稼働日数
  const workDays = dailyHours.filter(h => h > 0).length;

  // 効率計算（完了率）
  const efficiency = totalTasks > 0 ? completedTasks / totalTasks : 0.8;

  // 疲労指数（高稼働日の割合）
  const highWorkloadDays = dailyHours.filter(h => h > 8).length;
  const fatigueIndex = workDays > 0 ? highWorkloadDays / workDays : 0.1;

  // 月間稼働可能時間（営業日22日 × 8時間）
  const monthlyHoursAvailable = 176;

  // 理論上限（効率と平均時間から計算）
  const potentialMaxItems = Math.floor((monthlyHoursAvailable * efficiency) / avgTimePerTask);

  // パフォーマンス指標
  const speed = Math.min(100, (10 / avgTimePerTask) * 20);
  const quality = (avgQuality / 5) * 100;
  const stability = calculateStability(dailyHours);
  const efficiencyScore = efficiency * 100;

  // 得意分野（タスクタイプと頻出タスク名から判定）
  const taskTypeCounts = new Map<string, number>();
  const taskNameCounts = new Map<string, number>();

  reports.forEach(r => {
    r.tasks.forEach(t => {
      // タスクタイプをカウント
      const typeLabel = t.taskType === 'create' ? '新規制作' : '修正作業';
      taskTypeCounts.set(typeLabel, (taskTypeCounts.get(typeLabel) || 0) + 1);

      // タスク名をカウント
      if (t.taskName) {
        taskNameCounts.set(t.taskName, (taskNameCounts.get(t.taskName) || 0) + 1);
      }
    });
  });

  // 得意分野を決定（頻出タスクタイプ + 頻出タスク名）
  const specialties: string[] = [];

  // タスクタイプを追加
  const topTaskType = Array.from(taskTypeCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];
  if (topTaskType) {
    specialties.push(topTaskType[0]);
  }

  // 頻出タスク名を追加
  const topTaskNames = Array.from(taskNameCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);
  specialties.push(...topTaskNames);

  // 最低3つになるよう調整
  if (specialties.length === 0) {
    specialties.push('制作業務', 'タスク実行', '業務全般');
  } else if (specialties.length < 3) {
    specialties.push('マルチタスク');
  }

  return {
    staffId: userId,
    staffName: userName,
    dailyHours,
    dailyWorkHours: avgDailyHours,
    monthlyHoursAvailable,
    monthlyDeliveries: completedTasks,
    avgWorkTimePerItem: avgTimePerTask,
    averageTimePerProject: avgTimePerTask,
    avgQuality,
    averageQualityScore: avgQuality,
    potentialMaxItems,
    skillCeiling: monthlyHoursAvailable,
    efficiency,
    fatigueIndex,
    specialties,
    speed,
    quality,
    stability,
    efficiencyScore
  };
}

/**
 * 安定度を計算（標準偏差ベース）
 */
function calculateStability(dailyHours: number[]): number {
  const workingDays = dailyHours.filter(h => h > 0);
  if (workingDays.length === 0) return 50;

  const mean = workingDays.reduce((a, b) => a + b, 0) / workingDays.length;
  const variance = workingDays.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / workingDays.length;
  const stdDev = Math.sqrt(variance);

  return Math.max(0, 100 - stdDev * 15);
}

/**
 * チーム全体のサマリーを計算
 */
export function calculateTeamSummaryFromPerformances(staffList: StaffPerformance[]): TeamSummary {
  const totalStaff = staffList.length;
  const totalMonthlyCapacity = staffList.reduce((sum, staff) => sum + staff.skillCeiling, 0);
  const currentWorkHours = staffList.reduce((sum, staff) => sum + (staff.dailyWorkHours * 22), 0);
  const currentUtilization = totalMonthlyCapacity > 0 ? currentWorkHours / totalMonthlyCapacity : 0;
  const averageQuality = totalStaff > 0
    ? staffList.reduce((sum, staff) => sum + staff.averageQualityScore, 0) / totalStaff
    : 0;
  const totalMonthlyDeliveries = staffList.reduce((sum, staff) => sum + staff.monthlyDeliveries, 0);

  return {
    totalStaff,
    totalMonthlyCapacity,
    currentUtilization,
    averageQuality,
    totalMonthlyDeliveries
  };
}

/**
 * ログイン中のユーザーのパフォーマンスを取得
 */
export async function getCurrentUserPerformance(userId: string): Promise<StaffPerformance | null> {
  const performances = await getStaffPerformanceFromReports(userId);
  return performances.length > 0 ? performances[0] : null;
}

/**
 * 全スタッフのパフォーマンスを取得（ディレクター用）
 */
export async function getAllStaffPerformances(): Promise<StaffPerformance[]> {
  return await getStaffPerformanceFromReports();
}
