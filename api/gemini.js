// 使用 SenseNova 当前官方示例中的免费轻量模型
const MODEL = 'sensenova-6.8-flash-lite'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.apikey_202608130840
  if (!apiKey) {
    res.status(503).json({ error: '服务端尚未配置 apikey_202608130840 环境变量' })
    return
  }

  try {
    const { action = 'content', title, platform, stage, nextAction, snapshot } = req.body || {}
    let prompt

    if (action === 'productivity') {
      if (!snapshot || typeof snapshot !== 'object') {
        res.status(400).json({ error: '缺少效率分析数据' })
        return
      }
      prompt = `你是一名温和、务实的个人效率教练。请仅根据以下真实数据，分析完成情况、时间投入和可执行的优化步骤；不要虚构数据，不要使用责备语气。
数据：${JSON.stringify(snapshot)}
请严格返回 JSON，不要 Markdown，不要额外解释，格式如下：
{"summary":"40字内的今日总体判断","focus":"一句最重要的聚焦建议","risks":["风险或阻塞1","风险或阻塞2"],"steps":["可在15分钟内完成的步骤1","步骤2","步骤3"],"efficiency":"一句关于效率或节奏的建议"}`
    } else {
      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: '缺少内容标题' })
        return
      }
      prompt = `你是一名中文内容创作顾问。请围绕以下选题给出实用、具体的建议。
选题：${title}
平台：${platform || '未指定'}
当前阶段：${stage || '灵感'}
下一步：${nextAction || '未设置'}
请严格返回 JSON，不要 Markdown，不要额外解释，格式如下：
{"titles":["标题1","标题2","标题3"],"angle":"一句话切入角度","outline":["开头钩子","核心内容","结尾行动"],"nextAction":"今天最值得执行的一步"}`
    }

    const response = await fetch('https://token.sensenova.cn/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: action === 'productivity' ? '你是个人效率教练，必须按用户要求输出有效 JSON。' : '你是专业的中文内容创作顾问，必须按用户要求输出有效 JSON。' },
          { role: 'user', content: prompt },
        ],
        stream: false,
        temperature: 0.55,
      }),
    })

    const payload = await response.json()
    if (!response.ok) {
      res.status(response.status).json({ error: payload?.error?.message || 'SenseNova 请求失败' })
      return
    }

    const text = payload?.choices?.[0]?.message?.content || ''
    try {
      res.status(200).json(JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim()))
    } catch {
      res.status(200).json({ raw: text })
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'SenseNova 服务异常' })
  }
}
