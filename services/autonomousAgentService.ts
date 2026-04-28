import fs from 'fs';
import path from 'path';
import { evolutionService } from './evolutionService';
import { errorService } from './errorService';
import { sandboxService } from './sandboxService';

const PROJECT_ROOT = process.cwd();

export const autonomousAgentService = {
  // Recursively scan the project for files
  scanProject: (dir: string = PROJECT_ROOT, fileList: string[] = []): string[] => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (file !== 'node_modules' && file !== '.git' && file !== 'virtual_storage' && file !== 'dist') {
          autonomousAgentService.scanProject(filePath, fileList);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  },

  // Run the autonomous cycle: Scan -> Analyze -> Repair
  runAutonomousCycle: async () => {
    const files = autonomousAgentService.scanProject();
    const results = { scanned: files.length, repaired: 0, errors: [] as any[] };

    for (const file of files) {
      try {
        const analysis = evolutionService.analyzeFile(file);
        // Here we would integrate with an LLM to actually propose a fix based on analysis
        // For now, we log that we analyzed it
        console.log(`Analyzing ${file}...`);
      } catch (error: any) {
        results.errors.push({ file, error: error.message });
        // Attempt repair
        console.log(`Attempting repair for ${file}...`);
        // In a real scenario, this would call an LLM to generate a fix and apply it
      }
    }
    return results;
  }
};
