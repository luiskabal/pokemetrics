# Pokémetrics

Explorador de las nueve generaciones y sus 1.025 especies, con datos de PokéAPI. Frontend estático construido con Svelte, TypeScript, Vite, Tailwind CSS y daisyUI.

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

Cada generación incluye las especies introducidas en ella, sin repetir especies anteriores ni contar formas alternativas por separado. Actual usa su clasificación actual; Legacy reconstruye los tipos de esa generación con `past_types`. Las intersecciones forman segmentos exclusivos en torta y barras: siempre suman el total de la generación, incluidos los otros Pokémon. Gen I suma 151; las demás usan su propio denominador. Los totales individuales por tipo pueden superponerse y no deben sumarse.

Cada ficha muestra un radar y permite alternar a barras, con valores numéricos y una escala fija de 0 a 255. En Actual comienza con seis estadísticas actuales; en Legacy usa el historial de la generación elegida. Gen I tiene cinco, incluida **Especial**, y desde Gen II son seis. Las ediciones sirven como referencias: PokéAPI registra el historial por generación y las estadísticas corresponden a la forma predeterminada. La disponibilidad en cada juego y las formas alternativas pueden diferir. Rojo/Azul y Amarillo comparten sus estadísticas base. La selección local se reinicia al cerrar la ficha.

`src/lib/stats.ts` reconstruye cada estadística con `past_stats`: los cambios son parciales, y la generación de cada registro es su límite inclusivo. Se aplica el cambio más cercano que cubre la generación consultada; las estadísticas sin cambios conservan su valor actual. El historial se valida y guarda en la caché v5 existente. Las copias anteriores siguen funcionando: hasta completar la actualización, la vista histórica indica que faltan datos y permite consultar los actuales. No se inventa el Especial original si falta su registro. Su etiqueta se traduce en la interfaz porque el recurso `stat/9` no ofrece nombres localizados.

El listado busca por nombre o número exacto (`25` o `#025`) y ordena por número, nombre, estadísticas, altura o peso, en ambos sentidos. El orden estadístico respeta Actual/Legacy y deja los históricos pendientes al final. La búsqueda admite japonés y romanización, ignora acentos latinos y puntuación y distingue `♀` y `♂`. Estos controles solo afectan al listado; los gráficos mantienen su denominador.

Pulsar un segmento de la torta, su leyenda o una barra muestra exactamente ese grupo, incluido **Otros Pokémon**, y limpia la búsqueda anterior. Los gráficos conservan el total. El comparador permite elegir entre dos y cuatro Pokémon y revisar sus estadísticas históricas o actuales, tipos y medidas. Se reinicia al cambiar de generación para mantener una sola época de referencia.

Los enlaces copian generación, comparación entre generaciones, tipos, vista, segmento, búsqueda, orden, gráfico, idioma, imágenes y ficha. Se restauran al recargar y con Atrás/Adelante. Si el portapapeles está bloqueado se ofrece copia manual. Las estrellas guardan favoritos localmente en `pokemetrics-favorites-v1`; **Mis favoritos** funciona sin seleccionar tipos y se filtra dentro de la generación elegida. Si el navegador impide guardar, se informa de que solo estarán disponibles durante la sesión.

Las fichas cargan categoría, descripción, habilidades y cadena evolutiva al abrirse. La descripción identifica su edición e idioma; los respaldos se señalan. Legacy no atribuye habilidades a Gen I/II y filtra habilidades y evoluciones según la época. Las evoluciones permiten navegar a otra generación. La información adicional se guarda durante 24 horas en una caché limitada a 40 recursos; una falla no bloquea la ficha ni las estadísticas y permite reintentar.

El selector global ofrece **English, Español, Español latino y 日本語**. Traduce la interfaz, nombres de Pokémon, tipos y estadísticas; mantiene los filtros, el gráfico y las ilustraciones. La preferencia se guarda en el navegador y comienza en español latino (`es-419`). La búsqueda admite nombres en cualquiera de los cuatro idiomas y la romanización japonesa; el orden alfabético usa el idioma activo. Conserva las marcas de sonoridad del japonés al normalizar las búsquedas.

