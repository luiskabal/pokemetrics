# Arquitectura, datos y mantenimiento

[Inicio](../README.md) · [Guía de uso](guia-de-uso.md)

## Estructura y ejecución

Pokémetrics es una aplicación estática de Svelte 5 y TypeScript, compilada con Vite y estilizada con Tailwind CSS y daisyUI. No requiere SSR, backend, cuenta de usuario, clave de PokéAPI ni variables de entorno. Node.js 24 o superior se usa en desarrollo y CI; Python/Pillow prepara imágenes. El navegador ejecuta la app y el emulador localmente.

La compilación produce `index.html`, `emulator.html`, recursos con nombres basados en contenido, `sw.js` y `offline-player.json`. El reproductor usa un iframe independiente y mensajes validados por origen, ventana y sesión. La base pública es `/pokemetrics/`, definida en [vite.config.ts](../vite.config.ts).

| Responsabilidad | Código principal |
| --- | --- |
| Composición, contexto e historial del navegador | [App.svelte](../src/App.svelte), [navigation.ts](../src/lib/navigation.ts), [generation-state.ts](../src/lib/generation-state.ts) |
| Catálogo y ámbitos | [generations.ts](../src/lib/generations.ts), [universe.ts](../src/lib/universe.ts), `generation-data.json`, `dex-data.json` |
| Normalización, validación y caché de conjuntos | [pokeapi.ts](../src/lib/pokeapi.ts), [model.ts](../src/lib/model.ts) |
| Distribución, búsqueda y orden | [analysis.ts](../src/lib/analysis.ts) |
| Estadísticas, filtros e historial | [stats.ts](../src/lib/stats.ts), [stat-explorer.ts](../src/lib/stat-explorer.ts), [timeline.ts](../src/lib/timeline.ts) |
| Efectividad y movimientos | [effectiveness.ts](../src/lib/effectiveness.ts), [moves.ts](../src/lib/moves.ts) |
| Información ampliada | [details.ts](../src/lib/details.ts) |
| Imágenes y catálogos bajo demanda | [media.ts](../src/lib/media.ts), [PokemonImage.svelte](../src/components/PokemonImage.svelte) |
| Equipos, capturas y favoritos | [teams.ts](../src/lib/teams.ts), [captures.ts](../src/lib/captures.ts), [favorites.ts](../src/lib/favorites.ts) |
| Exportación | [export.ts](../src/lib/export.ts) |
| Idiomas y temas | [localization.ts](../src/lib/localization.ts), [messages.ts](../src/lib/messages.ts), [ui-theme.ts](../src/lib/ui-theme.ts), `src/themes/` |
| Emulación y persistencia | [GameRoom.svelte](../src/components/GameRoom.svelte), [emulator-player.ts](../src/emulator-player.ts), [gameboy.ts](../src/lib/gameboy.ts), [game-storage.ts](../src/lib/game-storage.ts) |
| Modo offline | [OfflineManager.svelte](../src/components/OfflineManager.svelte), [offline.ts](../src/lib/offline.ts), [service-worker.js](../scripts/service-worker.js) |

## Fuentes y preparación de datos

La preparación usa PokéAPI y sus sprites. La app publicada obtiene conjuntos compactos desde GitHub Pages; las consultas directas a PokéAPI quedan para la información ampliada de las fichas.

| Recurso de origen | Uso |
| --- | --- |
| `generation`, `version`, `version-group` | Generaciones, pertenencia de especies y referencias de juegos. |
| `pokemon` | Forma predeterminada, tipos, `past_types`, estadísticas, `past_stats`, medidas, imágenes y movimientos. |
| `type` | Relaciones de daño actuales e históricas. |
| `pokedex` | Miembros, numeración y asociación de Pokédex regionales con juegos. |
| `pokemon-species`, `stat`, `type`, `move` | Nombres localizados incluidos en los catálogos. |
| `pokemon-species`, `evolution-chain`, `ability`, `version`, `pokemon` | Información ampliada consultada al abrir fichas. |

Los enlaces de imagen se leen de `sprites.other['official-artwork']`, sus versiones históricas y `sprites.versions`. No se infieren años de ilustración a partir de sus juegos.

### Archivos publicados

