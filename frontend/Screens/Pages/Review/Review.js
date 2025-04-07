import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  ActivityIndicator, 
  StatusBar,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Dimensions
} from 'react-native';
import { Title } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../../../config';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const UserReviewsScreen = ({ navigation }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [updatedRating, setUpdatedRating] = useState(1);
  const [updatedTitle, setUpdatedTitle] = useState('');
  const [updatedComment, setUpdatedComment] = useState('');

  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync('userId');
        if (!storedUserId) {
          console.error('User ID not found in SecureStore.');
          return;
        }
        setUserId(storedUserId);

        const response = await fetch(`${API_BASE_URL}/review/user/${storedUserId}`);
        const data = await response.json();

        if (response.ok) {
          setReviews(data.reviews);
        } else {
          console.error('Failed to fetch reviews:', data.message);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, []);

  const handleEditReview = (review) => {
    setEditingReview(review);
    setUpdatedRating(review.rating);
    setUpdatedTitle(review.title);
    setUpdatedComment(review.comment);
    setModalVisible(true);
  };

  const handleSaveReview = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUserId = await SecureStore.getItemAsync('userId');
  
      if (!storedToken || !storedUserId) {
        alert('Authentication details are missing. Please log in again.');
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/review/update/${editingReview._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'UserId': storedUserId,
        },
        body: JSON.stringify({
          rating: updatedRating,
          title: updatedTitle,
          comment: updatedComment
        })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setReviews((prevReviews) =>
          prevReviews.map((r) =>
            r._id === editingReview._id ? data.review : r
          )
        );
        setModalVisible(false);
        setEditingReview(null);
      } else {
        console.error('Failed to update review:', data.message);
        alert('Failed to update review. Please try again.');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Error: ' + error.message);
    }
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <LinearGradient
        colors={['rgba(30, 30, 30, 0.8)', 'rgba(20, 20, 20, 0.9)']}
        style={styles.cardGradient}
      >
        <View style={styles.header}>
          <Image
            source={{ uri: item.userId.profilePhoto }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{item.userId.name}</Text>
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons 
                  key={i} 
                  name={i < item.rating ? "star" : "star-outline"} 
                  size={16} 
                  color="#ff8c42" 
                />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.comment}>{item.comment}</Text>

        {item.photos && item.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.photos.map((photo, idx) => (
              <Image 
                key={idx} 
                source={{ uri: photo }} 
                style={styles.reviewPhoto} 
              />
            ))}
          </ScrollView>
        )}

        <TouchableOpacity 
          style={styles.editButtonContainer}
          onPress={() => handleEditReview(item)}
        >
          <Text style={styles.editButton}>Edit Review</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
          style={styles.backgroundImage}
          blurRadius={3}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#ff8c42" />
            </View>
          </LinearGradient>
        </ImageBackground>
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
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ff8c42" />
            </TouchableOpacity>
            <Title style={styles.screenTitle}>My Reviews</Title>
            <View style={styles.placeholder} />
          </View>
          
          <FlatList
            data={reviews}
            keyExtractor={(item) => item._id}
            renderItem={renderReviewItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={60} color="#ff8c42" />
                <Text style={styles.empty}>You haven't posted any reviews yet.</Text>
              </View>
            }
          />
        </LinearGradient>
      </ImageBackground>

      {/* Modal for Editing Review */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <ScrollView contentContainerStyle={styles.modalScrollView}>
                <Text style={styles.modalTitle}>Edit Review</Text>

                <TextInput
                  style={styles.input}
                  value={updatedTitle}
                  onChangeText={setUpdatedTitle}
                  placeholder="Title"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, styles.commentInput]}
                  value={updatedComment}
                  onChangeText={setUpdatedComment}
                  placeholder="Comment"
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#999"
                />
                
                <View style={styles.ratingInputContainer}>
                  <Text style={styles.ratingLabel}>Rating:</Text>
                  <View style={styles.starRatingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity 
                        key={star} 
                        onPress={() => setUpdatedRating(star)}
                      >
                        <Ionicons 
                          name={star <= updatedRating ? "star" : "star-outline"} 
                          size={32} 
                          color="#ff8c42" 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveReview}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// ... (keep the same styles as before, just remove any unused ones)

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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff8c42',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  reviewCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  cardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#ff8c42',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: 17,
    marginBottom: 8,
    color: '#ff8c42',
  },
  comment: {
    fontSize: 15,
    marginBottom: 14,
    color: '#e0e0e0',
    lineHeight: 22,
  },
  reviewPhoto: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
  editButtonContainer: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ff8c42',
    borderRadius: 5,
    padding: 8,
    alignItems: 'center',
  },
  editButton: {
    color: '#ff8c42',
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  empty: {
    color: '#ff8c42',
    fontSize: 16,
    marginTop: 10,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ff8c42',
  },
  modalScrollView: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff8c42',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  ratingInputContainer: {
    marginBottom: 15,
  },
  ratingLabel: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
  },
  starRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    alignSelf: 'center',
  },
  photosLabel: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
  },
  photosScrollView: {
    marginBottom: 20,
  },
  photoPreviewContainer: {
    position: 'relative',
    marginRight: 15,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff8c42',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff8c42',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    color: '#ff8c42',
    marginTop: 5,
    fontSize: 12,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#ff8c42',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UserReviewsScreen;