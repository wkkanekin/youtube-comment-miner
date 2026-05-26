exports.handler = async function (event) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return response(500, {
      error: "YOUTUBE_API_KEY is not set."
    });
  }

  const videoId = event.queryStringParameters?.videoId || "";
  const max = Number(event.queryStringParameters?.max || 100);

  if (!videoId) {
    return response(400, {
      error: "videoId is required."
    });
  }

  const safeMax = Math.min(Math.max(max, 1), 500);

  try {
    const comments = [];
    let pageToken = "";

    while (comments.length < safeMax) {
      const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");

      url.searchParams.set("part", "snippet,replies");
      url.searchParams.set("videoId", videoId);
      url.searchParams.set("maxResults", "100");
      url.searchParams.set("order", "relevance");
      url.searchParams.set("textFormat", "html");
      url.searchParams.set("key", apiKey);

      if (pageToken) {
        url.searchParams.set("pageToken", pageToken);
      }

      const youtubeResponse = await fetch(url.toString());

      if (!youtubeResponse.ok) {
        const errorText = await youtubeResponse.text();

        return response(youtubeResponse.status, {
          error: "YouTube API error.",
          detail: errorText.slice(0, 500)
        });
      }

      const data = await youtubeResponse.json();
      const items = Array.isArray(data.items) ? data.items : [];

      items.forEach((item) => {
        const snippet = item?.snippet?.topLevelComment?.snippet || {};
        const topCommentId = item?.snippet?.topLevelComment?.id || "";
        const totalReplyCount = Number(item?.snippet?.totalReplyCount || 0);

        comments.push({
          commentId: topCommentId,
          author: snippet.authorDisplayName || "",
          text: normalizeText(snippet.textDisplay || snippet.textOriginal || ""),
          likeCount: Number(snippet.likeCount || 0),
          publishedAt: snippet.publishedAt || "",
          updatedAt: snippet.updatedAt || "",
          hasReply: totalReplyCount > 0,
          replyCount: totalReplyCount,
          url: `https://www.youtube.com/watch?v=${videoId}&lc=${topCommentId}`
        });
      });

      pageToken = data.nextPageToken || "";

      if (!pageToken || items.length === 0) {
        break;
      }
    }

    return response(200, {
      comments: comments.slice(0, safeMax)
    });
  } catch (error) {
    return response(500, {
      error: error.message || "Unknown error."
    });
  }
};

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

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}
