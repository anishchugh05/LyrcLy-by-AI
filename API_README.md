# LyricSmith API - Backend Implementation

Complete backend API system for AI-powered songwriting assistance using OpenAI/Anthropic LLM APIs.

## 🎯 Features Implemented

### Core API Endpoints
- **POST /api/generate-song** - Generate original song lyrics based on genre, vibe, and theme
- **POST /api/revise** - Revise specific sections of existing lyrics
- **POST /api/suggest-music** - Generate musical suggestions for lyrics
- **GET /api/health** - System health check and status

### Infrastructure Components
- **SQLite Database** - Session persistence and rate limiting
- **Rate Limiting** - 10 requests per minute per IP
- **Request Validation** - Zod schemas for type safety
- **CORS Protection** - Configurable origin restrictions
- **Error Handling** - Structured error responses
- **Security Headers** - XSS, CSRF, and content type protection

### LLM Integration
- **Multi-Provider Support** - OpenAI GPT-4o-mini and Anthropic Claude 3.5 Sonnet
- **Fallback Mechanisms** - Graceful degradation when services unavailable
- **Genre-Specific Prompts** - Tailored to musical conventions
- **Structured Output** - JSON responses with validation

## 🚀 Quick Start

### 1. Environment Setup
Copy `.env.example` to `.env.local` and configure your API keys:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Choose your LLM provider
LLM_PROVIDER=openai                    # or "anthropic"

