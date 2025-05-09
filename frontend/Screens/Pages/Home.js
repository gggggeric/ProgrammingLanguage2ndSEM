import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Navbar from './Navigation/BottomNavbar';
import API_BASE_URL from '../../config';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = useNavigation();
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;

  // Food categories from the database schema
  const foodCategories = [
    { id: 1, name: 'vegetarian', icon: 'leaf' },
    { id: 2, name: 'non-vegetarian', icon: 'restaurant' },
  ];

  // Animate sidebar
  useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarOpen ? 0 : -250,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen]);

  // Get max price from products
  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price);
      const calculatedMax = Math.max(...prices);
      setMaxPrice(calculatedMax > 1000 ? calculatedMax : 1000);
    }
  }, [products]);

  // Fetch user data and recent searches
  useEffect(() => {
    const fetchUserProfileAndCart = async () => {
      const userId = await SecureStore.getItemAsync('userId');
      if (userId) {
        try {
          const response = await fetch(`${API_BASE_URL}/user/profile/${userId}`);
          const result = await response.json();
          if (response.ok) {
            setUser(result.user);
            const searches = await SecureStore.getItemAsync(`recentSearches_${userId}`);
            if (searches) {
              setRecentSearches(JSON.parse(searches));
            }
          }
        } catch (error) {
          console.error('Error:', error);
        }

        const cartKey = `cart_${userId}`;
        const storedCartItems = await SecureStore.getItemAsync(cartKey);
        if (storedCartItems) {
          const parsedCartItems = JSON.parse(storedCartItems);
          setCartItems(parsedCartItems);
          setCartItemCount(parsedCartItems.reduce((sum, item) => sum + item.quantity, 0));
        }
      }
    };

    fetchUserProfileAndCart();
  }, []);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search, description, price range, and category
  useEffect(() => {
    if (searchQuery || selectedCategory) {
      const results = products.filter(product => {
        const matchesSearch = !searchQuery || 
                            product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        return matchesSearch && matchesPrice && matchesCategory;
      });
      setFilteredProducts(results);
    } else {
      setFilteredProducts([]);
    }
  }, [searchQuery, products, minPrice, maxPrice, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/products`);
      const result = await response.json();
      if (response.ok) {
        setProducts(result.products);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProducts().finally(() => setRefreshing(false));
  }, []);

  const addToCart = async (product) => {
    const userId = await SecureStore.getItemAsync('userId');
    if (userId) {
      const cartKey = `cart_${userId}`;
      const existingItemIndex = cartItems.findIndex((item) => item._id === product._id);

      let updatedCartItems;
      if (existingItemIndex !== -1) {
        updatedCartItems = [...cartItems];
        updatedCartItems[existingItemIndex].quantity += 1;
      } else {
        updatedCartItems = [...cartItems, { ...product, quantity: 1 }];
      }

      setCartItems(updatedCartItems);
      const totalItems = updatedCartItems.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
      await SecureStore.setItemAsync(cartKey, JSON.stringify(updatedCartItems));
      await SecureStore.setItemAsync('cartItemCount', String(totalItems));
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleSearch = async () => {
    const searchParams = [];
    if (searchQuery.trim()) searchParams.push(searchQuery);
    if (selectedCategory) searchParams.push(`Category: ${selectedCategory}`);
    if (minPrice > 0 || maxPrice < 1000) searchParams.push(`Price: ₱${minPrice}-₱${maxPrice}`);
    
    const searchTerm = searchParams.join(' | ');
    
    if ((searchQuery.trim() || selectedCategory) && user?._id) {
      const userId = user._id;
      const searchKey = `recentSearches_${userId}`;
      
      // Only add to recent searches if we have a term
      if (searchTerm) {
        const updatedSearches = [
          searchTerm,
          ...recentSearches.filter(item => item !== searchTerm).slice(0, 4)
        ];
        setRecentSearches(updatedSearches);
        await SecureStore.setItemAsync(searchKey, JSON.stringify(updatedSearches));
      }
      
      navigation.navigate('SearchResults', { 
        query: searchQuery,
        minPrice,
        maxPrice,
        category: selectedCategory
      });
      setSearchModalVisible(false);
      setSearchQuery('');
      setSelectedCategory(null);
    }
  };

  const handleRecentSearchPress = (searchTerm) => {
    // Parse the search term to extract components
    setSearchQuery('');
    setSelectedCategory(null);
    
    // Extract query
    if (!searchTerm.includes(' | ')) {
      setSearchQuery(searchTerm);
      return;
    }
    
    const parts = searchTerm.split(' | ');
    
    // First part is usually the search query unless it starts with "Category:" or "Price:"
    if (!parts[0].startsWith('Category:') && !parts[0].startsWith('Price:')) {
      setSearchQuery(parts[0]);
    }
    
    // Look for category
    const categoryPart = parts.find(part => part.startsWith('Category:'));
    if (categoryPart) {
      const category = categoryPart.split(': ')[1];
      setSelectedCategory(category);
    }
    
    // Look for price range
    const pricePart = parts.find(part => part.startsWith('Price:'));
    if (pricePart) {
      const priceRange = pricePart.split(': ')[1];
      const [min, max] = priceRange.replace('₱', '').split('-₱').map(Number);
      setMinPrice(min);
      setMaxPrice(max);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear secure store items
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('cartItemCount');
      await SecureStore.deleteItemAsync(`cart_${await SecureStore.getItemAsync('userId')}`);
      
      // Navigate to login screen
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`${rating}-full-${i}`} name="star" size={12} color="#FFD700" />);
    }

    if (hasHalfStar) {
      stars.push(<Ionicons key={`${rating}-half`} name="star-half" size={12} color="#FFD700" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`${rating}-empty-${i}`} name="star-outline" size={12} color="#FFD700" />);
    }

    return (
      <View style={styles.ratingContainer}>
        {stars}
        <Text style={styles.ratingText}>{rating}</Text>
      </View>
    );
  };

  const PriceRangeSlider = () => (
    <View style={styles.priceRangeContainer}>
      <View style={styles.priceRangeLabels}>
        <Text style={styles.priceRangeLabel}>₱{minPrice}</Text>
        <Text style={styles.priceRangeLabel}>₱{maxPrice}</Text>
      </View>
      <Slider
        style={styles.priceSlider}
        minimumValue={0}
        maximumValue={maxPrice > 1000 ? maxPrice : 1000}
        minimumTrackTintColor="#ff8c42"
        maximumTrackTintColor="#555"
        thumbTintColor="#ff8c42"
        value={maxPrice}
        onValueChange={(value) => setMaxPrice(Math.floor(value))}
      />
    </View>
  );

  const CategoryFilter = () => (
    <View style={styles.categoryFilterContainer}>
      <View style={styles.categoryButtonsContainer}>
        {foodCategories.map((category) => (
          <TouchableOpacity
            key={`filter-${category.id}`}
            style={[
              styles.categoryFilterButton,
              selectedCategory === category.name && styles.categoryFilterButtonSelected
            ]}
            onPress={() => handleCategorySelect(category.name)}
          >
            <Ionicons 
              name={category.icon} 
              size={18} 
              color={selectedCategory === category.name ? "#fff" : "#ff8c42"} 
            />
            <Text 
              style={[
                styles.categoryFilterText,
                selectedCategory === category.name && styles.categoryFilterTextSelected
              ]}
            >
              {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selectedCategory && (
        <TouchableOpacity 
          style={styles.clearFilterButton}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.clearFilterText}>Clear filter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, {
        transform: [{ translateX: sidebarAnimation }]
      }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Menu</Text>
          <TouchableOpacity onPress={() => setSidebarOpen(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.sidebarItem}
          onPress={() => {
            setSidebarOpen(false);
            navigation.navigate('Profile');
          }}
        >
          <Ionicons name="person" size={20} color="#ff8c42" />
          <Text style={styles.sidebarItemText}>Profile</Text>
        </TouchableOpacity>

        {/* Order History Tab */}
        <TouchableOpacity 
          style={styles.sidebarItem}
          onPress={() => {
            setSidebarOpen(false);
            navigation.navigate('Order History');
          }}
        >
          <Ionicons name="time" size={20} color="#ff8c42" />
          <Text style={styles.sidebarItemText}>History</Text>
        </TouchableOpacity>

        {/* Review History Tab */}
        <TouchableOpacity 
          style={styles.sidebarItem}
          onPress={() => {
            setSidebarOpen(false);
            navigation.navigate('ReviewHistory');
          }}
        >
          <Ionicons name="document-text" size={20} color="#ff8c42" />
          <Text style={styles.sidebarItemText}>Reviews</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSidebarOpen(false)}
        />
      )}

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
        style={styles.backgroundImage}
        blurRadius={3}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff8c42" />
            }
          >
            {/* Header with profile and search */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
                <Ionicons name="menu" size={28} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.profileSection}>
                <View style={styles.profilePhotoContainer}>
                  <Image
                    source={{ uri: user?.profilePhoto || 'https://via.placeholder.com/150' }}
                    style={styles.profilePhoto}
                  />
                  <View style={styles.editIcon}>
                    <Ionicons name="pencil" size={16} color="#fff" />
                  </View>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.welcomeText}>Welcome back,</Text>
                  <Text style={styles.profileName}>{user?.name || 'Guest'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => setSearchModalVisible(true)}
              >
                <Ionicons name="search" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications" size={22} color="#fff" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>3</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Banner */}
            <TouchableOpacity style={styles.banner}>
              <LinearGradient
                colors={['#ff8c42', '#ff5e62']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTextContainer}>
                    <Text style={styles.bannerSmallText}>Special Offer</Text>
                    <Text style={styles.bannerLargeText}>25% OFF</Text>
                    <Text style={styles.bannerDescription}>On your first purchase</Text>
                    <TouchableOpacity style={styles.bannerButton}>
                      <Text style={styles.bannerButtonText}>Shop Now</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.bannerImageContainer}>
                    <Image
                      source={{ uri: 'https://via.placeholder.com/150' }}
                      style={styles.bannerImage}
                    />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Food Categories - UPDATED SECTION */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Food Categories</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                {foodCategories.map((category) => (
                  <TouchableOpacity 
                    key={`category-${category.id}`} 
                    style={styles.categoryItem}
                    onPress={() => {
                      setSelectedCategory(category.name);
                      setSearchModalVisible(true);
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(255, 140, 66, 0.2)', 'rgba(255, 94, 98, 0.2)']}
                      style={styles.categoryIconContainer}
                    >
                      <Ionicons name={category.icon} size={24} color="#ff8c42" />
                    </LinearGradient>
                    <Text style={styles.categoryName}>
                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Featured Products */}
            <View style={styles.productsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Products</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.productGrid}>
                {products.map((product) => {
                  const productKey = product._id ? `product-${product._id}` : `product-${Math.random()}`;

                  return (
                    <TouchableOpacity
                      key={productKey}
                      style={styles.productCard}
                      onPress={() => handleProductClick(product)}
                    >
                      <View style={styles.productImageContainer}>
                        <Image
                          source={{ uri: product.photo || 'https://via.placeholder.com/150' }}
                          style={styles.productImage}
                        />
                        {product.badge && (
                          <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{product.badge}</Text>
                          </View>
                        )}
                        {product.category && (
                          <View style={[styles.categoryBadge, 
                            { backgroundColor: product.category === 'vegetarian' ? '#4CAF50' : '#FF5722' }]}>
                            <Ionicons 
                              name={product.category === 'vegetarian' ? 'leaf' : 'restaurant'} 
                              size={12} 
                              color="#fff" 
                            />
                          </View>
                        )}
                        <TouchableOpacity style={styles.favoriteButton}>
                          <Ionicons name="heart-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                        <Text style={styles.productPrice}>₱{product.price}</Text>
                        {product.rating && renderStars(product.rating)}
                      </View>
                      <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(product)}>
                        <Ionicons name="cart" size={16} color="#fff" />
                        <Text style={styles.addToCartText}>Add</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)']}
          style={styles.searchModalContainer}
        >
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => {
              setSearchModalVisible(false);
              setSelectedCategory(null);
            }}>
              <Ionicons name="arrow-back" size={24} color="#ff8c42" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              onSubmitEditing={handleSearch}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#ff8c42" />
              </TouchableOpacity>
            ) : (
              <Ionicons name="search" size={20} color="#ff8c42" />
            )}
          </View>

          {/* Filter Section */}
          <View style={styles.filterSection}>
            {/* Category Filter */}
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowCategoryFilter(!showCategoryFilter)}
            >
              <Text style={styles.filterButtonText}>
                Category {selectedCategory ? `(${selectedCategory})` : ''}
              </Text>
              <Ionicons 
                name={showCategoryFilter ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#ff8c42" 
              />
            </TouchableOpacity>
            
            {showCategoryFilter && <CategoryFilter />}

            {/* Price Range Filter */}
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowPriceFilter(!showPriceFilter)}
            >
              <Text style={styles.filterButtonText}>
                Price Range: ₱{minPrice} - ₱{maxPrice}
              </Text>
              <Ionicons 
                name={showPriceFilter ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#ff8c42" 
              />
            </TouchableOpacity>

            {showPriceFilter && <PriceRangeSlider />}
          </View>

          {/* Search Button */}
          <TouchableOpacity 
            style={styles.searchActionButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchActionButtonText}>Search</Text>
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>

          {searchQuery || selectedCategory ? (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item._id || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => {
                    handleProductClick(item);
                    setSearchModalVisible(false);
                  }}
                >
                  <Image
                    source={{ uri: item.photo || 'https://via.placeholder.com/150' }}
                    style={styles.searchResultImage}
                  />
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <View style={styles.searchResultMeta}>
                      <Text style={styles.searchResultPrice}>₱{item.price}</Text>
                      {item.category && (
                        <View style={[styles.searchResultCategory, 
                          { backgroundColor: item.category === 'vegetarian' ? '#4CAF50' : '#FF5722' }]}>
                          <Text style={styles.searchResultCategoryText}>
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.searchResultDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.searchResultsContainer}
              ListEmptyComponent={
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search" size={50} color="#ff8c42" />
                  <Text style={styles.noResultsText}>No products found</Text>
                  <Text style={styles.noResultsSubText}>
                    Try adjusting your search or filter criteria
                  </Text>
                </View>
              }
            />
          ) : (
            <View style={styles.recentSearchesContainer}>
              <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
              {recentSearches.length > 0 ? (
                <FlatList
                  data={recentSearches}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.recentSearchItem}
                      onPress={() => handleRecentSearchPress(item)}
                    >
                      <Ionicons name="time" size={20} color="#ff8c42" />
                      <Text style={styles.recentSearchText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <View style={styles.noRecentSearchesContainer}>
                  <Ionicons name="time" size={50} color="#ff8c42" />
                  <Text style={styles.noRecentSearches}>No recent searches</Text>
                </View>
              )}
            </View>
          )}
        </LinearGradient>
      </Modal>

      {/* Bottom Navigation Bar */}
      <Navbar cartItemCount={cartItemCount} />

      {/* Product Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <Image
                  source={{ uri: selectedProduct.photo || 'https://via.placeholder.com/150' }}
                  style={styles.modalProductImage}
                />
                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                <Text style={styles.modalProductDescription}>{selectedProduct.description}</Text>
                <Text style={styles.modalProductPrice}>Price: ₱{selectedProduct.price}</Text>
                
                {selectedProduct.category && (
                  <View style={styles.modalCategoryContainer}>
                    <Text style={styles.modalCategoryLabel}>Category: </Text>
                    <View style={[styles.modalCategoryBadge, 
                      { backgroundColor: selectedProduct.category === 'vegetarian' ? '#4CAF50' : '#FF5722' }]}>
                      <Ionicons 
                        name={selectedProduct.category === 'vegetarian' ? 'leaf' : 'restaurant'} 
                        size={16} 
                        color="#fff" 
                        style={styles.modalCategoryIcon}
                      />
                      <Text style={styles.modalCategoryText}>
                        {selectedProduct.category.charAt(0).toUpperCase() + selectedProduct.category.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuButton: {
    marginRight: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginRight: 10,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ff8c42',
  },
  editIcon: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: '#ff8c42',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  welcomeText: {
    color: '#aaa',
    fontSize: 12,
  },
  profileName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchButton: {
    padding: 10,
  },
  notificationButton: {
    padding: 10,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ff8c42',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  banner: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bannerGradient: {
    borderRadius: 15,
    padding: 15,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 2,
  },
  bannerSmallText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 5,
  },
  bannerLargeText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bannerDescription: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 15,
  },
  bannerButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bannerImageContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bannerImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#ff8c42',
    fontSize: 14,
  },
  categoriesContainer: {
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    color: '#fff',
    fontSize: 12,
  },
  productsSection: {
    marginBottom: 20,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  productImageContainer: {
    position: 'relative',
    height: 130,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff8c42',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    borderRadius: 15,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    color: '#ff8c42',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  addToCartButton: {
    backgroundColor: '#ff8c42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalProductImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalProductName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalProductDescription: {
    color: '#ddd',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalProductPrice: {
    color: '#ff8c42',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCategoryLabel: {
    color: '#fff',
    fontSize: 14,
  },
  modalCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modalCategoryIcon: {
    marginRight: 5,
  },
  modalCategoryText: {
    color: '#fff',
    fontSize: 12,
  },
  closeButton: {
    backgroundColor: '#ff8c42',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchModalContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    color: '#fff',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  priceRangeContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  priceRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceRangeLabel: {
    color: '#fff',
  },
  priceSlider: {
    width: '100%',
    height: 40,
  },
  categoryFilterContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  categoryButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  categoryFilterButtonSelected: {
    backgroundColor: '#ff8c42',
  },
  categoryFilterText: {
    color: '#fff',
    marginLeft: 5,
  },
  categoryFilterTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearFilterButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  clearFilterText: {
    color: '#ff8c42',
    fontWeight: 'bold',
  },
  searchActionButton: {
    backgroundColor: '#ff8c42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  searchActionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 10,
  },
  searchResultsContainer: {
    paddingBottom: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  searchResultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  searchResultPrice: {
    color: '#ff8c42',
    fontWeight: 'bold',
    marginRight: 10,
  },
  searchResultCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  searchResultCategoryText: {
    color: '#fff',
    fontSize: 10,
  },
  searchResultDescription: {
    color: '#aaa',
    fontSize: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  noResultsSubText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 5,
  },
  recentSearchesContainer: {
    flex: 1,
  },
  recentSearchesTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  recentSearchText: {
    color: '#fff',
    marginLeft: 10,
  },
  noRecentSearchesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noRecentSearches: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  sidebar: {
    position: 'absolute',
    width: 250,
    height: '100%',
    backgroundColor: '#111',
    zIndex: 2,
    padding: 20,
    paddingTop: 50,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginBottom: 10,
  },
  sidebarItemText: {
    color: '#fff',
    marginLeft: 15,
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  }
  });