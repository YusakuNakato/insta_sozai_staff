import { StaffPerformance, TaskAllocationRecommendation, TeamSummary, SimulationResult } from '../types';

// 日次稼働時間生成ヘルパー
function generateDailyHours(avgHours: number, variance: number = 1.5): number[] {
  return Array.from({ length: 30 }, () => {
    const random = Math.random() * variance * 2 - variance;
    return Math.max(0, Math.min(12, avgHours + random));
  });
}

// パフォーマンス指標計算
function calculatePerformanceMetrics(
  avgWorkTime: number,
  quality: number,
  efficiency: number,
  dailyHours: number[]
): {
  speed: number;
  quality: number;
  stability: number;
  efficiencyScore: number;
} {
  // スピード：制作時間が短いほど高い（逆数）
  const speed = Math.min(100, (10 / avgWorkTime) * 20);

  // 品質：そのまま100点満点に変換
  const qualityScore = (quality / 5) * 100;

  // 安定度：日次稼働時間の標準偏差が小さいほど高い
  const mean = dailyHours.reduce((a, b) => a + b, 0) / dailyHours.length;
  const variance = dailyHours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / dailyHours.length;
  const stdDev = Math.sqrt(variance);
  const stability = Math.max(0, 100 - stdDev * 15);

  // 効率：そのまま100点満点に変換
  const efficiencyScore = efficiency * 100;

  return { speed, quality: qualityScore, stability, efficiencyScore };
}

// 固定された日次稼働時間データ（安定性のため）31日分
const dailyHoursData = {
  '1': [6.2, 6.8, 6.5, 6.3, 7.0, 6.1, 6.9, 6.4, 6.7, 6.5, 6.3, 6.8, 6.6, 6.2, 7.1, 6.4, 6.5, 6.9, 6.3, 6.7, 6.5, 6.4, 6.8, 6.2, 6.6, 7.0, 6.3, 6.5, 6.7, 6.4, 6.6],
  '2': [7.1, 6.9, 7.2, 7.0, 6.8, 7.3, 6.9, 7.1, 7.0, 6.9, 7.2, 7.0, 6.8, 7.1, 7.3, 6.9, 7.0, 7.1, 6.8, 7.2, 7.0, 6.9, 7.1, 7.3, 6.8, 7.0, 7.2, 6.9, 7.1, 7.0, 6.9],
  '3': [5.8, 4.9, 5.3, 6.2, 5.1, 5.9, 4.8, 5.5, 6.0, 5.3, 5.7, 4.9, 6.1, 5.4, 5.2, 5.8, 5.0, 5.6, 5.3, 5.9, 5.1, 5.5, 6.2, 5.0, 5.4, 5.8, 5.2, 5.6, 5.3, 5.7, 5.4],
  '4': [6.2, 5.8, 6.1, 6.3, 5.9, 6.0, 6.2, 5.7, 6.4, 6.0, 5.9, 6.3, 6.1, 5.8, 6.2, 6.0, 6.1, 6.3, 5.9, 6.2, 6.0, 5.8, 6.4, 6.1, 5.9, 6.2, 6.0, 6.3, 5.8, 6.1, 6.0],
  '5': [6.9, 6.7, 7.0, 6.8, 6.6, 7.1, 6.7, 6.9, 7.0, 6.8, 6.7, 6.9, 7.1, 6.6, 7.0, 6.8, 6.9, 6.7, 7.0, 6.8, 6.7, 6.9, 7.1, 6.6, 6.8, 7.0, 6.7, 6.9, 6.8, 7.0, 6.8]
};

