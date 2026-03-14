# Good News Daily

A minimal Node.js app that shows a live good-news feed and a fresh set of daily affirmations on the homepage.

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Run with Docker

```bash
docker build -t good-news-daily .
docker run --rm -p 3000:3000 good-news-daily
```

Then open `http://localhost:3000`.

## What it does

- Fetches uplifting stories from live RSS feeds on the server.
- Generates a new deterministic set of affirmations each day.
- Renders everything on a single homepage for the first version.
