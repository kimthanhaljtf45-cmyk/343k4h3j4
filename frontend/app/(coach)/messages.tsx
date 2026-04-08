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

type MessageFilter = 'all' | 'parents' | 'system' | 'critical';

interface Message {
  id: string;
  senderName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  type: 'parent' | 'system' | 'critical';
  childName?: string;
}

export default function CoachMessagesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<MessageFilter>('all');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderName: 'Система',
      lastMessage: 'Артем Коваленко пропустив 3 тренування',
      timestamp: '10 хв',
      unread: true,
      type: 'critical',
    },
    {
      id: '2',
      senderName: 'Оксана Коваленко',
      childName: 'мама Артема',
      lastMessage: 'Добрий день! Чи можемо перенести тренування?',
      timestamp: '1 год',
      unread: true,
      type: 'parent',
    },
    {
      id: '3',
      senderName: 'Система',
      lastMessage: 'Софія Мельник готова до атестації',
      timestamp: '3 год',
      unread: false,
      type: 'system',
    },
    {
      id: '4',
      senderName: 'Віктор Бондар',
      childName: 'батько Максима',
      lastMessage: 'Дякую за інформацію про змагання',
      timestamp: 'Вчора',
      unread: false,
      type: 'parent',
    },
    {
      id: '5',
      senderName: 'Система',
      lastMessage: 'Нагадування: оплата Ігора Петренка прострочена 7 днів',
      timestamp: 'Вчора',
      unread: false,
      type: 'critical',
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'all') return true;
    if (filter === 'parents') return msg.type === 'parent';
    if (filter === 'system') return msg.type === 'system';
    if (filter === 'critical') return msg.type === 'critical';
    return true;
  });

  const getUnreadCount = (type: MessageFilter) => {
    if (type === 'all') return messages.filter(m => m.unread).length;
    if (type === 'parents') return messages.filter(m => m.type === 'parent' && m.unread).length;
    if (type === 'system') return messages.filter(m => m.type === 'system' && m.unread).length;
    if (type === 'critical') return messages.filter(m => m.type === 'critical' && m.unread).length;
    return 0;
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'parent': return 'person';
      case 'system': return 'notifications';
      case 'critical': return 'warning';
      default: return 'chatbubble';
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'parent': return '#E0F2FE';
      case 'system': return '#F3F4F6';
      case 'critical': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'parent': return '#0284C7';
      case 'system': return '#6B7280';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const filters: { key: MessageFilter; label: string }[] = [
    { key: 'all', label: 'Всі' },
    { key: 'parents', label: 'Батьки' },
    { key: 'system', label: 'Системні' },
    { key: 'critical', label: 'Критичні' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {filters.map((f) => {
          const count = getUnreadCount(f.key);
          const isActive = filter === f.key;

          return (
            <Pressable
              key={f.key}
              style={[
                styles.filterTab,
                isActive && styles.filterTabActive,
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[
                styles.filterTabText,
                isActive && styles.filterTabTextActive,
              ]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[
                  styles.badge,
                  isActive && styles.badgeActive,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    isActive && styles.badgeTextActive,
                  ]}>
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredMessages.map((message) => (
          <Pressable
            key={message.id}
            style={[
              styles.messageCard,
              message.unread && styles.messageCardUnread,
            ]}
            onPress={() => router.push(`/messages/${message.id}`)}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: getIconBg(message.type) }
            ]}>
              <Ionicons
                name={getMessageIcon(message.type) as any}
                size={20}
                color={getIconColor(message.type)}
              />
            </View>

            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={[
                  styles.senderName,
                  message.unread && styles.senderNameUnread,
                ]}>
                  {message.senderName}
                </Text>
                <Text style={styles.timestamp}>{message.timestamp}</Text>
              </View>
              {message.childName && (
                <Text style={styles.childName}>{message.childName}</Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  message.unread && styles.messageTextUnread,
                ]}
                numberOfLines={2}
              >
                {message.lastMessage}
              </Text>
            </View>

            {message.unread && <View style={styles.unreadDot} />}
          </Pressable>
        ))}

        {filteredMessages.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Повідомлень немає</Text>
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
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#111',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: '#E30613',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  badgeTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageCardUnread: {
    backgroundColor: '#FFFBEB',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  senderNameUnread: {
    fontWeight: '700',
  },
  childName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  messageText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 20,
  },
  messageTextUnread: {
    color: '#374151',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E30613',
    marginLeft: 8,
    marginTop: 4,
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
