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
import { useDispatch, useSelector } from 'react-redux';
import { createOrder, clearOrderError } from '../../../redux/actions/orderActions';
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
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const dispatch = useDispatch();
  const { loading: isProcessing, error: orderError } = useSelector(state => state.order);

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

  useEffect(() => {
    if (orderError) {
      Alert.alert('Order Error', orderError);
      dispatch(clearOrderError());
    }
  }, [orderError]);

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
            style: 'cancel'
          },
          {
            text: 'Place Order',
            onPress: () => processOrderWithRedux(itemsToCheckout, userAddress, totalAmount)
          }
        ]
      );
    } catch (error) {
      console.error('Error preparing checkout:', error);
      await handleCheckoutError(error);
    }
  };

  const processOrderWithRedux = async (itemsToCheckout, shippingAddress, totalAmount) => {
    try {
      const orderData = {
        userId,
        items: itemsToCheckout.map(item => {
          let imageUrl = '';
          
          if (item.imageUrl) {
            imageUrl = item.imageUrl;
          } else if (item.image) {
            imageUrl = typeof item.image === 'string' ? item.image : item.image.uri;
          } else if (item.photo) {
            imageUrl = typeof item.photo === 'string' ? item.photo : item.photo.uri;
          }

          if (imageUrl && !isValidUrl(imageUrl)) {
            console.warn(`Invalid image URL for product ${item._id}: ${imageUrl}`);
            imageUrl = '';
          }

          return {
            productId: item._id,
            quantity: item.quantity,
            priceAtOrder: item.price,
            name: item.name,
            photo: imageUrl || null
          };
        }),
        totalAmount,
        shippingAddress,
        paymentMethod
      };

      await dispatch(createOrder(orderData));
      
      // Update local cart state
      const updatedCart = cartItems.filter(item => !selectedItems.includes(item._id));
      const cartKey = `cart_${userId}`;
      await SecureStore.setItemAsync(cartKey, JSON.stringify(updatedCart));
      
      setCartItems(updatedCart);
      setSelectedItems([]);
      setCartItemCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));

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
    } catch (error) {
      // Error handling is done in the reducer
    }
  };

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
                    disabled={selectedItems.length === 0 || isProcessing}
                    loading={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
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
    backgroundColor: '#fff',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
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
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  header: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subheader: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  cartItemsContainer: {
    paddingHorizontal: 20,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectAllText: {
    color: 'white',
    marginLeft: 10,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: 'rgba(255,140,66,0.2)',
    borderWidth: 1,
    borderColor: '#ff8c42',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginLeft: 10,
  },
  fallbackImage: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  itemPrice: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
  },
  itemTotalPrice: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#ff8c42',
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: 'white',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeText: {
    color: '#ff5e62',
    marginLeft: 5,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyCartTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyCartSubtitle: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
  },
  browseButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ff8c42',
    borderRadius: 20,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  orderSummary: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  orderDetails: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    color: 'white',
    fontSize: 16,
  },
  totalValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#ff8c42',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
  },
  checkoutButtonLabel: {
    color: 'white',
    fontSize: 16,
  },
  buttonContent: {
    height: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paymentLabel: {
    color: 'white',
    marginLeft: 10,
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