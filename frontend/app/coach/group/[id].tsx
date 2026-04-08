import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

interface Student {
  id: string;
  name: string;
  attendance: number;
  belt?: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  riskStatus: 'ok' | 'warning' | 'risk';
}

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const groupData = {
    id: id as string,
    name: 'Молодша група',
    ageRange: '4-7 років',
    studentsCount: 10,
    maxStudents: 12,
    attendance: 92,
    retention: 88,
    churn: 8,
    trainingsPerWeek: 3,
    schedule: ['Пн 17:00', 'Ср 17:00', 'Пт 17:00'],
  };

  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Артем Коваленко', attendance: 45, belt: 'Білий', paymentStatus: 'overdue', riskStatus: 'risk' },
    { id: '2', name: 'Софія Мельник', attendance: 95, belt: 'Жовтий', paymentStatus: 'paid', riskStatus: 'ok' },
    { id: '3', name: 'Максим Бондар', attendance: 88, belt: 'Білий', paymentStatus: 'paid', riskStatus: 'ok' },
    { id: '4', name: 'Оля Шевченко', attendance: 72, belt: 'Білий', paymentStatus: 'pending', riskStatus: 'warning' },
    { id: '5', name: 'Андрій Лисенко', attendance: 90, belt: 'Помаранчевий', paymentStatus: 'paid', riskStatus: 'ok' },
  ]);

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'ok': return '#22C55E';
      case 'warning': return '#F59E0B';
      case 'risk': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const riskStudents = students.filter(s => s.riskStatus === 'risk').length;
  const warningStudents = students.filter(s => s.riskStatus === 'warning').length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: groupData.name,
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#111" />
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Group Header */}
        <View style={styles.headerCard}>
          <Text style={styles.groupName}>{groupData.name}</Text>
          <Text style={styles.ageRange}>{groupData.ageRange}</Text>
          
          <View style={styles.scheduleRow}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.scheduleText}>{groupData.schedule.join(' • ')}</Text>
          </View>
        </View>

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{groupData.studentsCount}/{groupData.maxStudents}</Text>
            <Text style={styles.kpiLabel}>Учнів</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, groupData.attendance >= 80 ? { color: '#22C55E' } : { color: '#F59E0B' }]}>
              {groupData.attendance}%
            </Text>
            <Text style={styles.kpiLabel}>Attendance</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{groupData.retention}%</Text>
            <Text style={styles.kpiLabel}>Retention</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, groupData.churn > 15 ? { color: '#EF4444' } : {}]}>
              {groupData.churn}%
            </Text>
            <Text style={styles.kpiLabel}>Churn</Text>
          </View>
        </View>

        {/* Risk Summary */}
        {(riskStudents > 0 || warningStudents > 0) && (
          <View style={styles.riskSummary}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.riskSummaryText}>
              {riskStudents > 0 && `${riskStudents} учнів під загрозою`}
              {riskStudents > 0 && warningStudents > 0 && ' • '}
              {warningStudents > 0 && `${warningStudents} потребують уваги`}
            </Text>
          </View>
        )}

        {/* Students List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Учні ({students.length})</Text>
          
          {students.map((student) => (
            <Pressable
              key={student.id}
              style={styles.studentCard}
              onPress={() => router.push(`/coach/student/${student.id}`)}
            >
              <View style={[
                styles.riskIndicator,
                { backgroundColor: getRiskColor(student.riskStatus) }
              ]} />
              
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <View style={styles.studentMeta}>
                  {student.belt && (
                    <View style={styles.beltBadge}>
                      <Text style={styles.beltText}>{student.belt}</Text>
                    </View>
                  )}
                  <Text style={[
                    styles.attendanceText,
                    { color: student.attendance >= 80 ? '#22C55E' : 
                             student.attendance >= 60 ? '#F59E0B' : '#EF4444' }
                  ]}>
                    {student.attendance}%
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#ccc" />
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
  backBtn: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },
  ageRange: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#666',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  riskSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  riskSummaryText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 14,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  beltBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  beltText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
