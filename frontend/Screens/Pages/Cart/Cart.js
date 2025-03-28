import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Button, Title } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import BottomNavbar from '../Navigation/BottomNavbar';

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [userId, setUserId] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Fetch user ID and cart items from SecureStore when the component mounts
  useEffect(() => {
    const fetchUserAndCart = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          const cartKey = `cart_${storedUserId}`;
          const storedCartItems = await SecureStore.getItemAsync(cartKey);
          if (storedCartItems) {
            const parsedCartItems = JSON.parse(storedCartItems);
            setCartItems(parsedCartItems);
            setCartItemCount(parsedCartItems.reduce((sum, item) => sum + item.quantity, 0)); // Update total item count
          }
        }
      } catch (error) {
        console.error('Error fetching user ID or cart items:', error);
      }
    };

    // Set up a focus listener to refresh cart data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserAndCart();
    });

    // Initial fetch
    fetchUserAndCart();

    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation]);

  // Function to update item quantity
  const updateQuantity = (id, change) => {
    const updatedCartItems = cartItems.map((item) => {
      if (item._id === id) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCartItems(updatedCartItems);
    const totalItems = updatedCartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartItemCount(totalItems); // Update total item count
    updateSecureStore(updatedCartItems);
  };

  // Function to remove item from cart
  const removeItem = async (id) => {
    const updatedCartItems = cartItems.filter((item) => item._id !== id);
    setCartItems(updatedCartItems);
    const totalItems = updatedCartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartItemCount(totalItems); // Update total item count
    await updateSecureStore(updatedCartItems); // Update SecureStore
    Alert.alert('Item Removed', 'The item has been removed from your cart.');
  };

  // Function to update SecureStore with the latest cart items
  const updateSecureStore = async (updatedCartItems) => {
    if (userId) {
      const cartKey = `cart_${userId}`;
      try {
        await SecureStore.setItemAsync(cartKey, JSON.stringify(updatedCartItems)); // Save updated cart
        await SecureStore.setItemAsync('cartItemCount', String(updatedCartItems.reduce((sum, item) => sum + item.quantity, 0))); // Update global cart count
      } catch (error) {
        console.error('Error updating SecureStore:', error);
      }
    }
  };

  // Function to handle checkout
  const handleCheckout = async () => {
    if (userId) {
      try {
        const cartKey = `cart_${userId}`;
        await SecureStore.deleteItemAsync(cartKey);
        setCartItems([]);
        setCartItemCount(0);
        await SecureStore.setItemAsync('cartItemCount', '0');
        Alert.alert('Success', 'Your order has been placed successfully!');
      } catch (error) {
        console.error('Error during checkout:', error);
        Alert.alert('Error', 'There was an issue during checkout. Please try again.');
      }
    }
  };

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
        style={styles.backgroundImage}
        blurRadius={3}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidContainer}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#ff8c42" />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Title style={styles.logoText}>C</Title>
                </View>
              </View>

              <Title style={styles.header}>Your Cart</Title>
              <Text style={styles.subheader}>{cartItems.length} items</Text>

              {/* Cart Items or Empty State */}
              {cartItems.length > 0 ? (
                <View style={styles.cartItemsContainer}>
                  {cartItems.map((item) => (
                    <View key={item._id} style={styles.cartItem}>
                      {/* Display the product image */}
                      <Image
                        source={{ uri: item.photo || 'https://via.placeholder.com/150' }} // Fallback image if photo is missing
                        style={styles.itemImage}
                      />
                      <View style={styles.itemDetails}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemTotalPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                        <Text style={styles.itemPrice}>${item.price.toFixed(2)} each</Text>
                        <View style={styles.itemActions}>
                          <View style={styles.quantityControl}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => updateQuantity(item._id, -1)}
                            >
                              <Ionicons name="remove" size={16} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => updateQuantity(item._id, 1)}
                            >
                              <Ionicons name="add" size={16} color="#fff" />
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeItem(item._id)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#ff5e62" />
                            <Text style={styles.removeText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCart}>
                  <Ionicons name="cart-outline" size={64} color="#ff8c42" />
                  <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                  <Text style={styles.emptyCartSubtitle}>Looks like you haven't added any items yet.</Text>
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => navigation.navigate('Foods')}
                  >
                    <Text style={styles.browseButtonText}>Browse Menu</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Order Summary */}
              {cartItems.length > 0 && (
                <View style={styles.orderSummary}>
                  <View style={styles.orderDetails}>
                    <View style={styles.orderRow}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>
                  </View>
                  <Button
                    mode="contained"
                    onPress={handleCheckout}
                    style={styles.checkoutButton}
                    labelStyle={styles.checkoutButtonLabel}
                    contentStyle={styles.buttonContent}
                  >
                    Proceed to Checkout
                  </Button>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

      {/* Add the BottomNavbar with the cartItemCount prop */}
      <BottomNavbar cartItemCount={cartItemCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff8c42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff8c42',
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 40,
  },
  cartItemsContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8c42',
  },
  itemPrice: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
    color: '#fff',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 14,
    color: '#ff5e62',
    marginLeft: 4,
  },
  emptyCart: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginTop: 16,
  },
  emptyCartSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#ff8c42',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  orderSummary: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  orderDetails: {
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8c42',
  },
  checkoutButton: {
    backgroundColor: '#ff8c42',
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: '#ff8c42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkoutButtonLabel: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  buttonContent: {
    height: 50,
    paddingVertical: 8,
  },
});