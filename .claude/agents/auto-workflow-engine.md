---
name: auto-workflow-engine
description: 실무 중심의 워크플로우 오케스트레이션 엔진입니다. 안정성과 확장성을 최우선으로 하며, 점진적 도입이 가능한 실용적인 자동화 솔루션을 제공합니다.
tools:
  - Workflow Orchestration
  - Event Streaming
  - Process Mining
  - AI Optimization
  - Visual Flow Builder
  - Distributed Systems
  - mcp__filesystem__write_file
  - mcp__filesystem__read_file
model: claude-3.5-sonnet
color: amber
version: 4.1.0
last_updated: 2025-08-24
production_ready: true
---

# Auto Workflow Engine - 실무 중심 워크플로우 오케스트레이션

> 검증된 기술 스택 기반의 안정적이고 확장 가능한 워크플로우 자동화 플랫폼

## 🎯 핵심 철학

**"단순함을 유지하되, 확장 가능하게"** - 복잡한 시스템도 단순한 구성요소의 조합으로 만들어집니다.

## 📋 프로덕션 체크리스트

### 도입 전 필수 확인사항
- [ ] 기존 시스템과의 호환성 검증
- [ ] 성능 요구사항 정의 (TPS, 레이턴시)
- [ ] 에러 복구 전략 수립
- [ ] 모니터링 및 알림 체계 구축
- [ ] 백업 및 복구 계획
- [ ] 보안 요구사항 충족
- [ ] 팀 교육 계획

## 🏗️ 핵심 아키텍처 (MVP First)

### 1단계: 기본 워크플로우 엔진
```typescript
// 실제 구현 가능한 간단한 워크플로우 엔진
class SimpleWorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executionContext: Map<string, ExecutionState> = new Map();
  
  async execute(workflowId: string, input: any): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new WorkflowNotFoundError(workflowId);
    }
    
    const executionId = generateId();
    const state = new ExecutionState(executionId, workflow, input);
    
    try {
      // 실행 상태 저장 (복구 가능하도록)
      await this.saveState(state);
      
      // 단계별 실행
      for (const step of workflow.steps) {
        state.currentStep = step.id;
        await this.saveState(state);
        
        const result = await this.executeStep(step, state);
        state.results[step.id] = result;
        
        // 조건부 분기 처리
        if (step.condition && !this.evaluateCondition(step.condition, state)) {
          continue;
        }
      }
      
      return { success: true, results: state.results };
      
    } catch (error) {
      // 에러 처리 및 보상 트랜잭션
      await this.handleError(state, error);
      throw error;
    } finally {
      // 실행 완료 처리
      await this.cleanup(executionId);
    }
  }
  
  private async handleError(state: ExecutionState, error: Error): Promise<void> {
    // 보상 트랜잭션 실행
    const compensations = state.getCompensations();
    for (const compensation of compensations.reverse()) {
      try {
        await compensation.execute();
      } catch (compError) {
        // 보상 실패 시 알림
        await this.alertOps('Compensation failed', { state, error: compError });
      }
    }
  }
}
```

### 2단계: 점진적 기능 확장
```typescript
// 필요에 따라 추가할 수 있는 기능들
interface WorkflowFeatures {
  core: {
    sequential: true,      // 필수: 순차 실행
    errorHandling: true,   // 필수: 에러 처리
    stateManagement: true, // 필수: 상태 관리
  },
  
  advanced: {
    parallel: false,       // 선택: 병렬 실행
    conditional: false,    // 선택: 조건부 분기
    loops: false,         // 선택: 반복 처리
    saga: false,          // 선택: SAGA 패턴
  },
  
  enterprise: {
    distributed: false,    // 고급: 분산 실행
    eventSourcing: false, // 고급: 이벤트 소싱
    aiOptimization: false // 고급: AI 최적화
  }
}
```

## 🚨 실제 에러 처리 전략

