import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './features/auth/auth.provider.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// This is what makes every useQuery/useMutation hook in the app work — it's the shared cache + config. Conceptually it's an app-wide provider, like wrapping your Flutter app in a MultiBlocProvider / ProviderScope.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // data is "fresh" for 60s - no needless refetch
      retry: 1, // retry a failed query once
      refetchOnWindowFocus: false,  // disable the aggressive default while developing 
    }
  },
});

// Those defaultOptions are sane starting points, not law — we'll tune per-query later. staleTime is the big one: it's how long TanStack Query treats cached data as fresh before considering a refetch. The default is 0 (always stale), which surprises people coming from other ecosystems.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false}/>
    </QueryClientProvider>
  </StrictMode>,
)
