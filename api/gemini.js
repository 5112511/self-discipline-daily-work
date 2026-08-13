// 使用 SenseNova 当前官方示例中的免费轻量模型
const MODEL = 'sensenova-6.8-flash-lite'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Vercel 中由用户配置为小写 deepseek；此处应填 SenseNova TokenPlan 的 sk- 开头密钥
  const apiKey = process.env.deepseek
  if (!apiKey) {
    res.status(503).json({ error: '服务端尚未配置 deepseek 环境变量' })
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

    // SenseNova TokenPlan 公测接口：OpenAI 兼容，但并非 DeepSeek 官方域名
    const response = await fetch('https://token.sensenova.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: '你是专业的中文内容创作顾问，必须按用户要求输出有效 JSON。' },
          { role: 'user', content: prompt },
        ],
        stream: false,
        temperature: 0.7,
      }),
    })

    const payload = await response.json()
    if (!response.ok) {
      res.status(response.status).json({ error: payload?.error?.message || 'SenseNova 请求失败' })
      return
    }

    const text = payload?.choices?.[0]?.message?.content || ''
    let result
    try {
      result = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim())
    } catch {
      result = { raw: text }
    }
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'SenseNova 服务异常' })
  }
}
