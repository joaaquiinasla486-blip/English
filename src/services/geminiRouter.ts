/**
 * Global Model Router (The Smart Router)
 * 动态切换 Gemini 模型，以最大化利用 Google AI Studio 免费额度。
 */

export type TaskType = 'TRANSCRIPTION' | 'TEACHING' | 'SUMMARY' | 'WORD_ANALYSIS';

// 降级策略配置: 按照用户要求，Pro 用完了退给 2.5 Pro，再退给 1.5 Pro，最后兜底 Flash
const MODELS_PRIORITY = {
  // 重体力活：优先 Flash，因为它又快额度又大（1,000,000 TPM）
  TRANSCRIPTION: ['gemini-1.5-flash', 'gemini-1.5-pro'], 
  
  // 教学对话/深层逻辑：优先最新的 3.1 Pro 梯队降级
  TEACHING: ['gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  
  // 沉浸查词/语境分析：同等需要强大的推理能力
  WORD_ANALYSIS: ['gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],

  // 总结提炼
  SUMMARY: ['gemini-1.5-flash', 'gemini-1.5-pro']
};

export const PROMPTS = {
  transcription: "你是一个精通音视频解析的专家，请将这段音频转写为严格的 JSON 格式：[{start, end, en, cn}]，要求时间轴与语音高度重合。",
  teaching: (timestamp: string) => `你是一位幽默且专业的英语私教，请结合当前 ${timestamp} 的语境，为学生深入浅出地解释这个知识点。`,
  summary: "请作为英语教学专家，用上帝视角从这整集字幕中，抓出最地道、最常用的 10 个口语短语并结合剧情给出详细解释。",
  wordAnalysis: "你是一位资深的英语词汇与语用专家。请根据提供的上下文，为选中的单词提供深度解析，包括：1. 当前语境下的精准释义；2. 常见用法与固定搭配；3. 同义词替换。请使用排版良好的 Markdown 格式返回。"
};

/**
 * 模拟的内存缓存（实际生产中应连接 PostgreSQL 的 AiAnalysisCache 表或 IndexedDB）
 * 缓存键值对：[请求上下文Hash] -> [AI回复内容]
 */
const mockAiCache = new Map<string, any>();

/**
 * 模拟的带有重试、降级和缓存机制的 API 调用层
 */
export async function callGeminiWithFallback(taskType: TaskType, payload: { prompt: string, cacheKey?: string }, currentAttempt = 0): Promise<any> {
  // 1. 检查缓存机制 (若开启缓存且命中)
  if (payload.cacheKey && mockAiCache.has(payload.cacheKey)) {
     console.log(`[Smart Router Cache Hit] Returning cached result for key: ${payload.cacheKey}`);
     return {
        modelUsed: 'CACHED_DB',
        result: mockAiCache.get(payload.cacheKey)
     };
  }

  const models = MODELS_PRIORITY[taskType];
  const modelName = models[currentAttempt];

  if (!modelName) {
    throw new Error('All model tiers exhausted (Rate Limit Exceeded). Please wait or upgrade.');
  }

  console.log(`[Smart Router] Task: ${taskType} | Routing to: ${modelName}`);

  try {
     // TODO: 实际的 Gemini API Fetch 逻辑
     // const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`, ...);
     // if (response.status === 429) throw new Error('429 Too Many Requests');
     
     // 模拟网络请求和 AI 处理时间
     await new Promise(r => setTimeout(r, 1500));
     
     // 模拟 AI 的返回结果
     let simulatedResult = '';
     if (taskType === 'WORD_ANALYSIS') {
        simulatedResult = `**语境精准释义**：在这个句子里，它表示...\n\n**固定搭配**：常用的搭配有...\n\n**同义词**：可以替换为... (由 ${modelName} 提供)`;
     } else {
        simulatedResult = `Mock response from ${modelName} for ${taskType}`;
     }

     // 2. 将成功的结果写入缓存
     if (payload.cacheKey) {
        mockAiCache.set(payload.cacheKey, simulatedResult);
        console.log(`[Smart Router Cache Set] Result saved for key: ${payload.cacheKey}`);
     }

     return {
        modelUsed: modelName,
        result: simulatedResult
     };
  } catch (error: any) {
     if (error.message.includes('429')) {
       console.warn(`[Smart Router] Model ${modelName} rate limited. Falling back to next tier...`);
       return callGeminiWithFallback(taskType, payload, currentAttempt + 1);
     }
     throw error;
  }
}
