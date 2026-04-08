import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Card, ProgressBar } from '@/components/ui';
import { 
  HeroHeader, 
  CriticalAlertsBlock, 
  PaymentStatusBlock, 
  RetentionBlock, 
  QuickActionsRow,
  ChildrenOverviewBlock,
  NextTrainingBlock,
  MessagesPreviewBlock,
  FeedPreviewBlock,
  UpcomingCompetitionsBlock
} from '@/components/dashboard';
import { CoachRiskListEnhanced } from '@/components/coach';
import { ParentMetaOfferCard, CoachActionQueueEnhanced } from '@/components/metabrain';
import { colors, spacing } from '@/theme';
import { api } from '@/lib/api';
import { useParentInsights } from '@/modules/parent/hooks/useParentInsights';
import type { Child } from '@/types';

// Logo source
const logoSource = require('../../assets/logo.png');

// ============== META HOOKS ==============
function useParentMeta() {
  return useQuery({
    queryKey: ['meta-parent'],
    queryFn: () => api.getMetaParent(),
    staleTime: 60000,
    retry: 1,
  });
}

function useCoachMeta() {
  return useQuery({
    queryKey: ['meta-coach'],
    queryFn: async () => {
      const response = await api.getMetaCoach();
      return {
        ...response,
        items: response?.items || response?.topRisks || [],
        actions: response?.actions || response?.recommendedActions || [],
      };
    },
    staleTime: 30000,
    retry: 1,
  });
}

function useAdminMeta() {
  return useQuery({
    queryKey: ['meta-admin'],
    queryFn: () => api.getMetaAdmin(),
    staleTime: 60000,
    retry: 1,
  });
}

// ============== TYPES ==============
interface ChildInsight {
  childId: string;
  name: string;
  status: 'good' | 'warning' | 'critical';
  discipline: number;
  attendance: number;
  progressPercent: number;
  belt: string;
  nextBelt?: string;
  alerts: Array<{ type: string; title: string; message: string; severity: string }>;
  recommendations: Array<{ type: string; title: string }>;
  monthlyGoal: { target: number; current: number };
  recentAchievements: Array<{ id: string; title: string; type: string }>;
}

