// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { store } from './store';
import App from './App';
import './index.css';

import axiosInstance from './api/axiosInstance';
import { setupInterceptors } from './api/setupInterceptors';

// ✅ 初始化拦截器（此处唯一执行）
setupInterceptors(axiosInstance, store);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>
  </React.StrictMode>
);
