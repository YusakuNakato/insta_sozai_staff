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
import { inviteEmail, getAllInvitations } from '../../services/invitation.service';
import { getAllUsers, deleteUser, updateUser } from '../../services/user.service';
import { InvitedEmail, User, UserRole } from '../../types';

const SETTINGS_PASSWORD = process.env.EXPO_PUBLIC_SETTINGS_PASSWORD || 'CHANGE_ME';

export const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [showStaffManagement, setShowStaffManagement] = useState(false);
  const [activeTab, setActiveTab] = useState<'invite' | 'members' | 'staff'>('invite');

  // パスワード認証関連（設定画面全体の保護）
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 招待関連
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [inviting, setInviting] = useState(false);
  const [invitations, setInvitations] = useState<InvitedEmail[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // メンバー関連
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // スタッフ編集関連
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    actualJobTitle: '',
    dailyAvailableHours: '',
    workingHoursStart: '',
    workingHoursEnd: '',
  });
  const [saving, setSaving] = useState(false);

  // ユーザー追加・削除モーダル関連
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [selectedUsersForDeletion, setSelectedUsersForDeletion] = useState<string[]>([]);
  const [deletingUsers, setDeletingUsers] = useState(false);

  useEffect(() => {
    // パスワード認証済みでスタッフ管理画面の場合のみデータ読み込み
    if (isAuthenticated && showStaffManagement) {
      loadInvitations();
      loadMembers();
    }
  }, [isAuthenticated, showStaffManagement]);

  useEffect(() => {
    // 通常の設定画面でもパスワード認証済みならメンバーリストを読み込む
    if (isAuthenticated && !showStaffManagement) {
      loadMembers();
    }
  }, [isAuthenticated, showStaffManagement]);

  const handlePasswordSubmit = () => {
    if (passwordInput === SETTINGS_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('パスワードが正しくありません');
    }
  };

  const loadInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const data = await getAllInvitations();
      setInvitations(data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

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

  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }

    if (!user) {
      Alert.alert('エラー', 'ログインしてください');
      return;
    }

    setInviting(true);
    try {
      await inviteEmail(email.trim(), role, user.id);
      Alert.alert('成功', `${email} を招待しました`);
      setEmail('');
      loadInvitations();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setInviting(false);
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

    setSaving(true);
    try {
      const updates: any = {
        name: editForm.name.trim(),
        actualJobTitle: editForm.actualJobTitle.trim() || undefined,
        dailyAvailableHours: editForm.dailyAvailableHours ? parseFloat(editForm.dailyAvailableHours) : undefined,
        workingHoursStart: editForm.workingHoursStart.trim() || undefined,
        workingHoursEnd: editForm.workingHoursEnd.trim() || undefined,
      };

      await updateUser(editingStaff.id, updates);
      Alert.alert('成功', 'スタッフ情報を更新しました');
      setEditingStaff(null);
      loadMembers();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setSaving(false);
    }
  };

  // ユーザー追加処理
  const handleAddUser = async () => {
    if (!addUserEmail.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }

    if (!user) {
      Alert.alert('エラー', 'ログインしてください');
      return;
    }

    setAddingUser(true);
    try {
      await inviteEmail(addUserEmail.trim(), 'staff', user.id);
      Alert.alert('成功', `${addUserEmail} を招待リストに追加しました`);
      setAddUserEmail('');
      setShowAddUserModal(false);
      loadMembers();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setAddingUser(false);
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

  // ユーザー追加モーダル
  const renderAddUserModal = () => (
    <Modal
      visible={showAddUserModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowAddUserModal(false);
        setAddUserEmail('');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ユーザー追加</Text>
            <TouchableOpacity onPress={() => {
              setShowAddUserModal(false);
              setAddUserEmail('');
            }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalDescription}>
              招待するユーザーのメールアドレスを入力してください。
              このメールアドレスでのみ新規登録が可能になります。
            </Text>

            <Text style={styles.modalLabel}>メールアドレス</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="example@email.com"
              value={addUserEmail}
              onChangeText={setAddUserEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TouchableOpacity
              style={[styles.primaryButton, addingUser && styles.primaryButtonDisabled]}
              onPress={handleAddUser}
              disabled={addingUser}
            >
              {addingUser ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>追加</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
                        {member.role === 'director' ? '🔑 ディレクター' : '👤 スタッフ'}
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

  // 設定画面のパスワード認証画面
  const renderPasswordScreen = () => (
    <View style={styles.container}>
      <View style={styles.passwordContainer}>
        <View style={styles.passwordCard}>
          <Text style={styles.passwordTitle}>⚙️ 設定</Text>
          <Text style={styles.passwordDescription}>
            設定画面にアクセスするには、パスワードが必要です。
          </Text>

          <TextInput
            style={styles.passwordInput}
            placeholder="パスワード"
            value={passwordInput}
            onChangeText={(text) => {
              setPasswordInput(text);
              setPasswordError('');
            }}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={handlePasswordSubmit}
          />

          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.passwordButton}
            onPress={handlePasswordSubmit}
          >
            <Text style={styles.passwordButtonText}>ログイン</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // スタッフ管理画面を表示中の場合
  if (showStaffManagement && isAuthenticated) {
    return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ 設定</Text>
        <Text style={styles.subtitle}>メンバー管理</Text>
      </View>

      {/* タブ */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invite' && styles.tabActive]}
          onPress={() => setActiveTab('invite')}
        >
          <Text style={[styles.tabText, activeTab === 'invite' && styles.tabTextActive]}>
            ✉️ 招待管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'staff' && styles.tabActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.tabText, activeTab === 'staff' && styles.tabTextActive]}>
            👤 スタッフ管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
            🗑️ メンバー削除
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 招待管理タブ */}
        {activeTab === 'invite' && (
          <>
            {/* 招待フォーム */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>新規招待</Text>

              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Text style={styles.label}>役割</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'staff' && styles.roleButtonActive]}
                  onPress={() => setRole('staff')}
                >
                  <Text style={[styles.roleButtonText, role === 'staff' && styles.roleButtonTextActive]}>
                    スタッフ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'director' && styles.roleButtonActive]}
                  onPress={() => setRole('director')}
                >
                  <Text style={[styles.roleButtonText, role === 'director' && styles.roleButtonTextActive]}>
                    ディレクター
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, inviting && styles.primaryButtonDisabled]}
                onPress={handleInvite}
                disabled={inviting}
              >
                {inviting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>招待を送信</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 招待リスト */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>招待済みメールアドレス</Text>
                <TouchableOpacity onPress={loadInvitations} disabled={loadingInvitations}>
                  <Text style={styles.refreshButton}>
                    {loadingInvitations ? '更新中...' : '🔄'}
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingInvitations ? (
                <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
              ) : invitations.length === 0 ? (
                <Text style={styles.emptyText}>招待はまだありません</Text>
              ) : (
                invitations.map((invitation) => (
                  <View key={invitation.id} style={styles.listItem}>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemTitle}>{invitation.email}</Text>
                      <View style={styles.listItemMeta}>
                        <Text style={styles.listItemMetaText}>
                          {invitation.role === 'director' ? 'ディレクター' : 'スタッフ'}
                        </Text>
                        <Text style={styles.listItemMetaText}>
                          {invitation.createdAt.toDate().toLocaleDateString('ja-JP')}
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      invitation.used ? styles.statusBadgeUsed : styles.statusBadgePending
                    ]}>
                      <Text style={[
                        styles.statusText,
                        invitation.used ? styles.statusTextUsed : styles.statusTextPending
                      ]}>
                        {invitation.used ? '使用済み' : '未使用'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* スタッフ管理タブ */}
        {activeTab === 'staff' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>スタッフ一覧</Text>
              <TouchableOpacity onPress={loadMembers} disabled={loadingMembers}>
                <Text style={styles.refreshButton}>
                  {loadingMembers ? '更新中...' : '🔄'}
                </Text>
              </TouchableOpacity>
            </View>

            {loadingMembers ? (
              <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
            ) : members.length === 0 ? (
              <Text style={styles.emptyText}>スタッフがいません</Text>
            ) : (
              members.filter(m => m.role === 'staff').map((staff) => (
                <View key={staff.id} style={styles.staffCard}>
                  <View style={styles.staffCardHeader}>
                    <Text style={styles.staffCardName}>{staff.name}</Text>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditStaff(staff)}
                    >
                      <Text style={styles.editButtonText}>✏️ 編集</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.staffCardBody}>
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
              ))
            )}
          </View>
        )}

        {/* メンバー削除タブ */}
        {activeTab === 'members' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>登録済みメンバー</Text>
              <TouchableOpacity onPress={loadMembers} disabled={loadingMembers}>
                <Text style={styles.refreshButton}>
                  {loadingMembers ? '更新中...' : '🔄'}
                </Text>
              </TouchableOpacity>
            </View>

            {loadingMembers ? (
              <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
            ) : members.length === 0 ? (
              <Text style={styles.emptyText}>メンバーがいません</Text>
            ) : (
              members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                    <Text style={styles.memberRole}>
                      {member.role === 'director' ? '🔑 ディレクター' : '👤 スタッフ'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.deleteButton, member.id === user?.id && styles.deleteButtonDisabled]}
                    onPress={() => handleDeleteMember(member.id, member.name)}
                    disabled={member.id === user?.id}
                  >
                    <Text style={styles.deleteButtonText}>
                      {member.id === user?.id ? '本人' : '削除'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
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
              <Text style={styles.modalTitle}>スタッフ情報編集</Text>
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
        onPress={() => {
          setShowStaffManagement(false);
          setIsAuthenticated(false);
        }}
      >
        <Text style={styles.backButtonText}>← 設定に戻る</Text>
      </TouchableOpacity>
    </View>
    );
  }

  // 通常の設定画面
  return (
    <View style={styles.container}>
      {renderAddUserModal()}
      {renderDeleteUserModal()}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>⚙️ 設定</Text>
          <Text style={styles.subtitle}>アプリ設定</Text>
        </View>
        {user?.role === 'director' && (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowAddUserModal(true)}
            >
              <Text style={styles.headerButtonText}>＋ ユーザー追加</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.headerButtonDanger]}
              onPress={() => setShowDeleteUserModal(true)}
            >
              <Text style={styles.headerButtonText}>🗑 ユーザー削除</Text>
            </TouchableOpacity>
          </View>
        )}
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
              {user?.role === 'director' ? 'ディレクター' : 'スタッフ'}
            </Text>
          </View>
        </View>

        {/* ディレクター専用セクション */}
        {user?.role === 'director' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ディレクター専用</Text>
            <Text style={styles.cardDescription}>
              スタッフの招待や管理を行うことができます
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowStaffManagement(true)}
            >
              <Text style={styles.primaryButtonText}>🔒 スタッフ管理</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  restrictedText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  passwordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  passwordModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passwordTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  passwordDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  passwordButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  passwordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  listItemMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  listItemMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeUsed: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPending: {
    color: '#92400e',
  },
  statusTextUsed: {
    color: '#065f46',
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
  // スタッフ管理用スタイル
  staffCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  staffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
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
  // モーダル用スタイル
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
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  // ユーザー選択用スタイル
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
});
