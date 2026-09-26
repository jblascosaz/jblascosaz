# Proyecto: ¿Se puede hacer fuego en…? (nombre provisional)

> Documento vivo. Aquí guardamos la idea, las decisiones tomadas, lo que queda pendiente y las dudas abiertas.
> Última actualización: 2026-09-26

---

## 1. La idea

Una web **automática** que responde a búsquedas long-tail del tipo:

- "¿Se puede hacer fuego en [municipio] hoy?"
- "¿Se puede hacer barbacoa en [municipio] este fin de semana?"
- "¿Cuándo empieza la época de peligro de incendios en [provincia/comunidad]?"
- "¿Se pueden quemar rastrojos / restos de poda en [municipio] en [mes]?"
- "Nivel de riesgo de incendio hoy en [zona]"

Para **cada municipio de España** (~8.100), con la información sacada **automáticamente de fuentes oficiales** y explicada de forma clara, accesible y rápida de leer:

- Qué se puede y qué no se puede hacer **hoy**, **mañana** y en **rangos de fechas** (épocas de peligro, meses, fechas concretas).
- Toda la información posible: nivel de riesgo, normativa vigente, si hace falta autorización y cómo pedirla, excepciones, teléfonos, enlace a la fuente oficial.

---

## 2. Enfoque técnico recomendado

### Resumen

**Web estática generada a partir de datos que se actualizan solos varias veces al día.**

```
Fuentes oficiales ──► Recolectores (scripts) ──► Datos normalizados (JSON) ──► Generador de la web (Astro) ──► Hosting (CDN)
   AEMET, CCAA,         uno por fuente,           un formato común para         una página por municipio,        Cloudflare Pages
   boletines...         se ejecutan por cron      toda España                   provincia, comunidad, tema
```

### Stack propuesto

| Pieza | Tecnología | Por qué |
|---|---|---|
| Web | **Astro** + TypeScript | Genera HTML estático: muy rápido y muy bueno para SEO, que es lo que necesita una web de long-tail. Permite meter React solo donde haga falta interactividad (buscador, calendario, mapa). |
| Recolectores de datos | **Node.js + TypeScript** (fetch, parsers de HTML/PDF/XML) | Mismo lenguaje que la web, un solo proyecto. |
| Automatización | **GitHub Actions con cron** (p. ej. cada 1–3 h en temporada alta) | Gratis; ejecuta los recolectores, guarda los datos y vuelve a publicar la web. |
| Datos | **JSON versionado en el repo** al principio | Sin servidor ni base de datos. El historial de Git sirve de histórico ("¿se podía el día X?"). Si crece mucho → SQLite/Postgres (p. ej. Supabase). |
| Hosting | **Cloudflare Pages** (alternativas: Netlify, Vercel) | CDN gratis o casi gratis. **Comprobar el límite de archivos por despliegue** frente al número de páginas. |
| Municipios | Relación oficial de municipios del **INE** (códigos INE) + límites del **IGN/CNIG** | Base común para relacionar cada municipio con su provincia, comunidad y zona de riesgo. |

### Por qué no otras opciones

- **React/Vite SPA (como la app de tareas)**: el contenido se genera en el navegador → peor SEO. Aquí el SEO es la base del negocio.
- **Next.js con servidor**: válido, pero más caro y complejo de lo necesario para empezar. Si más adelante hace falta renderizar bajo demanda, Astro también lo permite (modo híbrido/SSR en Cloudflare).
- **WordPress + plugins**: difícil de automatizar bien a esta escala y con datos que cambian cada día.

### Plan B si el build se hace lento

Con ~8.100 municipios más páginas de provincia, comunidad y tema, el build debería tardar pocos minutos. Si con el tiempo pasa a ser un problema:
- Páginas de municipio renderizadas bajo demanda (SSR en el edge) con caché de unas horas.
- Los datos, en KV/D1 de Cloudflare en vez de JSON en el repo.

---

## 3. Modelo de datos (borrador)

La normativa sobre el fuego funciona **por capas**. Lo que se puede hacer en un municipio y en una fecha sale de combinar todas:

1. **Estatal**: marco general (Ley de Montes, etc.).
2. **Comunidad autónoma**: época(s) de peligro (fechas), orden anual de prevención, prohibiciones y autorizaciones.
3. **Zona / comarca / provincia**: nivel de riesgo o preemergencia **diario** (en las CCAA que lo publican).
4. **Municipio**: ordenanzas, bandos y prohibiciones puntuales (p. ej. fiestas, San Juan).
5. **Meteorología**: índice de riesgo de incendio (AEMET u organismos autonómicos).

### Actividades (cada una con su estado)

