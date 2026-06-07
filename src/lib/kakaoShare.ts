export function getInviteUrl(facilitatorId: string): string {
  return `${window.location.origin}/?invite=${facilitatorId}`;
}

async function initKakaoJS(): Promise<void> {
  if (!window.Kakao) {
    await new Promise<void>((resolve, reject) => {
      if (document.getElementById('kakao-sdk-script')) {
        const t = setInterval(() => { if (window.Kakao) { clearInterval(t); resolve(); } }, 100);
        return;
      }
      const s = document.createElement('script');
      s.id = 'kakao-sdk-script';
      s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Kakao SDK load failed'));
      document.head.appendChild(s);
    });
  }
  const jsKey = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
  if (!jsKey) throw new Error('VITE_KAKAO_JS_KEY is not set');
  if (!window.Kakao.isInitialized()) window.Kakao.init(jsKey);
}

export interface KakaoFriend {
  uuid: string;
  profile_nickname?: string;
  profile_thumbnail_image?: string;
}

/** 카카오 친구 피커 열기 — 선택된 친구 목록 반환 */
export async function openKakaoFriendPicker(): Promise<KakaoFriend[]> {
  await initKakaoJS();

  const token = sessionStorage.getItem('kakao_access_token');
  if (!token) throw new Error('NO_TOKEN');

  // JS SDK에 액세스 토큰 설정
  (window.Kakao.Auth as any).setAccessToken(token);

  const result = await window.Kakao.Picker.selectFriends({
    title: '수행자로 초대할 친구 선택',
    maxPickableCount: 30,
    minPickableCount: 1,
    enableSearch: true,
  });

  return result.users ?? [];
}

/** 선택된 친구들에게 카카오톡 초대 메시지 전송 */
export async function sendKakaoInviteMessages(
  friends: KakaoFriend[],
  facilitatorId: string,
  facilitatorName: string,
): Promise<void> {
  const token = sessionStorage.getItem('kakao_access_token');
  if (!token) throw new Error('NO_TOKEN');

  const inviteUrl = getInviteUrl(facilitatorId);
  const uuids = friends.map((f) => f.uuid);

  const templateObject = {
    object_type: 'feed',
    content: {
      title: '🎯 미션 포인트 초대',
      description: `${facilitatorName}님이 수행자로 초대했어요! 미션을 수행하고 포인트를 모아보세요 🌟`,
      link: { mobile_web_url: inviteUrl, web_url: inviteUrl },
    },
    buttons: [{ title: '참여하기', link: { mobile_web_url: inviteUrl, web_url: inviteUrl } }],
  };

  const res = await fetch('https://kapi.kakao.com/v1/api/talk/friends/message/default/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      receiver_uuids: JSON.stringify(uuids),
      template_object: JSON.stringify(templateObject),
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MSG_FAIL:${res.status}:${err}`);
  }
}

/** 모바일 네이티브 공유 (카카오톡 포함) */
export async function shareViaNative(facilitatorId: string, facilitatorName: string): Promise<void> {
  const inviteUrl = getInviteUrl(facilitatorId);
  await navigator.share({
    title: '🎯 미션 포인트 초대',
    text: `${facilitatorName}님이 미션 포인트에 초대했어요!`,
    url: inviteUrl,
  });
}