# Add your API keys
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Database (automatically created)
DATABASE_URL=./data/lyricsmith.db

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
```

### 2. Installation & Build
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Generate Song Lyrics
**POST /api/generate-song**

```json
{
  "genre": "pop",
  "vibe": "romantic",
  "theme": "love",
  "style": "mid-tempo",
  "seedPhrase": "endless summer nights",
  "sections": ["verse1", "chorus", "bridge"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "songId": "uuid-here",
    "lyrics": {
      "verse1": "First verse lyrics...",
      "chorus": "Chorus lyrics...",
      "bridge": "Bridge lyrics..."
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
      "instrumentation": ["piano", "acoustic guitar", "bass"],
      "productionStyle": "intimate singer-songwriter"
    }
  }
}
```

### Revise Lyrics
**POST /api/revise**

```json
{
  "songId": "uuid-from-generation",
  "lyrics": {
    "verse1": "Current verse lyrics...",
    "chorus": "Current chorus lyrics..."
  },
  "revisionType": "section",
  "target": "chorus",
  "instruction": "Make the chorus more catchy and memorable",
  "preserveStructure": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revisedLyrics": {
      "chorus": "Revised chorus lyrics..."
    },
    "fullLyrics": {
      "verse1": "Current verse lyrics...",
      "chorus": "Revised chorus lyrics..."
    },
    "changes": ["Enhanced rhyme scheme", "Added melodic hook"],
    "revisionId": "new-uuid"
  }
}
```

### Get Music Suggestions
**POST /api/suggest-music**

```json
{
  "lyrics": {
    "verse1": "Your lyrics here...",
    "chorus": "Chorus lyrics..."
  },
  "genre": "pop",
  "vibe": "romantic",
  "preferences": {
    "tempo": "mid",
    "complexity": "moderate",
    "instruments": ["piano", "guitar"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tempo": {
      "bpm": 115,
      "description": "Moderate tempo matching the romantic feel"
    },
    "key": {
      "major": "C",
      "relativeMinor": "Am",
      "reasoning": "C major suits the uplifting tone"
    },
    "chordProgression": {
      "progression": ["C", "G", "Am", "F"],
      "complexity": "moderate",
      "alternatives": ["Am", "F", "C", "G"]
    },
    "instrumentation": {
      "primary": ["piano", "acoustic guitar", "bass"],
      "secondary": ["strings", "light percussion"],
      "texture": "warm and intimate"
    },
    "production": {
      "style": "singer-songwriter with clean vocals",
      "effects": ["subtle reverb", "warm compression"],
      "arrangement": "focus on lyrics with minimal production"
    }
  }
}
```

## 🎛️ Supported Parameters

### Genres
- `pop` - Catchy melodies, relatable lyrics, AABB rhyme
- `rap` - Strong rhythm, internal rhymes, wordplay
- `r&b` - Smooth, emotional, soulful progressions
- `country` - Storytelling, imagery, acoustic elements
- `indie` - Poetic, metaphors, unconventional structure
- `rock` - Powerful themes, driving rhythm, guitar-based

### Vibes
- `sad` - Soft words, longing, minor imagery
- `hype` - Energetic verbs, confidence, punchy flow
- `dreamy` - Soft imagery, atmospheric, ethereal
- `aggressive` - Sharp rhythm, confrontation, power
- `romantic` - Heartfelt emotions, intimate, warm

### Themes
- `love` - Romantic relationships, emotions
- `breakup` - Heartbreak, moving on, loss
- `struggle` - Overcoming obstacles, resilience
- `celebration` - Joy, success, milestones
- `nostalgia` - Memories, past, reflection

## 🛡️ Security & Performance

### Rate Limiting
- **Default**: 10 requests per minute per IP
- **Configurable**: Via `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW`
- **Storage**: SQLite database with automatic cleanup

### Validation
- **Request schemas** using Zod for type safety
- **Input sanitization** for all user data
- **Error handling** with structured responses

### Headers & CORS
- **CORS**: Configurable via `CORS_ORIGIN`
- **Security**: X-Content-Type-Options, X-Frame-Options, XSS Protection
- **Cache**: No-store for API responses

## 📊 Monitoring

### Health Check
**GET /api/health** - Returns system status:
- Database connectivity
- LLM service configuration
- Usage statistics
- Environment validation

### Database Schema
```sql
-- Songs table
CREATE TABLE songs (
  id TEXT PRIMARY KEY,
  genre TEXT NOT NULL,
  vibe TEXT NOT NULL,
  theme TEXT NOT NULL,
  lyrics_json TEXT NOT NULL,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Revisions table
CREATE TABLE revisions (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL,
  revision_type TEXT NOT NULL,
  instruction TEXT NOT NULL,
  old_lyrics TEXT NOT NULL,
  new_lyrics TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (song_id) REFERENCES songs(id)
);

-- Usage tracking
CREATE TABLE api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Testing

Run the built-in test script:
```bash
# Start the server first
npm run dev

# In another terminal, run tests
node test-api.js
```

The test script verifies:
- ✅ API endpoint structure
- ✅ Request/response validation
- ✅ Error handling
- ✅ Database connectivity

## 🔧 Development

### Project Structure
```
src/
├── app/api/                 # API routes
│   ├── generate-song/       # POST /api/generate-song
│   ├── revise/             # POST /api/revise
│   ├── suggest-music/      # POST /api/suggest-music
│   └── health/             # GET /api/health
├── lib/                    # Core services
│   ├── database.ts         # SQLite database service
│   ├── llm-service.ts      # LLM integration
│   ├── middleware.ts       # Rate limiting & validation
│   └── types/              # TypeScript definitions
└── types/index.ts          # API types & schemas
```

### Extending the API
1. **Add new endpoints** in `src/app/api/`
2. **Define schemas** in `src/types/index.ts`
3. **Use middleware** for validation and rate limiting
4. **Update database** schema if needed

### Environment Variables
See `.env.example` for all available configuration options.

## 📝 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "details": { /* optional error details */ }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid request data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SONG_NOT_FOUND` - Invalid song ID
- `AI_SERVICE_ERROR` - LLM API configuration issue
- `INTERNAL_ERROR` - Server-side error

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
LLM_PROVIDER=openai
OPENAI_API_KEY=your_production_key
DATABASE_URL=/app/data/lyricsmith.db
CORS_ORIGIN=https://yourdomain.com
```

### Database Considerations
- SQLite is suitable for MVP/small scale
- Consider PostgreSQL for larger scale
- Regular backups recommended
- Monitor database size and performance

### Monitoring
- Set up health check monitoring
- Track API usage and rate limits
- Monitor LLM API costs and quotas
- Log errors for debugging

## 🎵 What's Next?

This backend provides a complete foundation for:

1. **Frontend Integration** - React/Vue/Angular apps
2. **Mobile Apps** - React Native or native applications
3. **Webhooks** - Real-time song generation
4. **User Accounts** - Authentication and personal libraries
5. **Collaboration** - Multi-user songwriting sessions
6. **Advanced Features** - Audio generation, melody creation

The API is production-ready and can handle thousands of song generation requests with proper scaling.

---

**Built with ❤️ for songwriters and musicians**