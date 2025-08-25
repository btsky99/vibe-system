import fs from 'fs';
import path from 'path';
import { Agent } from '@/types/vibe';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  type: 'general-purpose' | 'frontend' | 'backend' | 'mobile' | 'security' | 'performance' | 'docs' | 'ai' | 'workflow';
  category: string;
  capabilities: string[];
  dependencies?: string[];
  examples?: string[];
}

export class AgentLoader {
  private agentsPath: string;
  private loadedAgents: Map<string, AgentConfig> = new Map();

  constructor(agentsPath: string = '.claude/agents') {
    this.agentsPath = agentsPath;
  }

  /**
   * .claude/agents 폴더에서 모든 에이전트 파일을 스캔하고 로드
   */
  async loadAllAgents(): Promise<Agent[]> {
    try {
      const agentsDir = path.join(process.cwd(), this.agentsPath);
      
      if (!fs.existsSync(agentsDir)) {
        console.warn(`에이전트 디렉토리를 찾을 수 없습니다: ${agentsDir}`);
        return this.getDefaultAgents();
      }

      const agentFiles = fs.readdirSync(agentsDir)
        .filter(file => file.endsWith('.md'))
        .sort();

      const agents: Agent[] = [];

      for (const file of agentFiles) {
        try {
          const agentConfig = await this.parseAgentFile(path.join(agentsDir, file));
          if (agentConfig) {
            agents.push(this.convertToAgent(agentConfig));
            this.loadedAgents.set(agentConfig.id, agentConfig);
          }
        } catch (error) {
          console.error(`에이전트 파일 로드 실패: ${file}`, error);
        }
      }

      console.log(`✅ ${agents.length}개의 에이전트가 로드되었습니다.`);
      return agents;
    } catch (error) {
      console.error('에이전트 로드 중 오류 발생:', error);
      return this.getDefaultAgents();
    }
  }

