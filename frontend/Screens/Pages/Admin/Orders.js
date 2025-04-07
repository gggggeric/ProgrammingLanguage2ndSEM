import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Modal,
  Pressable,
  Alert,
  StatusBar,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Title } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import API_BASE_URL from '../../../config';

const AdminOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  const statusOptions = ['processing', 'shipped', 'delivered', 'cancelled'];

  const fetchAdminOrders = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userId = await SecureStore.getItemAsync('userId');
      const userType = await SecureStore.getItemAsync('userType');
      
      if (userType !== 'admin') {
        setError('Admin access required');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/admin/products/orders/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allOrders = response.data.products.flatMap(product => 
        product.orders.map(order => ({
          ...order,
          productDetails: product
        }))
      );
      
      setOrders(allOrders);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status);
    setModalVisible(true);
  };

  const updateOrderStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      
      await axios.put(
        `${API_BASE_URL}/admin/products/ordersUpdate/${selectedOrder.orderId}`,
        { status: selectedStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(orders.map(order => 
        order.orderId === selectedOrder.orderId 
          ? { ...order, status: selectedStatus } 
          : order
      ));

      setModalVisible(false);
      Alert.alert('Success', 'Order status updated successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update order status');
    }
  };

  useEffect(() => { 
    fetchAdminOrders(); 
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'processing': return '#f39c12';
      case 'shipped': return '#3498db';
      case 'delivered': return '#2ecc71';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item.orderId.slice(-6).toUpperCase()}</Text>
        <TouchableOpacity 
          style={[
            styles.statusButton,
            { backgroundColor: getStatusColor(item.status) }
          ]}
          onPress={() => openStatusModal(item)}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.customer}>
        <Ionicons name="person-outline" size={16} color="#ff8c42" /> {item.customer.name} ({item.customer.email})
      </Text>
      
      {item.items.map((orderItem, index) => (
        <View key={index} style={styles.productRow}>
          <Image 
            source={{ uri: orderItem.photo || item.productDetails.productPhoto }} 
            style={styles.productImage} 
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{orderItem.name || item.productDetails.productName}</Text>
            <Text style={styles.productQuantity}>₱{orderItem.priceAtOrder} × {orderItem.quantity}</Text>
          </View>
          <Text style={styles.productTotal}>
          ₱{(orderItem.priceAtOrder * orderItem.quantity).toFixed(2)}
          </Text>
        </View>
      ))}
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>
          <Ionicons name="calendar-outline" size={14} color="#999" /> {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.orderTotal}>
          Total: ₱{item.totalAmount.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#ff8c42" />
    </View>
  );

  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
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
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidContainer}
          >
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#ff8c42" />
              </TouchableOpacity>
              <Title style={styles.header}>Order Management</Title>
            </View>

            <FlatList
              data={orders}
              renderItem={renderItem}
              keyExtractor={item => item.orderId}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={48} color="#ff8c42" />
                  <Text style={styles.emptyText}>No orders for your products yet</Text>
                </View>
              }
            />

            {/* Status Update Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Update Order Status</Text>
                  
                  <View style={styles.statusOptions}>
                    {statusOptions.map((status) => (
                      <Pressable
                        key={status}
                        style={[
                          styles.statusOption,
                          selectedStatus === status && styles.selectedStatusOption,
                          { backgroundColor: getStatusColor(status) }
                        ]}
                        onPress={() => setSelectedStatus(status)}
                      >
                        <Text style={styles.statusOptionText}>{status.toUpperCase()}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.modalButtons}>
                    <Pressable 
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </Pressable>
                    
                    <Pressable 
                      style={[styles.modalButton, styles.updateButton]}
                      onPress={updateOrderStatus}
                    >
                      <Text style={styles.buttonText}>Update</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
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
  keyboardAvoidContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff8c42',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customer: {
    color: '#e0e0e0',
    marginBottom: 12,
    fontSize: 14,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 14,
  },
  productQuantity: {
    color: '#aaa',
    fontSize: 12,
  },
  productTotal: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  orderDate: {
    color: '#999',
    fontSize: 12,
  },
  orderTotal: {
    color: '#ff8c42',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#ff8c42',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  modalTitle: {
    color: '#ff8c42',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusOptions: {
    marginBottom: 24,
  },
  statusOption: {
    padding: 14,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedStatusOption: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusOptionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    marginRight: 12,
  },
  updateButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdminOrdersScreen;