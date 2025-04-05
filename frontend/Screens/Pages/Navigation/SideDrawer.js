import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export default function Sidebar({ cartItemCount: propCartItemCount }) {
  const navigation = useNavigation();
  const [userType, setUserType] = useState('user'); // Default to 'user'
  const [cartItemCount, setCartItemCount] = useState(propCartItemCount || 0);

  // Fetch userType from SecureStore when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get userType
        const storedUserType = await SecureStore.getItemAsync('userType');
        if (storedUserType) {
          setUserType(storedUserType);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Update cart count when prop changes
  useEffect(() => {
    setCartItemCount(propCartItemCount || 0);
  }, [propCartItemCount]);

  // Function to navigate
  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.sidebar}>
      {/* Render Admin Tabs if userType is 'admin' */}
      {userType === 'admin' ? (
        <>
          {/* Dashboard Tab */}
          <TouchableOpacity style={styles.tab} onPress={() => handleNavigation('AdminDashboard')}>
            <Ionicons name="grid" size={24} color="#ff8c42" />
            <Text style={styles.tabText}>Dashboard</Text>
          </TouchableOpacity>

          {/* Profile Tab */}
          <TouchableOpacity style={styles.tab} onPress={() => handleNavigation('Profile')}>
            <Ionicons name="person" size={24} color="#ff8c42" />
            <Text style={styles.tabText}>Profile</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Render User Tabs if userType is 'user' */}
          <TouchableOpacity style={styles.tab} onPress={() => handleNavigation('Home')}>
            <Ionicons name="home" size={24} color="#ff8c42" />
            <Text style={styles.tabText}>Home</Text>
          </TouchableOpacity>

          {/* History Tab */}
          <TouchableOpacity style={styles.tab} onPress={() => handleNavigation('Order History')}>
            <Ionicons name="time" size={24} color="#ff8c42" />
            <Text style={styles.tabText}>History</Text>
          </TouchableOpacity>

          {/* Cart Tab */}
          <TouchableOpacity style={styles.tab} onPress={() => handleNavigation('Cart')}>
            <View style={styles.cartContainer}>
              <Ionicons name="cart" size={24} color="#ff8c42" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.tabText}>Cart</Text>
          </TouchableOpacity>

          {/* Account Tab */}
          <TouchableOpacity style={styles.tab} onPress={() => handleNavigation('Profile')}>
            <Ionicons name="person" size={24} color="#ff8c42" />
            <Text style={styles.tabText}>Account</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 80,
    height: Dimensions.get('window').height,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(26, 26, 26, 0.85)', // Dark semi-transparent background
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 140, 66, 0.3)', // Light orange border
    paddingTop: 40,
    elevation: 5, // For shadow effect
  },
  tab: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
    paddingVertical: 10,
  },
  tabText: {
    color: '#fff', // White text
    fontSize: 12,
    marginTop: 10,
  },
  cartContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff5e62',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});