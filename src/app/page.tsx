'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { MessageBubble } from '@/components/MessageBubble'
import 'highlight.js/styles/github-dark.css'

// UI constants
const ANIMATION_DELAY_1 = '0.1s';
const ANIMATION_DELAY_2 = '0.2s';
const MAX_MESSAGE_WIDTH_PERCENT = 70;

// Markdown styling constants
const MARKDOWN_PROSE_CLASSES = `
  prose prose-invert prose-sm max-w-none
  prose-headings:text-slate-100 prose-headings:font-semibold
  prose-p:text-slate-200 prose-p:leading-relaxed
  prose-strong:text-slate-100 prose-strong:font-semibold
  prose-code:text-slate-200 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700
  prose-blockquote:text-slate-300 prose-blockquote:border-l-slate-500
  prose-ul:text-slate-200 prose-ol:text-slate-200
  prose-li:text-slate-200
  prose-table:text-slate-200
  prose-th:text-slate-100 prose-th:bg-slate-800
  prose-td:text-slate-200 prose-td:border-slate-700
`.trim();

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  reasoning?: string
  tokensUsed?: number
  processingTime?: number
  timestamp?: string
}

interface ChatApiResponse {
  content: string
  model: string
  reasoning: string
  tokensUsed?: number
  processingTime: number
  timestamp: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `# 🤖 Intelligent LLM Router

Hello! I'm an intelligent LLM router that automatically selects the best AI model for your questions.
## What I can help with:
- **Coding**: Programming problems, debugging, code review
- **Reasoning**: Complex analysis, problem-solving, mathematics
- **Creative Writing**: Stories, content creation, brainstorming
- **General Questions**: Any topic you need help with`
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const MESSAGE_STYLES = {
    user: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/25',
    assistant: 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-100 shadow-slate-500/25',
    loading: 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-100 shadow-slate-500/25'
  } as const

  /**
   * Creates a new message object with a unique ID
   */
  const createMessage = (content: string, role: 'user' | 'assistant'): Message => ({
    id: Date.now().toString(),
    role,
    content
  })

  /**
   * Calls the intelligent LLM router API
   */
  const callChatAPI = async (userMessage: string): Promise<ChatApiResponse> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
  }

  const validateAndPrepareUserMessage = (): string | null => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) {
      return null
    }
    return trimmedInput
  }

  const sendUserMessage = (userMessage: string) => {
    const userMessageObj = createMessage(userMessage, 'user')
    addMessage(userMessageObj)
    setInput('')
    setIsLoading(true)
  }

  /**
   * Handles AI response from the intelligent router
   * @param userMessage - The user's message to respond to
   */
  const handleAiResponse = async (userMessage: string) => {
    try {
      const apiResponse = await callChatAPI(userMessage);

      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: apiResponse.content,
        model: apiResponse.model,
        reasoning: apiResponse.reasoning,
        tokensUsed: apiResponse.tokensUsed,
        processingTime: apiResponse.processingTime,
        timestamp: apiResponse.timestamp
      };

      addMessage(aiMessage);
    } catch (error) {
      console.error('API call failed:', error);

      // Create error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        model: 'Error',
        reasoning: 'API call failed'
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendMessage = async () => {
    const userMessage = validateAndPrepareUserMessage()
    if (!userMessage) return

    sendUserMessage(userMessage)
    handleAiResponse(userMessage)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Centered container for desktop */}
      <div className="flex flex-col w-full max-w-4xl mx-auto bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-x border-slate-700/50">
        {/* Header */}
        <div className="border-b border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm">
          <h1 className="text-xl font-semibold text-slate-100">Chat</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-slate-900/20">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              maxWidthPercent={MAX_MESSAGE_WIDTH_PERCENT}
              markdownClasses={MARKDOWN_PROSE_CLASSES}
            />
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`${MESSAGE_STYLES.loading} rounded-lg p-3 shadow-lg`} style={{ maxWidth: `${MAX_MESSAGE_WIDTH_PERCENT}%` }}>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: ANIMATION_DELAY_1}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: ANIMATION_DELAY_2}}></div>
                  </div>
                  <span className="text-sm text-slate-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isLoading ? "AI is responding..." : "Type your message..."}
              disabled={isLoading}
              className="flex-1 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 disabled:opacity-50"
            />
            <Button 
              onClick={handleSendMessage} 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
