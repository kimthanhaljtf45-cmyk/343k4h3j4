import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

interface ActionItem {
  id: string;
  type: 'ABSENCE' | 'PAYMENT' | 'CALL' | 'MESSAGE';
  title: string;
  subtitle: string;
  childId?: string;
  phone?: string;
  priority: 'high' | 'medium' | 'low';
}

interface TodayTraining {
  id: string;
  time: string;
  groupName: string;
  present: number;
  absent: number;
  total: number;
}

interface AtRiskStudent {
  id: string;
  name: string;
  reason: string;
  daysInactive: number;
  groupName: string;
}

export default function CoachDashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [coachData, setCoachData] = useState({
    name: 'Олександр',
    groupsCount: 3,
    studentsCount: 42,
    criticalCount: 2,
    coachScore: 84,
    attendance: 89,
    retention: 78,
    medals: 12,
  });

  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: '1',
      type: 'ABSENCE',
      title: 'Артем Коваленко',
      subtitle: 'Пропустив 3 тренування підряд',
      childId: 'child1',
      phone: '+380501234567',
      priority: 'high',
    },
    {
      id: '2',
      type: 'PAYMENT',
      title: 'Софія Мельник',
      subtitle: 'Заборгованість 7 днів',
      childId: 'child2',
      phone: '+380502345678',
      priority: 'high',
    },
    {
      id: '3',
      type: 'MESSAGE',
      title: 'Ігор Шевченко',
      subtitle: 'Очікує відповіді',
      childId: 'child3',
      priority: 'medium',
    },
  ]);

  const [todayTrainings, setTodayTrainings] = useState<TodayTraining[]>([
    { id: '1', time: '17:00', groupName: 'Молодша група 4-7', present: 10, absent: 2, total: 12 },
    { id: '2', time: '18:30', groupName: 'Самооборона дорослі', present: 14, absent: 4, total: 18 },
  ]);

  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([
    { id: '1', name: 'Артем Коваленко', reason: 'Не відвідує', daysInactive: 5, groupName: 'Молодша група' },
    { id: '2', name: 'Максим Бондар', reason: 'Низька відвідуваність', daysInactive: 0, groupName: 'Самооборона' },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch real data from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (childId: string) => {
    router.push(`/messages/${childId}`);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'ABSENCE': return 'alert-circle';
      case 'PAYMENT': return 'card';
      case 'CALL': return 'call';
      case 'MESSAGE': return 'chatbubble';
      default: return 'ellipse';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Coach Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroName}>{coachData.name}</Text>
          <Text style={styles.heroStats}>
            {coachData.groupsCount} групи • {coachData.studentsCount} учнів • {coachData.criticalCount} критичних
          </Text>
        </View>

        {/* Coach Score / KPI */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiTitle}>Coach Score</Text>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(coachData.coachScore) }]}>
              <Text style={styles.scoreText}>{coachData.coachScore}</Text>
            </View>
          </View>
          <View style={styles.kpiMetrics}>
            <View style={styles.kpiMetric}>
              <Text style={styles.kpiValue}>{coachData.attendance}%</Text>
              <Text style={styles.kpiLabel}>Attendance</Text>
            </View>
            <View style={styles.kpiMetric}>
              <Text style={styles.kpiValue}>{coachData.retention}%</Text>
              <Text style={styles.kpiLabel}>Retention</Text>
            </View>
            <View style={styles.kpiMetric}>
              <Text style={styles.kpiValue}>{coachData.medals}</Text>
              <Text style={styles.kpiLabel}>Медалі</Text>
            </View>
          </View>
        </View>

        {/* Action Queue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Дії сьогодні</Text>
          {actions.map((action) => (
            <View key={action.id} style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <View style={[styles.actionIcon, action.priority === 'high' && styles.actionIconHigh]}>
                  <Ionicons 
                    name={getActionIcon(action.type) as any} 
                    size={18} 
                    color={action.priority === 'high' ? '#fff' : '#666'} 
                  />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => action.childId && handleMessage(action.childId)}
                >
                  <Text style={styles.actionBtnText}>Написати</Text>
                </Pressable>
                {action.phone && (
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={() => handleCall(action.phone!)}
                  >
                    <Text style={styles.actionBtnTextWhite}>Подзвонити</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Today Trainings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сьогодні</Text>
          {todayTrainings.map((training) => (
            <Pressable
              key={training.id}
              style={styles.trainingCard}
              onPress={() => router.push(`/coach/training/${training.id}`)}
            >
              <View style={styles.trainingTime}>
                <Text style={styles.trainingTimeText}>{training.time}</Text>
              </View>
              <View style={styles.trainingInfo}>
                <Text style={styles.trainingName}>{training.groupName}</Text>
                <Text style={styles.trainingStats}>
                  <Text style={{ color: '#22C55E' }}>{training.present} присутні</Text>
                  {' • '}
                  <Text style={{ color: '#EF4444' }}>{training.absent} відсутні</Text>
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

        {/* At Risk Students */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Під загрозою</Text>
          {atRiskStudents.map((student) => (
            <Pressable
              key={student.id}
              style={styles.riskCard}
              onPress={() => router.push(`/coach/student/${student.id}`)}
            >
              <View style={styles.riskIndicator} />
              <View style={styles.riskInfo}>
                <Text style={styles.riskName}>{student.name}</Text>
                <Text style={styles.riskReason}>
                  {student.reason} {student.daysInactive > 0 && `(${student.daysInactive} днів)`}
                </Text>
                <Text style={styles.riskGroup}>{student.groupName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  heroStats: {
    marginTop: 8,
    fontSize: 15,
    color: '#666',
  },
  kpiCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiTitle: {
    fontSize: 18,
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
  kpiMetrics: {
    flexDirection: 'row',
    marginTop: 16,
  },
  kpiMetric: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIconHigh: {
    backgroundColor: '#EF4444',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  actionBtn: {
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionBtnDanger: {
    backgroundColor: '#E30613',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionBtnTextWhite: {
    color: '#fff',
    fontWeight: '600',
  },
  trainingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainingTime: {
    backgroundColor: '#111',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 14,
  },
  trainingTimeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  trainingInfo: {
    flex: 1,
  },
  trainingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  trainingStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskIndicator: {
    width: 8,
    height: 40,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    marginRight: 14,
  },
  riskInfo: {
    flex: 1,
  },
  riskName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  riskReason: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  riskGroup: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});
