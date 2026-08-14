const MODELS = ['glm-5.2', 'deepseek-v4-flash', 'sensenova-6.8-flash-lite']
const API_URL = 'https://token.sensenova.cn/v1/chat/completions'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const apiKey = process.env.apikey_202608130840
  if (!apiKey) return res.status(503).json({ error: '服务端尚未配置 apikey_202608130840 环境变量' })

  try {
    const { action = 'content', title, platform, stage, nextAction, snapshot, records = [] } = req.body || {}
    let prompt
    if (action === 'productivity') {
      if (!snapshot || typeof snapshot !== 'object') return res.status(400).json({ error: '缺少效率分析数据' })
      prompt = `你是一名温和、务实的个人效率教练。仅根据真实数据分析完成情况、时间投入与优化步骤，不虚构、不责备。数据：${JSON.stringify(snapshot)}。严格返回 JSON：{"summary":"40字内总体判断","focus":"一句聚焦建议","risks":["风险1","风险2"],"steps":["15分钟步骤1","步骤2","步骤3"],"efficiency":"一句效率建议"}`
    } else if (action === 'creative-analysis') {
      if (!title || typeof title !== 'string') return res.status(400).json({ error: '缺少创作标题' })
      prompt = `你是一名中文内容创作教练。结合创作项目标题、阶段和阶段记录，给出具体建议，并将其中可复用的方法沉淀为一条知识卡。不要虚构未提供的信息。标题：${title}；平台：${platform || '未指定'}；阶段：${stage || '灵感'}；下一步：${nextAction || '未设置'}；记录：${JSON.stringify(records)}。严格返回 JSON：{"advice":"针对当前项目的核心建议","nextAction":"最小下一步","knowledgeTitle":"可复用知识标题","knowledgeContent":"沉淀的方法、话术或避坑原则"}`
    } else {
      if (!title || typeof title !== 'string') return res.status(400).json({ error: '缺少内容标题' })
      prompt = `你是一名中文内容创作顾问。围绕选题给出实用建议。选题：${title}；平台：${platform || '未指定'}；阶段：${stage || '灵感'}；下一步：${nextAction || '未设置'}。严格返回 JSON：{"titles":["标题1","标题2","标题3"],"angle":"一句话切入角度","outline":["开头钩子","核心内容","结尾行动"],"nextAction":"今天最值得执行的一步"}`
    }

    let lastError = 'SenseNova 请求失败'
    for (const model of MODELS) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'system', content: '你必须按用户要求输出有效 JSON，不要输出 Markdown。' }, { role: 'user', content: prompt }], stream: false, temperature: 0.55 }),
        })
        const payload = await response.json()
        if (!response.ok) {
          lastError = payload?.error?.message || `${model} 请求失败`
          continue
        }
        const text = payload?.choices?.[0]?.message?.content || ''
        try { return res.status(200).json({ ...JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim()), model }) } catch { return res.status(200).json({ raw: text, model }) }
      } catch (error) {
        lastError = error instanceof Error ? error.message : `${model} 服务异常`
      }
    }
    return res.status(502).json({ error: `所有 AI 模型均不可用：${lastError}` })
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'SenseNova 服务异常' })
  }
}
