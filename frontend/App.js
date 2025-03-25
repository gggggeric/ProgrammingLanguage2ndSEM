import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        {/* Public Screens */}
        <Stack.Screen 
          name="Landing" 
          component={Landing} 
          options={{ headerShown: false }} // Hide header for Landing
        />
         <Stack.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{ headerShown: false }} // Hide header for Landing
        />
        <Stack.Screen 
          name="Home" 
          component={Home} 
          options={{ headerShown: false }} // Hide header for Home
        />
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ headerShown: false }} // Hide header for Login
        />
        <Stack.Screen 
          name="Register" 
          component={Register} 
          options={{ headerShown: false }} // Hide header for Register
        />
        <Stack.Screen 
          name="About" 
          component={About} 
          options={{ headerShown: false }} // Hide header for About
        />
         <Stack.Screen 
          name="Profile" 
          component={Profile} 
          options={{ headerShown: false }} // Hide header for About
        />

        {/* Admin Screens */}
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboard} 
            options={{ headerShown: false }} // Hide header for About
        />
        <Stack.Screen 
          name="AddProduct" 
          component={AddProduct} 
          options={{ title: 'Add Product' }} // Show header with title
        />
         <Stack.Screen 
          name="Cart" 
          component={CartScreen} 
          options={{ headerShown: false }} // Hide header for Register
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}