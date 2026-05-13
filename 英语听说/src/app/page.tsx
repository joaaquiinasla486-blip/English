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
      setVideoUrl(inputUrl.trim());
      setInputUrl("");
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#0f0f11]">
      {/* 顶部工具栏：用于导入视频或链接 */}
      <div className="h-16 bg-[#1a1a1f] border-b border-gray-800 flex items-center px-6 justify-between flex-shrink-0 z-10">
        <div className="text-white font-bold text-lg tracking-wide">
          My English AI 🚀
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <input 
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="粘贴视频直链 (支持 .mp4)"
              className="bg-transparent text-sm text-white px-3 py-1.5 outline-none w-64"
            />
            <button 
              onClick={handleUrlSubmit}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 transition-colors"
            >
              加载链接
            </button>
          </div>

          <div className="text-gray-500 text-sm">或</div>

          <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
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
