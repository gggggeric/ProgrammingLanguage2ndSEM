import { createSlice } from '@reduxjs/toolkit';
import { 
  createNewOrder, 
  fetchUserOrders, 
  fetchOrderById, 
  updateOrderStatus 
} from './orderActions';

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
    success: false
  },
  reducers: {
    // Optional reset reducer to clear order state
    resetOrderState: (state) => {
      state.currentOrder = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    // Create New Order
    builder.addCase(createNewOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    });
    builder.addCase(createNewOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload;
      state.orders.push(action.payload);
      state.success = true;
    });
    builder.addCase(createNewOrder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    });

    // Fetch User Orders
    builder.addCase(fetchUserOrders.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUserOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.orders = action.payload;
    });
    builder.addCase(fetchUserOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Single Order
    builder.addCase(fetchOrderById.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchOrderById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload;
    });
    builder.addCase(fetchOrderById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update Order Status
    builder.addCase(updateOrderStatus.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateOrderStatus.fulfilled, (state, action) => {
      state.loading = false;
      // Update the order in the orders array
      const index = state.orders.findIndex(order => order._id === action.payload._id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      state.currentOrder = action.payload;
    });
    builder.addCase(updateOrderStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  }
});

export const { resetOrderState } = orderSlice.actions;
export default orderSlice.reducer;