'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! How can I help you today?'
    },
    {
      id: '2',
      role: 'user',
      content: 'I need help with implementing a chat UI.'
    },
    {
      id: '3',
      role: 'assistant',
      content: 'I can help you with that! What specific features are you looking for in your chat interface?'
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
   * Generates a random dummy response for testing purposes
   * Includes the user's message in the response for context
   */
  const generateDummyResponse = (userMessage: string): string => {
    const responses = [
      "I understand you're asking about: \"" + userMessage + "\". This is a placeholder response for testing purposes.",
      "Thanks for your message: \"" + userMessage + "\". I'm currently in testing mode and will provide a simulated response.",
      "Your input: \"" + userMessage + "\" has been received. This is a dummy AI response to test the chat functionality.",
      "Processing your message: \"" + userMessage + "\". Here's a placeholder response while the AI system is being developed.",
      "Message received: \"" + userMessage + "\". This is a test response to verify the chat interface is working correctly."
    ]
    return responses[Math.floor(Math.random() * responses.length)]
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
   * Simulates an AI response with a random delay to mimic real API behavior
   * @param userMessage - The user's message to respond to
   */
  const simulateAiResponse = (userMessage: string) => {
    const delay = 1000 + Math.random() * 2000 // Random delay between 1-3 seconds

    setTimeout(() => {
      const aiResponse = createMessage(generateDummyResponse(userMessage), 'assistant')
      addMessage(aiResponse)
      setIsLoading(false)
    }, delay)
  }

  const handleSendMessage = async () => {
    const userMessage = validateAndPrepareUserMessage()
    if (!userMessage) return

    sendUserMessage(userMessage)
    simulateAiResponse(userMessage)
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
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 shadow-lg ${
                  message.role === 'user' ? MESSAGE_STYLES.user : MESSAGE_STYLES.assistant
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`${MESSAGE_STYLES.loading} rounded-lg p-3 shadow-lg max-w-[70%]`}>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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