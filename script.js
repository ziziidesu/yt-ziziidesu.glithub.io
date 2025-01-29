const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

document.getElementById("startButton").addEventListener("click", async () => {
  const url = document.getElementById("urlInput").value;
  const status = document.getElementById("status");
  const outputVideo = document.getElementById("outputVideo");

  if (!url) {
    alert("URLを入力してください！");
    return;
  }

  status.textContent = "FFmpegのロード中...";
  if (!ffmpeg.isLoaded()) await ffmpeg.load();

  try {
    status.textContent = "動画と音声をダウンロード中...";
    
    // 動画と音声を別々に取得する（Web APIの代わりにyt-dlp-web互換サービスを使用）
    const videoBlob = await downloadFile(`${url}&format=bestvideo`);
    const audioBlob = await downloadFile(`${url}&format=bestaudio`);

    // FFmpegでマージ
    ffmpeg.FS("writeFile", "video.mp4", await fetchFile(videoBlob));
    ffmpeg.FS("writeFile", "audio.mp3", await fetchFile(audioBlob));

    status.textContent = "マージ中...";
    await ffmpeg.run("-i", "video.mp4", "-i", "audio.mp3", "-c:v", "copy", "-c:a", "aac", "output.mp4");

    const data = ffmpeg.FS("readFile", "output.mp4");
    const mergedBlob = new Blob([data.buffer], { type: "video/mp4" });

    // 結果を表示
    outputVideo.src = URL.createObjectURL(mergedBlob);
    outputVideo.style.display = "block";
    status.textContent = "処理完了！";

  } catch (error) {
    console.error(error);
    status.textContent = "エラーが発生しました。";
  }
});

async function downloadFile(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("ファイルのダウンロードに失敗しました");
  return await response.blob();
}
