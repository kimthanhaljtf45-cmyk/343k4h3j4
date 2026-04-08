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

interface StudentAttendance {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'pending';
}

export default function TrainingAttendanceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const trainingData = {
    id: id as string,
    time: '17:00',
    groupName: 'Молодша група 4-7',
    date: '17 липня 2026',
    total: 12,
  };

  const [students, setStudents] = useState<StudentAttendance[]>([
    { id: '1', name: 'Артем Коваленко', status: 'pending' },
    { id: '2', name: 'Софія Мельник', status: 'present' },
    { id: '3', name: 'Максим Бондар', status: 'present' },
    { id: '4', name: 'Оля Шевченко', status: 'pending' },
    { id: '5', name: 'Андрій Лисенко', status: 'present' },
    { id: '6', name: 'Катя Бойко', status: 'pending' },
    { id: '7', name: 'Денис Кравченко', status: 'absent' },
    { id: '8', name: 'Марія Поліщук', status: 'present' },
    { id: '9', name: 'Ігор Савченко', status: 'pending' },
    { id: '10', name: 'Анна Корнійчук', status: 'present' },
    { id: '11', name: 'Влад Ткаченко', status: 'pending' },
    { id: '12', name: 'Олена Гриценко', status: 'present' },
  ]);

  const toggleAttendance = (studentId: string, newStatus: 'present' | 'absent') => {
    setStudents(prev => 
      prev.map(s => 
        s.id === studentId ? { ...s, status: newStatus } : s
      )
    );
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const pendingCount = students.filter(s => s.status === 'pending').length;

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
  };

  const saveAttendance = () => {
    // TODO: Save to API
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Відвідуваність',
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#111" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={markAllPresent} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Всі присутні</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Training Info */}
        <View style={styles.headerCard}>
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>{trainingData.time}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.groupName}>{trainingData.groupName}</Text>
            <Text style={styles.dateText}>{trainingData.date}</Text>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.statValue}>{presentCount}</Text>
            <Text style={styles.statLabel}>присутні</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.statValue}>{absentCount}</Text>
            <Text style={styles.statLabel}>відсутні</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#9CA3AF' }]} />
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>очікують</Text>
          </View>
        </View>

        {/* Students List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Учні</Text>
          <Text style={styles.listCount}>{students.length}</Text>
        </View>

        {students.map((student) => (
          <View key={student.id} style={styles.studentCard}>
            <View style={styles.studentInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {student.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <Text style={styles.studentName}>{student.name}</Text>
            </View>

            <View style={styles.attendanceButtons}>
              <Pressable
                style={[
                  styles.attendanceBtn,
                  styles.presentBtn,
                  student.status === 'present' && styles.presentBtnActive,
                ]}
                onPress={() => toggleAttendance(student.id, 'present')}
              >
                <Ionicons 
                  name="checkmark" 
                  size={20} 
                  color={student.status === 'present' ? '#fff' : '#22C55E'} 
                />
              </Pressable>
              <Pressable
                style={[
                  styles.attendanceBtn,
                  styles.absentBtn,
                  student.status === 'absent' && styles.absentBtnActive,
                ]}
                onPress={() => toggleAttendance(student.id, 'absent')}
              >
                <Ionicons 
                  name="close" 
                  size={20} 
                  color={student.status === 'absent' ? '#fff' : '#EF4444'} 
                />
              </Pressable>
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <Pressable style={styles.saveBtn} onPress={saveAttendance}>
          <Text style={styles.saveBtnText}>Зберегти</Text>
        </Pressable>
      </View>
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
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeBox: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginRight: 14,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  listCount: {
    fontSize: 16,
    color: '#666',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  presentBtn: {
    borderColor: '#22C55E',
    backgroundColor: '#fff',
  },
  presentBtnActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  absentBtn: {
    borderColor: '#EF4444',
    backgroundColor: '#fff',
  },
  absentBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveBtn: {
    backgroundColor: '#E30613',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
