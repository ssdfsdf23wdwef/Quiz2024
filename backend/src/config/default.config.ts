/**
 * Varsayılan uygulama yapılandırması
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'default-jwt-secret-for-dev', 
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  firebase: {
    credentialsPath:
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      './secrets/firebase-service-account.json',
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET || 'my-app-71530.appspot.com',
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'gemini', // 'gemini' veya 'openai'
    apiKey: process.env.LLM_API_KEY || 'dummy-api-key',
    model: process.env.LLM_MODEL || 'gemini-1.0-pro',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1024', 10),
  },
  caching: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
  },
});
