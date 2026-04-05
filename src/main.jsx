import React from 'react';
import ReactDOM from 'react-dom/client';

let appError = null;

// Catch module-level errors
try {
  const { BrowserRouter } = require('react-router-dom');

  const { MessProvider } = require('./context/MessContext').default;
  const { ThemeProvider } = require('./context/ThemeContext').default;
  const { LanguageProvider } = require('./context/LanguageContext').default;
  const { ToastProvider } = require('./context/ToastContext').default;
  const ErrorBoundary = require('./components/ui/ErrorBoundary').default;
  const App = require('./App').default;

  const root = ReactDOM.createRoot(document.getElementById('root'));

  root.render(
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
} catch (err) {
  appError = err;
}

// Display error on screen so we can see it even if React fails to mount
if (appError) {
  document.getElementById('root').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;font-family:sans-serif;background:#f8fafc;color:#1e293b;">
      <div style="max-width:500px;text-align:center;background:white;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
        <h2 style="color:#dc2626;font-size:18px;margin:0 0 12px 0;">Runtime Error</h2>
        <pre style="text-align:left;white-space:pre-wrap;word-break:break-word;font-size:12px;background:#fef2f2;padding:16px;border-radius:8px;color:#7f1d1d;text-align:left;overflow-x:auto;max-height:300px;margin:0;">
 ${appError.message || appError.stack || String(appError)}
 ${appError.stack ? '\n\n--- Stack Trace ---\n' + appError.stack : ''}
        </pre>
        <p style="color:#64748b;font-size:13px;margin-top:12px;">Copy the error text above and share it for debugging.</p>
      </div>
    </div>
  `;
}

// If no appError but React somehow still blank, show a message
if (!appError) {
  setTimeout(() => {
    const root = document.getElementById('root');
    if (root && root.innerHTML.includes('app-loading')) {
      root.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;font-family:sans-serif;background:#f8fafc;color:#1e293b;">
          <div style="max-width:400px;text-align:center;background:white;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,1);">
            <h3 style="color:#22577a;font-size:16px;margin:0 0 8px 0;">React mounted but app didn't render</h3>
            <p style="color:#64748b;font-size:13px;">Check the browser console for warnings or unhandled promise rejections.</p>
          </div>
        </div>
      `;
    }
  }, 3000);
}
