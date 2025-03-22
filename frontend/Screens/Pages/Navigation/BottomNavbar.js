import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export default function BottomNavbar() {
  const navigation = useNavigation();
  const [userType, setUserType] = useState('user'); // Default to 'user'

  // Fetch userType from SecureStore when the component mounts
  useEffect(() => {
    const fetchUserType = async () => {
      const storedUserType = await SecureStore.getItemAsync('userType');
      if (storedUserType) {
        setUserType(storedUserType);
      }
    };
    fetchUserType();
  }, []);

  // Function to navigate
  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.navbar}>
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

          {/* Foods Tab */}
          <TouchableOpacity style={styles.tab} onPress={() => handleNavigation('Foods')}>
            <Ionicons name="fast-food" size={24} color="#ff8c42" />
            <Text style={styles.tabText}>Foods</Text>
          </TouchableOpacity>

          {/* Cart Tab */}
          <TouchableOpacity style={styles.tab} onPress={() => handleNavigation('Cart')}>
            <Ionicons name="cart" size={24} color="#ff8c42" />
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
  navbar: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(26, 26, 26, 0.85)', // Dark semi-transparent background
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 140, 66, 0.3)', // Light orange border
    position: 'absolute',
    bottom: 0,
    left: 0,
    elevation: 5, // For shadow effect
  },
  tab: {
    alignItems: 'center',
  },
  tabText: {
    color: '#fff', // White text
    fontSize: 12,
    marginTop: 5,
  },
});