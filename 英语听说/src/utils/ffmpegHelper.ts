export async function extractAudioLocally(videoFile: File, onProgress: (ratio: number) => void): Promise<Blob> {
  return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
         progress += 0.1;
         onProgress(Math.min(progress, 1));
         if (progress >= 1) {
            clearInterval(interval);
            resolve(new Blob(['mock audio data'], { type: 'audio/mp3' }));
         }
      }, 200);
  });
}
