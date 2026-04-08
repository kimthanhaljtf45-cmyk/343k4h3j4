import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { colors } from '@/theme';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: string;
  sportType: string;
  usageType: string;
  sizes: string[];
  colors: string[];
  images: string[];
  stock: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  rating: number;
  reviewsCount: number;
  brand?: string;
  sizeChart?: {
    ageMin?: number;
    ageMax?: number;
    heightMin?: number;
    heightMax?: number;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'ALL', name: 'Все', icon: 'grid' },
  { id: 'EQUIPMENT', name: 'Екіпіровка', icon: 'shield-checkmark' },
  { id: 'UNIFORM', name: 'Форма', icon: 'shirt' },
  { id: 'PROTECTION', name: 'Захист', icon: 'fitness' },
  { id: 'ACCESSORIES', name: 'Аксесуари', icon: 'bag-handle' },
  { id: 'NUTRITION', name: 'Харчування', icon: 'nutrition' },
];

const SPORT_TYPES = [
  { id: 'ALL', name: 'Всі види' },
  { id: 'KARATE', name: 'Карате' },
  { id: 'TAEKWONDO', name: 'Тхеквондо' },
  { id: 'BOXING', name: 'Бокс' },
  { id: 'MMA', name: 'ММА' },
  { id: 'JUDO', name: 'Дзюдо' },
  { id: 'UNIVERSAL', name: 'Універсальне' },
];

const USAGE_TYPES = [
  { id: 'ALL', name: 'Будь-яке' },
  { id: 'TRAINING', name: 'Тренування' },
  { id: 'COMPETITION', name: 'Змагання' },
  { id: 'BOTH', name: 'Універсальне' },
];