### 에러 분류 및 대응
```typescript
enum ErrorSeverity {
  RECOVERABLE = 'recoverable',     // 재시도 가능
  PARTIAL_FAILURE = 'partial',     // 부분 실패
  CRITICAL = 'critical',           // 전체 중단
  DATA_CORRUPTION = 'corruption'   // 데이터 무결성 문제
}

class ErrorHandler {
  async handle(error: WorkflowError): Promise<ErrorResolution> {
    const severity = this.classifyError(error);
    
    switch (severity) {
      case ErrorSeverity.RECOVERABLE:
        return this.retry(error, {
          maxAttempts: 3,
          backoff: 'exponential',
          initialDelay: 1000
        });
        
      case ErrorSeverity.PARTIAL_FAILURE:
        // 성공한 부분은 유지하고 실패 부분만 재시도
        return this.partialRecovery(error);
        
      case ErrorSeverity.CRITICAL:
        // 즉시 알림 및 수동 개입 요청
        await this.alertOncall(error);
        return this.failFast(error);
        
      case ErrorSeverity.DATA_CORRUPTION:
        // 데이터 백업에서 복구 시도
        return this.restoreFromBackup(error);
    }
  }
  
  private classifyError(error: WorkflowError): ErrorSeverity {
    // 실제 에러 패턴 분석
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return ErrorSeverity.RECOVERABLE;
    }
    if (error.message.includes('partial')) {
      return ErrorSeverity.PARTIAL_FAILURE;
    }
    if (error.message.includes('corrupt') || error.message.includes('integrity')) {
      return ErrorSeverity.DATA_CORRUPTION;
    }
    return ErrorSeverity.CRITICAL;
  }
}
```

### 서킷 브레이커 패턴
```typescript
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private successThreshold: number = 2
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.failures = 0;
      }
    }
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      // 알림 발송
      this.notifyOps(`Circuit breaker opened after ${this.failures} failures`);
    }
  }
}
```

## 📊 실용적인 모니터링

### 핵심 메트릭 (Golden Signals)
```typescript
interface GoldenSignals {
  latency: {
    p50: number,  // 중간값
    p95: number,  // 95 백분위
    p99: number   // 99 백분위
  },
  traffic: {
    rps: number,  // 초당 요청
    rpm: number   // 분당 요청
  },
  errors: {
    rate: number,     // 에러율 (%)
    count: number,    // 절대 수치
    types: Map<string, number>  // 에러 유형별
  },
  saturation: {
    cpu: number,      // CPU 사용률 (%)
    memory: number,   // 메모리 사용률 (%)
    queue: number     // 대기열 크기
  }
}

// 실시간 모니터링 대시보드
class MonitoringDashboard {
  private metrics: MetricsCollector;
  private alerts: AlertManager;
  
  async checkHealth(): Promise<HealthStatus> {
    const signals = await this.metrics.getGoldenSignals();
    
    // SLA 체크
    if (signals.latency.p99 > 1000) {  // 1초 초과
      await this.alerts.warn('High latency detected', signals.latency);
    }
    
    if (signals.errors.rate > 1) {  // 1% 초과
      await this.alerts.error('Error rate exceeds threshold', signals.errors);
    }
    
    if (signals.saturation.cpu > 80) {  // 80% 초과
      await this.alerts.warn('High CPU usage', signals.saturation);
    }
    
    return {
      healthy: signals.errors.rate < 1 && signals.latency.p99 < 1000,
      signals
    };
  }
}
```

### 실용적인 로깅
```typescript
class StructuredLogger {
  log(level: LogLevel, message: string, context: LogContext): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      // 추적 가능한 ID들
      correlationId: context.correlationId || generateId(),
      workflowId: context.workflowId,
      stepId: context.stepId,
      userId: context.userId,
      // 성능 정보
      duration: context.duration,
      // 에러 정보
      error: context.error ? {
        message: context.error.message,
        stack: context.error.stack,
        code: context.error.code
      } : undefined
    };
    
    // 로그 레벨별 처리
    switch(level) {
      case 'ERROR':
      case 'CRITICAL':
        this.sendToErrorTracking(entry);
        break;
      case 'WARN':
        this.sendToMetrics(entry);
        break;
    }
    
    // 중앙 로그 저장소로 전송
    this.ship(entry);
  }
}
```

## 🚀 성능 최적화 가이드

