import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Student {
  id: string;
  name: string;
  groupName: string;
  attendance: number;
  belt?: string;
  lastVisit: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  riskStatus: 'ok' | 'warning' | 'risk';
}

export default function CoachStudentsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<string | null>(null);

  const groups = ['Молодша група', 'Підліткова група', 'Самооборона'];

  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Артем Коваленко',
      groupName: 'Молодша група',
      attendance: 45,
      belt: 'Білий',
      lastVisit: '5 днів тому',
      paymentStatus: 'overdue',
      riskStatus: 'risk',
    },
    {
      id: '2',
      name: 'Софія Мельник',
      groupName: 'Молодша група',
      attendance: 92,
      belt: 'Жовтий',
      lastVisit: 'Вчора',
      paymentStatus: 'paid',
      riskStatus: 'ok',
    },
    {
      id: '3',
      name: 'Максим Бондар',
      groupName: 'Підліткова група',
      attendance: 68,
      belt: 'Помаранчевий',
      lastVisit: '3 дні тому',
      paymentStatus: 'pending',
      riskStatus: 'warning',
    },
    {
      id: '4',
      name: 'Олена Шевченко',
      groupName: 'Самооборона',
      attendance: 88,
      lastVisit: 'Сьогодні',
      paymentStatus: 'paid',
      riskStatus: 'ok',
    },
    {
      id: '5',
      name: 'Ігор Петренко',
      groupName: 'Підліткова група',
      attendance: 35,
      belt: 'Білий',
      lastVisit: '8 днів тому',
      paymentStatus: 'overdue',
      riskStatus: 'risk',
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = !filterGroup || student.groupName === filterGroup;
    const matchesRisk = !filterRisk || student.riskStatus === filterRisk;
    return matchesSearch && matchesGroup && matchesRisk;
  });

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'ok': return '#22C55E';
      case 'warning': return '#F59E0B';
      case 'risk': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return { text: 'Оплачено', color: '#22C55E', bg: '#DCFCE7' };
      case 'pending':
        return { text: 'Очікує', color: '#F59E0B', bg: '#FEF3C7' };
      case 'overdue':
        return { text: 'Борг', color: '#EF4444', bg: '#FEE2E2' };
      default:
        return { text: '', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const riskCount = students.filter(s => s.riskStatus === 'risk').length;
  const warningCount = students.filter(s => s.riskStatus === 'warning').length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search & Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Пошук учня..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersRow}
          contentContainerStyle={styles.filtersContent}
        >
          <Pressable
            style={[
              styles.filterChip,
              filterRisk === 'risk' && styles.filterChipActive,
            ]}
            onPress={() => setFilterRisk(filterRisk === 'risk' ? null : 'risk')}
          >
            <View style={[styles.filterDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[
              styles.filterChipText,
              filterRisk === 'risk' && styles.filterChipTextActive,
            ]}>
              Ризик ({riskCount})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              filterRisk === 'warning' && styles.filterChipActive,
            ]}
            onPress={() => setFilterRisk(filterRisk === 'warning' ? null : 'warning')}
          >
            <View style={[styles.filterDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[
              styles.filterChipText,
              filterRisk === 'warning' && styles.filterChipTextActive,
            ]}>
              Увага ({warningCount})
            </Text>
          </Pressable>

          {groups.map((group) => (
            <Pressable
              key={group}
              style={[
                styles.filterChip,
                filterGroup === group && styles.filterChipActive,
              ]}
              onPress={() => setFilterGroup(filterGroup === group ? null : group)}
            >
              <Text style={[
                styles.filterChipText,
                filterGroup === group && styles.filterChipTextActive,
              ]}>
                {group}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Results count */}
        <Text style={styles.resultsCount}>
          {filteredStudents.length} учнів
        </Text>

        {/* Students List */}
        {filteredStudents.map((student) => {
          const paymentBadge = getPaymentBadge(student.paymentStatus);

          return (
            <Pressable
              key={student.id}
              style={styles.studentCard}
              onPress={() => router.push(`/coach/student/${student.id}`)}
            >
              <View style={styles.studentLeft}>
                <View style={[
                  styles.riskIndicator,
                  { backgroundColor: getRiskColor(student.riskStatus) }
                ]} />
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              </View>

              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentGroup}>{student.groupName}</Text>
                <View style={styles.studentMeta}>
                  <Text style={styles.metaText}>
                    <Text style={{
                      color: student.attendance >= 80 ? '#22C55E' :
                             student.attendance >= 60 ? '#F59E0B' : '#EF4444'
                    }}>
                      {student.attendance}%
                    </Text>
                    {' • '}
                    {student.lastVisit}
                  </Text>
                </View>
              </View>

              <View style={styles.studentRight}>
                <View style={[
                  styles.paymentBadge,
                  { backgroundColor: paymentBadge.bg }
                ]}>
                  <Text style={[
                    styles.paymentText,
                    { color: paymentBadge.color }
                  ]}>
                    {paymentBadge.text}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </Pressable>
          );
        })}

        {filteredStudents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Учнів не знайдено</Text>
          </View>
        )}

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
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  filtersRow: {
    marginTop: 12,
  },
  filtersContent: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#111',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskIndicator: {
    width: 4,
    height: 44,
    borderRadius: 2,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  studentGroup: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  studentMeta: {
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  studentRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
