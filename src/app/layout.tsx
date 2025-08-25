import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VIBE System - Visual Integrated Backend Environment',
  description: 'AI 기반 통합 개발 환경으로 OnS 프로젝트 개발을 위한 독립 실행형 VIBE 시스템',
  keywords: 'VIBE, AI, 개발환경, OnS, 에이전트, 자동화',
  authors: [{ name: 'VIBE System Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // 개발 환경이므로 검색 엔진 제외
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-gray-900 text-white antialiased">
        <div id="root" className="min-h-screen">
          {children}
        </div>
        
        {/* 글로벌 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // VIBE 시스템 초기화
              window.VIBE_VERSION = '1.0.0';
              window.VIBE_PORT = 3001;
              window.VIBE_STARTED = new Date().toISOString();
              
              // 에러 핸들링
              window.addEventListener('error', function(e) {
                console.error('VIBE System Error:', e.error);
              });
              
              window.addEventListener('unhandledrejection', function(e) {
                console.error('VIBE Promise Rejection:', e.reason);
              });
              
              console.log('%c🚀 VIBE System v1.0.0', 'color: #3B82F6; font-size: 16px; font-weight: bold;');
              console.log('%c독립 실행형 AI 개발 환경이 시작되었습니다.', 'color: #8B5CF6; font-size: 14px;');
            `,
          }}
        />
      </body>
    </html>
  );
}