export default function ShopScreen() {
  const queryClient = useQueryClient();
  const user = useStore((state) => state.user);
  const setCartItemsCount = useStore((state) => state.setCartItemsCount);
  
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedUsage, setSelectedUsage] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Age picker for recommendations
  const [childAge, setChildAge] = useState<number | null>(null);
  const [childHeight, setChildHeight] = useState<string>('');

  // Fetch products
  const { data: products, isLoading, refetch } = useQuery<Product[]>({
    queryKey: ['shop-products', selectedCategory, selectedSport, selectedUsage, searchQuery, sortBy],
    queryFn: async () => {
      let url = '/shop/products?';
      if (selectedCategory !== 'ALL') url += `category=${selectedCategory}&`;
      if (selectedSport !== 'ALL') url += `sportType=${selectedSport}&`;
      if (selectedUsage !== 'ALL') url += `usageType=${selectedUsage}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      url += `sort=${sortBy}`;
      return api.get(url);
    },
  });

  // Fetch recommendations
  const { data: recommendations } = useQuery<Product[]>({
    queryKey: ['shop-recommendations', childAge, childHeight, selectedSport],
    queryFn: async () => {
      let url = '/shop/products/recommendations?';
      if (childAge) url += `age=${childAge}&`;
      if (childHeight) url += `height=${childHeight}&`;
      if (selectedSport !== 'ALL') url += `sportType=${selectedSport}`;
      return api.get(url);
    },
    enabled: showRecommendations && (!!childAge || !!childHeight),
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (data: { productId: string; quantity: number; size?: string; color?: string }) =>
      api.post('/shop/cart/add', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setCartItemsCount?.(data.items?.length || 0);
      setSelectedProduct(null);
      setSelectedSize('');
      setSelectedColor('');
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products;
  }, [products]);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    if (!user) {
      alert('Увійдіть для додавання в кошик');
      return;
    }
    if (selectedProduct.sizes.length > 0 && !selectedSize) {
      alert('Оберіть розмір');
      return;
    }
    addToCartMutation.mutate({
      productId: selectedProduct._id,
      quantity: 1,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });
  };

  const renderProductCard = (product: Product) => (
    <TouchableOpacity
      key={product._id}
      style={styles.productCard}
      onPress={() => {
        setSelectedProduct(product);
        setSelectedSize('');
        setSelectedColor('');
      }}
    >
      <View style={styles.productImageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image source={{ uri: product.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="shirt-outline" size={40} color="#ccc" />
          </View>
        )}
        {product.isNewArrival && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        {product.oldPrice && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productBrand}>{product.brand || 'АТАКА'}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.productRating}>
          <Ionicons name="star" size={12} color="#FFB800" />
          <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.reviewsText}>({product.reviewsCount})</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{product.price} ₴</Text>
          {product.oldPrice && (
            <Text style={styles.oldPrice}>{product.oldPrice} ₴</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryChip = (cat: Category) => (
    <TouchableOpacity
      key={cat.id}
      style={[
        styles.categoryChip,
        selectedCategory === cat.id && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(cat.id)}
    >
      <Ionicons
        name={cat.icon as any}
        size={16}
        color={selectedCategory === cat.id ? '#fff' : '#666'}
      />
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === cat.id && styles.categoryChipTextActive,
        ]}
      >
        {cat.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Магазин</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowRecommendations(true)}
          >
            <Ionicons name="bulb-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Пошук товарів..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(renderCategoryChip)}
      </ScrollView>

      {/* Products Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.productsContainer}
          contentContainerStyle={styles.productsGrid}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        >
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Товарів не знайдено</Text>
            </View>
          ) : (
            <View style={styles.productsRow}>
              {filteredProducts.map(renderProductCard)}
            </View>
          )}
        </ScrollView>
      )}

      {/* Product Detail Modal */}
      <Modal
        visible={!!selectedProduct}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProduct(null)}
      >
        {selectedProduct && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Деталі товару</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalImageContainer}>
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <Image
                    source={{ uri: selectedProduct.images[0] }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Ionicons name="shirt-outline" size={80} color="#ccc" />
                  </View>
                )}
              </View>

              <View style={styles.modalInfo}>
                <Text style={styles.modalBrand}>{selectedProduct.brand || 'АТАКА'}</Text>
                <Text style={styles.modalName}>{selectedProduct.name}</Text>
                
                <View style={styles.modalRating}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={styles.modalRatingText}>{selectedProduct.rating.toFixed(1)}</Text>
                  <Text style={styles.modalReviewsText}>({selectedProduct.reviewsCount} відгуків)</Text>
                </View>

                <View style={styles.modalPriceRow}>
                  <Text style={styles.modalPrice}>{selectedProduct.price} ₴</Text>
                  {selectedProduct.oldPrice && (
                    <Text style={styles.modalOldPrice}>{selectedProduct.oldPrice} ₴</Text>
                  )}
                </View>

                <Text style={styles.sectionTitle}>Опис</Text>
                <Text style={styles.modalDescription}>{selectedProduct.description}</Text>

                {/* Size Selector */}
                {selectedProduct.sizes.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Розмір</Text>
                    <View style={styles.optionsRow}>
                      {selectedProduct.sizes.map((size) => (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.optionButton,
                            selectedSize === size && styles.optionButtonActive,
                          ]}
                          onPress={() => setSelectedSize(size)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              selectedSize === size && styles.optionTextActive,
                            ]}
                          >
                            {size}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {selectedProduct.sizeChart && (
                      <Text style={styles.sizeHint}>
                        Рекомендовано для віку {selectedProduct.sizeChart.ageMin}-{selectedProduct.sizeChart.ageMax} років
                        {selectedProduct.sizeChart.heightMin && (
                          `, зріст ${selectedProduct.sizeChart.heightMin}-${selectedProduct.sizeChart.heightMax} см`
                        )}
                      </Text>
                    )}
                  </>
                )}

                {/* Color Selector */}
                {selectedProduct.colors.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Колір</Text>
                    <View style={styles.optionsRow}>
                      {selectedProduct.colors.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.optionButton,
                            selectedColor === color && styles.optionButtonActive,
                          ]}
                          onPress={() => setSelectedColor(color)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              selectedColor === color && styles.optionTextActive,
                            ]}
                          >
                            {color}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {/* Stock Info */}
                <View style={styles.stockInfo}>
                  {selectedProduct.stock > 0 ? (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.inStock}>В наявності ({selectedProduct.stock} шт)</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={16} color="#E30613" />
                      <Text style={styles.outOfStock}>Немає в наявності</Text>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  (selectedProduct.stock === 0 || addToCartMutation.isPending) && styles.addToCartButtonDisabled,
                ]}
                onPress={handleAddToCart}
                disabled={selectedProduct.stock === 0 || addToCartMutation.isPending}
              >
                {addToCartMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cart" size={20} color="#fff" />
                    <Text style={styles.addToCartText}>Додати в кошик</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {/* Recommendations Modal */}
      <Modal
        visible={showRecommendations}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecommendations(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRecommendations(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Підбір екіпіровки</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.recommendationForm}>
              <Text style={styles.sectionTitle}>Вік дитини</Text>
              <View style={styles.ageButtons}>
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.ageButton,
                      childAge === age && styles.ageButtonActive,
                    ]}
                    onPress={() => setChildAge(age)}
                  >
                    <Text
                      style={[
                        styles.ageButtonText,
                        childAge === age && styles.ageButtonTextActive,
                      ]}
                    >
                      {age}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Зріст (см)</Text>
              <TextInput
                style={styles.heightInput}
                value={childHeight}
                onChangeText={setChildHeight}
                placeholder="Наприклад: 140"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />

              <Text style={styles.sectionTitle}>Вид спорту</Text>
              <View style={styles.sportButtons}>
                {SPORT_TYPES.filter(s => s.id !== 'ALL').map((sport) => (
                  <TouchableOpacity
                    key={sport.id}
                    style={[
                      styles.sportButton,
                      selectedSport === sport.id && styles.sportButtonActive,
                    ]}
                    onPress={() => setSelectedSport(sport.id)}
                  >
                    <Text
                      style={[
                        styles.sportButtonText,
                        selectedSport === sport.id && styles.sportButtonTextActive,
                      ]}
                    >
                      {sport.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {recommendations && recommendations.length > 0 && (
              <View style={styles.recommendationsSection}>
                <Text style={styles.sectionTitle}>Рекомендовані товари</Text>
                {recommendations.map((product) => (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.recommendationCard}
                    onPress={() => {
                      setShowRecommendations(false);
                      setSelectedProduct(product);
                    }}
                  >
                    <View style={styles.recommendationInfo}>
                      <Text style={styles.recommendationName}>{product.name}</Text>
                      <Text style={styles.recommendationBrand}>{product.brand}</Text>
                      <Text style={styles.recommendationPrice}>{product.price} ₴</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Фільтри</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory('ALL');
                setSelectedSport('ALL');
                setSelectedUsage('ALL');
                setSortBy('popular');
              }}
            >
              <Text style={styles.resetText}>Скинути</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.filterSectionTitle}>Сортування</Text>
            {[
              { id: 'popular', name: 'За популярністю' },
              { id: 'rating', name: 'За рейтингом' },
              { id: 'price_asc', name: 'Ціна: від низької' },
              { id: 'price_desc', name: 'Ціна: від високої' },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.filterOption}
                onPress={() => setSortBy(option.id)}
              >
                <Text style={styles.filterOptionText}>{option.name}</Text>
                {sortBy === option.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.filterSectionTitle}>Вид спорту</Text>
            {SPORT_TYPES.map((sport) => (
              <TouchableOpacity
                key={sport.id}
                style={styles.filterOption}
                onPress={() => setSelectedSport(sport.id)}
              >
                <Text style={styles.filterOptionText}>{sport.name}</Text>
                {selectedSport === sport.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.filterSectionTitle}>Призначення</Text>
            {USAGE_TYPES.map((usage) => (
              <TouchableOpacity
                key={usage.id}
                style={styles.filterOption}
                onPress={() => setSelectedUsage(usage.id)}
              >
                <Text style={styles.filterOptionText}>{usage.name}</Text>
                {selectedUsage === usage.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Застосувати</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsContainer: {
    flex: 1,
  },
  productsGrid: {
    padding: 8,
  },
  productsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    height: 140,
    backgroundColor: '#f8f8f8',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    padding: 12,
  },
  productBrand: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  oldPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  resetText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
  },
  modalImageContainer: {
    height: 250,
    backgroundColor: '#f8f8f8',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    padding: 16,
  },
  modalBrand: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  modalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  modalReviewsText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 4,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOldPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.primary,
  },
  sizeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  inStock: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  outOfStock: {
    fontSize: 14,
    color: '#E30613',
    fontWeight: '500',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addToCartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#333',
  },
  applyFiltersButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  recommendationForm: {
    padding: 16,
  },
  ageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  ageButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  ageButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  ageButtonTextActive: {
    color: colors.primary,
  },
  heightInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  sportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  sportButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  sportButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sportButtonTextActive: {
    color: colors.primary,
  },
  recommendationsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recommendationBrand: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  recommendationPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
