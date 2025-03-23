import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import API_BASE_URL from '../../../config';
import * as SecureStore from 'expo-secure-store';

const AddProduct = () => {
    const [productData, setProductData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'vegetarian',
        crust: 'thin',
        size: 'solo',
    });
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please allow access to your photo library to upload images.');
            }
        })();
    }, []);

    const handleInputChange = (field, value) => {
        setProductData({ ...productData, [field]: value });
    };

    const handleImagePicker = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!photo) {
            Alert.alert('Error', 'Please select a photo');
            return;
        }

        setLoading(true);

        // Retrieve userId from SecureStore
        const userId = await SecureStore.getItemAsync('userId');
        console.log('Retrieved userId:', userId); // Debugging: Check if userId is correct

        if (!userId) {
            Alert.alert('Error', 'User not authenticated');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('name', productData.name);
        formData.append('description', productData.description);
        formData.append('price', productData.price);
        formData.append('category', productData.category);
        formData.append('crust', productData.crust);
        formData.append('size', productData.size);
        formData.append('photo', {
            uri: photo.uri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        });

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/products/create`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Product created successfully');
            console.log('Product created:', response.data);
        } catch (error) {
            console.error('Error creating product:', error);
            Alert.alert('Error', 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Add New Product</Text>
            <TextInput
                style={styles.input}
                placeholder="Product Name"
                value={productData.name}
                onChangeText={(text) => handleInputChange('name', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Description"
                value={productData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                multiline
            />
            <TextInput
                style={styles.input}
                placeholder="Price"
                value={productData.price}
                onChangeText={(text) => handleInputChange('price', text)}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Category (vegetarian/non-vegetarian)"
                value={productData.category}
                onChangeText={(text) => handleInputChange('category', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Crust (thin/thick)"
                value={productData.crust}
                onChangeText={(text) => handleInputChange('crust', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Size (solo/party/family)"
                value={productData.size}
                onChangeText={(text) => handleInputChange('size', text)}
            />
            <Button title="Select Photo" onPress={handleImagePicker} />
            {photo && <Image source={{ uri: photo.uri }} style={styles.imagePreview} />}
            <Button
                title={loading ? 'Creating...' : 'Create Product'}
                onPress={handleSubmit}
                disabled={loading}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
    imagePreview: {
        width: 200,
        height: 200,
        marginTop: 15,
        marginBottom: 15,
        borderRadius: 5,
    },
});

export default AddProduct;