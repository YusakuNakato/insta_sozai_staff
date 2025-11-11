import { Timestamp } from 'firebase/firestore';

export type UserRole = 'staff' | 'director' | 'admin';

export interface User {
  id: string;
  name: string;                     // 表示名（スタッフ名）
  role: UserRole;
  email: string;
  passwordHash: string;
  createdAt: Timestamp;
  // 追加情報
  actualJobTitle?: string;          // 本職の表示名
  dailyAvailableHours?: number;     // 1日の稼働可能時間数
  workingHoursStart?: string;       // 稼働時間帯（開始）例: "09:00"
  workingHoursEnd?: string;         // 稼働時間帯（終了）例: "18:00"
}

export type TaskType = 'create' | 'fix' | 'correction';

export type AccountName = 'さきAI' | 'たくむAIお兄さん' | 'れもん' | 'みさを' | 'みゆ' | 'さき' | 'ビジ系たくむ' | 'ぽよさや';

export type QualityScore = '-' | 1 | 2 | 3 | 4 | 5;

export interface TaskItem {
  accountName: AccountName;
  scheduledDate: Date;
  taskName: string;
  taskType: TaskType;
  durationHrs: number;
  isCompleted: boolean;
  taskMasterId?: string;  // タスクマスターへの参照
  qualityScore?: QualityScore;  // クオリティ評価（-/1〜5、5が最良、デフォルト-）
  revisionWorkload?: string;  // 修正工数（フリーワード）
  specialNotes?: string;  // 特記事項（フリーワード）
}

export interface TaskReport {
  id: string;
  userId: string;
  date: Date;
  tasks: TaskItem[];
  learnings: string;
  ownResearchHours: number;
  ownResearchLearnings: string;
  competitorResearchHours: number;
  competitorResearchLearnings: string;
  createdAt: Timestamp;
}

export interface TaskReportInput {
  tasks: TaskItem[];
  learnings: string;
  ownResearchHours: number;
  ownResearchLearnings: string;
  competitorResearchHours: number;
  competitorResearchLearnings: string;
}

export interface AnalyticsData {
  totalHours: number;
  createHours: number;
  fixHours: number;
  correctionHours: number;
  averageQuality: number;
  taskCount: number;
}

export interface StaffAnalytics extends AnalyticsData {
  staffId: string;
  staffName: string;
}

export interface TaskAnalytics extends AnalyticsData {
  taskName: string;
}

export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  staffId?: string;
  taskName?: string;
}

// タスクマスター（日をまたぐタスクを一元管理）
export interface TaskMaster {
  id: string;
  accountName: AccountName;
  scheduledDate: Date;
  taskName: string;
  status: 'active' | 'completed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  // 集計情報
  totalHours?: number;
  workDays?: number;
  lastWorkedDate?: Date;
}

// タスク別集計データ
export interface TaskSummary {
  taskMaster: TaskMaster;
  totalHours: number;
  workDays: number;
  createHours: number;
  fixHours: number;
  reports: TaskReport[];
}

// Instagram運用チーム向けの型定義

// スタッフパフォーマンスメトリクス（拡張版）
export interface StaffPerformance {
  staffId: string;
  staffName: string;
  dailyHours: number[];             // 各日の稼働時間配列（31日分）
  dailyWorkHours: number;           // 1日あたりの平均稼働時間
  monthlyHoursAvailable: number;    // 月間稼働可能時間
  monthlyDeliveries: number;        // 現実の納品数
  avgWorkTimePerItem: number;       // 平均制作時間（時間）
  averageTimePerProject: number;    // 1作品あたりの平均制作時間（時間）※互換性のため
  avgQuality: number;               // 平均クオリティ（1-5）
  averageQualityScore: number;      // 平均クオリティスコア（1-5）※互換性のため
  potentialMaxItems: number;        // 天井スキルでの理論上限
  skillCeiling: number;             // スキル天井（最大生産キャパシティ、時間/月）※互換性のため
  efficiency: number;               // 稼働効率係数（0-1）
  fatigueIndex: number;             // 稼働過多ペナルティ（0-1、0=疲労なし）
  specialties: string[];            // 得意分野
  // パフォーマンス指標
  speed: number;                    // スピード指標（0-100）
  quality: number;                  // 品質指標（0-100）
  stability: number;                // 安定度指標（0-100）
  efficiencyScore: number;          // 効率指標（0-100）
}

// タスク配分推奨結果
export interface TaskAllocationRecommendation {
  staffId: string;
  staffName: string;
  currentLoad: number;              // 現在の負荷率（0-1）
  recommendedTasks: number;         // 推奨タスク数
  recommendedHours: number;         // 推奨稼働時間
  capacityRemaining: number;        // 残余キャパシティ（時間）
  confidence: number;               // 推奨の信頼度（0-1）
  reasoning: string;                // 推奨理由
}

// チーム全体のサマリー
export interface TeamSummary {
  totalStaff: number;
  totalMonthlyCapacity: number;     // チーム全体の月間キャパシティ
  currentUtilization: number;       // 現在の稼働率（0-1）
  averageQuality: number;           // チーム平均クオリティ
  totalMonthlyDeliveries: number;   // 月間総納品数
}

// シミュレーション結果
export interface SimulationResult {
  scenario: string;
  allocations: TaskAllocationRecommendation[];
  teamUtilization: number;
  estimatedQuality: number;
  estimatedDeliveries: number;
  risks: string[];
  recommendations: string[];
}
