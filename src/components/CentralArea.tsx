'use client';

import React, { useState, useEffect } from 'react';
import { LogEntry, Agent, SystemStatus } from '@/types/vibe';

interface CentralAreaProps {
  activeTab: 'files' | 'logs' | 'agents';
  selectedFile: string | null;
  systemStatus: SystemStatus;
}

export const CentralArea: React.FC<CentralAreaProps> = ({ 
  activeTab, 
  selectedFile, 
  systemStatus 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    // 초기 로그 생성
    setLogs([
      {
        id: '1',
        timestamp: new Date(),
        level: 'info',
        message: 'VIBE 시스템이 시작되었습니다',
        source: 'vibe'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 5000),
        level: 'success',
        message: '30개 에이전트 로드 완료',
        source: 'agent'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 10000),
        level: 'warn',
        message: 'OnS 프로젝트 연결 대기 중',
        source: 'ons'
      }
    ]);

    // 초기 에이전트 생성
    setAgents([
      {
        id: 'debug-specialist',
        name: '🐛 Debug Specialist',
        description: 'AI 기반 지능형 디버깅 전문가',
        status: 'idle',
        type: 'general-purpose'
      },
      {
        id: 'frontend-react',
        name: '⚛️ React Component Expert',
        description: 'React 19+ 컴포넌트 개발 전문가',
        status: 'idle',
        type: 'frontend'
      },
      {
        id: 'backend-firebase',
        name: '🔥 Firebase Expert',
        description: 'Firebase Firestore 및 Auth 전문가',
        status: 'idle',
        type: 'backend'
      },
      {
        id: 'mobile-agent',
        name: '📱 Mobile Agent',
        description: '모바일 최적화 전문가',
        status: 'idle',
        type: 'mobile'
      },
      {
        id: 'security-auditor',
        name: '🛡️ Security Auditor',
        description: '보안 취약점 감사 전문가',
        status: 'idle',
        type: 'security'
      }
    ]);
  }, []);

  useEffect(() => {
    if (selectedFile) {
      // 선택된 파일 내용 로드 (시뮬레이션)
      const loadFileContent = () => {
        if (selectedFile.endsWith('.tsx') || selectedFile.endsWith('.ts')) {
          setFileContent(`// ${selectedFile}\n\nexport default function Component() {\n  return (\n    <div>\n      {/* 파일 내용 */}\n    </div>\n  );\n}`);
        } else if (selectedFile.endsWith('.md')) {
          setFileContent(`# ${selectedFile.split('\\').pop()}\n\n이것은 마크다운 파일입니다.\n\n## 섹션\n\n내용...`);
        } else {
          setFileContent(`파일: ${selectedFile}\n\n내용을 로드하는 중...`);
        }
      };
      loadFileContent();
    }
  }, [selectedFile]);

  const renderFilesTab = () => {
    if (!selectedFile) {
      return (
        <div className="p-8 text-center text-gray-400">
          <div className="text-4xl mb-4">📄</div>
          <p>좌측에서 파일을 선택하세요</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <span className="text-vibe-primary mr-2">📄</span>
            <span className="text-sm text-gray-300">{selectedFile}</span>
          </div>
        </div>
        <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm text-gray-300 font-mono">
          {fileContent}
        </pre>
      </div>
    );
  };

  const renderLogsTab = () => {
    return (
      <div className="p-4">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            📋 통합 로그 시스템
          </h3>
          <div className="flex space-x-4 text-xs text-gray-400">
            <span>총 로그: {logs.length}개</span>
            <span>실시간 모니터링</span>
          </div>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-auto">
          {logs.map(log => (
            <div 
              key={log.id} 
              className={`p-3 rounded border-l-4 ${
                log.level === 'error' ? 'bg-red-900/20 border-red-500' :
                log.level === 'warn' ? 'bg-yellow-900/20 border-yellow-500' :
                log.level === 'success' ? 'bg-green-900/20 border-green-500' :
                'bg-blue-900/20 border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warn' ? 'text-yellow-400' :
                  log.level === 'success' ? 'text-green-400' :
                  'text-blue-400'
                }`}>
                  {log.source.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{log.message}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAgentsTab = () => {
    return (
      <div className="p-4">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            🤖 에이전트 관리
          </h3>
          <div className="flex space-x-4 text-xs text-gray-400">
            <span>활성: {agents.filter(a => a.status === 'running').length}개</span>
            <span>대기: {agents.filter(a => a.status === 'idle').length}개</span>
            <span>총 에이전트: {agents.length}개</span>
          </div>
        </div>
        
        <div className="grid gap-3">
          {agents.map(agent => (
            <div 
              key={agent.id} 
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-200">
                  {agent.name}
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  agent.status === 'running' ? 'bg-green-600 text-white' :
                  agent.status === 'completed' ? 'bg-blue-600 text-white' :
                  agent.status === 'error' ? 'bg-red-600 text-white' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  {agent.status === 'idle' ? '대기중' :
                   agent.status === 'running' ? '실행중' :
                   agent.status === 'completed' ? '완료' : '에러'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{agent.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  타입: {agent.type}
                </span>
                <button className="text-xs bg-vibe-primary hover:bg-vibe-primary/80 px-2 py-1 rounded transition-colors">
                  실행
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      {activeTab === 'files' && renderFilesTab()}
      {activeTab === 'logs' && renderLogsTab()}
      {activeTab === 'agents' && renderAgentsTab()}
    </div>
  );
};