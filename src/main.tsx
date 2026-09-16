import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { AuthProvider } from './features/auth/AuthProvider';
import './style.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000,    // 5 min garbage collection
      staleTime: 30_000,         // 30s before marking stale
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const container = document.getElementById('app');

if (!container) {
  throw new Error('Elemento #app não encontrado.');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Um PWA aberto por muito tempo pode nunca navegar de novo, e nesse caso a
      // procura automática por atualização não acontece. Verificar ao voltar o foco
      // faz a nova versão assumir sem depender de hard refresh.
      const checkForUpdate = () => {
        void registration.update().catch(() => {
          // Falha esperada quando offline — a próxima verificação tenta de novo.
        });
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    });
  });
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
