import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { getAllUsers, deleteUser, updateUser } from '../../services/user.service';
import { User, UserRole } from '../../types';

export const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [showStaffManagement, setShowStaffManagement] = useState(false);

  // メンバー関連
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // スタッフ編集関連
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'staff' as UserRole,
    actualJobTitle: '',
    dailyAvailableHours: '',
    workingHoursStart: '',
    workingHoursEnd: '',
  });
  const [saving, setSaving] = useState(false);

  // ユーザー削除モーダル関連
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUsersForDeletion, setSelectedUsersForDeletion] = useState<string[]>([]);
  const [deletingUsers, setDeletingUsers] = useState(false);

  useEffect(() => {
    // 管理者かつスタッフ管理画面の場合はデータ読み込み
    if (user?.role === 'admin' && showStaffManagement) {
      loadMembers();
    }
  }, [showStaffManagement, user]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await getAllUsers();
      setMembers(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (memberId === user?.id) {
      Alert.alert('エラー', '自分自身を削除することはできません');
      return;
    }

    Alert.alert(
      'メンバー削除',
      `${memberName} を削除してもよろしいですか？\n\nこの操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(memberId);
              Alert.alert('成功', `${memberName} を削除しました`);
              loadMembers();
            } catch (error: any) {
              Alert.alert('エラー', error.message);
            }
          },
        },
      ]
    );
  };

  const handleEditStaff = (staff: User) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name,
      role: staff.role,
      actualJobTitle: staff.actualJobTitle || '',
      dailyAvailableHours: staff.dailyAvailableHours?.toString() || '',
      workingHoursStart: staff.workingHoursStart || '',
      workingHoursEnd: staff.workingHoursEnd || '',
    });
  };

  const handleSaveStaff = async () => {
    if (!editingStaff) return;

    if (!editForm.name.trim()) {
      Alert.alert('エラー', '表示名は必須です');
      return;
    }

    // 自分自身の役職を変更しようとしている場合は警告
    if (editingStaff.id === user?.id && editForm.role !== editingStaff.role) {
      Alert.alert('警告', '自分自身の役職を変更することはできません');
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        name: editForm.name.trim(),
        role: editForm.role,
        actualJobTitle: editForm.actualJobTitle.trim() || undefined,
        dailyAvailableHours: editForm.dailyAvailableHours ? parseFloat(editForm.dailyAvailableHours) : undefined,
        workingHoursStart: editForm.workingHoursStart.trim() || undefined,
        workingHoursEnd: editForm.workingHoursEnd.trim() || undefined,
      };

      await updateUser(editingStaff.id, updates);
      Alert.alert('✅ 更新完了', 'メンバー情報を更新しました');
      setEditingStaff(null);
      loadMembers();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setSaving(false);
    }
  };

  // ユーザー削除処理
  const handleDeleteUsers = async () => {
    if (selectedUsersForDeletion.length === 0) {
      Alert.alert('エラー', '削除するユーザーを選択してください');
      return;
    }

    // 自分自身が含まれていないかチェック
    if (selectedUsersForDeletion.includes(user?.id || '')) {
      Alert.alert('エラー', '自分自身を削除することはできません');
      return;
    }

    const selectedUsers = members.filter(m => selectedUsersForDeletion.includes(m.id));
    const userNames = selectedUsers.map(u => u.name).join(', ');

    Alert.alert(
      'ユーザー削除',
      `以下のユーザーを削除してもよろしいですか？\n\n${userNames}\n\nこの操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setDeletingUsers(true);
            try {
              await Promise.all(
                selectedUsersForDeletion.map(userId => deleteUser(userId))
              );
              Alert.alert('成功', `${selectedUsersForDeletion.length}人のユーザーを削除しました`);
              setSelectedUsersForDeletion([]);
              setShowDeleteUserModal(false);
              loadMembers();
            } catch (error: any) {
              Alert.alert('エラー', error.message);
            } finally {
              setDeletingUsers(false);
            }
          },
        },
      ]
    );
  };

  // ユーザー選択のトグル
  const toggleUserSelection = (userId: string) => {
    if (selectedUsersForDeletion.includes(userId)) {
      setSelectedUsersForDeletion(selectedUsersForDeletion.filter(id => id !== userId));
    } else {
      setSelectedUsersForDeletion([...selectedUsersForDeletion, userId]);
    }
  };

  // ユーザー削除モーダル
  const renderDeleteUserModal = () => (
    <Modal
      visible={showDeleteUserModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowDeleteUserModal(false);
        setSelectedUsersForDeletion([]);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ユーザー削除</Text>
            <TouchableOpacity onPress={() => {
              setShowDeleteUserModal(false);
              setSelectedUsersForDeletion([]);
            }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalDescription}>
              削除するユーザーを選択してください。
            </Text>

            {loadingMembers ? (
              <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
            ) : members.length === 0 ? (
              <Text style={styles.emptyText}>ユーザーがいません</Text>
            ) : (
              members.map((member) => {
                const isSelected = selectedUsersForDeletion.includes(member.id);
                const isSelf = member.id === user?.id;

                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.userSelectItem,
                      isSelected && styles.userSelectItemSelected,
                      isSelf && styles.userSelectItemDisabled,
                    ]}
                    onPress={() => !isSelf && toggleUserSelection(member.id)}
                    disabled={isSelf}
                  >
                    <View style={styles.userSelectCheckbox}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.userSelectInfo}>
                      <Text style={styles.userSelectName}>
                        {member.name} {isSelf && '(本人)'}
                      </Text>
                      <Text style={styles.userSelectEmail}>{member.email}</Text>
                      <Text style={styles.userSelectRole}>
                        {member.role === 'admin' ? '🔑 管理者' : member.role === 'director' ? '🎬 ディレクター' : '👤 スタッフ'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {selectedUsersForDeletion.length > 0 && (
              <View style={styles.selectionSummary}>
                <Text style={styles.selectionText}>
                  {selectedUsersForDeletion.length}人選択中
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.deleteButtonLarge,
                (deletingUsers || selectedUsersForDeletion.length === 0) && styles.deleteButtonDisabled,
              ]}
              onPress={handleDeleteUsers}
              disabled={deletingUsers || selectedUsersForDeletion.length === 0}
            >
              {deletingUsers ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>選択したユーザーを削除</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // スタッフ管理画面を表示中の場合（管理者のみアクセス可能）
  if (showStaffManagement && user?.role === 'admin') {
    return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ 設定</Text>
        <Text style={styles.subtitle}>メンバー管理</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* メンバー管理 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>メンバー一覧</Text>
            <TouchableOpacity onPress={loadMembers} disabled={loadingMembers}>
              <Text style={styles.refreshButton}>
                {loadingMembers ? '更新中...' : '🔄'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 削除ボタン */}
          {selectedUsersForDeletion.length > 0 && (
            <View style={styles.bulkActionBar}>
              <Text style={styles.bulkActionText}>
                {selectedUsersForDeletion.length}人選択中
              </Text>
              <TouchableOpacity
                style={styles.bulkDeleteButton}
                onPress={handleDeleteUsers}
                disabled={deletingUsers}
              >
                <Text style={styles.bulkDeleteButtonText}>
                  {deletingUsers ? '削除中...' : '選択したメンバーを削除'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {loadingMembers ? (
            <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
          ) : members.length === 0 ? (
            <Text style={styles.emptyText}>メンバーがいません</Text>
          ) : (
            members.map((staff) => {
              const isSelected = selectedUsersForDeletion.includes(staff.id);
              const isSelf = staff.id === user?.id;

              return (
                <View key={staff.id} style={[styles.staffCard, isSelected && styles.staffCardSelected]}>
                  <View style={styles.staffCardHeader}>
                    <View style={styles.staffCardLeft}>
                      {/* チェックボックス */}
                      <TouchableOpacity
                        onPress={() => !isSelf && toggleUserSelection(staff.id)}
                        disabled={isSelf}
                        style={styles.checkbox}
                      >
                        <View style={[
                          styles.checkboxBox,
                          isSelected && styles.checkboxBoxChecked,
                          isSelf && styles.checkboxBoxDisabled
                        ]}>
                          {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                        </View>
                      </TouchableOpacity>

                      <Text style={styles.staffCardName}>
                        {staff.name} {isSelf && '(本人)'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditStaff(staff)}
                    >
                      <Text style={styles.editButtonText}>✏️ 編集</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.staffCardBody}>
                    <View style={styles.staffInfoRow}>
                      <Text style={styles.staffInfoLabel}>役職:</Text>
                      <Text style={styles.staffInfoValue}>
                        {staff.role === 'admin' ? '🔑 管理者' : staff.role === 'director' ? '🎬 ディレクター' : '👤 スタッフ'}
                      </Text>
                    </View>
                    <View style={styles.staffInfoRow}>
                      <Text style={styles.staffInfoLabel}>メール:</Text>
                      <Text style={styles.staffInfoValue}>{staff.email}</Text>
                    </View>
                    {staff.actualJobTitle && (
                      <View style={styles.staffInfoRow}>
                        <Text style={styles.staffInfoLabel}>本職:</Text>
                        <Text style={styles.staffInfoValue}>{staff.actualJobTitle}</Text>
                      </View>
                    )}
                    {staff.dailyAvailableHours && (
                      <View style={styles.staffInfoRow}>
                        <Text style={styles.staffInfoLabel}>稼働可能時間:</Text>
                        <Text style={styles.staffInfoValue}>{staff.dailyAvailableHours}時間/日</Text>
                      </View>
                    )}
                    {staff.workingHoursStart && staff.workingHoursEnd && (
                      <View style={styles.staffInfoRow}>
                        <Text style={styles.staffInfoLabel}>稼働時間帯:</Text>
                        <Text style={styles.staffInfoValue}>
                          {staff.workingHoursStart} 〜 {staff.workingHoursEnd}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* スタッフ編集モーダル */}
      <Modal
        visible={editingStaff !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingStaff(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>メンバー情報編集</Text>
              <TouchableOpacity onPress={() => setEditingStaff(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>表示名 *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="表示名（スタッフ名）"
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
              />

              <Text style={styles.modalLabel}>役職 *</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleButton, editForm.role === 'staff' && styles.roleButtonActive]}
                  onPress={() => setEditForm({ ...editForm, role: 'staff' })}
                  disabled={editingStaff?.id === user?.id}
                >
                  <Text style={[styles.roleButtonText, editForm.role === 'staff' && styles.roleButtonTextActive]}>
                    👤 スタッフ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, editForm.role === 'director' && styles.roleButtonActive]}
                  onPress={() => setEditForm({ ...editForm, role: 'director' })}
                  disabled={editingStaff?.id === user?.id}
                >
                  <Text style={[styles.roleButtonText, editForm.role === 'director' && styles.roleButtonTextActive]}>
                    🎬 ディレクター
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, editForm.role === 'admin' && styles.roleButtonActive]}
                  onPress={() => setEditForm({ ...editForm, role: 'admin' })}
                  disabled={editingStaff?.id === user?.id}
                >
                  <Text style={[styles.roleButtonText, editForm.role === 'admin' && styles.roleButtonTextActive]}>
                    🔑 管理者
                  </Text>
                </TouchableOpacity>
              </View>
              {editingStaff?.id === user?.id && (
                <Text style={styles.warningText}>※ 自分自身の役職は変更できません</Text>
              )}

              <Text style={styles.modalLabel}>本職の表示名</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="例：デザイナー、エンジニア"
                value={editForm.actualJobTitle}
                onChangeText={(text) => setEditForm({ ...editForm, actualJobTitle: text })}
              />

              <Text style={styles.modalLabel}>1日の稼働可能時間数</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="例：8"
                value={editForm.dailyAvailableHours}
                onChangeText={(text) => setEditForm({ ...editForm, dailyAvailableHours: text })}
                keyboardType="decimal-pad"
              />

              <Text style={styles.modalLabel}>稼働時間帯</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.modalInput, styles.timeInput]}
                  placeholder="開始（例：09:00）"
                  value={editForm.workingHoursStart}
                  onChangeText={(text) => setEditForm({ ...editForm, workingHoursStart: text })}
                />
                <Text style={styles.timeSeparator}>〜</Text>
                <TextInput
                  style={[styles.modalInput, styles.timeInput]}
                  placeholder="終了（例：18:00）"
                  value={editForm.workingHoursEnd}
                  onChangeText={(text) => setEditForm({ ...editForm, workingHoursEnd: text })}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveStaff}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>保存</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 戻るボタン */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setShowStaffManagement(false)}
      >
        <Text style={styles.backButtonText}>← 設定に戻る</Text>
      </TouchableOpacity>
    </View>
    );
  }

  // 通常の設定画面
  return (
    <View style={styles.container}>
      {renderDeleteUserModal()}

      <View style={styles.header}>
        <Text style={styles.title}>⚙️ 設定</Text>
        <Text style={styles.subtitle}>アプリ設定</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 基本情報カード */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ユーザー情報</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>表示名:</Text>
            <Text style={styles.infoValue}>{user?.name || '未設定'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>メールアドレス:</Text>
            <Text style={styles.infoValue}>{user?.email || '未設定'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>役割:</Text>
            <Text style={styles.infoValue}>
              {user?.role === 'admin' ? '管理者' : user?.role === 'director' ? 'ディレクター' : 'スタッフ'}
            </Text>
          </View>
        </View>

        {/* 管理者専用セクション */}
        {user?.role === 'admin' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>管理者専用</Text>
            <Text style={styles.cardDescription}>
              メンバーの管理を行うことができます
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowStaffManagement(true)}
            >
              <Text style={styles.primaryButtonText}>🔒 メンバー管理</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* アプリ情報 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>アプリについて</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>バージョン:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>アプリ名:</Text>
            <Text style={styles.infoValue}>StaffWorkTracker</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  refreshButton: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 20,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  deleteButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  staffCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  staffCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  staffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkboxBoxDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  staffCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  bulkActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bulkActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  bulkDeleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  bulkDeleteButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  staffCardBody: {
    gap: 8,
  },
  staffInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffInfoLabel: {
    fontSize: 13,
    color: '#6b7280',
    width: 120,
  },
  staffInfoValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
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
    maxHeight: '80%',
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
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  roleButtonTextActive: {
    color: '#6366f1',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInput: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  userSelectItemSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  userSelectItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#e5e7eb',
  },
  userSelectCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6366f1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userSelectInfo: {
    flex: 1,
  },
  userSelectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userSelectEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  userSelectRole: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  selectionSummary: {
    backgroundColor: '#eef2ff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  deleteButtonLarge: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
    marginBottom: 12,
  },
});
