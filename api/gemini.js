// 使用 Google AI Studio 确认可调用的 Gemini 3.1 Flash Lite 模型
const MODEL = 'gemini-3.1-flash-lite'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(503).json({ error: '服务端尚未配置 GEMINI_API_KEY' })
    return
  }

  try {
    const { title, platform, stage, nextAction } = req.body || {}
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: '缺少内容标题' })
      return
    }

    const prompt = `你是一名中文内容创作顾问。请围绕以下选题给出实用、具体的建议。
选题：${title}
平台：${platform || '未指定'}
当前阶段：${stage || '灵感'}
下一步：${nextAction || '未设置'}

请严格返回 JSON，不要 Markdown，不要额外解释，格式如下：
{"titles":["标题1","标题2","标题3"],"angle":"一句话切入角度","outline":["开头钩子","核心内容","结尾行动"],"nextAction":"今天最值得执行的一步"}`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, responseMimeType: 'application/json' } }),
    })

    const payload = await response.json()
    if (!response.ok) {
      res.status(response.status).json({ error: payload?.error?.message || 'Gemini 请求失败' })
      return
    }

    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    let result
    try {
      result = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim())
    } catch {
      result = { raw: text }
    }
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Gemini 服务异常' })
  }
}