- Barbacoa en zona recreativa / área habilitada
- Barbacoa en finca o parcela privada
- Hoguera / fuego de campamento
- Quema agrícola (rastrojos, restos de poda)
- Quema de restos forestales
- Pirotecnia / fuegos artificiales
- Hogueras de San Juan y fiestas
- Uso de maquinaria que pueda provocar chispas (si la fuente lo regula)
- Fumar / tirar colillas en zona forestal

### Estados posibles

`permitido` · `permitido con autorización` · `permitido con condiciones` · `prohibido` · `sin datos`

### Cada dato guarda siempre

- Fuente (organismo + URL)
- Fecha de publicación y fecha de la última comprobación
- Vigencia (desde / hasta)
- Ámbito (CCAA / provincia / zona / municipio)
- Texto original o extracto de la norma

---

## 4. Páginas y URLs (borrador)

```
/                                         buscador + mapa + estado general de España hoy
/[comunidad]/                             resumen de la comunidad, época de peligro, normativa
/[comunidad]/[provincia]/                 resumen de la provincia
/[comunidad]/[provincia]/[municipio]/     ← página principal de long-tail
/barbacoas/, /quemas-agricolas/, ...      páginas por actividad
/calendario/[año]/                        épocas de peligro por comunidad
/fuentes/                                 lista de fuentes oficiales y su estado
```

La **página de municipio** muestra:
- Respuesta directa arriba: "Hoy, [fecha], en [municipio]: 🔴 prohibido hacer fuego en terreno forestal", con la hora de la última actualización.
- Tabla por actividad: hoy / mañana / próximos días.
- Calendario del año con la época de peligro y los periodos de restricción.
- Qué hacer si se necesita autorización (dónde se pide, enlace).
- Fuentes oficiales enlazadas y teléfono de emergencias 112.
- Preguntas frecuentes generadas con datos reales del municipio.

**Decisión recomendada:** una página por municipio que se actualiza, y **no** una página por municipio y fecha. Cientos de miles de URLs casi iguales serían contenido "thin" y Google podría penalizarlas. Las búsquedas "hoy", "mañana" o "en agosto" se cubren desde la misma página con secciones y texto bien trabajados.

---

## 5. Principios de contenido (importantes)

- **Ser prudente por defecto**: si faltan datos o están desactualizados, **nunca** decir "sí se puede". Mostrar "sin datos confirmados, consulta a tu ayuntamiento o comunidad".
- **Fecha de actualización visible** en cada página y aviso si el dato tiene más de X horas.
- **Siempre enlazar a la fuente oficial** y dejar claro que la web es informativa y no oficial.
- Avisar de que **las ordenanzas municipales pueden ser más restrictivas**.
- Lenguaje claro, móvil primero, accesible (contraste, no depender solo del color).

---

## 6. Fuentes oficiales a investigar

> ⚠️ **Todo lo de esta tabla está POR VERIFICAR.** Es una lista de partida: hay que confirmar para cada fuente si existe, qué publica, en qué formato, cada cuánto y con qué licencia de reutilización.

| Ámbito | Fuente candidata | Qué podría dar | Estado |
|---|---|---|---|
| España | AEMET OpenData (API con clave gratuita) | Predicción de peligro de incendios / meteorología | Por verificar |
| España | BOE y boletines oficiales autonómicos | Órdenes anuales de prevención, fechas de épocas de peligro | Por verificar |
| España | INE / IGN-CNIG | Lista de municipios, códigos y límites | Por verificar |
| Andalucía | Plan INFOCA / Junta de Andalucía | Época de peligro, prohibiciones | Por verificar |
| Aragón | Gobierno de Aragón | Orden anual, índice de riesgo diario | Por verificar |
| Asturias | Principado de Asturias | Normativa, autorizaciones de quema | Por verificar |
| Baleares | IBANAT / Govern | Época de peligro, nivel de riesgo | Por verificar |
| Canarias | Gobierno de Canarias / cabildos | Alertas y prohibiciones por isla | Por verificar |
| Cantabria | Gobierno de Cantabria | Normativa, quemas | Por verificar |
| Castilla-La Mancha | INFOCAM | Época de peligro, normativa | Por verificar |
| Castilla y León | Junta de Castilla y León | Época de peligro, nivel de riesgo | Por verificar |
| Cataluña | Generalitat (Agents Rurals, "Pla Alfa") | Nivel diario por municipio | Por verificar |
| C. Valenciana | Generalitat Valenciana | Nivel de preemergencia diario por zona | Por verificar |
| Extremadura | Plan INFOEX | Época de peligro, normativa | Por verificar |
| Galicia | Xunta de Galicia | Índice de riesgo diario, permisos de quema | Por verificar |
| La Rioja | Gobierno de La Rioja | Normativa | Por verificar |
| Madrid | Comunidad de Madrid (INFOMA) | Época de peligro, normativa | Por verificar |
| Murcia | Región de Murcia | Normativa, nivel de riesgo | Por verificar |
| Navarra | Gobierno de Navarra | Normativa | Por verificar |
| País Vasco | Diputaciones forales | Normativa por territorio histórico | Por verificar |
| Ceuta / Melilla | Ciudades autónomas | Por ver si aplica | Por verificar |

