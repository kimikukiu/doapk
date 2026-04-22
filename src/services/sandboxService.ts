import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const VIRTUAL_STORAGE_ROOT = path.join(process.cwd(), 'virtual_storage');

// Ensure the virtual storage directory exists
if (!fs.existsSync(VIRTUAL_STORAGE_ROOT)) {
  fs.mkdirSync(VIRTUAL_STORAGE_ROOT);
}

export const sandboxService = {
  // Execute a script in a sandboxed environment
  executeScript: (scriptName: string, args: string[] = []) => {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(VIRTUAL_STORAGE_ROOT, scriptName);
      
      if (!fs.existsSync(scriptPath)) {
        reject(new Error(`Script ${scriptName} not found in virtual storage.`));
        return;
      }

      // Execute in a restricted child process
      exec(`node ${scriptPath} ${args.join(' ')}`, { cwd: VIRTUAL_STORAGE_ROOT }, (error, stdout, stderr) => {
        if (error) {
          reject(stderr);
          return;
        }
        resolve(stdout);
      });
    });
  },

  // Save a script to virtual storage
  saveScript: (scriptName: string, content: string) => {
    fs.writeFileSync(path.join(VIRTUAL_STORAGE_ROOT, scriptName), content);
  },

  // List files in virtual storage
  listFiles: () => {
    return fs.readdirSync(VIRTUAL_STORAGE_ROOT);
  }
};
