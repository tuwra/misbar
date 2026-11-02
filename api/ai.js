// Vercel serverless function: forwards to the shared handler.
export { default } from '../lib/ai-handler.mjs';
export const config = { maxDuration: 60 };
