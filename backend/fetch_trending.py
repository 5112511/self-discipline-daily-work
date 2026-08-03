"""
热点抓取后端 - 纯 Python 实现
支持：微博热搜、小红书爆款笔记、抖音红人热点
按用户配置的关键词和对标博主过滤

运行：
  pip install flask flask-cors requests beautifulsoup4
  python fetch_trending.py
  默认监听 http://127.0.0.1:5174
"""
import json
import re
import random
import time
from typing import List, Dict, Any

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("请先安装依赖: pip install requests beautifulsoup4 flask flask-cors")
    raise

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 允许前端跨域调用

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9",
}


# ---------------- 抓取源 ----------------

def fetch_weibo_hot() -> List[Dict[str, Any]]:
    """微博热搜 Top N。返回 [{title, heat, url}]"""
    results: List[Dict[str, Any]] = []
    try:
        # 公开放页，无需登录
        r = requests.get("https://s.weibo.com/top/summary", headers=HEADERS, timeout=8)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        rows = soup.select("#pl_top_realtimehot table tbody tr")
        for tr in rows[1:]:  # 跳过首行广告
            tds = tr.find_all("td")
            if len(tds) < 2:
                continue
            a = tds[1].find("a")
            if not a:
                continue
            title = a.get_text(strip=True)
            href = "https://s.weibo.com" + a.get("href", "")
            heat_text = tds[-1].get_text(strip=True)
            heat = parse_heat(heat_text)
            if title:
                results.append({"title": title, "heat": heat, "url": href,
                                "platform": "微博热搜", "source": "weibo"})
    except Exception as e:
        print("[weibo] 抓取失败:", e)
    return results


def fetch_xhs_explore() -> List[Dict[str, Any]]:
    """小红书探索页爆款（公开接口，无登录态只有部分内容）。"""
    results: List[Dict[str, Any]] = []
    try:
        # 小红书首页探索 - 尝试公开聚合
        url = "https://www.xiaohongshu.com/explore"
        r = requests.get(url, headers={**HEADERS, "Referer": "https://www.xiaohongshu.com/"}, timeout=8)
        r.raise_for_status()
        # 提取页面里嵌入的笔记标题（window.__INITIAL_STATE__）
        m = re.search(r"window\.__INITIAL_STATE__\s*=\s*(\{.*?\});", r.text, re.S)
        if m:
            state = json.loads(m.group(1))
            feeds = (state.get("feed") or {}).get("feeds") or []
            for f in feeds[:30]:
                note = f.get("noteCard") or f.get("note") or {}
                title = note.get("title") or note.get("displayTitle") or ""
                heat = note.get("interactInfo", {}).get("likedCount", "0")
                if title:
                    results.append({"title": title, "heat": parse_heat(str(heat)),
                                    "url": f"https://www.xiaohongshu.com/explore/{note.get('noteId','')}",
                                    "platform": "小红书", "source": "xhs"})
        if not results:
            # 兜底：解析 HTML 标题
            soup = BeautifulSoup(r.text, "html.parser")
            for sec in soup.select("section.note-item a.title"):
                title = sec.get_text(strip=True)
                if title:
                    results.append({"title": title, "heat": 50,
                                    "url": "https://www.xiaohongshu.com" + sec.get("href", ""),
                                    "platform": "小红书", "source": "xhs"})
    except Exception as e:
        print("[xhs] 抓取失败:", e)
    return results


def fetch_douyin_hot() -> List[Dict[str, Any]]:
    """抖音热榜（公开 API）。"""
    results: List[Dict[str, Any]] = []
    try:
        url = "https://www.iesdouyin.com/aweme/v1/hot/search/list/"
        r = requests.get(url, headers=HEADERS, timeout=8)
        data = r.json()
        for item in (data.get("data") or {}).get("word_list", [])[:30]:
            results.append({
                "title": item.get("word", ""),
                "heat": parse_heat(str(item.get("hot_value", 0))),
                "url": "https://www.douyin.com/search/" + (item.get("word", "")),
                "platform": "抖音", "source": "douyin"
            })
    except Exception as e:
        print("[douyin] 抓取失败:", e)
    return results


# ---------------- 工具 ----------------

def parse_heat(text: str) -> int:
    """把 '1.2万' '3500' 解析为整数。"""
    text = (text or "").strip().replace(",", "")
    if not text:
        return 0
    try:
        if "亿" in text:
            return int(float(text.replace("亿", "")) * 100000000)
        if "万" in text:
            return int(float(text.replace("万", "")) * 10000)
        return int(float(text))
    except ValueError:
        return 0


def keyword_match(title: str, keywords: List[str]) -> bool:
    """关键词匹配（任一命中即返回 True，空关键词表示全部命中）。"""
    if not keywords:
        return True
    low = title.lower()
    return any(kw.lower().strip() in low for kw in keywords if kw.strip())


# ---------------- 模拟池兜底 ----------------

