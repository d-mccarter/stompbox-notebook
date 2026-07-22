# Stompbox Notebook

Mobile-first DIY guitar pedal reference tools. First tool: **resistor color code decode** (4 / 5 / 6 band).

## Live site

https://d-mccarter.github.io/stompbox-notebook/

The build number is shown in the top-right of the app (`build N`). It increments with each GitHub Actions deploy (`github.run_number`).

## Local development

```bash
npm install
npm run dev
```

Production build (uses base path `/stompbox-notebook/`):

```bash
BUILD_NUMBER=local npm run build
npm run preview
```

## Deploy

Pushes to `main` trigger `.github/workflows/deploy-pages.yml`, which builds and publishes to GitHub Pages.
