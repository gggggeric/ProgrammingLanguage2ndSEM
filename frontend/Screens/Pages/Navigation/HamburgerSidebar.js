import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const HamburgerSidebar = ({ closeDrawer }) => {
  const navigation = useNavigation();

  const handleNavigation = (screen) => {
    navigation.navigate(screen);
    closeDrawer();
  };

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Menu</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.drawerItem}
        onPress={() => handleNavigation('Home')}
      >
        <Ionicons name="home" size={24} color="#ff8c42" />
        <Text style={styles.drawerItemText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.drawerItem}
        onPress={() => handleNavigation('Order History')}
      >
        <Ionicons name="time" size={24} color="#ff8c42" />
        <Text style={styles.drawerItemText}>Order History</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.drawerItem}
        onPress={() => handleNavigation('ReviewHistory')}
      >
        <Ionicons name="document-text" size={24} color="#ff8c42" />
        <Text style={styles.drawerItemText}>My Reviews</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.drawerItem}
        onPress={() => handleNavigation('Profile')}
      >
        <Ionicons name="person" size={24} color="#ff8c42" />
        <Text style={styles.drawerItemText}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.drawerItem}
        onPress={() => handleNavigation('Settings')}
      >
        <Ionicons name="settings" size={24} color="#ff8c42" />
        <Text style={styles.drawerItemText}>Settings</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 20,
    width: 300,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 140, 66, 0.3)',
  },
  drawerTitle: {
    color: '#ff8c42',
    fontSize: 24,
    fontWeight: 'bold',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerItemText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
});

export default HamburgerSidebar;