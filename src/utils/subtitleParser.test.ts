import { parseSubtitles } from './subtitleParser';

describe('subtitleParser', () => {
  it('should parse VTT-like format correctly', () => {
    const input = `
[00:00.000 --> 00:02.500]
Hello world
你好世界
[00:02.500 --> 00:04.000]
Testing
测试
    `;
    const result = parseSubtitles(input);
    expect(result.length).toBe(2);
    expect(result[0].startTime).toBe(0);
    expect(result[0].endTime).toBe(2.5);
    expect(result[0].textEn).toBe('Hello world');
    expect(result[0].textZh).toBe('你好世界');
  });
});
