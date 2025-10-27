import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { StaffPerformance } from '../../types';

const { width } = Dimensions.get('window');

interface TrendsSectionProps {
  staffList: StaffPerformance[];
}

export function TrendsSection({ staffList }: TrendsSectionProps) {
  // 日付ラベル生成（31日分）
  const dateLabels = Array.from({ length: 31 }, (_, i) => i + 1);

  // ヒートマップのセルサイズを画面幅に基づいて計算
  // スタッフラベル幅(100) + 余白を引いた残りを31日で割る
  const heatmapCellSize = Math.max(36, Math.min(50, (width - 120) / 31));

  // チーム全体の日別合計稼働時間（31日分、データがない日は0）
  const teamDailyHours = dateLabels.map(day => {
    return staffList.reduce((sum, staff) => {
      const hours = staff.dailyHours[day - 1];
      return sum + (hours !== undefined ? hours : 0);
    }, 0);
  });

  const maxTeamHours = Math.max(...teamDailyHours, 1); // 最低値1を設定

  return (
    <View style={styles.container}>
      {/* 折れ線グラフ（棒グラフとして実装） */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 日別稼働時間推移（チーム全体）</Text>
        <View style={styles.lineChart}>
          <View style={styles.yAxisLabels}>
            <Text style={styles.yAxisLabel}>{maxTeamHours.toFixed(0)}h</Text>
            <Text style={styles.yAxisLabel}>{(maxTeamHours / 2).toFixed(0)}h</Text>
            <Text style={styles.yAxisLabel}>0h</Text>
          </View>
          <View style={styles.chartAreaContainer}>
            <View style={styles.chartArea}>
              {teamDailyHours.map((hours, index) => (
                <View key={index} style={styles.lineChartBar}>
                  <View
                    style={[
                      styles.lineBar,
                      {
                        height: `${(hours / maxTeamHours) * 100}%`,
                        backgroundColor: hours > maxTeamHours * 0.8 ? '#ef4444' : '#3b82f6'
                      }
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.xAxisLabels}>
              {dateLabels.map((day) => (
                <Text key={day} style={styles.dateLabel}>{day}</Text>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* ヒートマップ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔥 稼働ヒートマップ（スタッフ別）</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.heatmap}>
            {/* ヘッダー（日付） */}
            <View style={styles.heatmapRow}>
              <View style={styles.heatmapStaffLabel}>
                <Text style={styles.heatmapHeaderText}>スタッフ</Text>
              </View>
              {dateLabels.map((day) => (
                <View key={day} style={[styles.heatmapCell, { width: heatmapCellSize, height: heatmapCellSize }]}>
                  <Text style={styles.heatmapDateText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* スタッフ行 */}
            {staffList.map(staff => {
              const maxHours = Math.max(...staff.dailyHours, 1);
              return (
                <View key={staff.staffId} style={styles.heatmapRow}>
                  <View style={styles.heatmapStaffLabel}>
                    <Text style={styles.heatmapStaffText}>{staff.staffName}</Text>
                  </View>
                  {dateLabels.map((day) => {
                    const dayIndex = day - 1;
                    const hours = staff.dailyHours[dayIndex] !== undefined ? staff.dailyHours[dayIndex] : 0;
                    const intensity = hours / maxHours;
                    const color = getHeatColor(intensity);
                    return (
                      <View
                        key={day}
                        style={[
                          styles.heatmapCell,
                          {
                            width: heatmapCellSize,
                            height: heatmapCellSize,
                            backgroundColor: color,
                          }
                        ]}
                      >
                        {hours > 0 && (
                          <Text style={[
                            styles.heatmapCellText,
                            { color: intensity > 0.5 ? '#ffffff' : '#374151' }
                          ]}>
                            {hours.toFixed(1)}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* 凡例 */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>稼働時間:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#dbeafe' }]} />
              <Text style={styles.legendText}>低</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#60a5fa' }]} />
              <Text style={styles.legendText}>中</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2563eb' }]} />
              <Text style={styles.legendText}>高</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#1e3a8a' }]} />
              <Text style={styles.legendText}>最大</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 統計サマリー */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 月次統計サマリー</Text>
        {staffList.map(staff => {
          // 31日分のデータを確保（データがない日は0）
          const dailyHours31 = dateLabels.map((day) => {
            const dayIndex = day - 1;
            return staff.dailyHours[dayIndex] !== undefined ? staff.dailyHours[dayIndex] : 0;
          });
          const totalHours = dailyHours31.reduce((sum, h) => sum + h, 0);
          const avgHours = totalHours / 31;
          const workDays = dailyHours31.filter(h => h > 0).length;
          const utilizationRate = (totalHours / staff.monthlyHoursAvailable) * 100;

          return (
            <View key={staff.staffId} style={styles.summaryRow}>
              <Text style={styles.summaryName}>{staff.staffName}</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>総稼働</Text>
                  <Text style={styles.summaryValue}>{totalHours.toFixed(0)}h</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>平均/日</Text>
                  <Text style={styles.summaryValue}>{avgHours.toFixed(1)}h</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>稼働日数</Text>
                  <Text style={styles.summaryValue}>{workDays}日</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>稼働率</Text>
                  <Text style={[
                    styles.summaryValue,
                    { color: utilizationRate > 90 ? '#ef4444' : utilizationRate > 70 ? '#10b981' : '#3b82f6' }
                  ]}>
                    {utilizationRate.toFixed(0)}%
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ヒートマップの色を計算
function getHeatColor(intensity: number): string {
  if (intensity === 0) return '#f3f4f6';
  if (intensity < 0.25) return '#dbeafe';
  if (intensity < 0.5) return '#93c5fd';
  if (intensity < 0.75) return '#60a5fa';
  if (intensity < 0.9) return '#2563eb';
  return '#1e3a8a';
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
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
  lineChart: {
    flexDirection: 'row',
    height: 220,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    width: 50,
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },
  chartAreaContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  lineChartBar: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  lineBar: {
    width: '100%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 2,
  },
  xAxisLabels: {
    flexDirection: 'row',
    height: 20,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  dateLabel: {
    flex: 1,
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
  },
  heatmap: {
    gap: 2,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 2,
  },
  heatmapStaffLabel: {
    width: 100,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  heatmapHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  heatmapStaffText: {
    fontSize: 12,
    color: '#4b5563',
  },
  heatmapCell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  heatmapDateText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  heatmapCellText: {
    fontSize: 9,
    fontWeight: '600',
  },
  legend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  summaryRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryStat: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#374151',
  },
});
