import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function StudentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const studentData = {
    id: id as string,
    name: 'Артем Коваленко',
    age: 6,
    groupName: 'Молодша група 4-7',
    belt: 'Білий',
    attendance: 45,
    retention: 'risk',
    parentName: 'Оксана Коваленко',
    parentPhone: '+380501234567',
    lastVisit: '5 днів тому',
    totalTrainings: 24,
    attendedTrainings: 11,
    missedInRow: 3,
    paymentStatus: 'overdue',
    paymentDueDate: '25 липня',
    medals: 0,
    competitions: 0,
    notes: 'Пропуски через хворобу',
  };

  const attendanceHistory = [
    { date: '15 лип', status: 'absent' },
    { date: '13 лип', status: 'absent' },
    { date: '10 лип', status: 'absent' },
    { date: '8 лип', status: 'present' },
    { date: '6 лип', status: 'present' },
    { date: '3 лип', status: 'present' },
    { date: '1 лип', status: 'present' },
  ];

  const handleCall = () => {
    Linking.openURL(`tel:${studentData.parentPhone}`);
  };

  const handleMessage = () => {
    router.push(`/messages/new?parentId=${studentData.id}`);
  };

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'ok': return '#22C55E';
      case 'warning': return '#F59E0B';
      case 'risk': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getRiskText = (status: string) => {
    switch (status) {
      case 'ok': return 'Стабільний';
      case 'warning': return 'Потребує уваги';
      case 'risk': return 'Під загрозою';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Учень',
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#111" />
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Student Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {studentData.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.studentName}>{studentData.name}</Text>
          <Text style={styles.studentAge}>{studentData.age} років</Text>
          
          <View style={[
            styles.riskBadge,
            { backgroundColor: getRiskColor(studentData.retention) + '20' }
          ]}>
            <View style={[
              styles.riskDot,
              { backgroundColor: getRiskColor(studentData.retention) }
            ]} />
            <Text style={[
              styles.riskText,
              { color: getRiskColor(studentData.retention) }
            ]}>
              {getRiskText(studentData.retention)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.infoText}>{studentData.groupName}</Text>
          </View>
          {studentData.belt && (
            <View style={styles.infoRow}>
              <Ionicons name="ribbon" size={16} color="#666" />
              <Text style={styles.infoText}>Пояс: {studentData.belt}</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Написати</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Подзвонити</Text>
          </Pressable>
        </View>

        {/* Parent Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Батьки</Text>
          <View style={styles.parentCard}>
            <Ionicons name="person" size={20} color="#666" />
            <View style={styles.parentInfo}>
              <Text style={styles.parentName}>{studentData.parentName}</Text>
              <Text style={styles.parentPhone}>{studentData.parentPhone}</Text>
            </View>
          </View>
        </View>

        {/* KPI */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={[
              styles.kpiValue,
              { color: studentData.attendance >= 80 ? '#22C55E' : 
                       studentData.attendance >= 60 ? '#F59E0B' : '#EF4444' }
            ]}>
              {studentData.attendance}%
            </Text>
            <Text style={styles.kpiLabel}>Attendance</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{studentData.attendedTrainings}/{studentData.totalTrainings}</Text>
            <Text style={styles.kpiLabel}>Тренувань</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, studentData.missedInRow >= 3 ? { color: '#EF4444' } : {}]}>
              {studentData.missedInRow}
            </Text>
            <Text style={styles.kpiLabel}>Пропусків підряд</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{studentData.medals}</Text>
            <Text style={styles.kpiLabel}>Медалі</Text>
          </View>
        </View>

        {/* Payment Status */}
        {studentData.paymentStatus !== 'paid' && (
          <View style={[
            styles.alertCard,
            studentData.paymentStatus === 'overdue' ? styles.alertDanger : styles.alertWarning
          ]}>
            <Ionicons 
              name="card" 
              size={20} 
              color={studentData.paymentStatus === 'overdue' ? '#EF4444' : '#F59E0B'} 
            />
            <View style={styles.alertContent}>
              <Text style={[
                styles.alertTitle,
                { color: studentData.paymentStatus === 'overdue' ? '#EF4444' : '#F59E0B' }
              ]}>
                {studentData.paymentStatus === 'overdue' ? 'Заборгованість' : 'Очікує оплати'}
              </Text>
              <Text style={styles.alertSubtitle}>До {studentData.paymentDueDate}</Text>
            </View>
          </View>
        )}

        {/* Attendance History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Історія відвідувань</Text>
          <View style={styles.historyCard}>
            <View style={styles.historyGrid}>
              {attendanceHistory.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={[
                    styles.historyDot,
                    { backgroundColor: item.status === 'present' ? '#22C55E' : '#EF4444' }
                  ]}>
                    <Ionicons 
                      name={item.status === 'present' ? 'checkmark' : 'close'} 
                      size={12} 
                      color="#fff" 
                    />
                  </View>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Notes */}
        {studentData.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Нотатки</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{studentData.notes}</Text>
            </View>
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
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#374151',
  },
  studentName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },
  studentAge: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnDanger: {
    backgroundColor: '#E30613',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
  },
  parentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  parentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  parentPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  alertDanger: {
    backgroundColor: '#FEE2E2',
  },
  alertWarning: {
    backgroundColor: '#FEF3C7',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  alertSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  historyItem: {
    alignItems: 'center',
    width: 50,
  },
  historyDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
});
