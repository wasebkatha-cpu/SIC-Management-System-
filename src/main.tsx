import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { initApiSync } from './lib/mockDb';
import { initDraftsSync } from './utils/draftStorage';
import { initCustomNoticesListener } from './utils/customNoticesStorage';
import { registerLicense } from '@syncfusion/ej2-base';

// TODO: Replace this placeholder with your free Syncfusion Community License Key
// Generate one for free at: https://www.syncfusion.com/products/communitylicense
registerLicense('ORg4AjUWIQA/Gnt2U1hhQlJBfV5AQmBIYVp/TGpJfl96cVxMZVVBJAtUQF1hTX5WdUViWH9XcHNRQmRb');

// Initialize data sync from PostgreSQL Express API to localStorage caches
initApiSync();
initDraftsSync();
initCustomNoticesListener();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
