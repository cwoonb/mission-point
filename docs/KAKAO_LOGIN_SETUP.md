# Kakao 로그인 설정

이 프로젝트는 Kakao JavaScript SDK 로그인이 아니라 Supabase Auth의
`signInWithOAuth({ provider: 'kakao' })`만 사용합니다. REST API 키와 Client
Secret은 프론트 코드나 Vercel `VITE_*` 환경변수에 넣지 않습니다.

## 현재 프로젝트 주소

- 운영 앱: `https://missionapp-topaz.vercel.app`
- 앱 OAuth callback: `https://missionapp-topaz.vercel.app/auth/callback`
- Supabase 프로젝트: `https://dvlzdguefseejiuycxnv.supabase.co`
- Kakao Developers에 등록할 Supabase callback:
  `https://dvlzdguefseejiuycxnv.supabase.co/auth/v1/callback`

Kakao Developers의 Redirect URI에는 앱 callback이 아니라 위 Supabase
callback을 등록해야 합니다.

## A. Kakao Developers

1. Kakao Developers에서 현재 앱을 선택합니다.
2. **카카오 로그인 > 활성화 설정**을 ON으로 변경합니다.
3. **카카오 로그인 > 동의항목**에서 아래 항목을 설정합니다.
   - 닉네임: `profile_nickname`
   - 프로필 사진: `profile_image`
   - 카카오계정 이메일: `account_email`
4. `account_email`을 필수 또는 선택 동의로 설정할 수 없다면 앱의 비즈 앱
   등록 조건과 이메일 제공 조건을 확인합니다. 설정 불가능한 항목을 OAuth
   요청에 남기면 `KOE205`가 발생할 수 있습니다.
5. **앱 > 플랫폼 키 > REST API 키** 설정으로 이동합니다.
6. **카카오 로그인 > Redirect URI**에 아래 주소를 정확히 등록합니다.

   `https://dvlzdguefseejiuycxnv.supabase.co/auth/v1/callback`

7. REST API 키의 Client Secret을 생성하고 활성화합니다.
8. 요청 scope와 동의항목이 정확히 일치하는지 확인합니다. 현재 Supabase
   요청은 `account_email`, `profile_image`, `profile_nickname`을 포함합니다.

### 2026-07-26 실제 확인 결과

- Kakao 앱 `미션`은 현재 **비즈 앱이 아닙니다**.
- `profile_nickname`, `profile_image`는 필수 동의로 설정되어 있습니다.
- `account_email`은 **권한 없음** 상태입니다.
- Supabase authorize 요청에는 `account_email`이 포함됩니다.

따라서 현재 KOE205의 직접 원인은 요청한 `account_email`과 Kakao 앱 권한의
불일치입니다. 프론트에서 임의 scope로 우회하지 말고, Kakao Developers의
**앱 설정 > 앱 > 비즈니스 정보**에서 비즈 앱 전환을 완료한 뒤
`account_email`을 동의항목으로 설정해야 합니다. 개인 개발자는 Kakao 안내에
따라 본인인증과 카카오비즈니스 통합 서비스 약관 동의가 필요할 수 있습니다.

## B. Supabase Dashboard

1. **Authentication > Sign In / Providers > Kakao**로 이동합니다.
2. Kakao Provider를 활성화합니다.
3. Client ID에 Kakao REST API 키를 입력합니다.
4. Client Secret에 Kakao 로그인 Client Secret을 입력합니다.
5. Provider 화면의 Callback URL을 확인합니다.
6. 그 Callback URL을 Kakao Developers Redirect URI에 그대로 등록합니다.
7. Kakao 앱에서 이메일 제공을 사용할 수 없다면 **Allow users without an
   email** 지원 여부를 확인합니다. 이 옵션은 동의항목 불일치를 자동으로
   해결하지 않으므로 Kakao scope 설정도 함께 맞춰야 합니다.

Provider 비밀값은 Supabase Dashboard에만 저장합니다. 프론트에는
`VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`만 인증용으로 사용합니다.

## C. Supabase URL Configuration

**Authentication > URL Configuration**에 아래 주소를 설정합니다.

- Site URL: `https://missionapp-topaz.vercel.app`
- 운영 Redirect URL:
  `https://missionapp-topaz.vercel.app/auth/callback`
- 로컬 Redirect URL:
  `http://localhost:3001/auth/callback`

Vercel Preview 배포에서 OAuth를 시험해야 할 때만 제한된 preview 패턴을
추가합니다.

- 예: `https://mission-*-choli-s-projects.vercel.app/auth/callback`

광범위한 `https://*.vercel.app/**` 패턴은 다른 프로젝트까지 허용할 수 있어
권장하지 않습니다. 운영에서는 고정 production URL을 우선 사용합니다.

## KOE205 확인 순서

1. 브라우저의 Kakao authorize URL에서 `scope` 값을 확인합니다.
2. 각 scope가 Kakao Developers 동의항목에서 활성화됐는지 확인합니다.
3. Supabase Callback URL이 Kakao Redirect URI와 문자 단위로 같은지 확인합니다.
4. Supabase Kakao Client ID가 JavaScript 키가 아닌 REST API 키인지 확인합니다.
5. Client Secret을 활성화했다면 Supabase 값과 일치하는지 확인합니다.

현재 프론트 코드는 별도 `scopes`를 전달하지 않습니다. 따라서
`account_email profile_image profile_nickname` 요청은 Supabase Kakao
Provider가 생성한 것이며, KOE205가 계속되면 Kakao Developers 동의항목 또는
앱 권한 설정을 수정해야 합니다.