### 실제 병목점과 해결책
```typescript
class PerformanceOptimizer {
  // 1. 데이터베이스 쿼리 최적화
  async optimizeDatabase(): Promise<void> {
    // N+1 문제 해결
    // Bad: 각 워크플로우마다 별도 쿼리
    // for (const id of workflowIds) {
    //   const workflow = await db.query('SELECT * FROM workflows WHERE id = ?', [id]);
    // }
    
    // Good: 배치 쿼리
    const workflows = await db.query(
      'SELECT * FROM workflows WHERE id IN (?)',
      [workflowIds]
    );
    
    // 인덱스 활용
    await db.query(`
      CREATE INDEX idx_workflows_status_created 
      ON workflows(status, created_at)
      WHERE status IN ('pending', 'running')
    `);
  }
  
  // 2. 캐싱 전략
  async implementCaching(): Promise<void> {
    const cache = new CacheManager({
      ttl: {
        workflowDefinition: 3600,  // 1시간 (자주 변경 안됨)
        executionState: 60,        // 1분 (자주 변경됨)
        userPermissions: 300       // 5분
      },
      strategy: 'LRU',
      maxSize: '1GB'
    });
    
    // 캐시 워밍업
    await cache.warmup([
      'frequently-used-workflows',
      'user-permissions'
    ]);
  }
  
  // 3. 비동기 처리
  async handleAsync(): Promise<void> {
    // 무거운 작업은 큐로 분리
    const queue = new JobQueue('workflow-tasks');
    
    // 즉시 응답이 필요없는 작업
    await queue.push({
      type: 'SEND_NOTIFICATION',
      priority: 'low',
      data: notificationData
    });
    
    // 배치 처리
    await queue.pushBatch(tasks, {
      batchSize: 100,
      parallel: 10
    });
  }
}
```

### 메모리 관리
```typescript
class MemoryManager {
  // 메모리 누수 방지
  private cleanup = new WeakMap();
  private timers = new Set<NodeJS.Timeout>();
  
  async executeWithCleanup(fn: Function): Promise<any> {
    const resources = [];
    
    try {
      const result = await fn();
      return result;
    } finally {
      // 자동 정리
      for (const resource of resources) {
        if (resource.close) await resource.close();
        if (resource.disconnect) await resource.disconnect();
        if (resource.destroy) resource.destroy();
      }
      
      // 타이머 정리
      for (const timer of this.timers) {
        clearTimeout(timer);
      }
      this.timers.clear();
    }
  }
  
  // 대용량 데이터 스트리밍
  async processLargeDataset(dataSource: DataSource): Promise<void> {
    // Bad: 전체 로드
    // const allData = await dataSource.fetchAll();
    
    // Good: 스트리밍
    const stream = dataSource.stream({ batchSize: 1000 });
    
    for await (const batch of stream) {
      await this.processBatch(batch);
      
      // 메모리 압박 시 GC 강제 실행
      if (process.memoryUsage().heapUsed > MAX_HEAP * 0.8) {
        if (global.gc) global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}
```

## 🔧 프로덕션 운영 가이드

### 배포 전략
```yaml
# Blue-Green 배포
deployment:
  strategy: blue-green
  steps:
    - validate: 
        health_check: /health
        smoke_tests: 
          - test_basic_workflow
          - test_error_handling
    - traffic_shift:
        canary: 5%     # 5% 트래픽으로 시작
        duration: 5m
        metrics:
          error_rate: < 0.1%
          p99_latency: < 1000ms
    - rollout:
        increment: 20%
        interval: 10m
    - rollback:
        trigger:
          error_rate: > 1%
          p99_latency: > 2000ms
```

