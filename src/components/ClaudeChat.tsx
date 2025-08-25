'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/vibe';

export const ClaudeChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      timestamp: new Date(),
      type: 'system',
      content: '💬 Claude Code와 연결되었습니다.\n\nVIBE 시스템이 준비되었습니다!'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() + 1000),
      type: 'assistant',
      content: '안녕하세요! VIBE 시스템을 통해 OnS 프로젝트를 더욱 효율적으로 개발할 수 있습니다.\n\n다음 명령어들을 사용해보세요:\n• "해결해줘" - 자동 문제 해결\n• "상태 확인" - 시스템 상태 점검\n• "에이전트 실행" - 전문 에이전트 활용'
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // 시뮬레이션된 응답
    setTimeout(() => {
      let response = '';
      
      if (currentInput.includes('해결해줘') || currentInput.includes('solve')) {
        response = '🚀 자동 문제 해결 시스템을 실행합니다.\n\n1. 문제 분석 에이전트 실행 중...\n2. 최적 해결책 검색 중...\n3. 전문가 에이전트 대기 중...\n\n어떤 문제를 해결해드릴까요?';
      } else if (currentInput.includes('상태') || currentInput.includes('status')) {
        response = '📊 VIBE 시스템 상태 보고:\n\n✅ 시스템: 정상 운영\n✅ 에이전트: 30개 로드됨\n✅ OnS 연동: 오프라인 모드\n✅ 터미널: 활성화\n✅ 메모리: 최적화됨\n\n모든 시스템이 정상적으로 작동하고 있습니다!';
      } else if (currentInput.includes('에이전트')) {
        response = '🤖 사용 가능한 전문 에이전트:\n\n• Debug Specialist - 디버깅 전문가\n• React Component Expert - React 개발\n• Firebase Expert - 백엔드 관리\n• Mobile Agent - 모바일 최적화\n• Security Auditor - 보안 검사\n\n어떤 에이전트를 실행할까요?';
      } else if (currentInput.includes('안녕') || currentInput.includes('hello')) {
        response = '안녕하세요! 👋\n\nVIBE 시스템에 오신 것을 환영합니다.\n\n이 시스템을 통해:\n• 30+ 전문 에이전트 활용\n• 실시간 프로젝트 모니터링\n• 자동화된 개발 워크플로우\n• OnS 프로젝트와의 완벽한 연동\n\n무엇을 도와드릴까요?';
      } else {
        response = `"${currentInput}"에 대해 처리 중입니다.\n\nVIBE 시스템의 주요 기능:\n• 자동 문제 해결: "해결해줘"\n• 시스템 상태 확인: "상태 확인"\n• 에이전트 관리: "에이전트 목록"\n• 터미널 명령: 하단 터미널 활용\n\n더 구체적인 요청을 해주시면 더 정확한 도움을 드릴 수 있습니다!`;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        timestamp: new Date(),
        type: 'assistant',
        content: response
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickCommands = [
    { label: '해결해줘', command: '해결해줘' },
    { label: '상태 확인', command: '시스템 상태를 확인해줘' },
    { label: '에이전트 목록', command: '사용 가능한 에이전트를 보여줘' },
    { label: '도움말', command: '도움말을 보여줘' }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${
              message.type === 'user' 
                ? 'bg-vibe-primary text-white'
                : message.type === 'system'
                ? 'bg-gray-700 text-gray-300 border border-gray-600'
                : 'bg-gray-800 text-gray-300 border border-gray-700'
            }`}>
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              <div className={`text-xs mt-2 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-vibe-primary border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-400">응답을 생성하는 중...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 명령어 */}
      <div className="p-2 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-1 mb-2">
          {quickCommands.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => {
                setInput(cmd.command);
                inputRef.current?.focus();
              }}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-700 p-3">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-vibe-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-vibe-primary hover:bg-vibe-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
};