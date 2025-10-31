# Enchanting To‑Do

A zero-dependency, static HTML/CSS/JS to‑do app with an enchanting UI and 9+ power features.

## Features
- Add, edit inline, delete, toggle complete
- Due dates with friendly relative labels
- Priority badges (High / Normal / Low)
- Tags (comma-separated) and search
- Filters by status and priority
- Drag-and-drop reordering (HTML5 DnD)
- Bulk select and complete
- Clear completed
- Persistent via localStorage

## Tech
- No build tools. Pure HTML/CSS/JS
- Scoped, BEM-style CSS under `.app` to prevent overlap

## Run locally
- Open `index.html` in your browser.

## Deploy on Render (Static Site)
- Build command: none
- Publish directory: `.`
- Index document: `index.html`

## GitHub
Initialize and push:

```bash
git init
git add .
git commit -m "feat: enchanting to-do app"
# create a repo on GitHub and replace URL below
git branch -M main
git remote add origin https://github.com/<you>/enchanting-todo.git
git push -u origin main
```

## Render
- Create a new Static Site on Render
- Connect the GitHub repo
- Root directory: `.`
- Build command: leave empty
- Publish directory: `.`
