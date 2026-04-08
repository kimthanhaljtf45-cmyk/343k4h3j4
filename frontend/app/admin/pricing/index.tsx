import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type PricingPlan = {
  id: string;
  name: string;
  programType: string;
  price: number;
  enabled: boolean;
  description: string;
};

// Mock pricing data - in real app would come from backend
const initialPricing: PricingPlan[] = [
  { id: '1', name: 'Дитяча програма', programType: 'KIDS', price: 2000, enabled: true, description: 'Для дітей від 4 років' },
  { id: '2', name: 'Особлива програма', programType: 'SPECIAL', price: 3000, enabled: true, description: 'Індивідуальний підхід' },
  { id: '3', name: 'Самооборона', programType: 'ADULT_SELF_DEFENSE', price: 2500, enabled: true, description: 'Для дорослих' },
  { id: '4', name: 'Менторство', programType: 'ADULT_PRIVATE', price: 5000, enabled: true, description: 'Персональні заняття' },
];

export default function AdminPricingScreen() {
  const router = useRouter();
  const [pricing, setPricing] = useState<PricingPlan[]>(initialPricing);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  const handleToggle = (id: string) => {
    setPricing(pricing.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleStartEdit = (plan: PricingPlan) => {
    setEditingId(plan.id);
    setEditPrice(plan.price.toString());
  };

  const handleSaveEdit = (id: string) => {
    const newPrice = parseInt(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      Alert.alert('Помилка', 'Введіть коректну ціну');
      return;
    }
    setPricing(pricing.map(p => 
      p.id === id ? { ...p, price: newPrice } : p
    ));
    setEditingId(null);
    Alert.alert('Збережено', 'Тариф оновлено');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#0F0F10" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Тарифи</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionNote}>
          Усі ціни у гривнях за місяць
        </Text>

        {pricing.map((plan) => (
          <View key={plan.id} style={[styles.pricingCard, !plan.enabled && styles.pricingCardDisabled]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDesc}>{plan.description}</Text>
                <Text style={styles.programType}>{plan.programType}</Text>
              </View>
              <Switch
                value={plan.enabled}
                onValueChange={() => handleToggle(plan.id)}
                trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
                thumbColor={plan.enabled ? '#22C55E' : '#9CA3AF'}
              />
            </View>

            <View style={styles.priceSection}>
              {editingId === plan.id ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.priceInput}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    keyboardType="number-pad"
                    autoFocus
                  />
                  <Text style={styles.currency}>грн</Text>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => handleSaveEdit(plan.id)}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setEditingId(null)}
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{plan.price.toLocaleString()} грн</Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleStartEdit(plan)}
                  >
                    <Ionicons name="pencil" size={18} color="#3B82F6" />
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionNote: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pricingCardDisabled: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F0F10',
  },
  planDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  programType: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  priceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F0F10',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  editText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F0F10',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currency: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
