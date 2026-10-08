# Ça ne sert à rien…

Un marché fictif pour des idées qui ne servent à rien… jusqu'à ce que quelqu'un y croie.

Chaque idée se pitche en une ligne (film, concept, jeu ou logiciel). Les membres reçoivent un
capital fictif, investissent sur les idées des autres, proposent des sous-idées, puis valident
le livrable de l'auteur. Une bonne partie des idées de mes dépôts GitHub y sont pitchées.

Le nom du site se change en un seul endroit : `src/lib/site.ts`. Le logo, une tuile ambre qui porte
les trois points de suspension du nom, vit dans `src/components/BrandMark.tsx` ; le favicon dans
`src/app/icon.svg` (vectoriel) et `src/app/favicon.ico` (généré à partir du même dessin).

## Stack

- [Next.js](https://nextjs.org) (App Router) + React, TypeScript, Tailwind CSS 4
- [Supabase](https://supabase.com) pour l'authentification, la base de données et le stockage
  (migrations dans `supabase/migrations/`)

## Développement

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

Variables d'environnement attendues (fichier `.env.local`) :

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Scripts

| Commande        | Rôle                      |
| --------------- | ------------------------- |
| `npm run dev`   | serveur de développement  |
| `npm run build` | build de production       |
| `npm run start` | lance le build            |
| `npm run lint`  | ESLint                    |
