# Pokémetrics

Explorador de Pokémon de nueve generaciones y 1.025 especies, con datos de PokéAPI. Permite analizar tipos y estadísticas históricas, construir equipos y consultar una Pokédex mientras juegas en el navegador.

**[Abrir la aplicación](https://luiskabal.github.io/pokemetrics/)** · [Guía de uso](docs/guia-de-uso.md) · [Arquitectura y datos](docs/arquitectura-y-datos.md)

## Funciones

| Apartado | Qué incluye |
| --- | --- |
| Exploración | Generaciones I–IX; especies introducidas, Nacional hasta una época o Pokédex regional; vistas Actual y Legacy. |
| Distribución | Torta y barras con segmentos exclusivos, cantidades y porcentajes; selección de segmentos y comparación entre generaciones. |
| Listado | Búsqueda en cuatro idiomas, ordenamiento, favoritos, filtros estadísticos, progreso de captura y carga en bloques de 24 tarjetas. |
| Fichas | Arte por edición, frente/espalda, radar y barras con colores por estadística, efectividad defensiva histórica, movimientos por nivel e historial de cambios. |
| Comparación y equipos | Comparador de dos a cuatro Pokémon; equipos de hasta seis por juego, promedios, debilidades compartidas y enlaces compartibles. |
| Progreso | Partidas por juego con estados pendiente, visto y capturado; respaldo e importación JSON. |
| Jugar | Reproductor Game Boy/Game Boy Color con archivos locales, Pokédex de consulta, autoguardado, tres espacios manuales por ROM y respaldos. |
| Personalización | English, Español, Español latino y 日本語; temas Original, Game Boy y Laboratorio, o apariencia por generación. |
| Compartir y exportar | Enlaces de exploración, fichas y equipos; listado CSV y distribución en PNG/SVG. |
| Sin conexión | App instalable según navegador; descargas selectivas de datos e imágenes, movimientos y reproductor opcionales. |

La distribución cuenta cada especie una vez: seleccionar Planta y Veneno coloca a Bulbasaur en el segmento combinado, y seleccionar solo Veneno también lo encuentra. La suma de segmentos, incluido **Otros Pokémon**, conserva el total de la Pokédex elegida. [Reglas y ejemplos](docs/guia-de-uso.md#distribución-sin-duplicados).

## Documentación

- **[Guía de uso](docs/guia-de-uso.md):** recorrido por la interfaz, reglas de conteo, estadísticas y arte históricos, equipos, capturas, guardados, descargas y resolución de problemas.
- **[Arquitectura y datos](docs/arquitectura-y-datos.md):** módulos, fuentes y transformaciones, optimización, formatos y claves locales, parámetros de enlaces, regeneración de datos, validación y despliegue.

## Desarrollo local

Requiere **Node.js 24 o superior**. La app usa Svelte 5, TypeScript, Vite, Tailwind CSS y daisyUI; se publica como sitio estático, sin backend, claves de API ni variables de entorno.

```sh
npm ci
npm run dev
```

Abre la dirección indicada por Vite bajo `/pokemetrics/`. Node se utiliza para desarrollar y compilar; el sitio publicado se ejecuta en el navegador.

```sh
npm run check
npm test
npm run build
npm run preview
```

Para probar instalación y modo offline usa **build + preview**: el service worker no se registra en el servidor de desarrollo. Python y Pillow solo son necesarios para [regenerar miniaturas](docs/arquitectura-y-datos.md#actualizar-datos-y-recursos), no para compilar con los recursos ya incluidos.

## Publicación

[GitHub Actions](.github/workflows/deploy.yml) valida, prepara datos y publica `dist/` en GitHub Pages al actualizar `main`. También permite ejecución manual y actualización diaria a las **08:27 UTC**. Los pull requests ejecutan las verificaciones con los recursos incluidos, sin regenerarlos ni desplegar.

La fuente de Pages debe estar configurada como **GitHub Actions**. El sitio usa la base `/pokemetrics/`; para otro nombre de repositorio o dominio, revisa `base` en [vite.config.ts](vite.config.ts). [Detalles del proceso](docs/arquitectura-y-datos.md#publicación-en-github-pages).

## Alcance y fuentes

Se cuentan especies y se muestran sus formas predeterminadas. Legacy respeta dobles tipos originales; Gen I utiliza cinco estadísticas, incluida **Especial**. Las ediciones identifican arte y movimientos, mientras que el historial de estadísticas se reconstruye por generación. Una imagen ausente se indica sin reemplazarla por la de otro juego.

Los favoritos, equipos, capturas, descargas y partidas son locales al navegador. Los archivos de ROM y los guardados no se envían al servidor; el proyecto no incluye ROMs comerciales ni BIOS. Consulta las [licencias y fuentes del reproductor](public/emulator/licenses.html) y las [limitaciones documentadas](docs/guia-de-uso.md#alcance-de-los-datos).
