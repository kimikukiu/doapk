import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, 
  Button, TextField, Typography, LinearProgress, Box, 
  IconButton, Chip 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import { useAIAnalysis } from './useAIAnalysis';

interface Props {
  open: boolean;
  onClose: () => void;
  subject: string;
}

const AIAnalysisModal: React.FC<Props> = ({ open, onClose, subject }) => {
  const { status, startAnalysis, updateApiKey } = useAIAnalysis();
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [useExternalApi, setUseExternalApi] = useState(false);

  useEffect(() => {
    if (open && subject) {
      startAnalysis(subject, useExternalApi);
    }
  }, [open, subject, startAnalysis, useExternalApi]);

  const handleSaveKey = async () => {
    if (apiKey) {
      await updateApiKey(apiKey);
      setShowKeyInput(false);
      startAnalysis(subject, useExternalApi); // Retry
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullScreen={window.innerWidth < 768} // Auto fullscreen on mobile
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          bgcolor: '#000', 
          border: '2px solid #00ff00',
          boxShadow: '0 0 20px #00ff00'
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#001100', borderBottom: '1px solid #00ff00', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon sx={{ color: '#00ff00' }} />
          <Typography variant="h6" sx={{ color: '#00ff00', fontFamily: 'monospace' }}>
            AI INVESTIGATION CORE
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            label={useExternalApi ? "EXTERNAL API" : "INTERNAL GPT"} 
            onClick={() => setUseExternalApi(!useExternalApi)}
            sx={{ 
              bgcolor: useExternalApi ? '#ffcc00' : '#00ff00', 
              color: '#000', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }} 
          />
          <IconButton onClick={() => setShowKeyInput(!showKeyInput)} sx={{ color: '#ffcc00' }}>
            <KeyIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: '#ff0000' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '60vh' }}>
        {showKeyInput && (
          <Box sx={{ p: 2, bgcolor: '#111', borderBottom: '1px solid #ffcc00' }}>
            <Typography sx={{ color: '#fff', mb: 1 }}>UPDATE API KEY (OpenAI/Google):</Typography>
            <Box display="flex" gap={1}>
              <TextField 
                fullWidth 
                variant="outlined" 
                size="small"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                sx={{ 
                  input: { color: '#ffcc00', fontFamily: 'monospace' },
                  fieldset: { borderColor: '#ffcc00' } 
                }} 
                placeholder="sk-..."
              />
              <Button variant="contained" color="success" onClick={handleSaveKey}>
                SAVE
              </Button>
            </Box>
          </Box>
        )}

        <LinearProgress 
          variant="determinate" 
          value={status.progress} 
          sx={{ 
            bgcolor: '#111', 
            '& .MuiLinearProgress-bar': { bgcolor: '#00ff00' } 
          }} 
        />

        <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
          {/* Logs Panel */}
          <Box sx={{ 
            width: { xs: '100%', md: '30%' }, 
            bgcolor: '#050505', 
            borderRight: '1px solid #333', 
            p: 1, 
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: '#00cc00'
          }}>
            {status.logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </Box>

          {/* Report Panel */}
          <Box sx={{ 
            flex: 1, 
            p: 2, 
            bgcolor: '#fff', 
            color: '#000', 
            overflowY: 'auto',
            fontFamily: 'serif'
          }}>
            {status.result ? (
              <div dangerouslySetInnerHTML={{ __html: status.result.replace(/\n/g, '<br>') }} />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="textSecondary">
                  {status.status === 'FAILED' ? 'ANALYSIS FAILED' : 'ANALYZING...'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AIAnalysisModal;
