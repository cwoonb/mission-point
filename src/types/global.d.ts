// Kakao SDK types
interface KakaoShareLink {
  mobileWebUrl: string;
  webUrl: string;
}

interface KakaoSDK {
  init(key: string): void;
  isInitialized(): boolean;
  Auth: {
    login(options: {
      success(authObj: { access_token: string }): void;
      fail(err: unknown): void;
    }): void;
    logout(callback?: () => void): void;
    getStatus(callback: (obj: { status: string }) => void): void;
  };
  API: {
    request(options: {
      url: string;
      success(res: KakaoUserResponse): void;
      fail(err: unknown): void;
    }): void;
  };
  Share: {
    sendDefault(options: {
      objectType: 'feed';
      content: {
        title: string;
        description: string;
        imageUrl?: string;
        link: KakaoShareLink;
      };
      buttons?: Array<{ title: string; link: KakaoShareLink }>;
    }): void;
  };
  Picker: {
    selectFriends(options: {
      title?: string;
      maxPickableCount?: number;
      minPickableCount?: number;
      enableSearch?: boolean;
    }): Promise<{
      users?: Array<{
        uuid: string;
        profile_nickname?: string;
        profile_thumbnail_image?: string;
      }>;
    }>;
  };
}

interface KakaoUserResponse {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
  };
}

// Naver Login SDK types
interface NaverLoginUser {
  getId(): string;
  getName(): string;
  getEmail(): string;
  getProfileImage(): string;
}

interface NaverLoginWithNaverId {
  init(): void;
  loginBtn: HTMLElement;
  getLoginStatus(callback: (status: boolean) => void): void;
  user: NaverLoginUser;
}

interface NaverLoginOptions {
  clientId: string;
  callbackUrl: string;
  isPopup: boolean;
  loginButton?: { color: string; type: number; height: number };
}

interface NaverSDK {
  LoginWithNaverId: new (options: NaverLoginOptions) => NaverLoginWithNaverId;
}

declare interface Window {
  Kakao: KakaoSDK;
  naver: NaverSDK;
}