| Archivo o directorio | Contenido |
| --- | --- |
| `public/data/generation-N.json` | Especies introducidas en N, tipos actuales e históricos, medidas, estadísticas e imágenes. |
| `public/data/media-N.json` | Imágenes por juego de la época N para todas las especies introducidas hasta entonces. |
| `public/data/moves/ID.json` | Movimientos por nivel de una especie, agrupados por `version-group`. |
| `public/media/catalogs/` | Catálogos de miniaturas separados por juego o arte. |
| `public/media/pokemon/` | Miniaturas estáticas WebP identificadas por hash y tamaño. |
| `src/lib/generation-data.json`, `dex-data.json`, `type-chart.json` | Catálogos de generaciones, Pokédex y relaciones de daño. |
| `src/lib/locale-data.json`, `move-names.json` | Traducciones incluidas en la aplicación. |
| `src/lib/media-data.json` | Índice completo para la preparación de medios; no se incorpora entero al paquete inicial del navegador. |

Los conjuntos de generación tienen `schemaVersion: 1`, `generation`, `pokemon` y `savedAt`. La validación comprueba identificadores esperados, cantidad completa, unicidad, tipos, estadísticas, medidas, historial y enlaces de imágenes. La normalización comprueba además el orden de slots de tipos de la respuesta de origen. Los conteos no se calculan sobre generaciones parcialmente descargadas.

## Reglas de dominio

### Especies y ámbitos

Cada especie usa su forma predeterminada y aparece una vez. Introducidos selecciona las especies de una generación; Nacional une las generaciones hasta la época elegida; Regional usa los miembros del catálogo de Pokédex. Nacional/Regional cargan los conjuntos de origen necesarios y `media-N.json`, reconstruyen los tipos para N y conservan el identificador nacional. Regional añade `regionalNumber`.

El total de análisis se deriva del conjunto cargado. Gen I Introducidos tiene 151; otras generaciones y ámbitos usan sus propios tamaños. La comparación entre generaciones se limita a Introducidos, con un denominador independiente por columna. Pertenencia a una Pokédex no demuestra disponibilidad de captura en una edición.

### Segmentos exclusivos

Para cada Pokémon, `analyzePokemon` toma los tipos de la vista, los intersecta con los seleccionados y ordena sus identificadores. Esa combinación es la clave de un único segmento. La clave vacía representa Otros Pokémon. Así, cada especie aporta una unidad y la suma de grupos coincide con el total.

Los contadores individuales por tipo se calculan por separado y pueden superponerse. Listado, búsqueda, favoritos, segmento seleccionado, rangos estadísticos y progreso de captura no cambian el denominador de la distribución. El CSV y la dispersión usan los resultados filtrados del listado, antes de su paginación visual.

### Tipos, estadísticas y efectividad históricos

`past_types` y los registros de `past_stats` se interpretan con límite de generación **inclusivo**: se usa el registro más cercano que cubre la época consultada. Las entradas estadísticas son parciales; las estadísticas sin cambios mantienen el valor actual. La ausencia de un cambio de tipos permite conservar los tipos actuales.

Gen I exige el registro de Especial y devuelve cinco estadísticas; desde Gen II son seis. Si faltan datos necesarios se comunica la ausencia, sin fabricar Especial a partir de Ataque o Defensa Especial. El selector de edición usa la generación como referencia estadística; no modela diferencias no registradas entre ediciones de esa generación.

Los colores definidos en `STAT_COLORS` se comparten entre radar, barras y resúmenes: PS `#cf5268`, Ataque `#c87b35`, Defensa `#a5912d`, Ataque especial `#468acb`, Defensa especial `#379c81`, Velocidad `#a46bc3`, Especial `#7374d1`. Las cifras y etiquetas acompañan el color.

`effectiveness.ts` multiplica las relaciones contra los tipos defensivos y usa la tabla de la época en Legacy. Solo calcula efectividad por tipos. El historial recorre desde la aparición de la especie, señala cambios de tipos y compara cada estadística solo cuando existe en ambas generaciones.

### Movimientos, idiomas y arte

`normalizeLearnset` conserva únicamente el método `level-up`, elimina duplicados de movimiento/nivel y ordena por nivel e identificador. Conserva nivel 0 y no sustituye un grupo de juegos ausente. Oro y Plata comparten `gold-silver`.

Los catálogos localizados cubren `en`, `es`, `es-419` y `ja`; japonés admite `ja-hrkt` como alternativa en las fuentes. La interfaz puede usar traducciones alternativas cuando falta una regional. La búsqueda normaliza acentos latinos y puntuación, conserva distinciones japonesas y admite alias y romanización.

Los valores iniciales usan arte original de Gen I/II cuando existe y el primer juego del catálogo desde Gen III; Nacional/Regional usan el juego seleccionado. Una imagen ausente queda ausente. La elección local de una ficha no modifica la global y se reinicia al cerrarla.

