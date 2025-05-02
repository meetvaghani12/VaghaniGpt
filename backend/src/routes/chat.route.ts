import { Router } from 'express';
import { AIService } from '../services/ai.service';

const router = Router();

router.post('/chat', (req, res) => {
  return new Promise(async (resolve, _reject) => {
    try {
      const { messages, model } = req.body;
      console.log('[Backend API] Full request body:', JSON.stringify(req.body, null, 2));
      console.log('[Backend API] Selected model:', model);

      if (!messages || !Array.isArray(messages)) {
        console.error('[Backend API] Invalid messages format:', messages);
        res.status(400).json({ error: 'Invalid messages format' });
        return resolve(undefined);
      }

      if (!model || (model !== 'gemini' && model !== 'deepseek' && model !== 'openai')) {
        console.error('[Backend API] Invalid model:', model);
        res.status(400).json({ error: 'Invalid model specified' });
        return resolve(undefined);
      }

      console.log('[Backend API] Calling AI service with model:', model);
      const response = await AIService.getResponse(messages, model);
      console.log('[Backend API] Raw AI response:', response);

      // Set headers for streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send the response in a format compatible with @ai-sdk/react
      const lines = response.split('\n');
      console.log('[Backend API] Split response into lines:', lines);
      
      for (const line of lines) {
        if (line.trim()) {
          const data = { content: line };
          const jsonData = JSON.stringify(data);
          const sseData = `data: ${jsonData}\n\n`;
          console.log('[Backend API] Sending SSE data:', sseData);
          res.write(sseData);
        }
      }
      res.end();
      console.log('[Backend API] Response stream ended');
      return resolve(undefined);
    } catch (error) {
      console.error('[Backend API] Error:', error);
      res.status(500).json({ error: 'Failed to get AI response' });
      return resolve(undefined);
    }
  });
});

export default router; 