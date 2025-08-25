'use client';

import React, { useState, useEffect } from 'react';
import { FileExplorer } from './FileExplorer';
import { CentralArea } from './CentralArea';
import { ClaudeChat } from './ClaudeChat';
import { VIBETerminal } from './VIBETerminal';
import { StatusBar } from './StatusBar';
import { SystemStatus } from '@/types/vibe';

export const VIBELayout: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isOnline: true,
    isConnectedToOnS: false,
    activeAgents: 0,
    totalAgents: 30,
    memoryUsage: 0,
    uptime: 0,
  });

  const [selectedTab, setSelectedTab] = useState<'files' | 'logs' | 'agents'>('logs');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    // 시스템 상태 업데이트
    const updateStatus = () => {
      setSystemStatus(prev => ({
        ...prev,
        uptime: prev.uptime + 1,
        memoryUsage: Math.floor(Math.random() * 100), // 임시 데이터
      }));
    };

    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* 상태 표시줄 */}
      <StatusBar systemStatus={systemStatus} />
      
      {/* 메인 레이아웃: 4영역 분할 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 파일 탐색기 */}
        <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center">
              📁 OnS 프로젝트
            </h2>
          </div>
          <div className="flex-1 overflow-auto">
            <FileExplorer onFileSelect={setSelectedFile} />
          </div>
        </div>

        {/* 중앙: 파일내용/로그/에이전트 탭 */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* 탭 헤더 */}
          <div className="flex border-b border-gray-700 bg-gray-800">
            {[
              { key: 'files' as const, label: '📄 파일내용', icon: '📄' },
              { key: 'logs' as const, label: '📋 로그', icon: '📋' },
              { key: 'agents' as const, label: '🤖 에이전트', icon: '🤖' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === tab.key
                    ? 'bg-vibe-primary text-white border-b-2 border-vibe-primary'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* 중앙 영역 상단 */}
          <div className="h-2/3 overflow-auto">
            <CentralArea 
              activeTab={selectedTab}
              selectedFile={selectedFile}
              systemStatus={systemStatus}
            />
          </div>

          {/* 중앙 영역 하단: VIBE 터미널 */}
          <div className="h-1/3 border-t border-gray-700">
            <VIBETerminal />
          </div>
        </div>

        {/* 우측: Claude Code 채팅 */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center">
              💬 Claude Code
              <span className="ml-2 px-2 py-1 text-xs bg-green-600 rounded-full">
                연결됨
              </span>
            </h2>
          </div>
          <div className="flex-1">
            <ClaudeChat />
          </div>
        </div>
      </div>
    </div>
  );
};