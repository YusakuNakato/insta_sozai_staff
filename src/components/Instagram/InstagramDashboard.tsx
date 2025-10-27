import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import {
  sampleStaffPerformance,
  calculateTeamSummary,
  getStaffDetailAnalysis,
  simulateTaskAllocation
} from '../../services/instagramPerformance.service';
import { StaffPerformance } from '../../types';

const { width } = Dimensions.get('window');

export default function InstagramDashboard() {
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformance | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<'balanced' | 'quality-focused' | 'speed-focused'>('balanced');
  const [targetTasks, setTargetTasks] = useState(200);

  const teamSummary = calculateTeamSummary(sampleStaffPerformance);
  const simulation = simulateTaskAllocation(sampleStaffPerformance, targetTasks, selectedScenario);

  return (
    <ScrollView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Instagram運用チーム ダッシュボード</Text>
        <Text style={styles.subtitle}>AI駆動型タスク配分システム</Text>
      </View>

      {/* チームサマリーカード */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>チーム全体サマリー</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>総スタッフ数</Text>
            <Text style={styles.statValue}>{teamSummary.totalStaff}名</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>月間キャパシティ</Text>
            <Text style={styles.statValue}>{teamSummary.totalMonthlyCapacity}h</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>稼働率</Text>
            <Text style={[styles.statValue, { color: getUtilizationColor(teamSummary.currentUtilization) }]}>
              {(teamSummary.currentUtilization * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>平均クオリティ</Text>
            <Text style={styles.statValue}>{teamSummary.averageQuality.toFixed(1)}/5</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>月間納品数</Text>
            <Text style={styles.statValue}>{teamSummary.totalMonthlyDeliveries}件</Text>
          </View>
        </View>
      </View>

      {/* スタッフパフォーマンス一覧 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>スタッフパフォーマンス</Text>
        {sampleStaffPerformance.map(staff => {
          const currentLoad = (staff.dailyWorkHours * 22) / staff.skillCeiling;
          return (
            <TouchableOpacity
              key={staff.staffId}
              style={[
                styles.staffCard,
                selectedStaff?.staffId === staff.staffId && styles.staffCardSelected
              ]}
              onPress={() => setSelectedStaff(selectedStaff?.staffId === staff.staffId ? null : staff)}
            >
              <View style={styles.staffHeader}>
                <Text style={styles.staffName}>{staff.staffName}</Text>
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: getLoadColor(currentLoad) }]}>
                    <Text style={styles.badgeText}>稼働{(currentLoad * 100).toFixed(0)}%</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>⭐ {staff.averageQualityScore}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.staffMetrics}>
                <Text style={styles.metricText}>📅 {staff.dailyWorkHours}h/日</Text>
                <Text style={styles.metricText}>📦 {staff.monthlyDeliveries}件/月</Text>
                <Text style={styles.metricText}>⏱ {staff.averageTimePerProject}h/作品</Text>
                <Text style={styles.metricText}>🎯 効率 {(staff.efficiency * 100).toFixed(0)}%</Text>
              </View>

              <View style={styles.specialtiesContainer}>
                {staff.specialties.map((specialty, index) => (
                  <View key={index} style={styles.specialtyTag}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>

              {selectedStaff?.staffId === staff.staffId && (
                <View style={styles.staffDetail}>
                  {(() => {
                    const analysis = getStaffDetailAnalysis(staff);
                    return (
                      <>
                        <Text style={styles.detailTitle}>💪 強み</Text>
                        {analysis.strengths.map((s, i) => (
                          <Text key={i} style={styles.detailText}>• {s}</Text>
                        ))}
                        <Text style={styles.detailTitle}>📈 改善機会</Text>
                        {analysis.improvements.map((i, idx) => (
                          <Text key={idx} style={styles.detailText}>• {i}</Text>
                        ))}
                        <Text style={styles.detailTitle}>🎯 最適タスク数</Text>
                        <Text style={styles.detailText}>月間 {analysis.optimalTasksPerMonth}件</Text>
                      </>
                    );
                  })()}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* タスク配分シミュレーター */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 AIタスク配分シミュレーター</Text>

        <View style={styles.simulatorControls}>
          <Text style={styles.label}>配分戦略</Text>
          <View style={styles.scenarioButtons}>
            <TouchableOpacity
              style={[styles.scenarioButton, selectedScenario === 'balanced' && styles.scenarioButtonActive]}
              onPress={() => setSelectedScenario('balanced')}
            >
              <Text style={[styles.scenarioButtonText, selectedScenario === 'balanced' && styles.scenarioButtonTextActive]}>
                バランス型
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scenarioButton, selectedScenario === 'quality-focused' && styles.scenarioButtonActive]}
              onPress={() => setSelectedScenario('quality-focused')}
            >
              <Text style={[styles.scenarioButtonText, selectedScenario === 'quality-focused' && styles.scenarioButtonTextActive]}>
                品質重視
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scenarioButton, selectedScenario === 'speed-focused' && styles.scenarioButtonActive]}
              onPress={() => setSelectedScenario('speed-focused')}
            >
              <Text style={[styles.scenarioButtonText, selectedScenario === 'speed-focused' && styles.scenarioButtonTextActive]}>
                スピード重視
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>目標タスク数: {targetTasks}件/月</Text>
          <View style={styles.taskSliderContainer}>
            {[150, 200, 250, 300].map(value => (
              <TouchableOpacity
                key={value}
                style={[styles.taskButton, targetTasks === value && styles.taskButtonActive]}
                onPress={() => setTargetTasks(value)}
              >
                <Text style={[styles.taskButtonText, targetTasks === value && styles.taskButtonTextActive]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.simulationResults}>
          <Text style={styles.resultTitle}>予測結果</Text>
          <View style={styles.predictionsGrid}>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>チーム稼働率</Text>
              <Text style={[styles.predictionValue, { color: getUtilizationColor(simulation.teamUtilization) }]}>
                {(simulation.teamUtilization * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>予測品質</Text>
              <Text style={styles.predictionValue}>{simulation.estimatedQuality.toFixed(1)}/5</Text>
            </View>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>予測納品数</Text>
              <Text style={styles.predictionValue}>{simulation.estimatedDeliveries}件</Text>
            </View>
          </View>

          {simulation.recommendations.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>💡 推奨事項</Text>
              {simulation.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </>
          )}

          {simulation.risks.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>⚠️ リスク</Text>
              {simulation.risks.map((risk, index) => (
                <View key={index} style={styles.riskItem}>
                  <Text style={styles.riskText}>{risk}</Text>
                </View>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>タスク配分詳細</Text>
          {simulation.allocations.map(allocation => (
            <View key={allocation.staffId} style={styles.allocationCard}>
              <View style={styles.allocationHeader}>
                <Text style={styles.allocationName}>{allocation.staffName}</Text>
                <Text style={styles.allocationTasks}>{allocation.recommendedTasks}件</Text>
              </View>
              <Text style={styles.allocationHours}>
                推奨時間: {allocation.recommendedHours.toFixed(1)}h/月
              </Text>
              <Text style={styles.allocationLoad}>
                負荷率: {(allocation.currentLoad * 100).toFixed(0)}% → {((allocation.currentLoad + allocation.recommendedHours / 160) * 100).toFixed(0)}%
              </Text>
              <Text style={styles.allocationReasoning}>{allocation.reasoning}</Text>
              <View style={styles.confidenceMeter}>
                <View style={[styles.confidenceBar, { width: `${allocation.confidence * 100}%` }]} />
              </View>
              <Text style={styles.confidenceText}>信頼度: {(allocation.confidence * 100).toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function getUtilizationColor(utilization: number): string {
  if (utilization < 0.6) return '#10b981'; // Green
  if (utilization < 0.8) return '#3b82f6'; // Blue
  if (utilization < 0.9) return '#f59e0b'; // Orange
  return '#ef4444'; // Red
}

function getLoadColor(load: number): string {
  if (load < 0.6) return '#10b981';
  if (load < 0.8) return '#3b82f6';
  return '#f59e0b';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: width / 3 - 32,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  staffCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  staffCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  staffMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metricText: {
    fontSize: 13,
    color: '#4b5563',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 11,
    color: '#1e40af',
  },
  staffDetail: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  simulatorControls: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  scenarioButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  scenarioButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  scenarioButtonActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  scenarioButtonText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  scenarioButtonTextActive: {
    color: '#6366f1',
  },
  taskSliderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  taskButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  taskButtonActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  taskButtonText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  taskButtonTextActive: {
    color: '#6366f1',
  },
  simulationResults: {
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  predictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  predictionItem: {
    flex: 1,
    minWidth: width / 3 - 32,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  predictionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  recommendationItem: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  recommendationText: {
    fontSize: 13,
    color: '#065f46',
  },
  riskItem: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  riskText: {
    fontSize: 13,
    color: '#991b1b',
  },
  allocationCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allocationName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  allocationTasks: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  allocationHours: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  allocationLoad: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
  },
  allocationReasoning: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  confidenceMeter: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  confidenceText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },
});