export default function HomeScreen() {
  const { user, children, payments, feed, fetchChildren, fetchPayments, fetchFeed, fetchDashboard } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [retention, setRetention] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [nextTrainings, setNextTrainings] = useState<any[]>([]);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadNotificationCount();
      loadAlerts();
    }, [])
  );

  const loadNotificationCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setNotificationCount(response.count || 0);
    } catch (error) {
      console.log('Failed to load notification count');
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await api.getMyAlerts();
      setAlerts(response || []);
    } catch (error) {
      console.log('Failed to load alerts');
    }
  };

  const loadRetention = async () => {
    try {
      const response = await api.getParentRetention();
      setRetention(response);
    } catch (error) {
      console.log('Failed to load retention');
    }
  };

  const loadMessages = async () => {
    try {
      const response = await api.get('/messages/threads');
      const recentMessages = (response || []).slice(0, 3).map((t: any) => ({
        id: t.id || t._id,
        threadId: t.id || t._id,
        sender: t.otherParticipant?.firstName || 'Тренер',
        senderRole: t.otherParticipant?.role || 'COACH',
        text: t.lastMessage?.content || 'Немає повідомлень',
        time: t.lastMessage?.createdAt,
        unread: t.unreadCount > 0,
      }));
      setMessages(recentMessages);
    } catch (error) {
      console.log('Failed to load messages');
    }
  };

  const loadNextTrainings = async () => {
    try {
      const response = await api.get('/schedule/upcoming');
      const trainings = (response || []).slice(0, 2).map((s: any) => ({
        id: s.id || s._id,
        childId: s.childId,
        childName: s.childName || s.child?.firstName || 'Дитина',
        date: s.date,
        time: s.time,
        location: s.location || 'Зал АТАКА',
        groupName: s.groupName,
        coachName: s.coachName,
      }));
      setNextTrainings(trainings);
    } catch (error) {
      console.log('Failed to load next trainings');
    }
  };

  const loadUpcomingCompetitions = async () => {
    try {
      const response = await api.getUpcomingCompetitions(3);
      setUpcomingCompetitions(response || []);
    } catch (error) {
      console.log('Failed to load upcoming competitions');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (user?.role === 'PARENT') {
      await Promise.all([
        fetchChildren(), 
        fetchPayments(), 
        fetchFeed(), 
        loadNotificationCount(),
        loadAlerts(),
        loadRetention(),
        loadMessages(),
        loadNextTrainings(),
        loadUpcomingCompetitions()
      ]);
    } else {
      await fetchDashboard();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Render based on role
  if (user?.role === 'COACH') {
    return <CoachHome onRefresh={onRefresh} refreshing={refreshing} />;
  }
  if (user?.role === 'ADMIN') {
    return <AdminHome onRefresh={onRefresh} refreshing={refreshing} />;
  }
  if (user?.role === 'STUDENT') {
    return <StudentHome />;
  }

  // Default: Parent Home
  return (
    <ParentHomeWithInsights 
      onRefresh={onRefresh} 
      refreshing={refreshing} 
      notificationCount={notificationCount}
      alerts={alerts}
      retention={retention}
      messages={messages}
      nextTrainings={nextTrainings}
      upcomingCompetitions={upcomingCompetitions}
    />
  );
}

// Parent Home with Production-Ready Structure
function ParentHomeWithInsights({ 
  onRefresh, 
  refreshing, 
  notificationCount,
  alerts,
  retention,
  messages,
  nextTrainings,
  upcomingCompetitions
}: { 
  onRefresh: () => void; 
  refreshing: boolean; 
  notificationCount: number;
  alerts: any[];
  retention: any;
  messages: any[];
  nextTrainings: any[];
  upcomingCompetitions: any[];
}) {
  const { user, children, payments, feed } = useStore();
  const { data: insights, isLoading, refetch } = useParentInsights();
  const { data: metaParent, refetch: refetchMeta } = useParentMeta();

  const pendingPayments = payments.filter(p => p.status === 'PENDING');
  const overduePayments = payments.filter(p => p.status === 'OVERDUE');

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchMeta()]);
    await onRefresh();
  };

  // Prepare alerts for CriticalAlertsBlock
  const formattedAlerts = alerts.map(a => ({
    id: a._id || a.id,
    type: a.type,
    title: a.title || a.type,
    message: a.message || '',
    severity: a.severity?.toLowerCase() || 'warning',
    childId: a.childId,
    childName: a.childName,
  }));

  // Get at-risk child from MetaBrain
  const atRiskChild = metaParent?.children?.find(
    (c: any) => c.segment === 'WARNING' || c.segment === 'CHURN_RISK'
  );

  // Get valid offers (not expired)
  const validOffers = metaParent?.offers?.filter((o: any) => {
    if (!o.expiresAt) return true;
    return new Date(o.expiresAt) > new Date();
  }) || [];

  // Calculate total monthly goal
  const totalCurrent = insights?.children?.reduce((acc: number, c: any) => acc + (c.monthlyGoal?.current || 0), 0) || 0;
  const totalTarget = insights?.children?.reduce((acc: number, c: any) => acc + (c.monthlyGoal?.target || 0), 0) || 12;
  const streak = retention?.streak || 0;

  // Prepare children for ChildrenOverviewBlock
  const childrenData = insights?.children?.map((child: ChildInsight) => ({
    id: child.childId,
    name: child.name,
    belt: child.belt || 'Білий',
    nextBelt: child.nextBelt,
    progress: child.progressPercent,
    attendance: child.attendance,
    status: child.status,
    discipline: child.discipline,
  })) || children.map(c => ({
    id: c.id,
    name: c.firstName,
    belt: c.belt || 'Білий',
    progress: 0,
    attendance: c.attendance?.percent || 0,
    status: 'good' as const,
  }));

  // Prepare feed for FeedPreviewBlock
  const feedData = feed.slice(0, 2).map(f => ({
    id: f.id || f._id,
    type: f.type as any || 'news',
    title: f.title,
    subtitle: f.body?.substring(0, 60) || '',
  }));

  // Unread messages count
  const unreadCount = messages.filter(m => m.unread).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Header */}
        <HeroHeader 
          title="АТАКА"
          subtitle="Контроль дітей у школі"
          notificationCount={notificationCount}
          logoSource={logoSource}
        />

        {/* 2. Critical Alerts Block */}
        <View style={styles.section}>
          <CriticalAlertsBlock alerts={formattedAlerts} />
        </View>

        {/* 3. Parent Retention Card (if segment = WARNING or CHURN_RISK) */}
        {atRiskChild && (
          <View style={styles.section}>
            <View style={styles.retentionCard}>
              <View style={styles.retentionHeader}>
                <Ionicons name="warning" size={20} color="#EF4444" />
                <Text style={styles.retentionTitle}>Потребує уваги</Text>
              </View>
              <Text style={styles.retentionChildName}>{atRiskChild.childName}</Text>
              <View style={styles.retentionStats}>
                <View style={styles.retentionStat}>
                  <Text style={styles.retentionStatLabel}>Відвідування</Text>
                  <Text style={styles.retentionStatValue}>{atRiskChild.attendanceRate}%</Text>
                </View>
                <View style={styles.retentionStat}>
                  <Text style={styles.retentionStatLabel}>Пропущено</Text>
                  <Text style={styles.retentionStatValue}>{atRiskChild.missedInRow} підряд</Text>
                </View>
                <View style={styles.retentionStat}>
                  <Text style={styles.retentionStatLabel}>Ризик</Text>
                  <Text style={[styles.retentionStatValue, { color: '#EF4444' }]}>{atRiskChild.riskScore}/100</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 4. Parent Offer Card (if offer exists and not expired) */}
        {validOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.offerCard}>
              <Text style={styles.offerTitle}>{validOffers[0].title}</Text>
              <Text style={styles.offerDescription}>{validOffers[0].description}</Text>
              {validOffers[0].discountLabel && (
                <Text style={styles.offerDiscount}>{validOffers[0].discountLabel}</Text>
              )}
              <TouchableOpacity 
                style={styles.offerButton}
                onPress={() => router.push('/billing')}
              >
                <Text style={styles.offerButtonText}>Скористатися</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 5. Children Overview Block */}
        {isLoading ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : childrenData.length > 0 ? (
          <View style={styles.section}>
            <ChildrenOverviewBlock children={childrenData} />
          </View>
        ) : (
          <View style={styles.section}>
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Дітей не додано</Text>
                <Text style={styles.emptyDesc}>Зверніться до адміністратора</Text>
              </View>
            </Card>
          </View>
        )}

        {/* 4. Next Training Block */}
        {nextTrainings.length > 0 && (
          <View style={styles.section}>
            <NextTrainingBlock trainings={nextTrainings} />
          </View>
        )}

        {/* 4.5. Upcoming Competitions Block */}
        {upcomingCompetitions.length > 0 && (
          <View style={styles.section}>
            <UpcomingCompetitionsBlock competitions={upcomingCompetitions} />
          </View>
        )}

        {/* 5. Retention Block */}
        <View style={styles.section}>
          <RetentionBlock 
            current={totalCurrent}
            target={totalTarget}
            streak={streak}
            recommendation={retention?.recommendations?.[0]?.title}
          />
        </View>

        {/* 6. Payment Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Оплата</Text>
          <PaymentStatusBlock 
            payments={payments.map(p => ({
              id: p.id,
              status: p.status as any,
              amount: p.amount,
              currency: p.currency,
            }))}
          />
        </View>

        {/* 7. Messages Preview Block */}
        {messages.length > 0 && (
          <View style={styles.section}>
            <MessagesPreviewBlock messages={messages} unreadCount={unreadCount} />
          </View>
        )}

        {/* 8. Quick Actions */}
        <View style={styles.section}>
          <QuickActionsRow 
            items={[
              { label: 'Розклад', icon: 'calendar', route: '/(tabs)/schedule' },
              { label: 'Змагання', icon: 'trophy', route: '/competitions', color: '#F59E0B' },
              { label: 'Оплати', icon: 'wallet', route: '/payments', badge: pendingPayments.length + overduePayments.length },
            ]}
          />
        </View>

        {/* 9. Feed Preview Block */}
        {feedData.length > 0 && (
          <View style={styles.section}>
            <FeedPreviewBlock feed={feedData} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Coach Home with Production-Ready Structure
function CoachHome({ onRefresh, refreshing }: { onRefresh: () => void; refreshing: boolean }) {
  const { user } = useStore();
  const { data: metaCoachData, refetch: refetchMeta } = useCoachMeta();
  const [actions, setActions] = useState<any>(null);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    try {
      const [actionsData, scheduleData, risksData] = await Promise.all([
        api.getCoachActions().catch(() => null),
        api.get('/schedule/coach/today').catch(() => ({ schedules: [] })),
        api.get('/retention/coach/risks').catch(() => []),
      ]);
      
      setActions(actionsData);
      setTodaySchedule(scheduleData?.schedules || []);
      setAtRiskStudents(risksData?.slice(0, 5) || []);
    } catch (error) {
      console.log('Failed to load coach data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadCoachData();
    await refetchMeta();
    onRefresh();
  };

  const handleMessageStudent = (student: any) => {
    // Navigate to messages with pre-filled recipient
    router.push({
      pathname: '/messages',
      params: { recipientId: student.parentId || student.id }
    });
  };

  const handleCallStudent = (student: any) => {
    if (student.parentPhone) {
      const phoneNumber = student.parentPhone.replace(/\D/g, '');
      Linking.openURL(`tel:+${phoneNumber}`).catch(() => {
        Alert.alert('Помилка', 'Не вдалося здійснити дзвінок');
      });
    } else {
      Alert.alert('Немає номера', 'Телефон батьків не вказано');
    }
  };

  // Handler for completing action from CoachActionQueueEnhanced
  const handleActionComplete = async (actionId: string) => {
    try {
      await api.completeCoachAction(actionId);
      Alert.alert('Успішно', 'Дію позначено як виконану');
      // Reload data
      await loadCoachData();
      await refetchMeta();
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося виконати дію');
    }
  };

  const groupsCount = todaySchedule.length;
  const studentsCount = todaySchedule.reduce((acc: number, s: any) => acc + (s.childrenCount || 0), 0);

  // Transform meta actions for CoachActionQueueEnhanced
  const formattedActions = (metaCoachData?.recommendedActions || metaCoachData?.actions || actions?.items || []).map((a: any) => ({
    id: a._id || a.id,
    childId: a.childId,
    childName: a.childName || a.name,
    action: a.action || a.message || a.title,
    actionType: a.actionType || a.type,
    priority: a.priority || a.severity || 'MEDIUM',
    parentId: a.parentId,
    parentPhone: a.parentPhone,
    parentName: a.parentName,
  }));

  // Transform at-risk students for enhanced component
  const riskStudentsFormatted = (metaCoachData?.items || metaCoachData?.topRisks || atRiskStudents).map((s: any) => ({
    id: s.id || s.childId || s._id,
    childId: s.childId,
    name: s.name || s.childName,
    childName: s.childName || s.name,
    segment: s.segment || (s.status === 'critical' ? 'CHURN_RISK' : s.status === 'warning' ? 'WARNING' : 'ACTIVE'),
    reason: s.reason || s.message || (s.signals?.join(', ')) || 'Потребує уваги',
    parentPhone: s.parentPhone,
    parentName: s.parentName,
    riskScore: s.riskScore || s.risk,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Coach Hero */}
        <View style={styles.coachHero}>
          <Image source={logoSource} style={styles.logoSmall} resizeMode="contain" />
          <View style={styles.coachHeroInfo}>
            <Text style={styles.coachName}>{user?.firstName || 'Тренер'}</Text>
            <Text style={styles.coachStats}>
              {metaCoachData?.totalStudents || studentsCount} учнів • {metaCoachData?.criticalCount || 0} критичних
            </Text>
          </View>
        </View>

        {/* Coach Action Queue with Write/Call/Complete buttons */}
        {formattedActions.length > 0 && (
          <View style={styles.section}>
            <CoachActionQueueEnhanced
              actions={formattedActions.slice(0, 5)}
              onActionComplete={handleActionComplete}
              onMessagePress={(action) => handleMessageStudent(action)}
              onCallPress={(action) => handleCallStudent(action)}
            />
          </View>
        )}

        {/* At Risk Students Block - Enhanced with Call/Message buttons */}
        {riskStudentsFormatted.length > 0 && (
          <View style={styles.section}>
            <CoachRiskListEnhanced 
              students={riskStudentsFormatted}
              onMessagePress={handleMessageStudent}
              onCallPress={handleCallStudent}
            />
          </View>
        )}

        {/* Today's Schedule Block */}
        {todaySchedule.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Сьогодні</Text>
            {todaySchedule.map((training: any) => (
              <TouchableOpacity
                key={training.id || training._id}
                style={styles.scheduleCard}
                onPress={() => router.push(`/coach/attendance/${training.id}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.scheduleGroupName}>{training.groupName}</Text>
                <Text style={styles.scheduleTime}>{training.time}</Text>
                <Text style={styles.scheduleLocation}>{training.childrenCount} учнів</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.section}>
          <QuickActionsRow 
            items={[
              { label: 'Дії', icon: 'checkbox', route: '/coach/actions' },
              { label: 'Групи', icon: 'people', route: '/coach' },
              { label: 'Повідомлення', icon: 'chatbubble', route: '/messages' },
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Admin Home
function AdminHome({ onRefresh, refreshing }: { onRefresh: () => void; refreshing: boolean }) {
  const { user } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [billingStats, setBillingStats] = useState<any>(null);
  const [metaInsights, setMetaInsights] = useState<any>(null);
  const [leads, setLeads] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [retentionStats, billing, meta, leadsData, groupsData] = await Promise.all([
        api.getRetentionStats().catch(() => null),
        api.get('/billing/stats').catch(() => null),
        api.get('/meta/admin').catch(() => null),
        api.get('/consultation/board').catch(() => null),
        api.get('/admin/groups').catch(() => []),
      ]);
      setStats(retentionStats);
      setBillingStats(billing);
      setMetaInsights(meta);
      setLeads(leadsData?.stats);
      setGroups(groupsData?.slice(0, 3) || []);
      
      // Extract alerts from meta insights
      if (meta?.topRisks) {
        const riskAlerts = meta.topRisks
          .filter((r: any) => r.status === 'critical' || r.status === 'warning')
          .slice(0, 3)
          .map((r: any) => ({
            id: r.childId,
            title: `${r.name} - ${r.status === 'critical' ? 'Критичний ризик' : 'Потребує уваги'}`,
            description: r.signals.join(', '),
            severity: r.status,
          }));
        setAlerts(riskAlerts);
      }
    } catch (error) {
      console.log('Failed to load admin stats');
    }
  };

  const totalStudents = metaInsights?.summary?.totalStudents || stats?.totalActive || 0;
  const activeStudents = metaInsights?.summary?.healthyStudents || stats?.goodEngagement || 0;
  const riskStudents = (metaInsights?.summary?.criticalRisks || 0) + (metaInsights?.summary?.warningRisks || 0);
  
  const totalRevenue = metaInsights?.revenue?.total || 0;
  const pendingRevenue = metaInsights?.revenue?.pending || billingStats?.pending || 0;
  const overdueRevenue = metaInsights?.revenue?.overdue || billingStats?.overdue || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { await loadAdminData(); onRefresh(); }} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Hero */}
        <View style={styles.adminHero}>
          <Image source={logoSource} style={styles.logoSmall} resizeMode="contain" />
          <View style={styles.adminHeroInfo}>
            <Text style={styles.adminTitle}>Панель управління</Text>
            <Text style={styles.adminSubtitle}>
              {totalStudents} учнів • {totalRevenue.toLocaleString()} ₴
            </Text>
          </View>
        </View>

        {/* Critical Alerts Block */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Потребують уваги</Text>
            {alerts.map((alert: any) => (
              <View 
                key={alert.id} 
                style={[
                  styles.alertCard,
                  alert.severity === 'critical' && styles.alertCardCritical
                ]}
              >
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Business Metrics Block */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Учні</Text>
          <View style={styles.adminStatsRow}>
            <View style={styles.adminStatBox}>
              <Text style={styles.adminStatValue}>{totalStudents}</Text>
              <Text style={styles.adminStatLabel}>Всього</Text>
            </View>
            <View style={[styles.adminStatBox, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.adminStatValue, { color: '#22C55E' }]}>{activeStudents}</Text>
              <Text style={styles.adminStatLabel}>Активних</Text>
            </View>
            <View style={[styles.adminStatBox, { backgroundColor: '#FEF2F2' }]}>
              <Text style={[styles.adminStatValue, { color: '#EF4444' }]}>{riskStudents}</Text>
              <Text style={styles.adminStatLabel}>У ризику</Text>
            </View>
          </View>
        </View>

        {/* Revenue Block */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Фінанси</Text>
          <View style={styles.revenueCard}>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Оплачено</Text>
              <Text style={[styles.revenueValue, { color: '#22C55E' }]}>{totalRevenue.toLocaleString()} ₴</Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Очікує</Text>
              <Text style={[styles.revenueValue, { color: '#F59E0B' }]}>{pendingRevenue.toLocaleString()} ₴</Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Прострочено</Text>
              <Text style={[styles.revenueValue, { color: '#EF4444' }]}>{overdueRevenue.toLocaleString()} ₴</Text>
            </View>
            {metaInsights?.revenue?.atRisk > 0 && (
              <View style={[styles.revenueRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
                <Text style={styles.revenueLabel}>Під ризиком втрати</Text>
                <Text style={[styles.revenueValue, { color: '#DC2626' }]}>{metaInsights.revenue.atRisk.toLocaleString()} ₴</Text>
              </View>
            )}
          </View>
        </View>

        {/* Retention Block */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Утримання</Text>
            <View style={styles.adminStatsRow}>
              <View style={[styles.adminStatBox, { backgroundColor: '#F0FDF4' }]}>
                <Text style={[styles.adminStatValue, { color: '#22C55E' }]}>{stats.goodEngagement || 0}</Text>
                <Text style={styles.adminStatLabel}>Good</Text>
              </View>
              <View style={[styles.adminStatBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.adminStatValue, { color: '#F59E0B' }]}>{stats.warningEngagement || 0}</Text>
                <Text style={styles.adminStatLabel}>Warning</Text>
              </View>
              <View style={[styles.adminStatBox, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.adminStatValue, { color: '#EF4444' }]}>{stats.criticalEngagement || 0}</Text>
                <Text style={styles.adminStatLabel}>Critical</Text>
              </View>
            </View>
          </View>
        )}

        {/* Groups Performance Block */}
        {groups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Групи</Text>
            {groups.map((g: any) => (
              <View key={g.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupName}>{g.name}</Text>
                  <Text style={styles.groupStudents}>{g.students} учнів</Text>
                </View>
                <Text style={styles.groupStats}>
                  Attendance: {g.attendanceRate}% • Дисципліна: {g.discipline}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Lead Pipeline Preview */}
        {leads && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ліди</Text>
            <View style={styles.leadsCard}>
              <View style={styles.leadRow}>
                <Text style={styles.leadLabel}>Нові</Text>
                <Text style={styles.leadValue}>{leads.newCount || 0}</Text>
              </View>
              <View style={styles.leadRow}>
                <Text style={styles.leadLabel}>Контакт</Text>
                <Text style={styles.leadValue}>{leads.contactedCount || 0}</Text>
              </View>
              <View style={styles.leadRow}>
                <Text style={styles.leadLabel}>Пробні</Text>
                <Text style={styles.leadValue}>{leads.bookedCount || 0}</Text>
              </View>
              <View style={styles.leadRow}>
                <Text style={styles.leadLabel}>Конверсія</Text>
                <Text style={[styles.leadValue, { color: '#22C55E' }]}>{leads.conversionRate || 0}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* AI Predictions */}
        {metaInsights?.predictions && metaInsights.predictions.churnCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Прогнози</Text>
            <View style={styles.predictionCard}>
              <Text style={styles.predictionTitle}>Ризик відтоку</Text>
              <Text style={styles.predictionValue}>
                {metaInsights.predictions.churnCount} учнів ({Math.round(metaInsights.predictions.churnProbability * 100)}%)
              </Text>
              <Text style={styles.predictionLoss}>
                Можлива втрата: {metaInsights.predictions.expectedRevenueLoss.toLocaleString()} ₴
              </Text>
            </View>
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.section}>
          <QuickActionsRow 
            items={[
              { label: 'Оплати', icon: 'wallet', route: '/payments' },
              { label: 'Ліди', icon: 'people', route: '/consultation' },
              { label: 'Групи', icon: 'grid', route: '/(tabs)/schedule' },
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Student Home
function StudentHome() {
  const { user } = useStore();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.placeholder}>
        <Image source={logoSource} style={styles.logoLarge} resizeMode="contain" />
        <Text style={styles.placeholderTitle}>Привіт, {user?.firstName}!</Text>
        <Text style={styles.placeholderDesc}>Кабінет учня</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  loadingSection: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Coach styles
  coachHero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  logoSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  coachHeroInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  coachStats: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  actionCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  actionCardCritical: {
    backgroundColor: '#FEF2F2',
  },
  actionCardWarning: {
    backgroundColor: '#FFFBEB',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  actionMessage: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  actionButton: {
    marginTop: 10,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scheduleCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  scheduleGroupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  scheduleLocation: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  riskCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    marginBottom: 8,
  },
  riskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  riskReason: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  // Admin styles
  adminStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adminStatBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  adminStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
  },
  adminStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // Student placeholder
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  logoLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
  },
  placeholderDesc: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  // Admin Dashboard Additional Styles
  adminHero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  adminHeroInfo: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  adminSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  alertCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    marginBottom: 8,
  },
  alertCardCritical: {
    backgroundColor: '#FEF2F2',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  alertDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  revenueCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  revenueValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  groupCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  groupStudents: {
    fontSize: 13,
    color: '#6B7280',
  },
  groupStats: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  leadsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  leadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leadLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  leadValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  predictionCard: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginTop: 4,
  },
  predictionLoss: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  // Parent Retention Card styles
  retentionCard: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  retentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  retentionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  retentionChildName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F0F10',
    marginBottom: 12,
  },
  retentionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  retentionStat: {
    alignItems: 'center',
  },
  retentionStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  retentionStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F0F10',
  },
  // Parent Offer Card styles
  offerCard: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 6,
  },
  offerDescription: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 12,
  },
  offerDiscount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 12,
  },
  offerButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  offerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
