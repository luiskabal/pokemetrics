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
- `src/lib/stats.ts`: estadísticas base históricas por generación.
- `src/lib/pokeapi.ts`: consulta, validación de datos y caché del navegador.
- `src/lib/metadata.ts`: colores, iconos, tipos y etiquetas.
- `src/App.svelte`: estado de la página y composición de la interfaz.
- `src/app.css`: tema visual y estilos compartidos.

Actual conserva los tipos actuales y Legacy conserva todos los tipos originales de Gen I, incluidos los secundarios. Los tipos históricos se reconstruyen con `past_types` de PokéAPI; si no hay cambios registrados, se usan `types`. Ambas vistas separan las intersecciones en los gráficos de torta y barras, de modo que sus grupos, incluidos los otros Pokémon, siempre suman 151 sin duplicar especies. El selector de gráfico conserva los tipos seleccionados; las barras usan una escala fija de 0 a 100 % de Kanto. Los totales individuales por tipo pueden superponerse y no deben sumarse.

Cada ficha muestra un radar y permite alternar a barras, con los valores numéricos y una escala fija de 0 a 255. En Actual comienza con las seis estadísticas actuales; en Legacy, con las cinco originales de Gen I, incluida **Especial** en lugar de ataque y defensa especiales separados. **Estadísticas de** permite consultar los juegos de Gen I o los datos actuales dentro de la ficha, sin cambiar los tipos ni las imágenes. Rojo/Verde, Rojo/Azul y Amarillo comparten estas estadísticas base; los datos consultados no incluyen nivel ni entrenamiento. La selección local y el gráfico vuelven a sus valores iniciales al cerrar la ficha.

`src/lib/stats.ts` reconstruye cada estadística con `past_stats`: los cambios son parciales, y la generación de cada registro es su límite inclusivo. Se aplica el cambio más cercano que cubre la generación consultada; las estadísticas sin cambios conservan su valor actual. El historial se valida y guarda en la caché v5 existente. Las copias anteriores siguen funcionando: hasta completar la actualización, la vista histórica indica que faltan datos y permite consultar los actuales. No se inventa el Especial original si falta su registro. Su etiqueta se traduce en la interfaz porque el recurso `stat/9` no ofrece nombres localizados.

El listado permite buscar dentro de los tipos seleccionados por nombre o número exacto de Pokédex (`25` o `#025`) y ordenar por número o nombre en ambos sentidos. La búsqueda ignora mayúsculas, acentos y puntuación, y reconoce `nidoran-f`, `nidoran-m`, `♀` y `♂`. Estos controles solo afectan al listado; los gráficos mantienen su base de 151 Pokémon. Elige **Todos** para buscar en todo Kanto.

El selector global ofrece **English, Español, Español latino y 日本語**. Traduce la interfaz, nombres de Pokémon, tipos y estadísticas; mantiene los filtros, el gráfico y las ilustraciones. La preferencia se guarda en el navegador y comienza en español latino (`es-419`). La búsqueda admite nombres en cualquiera de los cuatro idiomas y la romanización japonesa; el orden alfabético usa el idioma activo. Conserva las marcas de sonoridad del japonés al normalizar las búsquedas.

Los nombres oficiales se incluyen en `src/lib/locale-data.json`, obtenidos de los recursos `pokemon-species`, `type` y `stat` de PokéAPI. Cambiar el idioma no añade consultas a la API. Para actualizar el catálogo durante el desarrollo, ejecuta `npm run update:locales`; el archivo solo se reemplaza tras completar y validar las respuestas. Si falta una traducción regional se usa español, y después inglés. Los movimientos todavía no se muestran en las fichas.

**Ilustraciones**, junto al buscador y el ordenamiento, se aplica a todas las tarjetas y a la ilustración inicial de cada ficha. Gen I comienza con el arte de **Rojo/Verde de Japón**, sus primeros juegos; también se puede elegir Rojo/Azul o el arte actual. Una ilustración ausente se señala sin sustituirla por otra versión. Los filtros de tipos, los gráficos y el orden del listado se conservan al cambiar el arte.

La imagen principal de la ficha es la galería de **Ilustraciones oficiales**, que cambia al pasar el cursor por sus opciones, enfocarlas con el teclado o tocarlas. Las ilustraciones históricas se leen de `sprites.other['official-artwork'].versions['generation-i']`. Las etiquetas identifican el juego, ya que la respuesta de PokéAPI no incluye el año de publicación de cada ilustración. La comparación dentro de la ficha es local; al reabrirla se vuelve a usar la elección global. Las copias v5 anteriores siguen siendo válidas: las ilustraciones históricas se añaden durante la actualización habitual en segundo plano.

Las imágenes de frente y espalda están en el apartado desplegable **Imágenes de los juegos** de cada ficha. Su valor inicial se elige con **Imágenes de detalle** en el panel de filtros; el selector local solo cambia esa ficha y se reinicia al cerrarla. Gen I usa Rojo/Verde de Japón inicialmente. Los sprites se leen de `sprites.versions['generation-i']` y se muestran como pixel art; este selector de detalle no altera las ilustraciones del listado. Actual/Legacy sigue controlando la clasificación de tipos.

Gen I tiene un tema inspirado en Game Boy y la Pokédex: cabecera roja, paneles verde LCD y marcos de menú, conservando el color de los tipos y las ilustraciones. Está en `src/themes/generation-i.css`, aplicado mediante `data-generation="1"` en el documento, incluidos los diálogos. El tema corresponde a la generación y se conserva al cambiar idioma, clasificación Actual/Legacy o imágenes; las demás generaciones se incorporarán cuando se agreguen sus datos. PokéAPI proporciona los recursos de Pokémon; esta interfaz se diseña en la aplicación.

## Publicación

GitHub Actions comprueba tipos, ejecuta las pruebas y compila antes de publicar `dist/` en GitHub Pages. La fuente de Pages debe ser **GitHub Actions**. Los cambios en `main` se publican automáticamente en <https://luiskabal.github.io/pokemetrics/>.

No se requieren claves, backend ni variables de entorno. La primera carga necesita conexión a PokéAPI; las imágenes usan el repositorio público de sprites de PokéAPI. La caché `pokemetrics-kanto-v5` guarda los tipos originales y los enlaces de sprites por juego; las copias anteriores se descartan y requieren una carga inicial para renovar los datos. Los archivos locales `index_v*.html` quedan fuera de Git y del despliegue.

Al abrir, una caché válida se muestra inmediatamente y se actualiza en segundo plano, conservando los filtros y la ficha abierta. La fecha de la última carga queda visible. El botón **Actualizar** permite repetir la consulta; si falla, los datos disponibles y su fecha se conservan. Las respuestas HTTP se revalidan con PokéAPI, y la caché local se reemplaza únicamente después de completar y validar las 151 especies. Las imágenes dependen de la caché HTTP del navegador y no se guardan en `localStorage`.