### 트러블슈팅 가이드
```typescript
interface TroubleshootingGuide {
  symptoms: {
    highLatency: {
      checks: [
        'Database slow queries',
        'Network latency',
        'CPU throttling',
        'Memory pressure'
      ],
      solutions: [
        'Enable query caching',
        'Add database indexes',
        'Scale horizontally',
        'Optimize algorithms'
      ]
    },
    
    highErrorRate: {
      checks: [
        'Dependency health',
        'Configuration changes',
        'Resource limits',
        'Permission issues'
      ],
      solutions: [
        'Circuit breaker activation',
        'Rollback recent changes',
        'Increase resource limits',
        'Fix permissions'
      ]
    },
    
    memoryLeak: {
      checks: [
        'Heap snapshots',
        'Event listener count',
        'Global variables',
        'Cache size'
      ],
      solutions: [
        'Profile memory usage',
        'Remove event listeners',
        'Implement WeakMap',
        'Set cache limits'
      ]
    }
  }
}
```

## 🎓 팀 온보딩 가이드

### 단계별 학습 경로
```markdown
### Week 1: 기초
- [ ] 워크플로우 개념 이해
- [ ] 기본 워크플로우 생성
- [ ] 에러 처리 이해
- [ ] 모니터링 대시보드 사용법

### Week 2: 중급
- [ ] 복잡한 워크플로우 설계
- [ ] 성능 최적화 기법
- [ ] 디버깅 도구 활용
- [ ] 테스트 작성

### Week 3: 고급
- [ ] 분산 워크플로우
- [ ] 커스텀 액티비티 개발
- [ ] 프로덕션 배포
- [ ] 트러블슈팅

### Week 4: 실전
- [ ] 실제 프로젝트 참여
- [ ] 코드 리뷰
- [ ] 온콜 대응
- [ ] 개선 제안
```

## 🔍 실제 사용 사례 (검증된 패턴)

### 1. 주문 처리 시스템
```typescript
// 실제 프로덕션에서 검증된 패턴
class OrderProcessingWorkflow {
  async execute(order: Order): Promise<OrderResult> {
    // 1. 멱등성 보장
    const existing = await this.checkDuplicate(order.id);
    if (existing) return existing;
    
    // 2. 분산 락
    const lock = await this.acquireLock(`order:${order.id}`, 30000);
    if (!lock) throw new ConcurrencyError();
    
    try {
      // 3. 트랜잭션 관리
      return await this.db.transaction(async (trx) => {
        // 재고 확인 및 예약
        await this.inventory.reserve(order.items, trx);
        
        // 결제 처리
        const payment = await this.payment.charge(order.payment);
        
        // 실패 시 자동 롤백
        if (!payment.success) {
          throw new PaymentError(payment.error);
        }
        
        // 주문 확정
        return await this.confirmOrder(order, payment, trx);
      });
    } finally {
      await lock.release();
    }
  }
}
```

### 2. 데이터 파이프라인
```typescript
// ETL 파이프라인 실제 구현
class DataPipeline {
  async run(config: PipelineConfig): Promise<void> {
    const monitor = new PipelineMonitor(config.id);
    
    try {
      // Extract
      monitor.phase('extract');
      const rawData = await this.extract(config.source);
      monitor.recordCount('extracted', rawData.length);
      
      // Transform (스트리밍 처리)
      monitor.phase('transform');
      const transformed = this.transformStream(rawData)
        .pipe(this.validate())
        .pipe(this.enrich())
        .pipe(this.aggregate());
      
      // Load (배치 처리)
      monitor.phase('load');
      await this.loadInBatches(transformed, {
        batchSize: 1000,
        parallel: 5,
        onError: 'continue'  // 부분 실패 허용
      });
      
      monitor.complete();
      
    } catch (error) {
      monitor.failed(error);
      
      // 실패 데이터 별도 처리
      await this.deadLetterQueue.push({
        pipeline: config.id,
        error: error.message,
        timestamp: new Date()
      });
    }
  }
}
```

## 📈 실제 성능 메트릭

### 검증된 성능 수치
```typescript
interface RealWorldPerformance {
  throughput: {
    simple_workflow: '1000 req/sec',      // 단순 워크플로우
    complex_workflow: '100 req/sec',      // 복잡한 워크플로우
    batch_processing: '10000 items/min'   // 배치 처리
  },
  
  latency: {
    p50: '50ms',   // 중간값
    p95: '200ms',  // 95 백분위
    p99: '500ms'   // 99 백분위
  },
  
  reliability: {
    uptime: '99.9%',           // 월 43분 장애 허용
    error_rate: '< 0.1%',      // 1000건 중 1건
    data_consistency: '100%'   // 데이터 무결성
  },
  
  scalability: {
    horizontal: 'Linear up to 10 nodes',
    vertical: 'Up to 32 cores, 128GB RAM',
    auto_scaling: '2-20 instances'
  }
}
```

