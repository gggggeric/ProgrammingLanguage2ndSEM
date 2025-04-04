const initialState = {
    loading: false,
    error: null,
    currentOrder: null,
    orders: []
  };
  
  const orderReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'CREATE_ORDER_REQUEST':
        return { ...state, loading: true, error: null };
      case 'CREATE_ORDER_SUCCESS':
        return { 
          ...state, 
          loading: false,
          currentOrder: action.payload,
          orders: [action.payload, ...state.orders]
        };
      case 'CREATE_ORDER_FAILURE':
        return { ...state, loading: false, error: action.payload };
      case 'CLEAR_ORDER_ERROR':
        return { ...state, error: null };
      default:
        return state;
    }
  };
  
  export default orderReducer;