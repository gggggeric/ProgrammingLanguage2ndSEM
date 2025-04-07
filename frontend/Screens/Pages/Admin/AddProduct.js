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
  FlatList,
  Image
} from 'react-native';
import { Button, Title, RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import API_BASE_URL from '../../../config';

const ProductManagement = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [productData, setProductData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'vegetarian',
        crust: 'thin',
        size: 'solo',
        quantity: '',
    });
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please allow access to your photo library to upload images.');
            }
            fetchProducts();
        })();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/products`);
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
            Alert.alert('Error', 'Failed to fetch products');
        }
    };

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

    const resetForm = () => {
        setProductData({
            name: '',
            description: '',
            price: '',
            category: 'vegetarian',
            crust: 'thin',
            size: 'solo',
            quantity: '',
        });
        setPhoto(null);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        if (!photo && !editingId) {
            Alert.alert('Error', 'Please select a photo');
            return;
        }

        setLoading(true);

        const userId = await SecureStore.getItemAsync('userId');
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
        formData.append('quantity', productData.quantity);
        
        if (photo) {
            formData.append('photo', {
                uri: photo.uri,
                name: 'photo.jpg',
                type: 'image/jpeg',
            });
        }

        try {
            if (editingId) {
                await axios.put(`${API_BASE_URL}/admin/products/${editingId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                Alert.alert('Success', 'Product updated successfully');
            } else {
                await axios.post(`${API_BASE_URL}/admin/products/create`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                Alert.alert('Success', 'Product created successfully');
            }
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', `Failed to ${editingId ? 'update' : 'create'} product`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setProductData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
            crust: product.crust,
            size: product.size,
            quantity: product.quantity.toString(),
        });
        setEditingId(product._id);
    };

    const handleDelete = async (productId) => {
        try {
            await axios.delete(`${API_BASE_URL}/admin/products/${productId}`);
            Alert.alert('Success', 'Product deleted successfully');
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            Alert.alert('Error', 'Failed to delete product');
        }
    };

    const renderProductItem = ({ item }) => (
        <View style={styles.productItem}>
            <Image source={{ uri: item.photo }} style={styles.productImage} />
            <View style={styles.productDetails}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
                <Text style={styles.productPrice}>${item.price} • Qty: {item.quantity}</Text>
                <View style={styles.productActions}>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEdit(item)}
                    >
                        <Ionicons name="create-outline" size={18} color="#fff" />
                        <Text style={styles.buttonText}> Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(item._id)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.buttonText}> Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

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
                            
                            <View style={styles.logoContainer}>
                                <View style={styles.logoCircle}>
                                    <Ionicons name="pizza-outline" size={30} color="#fff" />
                                </View>
                            </View>

                            <Title style={styles.header}>
                                {editingId ? 'Edit Product' : 'Add New Product'}
                            </Title>
                            
                            <View style={styles.formContainer}>
                                <Text style={styles.inputLabel}>Product Name</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="fast-food-outline" size={20} color="#999" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter product name"
                                        placeholderTextColor="#666"
                                        value={productData.name}
                                        onChangeText={(text) => handleInputChange('name', text)}
                                    />
                                </View>

                                <Text style={styles.inputLabel}>Description</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="document-text-outline" size={20} color="#999" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter description"
                                        placeholderTextColor="#666"
                                        value={productData.description}
                                        onChangeText={(text) => handleInputChange('description', text)}
                                        multiline
                                    />
                                </View>

                                <Text style={styles.inputLabel}>Price</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="cash-outline" size={20} color="#999" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter price"
                                        placeholderTextColor="#666"
                                        value={productData.price}
                                        onChangeText={(text) => handleInputChange('price', text)}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <Text style={styles.inputLabel}>Category</Text>
                                <View style={styles.categoryContainer}>
                                    <Ionicons name="restaurant-outline" size={20} color="#999" style={styles.categoryIcon} />
                                    <View style={styles.radioContainer}>
                                        <TouchableOpacity 
                                            style={styles.radioOption}
                                            onPress={() => handleInputChange('category', 'vegetarian')}
                                        >
                                            <View style={styles.radioCircle}>
                                                {productData.category === 'vegetarian' && <View style={styles.selectedRb} />}
                                            </View>
                                            <Text style={styles.radioText}>Vegetarian</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            style={styles.radioOption}
                                            onPress={() => handleInputChange('category', 'non-vegetarian')}
                                        >
                                            <View style={styles.radioCircle}>
                                                {productData.category === 'non-vegetarian' && <View style={styles.selectedRb} />}
                                            </View>
                                            <Text style={styles.radioText}>Non-Vegetarian</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={styles.inputLabel}>Quantity</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="list-outline" size={20} color="#999" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter quantity"
                                        placeholderTextColor="#666"
                                        value={productData.quantity}
                                        onChangeText={(text) => handleInputChange('quantity', text)}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <TouchableOpacity 
                                    style={styles.imagePickerButton}
                                    onPress={handleImagePicker}
                                >
                                    <Ionicons name="image-outline" size={20} color="#ff8c42" />
                                    <Text style={styles.imagePickerText}>
                                        {photo ? "Change Product Image" : "Select Product Image"}
                                    </Text>
                                </TouchableOpacity>

                                {photo && (
                                    <Image 
                                        source={{ uri: photo.uri }} 
                                        style={styles.imagePreview} 
                                    />
                                )}

                                <Button
                                    mode="contained"
                                    onPress={handleSubmit}
                                    style={styles.submitButton}
                                    labelStyle={styles.submitButtonLabel}
                                    contentStyle={styles.buttonContent}
                                    loading={loading}
                                    disabled={loading}
                                >
                                    {editingId ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'}
                                </Button>

                                {editingId && (
                                    <Button
                                        mode="outlined"
                                        onPress={resetForm}
                                        style={styles.cancelButton}
                                        labelStyle={styles.cancelButtonLabel}
                                        contentStyle={styles.buttonContent}
                                    >
                                        CANCEL
                                    </Button>
                                )}

                                <Text style={styles.sectionTitle}>Your Products</Text>
                                <FlatList
                                    data={products}
                                    renderItem={renderProductItem}
                                    keyExtractor={(item) => item._id}
                                    scrollEnabled={false}
                                    style={styles.productList}
                                />
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#ff8c42',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ff8c42',
        textAlign: 'center',
        marginBottom: 20,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 140, 66, 0.3)',
    },
    categoryContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 140, 66, 0.3)',
        paddingVertical: 10,
    },
    categoryIcon: {
        padding: 10,
    },
    radioContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ff8c42',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    selectedRb: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ff8c42',
    },
    radioText: {
        color: '#e0e0e0',
        fontSize: 15,
    },
    inputIcon: {
        padding: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        color: '#fff',
        fontSize: 16,
    },
    imagePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 140, 66, 0.3)',
        justifyContent: 'center',
    },
    imagePickerText: {
        color: '#ff8c42',
        marginLeft: 10,
        fontSize: 16,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 140, 66, 0.3)',
    },
    submitButton: {
        backgroundColor: '#ff8c42',
        borderRadius: 8,
        marginVertical: 10,
        shadowColor: '#ff8c42',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    submitButtonLabel: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    cancelButton: {
        borderColor: '#ff8c42',
        borderRadius: 8,
        marginVertical: 10,
    },
    cancelButtonLabel: {
        color: '#ff8c42',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    buttonContent: {
        height: 50,
        paddingVertical: 8,
    },
    sectionTitle: {
        color: '#ff8c42',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 15,
        textAlign: 'center',
    },
    productList: {
        marginTop: 10,
    },
    productItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 140, 66, 0.3)',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 15,
    },
    productDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    productCategory: {
        color: '#ff8c42',
        fontSize: 12,
        marginBottom: 5,
        textTransform: 'capitalize',
    },
    productPrice: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 10,
    },
    productActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 10,
    },
    editButton: {
        backgroundColor: '#4CAF50',
    },
    deleteButton: {
        backgroundColor: '#F44336',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default ProductManagement;