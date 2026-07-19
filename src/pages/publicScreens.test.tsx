import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { describe, expect, it } from 'vitest';
import SplashPage from './SplashPage';
import DemoPage from './DemoPage';
import LoginPage from './LoginPage';

describe('public entry screen',()=>{
  it('shows only login, signup, and demo entry actions',()=>{
    const html=renderToStaticMarkup(<MemoryRouter><SplashPage/></MemoryRouter>);
    expect(html).toContain('로그인');
    expect(html).toContain('회원가입');
    expect(html).toContain('데모로 둘러보기');
    expect(html).not.toContain('운영자로 시작하기');
    expect(html).not.toContain('학생으로 참여하기');
    expect(html).not.toContain('초대 코드');
  });
  it('shows only three priority operator demos plus student demo',()=>{
    const html=renderToStaticMarkup(<MemoryRouter><DemoPage/></MemoryRouter>);
    expect(html).toContain('소형 공부방'); expect(html).toContain('미술 학원'); expect(html).toContain('피아노 학원'); expect(html).toContain('한유진 학생');
    expect(html).not.toContain('PT 센터'); expect(html).not.toContain('대형 학원'); expect(html).not.toContain('회사 교육');
  });
  it('keeps demo cards out of login screen',()=>{
    const html=renderToStaticMarkup(<GoogleOAuthProvider clientId="test"><MemoryRouter><LoginPage/></MemoryRouter></GoogleOAuthProvider>);
    expect(html).toContain('이메일 주소'); expect(html).toContain('비밀번호'); expect(html).toContain('로그인 상태 유지');
    expect(html).not.toContain('운영자 데모'); expect(html).not.toContain('학생 데모'); expect(html).not.toContain('소형 공부방');
  });
});
