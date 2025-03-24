import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Navbar from './Navigation/BottomNavbar';
import API_BASE_URL from '../../config';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null); // State to store logged-in user data
  const [products, setProducts] = useState([]); // State to store fetched products
  const [selectedProduct, setSelectedProduct] = useState(null); // State to store the selected product for details
  const [modalVisible, setModalVisible] = useState(false); // State to control modal visibility
  const [cartItems, setCartItems] = useState([]); // State to store cart items
  const [cartItemCount, setCartItemCount] = useState(0); // State to store cart item count

  // Fetch logged-in user data and cart items on component mount
  useEffect(() => {
    const fetchUserProfileAndCart = async () => {
      const userId = await SecureStore.getItemAsync('userId');
      if (userId) {
        try {
          const response = await fetch(`${API_BASE_URL}/user/profile/${userId}`);
          const result = await response.json();
          if (response.ok) {
            setUser(result.user); // Set the user data
          } else {
            console.error('Failed to fetch user profile:', result.message);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }

        // Fetch cart items from SecureStore
        const cartKey = `cart_${userId}`; // Unique key for the user's cart
        const storedCartItems = await SecureStore.getItemAsync(cartKey);
        if (storedCartItems) {
          const parsedCartItems = JSON.parse(storedCartItems);
          setCartItems(parsedCartItems);
          setCartItemCount(parsedCartItems.reduce((sum, item) => sum + item.quantity, 0)); // Update cart item count
        }
      }
    };

    fetchUserProfileAndCart();
  }, []);

  // Fetch products from the backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/products`);
      const result = await response.json();
      console.log(result); // Log the response to verify the data
      if (response.ok) {
        setProducts(result.products); // Set the fetched products
      } else {
        console.error('Failed to fetch products:', result.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Refresh function to re-fetch products
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProducts().finally(() => setRefreshing(false));
  }, []);

  // Function to add product to cart
  const addToCart = async (product) => {
    const userId = await SecureStore.getItemAsync('userId');
    if (userId) {
      const cartKey = `cart_${userId}`;
      const existingItemIndex = cartItems.findIndex((item) => item._id === product._id); // Compare _id as a string

      let updatedCartItems;
      if (existingItemIndex !== -1) {
        // Item already exists, increment quantity
        updatedCartItems = [...cartItems];
        updatedCartItems[existingItemIndex].quantity += 1;
      } else {
        // Item does not exist, add new item with quantity 1
        updatedCartItems = [...cartItems, { ...product, quantity: 1 }]; // Ensure product includes photo
      }

      setCartItems(updatedCartItems);
      const totalItems = updatedCartItems.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems); // Update total item count
      await SecureStore.setItemAsync(cartKey, JSON.stringify(updatedCartItems)); // Save to SecureStore
      await SecureStore.setItemAsync('cartItemCount', String(totalItems)); // Update global cart count
    }
  };

  // Function to handle product click
  const handleProductClick = (product) => {
    setSelectedProduct(product); // Set the selected product
    setModalVisible(true); // Show the modal
  };

  // Function to handle checkout
  const handleCheckout = async () => {
    const userId = await SecureStore.getItemAsync('userId');
    if (userId) {
      const cartKey = `cart_${userId}`; // Unique key for the user's cart
      await SecureStore.deleteItemAsync(cartKey); // Clear the cart
      setCartItems([]);
      setCartItemCount(0); // Reset cart item count
    }
  };

  // Render stars for product ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`${rating}-full-${i}`} name="star" size={12} color="#FFD700" />);
    }

    // Half star if needed
    if (hasHalfStar) {
      stars.push(<Ionicons key={`${rating}-half`} name="star-half" size={12} color="#FFD700" />);
    }

    // Empty stars to make total of 5
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

  // Categories
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
              <TouchableOpacity style={styles.searchButton}>
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
                  // Debugging: Log the product ID and its type
                  console.log('Product ID:', product._id, 'Type:', typeof product._id);

                  // Ensure the key is unique and valid
                  const productKey = product._id ? `product-${product._id}` : `product-${Math.random()}`;

                  return (
                    <TouchableOpacity
                      key={productKey} // Use a unique key
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
                        <Text style={styles.productPrice}>${product.price}</Text>
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
                <Text style={styles.modalProductPrice}>Price: ${selectedProduct.price}</Text>
                <Text style={styles.modalProductCategory}>Category: {selectedProduct.category}</Text>
                <Text style={styles.modalProductCrust}>Crust: {selectedProduct.crust}</Text>
                <Text style={styles.modalProductSize}>Size: {selectedProduct.size}</Text>
                <Text style={styles.modalProductQuantity}>Quantity: {selectedProduct.quantity}</Text>
                <Text style={styles.modalProductCreatedAt}>
                  Created At: {new Date(selectedProduct.createdAt).toLocaleDateString()}
                </Text>
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
  modalProductCrust: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  modalProductSize: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  modalProductQuantity: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  modalProductCreatedAt: {
    fontSize: 14,
    color: '#777',
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
});