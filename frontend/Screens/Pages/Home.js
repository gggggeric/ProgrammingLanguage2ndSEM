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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = useNavigation();
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;

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

  // Filter products based on search, description and price range
  useEffect(() => {
    if (searchQuery) {
      const results = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        return matchesSearch && matchesPrice;
      });
      setFilteredProducts(results);
    } else {
      setFilteredProducts([]);
    }
  }, [searchQuery, products, minPrice, maxPrice]);

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
    if (searchQuery.trim() && user?._id) {
      const userId = user._id;
      const searchKey = `recentSearches_${userId}`;
      const updatedSearches = [
        `${searchQuery} ($${minPrice}-$${maxPrice})`,
        ...recentSearches.filter(item => !item.startsWith(searchQuery)).slice(0, 4)
      ];
      setRecentSearches(updatedSearches);
      await SecureStore.setItemAsync(searchKey, JSON.stringify(updatedSearches));
      
      navigation.navigate('SearchResults', { 
        query: searchQuery,
        minPrice,
        maxPrice
      });
      setSearchModalVisible(false);
      setSearchQuery('');
    }
  };

  const handleRecentSearchPress = (searchTerm) => {
    const term = searchTerm.split(' (')[0];
    setSearchQuery(term);
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

  const categories = [
    { id: 1, name: 'Electronics', icon: 'phone-portrait' },
    { id: 2, name: 'Home', icon: 'home' },
    { id: 3, name: 'Fashion', icon: 'shirt' },
    { id: 4, name: 'Sports', icon: 'football' },
    { id: 5, name: 'Beauty', icon: 'color-palette' },
  ];

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

  {/* 
  <TouchableOpacity 
    style={styles.sidebarItem}
    onPress={() => {
      setSidebarOpen(false);
      handleLogout();
    }}
  >
    <Ionicons name="log-out" size={20} color="#ff8c42" />
    <Text style={styles.sidebarItemText}>Logout</Text>
  </TouchableOpacity> 
  */}
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

            {/* Categories */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                {categories.map((category) => (
                  <TouchableOpacity key={`category-${category.id}`} style={styles.categoryItem}>
                    <View style={styles.categoryIconContainer}>
                      <Ionicons name={category.icon} size={24} color="#ff8c42" />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
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
            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
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

          {/* Price Range Filter */}
          <TouchableOpacity 
            style={styles.priceFilterButton}
            onPress={() => setShowPriceFilter(!showPriceFilter)}
          >
            <Text style={styles.priceFilterButtonText}>
              Price Range: ₱{minPrice} - ₱{maxPrice}
            </Text>
            <Ionicons 
              name={showPriceFilter ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color="#ff8c42" 
            />
          </TouchableOpacity>

          {showPriceFilter && <PriceRangeSlider />}

          {searchQuery ? (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item._id}
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
                    <Text style={styles.searchResultPrice}>₱{item.price}</Text>
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
                      <Text style={styles.recentSearchText}>{item.split(' (')[0]}</Text>
                      {item.includes('$') && (
                        <Text style={styles.recentSearchPriceRange}>
                          {item.match(/\$(\d+)-(\d+)/)[0]}
                        </Text>
                      )}
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
                <Text style={styles.modalProductCategory}>Category: {selectedProduct.category}</Text>
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#ff8c42',
  },
  profilePhoto: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  editIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#ff8c42',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 12,
    color: '#aaa',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ff5e62',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  banner: {
    height: 150,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bannerGradient: {
    flex: 1,
    padding: 15,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
  },
  bannerTextContainer: {
    flex: 3,
    justifyContent: 'center',
  },
  bannerSmallText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  bannerLargeText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  bannerDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 10,
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bannerImageContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#ff8c42',
  },
  categoriesSection: {
    marginBottom: 25,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    color: '#fff',
    fontSize: 12,
  },
  productsSection: {
    marginBottom: 25,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  productImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
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
    backgroundColor: '#ff5e62',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#ff8c42',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
  },
  addToCartButton: {
    backgroundColor: '#ff8c42',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 5,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalProductImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalProductName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalProductDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  modalProductPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff8c42',
    marginBottom: 10,
  },
  modalProductCategory: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#ff8c42',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Search Modal Styles
  searchModalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    color: '#fff',
  },
  priceFilterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  priceFilterButtonText: {
    color: '#ff8c42',
    fontSize: 14,
  },
  priceRangeContainer: {
    padding: 15,
    backgroundColor: 'rgba(30,30,30,0.8)',
  },
  priceRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceRangeLabel: {
    color: '#fff',
    fontSize: 12,
  },
  priceSlider: {
    width: '100%',
    height: 40,
  },
  searchResultsContainer: {
    padding: 15,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchResultImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#333',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 5,
  },
  searchResultPrice: {
    fontSize: 14,
    color: '#ff8c42',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  searchResultDescription: {
    fontSize: 12,
    color: '#aaa',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  noResultsText: {
    color: '#ff8c42',
    fontSize: 18,
    marginTop: 10,
  },
  noResultsSubText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
  recentSearchesContainer: {
    padding: 15,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#ff8c42',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  recentSearchText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
  },
  recentSearchPriceRange: {
    color: '#ff8c42',
    fontSize: 12,
    marginLeft: 10,
  },
  noRecentSearchesContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  noRecentSearches: {
    color: '#ff8c42',
    fontSize: 18,
    marginTop: 10,
  },
  // Sidebar Styles
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#111',
    zIndex: 100,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sidebarItemText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
});