// サンプルスタッフデータ（拡張版）
// ※ スタッフ = ログインするユーザー（日報を書く人）
export const sampleStaffPerformance: StaffPerformance[] = [
  {
    staffId: '1',
    staffName: '田中 太郎',
    dailyHours: dailyHoursData['1'],
    dailyWorkHours: 6.5,
    monthlyHoursAvailable: 160,
    monthlyDeliveries: 45,
    avgWorkTimePerItem: 3.5,
    averageTimePerProject: 3.5,
    avgQuality: 4.2,
    averageQualityScore: 4.2,
    potentialMaxItems: Math.floor((160 * 0.85) / 3.5),
    skillCeiling: 160,
    efficiency: 0.85,
    fatigueIndex: 0.15,
    specialties: ['新規制作', '動画編集', '画像加工'],
    ...calculatePerformanceMetrics(3.5, 4.2, 0.85, dailyHoursData['1'])
  },
  {
    staffId: '2',
    staffName: '佐藤 花子',
    dailyHours: dailyHoursData['2'],
    dailyWorkHours: 7.0,
    monthlyHoursAvailable: 170,
    monthlyDeliveries: 38,
    avgWorkTimePerItem: 4.2,
    averageTimePerProject: 4.2,
    avgQuality: 4.5,
    averageQualityScore: 4.5,
    potentialMaxItems: Math.floor((170 * 0.88) / 4.2),
    skillCeiling: 170,
    efficiency: 0.88,
    fatigueIndex: 0.12,
    specialties: ['新規制作', 'リール制作', 'エフェクト'],
    ...calculatePerformanceMetrics(4.2, 4.5, 0.88, dailyHoursData['2'])
  },
  {
    staffId: '3',
    staffName: '鈴木 一郎',
    dailyHours: dailyHoursData['3'],
    dailyWorkHours: 5.5,
    monthlyHoursAvailable: 140,
    monthlyDeliveries: 32,
    avgWorkTimePerItem: 3.8,
    averageTimePerProject: 3.8,
    avgQuality: 3.9,
    averageQualityScore: 3.9,
    potentialMaxItems: Math.floor((140 * 0.78) / 3.8),
    skillCeiling: 140,
    efficiency: 0.78,
    fatigueIndex: 0.22,
    specialties: ['修正作業', '投稿文作成', 'リサーチ'],
    ...calculatePerformanceMetrics(3.8, 3.9, 0.78, dailyHoursData['3'])
  },
  {
    staffId: '4',
    staffName: '高橋 美咲',
    dailyHours: dailyHoursData['4'],
    dailyWorkHours: 6.0,
    monthlyHoursAvailable: 150,
    monthlyDeliveries: 40,
    avgWorkTimePerItem: 3.2,
    averageTimePerProject: 3.2,
    avgQuality: 4.0,
    averageQualityScore: 4.0,
    potentialMaxItems: Math.floor((150 * 0.82) / 3.2),
    skillCeiling: 150,
    efficiency: 0.82,
    fatigueIndex: 0.18,
    specialties: ['新規制作', '画像編集', 'デザイン'],
    ...calculatePerformanceMetrics(3.2, 4.0, 0.82, dailyHoursData['4'])
  },
  {
    staffId: '5',
    staffName: '山田 健太',
    dailyHours: dailyHoursData['5'],
    dailyWorkHours: 6.8,
    monthlyHoursAvailable: 165,
    monthlyDeliveries: 42,
    avgWorkTimePerItem: 3.6,
    averageTimePerProject: 3.6,
    avgQuality: 4.3,
    averageQualityScore: 4.3,
    potentialMaxItems: Math.floor((165 * 0.86) / 3.6),
    skillCeiling: 165,
    efficiency: 0.86,
    fatigueIndex: 0.14,
    specialties: ['新規制作', 'ストーリー編集', 'トレンド分析'],
    ...calculatePerformanceMetrics(3.6, 4.3, 0.86, dailyHoursData['5'])
  }
];

/**
 * チーム全体のサマリーを計算
 */
