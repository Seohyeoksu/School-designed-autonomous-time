'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, BookOpen, Bot, User, HelpCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    content: string;
    metadata: Record<string, any>;
    similarity: number;
  }>;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "학교자율시간이란 무엇인가요?",
  "학교자율시간 시수는 어떻게 확보하나요?",
  "학교자율시간 운영 원칙은 무엇인가요?",
  "초등학교 학교자율시간 편성 방법은?",
];

// 출처 원문에서 불필요한 내용 제거
function cleanSourceContent(content: string): string {
  return content
    // URL 제거
    .replace(/https?:\/\/[^\s]+/g, '')
    // 페이지 번호 (17/104 형식) 제거
    .replace(/\d+\/\d+/g, '')
    // 타임스탬프 (25. 11. 18. 오후 6:46 형식) 제거
    .replace(/\d+\.\s*\d+\.\s*\d+\.\s*(오전|오후)\s*\d+:\d+/g, '')
    // 문서 제목 반복 제거 (다양한 형식)
    .replace(/초등학교_?학교자율시간_?운영_?(톺아보기|돌아보기)\s*\(?최적화\)?/gi, '')
    .replace(/중학교_?학교자율시간_?운영_?(톺아보기|돌아보기)\s*\(?최적화\)?/gi, '')
    .replace(/초등학교\s+학교자율시간\s*(톺아보기|돌아보기)/gi, '')
    .replace(/중학교\s+학교자율시간\s*(톺아보기|돌아보기)/gi, '')
    // 2022 개정 교육과정 관련 반복 헤더 제거
    .replace(/2022\s*개정\s*교육과정\s*적용에\s*따른/g, '')
    .replace(/2022\s*개정\s*교육과정\s*적용/g, '')
    // 경상북도교육청 관련 제거
    .replace(/경상북도교육청\s*(연구원)?/g, '')
    .replace(/따뜻한\s*경북교육/g, '')
    .replace(/세계교육을\s*이끌어갑니다!?/g, '')
    .replace(/Gyeongsangbuk-do Office of Education/gi, '')
    // 목차 관련 제거
    .replace(/^목차\s*$/gm, '')
    // 섹션 제목 반복 제거
    .replace(/^I+\s*$/gm, '')
    .replace(/^II+\s*$/gm, '')
    .replace(/학교자율시간\s*(이해|설계|Q&A)\s*\d*/g, '')
    // 단독 숫자 줄 제거 (페이지 번호)
    .replace(/^\s*\d{1,3}\s*$/gm, '')
    // 연속 공백/줄바꿈 정리
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, ' ')
    .trim();
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `안녕하세요! **학교자율시간 안내 도우미**입니다.

2022 개정 교육과정의 학교자율시간에 대해 질문해주세요.`,
  timestamp: new Date('2024-01-01T00:00:00'),
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [messageIdCounter, setMessageIdCounter] = useState(1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${messageIdCounter}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessageIdCounter(prev => prev + 1);

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${messageIdCounter}`,
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessageIdCounter(prev => prev + 1);

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: `error-${messageIdCounter}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question.',
        timestamp: new Date(),
      };

      setMessageIdCounter(prev => prev + 1);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const toggleSourceExpansion = (messageId: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
      <div className="p-4 border-b border-sky-200 bg-gradient-to-r from-sky-600 to-blue-600 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          학교자율시간 안내 도우미
        </h2>
        <div className="mt-2 text-xs text-sky-200 flex items-center gap-2">
          2022 개정 교육과정 학교자율시간 운영 가이드
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 overflow-hidden">
        <div className="space-y-4 max-w-full">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className={
                  message.role === 'user' ? 'bg-blue-100' : 'bg-sky-100'
                }>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-sky-600" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 space-y-2 ${
                message.role === 'user' ? 'flex flex-col items-end' : ''
              }`}>
                <div className={`flex items-center gap-2 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}>
                  <span className="font-semibold">
                    {message.role === 'user' ? '선생님' : '학교자율시간 도우미'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className={`prose prose-sm ${
                  message.role === 'assistant'
                    ? 'bg-sky-50 p-4 rounded-lg border border-sky-100 max-w-full break-words leading-relaxed'
                    : 'bg-blue-50 p-4 rounded-lg border border-blue-100 text-right max-w-md ml-auto break-words whitespace-pre-wrap leading-relaxed'
                }`}>
                  {message.content}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 space-y-3">
                    <div
                      className="flex items-center justify-between cursor-pointer bg-sky-50 hover:bg-sky-100 p-3 rounded-lg border border-sky-200 transition-colors"
                      onClick={() => toggleSourceExpansion(message.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-medium text-sky-700">
                          참고 문서 ({Math.min(message.sources.length, 10)}개 섹션)
                        </span>
                      </div>
                      {expandedSources[message.id] ? (
                        <ChevronUp className="h-4 w-4 text-sky-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-sky-600" />
                      )}
                    </div>

                    {expandedSources[message.id] && (
                      <div className="space-y-3 pl-4 border-l-2 border-sky-200">
                        {message.sources.slice(0, 10).map((source, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-sky-300 text-sky-700">
                                  {source.metadata.page}페이지
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  유사도: {(source.similarity * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border break-words overflow-wrap-anywhere whitespace-pre-wrap">
                              {cleanSourceContent(source.content)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sky-100">
                  <Bot className="h-4 w-4 text-sky-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                <span className="text-sm text-sky-600">문서를 확인하고 있습니다...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="text-sm font-medium text-sky-700 mb-2 flex items-center gap-1">
            <HelpCircle className="h-4 w-4" />
            자주 묻는 질문:
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((question, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion(question)}
                className="text-xs border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-sky-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="학교자율시간에 대해 질문해주세요... (예: 시수 편성 방법)"
            disabled={isLoading}
            className="flex-1 border-sky-200 focus:border-sky-400 focus:ring-sky-200 focus:ring-1 focus:ring-opacity-50"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-sky-600 hover:bg-sky-700 text-white focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
