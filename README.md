# Portfolio POC — AG Grid + MUI TreeView

This is a minimal Proof-of-Concept app showcasing:
- AG Grid for tabular data (`ag-grid-react` + `ag-grid-community`)
- Material UI TreeView for hierarchical/category selection
- Tailwind CSS for styling
- A small mock API (served from `public/data.json`) to simulate server data

Quick start

1. Install dependencies

```bash
cd "c:/Users/vinod.tayde_infobean/Desktop/POC AG/portfolio-poc"
npm install
```

2. Run development server

```bash
npm run dev
```

3. Open the app in the browser (Vite will show the URL, usually http://localhost:5173)

What to look for
- Left: categories (MUI TreeView). Select a category to filter the AG Grid table.
- Right: AG Grid table with sorting and multi-row selection.

Next enhancements you might add (optional)
- Real backend API (Express or serverless endpoint)
- Row details panel and inline editing in AG Grid
- Pagination, server-side sorting/filtering for large datasets
- Export (CSV/XLSX) from AG Grid

Files created
- [portfolio-poc/package.json](portfolio-poc/package.json)
- [portfolio-poc/vite.config.js](portfolio-poc/vite.config.js)
- [portfolio-poc/index.html](portfolio-poc/index.html)
- [portfolio-poc/src/main.jsx](portfolio-poc/src/main.jsx)
- [portfolio-poc/src/App.jsx](portfolio-poc/src/App.jsx)
- [portfolio-poc/src/index.css](portfolio-poc/src/index.css)
- [portfolio-poc/src/components/SidebarTree.jsx](portfolio-poc/src/components/SidebarTree.jsx)
- [portfolio-poc/src/components/DataGrid.jsx](portfolio-poc/src/components/DataGrid.jsx)
- [portfolio-poc/public/data.json](portfolio-poc/public/data.json)
- [portfolio-poc/tailwind.config.cjs](portfolio-poc/tailwind.config.cjs)
- [portfolio-poc/postcss.config.cjs](portfolio-poc/postcss.config.cjs)

If you want, I can now:
- Run `npm install` and `npm run dev` here (I cannot run commands in your shell without permission), or
- Add example features: CSV export, row-detail drawer, server-side pagination.

Which next step would you like?

Server & features

1. Start the mock API server (serves `/api/data`):

```bash
npm run start:server
```

2. In another terminal, start the Vite dev server:

```bash
npm run dev
```

Usage notes
- Click a row in the AG Grid to open the details drawer.
- Use "Export Selected CSV" to download only selected rows, or "Export All CSV" to download the entire dataset.

If you want I can also add a single `npm` script to run both servers together using `concurrently`.