# First, create the patch file directly in Termux
cat > ~/whm.patch << 'EOF'
diff --git a/App.tsx b/App.tsx
index 170f338..df64214 100644
--- a/App.tsx
+++ b/App.tsx
@@ -131,8 +131,12 @@ const MainApp: React.FC = () => {
     provider: 'openrouter',
     openrouterKey: '',
     openaiKey: '',
+    anthropicKey: '',
     geminiKey: '',
+    mistralKey: '',
+    llamaKey: '',
     deepseekKey: '',
+    deepseekBaseUrl: 'http://localhost:8000',
     selectedModel: 'openai/gpt-4o',
     enableGemini: false,
   });
diff --git a/components/AIConfigPanel.tsx b/components/AIConfigPanel.tsx
index 7dbe622..56bda28 100644
--- a/components/AIConfigPanel.tsx
+++ b/components/AIConfigPanel.tsx
@@ -30,9 +30,17 @@ const AI_MODELS: Record<AIProvider, { id: string; name: string; desc: string }[]
     { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Balanced performance' },
   ],
   deepseek: [
-    { id: 'deepseek-chat', name: 'DeepSeek Chat', desc: 'General purpose chat model' },
-    { id: 'deepseek-coder', name: 'DeepSeek Coder', desc: 'Code generation specialist' },
-    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', desc: 'Advanced reasoning (R1)' },
+    { id: 'deepseek', name: 'DeepSeek Default', desc: 'Balanced general chat' },
+    { id: 'deepseek-think', name: 'DeepSeek Think', desc: 'Reasoning-optimized responses' },
+    { id: 'deepseek-r1', name: 'DeepSeek R1', desc: 'R1 reasoning model' },
+    { id: 'deepseek-search', name: 'DeepSeek Search', desc: 'Web-connected search mode' },
+    { id: 'deepseek-r1-search', name: 'DeepSeek R1 Search', desc: 'R1 with search augmentation' },
+    { id: 'deepseek-think-search', name: 'DeepSeek Think Search', desc: 'Think mode + search' },
+    { id: 'deepseek-think-silent', name: 'DeepSeek Think Silent', desc: 'Think mode without chain output' },
+    { id: 'deepseek-r1-silent', name: 'DeepSeek R1 Silent', desc: 'R1 without chain output' },
+    { id: 'deepseek-search-silent', name: 'DeepSeek Search Silent', desc: 'Search without chain output' },
+    { id: 'deepseek-think-fold', name: 'DeepSeek Think Fold', desc: 'Compact reasoning summaries' },
+    { id: 'deepseek-r1-fold', name: 'DeepSeek R1 Fold', desc: 'Compact R1 summaries' },
   ],
 
@@ -78,8 +86,8 @@ const PROVIDER_INFO: Record<AIProvider, { name: string; icon: React.ReactNode; c
     name: 'DeepSeek',
     icon: <Brain className="w-5 h-5" />,
     color: 'text-cyan-400',
-    desc: 'DeepSeek direct API — chat, code & reasoning',
-    url: 'https://platform.deepseek.com/api_keys',
+    desc: 'DeepSeek Free API (OpenAI-compatible) — chat + reasoning',
+    url: 'https://github.com/LLM-Red-Team/deepseek-free-api',
   },
 
@@ -144,8 +152,18 @@ const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ config, onConfigChange, a
                   localConfig.geminiKey;
 
     if (!key || key.length < 10) {
+      if (provider === 'deepseek') {
+        // DeepSeek Free API can be used without a key
+      } else {
+        setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
+        addLog?.(`AI_TEST: ${provider} - No valid API key provided`, 'error');
+        return;
+      }
+    }
+
+    if (provider === 'deepseek' && !localConfig.deepseekBaseUrl) {
       setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
-      addLog?.(`AI_TEST: ${provider} - No valid API key provided`, 'error');
+      addLog?.('AI_TEST: deepseek - Base URL required (e.g., http://localhost:8000)', 'error');
       return;
     }
 
