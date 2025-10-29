import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, ActivityIndicator } from 'react-native';
import {
  generateTaskAllocationRecommendations,
} from '../../services/instagramPerformance.service';
import {
  getAllStaffPerformances,
  calculateTeamSummaryFromPerformances
} from '../../services/staffDashboard.service';
import { ChartsSection } from './ChartsSection';
import { TrendsSection } from './TrendsSection';
import { StaffPerformance } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const { width, height } = Dimensions.get('window');

export default function EnhancedDashboard() {
  const { user } = useAuth();
  const [targetTasks, setTargetTasks] = useState(200);
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformance | null>(null);
  const [staffList, setStaffList] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // 実データを取得
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const performances = await getAllStaffPerformances();
        // 実データのみを使用（サンプルデータは使用しない）
        setStaffList(performances);
      } catch (error) {
        console.error('Error loading staff performances:', error);
        setStaffList([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const teamSummary = calculateTeamSummaryFromPerformances(staffList);
  const allocations = generateTaskAllocationRecommendations(staffList, targetTasks);

  // 理論上限合計
  const totalPotentialMax = staffList.reduce((sum, s) => sum + s.potentialMaxItems, 0);
  const totalActualHours = staffList.reduce((sum, s) => sum + (s.dailyWorkHours * 22), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Glass風ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Instagram運用チーム</Text>
        <Text style={styles.subtitle}>AIタスク配分ダッシュボード</Text>
      </View>

      {/* 1️⃣ チーム全体サマリー（KPIカード） */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>チーム全体サマリー</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, styles.glassEffect]}>
            <Text style={styles.kpiLabel}>合計稼働時間</Text>
            <Text style={styles.kpiValue}>{totalActualHours.toFixed(0)}h</Text>
            <Text style={styles.kpiSubtext}>/ 月</Text>
          </View>
          <View style={[styles.kpiCard, styles.glassEffect]}>
            <Text style={styles.kpiLabel}>平均クオリティ</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>
              {teamSummary.averageQuality.toFixed(1)}
            </Text>
            <Text style={styles.kpiSubtext}>/ 5.0</Text>
          </View>
          <View style={[styles.kpiCard, styles.glassEffect]}>
            <Text style={styles.kpiLabel}>総納品数</Text>
            <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>
              {teamSummary.totalMonthlyDeliveries}
            </Text>
            <Text style={styles.kpiSubtext}>件 / 月</Text>
          </View>
          <View style={[styles.kpiCard, styles.glassEffect]}>
            <Text style={styles.kpiLabel}>理論上限</Text>
            <Text style={[styles.kpiValue, { color: '#8b5cf6' }]}>
              {totalPotentialMax}
            </Text>
            <Text style={styles.kpiSubtext}>件 / 月</Text>
          </View>
        </View>
      </View>

      {/* 2️⃣ 個人パフォーマンス可視化ゾーン */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>個人パフォーマンス分析</Text>
        <ChartsSection staffList={staffList} />
      </View>

      {/* 3️⃣ 日次・月次トレンド分析ゾーン */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>トレンド分析</Text>
        <TrendsSection staffList={staffList} />
      </View>

      {/* 4️⃣ AIタスク配分シミュレーター */}
      <View style={[styles.section, styles.simulatorSection]}>
        <Text style={styles.sectionTitle}>🤖 AIタスク配分シミュレーター</Text>

        {/* スライダー */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>総案件数: {targetTasks}件</Text>
          <View style={styles.sliderButtons}>
            {[50, 100, 150, 200, 250, 300].map(value => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.sliderButton,
                  targetTasks === value && styles.sliderButtonActive
                ]}
                onPress={() => setTargetTasks(value)}
              >
                <Text style={[
                  styles.sliderButtonText,
                  targetTasks === value && styles.sliderButtonTextActive
                ]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* KPIカード：推奨結果サマリー */}
        <View style={styles.recommendationSummary}>
          <View style={styles.kpiCardSmall}>
            <Text style={styles.kpiLabelSmall}>推奨総タスク</Text>
            <Text style={styles.kpiValueSmall}>{targetTasks}件</Text>
          </View>
          <View style={styles.kpiCardSmall}>
            <Text style={styles.kpiLabelSmall}>余剰キャパ率</Text>
            <Text style={[styles.kpiValueSmall, { color: '#10b981' }]}>
              {((1 - teamSummary.currentUtilization) * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.kpiCardSmall}>
            <Text style={styles.kpiLabelSmall}>予測品質</Text>
            <Text style={[styles.kpiValueSmall, { color: '#f59e0b' }]}>
              {teamSummary.averageQuality.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* 推奨タスク配分テーブル */}
        <View style={styles.allocationTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>スタッフ</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>推奨件数</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>稼働率</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>品質補正</Text>
          </View>
          {allocations.map(allocation => {
            const staff = staffList.find(s => s.staffId === allocation.staffId)!;
            const newLoad = ((staff.dailyWorkHours * 22 + allocation.recommendedHours) / staff.monthlyHoursAvailable) * 100;
            const qualityFactor = (staff.avgQuality / 5) * 100;

            return (
              <TouchableOpacity
                key={allocation.staffId}
                style={styles.tableRow}
                onPress={() => setSelectedStaff(staff)}
              >
                <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>
                  {allocation.staffName}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, color: '#3b82f6', fontWeight: 'bold' }]}>
                  {allocation.recommendedTasks}件
                </Text>
                <Text style={[
                  styles.tableCell,
                  { flex: 1, color: newLoad >= 95 ? '#ef4444' : newLoad >= 70 ? '#22c55e' : '#38bdf8' }
                ]}>
                  {newLoad.toFixed(0)}%
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {qualityFactor.toFixed(0)}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* コメントセクション */}
        <View style={styles.commentsSection}>
          {allocations.map(allocation => (
            <View key={allocation.staffId} style={styles.commentCard}>
              <Text style={styles.commentName}>{allocation.staffName}</Text>
              <Text style={styles.commentText}>{allocation.reasoning}</Text>
              <View style={styles.confidenceBar}>
                <View style={[
                  styles.confidenceFill,
                  { width: `${allocation.confidence * 100}%` }
                ]} />
              </View>
              <Text style={styles.confidenceText}>
                信頼度: {(allocation.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 詳細モーダル */}
      <Modal
        visible={selectedStaff !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedStaff(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedStaff && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedStaff.staffName} 詳細</Text>
                  <TouchableOpacity onPress={() => setSelectedStaff(null)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* 基本情報 */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>基本パフォーマンス</Text>
                    <View style={styles.modalGrid}>
                      <View style={styles.modalItem}>
                        <Text style={styles.modalLabel}>平均稼働</Text>
                        <Text style={styles.modalValue}>{selectedStaff.dailyWorkHours}h/日</Text>
                      </View>
                      <View style={styles.modalItem}>
                        <Text style={styles.modalLabel}>月間納品</Text>
                        <Text style={styles.modalValue}>{selectedStaff.monthlyDeliveries}件</Text>
                      </View>
                      <View style={styles.modalItem}>
                        <Text style={styles.modalLabel}>平均制作時間</Text>
                        <Text style={styles.modalValue}>{selectedStaff.avgWorkTimePerItem}h</Text>
                      </View>
                      <View style={styles.modalItem}>
                        <Text style={styles.modalLabel}>品質スコア</Text>
                        <Text style={styles.modalValue}>{selectedStaff.avgQuality}/5</Text>
                      </View>
                      <View style={styles.modalItem}>
                        <Text style={styles.modalLabel}>効率</Text>
                        <Text style={styles.modalValue}>{(selectedStaff.efficiency * 100).toFixed(0)}%</Text>
                      </View>
                      <View style={styles.modalItem}>
                        <Text style={styles.modalLabel}>疲労指数</Text>
                        <Text style={styles.modalValue}>{(selectedStaff.fatigueIndex * 100).toFixed(0)}%</Text>
                      </View>
                    </View>
                  </View>

                  {/* パフォーマンス指標 */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>パフォーマンス指標</Text>
                    {[
                      { label: 'スピード', value: selectedStaff.speed, color: '#3b82f6' },
                      { label: '品質', value: selectedStaff.quality, color: '#10b981' },
                      { label: '安定度', value: selectedStaff.stability, color: '#f59e0b' },
                      { label: '効率', value: selectedStaff.efficiencyScore, color: '#8b5cf6' },
                    ].map(metric => (
                      <View key={metric.label} style={styles.metricRow}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <View style={styles.metricBarContainer}>
                          <View style={[
                            styles.metricBarFill,
                            { width: `${metric.value}%`, backgroundColor: metric.color }
                          ]} />
                        </View>
                        <Text style={styles.metricValue}>{metric.value.toFixed(0)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* 得意分野 */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>得意分野</Text>
                    <View style={styles.specialtiesGrid}>
                      {selectedStaff.specialties.map((specialty, index) => (
                        <View key={index} style={styles.specialtyBadge}>
                          <Text style={styles.specialtyText}>{specialty}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 稼働推移（簡易版） */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>直近31日の稼働推移</Text>
                    <View style={styles.miniChart}>
                      {selectedStaff.dailyHours.map((hours, index) => (
                        <View
                          key={index}
                          style={[
                            styles.miniBar,
                            {
                              height: `${(hours / 12) * 100}%`,
                              backgroundColor: hours > 8 ? '#ef4444' : hours > 6 ? '#3b82f6' : '#9ca3af'
                            }
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 32,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  glassEffect: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  kpiLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  kpiSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  simulatorSection: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 16,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sliderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sliderButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  sliderButtonActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  sliderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  sliderButtonTextActive: {
    color: '#6366f1',
  },
  recommendationSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  kpiCardSmall: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    alignItems: 'center',
  },
  kpiLabelSmall: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  kpiValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  allocationTable: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    fontSize: 13,
    color: '#4b5563',
  },
  commentsSection: {
    gap: 12,
  },
  commentCard: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  commentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  confidenceText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
    padding: 8,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalItem: {
    flex: 1,
    minWidth: (width - 80) / 2,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  modalLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  metricLabel: {
    width: 60,
    fontSize: 13,
    color: '#4b5563',
  },
  metricBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  metricValue: {
    width: 40,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 2,
  },
  miniBar: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 2,
  },
});
