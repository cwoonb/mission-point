import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Capture OAuth code and invite params before React Router strips query params
(function () {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const inviteId = params.get('invite');
  if (code) sessionStorage.setItem('kakao_oauth_code', code);
  if (inviteId) sessionStorage.setItem('pending_invite_id', inviteId);
  if (code || inviteId) window.history.replaceState(null, '', window.location.pathname);
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
