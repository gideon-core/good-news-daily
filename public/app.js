const feedContainer = document.getElementById("feed");
const affirmationStack = document.getElementById("affirmation-stack");
const generatedAt = document.getElementById("generated-at");
const storyTemplate = document.getElementById("story-template");
const affirmationTemplate = document.getElementById("affirmation-template");
const entityDecoder = document.createElement("textarea");

function decodeHtmlEntities(value) {
  entityDecoder.innerHTML = value;
  return entityDecoder.value;
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function formatRelativeTime(input) {
  if (!input) {
    return "Just now";
  }

  const delta = Date.now() - new Date(input).getTime();
  const hours = Math.max(1, Math.floor(delta / 3600000));

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function buildEngagement(seedText) {
  const hash = hashString(seedText);
  return {
    cheers: 80 + (hash % 620),
    boosts: 12 + (hash % 90),
    saves: 20 + (hash % 160),
  };
}

function buildFeedItems(news, affirmations) {
  const items = [];
  let affirmationIndex = 0;

  news.forEach((story, index) => {
    items.push({ type: "story", payload: story });

    const shouldInsertAffirmation =
      affirmationIndex < affirmations.length &&
      (index === 0 || index % 2 === 1);

    if (shouldInsertAffirmation) {
      items.push({
        type: "affirmation",
        payload: affirmations[affirmationIndex],
      });
      affirmationIndex += 1;
    }
  });

  while (affirmationIndex < affirmations.length) {
    items.push({
      type: "affirmation",
      payload: affirmations[affirmationIndex],
    });
    affirmationIndex += 1;
  }

  return items;
}

function renderAffirmationStack(affirmations) {
  affirmationStack.innerHTML = "";

  affirmations.forEach((affirmation) => {
    const item = document.createElement("article");
    item.className = "stack-item";
    item.textContent = affirmation;
    affirmationStack.appendChild(item);
  });
}

function renderStory(story) {
  const card = storyTemplate.content.cloneNode(true);
  const author = card.querySelector(".post-author");
  const handle = card.querySelector(".post-handle");
  const mediaText = card.querySelector(".post-media-text");
  const title = card.querySelector(".post-title");
  const summary = card.querySelector(".post-summary");
  const link = card.querySelector(".open-story");
  const avatar = card.querySelector(".source-avatar");
  const cheers = card.querySelector(".action-cheer");
  const boosts = card.querySelector(".action-boost");
  const engagement = buildEngagement(story.title);

  author.textContent = story.source;
  handle.textContent = `${formatRelativeTime(story.pubDate)} • uplifting report`;
  mediaText.textContent = story.source
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3);
  avatar.textContent = mediaText.textContent;
  title.textContent = decodeHtmlEntities(story.title);
  summary.textContent = decodeHtmlEntities(story.summary);
  link.href = story.link;
  cheers.textContent = `${engagement.cheers} cheers`;
  boosts.textContent = `${engagement.boosts} boosts`;

  feedContainer.appendChild(card);
}

function renderAffirmation(affirmation) {
  const card = affirmationTemplate.content.cloneNode(true);
  const quote = card.querySelector(".affirmation-quote");
  const cheers = card.querySelector(".action-cheer");
  const saves = card.querySelector(".action-save");
  const engagement = buildEngagement(affirmation);

  quote.textContent = decodeHtmlEntities(affirmation);
  cheers.textContent = `${engagement.cheers} lifts`;
  saves.textContent = `${engagement.saves} saves`;

  feedContainer.appendChild(card);
}

function renderFeed(news, affirmations) {
  feedContainer.innerHTML = "";
  const items = buildFeedItems(news, affirmations);

  items.forEach((item) => {
    if (item.type === "story") {
      renderStory(item.payload);
      return;
    }

    renderAffirmation(item.payload);
  });
}

async function loadFeed() {
  try {
    const response = await fetch("/api/feed");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Unable to load feed");
    }

    generatedAt.textContent = `Updated ${new Date(payload.generatedAt).toLocaleString()}`;
    renderAffirmationStack(payload.affirmations);
    renderFeed(payload.news, payload.affirmations);
  } catch (error) {
    generatedAt.textContent = error.message;

    const fallbackAffirmations = [
      "I keep my focus on what is useful and true.",
      "I can return to calm and move with intention.",
      "I notice progress even when it arrives quietly.",
      "I am allowed to build a better day in small pieces.",
    ];

    renderAffirmationStack(fallbackAffirmations);
    renderFeed(
      [
        {
          source: "Status",
          pubDate: null,
          title: "Feed unavailable",
          summary:
            "The app could not reach the live news sources just now. Reload and try again.",
          link: "#",
        },
      ],
      fallbackAffirmations,
    );
  }
}

loadFeed();
