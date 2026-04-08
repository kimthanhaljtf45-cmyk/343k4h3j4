import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

type TenantPlan = 'START' | 'PRO' | 'AI';

interface Tenant {
  _id: string;
  slug: string;
  name: string;
  brandName?: string;
  plan: TenantPlan;
  isActive: boolean;
  totalStudents: number;
  totalCoaches: number;
  totalRevenue: number;
  monthlyRevenue: number;
  priceMonthly: number;
  ownerEmail?: string;
  ownerPhone?: string;
  city?: string;
  createdAt: string;
}

interface SaasOverview {
  totalTenants: number;
  activeTenants: number;
  byPlan: Record<TenantPlan, number>;
  totalMRR: number;
  totalStudents: number;
}

const PLAN_COLORS: Record<TenantPlan, string> = {
  START: '#6B7280',
  PRO: '#3B82F6',
  AI: '#8B5CF6',
};

const PLAN_LABELS: Record<TenantPlan, string> = {
  START: 'Старт',
  PRO: 'Про',
  AI: 'AI',
};

export default function TenantsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    slug: '',
    name: '',
    brandName: '',
    ownerEmail: '',
    ownerPhone: '',
    plan: 'START' as TenantPlan,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery<SaasOverview>({
    queryKey: ['tenants-overview'],
    queryFn: () => api.get('/tenants/overview'),
  });

  const { data: tenants, isLoading: tenantsLoading, refetch } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newTenant) => api.post('/tenants', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenants-overview'] });
      setShowCreateModal(false);
      setNewTenant({ slug: '', name: '', brandName: '', ownerEmail: '', ownerPhone: '', plan: 'START' });
    },
  });

  const isLoading = overviewLoading || tenantsLoading;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('uk-UA') + ' ₴';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#0F0F10" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Клуби (Tenants)</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={28} color="#E30613" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* SaaS Overview */}
        {overview && (
          <View style={styles.overviewCard}>
            <Text style={styles.overviewTitle}>SaaS Overview</Text>
            
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{overview.totalTenants}</Text>
                <Text style={styles.overviewLabel}>Всього клубів</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={[styles.overviewValue, { color: '#22C55E' }]}>{overview.activeTenants}</Text>
                <Text style={styles.overviewLabel}>Активні</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={[styles.overviewValue, { color: '#3B82F6' }]}>{formatCurrency(overview.totalMRR)}</Text>
                <Text style={styles.overviewLabel}>MRR</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{overview.totalStudents}</Text>
                <Text style={styles.overviewLabel}>Учнів</Text>
              </View>
            </View>

            <View style={styles.plansRow}>
              {(['START', 'PRO', 'AI'] as TenantPlan[]).map(plan => (
                <View key={plan} style={[styles.planBadge, { backgroundColor: PLAN_COLORS[plan] + '20' }]}>
                  <Text style={[styles.planBadgeText, { color: PLAN_COLORS[plan] }]}>
                    {PLAN_LABELS[plan]}: {overview.byPlan?.[plan] || 0}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tenants List */}
        <Text style={styles.sectionTitle}>Список клубів</Text>
        
        {tenants?.map(tenant => (
          <TouchableOpacity
            key={tenant._id}
            style={styles.tenantCard}
            onPress={() => router.push(`/admin/tenants/${tenant._id}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.tenantHeader}>
              <View style={styles.tenantInfo}>
                <Text style={styles.tenantName}>{tenant.name}</Text>
                <Text style={styles.tenantSlug}>@{tenant.slug}</Text>
              </View>
              <View style={[styles.planChip, { backgroundColor: PLAN_COLORS[tenant.plan] }]}>
                <Text style={styles.planChipText}>{tenant.plan}</Text>
              </View>
            </View>

            <View style={styles.tenantStats}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.statText}>{tenant.totalStudents} учнів</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="fitness-outline" size={16} color="#6B7280" />
                <Text style={styles.statText}>{tenant.totalCoaches} тренерів</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="cash-outline" size={16} color="#22C55E" />
                <Text style={[styles.statText, { color: '#22C55E' }]}>
                  {formatCurrency(tenant.monthlyRevenue)}/міс
                </Text>
              </View>
            </View>

            <View style={styles.tenantFooter}>
              <View style={[styles.statusBadge, { backgroundColor: tenant.isActive ? '#DCFCE7' : '#FEE2E2' }]}>
                <View style={[styles.statusDot, { backgroundColor: tenant.isActive ? '#22C55E' : '#EF4444' }]} />
                <Text style={[styles.statusText, { color: tenant.isActive ? '#166534' : '#991B1B' }]}>
                  {tenant.isActive ? 'Активний' : 'Неактивний'}
                </Text>
              </View>
              {tenant.city && <Text style={styles.cityText}>{tenant.city}</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {tenants?.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Немає клубів</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
              <Text style={styles.createBtnText}>Створити перший клуб</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Tenant Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Новий клуб</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Slug (унікальний ID)</Text>
              <TextInput
                style={styles.input}
                value={newTenant.slug}
                onChangeText={text => setNewTenant(prev => ({ ...prev, slug: text.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                placeholder="my-club"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Назва клубу</Text>
              <TextInput
                style={styles.input}
                value={newTenant.name}
                onChangeText={text => setNewTenant(prev => ({ ...prev, name: text }))}
                placeholder="Мій клуб"
              />

              <Text style={styles.inputLabel}>Бренд (опціонально)</Text>
              <TextInput
                style={styles.input}
                value={newTenant.brandName}
                onChangeText={text => setNewTenant(prev => ({ ...prev, brandName: text }))}
                placeholder="АТАКА"
              />

              <Text style={styles.inputLabel}>Email власника</Text>
              <TextInput
                style={styles.input}
                value={newTenant.ownerEmail}
                onChangeText={text => setNewTenant(prev => ({ ...prev, ownerEmail: text }))}
                placeholder="owner@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Телефон власника</Text>
              <TextInput
                style={styles.input}
                value={newTenant.ownerPhone}
                onChangeText={text => setNewTenant(prev => ({ ...prev, ownerPhone: text }))}
                placeholder="+380991234567"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>План</Text>
              <View style={styles.planSelector}>
                {(['START', 'PRO', 'AI'] as TenantPlan[]).map(plan => (
                  <TouchableOpacity
                    key={plan}
                    style={[
                      styles.planOption,
                      newTenant.plan === plan && { backgroundColor: PLAN_COLORS[plan], borderColor: PLAN_COLORS[plan] },
                    ]}
                    onPress={() => setNewTenant(prev => ({ ...prev, plan }))}
                  >
                    <Text style={[styles.planOptionText, newTenant.plan === plan && { color: '#FFF' }]}>
                      {PLAN_LABELS[plan]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, (!newTenant.slug || !newTenant.name) && styles.submitBtnDisabled]}
              onPress={() => createMutation.mutate(newTenant)}
              disabled={!newTenant.slug || !newTenant.name || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Створити клуб</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F0F10',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  overviewItem: {
    width: '50%',
    marginBottom: 12,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F0F10',
  },
  overviewLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 8,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F0F10',
    marginBottom: 12,
  },
  tenantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tenantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F0F10',
  },
  tenantSlug: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  planChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tenantStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tenantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cityText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  createBtn: {
    marginTop: 16,
    backgroundColor: '#E30613',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F0F10',
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  planSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  planOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  planOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  submitBtn: {
    backgroundColor: '#E30613',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
