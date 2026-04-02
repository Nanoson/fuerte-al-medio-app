# Algoritmo de Fuerte al Medio - Documentación Técnica

## Resumen Ejecutivo

Fuerte al Medio utiliza un **algoritmo ESTÁTICO, no dinámico**. El orden de las noticias se calcula UNA VEZ cada 2 horas mediante un proceso determinístico basado en criterios objetivos.

## Ciclo de Procesamiento (Cada 2 Horas)

```
Scraping (24 portales)
    ↓
Clustering (similitud temática, umbral 40%)
    ↓
Ordenamiento de Clusters (Jerarquía FASE 56)
    ↓
Asignación de relevanceScore por IA
    ↓
Inserción en BD (updatedAt = CURRENT_TIMESTAMP)
    ↓
Exposición en /api/news (ORDER BY updatedAt DESC)
```

## Los 3 Criterios de Ordenamiento (Cascada)

### 1️⃣ Presencia en Portada de Grandes Medios

Si la noticia aparece en portada de:
- Infobae
- Clarín
- La Nación

**Impacto:** Máxima prioridad. Aparece primero.

### 2️⃣ Cantidad de Medios Distintos

Cantidad de medios DIFERENTES que cubren el tema.

**Fórmula aproximada:**
- 8 medios = más arriba que 5 medios
- El clustering agrupa por similitud temática (>40%)

### 3️⃣ Cantidad de Artículos del Cluster

Cuántos artículos tiene el cluster/tema.

**Ejemplo:** Tema con 15 artículos > Tema con 10 artículos

## Archivos Relevantes

### Backend
- `backend/server.js` - Endpoints principales, línea 45+
- `backend/clustering.js` - Agrupación y jerarquía FASE 56, línea 230-245
- `backend/neutralizer.js` - Asignación de relevanceScore
- `backend/database.js` - Esquema PostgreSQL

### Frontend
- `src/App.jsx` - Renderizado y estado
- `src/components/NewsCard.jsx` - Visualización de artículos

## Campos de BD Utilizados para Ordenamiento

| Campo | Tipo | Uso |
|-------|------|-----|
| `updatedAt` | TIMESTAMP | **PRINCIPAL**: ORDER BY updatedAt DESC |
| `importanceScore` | INTEGER | Cantidad de medios (info) |
| `relevanceScore` | INTEGER | Score de IA (info) |
| `userVotesSum` | INTEGER | Votos cívicos (Dashboard) |
| `userVotesCount` | INTEGER | Cantidad votos (Dashboard) |

## Factores que SÍ Afectan el Ordenamiento

✅ Portada de Infobae/Clarín/La Nación
✅ Cantidad de medios distintos
✅ Recency (cada 2 horas)
✅ Relevancia asignada por IA

## Factores que NO Afectan el Ordenamiento

❌ Votos cívicos (👍👎) de usuarios
❌ Cantidad de comentarios
❌ Tiempo de lectura
❌ Menciones en redes sociales
❌ Engagement de usuarios

## Frecuencia de Actualización

- **Ciclo:** Cada 2 horas
- **Horarios:** 00:00, 02:00, 04:00, etc. (UTC-3 Argentina)
- **Latencia:** Hasta 30 min de demora en scraping + procesamiento

## El Algoritmo "Hegemónico" (En App.jsx)

Nota: Existe un algoritmo complementario en App.jsx (líneas 170-228) que aplica "puntos de poder" para ordenamiento en la UI en *tiempo real*:

```javascript
// Ejemplo simplificado:
const calculatePower = (art) => {
    let power = 0;

    // Penalidad por edad
    const ageH = (Date.now() - new Date(art.date)) / (1000*3600);
    power -= ageH * 250;

    // Bonus por importance score
    power += (art.importanceScore || 1) * 500;

    // Destierro de soft-news
    if (title.includes('quini 6') || title.includes('horóscopo')) {
        power -= 200000;
    }

    return power;
};

// Ordenar por poder
news.sort((a, b) => calculatePower(b) - calculatePower(a));
```

**Nota:** Este algoritmo está en la UI (cliente), no en la BD.

## Votos y Comentarios: Dónde Aparecen

Aunque NO afectan el feed principal, los votos y comentarios aparecen en:

- **Dashboard**: "Top Voted" (ranking secundario)
- **Dashboard**: "Top Commented" (ranking secundario)
- **Barómetro Cívico**: Muestra el consensus de objetividad

## Tendencias Suspendidas

Las siguientes fuentes de datos están actualmente comentadas (desactivadas):

- Google Trends Argentina (línea 211-213)
- Reddit Trends (línea 329-369)

Pueden reactivarse en futuros releases.

## Cómo Testar el Algoritmo

### 1. Verificar Ordenamiento Básico

```sql
SELECT id, title, updatedAt, importanceScore, relevanceScore
FROM articles
ORDER BY updatedAt DESC
LIMIT 10;
```

Confirmar que es cronológico inverso (más nuevo primero).

### 2. Verificar Clustering

```javascript
// En backend/clustering.js
console.log('Clusters:', clusters); // Ver grouping por tema
```

### 3. Verificar que Votos NO Afectan

- Votar una noticia 100 veces
- Refrescar página
- Confirmar que su posición NO cambió

### 4. Verificar FASE 56 (Jerarquía)

- Crear artículos con portada de Clarín vs sin portada
- Confirmar que portada aparece arriba
- Confirmar que mayor cantidad de medios = más arriba

## Diferencias con Otras Plataformas

| Aspecto | Fuerte al Medio | Reddit | Twitter | Facebook |
|---------|-----------------|--------|---------|----------|
| Tipo | Estático | Dinámico | Dinámico | Dinámico |
| Votos Afectan | ❌ | ✅ Crítico | ✅ | ✅ |
| Recency | ✅ (c/2h) | ✅ Decay | ✅ | ✅ |
| Personalización | ❌ | ✅ | ✅ | ✅ |
| Fuente | Web scraping | Usuarios | Usuarios | Usuarios |

## FAQ Técnica

### ¿Cómo se genera el relevanceScore?

La IA (Gemini API, neutralizer.js) analiza:
- Ubiquidad en medios
- Presencia en tendencias de Google
- Impacto estructural (Economía/Política vs Chismes)

Asigna un score 1-100.

### ¿Puede un usuario cambiar el feed votando?

No. Los votos se guardan en `userVotesSum` pero no afectan `updatedAt`.

### ¿Por qué una noticia vieja aparece de repente arriba?

Su `updatedAt` se actualiza cuando es rescapeada. El feed es `ORDER BY updatedAt DESC`.

### ¿Qué es "FASE 56"?

Es la nomenclatura interna para la jerarquía de clusters en el backend.
