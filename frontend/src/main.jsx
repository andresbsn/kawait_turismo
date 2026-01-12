import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
          colorBgContainer: '#ffffff',
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#001529',
            triggerBg: '#002140',
            triggerColor: '#ffffff',
          },
          Menu: {
            darkItemBg: '#001529',
            darkItemSelectedBg: '#1890ff',
            darkItemSelectedColor: '#ffffff',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