## Carga, caché y optimización

La carga de Introducidos consulta como máximo un JSON de generación cuando necesita revalidar. Un conjunto local válido se muestra inmediatamente. `checkedAt` permite reutilizarlo durante 24 horas; `savedAt` identifica la preparación de los datos y es la fecha visible. Actualizar fuerza la consulta. Un fallo mantiene los datos previos disponibles y permite reintentar.

Las cachés antiguas sin historial completo se revalidan antes de entrar en el camino rápido. Los cambios de contexto cancelan solicitudes anteriores mediante `AbortController`, y la consulta del conjunto tiene un límite de 20 segundos. Las respuestas de respaldo offline llevan `X-Pokemetrics-Offline: 1` y no adelantan la fecha de comprobación local como si fueran datos nuevos de red.

Nacional y Regional reúnen los JSON de las generaciones de origen necesarias y el archivo de imágenes de su época. El catálogo regional, la sala de juego y otros apartados se cargan bajo demanda. La información ampliada de PokéAPI se conserva en memoria y en una caché local con vigencia de 24 horas; la copia persistida se limita a 40 recursos.

La optimización de imágenes combina:

- 24 tarjetas iniciales y bloques posteriores de 24, con búsqueda, orden y exportación sobre todos los resultados.
- Miniaturas WebP de 160, 320 y 640 px del arte exacto; no se amplían originales pequeños.
- Primer fotograma estático de GIF/WebP animados; reproducción original solo por petición explícita en la ficha.
- Catálogos de medios separados por juego, compartiendo solicitudes en curso para evitar repeticiones.
- Montaje del frente/espalda al desplegar su apartado y de las secciones adicionales al abrirlas.
- Retorno a estático al detener o sacar una animación de pantalla, y respeto a movimiento reducido.

Un original animado desconocido o fallido no se descarga automáticamente como reemplazo. Los cambios de resultados reinician el bloque visual; una actualización con los mismos identificadores y orden conserva el bloque mostrado.

## Almacenamiento y privacidad

Todo se guarda por origen y navegador. GitHub aloja código y recursos públicos; la app no sube perfiles, ROMs ni guardados.

| Tecnología / clave | Contenido |
| --- | --- |
| localStorage `pokemetrics-kanto-v5` | Datos de Gen I con `savedAt` y `checkedAt`. |
| localStorage `pokemetrics-generation-N-v1` | Caché de las demás generaciones. |
| localStorage `pokemetrics-info-v1` | Recursos de información ampliada. |
| localStorage `pokemetrics-favorites-v1` | Identificadores favoritos. |
| localStorage `pokemetrics-teams-v1` | Equipos por juego: identificador, nombre y hasta seis miembros. |
| localStorage `pokemetrics-captures-v1` | Perfiles de partidas, selección y estados visto/capturado por especie; pendiente se representa por ausencia. |
| localStorage `pokemetrics-language-v1`, `pokemetrics-ui-v1` | Idioma y tema preferidos. |
| IndexedDB `pokemetrics-play-v1`, versión 2 | `states`: autoguardado por `romHash`; `slots`: manuales por `[romHash, slot]`. |
| Cache Storage `pokemetrics-shell-HASH` | HTML, código, estilos, iconos y manifiesto de una compilación. |
| Cache Storage `pokemetrics-offline-content-v1` | Descargas explícitas, imágenes y metadatos de conjuntos. |

Los equipos aceptan repetidos y rechazan especies posteriores a la época elegida. La importación de capturas comprueba formato, versión, juego, nombre, identificadores y estados; asigna nuevos identificadores a los perfiles para añadirlos sin sobrescribir existentes. Los favoritos y el progreso son independientes de los datos del emulador.

La base IndexedDB pasa de versión 1 a 2 conservando `states` y añadiendo `slots`. La ROM se identifica con SHA-256. Los respaldos de juego incluyen versión del motor, fecha, estado y checksum; no incluyen la ROM. Las restauraciones comprueban esos campos. La captura de miniatura del núcleo restaura el estado usado para no avanzar la partida por tomar la imagen.

Los respaldos disponibles son JSON de progreso, JSON del estado de juego y enlaces de composición de equipos. CSV exporta datos del listado, no un respaldo completo del navegador. No existe sincronización de cuenta ni exportación global de todos los datos personales.

## Enlaces y restauración del estado

[navigation.ts](../src/lib/navigation.ts) valida parámetros y elimina valores por defecto al serializar. `App.svelte` coordina `pushState`, `replaceState` y `popstate`. Los enlaces de equipos se forman en `teams.ts`.

| Parámetro | Valores o ejemplo |
| --- | --- |
| `section` | `play`, `teams`; Explorar es el valor inicial. |
| `gen`, `edition` | Generación `1`–`9` y juego válido de esa generación, como `yellow`. |
| `scope`, `dex` | `introduced`, `national`, `regional`; identificador de Pokédex regional. |
| `view`, `types` | `current`/`legacy`; identificadores separados por coma, como `grass,poison`. |
| `segment` | Tipos combinados con `+`; `other` identifica Otros Pokémon. |
| `q`, `order` | Texto de búsqueda y campo/dirección, como `speed-desc`. |
| `chart`, `pokemon`, `against` | `pie`/`bars`, especie abierta y generación a comparar. |
| `art`, `game` | Arte como `red-and-green`, `current` o `game:yellow`; imágenes de detalle como `yellow` o `artwork`. |
| `lang`, `ui` | `en`, `es`, `es-419`, `ja`; `auto`, `original`, `gameboy`, `lab`. |
| `fav`, `progress` | `fav=1`; `pending`, `seen` o `caught`. Los datos personales permanecen locales. |
| `stats`, `x`, `y` | Rangos como `attack:100:255;speed:80:255`; ejes de la dispersión. |
| `members`, `teamName` | Equipo ordenado de hasta seis IDs y su nombre; junto con `section=teams` y `edition`. |

Usa los controles de copia de la app para generar enlaces codificados correctamente, especialmente `+` y nombres. No se serializan ROMs, estados de emulación, perfiles de captura, lista de favoritos ni selección temporal del comparador.

## Service worker y descargas

[vite.config.ts](../vite.config.ts) genera `sw.js` a partir de la plantilla y de los recursos de compilación; también genera `offline-player.json`. El registro se realiza solo en compilaciones de producción.

El shell se guarda al instalar el service worker. Las descargas explícitas reúnen los conjuntos de origen del contexto elegido, `media-N.json` cuando corresponde, catálogos y tres tamaños de las imágenes seleccionadas. Movimientos y runtime del reproductor son opcionales; no se incluyen ROMs. El plan elimina URLs repetidas y descarga con hasta cuatro solicitudes simultáneas, progreso y cancelación. Un conjunto solo recibe su marcador de finalización al terminar.

Las navegaciones usan el HTML del shell activo para mantener código coherente. `data/` intenta red y usa el contenido descargado como respaldo ante fallo; el resto consulta primero shell y descargas antes de red. Las imágenes originales no seleccionadas y consultas ampliadas de PokéAPI no forman parte automática de la descarga.

No se llama a `skipWaiting` ni se fuerza una recarga: una versión nueva espera el cierre de los clientes anteriores. Al activarse limpia shells viejos, conserva contenidos descargados y no modifica localStorage ni IndexedDB. **Borrar descargas** elimina solo la caché de contenidos, no el shell o los datos personales. El tamaño mostrado corresponde a esa caché, no al uso total del origen. Descargar con filtros visuales sigue descargando toda la Pokédex del contexto, y equipos/consulta requieren los conjuntos nacionales que utilicen.

## Actualizar datos y recursos

El repositorio incluye los recursos necesarios para compilar. Los comandos siguientes son para renovarlos desde sus fuentes; no son necesarios en cada `npm run dev`.

| Comando | Resultado |
| --- | --- |
| `npm run update:generations` | Catálogo de generaciones, pertenencia de especies, juegos y tipos. |
| `npm run update:locales` | Nombres localizados de especies, tipos y estadísticas. |
| `npm run update:data` | Conjuntos de generación, imágenes por época y movimientos por nivel. |
| `npm run update:media` | Miniaturas y catálogos completo/por juego. |
| `npm run update:types` | Relaciones de daño históricas. |
| `npm run update:dexes` | Catálogo de Pokédex regionales. |
| `npm run update:move-names` | Completa nombres de movimientos que aún no tienen entrada en inglés; no vuelve a consultar los ya presentes. |

Para renovar los recursos de una publicación con el catálogo actual:

```sh
npm ci
python -m pip install -r scripts/requirements-media.txt
npm run update:data
npm run update:media
npm run update:types
npm run update:dexes
npm run update:move-names
npm run check
npm test
npm run build
```

