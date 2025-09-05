'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, Settings, X } from 'lucide-react'
import { MessageBubble } from '@/components/MessageBubble'
import 'highlight.js/styles/github-dark.css'

// UI constants
const ANIMATION_DELAY_1 = '0.1s';
const ANIMATION_DELAY_2 = '0.2s';
const MAX_MESSAGE_WIDTH_PERCENT = 70;

// Modal positioning constants
const MODAL_MAX_HEIGHT = '80vh';
const MODAL_CENTERING_OFFSET = 10;
const MODAL_VIEWPORT_PADDING = 30;
const MODAL_RENDER_DELAY = 10;

// Settings constants
const SETTINGS_TAB_HEIGHT = '300px';
const AUTO_RESET_DELAY_MS = 2000;

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

interface PreferencesData {
  priority: string;
  allowedCategories: string[];
  excludedModels: string[];
}

interface RecentDecision {
  userMessage?: string;
  selectedModel?: string;
  timestamp?: string;
  category?: string;
}

interface AnalyticsData {
  totalRequests: number;
  mostUsedModel: { model: string; count: number } | null;
  mostUsedCategory: { category: string; count: number } | null;
  averageProcessingTime: number;
  totalTokensUsed: number;
  recentDecisions: RecentDecision[];
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
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<PreferencesData>({
    priority: 'auto',
    allowedCategories: [],
    excludedModels: []
  })
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRequests: 0,
    mostUsedModel: null,
    mostUsedCategory: null,
    averageProcessingTime: 0,
    totalTokensUsed: 0,
    recentDecisions: []
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'confirm' | 'saving' | 'saved'>('idle')
  const [resetStatus, setResetStatus] = useState<'idle' | 'confirm' | 'resetting' | 'reset'>('idle')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

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
      body: JSON.stringify({
        message: userMessage,
        userId: 'default' // Pass user ID so router can use preferences
      }),
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

