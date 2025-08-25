'use client';

import React, { useState, useEffect } from 'react';
import { FileNode } from '@/types/vibe';

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['C:\\ons']));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async () => {
    try {
      // OnS 프로젝트의 주요 디렉토리 구조를 시뮬레이션
      const mockFileTree: FileNode[] = [
        {
          name: 'src',
          path: 'C:\\ons\\src',
          type: 'directory',
          children: [
            {
              name: 'app',
              path: 'C:\\ons\\src\\app',
              type: 'directory',
              children: [
                { name: 'page.tsx', path: 'C:\\ons\\src\\app\\page.tsx', type: 'file', size: 2048 },
                { name: 'layout.tsx', path: 'C:\\ons\\src\\app\\layout.tsx', type: 'file', size: 1536 },
                { name: 'globals.css', path: 'C:\\ons\\src\\app\\globals.css', type: 'file', size: 4096 },
              ]
            },
            {
              name: 'components',
              path: 'C:\\ons\\src\\components',
              type: 'directory',
              children: [
                { name: 'ScheduleManager.tsx', path: 'C:\\ons\\src\\components\\ScheduleManager.tsx', type: 'file', size: 8192 },
                { name: 'ReservationForm.tsx', path: 'C:\\ons\\src\\components\\ReservationForm.tsx', type: 'file', size: 6144 },
              ]
            },
            {
              name: 'lib',
              path: 'C:\\ons\\src\\lib',
              type: 'directory',
              children: [
                { name: 'db.ts', path: 'C:\\ons\\src\\lib\\db.ts', type: 'file', size: 3072 },
                { name: 'utils.ts', path: 'C:\\ons\\src\\lib\\utils.ts', type: 'file', size: 2048 },
              ]
            }
          ]
        },
        {
          name: 'docs',
          path: 'C:\\ons\\docs',
          type: 'directory',
          children: [
            { name: 'COMMANDS.md', path: 'C:\\ons\\docs\\COMMANDS.md', type: 'file', size: 15360 },
            { name: 'README.md', path: 'C:\\ons\\docs\\README.md', type: 'file', size: 4096 },
          ]
        },
        { name: 'CLAUDE.md', path: 'C:\\ons\\CLAUDE.md', type: 'file', size: 12288 },
        { name: 'package.json', path: 'C:\\ons\\package.json', type: 'file', size: 2048 },
        { name: 'next.config.js', path: 'C:\\ons\\next.config.js', type: 'file', size: 1024 },
      ];
      
      setFileTree(mockFileTree);
      setLoading(false);
    } catch (error) {
      console.error('파일 트리 로드 실패:', error);
      setLoading(false);
    }
  };

  const toggleDirectory = (dirPath: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }
    setExpandedDirs(newExpanded);
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const indent = depth * 16;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer transition-colors ${
            node.type === 'file' ? 'text-gray-300' : 'text-gray-200'
          }`}
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDirectory(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === 'directory' && (
            <span className="mr-1 text-xs">
              {isExpanded ? '📂' : '📁'}
            </span>
          )}
          {node.type === 'file' && (
            <span className="mr-1 text-xs">
              {node.name.endsWith('.tsx') || node.name.endsWith('.ts') ? '⚛️' :
               node.name.endsWith('.md') ? '📝' :
               node.name.endsWith('.json') ? '⚙️' :
               node.name.endsWith('.css') ? '🎨' : '📄'}
            </span>
          )}
          <span className="text-sm truncate">{node.name}</span>
          {node.type === 'file' && node.size && (
            <span className="ml-auto text-xs text-gray-500">
              {(node.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>
        
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-vibe-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        파일 탐색기 로딩 중...
      </div>
    );
  }

  return (
    <div className="p-2">
      {fileTree.length === 0 ? (
        <div className="text-center text-gray-500 p-4">
          파일을 찾을 수 없습니다
        </div>
      ) : (
        fileTree.map(node => renderFileNode(node))
      )}
    </div>
  );
};