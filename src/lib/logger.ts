'use client';

import { LogEntry } from '@/types/vibe';

export interface LoggerConfig {
  maxEntries: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  autoSave: boolean;
  autoSaveInterval: number;
  enableConsoleOutput: boolean;
}

export interface LogFilter {
  level?: LogEntry['level'][];
  source?: LogEntry['source'][];
  agentId?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  searchText?: string;
}

export class VIBELogger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig;
  private listeners: Set<(log: LogEntry) => void> = new Set();
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private logLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      maxEntries: config.maxEntries || 1000,
      logLevel: config.logLevel || 'info',
      autoSave: config.autoSave ?? true,
      autoSaveInterval: config.autoSaveInterval || 30000,
      enableConsoleOutput: config.enableConsoleOutput ?? true
    };

    this.setupAutoSave();
    this.loadSavedLogs();
    this.addWelcomeLogs();
  }

  /**
   * 로그 추가
   */
  log(level: LogEntry['level'], message: string, source: LogEntry['source'] = 'vibe', details?: any, agentId?: string): void {
    // 로그 레벨 필터링
    if (this.logLevels[level] < this.logLevels[this.config.logLevel]) {
      return;
    }

    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      source,
      details,
      agentId
    };

    // 로그 추가
    this.logs.unshift(logEntry); // 최신 로그가 맨 앞에

    // 최대 개수 제한
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(0, this.config.maxEntries);
    }

    // 콘솔 출력
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }

    // 리스너들에게 알림
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (error) {
        console.error('로그 리스너 실행 오류:', error);
      }
    });
  }

  /**
   * 편의 메서드들
   */
  debug(message: string, source?: LogEntry['source'], details?: any, agentId?: string): void {
    this.log('debug', message, source, details, agentId);
  }

  info(message: string, source?: LogEntry['source'], details?: any, agentId?: string): void {
    this.log('info', message, source, details, agentId);
  }

  warn(message: string, source?: LogEntry['source'], details?: any, agentId?: string): void {
    this.log('warn', message, source, details, agentId);
  }

  error(message: string, source?: LogEntry['source'], details?: any, agentId?: string): void {
    this.log('error', message, source, details, agentId);
  }

  success(message: string, source?: LogEntry['source'], details?: any, agentId?: string): void {
    this.log('success', message, source, details, agentId);
  }

  /**
   * 로그 조회
   */
  getLogs(filter?: LogFilter, limit?: number): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      // 레벨 필터
      if (filter.level && filter.level.length > 0) {
        filteredLogs = filteredLogs.filter(log => filter.level!.includes(log.level));
      }

      // 소스 필터
      if (filter.source && filter.source.length > 0) {
        filteredLogs = filteredLogs.filter(log => filter.source!.includes(log.source));
      }

      // 에이전트 ID 필터
      if (filter.agentId && filter.agentId.length > 0) {
        filteredLogs = filteredLogs.filter(log => 
          log.agentId && filter.agentId!.includes(log.agentId)
        );
      }

      // 시간 범위 필터
      if (filter.timeRange) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp >= filter.timeRange!.start && 
          log.timestamp <= filter.timeRange!.end
        );
      }

      // 텍스트 검색
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchText) ||
          (log.details && JSON.stringify(log.details).toLowerCase().includes(searchText))
        );
      }
    }

    // 개수 제한
    if (limit && limit > 0) {
      filteredLogs = filteredLogs.slice(0, limit);
    }

    return filteredLogs;
  }

  /**
   * 로그 통계
   */
  getLogStats(): {
    total: number;
    byLevel: Record<LogEntry['level'], number>;
    bySource: Record<LogEntry['source'], number>;
    recentActivity: { hour: number; count: number }[];
  } {
    const stats = {
      total: this.logs.length,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0, success: 0 } as Record<LogEntry['level'], number>,
      bySource: { vibe: 0, ons: 0, 'claude-code': 0, agent: 0 } as Record<LogEntry['source'], number>,
      recentActivity: [] as { hour: number; count: number }[]
    };

    // 레벨별 통계
    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.bySource[log.source]++;
    });

    // 최근 24시간 활동
    const now = new Date();
    const hoursAgo = new Array(24).fill(0).map((_, i) => {
      const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
      return {
        hour: hour.getHours(),
        count: this.logs.filter(log => {
          const logHour = new Date(log.timestamp);
          return logHour.getHours() === hour.getHours() &&
                 logHour.getDate() === hour.getDate();
        }).length
      };
    });

    stats.recentActivity = hoursAgo.reverse();

    return stats;
  }

  /**
   * 로그 지우기
   */
  clearLogs(filter?: LogFilter): number {
    const beforeCount = this.logs.length;

    if (!filter) {
      // 모든 로그 지우기
      this.logs = [];
    } else {
      // 필터링된 로그만 지우기
      const logsToKeep = this.logs.filter(log => {
        // 필터 조건에 맞지 않는 로그는 유지
        if (filter.level && filter.level.length > 0 && filter.level.includes(log.level)) {
          return false;
        }
        if (filter.source && filter.source.length > 0 && filter.source.includes(log.source)) {
          return false;
        }
        if (filter.agentId && filter.agentId.length > 0 && log.agentId && filter.agentId.includes(log.agentId)) {
          return false;
        }
        return true;
      });
      this.logs = logsToKeep;
    }

    const deletedCount = beforeCount - this.logs.length;
    this.info(`${deletedCount}개의 로그가 삭제되었습니다.`, 'vibe');
    
    return deletedCount;
  }

  /**
   * 로그 내보내기
   */
  exportLogs(format: 'json' | 'csv' | 'txt' = 'json', filter?: LogFilter): string {
    const logs = this.getLogs(filter);

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      
      case 'csv':
        const csvHeader = 'Timestamp,Level,Source,Agent ID,Message,Details\n';
        const csvRows = logs.map(log => {
          const timestamp = log.timestamp.toISOString();
          const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
          return `"${timestamp}","${log.level}","${log.source}","${log.agentId || ''}","${log.message.replace(/"/g, '""')}","${details}"`;
        }).join('\n');
        return csvHeader + csvRows;
      
      case 'txt':
        return logs.map(log => {
          const timestamp = log.timestamp.toLocaleString('ko-KR');
          const details = log.details ? ` | ${JSON.stringify(log.details)}` : '';
          return `[${timestamp}] ${log.level.toUpperCase()} [${log.source}${log.agentId ? `/${log.agentId}` : ''}] ${log.message}${details}`;
        }).join('\n');
      
      default:
        return JSON.stringify(logs, null, 2);
    }
  }

  /**
   * 로그 리스너 등록
   */
  addListener(listener: (log: LogEntry) => void): () => void {
    this.listeners.add(listener);
    
    // 리스너 제거 함수 반환
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.autoSave !== undefined) {
      if (newConfig.autoSave) {
        this.setupAutoSave();
      } else {
        this.stopAutoSave();
      }
    }
  }

  /**
   * 콘솔 출력
   */
  private outputToConsole(log: LogEntry): void {
    const prefix = `[VIBE ${log.source.toUpperCase()}${log.agentId ? `/${log.agentId}` : ''}]`;
    const message = `${prefix} ${log.message}`;
    
    switch (log.level) {
      case 'debug':
        console.debug(message, log.details);
        break;
      case 'info':
        console.info(message, log.details);
        break;
      case 'warn':
        console.warn(message, log.details);
        break;
      case 'error':
        console.error(message, log.details);
        break;
      case 'success':
        console.log(`✅ ${message}`, log.details);
        break;
    }
  }

  /**
   * 자동 저장 설정
   */
  private setupAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    if (this.config.autoSave) {
      this.autoSaveTimer = setInterval(() => {
        this.saveLogs();
      }, this.config.autoSaveInterval);
    }
  }

  /**
   * 자동 저장 중단
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 로그 저장
   */
  private saveLogs(): void {
    if (typeof window !== 'undefined') {
      try {
        const logsToSave = this.logs.slice(0, 100); // 최근 100개만 저장
        localStorage.setItem('vibe-logs', JSON.stringify({
          logs: logsToSave,
          savedAt: new Date().toISOString()
        }));
      } catch (error) {
        console.error('로그 저장 실패:', error);
      }
    }
  }

  /**
   * 저장된 로그 불러오기
   */
  private loadSavedLogs(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vibe-logs');
        if (saved) {
          const { logs } = JSON.parse(saved);
          // 날짜 복원
          const restoredLogs = logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
          this.logs = [...restoredLogs, ...this.logs];
        }
      } catch (error) {
        console.error('저장된 로그 불러오기 실패:', error);
      }
    }
  }

  /**
   * 환영 로그 추가
   */
  private addWelcomeLogs(): void {
    this.info('🚀 VIBE 시스템 시작', 'vibe', { version: '1.0.0', port: 3001 });
    this.info('📋 통합 로그 시스템 활성화', 'vibe', { 
      maxEntries: this.config.maxEntries,
      logLevel: this.config.logLevel
    });
    this.info('🤖 에이전트 시스템 준비 완료', 'agent', { count: 30 });
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 정리 (컴포넌트 언마운트 시 호출)
   */
  destroy(): void {
    this.stopAutoSave();
    this.saveLogs();
    this.listeners.clear();
    this.logs = [];
  }
}

// 싱글톤 로거 인스턴스
let vibeLogger: VIBELogger | null = null;

export const getVIBELogger = (): VIBELogger => {
  if (!vibeLogger) {
    vibeLogger = new VIBELogger();
  }
  return vibeLogger;
};

// 편의 함수들
export const logDebug = (message: string, source?: LogEntry['source'], details?: any, agentId?: string) => {
  getVIBELogger().debug(message, source, details, agentId);
};

export const logInfo = (message: string, source?: LogEntry['source'], details?: any, agentId?: string) => {
  getVIBELogger().info(message, source, details, agentId);
};

export const logWarn = (message: string, source?: LogEntry['source'], details?: any, agentId?: string) => {
  getVIBELogger().warn(message, source, details, agentId);
};

export const logError = (message: string, source?: LogEntry['source'], details?: any, agentId?: string) => {
  getVIBELogger().error(message, source, details, agentId);
};

export const logSuccess = (message: string, source?: LogEntry['source'], details?: any, agentId?: string) => {
  getVIBELogger().success(message, source, details, agentId);
};