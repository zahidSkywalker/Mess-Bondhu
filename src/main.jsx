import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { MessProvider } from './context/MessContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <MessProvider>
          <ThemeProvider>
            <LanguageProvider>
              <ToastProvider />
              <App />
            </LanguageProvider>
          </ThemeProvider>
        </MessProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
