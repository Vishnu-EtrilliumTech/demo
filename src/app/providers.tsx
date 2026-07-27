'use client';

// PROTOTYPE: installs the mock API layer (axios + fetch patch + seeded session)
// before anything renders. Must stay first so no request escapes to a backend.
import '@/prototype/install';

import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore } from './redux/store/store';
import { ToastProvider } from '@/contexts/ToastContext';
import { CoachMarkProvider } from '@/contexts/CoachMarkContext';

// PROTOTYPE: GoogleOAuthProvider + silent refresh removed — auth is fully
// mocked, so there is no dependency on Google's external GSI script.
export function Providers({ children }: { children: React.ReactNode }) {
  const { store, persistor } = makeStore();

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastProvider>
          <CoachMarkProvider>
            {children}
          </CoachMarkProvider>
        </ToastProvider>
      </PersistGate>
    </Provider>
  );
}