SIM_POOL = [
    {"title": "打工人早餐 5 分钟搞定三明治", "platform": "小红书", "category": "flow",
     "angle": "成本不到 8 元，通勤场景", "keywords": ["早餐", "通勤", "低成本"]},
    {"title": "AI 工具实测：10 倍提速写文案", "platform": "B站", "category": "knowledge",
     "angle": "对比 3 个主流 AI 的真实效率", "keywords": ["AI", "效率", "工具"]},
    {"title": "周末独自旅行：一个人去大理住三天", "platform": "小红书", "category": "life",
     "angle": "vlog 形式，孤独感+治愈感", "keywords": ["旅行", "独居", "治愈"]},
    {"title": "宿舍减脂餐：一周瘦 2 斤", "platform": "抖音", "category": "skill",
     "angle": "食材清单+步骤拆解", "keywords": ["减脂", "宿舍", "食谱"]},
    {"title": "情绪崩溃后我学会了这件事", "platform": "小红书", "category": "emotion",
     "angle": "碎碎念+结尾金句", "keywords": ["情绪", "治愈", "成长"]},
    {"title": "30 岁前我后悔没做的 5 件事", "platform": "抖音", "category": "trend",
     "angle": "盘点体+反差感", "keywords": ["成长", "复盘", "30岁"]},
    {"title": "小红书新号 0 粉冷启动复盘", "platform": "小红书", "category": "skill",
     "angle": "数据拆解+踩坑清单", "keywords": ["小红书", "冷启动", "运营"]},
    {"title": "用 AI 做表情包涨粉 1 万", "platform": "抖音", "category": "flow",
     "angle": "工具+流程+数据", "keywords": ["AI", "涨粉", "表情包"]},
    {"title": "一个人住的第一年", "platform": "小红书", "category": "emotion",
     "angle": "日常记录+金句结尾", "keywords": ["独居", "生活", "治愈"]},
    {"title": "露营装备清单｜新手不踩雷", "platform": "抖音", "category": "life",
     "angle": "清单+避坑+实测", "keywords": ["露营", "清单", "新手"]},
    {"title": "短视频脚本结构拆解｜爆款 3 段式", "platform": "B站", "category": "skill",
     "angle": "案例+模板", "keywords": ["脚本", "爆款", "结构"]},
    {"title": "为什么我们越来越累", "platform": "小红书", "category": "emotion",
     "angle": "反问开头+金句收尾", "keywords": ["内耗", "情绪", "社会"]},
]


def sim_pool(keywords: List[str]) -> List[Dict[str, Any]]:
    random.shuffle(SIM_POOL)
    picked = [x for x in SIM_POOL if keyword_match(x["title"], keywords)][:8]
    if not picked:
        picked = SIM_POOL[:8]
    out = []
    for x in picked:
        out.append({
            "title": x["title"],
            "platform": x["platform"],
            "category": x["category"],
            "angle": x["angle"],
            "keywords": x["keywords"],
            "heat": random.randint(40, 95),
            "url": "",
            "source": "sim",
        })
    return out


# ---------------- API ----------------

@app.route("/api/trending", methods=["GET"])
def trending():
    """
    参数：
      keywords=逗号分隔关键词
      platforms=逗号分隔 weibo,xhs,douyin
      fallback=1 当真实抓取失败时返回模拟池
    """
    keywords_raw = request.args.get("keywords", "")
    keywords = [k.strip() for k in keywords_raw.split(",") if k.strip()]
    platforms_raw = request.args.get("platforms", "weibo,xhs,douyin")
    platforms = [p.strip() for p in platforms_raw.split(",") if p.strip()]
    use_fallback = request.args.get("fallback", "1") == "1"

    real: List[Dict[str, Any]] = []
    if "weibo" in platforms:
        real.extend(fetch_weibo_hot())
    if "xhs" in platforms:
        real.extend(fetch_xhs_explore())
    if "douyin" in platforms:
        real.extend(fetch_douyin_hot())

    # 关键词过滤
    real = [x for x in real if keyword_match(x.get("title", ""), keywords)]

    # 归一化：给真实结果补 category/angle/keywords
    normed = []
    for x in real:
        cat = categorize(x.get("title", ""))
        normed.append({
            "title": x.get("title", ""),
            "platform": x.get("platform", ""),
            "category": cat,
            "angle": auto_angle(x.get("title", ""), cat),
            "keywords": keywords or extract_tags(x.get("title", "")),
            "heat": min(100, max(10, x.get("heat", 0) // 1000)),
            "url": x.get("url", ""),
            "source": x.get("source", "real"),
        })

    if not normed and use_fallback:
        normed = sim_pool(keywords)

    return jsonify({
        "ok": True,
        "count": len(normed),
        "real": len(real),
        "items": normed,
        "fetchedAt": int(time.time()),
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "service": "trending-fetch", "time": int(time.time())})


def categorize(title: str) -> str:
    """根据标题粗分类。"""
    kw_map = {
        "flow": ["爆款", "涨粉", "破万", "10万", "热门", "热搜"],
        "life": ["旅行", "独居", "早餐", "露营", "生活", "减脂"],
        "knowledge": ["AI", "工具", "实测", "拆解", "结构", "方法"],
        "emotion": ["情绪", "崩溃", "累", "治愈", "孤独", "后悔"],
        "trend": ["30岁", "复盘", "2025", "趋势", "盘点"],
        "skill": ["脚本", "清单", "食谱", "步骤", "新手"],
    }
    low = title.lower()
    for cat, kws in kw_map.items():
        if any(kw.lower() in low for kw in kws):
            return cat
    return "flow"


def auto_angle(title: str, cat: str) -> str:
    templates = {
        "flow": "数据+反差，开头抛钩子",
        "life": "vlog 形式，场景感强",
        "knowledge": "对比+拆解，结构清晰",
        "emotion": "碎碎念开头，金句收尾",
        "trend": "盘点体+反差感",
        "skill": "清单+步骤+避坑",
    }
    return templates.get(cat, "结构化拆解")


def extract_tags(title: str) -> List[str]:
    tags = re.findall(r"[\u4e00-\u9fa5A-Za-z0-9]{2,6}", title)
    return tags[:5]


if __name__ == "__main__":
    print("热点抓取后端启动: http://127.0.0.1:5174")
    print("接口: GET /api/trending?keywords=AI,减脂&platforms=weibo,xhs,douyin&fallback=1")
    app.run(host="127.0.0.1", port=5174, debug=True)
