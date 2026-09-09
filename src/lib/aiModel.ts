// Single source of truth for the Groq model, shared by /api/chat,
// /api/search-ai, and /api/health. Keeping it here means the health check
// verifies the exact model the live routes call — Groq retires models on a
// schedule (llama-3.3-70b-versatile went away on 2026-08-16 and both AI
// features started 404ing), and a health check against a hardcoded copy of
// the name would happily pass while the real routes were broken.
export const GROQ_MODEL = "openai/gpt-oss-120b";
