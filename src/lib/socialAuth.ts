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

// ── Kakao OAuth (SDK 없이 REST API 방식) ──────────────────
export function triggerKakaoLogin(): void {
  const appKey = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
  if (!appKey) throw new Error('VITE_KAKAO_JS_KEY is not set in .env.local');

  const redirectUri = window.location.origin;
  const url =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${appKey}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token`;
  window.location.href = url;
}

export async function checkKakaoCallback(): Promise<PendingSocialProfile | null> {
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return null;

  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  // URL에서 토큰 해시 제거
  window.history.replaceState(null, '', window.location.pathname);

  const res = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Kakao user info failed: ${res.status}`);

  const data = await res.json();
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
