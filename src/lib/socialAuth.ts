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

// ── Kakao SDK loader ─────────────────────────────────────
let kakaoLoaded = false;

export function loadKakaoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (kakaoLoaded || (window.Kakao && window.Kakao.isInitialized())) {
      kakaoLoaded = true;
      resolve();
      return;
    }
    if (document.getElementById('kakao-sdk')) {
      const check = setInterval(() => {
        if (window.Kakao) { clearInterval(check); kakaoLoaded = true; resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'kakao-sdk';
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/1.3.28/kakao.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => { kakaoLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Kakao SDK load failed'));
    document.head.appendChild(script);
  });
}

export async function kakaoLogin(): Promise<PendingSocialProfile> {
  await loadKakaoSDK();
  const appKey = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
  if (!appKey) throw new Error('VITE_KAKAO_JS_KEY is not set in .env.local');

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(appKey);
  }

  return new Promise((resolve, reject) => {
    window.Kakao.Auth.login({
      success: () => {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: (res: KakaoUserResponse) => {
            resolve({
              socialProvider: 'KAKAO',
              socialId: String(res.id),
              name:
                res.kakao_account?.profile?.nickname ??
                res.kakao_account?.email?.split('@')[0] ??
                '카카오 사용자',
              email: res.kakao_account?.email,
              profileImage:
                res.kakao_account?.profile?.profile_image_url ??
                res.kakao_account?.profile?.thumbnail_image_url,
            });
          },
          fail: reject,
        });
      },
      fail: reject,
    });
  });
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