@@ -166,8 +184,10 @@ const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ config, onConfigChange, a
         const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
         success = response.ok;
       } else if (provider === 'deepseek') {
-        const response = await fetch('https://api.deepseek.com/models', {
-          headers: { 'Authorization': `Bearer ${key}` }
+        const base = localConfig.deepseekBaseUrl.replace(/\/+$/, '');
+        const apiBase = base.endsWith('/v1') ? base : `${base}/v1`;
+        const response = await fetch(`${apiBase}/models`, {
+          headers: key ? { 'Authorization': `Bearer ${key}` } : undefined
         });
         success = response.ok;
       }
@@ -317,11 +337,18 @@ const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ config, onConfigChange, a
               type="password"
               value={localConfig.deepseekKey}
               onChange={(e) => setLocalConfig({ ...localConfig, deepseekKey: e.target.value })}
-              placeholder="sk-..."
+              placeholder="Optional token"
               className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[11px] text-cyan-400 font-mono outline-none focus:border-cyan-500/50"
             />
+            <input
+              type="text"
+              value={localConfig.deepseekBaseUrl}
+              onChange={(e) => setLocalConfig({ ...localConfig, deepseekBaseUrl: e.target.value })}
+              placeholder="http://localhost:8000"
+              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[11px] text-cyan-200 font-mono outline-none focus:border-cyan-500/50"
+            />
             <p className="text-[7px] text-gray-600">
-              Get your key at <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">platform.deepseek.com</a>
+              DeepSeek Free API base URL (OpenAI-compatible). Example: <span className="text-cyan-400">http://localhost:8000</span>
             </p>
           </div>
 
diff --git a/components/WhoamiGpt.tsx b/components/WhoamiGpt.tsx
index 047835f..38534ff 100644
--- a/components/WhoamiGpt.tsx
+++ b/components/WhoamiGpt.tsx
@@ -191,13 +191,13 @@ const WhoamiGpt: React.FC<WhoamiGptProps> = ({ addLog, onMinimize, openTerminal,
   };
 
   const executeSwarmLogic = async (task: string, context: string) => {
+    const logBoth = (msg: string, level: LogEntry['level'] = 'info') => {
+      setTerminalLogs(prev => [...prev, msg]);
+      addLog(msg, level);
+    };
+
     try {
        if (openTerminal) openTerminal();
-       
-       const logBoth = (msg: string, level: LogEntry['level'] = 'info') => {
-         setTerminalLogs(prev => [...prev, msg]);
-         addLog(msg, level);
-       };
 
        logBoth('[SWARM_CORE] NEURAL LINK ESTABLISHED...', 'warning');
diff --git a/src/components/WhoamiGpt.tsx b/src/components/WhoamiGpt.tsx
index c719123..7c28825 100644
--- a/src/components/WhoamiGpt.tsx
+++ b/src/components/WhoamiGpt.tsx
@@ -262,13 +262,13 @@ console.log("Awaiting specific instructions...");
   };
 
   const executeSwarmLogic = async (task: string, context: string) => {
+    const logBoth = (msg: string, level: LogEntry['level'] = 'info') => {
+      setTerminalLogs(prev => [...prev, msg]);
+      addLog(msg, level);
+    };
+
     try {
        if (openTerminal) openTerminal();
-       
-       const logBoth = (msg: string, level: LogEntry['level'] = 'info') => {
-         setTerminalLogs(prev => [...prev, msg]);
-         addLog(msg, level);
-       };
 
        logBoth('[SWARM_CORE] NEURAL LINK ESTABLISHED...', 'warning');
diff --git a/src/services/aiService.ts b/src/services/aiService.ts
index 99073e8..0ebbdf4 100644
--- a/src/services/aiService.ts
+++ b/src/services/aiService.ts
@@ -1,6 +1,6 @@
 import { AIConfig } from '../../types';
 
-let currentConfig: AIConfig = {
+const DEFAULT_AI_CONFIG: AIConfig = {
   provider: 'openrouter',
   openrouterKey: '',
   openaiKey: '',
@@ -9,12 +9,15 @@ let currentConfig: AIConfig = {
   mistralKey: '',
   llamaKey: '',
   deepseekKey: '',
+  deepseekBaseUrl: 'http://localhost:8000',
   selectedModel: 'nousresearch/hermes-3-llama-3.1-405b',
   enableGemini: false,
 };
 
+let currentConfig: AIConfig = { ...DEFAULT_AI_CONFIG };
+
 export const setAIConfig = (config: AIConfig) => {
-  currentConfig = config;
+  currentConfig = { ...DEFAULT_AI_CONFIG, ...config };
 };
 
@@ -47,7 +50,7 @@ export const aiChat = async (
 ): Promise<string> => {
   const apiKey = getActiveApiKey();
   
-  if (!apiKey && currentConfig.provider !== 'lisp' && currentConfig.provider !== 'milspec') {
+  if (!apiKey && currentConfig.provider !== 'lisp' && currentConfig.provider !== 'milspec' && currentConfig.provider !== 'deepseek') {
     throw new Error(`No API key configured for ${currentConfig.provider}`);
   }
 
@@ -186,10 +189,14 @@ const callDeepSeek = async (message: string, systemPrompt: string, apiKey: strin
     ? currentConfig.selectedModel 
     : 'deepseek-chat';
 
-  const response = await fetch('https://api.deepseek.com/chat/completions', {
+  const baseUrlRaw = currentConfig.deepseekBaseUrl?.trim() || '';
+  const baseUrl = baseUrlRaw.replace(/\/+$/, '');
+  const apiBase = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl || 'http://localhost:8000'}/v1`;
+
+  const response = await fetch(`${apiBase}/chat/completions`, {
     method: 'POST',
     headers: {
-      'Authorization': `Bearer ${apiKey}`,
+      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
       'Content-Type': 'application/json',
     },
 
@@ -401,7 +408,7 @@ export const loadAIConfigFromStorage = (): AIConfig | null => {
   const stored = localStorage.getItem('whoamisec_ai_config');
   if (stored) {
     try {
-      const config = JSON.parse(stored);
+      const config = { ...DEFAULT_AI_CONFIG, ...JSON.parse(stored) };
       setAIConfig(config);
       return config;
     } catch (e) {
diff --git a/types.ts b/types.ts
index 1ac9ef3..b2300ed 100644
--- a/types.ts
+++ b/types.ts
@@ -234,6 +234,7 @@ export interface AIConfig {
   mistralKey: string;
   llamaKey: string;
   deepseekKey: string;
+  deepseekBaseUrl: string;
   selectedModel: string;
   enableGemini: boolean;
 }
EOF

# Now apply the patch
cd /sdcard/whm-un1c && git apply ~/whm.patch

# If that works, then commit and push
git add .
git commit -m "DeepSeek Free API support + fix logBoth error"
git push origin main
