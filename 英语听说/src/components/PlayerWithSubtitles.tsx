'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SubtitleLine } from '../utils/subtitleParser';
import { splitSentenceIntoWords } from '../utils/textHelper';
import AskTeacherPanel from './AskTeacherPanel';
import { callGeminiWithFallback, PROMPTS } from '../services/geminiRouter';

interface PlayerWithSubtitlesProps {
  videoUrl: string;
  subtitles: SubtitleLine[];
}

export default function PlayerWithSubtitles({ videoUrl, subtitles }: PlayerWithSubtitlesProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 用于记录所有的字幕节点，方便做平滑滚动
  const subtitleRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 查词卡片状态
  const [selectedWord, setSelectedWord] = useState<{ word: string, contextEn: string, contextZh: string, x: number, y: number } | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 侧边栏模式控制
  const [sidebarMode, setSidebarMode] = useState<'knowledge' | 'askTeacher'>('knowledge');

  // 获取当前句子的上下文，用于传给 AI
  const currentSubtitle = activeIndex !== -1 ? subtitles[activeIndex] : null;

  // 视频播放时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);

      // 寻找当前激活的字幕
      let foundIndex = -1;
      for (let i = 0; i < subtitles.length; i++) {
         if (time >= subtitles[i].startTime && time <= subtitles[i].endTime) {
            foundIndex = i;
            break;
         }
      }

      if (foundIndex !== -1 && foundIndex !== activeIndex) {
        setActiveIndex(foundIndex);
        
        // 自动滚动逻辑：只有在用户没手动滑动时才滚动
        if (!userIsScrolling && subtitleRefs.current[foundIndex] && containerRef.current) {
           subtitleRefs.current[foundIndex]?.scrollIntoView({
             behavior: 'smooth',
             block: 'center'
           });
        }
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setUserIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrolling(false);
    }, 3000);
  };

  const handleSubtitleClick = (startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      setUserIsScrolling(false);
    }
  };

  const handleWordClick = (e: React.MouseEvent, word: string, contextEn: string, contextZh: string) => {
    e.stopPropagation(); // 阻止触发整句跳转
    
    if (videoRef.current) {
       videoRef.current.pause();
    }
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectedWord({
       word,
       contextEn,
       contextZh,
       x: rect.left + rect.width / 2,
       y: rect.bottom + window.scrollY
    });
    setAiAnalysisResult(null); // Reset previous analysis
  };

  const scrollToCurrent = () => {
    if (activeIndex !== -1 && subtitleRefs.current[activeIndex]) {
      subtitleRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      setUserIsScrolling(false);
    }
  };

  // 触发 AI 深度查词，带缓存
  const handleDeepAnalysis = async () => {
     if (!selectedWord || isAnalyzing) return;
     setIsAnalyzing(true);
     
     // 构建缓存 Key（单词 + 原文句子的组合，保证唯一性）
     const cacheKey = `analysis_${selectedWord.word}_${selectedWord.contextEn}`;
     const prompt = `${PROMPTS.wordAnalysis}\n\n选中的单词: "${selectedWord.word}"\n原句: "${selectedWord.contextEn}"\n中文翻译: "${selectedWord.contextZh}"`;

     try {
        const response = await callGeminiWithFallback('WORD_ANALYSIS', { prompt, cacheKey });
        setAiAnalysisResult(response.result);
     } catch (err) {
        setAiAnalysisResult("分析失败，请检查网络或重试。");
     } finally {
        setIsAnalyzing(false);
     }
  };

  return (
    <div className="flex flex-row h-screen bg-[#0f0f11] text-gray-100 overflow-hidden font-sans">
      
      {/* 左侧：视频播放器与字幕流 (iPad 横屏布局) */}
      <div className="flex-1 flex flex-col relative border-r border-gray-800">
        
        {/* 视频区域 (上半部分) */}
        <div className="w-full relative aspect-video bg-black flex-shrink-0">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls
            playsInline
          />
        </div>

        {/* 字幕区域 (下半部分) */}
        <div className="relative flex-1 flex flex-col bg-[#1a1a1f] overflow-hidden">
          {userIsScrolling && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <button 
                onClick={scrollToCurrent}
                className="px-5 py-2 bg-blue-600/90 backdrop-blur-md hover:bg-blue-500 text-white rounded-full shadow-lg text-sm font-medium transition-all"
              >
                定位到当前
              </button>
            </div>
          )}

          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto px-8 py-16 scroll-smooth"
            onScroll={handleScroll}
          >
            <div className="space-y-6 max-w-4xl mx-auto pb-48">
               {subtitles.map((sub, i) => {
                 const isActive = i === activeIndex;
                 const wordParts = splitSentenceIntoWords(sub.textEn);
                 
                 return (
                   <div
                     key={sub.id}
                     ref={el => subtitleRefs.current[i] = el}
                     onClick={() => handleSubtitleClick(sub.startTime)}
                     className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out
                       ${isActive ? 'bg-gray-800/60 shadow-xl scale-[1.02]' : 'hover:bg-gray-800/30 opacity-70 scale-100'}`}
                   >
                     <p className={`text-2xl md:text-3xl leading-relaxed mb-3 font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                        {wordParts.map((part, idx) => {
                           if (part.isPunctuation) {
                              return <span key={idx}>{part.text}</span>;
                           }
                           return (
                             <span 
                               key={idx}
                               onClick={(e) => handleWordClick(e, part.word, sub.textEn, sub.textZh)}
                               className="hover:bg-blue-500/30 hover:text-blue-300 rounded px-0.5 transition-colors duration-150"
                             >
                               {part.text}
                             </span>
                           );
                        })}
                     </p>
                     <p className={`text-lg md:text-xl ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                        {sub.textZh}
                     </p>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：全面知识点解析与问老师 (iPad 横屏布局) */}
      <div className="w-[400px] bg-[#121216] flex flex-col flex-shrink-0">
          <div className="flex border-b border-gray-800">
             <button 
                className={`flex-1 py-4 text-sm font-medium transition-colors ${sidebarMode === 'knowledge' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setSidebarMode('knowledge')}
             >
                知识点总结
             </button>
             <button 
                className={`flex-1 py-4 text-sm font-medium transition-colors ${sidebarMode === 'askTeacher' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setSidebarMode('askTeacher')}
             >
                问老师 (Ask AI)
             </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
             {sidebarMode === 'knowledge' ? (
                <div className="space-y-6">
                   <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-800">
                      <h3 className="text-lg font-bold text-white mb-2 flex justify-between items-center">
                         核心考点提取
                         <button className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-xs hover:bg-blue-600/40">一键提取全集</button>
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                         (点击右上角按钮，Gemini 1.5 Flash 将为您快速提取全集短语与考点)
                      </p>
                   </div>
                </div>
             ) : (
                <AskTeacherPanel 
                   currentContextEn={currentSubtitle?.textEn || '未选中句子'} 
                   currentContextZh={currentSubtitle?.textZh || ''}
                   currentTime={currentTime}
                />
             )}
          </div>
      </div>

      {/* 沉浸式查词 Popover 气泡 */}
      {selectedWord && (
         <>
           <div 
             className="fixed inset-0 z-40" 
             onClick={() => setSelectedWord(null)} 
           />
           <div 
             className="fixed z-50 bg-[#25252d] border border-gray-700 shadow-2xl rounded-2xl p-5 w-96 transform -translate-x-1/2 mt-2 animate-in fade-in slide-in-from-top-2 max-h-[80vh] flex flex-col"
             style={{ left: selectedWord.x, top: selectedWord.y }}
           >
              <div className="flex justify-between items-start mb-3">
                 <div>
                    <h4 className="text-2xl font-bold text-white capitalize">{selectedWord.word}</h4>
                    <span className="text-sm text-gray-400">/ˈsæmpəl/</span>
                 </div>
                 <button className="p-2 bg-gray-700/50 rounded-full hover:bg-gray-600 text-gray-300">
                    🔊
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
                 <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                    [基本释义占位] n. 样本，样品；v. 抽样检查。
                 </p>
                 
                 {/* AI 分析区域 */}
                 {aiAnalysisResult ? (
                    <div className="bg-purple-900/20 border border-purple-800/30 rounded-xl p-3 text-sm text-purple-200 mt-3">
                       <p className="font-semibold mb-1 text-purple-300">✨ AI 语境解析 (已缓存至生词本)</p>
                       <div className="whitespace-pre-wrap">{aiAnalysisResult}</div>
                    </div>
                 ) : isAnalyzing ? (
                    <div className="bg-gray-800/50 rounded-xl p-3 text-sm text-gray-400 mt-3 animate-pulse">
                       正在调用 Gemini 深度解析语境...
                    </div>
                 ) : null}
              </div>

              <div className="flex space-x-3 mt-auto">
                 <button className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
                    + 加入 SRS
                 </button>
                 {!aiAnalysisResult && !isAnalyzing && (
                    <button 
                       className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg"
                       onClick={handleDeepAnalysis}
                    >
                       ✨ 深度解析语境
                    </button>
                 )}
              </div>
           </div>
         </>
      )}

    </div>
  );
}
