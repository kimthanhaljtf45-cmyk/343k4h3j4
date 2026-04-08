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
import { useRouter } from 'expo-router';

interface DayTraining {
  id: string;
  time: string;
  groupName: string;
  present: number;
  absent: number;
  total: number;
  status: 'completed' | 'upcoming' | 'problem';
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

export default function CoachScheduleScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Mock data for days with trainings
  const trainingDays = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31];
  const problemDays = [12, 19];

  // Mock trainings for selected day
  const [dayTrainings, setDayTrainings] = useState<DayTraining[]>([
    {
      id: '1',
      time: '17:00',
      groupName: 'Молодша група 4-7',
      present: 10,
      absent: 2,
      total: 12,
      status: 'completed',
    },
    {
      id: '2',
      time: '18:30',
      groupName: 'Підліткова група 13-17',
      present: 12,
      absent: 3,
      total: 15,
      status: 'completed',
    },
    {
      id: '3',
      time: '20:00',
      groupName: 'Самооборона дорослі',
      present: 0,
      absent: 0,
      total: 18,
      status: 'upcoming',
    },
  ]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22C55E';
      case 'problem': return '#EF4444';
      case 'upcoming': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Month Header */}
        <View style={styles.monthHeader}>
          <Pressable onPress={prevMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </Pressable>
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <Pressable onPress={nextMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={24} color="#111" />
          </Pressable>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Days grid */}
          <View style={styles.daysGrid}>
            {/* Empty cells for alignment */}
            {emptyDays.map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}

            {/* Day cells */}
            {days.map((day) => {
              const isSelected = selectedDay === day;
              const hasTraining = trainingDays.includes(day);
              const hasProblem = problemDays.includes(day);
              const isToday = day === new Date().getDate() && 
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();

              return (
                <Pressable
                  key={day}
                  style={styles.dayCell}
                  onPress={() => setSelectedDay(day)}
                >
                  <View style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    isToday && !isSelected && styles.dayNumberToday,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {hasProblem ? (
                    <Text style={styles.dayIndicatorProblem}>⚠</Text>
                  ) : hasTraining ? (
                    <Text style={styles.dayIndicator}>●</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Text style={styles.legendDot}>●</Text>
            <Text style={styles.legendText}>Тренування</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendDotProblem}>⚠</Text>
            <Text style={styles.legendText}>Проблеми</Text>
          </View>
        </View>

        {/* Selected Day Trainings */}
        <View style={styles.daySection}>
          <Text style={styles.daySectionTitle}>
            {selectedDay} {MONTHS[currentMonth.getMonth()].toLowerCase()}
          </Text>

          {dayTrainings.length > 0 ? (
            dayTrainings.map((training) => (
              <Pressable
                key={training.id}
                style={styles.trainingCard}
                onPress={() => router.push(`/coach/training/${training.id}`)}
              >
                <View style={styles.trainingLeft}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(training.status) }
                  ]} />
                  <View style={styles.trainingTime}>
                    <Text style={styles.trainingTimeText}>{training.time}</Text>
                  </View>
                </View>
                <View style={styles.trainingInfo}>
                  <Text style={styles.trainingName}>{training.groupName}</Text>
                  {training.status === 'completed' ? (
                    <Text style={styles.trainingStats}>
                      <Text style={{ color: '#22C55E' }}>✓ {training.present}</Text>
                      {' • '}
                      <Text style={{ color: '#EF4444' }}>✗ {training.absent}</Text>
                    </Text>
                  ) : (
                    <Text style={styles.trainingStats}>
                      {training.total} учнів очікується
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={40} color="#ccc" />
              <Text style={styles.emptyDayText}>Тренувань немає</Text>
            </View>
          )}
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthArrow: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberSelected: {
    backgroundColor: '#111',
  },
  dayNumberToday: {
    backgroundColor: '#F3F4F6',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayIndicator: {
    fontSize: 8,
    color: '#111',
    marginTop: 2,
  },
  dayIndicatorProblem: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    fontSize: 10,
    color: '#111',
  },
  legendDotProblem: {
    fontSize: 12,
    color: '#EF4444',
  },
  legendText: {
    fontSize: 13,
    color: '#666',
  },
  daySection: {
    marginTop: 20,
  },
  daySectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 14,
  },
  trainingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  trainingTime: {
    backgroundColor: '#111',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
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
  emptyDay: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
