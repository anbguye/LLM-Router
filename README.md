# 🤖 Intelligent LLM Router

An intelligent chat application that automatically routes user queries to the most appropriate AI model from a pool of 12+ free models available through OpenRouter. The system analyzes user input, considers context requirements, and selects the optimal model for each task while respecting rate limits.

## ✨ Features

- **🧠 Intelligent Model Selection**: Automatically chooses the best AI model based on:
  - Task type (coding, reasoning, creative writing, analysis)
  - Context requirements and message complexity
  - Model strengths and capabilities
  - Response speed vs. quality balance

- **⚙️ Customizable Routing Preferences**: Users can set priorities for:
  - **Latency**: Prioritize response speed
  - **Quality**: Maximize response quality
  - **Balanced**: Optimal speed/quality trade-off

- **📊 Transparent Routing**: Shows users which model was selected and why
- **📈 Analytics & Monitoring**: Track routing decisions and model usage patterns
- **⚡ Rate Limit Management**: Handles OpenRouter's 20 requests/minute limit with intelligent fallbacks
- **🎨 Rich Markdown Support**: Full markdown rendering with syntax highlighting for code blocks
- **📊 Performance Metrics**: Displays processing time and token usage
- **🛡️ Robust Error Handling**: Multiple fallback strategies ensure reliability
- **🎯 Model Pool**: Access to 12+ free models from providers like DeepSeek, Meta, Google, Qwen, and more

- **🎪 Advanced Modal System**: Professional modal implementation with:
  - **Scroll-Following**: Modal stays perfectly centered while scrolling
  - **Click-Outside-to-Close**: Intuitive dismissal by clicking backdrop
  - **Viewport-Based Positioning**: Always centered relative to user's screen
  - **Smooth Animations**: Professional transitions and interactions
  - **Accessibility**: Full keyboard and screen reader support

## 🚀 Tech Stack

- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[OpenRouter API](https://openrouter.ai)** - Unified access to multiple LLM providers
- **[React Markdown](https://github.com/remarkjs/react-markdown)** - Markdown rendering
- **[Shadcn UI](https://ui.shadcn.com/)** - Modern component library
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first styling
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Highlight.js](https://highlightjs.org/)** - Code syntax highlighting

## 🏁 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- OpenRouter API key (free at [openrouter.ai](https://openrouter.ai))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/anbguye/Intelligent-LLM-Router.git
cd Intelligent-LLM-Router
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

Get your free API key from [OpenRouter](https://openrouter.ai/keys).

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3001](http://localhost:3001) to start chatting!

## 🎯 How It Works

### Intelligent Routing Process

1. **Input Analysis**: Fast router model analyzes your message
2. **Model Selection**: Chooses optimal model from available pool
3. **API Call**: Routes request to selected model via OpenRouter
4. **Response Processing**: Formats response with routing metadata
5. **Display**: Shows beautifully formatted response with model info

### Available Models

The router intelligently selects from these free models:

| Category | Example Models | Best For |
|----------|----------------|----------|
| **Coding** | Qwen3 Coder, DeepCoder | Programming, debugging, code review |
| **Reasoning** | DeepSeek R1, Qwen3 235B | Complex analysis, mathematics |
| **Creative** | Llama 3.3 70B, Mistral Small | Writing, brainstorming, content creation |
| **General** | Mistral Small 3.2, DeepSeek V3 | Everyday questions, explanations |
| **Analysis** | Gemini 2.5 Pro, Qwen3 235B | Long documents, research, complex tasks |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/chat/
│   │   └── route.ts          # Main chat API endpoint
│   ├── page.tsx              # Main chat interface with advanced modal system
│   └── layout.tsx            # App layout
├── components/
│   ├── ui/                   # Shadcn UI components
│   └── MessageBubble.tsx     # Message rendering component
├── config/
│   └── models.ts             # Model configurations
├── utils/
│   ├── router.ts             # Core routing logic
│   ├── rateLimiter.ts        # Rate limiting system
│   └── logger.ts             # Logging utility
└── lib/
    └── utils.ts              # Utility functions
```

## 🎪 Advanced Modal System

The application features a sophisticated modal implementation with enterprise-level best practices:

### Key Features
- **Scroll-Following Positioning**: Modal dynamically repositions to stay centered during scrolling
- **Click-Outside-to-Close**: Intuitive dismissal by clicking the backdrop
- **Viewport-Based Centering**: Always perfectly centered relative to user's visible screen
- **Performance Optimized**: Uses passive event listeners and efficient DOM updates

### Technical Implementation
- **Custom Hook**: `useModalScrollPositioning` for reusable modal logic
- **Named Constants**: All magic numbers replaced with descriptive constants
- **Type Safety**: Full TypeScript support with proper null handling
- **Memory Management**: Proper cleanup of event listeners to prevent leaks

### Code Quality Standards
- **DRY Principles**: No code duplication, reusable components
- **Single Responsibility**: Each function has one clear purpose
- **Clear Naming**: Self-documenting function and variable names
- **Comprehensive Documentation**: JSDoc comments and inline explanations
- **Security First**: Input validation and secure event handling

## 🔧 API Reference

### POST `/api/chat`
Send a message to be intelligently routed to the best AI model.

**Request Body:**
```json
{
  "message": "Your question or prompt here"
}
```

**Response:**
```json
{
  "content": "AI response with full markdown formatting",
  "model": "Selected model name",
  "reasoning": "Why this model was chosen",
  "tokensUsed": 150,
  "processingTime": 1250,
  "timestamp": "2025-01-04T20:30:00.000Z"
}
```

### GET `/api/chat`
Get router status and current rate limit information.

**Response:**
```json
{
  "status": "operational",
  "rateLimit": {
    "currentCount": 5,
    "maxRequests": 20,
    "timeUntilReset": 45000,
    "isLimited": false
  },
  "availableModels": 12,
  "routerModel": "Mistral Small 3"
}
```

### Preferences API

#### GET `/api/preferences?userId=default`
Get user routing preferences.

**Response:**
```json
{
  "userId": "default",
  "preferences": {
    "priority": "balanced",
    "maxLatency": 5000,
    "minQuality": 0.7,
    "allowedCategories": [],
    "excludedModels": []
  },
  "timestamp": "2025-01-04T20:30:00.000Z"
}
```

#### POST `/api/preferences`
Set user routing preferences.

**Request Body:**
```json
{
  "userId": "default",
  "preferences": {
    "priority": "quality",
    "maxLatency": 3000,
    "allowedCategories": ["coding", "reasoning"]
  }
}
```

#### DELETE `/api/preferences?userId=default`
Reset user preferences to defaults.

### Analytics API

#### GET `/api/analytics?type=summary`
Get analytics summary data.

**Query Parameters:**
- `type`: `summary` | `full` | `usage` | `preferences`

**Response:**
```json
{
  "type": "summary",
  "data": {
    "totalRequests": 150,
    "mostUsedModel": { "model": "qwen/qwen3-coder:free", "count": 45 },
    "mostUsedCategory": { "category": "coding", "count": 67 },
    "averageProcessingTime": 1250,
    "totalTokensUsed": 25000,
    "recentDecisions": [...]
  },
  "timestamp": "2025-01-04T20:30:00.000Z"
}
```

#### DELETE `/api/analytics`
Reset all analytics data.

## 💡 Usage Examples

### Coding Questions
```
User: "How do I solve the Two Sum problem on LeetCode?"
Router: Selects Qwen3 Coder (specialized for programming)
Response: Formatted code solution with syntax highlighting
```

### Complex Reasoning
```
User: "Explain quantum computing in simple terms"
Router: Selects DeepSeek R1 (excellent for explanations)
Response: Clear, structured explanation with examples
```

### Creative Writing
```
User: "Write a short story about AI taking over the world"
Router: Selects Llama 3.3 70B (creative writing specialist)
Response: Engaging story with proper formatting
```

## 🔒 Security & Rate Limiting

- **Rate Limiting**: 20 requests/minute across all models (OpenRouter limit)
- **Input Validation**: Message length limits and sanitization
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **API Security**: Keys secured via environment variables
- **Request Monitoring**: Comprehensive logging for debugging

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add `OPENROUTER_API_KEY` environment variable
4. Deploy!

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- Self-hosted with Docker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) for providing unified access to multiple LLM providers
- [Vercel](https://vercel.com) for hosting infrastructure
- [Shadcn](https://ui.shadcn.com) for beautiful UI components
- All the open-source LLM providers making this possible

## 🚀 Future Enhancements

### Planned Features
- [ ] **Multi-line Message Support**: Hold Shift+Enter to create line breaks in messages (like Discord/Slack)
- [ ] **Message History**: Save and browse previous conversations
- [ ] **Model Comparison**: Side-by-side comparison of different model responses
- [ ] **Custom Model Weights**: User-defined scoring for model preferences
- [ ] **Voice Input**: Speech-to-text for hands-free interaction
- [ ] **Export Conversations**: Save chats as markdown or PDF
- [ ] **Dark/Light Theme Toggle**: Complete theme system
- [ ] **Keyboard Shortcuts**: Full keyboard navigation support

### Technical Improvements
- [ ] **Real-time Collaboration**: Multi-user chat sessions
- [ ] **Offline Mode**: Queue messages for later when offline
- [ ] **Advanced Analytics**: Detailed usage statistics and trends
- [ ] **Plugin System**: Extensible architecture for custom features
- [ ] **Mobile Optimization**: Native mobile app versions
- [ ] **API Rate Limiting**: Per-user rate limiting and usage tracking

---

**Try it out!** Ask the router anything and watch it intelligently select the perfect model for your question. The system learns from each interaction to make better routing decisions over time.
