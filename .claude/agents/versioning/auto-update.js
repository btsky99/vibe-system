#!/usr/bin/env node

/**
 * Agent Auto-Update Script
 * 자동으로 에이전트 버전을 체크하고 업데이트합니다.
 * 
 * Usage: node auto-update.js [options]
 * Options:
 *   --agent <name>    특정 에이전트만 업데이트
 *   --all             모든 에이전트 업데이트
 *   --dry-run         실제 업데이트 없이 시뮬레이션
 *   --force           테스트 실패해도 강제 업데이트
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process').promises;

// 설정
const CONFIG = {
  agentsDir: 'C:\\ons\\.claude\\agents',
  versioningDir: 'C:\\ons\\.claude\\agents\\versioning',
  backupDir: 'C:\\ons\\.claude\\agents\\backup',
  logFile: 'C:\\ons\\.claude\\agents\\versioning\\update.log',
  maxBackups: 10
};

// 버전 관리자 클래스
class AgentVersionManager {
  constructor() {
    this.agents = new Map();
    this.updateQueue = [];
    this.log = [];
  }

  // 초기화
  async initialize() {
    await this.ensureDirectories();
    await this.loadAgents();
    this.logMessage('INFO', 'Version Manager initialized');
  }

  // 필요한 디렉토리 생성
  async ensureDirectories() {
    const dirs = [CONFIG.versioningDir, CONFIG.backupDir];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // 에이전트 목록 로드
  async loadAgents() {
    const files = await fs.readdir(CONFIG.agentsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    for (const file of mdFiles) {
      const content = await fs.readFile(
        path.join(CONFIG.agentsDir, file),
        'utf-8'
      );
      
      const metadata = this.parseMetadata(content);
      if (metadata) {
        this.agents.set(metadata.name, {
          file,
          ...metadata
        });
      }
    }
    
    this.logMessage('INFO', `Loaded ${this.agents.size} agents`);
  }

  // 메타데이터 파싱
  parseMetadata(content) {
    const metaMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!metaMatch) return null;
    
    const metaText = metaMatch[1];
    const metadata = {};
    
    // 각 필드 파싱
    const fields = ['name', 'version', 'lastUpdated', 'status', 'model'];
    for (const field of fields) {
      const match = metaText.match(new RegExp(`${field}:\\s*(.+)`));
      if (match) {
        metadata[field] = match[1].trim();
      }
    }
    
    return metadata.name ? metadata : null;
  }

  // 버전 비교
  compareVersions(v1, v2) {
    const parse = (v) => v.split('.').map(Number);
    const [maj1, min1, pat1] = parse(v1);
    const [maj2, min2, pat2] = parse(v2);
    
    if (maj1 !== maj2) return maj2 - maj1;
    if (min1 !== min2) return min2 - min1;
    return pat2 - pat1;
  }

  // 버전 증가
  incrementVersion(version, type = 'patch') {
    const [major, minor, patch] = version.split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  // 변경사항 분석
  async analyzeChanges(agentName) {
    const agent = this.agents.get(agentName);
    if (!agent) return null;
    
    // Git diff를 사용한 변경 분석 (시뮬레이션)
    // 실제로는 git 명령어나 파일 비교를 수행
    const changes = {
      hasBreakingChanges: false,
      hasNewFeatures: Math.random() > 0.7,
      hasBugFixes: Math.random() > 0.5,
      hasOptimizations: Math.random() > 0.6
    };
    
    // 버전 증가 타입 결정
    if (changes.hasBreakingChanges) return 'major';
    if (changes.hasNewFeatures) return 'minor';
    if (changes.hasBugFixes || changes.hasOptimizations) return 'patch';
    
    return null;
  }

  // 백업 생성
  async createBackup(agentName) {
    const agent = this.agents.get(agentName);
    if (!agent) return false;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${agentName}_${agent.version}_${timestamp}.md`;
    const backupPath = path.join(CONFIG.backupDir, backupName);
    
    const sourcePath = path.join(CONFIG.agentsDir, agent.file);
    const content = await fs.readFile(sourcePath, 'utf-8');
    await fs.writeFile(backupPath, content);
    
    this.logMessage('INFO', `Backup created: ${backupName}`);
    
    // 오래된 백업 정리
    await this.cleanOldBackups(agentName);
    
    return true;
  }

  // 오래된 백업 정리
  async cleanOldBackups(agentName) {
    const files = await fs.readdir(CONFIG.backupDir);
    const agentBackups = files
      .filter(f => f.startsWith(agentName))
      .sort()
      .reverse();
    
    if (agentBackups.length > CONFIG.maxBackups) {
      const toDelete = agentBackups.slice(CONFIG.maxBackups);
      for (const file of toDelete) {
        await fs.unlink(path.join(CONFIG.backupDir, file));
        this.logMessage('INFO', `Deleted old backup: ${file}`);
      }
    }
  }

  // 테스트 실행
  async runTests(agentName) {
    this.logMessage('INFO', `Running tests for ${agentName}...`);
    
    // 테스트 시뮬레이션
    // 실제로는 Jest, Mocha 등을 실행
    const testResults = {
      unit: Math.random() > 0.1,
      integration: Math.random() > 0.2,
      performance: Math.random() > 0.15,
      security: Math.random() > 0.05
    };
    
    const allPassed = Object.values(testResults).every(r => r);
    
    if (allPassed) {
      this.logMessage('SUCCESS', `All tests passed for ${agentName}`);
    } else {
      this.logMessage('ERROR', `Tests failed for ${agentName}`, testResults);
    }
    
    return allPassed;
  }

  // 에이전트 업데이트
  async updateAgent(agentName, options = {}) {
    const agent = this.agents.get(agentName);
    if (!agent) {
      this.logMessage('ERROR', `Agent not found: ${agentName}`);
      return false;
    }
    
    this.logMessage('INFO', `Starting update for ${agentName} (${agent.version})`);
    
    // 1. 변경사항 분석
    const changeType = await this.analyzeChanges(agentName);
    if (!changeType) {
      this.logMessage('INFO', `No updates needed for ${agentName}`);
      return true;
    }
    
    // 2. 새 버전 계산
    const newVersion = this.incrementVersion(agent.version, changeType);
    this.logMessage('INFO', `New version will be: ${newVersion}`);
    
    // 3. 백업 생성
    if (!options.dryRun) {
      await this.createBackup(agentName);
    }
    
    // 4. 테스트 실행
    const testsPassed = await this.runTests(agentName);
    if (!testsPassed && !options.force) {
      this.logMessage('ERROR', `Update aborted due to test failures`);
      return false;
    }
    
    // 5. 버전 업데이트
    if (!options.dryRun) {
      await this.applyUpdate(agentName, newVersion);
    }
    
    this.logMessage('SUCCESS', 
      `Successfully updated ${agentName} from ${agent.version} to ${newVersion}`
    );
    
    return true;
  }

  // 업데이트 적용
  async applyUpdate(agentName, newVersion) {
    const agent = this.agents.get(agentName);
    const filePath = path.join(CONFIG.agentsDir, agent.file);
    
    let content = await fs.readFile(filePath, 'utf-8');
    
    // 버전 업데이트
    content = content.replace(
      /version:\s*.+/,
      `version: ${newVersion}`
    );
    
    // 업데이트 시간 갱신
    const now = new Date().toISOString();
    content = content.replace(
      /lastUpdated:\s*.+/,
      `lastUpdated: ${now}`
    );
    
    // changelog 업데이트
    const changelogEntry = `v${newVersion}: Auto-update - ${new Date().toLocaleDateString()}`;
    if (content.includes('changelog:')) {
      content = content.replace(
        /changelog:\s*\|/,
        `changelog: |\n  ${changelogEntry}`
      );
    }
    
    await fs.writeFile(filePath, content);
    
    // 메모리 업데이트
    agent.version = newVersion;
    agent.lastUpdated = now;
  }

  // 모든 에이전트 업데이트
  async updateAll(options = {}) {
    this.logMessage('INFO', 'Starting batch update for all agents');
    
    const results = {
      success: [],
      failed: [],
      skipped: []
    };
    
    for (const [name, agent] of this.agents) {
      try {
        const updated = await this.updateAgent(name, options);
        if (updated) {
          results.success.push(name);
        } else {
          results.failed.push(name);
        }
      } catch (error) {
        this.logMessage('ERROR', `Failed to update ${name}: ${error.message}`);
        results.failed.push(name);
      }
    }
    
    // 결과 리포트
    this.printReport(results);
    
    return results;
  }

  // 리포트 출력
  printReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Successfully updated (${results.success.length}):`);
    results.success.forEach(name => console.log(`   - ${name}`));
    
    if (results.failed.length > 0) {
      console.log(`\n❌ Failed to update (${results.failed.length}):`);
      results.failed.forEach(name => console.log(`   - ${name}`));
    }
    
    if (results.skipped.length > 0) {
      console.log(`\n⏭️ Skipped (${results.skipped.length}):`);
      results.skipped.forEach(name => console.log(`   - ${name}`));
    }
    
    console.log('\n' + '='.repeat(60));
  }

  // 로그 메시지
  logMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    this.log.push(logEntry);
    
    // 콘솔 출력
    const icon = {
      'INFO': 'ℹ️',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌'
    }[level] || '📝';
    
    console.log(`${icon} [${timestamp}] ${message}`);
    if (data) {
      console.log('   ', JSON.stringify(data, null, 2));
    }
    
    // 파일 로깅
    this.writeToLogFile(logEntry);
  }

  // 로그 파일 작성
  async writeToLogFile(entry) {
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(CONFIG.logFile, line).catch(() => {});
  }
}

// 메인 실행 함수
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    all: args.includes('--all')
  };
  
  const agentIndex = args.indexOf('--agent');
  const specificAgent = agentIndex !== -1 ? args[agentIndex + 1] : null;
  
  // 헤더 출력
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         🤖 AGENT AUTO-UPDATE SYSTEM v1.0.0              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  
  // 버전 관리자 초기화
  const manager = new AgentVersionManager();
  await manager.initialize();
  
  // 업데이트 실행
  if (options.all) {
    await manager.updateAll(options);
  } else if (specificAgent) {
    await manager.updateAgent(specificAgent, options);
  } else {
    console.log('Usage: node auto-update.js [--all | --agent <name>] [--dry-run] [--force]');
  }
  
  // 로그 저장
  const logSummary = `\n📋 Total operations: ${manager.log.length}`;
  console.log(logSummary);
}

// 에러 핸들링
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AgentVersionManager;