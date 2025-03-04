import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from './Screens/Pages/Home';
import Login from './Screens/Pages/Authentication/Login';
import Register from './Screens/Pages/Authentication/Register';
import Navbar from './Screens/Pages/Navigation/Navbar';
import About from './Screens/Pages/About';
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ title: 'Login' }} 
        />
        <Stack.Screen 
          name="Home" 
          component={Home} 
          options={{ title: 'Home' }} 
        />
          <Stack.Screen 
          name="Register" 
          component={Register} 
          options={{ title: 'Register' }} 
        />
        <Stack.Screen 
          name="About" 
          component={About} 
          options={{ title: 'About' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
