// src/api/setupInterceptors.js
import { logout } from '../store/slices/authSlice';

export function setupInterceptors(axiosInstance, store) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const { response, config } = error;

      if (
        response &&
        response.status === 401 &&
        config &&
        !config.url.includes('/auth/logout') // ✅ 忽略 logout 自己
      ) {
        console.warn('Token expired or unauthorized. Logging out.');
        store.dispatch(logout());
      }

      return Promise.reject(error);
    }
  );
}

