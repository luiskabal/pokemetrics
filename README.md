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

- `src/components/`: filtros, gráficos de torta y barras, tarjetas, imágenes y ficha de Pokémon.
- `src/lib/analysis.ts`: cálculos de porcentajes, intersecciones y resultados únicos.
- `src/lib/pokeapi.ts`: consulta, validación de datos y caché del navegador.
- `src/lib/metadata.ts`: colores, iconos, tipos y etiquetas.
- `src/App.svelte`: estado de la página y composición de la interfaz.
- `src/app.css`: tema visual y estilos compartidos.

Actual conserva los tipos actuales y Legacy conserva todos los tipos originales de Gen I, incluidos los secundarios. Los tipos históricos se reconstruyen con `past_types` de PokéAPI; si no hay cambios registrados, se usan `types`. Ambas vistas separan las intersecciones en los gráficos de torta y barras, de modo que sus grupos, incluidos los otros Pokémon, siempre suman 151 sin duplicar especies. El selector de gráfico conserva los tipos seleccionados; las barras usan una escala fija de 0 a 100 % de Kanto. Los totales individuales por tipo pueden superponerse y no deben sumarse. Las estadísticas de las fichas son actuales.

El listado permite buscar dentro de los tipos seleccionados por nombre o número exacto de Pokédex (`25` o `#025`) y ordenar por número o nombre en ambos sentidos. La búsqueda ignora mayúsculas, acentos y puntuación, y reconoce `nidoran-f`, `nidoran-m`, `♀` y `♂`. Estos controles solo afectan al listado; los gráficos mantienen su base de 151 Pokémon. Elige **Todos** para buscar en todo Kanto.

## Publicación

GitHub Actions comprueba tipos, ejecuta las pruebas y compila antes de publicar `dist/` en GitHub Pages. La fuente de Pages debe ser **GitHub Actions**. Los cambios en `main` se publican automáticamente en <https://luiskabal.github.io/pokemetrics/>.

No se requieren claves, backend ni variables de entorno. La primera carga necesita conexión a PokéAPI; las imágenes usan el repositorio público de sprites de PokéAPI. La caché `pokemetrics-kanto-v4` guarda todos los tipos originales; las copias anteriores que solo guardaban el primer tipo se descartan y requieren una carga inicial para renovar los datos. Los archivos locales `index_v*.html` quedan fuera de Git y del despliegue.

Al abrir, una caché válida se muestra inmediatamente y se actualiza en segundo plano, conservando los filtros y la ficha abierta. La fecha de la última carga queda visible. El botón **Actualizar** permite repetir la consulta; si falla, los datos disponibles y su fecha se conservan. Las respuestas HTTP se revalidan con PokéAPI, y la caché local se reemplaza únicamente después de completar y validar las 151 especies. Las imágenes dependen de la caché HTTP del navegador y no se guardan en `localStorage`.
