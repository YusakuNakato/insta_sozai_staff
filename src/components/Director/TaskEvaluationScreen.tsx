import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getTaskReports } from '../../services/taskReport.service';
import { TaskReport, TaskItem, QualityScore } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface TaskWithContext {
  reportId: string;
  reportDate: Date;
  staffName: string;
  taskIndex: number;
  task: TaskItem;
}

const QUALITY_SCORES: QualityScore[] = ['-', 1, 2, 3, 4, 5];

export const TaskEvaluationScreen: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<{[key: string]: QualityScore}>({});
  const [workloads, setWorkloads] = useState<{[key: string]: string}>({});
  const [notes, setNotes] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const reports = await getTaskReports();

      // 全てのタスクを抽出
      const allTasks: TaskWithContext[] = [];
      reports.forEach((report: TaskReport) => {
        report.tasks.forEach((task: TaskItem, index: number) => {
          allTasks.push({
            reportId: report.id,
            reportDate: report.date,
            staffName: '中藤優作（さく）', // TODO: ユーザー名取得
            taskIndex: index,
            task,
          });
        });
      });

      // 日付降順でソート
      allTasks.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());

      setTasks(allTasks);

      // 初期値を設定
      const initialScores: {[key: string]: QualityScore} = {};
      const initialWorkloads: {[key: string]: string} = {};
      const initialNotes: {[key: string]: string} = {};
      allTasks.forEach(taskContext => {
        const key = `${taskContext.reportId}-${taskContext.taskIndex}`;
        initialScores[key] = taskContext.task.qualityScore || '-';
        initialWorkloads[key] = taskContext.task.revisionWorkload || '';
        initialNotes[key] = taskContext.task.specialNotes || '';
      });
      setScores(initialScores);
      setWorkloads(initialWorkloads);
      setNotes(initialNotes);
    } catch (error: any) {
      console.error('タスク読み込みエラー:', error.message);
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

  const handleScoreChange = (key: string, score: QualityScore) => {
    setScores(prev => ({ ...prev, [key]: score }));
  };

  const handleWorkloadChange = (key: string, workload: string) => {
    setWorkloads(prev => ({ ...prev, [key]: workload }));
  };

  const handleNotesChange = (key: string, note: string) => {
    setNotes(prev => ({ ...prev, [key]: note }));
  };

  const saveEvaluation = (taskContext: TaskWithContext) => {
    const key = `${taskContext.reportId}-${taskContext.taskIndex}`;
    const score = scores[key];
    const workload = workloads[key];
    const specialNote = notes[key];

    // TODO: タスク評価を保存する処理を実装
    const scoreText = score === '-' ? '未評価' : score;
    Alert.alert('保存しました', `クオリティ: ${scoreText}`);

    // ローカル状態を更新
    const updatedTasks = tasks.map(t => {
      if (t.reportId === taskContext.reportId && t.taskIndex === taskContext.taskIndex) {
        return {
          ...t,
          task: {
            ...t.task,
            qualityScore: score,
            revisionWorkload: workload,
            specialNotes: specialNote,
          }
        };
      }
      return t;
    });
    setTasks(updatedTasks);
  };

  const getScoreColor = (score: QualityScore): string => {
    switch (score) {
      case 5: return '#34C759'; // 緑 - 最良
      case 4: return '#007AFF'; // 青 - 良好
      case 3: return '#FF9500'; // オレンジ - 普通
      case 2: return '#FF3B30'; // 赤 - 要改善
      case 1: return '#8B0000'; // 濃い赤 - 不十分
      default: return '#999';
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

  if (tasks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>評価するタスクがありません</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>ディレクター専用</Text>
        <Text style={styles.pageSubtitle}>タスクのクオリティ評価</Text>

        {tasks.map((taskContext, index) => {
          const key = `${taskContext.reportId}-${taskContext.taskIndex}`;
          const currentScore = scores[key] || '-';
          const currentWorkload = workloads[key] || '';
          const currentNotes = notes[key] || '';

          return (
            <View key={key} style={styles.taskCard}>
              <View style={styles.mainRow}>
                {/* 左側：タスク情報 */}
                <View style={styles.taskInfoSection}>
                  {/* 担当者を先頭に表示 */}
                  <Text style={styles.staffNameTop}>{taskContext.staffName}</Text>

                  <View style={styles.taskDetails}>
                    <Text style={styles.taskDate}>{formatDate(taskContext.reportDate)}</Text>
                    <Text style={styles.accountName}>{taskContext.task.accountName}</Text>
                    <Text style={styles.taskName}>{taskContext.task.taskName}</Text>
                    <Text style={styles.metaText}>
                      {taskContext.task.taskType === 'create' ? '作成' : '修正'} | {taskContext.task.durationHrs}時間
                    </Text>
                  </View>
                </View>

                {/* 右側：評価フォーム */}
                <View style={styles.evaluationSection}>
                  {/* クオリティと修正工数を横並び */}
                  <View style={styles.evaluationRow}>
                    <View style={styles.qualityField}>
                      <Text style={styles.label}>クオリティ</Text>
                      <View style={styles.pickerWrapper}>
                        <Picker
                          selectedValue={currentScore}
                          onValueChange={(value) => handleScoreChange(key, value as QualityScore)}
                          style={styles.picker}
                        >
                          <Picker.Item label="-（未評価）" value="-" />
                          <Picker.Item label="5（最良）" value={5} />
                          <Picker.Item label="4（良好）" value={4} />
                          <Picker.Item label="3（普通）" value={3} />
                          <Picker.Item label="2（要改善）" value={2} />
                          <Picker.Item label="1（不十分）" value={1} />
                        </Picker>
                      </View>
                    </View>

                    <View style={styles.workloadField}>
                      <Text style={styles.label}>修正工数</Text>
                      <TextInput
                        style={styles.workloadInputSmall}
                        placeholder="工数"
                        value={currentWorkload}
                        onChangeText={(text) => handleWorkloadChange(key, text)}
                      />
                    </View>
                  </View>

                  {/* 特記事項 */}
                  <View style={styles.evaluationField}>
                    <Text style={styles.label}>特記事項</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="特記事項を入力してください"
                      value={currentNotes}
                      onChangeText={(text) => handleNotesChange(key, text)}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => saveEvaluation(taskContext)}
                  >
                    <Text style={styles.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
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
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
  },
  taskCard: {
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
  mainRow: {
    flexDirection: 'row',
    gap: 20,
  },
  taskInfoSection: {
    flex: 1,
  },
  staffNameTop: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  taskDetails: {
    gap: 6,
  },
  taskDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  accountName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  evaluationSection: {
    flex: 1,
    gap: 12,
  },
  evaluationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qualityField: {
    flex: 1,
    gap: 6,
  },
  workloadField: {
    flex: 1,
    gap: 6,
  },
  evaluationField: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  pickerWrapper: {
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  workloadInputSmall: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    height: 40,
  },
  notesInput: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
