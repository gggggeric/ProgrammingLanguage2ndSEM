import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const Profile = ({ navigation }) => {
  const handleLogout = async () => {
    // Remove the auth token from SecureStore
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userType'); // Optional: Remove userType if stored
    Alert.alert('Logged Out', 'You have been logged out successfully.');

    // Reset the navigation stack and redirect to Landing
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Page</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Profile;