# Webs de jblascosaz

Proyecto web con **React + Vite**. La primera app es **Mis tareas**, una lista de tareas que se guarda en el navegador (`localStorage`).

## Empezar

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # genera la versión de producción en dist/
npm run preview  # sirve dist/ en local
npm run lint     # revisa el código con oxlint
```

## Estructura

```
index.html        punto de entrada
src/main.jsx      monta la app de React
src/App.jsx       la app de tareas
src/App.css       estilos de la app
src/index.css     estilos globales y colores (modo claro/oscuro)
public/           archivos estáticos (favicon)
```

## Publicar

`.github/workflows/deploy.yml` construye la web y la publica en GitHub Pages en cada push a `main`.
Para activarlo: **Settings → Pages → Source: GitHub Actions**.