CI usa Python 3.14 y el archivo fija Pillow 13.0.0. Si renuevas el catálogo estructural de generaciones/juegos, ejecuta `update:generations` antes de preparar los datos y revisa sus reglas y pruebas; `update:locales` se ejecuta aparte para renovar nombres existentes.

`update:data` consulta con cuatro solicitudes simultáneas, valida todas las generaciones antes de empezar a reemplazar sus JSON y aprovecha la misma respuesta `pokemon` para preparar movimientos e imágenes por época. Un fallo de consulta o validación durante esa preparación conserva los archivos anteriores. No supone una transacción atómica de todos los archivos frente a fallos de disco durante su escritura.

`update:media` reutiliza miniaturas existentes y guarda originales temporalmente fuera del repositorio. Para volver a consultar sus fuentes usa `python scripts/update-media.py --refresh`. Un fallo no reemplaza el catálogo completo; los medios ya preparados pueden permanecer. El watcher de desarrollo ignora `public/data/` y `public/media/` para evitar saturación durante regeneraciones masivas.

## Validación

```sh
npm run check
npm test
npm run build
npm run preview
```

`check` ejecuta Svelte/TypeScript y falla también ante advertencias. Vitest ejecuta las pruebas existentes de normalización, conteos, historia, idiomas, navegación, exportación, equipos, capturas, respaldos y plan offline. La entrega funcional documentada pasó **110 pruebas en 20 archivos**, además de check y build. El resultado actual de CI es la referencia para cada revisión.

Las verificaciones de navegador de esa entrega incluyeron conservación del total de 151, ámbitos nacionales/regionales, seis colores en el tema oscuro, equipos compartidos y recarga, capturas con respaldo, CSV filtrado, guardados por ROM y migración de IndexedDB, ficha y movimientos sin red, reproducción offline y actualización esperando sin interrumpir el juego. La emulación se probó con una ROM libre; móvil se verificó con tamaños simulados. Safari, instalación en dispositivos físicos y ROMs comerciales no forman parte de esa cobertura.

Para revisar offline localmente, usa la dirección de preview bajo `/pokemetrics/`, espera al registro, descarga un contexto, desactiva la red y recarga con una ficha. Comprueba también que Borrar descargas conserva perfiles y partidas y que una actualización no fuerza recarga. Las descargas deben completarse antes de la prueba.

## Publicación en GitHub Pages

[deploy.yml](../.github/workflows/deploy.yml) se activa en pushes a `main`, pull requests, ejecución manual y cron diario `27 8 * * *` (UTC).

En `main`, fuera de pull requests:

1. Instala Node 24, dependencias npm, Python 3.14 y Pillow.
2. Ejecuta `update:data`, `update:media`, `update:types`, `update:dexes` y `update:move-names`.
3. Ejecuta check, pruebas y compilación.
4. Sube `dist/` y despliega el artefacto con GitHub Pages.

Los pull requests verifican los recursos ya versionados sin consultar las fuentes para regenerarlos. CI no devuelve los JSON regenerados como commits al repositorio: el sitio publicado puede tener una preparación de datos más reciente que la copia en Git. Para versionar recursos renovados hay que ejecutar los comandos localmente y revisar sus cambios.

La concurrencia cancela un workflow anterior de la misma referencia si llega otro push. Para conservar un despliegue por feature, espera a que termine correctamente la publicación de cada bloque antes de enviar el siguiente. Un fallo de validación o preparación impide publicar el nuevo artefacto; el sitio anterior continúa disponible.

Configura Pages con fuente **GitHub Actions**. Para otro repositorio o dominio, adapta la base de Vite y comprueba manifiesto, rutas de datos, emulador y alcance del service worker con build + preview. No hay secretos de despliegue de la app que configurar.

## Licencias y límites

Los datos e imágenes proceden de [PokéAPI](https://pokeapi.co/) y sus recursos enlazados. El proyecto no incorpora un scraping de WikiDex. Las atribuciones del reproductor están en [licenses.html](../public/emulator/licenses.html), junto con textos de licencias y referencias a las fuentes distribuidas de EmulatorJS 4.2.3 y Gambatte/RetroArch. El puente está identificado como GPL-3.0-or-later; esa declaración se limita a los archivos indicados en los avisos existentes.

El alcance funcional se detalla en la [guía de uso](guia-de-uso.md#alcance-de-los-datos): formas predeterminadas, estadísticas base por generación, efectividad solo por tipos, movimientos por nivel y almacenamiento local sin sincronización de cuenta.
