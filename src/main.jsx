import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SidebarProvider } from './contexts/SidebarContext';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SidebarProvider>
        <App />
      </SidebarProvider>
    </BrowserRouter>
  </React.StrictMode>
);