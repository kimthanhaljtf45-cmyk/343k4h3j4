import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Location {
  _id: string;
  name: string;
  address: string;
  city?: string;
  district?: string;
  imageUrl?: string;
  isActive: boolean;
  capacity?: number;
}

interface Program {
  _id: string;
  name: string;
  description?: string;
  ageFrom: number;
  ageTo: number;
  level: string;
  priceMonthly: number;
  schedule?: string;
}

interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  experience?: number;
  rating?: number;
  avatarUrl?: string;
}

const DISTRICTS = [
  'Всі райони',
  'Центр',
  'Дарницький',
  'Деснянський',
  'Дніпровський',
  'Голосіївський',
  'Оболонський',
  'Печерський',
  'Подільський',
  'Святошинський',
  'Солом\'янський',
  'Шевченківський',
];

export default function MarketplaceScreen() {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState('Всі райони');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'locations' | 'programs' | 'coaches'>('locations');

  const { data: locations, isLoading: locationsLoading, refetch: refetchLocations } = useQuery<Location[]>({
    queryKey: ['marketplace-locations', selectedDistrict],
    queryFn: async () => {
      const params = selectedDistrict !== 'Всі райони' ? `?district=${encodeURIComponent(selectedDistrict)}` : '';
      return api.get(`/marketplace/locations${params}`);
    },
  });

  const { data: programs, isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ['marketplace-programs'],
    queryFn: () => api.get('/marketplace/programs'),
  });

  const { data: coaches, isLoading: coachesLoading } = useQuery<Coach[]>({
    queryKey: ['marketplace-coaches'],
    queryFn: () => api.get('/marketplace/coaches'),
  });

  const isLoading = locationsLoading || programsLoading || coachesLoading;

  const filteredLocations = locations?.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrograms = programs?.filter(prog =>
    prog.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoaches = coaches?.filter(coach =>
    `${coach.firstName} ${coach.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLocationCard = (location: Location) => (
    <TouchableOpacity
      key={location._id}
      style={styles.card}
      onPress={() => router.push(`/marketplace/location/${location._id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.locationIcon}>
          <Ionicons name="location" size={24} color="#E30613" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{location.name}</Text>
          <Text style={styles.cardSubtitle}>{location.address}</Text>
          {location.district && (
            <View style={styles.districtBadge}>
              <Text style={styles.districtText}>{location.district}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.metaText}>до {location.capacity || 50} учнів</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push('/booking' as any)}
        >
          <Text style={styles.bookBtnText}>Записатись</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderProgramCard = (program: Program) => (
    <TouchableOpacity
      key={program._id}
      style={styles.card}
      onPress={() => router.push(`/marketplace/program/${program._id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.locationIcon, { backgroundColor: '#8B5CF620' }]}>
          <Ionicons name="fitness" size={24} color="#8B5CF6" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{program.name}</Text>
          <Text style={styles.cardSubtitle}>
            {program.ageFrom}-{program.ageTo} років • {program.level}
          </Text>
          {program.description && (
            <Text style={styles.description} numberOfLines={2}>{program.description}</Text>
          )}
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>{program.priceMonthly.toLocaleString()} ₴/міс</Text>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push('/booking' as any)}
        >
          <Text style={styles.bookBtnText}>Записатись</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCoachCard = (coach: Coach) => (
    <TouchableOpacity
      key={coach._id}
      style={styles.card}
      onPress={() => router.push(`/marketplace/coach/${coach._id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.locationIcon, { backgroundColor: '#22C55E20' }]}>
          <Ionicons name="person" size={24} color="#22C55E" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{coach.firstName} {coach.lastName}</Text>
          {coach.specialization && (
            <Text style={styles.cardSubtitle}>{coach.specialization}</Text>
          )}
          <View style={styles.coachMeta}>
            {coach.experience && (
              <Text style={styles.metaText}>{coach.experience} років досвіду</Text>
            )}
            {coach.rating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>{coach.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View />
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push('/booking' as any)}
        >
          <Text style={styles.bookBtnText}>Записатись</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#0F0F10" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Знайти зал</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchText}
            placeholder="Пошук..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* District Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {DISTRICTS.map(district => (
          <TouchableOpacity
            key={district}
            style={[
              styles.filterChip,
              selectedDistrict === district && styles.filterChipActive,
            ]}
            onPress={() => setSelectedDistrict(district)}
          >
            <Text style={[
              styles.filterChipText,
              selectedDistrict === district && styles.filterChipTextActive,
            ]}>
              {district}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'locations' && styles.tabActive]}
          onPress={() => setActiveTab('locations')}
        >
          <Ionicons
            name="location"
            size={18}
            color={activeTab === 'locations' ? '#E30613' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'locations' && styles.tabTextActive]}>
            Зали
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'programs' && styles.tabActive]}
          onPress={() => setActiveTab('programs')}
        >
          <Ionicons
            name="fitness"
            size={18}
            color={activeTab === 'programs' ? '#E30613' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'programs' && styles.tabTextActive]}>
            Програми
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'coaches' && styles.tabActive]}
          onPress={() => setActiveTab('coaches')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'coaches' ? '#E30613' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'coaches' && styles.tabTextActive]}>
            Тренери
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetchLocations} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#E30613" style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'locations' && (
              <>
                {filteredLocations?.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="location-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Залів не знайдено</Text>
                  </View>
                ) : (
                  filteredLocations?.map(renderLocationCard)
                )}
              </>
            )}

            {activeTab === 'programs' && (
              <>
                {filteredPrograms?.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="fitness-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Програм не знайдено</Text>
                  </View>
                ) : (
                  filteredPrograms?.map(renderProgramCard)
                )}
              </>
            )}

            {activeTab === 'coaches' && (
              <>
                {filteredCoaches?.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Тренерів не знайдено</Text>
                  </View>
                ) : (
                  filteredCoaches?.map(renderCoachCard)
                )}
              </>
            )}
          </>
        )}

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#1E40AF" />
          <Text style={styles.infoText}>
            Запис та оплата тільки через додаток АТАКА. Це гарантує безпеку та зручність.
          </Text>
        </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#0F0F10',
  },
  filterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#E30613',
  },
  filterChipText: {
    fontSize: 14,
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#E30613',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#E30613',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F0F10',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  districtBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  districtText: {
    fontSize: 11,
    color: '#6B7280',
  },
  coachMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  bookBtn: {
    backgroundColor: '#E30613',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
});
