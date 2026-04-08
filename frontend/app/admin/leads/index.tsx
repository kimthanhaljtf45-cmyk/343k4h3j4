import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../src/lib/api';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';

type Lead = {
  _id: string;
  fullName: string;
  phone: string;
  programType?: string;
  status: 'NEW' | 'CONTACTED' | 'TRIAL' | 'CONVERTED' | 'LOST';
  createdAt: string;
  notes?: string;
};

const stages = [
  { key: 'NEW', label: 'Нові', color: '#3B82F6' },
  { key: 'CONTACTED', label: 'Зв\'\u044fзок', color: '#F59E0B' },
  { key: 'TRIAL', label: 'Пробне', color: '#8B5CF6' },
  { key: 'CONVERTED', label: 'Клієнт', color: '#22C55E' },
  { key: 'LOST', label: 'Втрачено', color: '#EF4444' },
];

function getStageColor(status: string): string {
  return stages.find(s => s.key === status)?.color || '#6B7280';
}

function getStageLabel(status: string): string {
  return stages.find(s => s.key === status)?.label || status;
}

export default function AdminLeadsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');

  // Fetch consultations as leads
  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      // Using consultations endpoint
      const response = await api.client.get('/consultations');
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.client.patch(`/consultations/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
    },
  });

  const handleMoveStage = (lead: Lead, newStatus: string) => {
    Alert.alert(
      'Змінити статус?',
      `${lead.fullName} → ${getStageLabel(newStatus)}`,
      [
        { text: 'Скасувати', style: 'cancel' },
        { text: 'Підтвердити', onPress: () => updateMutation.mutate({ id: lead._id, status: newStatus }) },
      ]
    );
  };

  const filteredLeads = leads?.filter((lead: Lead) => {
    if (filter === 'all') return true;
    return lead.status === filter;
  }) || [];

  const getLeadsCount = (status: string) => {
    return leads?.filter((l: Lead) => l.status === status).length || 0;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#0F0F10" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leads</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stage Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Всі ({leads?.length || 0})
            </Text>
          </TouchableOpacity>
          {stages.map((stage) => (
            <TouchableOpacity
              key={stage.key}
              style={[
                styles.filterBtn,
                filter === stage.key && { backgroundColor: stage.color },
              ]}
              onPress={() => setFilter(stage.key)}
            >
              <Text style={[
                styles.filterText,
                filter === stage.key && styles.filterTextActive,
              ]}>
                {stage.label} ({getLeadsCount(stage.key)})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Leads List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {filteredLeads.map((lead: Lead) => (
          <View key={lead._id} style={styles.leadCard}>
            <View style={styles.leadHeader}>
              <View>
                <Text style={styles.leadName}>{lead.fullName}</Text>
                <Text style={styles.leadPhone}>{lead.phone}</Text>
              </View>
              <View style={[styles.stageBadge, { backgroundColor: getStageColor(lead.status) + '20' }]}>
                <View style={[styles.stageDot, { backgroundColor: getStageColor(lead.status) }]} />
                <Text style={[styles.stageText, { color: getStageColor(lead.status) }]}>
                  {getStageLabel(lead.status)}
                </Text>
              </View>
            </View>

            <View style={styles.leadMeta}>
              {lead.programType && (
                <Text style={styles.programType}>{lead.programType}</Text>
              )}
              <Text style={styles.leadDate}>
                {format(parseISO(lead.createdAt), 'd MMM yyyy', { locale: uk })}
              </Text>
            </View>

            {/* Stage Actions */}
            <View style={styles.stageActions}>
              {stages.map((stage) => (
                <TouchableOpacity
                  key={stage.key}
                  style={[
                    styles.stageBtn,
                    lead.status === stage.key && { backgroundColor: stage.color + '20' },
                  ]}
                  onPress={() => handleMoveStage(lead, stage.key)}
                  disabled={lead.status === stage.key}
                >
                  <View style={[styles.stageBtnDot, { backgroundColor: stage.color }]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickBtn}>
                <Ionicons name="call-outline" size={18} color="#3B82F6" />
              </TouchableOpacity>
              {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
                <TouchableOpacity
                  style={[styles.quickBtn, styles.convertBtn]}
                  onPress={() => handleMoveStage(lead, 'CONVERTED')}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
                  <Text style={styles.convertText}>Convert</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {filteredLeads.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Немає leads</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F0F10',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  filtersScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filters: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterBtnActive: {
    backgroundColor: '#0F0F10',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F0F10',
  },
  leadPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  programType: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  leadDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  stageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stageBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  stageBtnDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 6,
  },
  convertBtn: {
    backgroundColor: '#DCFCE7',
  },
  convertText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#22C55E',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
  },
});
