import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '@/theme';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { Schedule } from '@/types';

export default function ScheduleScreen() {
  const { schedule, fetchSchedule, isLoading } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  };

  // Group schedule by date
  const groupedSchedule = useMemo(() => {
    const groups: Record<string, Schedule[]> = {};
    
    schedule.forEach((item) => {
      const date = item.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    // Sort by time within each day
    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return groups;
  }, [schedule]);

  const sortedDates = Object.keys(groupedSchedule).sort();

  const formatDateLabel = (dateStr: string) => {
    try {
      // Handle various date formats
      let date: Date;
      if (!dateStr) {
        return 'Дата невідома';
      }
      
      // Check if it's ISO format or other format
      if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = parseISO(dateStr);
      } else {
        // Try to parse as regular date
        date = new Date(dateStr);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateStr; // Return original string if invalid
      }
      
      if (isToday(date)) return 'Сьогодні';
      if (isTomorrow(date)) return 'Завтра';
      return format(date, 'EEEE, d MMMM', { locale: uk });
    } catch (error) {
      return dateStr || 'Дата невідома';
    }
  };

  // Safe parseISO helper
  const safeParseDateStr = (dateStr: string): Date | null => {
    try {
      if (!dateStr) return null;
      const date = dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
        ? parseISO(dateStr)
        : new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Розклад</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {sortedDates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Розклад порожній</Text>
            <Text style={styles.emptyDesc}>
              Заняття з’являться після призначення дитини в групу
            </Text>
          </View>
        ) : (
          sortedDates.map((date) => {
            const parsedDate = safeParseDateStr(date);
            return (
              <View key={date} style={styles.dateSection}>
                <Text style={[
                  styles.dateLabel,
                  parsedDate && isToday(parsedDate) && styles.dateLabelToday,
                ]}>
                  {formatDateLabel(date)}
                </Text>
                
                {groupedSchedule[date].map((item) => (
                  <ScheduleCard key={item.id} schedule={item} />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScheduleCard({ schedule }: { schedule: Schedule }) {
  return (
    <Card style={styles.scheduleCard} variant="bordered">
      <View style={styles.scheduleTime}>
        <Text style={styles.time}>{schedule.startTime}</Text>
        <Text style={styles.timeSeparator}>-</Text>
        <Text style={styles.time}>{schedule.endTime}</Text>
      </View>
      
      <View style={styles.scheduleInfo}>
        <Text style={styles.groupName}>
          {schedule.group?.name || 'Група'}
        </Text>
        <View style={styles.scheduleDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {schedule.location?.name || 'Зал'}
            </Text>
          </View>
          {schedule.coach && (
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {schedule.coach.firstName}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.absenceBtn}>
        <Ionicons name="close-circle-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  emptyDesc: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing['2xl'],
  },
  dateSection: {
    marginBottom: spacing.xl,
  },
  dateLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  dateLabelToday: {
    color: colors.primary,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  scheduleTime: {
    alignItems: 'center',
    paddingRight: spacing.base,
    borderRightWidth: 2,
    borderRightColor: colors.primary,
    marginRight: spacing.base,
  },
  time: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  timeSeparator: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
  },
  scheduleInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  scheduleDetails: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  absenceBtn: {
    padding: spacing.sm,
  },
});
