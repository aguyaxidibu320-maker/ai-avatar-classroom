// api/tts.js — 神經語音 TTS 後端（Vercel Serverless Function）
// 使用 msedge-tts 連接微軟 Edge 朗讀服務，生成高品質中文語音
// 部署到 Vercel 後，前端會自動使用此介面

const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

module.exports = async (req, res) => {
  // CORS 設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { text, voice } = req.body || {};

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing "text" field' });
    return;
  }

  // 限制文本長度，防止濫用
  if (text.length > 500) {
    res.status(400).json({ error: 'Text too long (max 500 chars)' });
    return;
  }

  // 預設語音：中文（台灣）女聲 HsiaoChen
  const voiceName = voice || 'zh-TW-HsiaoChenNeural';

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioBuffer } = await tts.toBuffer(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'TTS generation failed', detail: error.message });
  }
};