  /**
   * 마크다운 파일에서 에이전트 설정 파싱
   */
  private async parseAgentFile(filePath: string): Promise<AgentConfig | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, '.md');

      // 파일명에서 에이전트 정보 추출
      const agentConfig = this.extractAgentInfo(fileName, content);
      return agentConfig;
    } catch (error) {
      console.error(`파일 파싱 실패: ${filePath}`, error);
      return null;
    }
  }

  /**
   * 파일명과 내용에서 에이전트 정보 추출
   */
  private extractAgentInfo(fileName: string, content: string): AgentConfig {
    // 파일명 기반 기본 정보
    const typeMap: Record<string, typeof Agent.prototype.type> = {
      'frontend': 'frontend',
      'backend': 'backend',
      'mobile': 'mobile',
      'security': 'security',
      'perf': 'performance',
      'debug': 'general-purpose',
      'test': 'general-purpose',
      'docs': 'docs',
      'ai': 'ai',
      'auto': 'workflow',
      'agent': 'general-purpose'
    };

    // 타입 결정
    let agentType: typeof Agent.prototype.type = 'general-purpose';
    for (const [key, type] of Object.entries(typeMap)) {
      if (fileName.includes(key)) {
        agentType = type;
        break;
      }
    }

    // 이름 생성 (파일명 기반)
    const name = this.generateAgentName(fileName);
    
    // 설명 추출 (마크다운 내용에서)
    const description = this.extractDescription(content) || 
                       `${name} 전문 에이전트`;

    // 기능 추출
    const capabilities = this.extractCapabilities(content);

    return {
      id: fileName,
      name,
      description,
      type: agentType,
      category: this.determineCategory(fileName, agentType),
      capabilities,
      examples: this.extractExamples(content)
    };
  }

  /**
   * 파일명에서 에이전트 이름 생성
   */
  private generateAgentName(fileName: string): string {
    const nameMap: Record<string, string> = {
      'debug-specialist': '🐛 Debug Specialist',
      'frontend-react-component': '⚛️ React Component Expert',
      'frontend-typescript-expert': '📘 TypeScript Expert',
      'frontend-responsive-design': '📱 Responsive Design Expert',
      'frontend-animation-expert': '✨ Animation Expert',
      'frontend-accessibility-expert': '♿ Accessibility Expert',
      'frontend-nextjs-routing': '🛣️ Next.js Routing Expert',
      'backend-firebase-auth': '🔥 Firebase Auth Expert',
      'backend-firestore-database': '📊 Firestore Expert',
      'backend-indexeddb-expert': '💾 IndexedDB Expert',
      'backend-api-routes': '🛤️ API Routes Expert',
      'backend-cache-strategy': '💨 Cache Strategy Expert',
      'backend-sync-specialist': '🔄 Data Sync Expert',
      'backend-dexie-specialist': '🗃️ Dexie.js Expert',
      'mobile-agent': '📱 Mobile Agent',
      'tablet-agent': '💻 Tablet Agent',
      'pc-agent': '🖥️ PC Agent',
      'pwa-offline-first': '📴 PWA Offline Expert',
      'security-auditor': '🛡️ Security Auditor',
      'test-automation-expert': '🧪 Test Automation Expert',
      'code-review-expert': '👁️ Code Review Expert',
      'perf-rendering-expert': '⚡ Rendering Performance Expert',
      'perf-memory-optimizer': '🧠 Memory Optimizer',
      'perf-loading-speed': '🚀 Loading Speed Expert',
      'perf-bundle-optimizer': '📦 Bundle Optimizer',
      'docs-technical-writer': '📝 Technical Writer',
      'ai-gemini-specialist': '🔮 Gemini AI Expert',
      'ai-gemini-integration-specialist': '🤖 AI Integration Expert',
      'auto-workflow-engine': '⚙️ Workflow Engine',
      'auto-gmail-integration': '📧 Gmail Integration',
      'auto-sms-bridge': '📱 SMS Bridge',
      'architect-designer': '🏗️ Architecture Designer',
      'mcp-manager': '🔌 MCP Manager',
      'customer-id-validator': '✅ ID Validator',
      'data-analysis-expert': '📈 Data Analysis Expert'
    };

    return nameMap[fileName] || `🤖 ${fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  }

  /**
   * 마크다운에서 설명 추출
   */
  private extractDescription(content: string): string | null {
    // 첫 번째 # 헤더나 설명 부분 찾기
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ') || line.startsWith('> ')) {
        return line.replace(/^[#>]\s*/, '').trim();
      }
      if (line.trim() && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('*')) {
        return line.trim();
      }
    }
    return null;
  }

  /**
   * 기능 목록 추출
   */
  private extractCapabilities(content: string): string[] {
    const capabilities: string[] = [];
    const lines = content.split('\n');
    
    let inCapabilitiesSection = false;
    for (const line of lines) {
      if (line.includes('기능') || line.includes('capabilities') || line.includes('Features')) {
        inCapabilitiesSection = true;
        continue;
      }
      
      if (inCapabilitiesSection && (line.startsWith('- ') || line.startsWith('* '))) {
        capabilities.push(line.replace(/^[-*]\s*/, '').trim());
      } else if (inCapabilitiesSection && line.trim() === '') {
        inCapabilitiesSection = false;
      }
    }
    
    return capabilities.slice(0, 5); // 최대 5개만
  }

  /**
   * 예제 추출
   */
  private extractExamples(content: string): string[] {
    const examples: string[] = [];
    const lines = content.split('\n');
    
    let inExampleSection = false;
    for (const line of lines) {
      if (line.includes('예제') || line.includes('example') || line.includes('Example')) {
        inExampleSection = true;
        continue;
      }
      
      if (inExampleSection && line.startsWith('```')) {
        // 코드 블록은 건너뛰기
        continue;
      }
      
      if (inExampleSection && (line.startsWith('- ') || line.startsWith('* '))) {
        examples.push(line.replace(/^[-*]\s*/, '').trim());
      } else if (inExampleSection && line.trim() === '') {
        inExampleSection = false;
      }
    }
    
    return examples.slice(0, 3); // 최대 3개만
  }

  /**
   * 카테고리 결정
   */
  private determineCategory(fileName: string, type: typeof Agent.prototype.type): string {
    if (fileName.includes('frontend')) return 'Frontend';
    if (fileName.includes('backend')) return 'Backend';
    if (fileName.includes('mobile')) return 'Mobile';
    if (fileName.includes('security')) return 'Security';
    if (fileName.includes('perf')) return 'Performance';
    if (fileName.includes('docs')) return 'Documentation';
    if (fileName.includes('ai')) return 'AI/ML';
    if (fileName.includes('auto')) return 'Automation';
    if (fileName.includes('test')) return 'Testing';
    return 'General';
  }

  /**
   * AgentConfig를 Agent로 변환
   */
  private convertToAgent(config: AgentConfig): Agent {
    return {
      id: config.id,
      name: config.name,
      description: config.description,
      type: config.type,
      status: 'idle'
    };
  }

  /**
   * 기본 에이전트 목록 (폴백용)
   */
  private getDefaultAgents(): Agent[] {
    return [
      {
        id: 'debug-specialist',
        name: '🐛 Debug Specialist',
        description: 'AI 기반 지능형 디버깅 전문가',
        status: 'idle',
        type: 'general-purpose'
      },
      {
        id: 'frontend-react',
        name: '⚛️ React Expert',
        description: 'React 컴포넌트 개발 전문가',
        status: 'idle',
        type: 'frontend'
      },
      {
        id: 'backend-firebase',
        name: '🔥 Firebase Expert',
        description: 'Firebase 백엔드 전문가',
        status: 'idle',
        type: 'backend'
      }
    ];
  }

  /**
   * 특정 에이전트 정보 가져오기
   */
  getAgentConfig(agentId: string): AgentConfig | null {
    return this.loadedAgents.get(agentId) || null;
  }

  /**
   * 타입별 에이전트 목록 가져오기
   */
  getAgentsByType(type: typeof Agent.prototype.type): AgentConfig[] {
    return Array.from(this.loadedAgents.values())
      .filter(agent => agent.type === type);
  }

  /**
   * 카테고리별 에이전트 목록 가져오기
   */
  getAgentsByCategory(category: string): AgentConfig[] {
    return Array.from(this.loadedAgents.values())
      .filter(agent => agent.category === category);
  }
}