'use client';

import React from 'react';
import { SystemStatus } from '@/types/vibe';

interface StatusBarProps {
  systemStatus: SystemStatus;
}

export const StatusBar: React.FC<StatusBarProps> = ({ systemStatus }) => {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatus = () => {
    if (systemStatus.isConnectedToOnS) {
      return { label: '온라인', color: 'bg-green-500', icon: '🟢' };
    } else if (systemStatus.isOnline) {
      return { label: '오프라인', color: 'bg-yellow-500', icon: '🟡' };
    } else {
      return { label: '연결끊김', color: 'bg-red-500', icon: '🔴' };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 text-xs">
      {/* 좌측: 시스템 정보 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${connectionStatus.color} animate-pulse`}></span>
          <span className="text-gray-300">{connectionStatus.label}</span>
        </div>
        
        <div className="text-gray-400">
          에이전트: {systemStatus.activeAgents}/{systemStatus.totalAgents}
        </div>
        
        <div className="text-gray-400">
          메모리: {systemStatus.memoryUsage}%
        </div>
        
        <div className="text-gray-400">
          업타임: {formatUptime(systemStatus.uptime)}
        </div>
      </div>

      {/* 우측: VIBE 정보 */}
      <div className="flex items-center space-x-2">
        <span className="text-vibe-primary font-semibold">VIBE</span>
        <span className="text-gray-400">v1.0.0</span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-400">Port 3001</span>
      </div>
    </div>
  );
};