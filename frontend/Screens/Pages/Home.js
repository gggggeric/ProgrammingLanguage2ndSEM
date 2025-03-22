import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Navbar from './Navigation/BottomNavbar';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        <Text>Home Screen</Text>
      </View>

      {/* Bottom Navigation Bar */}
      <Navbar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});