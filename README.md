# AI Songwriting Assistant (LyricSmith)

A complete backend API system that generates original song lyrics using advanced AI. Create, refine, and perfect songs based on your desired genre, vibe, theme, and style.

🚀 Quick Start
Prerequisites
Node.js 18+
OpenAI or Anthropic API key
Installation

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
API Key Setup
Edit .env.local with your preferred AI provider:

OpenAI (Recommended):

LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here
Anthropic:

LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
Start the Server
npm run dev
Your API is now running at http://localhost:3000 🎉
Your front-end will be running at http://localhost:8080/

📝 Available Endpoints
Generate Song Lyrics
POST /api/generate-song

{
  "genre": "pop",
  "vibe": "romantic",
  "theme": "love",
  "style": "mid-tempo",
  "seedPhrase": "summer nights",
  "sections": ["verse1", "chorus", "bridge"]
}
Revise Lyrics
POST /api/revise

{
  "songId": "uuid-from-generation",
  "lyrics": {
    "verse1": "Current lyrics...",
    "chorus": "Current chorus..."
  },
  "revisionType": "section",
  "target": "chorus",
  "instruction": "Make it more catchy"
}
Get Music Suggestions
POST /api/suggest-music

{
  "lyrics": {"verse1": "Your lyrics..."},
  "genre": "pop",
  "vibe": "romantic"
}
Health Check
GET /api/health
🎵 Supported Parameters
Genres
pop - Catchy, mainstream, radio-friendly
rap - Strong rhythm, wordplay, punchlines
r&b - Smooth, soulful, emotional
country - Storytelling, acoustic, authentic
indie - Poetic, alternative, creative
rock - Powerful, guitar-driven, energetic

Vibes
sad - Soft, melancholic, longing
hype - Energetic, confident, celebratory
dreamy - Atmospheric, ethereal, gentle
aggressive - Sharp, confrontational, intense
romantic - Heartfelt, warm, intimate

Themes
love - Romance, relationships, connection
breakup - Heartbreak, moving on, loss
struggle - Overcoming obstacles, resilience
celebration - Joy, success, milestones
nostalgia - Memories, past, reflection

Both services offer free credits covering hundreds of song generations!

🛠️ Testing
Quick Test
# Test health (no API key needed)
curl http://localhost:3000/api/health

# Test song generation (requires API key)
curl -X POST http://localhost:3000/api/generate-song \
  -H "Content-Type: application/json" \
  -d '{"genre":"pop","vibe":"romantic","theme":"love"}'
Test Script
node test-api.js
📊 Response Examples
Song Generation Response
{
  "success": true,
  "data": {
    "songId": "uuid-here",
    "lyrics": {
      "verse1": "Under summer skies we dance...",
      "chorus": "Oh, these summer nights with you...",
      "bridge": "Time stands still when I'm with you..."
    },
    "metadata": {
      "genre": "pop",
      "vibe": "romantic",
      "theme": "love",
      "wordCount": 48,
      "estimatedDuration": "3:15"
    },
    "suggestions": {
      "bpm": 120,
      "key": "C",
      "chordProgression": "C-G-Am-F",
      "instrumentation": ["piano", "acoustic guitar"],
      "productionStyle": "intimate singer-songwriter"
    }
  }
}
🔒 Security Features
Rate Limiting: 10 requests per minute per IP
Input Validation: All requests validated with Zod schemas
CORS Protection: Configurable origin restrictions
Security Headers: XSS, CSRF, and content-type protection
Error Handling: Structured error responses
🗄️ Database
SQLite: Local database for session persistence
Automatic Setup: Database created automatically on first run
Tables: Songs, revisions, and usage tracking
Data Storage: Lyrics, metadata, revision history

🚀 Deployment
Production Build
npm run build
npm start

🎯 What You Can Build
Web Apps: React, Vue, Angular frontends
Mobile Apps: React Native or native applications
Desktop Apps: Electron applications
Chatbots: Discord, Telegram, Slack bots
Browser Extensions: Songwriting assistants
Webhooks: Real-time song generation
SaaS Platforms: Multi-user songwriting services

🎨 Example Use Cases
Musician
"I'm stuck on a chorus for my pop song about heartbreak. Can you help me make it more emotional?"

Producer
"Generate indie rock lyrics with a dreamy vibe about nostalgia, and suggest instrumentation."

Songwriter
"Here's my verse about new beginnings. Can you revise the second half to be more hopeful and suggest a fitting chord progression?"

Hobbyist
"I want to write a rap about overcoming challenges with an aggressive, motivational vibe. Give me lyrics and music suggestions."

🐛 Troubleshooting
Common Issues
Build fails: Run npm install to ensure all dependencies are installed
API errors: Check your API key is correctly set in .env.local
Rate limiting: Wait a minute between requests if hitting limits
Database errors: Ensure the data/ directory exists and is writable
Health Check
Always check /api/health first:

curl http://localhost:3000/api/health
🔧 Configuration Options
All settings are configurable via environment variables in .env.local:

# AI Provider
LLM_PROVIDER=openai                    # or "anthropic"
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60

# Security
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=./data/lyricsmith.db
📄 License
MIT License - Free for commercial and personal use.

🤝 Contributing
Pull requests welcome! This is an open-source project for the music community.

🎵 Ready to Create Amazing Songs?
Get an API key from OpenAI or Anthropic
Set up the environment as shown above
Start creating! Your AI songwriting assistant is ready
Happy songwriting! 🎤✨