Para cada fuente hay que apuntar: URL, formato (API / HTML / PDF / RSS), frecuencia, licencia, dificultad de extraer los datos y ejemplo real guardado.

---

## 7. Hoja de ruta

### Fase 0: Investigación (ahora)
- [ ] Rellenar la tabla de fuentes (sección 6) con datos verificados.
- [ ] Elegir **una o dos comunidades para el MVP**, las que tengan datos diarios por zona o municipio más fáciles de extraer.
- [ ] Decidir nombre y dominio.
- [ ] Crear un repositorio propio para el proyecto.

### Fase 1: MVP
- [ ] Proyecto Astro + estructura de datos + lista de municipios del INE.
- [ ] Recolectores de las comunidades del MVP + AEMET.
- [ ] Páginas de municipio, provincia y comunidad para el MVP.
- [ ] Para el resto de España: páginas con la información general (época de peligro, enlaces oficiales) y el estado "sin datos diarios".
- [ ] Cron en GitHub Actions + despliegue en Cloudflare Pages.
- [ ] Monitorización: aviso si un recolector falla o devuelve datos raros. Los datos antiguos se marcan como "desactualizados" y **nunca** se muestran como actuales.
- [ ] Aviso legal, página de fuentes, sitemap, Search Console.

### Fase 2: Cobertura
- [ ] Ampliar comunidad a comunidad.
- [ ] Páginas por actividad y calendario anual.
- [ ] Mapa interactivo de España con el estado de hoy.

### Fase 3: Extras
- [ ] Alertas por email, push o Telegram ("avísame cuando se pueda quemar en mi municipio").
- [ ] API pública o widget para otras webs.
- [ ] Versiones en catalán, gallego y euskera.

---

## 8. Riesgos

| Riesgo | Cómo mitigarlo |
|---|---|
| **Responsabilidad**: alguien hace fuego porque la web decía "se puede" y había una prohibición | Prudencia por defecto, aviso legal, fecha visible, enlace a la fuente, no afirmar nada sin dato oficial vigente. Valorar consulta legal antes del lanzamiento. |
| Las webs oficiales cambian de formato y un recolector deja de funcionar | Tests por recolector con ejemplos guardados, alertas si falla, estado "desactualizado" automático. |
| Google considera el contenido "a escala" como spam | Datos reales y únicos por municipio, sin páginas vacías o duplicadas, contenido útil de verdad. |
| Licencias de reutilización de datos | Revisar las condiciones de cada fuente (en general, la información del sector público es reutilizable citando la fuente, pero hay que confirmarlo fuente a fuente). |
| Sobrecargar webs oficiales | Pocas peticiones, caché, respetar robots.txt, identificar el bot. |

---

## 9. Dudas abiertas (para decidir)

- [ ] **Nombre y dominio** (ideas: sepuedehacerfuego.es, puedohacerfuego.es… comprobar disponibilidad).
- [ ] **Presupuesto** mensual (dominio ~10 €/año; el resto puede ser gratis al principio).
- [ ] **Monetización**: ¿anuncios, afiliación (barbacoas, material de camping), ninguna?
- [ ] **Qué comunidades van primero** en el MVP.
- [ ] **Idiomas**: ¿solo castellano al principio?
- [ ] **Repositorio**: crear uno nuevo solo para este proyecto (recomendado).
- [ ] ¿Quién da de alta la **clave de AEMET OpenData**? (gratuita, se pide con un email)
- [ ] ¿Hace falta revisión legal del aviso y del enfoque de "sí/no"?

---

## 10. Registro de decisiones

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-09-26 | Web estática (Astro) + datos automáticos con cron | SEO, coste casi cero y simplicidad |
| 2026-09-26 | Una página por municipio (no por municipio × fecha) | Evitar contenido "thin" y duplicado |
| 2026-09-26 | Prudencia por defecto: sin dato oficial vigente no se dice "sí" | Seguridad y responsabilidad |

---

## 11. Pendiente / a medias

- Este documento está en el repo `jblascosaz/jblascosaz` de forma provisional. Se moverá al repositorio propio del proyecto cuando se cree.
- Todavía no se ha escrito código del proyecto.
