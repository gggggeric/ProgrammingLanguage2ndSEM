// // Screens/Pages/Admin/reviews.js
// import React, { useState, useEffect } from 'react';
// import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
// import { Card, Rating, Icon } from 'react-native-elements';
// import axios from 'axios';

// const ReviewList = ({ navigation }) => {
//   const [reviews, setReviews] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedReview, setSelectedReview] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);

//   useEffect(() => {
//     fetchReviews();
//   }, []);

//   const fetchReviews = async () => {
//     try {
//       const response = await axios.get('/api/review');
//       setReviews(response.data.reviews);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to fetch reviews');
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = (id) => {
//     Alert.alert(
//       'Delete Review',
//       'Are you sure you want to delete this review?',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Delete',
//           onPress: () => deleteReview(id),
//           style: 'destructive',
//         },
//       ],
//       { cancelable: false }
//     );
//   };

//   const deleteReview = async (id) => {
//     try {
//       await axios.delete(`/api/review/${id}`);
//       fetchReviews();
//       Alert.alert('Success', 'Review deleted successfully');
//     } catch (error) {
//       Alert.alert('Error', 'Failed to delete review');
//       console.error(error);
//     }
//   };

//   const renderItem = ({ item }) => (
//     <Card containerStyle={styles.card}>
//       <TouchableOpacity onPress={() => {
//         setSelectedReview(item);
//         setModalVisible(true);
//       }}>
//         <View style={styles.reviewHeader}>
//           <Image
//             source={{ uri: item.userId?.profilePhoto || 'https://via.placeholder.com/150' }}
//             style={styles.avatar}
//           />
//           <View style={styles.userInfo}>
//             <Text style={styles.userName}>{item.userId?.name || 'Deleted User'}</Text>
//             <Rating
//               readonly
//               imageSize={20}
//               startingValue={item.rating}
//               style={styles.rating}
//             />
//           </View>
//           <Text style={styles.date}>
//             {new Date(item.createdAt).toLocaleDateString()}
//           </Text>
//         </View>
//         {item.title && <Text style={styles.title}>{item.title}</Text>}
//         <Text style={styles.comment}>{item.comment}</Text>
//       </TouchableOpacity>
//       <View style={styles.actions}>
//         <TouchableOpacity onPress={() => handleDelete(item._id)}>
//           <Icon name="delete" color="red" />
//         </TouchableOpacity>
//       </View>
//     </Card>
//   );

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={reviews}
//         renderItem={renderItem}
//         keyExtractor={(item) => item._id}
//         refreshing={loading}
//         onRefresh={fetchReviews}
//       />

//       <Modal
//         animationType="slide"
//         transparent={false}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         {selectedReview && (
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Review Details</Text>
//               <TouchableOpacity onPress={() => setModalVisible(false)}>
//                 <Icon name="close" size={30} />
//               </TouchableOpacity>
//             </View>
            
//             {/* Modal content here */}
//           </View>
//         )}
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 10,
//     backgroundColor: '#f5f5f5',
//   },
//   card: {
//     borderRadius: 8,
//     marginBottom: 10,
//   },
//   reviewHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 10,
//   },
//   userInfo: {
//     flex: 1,
//   },
//   userName: {
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   rating: {
//     alignSelf: 'flex-start',
//   },
//   date: {
//     color: '#888',
//     fontSize: 12,
//   },
//   title: {
//     fontWeight: 'bold',
//     fontSize: 18,
//     marginBottom: 5,
//   },
//   comment: {
//     fontSize: 14,
//     marginBottom: 10,
//   },
//   actions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   modalContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
// });

// export default ReviewList;

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../../../config'; // Ensure this is the correct import for your API base URL.

const { width } = Dimensions.get('window');

const ReviewList = ({ navigation }) => {
  const [review, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch reviews data
  const fetchReviews = async (ownerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/products/product-owner/${ownerId}`);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      Alert.alert('Error', 'Failed to fetch product reviews');
    } finally {
      setLoading(false);
    }
  };
  
  // Then in your useEffect:
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          if (isProductOwner) { // You'll need to determine this
            fetchProductReviews(storedUserId);
          } else {
            fetchUserReviews(storedUserId);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    fetchReviews(); // Initial fetch when component mounts
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  // Handle review deletion
  const handleDelete = (id) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to permanently delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteReview(id), style: 'destructive' }
      ]
    );
  };

  // Delete review API call
  const deleteReview = async (id) => {
    try {
      setDeleteLoading(true);
      await axios.delete(`${API_BASE_URL}/api/review/${id}`);
      setReviews(review.filter(review => review._id !== id)); // Remove review from the list
      Alert.alert('Success', 'Review deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete review');
      console.error('Delete error:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Render review item
  const renderReviewItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reviewItem}
      onPress={() => {
        setSelectedReview(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: item.userId?.profilePhoto || 'https://i.imgur.com/CE5lzXW.png' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.userId?.name || 'Deleted User'}
          </Text>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < item.rating ? 'star' : 'star-outline'}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}
      
      <Text style={styles.reviewComment} numberOfLines={2}>
        {item.comment}
      </Text>
      
      {item.photos?.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.previewPhotos}
        >
          {item.photos.slice(0, 3).map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.previewPhoto}
            />
          ))}
          {item.photos.length > 3 && (
            <View style={styles.morePhotos}>
              <Text style={styles.morePhotosText}>+{item.photos.length - 3}</Text>
            </View>
          )}
        </ScrollView>
      )}
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          handleDelete(item._id);
        }}
        disabled={deleteLoading}
      >
        {deleteLoading ? (
          <ActivityIndicator size="small" color="#FF3B30" />
        ) : (
          <Ionicons name="trash" size={20} color="#FF3B30" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={review}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
              tintColor="#2196F3"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="star-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No reviews found</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchReviews}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={review.length === 0 && styles.emptyListContainer}
        />
      )}

      {/* Review Details Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedReview && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#2196F3" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Review Details</Text>
              <View style={styles.modalHeaderRight} />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalReviewHeader}>
                <Image
                  source={{ uri: selectedReview.userId?.profilePhoto || 'https://i.imgur.com/CE5lzXW.png' }}
                  style={styles.modalAvatar}
                />
                <View style={styles.modalUserInfo}>
                  <Text style={styles.modalUserName}>
                    {selectedReview.userId?.name || 'Deleted User'}
                  </Text>
                  <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < selectedReview.rating ? 'star' : 'star-outline'}
                        size={24}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.reviewContent}>
                {selectedReview.title && (
                  <Text style={styles.modalReviewTitle}>{selectedReview.title}</Text>
                )}
                <Text style={styles.modalReviewComment}>{selectedReview.comment}</Text>
              </View>

              {selectedReview.photos?.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Photos ({selectedReview.photos.length})</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photosContainer}
                  >
                    {selectedReview.photos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.photo}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Order Information</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color="#888" />
                  <Text style={styles.infoText}>
                    Reviewed on {new Date(selectedReview.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons 
                    name={selectedReview.verifiedPurchase ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={selectedReview.verifiedPurchase ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={styles.infoText}>
                    {selectedReview.verifiedPurchase ? 'Verified Purchase' : 'Not Verified'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  refreshButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  reviewItem: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginLeft: 10,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  reviewComment: {
    fontSize: 14,
    color: '#444',
  },
  previewPhotos: {
    marginTop: 10,
  },
  previewPhoto: {
    width: 80,
    height: 80,
    marginRight: 5,
    borderRadius: 5,
    overflow: 'hidden',
  },
  morePhotos: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
    backgroundColor: '#EEE',
    borderRadius: 5,
  },
  morePhotosText: {
    fontSize: 16,
    color: '#555',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  backButton: {
    padding: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalHeaderRight: {
    width: 40,
  },
  modalContent: {
    paddingHorizontal: 15,
  },
  modalReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  modalUserInfo: {
    marginLeft: 15,
  },
  modalUserName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalReviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalReviewComment: {
    fontSize: 14,
    marginVertical: 10,
  },
  sectionContainer: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  photosContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  photo: {
    width: 100,
    height: 100,
    marginRight: 5,
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
  },
});

export default ReviewList;
