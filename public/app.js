const affirmationsList = document.getElementById("affirmations");
const newsContainer = document.getElementById("news");
const generatedAt = document.getElementById("generated-at");
const newsCardTemplate = document.getElementById("news-card-template");

function renderAffirmations(affirmations) {
  affirmationsList.innerHTML = "";

  affirmations.forEach((affirmation) => {
    const item = document.createElement("li");
    item.className = "affirmation-item";
    item.textContent = affirmation;
    affirmationsList.appendChild(item);
  });
}

function renderNews(news) {
  newsContainer.innerHTML = "";

  news.forEach((story) => {
    const card = newsCardTemplate.content.cloneNode(true);
    const source = card.querySelector(".news-source");
    const title = card.querySelector("h3");
    const summary = card.querySelector(".news-summary");
    const link = card.querySelector(".news-link");

    source.textContent = story.source;
    title.textContent = story.title;
    summary.textContent = story.summary;
    link.href = story.link;

    newsContainer.appendChild(card);
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
    renderAffirmations(payload.affirmations);
    renderNews(payload.news);
  } catch (error) {
    generatedAt.textContent = error.message;
    renderAffirmations([
      "I keep my focus on what is useful and true.",
      "I can return to calm and move with intention.",
      "I notice progress even when it arrives quietly.",
      "I am allowed to build a better day in small pieces.",
    ]);

    newsContainer.innerHTML = `
      <article class="news-card">
        <p class="news-source">Status</p>
        <h3>Feed unavailable</h3>
        <p class="news-summary">The app could not reach the live news sources just now. Reload and try again.</p>
        <span class="news-link disabled-link">Retry later</span>
      </article>
    `;
  }
}

loadFeed();
