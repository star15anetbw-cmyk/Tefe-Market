import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import ReactGA from 'react-ga4';
import App from './App.tsx';
import AppProviders from './providers/AppProviders.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Initialize GA4
ReactGA.initialize('G-N4NHCSVY21');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
        <Analytics />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);
