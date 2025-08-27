# CTC Sandbox
Isolated site for testing features without touching the locked live site.

## Env vars (Netlify)
- OPENAI_API_KEY = sk-proj-...
- MEMBER_PASSES = ["starter-111","pro-222","elite-333","elite-444"]

## Function
- /.netlify/functions/assistant
Authorization: Bearer <your pass>
Body: { "q": "your question" }
