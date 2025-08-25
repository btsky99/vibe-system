'use client';

import React, { useState, useRef, useEffect } from 'react';

export const VIBETerminal: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    '💻 VIBE Terminal v1.0.0 - 통합 개발 환경',
    '📋 사용 가능한 명령어: help, clear, status, agents, solve',
    ''
  ]);
  const [currentDir, setCurrentDir] = useState('C:\\vibe-system');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const executeCommand = (command: string) => {
    const cmd = command.trim().toLowerCase();
    const newHistory = [...history, `${currentDir}> ${command}`];

    switch (cmd) {
      case 'help':
        newHistory.push('📋 VIBE 터미널 도움말:');
        newHistory.push('  help      - 도움말 표시');
        newHistory.push('  clear     - 화면 지우기');  
        newHistory.push('  status    - 시스템 상태 확인');
        newHistory.push('  agents    - 에이전트 목록 표시');
        newHistory.push('  solve     - 문제 자동 해결 (해결해줘)');
        newHistory.push('  ls        - 파일 목록');
        newHistory.push('  cd <dir>  - 디렉토리 변경');
        newHistory.push('  pwd       - 현재 디렉토리');
        newHistory.push('  npm <cmd> - npm 명령 실행');
        newHistory.push('  git <cmd> - git 명령 실행');
        newHistory.push('');
        break;

      case 'clear':
        setHistory(['💻 VIBE Terminal v1.0.0 - 통합 개발 환경', '']);
        return;

      case 'status':
        newHistory.push('📊 VIBE 시스템 상태:');
        newHistory.push('  🟢 시스템: 온라인');
        newHistory.push('  🟡 OnS 연결: 오프라인 모드');
        newHistory.push('  🤖 에이전트: 30개 로드됨');
        newHistory.push('  💾 메모리: 정상');
        newHistory.push('  ⏱️  업타임: 운영 중');
        newHistory.push('');
        break;

      case 'agents':
        newHistory.push('🤖 로드된 에이전트 목록:');
        newHistory.push('  • debug-specialist (디버깅 전문가)');
        newHistory.push('  • frontend-react-component (React 전문가)');
        newHistory.push('  • backend-firebase-auth (Firebase 전문가)');
        newHistory.push('  • mobile-agent (모바일 최적화)');
        newHistory.push('  • security-auditor (보안 감사)');
        newHistory.push('  ... 25개 더');
        newHistory.push('');
        break;

      case 'solve':
      case '해결해줘':
        newHistory.push('🚀 자동 문제 해결 시스템 실행 중...');
        newHistory.push('  1. 문제 분석 에이전트 실행');
        newHistory.push('  2. 전문가 에이전트 선택');
        newHistory.push('  3. 해결책 제시 및 구현');
        newHistory.push('  4. 결과 검증');
        newHistory.push('✅ 준비 완료! 문제를 설명해주세요.');
        newHistory.push('');
        break;

      case 'pwd':
        newHistory.push(currentDir);
        newHistory.push('');
        break;

      case 'ls':
        newHistory.push('📁 디렉토리 내용:');
        newHistory.push('  📂 src/');
        newHistory.push('  📂 .claude/');
        newHistory.push('  📄 package.json');
        newHistory.push('  📄 next.config.js');
        newHistory.push('  📄 tsconfig.json');
        newHistory.push('');
        break;

      default:
        if (cmd.startsWith('cd ')) {
          const dir = command.substring(3).trim();
          if (dir === '..') {
            const parts = currentDir.split('\\');
            parts.pop();
            setCurrentDir(parts.join('\\') || 'C:');
          } else {
            setCurrentDir(`${currentDir}\\${dir}`);
          }
          newHistory.push('');
        } else if (cmd.startsWith('npm ')) {
          newHistory.push(`📦 npm 명령 실행 중: ${command}`);
          newHistory.push('⏳ 실행 중...');
          newHistory.push('');
        } else if (cmd.startsWith('git ')) {
          newHistory.push(`🔄 git 명령 실행 중: ${command}`);
          newHistory.push('⏳ 실행 중...');
          newHistory.push('');
        } else if (cmd === '') {
          newHistory.push('');
        } else {
          newHistory.push(`❌ 명령을 찾을 수 없습니다: ${command}`);
          newHistory.push('💡 "help"를 입력하여 사용 가능한 명령을 확인하세요.');
          newHistory.push('');
        }
        break;
    }

    setHistory(newHistory);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      executeCommand(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsActive(false);
    }
  };

  return (
    <div className="h-full bg-terminal-bg flex flex-col">
      {/* 터미널 헤더 */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-gray-300 text-sm font-medium">VIBE Terminal</span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-2 py-1 rounded ${
              isActive ? 'bg-vibe-primary text-white' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            {isActive ? 'Active' : 'Click to activate'}
          </button>
        </div>
      </div>

      {/* 터미널 내용 */}
      <div 
        className="flex-1 p-3 overflow-auto font-mono text-sm text-terminal-text cursor-text"
        onClick={() => setIsActive(true)}
      >
        <div className="space-y-1">
          {history.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
          
          {/* 입력 라인 */}
          {isActive && (
            <form onSubmit={handleSubmit} className="flex items-center">
              <span className="text-vibe-primary mr-2">{currentDir}&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-terminal-text"
                placeholder="명령을 입력하세요..."
                spellCheck={false}
              />
            </form>
          )}
          
          {/* 커서 */}
          {isActive && (
            <div className="inline-block w-2 h-5 bg-terminal-cursor animate-pulse ml-1"></div>
          )}
        </div>
      </div>
    </div>
  );
};