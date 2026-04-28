export const generateFromGpuNode = async (
  endpoint: string,
  prompt: string,
  model: string,
  type: 'image' | 'video' | 'audio',
  duration: string
) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, type, duration })
    });
    
    if (!response.ok) {
      throw new Error(`GPU Node Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Unknown GPU Node Error');
    }
    
    return data.data || data.media_url || data.base64;
  } catch (error) {
    console.error("GPU Node Generation Error:", error);
    throw error;
  }
};
