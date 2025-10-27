import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { StaffPerformance } from '../../types';

const { width } = Dimensions.get('window');

interface ChartsSectionProps {
  staffList: StaffPerformance[];
}

export function ChartsSection({ staffList }: ChartsSectionProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartsContainer}>
      {/* レーダーチャート風表示 */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>パフォーマンスレーダー</Text>
        {staffList.map(staff => (
          <View key={staff.staffId} style={styles.radarItem}>
            <View style={styles.staffHeader}>
              <Text style={styles.staffLabel}>{staff.staffName}</Text>
              <Text style={styles.deliveryCount}>月間納品数: {staff.monthlyDeliveries}件</Text>
            </View>
            <View style={styles.radarMetrics}>
              <View style={styles.metricBar}>
                <Text style={styles.metricLabel}>スピード</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: `${staff.speed}%`, backgroundColor: '#3b82f6' }]} />
                </View>
                <Text style={styles.metricValue}>{staff.speed.toFixed(0)}</Text>
              </View>
              <View style={styles.metricBar}>
                <Text style={styles.metricLabel}>品質</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: `${staff.quality}%`, backgroundColor: '#10b981' }]} />
                </View>
                <Text style={styles.metricValue}>{staff.quality.toFixed(0)}</Text>
              </View>
              <View style={styles.metricBar}>
                <Text style={styles.metricLabel}>安定度</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: `${staff.stability}%`, backgroundColor: '#f59e0b' }]} />
                </View>
                <Text style={styles.metricValue}>{staff.stability.toFixed(0)}</Text>
              </View>
              <View style={styles.metricBar}>
                <Text style={styles.metricLabel}>効率</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: `${staff.efficiencyScore}%`, backgroundColor: '#8b5cf6' }]} />
                </View>
                <Text style={styles.metricValue}>{staff.efficiencyScore.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 実績 vs 潜在上限 棒グラフ */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>実績 vs 理論上限</Text>
        <View style={styles.barChartContainer}>
          {staffList.map(staff => (
            <View key={staff.staffId} style={styles.barChartItem}>
              <Text style={styles.barChartLabel}>{staff.staffName}</Text>
              <View style={styles.comparisonBars}>
                <View style={styles.barGroup}>
                  <Text style={styles.barGroupLabel}>実績</Text>
                  <View style={[styles.comparisonBar, {
                    height: (staff.monthlyDeliveries / Math.max(...staffList.map(s => s.potentialMaxItems))) * 100,
                    backgroundColor: '#3b82f6'
                  }]} />
                  <Text style={styles.barValue}>{staff.monthlyDeliveries}</Text>
                </View>
                <View style={styles.barGroup}>
                  <Text style={styles.barGroupLabel}>上限</Text>
                  <View style={[styles.comparisonBar, {
                    height: (staff.potentialMaxItems / Math.max(...staffList.map(s => s.potentialMaxItems))) * 100,
                    backgroundColor: '#10b981'
                  }]} />
                  <Text style={styles.barValue}>{staff.potentialMaxItems}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 散布図風表示 */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>制作時間 vs 品質</Text>
        <View style={styles.scatterContainer}>
          <View style={styles.scatterChart}>
            <View style={styles.yAxis}>
              <Text style={styles.axisLabel}>5.0</Text>
              <Text style={styles.axisLabel}>4.0</Text>
              <Text style={styles.axisLabel}>3.0</Text>
              <Text style={styles.axisLabel}>2.0</Text>
              <Text style={styles.axisLabel}>1.0</Text>
            </View>
            <View style={styles.plotArea}>
              {staffList.map(staff => {
                const x = ((staff.avgWorkTimePerItem - 3) / 2) * 100; // 3-5時間を0-100%に正規化
                const y = 100 - ((staff.avgQuality - 1) / 4) * 100; // 1-5を100-0%に変換
                const size = (staff.monthlyDeliveries / 50) * 30 + 20; // 20-50px

                return (
                  <View
                    key={staff.staffId}
                    style={[
                      styles.scatterPoint,
                      {
                        left: `${Math.max(0, Math.min(90, x))}%`,
                        top: `${Math.max(0, Math.min(90, y))}%`,
                        width: size,
                        height: size,
                      }
                    ]}
                  >
                    <Text style={styles.pointLabel}>{staff.staffName.substring(0, 2)}</Text>
                  </View>
                );
              })}
              <View style={styles.xAxis}>
                <Text style={styles.axisLabel}>3h</Text>
                <Text style={styles.axisLabel}>4h</Text>
                <Text style={styles.axisLabel}>5h</Text>
              </View>
            </View>
          </View>
          <Text style={styles.axisTitle}>平均制作時間</Text>
          <Text style={[styles.axisTitle, styles.yAxisTitle]}>品質スコア</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chartsContainer: {
    marginVertical: 16,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    marginRight: 16,
    padding: 20,
    borderRadius: 16,
    width: width - 64,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  radarItem: {
    marginBottom: 20,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  staffLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  deliveryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  radarMetrics: {
    gap: 8,
  },
  metricBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    width: 60,
  },
  barContainer: {
    flex: 1,
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 12,
    color: '#374151',
    width: 30,
    textAlign: 'right',
  },
  barChartContainer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  barChartItem: {
    alignItems: 'center',
  },
  barChartLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    maxWidth: 60,
    textAlign: 'center',
  },
  comparisonBars: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    height: 120,
  },
  barGroup: {
    alignItems: 'center',
    gap: 4,
  },
  barGroupLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  comparisonBar: {
    width: 24,
    borderRadius: 4,
    minHeight: 10,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  scatterContainer: {
    position: 'relative',
  },
  scatterChart: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 8,
    width: 40,
  },
  plotArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  scatterPoint: {
    position: 'absolute',
    backgroundColor: '#3b82f6',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  pointLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  axisLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  axisTitle: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 8,
  },
  yAxisTitle: {
    position: 'absolute',
    left: -80,
    top: 100,
    transform: [{ rotate: '-90deg' }],
  },
});
