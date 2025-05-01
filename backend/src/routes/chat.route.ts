import { Router } from 'express';
import { AIService } from '../services/ai.service';

const router = Router();

router.post('/chat', (req, res) => {
  return new Promise(async (resolve, _reject) => {
    try {
      const { messages } = req.body;
      console.log('[Backend API] Received request:', { messages });

      if (!messages || !Array.isArray(messages)) {
        console.error('[Backend API] Invalid messages format:', messages);
        res.status(400).json({ error: 'Invalid messages format' });
        return resolve(undefined);
      }

      const response = await AIService.getResponse(messages);
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