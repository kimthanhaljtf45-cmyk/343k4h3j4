import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Group {
  id: string;
  name: string;
  ageRange?: string;
  studentsCount: number;
  maxStudents: number;
  attendance: number;
  retention: number;
  churn: number;
  trainingsPerWeek: number;
  status: 'good' | 'warning' | 'risk';
}

export default function CoachGroupsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Молодша група',
      ageRange: '4-7 років',
      studentsCount: 10,
      maxStudents: 12,
      attendance: 92,
      retention: 88,
      churn: 8,
      trainingsPerWeek: 3,
      status: 'good',
    },
    {
      id: '2',
      name: 'Підліткова група',
      ageRange: '13-17 років',
      studentsCount: 14,
      maxStudents: 15,
      attendance: 78,
      retention: 72,
      churn: 18,
      trainingsPerWeek: 4,
      status: 'warning',
    },
    {
      id: '3',
      name: 'Самооборона дорослі',
      ageRange: '18+',
      studentsCount: 16,
      maxStudents: 20,
      attendance: 58,
      retention: 55,
      churn: 32,
      trainingsPerWeek: 3,
      status: 'risk',
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#22C55E';
      case 'warning': return '#F59E0B';
      case 'risk': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'good': return 'Добре';
      case 'warning': return 'Увага';
      case 'risk': return 'Ризик';
      default: return '';
    }
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
        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{groups.length}</Text>
            <Text style={styles.summaryLabel}>Групи</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {groups.reduce((sum, g) => sum + g.studentsCount, 0)}
            </Text>
            <Text style={styles.summaryLabel}>Учнів</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {Math.round(groups.reduce((sum, g) => sum + g.attendance, 0) / groups.length)}%
            </Text>
            <Text style={styles.summaryLabel}>Attendance</Text>
          </View>
        </View>

        {/* Groups List */}
        {groups.map((group) => (
          <Pressable
            key={group.id}
            style={styles.groupCard}
            onPress={() => router.push(`/coach/group/${group.id}`)}
          >
            {/* Header */}
            <View style={styles.groupHeader}>
              <View>
                <Text style={styles.groupName}>{group.name}</Text>
                {group.ageRange && (
                  <Text style={styles.groupAge}>{group.ageRange}</Text>
                )}
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(group.status) + '20' }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(group.status) }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(group.status) }
                ]}>
                  {getStatusText(group.status)}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={18} color="#6B7280" />
                <Text style={styles.statValue}>
                  {group.studentsCount}/{group.maxStudents}
                </Text>
                <Text style={styles.statLabel}>учнів</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={18} color="#6B7280" />
                <Text style={styles.statValue}>{group.trainingsPerWeek}x</Text>
                <Text style={styles.statLabel}>тиждень</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={18} color={group.attendance >= 80 ? '#22C55E' : '#F59E0B'} />
                <Text style={styles.statValue}>{group.attendance}%</Text>
                <Text style={styles.statLabel}>attendance</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trending-down" size={18} color={group.churn > 20 ? '#EF4444' : '#6B7280'} />
                <Text style={[
                  styles.statValue,
                  group.churn > 20 && { color: '#EF4444' }
                ]}>
                  {group.churn}%
                </Text>
                <Text style={styles.statLabel}>churn</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.groupFooter}>
              <Text style={styles.retentionText}>
                Retention: <Text style={{ fontWeight: '700' }}>{group.retention}%</Text>
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </Pressable>
        ))}

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
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  groupAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  retentionText: {
    fontSize: 14,
    color: '#666',
  },
});
