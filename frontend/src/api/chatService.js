// frontend/src/api/chatService.js
// Chat API service - handles SSE streaming from /api/chat/ask

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

/**
 * Sends a question to the chatbot and streams the response via SSE.
 * @param {string} question
 * @param {Array} chatHistory - [{ role: 'user'|'assistant', content: string }]
 * @param {function} onChunk - called with each text chunk as it arrives
 * @param {function} onDone - called when stream ends
 * @param {function} onError - called on error
 * @returns {function} abort function
 */
export const askChatbot = (question, chatHistory, onChunk, onDone, onError) => {
  const controller = new AbortController();

  const run = async () => {
    try {
      const res = await fetch(`${API_BASE}/public/api/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, chatHistory }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        onError(err.error || 'Request failed');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'token' && parsed.content) {
                onChunk(parsed.content);
              } else if (parsed.type === 'done') {
                onDone();
                return;
              } else if (parsed.type === 'error') {
                onError(parsed.content || 'Unknown error');
                return;
              }
            } catch {
              // plain text fallback
              if (data !== '[DONE]') onChunk(data);
              else { onDone(); return; }
            }
          }
        }
      }
      onDone();
    } catch (err) {
      if (err.name !== 'AbortError') onError(err.message);
    }
  };

  run();
  return () => controller.abort();
};
