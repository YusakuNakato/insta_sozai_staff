import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [actualJobTitle, setActualJobTitle] = useState('');
  const [dailyAvailableHours, setDailyAvailableHours] = useState('');
  const [workingHoursStart, setWorkingHoursStart] = useState('');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('ログイン失敗', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('エラー', '表示名、メールアドレス、パスワードは必須です');
      return;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      const additionalInfo = {
        actualJobTitle: actualJobTitle || undefined,
        dailyAvailableHours: dailyAvailableHours ? parseFloat(dailyAvailableHours) : undefined,
        workingHoursStart: workingHoursStart || undefined,
        workingHoursEnd: workingHoursEnd || undefined,
      };

      await signUp(email, password, name, additionalInfo);
      Alert.alert('登録完了', 'アカウントが作成されました');
    } catch (error: any) {
      Alert.alert('登録失敗', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>StaffWorkTracker</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? '新規アカウント登録' : 'ログイン'}
          </Text>

          {isSignUp && (
            <View style={styles.inviteNotice}>
              <Text style={styles.inviteNoticeText}>
                ※ 招待されたメールアドレスでのみ登録できます
              </Text>
            </View>
          )}

          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="表示名（スタッフ名として使用されます）*"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="本職の表示名（例：デザイナー、エンジニア）"
              value={actualJobTitle}
              onChangeText={setActualJobTitle}
              autoCapitalize="words"
            />
          )}

          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="1日の稼働可能時間数（例：8）"
              value={dailyAvailableHours}
              onChangeText={setDailyAvailableHours}
              keyboardType="decimal-pad"
            />
          )}

          {isSignUp && (
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="開始時間（例：09:00）"
                value={workingHoursStart}
                onChangeText={setWorkingHoursStart}
              />
              <Text style={styles.timeSeparator}>〜</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="終了時間（例：18:00）"
                value={workingHoursEnd}
                onChangeText={setWorkingHoursEnd}
              />
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="メールアドレス *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignUp ? 'password-new' : 'password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
          />

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={isSignUp ? handleSignUp : handleLogin}
            >
              <Text style={styles.primaryButtonText}>
                {isSignUp ? '登録' : 'ログイン'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.secondaryButtonText}>
                {isSignUp ? 'ログインに戻る' : '新規登録はこちら'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
  },
  timeSeparator: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inviteNotice: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  inviteNoticeText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 15,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});
