import React, { Suspense } from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@shared/components/theme-provider';
import { Toaster } from '@shared/components/ui/toaster';
import { PWAChat } from './components/PWAChat';
import { PWALogin } from './components/PWALogin';
import { PWASettings } from './components/PWASettings';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SyncStatus } from './components/SyncStatus';
import AnalyticsDashboard from '../shared/components/AnalyticsDashboard';

// PWA-optimized QueryClient with offline support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false, // Handle offline mutations with background sync
    },
  },
});

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <PWALogin />;
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          FinanceAI
        </h1>
        <div className="flex items-center gap-2">
          <SyncStatus />
          <OfflineIndicator />
          <PWASettings />
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/settings" component={PWASettings} />
          <Route path="/" component={PWAChat} />
        </Switch>
      </main>
    </div>
  );
}

export default function PWAApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="pwa-theme">
        <AuthProvider>
          <Router>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            }>
              <AppRoutes />
              <Toaster />
            </Suspense>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}