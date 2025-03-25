import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import API_BASE_URL from '../../config';

const { width } = Dimensions.get('window');

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [dynamicPriceRange, setDynamicPriceRange] = useState([0, 1000]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/categories`);
        const data = await response.json();
        if (response.ok && data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery]);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        const params = new URLSearchParams();
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (selectedCategory !== 'All') params.append('category', selectedCategory);
        params.append('minPrice', priceRange[0]);
        params.append('maxPrice', priceRange[1]);

        const response = await fetch(`${API_BASE_URL}/products/filter?${params.toString()}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setProducts(data.products);
          // Update dynamic price range if the server returned one
          if (data.priceRange) {
            setDynamicPriceRange([data.priceRange.min, data.priceRange.max]);
            // Reset user's price range if they haven't set it
            if (priceRange[0] === 0 && priceRange[1] === 1000) {
              setPriceRange([data.priceRange.min, data.priceRange.max]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedSearch, selectedCategory, priceRange]);

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <Image
        source={{ uri: item.photo }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.detailsRow}>
          <Text style={styles.productPrice}>₱{item.price.toFixed(2)}</Text>
          <View style={[
            styles.categoryBadge,
            item.category === 'vegetarian' ? styles.vegBadge : styles.nonVegBadge
          ]}>
            <Text style={styles.categoryText}>
              {item.category === 'vegetarian' ? 'Veg' : 'Non-Veg'}
            </Text>
          </View>
        </View>
        <View style={styles.attributesRow}>
          <Text style={styles.attributeText}>{item.size}</Text>
          <Text style={styles.attributeText}>{item.crust} crust</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ff8c42" />
        </TouchableOpacity>
        
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pizza names or ingredients..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters Section */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.filterButton,
                  selectedCategory === category.name && styles.activeFilter
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedCategory === category.name && styles.activeFilterText
                ]}>
                  {category.name === 'All' ? 'All' : category.name === 'vegetarian' ? 'Veg' : 'Non-Veg'}
                </Text>
                <Text style={[
                  styles.filterCountText,
                  selectedCategory === category.name && styles.activeFilterCountText
                ]}>
                  {category.count}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Price Range Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Price: ₱{priceRange[0]} - ₱{priceRange[1]}</Text>
          <Slider
            style={styles.slider}
            minimumValue={dynamicPriceRange[0]}
            maximumValue={dynamicPriceRange[1]}
            step={50}
            minimumTrackTintColor="#ff8c42"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#ff8c42"
            value={priceRange[1]}
            onValueChange={(value) => setPriceRange([priceRange[0], value])}
          />
          <Slider
            style={styles.slider}
            minimumValue={dynamicPriceRange[0]}
            maximumValue={dynamicPriceRange[1]}
            step={50}
            minimumTrackTintColor="#ff8c42"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#ff8c42"
            value={priceRange[0]}
            onValueChange={(value) => setPriceRange([value, priceRange[1]])}
          />
        </View>
      </ScrollView>

      {/* Search Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff8c42" />
          <Text style={styles.loadingText}>Finding your pizzas...</Text>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noResults}>
          <Ionicons name="search" size={60} color="#ddd" />
          <Text style={styles.noResultsText}>No pizzas found</Text>
          <Text style={styles.noResultsSubText}>Try different search terms or adjust filters</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filtersContent: {
    paddingHorizontal: 5,
  },
  filterSection: {
    width: width - 30,
    paddingHorizontal: 15,
    marginRight: 15,
  },
  filterTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#ff8c42',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  filterCountText: {
    color: '#999',
    fontSize: 12,
    marginLeft: 5,
  },
  activeFilterCountText: {
    color: '#fff',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  resultsContainer: {
    padding: 10,
  },
  productCard: {
    width: width / 2 - 15,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    color: '#ff8c42',
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  attributesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attributeText: {
    fontSize: 10,
    color: '#888',
    textTransform: 'capitalize',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  vegBadge: {
    backgroundColor: '#4CAF50',
  },
  nonVegBadge: {
    backgroundColor: '#F44336',
  },
  categoryText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    fontWeight: 'bold',
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default SearchScreen;