import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getTaskReports } from '../../services/taskReport.service';
import { TaskReport } from '../../types';

interface KnowledgeEntry {
  date: Date;
  staffName: string;
  type: '本日の学び' | '自社リサーチ' | '他社リサーチ';
  content: string;
  hours?: number;
}

export const KnowledgeDatabase: React.FC = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    try {
      setLoading(true);
      const reports = await getTaskReports();

      const allEntries: KnowledgeEntry[] = [];

      reports.forEach((report: TaskReport) => {
        const staffName = 'スタッフ'; // TODO: ユーザー名取得

        // 本日の学び
        if (report.learnings && report.learnings.trim()) {
          allEntries.push({
            date: report.date,
            staffName,
            type: '本日の学び',
            content: report.learnings,
          });
        }

        // 自社リサーチ
        if (report.ownResearchLearnings && report.ownResearchLearnings.trim()) {
          allEntries.push({
            date: report.date,
            staffName,
            type: '自社リサーチ',
            content: report.ownResearchLearnings,
            hours: report.ownResearchHours,
          });
        }

        // 他社リサーチ
        if (report.competitorResearchLearnings && report.competitorResearchLearnings.trim()) {
          allEntries.push({
            date: report.date,
            staffName,
            type: '他社リサーチ',
            content: report.competitorResearchLearnings,
            hours: report.competitorResearchHours,
          });
        }
      });

      // 日付降順でソート
      allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEntries(allEntries);
    } catch (error: any) {
      console.error('知識データベース読み込みエラー:', error.message);
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

  const getTypeColor = (type: string): string => {
    switch (type) {
      case '本日の学び':
        return '#007AFF';
      case '自社リサーチ':
        return '#34C759';
      case '他社リサーチ':
        return '#FF9500';
      default:
        return '#666';
    }
  };

  const getTypeBgColor = (type: string): string => {
    switch (type) {
      case '本日の学び':
        return '#E3F2FD';
      case '自社リサーチ':
        return '#E8F5E9';
      case '他社リサーチ':
        return '#FFF3E0';
      default:
        return '#F5F5F5';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>学びの記録がまだありません</Text>
        <Text style={styles.emptySubText}>日報で学びを記録してください</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>知識データベース</Text>
        <Text style={styles.pageSubtitle}>全スタッフの学びを集約</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{entries.length}</Text>
            <Text style={styles.statLabel}>総記録数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {entries.filter(e => e.type === '自社リサーチ').length}
            </Text>
            <Text style={styles.statLabel}>自社リサーチ</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {entries.filter(e => e.type === '他社リサーチ').length}
            </Text>
            <Text style={styles.statLabel}>他社リサーチ</Text>
          </View>
        </View>

        {entries.map((entry, index) => (
          <View
            key={index}
            style={[
              styles.entryCard,
              { backgroundColor: getTypeBgColor(entry.type) }
            ]}
          >
            <View style={styles.entryHeader}>
              <View style={styles.entryHeaderLeft}>
                <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                <Text style={styles.staffNameBadge}>{entry.staffName}</Text>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: getTypeColor(entry.type) }
                  ]}
                >
                  <Text style={styles.typeBadgeText}>{entry.type}</Text>
                </View>
              </View>
              {entry.hours !== undefined && entry.hours > 0 && (
                <Text style={styles.hoursText}>{entry.hours}時間</Text>
              )}
            </View>

            <Text style={styles.entryContent}>{entry.content}</Text>
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
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
  entryCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  staffNameBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  entryContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});
