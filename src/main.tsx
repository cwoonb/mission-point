import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Preserve invite context. Supabase must keep OAuth/email `code` in the URL
// until `exchangeCodeForSession` completes.
(function () {
  const params = new URLSearchParams(window.location.search);
  const inviteId = params.get('invite');
  if (inviteId) sessionStorage.setItem('pending_invite_id', inviteId);
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
