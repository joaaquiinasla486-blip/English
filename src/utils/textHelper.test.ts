import { splitSentenceIntoWords } from './textHelper';
describe('splitSentenceIntoWords', () => {
  it('should split words and punctuation correctly', () => {
    const result = splitSentenceIntoWords("Hello, world! I'm Jules.");
    expect(result.map(r => r.text).join('')).toBe("Hello, world! I'm Jules.");
    expect(result.filter(r => !r.isPunctuation).map(r => r.word)).toEqual(['hello', 'world', "i'm", 'jules']);
  });
});
