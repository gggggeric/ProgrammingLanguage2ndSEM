import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { Title } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import API_BASE_URL from '../../../config';

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch user ID from secure storage
  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await SecureStore.getItemAsync('userId');
      setUserId(storedUserId);
    };
    fetchUserId();
  }, []);

  // Fetch orders when userId changes
  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const authToken = await SecureStore.getItemAsync('authToken');
      
      const response = await fetch(`${API_BASE_URL}/order/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      const processedOrders = data.orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          productImage: item.photo ? { uri: item.photo } : null,
          priceAtOrder: parseInt(item.priceAtOrder?.$numberInt || item.priceAtOrder || 0)
        })),
        totalAmount: parseInt(order.totalAmount?.$numberInt || order.totalAmount || 0)
      }));

      setOrders(processedOrders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', error.message || 'Failed to load order history');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'shipped': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const ProductImage = ({ source, productName }) => {
    const [error, setError] = useState(false);
    
    if (error || !source?.uri) {
      return (
        <View style={[styles.itemImage, styles.fallbackImage]}>
          <Ionicons name="fast-food" size={24} color="#ccc" />
        </View>
      );
    }

    return (
      <Image
        source={source}
        style={styles.itemImage}
        onError={() => setError(true)}
        resizeMode="cover"
      />
    );
  };

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const OrderDetailsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#ff8c42" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Order Details</Text>
          
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Items Ordered</Text>
            {selectedOrder?.items.map((item, index) => (
              <View key={index} style={styles.modalItem}>
                <ProductImage source={item.productImage} productName={item.name} />
                <View style={styles.modalItemDetails}>
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemPrice}>₱{item.priceAtOrder} × {item.quantity}</Text>
                  <Text style={styles.modalItemTotal}>₱{item.priceAtOrder * item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {selectedOrder?.shippingAddress && (
              <View style={styles.addressContainer}>
                <Text style={styles.addressText}>
                  {selectedOrder.shippingAddress.street}
                </Text>
                <Text style={styles.addressText}>
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                </Text>
                <Text style={styles.addressText}>
                  {selectedOrder.shippingAddress.postalCode}
                </Text>
                <Text style={styles.addressText}>
                  {selectedOrder.shippingAddress.country}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status:</Text>
              <Text style={[styles.summaryValue, { color: getStatusColor(selectedOrder?.status) }]}>
                {selectedOrder?.status?.charAt(0).toUpperCase() + selectedOrder?.status?.slice(1)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{formatDate(selectedOrder?.createdAt)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method:</Text>
              <Text style={styles.summaryValue}>
                {selectedOrder?.paymentMethod?.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₱{selectedOrder?.totalAmount}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8c42" />
      </View>
    );
  }

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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#ff8c42']}
                tintColor="#ff8c42"
              />
            }
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ff8c42" />
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <Title style={styles.header}>Order History</Title>
              <Text style={styles.subheader}>{orders.length} past orders</Text>
            </View>

            {orders.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="receipt-outline" size={64} color="#ff8c42" />
                <Text style={styles.emptyCartTitle}>No orders found</Text>
                <Text style={styles.emptyCartSubtitle}>Your order history will appear here</Text>
              </View>
            ) : (
              orders.map(order => (
                <TouchableOpacity
                  key={order._id}
                  onPress={() => handleOrderPress(order)}
                  activeOpacity={0.8}
                >
                  <View style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderTitle}>Order #{order._id.substring(18, 24).toUpperCase()}</Text>
                      <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>

                    <View style={styles.itemsContainer}>
                      {order.items.slice(0, 3).map((item, index) => (
                        <View key={`${order._id}-${index}`} style={styles.orderItem}>
                          <ProductImage 
                            source={item.productImage} 
                            productName={item.name}
                          />
                          <View style={styles.itemDetails}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.itemPriceRow}>
                              <Text style={styles.itemPrice}>₱{item.priceAtOrder}</Text>
                              <Text style={styles.itemQuantity}>× {item.quantity}</Text>
                              <Text style={styles.itemTotal}>₱{item.priceAtOrder * item.quantity}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>

                    {order.items.length > 3 && (
                      <Text style={styles.moreItemsText}>
                        +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                      </Text>
                    )}

                    <View style={styles.orderTotalContainer}>
                      <Text style={styles.totalLabel}>Order Total:</Text>
                      <Text style={styles.totalAmount}>₱{order.totalAmount}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </LinearGradient>
      </ImageBackground>

      <OrderDetailsModal />
    </View>
  );
};

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
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
    marginTop: 8,
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
  orderCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  itemsContainer: {
    marginTop: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  fallbackImage: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 13,
    color: '#ff8c42',
    marginRight: 8,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#888',
    marginRight: 8,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  orderTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8c42',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff8c42',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8c42',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,140,66,0.3)',
    paddingBottom: 5,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalItemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  modalItemName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  modalItemPrice: {
    fontSize: 13,
    color: '#888',
  },
  modalItemTotal: {
    fontSize: 14,
    color: '#ff8c42',
    fontWeight: 'bold',
  },
  addressContainer: {
    backgroundColor: 'rgba(40,40,40,0.5)',
    borderRadius: 8,
    padding: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  summaryValue: {
    fontSize: 14,
    color: '#fff',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});

export default OrderHistoryScreen;