#!/usr/bin/env node

/**
 * MCP 자동화 시스템 스크립트
 * GitHub에서 MCP 서버를 검색하고, 평가하며, 자동으로 통합합니다.
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec: execCallback } = require('child_process');
const exec = promisify(execCallback);

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 유틸리티 함수
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// 추천 MCP 서버 목록
const recommendedMCPs = {
  'github-mcp': {
    description: 'GitHub API 통합 (PR, Issues, Actions)',
    npmPackage: '@modelcontextprotocol/github-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/github-mcp'],
    env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
    relatedAgents: ['git-specialist', 'code-review-expert'],
    stars: 1200,
    lastUpdate: 5
  },
  'docker-mcp': {
    description: 'Docker 컨테이너 관리',
    npmPackage: '@modelcontextprotocol/docker-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/docker-mcp'],
    env: {},
    relatedAgents: ['dev-server-manager'],
    stars: 890,
    lastUpdate: 10
  },
  'aws-mcp': {
    description: 'AWS 서비스 통합',
    npmPackage: '@modelcontextprotocol/aws-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/aws-mcp'],
    env: {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
    },
    relatedAgents: ['backend-api-routes'],
    stars: 750,
    lastUpdate: 7
  },
  'stripe-mcp': {
    description: '결제 시스템 통합',
    npmPackage: '@modelcontextprotocol/stripe-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/stripe-mcp'],
    env: { STRIPE_API_KEY: process.env.STRIPE_API_KEY },
    relatedAgents: ['backend-api-routes'],
    stars: 620,
    lastUpdate: 15
  },
  'openai-mcp': {
    description: 'OpenAI API 통합',
    npmPackage: '@modelcontextprotocol/openai-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/openai-mcp'],
    env: { OPENAI_API_KEY: process.env.OPENAI_API_KEY },
    relatedAgents: ['ai-gemini-specialist'],
    stars: 1500,
    lastUpdate: 3
  },
  'slack-mcp': {
    description: 'Slack 워크스페이스 통합',
    npmPackage: '@modelcontextprotocol/slack-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/slack-mcp'],
    env: { SLACK_TOKEN: process.env.SLACK_TOKEN },
    relatedAgents: ['auto-workflow-engine'],
    stars: 480,
    lastUpdate: 20
  },
  'notion-mcp': {
    description: 'Notion API 통합',
    npmPackage: '@modelcontextprotocol/notion-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/notion-mcp'],
    env: { NOTION_API_KEY: process.env.NOTION_API_KEY },
    relatedAgents: ['docs-technical-writer'],
    stars: 560,
    lastUpdate: 12
  },
  'database-mcp': {
    description: 'SQL/NoSQL 데이터베이스 통합',
    npmPackage: '@modelcontextprotocol/database-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/database-mcp'],
    env: {},
    relatedAgents: ['backend-firestore-database', 'backend-dexie-specialist'],
    stars: 920,
    lastUpdate: 8
  },
  'vercel-mcp': {
    description: 'Vercel 배포 및 관리',
    npmPackage: '@modelcontextprotocol/vercel-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/vercel-mcp'],
    env: { VERCEL_TOKEN: process.env.VERCEL_TOKEN },
    relatedAgents: ['frontend-nextjs-routing'],
    stars: 680,
    lastUpdate: 6
  },
  'redis-mcp': {
    description: 'Redis 캐시 관리',
    npmPackage: '@modelcontextprotocol/redis-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/redis-mcp'],
    env: { REDIS_URL: process.env.REDIS_URL },
    relatedAgents: ['backend-cache-strategy'],
    stars: 450,
    lastUpdate: 14
  }
};

// Claude 설정 파일 경로 (Windows 경로 처리)
const claudeConfigPath = process.platform === 'win32' 
  ? path.join(process.env.APPDATA || process.env.USERPROFILE, 'Claude', 'claude_desktop_config.json')
  : path.join(process.env.HOME, '.claude', 'claude_desktop_config.json');
const projectRoot = 'C:\\ons';
const agentsPath = path.join(projectRoot, '.claude', 'agents');

// 프로젝트 기술 스택 분석
async function analyzeProjectStack() {
  log.title('📊 프로젝트 기술 스택 분석');
  
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    const techStack = {
      frontend: [],
      backend: [],
      database: [],
      testing: [],
      deployment: []
    };
    
    // 의존성 분석
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps['next']) techStack.frontend.push('next.js');
    if (deps['react']) techStack.frontend.push('react');
    if (deps['firebase']) techStack.backend.push('firebase');
    if (deps['dexie']) techStack.database.push('indexeddb');
    if (deps['@playwright/test']) techStack.testing.push('playwright');
    
    log.success(`기술 스택 분석 완료`);
    console.log('  Frontend:', techStack.frontend.join(', ') || 'None');
    console.log('  Backend:', techStack.backend.join(', ') || 'None');
    console.log('  Database:', techStack.database.join(', ') || 'None');
    console.log('  Testing:', techStack.testing.join(', ') || 'None');
    
    return techStack;
  } catch (error) {
    log.error(`기술 스택 분석 실패: ${error.message}`);
    return null;
  }
}

// 현재 설치된 MCP 서버 확인
async function getInstalledMCPs() {
  log.title('🔍 설치된 MCP 서버 확인');
  
  try {
    const config = JSON.parse(await fs.readFile(claudeConfigPath, 'utf8'));
    const installed = Object.keys(config.mcpServers || {});
    
    if (installed.length > 0) {
      log.success(`${installed.length}개의 MCP 서버 발견`);
      installed.forEach(mcp => console.log(`  • ${mcp}`));
    } else {
      log.warning('설치된 MCP 서버가 없습니다');
    }
    
    return installed;
  } catch (error) {
    log.error(`설정 파일 읽기 실패: ${error.message}`);
    return [];
  }
}

// MCP 서버 평가
function evaluateMCP(mcp, techStack, installedMCPs) {
  let score = 0;
  
  // 별점 기반 점수 (최대 30점)
  score += Math.min(30, mcp.stars / 50);
  
  // 최근 업데이트 (최대 20점)
  score += Math.max(0, 20 - mcp.lastUpdate);
  
  // 기술 스택 호환성 (최대 30점)
  if (mcp.description.toLowerCase().includes('github') && techStack.frontend.includes('react')) score += 15;
  if (mcp.description.toLowerCase().includes('docker') && techStack.backend.length > 0) score += 10;
  if (mcp.description.toLowerCase().includes('database') && techStack.database.length > 0) score += 15;
  if (mcp.description.toLowerCase().includes('vercel') && techStack.frontend.includes('next.js')) score += 30;
  
  // 이미 설치되지 않은 경우 (최대 20점)
  if (!installedMCPs.includes(mcp.name)) score += 20;
  
  return Math.round(score);
}

// MCP 추천
async function recommendMCPs() {
  log.title('🎯 MCP 서버 추천');
  
  const techStack = await analyzeProjectStack();
  const installedMCPs = await getInstalledMCPs();
  
  if (!techStack) {
    log.error('기술 스택을 분석할 수 없어 추천을 중단합니다');
    return [];
  }
  
  const recommendations = [];
  
  for (const [name, mcp] of Object.entries(recommendedMCPs)) {
    if (installedMCPs.includes(name)) continue;
    
    const score = evaluateMCP({ name, ...mcp }, techStack, installedMCPs);
    recommendations.push({ name, ...mcp, score });
  }
  
  // 점수순 정렬
  recommendations.sort((a, b) => b.score - a.score);
  
  log.success(`${recommendations.length}개의 MCP 서버 추천`);
  console.log('\n추천 순위:');
  recommendations.slice(0, 5).forEach((mcp, index) => {
    console.log(`  ${index + 1}. ${colors.bright}${mcp.name}${colors.reset} (점수: ${mcp.score}/100)`);
    console.log(`     ${mcp.description}`);
    console.log(`     ⭐ ${mcp.stars} | 🔄 ${mcp.lastUpdate}일 전 업데이트`);
  });
  
  return recommendations;
}

// MCP 설치
async function installMCP(mcpName) {
  log.title(`📦 ${mcpName} 설치`);
  
  const mcp = recommendedMCPs[mcpName];
  if (!mcp) {
    log.error(`알 수 없는 MCP: ${mcpName}`);
    return false;
  }
  
  try {
    // Claude 설정 업데이트
    const config = JSON.parse(await fs.readFile(claudeConfigPath, 'utf8'));
    
    if (!config.mcpServers) config.mcpServers = {};
    
    config.mcpServers[mcpName] = {
      command: mcp.command,
      args: mcp.args,
      env: mcp.env
    };
    
    await fs.writeFile(claudeConfigPath, JSON.stringify(config, null, 2));
    log.success(`Claude 설정 파일 업데이트 완료`);
    
    // npm 패키지 설치 (필요한 경우)
    if (mcp.npmPackage) {
      log.info(`npm 패키지 설치 중: ${mcp.npmPackage}`);
      try {
        await exec(`npm install -g ${mcp.npmPackage}`);
        log.success(`npm 패키지 설치 완료`);
      } catch (error) {
        log.warning(`npm 패키지 설치 실패 (수동 설치 필요): ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    log.error(`설치 실패: ${error.message}`);
    return false;
  }
}

// 에이전트 업데이트
async function updateAgentsWithMCP(mcpName) {
  log.title(`🔧 에이전트 업데이트: ${mcpName}`);
  
  const mcp = recommendedMCPs[mcpName];
  if (!mcp || !mcp.relatedAgents) {
    log.warning('관련 에이전트가 없습니다');
    return;
  }
  
  for (const agentName of mcp.relatedAgents) {
    const agentPath = path.join(agentsPath, `${agentName}.md`);
    
    try {
      const content = await fs.readFile(agentPath, 'utf8');
      
      // tools 섹션 업데이트
      const toolsMatch = content.match(/tools: (.+)/);
      if (toolsMatch) {
        const currentTools = toolsMatch[1];
        const newTool = `mcp__${mcpName.replace('-', '_')}__*`;
        
        if (!currentTools.includes(newTool)) {
          const updatedContent = content.replace(
            /tools: (.+)/,
            `tools: ${currentTools}, ${newTool}`
          );
          
          await fs.writeFile(agentPath, updatedContent);
          log.success(`${agentName} 에이전트 업데이트 완료`);
        }
      }
    } catch (error) {
      log.warning(`${agentName} 업데이트 실패: ${error.message}`);
    }
  }
}

// 메인 워크플로우
async function runAutomation(command, args) {
  console.log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════╗
║     MCP 자동화 시스템 v2.0               ║
║     Model Context Protocol Manager       ║
╚══════════════════════════════════════════╝
${colors.reset}`);
  
  switch (command) {
    case 'scan':
      log.title('🔍 GitHub MCP 서버 스캔 (시뮬레이션)');
      log.info('GitHub API를 통한 실제 스캔은 추가 구현이 필요합니다');
      log.success(`${Object.keys(recommendedMCPs).length}개의 추천 MCP 서버 준비됨`);
      break;
      
    case 'recommend':
      await recommendMCPs();
      break;
      
    case 'install':
      const mcpName = args[0];
      if (!mcpName) {
        log.error('설치할 MCP 이름을 지정하세요');
        console.log('예: node mcp-automation.js install github-mcp');
        break;
      }
      const success = await installMCP(mcpName);
      if (success) {
        await updateAgentsWithMCP(mcpName);
      }
      break;
      
    case 'auto':
      log.title('🤖 전체 자동화 워크플로우 실행');
      
      // 1. 추천
      const recommendations = await recommendMCPs();
      
      if (recommendations.length === 0) {
        log.info('추천할 MCP가 없습니다');
        break;
      }
      
      // 2. 상위 3개 자동 설치
      log.title('🚀 상위 3개 MCP 자동 설치');
      for (const mcp of recommendations.slice(0, 3)) {
        const success = await installMCP(mcp.name);
        if (success) {
          await updateAgentsWithMCP(mcp.name);
        }
      }
      
      log.success('✨ 자동화 워크플로우 완료!');
      break;
      
    case 'status':
      await getInstalledMCPs();
      break;
      
    default:
      console.log(`
사용법: node mcp-automation.js [명령어] [옵션]

명령어:
  scan       - GitHub에서 새 MCP 서버 검색 (시뮬레이션)
  recommend  - 프로젝트에 적합한 MCP 추천
  install    - 특정 MCP 설치 (예: install github-mcp)
  auto       - 전체 자동화 워크플로우 실행
  status     - 설치된 MCP 서버 확인

예제:
  node mcp-automation.js recommend
  node mcp-automation.js install github-mcp
  node mcp-automation.js auto
      `);
  }
  
  console.log('\n');
}

// 실행
const [,, command, ...args] = process.argv;
runAutomation(command, args).catch(error => {
  log.error(`치명적 오류: ${error.message}`);
  process.exit(1);
});