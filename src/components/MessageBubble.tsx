import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Clock, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  reasoning?: string;
  tokensUsed?: number;
  processingTime?: number;
  timestamp?: string;
}

interface MessageBubbleProps {
  message: Message;
  maxWidthPercent: number;
  markdownClasses: string;
}

/**
 * Component for rendering individual chat messages with proper formatting
 * Handles both user and assistant messages with appropriate styling
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  maxWidthPercent,
  markdownClasses
}) => {
  const MESSAGE_STYLES = {
    user: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/25',
    assistant: 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-100 shadow-slate-500/25',
  } as const;

  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className="flex flex-col space-y-2"
        style={{ maxWidth: `${maxWidthPercent}%` }}
      >
        {/* Main message content */}
        <div
          className={`rounded-lg p-3 shadow-lg ${
            message.role === 'user' ? MESSAGE_STYLES.user : MESSAGE_STYLES.assistant
          }`}
        >
          <div className="flex items-start space-x-2">
            {message.role === 'user' ? (
              <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <div className="text-sm flex-1">
              {message.role === 'user' ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className={markdownClasses}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata for assistant messages */}
        {message.role === 'assistant' && (message.model || message.reasoning) && (
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {message.model && (
                  <div className="flex items-center space-x-1">
                    <Bot className="h-3 w-3" />
                    <Badge variant="secondary" className="text-xs">
                      {message.model}
                    </Badge>
                  </div>
                )}

                {message.processingTime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{message.processingTime}ms</span>
                  </div>
                )}

                {message.tokensUsed && (
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span>{message.tokensUsed} tokens</span>
                  </div>
                )}
              </div>

              {message.reasoning && (
                <div className="mt-2 p-2 bg-slate-700/30 rounded text-xs text-slate-300">
                  <strong className="text-slate-200">Router Decision:</strong> {message.reasoning}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
