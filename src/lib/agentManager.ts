'use client';

import { Agent, LogEntry } from '@/types/vibe';

export interface AgentResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

export interface AgentExecutionOptions {
  timeout?: number;
  parameters?: Record<string, any>;
  onProgress?: (progress: number, message: string) => void;
  onLog?: (log: LogEntry) => void;
}

export class AgentManager {
  private runningAgents = new Map<string, AbortController>();
  private agentResults = new Map<string, AgentResult>();
  private eventListeners = new Map<string, Set<(event: any) => void>>();

  constructor() {
    this.setupGlobalErrorHandling();
  }

  /**
   * 에이전트 실행
   */
  async executeAgent(
    agent: Agent, 
    prompt: string, 
    options: AgentExecutionOptions = {}
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const abortController = new AbortController();
    
    try {
      // 실행 중 상태로 변경
      this.updateAgentStatus(agent.id, 'running');
      this.runningAgents.set(agent.id, abortController);

      // 진행률 콜백 설정
      const progressCallback = options.onProgress || (() => {});
      const logCallback = options.onLog || (() => {});

      // 로그 기록
      logCallback({
        id: this.generateId(),
        timestamp: new Date(),
        level: 'info',
        message: `에이전트 ${agent.name} 실행 시작`,
        source: 'agent',
        agentId: agent.id
      });

      // 에이전트 실행 시뮬레이션
      const result = await this.simulateAgentExecution(
        agent, 
        prompt, 
        options, 
        progressCallback,
        logCallback,
        abortController.signal
      );

      // 실행 시간 계산
      const executionTime = Date.now() - startTime;
      const finalResult: AgentResult = {
        ...result,
        executionTime
      };

      // 결과 저장
      this.agentResults.set(agent.id, finalResult);
      
      // 상태 업데이트
      this.updateAgentStatus(agent.id, result.success ? 'completed' : 'error');

      // 최종 로그
      logCallback({
        id: this.generateId(),
        timestamp: new Date(),
        level: result.success ? 'success' : 'error',
        message: `에이전트 ${agent.name} 실행 ${result.success ? '완료' : '실패'}`,
        source: 'agent',
        agentId: agent.id,
        details: { executionTime, output: result.output }
      });

      return finalResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorResult: AgentResult = {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime
      };

      this.updateAgentStatus(agent.id, 'error');
      this.agentResults.set(agent.id, errorResult);

      return errorResult;
    } finally {
      this.runningAgents.delete(agent.id);
    }
  }

  /**
   * 에이전트 실행 시뮬레이션 (실제 Claude Code 연동 시 교체 예정)
   */
  private async simulateAgentExecution(
    agent: Agent,
    prompt: string,
    options: AgentExecutionOptions,
    progressCallback: (progress: number, message: string) => void,
    logCallback: (log: LogEntry) => void,
    signal: AbortSignal
  ): Promise<Omit<AgentResult, 'executionTime'>> {
    const timeout = options.timeout || 30000; // 30초 기본 타임아웃

    return new Promise((resolve) => {
      let progress = 0;
      const steps = this.getAgentExecutionSteps(agent);
      const stepDuration = timeout / steps.length;

      const executeStep = (stepIndex: number) => {
        if (signal.aborted) {
          resolve({
            success: false,
            output: '',
            error: '작업이 중단되었습니다.'
          });
          return;
        }

        if (stepIndex >= steps.length) {
          // 실행 완료
          const output = this.generateAgentOutput(agent, prompt);
          resolve({
            success: true,
            output,
            metadata: {
              stepsCompleted: steps.length,
              agentType: agent.type,
              parameters: options.parameters
            }
          });
          return;
        }

        const step = steps[stepIndex];
        progress = Math.round(((stepIndex + 1) / steps.length) * 100);
        
        // 진행률 업데이트
        progressCallback(progress, step);
        
        // 로그 기록
        logCallback({
          id: this.generateId(),
          timestamp: new Date(),
          level: 'info',
          message: step,
          source: 'agent',
          agentId: agent.id
        });

        // 다음 단계로 진행
        setTimeout(() => executeStep(stepIndex + 1), stepDuration / 4 + Math.random() * stepDuration);
      };

      executeStep(0);

      // 타임아웃 처리
      setTimeout(() => {
        if (!signal.aborted) {
          resolve({
            success: false,
            output: '',
            error: `타임아웃: ${timeout}ms 내에 완료되지 않았습니다.`
          });
        }
      }, timeout);
    });
  }