  /**
   * Handle save preferences immediately without confirmation
   */
  const handleSavePreferences = async () => {
    setSaveStatus('saving');

    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'default',
          preferences
        }),
      });

      if (response.ok) {
        // Reload preferences to confirm save
        await loadPreferences();
        setSaveStatus('saved');

        // Reset to idle after delay
        setTimeout(() => {
          setSaveStatus('idle');
        }, AUTO_RESET_DELAY_MS);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveStatus('idle'); // Reset on error
    }
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

  /**
   * Load user preferences from API
   */
  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  /**
   * Load analytics data from API
   */
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics?type=summary');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }



  /**
   * Handle reset preferences with double-click mechanism
   */
  const handleResetPreferences = async () => {
    if (resetStatus === 'idle') {
      // First click - show confirm
      setResetStatus('confirm');

      // Auto-reset to idle after delay if not clicked again
      setTimeout(() => {
        setResetStatus((currentStatus) => {
          return currentStatus === 'confirm' ? 'idle' : currentStatus;
        });
      }, AUTO_RESET_DELAY_MS);

      return;
    }

    if (resetStatus === 'confirm') {
      // Second click - reset
      setResetStatus('resetting');

      try {
        const response = await fetch('/api/preferences?userId=default', {
          method: 'DELETE',
        });

        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
          setResetStatus('reset');

          // Reset to idle after delay
          setTimeout(() => {
            setResetStatus('idle');
          }, AUTO_RESET_DELAY_MS);
        } else {
          throw new Error('Failed to reset preferences');
        }
      } catch (error) {
        console.error('Failed to reset preferences:', error);
        setResetStatus('idle'); // Reset on error
      }
    }
  }

  /**
   * Custom hook for modal scroll positioning
   * Handles dynamic modal positioning that follows user scroll
   * @param modalRef - Reference to the modal element
   * @param isVisible - Whether the modal is currently visible
   */
  const useModalScrollPositioning = (modalRef: React.RefObject<HTMLDivElement | null>, isVisible: boolean) => {
    useEffect(() => {
      if (!isVisible || !modalRef.current) return;

      /**
       * Calculates and applies the optimal modal position based on current scroll
       * Ensures modal stays centered in viewport while following scroll movement
       */
      const updateModalPosition = () => {
        if (!modalRef.current) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const viewportHeight = window.innerHeight;
        const modalHeight = modalRef.current.offsetHeight;

        // Calculate centered position: scroll position + (viewport height - modal height) / 2
        let newTop = scrollTop + (viewportHeight - modalHeight) / 2;

        // Apply fine-tuning offset for perfect centering
        newTop += MODAL_CENTERING_OFFSET;

        // Constrain modal within viewport boundaries
        const minTop = scrollTop + MODAL_VIEWPORT_PADDING;
        const maxTop = scrollTop + viewportHeight - modalHeight - MODAL_VIEWPORT_PADDING;

        newTop = Math.max(minTop, Math.min(maxTop, newTop));

        modalRef.current.style.top = `${newTop}px`;
      };

      // Delay initial positioning to ensure modal is fully rendered
      const timeoutId = setTimeout(updateModalPosition, MODAL_RENDER_DELAY);

      // Attach scroll listener for dynamic repositioning
      window.addEventListener('scroll', updateModalPosition, { passive: true });

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updateModalPosition);
      };
    }, [isVisible, modalRef]);
  };

  // Apply modal scroll positioning
  useModalScrollPositioning(modalRef, showSettings);

  /**
   * Get routing weight percentage for display
   * @param weightType - Either 'latency' or 'quality'
   * @param priority - The current routing priority
   * @returns Weight percentage as number
   */
  const getRoutingWeight = (weightType: 'latency' | 'quality', priority: string): number => {
    const weights = {
      auto: { latency: 50, quality: 50 },
      latency: { latency: 80, quality: 20 },
      quality: { latency: 20, quality: 80 },
      balanced: { latency: 50, quality: 50 }
    };

    return weights[priority as keyof typeof weights]?.[weightType] || 50;
  };

  /**
   * Load data when settings panel opens
   */
  useEffect(() => {
    if (showSettings) {
      loadPreferences();
      loadAnalytics();
    }
  }, [showSettings]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Centered container for desktop */}
      <div className="flex flex-col w-full max-w-4xl mx-auto bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-x border-slate-700/50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 border-b border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-100">Chat</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700/50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Messages - Scrollable area */}
        <div
          data-messages-container
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-slate-900/20 min-h-0"
        >
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

          {/* Invisible element for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Sticky Input Bar */}
        <div className="sticky bottom-0 z-10 border-t border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm">
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

        {/* Settings Panel */}
        {showSettings && (
          <>
            {/* Backdrop - Click to close */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={() => setShowSettings(false)}
            />

            {/* Modal */}
            <div
              ref={modalRef}
              className="fixed z-[101] w-full max-w-2xl"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxHeight: MODAL_MAX_HEIGHT
              }}
              onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking modal
            >
              <Card className="w-full h-full max-h-[80vh] overflow-hidden bg-slate-900 border-slate-700 flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 border-b border-slate-700">
                  <CardTitle className="text-slate-100 text-lg font-semibold">Router Settings</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full p-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6">
                  <Tabs defaultValue="preferences" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preferences">Preferences</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preferences" className="space-y-4" style={{ height: SETTINGS_TAB_HEIGHT }}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="priority" className="text-slate-200">Routing Priority</Label>
                          <Select value={preferences.priority} onValueChange={(value) => setPreferences({...preferences, priority: value})}>
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                              <SelectValue>
                                {preferences.priority === 'auto' && 'Auto (Let Router Decide)'}
                                {preferences.priority === 'latency' && 'Latency (Fastest Response)'}
                                {preferences.priority === 'quality' && 'Quality (Best Response)'}
                                {preferences.priority === 'balanced' && 'Balanced (Speed & Quality)'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto (Let Router Decide)</SelectItem>
                              <SelectItem value="latency">Latency (Fastest Response)</SelectItem>
                              <SelectItem value="quality">Quality (Best Response)</SelectItem>
                              <SelectItem value="balanced">Balanced (Speed & Quality)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-slate-200">Current Routing Settings</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 border border-slate-600 rounded-md p-3">
                              <div className="text-xs text-slate-400 mb-1">Latency Weight</div>
                              <div className="text-lg font-semibold text-slate-200">
                                {getRoutingWeight('latency', preferences.priority)}%
                              </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-600 rounded-md p-3">
                              <div className="text-xs text-slate-400 mb-1">Quality Weight</div>
                              <div className="text-lg font-semibold text-slate-200">
                                {getRoutingWeight('quality', preferences.priority)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <Button
                            onClick={handleSavePreferences}
                            disabled={saveStatus === 'saving'}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                          >
                            {saveStatus === 'idle' && 'Save Preferences'}
                            {saveStatus === 'confirm' && 'Confirm'}
                            {saveStatus === 'saving' && 'Saving...'}
                            {saveStatus === 'saved' && 'Saved ✓'}
                          </Button>
                          <Button
                            onClick={handleResetPreferences}
                            disabled={resetStatus === 'resetting'}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600 font-medium"
                          >
                            {resetStatus === 'idle' && 'Reset to Default'}
                            {resetStatus === 'confirm' && 'Confirm'}
                            {resetStatus === 'resetting' && 'Resetting...'}
                            {resetStatus === 'reset' && 'Reset ✓'}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4" style={{ height: SETTINGS_TAB_HEIGHT }}>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-slate-800 border-slate-700">
                          <CardContent className="p-2 text-center">
                            <div className="text-lg text-slate-100">{analytics.totalRequests}</div>
                            <div className="text-sm text-slate-400">Total Requests</div>
                          </CardContent>
                        </Card>

                        <Card className="bg-slate-800 border-slate-700">
                          <CardContent className="p-2 text-center">
                            <div className="text-lg text-slate-100">{Math.round(analytics.averageProcessingTime)}ms</div>
                            <div className="text-sm text-slate-400">Avg Response Time</div>
                          </CardContent>
                        </Card>

                        <Card className="bg-slate-800 border-slate-700">
                          <CardContent className="p-2 text-center">
                            <div className="text-lg text-slate-100">{analytics.totalTokensUsed.toLocaleString()}</div>
                            <div className="text-sm text-slate-400">Total Tokens Used</div>
                          </CardContent>
                        </Card>

                        <Card className="bg-slate-800 border-slate-700">
                          <CardContent className="p-2 text-center">
                            <div className="text-lg text-slate-100">
                              {analytics.mostUsedModel?.model.split('/').pop() || 'N/A'}
                            </div>
                            <div className="text-sm text-slate-400">Most Used Model</div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-slate-100">Recent Routing Decisions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-28 overflow-y-auto">
                            {analytics.recentDecisions.slice(0, 5).map((decision: RecentDecision, index: number) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-slate-700/50 rounded">
                                <div className="text-sm text-slate-200 truncate flex-1">
                                  {decision.userMessage?.substring(0, 50)}...
                                </div>
                                <Badge variant="secondary" className="ml-2 text-xs text-slate-200">
                                  {decision.selectedModel?.split('/').pop()}
                                </Badge>
                              </div>
                            ))}
                            {analytics.recentDecisions.length === 0 && (
                              <div className="text-sm text-slate-400 text-center py-4">
                                No routing decisions yet
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
