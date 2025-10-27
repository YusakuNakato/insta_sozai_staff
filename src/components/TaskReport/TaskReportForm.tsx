import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../hooks/useAuth';
import { createTaskReport } from '../../services/taskReport.service';
import { TaskItem, TaskType, AccountName } from '../../types';

const ACCOUNT_NAMES: AccountName[] = [
  'さきAI',
  'たくむAIお兄さん',
  'れもん',
  'みさを',
  'みゆ',
];

export const TaskReportForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { user } = useAuth();

  // 日報の日付（デフォルトは当日）
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [showReportDatePicker, setShowReportDatePicker] = useState(false);

  // タスクの動的配列（最初は1つ）
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      accountName: 'さきAI' as AccountName,
      scheduledDate: new Date(),
      taskName: '',
      taskType: 'create' as TaskType,
      durationHrs: 0,
      isCompleted: false,
    }
  ]);

  const [learnings, setLearnings] = useState('');
  const [showResearch, setShowResearch] = useState(false);
  const [ownResearchHours, setOwnResearchHours] = useState(0);
  const [ownResearchLearnings, setOwnResearchLearnings] = useState('');
  const [competitorResearchHours, setCompetitorResearchHours] = useState(0);
  const [competitorResearchLearnings, setCompetitorResearchLearnings] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePickers, setShowDatePickers] = useState<boolean[]>([false]);

  const updateTask = (index: number, field: keyof TaskItem, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        accountName: 'さきAI' as AccountName,
        scheduledDate: new Date(),
        taskName: '',
        taskType: 'create' as TaskType,
        durationHrs: 0,
        isCompleted: false,
      }
    ]);
    setShowDatePickers([...showDatePickers, false]);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      const newTasks = tasks.filter((_, i) => i !== index);
      const newShowDatePickers = showDatePickers.filter((_, i) => i !== index);
      setTasks(newTasks);
      setShowDatePickers(newShowDatePickers);
    }
  };

  const toggleDatePicker = (index: number) => {
    const newShowDatePickers = [...showDatePickers];
    newShowDatePickers[index] = !newShowDatePickers[index];
    setShowDatePickers(newShowDatePickers);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインしてください');
      return;
    }

    // 入力されているタスクのみを抽出
    const filledTasks = tasks.filter(
      task => task.taskName.trim() !== '' && task.durationHrs > 0
    );

    if (filledTasks.length === 0) {
      Alert.alert('エラー', '少なくとも1つのタスクを入力してください');
      return;
    }

    setLoading(true);
    try {
      await createTaskReport(user.id, {
        tasks: filledTasks,
        learnings: learnings.trim(),
        ownResearchHours,
        ownResearchLearnings: ownResearchLearnings.trim(),
        competitorResearchHours,
        competitorResearchLearnings: competitorResearchLearnings.trim(),
      });

      Alert.alert('成功', '日報を登録しました');

      // フォームをリセット
      setReportDate(new Date());
      setShowReportDatePicker(false);
      setTasks([
        {
          accountName: 'さきAI' as AccountName,
          scheduledDate: new Date(),
          taskName: '',
          taskType: 'create' as TaskType,
          durationHrs: 0,
          isCompleted: false,
        }
      ]);
      setLearnings('');
      setShowResearch(false);
      setOwnResearchHours(0);
      setOwnResearchLearnings('');
      setCompetitorResearchHours(0);
      setCompetitorResearchLearnings('');
      setShowDatePickers([false]);

      onSuccess?.();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>日報入力</Text>
        <Text style={styles.subtitle}>本日のタスクを記録しましょう</Text>

        {/* 日報の日付選択 */}
        <View style={styles.reportDateSection}>
          <Text style={styles.reportDateLabel}>日報の日付</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={reportDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setReportDate(newDate);
              }}
              style={{
                backgroundColor: '#FFF',
                paddingLeft: 15,
                paddingRight: 15,
                paddingTop: 10,
                paddingBottom: 10,
                borderRadius: 8,
                fontSize: 16,
                border: '2px solid #007AFF',
                fontWeight: '600',
                color: '#007AFF',
                width: '200px',
              }}
              min={`${new Date().getFullYear() - 1}-01-01`}
              max={`${new Date().getFullYear() + 1}-12-31`}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.reportDateButton}
                onPress={() => setShowReportDatePicker(!showReportDatePicker)}
              >
                <Text style={styles.reportDateButtonText}>
                  {formatDate(reportDate)}
                </Text>
              </TouchableOpacity>
              {showReportDatePicker && (
                <DateTimePicker
                  value={reportDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowReportDatePicker(false);
                    if (selectedDate) {
                      setReportDate(selectedDate);
                    }
                  }}
                />
              )}
            </>
          )}
        </View>

        {tasks.map((task, index) => (
          <View key={index} style={styles.taskSlot}>
            <View style={styles.taskHeader}>
              <Text style={styles.slotTitle}>タスク {index + 1}</Text>
              {tasks.length > 1 && (
                <TouchableOpacity
                  style={styles.removeTaskButton}
                  onPress={() => removeTask(index)}
                >
                  <Text style={styles.removeTaskText}>✕ 削除</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* アカウント名・投稿予定日・タスク名を1行に横並び */}
            <View style={styles.fullRowCompact}>
              <View style={styles.accountContainerCompact}>
                <Text style={styles.label}>アカウント</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={task.accountName}
                    onValueChange={(value) => updateTask(index, 'accountName', value)}
                    style={styles.pickerCompact}
                  >
                    {ACCOUNT_NAMES.map((name) => (
                      <Picker.Item key={name} label={name} value={name} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.dateContainerCompact}>
                <Text style={styles.label}>投稿予定日</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={task.scheduledDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      updateTask(index, 'scheduledDate', newDate);
                    }}
                    style={{
                      backgroundColor: '#F9F9F9',
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 7,
                      paddingBottom: 7,
                      borderRadius: 6,
                      fontSize: 14,
                      border: '1px solid #DDD',
                      minHeight: 38,
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                    min={`${new Date().getFullYear()}-01-01`}
                    max={`${new Date().getFullYear() + 1}-12-31`}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => toggleDatePicker(index)}
                    >
                      <Text style={styles.dateButtonText}>
                        {formatDate(task.scheduledDate)}
                      </Text>
                    </TouchableOpacity>
                    {showDatePickers[index] && (
                      <DateTimePicker
                        value={task.scheduledDate}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          toggleDatePicker(index);
                          if (selectedDate) {
                            updateTask(index, 'scheduledDate', selectedDate);
                          }
                        }}
                      />
                    )}
                  </>
                )}
              </View>

              <View style={styles.taskNameContainerWide}>
                <Text style={styles.label}>タスク名</Text>
                <TextInput
                  style={styles.taskNameInputCompact}
                  placeholder="例: Instagram投稿用画像作成"
                  value={task.taskName}
                  onChangeText={(value) => updateTask(index, 'taskName', value)}
                />
              </View>
            </View>

            {/* 区分・所要時間・完了チェックを横並び */}
            <View style={styles.compactRow}>
              <View style={styles.taskTypeContainer}>
                <Text style={styles.label}>区分</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={task.taskType}
                    onValueChange={(value) => updateTask(index, 'taskType', value)}
                    style={styles.pickerCompact}
                  >
                    <Picker.Item label="作成" value="create" />
                    <Picker.Item label="修正" value="fix" />
                  </Picker>
                </View>
              </View>

              <View style={styles.durationContainer}>
                <Text style={styles.label}>時間</Text>
                <TextInput
                  style={styles.durationInput}
                  placeholder="2.5"
                  value={task.durationHrs > 0 ? String(task.durationHrs) : ''}
                  onChangeText={(value) => {
                    const num = parseFloat(value) || 0;
                    updateTask(index, 'durationHrs', num);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.completedOuterContainer}>
                <TouchableOpacity
                  style={styles.completedContainer}
                  onPress={() => updateTask(index, 'isCompleted', !task.isCompleted)}
                >
                  <View style={[styles.checkbox, task.isCompleted && styles.checkboxChecked]}>
                    {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>完了</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* タスクを追加ボタン */}
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>+ タスクを追加</Text>
        </TouchableOpacity>

        {/* リサーチセクション追加ボタン */}
        {!showResearch && (
          <TouchableOpacity style={styles.addResearchButton} onPress={() => setShowResearch(true)}>
            <Text style={styles.addResearchButtonText}>+ 自社リサーチと他社リサーチを追加</Text>
          </TouchableOpacity>
        )}

        {/* リサーチセクション（横並び） */}
        {showResearch && (
          <View style={styles.researchContainer}>
            {/* 自社リサーチセクション */}
            <View style={styles.researchSectionSideBySide}>
              <View style={styles.researchHeader}>
                <Text style={styles.researchTitle}>自社リサーチ</Text>
                <View style={styles.researchHoursContainer}>
                  <Text style={styles.label}>所要時間（時間）</Text>
                  <TextInput
                    style={styles.researchHoursInput}
                    placeholder="1.5"
                    value={ownResearchHours > 0 ? String(ownResearchHours) : ''}
                    onChangeText={(value) => setOwnResearchHours(parseFloat(value) || 0)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <TextInput
                style={styles.researchLearningsInput}
                placeholder="自社リサーチで学んだこと、気づいたことを記入してください"
                value={ownResearchLearnings}
                onChangeText={setOwnResearchLearnings}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* 他社リサーチセクション */}
            <View style={styles.researchSectionSideBySide}>
              <View style={styles.researchHeader}>
                <Text style={styles.researchTitle}>他社リサーチ</Text>
                <View style={styles.researchHoursContainer}>
                  <Text style={styles.label}>所要時間（時間）</Text>
                  <TextInput
                    style={styles.researchHoursInput}
                    placeholder="1.5"
                    value={competitorResearchHours > 0 ? String(competitorResearchHours) : ''}
                    onChangeText={(value) => setCompetitorResearchHours(parseFloat(value) || 0)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <TextInput
                style={styles.researchLearningsInput}
                placeholder="他社リサーチで学んだこと、気づいたことを記入してください"
                value={competitorResearchLearnings}
                onChangeText={setCompetitorResearchLearnings}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* リサーチセクション削除ボタン */}
            <TouchableOpacity
              style={styles.removeResearchButton}
              onPress={() => {
                setShowResearch(false);
                setOwnResearchHours(0);
                setOwnResearchLearnings('');
                setCompetitorResearchHours(0);
                setCompetitorResearchLearnings('');
              }}
            >
              <Text style={styles.removeResearchText}>✕ リサーチセクションを削除</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.learningsSection}>
          <Text style={styles.learningsTitle}>本日の学び</Text>
          <TextInput
            style={styles.learningsInput}
            placeholder="今日学んだこと、気づいたこと、改善点などを自由に記入してください"
            value={learnings}
            onChangeText={setLearnings}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>日報を登録</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  reportDateSection: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  reportDateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  reportDateButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  reportDateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  taskSlot: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  removeTaskButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  removeTaskText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  addResearchButton: {
    backgroundColor: '#5AC8FA',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  addResearchButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  fieldContainer: {
    marginBottom: 10,
  },
  fullRowCompact: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  accountContainerCompact: {
    flex: 1.8,
  },
  dateContainerCompact: {
    flex: 1.5,
  },
  taskNameContainerWide: {
    flex: 3,
  },
  compactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  taskTypeContainer: {
    flex: 1.5,
  },
  durationContainer: {
    flex: 1,
  },
  completedOuterContainer: {
    flex: 1.5,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  taskNameInput: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    minHeight: 38,
  },
  taskNameInputCompact: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    minHeight: 38,
  },
  dateButton: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    minHeight: 38,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  pickerWrapper: {
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    overflow: 'hidden',
  },
  pickerCompact: {
    height: 38,
  },
  durationInput: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    minHeight: 38,
    textAlign: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  learningsSection: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  learningsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  learningsInput: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  researchContainer: {
    marginBottom: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  researchSection: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  researchSectionSideBySide: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 1,
    marginHorizontal: 5,
  },
  researchHeader: {
    flexDirection: 'column',
    marginBottom: 12,
    gap: 8,
  },
  researchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  researchHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  researchHoursInput: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    minHeight: 38,
    width: 80,
    textAlign: 'center',
  },
  researchLearningsInput: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    minHeight: 100,
  },
  removeResearchButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
    width: '100%',
  },
  removeResearchText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