  /**
   * 에이전트별 실행 단계 정의
   */
  private getAgentExecutionSteps(agent: Agent): string[] {
    const commonSteps = [
      '작업 환경 초기화',
      '요청사항 분석',
      '최적 전략 수립'
    ];

    const typeSpecificSteps: Record<typeof agent.type, string[]> = {
      'general-purpose': [
        '문제 상황 분석',
        '해결 방안 탐색',
        '최적해 도출',
        '결과 검증'
      ],
      'frontend': [
        '컴포넌트 구조 분석',
        'UI/UX 요구사항 검토',
        '코드 구현',
        '반응형 테스트'
      ],
      'backend': [
        'API 설계 분석',
        '데이터 모델 검토',
        '서버 로직 구현',
        '보안 검증'
      ],
      'mobile': [
        '디바이스 호환성 체크',
        '터치 인터페이스 최적화',
        '성능 프로파일링',
        '배터리 효율 검증'
      ],
      'security': [
        '취약점 스캔',
        '보안 정책 검토',
        '위험도 평가',
        '대응 방안 수립'
      ],
      'performance': [
        '성능 지표 측정',
        '병목 지점 식별',
        '최적화 전략 적용',
        '성능 검증'
      ],
      'docs': [
        '문서 구조 분석',
        '내용 일관성 검토',
        '업데이트 사항 반영',
        '품질 검증'
      ],
      'ai': [
        'AI 모델 준비',
        '데이터 전처리',
        '모델 실행',
        '결과 후처리'
      ],
      'workflow': [
        '워크플로우 분석',
        '자동화 지점 식별',
        '프로세스 최적화',
        '효율성 검증'
      ]
    };

    return [...commonSteps, ...(typeSpecificSteps[agent.type] || []), '작업 완료'];
  }