Los nombres oficiales se incluyen en `src/lib/locale-data.json`, obtenidos de los recursos `pokemon-species`, `type` y `stat` de PokéAPI. Cambiar el idioma no añade consultas a la API. Para actualizar el catálogo durante el desarrollo, ejecuta `npm run update:locales`; el archivo solo se reemplaza tras completar y validar las respuestas. Si falta una traducción regional se usa español, y después inglés. Los movimientos todavía no se muestran en las fichas.

**Ilustraciones**, junto al buscador y el ordenamiento, se aplica a todas las tarjetas y a la ilustración inicial de cada ficha. Gen I comienza con el arte de **Rojo/Verde de Japón**, sus primeros juegos; también se puede elegir Rojo/Azul o el arte actual. Una ilustración ausente se señala sin sustituirla por otra versión. Los filtros de tipos, los gráficos y el orden del listado se conservan al cambiar el arte.

La imagen principal de la ficha es la galería de **Ilustraciones oficiales**, que cambia al pasar el cursor por sus opciones, enfocarlas con el teclado o tocarlas. Las ilustraciones históricas se leen de `sprites.other['official-artwork'].versions['generation-i']`. Las etiquetas identifican el juego, ya que la respuesta de PokéAPI no incluye el año de publicación de cada ilustración. La comparación dentro de la ficha es local; al reabrirla se vuelve a usar la elección global. Las copias v5 anteriores siguen siendo válidas: las ilustraciones históricas se añaden durante la actualización habitual en segundo plano.

Las imágenes de frente y espalda están en el apartado desplegable **Imágenes de los juegos** de cada ficha. Su valor inicial se elige con **Imágenes de detalle** en el panel de filtros; el selector local solo cambia esa ficha y se reinicia al cerrarla. Gen I usa Rojo/Verde de Japón inicialmente. Los sprites se leen de `sprites.versions['generation-i']` y se muestran como pixel art; este selector de detalle no altera las ilustraciones del listado. Actual/Legacy sigue controlando la clasificación de tipos.

Cada generación tiene una identidad visual: Gen I conserva el tema Game Boy/Pokédex y las siguientes tienen paletas, marcos y paneles propios. `data-generation` aplica el tema también a diálogos. La selección comienza con las ilustraciones originales disponibles de Gen I/II, o las imágenes del primer juego desde Gen III. Una imagen ausente se señala; nunca se sustituye automáticamente por una edición posterior. Por ejemplo, Gen VII mantiene Sol/Luna como valor inicial aunque PokéAPI solo ofrezca imágenes de Ultrasol/Ultraluna. Las animaciones se congelan si el navegador solicita movimiento reducido.

**Comparar distribución con** permite contrastar dos generaciones con los mismos tipos y vista. Cada columna usa su propio total de especies introducidas. Los datos de cada generación se guardan en su propia caché; la de Kanto conserva el identificador v5. Los cambios rápidos cancelan las consultas anteriores. `npm run update:generations` actualiza el catálogo de generaciones, juegos y tipos desde PokéAPI; `npm run update:locales` actualiza los nombres oficiales de las 1.025 especies.

## Publicación

GitHub Actions comprueba tipos, ejecuta las pruebas y compila antes de publicar `dist/` en GitHub Pages. La fuente de Pages debe ser **GitHub Actions**. Los cambios en `main` se publican automáticamente en <https://luiskabal.github.io/pokemetrics/>.

No se requieren claves, backend ni variables de entorno. La primera carga necesita conexión a PokéAPI; las imágenes usan el repositorio público de sprites de PokéAPI. La caché `pokemetrics-kanto-v5` guarda los tipos originales y los enlaces de sprites por juego; las copias anteriores se descartan y requieren una carga inicial para renovar los datos. Los archivos locales `index_v*.html` quedan fuera de Git y del despliegue.

Al abrir, una caché válida se muestra inmediatamente y se actualiza en segundo plano, conservando los filtros y la ficha abierta. La fecha de la última carga queda visible. El botón **Actualizar** permite repetir la consulta; si falla, los datos disponibles y su fecha se conservan. Las respuestas HTTP se revalidan con PokéAPI, y la caché local se reemplaza únicamente después de completar y validar las 151 especies. Las imágenes dependen de la caché HTTP del navegador y no se guardan en `localStorage`.
