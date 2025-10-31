import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { TaskReportForm } from '../components/TaskReport/TaskReportForm';
import { TaskListScreen } from '../components/TaskReport/TaskListScreen';
import { KnowledgeDatabase } from '../components/Knowledge/KnowledgeDatabase';
import { DirectorAuthWrapper } from '../components/Director/DirectorAuthWrapper';
import { AnalyticsDashboard } from '../components/Analytics/AnalyticsDashboard';
import { HomeScreen } from '../components/Home/HomeScreen';
import EnhancedDashboard from '../components/Instagram/EnhancedDashboard';
import { SettingsScreen } from '../components/Settings/SettingsScreen';
import { LoginScreen } from '../components/Auth/LoginScreen';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';

const Drawer = createDrawerNavigator();

const MainDrawer: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#FFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
        },
        headerRight: () => (
          <View style={styles.headerRight}>
            <Text style={styles.userInfo}>
              {user?.name} ({user?.role === 'admin' ? '管理者' : 'スタッフ'})
            </Text>
            <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
              <Text style={styles.logoutText}>ログアウト</Text>
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          drawerLabel: '🏠 ホーム',
        }}
      />

      <Drawer.Screen
        name="DailyReport"
        component={TaskReportForm}
        options={{
          title: '日報入力',
          drawerLabel: '📝 日報入力',
        }}
      />

      <Drawer.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{
          title: '稼働状況',
          drawerLabel: '📋 稼働状況',
        }}
      />

      <Drawer.Screen
        name="KnowledgeDB"
        component={KnowledgeDatabase}
        options={{
          title: 'データベース',
          drawerLabel: '💡 データベース',
        }}
      />

      <Drawer.Screen
        name="Dashboard"
        component={EnhancedDashboard}
        options={{
          title: 'ダッシュボード',
          drawerLabel: '📊 ダッシュボード',
        }}
      />

      <Drawer.Screen
        name="DirectorEvaluation"
        component={DirectorAuthWrapper}
        options={{
          title: '管理者専用',
          drawerLabel: '🔒 管理者専用',
          drawerItemStyle: {
            opacity: 0.7,
          },
        }}
      />

      {user?.role === 'admin' && (
        <Drawer.Screen
          name="Analytics"
          component={AnalyticsDashboard}
          options={{
            title: '分析',
            drawerLabel: '📊 分析',
          }}
        />
      )}

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '設定',
          drawerLabel: '⚙️ 設定',
          drawerItemStyle: {
            marginTop: 'auto',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: '#E0E0E0',
          },
        }}
      />
    </Drawer.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainDrawer /> : <LoginScreen />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    gap: 10,
  },
  userInfo: {
    fontSize: 12,
    color: '#FFF',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
