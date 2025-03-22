import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { Button, Title, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // For image upload
import API_BASE_URL from '../../../config';

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState(null); // For profile photo
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const toggleSecureConfirmEntry = () => {
    setSecureConfirmTextEntry(!secureConfirmTextEntry);
  };

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 0.25;
    // Contains number
    if (/\d/.test(password)) strength += 0.25;
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 0.25;
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 0.25;
    
    return strength;
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setPasswordStrength(calculatePasswordStrength(text));
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 0.25) return "Weak";
    if (passwordStrength <= 0.5) return "Fair";
    if (passwordStrength <= 0.75) return "Good";
    return "Strong";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 0.25) return "#FF5252";
    if (passwordStrength <= 0.5) return "#FFD740";
    if (passwordStrength <= 0.75) return "#69F0AE";
    return "#00C853";
  };

  // Handle profile photo upload
  const handleImagePicker = async (useCamera) => {
    const { status } = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to upload images.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        });

    if (!result.canceled) {
      setProfilePhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address (e.g., example@gmail.com).');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (passwordStrength < 0.5) {
      Alert.alert('Weak Password', 'Please create a stronger password with at least 8 characters, including uppercase letters, numbers, and special characters.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          profilePhoto, 
          address 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Registration successful! Please log in.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error("Registration Error:", error);
      Alert.alert('Error', 'Network error, please try again.');
    }
  };

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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidContainer}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#ff8c42" />
              </TouchableOpacity>

              {/* Profile Photo Section */}
              <View style={styles.profilePhotoContainer}>
                <TouchableOpacity 
                  style={styles.profilePhotoWrapper}
                  onPress={() => {
                    Alert.alert(
                      'Choose Option',
                      'Take a photo or upload from gallery?',
                      [
                        {
                          text: 'Take Photo',
                          onPress: () => handleImagePicker(true),
                        },
                        {
                          text: 'Upload from Gallery',
                          onPress: () => handleImagePicker(false),
                        },
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                      ]
                    );
                  }}
                >
                  {profilePhoto ? (
                    <Image
                      source={{ uri: profilePhoto }}
                      style={styles.profilePhoto}
                    />
                  ) : (
                    <Ionicons name="person" size={60} color="#ff8c42" />
                  )}
                  <View style={styles.editIcon}>
                    <Ionicons name="pencil" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              <Title style={styles.header}>Create Account</Title>
              <Text style={styles.subheader}>Sign up to get started</Text>

              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Full Name <Text style={styles.optionalText}>(Optional)</Text></Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <Text style={styles.inputLabel}>Email Address <Text style={styles.requiredText}>*</Text></Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.inputLabel}>Password <Text style={styles.requiredText}>*</Text></Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={toggleSecureEntry} style={styles.eyeIcon}>
                    <Ionicons 
                      name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
                
                {password.length > 0 && (
                  <View style={styles.passwordStrengthContainer}>
                    <ProgressBar progress={passwordStrength} color={getPasswordStrengthColor()} style={styles.passwordStrengthBar} />
                    <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor() }]}>
                      {getPasswordStrengthLabel()}
                    </Text>
                  </View>
                )}

                <Text style={styles.passwordHint}>Password should be at least 8 characters with uppercase, numbers, and special characters</Text>

                <Text style={styles.inputLabel}>Confirm Password <Text style={styles.requiredText}>*</Text></Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#666"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={secureConfirmTextEntry}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={toggleSecureConfirmEntry} style={styles.eyeIcon}>
                    <Ionicons 
                      name={secureConfirmTextEntry ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
                
                {password && confirmPassword && password !== confirmPassword && (
                  <Text style={styles.passwordMismatch}>Passwords do not match</Text>
                )}

                <Text style={styles.inputLabel}>Address <Text style={styles.optionalText}>(Optional)</Text></Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="home-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Street"
                    placeholderTextColor="#666"
                    value={address.street}
                    onChangeText={(text) => setAddress({ ...address, street: text })}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="#666"
                    value={address.city}
                    onChangeText={(text) => setAddress({ ...address, city: text })}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="#666"
                    value={address.state}
                    onChangeText={(text) => setAddress({ ...address, state: text })}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Postal Code"
                    placeholderTextColor="#666"
                    value={address.postalCode}
                    onChangeText={(text) => setAddress({ ...address, postalCode: text })}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Country"
                    placeholderTextColor="#666"
                    value={address.country}
                    onChangeText={(text) => setAddress({ ...address, country: text })}
                  />
                </View>

                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>
                    By registering, you agree to our {' '}
                    <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>
                      Terms of Service
                    </Text>
                    {' '} and {' '}
                    <Text style={styles.termsLink} onPress={() => navigation.navigate('Privacy')}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>

                <Button
                  mode="contained"
                  onPress={handleRegister}
                  style={styles.registerButton}
                  labelStyle={styles.registerButtonLabel}
                  contentStyle={styles.buttonContent}
                >
                  CREATE ACCOUNT
                </Button>
                
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.divider} />
                </View>
                
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')}
                  style={styles.loginContainer}
                >
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

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
  keyboardAvoidContainer: {
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
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhotoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ff8c42',
    borderRadius: 15,
    padding: 5,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff8c42',
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputLabel: {
    color: '#e0e0e0',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  requiredText: {
    color: '#ff8c42',
    fontWeight: 'bold',
  },
  optionalText: {
    color: '#999',
    fontSize: 14,
    fontWeight: 'normal',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  inputIcon: {
    padding: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#fff',
    fontSize: 16,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordStrengthText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  passwordHint: {
    color: '#999',
    fontSize: 12,
    marginBottom: 20,
  },
  passwordMismatch: {
    color: '#FF5252',
    fontSize: 14,
    marginTop: -15,
    marginBottom: 20,
  },
  termsContainer: {
    marginBottom: 20,
  },
  termsText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: '#ff8c42',
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: '#ff8c42',
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: '#ff8c42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  registerButtonLabel: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  buttonContent: {
    height: 50,
    paddingVertical: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: '#ccc',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#ccc',
    fontSize: 16,
  },
  loginLink: {
    color: '#ff8c42',
    fontSize: 16,
    fontWeight: 'bold',
  },
});