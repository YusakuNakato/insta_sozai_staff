import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { inviteEmail, getAllInvitations } from '../../services/invitation.service';
import { InvitedEmail, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export const InviteManagement: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<InvitedEmail[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setRefreshing(true);
    try {
      const data = await getAllInvitations();
      setInvitations(data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setRefreshing(false);
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

    setLoading(true);
    try {
      await inviteEmail(email.trim(), role, user.id);
      Alert.alert('成功', `${email} を招待しました`);
      setEmail('');
      loadInvitations();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>メンバー招待管理</Text>
        <Text style={styles.subtitle}>新しいメンバーを招待できます</Text>
      </View>

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
          style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
          onPress={handleInvite}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.inviteButtonText}>招待を送信</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 招待リスト */}
      <View style={styles.card}>
        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>招待済みメールアドレス</Text>
          <TouchableOpacity onPress={loadInvitations} disabled={refreshing}>
            <Text style={styles.refreshButton}>
              {refreshing ? '更新中...' : '🔄 更新'}
            </Text>
          </TouchableOpacity>
        </View>

        {invitations.length === 0 ? (
          <Text style={styles.emptyText}>招待はまだありません</Text>
        ) : (
          invitations.map((invitation) => (
            <View key={invitation.id} style={styles.invitationItem}>
              <View style={styles.invitationInfo}>
                <Text style={styles.invitationEmail}>{invitation.email}</Text>
                <View style={styles.invitationMeta}>
                  <Text style={styles.invitationRole}>
                    {invitation.role === 'director' ? 'ディレクター' : 'スタッフ'}
                  </Text>
                  <Text style={styles.invitationDate}>
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
    </ScrollView>
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
  inviteButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 20,
  },
  invitationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  invitationMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  invitationRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  invitationDate: {
    fontSize: 12,
    color: '#9ca3af',
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
});
