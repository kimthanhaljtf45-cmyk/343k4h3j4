import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '@/theme';
import { ROLE_LABELS } from '@/constants';

export default function ProfileScreen() {
  const { user, children, logout } = useStore();

  const handleLogout = async () => {
    Alert.alert(
      'Вихід',
      'Ви впевнені, що хочете вийти?',
      [
        { text: 'Скасувати', style: 'cancel' },
        { 
          text: 'Вийти', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Force navigate to welcome
              router.replace('/(auth)/welcome');
            } catch (err) {
              console.error('Logout error:', err);
              // Still try to navigate
              router.replace('/(auth)/welcome');
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0) || 'Г'}
            </Text>
          </View>
          <Text style={styles.name}>
            {user?.firstName || 'Гість'} {user?.lastName || ''}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {ROLE_LABELS[user?.role || 'GUEST']}
            </Text>
          </View>
        </View>

        {/* Stats (for parent) */}
        {user?.role === 'PARENT' && children.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{children.length}</Text>
              <Text style={styles.statLabel}>Дітей</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {children.reduce((acc, c) => acc + (c.attendance?.present || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Тренувань</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {children.reduce((acc, c) => acc + (c.achievements?.length || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Досягнень</Text>
            </View>
          </View>
        )}

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          {user?.role === 'PARENT' && (
            <>
              <Text style={styles.menuTitle}>Моя родина</Text>
              <MenuCard>
                <MenuItem
                  icon="people-outline"
                  title="Мої діти"
                  subtitle={`${children.length} ${children.length === 1 ? 'дитина' : 'дітей'}`}
                  onPress={() => {}}
                />
              </MenuCard>
            </>
          )}

          <Text style={styles.menuTitle}>Активність</Text>
          <MenuCard>
            <MenuItem
              icon="calendar-outline"
              title="Історія тренувань"
              onPress={() => {}}
            />
            <MenuItem
              icon="trophy-outline"
              title="Досягнення"
              onPress={() => {}}
              showBorder
            />
          </MenuCard>

          <Text style={styles.menuTitle}>Фінанси</Text>
          <MenuCard>
            <MenuItem
              icon="card-outline"
              title="Оплата"
              onPress={() => router.push('/billing')}
            />
          </MenuCard>

          {/* Coach Section */}
          {(user?.role === 'COACH' || user?.role === 'ADMIN') && (
            <>
              <Text style={styles.menuTitle}>Тренер</Text>
              <MenuCard>
                <MenuItem
                  icon="fitness-outline"
                  title="Мої тренування"
                  onPress={() => router.push('/coach')}
                />
              </MenuCard>
            </>
          )}

          {/* Admin Section */}
          {user?.role === 'ADMIN' && (
            <>
              <Text style={styles.menuTitle}>Адміністрування</Text>
              <MenuCard>
                <MenuItem
                  icon="settings-outline"
                  title="Admin Panel"
                  onPress={() => router.push('/admin')}
                />
              </MenuCard>
            </>
          )}

          <Text style={styles.menuTitle}>Налаштування</Text>
          <MenuCard>
            <MenuItem
              icon="person-outline"
              title="Особисті дані"
              onPress={() => {}}
            />
            <MenuItem
              icon="notifications-outline"
              title="Сповіщення"
              onPress={() => {}}
              showBorder
            />
            <MenuItem
              icon="help-circle-outline"
              title="Допомога"
              onPress={() => {}}
              showBorder
            />
          </MenuCard>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Вийти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuCard({ children }: { children: React.ReactNode }) {
  return <Card style={styles.menuCard} variant="bordered">{children}</Card>;
}

function MenuItem({ 
  icon, 
  title, 
  subtitle, 
  onPress,
  showBorder = false 
}: { 
  icon: string; 
  title: string; 
  subtitle?: string;
  onPress: () => void;
  showBorder?: boolean;
}) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, showBorder && styles.menuItemBorder]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon as any} size={22} color={colors.primary} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    backgroundColor: colors.background,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.textInverse,
  },
  name: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  roleBadge: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  menuSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  menuTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.text,
  },
  menuItemSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    marginTop: spacing['2xl'],
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.error,
  },
});
