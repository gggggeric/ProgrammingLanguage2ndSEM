

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
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList
} from 'react-native';
import { Title } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import API_BASE_URL from '../../../config';

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  
  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewPhotos, setReviewPhotos] = useState([]);

  // Status options for filter
  const statusOptions = [
    { label: 'All Orders', value: 'all' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

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

  // Apply filter when orders or statusFilter changes
  useEffect(() => {
    applyFilter();
  }, [orders, statusFilter]);

  // Request permissions for camera and media library
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert('Permissions Required', 'Please grant camera and photo library permissions to upload review photos.');
      }
    })();
  }, []);

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

  const applyFilter = () => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
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

  const handleReviewPress = (order) => {
    setSelectedOrder(order);
    // Reset review form
    setRating(5);
    setTitle('');
    setComment('');
    setReviewPhotos([]);
    setReviewModalVisible(true);
  };

  const toggleStatusFilter = () => {
    setShowStatusFilter(!showStatusFilter);
  };

  const pickImageFromLibrary = async () => {
    try {
      if (reviewPhotos.length >= 5) {
        Alert.alert('Limit Reached', 'You can only upload up to 5 photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - reviewPhotos.length,
      });
      
      if (!result.canceled && result.assets) {
        const newPhotos = [...reviewPhotos, ...result.assets];
        if (newPhotos.length > 5) {
          Alert.alert('Too many photos', 'Only the first 5 photos will be used');
          setReviewPhotos(newPhotos.slice(0, 5));
        } else {
          setReviewPhotos(newPhotos);
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const takePhoto = async () => {
    try {
      if (reviewPhotos.length >= 5) {
        Alert.alert('Limit Reached', 'You can only upload up to 5 photos');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets) {
        const newPhotos = [...reviewPhotos, ...result.assets];
        if (newPhotos.length > 5) {
          setReviewPhotos(newPhotos.slice(0, 5));
        } else {
          setReviewPhotos(newPhotos);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const removePhoto = (index) => {
    const updatedPhotos = [...reviewPhotos];
    updatedPhotos.splice(index, 1);
    setReviewPhotos(updatedPhotos);
  };
  const submitReview = async () => {
    if (!selectedOrder) return;
  
    if (!comment || comment.trim() === '') {
      Alert.alert('Error', 'Please enter a review comment');
      return;
    }
  
    try {
      setIsSubmittingReview(true);
      const authToken = await SecureStore.getItemAsync('authToken');
  
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('orderId', selectedOrder._id);
      formData.append('rating', rating.toString());
      formData.append('comment', comment);
  
      if (title && title.trim() !== '') {
        formData.append('title', title);
      }
  
      if (reviewPhotos.length > 0) {
        reviewPhotos.forEach((photo, index) => {
          const fileUri = photo.uri;
          const fileName = fileUri.split('/').pop();
          const fileExt = fileName.split('.').pop() || 'jpg';
          
          formData.append('photos', {
            uri: fileUri,
            name: `photo_${index}.${fileExt}`,
            type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
          });
        });
      }
  
      const response = await fetch(`${API_BASE_URL}/review/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData
      });
  
      // Check response content type
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        let errorData;
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
  
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned unexpected response format');
      }
  
      const data = await response.json();
  
      Alert.alert('Success', 'Your review has been submitted successfully!');
      setReviewModalVisible(false);
      setRating(5);
      setTitle('');
      setComment('');
      setReviewPhotos([]);
      fetchOrders();
    } catch (error) {
      console.error('Review submission error:', error);
      
      let errorMessage = error.message;
      
      // Handle common error cases
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('Unexpected response') || 
                 error.message.includes('non-JSON')) {
        errorMessage = 'Server error occurred. Please try again.';
      }
  
      Alert.alert('Error Submitting Review', errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
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

          {selectedOrder?.status === 'delivered' && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => {
                setModalVisible(false);
                handleReviewPress(selectedOrder);
              }}
            >
              <Text style={styles.reviewButtonText}>Write a Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  const ReviewModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={reviewModalVisible}
      onRequestClose={() => setReviewModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.reviewScrollContainer}>
            <View style={styles.reviewModalContent}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setReviewModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#ff8c42" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Write a Review</Text>
              
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingLabel}>Your Rating:</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                    >
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={32}
                        color="#ff8c42"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={styles.inputLabel}>Title (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Summarize your experience"
                placeholderTextColor="#888"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              <Text style={styles.inputLabel}>Your Review</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Share details about your experience with this order..."
                placeholderTextColor="#888"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                maxLength={500}
              />

              <Text style={styles.inputLabel}>Photos (Optional - Max 5)</Text>
              
              <View style={styles.photoActionsContainer}>
                <TouchableOpacity 
                  style={styles.photoActionButton} 
                  onPress={pickImageFromLibrary}
                  disabled={reviewPhotos.length >= 5}
                >
                  <Ionicons name="images" size={20} color="#ff8c42" />
                  <Text style={styles.photoActionText}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoActionButton} 
                  onPress={takePhoto}
                  disabled={reviewPhotos.length >= 5}
                >
                  <Ionicons name="camera" size={20} color="#ff8c42" />
                  <Text style={styles.photoActionText}>Camera</Text>
                </TouchableOpacity>
              </View>

              {reviewPhotos.length > 0 && (
                <FlatList
                  data={reviewPhotos}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => `photo-${index}`}
                  contentContainerStyle={styles.photosList}
                  renderItem={({ item, index }) => (
                    <View style={styles.photoContainer}>
                      <Image 
                        source={{ uri: item.uri }} 
                        style={styles.reviewPhoto} 
                      />
                      <TouchableOpacity 
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ff8c42" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!comment || comment.trim() === '') && styles.disabledButton
                ]}
                onPress={submitReview}
                disabled={isSubmittingReview || !comment || comment.trim() === ''}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Submit Review
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
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
  onPress={() => navigation.navigate('Home')}
>
  <Ionicons name="arrow-back" size={24} color="#ff8c42" />
</TouchableOpacity>


            <View style={styles.headerContainer}>
              <Title style={styles.header}>Order History</Title>
              <Text style={styles.subheader}>{filteredOrders.length} orders</Text>
            </View>

            {/* Status Filter */}
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={toggleStatusFilter}
              >
                <Text style={styles.filterButtonText}>
                  {statusOptions.find(opt => opt.value === statusFilter)?.label || 'Filter Orders'}
                </Text>
                <Ionicons 
                  name={showStatusFilter ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#ff8c42" 
                />
              </TouchableOpacity>

              {showStatusFilter && (
                <View style={styles.filterDropdown}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        statusFilter === option.value && styles.selectedFilterOption
                      ]}
                      onPress={() => {
                        setStatusFilter(option.value);
                        setShowStatusFilter(false);
                      }}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        statusFilter === option.value && styles.selectedFilterOptionText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {filteredOrders.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="receipt-outline" size={64} color="#ff8c42" />
                <Text style={styles.emptyCartTitle}>No orders found</Text>
                <Text style={styles.emptyCartSubtitle}>
                  {statusFilter === 'all' 
                    ? 'Your order history will appear here' 
                    : `No ${statusFilter} orders found`}
                </Text>
              </View>
            ) : (
              filteredOrders.map(order => (
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

                    {order.status === 'delivered' && (
                      <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() => handleReviewPress(order)}
                      >
                        <Text style={styles.reviewButtonText}>Write a Review</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </LinearGradient>
      </ImageBackground>

      <OrderDetailsModal />
      <ReviewModal />
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
    marginBottom: 20,
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
  filterContainer: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  filterButtonText: {
    color: '#ff8c42',
    fontSize: 16,
  },
  filterDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
    paddingVertical: 8,
    zIndex: 10,
  },
  filterOption: {
    padding: 12,
  },
  selectedFilterOption: {
    backgroundColor: 'rgba(255, 140, 66, 0.2)',
  },
  filterOptionText: {
    color: '#e0e0e0',
    fontSize: 16,
  },
  selectedFilterOptionText: {
    color: '#ff8c42',
    fontWeight: 'bold',
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
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  fallbackImage: {
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  itemTotal: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#ff8c42',
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 8,
  },
  orderTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 140, 66, 0.2)',
  },
  totalLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    color: '#ff8c42',
    fontWeight: 'bold',
  },
  reviewButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 140, 66, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.5)',
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#ff8c42',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  reviewScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  reviewModalContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
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
    color: '#fff',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 140, 66, 0.3)',
    paddingBottom: 8,
  },
  modalItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  modalItemDetails: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  modalItemPrice: {
    fontSize: 12,
    color: '#888',
  },
  modalItemTotal: {
    fontSize: 14,
    color: '#ff8c42',
    fontWeight: 'bold',
    marginTop: 4,
  },
  addressContainer: {
    backgroundColor: 'rgba(40, 40, 40, 0.5)',
    borderRadius: 8,
    padding: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  summaryValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 140, 66, 0.3)',
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  photoActionButton: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderRadius: 8,
    width: '45%',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  photoActionText: {
    color: '#ff8c42',
    fontSize: 14,
    marginTop: 4,
  },
  photosList: {
    paddingVertical: 8,
  },
  photoContainer: {
    marginRight: 12,
    position: 'relative',
  },
  reviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: '#ff8c42',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderHistoryScreen;