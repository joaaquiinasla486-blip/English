'use client';

import React, { useState } from 'react';
import PlayerWithSubtitles from '../components/PlayerWithSubtitles';
import { parseSubtitles } from '../utils/subtitleParser';

const mockVtt = `
[00:00.000 --> 00:02.500]
Hello, welcome to this English learning app.
你好，欢迎来到这款英语学习应用。
[00:02.500 --> 00:05.000]
We are currently testing the interactive subtitle system.
我们正在测试交互式字幕系统。
[00:05.000 --> 00:09.500]
You can click on any word, like sample, to view its definition.
你可以点击任何单词，比如 sample，来查看它的定义。
[00:09.500 --> 00:15.000]
Or you can click the whole sentence to jump to that specific time.
或者你可以点击整句话，跳转到那个特定的时间。
`;

// 工具函数：自动将 Google Drive 分享链接转换为直链
function convertToDirectLink(url: string): string {
  // 匹配 Google Drive 分享链接中的文件 ID
  const driveRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  // 如果不是 Google Drive 链接，原样返回
  return url;
}

export default function Home() {
  const subtitles = parseSubtitles(mockVtt);
  // 默认使用测试视频
  const [videoUrl, setVideoUrl] = useState("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
  const [inputUrl, setInputUrl] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const handleUrlSubmit = () => {
    if (inputUrl.trim()) {
      const finalUrl = convertToDirectLink(inputUrl.trim());
      setVideoUrl(finalUrl);
      setInputUrl("");
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#0f0f11]">
      {/* 顶部工具栏：用于导入视频或链接 */}
      <div className="h-16 bg-[#1a1a1f] border-b border-gray-800 flex items-center px-6 justify-between flex-shrink-0 z-10">
        <div className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
          <span>My English AI 🚀</span>
          {videoUrl.includes('drive.google.com') && (
            <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-800/50">
              Google Drive 模式
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <input 
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="粘贴视频链接 (支持 Google Drive 分享链接)"
              className="bg-transparent text-sm text-white px-3 py-1.5 outline-none w-72"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <button 
              onClick={handleUrlSubmit}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 transition-colors whitespace-nowrap"
            >
              加载链接
            </button>
          </div>

          <div className="text-gray-500 text-sm">或</div>

          <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-sm px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            📁 本地上传文件
            <input 
              type="file" 
              accept="video/mp4,video/webm,audio/mp3,audio/wav" 
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PlayerWithSubtitles videoUrl={videoUrl} subtitles={subtitles} />
      </div>
    </main>
  );
}
