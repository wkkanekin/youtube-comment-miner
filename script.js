const supabaseUrl = "https://grnjerofzgqjapbecmys.supabase.co";
const supabaseKey = "sb_publishable_3nnBZWtQv_gfdhJWMhYiAA_z1v_HiDD";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const els = {
  videoUrl: document.getElementById("videoUrl"),
  maxComments: document.getElementById("maxComments"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  clearBtn: document.getElementById("clearBtn"),
  status: document.getElementById("status"),
  totalCount: document.getElementById("totalCount"),
  questionCount: document.getElementById("questionCount"),
  demandCount: document.getElementById("demandCount"),
  demandRanking: document.getElementById("demandRanking"),
  representativeQuestions: document.getElementById("representativeQuestions"),
  contentIdeas: document.getElementById("contentIdeas"),
  questionSearch: document.getElementById("questionSearch"),
  resultBody: document.getElementById("resultBody"),
  upgradeBox: document.getElementById("upgradeBox"),
  upgradeBtn: document.getElementById("upgradeBtn"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  authLoggedOut: document.getElementById("authLoggedOut"),
  authLoggedIn: document.getElementById("authLoggedIn"),
  userEmail: document.getElementById("userEmail")
};

const FREE_USAGE_LIMIT = 3;
const PAID_USAGE_AMOUNT = 30;
const MAX_COMMENT_LIMIT = 500;
const DEFAULT_REDIRECT_URL = `${window.location.origin}/`;

let currentUser = null;
let currentProfile = null;

let latestAnalysis = {
  videoId: "",
  totalComments: 0,
  questions: [],
  demands: [],
  ideas: []
};

const QUESTION_SIGNALS = [
  "？",
  "?",
  "教えて",
  "知りたい",
  "どう",
  "どこ",
  "いつ",
  "なぜ",
  "なんで",
  "いくら",
  "何円",
  "何点",
  "必要",
  "できますか",
  "できる",
  "ですか",
  "ますか",
  "でしょうか",
  "ありますか",
  "いますか",
  "可能",
  "方法",
  "やり方",
  "おすすめ",
  "違い",
  "比較",
  "意味",
  "理由",
  "どっち",
  "どちら",
  "手順",
  "設定",
  "わかる",
  "わかります",
  "わからない",
  "困って",
  "不安",
  "悩み",
  "how",
  "what",
  "why",
  "when",
  "where",
  "which",
  "can",
  "do you",
  "does",
  "is it",
  "are there",
  "recommend",
  "compare",
  "difference"
];

const DEMAND_RULES = [
  {
    seed: "料金",
    title: "料金・費用",
    words: ["料金", "費用", "金額", "いくら", "月額", "課金", "無料", "有料", "プラン", "価格", "値段", "price", "cost", "fee", "money"]
  },
  {
    seed: "違い",
    title: "比較・違い",
    words: ["違い", "比較", "vs", "VS", "どっち", "どちら", "おすすめ", "代替", "移行", "メリット", "compare", "difference", "better", "versus"]
  },
  {
    seed: "導入",
    title: "導入方法",
    words: ["導入", "始め方", "インストール", "登録", "セットアップ", "初期設定", "設定", "使い始め", "setup", "install", "start"]
  },
  {
    seed: "使い方",
    title: "使い方・やり方",
    words: ["使い方", "やり方", "方法", "手順", "どうやって", "操作", "作り方", "やるには", "how to", "tutorial"]
  },
  {
    seed: "初心者",
    title: "初心者向け",
    words: ["初心者", "初めて", "未経験", "入門", "わからない", "簡単", "難しい", "beginner", "easy"]
  },
  {
    seed: "Windows",
    title: "Windows対応",
    words: ["windows", "ウィンドウズ", "win"]
  },
  {
    seed: "Mac",
    title: "Mac対応",
    words: ["mac", "マック", "macbook", "ios"]
  },
  {
    seed: "スマホ",
    title: "スマホ対応",
    words: ["スマホ", "スマートフォン", "iphone", "android", "アプリ", "mobile"]
  },
  {
    seed: "API",
    title: "API・連携",
    words: ["api", "連携", "キー", "key", "認証", "oauth", "webhook"]
  },
  {
    seed: "エラー",
    title: "エラー・トラブル",
    words: ["エラー", "できない", "動かない", "失敗", "表示されない", "バグ", "詰ま", "困って", "error", "bug", "failed", "not working"]
  },
  {
    seed: "MCP",
    title: "MCP設定",
    words: ["mcp", "サーバー", "server", "設定ファイル"]
  },
  {
    seed: "安全",
    title: "安全性・リスク",
    words: ["安全", "危険", "リスク", "不安", "怖い", "個人情報", "セキュリティ", "security", "privacy"]
  },
  {
    seed: "英語",
    title: "英語・語学",
    words: ["英語", "英語力", "ielts", "toefl", "語学", "english"]
  },
  {
    seed: "学費",
    title: "学費・生活費",
    words: ["学費", "生活費", "家賃", "寮", "奨学金", "費用", "お金"]
  },
  {
    seed: "面接",
    title: "面接・出願",
    words: ["面接", "出願", "書類", "志望理由", "合格", "入試", "試験"]
  }
];

const KNOWN_TOPIC_WORDS = [
  "Cursor",
  "Claude Code",
  "Claude",
  "ChatGPT",
  "Gemini",
  "Perplexity",
  "API",
  "Windows",
  "Mac",
  "MCP",
  "Supabase",
  "Netlify",
  "Stripe",
  "YouTube",
  "TikTok",
  "X",
  "Instagram",
  "WordPress",
  "Canva",
  "料金",
  "無料",
  "有料",
  "導入",
  "設定",
  "使い方",
  "やり方",
  "英語",
  "学費",
  "奨学金",
  "面接",
  "出願"
];

async function signInWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: DEFAULT_REDIRECT_URL
    }
  });

  if (error) {
    console.error(error);
    alert("Googleログインに失敗しました。");
  }
}

