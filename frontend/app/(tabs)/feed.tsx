import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '@/theme';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { FeedPost } from '@/types';

const FILTERS = [
  { key: 'all', label: 'Усі' },
  { key: 'news', label: 'Новини' },
  { key: 'events', label: 'Події' },
];

export default function FeedScreen() {
  const { feed, fetchFeed, isLoading } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed(activeFilter);
    setRefreshing(false);
  };

  const handleFilterChange = async (filter: string) => {
    setActiveFilter(filter);
    await fetchFeed(filter);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Стрічка</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => handleFilterChange(filter.key)}
          >
            <Text
              style={[
                styles.filterLabel,
                activeFilter === filter.key && styles.filterLabelActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {feed.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📰</Text>
            <Text style={styles.emptyTitle}>Немає новин</Text>
            <Text style={styles.emptyDesc}>
              Тут з’являтимуться новини та події клубу
            </Text>
          </View>
        ) : (
          feed.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FeedCard({ post }: { post: FeedPost }) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'NEWS': return { emoji: '📰', label: 'Новина' };
      case 'EVENT': return { emoji: '📅', label: 'Подія' };
      case 'ANNOUNCEMENT': return { emoji: '📢', label: 'Оголошення' };
      case 'RESULT': return { emoji: '🏆', label: 'Результат' };
      default: return { emoji: '📝', label: 'Пост' };
    }
  };

  const typeInfo = getTypeLabel(post.type);
  const publishedDate = post.publishedAt 
    ? format(parseISO(post.publishedAt), 'd MMMM, HH:mm', { locale: uk })
    : '';

  return (
    <Card style={styles.feedCard} variant="bordered">
      <View style={styles.feedHeader}>
        <View style={styles.feedType}>
          <Text style={styles.feedTypeEmoji}>{typeInfo.emoji}</Text>
          <Text style={styles.feedTypeLabel}>{typeInfo.label}</Text>
        </View>
        {post.isPinned && (
          <View style={styles.pinnedBadge}>
            <Text style={styles.pinnedText}>📌</Text>
          </View>
        )}
      </View>

      <Text style={styles.feedTitle}>{post.title}</Text>
      
      {post.body && (
        <Text style={styles.feedBody}>{post.body}</Text>
      )}

      <View style={styles.feedFooter}>
        {post.author && (
          <Text style={styles.feedAuthor}>
            {post.author.firstName} {post.author.lastName}
          </Text>
        )}
        <Text style={styles.feedDate}>{publishedDate}</Text>
      </View>
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
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  filterLabelActive: {
    color: colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
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
  },
  feedCard: {
    marginBottom: spacing.md,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  feedType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  feedTypeEmoji: {
    fontSize: 14,
  },
  feedTypeLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  pinnedBadge: {
    paddingHorizontal: spacing.xs,
  },
  pinnedText: {
    fontSize: 12,
  },
  feedTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  feedBody: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  feedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  feedAuthor: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  feedDate: {
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
  },
});
