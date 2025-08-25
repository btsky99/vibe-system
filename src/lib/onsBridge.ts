'use client';

import { FileNode } from '@/types/vibe';
import { getVIBELogger } from './logger';

export interface ONSProjectInfo {
  name: string;
  path: string;
  version: string;
  isOnline: boolean;
  lastSync: Date;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  executionTime: number;
}

export interface ONSBridgeConfig {
  onsProjectPath: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  timeout: number;
  enableFileWatching: boolean;
}

export class ONSBridge {
  private config: ONSBridgeConfig;
  private logger = getVIBELogger();
  private connectionStatus: ONSProjectInfo['status'] = 'disconnected';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private fileWatcher: any = null;
  private eventListeners = new Map<string, Set<(data: any) => void>>();

  constructor(config: Partial<ONSBridgeConfig> = {}) {
    this.config = {
      onsProjectPath: config.onsProjectPath || 'C:\\ons',
      autoReconnect: config.autoReconnect ?? true,
      reconnectInterval: config.reconnectInterval || 5000,
      timeout: config.timeout || 30000,
      enableFileWatching: config.enableFileWatching ?? false // 파일 감시는 선택적
    };

    this.setupConnectionMonitoring();
    this.logger.info('ONS Bridge 시스템 초기화 완료', 'ons', { 
      path: this.config.onsProjectPath,
      autoReconnect: this.config.autoReconnect
    });
  }

  /**
   * OnS 프로젝트 정보 조회
   */
  async getProjectInfo(): Promise<ONSProjectInfo> {
    try {
      // OnS 프로젝트 기본 정보 (시뮬레이션)
      const projectInfo: ONSProjectInfo = {
        name: 'OnS (On-site Scheduler)',
        path: this.config.onsProjectPath,
        version: 'v15.0',
        isOnline: await this.checkConnection(),
        lastSync: new Date(),
        status: this.connectionStatus
      };

      this.logger.debug('OnS 프로젝트 정보 조회 완료', 'ons', projectInfo);
      return projectInfo;
    } catch (error) {
      this.logger.error('OnS 프로젝트 정보 조회 실패', 'ons', { error });
      throw new Error('OnS 프로젝트 정보를 가져올 수 없습니다.');
    }
  }

  /**
   * OnS 프로젝트 파일 트리 조회
   */
  async getFileTree(rootPath?: string): Promise<FileNode[]> {
    try {
      const basePath = rootPath || this.config.onsProjectPath;
      
      // 실제 환경에서는 Node.js fs API를 사용하지만, 
      // 클라이언트 환경에서는 시뮬레이션 데이터 사용
      const mockFileTree = await this.getMockFileTree();
      
      this.logger.info('OnS 파일 트리 조회 완료', 'ons', { 
        path: basePath,
        fileCount: this.countFiles(mockFileTree)
      });

      return mockFileTree;
    } catch (error) {
      this.logger.error('OnS 파일 트리 조회 실패', 'ons', { error });
      return [];
    }
  }

  /**
   * OnS 프로젝트 파일 내용 읽기
   */
  async readFile(filePath: string): Promise<string> {
    try {
      this.logger.debug('OnS 파일 읽기 시도', 'ons', { filePath });

      // 실제 환경에서는 Node.js fs.readFile을 사용
      // 여기서는 시뮬레이션
      const content = await this.getMockFileContent(filePath);
      
      this.logger.info('OnS 파일 읽기 완료', 'ons', { 
        filePath,
        size: content.length
      });

      return content;
    } catch (error) {
      this.logger.error('OnS 파일 읽기 실패', 'ons', { filePath, error });
      throw new Error(`파일을 읽을 수 없습니다: ${filePath}`);
    }
  }

  /**
   * OnS 프로젝트에서 명령 실행
   */
  async executeCommand(command: string, cwd?: string): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('OnS 명령 실행 시작', 'ons', { command, cwd });

      // 실제 환경에서는 child_process.exec을 사용
      // 여기서는 시뮬레이션
      const result = await this.simulateCommand(command, cwd);
      
      const executionTime = Date.now() - startTime;
      const finalResult: CommandResult = {
        ...result,
        executionTime
      };

      this.logger.info('OnS 명령 실행 완료', 'ons', { 
        command,
        success: result.success,
        executionTime
      });

