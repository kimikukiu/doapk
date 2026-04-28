# Fix Git safe directory issue
git config --global --add safe.directory /storage/emulated/0/whm-un1c

# Go to the project directory
cd /sdcard/whm-un1c

# 1. Update App.tsx - add new fields
sed -i '/geminiKey:/i \    anthropicKey: "",' App.tsx
sed -i '/geminiKey:/a \    mistralKey: "",' App.tsx
sed -i '/deepseekKey:/i \    llamaKey: "",' App.tsx
sed -i '/deepseekKey:/a \    deepseekBaseUrl: "http://localhost:8000",' App.tsx

# 2. Update types.ts - add deepseekBaseUrl
sed -i '/deepseekKey:/a \  deepseekBaseUrl: string;' types.ts

# 3. Update aiService.ts - add DEFAULT_AI_CONFIG
cat > /tmp/ai_service_update.txt << 'EOF'
import { AIConfig } from '../../types';

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openrouter',
  openrouterKey: '',
  openaiKey: '',
  anthropicKey: '',
  geminiKey: '',
  mistralKey: '',
  llamaKey: '',
  deepseekKey: '',
  deepseekBaseUrl: 'http://localhost:8000',
  selectedModel: 'nousresearch/hermes-3-llama-3.1-405b',
  enableGemini: false,
};

let currentConfig: AIConfig = { ...DEFAULT_AI_CONFIG };

export const setAIConfig = (config: AIConfig) => {
  currentConfig = { ...DEFAULT_AI_CONFIG, ...config };
};
EOF

# Replace the beginning of aiService.ts
sed -i '1,20d' src/services/aiService.ts
sed -i '1r /tmp/ai_service_update.txt' src/services/aiService.ts

# 4. Update aiService.ts - fix the apiKey check
sed -i 's/if (!apiKey && currentConfig.provider !== '"'"'lisp'"'"' && currentConfig.provider !== '"'"'milspec'"'"') {/if (!apiKey && currentConfig.provider !== '"'"'lisp'"'"' && currentConfig.provider !== '"'"'milspec'"'"' && currentConfig.provider !== '"'"'deepseek'"'"') {/' src/services/aiService.ts

# 5. Update aiService.ts - fix callDeepSeek function
sed -i 's|const response = await fetch('"'"'https://api.deepseek.com/chat/completions'"'"', {|const baseUrlRaw = currentConfig.deepseekBaseUrl?.trim() || '"''"';\n  const baseUrl = baseUrlRaw.replace(/\/+$/, '"''"');\n  const apiBase = baseUrl.endsWith('"'"'/v1'"'"') ? baseUrl : `${baseUrl || '"'"'http://localhost:8000'"'"'}/v1`;\n\n  const response = await fetch(`${apiBase}/chat/completions`, {|' src/services/aiService.ts

sed -i 's|      '"'"'Authorization'"'"': `Bearer ${apiKey}`,|      ...(apiKey ? { '"'"'Authorization'"'"': `Bearer ${apiKey}` } : {}),|' src/services/aiService.ts

# 6. Update aiService.ts - fix loadAIConfigFromStorage
sed -i 's/const config = JSON.parse(stored);/const config = { ...DEFAULT_AI_CONFIG, ...JSON.parse(stored) };/' src/services/aiService.ts

# 7. Fix the logBoth error in WhoamiGpt.tsx files
# First, let's create the correct function
cat > /tmp/logboth_fix.txt << 'EOF'
    const logBoth = (msg: string, level: LogEntry['level'] = 'info') => {
      setTerminalLogs(prev => [...prev, msg]);
      addLog(msg, level);
    };
EOF

# Apply to components/WhoamiGpt.tsx
sed -i '/const executeSwarmLogic = async/,/try {/c\
  const executeSwarmLogic = async (task: string, context: string) => {\
    const logBoth = (msg: string, level: LogEntry['\''level'\''] = '\''info'\'') => {\
      setTerminalLogs(prev => [...prev, msg]);\
      addLog(msg, level);\
    };\
\
    try {\
       if (openTerminal) openTerminal();' components/WhoamiGpt.tsx

# Apply to src/components/WhoamiGpt.tsx
sed -i '/const executeSwarmLogic = async/,/try {/c\
  const executeSwarmLogic = async (task: string, context: string) => {\
    const logBoth = (msg: string, level: LogEntry['\''level'\''] = '\''info'\'') => {\
      setTerminalLogs(prev => [...prev, msg]);\
      addLog(msg, level);\
    };\
\
    try {\
       if (openTerminal) openTerminal();' src/components/WhoamiGpt.tsx

# Now commit and push
git add .
git commit -m "DeepSeek Free API support + fix logBoth error"
git push origin main