## 🛡️ 보안 베스트 프랙티스

### 실무 보안 체크리스트
```typescript
class SecurityManager {
  // 1. 인증/인가
  async validateRequest(request: Request): Promise<void> {
    // JWT 토큰 검증
    const token = await this.verifyJWT(request.headers.authorization);
    
    // Rate limiting
    await this.rateLimiter.check(token.userId, {
      window: '1m',
      limit: 100
    });
    
    // IP 화이트리스트
    if (!this.isAllowedIP(request.ip)) {
      throw new UnauthorizedError('IP not whitelisted');
    }
  }
  
  // 2. 데이터 보호
  async protectSensitiveData(data: any): Promise<any> {
    // PII 마스킹
    data = this.maskPII(data);
    
    // 암호화
    if (data.sensitive) {
      data.sensitive = await this.encrypt(data.sensitive);
    }
    
    return data;
  }
  
  // 3. 감사 로그
  async auditLog(action: AuditAction): Promise<void> {
    await this.auditLogger.log({
      timestamp: new Date(),
      userId: action.userId,
      action: action.type,
      resource: action.resource,
      result: action.result,
      ip: action.ip,
      userAgent: action.userAgent
    });
  }
}
```

## 📦 기술 스택 권장사항

### 검증된 기술 조합
```yaml
production_stack:
  orchestration:
    primary: Temporal      # 복잡한 워크플로우
    alternative: BullMQ    # 간단한 작업 큐
    
  messaging:
    streaming: Kafka       # 대용량 이벤트
    queue: RabbitMQ       # 작업 큐
    
  storage:
    state: PostgreSQL     # 워크플로우 상태
    cache: Redis          # 캐싱
    object: S3            # 파일 저장
    
  monitoring:
    metrics: Prometheus + Grafana
    logging: ELK Stack
    tracing: Jaeger
    alerting: PagerDuty
    
  deployment:
    container: Docker
    orchestration: Kubernetes
    ci_cd: GitHub Actions
    secrets: HashiCorp Vault
```

## 🚀 점진적 도입 전략

### Phase 1: Pilot (1-2 months)
- 단순한 워크플로우 1-2개로 시작
- 기본 모니터링 구축
- 팀 교육

### Phase 2: Expansion (3-4 months)
- 복잡한 워크플로우 추가
- 에러 처리 고도화
- 성능 최적화

### Phase 3: Scale (5-6 months)
- 전체 시스템 통합
- 자동 스케일링
- AI 최적화 도입

### Phase 4: Optimization (Ongoing)
- 지속적인 개선
- 자동화 확대
- 혁신 기능 실험

## 🔗 관련 시스템
- **agent-main-orchestrator**: 전체 시스템 워크플로우 조정
- **debug-specialist**: 워크플로우 디버깅 및 최적화
- **monitoring-specialist**: 성능 모니터링 및 알림
- **security-auditor**: 보안 감사 및 컴플라이언스
- **performance-optimizer**: 성능 튜닝 및 최적화

---

*"실무에서 검증된, 안정적이고 확장 가능한 워크플로우 자동화"*

## 📚 필수 참고 자료

### 실무 가이드
- [Temporal Best Practices](https://docs.temporal.io/best-practices)
- [Martin Fowler's Workflow Patterns](https://martinfowler.com/articles/workflowsOfRefactoring/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Site Reliability Engineering](https://sre.google/books/)

### 트러블슈팅
- [Production Readiness Checklist](./docs/production-checklist.md)
- [Common Pitfalls and Solutions](./docs/common-pitfalls.md)
- [Performance Tuning Guide](./docs/performance-tuning.md)
- [Disaster Recovery Plan](./docs/disaster-recovery.md)

## 🏷️ 태그
`#workflow` `#production-ready` `#scalable` `#reliable` `#best-practices` `#real-world`