      return finalResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorResult: CommandResult = {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        executionTime
      };

      this.logger.error('OnS 명령 실행 실패', 'ons', { command, error });
      return errorResult;
    }
  }

  /**
   * OnS 프로젝트 상태 확인
   */
  async getProjectStatus(): Promise<{
    isRunning: boolean;
    port?: number;
    processes: string[];
    lastBuild?: Date;
    dependencies: { name: string; version: string }[];
  }> {
    try {
      // 실제 환경에서는 포트 체크, 프로세스 확인 등을 수행
      const status = {
        isRunning: Math.random() > 0.3, // 시뮬레이션: 70% 확률로 실행 중
        port: 3000,
        processes: [
          'npm run dev',
          'next dev'
        ],
        lastBuild: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
        dependencies: [
          { name: 'next', version: '14.2.32' },
          { name: 'react', version: '18.2.0' },
          { name: 'typescript', version: '5.3.3' }
        ]
      };

      this.logger.debug('OnS 프로젝트 상태 조회 완료', 'ons', status);
      return status;
    } catch (error) {
      this.logger.error('OnS 프로젝트 상태 조회 실패', 'ons', { error });
      throw error;
    }
  }

  /**
   * 연결 상태 확인
   */
  async checkConnection(): Promise<boolean> {
    try {
      // OnS 프로젝트 디렉토리 존재 확인 (시뮬레이션)
      const isConnected = Math.random() > 0.2; // 80% 확률로 연결
      
      const previousStatus = this.connectionStatus;
      this.connectionStatus = isConnected ? 'connected' : 'disconnected';

      if (previousStatus !== this.connectionStatus) {
        this.emit('connectionChanged', { 
          status: this.connectionStatus,
          isConnected 
        });
        
        this.logger.info(`OnS 연결 상태 변경: ${previousStatus} → ${this.connectionStatus}`, 'ons');
      }

      return isConnected;
    } catch (error) {
      this.connectionStatus = 'error';
      this.logger.error('OnS 연결 확인 실패', 'ons', { error });
      return false;
    }
  }

  /**
   * 파일 감시 시작
   */
  startFileWatching(): void {
    if (!this.config.enableFileWatching || this.fileWatcher) {
      return;
    }

    // 실제 환경에서는 chokidar 등을 사용
    // 여기서는 시뮬레이션
    this.fileWatcher = setInterval(() => {
      // 임의로 파일 변경 이벤트 발생
      if (Math.random() > 0.9) {
        const changedFiles = [
          'src/app/page.tsx',
          'src/components/ScheduleManager.tsx',
          'CLAUDE.md'
        ];
        
        const randomFile = changedFiles[Math.floor(Math.random() * changedFiles.length)];
        this.emit('fileChanged', { 
          path: randomFile,
          type: 'modified',
          timestamp: new Date()
        });
        
        this.logger.debug('OnS 파일 변경 감지', 'ons', { file: randomFile });
      }
    }, 2000);

    this.logger.info('OnS 파일 감시 시작', 'ons', { path: this.config.onsProjectPath });
  }

  /**
   * 파일 감시 중단
   */
  stopFileWatching(): void {
    if (this.fileWatcher) {
      clearInterval(this.fileWatcher);
      this.fileWatcher = null;
      this.logger.info('OnS 파일 감시 중단', 'ons');
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 이벤트 발생
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.logger.error('OnS Bridge 이벤트 리스너 오류', 'ons', { event, error });
        }
      });
    }
  }

  /**
   * 연결 모니터링 설정
   */
  private setupConnectionMonitoring(): void {
    if (this.config.autoReconnect) {
      this.reconnectTimer = setInterval(async () => {
        if (this.connectionStatus === 'disconnected' || this.connectionStatus === 'error') {
          await this.checkConnection();
        }
      }, this.config.reconnectInterval);
    }
  }

  /**
   * 명령 시뮬레이션
   */
  private async simulateCommand(command: string, cwd?: string): Promise<Omit<CommandResult, 'executionTime'>> {
    return new Promise((resolve) => {
      // 시뮬레이션 지연
      setTimeout(() => {
        const cmd = command.toLowerCase().trim();
        
        if (cmd.includes('npm install')) {
          resolve({
            success: true,
            output: 'added 387 packages in 54s\nfound 0 vulnerabilities',
            exitCode: 0
          });
        } else if (cmd.includes('npm run build')) {
          resolve({
            success: true,
            output: '✓ Compiled successfully\n✓ Static export completed',
            exitCode: 0
          });
        } else if (cmd.includes('git status')) {
          resolve({
            success: true,
            output: 'On branch master\nnothing to commit, working tree clean',
            exitCode: 0
          });
        } else if (cmd.includes('git')) {
          resolve({
            success: true,
            output: `Successfully executed: ${command}`,
            exitCode: 0
          });
        } else {
          resolve({
            success: false,
            output: '',
            error: `Command not found: ${command}`,
            exitCode: 127
          });
        }
      }, 1000 + Math.random() * 2000);
    });
  }

  /**
   * 모의 파일 트리 생성
   */
  private async getMockFileTree(): Promise<FileNode[]> {
    return [
      {
        name: 'src',
        path: `${this.config.onsProjectPath}\\src`,
        type: 'directory',
        children: [
          {
            name: 'app',
            path: `${this.config.onsProjectPath}\\src\\app`,
            type: 'directory',
            children: [
              { name: 'page.tsx', path: `${this.config.onsProjectPath}\\src\\app\\page.tsx`, type: 'file', size: 2048, modified: new Date() },
              { name: 'layout.tsx', path: `${this.config.onsProjectPath}\\src\\app\\layout.tsx`, type: 'file', size: 1536, modified: new Date() },
            ]
          },
          {
            name: 'components',
            path: `${this.config.onsProjectPath}\\src\\components`,
            type: 'directory',
            children: [
              { name: 'ScheduleManager.tsx', path: `${this.config.onsProjectPath}\\src\\components\\ScheduleManager.tsx`, type: 'file', size: 8192, modified: new Date() },
              { name: 'ReservationForm.tsx', path: `${this.config.onsProjectPath}\\src\\components\\ReservationForm.tsx`, type: 'file', size: 6144, modified: new Date() },
            ]
          }
        ]
      },
      { name: 'CLAUDE.md', path: `${this.config.onsProjectPath}\\CLAUDE.md`, type: 'file', size: 12288, modified: new Date() },
      { name: 'package.json', path: `${this.config.onsProjectPath}\\package.json`, type: 'file', size: 2048, modified: new Date() },
    ];
  }

  /**
   * 모의 파일 내용 생성
   */
  private async getMockFileContent(filePath: string): Promise<string> {
    const fileName = filePath.split('\\').pop() || '';
    
    if (fileName.endsWith('.tsx')) {
      return `import React from 'react';

export default function ${fileName.replace('.tsx', '')}() {
  return (
    <div>
      <h1>${fileName} Component</h1>
      <p>OnS 프로젝트의 ${fileName} 파일입니다.</p>
    </div>
  );
}`;
    } else if (fileName.endsWith('.md')) {
      return `# ${fileName}

OnS 프로젝트 문서입니다.

## 개요
이 문서는 ${fileName}에 대한 설명입니다.

## 내용
- 항목 1
- 항목 2
- 항목 3`;
    } else if (fileName === 'package.json') {
      return JSON.stringify({
        name: "business-trip-schedule-manager",
        version: "15.0.0",
        description: "OnS - On-site Scheduler",
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start"
        }
      }, null, 2);
    }
    
    return `파일: ${filePath}\n생성 시간: ${new Date().toISOString()}\n\n파일 내용을 여기에 표시합니다.`;
  }

  /**
   * 파일 개수 계산
   */
  private countFiles(nodes: FileNode[]): number {
    let count = 0;
    for (const node of nodes) {
      if (node.type === 'file') {
        count++;
      } else if (node.children) {
        count += this.countFiles(node.children);
      }
    }
    return count;
  }

  /**
   * 정리 (컴포넌트 언마운트 시)
   */
  destroy(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }
    this.stopFileWatching();
    this.eventListeners.clear();
    this.logger.info('ONS Bridge 시스템 종료', 'ons');
  }
}

// 싱글톤 인스턴스
let onsBridge: ONSBridge | null = null;

export const getONSBridge = (config?: Partial<ONSBridgeConfig>): ONSBridge => {
  if (!onsBridge) {
    onsBridge = new ONSBridge(config);
  }
  return onsBridge;
};