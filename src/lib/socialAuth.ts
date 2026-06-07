import type { PendingSocialProfile } from '../types';

// ── JWT decoder (Google credential) ─────────────────────
export function parseGoogleJwt(token: string): Record<string, string> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function googlePayloadToProfile(credential: string): PendingSocialProfile {
  const payload = parseGoogleJwt(credential);
  return {
    socialProvider: 'GOOGLE',
    socialId: payload.sub ?? '',
    name: payload.name ?? payload.email?.split('@')[0] ?? '사용자',
    email: payload.email,
    profileImage: payload.picture,
  };
}

// ── Kakao OAuth (PKCE / Authorization Code Flow) ─────────
function randomString(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

async function sha256Base64Url(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function triggerKakaoLogin(): Promise<void> {
  const restKey = import.meta.env.VITE_KAKAO_REST_KEY as string | undefined;
  if (!restKey) throw new Error('VITE_KAKAO_REST_KEY is not set');

  const verifier = randomString(128);
  const challenge = await sha256Base64Url(verifier);
  sessionStorage.setItem('kakao_pkce_verifier', verifier);

  const redirectUri = window.location.origin;
  const url =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${restKey}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&code_challenge=${challenge}` +
    `&code_challenge_method=S256` +
    `&scope=friends,talk_message`;
  window.location.href = url;
}

export async function checkKakaoCallback(): Promise<PendingSocialProfile | null> {
  // Code captured early in main.tsx before React Router strips query params
  const code =
    sessionStorage.getItem('kakao_oauth_code') ??
    new URLSearchParams(window.location.search).get('code');
  if (!code) return null;
  sessionStorage.removeItem('kakao_oauth_code');

  const verifier = sessionStorage.getItem('kakao_pkce_verifier');
  if (!verifier) return null;
  sessionStorage.removeItem('kakao_pkce_verifier');

  window.history.replaceState(null, '', window.location.pathname);

  const restKey = import.meta.env.VITE_KAKAO_REST_KEY as string | undefined;
  if (!restKey) return null;

  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: restKey,
      redirect_uri: window.location.origin,
      code,
      code_verifier: verifier,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Kakao token error: ${tokenRes.status} ${err}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken: string = tokenData.access_token;
  if (!accessToken) throw new Error('No access token in Kakao response');
  // Store for friend picker / message API use
  sessionStorage.setItem('kakao_access_token', accessToken);

  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) throw new Error(`Kakao user info failed: ${userRes.status}`);

  const data = await userRes.json();
  return {
    socialProvider: 'KAKAO',
    socialId: String(data.id),
    name:
      data.kakao_account?.profile?.nickname ??
      data.kakao_account?.email?.split('@')[0] ??
      '카카오 사용자',
    email: data.kakao_account?.email,
    profileImage: data.kakao_account?.profile?.profile_image_url,
  };
}

// ── Naver SDK loader ─────────────────────────────────────
let naverLogin: NaverLoginWithNaverId | null = null;

export function loadNaverSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.naver) { resolve(); return; }
    if (document.getElementById('naver-sdk')) {
      const check = setInterval(() => {
        if (window.naver) { clearInterval(check); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'naver-sdk';
    script.src = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
    script.charset = 'utf-8';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Naver SDK load failed'));
    document.head.appendChild(script);
  });
}

export async function initNaverLogin(): Promise<NaverLoginWithNaverId> {
  await loadNaverSDK();
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined;
  const callbackUrl =
    (import.meta.env.VITE_NAVER_CALLBACK_URL as string | undefined) ??
    window.location.origin;

  if (!clientId) throw new Error('VITE_NAVER_CLIENT_ID is not set in .env.local');

  // Hidden container for SDK to attach the login button
  let container = document.getElementById('naver-id-login');
  if (!container) {
    container = document.createElement('div');
    container.id = 'naver-id-login';
    container.style.display = 'none';
    document.body.appendChild(container);
  }

  naverLogin = new window.naver.LoginWithNaverId({
    clientId,
    callbackUrl,
    isPopup: false,
    loginButton: { color: 'green', type: 3, height: 58 },
  });
  naverLogin.init();
  return naverLogin;
}

export function triggerNaverLogin() {
  if (naverLogin?.loginBtn) {
    (naverLogin.loginBtn.firstChild as HTMLElement)?.click();
  }
}

export async function checkNaverCallback(): Promise<PendingSocialProfile | null> {
  if (!window.location.hash.includes('access_token')) return null;

  await loadNaverSDK();
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined;
  const callbackUrl =
    (import.meta.env.VITE_NAVER_CALLBACK_URL as string | undefined) ??
    window.location.origin;
  if (!clientId) return null;

  const login = new window.naver.LoginWithNaverId({
    clientId,
    callbackUrl,
    isPopup: false,
  });
  login.init();

  return new Promise((resolve) => {
    login.getLoginStatus((status: boolean) => {
      if (!status) { resolve(null); return; }
      resolve({
        socialProvider: 'NAVER',
        socialId: login.user.getId(),
        name: login.user.getName() || '네이버 사용자',
        email: login.user.getEmail() || undefined,
        profileImage: login.user.getProfileImage() || undefined,
      });
      // Clean the hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    });
  });
}
