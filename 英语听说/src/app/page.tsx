'use client';

import PlayerWithSubtitles from '../components/PlayerWithSubtitles';
import { parseSubtitles } from '../utils/subtitleParser';

// 一段模拟的 VTT 格式数据
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
  // 这里用一个开源免费的占位视频链接
  const testVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  return (
    <main className="h-screen w-screen overflow-hidden">
      <PlayerWithSubtitles videoUrl={testVideoUrl} subtitles={subtitles} />
    </main>
  );
}
