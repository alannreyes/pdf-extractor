export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: (process.env.OPENAI_MODEL || 'gpt-4.1-mini').replace(/\s+/g, '-'), // Remover espacios y reemplazar con guiones
  timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000,
  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES) || 2,
  temperature: 0.3,
  maxTokens: 500,
}; 