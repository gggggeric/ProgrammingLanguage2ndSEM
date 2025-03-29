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
  Modal,
  ActivityIndicator
} from 'react-native';
import { Button, Title, Checkbox, RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import BottomNavbar from '../Navigation/BottomNavbar';
import API_BASE_URL from '../../../config';

const CartImage = ({ item }) => {
  const [imgError, setImgError] = useState(false);
  const imageUri = item.imageUrl || item.image || item.photo || null;
  
  if (imgError || !imageUri) {
    return (
      <View style={[styles.itemImage, styles.fallbackImage]}>
        <Ionicons name="fast-food" size={24} color="#ccc" />
      </View>
    );
  }
  
  return (
    <Image
      source={{ uri: imageUri }}
      style={styles.itemImage}
      onError={() => setImgError(true)}
      resizeMode="cover"
    />
  );
};

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [userId, setUserId] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    { id: 'credit_card', label: 'Credit Card', icon: 'card' },
    { id: 'debit_card', label: 'Debit Card', icon: 'card' },
    { id: 'paypal', label: 'PayPal', icon: 'logo-paypal' },
    { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: 'cash' },
  ];

  const clearUserSession = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('authToken'),
      SecureStore.deleteItemAsync('userId'),
      SecureStore.deleteItemAsync('userData'),
    ]);
  };

  const handleCheckoutError = async (error) => {
    console.error('Checkout error:', error);
    let errorMessage = 'Checkout failed. Please try again.';
    let requiresLogout = false;
    let navigateTo = null;

    if (error.message.includes('SESSION_EXPIRED') || 
        error.message.includes('USER_NOT_AUTHORIZED') ||
        error.message.includes('No token provided')) {
      errorMessage = 'Your session has expired. Please log in again.';
      requiresLogout = true;
      navigateTo = 'Login';
    } else if (error.message.includes('not active')) {
      errorMessage = 'Your account is no longer active. Please contact support.';
      requiresLogout = true;
      navigateTo = 'Login';
    }

    if (requiresLogout) {
      await clearUserSession();
    }

    Alert.alert('Checkout Failed', errorMessage, [
      { 
        text: 'OK', 
        onPress: () => {
          if (navigateTo) {
            navigation.navigate(navigateTo);
          }
        }
      }
    ]);
  };

  const updateCartState = async (items, userId) => {
    setCartItems(items);
    setSelectedItems([]);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    setCartItemCount(count);
    
    const cartKey = `cart_${userId}`;
    await Promise.all([
      SecureStore.setItemAsync(cartKey, JSON.stringify(items)),
      SecureStore.setItemAsync('cartItemCount', String(count))
    ]);
  };

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
            setCartItemCount(parsedCartItems.reduce((sum, item) => sum + item.quantity, 0));
            setSelectedItems(parsedCartItems.map(item => item._id));
          }
        }
      } catch (error) {
        console.error('Error fetching user ID or cart items:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', fetchUserAndCart);
    fetchUserAndCart();
    return unsubscribe;
  }, [navigation]);

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item._id));
    }
  };

  const updateQuantity = (id, change) => {
    const updatedCartItems = cartItems.map((item) => {
      if (item._id === id) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCartItems(updatedCartItems);
    setCartItemCount(updatedCartItems.reduce((sum, item) => sum + item.quantity, 0));
    updateSecureStore(updatedCartItems);
  };

  const removeItem = async (id) => {
    const updatedCartItems = cartItems.filter((item) => item._id !== id);
    setCartItems(updatedCartItems);
    setCartItemCount(updatedCartItems.reduce((sum, item) => sum + item.quantity, 0));
    setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    await updateSecureStore(updatedCartItems);
    Alert.alert('Item Removed', 'The item has been removed from your cart.');
  };

  const updateSecureStore = async (updatedCartItems) => {
    if (userId) {
      const cartKey = `cart_${userId}`;
      try {
        await SecureStore.setItemAsync(cartKey, JSON.stringify(updatedCartItems));
        await SecureStore.setItemAsync('cartItemCount', String(updatedCartItems.reduce((sum, item) => sum + item.quantity, 0)));
      } catch (error) {
        console.error('Error updating SecureStore:', error);
      }
    }
  };

  const handleCheckout = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to proceed with checkout.');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item to checkout.');
      return;
    }

    setShowPaymentModal(true);
  };

  const confirmOrder = async () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setIsCheckingOut(true);
    setShowPaymentModal(false);

    try {
      const authToken = await SecureStore.getItemAsync('authToken');
      if (!authToken) {
        throw new Error('SESSION_EXPIRED');
      }

      const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item._id));
      const totalAmount = itemsToCheckout.reduce((sum, item) => sum + item.price * item.quantity, 0);

      let userAddress;
      try {
        const addressJson = await SecureStore.getItemAsync('userAddress');
        userAddress = addressJson ? JSON.parse(addressJson) : null;
      } catch (error) {
        console.error('Error fetching user address:', error);
      }

      if (!userAddress || !Object.values(userAddress).some(value => value && value.trim() !== '')) {
        userAddress = {
          street: "123 Main St",
          city: "Anytown",
          state: "CA",
          postalCode: "12345",
          country: "USA"
        };
      }

      Alert.alert(
        'Confirm Order',
        'Are you ready to place your order?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsCheckingOut(false)
          },
          {
            text: 'Place Order',
            onPress: () => processOrder(itemsToCheckout, userAddress, totalAmount)
          }
        ]
      );
    } catch (error) {
      console.error('Error preparing checkout:', error);
      await handleCheckoutError(error);
    }
  };

  const processOrder = async (itemsToCheckout, shippingAddress, totalAmount) => {
    setIsProcessing(true);
    
    try {
      // 1. Get authentication tokens
      const [authToken, storedUserId] = await Promise.all([
        SecureStore.getItemAsync('authToken'),
        SecureStore.getItemAsync('userId')
      ]);

      // 2. Validate session
      if (!authToken || !storedUserId) {
        throw new Error('SESSION_EXPIRED');
      }

      // 3. Prepare order data with image handling
      const orderData = {
        userId: storedUserId,
        items: itemsToCheckout.map(item => {
          // Handle different possible image fields and formats
          let imageUrl = '';
          
          if (item.imageUrl) {
            imageUrl = item.imageUrl;
          } else if (item.image) {
            // Handle both string URLs and image objects
            imageUrl = typeof item.image === 'string' ? item.image : item.image.uri;
          } else if (item.photo) {
            imageUrl = typeof item.photo === 'string' ? item.photo : item.photo.uri;
          }

          // Validate image URL format
          if (imageUrl && !isValidUrl(imageUrl)) {
            console.warn(`Invalid image URL for product ${item._id}: ${imageUrl}`);
            imageUrl = ''; // Fallback to empty string if invalid
          }

          return {
            productId: item._id,
            quantity: item.quantity,
            priceAtOrder: item.price,
            name: item.name,
            photo: imageUrl || null // Send null if no valid image
          };
        }),
        totalAmount: totalAmount,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod
      };

      // 4. Submit order to backend
      const response = await fetch(`${API_BASE_URL}/order/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(orderData)
      });

      // 5. Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || 'Order creation failed';
        
        if (response.status === 401) {
          throw new Error('SESSION_EXPIRED');
        }
        if (response.status === 403) {
          throw new Error('USER_NOT_AUTHORIZED');
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      
      // 6. Update local cart state
      const updatedCart = cartItems.filter(item => !selectedItems.includes(item._id));
      const cartKey = `cart_${storedUserId}`;
      await SecureStore.setItemAsync(cartKey, JSON.stringify(updatedCart));
      
      // 7. Update React state
      setCartItems(updatedCart);
      setSelectedItems([]);
      setCartItemCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));

      // 8. Show success and redirect
      Alert.alert(
        'Order Successful',
        'Your order has been placed successfully!',
        [{
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Order History' }],
            });
          }
        }]
      );

      return result;

    } catch (error) {
      // Enhanced error handling
      let errorMessage = 'Failed to place order';
      
      if (error.message === 'SESSION_EXPIRED') {
        errorMessage = 'Your session has expired. Please log in again.';
        // Clear storage and navigate to login
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userId');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Order Error', errorMessage);
      throw error; // Re-throw for additional handling if needed
    } finally {
      setIsCheckingOut(false);
      setIsProcessing(false);
    }
};

// Helper function to validate URLs
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
};

  const selectedTotal = cartItems
    .filter(item => selectedItems.includes(item._id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const PaymentMethodModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showPaymentModal}
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Payment Method</Text>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={styles.paymentOption}
              onPress={() => setPaymentMethod(method.id)}
            >
              <RadioButton
                value={method.id}
                status={paymentMethod === method.id ? 'checked' : 'unchecked'}
                onPress={() => setPaymentMethod(method.id)}
                color="#ff8c42"
              />
              <Ionicons name={method.icon} size={24} color="#ff8c42" />
              <Text style={styles.paymentLabel}>{method.label}</Text>
            </TouchableOpacity>
          ))}
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              style={styles.modalButton}
              onPress={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              style={styles.modalButton}
              onPress={confirmOrder}
              disabled={!paymentMethod || isProcessing}
              loading={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Continue'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

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

              {cartItems.length > 0 ? (
                <View style={styles.cartItemsContainer}>
                  <TouchableOpacity 
                    style={styles.selectAllContainer}
                    onPress={toggleSelectAll}
                  >
                    <Checkbox.Android
                      status={
                        selectedItems.length === cartItems.length 
                          ? 'checked' 
                          : selectedItems.length > 0 
                            ? 'indeterminate' 
                            : 'unchecked'
                      }
                      color="#ff8c42"
                    />
                    <Text style={styles.selectAllText}>
                      {selectedItems.length === cartItems.length 
                        ? 'Deselect All' 
                        : 'Select All'}
                    </Text>
                  </TouchableOpacity>

                  {cartItems.map((item) => (
                    <View 
                      key={item._id} 
                      style={[
                        styles.cartItem,
                        selectedItems.includes(item._id) && styles.selectedItem
                      ]}
                    >
                      <Checkbox.Android
                        status={selectedItems.includes(item._id) ? 'checked' : 'unchecked'}
                        onPress={() => toggleItemSelection(item._id)}
                        color="#ff8c42"
                      />
                      <CartImage item={item} />
                      <View style={styles.itemDetails}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemTotalPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                        <Text style={styles.itemPrice}>₱{item.price.toFixed(2)} each</Text>
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

              {cartItems.length > 0 && (
                <View style={styles.orderSummary}>
                  <View style={styles.orderDetails}>
                    <View style={styles.orderRow}>
                      <Text style={styles.totalLabel}>Selected Items ({selectedItems.length})</Text>
                      <Text style={styles.totalValue}>₱{selectedTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                  <Button
                    mode="contained"
                    onPress={handleCheckout}
                    style={styles.checkoutButton}
                    labelStyle={styles.checkoutButtonLabel}
                    contentStyle={styles.buttonContent}
                    disabled={selectedItems.length === 0 || isCheckingOut}
                    loading={isCheckingOut}
                  >
                    {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                  </Button>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

      <PaymentMethodModal />
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
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  selectAllText: {
    color: '#ff8c42',
    marginLeft: 8,
    fontSize: 16,
  },
  cartItemsContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  selectedItem: {
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    borderColor: '#ff8c42',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: 8,
  },
  fallbackImage: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentLabel: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});