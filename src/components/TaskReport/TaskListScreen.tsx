import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getTaskReports } from '../../services/taskReport.service';
import { TaskReport, TaskItem } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface ReportDisplay {
  id: string;
  staffName: string;
  date: Date;
  tasks: TaskItem[];
  totalHours: number;
}

export const TaskListScreen: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const allReports = await getTaskReports();

      // 日報を表示用に変換
      const displayReports: ReportDisplay[] = allReports.map((report: TaskReport) => {
        // タスクの合計時間を計算
        const totalHours = report.tasks.reduce((sum, task) => sum + task.durationHrs, 0);

        return {
          id: report.id,
          staffName: user?.name || 'スタッフ',
          date: report.date,
          tasks: report.tasks,
          totalHours,
        };
      });

      // 日付降順でソート
      displayReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setReports(displayReports);
    } catch (error: any) {
      console.error('日報読み込みエラー:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>日報がまだありません</Text>
        <Text style={styles.emptySubText}>日報を入力してください</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>稼働状況</Text>
        <Text style={styles.pageSubtitle}>全スタッフの作業記録</Text>

        {reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            {/* ヘッダー: 日付とスタッフ名 */}
            <View style={styles.reportHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.reportDate}>{formatDate(report.date)}</Text>
                <Text style={styles.staffName}>担当: {report.staffName}</Text>
              </View>
            </View>

            {/* タスク一覧 */}
            <View style={styles.tasksSection}>
              {report.tasks.map((task, index) => (
                <View key={index} style={styles.taskRow}>
                  <View style={styles.taskLeft}>
                    <Text style={styles.accountName}>{task.accountName}</Text>
                    <Text style={styles.taskName}>{task.taskName}</Text>
                    {task.isCompleted && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>✓ 完了</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.taskRight}>
                    <Text style={styles.taskHours}>{task.durationHrs}h</Text>
                    <Text style={styles.taskType}>
                      {task.taskType === 'create' ? '作成' : '修正'}
                    </Text>
                    {task.correctionCount !== undefined && task.correctionCount > 0 && (
                      <Text style={styles.correctionCount}>添削: {task.correctionCount}回</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* 合計時間 */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>合計作業時間</Text>
              <Text style={styles.totalHours}>{report.totalHours.toFixed(1)}時間</Text>
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
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  reportCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  reportDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tasksSection: {
    gap: 10,
    marginBottom: 15,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  taskLeft: {
    flex: 1,
    gap: 4,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  taskName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  completedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  completedBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  taskRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 10,
  },
  taskHours: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  taskType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  correctionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9500',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  totalHours: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
