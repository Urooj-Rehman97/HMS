# LuxuryStay - Frontend

React 18 (JavaScript / JSX) + Vite + Tailwind CSS. Talks to the Express/MongoDB backend in `../server`.

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env   (set VITE_API_URL, must end with /api)
npm run dev              # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the production build locally |

Login state lives in **sessionStorage** (key `luxurystay.session`). Full explanation of every file, page, API and form:
see **`../DOCUMENTATION.md`**.
