import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Button, Title } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import API_BASE_URL from '../../../config';

const Profile = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = await SecureStore.getItemAsync('userId');

      try {
        const response = await fetch(`${API_BASE_URL}/user/profile/${userId}`);
        const result = await response.json();

        if (response.ok) {
          setName(result.user.name || '');
          setEmail(result.user.email || '');
          setProfilePhoto(result.user.profilePhoto ? { uri: result.user.profilePhoto } : null);
          setStreet(result.user.address?.street || '');
          setCity(result.user.address?.city || '');
          setState(result.user.address?.state || '');
          setPostalCode(result.user.address?.postalCode || '');
          setCountry(result.user.address?.country || '');
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'An error occurred while fetching profile data');
      }
    };

    fetchProfile();
  }, []);

  // Handle saving profile updates
  const handleSave = async () => {
    const userId = await SecureStore.getItemAsync('userId');
    console.log('User ID:', userId); // Log the userId

    // Convert profile photo URI to Base64 (if selected)
    let profilePhotoBase64 = null;
    if (profilePhoto && profilePhoto.uri) {
      try {
        console.log('Reading image file as Base64...');
        const fileInfo = await FileSystem.getInfoAsync(profilePhoto.uri);
        if (fileInfo.exists) {
          profilePhotoBase64 = await FileSystem.readAsStringAsync(profilePhoto.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          profilePhotoBase64 = `data:image/jpeg;base64,${profilePhotoBase64}`; // Add prefix
          console.log('Base64 String:', profilePhotoBase64); // Log the Base64 string
        } else {
          console.error('File does not exist:', profilePhoto.uri);
          Alert.alert('Error', 'Selected file does not exist');
          return;
        }
      } catch (error) {
        console.error('Error reading image file:', error);
        Alert.alert('Error', 'Failed to process the profile photo');
        return;
      }
    }

    // Prepare the payload
    const payload = {
      name,
      email,
      address: {
        street,
        city,
        state,
        postalCode,
        country,
      },
      profilePhoto: profilePhotoBase64, // Send the Base64 string
    };

    console.log('Payload:', payload); // Log the payload

    try {
      console.log('Sending request to backend...');
      const response = await fetch(`${API_BASE_URL}/user/edit-profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', // Set content type to JSON
        },
        body: JSON.stringify(payload), // Send the payload as JSON
      });
      const result = await response.json();

      console.log('Backend Response:', result); // Log the backend response

      if (response.ok) {
        Alert.alert('Success', result.message);
        console.log('Updated User:', result.user); // Log the updated user
        if (result.user.profilePhoto) {
          setProfilePhoto({ uri: result.user.profilePhoto }); // Update the profile photo in state
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An error occurred while updating the profile');
    }
  };

  // Handle image picker for profile photo
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile photo.');
      return;
    }
  
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUri = result.assets[0].uri; // Use result.assets[0].uri
      console.log('Selected Image URI:', selectedImageUri); // Log the selected image URI
      setProfilePhoto({ uri: selectedImageUri }); // Set the profile photo URI
    } else {
      console.log('Image selection was canceled or no assets were returned.');
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
                  onPress={pickImage}
                >
                  {profilePhoto ? (
                    <Image
                      source={{ uri: profilePhoto.uri }}
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

              <Title style={styles.header}>Edit Profile</Title>
              <Text style={styles.subheader}>Update your personal information</Text>

              <View style={styles.formContainer}>
                {[
                  ['Name', name, setName],
                  ['Email', email, setEmail],
                  ['Street', street, setStreet],
                  ['City', city, setCity],
                  ['State', state, setState],
                  ['Postal Code', postalCode, setPostalCode],
                  ['Country', country, setCountry],
                ].map(([label, value, setValue]) => (
                  <View key={label} style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={setValue}
                      placeholder={`Enter your ${label.toLowerCase()}`}
                      placeholderTextColor="#666"
                    />
                  </View>
                ))}

                <Button
                  mode="contained"
                  onPress={handleSave}
                  style={styles.saveButton}
                  labelStyle={styles.saveButtonLabel}
                  contentStyle={styles.buttonContent}
                >
                  Save Changes
                </Button>
              </View>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={async () => {
                  await SecureStore.deleteItemAsync('authToken');
                  Alert.alert('Logged Out', 'You have been logged out successfully.');
                  navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
                }}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

// Styles
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#ff8c42',
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: '#ff8c42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonLabel: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  buttonContent: {
    height: 50,
    paddingVertical: 8,
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#ff8c42',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;