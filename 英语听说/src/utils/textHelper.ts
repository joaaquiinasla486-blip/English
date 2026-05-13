export function splitSentenceIntoWords(sentence: string): { id: string; word: string; text: string; isPunctuation: boolean }[] {
  const regex = /(\b[\w']+\b)|([^\w']+)/g;
  const parts = [];
  let match;
  let index = 0;
  while ((match = regex.exec(sentence)) !== null) {
    if (match[1]) {
      parts.push({ id: `word-${index++}`, word: match[1].toLowerCase(), text: match[1], isPunctuation: false });
    } else if (match[2]) {
      parts.push({ id: `punct-${index++}`, word: '', text: match[2], isPunctuation: true });
    }
  }
  return parts;
}
