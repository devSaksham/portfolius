# Portfolius

My portfolio, built as a walk through Hogwarts. Plain HTML, CSS and JavaScript: no framework, no build step.

**Live:** https://devsaksham.github.io/portfolius/

## What's on the page

| Section | What it shows |
|---|---|
| The Great Hall | Intro and what I work on |
| The Room of Requirement | Five projects; each opens a *Daily Prophet* front page with the full write-up and a flow diagram |
| The Sorting Hat | An animated hat that sorts the visitor or talks about me |
| The Wizarding Journey | Experience and achievements |
| The Spellbook | Skills, with the ones used in real projects marked in gold |
| Hogwarts Records | About, education, and a LeetCode + GitHub activity heatmap |
| The Owl Post | Contact form (sent through Web3Forms) |
| [Spell Class](spell-class.html) | A mini-game for practising shell, git and Docker commands as spells |

There's also a command palette (`Ctrl/⌘ + K`) for jumping between sections and optional castle music (the music-note button or `M`). Animations respect `prefers-reduced-motion`.

## Activity data

`data/activity.json` holds my LeetCode submission calendar and GitHub contribution counts. A GitHub Actions workflow (`.github/workflows/activity.yml`) runs `scripts/update_activity.py` every six hours and commits the file only when it changes. If a source can't be reached, the previous numbers are kept and the run is marked failed so I get notified.

## Run locally

The page fetches `data/activity.json`, so serve the folder instead of opening the file directly:

```bash
git clone https://github.com/devSaksham/portfolius.git
cd portfolius
python -m http.server 8000
```

Then open http://localhost:8000.

## Files

```
index.html            the whole portfolio
main.js               interactions: hat, palette, project pages, heatmap, contact form
music.js              castle music
analytics.js          analytics loader
styles.css            styles
spell-class.html/.js  the Spell Class mini-game
assets/               portrait, hat sprites, font subset, music, share image
data/activity.json    activity data (updated by the workflow)
scripts/update_activity.py
sitemap.xml
```

Deployed with GitHub Pages from `master`. Old `hogwarts-portfolio` links forward here. The plainer version of this site lives in [portfolio_website](https://github.com/devSaksham/portfolio_website) and is served at [sakshamagrawal.me](https://sakshamagrawal.me).