  /**
   * 에이전트 출력 생성
   */
  private generateAgentOutput(agent: Agent, prompt: string): string {
    const timestamp = new Date().toLocaleString('ko-KR');
    
    const outputTemplates: Record<typeof agent.type, (prompt: string) => string> = {
      'general-purpose': (p) => `## 🎯 문제 해결 결과

**분석한 문제:** ${p}

**해결 과정:**
1. ✅ 문제 상황 정확히 파악
2. ✅ 다양한 해결 방안 검토
3. ✅ 최적의 솔루션 선택
4. ✅ 실행 계획 수립

**제안된 해결책:**
- 즉시 적용 가능한 실용적 방법
- 장기적 안정성을 고려한 구조적 개선
- 재발 방지를 위한 모니터링 체계

**다음 단계:** 제안된 해결책을 단계별로 적용하여 문제를 완전히 해결하세요.`,

      'frontend': (p) => `## ⚛️ 프론트엔드 개발 결과

**작업 내용:** ${p}

**구현된 기능:**
- 반응형 UI 컴포넌트
- 접근성 고려 설계
- 성능 최적화 적용
- 크로스 브라우저 호환성

**기술 스택:** React, TypeScript, Tailwind CSS
**품질 보증:** ESLint, Prettier, 테스트 커버리지 95%+`,

      'backend': (p) => `## 🔧 백엔드 개발 결과

**처리한 요청:** ${p}

**구현 사항:**
- 안전한 API 엔드포인트
- 데이터베이스 최적화
- 보안 강화
- 모니터링 시스템

**성능 지표:** 응답시간 < 200ms, 가용성 99.9%+`,

      'mobile': (p) => `## 📱 모바일 최적화 결과

**최적화 대상:** ${p}

**개선 사항:**
- 터치 인터페이스 개선
- 네트워크 효율성 향상
- 배터리 사용량 최적화
- 다양한 화면 크기 대응

**테스트 완료:** iOS 14+, Android 8+`,

      'security': (p) => `## 🛡️ 보안 검사 결과

**검사 범위:** ${p}

**발견된 이슈:**
- 중요도 높음: 0건
- 중요도 보통: 2건 (해결 완료)
- 중요도 낮음: 1건 (모니터링 중)

**보안 강화 조치:**
- 인증/인가 시스템 강화
- 데이터 암호화 적용
- 로그 모니터링 시스템 구축`,

      'performance': (p) => `## ⚡ 성능 최적화 결과

**최적화 대상:** ${p}

**성능 개선:**
- 로딩 속도: 65% 향상
- 메모리 사용량: 40% 감소
- 번들 크기: 30% 축소

**Core Web Vitals:** 모든 지표 Good 달성`,

      'docs': (p) => `## 📝 문서 작업 결과

**작업 내용:** ${p}

**업데이트 사항:**
- 최신 정보 반영
- 구조 개선 및 일관성 확보
- 예제 코드 업데이트
- 오타 및 링크 수정

**문서 품질:** 가독성 A+, 완성도 98%`,

      'ai': (p) => `## 🤖 AI 작업 결과

**처리한 작업:** ${p}

**AI 분석 결과:**
- 정확도: 94.2%
- 처리 시간: 1.3초
- 신뢰도 점수: 8.7/10

**제안사항:** 추가 학습 데이터 확보로 정확도 향상 가능`,

      'workflow': (p) => `## ⚙️ 워크플로우 자동화 결과

**자동화된 프로세스:** ${p}

**효율성 개선:**
- 작업 시간: 70% 단축
- 오류율: 85% 감소
- 처리량: 3배 증가

**자동화 범위:** 반복 작업, 데이터 처리, 보고서 생성`
    };

    const template = outputTemplates[agent.type] || outputTemplates['general-purpose'];
    
    return `${template(prompt)}

---
**생성 시간:** ${timestamp}  
**실행 에이전트:** ${agent.name}  
**상태:** ✅ 완료`;
  }

  /**
   * 에이전트 중단
   */
  async stopAgent(agentId: string): Promise<void> {
    const controller = this.runningAgents.get(agentId);
    if (controller) {
      controller.abort();
      this.updateAgentStatus(agentId, 'idle');
    }
  }

  /**
   * 모든 실행 중인 에이전트 중단
   */
  async stopAllAgents(): Promise<void> {
    for (const [agentId, controller] of this.runningAgents) {
      controller.abort();
      this.updateAgentStatus(agentId, 'idle');
    }
    this.runningAgents.clear();
  }

  /**
   * 에이전트 결과 조회
   */
  getAgentResult(agentId: string): AgentResult | null {
    return this.agentResults.get(agentId) || null;
  }

  /**
   * 실행 중인 에이전트 목록
   */
  getRunningAgents(): string[] {
    return Array.from(this.runningAgents.keys());
  }

  /**
   * 에이전트 상태 업데이트 (이벤트 발생)
   */
  private updateAgentStatus(agentId: string, status: Agent['status']): void {
    this.emitEvent('agentStatusChanged', { agentId, status });
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('이벤트 리스너 실행 오류:', error);
        }
      });
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(eventType: string, listener: (event: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(eventType: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 글로벌 에러 처리 설정
   */
  private setupGlobalErrorHandling(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        console.error('VIBE Agent Manager Error:', event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('VIBE Agent Promise Rejection:', event.reason);
      });
    }
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}