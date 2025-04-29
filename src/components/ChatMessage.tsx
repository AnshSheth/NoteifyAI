import React from 'react';
import { cn } from '@/lib/utils';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessageProps {
  content: string;
  role: MessageRole;
  timestamp?: string;
}

export function ChatMessage({ content, role, timestamp }: ChatMessageProps) {
  return (
    <div className={cn(
      "flex w-full mb-4 animate-fade-in",
      role === 'user' ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg p-4",
        role === 'user' 
          ? "bg-indigo-600 text-white rounded-tr-none" 
          : "bg-gray-100 text-gray-800 rounded-tl-none"
      )}>
        <div className="flex items-center mb-1">
          <div className={cn(
            "font-medium",
            role === 'user' ? "text-indigo-100" : "text-indigo-600"
          )}>
            {role === 'user' ? 'You' : 'NoteifyAI'}
          </div>
          {timestamp && (
            <div className={cn(
              "text-xs ml-2",
              role === 'user' ? "text-indigo-200" : "text-gray-500"
            )}>
              {timestamp}
            </div>
          )}
        </div>
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
} 