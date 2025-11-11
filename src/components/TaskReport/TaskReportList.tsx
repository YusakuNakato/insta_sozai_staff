import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { TaskReport } from '../../types';
import { getTaskReports } from '../../services/taskReport.service';
import { useAuth } from '../../hooks/useAuth';

export const TaskReportList: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<TaskReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async () => {
    if (!user) return;

    try {
      // ディレクターは全体、スタッフは自分のみ
      const filters = user.role === 'staff' ? { staffId: user.id } : undefined;
      const data = await getTaskReports(filters);
      setReports(data);
    } catch (error) {
      console.error('日報の取得に失敗:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const getTotalHours = (tasks: any[]): number => {
    return tasks.reduce((sum, task) => sum + task.durationHrs, 0);
  };

  const renderItem = ({ item }: { item: TaskReport }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
        <Text style={styles.totalHours}>合計: {getTotalHours(item.tasks)}時間</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.sectionTitle}>タスク一覧</Text>
        {item.tasks.map((task, index) => (
          <View key={index} style={styles.taskItem}>
            <View style={styles.taskHeader}>
              <Text style={styles.accountName}>{task.accountName}</Text>
              <Text style={styles.scheduledDate}>
                投稿予定: {formatDate(task.scheduledDate)}
              </Text>
              {task.isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>✓ 完了</Text>
                </View>
              )}
            </View>
            <Text style={styles.taskName}>{task.taskName}</Text>
            <View style={styles.taskFooter}>
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>
                  {task.taskType === 'create' ? '作成' : task.taskType === 'fix' ? '修正' : '添削'}
                </Text>
              </View>
              <Text style={styles.taskDuration}>{task.durationHrs}時間</Text>
            </View>
          </View>
        ))}

        {item.learnings && (
          <View style={styles.learningsSection}>
            <Text style={styles.sectionTitle}>本日の学び</Text>
            <Text style={styles.learningsText}>{item.learnings}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>日報がありません</Text>
          </View>
        }
      />
    </View>
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
  listContent: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  totalHours: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  cardBody: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  taskItem: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  accountName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scheduledDate: {
    fontSize: 12,
    color: '#666',
  },
  completedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
  taskName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 6,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  taskBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  taskDuration: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  learningsSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  learningsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
