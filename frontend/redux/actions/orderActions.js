import API_BASE_URL from '../../config';
import * as SecureStore from 'expo-secure-store';

export const createOrder = (orderData) => async (dispatch) => {
  try {
    dispatch({ type: 'CREATE_ORDER_REQUEST' });
    
    const authToken = await SecureStore.getItemAsync('authToken');
    if (!authToken) throw new Error('SESSION_EXPIRED');

    const response = await fetch(`${API_BASE_URL}/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || 'Order creation failed';
      
      if (response.status === 401) throw new Error('SESSION_EXPIRED');
      if (response.status === 403) throw new Error('USER_NOT_AUTHORIZED');
      throw new Error(errorMsg);
    }

    const result = await response.json();
    
    dispatch({
      type: 'CREATE_ORDER_SUCCESS',
      payload: result
    });

    return result;
  } catch (error) {
    dispatch({
      type: 'CREATE_ORDER_FAILURE',
      payload: error.message
    });
    throw error;
  }
};

export const clearOrderError = () => ({
  type: 'CLEAR_ORDER_ERROR'
});