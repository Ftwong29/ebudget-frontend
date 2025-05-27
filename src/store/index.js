import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { setupInterceptors } from '../api/setupInterceptors'; // 注意这里改成 ../api
import axiosInstance from '../api/axiosInstance'; // 注意这里改成 ../api

// 1. 创建 store
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// 2. 拦截器要放在 store create 后
setupInterceptors(axiosInstance, store);
