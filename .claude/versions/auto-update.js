#!/usr/bin/env node

/**
 * 에이전트 자동 업데이트 관리자
 * 주기적으로 에이전트 파일을 검사하고 필요시 업데이트 수행
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AgentUpdateManager {
  constructor() {
    this.agentsDir = path.join(__dirname, '../agents');
    this.versionsDir = path.join(__dirname, '../versions');
    this.versionControlPath = path.join(this.versionsDir, 'version-control.json');
  }

  /**
   * 파일 해시 생성 (변경 감지용)
   */
  async getFileHash(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 버전 파싱 (시맨틱 버저닝)
   */
  parseVersion(version) {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch };
  }

  /**
   * 버전 증가
   */
  incrementVersion(version, type = 'patch') {
    const v = this.parseVersion(version);
    
    switch(type) {
      case 'major':
        return `${v.major + 1}.0.0`;
      case 'minor':
        return `${v.major}.${v.minor + 1}.0`;
      case 'patch':
      default:
        return `${v.major}.${v.minor}.${v.patch + 1}`;
    }
  }

  /**
   * 에이전트 성능 분석
   */
  async analyzePerformance(agentName) {
    const metrics = {
      codeQuality: 0,
      performance: 0,
      usability: 0,
      security: 0
    };

    try {
      const filePath = path.join(this.agentsDir, `${agentName}.md`);
      const content = await fs.readFile(filePath, 'utf8');
      
      // 코드 품질 분석
      metrics.codeQuality = this.analyzeCodeQuality(content);
      
      // 성능 지표 분석
      metrics.performance = this.analyzePerformanceMetrics(content);
      
      // 사용성 평가
      metrics.usability = this.analyzeUsability(content);
      
      // 보안 검사
      metrics.security = this.analyzeSecurityFeatures(content);
      
    } catch (error) {
      console.error(`Failed to analyze ${agentName}:`, error);
    }

    return metrics;
  }

  analyzeCodeQuality(content) {
    let score = 100;
    
    // TypeScript 사용 확인
    if (!content.includes('typescript')) score -= 10;
    
    // 에러 처리 확인
    if (!content.includes('try') || !content.includes('catch')) score -= 15;
    
    // 문서화 수준
    const commentCount = (content.match(/\/\//g) || []).length;
    if (commentCount < 10) score -= 10;
    
    // 코드 구조화
    if (!content.includes('interface') && !content.includes('class')) score -= 10;
    
    return Math.max(0, score);
  }

  analyzePerformanceMetrics(content) {
    let score = 100;
    
    // 캐싱 구현
    if (!content.includes('cache')) score -= 20;
    
    // 최적화 기법
    if (!content.includes('optimization') && !content.includes('optimize')) score -= 15;
    
    // 비동기 처리
    if (!content.includes('async') || !content.includes('await')) score -= 15;
    
    // 페이지네이션
    if (!content.includes('pagination') && !content.includes('limit')) score -= 10;
    
    return Math.max(0, score);
  }

  analyzeUsability(content) {
    let score = 100;
    
    // API 문서화
    if (!content.includes('## ')) score -= 15;
    
    // 예제 코드
    if (!content.includes('```')) score -= 20;
    
    // 에러 메시지
    if (!content.includes('error')) score -= 10;
    
    return Math.max(0, score);
  }

  analyzeSecurityFeatures(content) {
    let score = 100;
    
    // 인증/인가
    if (!content.includes('auth')) score -= 25;
    
    // 입력 검증
    if (!content.includes('validation') && !content.includes('validate')) score -= 20;
    
    // Rate Limiting
    if (!content.includes('rate') && !content.includes('limit')) score -= 15;
    
    // 보안 헤더
    if (!content.includes('security') && !content.includes('secure')) score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * 업데이트 필요 여부 판단
   */
  needsUpdate(metrics, thresholds = { min: 70, optimal: 85 }) {
    const avgScore = Object.values(metrics).reduce((a, b) => a + b, 0) / Object.keys(metrics).length;
    
    return {
      required: avgScore < thresholds.min,
      recommended: avgScore < thresholds.optimal,
      score: avgScore
    };
  }

  /**
   * 자동 업데이트 수행
   */
  async performUpdate(agentName, updateType = 'patch') {
    console.log(`🔄 Updating ${agentName}...`);
    
    try {
      // 버전 제어 파일 읽기
      const versionControl = JSON.parse(await fs.readFile(this.versionControlPath, 'utf8'));
      const agent = versionControl.agents[agentName];
      
      if (!agent) {
        console.error(`Agent ${agentName} not found in version control`);
        return false;
      }
      
      // 새 버전 번호 생성
      const newVersion = this.incrementVersion(agent.currentVersion, updateType);
      
      // 에이전트 파일 업데이트
      const filePath = path.join(this.agentsDir, `${agentName}.md`);
      let content = await fs.readFile(filePath, 'utf8');
      
      // 버전 업데이트
      content = content.replace(
        /version:\s*[\d.]+/,
        `version: ${newVersion}`
      );
      
      // 업데이트 날짜 변경
      content = content.replace(
        /lastUpdated:\s*[\S]+/,
        `lastUpdated: ${new Date().toISOString()}`
      );
      
      // 파일 저장
      await fs.writeFile(filePath, content, 'utf8');
      
      // 버전 제어 업데이트
      agent.currentVersion = newVersion;
      agent.history.unshift({
        version: newVersion,
        date: new Date().toISOString(),
        changes: [`자동 ${updateType} 업데이트`],
        author: 'system',
        type: updateType
      });
      
      versionControl.metadata.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.versionControlPath, JSON.stringify(versionControl, null, 2), 'utf8');
      
      console.log(`✅ ${agentName} updated to version ${newVersion}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to update ${agentName}:`, error);
      return false;
    }
  }

  /**
   * 모든 에이전트 검사 및 업데이트
   */
  async checkAndUpdateAll() {
    console.log('🔍 Checking all agents for updates...\n');
    
    const versionControl = JSON.parse(await fs.readFile(this.versionControlPath, 'utf8'));
    const updateResults = [];
    
    for (const agentName of Object.keys(versionControl.agents)) {
      console.log(`📊 Analyzing ${agentName}...`);
      
      const metrics = await this.analyzePerformance(agentName);
      const updateStatus = this.needsUpdate(metrics);
      
      console.log(`  Score: ${updateStatus.score.toFixed(1)}/100`);
      console.log(`  Code Quality: ${metrics.codeQuality}/100`);
      console.log(`  Performance: ${metrics.performance}/100`);
      console.log(`  Usability: ${metrics.usability}/100`);
      console.log(`  Security: ${metrics.security}/100`);
      
      if (updateStatus.required) {
        console.log(`  ⚠️ Update REQUIRED`);
        await this.performUpdate(agentName, 'minor');
      } else if (updateStatus.recommended) {
        console.log(`  💡 Update recommended`);
        await this.performUpdate(agentName, 'patch');
      } else {
        console.log(`  ✅ Up to date`);
      }
      
      updateResults.push({
        agent: agentName,
        score: updateStatus.score,
        updated: updateStatus.required || updateStatus.recommended
      });
      
      console.log('');
    }
    
    // 요약 보고서
    console.log('═══════════════════════════════════════════');
    console.log('📊 업데이트 요약 보고서');
    console.log('═══════════════════════════════════════════');
    
    const updatedCount = updateResults.filter(r => r.updated).length;
    console.log(`✅ 총 ${versionControl.metadata.totalAgents}개 에이전트 중 ${updatedCount}개 업데이트됨`);
    
    updateResults.forEach(result => {
      const status = result.updated ? '🔄' : '✅';
      console.log(`${status} ${result.agent}: ${result.score.toFixed(1)}/100`);
    });
    
    console.log('═══════════════════════════════════════════');
    console.log(`⏰ 다음 검사: ${versionControl.metadata.autoUpdate.nextCheck}`);
  }
}

// 실행
async function main() {
  const manager = new AgentUpdateManager();
  
  if (process.argv.includes('--check')) {
    // 검사만 수행
    await manager.checkAndUpdateAll();
  } else if (process.argv.includes('--update')) {
    // 특정 에이전트 업데이트
    const agentName = process.argv[process.argv.indexOf('--update') + 1];
    if (agentName) {
      await manager.performUpdate(agentName);
    }
  } else {
    // 기본: 전체 검사 및 자동 업데이트
    await manager.checkAndUpdateAll();
  }
}

// 스케줄러로 실행시 자동 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AgentUpdateManager };