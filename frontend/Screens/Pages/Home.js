import React from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import Navbar from './Navigation/Navbar';
export default function Home() {
  const handlePress = () => {
    Alert.alert('Button Pressed!', 'You clicked the button.', [
      { text: 'OK', onPress: () => console.log('OK Pressed') },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Navbar at the top */}
      <Navbar />

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.header}>Welcome to Home</Text>
        <Text style={styles.bodyText}>
          ANG KATE NG BURAT KO
        </Text>
        <Button title="Click Me" onPress={handlePress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 80, // Adjust to avoid overlapping with the navbar
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  bodyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
});
