import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import orderReducer from './reducers/orderReducer';

const rootReducer = combineReducers({
  order: orderReducer,
  // Add other reducers here if needed
});

// Create store with middleware
const store = createStore(
  rootReducer,
  applyMiddleware(thunk) // Make sure thunk is properly imported
);

export default store;