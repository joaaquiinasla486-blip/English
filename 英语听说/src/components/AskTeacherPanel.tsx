'use client';

import React, { useState } from 'react';
import { callGeminiWithFallback, PROMPTS } from '../services/geminiRouter';

interface AskTeacherPanelProps {
  currentContextEn: string;
  currentContextZh: string;
  currentTime: number;
}

export default function AskTeacherPanel({ currentContextEn, currentContextZh, currentTime }: AskTeacherPanelProps) {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([
     { role: 'ai', content: "Hi! 我是你的 AI 专属私教。遇到不懂的句子或语法，直接在左侧点击单词，或者在这里问我吧！" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatTimestamp = (s: number) => {
    const m = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
     if (!input.trim() || isLoading) return;
     
     const userMsg = input.trim();
     setInput('');
     setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
     setIsLoading(true);

     try {
       // 组装完整的 Prompt，包含当前句子的上下文
       const fullPrompt = `${PROMPTS.teaching(formatTimestamp(currentTime))}
当前语境（英语原句）："${currentContextEn}"
对应的中文："${currentContextZh}"
学生的问题：${userMsg}
请解答。`;

       // 调用智能路由，指定 TEACHING 任务，会优先路由到 Pro 模型
       const response = await callGeminiWithFallback('TEACHING', { prompt: fullPrompt });
       
       setMessages(prev => [...prev, { role: 'ai', content: response.result }]);
     } catch (err: any) {
       setMessages(prev => [...prev, { role: 'ai', content: `[系统提示] 抱歉，连接导师失败：${err.message}` }]);
     } finally {
       setIsLoading(false);
     }
  };

  return (
    <div className="h-full flex flex-col">
       <div className="flex-1 bg-gray-800/20 rounded-xl p-4 border border-gray-800 mb-4 overflow-y-auto">
          <div className="flex flex-col space-y-4">
             {messages.map((msg, i) => (
                <div 
                   key={i} 
                   className={`p-3 rounded-lg text-sm max-w-[85%] border ${
                      msg.role === 'ai' 
                         ? 'bg-purple-900/30 text-purple-200 self-start border-purple-800/50' 
                         : 'bg-blue-900/30 text-blue-200 self-end border-blue-800/50'
                   }`}
                >
                   {msg.content}
                </div>
             ))}
             {isLoading && (
                <div className="bg-purple-900/30 text-purple-200 p-3 rounded-lg text-sm max-w-[85%] self-start border border-purple-800/50 animate-pulse">
                   正在思考...
                </div>
             )}
          </div>
       </div>
       <div className="relative mt-auto">
          <div className="text-xs text-gray-500 mb-2 truncate">
            当前语境: {currentContextEn}
          </div>
          <input 
             type="text" 
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleSend()}
             placeholder="提问当前句子..." 
             className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button 
             onClick={handleSend}
             disabled={isLoading || !input.trim()}
             className="absolute right-2 top-8 p-1.5 px-3 bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-50 transition-colors"
          >
             发送
          </button>
       </div>
    </div>
  );
}
