import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import API_BASE_URL from '../../../config';

const EditProduct = ({ route, navigation }) => {
  const { productId } = route.params; // Get the product ID from the route params
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('vegetarian');
  const [crust, setCrust] = useState('thin');
  const [size, setSize] = useState('solo');

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setName(data.name);
          setDescription(data.description);
          setPrice(data.price.toString());
          setCategory(data.category);
          setCrust(data.crust);
          setSize(data.size);
        } else {
          Alert.alert('Error', data.message || 'Failed to fetch product details');
        }
      } catch (error) {
        console.error('Fetch Product Error:', error);
        Alert.alert('Error', 'Network error, please try again.');
      }
    };

    fetchProduct();
  }, [productId]);

  // Update product
  const handleUpdateProduct = async () => {
    if (!name || !description || !price || !category || !crust || !size) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          category,
          crust,
          size,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Product updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Update Product Error:', error);
      Alert.alert('Error', 'Network error, please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Product</Text>

      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Category (vegetarian/non-vegetarian)"  
        value={category}
        onChangeText={setCategory}
      />
            <TextInput
        style={styles.input}
        placeholder="Crust (thin/thick)"
        value={crust}
        onChangeText={setCrust}
      />
      <TextInput
        style={styles.input}
        placeholder="Size (solo/party/family)"
        value={size}
        onChangeText={setSize}
      />

      {/* Update Product Button */}
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProduct}>
        <Text style={styles.updateButtonText}>Update Product</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  updateButton: {
    backgroundColor: '#ff8c42',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProduct;