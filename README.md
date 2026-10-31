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

El selector global **Interfaz** ofrece **Original** (el diseño claro inicial), **Game Boy** (marcos retro y detalles de Pokédex) y **Laboratorio** (oscuro con acentos turquesa). **Por generación**, el modo inicial, conserva la identidad de cada época: Game Boy en Gen I y las paletas propias de Gen II–IX. Una elección manual permanece al cambiar de generación y se aplica a la página, fichas y comparador. Se guarda en `pokemetrics-ui-v1` y en el parámetro `ui` de los enlaces; el enlace prevalece sobre la preferencia local y Atrás/Adelante restaura la apariencia. `data-ui-theme` controla el aspecto; `data-generation` identifica los datos. Los gráficos exportados conservan fondo blanco para compartir e imprimir.

La selección de imágenes comienza con las ilustraciones originales disponibles de Gen I/II, o las imágenes del primer juego desde Gen III. Una imagen ausente se señala; nunca se sustituye automáticamente por una edición posterior. Por ejemplo, Gen VII mantiene Sol/Luna como valor inicial aunque PokéAPI solo ofrezca imágenes de Ultrasol/Ultraluna. Las animaciones se congelan si el navegador solicita movimiento reducido.

**Comparar distribución con** permite contrastar dos generaciones con los mismos tipos y vista. Cada columna usa su propio total de especies introducidas. Los datos de cada generación se guardan en su propia caché; la de Kanto conserva el identificador v5. Los cambios rápidos cancelan las consultas anteriores. `npm run update:generations` actualiza el catálogo de generaciones, juegos y tipos desde PokéAPI; `npm run update:locales` actualiza los nombres oficiales de las 1.025 especies.

La página prioriza el listado: desde 1.200 px muestra filtros a la izquierda, Pokémon al centro y análisis a la derecha. Los paneles laterales permanecen accesibles al desplazarse y admiten desplazamiento con teclado. En móvil y tablet, las pestañas **Pokémon / Filtros / Análisis** muestran una zona a la vez; el listado abre primero. Flechas, Inicio y Fin recorren las pestañas. Seleccionar un segmento abre su listado y enfoca el título. Buscador, contador, tarjetas y CSV comparten los mismos resultados filtrados y ordenados.

**Apariencia e idioma** está en un panel desplegable; los selectores globales de ilustraciones e imágenes de detalle están con los filtros. La comparación entre generaciones está en Análisis. Las fichas de escritorio muestran la ilustración a la izquierda y el resumen con radar/barras a la derecha; en móvil se apilan. **Volver al listado** permanece visible al desplazarse por la ficha y las notas del historial se pueden desplegar.

## Publicación

Cada generación se obtiene con un único JSON compacto de `public/data/generation-N.json`; el navegador valida versión, generación, especies, tipos, historial y medidas antes de usarlo. Los conteos se calculan únicamente con conjuntos completos. La fecha visible corresponde a la preparación de los datos en PokéAPI, no a la fecha de lectura de la caché. Esta última se comprueba cada 24 horas; **Actualizar** fuerza la revalidación del archivo y una falla conserva la copia anterior. Las cachés existentes migran al comprobar el JSON por primera vez. Comparar generaciones usa el mismo cargador y se solicita cuando el panel está visible. Las descripciones, habilidades y evoluciones continúan consultándose al abrir una ficha.

`npm run update:data` consulta PokéAPI con un máximo de cuatro solicitudes simultáneas y prepara las nueve generaciones mediante la misma normalización y validación de la aplicación. Solo reemplaza los archivos después de completar y validar las 1.025 especies. Ejecuta después `npm run update:media` si cambian las imágenes. GitHub Actions realiza ambos pasos en cada publicación de `main` y en una actualización diaria; comprueba tipos, pruebas y compilación antes de publicar. Un error conserva el sitio previamente desplegado. Los pull requests validan las copias incluidas sin consultar la API ni generar medios. La preparación ocurre en CI y no añade backend ni consultas por Pokémon al cargar el listado.

El listado comienza con 24 tarjetas y **Mostrar más** añade otras 24. Búsqueda, orden, filtros y CSV trabajan sobre todos los resultados; los gráficos conservan el total completo de la generación. Un cambio en los IDs u orden de los resultados reinicia el bloque; una actualización con los mismos IDs conserva lo mostrado. Cargar más enfoca la primera tarjeta nueva y cerrar una ficha mantiene el bloque actual.

Las tarjetas y las fichas muestran versiones estáticas del mismo arte seleccionado. **Reproducir animación**, en la ficha, descarga el original; detenerla o desplazarla fuera de pantalla vuelve a la imagen estática. Movimiento reducido desactiva la reproducción, tanto GIF como WebP. La galería carga solo la ilustración elegida y los sprites de frente/espalda se montan al desplegar su apartado. Las miniaturas tienen tamaños de 160, 320 y 640 px, sin ampliar el original; un fallo no provoca la descarga automática de una animación pesada ni cambia de juego.

Para regenerar las miniaturas, instala `python -m pip install -r scripts/requirements-media.txt` y ejecuta `python scripts/update-media.py`. Lee los datos de `public/data/`, genera `public/media/pokemon/` y actualiza `src/lib/media-data.json` solo al completar la preparación. Reutiliza las versiones existentes; `--refresh` vuelve a consultar sus fuentes. Los originales se guardan temporalmente fuera del repositorio. Pillow se utiliza únicamente al preparar recursos; la página publicada sigue siendo estática.

**Jugar** abre una sala Game Boy / Game Boy Color independiente del explorador (`?section=play`). Carga un archivo local `.gb` o `.gbc` y pulsa **Iniciar juego**. El proyecto no incluye ROMs comerciales ni BIOS. EmulatorJS 4.2.3 y su núcleo Gambatte se distribuyen con sus licencias y fuentes en `public/emulator/`; se cargan solo al entrar en Jugar. El puente del reproductor es GPL-3.0-or-later; las atribuciones y fuentes correspondientes están en `public/emulator/licenses.html`. La compilación produce `index.html` y `emulator.html`; no requiere servidor de emulación ni nuevas dependencias npm.

Flechas para moverse, **X = A**, **Z = B**, **Enter = Start**, **Shift = Select**; en pantallas táctiles aparecen cruceta y botones. Hay pausa, volumen y pantalla completa. Al volver al explorador o cambiar de pestaña se pausa la partida; al regresar hay que reanudarla. Los filtros y la sesión del explorador se conservan. El idioma global traduce los controles de la página; el idioma del juego depende de la ROM. Esta versión es para un jugador, sin cable link.

Las partidas se guardan en IndexedDB cada 15 segundos, al pausar y al salir de Jugar. Cada ROM se identifica por su SHA-256, por lo que ediciones o revisiones distintas mantienen partidas independientes aunque tengan el mismo nombre de archivo. Al recargar hay que volver a elegir la misma ROM y se restaura su último estado. **Guardar estado** fuerza una copia local; **Descargar copia** descarga un respaldo JSON, sin la ROM, y **Restaurar copia** valida juego, versión del motor y checksum antes de reemplazar el estado. Estos respaldos son propios de este reproductor y versión del núcleo. El cierre abrupto puede perder el progreso desde el último guardado; borrar los datos del sitio elimina las partidas locales. Si el navegador impide guardar, se avisa y sigue disponible la exportación manual. Las ROMs y partidas no se envían al servidor.

**Descargar CSV** exporta exactamente los Pokémon visibles, respetando búsqueda, segmento, favoritos, orden, idioma y vista Actual/Legacy. Incluye ambos tipos, medidas en metros/kilogramos y cinco estadísticas en Gen I Legacy o seis en las otras vistas. Un historial pendiente deja valores vacíos y se identifica en su propia columna. El CSV usa UTF-8 con BOM y números decimales con punto; en hojas de cálculo se puede importar seleccionando coma como delimitador.

**Descargar PNG/SVG** guarda la torta o las barras con leyenda, cantidades, porcentajes, tipos seleccionados, generación y vista. Siempre incluye la distribución completa y Otros Pokémon; la búsqueda y los favoritos no cambian su denominador. SVG conserva la calidad al ampliar; PNG tiene fondo blanco y una altura máxima de 4.096 píxeles. Todas las exportaciones se generan localmente con los datos cargados, sin consultas adicionales ni dependencias nuevas.

GitHub Actions comprueba tipos, ejecuta las pruebas y compila antes de publicar `dist/` en GitHub Pages. La fuente de Pages debe ser **GitHub Actions**. Los cambios en `main` se publican automáticamente en <https://luiskabal.github.io/pokemetrics/>.

No se requieren claves, backend ni variables de entorno. La primera carga obtiene el JSON y las miniaturas desde GitHub Pages; las animaciones originales y los datos adicionales de las fichas usan los recursos de PokéAPI bajo demanda. La caché `pokemetrics-kanto-v5` guarda los tipos originales y los enlaces de sprites por juego; las demás generaciones tienen sus propias claves. Los archivos locales `index_v*.html` quedan fuera de Git y del despliegue.

Al abrir, una caché válida se muestra inmediatamente, conservando los filtros y la ficha abierta. Si pasaron 24 horas desde la última comprobación, el JSON compacto se revalida en segundo plano. La copia local se reemplaza únicamente después de validar todas las especies de esa generación. Las miniaturas y animaciones usan la caché HTTP del navegador y no se guardan en `localStorage`.
