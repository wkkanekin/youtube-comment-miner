const els = {
  videoUrl: document.getElementById("videoUrl"),
  maxComments: document.getElementById("maxComments"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  clearBtn: document.getElementById("clearBtn"),
  status: document.getElementById("status"),
  totalCount: document.getElementById("totalCount"),
  questionCount: document.getElementById("questionCount"),
  unrepliedCount: document.getElementById("unrepliedCount"),
  resultBody: document.getElementById("resultBody"),
  categorySummary: document.getElementById("categorySummary"),
  upgradeBox: document.getElementById("upgradeBox"),
  upgradeBtn: document.getElementById("upgradeBtn")
};

let latestRows = [];

const FREE_USAGE_LIMIT = 3;
const USAGE_STORAGE_KEY = "youtube_question_miner_usage_count";

function getUsageCount() {
  return Number(localStorage.getItem(USAGE_STORAGE_KEY) || 0);
}

function setUsageCount(count) {
  localStorage.setItem(USAGE_STORAGE_KEY, String(count));
}

function incrementUsageCount() {
  const next = getUsageCount() + 1;
  setUsageCount(next);
  return next;
}

function getRemainingUsage() {
  return Math.max(FREE_USAGE_LIMIT - getUsageCount(), 0);
}

function showUpgradeBox(show) {
  if (!els.upgradeBox) return;
  els.upgradeBox.classList.toggle("isHidden", !show);
}

function setStatus(message) {
  els.status.textContent = message;
}

function setInitialStatus() {
  const remaining = getRemainingUsage();

  if (remaining <= 0) {
    setStatus("無料利用は3回までです。有料プランをご確認ください。");
    showUpgradeBox(true);
    return;
  }

  setStatus(`動画URLを入力してください。無料分析は残り${remaining}回です。`);
  showUpgradeBox(false);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function extractVideoId(url) {
  const text = String(url || "").trim();

  if (!text) return "";

  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      return match[1];
    }
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  return "";
}

function normalizeText(text) {
  return String(text || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isQuestionLike(text) {
  const t = normalizeText(text).toLowerCase();

  if (!t) return false;

  const questionSignals = [
    "?",
    "？",
    "教えて",
    "知りたい",
    "どう",
    "どの",
    "どこ",
    "いつ",
    "なぜ",
    "なんで",
    "いくら",
    "何円",
    "何点",
    "必要",
    "できますか",
    "ですか",
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
    "how",
    "what",
    "why",
    "when",
    "where",
    "which",
    "can i",
    "can you",
    "do you",
    "does",
    "is it",
    "are there",
    "any tips",
    "recommend"
  ];

  return questionSignals.some((signal) => t.includes(signal));
}

function classifyComment(text) {
  const t = normalizeText(text).toLowerCase();

  const categories = [
    {
      name: "料金・費用",
      words: ["費用", "料金", "金額", "いくら", "高い", "安い", "学費", "生活費", "price", "cost", "fee", "money"]
    },
    {
      name: "やり方・手順",
      words: ["方法", "やり方", "手順", "どうやって", "始め方", "使い方", "設定", "how", "step", "setup"]
    },
    {
      name: "比較・おすすめ",
      words: ["おすすめ", "どっち", "比較", "違い", "選ぶ", "ランキング", "recommend", "better", "compare", "best"]
    },
    {
      name: "不安・悩み",
      words: ["不安", "怖い", "心配", "難しい", "無理", "困って", "できない", "悩み", "anxious", "worried", "hard", "difficult"]
    },
    {
      name: "購入・導入検討",
      words: ["買う", "購入", "申し込み", "登録", "契約", "導入", "使いたい", "buy", "purchase", "subscribe", "sign up"]
    },
    {
      name: "トラブル・エラー",
      words: ["エラー", "動かない", "できません", "表示されない", "バグ", "失敗", "error", "bug", "not working", "failed"]
    },
    {
      name: "動画リクエスト",
      words: ["動画にして", "解説して", "取り上げて", "企画", "次回", "もっと", "please make", "cover", "next video"]
    }
  ];

  for (const category of categories) {
    if (category.words.some((word) => t.includes(word))) {
      return category.name;
    }
  }

  return "一般質問";
}

function scoreImportance(comment) {
  const text = normalizeText(comment.text).toLowerCase();

  let score = 0;

  if (comment.likeCount >= 10) score += 3;
  else if (comment.likeCount >= 3) score += 2;
  else if (comment.likeCount >= 1) score += 1;

  if (!comment.hasReply) score += 2;

  const strongSignals = [
    "困って",
    "できない",
    "教えて",
    "知りたい",
    "不安",
    "悩み",
    "至急",
    "お願いします",
    "help",
    "urgent",
    "problem",
    "not working"
  ];

  strongSignals.forEach((signal) => {
    if (text.includes(signal)) {
      score += 1;
    }
  });

  if (score >= 5) return "高";
  if (score >= 3) return "中";

  return "低";
}

function importanceClass(value) {
  if (value === "高") return "high";
  if (value === "中") return "mid";

  return "low";
}

async function fetchComments(videoId, maxComments) {
  const response = await fetch(
    `/.netlify/functions/comments?videoId=${encodeURIComponent(videoId)}&max=${maxComments}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "コメント取得失敗");
  }

  return data.comments || [];
}

function analyzeComments(comments) {
  return comments
    .filter((comment) => isQuestionLike(comment.text))
    .map((comment, index) => {
      const category = classifyComment(comment.text);
      const importance = scoreImportance(comment);

      return {
        no: index + 1,
        category,
        importance,
        replyStatus: comment.hasReply ? "返信あり" : "未返信",
        replyCount: comment.replyCount,
        likeCount: comment.likeCount,
        comment: comment.text,
        author: comment.author,
        publishedAt: comment.publishedAt,
        commentUrl: comment.url
      };
    });
}

function renderResults(rows, totalComments) {
  els.totalCount.textContent = String(totalComments);
  els.questionCount.textContent = String(rows.length);

  const unreplied = rows.filter((row) => row.replyStatus === "未返信").length;
  els.unrepliedCount.textContent = String(unreplied);

  renderCategorySummary(rows);

  if (!rows.length) {
    els.resultBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">
          質問らしいコメントは見つかりませんでした。
        </td>
      </tr>
    `;
    return;
  }

  els.resultBody.innerHTML = rows.map((row) => {
    const impClass = importanceClass(row.importance);
    const replyClass = row.replyStatus === "未返信" ? "noreply" : "reply";

    return `
      <tr>
        <td>${row.no}</td>
        <td>${escapeHtml(row.category)}</td>
        <td>
          <span class="badge ${impClass}">
            ${escapeHtml(row.importance)}
          </span>
        </td>
        <td>
          <span class="badge ${replyClass}">
            ${escapeHtml(row.replyStatus)}
          </span>
        </td>
        <td>${row.likeCount}</td>
        <td>
          ${escapeHtml(row.comment)}
          <br />
          <a href="${escapeHtml(row.commentUrl)}" target="_blank" rel="noopener">
            コメントを開く
          </a>
        </td>
        <td>${escapeHtml(row.author)}</td>
      </tr>
    `;
  }).join("");
}

function renderCategorySummary(rows) {
  if (!rows.length) {
    els.categorySummary.innerHTML = "";
    return;
  }

  const counts = {};

  rows.forEach((row) => {
    counts[row.category] = (counts[row.category] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  els.categorySummary.innerHTML = sorted.map(([category, count]) => {
    return `
      <span class="categoryPill">
        ${escapeHtml(category)}：${count}件
      </span>
    `;
  }).join("");
}

function downloadExcel() {
  if (!latestRows.length) {
    alert("ダウンロードできる分析結果がありません。");
    return;
  }

  const summaryRows = [];

  const categoryCounts = {};
  latestRows.forEach((row) => {
    categoryCounts[row.category] = (categoryCounts[row.category] || 0) + 1;
  });

  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      summaryRows.push({
        分類: category,
        件数: count
      });
    });

  const detailRows = latestRows.map((row) => ({
    No: row.no,
    分類: row.category,
    重要度: row.importance,
    返信状況: row.replyStatus,
    返信数: row.replyCount,
    いいね数: row.likeCount,
    コメント: row.comment,
    投稿者: row.author,
    投稿日: row.publishedAt,
    コメントURL: row.commentUrl
  }));

  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  const detailSheet = XLSX.utils.json_to_sheet(detailRows);

  XLSX.utils.book_append_sheet(workbook, summarySheet, "分類サマリー");
  XLSX.utils.book_append_sheet(workbook, detailSheet, "質問コメント一覧");

  XLSX.writeFile(workbook, "youtube-question-comments.xlsx");
}

async function runAnalyze() {
  const currentUsage = getUsageCount();

  if (currentUsage >= FREE_USAGE_LIMIT) {
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

  latestRows = [];
  els.downloadBtn.disabled = true;
  els.analyzeBtn.disabled = true;

  try {
    setStatus("コメントを取得しています...");

    const comments = await fetchComments(videoId, maxComments);

    setStatus(`コメント${comments.length}件を取得しました。質問を抽出しています...`);

    const rows = analyzeComments(comments);

    latestRows = rows;

    renderResults(rows, comments.length);

    els.downloadBtn.disabled = rows.length === 0;

    const newUsageCount = incrementUsageCount();
    const remaining = Math.max(FREE_USAGE_LIMIT - newUsageCount, 0);

    if (remaining > 0) {
      setStatus(
        `分析完了：${comments.length}件中、質問らしいコメントを${rows.length}件抽出しました。無料分析は残り${remaining}回です。`
      );
      showUpgradeBox(false);
    } else {
      setStatus(
        `分析完了：${comments.length}件中、質問らしいコメントを${rows.length}件抽出しました。無料利用は今回で終了です。`
      );
      showUpgradeBox(true);
    }

  } catch (error) {
    console.error(error);
    setStatus(`エラー：${error.message}`);
    alert(error.message);
  } finally {
    els.analyzeBtn.disabled = false;
  }
}

function clearAll() {
  latestRows = [];

  els.videoUrl.value = "";

  els.totalCount.textContent = "0";
  els.questionCount.textContent = "0";
  els.unrepliedCount.textContent = "0";

  els.downloadBtn.disabled = true;
  els.categorySummary.innerHTML = "";

  els.resultBody.innerHTML = `
    <tr>
      <td colspan="7" class="empty">
        まだ分析結果はありません。
      </td>
    </tr>
  `;

  setInitialStatus();
}



els.analyzeBtn.addEventListener("click", runAnalyze);
els.downloadBtn.addEventListener("click", downloadExcel);
els.clearBtn.addEventListener("click", clearAll);

setInitialStatus();