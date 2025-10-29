import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>ようこそ、{user?.name}さん</Text>
        <Text style={styles.welcomeSubtitle}>
          {user?.role === 'admin' ? '管理者' : 'スタッフ'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 StaffWorkTrackerについて</Text>
        <Text style={styles.description}>
          スタッフの稼働を日報形式で記録し、工数・品質・修正傾向を分析できるアプリケーションです。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 主な機能</Text>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📝</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>日報入力</Text>
            <Text style={styles.featureDescription}>
              最大5つのタスク(タスク名・作成/修正・所要時間)と本日の学びを記録できます
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📊</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>稼働一覧</Text>
            <Text style={styles.featureDescription}>
              記録した日報の一覧を確認できます
            </Text>
          </View>
        </View>

        {user?.role === 'admin' && (
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📈</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>分析ダッシュボード</Text>
              <Text style={styles.featureDescription}>
                スタッフ別・タスク別の集計とグラフを表示します
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 使い方</Text>
        <Text style={styles.stepText}>1. 左側のメニューから「日報入力」を選択</Text>
        <Text style={styles.stepText}>2. タスク情報を入力して登録</Text>
        <Text style={styles.stepText}>3. 「稼働一覧」で記録を確認</Text>
        {user?.role === 'admin' && (
          <Text style={styles.stepText}>4. 「分析」で全体の傾向を確認</Text>
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
  welcomeSection: {
    backgroundColor: '#007AFF',
    padding: 30,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  section: {
    backgroundColor: '#FFF',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stepText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
  },
});
