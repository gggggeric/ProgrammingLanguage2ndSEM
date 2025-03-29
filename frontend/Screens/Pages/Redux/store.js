import { configureStore } from '@reduxjs/toolkit';
import orderReducer from './order/orderSlice';
// Import other reducers as needed

const store = configureStore({
  reducer: {
    order: orderReducer,
    // Add other reducers here
  },
  // Optional middleware and devtools configuration
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false // Recommended for handling async thunks
    })
});

export default store;