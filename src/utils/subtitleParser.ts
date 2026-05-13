export interface SubtitleLine {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  textEn: string;
  textZh: string;
}

/**
 * Parses a custom VTT-like or text format into an array of SubtitleLine objects.
 * Expects format like:
 * [00:00.000 --> 00:02.500]
 * Hello world
 * 你好世界
 * 
 * Or standard WebVTT with English and Chinese on consecutive lines.
 */
export function parseSubtitles(content: string): SubtitleLine[] {
  const lines = content.split(/\r?\n/);
  const subtitles: SubtitleLine[] = [];
  let currentSubtitle: Partial<SubtitleLine> = {};
  let textLines: string[] = [];

  const timePattern = /(?:(\d{2,}):)?(\d{2}):(\d{2}\.\d{2,3})\s*-->\s*(?:(\d{2,}):)?(\d{2}):(\d{2}\.\d{2,3})/;

  const parseTime = (hours: string, minutes: string, secondsAndMs: string): number => {
    const h = hours ? parseInt(hours, 10) : 0;
    const m = parseInt(minutes, 10);
    const s = parseFloat(secondsAndMs);
    return h * 3600 + m * 60 + s;
  };

  const processCurrentSubtitle = () => {
    if (currentSubtitle.startTime !== undefined && currentSubtitle.endTime !== undefined) {
      if (textLines.length >= 1) {
         // Assume first line is EN, second line (if exists) is ZH
         const en = textLines[0];
         const zh = textLines.length > 1 ? textLines[1] : '';
         subtitles.push({
           id: `${currentSubtitle.startTime}-${currentSubtitle.endTime}`,
           startTime: currentSubtitle.startTime,
           endTime: currentSubtitle.endTime,
           textEn: en.trim(),
           textZh: zh.trim()
         });
      }
    }
    currentSubtitle = {};
    textLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.toUpperCase() === 'WEBVTT') continue;

    const match = line.match(timePattern);
    if (match) {
      // If we already have one in progress, save it
      processCurrentSubtitle();

      currentSubtitle.startTime = parseTime(match[1], match[2], match[3]);
      currentSubtitle.endTime = parseTime(match[4], match[5], match[6]);
    } else if (currentSubtitle.startTime !== undefined) {
       textLines.push(line);
    }
  }
  
  // process the last one
  processCurrentSubtitle();

  return subtitles;
}
