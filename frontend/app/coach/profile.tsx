import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';

export default function CoachProfileScreen() {
  const router = useRouter();
  const { user, logout } = useStore();

  const coachData = {
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Олександр Петренко',
    role: 'Тренер',
    specialization: 'Бокс • Самооборона • Діти 4+',
    experience: '5 років досвіду',
    groupsCount: 3,
    studentsCount: 42,
    retention: 78,
    attendance: 85,
    coachScore: 84,
    medals: 12,
    ranking: 3,
    totalCoaches: 8,
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: 'Профіль',
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#111" />
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={48} color="#fff" />
          </View>
          <Text style={styles.coachName}>{coachData.name}</Text>
          <Text style={styles.coachRole}>{coachData.role}</Text>
          <Text style={styles.specialization}>{coachData.specialization}</Text>
          <Text style={styles.experience}>{coachData.experience}</Text>
        </View>

        {/* KPI Card */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiTitle}>Показники</Text>
            <View style={[
              styles.scoreBadge,
              { backgroundColor: getScoreColor(coachData.coachScore) }
            ]}>
              <Text style={styles.scoreText}>{coachData.coachScore}</Text>
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <Ionicons name="people" size={24} color="#fff" />
              <Text style={styles.kpiValue}>{coachData.groupsCount}</Text>
              <Text style={styles.kpiLabel}>Групи</Text>
            </View>
            <View style={styles.kpiItem}>
              <Ionicons name="school" size={24} color="#fff" />
              <Text style={styles.kpiValue}>{coachData.studentsCount}</Text>
              <Text style={styles.kpiLabel}>Учні</Text>
            </View>
            <View style={styles.kpiItem}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.kpiValue}>{coachData.attendance}%</Text>
              <Text style={styles.kpiLabel}>Attendance</Text>
            </View>
            <View style={styles.kpiItem}>
              <Ionicons name="trending-up" size={24} color="#fff" />
              <Text style={styles.kpiValue}>{coachData.retention}%</Text>
              <Text style={styles.kpiLabel}>Retention</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.achievementsRow}>
            <View style={styles.achievementItem}>
              <Ionicons name="medal" size={28} color="#FFD700" />
              <Text style={styles.achievementValue}>{coachData.medals}</Text>
              <Text style={styles.achievementLabel}>Медалі</Text>
            </View>
            <View style={styles.achievementItem}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
              <Text style={styles.achievementValue}>#{coachData.ranking}</Text>
              <Text style={styles.achievementLabel}>Рейтинг</Text>
            </View>
          </View>
        </View>

        {/* Coach Score Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Coach Score</Text>
          <Text style={styles.breakdownDescription}>
            Ваш рейтинг розраховується на основі ключових показників
          </Text>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLabel}>
              <Text style={styles.breakdownMetric}>Attendance</Text>
              <Text style={styles.breakdownWeight}>40%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%', backgroundColor: '#22C55E' }]} />
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLabel}>
              <Text style={styles.breakdownMetric}>Retention</Text>
              <Text style={styles.breakdownWeight}>30%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '78%', backgroundColor: '#F59E0B' }]} />
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLabel}>
              <Text style={styles.breakdownMetric}>Змагання</Text>
              <Text style={styles.breakdownWeight}>20%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '92%', backgroundColor: '#22C55E' }]} />
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLabel}>
              <Text style={styles.breakdownMetric}>Виконані дії</Text>
              <Text style={styles.breakdownWeight}>10%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '70%', backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Налаштування</Text>

          <Pressable style={styles.menuItem}>
            <Ionicons name="person-outline" size={22} color="#666" />
            <Text style={styles.menuText}>Особисті дані</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color="#666" />
            <Text style={styles.menuText}>Сповіщення</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="time-outline" size={22} color="#666" />
            <Text style={styles.menuText}>Робочі години</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="business-outline" size={22} color="#666" />
            <Text style={styles.menuText}>Мої клуби</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={22} color="#666" />
            <Text style={styles.menuText}>Допомога</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Вийти</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  backBtn: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  identityCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E30613',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  coachName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
  },
  coachRole: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  experience: {
    fontSize: 14,
    color: '#22C55E',
    marginTop: 4,
    fontWeight: '600',
  },
  kpiCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  kpiTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  scoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiItem: {
    alignItems: 'center',
    flex: 1,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievementItem: {
    alignItems: 'center',
  },
  achievementValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6,
  },
  achievementLabel: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
  },
  breakdownDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownMetric: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  breakdownWeight: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