async function signOut() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = null;
  renderAuth(null);
  setInitialStatus();
}

async function createProfile(user) {
  if (!user) return;

  const { data: existingUser, error: selectError } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error(selectError);
  }

  if (!existingUser) {
    const { error } = await supabaseClient
      .from("profiles")
      .insert([
        {
          id: user.id,
          email: user.email,
          plan: "free",
          usage_count: 0,
          free_usage_count: 0,
          paid_usage_remaining: 0
        }
      ]);

    if (error) {
      console.error(error);
    }
  }

  await loadProfile(user);
}

function renderAuth(user) {
  currentUser = user;

  if (!els.authLoggedOut || !els.authLoggedIn || !els.userEmail) return;

  els.authLoggedOut.classList.toggle("isHidden", Boolean(user));
  els.authLoggedIn.classList.toggle("isHidden", !user);
  els.userEmail.textContent = user ? `ログイン中：${user.email || ""}` : "";
}

async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  const user = data?.session?.user || null;

  if (user) {
    await createProfile(user);
  } else {
    currentProfile = null;
  }

  renderAuth(user);
  setInitialStatus();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user || null;

    if (user) {
      await createProfile(user);
    } else {
      currentProfile = null;
    }

    renderAuth(user);
    setInitialStatus();
  });
}

function getLegacyUsageCount() {
  return Number(currentProfile?.usage_count || 0);
}

function getFreeUsageCount() {
  const freeUsageCount = Number(currentProfile?.free_usage_count || 0);
  const legacyUsageCount = getLegacyUsageCount();

  return Math.max(freeUsageCount, legacyUsageCount);
}

function getPaidUsageRemaining() {
  return Number(currentProfile?.paid_usage_remaining || 0);
}

function getFreeRemainingUsage() {
  return Math.max(FREE_USAGE_LIMIT - getFreeUsageCount(), 0);
}

function getRemainingUsage() {
  const freeRemaining = getFreeRemainingUsage();

  if (freeRemaining > 0) {
    return freeRemaining;
  }

  return Math.max(getPaidUsageRemaining(), 0);
}

function getUsageMode() {
  if (getFreeRemainingUsage() > 0) {
    return "free";
  }

  if (getPaidUsageRemaining() > 0) {
    return "paid";
  }

  return "none";
}

