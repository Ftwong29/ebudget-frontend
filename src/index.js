import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom'; // ✅ 改这里
import { store } from './store';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter> {/* ✅ 替换 BrowserRouter */}
        <App />
      </HashRouter>
    </Provider>
  </React.StrictMode>
);
