const express = require("express");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

const app = express();
const port = process.env.PORT || 3000;
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

const NEWS_SOURCES = [
  {
    name: "Good Good Good",
    url: "https://www.goodgoodgood.co/rss.xml",
  },
  {
    name: "Positive News",
    url: "https://www.positive.news/feed/",
  },
];

const subjects = [
  "steady progress",
  "small brave steps",
  "clear thinking",
  "quiet confidence",
  "kind persistence",
  "fresh energy",
  "honest momentum",
  "creative focus",
  "patient growth",
  "grounded optimism",
  "practical courage",
  "calm ambition",
];

const openings = [
  "Today I welcome",
  "I am building",
  "I choose",
  "I have room for",
  "I create",
  "I move with",
  "I trust",
  "I strengthen",
  "I practice",
  "I bring",
  "I grow through",
  "I make space for",
];

const closings = [
  "with discipline and ease.",
  "and it shows in my actions.",
  "without needing permission to begin.",
  "one useful decision at a time.",
  "and I let it compound.",
  "while staying kind to myself.",
  "and I keep going.",
  "in ways other people can feel.",
  "with enough patience to do it well.",
  "and I use it well today.",
  "while remaining open and curious.",
  "and that is enough for now.",
];

function getDayOfYear(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleUnique(list, count, rand) {
  const pool = [...list];
  const picks = [];

  while (picks.length < count && pool.length > 0) {
    const index = Math.floor(rand() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }

  return picks;
}

function buildDailyAffirmations(now = new Date()) {
  const seed =
    now.getUTCFullYear() * 1000 +
    getDayOfYear(now) +
    now.getUTCMonth() * 37;
  const rand = mulberry32(seed);
  const chosenOpenings = sampleUnique(openings, 4, rand);
  const chosenSubjects = sampleUnique(subjects, 4, rand);
  const chosenClosings = sampleUnique(closings, 4, rand);

  return chosenOpenings.map((opening, index) => {
    return `${opening} ${chosenSubjects[index]} ${chosenClosings[index]}`;
  });
}

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeItem(item, sourceName) {
  const image =
    item.enclosure?.url ||
    item["media:content"]?.url ||
    item["media:thumbnail"]?.url ||
    null;

  return {
    title: item.title || "Untitled story",
    link: item.link || "#",
    summary:
      item.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
      "A positive story worth opening.",
    pubDate: item.pubDate || item.published || null,
    image,
    source: sourceName,
  };
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "good-news-daily/1.0",
      accept: "application/rss+xml, application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${source.name}: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const items = toArray(parsed?.rss?.channel?.item).map((item) =>
    normalizeItem(item, source.name),
  );

  return items.filter((item) => item.title && item.link);
}

async function getGoodNews() {
  const results = await Promise.allSettled(NEWS_SOURCES.map(fetchSource));
  const stories = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

  const uniqueStories = [];
  const seenLinks = new Set();

  for (const story of stories) {
    if (seenLinks.has(story.link)) {
      continue;
    }

    seenLinks.add(story.link);
    uniqueStories.push(story);
  }

  if (uniqueStories.length > 0) {
    return uniqueStories.slice(0, 6);
  }

  return [
    {
      title: "No live good-news feed was available",
      link: "#",
      summary:
        "The app could not reach its news sources right now, but the rest of the experience is still live.",
      pubDate: null,
      image: null,
      source: "Fallback",
    },
  ];
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/feed", async (_req, res) => {
  try {
    const news = await getGoodNews();
    const affirmations = buildDailyAffirmations();
    res.json({
      generatedAt: new Date().toISOString(),
      news,
      affirmations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load the good news feed.",
      details: error.message,
      affirmations: buildDailyAffirmations(),
    });
  }
});

app.listen(port, () => {
  console.log(`Good News Daily listening on http://localhost:${port}`);
});
