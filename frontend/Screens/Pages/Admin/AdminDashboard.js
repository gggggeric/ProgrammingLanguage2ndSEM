import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavbar from '../Navigation/BottomNavbar';

const AdminDashboard = ({ navigation }) => {
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ff8c42" />
            </TouchableOpacity>

            {/* Header */}
            <Text style={styles.header}>Admin Dashboard</Text>

            {/* Action Buttons Container */}
            <View style={styles.buttonsContainer}>
              {/* Add Product Button */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ff8c42' }]}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Add Product</Text>
              </TouchableOpacity>

              {/* Accept Orders Button */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => navigation.navigate('Admin Order')}
              >
                <Ionicons name="list" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Manage Orders</Text>
              </TouchableOpacity>
            </View>

            {/* Example Product Card (Static) */}
            <View style={styles.productCard}>
              <Text style={styles.productName}>Example Product</Text>
              <Text style={styles.productDescription}>This is an example product description.</Text>
              <Text style={styles.productPrice}>$12.99</Text>
              <Text style={styles.productCategory}>Category: Vegetarian</Text>
              <Text style={styles.productCrust}>Crust: Thin</Text>
              <Text style={styles.productSize}>Size: Family</Text>

              {/* Edit and Delete Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('EditProduct', { productId: 'exampleId' })}
                >
                  <Ionicons name="pencil" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => Alert.alert('Delete', 'Delete functionality removed')}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Navigation Bar */}
          <BottomNavbar />
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
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff8c42',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  productCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8c42',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 4,
  },
  productCrust: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 4,
  },
  productSize: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AdminDashboard;