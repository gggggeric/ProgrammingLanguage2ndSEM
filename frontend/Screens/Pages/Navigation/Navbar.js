import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function Navbar() {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();

  // Function to navigate & close menu
  const handleNavigation = (screen) => {
    setMenuVisible(false);
    navigation.navigate(screen);
  };

  return (
    <View style={styles.navbar}>
      {/* Burger Icon */}
      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
        <Ionicons name="menu" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.navTitle}>My App</Text>

      {/* Modal for Dropdown Menu */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('Foods')}>
              <Ionicons name="fast-food" size={24} color="#6200ee" />
              <Text style={styles.menuText}>Foods</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('Cart')}>
              <Ionicons name="cart" size={24} color="#6200ee" />
              <Text style={styles.menuText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('About')}>
              <Ionicons name="information-circle" size={24} color="#6200ee" />
              <Text style={styles.menuText}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('Account')}>
              <Ionicons name="person" size={24} color="#6200ee" />
              <Text style={styles.menuText}>Account</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    elevation: 5, // For shadow effect
  },
  menuButton: {
    padding: 10,
  },
  navTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    width: 250,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  menuText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#333',
  },
});
