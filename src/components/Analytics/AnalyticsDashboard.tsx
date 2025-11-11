import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useAuth } from '../../hooks/useAuth';
import { getTaskReports } from '../../services/taskReport.service';
import { analyzeByStaff, analyzeByTask, calculateSummary } from '../../services/analytics.service';
import { TaskReport } from '../../types';

const screenWidth = Dimensions.get('window').width;

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<TaskReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getTaskReports();
      setReports(data);
    } catch (error) {
      console.error('データの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (user?.role !== 'director') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>ディレクターのみアクセス可能です</Text>
      </View>
    );
  }

  const summary = calculateSummary(reports);
  const staffAnalytics = analyzeByStaff(reports);
  const taskAnalytics = analyzeByTask(reports).slice(0, 5); // 上位5件

  const chartConfig = {
    backgroundColor: '#FFF',
    backgroundGradientFrom: '#FFF',
    backgroundGradientTo: '#FFF',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  // 品質スコアがあるタスクのみチャートに表示
  const tasksWithQuality = taskAnalytics.filter((t) => t.averageQuality > 0);
  const qualityChartData = {
    labels: tasksWithQuality.map((t) => t.taskName.substring(0, 10)),
    datasets: [
      {
        data: tasksWithQuality.map((t) => t.averageQuality),
      },
    ],
  };

  const hoursChartData = {
    labels: staffAnalytics.map((s) => s.staffName.substring(0, 10)),
    datasets: [
      {
        data: staffAnalytics.map((s) => s.totalHours),
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>全体サマリー</Text>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.totalHours}</Text>
            <Text style={styles.summaryLabel}>総稼働時間</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {summary.averageQuality > 0 ? summary.averageQuality : 'N/A'}
            </Text>
            <Text style={styles.summaryLabel}>平均品質</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.totalFixes}</Text>
            <Text style={styles.summaryLabel}>総修正回数</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.totalCorrections}</Text>
            <Text style={styles.summaryLabel}>総添削回数</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.taskCount}</Text>
            <Text style={styles.summaryLabel}>タスク数</Text>
          </View>
        </View>
      </View>

      {tasksWithQuality.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>タスク別品質スコア</Text>
          <BarChart
            data={qualityChartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            style={styles.chart}
          />
        </View>
      )}

      {staffAnalytics.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>スタッフ別稼働時間</Text>
          <BarChart
            data={hoursChartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            fromZero
            yAxisLabel=""
            yAxisSuffix="h"
            style={styles.chart}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>タスク別詳細</Text>
        {taskAnalytics.map((task, index) => (
          <View key={index} style={styles.detailCard}>
            <Text style={styles.detailTitle}>{task.taskName}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>稼働時間:</Text>
              <Text style={styles.detailValue}>{task.totalHours}h</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>平均品質:</Text>
              <Text style={styles.detailValue}>
                {task.averageQuality > 0 ? task.averageQuality : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>修正回数:</Text>
              <Text style={styles.detailValue}>{task.totalFixes}回</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>添削回数:</Text>
              <Text style={styles.detailValue}>{task.totalCorrections}回</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    width: (screenWidth - 50) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