async function loadProfile(user) {
  if (!user) {
    currentProfile = null;
    return null;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, email, plan, usage_count, free_usage_count, paid_usage_remaining")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    currentProfile = null;
    return null;
  }

  currentProfile = data;
  return data;
}

async function incrementUsageCount() {
  if (!currentUser || !currentProfile) {
    throw new Error("ログイン情報を確認できませんでした。");
  }

  const freeUsageCount = getFreeUsageCount();
  const paidUsageRemaining = getPaidUsageRemaining();

  if (freeUsageCount < FREE_USAGE_LIMIT) {
    const nextFreeUsageCount = freeUsageCount + 1;
    const nextLegacyUsageCount = Math.max(getLegacyUsageCount(), nextFreeUsageCount);

    const { data, error } = await supabaseClient
      .from("profiles")
      .update({
        usage_count: nextLegacyUsageCount,
        free_usage_count: nextFreeUsageCount
      })
      .eq("id", currentUser.id)
      .select("id, email, plan, usage_count, free_usage_count, paid_usage_remaining")
      .single();

    if (error) {
      console.error(error);
      throw new Error("無料使用回数の更新に失敗しました。");
    }

    currentProfile = data;

    return {
      mode: "free",
      remaining: getRemainingUsage()
    };
  }

  if (paidUsageRemaining > 0) {
    const nextPaidUsageRemaining = paidUsageRemaining - 1;

    const { data, error } = await supabaseClient
      .from("profiles")
      .update({
        plan: "paid",
        paid_usage_remaining: nextPaidUsageRemaining
      })
      .eq("id", currentUser.id)
      .select("id, email, plan, usage_count, free_usage_count, paid_usage_remaining")
      .single();

    if (error) {
      console.error(error);
      throw new Error("有料使用回数の更新に失敗しました。");
    }

    currentProfile = data;

    return {
      mode: "paid",
      remaining: getRemainingUsage()
    };
  }

  throw new Error("利用可能な分析回数がありません。有料プランをご確認ください。");
}

function showUpgradeBox(show) {
  if (els.upgradeBox) {
    els.upgradeBox.classList.toggle("isHidden", !show);
  }
}

function setStatus(message) {
  if (els.status) {
    els.status.textContent = message;
  }
}