export function calculateTeamSummary(staffList: StaffPerformance[]): TeamSummary {
  const totalStaff = staffList.length;
  const totalMonthlyCapacity = staffList.reduce((sum, staff) => sum + staff.skillCeiling, 0);
  const currentWorkHours = staffList.reduce((sum, staff) => sum + (staff.dailyWorkHours * 22), 0); // 月22営業日と仮定
  const currentUtilization = currentWorkHours / totalMonthlyCapacity;
  const averageQuality = staffList.reduce((sum, staff) => sum + staff.averageQualityScore, 0) / totalStaff;
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
 * 各スタッフの現在の負荷を計算
 */
export function calculateCurrentLoad(staff: StaffPerformance): number {
  const monthlyWorkHours = staff.dailyWorkHours * 22; // 月22営業日
  return monthlyWorkHours / staff.skillCeiling;
}

/**
 * AIベースのタスク配分推奨を生成（疲労補正版）
 */
export function generateTaskAllocationRecommendations(
  staffList: StaffPerformance[],
  targetMonthlyTasks: number
): TaskAllocationRecommendation[] {
  const teamSummary = calculateTeamSummary(staffList);

  // 各スタッフのスコア計算（アルゴリズム通り）
  const scoredStaff = staffList.map(staff => {
    // 1. 理論上限生産数
    const potential = (staff.monthlyHoursAvailable / staff.avgWorkTimePerItem) * staff.efficiency;

    // 2. クオリティ補正
    const qualityFactor = staff.avgQuality / 5;

    // 3. 疲労補正
    const fatigueFactor = 1 - staff.fatigueIndex;

    // 4. 各スタッフのスコア
    const score = potential * qualityFactor * fatigueFactor;

    return {
      staff,
      score,
      potential,
      qualityFactor,
      fatigueFactor
    };
  });

  // 5. 全スタッフ合計スコアで正規化し、総タスク数を配分
  const totalScore = scoredStaff.reduce((sum, item) => sum + item.score, 0);

  return scoredStaff.map(({ staff, score, potential, qualityFactor, fatigueFactor }) => {
    const currentLoad = calculateCurrentLoad(staff);
    const capacityRemaining = staff.monthlyHoursAvailable - (staff.dailyWorkHours * 22);

    // タスク配分
    const recommendedTasks = Math.round((score / totalScore) * targetMonthlyTasks);
    const recommendedHours = recommendedTasks * staff.avgWorkTimePerItem;

    // 推奨後の稼働率
    const newLoad = (staff.dailyWorkHours * 22 + recommendedHours) / staff.monthlyHoursAvailable;

    // 信頼度計算
    const optimalLoad = 0.75;
    const loadDiff = Math.abs(newLoad - optimalLoad);
    const confidence = Math.max(0, 1 - (loadDiff * 2));

    // 6. コメント生成
    let reasoning = '';
    if (newLoad >= 0.95) {
      reasoning = `稼働率が${(newLoad * 100).toFixed(0)}%と非常に高いため、調整推奨。疲労指数${(staff.fatigueIndex * 100).toFixed(0)}%`;
    } else if (newLoad < 0.70) {
      reasoning = `稼働率${(newLoad * 100).toFixed(0)}%で余力あり、追加タスク配分可能。品質係数${(qualityFactor * 100).toFixed(0)}%`;
    } else {
      reasoning = `稼働率${(newLoad * 100).toFixed(0)}%でバランス良好。効率${(staff.efficiency * 100).toFixed(0)}%、得意: ${staff.specialties[0]}`;
    }

    return {
      staffId: staff.staffId,
      staffName: staff.staffName,
      currentLoad,
      recommendedTasks,
      recommendedHours,
      capacityRemaining,
      confidence,
      reasoning
    };
  });
}

/**
 * タスク配分シミュレーションを実行
 */
export function simulateTaskAllocation(
  staffList: StaffPerformance[],
  targetMonthlyTasks: number,
  scenario: 'balanced' | 'quality-focused' | 'speed-focused'
): SimulationResult {
  let allocations: TaskAllocationRecommendation[];
  let risks: string[] = [];
  let recommendations: string[] = [];

  switch (scenario) {
    case 'balanced':
      allocations = generateTaskAllocationRecommendations(staffList, targetMonthlyTasks);
      recommendations.push('各スタッフの強みと効率を考慮したバランス配分です');
      recommendations.push('品質とスピードのバランスが取れています');
      break;

    case 'quality-focused':
      // 高品質スタッフに重点配分
      const qualityWeighted = staffList.map(staff => ({
        ...staff,
        efficiency: staff.efficiency * (staff.averageQualityScore / 5)
      }));
      allocations = generateTaskAllocationRecommendations(qualityWeighted, targetMonthlyTasks);
      recommendations.push('高品質スタッフ（たくむAIお兄さん、みゆ）を優先配分');
      recommendations.push('全体的なクオリティ向上が期待できます');
      risks.push('一部スタッフの負荷が高くなる可能性があります');
      break;

    case 'speed-focused':
      // 効率重視の配分
      const efficiencyWeighted = staffList.map(staff => ({
        ...staff,
        skillCeiling: staff.skillCeiling * staff.efficiency
      }));
      allocations = generateTaskAllocationRecommendations(efficiencyWeighted, targetMonthlyTasks);
      recommendations.push('効率の高いスタッフ（たくむAIお兄さん、みゆ、さきAI）に集中配分');
      recommendations.push('納期短縮が期待できます');
      risks.push('品質のばらつきが出る可能性があります');
      risks.push('特定スタッフの負担増加に注意');
      break;
  }

  // チーム全体の予測値を計算
  const teamUtilization = allocations.reduce((sum, a) => {
    const staff = staffList.find(s => s.staffId === a.staffId)!;
    return sum + ((a.recommendedHours + staff.dailyWorkHours * 22) / staff.skillCeiling);
  }, 0) / staffList.length;

  const estimatedQuality = allocations.reduce((sum, a) => {
    const staff = staffList.find(s => s.staffId === a.staffId)!;
    const loadImpact = a.currentLoad > 0.9 ? 0.9 : 1; // 高負荷時は品質低下
    return sum + (staff.averageQualityScore * loadImpact * (a.recommendedTasks / targetMonthlyTasks));
  }, 0);

  const estimatedDeliveries = allocations.reduce((sum, a) => sum + a.recommendedTasks, 0);

  // リスク評価
  const overloadedStaff = allocations.filter(a => a.currentLoad > 0.85);
  if (overloadedStaff.length > 0) {
    risks.push(`${overloadedStaff.map(a => a.staffName).join('、')}の負荷が高めです`);
  }

  const underutilizedStaff = allocations.filter(a => a.currentLoad < 0.5);
  if (underutilizedStaff.length > 0) {
    recommendations.push(`${underutilizedStaff.map(a => a.staffName).join('、')}にさらにタスク配分可能です`);
  }

  return {
    scenario,
    allocations,
    teamUtilization,
    estimatedQuality,
    estimatedDeliveries,
    risks,
    recommendations
  };
}

/**
 * スタッフ個人の詳細分析を取得
 */
export function getStaffDetailAnalysis(staff: StaffPerformance): {
  strengths: string[];
  improvements: string[];
  optimalTasksPerMonth: number;
} {
  const strengths: string[] = [];
  const improvements: string[] = [];

  // 強みの分析
  if (staff.averageQualityScore >= 4.3) {
    strengths.push('高品質な成果物を一貫して提供');
  }
  if (staff.efficiency >= 0.85) {
    strengths.push('非常に高い生産効率');
  }
  if (staff.monthlyDeliveries >= 40) {
    strengths.push('高い納品数を達成');
  }
  if (staff.specialties.length >= 3) {
    strengths.push(`多様なスキル: ${staff.specialties.join('、')}`);
  }

  // 改善点の分析
  const currentLoad = calculateCurrentLoad(staff);
  if (currentLoad < 0.6) {
    improvements.push('さらなるタスク受入れ余地あり');
  }
  if (staff.averageQualityScore < 4.0) {
    improvements.push('品質向上のトレーニング機会を検討');
  }
  if (staff.efficiency < 0.8) {
    improvements.push('作業効率化のサポートを検討');
  }
  if (staff.averageTimePerProject > 4.0) {
    improvements.push('プロセス最適化で制作時間短縮の可能性');
  }

  // 最適タスク数の計算
  const optimalLoad = 0.75;
  const optimalHours = staff.skillCeiling * optimalLoad;
  const optimalTasksPerMonth = Math.round(optimalHours / staff.averageTimePerProject);

  return {
    strengths,
    improvements,
    optimalTasksPerMonth
  };
}
