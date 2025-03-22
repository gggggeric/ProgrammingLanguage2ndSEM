import React from 'react';
import { View, StyleSheet, ImageBackground, StatusBar, Dimensions } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const Landing = ({ navigation }) => {
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
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Title style={styles.logoText}>A</Title>
            </View>
            <Title style={styles.appName}>APP NAME</Title>
          </View>
          
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Welcome Back</Title>
              <Paragraph style={styles.subtitle}>
                Sign in to continue your journey or create a new account
              </Paragraph>
            </Card.Content>
            <Card.Actions style={styles.actions}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Login')}
                style={[styles.button, styles.loginButton]}
                labelStyle={styles.loginButtonLabel}
                contentStyle={styles.buttonContent}
              >
                SIGN IN
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Register')}
                style={[styles.button, styles.registerButton]}
                labelStyle={styles.registerButtonLabel}
                contentStyle={styles.buttonContent}
              >
                CREATE ACCOUNT
              </Button>
            </Card.Actions>
          </Card>
          
          <View style={styles.footerContainer}>
            <Button
              mode="text"
              onPress={() => navigation.navigate('About')}
              labelStyle={styles.footerText}
            >
              About Us
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Privacy')}
              labelStyle={styles.footerText}
            >
              Privacy Policy
            </Button>
          </View>
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
    justifyContent: 'space-between',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.08,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff8c42',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  appName: {
    color: '#fff',
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: '700',
  },
  card: {
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    borderRadius: 16,
    marginVertical: height * 0.05,
    paddingVertical: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 2,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#ff8c42',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#e0e0e0',
    marginBottom: 16,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
    height: 50,
  },
  buttonContent: {
    height: 50,
    paddingVertical: 8,
  },
  loginButton: {
    backgroundColor: '#ff8c42',
    shadowColor: '#ff8c42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonLabel: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  registerButton: {
    borderColor: '#ff8c42',
    borderWidth: 2,
  },
  registerButtonLabel: {
    color: '#ff8c42',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});

export default Landing;