function setInitialStatus() {
  if (!currentUser) {
    setStatus("Googleログインすると分析できます。");
    showUpgradeBox(false);
    return;
  }

  const freeRemaining = getFreeRemainingUsage();
  const paidRemaining = getPaidUsageRemaining();

  if (freeRemaining > 0) {
    setStatus(`動画URLを入力してください。無料分析は残り${freeRemaining}回です。`);
    showUpgradeBox(false);
    return;
  }

  if (paidRemaining > 0) {
    setStatus(`有料プラン利用中です。残り${paidRemaining}回分析できます。`);
    showUpgradeBox(false);
    return;
  }

  setStatus("無料利用は3回までです。有料プランをご確認ください。");
  showUpgradeBox(true);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(text) {
  return String(text || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForKey(text) {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[！？?！。、,.・/\[\]【】「」『』（）()\-ー〜~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractVideoId(url) {
  const text = String(url || "").trim();

  if (!text) return "";

  try {
    const parsed = new URL(text);

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.searchParams.get("v")) {
        return parsed.searchParams.get("v");
      }

      const parts = parsed.pathname.split("/").filter(Boolean);

      if (["shorts", "embed", "live"].includes(parts[0]) && parts[1]) {
        return parts[1];
      }
    }

    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || "";
    }
  } catch (_error) {
    // URLではなく動画IDだけ入力された場合も許可する
  }

  return /^[a-zA-Z0-9_-]{11}$/.test(text) ? text : "";
}

function getCommentText(comment) {
  return normalizeText(
    comment?.text ||
    comment?.textDisplay ||
    comment?.textOriginal ||
    comment?.snippet?.textDisplay ||
    comment?.snippet?.textOriginal ||
    ""
  );
}

function isQuestionLike(text) {
  const raw = normalizeText(text);
  const t = raw.toLowerCase();

  if (!t) return false;

  if (QUESTION_SIGNALS.some((signal) => t.includes(String(signal).toLowerCase()))) {
    return true;
  }

  if (/[？?]/.test(raw)) {
    return true;
  }

  if (/(ですか|ますか|でしょうか|できる|できない|ありますか|いますか|どれ|どこ|いつ|なに|何|誰|なぜ|どう|いくら)/.test(raw)) {
    return true;
  }

  return false;
}

function extractKnownTopic(text) {
  const raw = normalizeText(text);
  const lower = raw.toLowerCase();

  const found = KNOWN_TOPIC_WORDS.find((word) => {
    return lower.includes(String(word).toLowerCase());
  });

  return found || "";
}

function pickDemandTitle(text) {
  const raw = normalizeText(text);
  const t = normalizeForKey(raw);
  const topic = extractKnownTopic(raw);

  const matched = DEMAND_RULES.find((rule) => {
    return rule.words.some((word) => t.includes(String(word).toLowerCase()));
  });

  if (matched) {
    if (topic) {
      if (matched.seed === "料金") return `${topic}料金`;
      if (matched.seed === "違い") return `${topic}との違い`;
      if (matched.seed === "導入") return `${topic}導入方法`;
      if (matched.seed === "使い方") return `${topic}の使い方`;
      if (matched.seed === "初心者") return `${topic}初心者向け`;
      if (matched.seed === "Windows") return "Windows対応";
      if (matched.seed === "Mac") return "Mac対応";
      if (matched.seed === "スマホ") return "スマホ対応";
      if (matched.seed === "API") return `${topic} API`;
      if (matched.seed === "エラー") return `${topic}エラー対策`;
      if (matched.seed === "MCP") return "MCP設定";
      if (matched.seed === "安全") return `${topic}安全性`;
      if (matched.seed === "英語") return "英語・語学";
      if (matched.seed === "学費") return "学費・生活費";
      if (matched.seed === "面接") return "面接・出願";
    }

    return matched.title;
  }

  const clean = raw
    .replace(/^(質問|教えてください|教えて|知りたいです|知りたい|すみません|こんにちは)[、,.。\s]*/g, "")
    .replace(/[？?。！!]+$/g, "")
    .trim();

  if (clean.length <= 18) {
    return clean || "その他の疑問";
  }

  return `${clean.slice(0, 18)}…`;
}

function scoreImportance(comment, groupCount = 1) {
  const text = normalizeText(comment.text).toLowerCase();

  let score = 0;

  const likes = Number(comment.likeCount || 0);

  if (likes >= 10) score += 3;
  else if (likes >= 3) score += 2;
  else if (likes >= 1) score += 1;

  if (groupCount >= 10) score += 3;
  else if (groupCount >= 4) score += 2;
  else if (groupCount >= 2) score += 1;

  [
    "困って",
    "できない",
    "教えて",
    "知りたい",
    "必要",
    "お願いします",
    "至急",
    "おすすめ",
    "比較",
    "違い",
    "help",
    "not working"
  ].forEach((signal) => {
    if (text.includes(signal)) {
      score += 1;
    }
  });

  if (score >= 6) return "高";
  if (score >= 3) return "中";

  return "低";
}

function importanceClass(value) {
  if (value === "高") return "high";
  if (value === "中") return "mid";

  return "low";
}

async function fetchComments(videoId, maxComments) {
  const safeMax = Math.min(Math.max(Number(maxComments || 100), 1), MAX_COMMENT_LIMIT);

  const response = await fetch(
    `/.netlify/functions/comments?videoId=${encodeURIComponent(videoId)}&max=${safeMax}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "コメント取得に失敗しました。");
  }

  return Array.isArray(data.comments) ? data.comments : [];
}

function buildDemandGroups(questionRows) {
  const groupMap = new Map();

  questionRows.forEach((row) => {
    const demand = pickDemandTitle(row.question);

    if (!groupMap.has(demand)) {
      groupMap.set(demand, {
        demand,
        count: 0,
        totalLikes: 0,
        questions: []
      });
    }

    const group = groupMap.get(demand);

    group.count += 1;
    group.totalLikes += Number(row.likeCount || 0);
    group.questions.push(row);
  });

  return Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      representativeQuestions: group.questions
        .slice()
        .sort((a, b) => {
          return (b.likeCount - a.likeCount) || a.no - b.no;
        })
        .slice(0, 3)
        .map((row) => row.question)
    }))
    .sort((a, b) => {
      return (b.count - a.count) ||
        (b.totalLikes - a.totalLikes) ||
        a.demand.localeCompare(b.demand, "ja");
    });
}

function makeContentIdeas(demands) {
  return demands.slice(0, 8).map((group, index) => {
    const count = group.count;
    const stars = count >= 10 || index === 0 ? 5 : count >= 4 ? 4 : count >= 2 ? 3 : 2;
    const starText = "★".repeat(stars) + "☆".repeat(5 - stars);
    const title = makeIdeaTitle(group.demand);

    return {
      rating: starText,
      title,
      reason: `${group.count}件の質問が集まっています。実際の質問例：「${group.representativeQuestions[0] || group.demand}」`
    };
  });
}

function makeIdeaTitle(demand) {
  const d = String(demand || "");

  if (d.includes("料金")) return `${d}完全ガイド`;
  if (d.includes("違い") || d.includes("比較")) return `${d}を完全比較`;
  if (d.includes("導入")) return `${d}ガイド`;
  if (d.includes("使い方") || d.includes("やり方")) return `${d}を初心者向けに解説`;
  if (d.includes("初心者")) return `${d}スタートガイド`;
  if (d.includes("Windows")) return "Windows導入手順";
  if (d.includes("Mac")) return "Mac導入手順";
  if (d.includes("API")) return `${d}設定・料金・使い方ガイド`;
  if (d.includes("エラー") || d.includes("トラブル")) return `${d}まとめ`;
  if (d.includes("MCP")) return "失敗しないMCP設定方法";
  if (d.includes("安全")) return `${d}をわかりやすく解説`;
  if (d.includes("英語")) return "英語力・語学対策まとめ";
  if (d.includes("学費")) return "学費・生活費のリアルまとめ";
  if (d.includes("面接")) return "面接・出願対策まとめ";

  return `${d}をわかりやすく解説`;
}

function analyzeComments(comments) {
  const questions = comments
    .map((comment) => {
      return {
        ...comment,
        normalizedText: getCommentText(comment)
      };
    })
    .filter((comment) => isQuestionLike(comment.normalizedText))
    .map((comment, index) => {
      const question = normalizeText(comment.normalizedText);

      return {
        no: index + 1,
        seed: pickDemandTitle(question),
        importance: "低",
        likeCount: Number(comment.likeCount || 0),
        question,
        author: comment.author || "",
        publishedAt: comment.publishedAt || "",
        commentUrl: comment.url || ""
      };
    });

  const demands = buildDemandGroups(questions);

  const countByDemand = Object.fromEntries(
    demands.map((group) => [group.demand, group.count])
  );

  questions.forEach((row) => {
    row.importance = scoreImportance(
      {
        text: row.question,
        likeCount: row.likeCount
      },
      countByDemand[row.seed] || 1
    );
  });

  const finalDemands = buildDemandGroups(questions);

  return {
    questions,
    demands: finalDemands,
    ideas: makeContentIdeas(finalDemands)
  };
}

function renderResults(analysis, totalComments) {
  const { questions, demands, ideas } = analysis;

  if (els.totalCount) els.totalCount.textContent = String(totalComments);
  if (els.questionCount) els.questionCount.textContent = String(questions.length);
  if (els.demandCount) els.demandCount.textContent = String(demands.length);

  renderDemandRanking(demands);
  renderRepresentativeQuestions(demands);
  renderContentIdeas(ideas);
  renderQuestionTable(questions);
}

function renderDemandRanking(demands) {
  if (!els.demandRanking) return;

  if (!demands.length) {
    els.demandRanking.innerHTML = `<p class="emptyBox">質問からネタの種を見つけられませんでした。</p>`;
    return;
  }

  els.demandRanking.innerHTML = demands.slice(0, 10).map((group, index) => {
    return `
      <div class="demandItem">
        <span class="demandRank">${index + 1}</span>
        <div>
          <div class="demandName">${escapeHtml(group.demand)}</div>
         
        </div>
        <div class="demandCount">${group.count}件</div>
      </div>
    `;
  }).join("");
}

function renderRepresentativeQuestions(demands) {
  if (!els.representativeQuestions) return;

  if (!demands.length) {
    els.representativeQuestions.innerHTML = `<p class="emptyBox">まだ質問はありません。</p>`;
    return;
  }

  els.representativeQuestions.innerHTML = demands.slice(0, 8).map((group) => {
    return `
      <div class="questionGroup">
        <h3>${escapeHtml(group.demand)}</h3>
        <ul>
          ${group.representativeQuestions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}
        </ul>
      </div>
    `;
  }).join("");
}

function renderContentIdeas(ideas) {
  if (!els.contentIdeas) return;

  if (!ideas.length) {
    els.contentIdeas.innerHTML = `<p class="emptyBox">まだ記事・動画ネタ候補はありません。</p>`;
    return;
  }

  els.contentIdeas.innerHTML = ideas.map((idea) => {
    return `
      <div class="ideaItem">
        <div class="ideaStars">${escapeHtml(idea.rating)}</div>
        <div class="ideaTitle">${escapeHtml(idea.title)}</div>
        <div class="ideaReason">${escapeHtml(idea.reason)}</div>
      </div>
    `;
  }).join("");
}

function renderQuestionTable(rows) {
  if (!els.resultBody) return;

  const keyword = normalizeForKey(els.questionSearch?.value || "");

  const filtered = keyword
    ? rows.filter((row) => {
        return normalizeForKey(
          `${row.seed} ${row.importance} ${row.likeCount} ${row.question} ${row.author}`
        ).includes(keyword);
      })
    : rows;

  if (!filtered.length) {
    els.resultBody.innerHTML = `<tr><td colspan="6" class="empty">表示できる質問はありません。</td></tr>`;
    return;
  }

  els.resultBody.innerHTML = filtered.map((row) => {
    return `
      <tr>
        <td>${row.no}</td>
        <td>${escapeHtml(row.seed)}</td>
        <td><span class="badge ${importanceClass(row.importance)}">${escapeHtml(row.importance)}</span></td>
        <td>${row.likeCount}</td>
        <td>
          ${escapeHtml(row.question)}
          ${row.commentUrl ? `<br><a href="${escapeHtml(row.commentUrl)}" target="_blank" rel="noopener">コメントを開く</a>` : ""}
        </td>
        <td>${escapeHtml(row.author)}</td>
      </tr>
    `;
  }).join("");
}

function downloadExcel() {
  if (!latestAnalysis.questions.length) {
    alert("ダウンロードできる分析結果がありません。");
    return;
  }

  const workbook = XLSX.utils.book_new();

  const demandRows = latestAnalysis.demands.map((group, index) => ({
    順位: index + 1,
    ネタ: group.demand,
    件数: group.count
  }));

  const ideaRows = latestAnalysis.ideas.map((idea) => ({
    評価: idea.rating,
    タイトル: idea.title,
    理由: idea.reason
  }));

  const questionRows = latestAnalysis.questions.map((row) => ({
    No: row.no,
    ネタの種: row.seed,
    重要度: row.importance,
    いいね数: row.likeCount,
    質問: row.question,
    投稿者: row.author,
    URL: row.commentUrl,
    投稿日: row.publishedAt
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(demandRows),
    "需要ランキング"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(ideaRows),
    "記事・動画ネタ候補"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(questionRows),
    "質問一覧"
  );

  XLSX.writeFile(workbook, "youtube-neta-analysis.xlsx");
}

async function runAnalyze() {
  if (!currentUser) {
    alert("分析するにはGoogleログインしてください。");
    setStatus("Googleログインすると分析できます。");
    return;
  }

  await loadProfile(currentUser);

  const usageMode = getUsageMode();

  if (usageMode === "none") {
    alert("無料利用は3回までです。有料プランをご確認ください。");
    setStatus("無料利用は3回までです。有料プランをご確認ください。");
    showUpgradeBox(true);
    return;
  }

  const videoId = extractVideoId(els.videoUrl.value);
  const maxComments = Number(els.maxComments.value || 100);

  if (!videoId) {
    alert("YouTube動画URLが正しくありません。");
    return;
  }

  latestAnalysis = {
    videoId,
    totalComments: 0,
    questions: [],
    demands: [],
    ideas: []
  };

  if (els.downloadBtn) els.downloadBtn.disabled = true;
  if (els.analyzeBtn) els.analyzeBtn.disabled = true;

  try {
    setStatus("コメントを取得しています...");

    const comments = await fetchComments(videoId, maxComments);

    setStatus(`コメント${comments.length}件を取得しました。質問を抽出し、需要ランキングを作成しています...`);

    const analysis = analyzeComments(comments);

    latestAnalysis = {
      videoId,
      totalComments: comments.length,
      ...analysis
    };

    renderResults(analysis, comments.length);

    if (els.downloadBtn) {
      els.downloadBtn.disabled = analysis.questions.length === 0;
    }

    const usageResult = await incrementUsageCount();

    if (usageResult.mode === "free") {
      if (usageResult.remaining > 0) {
        setStatus(`分析完了：${comments.length}件中、質問を${analysis.questions.length}件抽出し、ネタの種を${analysis.demands.length}件作成しました。無料分析は残り${usageResult.remaining}回です。`);
        showUpgradeBox(false);
      } else {
        setStatus(`分析完了：${comments.length}件中、質問を${analysis.questions.length}件抽出し、ネタの種を${analysis.demands.length}件作成しました。無料利用は今回で終了です。`);
        showUpgradeBox(true);
      }

      return;
    }

    if (usageResult.mode === "paid") {
      if (usageResult.remaining > 0) {
        setStatus(`分析完了：${comments.length}件中、質問を${analysis.questions.length}件抽出し、ネタの種を${analysis.demands.length}件作成しました。有料プランは残り${usageResult.remaining}回です。`);
        showUpgradeBox(false);
      } else {
        setStatus(`分析完了：${comments.length}件中、質問を${analysis.questions.length}件抽出し、ネタの種を${analysis.demands.length}件作成しました。有料プラン30回分を使い切りました。`);
        showUpgradeBox(true);
      }

      return;
    }
  } catch (error) {
    console.error(error);
    setStatus(`エラー：${error.message}`);
    alert(error.message);
  } finally {
    if (els.analyzeBtn) els.analyzeBtn.disabled = false;
  }
}

function clearAll() {
  latestAnalysis = {
    videoId: "",
    totalComments: 0,
    questions: [],
    demands: [],
    ideas: []
  };

  if (els.videoUrl) els.videoUrl.value = "";
  if (els.questionSearch) els.questionSearch.value = "";

  if (els.totalCount) els.totalCount.textContent = "0";
  if (els.questionCount) els.questionCount.textContent = "0";
  if (els.demandCount) els.demandCount.textContent = "0";
  if (els.downloadBtn) els.downloadBtn.disabled = true;

  if (els.demandRanking) {
    els.demandRanking.innerHTML = `<p class="emptyBox">まだランキングはありません。動画URLを入力して「ネタを探す」を押してください。</p>`;
  }

  if (els.representativeQuestions) {
    els.representativeQuestions.innerHTML = `<p class="emptyBox">まだ質問はありません。</p>`;
  }

  if (els.contentIdeas) {
    els.contentIdeas.innerHTML = `<p class="emptyBox">まだ記事・動画ネタ候補はありません。</p>`;
  }

  if (els.resultBody) {
    els.resultBody.innerHTML = `<tr><td colspan="6" class="empty">まだ分析結果はありません。</td></tr>`;
  }

  setInitialStatus();
}

if (els.loginBtn) {
  els.loginBtn.addEventListener("click", signInWithGoogle);
}

if (els.logoutBtn) {
  els.logoutBtn.addEventListener("click", signOut);
}

if (els.analyzeBtn) {
  els.analyzeBtn.addEventListener("click", runAnalyze);
}

if (els.downloadBtn) {
  els.downloadBtn.addEventListener("click", downloadExcel);
}

if (els.clearBtn) {
  els.clearBtn.addEventListener("click", clearAll);
}

if (els.questionSearch) {
  els.questionSearch.addEventListener("input", () => {
    renderQuestionTable(latestAnalysis.questions);
  });
}

initAuth();
setInitialStatus();