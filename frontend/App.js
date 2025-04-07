import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import store from './redux/store';
import Landing from './Screens/Pages/Landing';
import Home from './Screens/Pages/Home';
import Login from './Screens/Pages/Authentication/Login';
import Register from './Screens/Pages/Authentication/Register';
import About from './Screens/Pages/About';
import AdminDashboard from './Screens/Pages/Admin/AdminDashboard';
import AddProduct from './Screens/Pages/Admin/AddProduct';
import Profile from './Screens/Pages/UserInformation/Profile';
import CartScreen from './Screens/Pages/Cart/Cart';
import SearchScreen from './Screens/Pages/Search';
import OrderDetailsScreen from './Screens/Pages/Order/OrderHistory';
import AdminOrdersScreen from './Screens/Pages/Admin/Orders';
import ReviewList from './Screens/Pages/Admin/reviews';
import UserReviewsScreen from './Screens/Pages/Review/Review';
const Stack = createStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing">
          {/* Public Screens */}
          <Stack.Screen 
            name="Landing" 
            component={Landing} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen} 
            options={{ headerShown: false }}
          />
            <Stack.Screen 
            name="Admin Review" 
            component={ReviewList} 
            options={{ headerShown: false }}
          />
            <Stack.Screen 
            name="Admin Order" 
            component={AdminOrdersScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ReviewHistory" 
            component={UserReviewsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Order History" 
            component={OrderDetailsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Home" 
            component={Home} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={Login} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={Register} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="About" 
            component={About} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Profile" 
            component={Profile} 
            options={{ headerShown: false }}
          />

          {/* Admin Screens */}
          <Stack.Screen 
            name="AdminDashboard" 
            component={AdminDashboard} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AddProduct" 
            component={AddProduct} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Cart" 
            component={CartScreen} 
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}


