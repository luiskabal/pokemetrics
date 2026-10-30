# Pokémetrics

Explorador de los 151 Pokémon de Kanto, con datos de PokéAPI. Frontend estático construido con Svelte, TypeScript, Vite, Tailwind CSS y daisyUI.

## Desarrollo

Requiere Node.js 24 o superior. Node se usa para desarrollar y compilar; la aplicación publicada funciona en el navegador.

```sh
npm ci
npm run dev
```

Abre la dirección que muestra Vite, bajo `/pokemetrics/`.

```sh
npm run check
npm test
npm run build
npm run preview
```

## Organización

- `src/components/`: filtros, torta, tarjetas, imágenes y ficha de Pokémon.
- `src/lib/analysis.ts`: cálculos de porcentajes, intersecciones y resultados únicos.
- `src/lib/pokeapi.ts`: consulta, validación de datos y caché del navegador.
- `src/lib/metadata.ts`: colores, iconos, tipos y etiquetas.
- `src/App.svelte`: estado de la página y composición de la interfaz.
- `src/app.css`: tema visual y estilos compartidos.

Actual conserva ambos tipos y separa sus intersecciones en la torta. Legacy usa únicamente el primer tipo original de Gen I. Los porcentajes siempre toman como base los 151 Pokémon; las estadísticas de las fichas son actuales.

## Publicación

GitHub Actions comprueba tipos, ejecuta las pruebas y compila antes de publicar `dist/` en GitHub Pages. La fuente de Pages debe ser **GitHub Actions**. Los cambios en `main` se publican automáticamente en <https://luiskabal.github.io/pokemetrics/>.

No se requieren claves, backend ni variables de entorno. La primera carga necesita conexión a PokéAPI; las imágenes usan el repositorio público de sprites de PokéAPI. La caché `pokemetrics-kanto-v3` es compatible con el MVP anterior. Los archivos locales `index_v*.html` quedan fuera de Git y del despliegue.
