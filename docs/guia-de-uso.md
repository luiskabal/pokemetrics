# Guía de uso de Pokémetrics

[Inicio](../README.md) · [Arquitectura y datos](arquitectura-y-datos.md) · [Abrir la app](https://luiskabal.github.io/pokemetrics/)

Los nombres de controles de esta guía corresponden a la interfaz en español. El idioma global puede cambiarlos.

## Empezar a explorar

1. Abre **Explorar** y elige una generación y un **Juego de referencia**.
2. En **Pokémon que explorar**, elige especies introducidas, Nacional hasta esa generación o Pokédex regional del juego. Si hay varias Pokédex regionales, elige una.
3. Selecciona uno o más tipos. **Todos** permite recorrer el conjunto completo.
4. Consulta la torta o las barras y pulsa una tarjeta para abrir su ficha.

Al inicio los gráficos están vacíos hasta seleccionar un tipo. El contador general identifica el conjunto de referencia; los resultados del listado cambian al aplicar filtros.

En escritorio, desde 1.200 px, el listado ocupa el centro, los filtros quedan a la izquierda y el análisis a la derecha. En móvil y tablet se usan las pestañas **Pokémon / Filtros / Análisis**, comenzando por el listado. Las pestañas admiten flechas, Inicio y Fin; los controles de gráficos y galerías también pueden usarse con teclado.

## Generación, juego y vista

| Control | Qué cambia |
| --- | --- |
| Generación | Época de referencia, juegos disponibles, reglas Legacy y especies introducidas. |
| Juego de referencia | Edición de referencia para los apartados que usan juegos, Pokédex regional disponible y selección inicial de imágenes. |
| Introducidos | Solo las especies que debutaron en esa generación. |
| Nacional | Todas las especies conocidas hasta esa generación; no significa que todas se puedan capturar en ese juego. |
| Regional | Especies y numeración de la Pokédex regional asociada al juego. Se conserva también el número nacional. |
| Actual | Tipos y estadísticas base actuales disponibles en los datos preparados de PokéAPI. |
| Legacy | Tipos y estadísticas reconstruidos para la generación consultada. Conserva los dobles tipos. |

La referencia por juego no convierte Actual en una vista histórica: para consultar reglas de la época se usa **Legacy**. Una ficha permite cambiar localmente sus estadísticas a actuales o históricas.

En Introducidos, los tamaños del catálogo incluido son:

| Generación | I | II | III | IV | V | VI | VII | VIII | IX |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Especies | 151 | 100 | 135 | 107 | 156 | 72 | 88 | 96 | 120 |

En Nacional o Regional, el denominador cambia con el conjunto elegido. Por ejemplo, Nacional hasta Gen II incluye 251 especies.

## Distribución sin duplicados

La torta y las barras usan grupos exclusivos según la coincidencia con **los tipos seleccionados**. No asignan cada Pokémon únicamente a su primer tipo.

Ejemplo con Bulbasaur en Gen I Legacy:

- Si seleccionas **Veneno**, aparece en el listado y cuenta una vez en ese segmento.
- Si seleccionas **Planta y Veneno**, aparece una vez en **Planta + Veneno**.
- Si seleccionas solo **Planta**, cuenta una vez en Planta, aunque su ficha conserve ambos tipos.

Los Pokémon que no coinciden van a **Otros Pokémon**. Cada porcentaje usa `cantidad / total del conjunto × 100`. En Gen I Introducidos, todos los segmentos suman **151**; los porcentajes redondeados pueden no sumar exactamente 100,0 %.

El detalle individual de cada tipo incluye todos sus integrantes: Bulbasaur cuenta en el total de Planta y en el total de Veneno. Esos totales se superponen y no deben sumarse entre sí.

Pulsa un segmento, una barra o un elemento de la leyenda para ver exactamente ese grupo. También puedes explorar Otros Pokémon. Seleccionar el segmento limpia la búsqueda anterior, pero conserva el total del gráfico; usa el control para quitar el segmento cuando quieras ampliar el listado.

**Comparar distribución con** contrasta generaciones usando los mismos tipos y vista. Cada una conserva su propio denominador. Este control funciona con el ámbito Introducidos.

## Listado, búsqueda y filtros

Las tarjetas muestran imagen, número, nombre y tipos, con controles de comparación, favoritos y captura. **Mostrar más** añade bloques de 24 tarjetas; los cálculos y las exportaciones consideran todos los resultados, incluso los que todavía no se han dibujado.

La búsqueda admite nombres en los cuatro idiomas y romanización japonesa, así como números exactos: `25` o `#025`. Ignora acentos latinos y puntuación y diferencia los símbolos de Nidoran. El ordenamiento ofrece número, nombre, estadísticas, altura y peso en ambos sentidos. Las estadísticas históricas que falten quedan al final al ordenar.

**Filtrar estadísticas** permite fijar mínimos y máximos inclusivos de 0 a 255. Usa valores actuales o históricos según la vista; Gen I Legacy ofrece Especial en lugar de las dos estadísticas especiales modernas.

**Explorar estadísticas** muestra una dispersión inicialmente de Ataque frente a Velocidad. Puedes cambiar ambos ejes. Cada punto corresponde a un resultado del listado, su color indica el primer tipo y pulsarlo abre la ficha. Los puntos con valores iguales pueden superponerse.

| Acción | Listado, CSV y dispersión | Distribución de tipos |
| --- | --- | --- |
| Cambiar conjunto o vista | Se recalculan. | Se recalcula con su nuevo total. |
| Seleccionar tipos | Se muestran las coincidencias. | Se forman segmentos exclusivos. |
| Seleccionar un segmento | Se limita a ese grupo. | Conserva la distribución completa. |
| Buscar, marcar favoritos o filtrar estadísticas/capturas | Se filtran. | Conserva la distribución completa y su denominador. |
| Ordenar | Cambia el orden del listado y CSV. | No cambia las cantidades. |

Las estrellas guardan favoritos en este navegador. **Mis favoritos** funciona sin seleccionar tipos y respeta el conjunto y los demás filtros.

## Fichas y estadísticas

La ficha reúne ilustración, número, nombre, tipos, altura, peso y estadísticas. **Volver al listado** permanece visible al desplazarse. El resumen y las estadísticas aprovechan el espacio junto a la imagen en escritorio y se apilan en móvil.

El gráfico alterna entre **Radar** y **Barras**, con números y escala fija de 0 a 255. Cada estadística conserva un color:

| Estadística | Color |
| --- | --- |
| PS | Rojo |
| Ataque | Naranja |
| Defensa | Mostaza |
| Ataque especial | Azul |
| Defensa especial | Verde azulado |
| Velocidad | Violeta |
| Especial de Gen I | Índigo |

Gen I Legacy tiene cinco estadísticas: PS, Ataque, Defensa, Especial y Velocidad. Desde Gen II son seis. **Especial** no se calcula a partir de las estadísticas especiales actuales ni se compara con ellas como si fueran el mismo dato.

El selector **Estadísticas de** permite elegir actuales o una edición de la generación. PokéAPI aporta cambios por generación, por lo que elegir dos juegos de una misma generación no implica cifras distintas. No se inventan diferencias entre Azul y Amarillo.

Otros apartados de la ficha:

- **Efectividad defensiva:** debilidades, resistencias e inmunidades por los tipos del Pokémon, con reglas de su época en Legacy. No es una simulación de combate: habilidades, objetos y efectos pueden modificar el resultado.
- **Movimientos por nivel:** elige edición para ver movimientos y niveles registrados. Se conserva el nivel 0 cuando aparece en la fuente. Una edición sin datos lo indica; no toma el listado de otro juego. No incluye MT/MO, tutores ni movimientos huevo.
- **Historial por generación:** muestra tipos y estadísticas desde la aparición de la especie, señalando cambios y diferencias numéricas frente a la generación anterior. No crea diferencias para una estadística recién introducida.
- **Información ampliada:** categoría, descripción, habilidades y evolución se consultan al abrir la ficha. La descripción identifica edición e idioma, incluidos idiomas alternativos cuando falta una traducción. Legacy no atribuye habilidades a Gen I/II y limita evoluciones y habilidades a la época disponible.

Si falla la información ampliada, puedes reintentar sin perder el resto de la ficha.

## Arte, imágenes e interfaz

Hay dos selecciones globales distintas en Filtros:

| Selección | Aplicación |
| --- | --- |
| Ilustraciones | Imágenes del listado y selección inicial de la galería de cada ficha. |
| Imágenes de detalle | Frente y espalda dentro del apartado desplegable de imágenes de los juegos. |

Introducidos comienza con el arte original disponible de Gen I/II; desde Gen III usa las imágenes del primer juego del catálogo de esa generación. Gen I comienza con **Rojo/Verde de Japón**. Nacional y Regional comienzan con las imágenes del juego elegido. Una imagen ausente se indica sin reemplazarla automáticamente por una edición posterior: Gen VII conserva Sol/Luna aunque falten sus imágenes.

En la galería de una ficha, mueve el cursor por las opciones, enfócalas o tócalas para comparar imágenes. Cambiar una ficha no cambia el listado; al reabrirla recupera la selección global. Las etiquetas identifican juegos, porque la fuente no aporta una fecha fiable para cada ilustración.

Las imágenes se muestran primero como versiones estáticas del mismo arte. **Reproducir animación** solicita el original bajo demanda. Detenerla o desplazarla fuera de pantalla vuelve a la miniatura. Si está activo movimiento reducido, se deshabilita la reproducción. No hay un visor 3D interactivo: se muestran los sprites e imágenes suministrados por la fuente.

En **Apariencia e idioma** puedes elegir Original, Game Boy o Laboratorio. **Por generación** usa Game Boy en Gen I y las paletas por época en las demás. La selección manual se conserva al cambiar de generación. El selector de idioma ofrece inglés, español, español latino y japonés; cambia interfaz y nombres disponibles sin nuevas consultas para traducir. Cuando falta una traducción regional se usan las alternativas disponibles.

## Comparador y equipos

El **comparador** de tarjetas permite revisar entre dos y cuatro Pokémon de la exploración, con tipos, medidas y estadísticas de la vista elegida. Cambiar de generación reinicia la comparación.

En **Equipos**:

1. Elige el juego y crea un equipo o selecciona uno guardado.
2. Ponle nombre, busca Pokémon y añádelos hasta completar seis espacios.
3. Revisa estadísticas de cada miembro, promedios y debilidades compartidas por dos o más integrantes.
4. Despliega la tabla defensiva para consultar los multiplicadores por tipo atacante.
5. Copia el enlace para compartir juego, nombre y composición.

Los equipos usan los tipos y estadísticas históricos de la época del juego, independientemente de Actual/Legacy en Explorar. Se permiten especies repetidas. Los candidatos son las especies conocidas hasta esa generación: el constructor no comprueba si se capturan en esa edición ni reglas de torneos, movimientos o habilidades. Se guardan en este navegador; el enlace permite reconstruir la composición en otro.

## Progreso de captura

En el listado, despliega **Mi progreso**, crea una partida y asígnale un nombre. Cada juego puede tener varios perfiles independientes. Marca el estado en la tarjeta o ficha:

| Estado | Significado |
| --- | --- |
| Pendiente | Sin registrar como visto o capturado. |
| Visto | Visto, sin marcar como capturado. |
| Capturado | Capturado; también cuenta como visto. |

Los totales usan toda la Pokédex elegida, antes de los filtros del listado. El filtro Visto incluye también Capturado. Al cambiar de juego, se consultan los perfiles de ese juego.

**Respaldar progreso** descarga un JSON con los perfiles guardados. **Importar progreso** valida el archivo y añade sus perfiles con identificadores nuevos; no reemplaza los existentes. Este registro es manual y no lee tu ROM ni el guardado del emulador.

## Jugar en el navegador

1. Abre **Jugar** y elige un archivo local sin comprimir `.gb` o `.gbc`.
2. Pulsa **Iniciar juego** dentro de la pantalla.
3. Usa pausa, volumen y pantalla completa según prefieras.

El reproductor admite Game Boy/Game Boy Color; Red, Blue, Yellow y Green requieren tus propios archivos compatibles. No se incluyen ROMs comerciales ni BIOS, ni se ofrece multijugador por cable link.

| Acción | Teclado |
| --- | --- |
| Movimiento | Flechas |
| A | X |
| B | Z |
| Start | Enter |
| Select | Shift |

En pantallas táctiles aparecen cruceta y botones. Salir de Jugar o cambiar de pestaña pausa la partida; al volver debes continuarla. El idioma global traduce los controles de la web, pero el idioma del juego depende de la ROM.

**Pokédex de consulta** permite elegir manualmente una edición y buscar Pokémon junto al reproductor. Se coloca al lado en escritorio; en móvil es desplegable y abrirla pausa el juego. Abrir una ficha también lo pausa. No detecta automáticamente equipo, capturas ni edición desde la ROM.

### Guardados y respaldos

| Mecanismo | Funcionamiento |
| --- | --- |
| Autoguardado | Cada 15 segundos de juego activo, al pausar y al salir de Jugar. Guardar estado fuerza una copia. |
| Tres espacios manuales | Cada uno tiene nombre, fecha y miniatura; guardar o cargar pausa el juego. Reemplazar un espacio pide confirmación. |
| Descargar copia | Exporta el estado actual en JSON, sin ROM. Para respaldar un espacio concreto, cárgalo antes. |
| Restaurar copia | Valida versión del motor, huella del juego y checksum antes de restaurar el estado. |

La identificación usa el **SHA-256 del archivo**, no su nombre: renombrar la misma ROM conserva sus guardados, pero otra revisión o archivo diferente mantiene datos separados. Al recargar debes volver a elegir la misma ROM. Cargar un espacio manual también actualiza el autoguardado al estado restaurado.

Los respaldos son propios del reproductor y su versión de núcleo. Los guardados y miniaturas quedan en este navegador; no se sincronizan con GitHub ni se envían al servidor. Borrar los datos del sitio puede eliminarlos. Si falla el almacenamiento, se informa y puedes descargar una copia del estado actual.

## Compartir y exportar

**Copiar enlace** conserva generación, juego, ámbito, vista, tipos, segmento, búsqueda, orden, apariencia, idioma, imágenes y filtros estadísticos/de captura. Las fichas y equipos tienen sus propios enlaces. Atrás/Adelante restaura los parámetros de exploración; los valores inválidos se descartan o normalizan.

El enlace no transfiere favoritos, perfiles de captura, ROMs ni guardados. Por eso un filtro de favoritos o progreso puede dar otros resultados en un navegador distinto. El comparador temporal tampoco se incluye en el enlace.

**Descargar CSV** incluye todos los resultados filtrados y ordenados, no solo las 24 tarjetas cargadas. Exporta tipos, medidas y estadísticas de Actual/Legacy, con una columna para indicar datos históricos pendientes. Usa UTF-8 con BOM y separador coma.

**Descargar PNG/SVG** exporta la distribución completa de torta o barras con leyenda, cantidades y porcentajes, incluido Otros Pokémon. Conserva fondo blanco para compartir o imprimir. La dispersión no tiene exportación como imagen. PNG limita su altura a 4.096 px; SVG conserva formato vectorial.

## Instalar y descargar para usar sin conexión

1. Con conexión, elige generación, ámbito, juego, ilustración e imágenes de detalle.
2. Abre **Instalar y usar sin conexión**.
3. Activa, si lo necesitas, movimientos por nivel y reproductor Game Boy.
4. Pulsa **Descargar** y espera a que termine. Puedes cancelar; una descarga incompleta no se registra como conjunto terminado.
5. Para añadir otro conjunto, cambia los selectores y repite la descarga.

Se descarga toda la Pokédex del contexto elegido, aunque el listado esté filtrado. Incluye datos de tipos, estadísticas e historial, y las imágenes estáticas seleccionadas. No descarga todas las ilustraciones y ediciones de la galería, ni animaciones originales. Descripciones, habilidades y evolución ampliadas requieren red salvo los recursos que ya estén en la caché de consultas.

Descargar el reproductor no incluye una ROM: debes volver a seleccionar tu archivo local también sin conexión. Equipos y la Pokédex de consulta pueden requerir más datos que una descarga de Introducidos, porque usan Nacional hasta la época; descarga ese ámbito para disponer de sus datos e imágenes del juego.

La app muestra los conjuntos descargados, fecha y espacio usado por esas descargas; el código de la aplicación se almacena aparte. **Borrar descargas** vacía los contenidos offline, incluidos archivos parciales, y conserva favoritos, equipos, capturas y guardados. No equivale a borrar todos los datos del sitio desde el navegador.

Si el navegador ofrece **Instalar app**, puedes usar ese botón; también puede ofrecer «Instalar» o «Añadir a pantalla de inicio» en su menú. Instalar no descarga automáticamente todas las generaciones. Una actualización de la aplicación espera hasta cerrar todas sus pestañas o ventanas y volver a abrirla: no recarga una partida en curso.

## Si algo no aparece

| Situación | Qué revisar |
| --- | --- |
| Gráfico o listado vacío | Selecciona tipos o Todos; revisa segmento, búsqueda, favoritos, rangos y filtro de captura. |
| Conteo menor al esperado | Comprueba Introducidos/Nacional/Regional y la Pokédex regional elegida. |
| Imagen no disponible | Puede faltar en la fuente. Elige explícitamente otra edición o arte actual. |
| Faltan estadísticas o movimientos | La app no inventa datos históricos ni sustituye movimientos por los de otro juego. Prueba actuales u otra edición. |
| Información ampliada falla | Reintenta con conexión; sus consultas son independientes del gráfico y estadísticas. |
| Datos guardados antiguos | Usa Actualizar. La fecha visible identifica la preparación del conjunto, no una consulta histórica en tiempo real. |
| No aparece un guardado | Selecciona la misma ROM, navegador y origen del sitio; verifica si es otra revisión del archivo. |
| No se puede guardar | Descarga un respaldo de progreso o partida, o conserva el enlace del equipo. |
| No funciona offline | Completa primero la descarga del contexto y contenido que necesitas. En desarrollo local usa build + preview. |
| No ves una actualización de la app | Cierra todas sus pestañas o ventanas y vuelve a abrirla. Actualizar datos y actualizar la app son procesos distintos. |

## Alcance de los datos

Se muestran las formas predeterminadas de las 1.025 especies incluidas; formas regionales, Megaevoluciones y otras variantes no cuentan como especies adicionales. Las estadísticas son **base**, no estadísticas calculadas con nivel, IV, EV o naturaleza. La efectividad considera tipos, sin simular habilidades u objetos.

Las ilustraciones históricas, sprites, traducciones, movimientos y cambios dependen de lo disponible en PokéAPI. Español latino puede recurrir a español u otro nombre disponible. Elegir un juego no garantiza disponibilidad de captura ni diferencias estadísticas entre ediciones de la misma generación.

La instalación depende del navegador y el almacenamiento del dispositivo. Las verificaciones del desarrollo incluyeron Chromium automatizado, diseños móviles simulados y una ROM de prueba libre; queda pendiente comprobar Safari y móviles físicos. No se verificaron ROMs comerciales como parte de estas pruebas.
