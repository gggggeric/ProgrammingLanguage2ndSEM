import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Navbar from './Navigation/BottomNavbar'; // Import Navbar

export default function About() {
  return (
    <View style={styles.container}>
      {/* Navbar */}
      <Navbar />

      {/* Page Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>About Us</Text>
        <Text style={styles.bodyText}>
          Welcome to our application! This app is designed to provide the best user experience.
          We are committed to delivering high-quality products and services.
        </Text>
        <Text style={styles.bodyText}>
          Our goal is to innovate and continuously improve our platform to meet our users' needs.
          Stay tuned for more updates!
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 80, // Avoid overlapping with the navbar
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

