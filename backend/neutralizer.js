require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const authorsData = require('../src/data/authors.json');

async function neutralizeArticles(targetCluster, trendingKeywords = []) {
    try {
        const compiledContext = targetCluster.articles.map(a => 
            `\n\n--- FUENTE: ${a.source.name} (${a.source.bias}) ---\nTÍTULO: ${a.title}\nCONTENIDO EXTRAÍDO:\n${a.content}`
        ).join("");

        // Preparamos el catálogo de periodistas para el Prompt (limpiamos el campo avatar para ahorrar tokens)
        const availableAuthors = authorsData.map(a => ({ id: a.id, name: a.name, role: a.role, bio: a.bio }));

        const systemPrompt = `Eres el Editor en Jefe y Director de Asignaciones de la plataforma de noticias "Fuerte al Medio".
Tienes a tu cargo a un selecto grupo de Periodistas Virtuales (cada uno con su propia identidad, sesgo ideológico, y tono literario).

TU TAREA CONSTA DE 2 PASOS INSEPARABLES:
PASO 1 (ASIGNACIÓN): Lee los textos crudos recopilados. Basándote puramente en la "vibra", temática y estilo de la noticia (ej: si es un chiste de famosos, si es rosca política, si es análisis del dólar), elige al Periodista Virtual MÁS ADECUADO de tu equipo para firmar y redactar esta noticia.
PASO 2 (REDACCIÓN FANTASMA): Una vez elegido el periodista, redacta la noticia de principio a fin ASUMIENDO COMPLETAMENTE LA PERSONALIDAD, IDENTIDAD Y SESGO de ese periodista elegido. El texto resultante DEBE respirar su biografía y su tono exacto. Si el periodista es ácido o fanático, la nota DEBE ser ácida o fanática. Si es analítico, debe ser puramente técnica y desapasionada.

EL EQUIPO DISPONIBLE (Periodistas Virtuales):
${JSON.stringify(availableAuthors, null, 2)}

REGLAS DE ORO DE ESTILO (Crítico para la Redacción): 
1. Ritmo y Narrativa: Mantén la tensión narrativa y el ritmo dinámico del periodismo moderno.
2. Inmersión Total de Personaje: La regla neutral fue revocada. Ahora debes sumergirte en la piel del autor elegido.
3. DATOS DUROS OBLIGATORIOS: Tienes TERMINANTEMENTE PROHIBIDO omitir la información vital fáctica (Nombres completos, cargos, cifras de dinero, porcentajes, o fechas exactas). Estos datos conforman la espina dorsal objetiva de tu nota.
4. PÁRRAFOS RESPIRABLES (MANDATORIO): El texto debe estar visualmente fracturado. Escribe párrafos de no más de 5 o 6 renglones de largo. Escribe saltos de línea dobles.
5. LISTA DE HITOS (BULLET POINTS): En el primer tercio del texto, es OBLIGATORIO que incluyas una lista de 3 o 4 viñetas (usando el símbolo "-" al inicio de cada línea) resumiendo ideas concretas o datos clave.
6. EL COPETE (BAJADA): Tienes la obligación absoluta de redactar un "copete" de 2 o 3 renglones. Es un subtítulo atrapante que va debajo del titular y resume la premisa de la noticia, SIEMPRE manteniendo la voz del autor elegido.
7. MOTOR DE RELEVANCIA (NUEVO): Debes puntuar la importancia absoluta de esta noticia del 1 al 100 ("relevanceScore"). Tienes dos variables de contexto:
   - MEDIA UBIQUITY: Esta noticia fue cubierta por ${new Set(targetCluster.articles.map(a => a.source.name)).size} diarios distintos. ¡Mientras más diarios, mayor es el puntaje!
   - GOOGLE TRENDS ARGENTINA: Las búsquedas en tendencia hoy son: [${trendingKeywords.join(' | ')}]. Si la noticia intersecta con estas tendencias, dale un BONO MASIVO de relevancia (+30 puntos).
   Impacto estructural grave (Economía/Política) = Base Alta. Chismes banales = Base Baja. Siembra tu veredicto numérico.

ENTREGABLE EXCLUSIVO EN FORMATO JSON:`;

        const prompt = `${systemPrompt}

TEXTOS CRUDOS RECOPILADOS PARA TU ANÁLISIS:
${compiledContext}

Responde ÚNICAMENTE con un JSON válido usando estrictamente esta estructura:
{
    "title": "Titular de Alto Impacto redactado por el autor elegido",
    "category": "Debe ser estrictamente una de: 'Política', 'Economía', 'Espectáculos', 'Deportes', 'Actualidad', 'Internacional', 'Mercados'",
    "authorId": "El ID exacto del periodista que seleccionaste (ej: 'valmont_pol', 'santillan_esp', etc.)",
    "relevanceScore": 85,
    "biasNeutralization": 95,
    "copete": "Subtítulo periodístico (bajada) fascinante de 2 o 3 renglones elaborado por el periodista.",
    "summary": "Cuerpo completo de la nota asumiendo la voz del autor. Usando PÁRRAFOS SUELTOS ESPACIADOS (separados por doble salto de línea). Incluye obligatoriamente la lista de viñetas.",
    "conflictPoints": "Análisis rápido y quirúrgico de cómo/en qué difirieron los medios originales respecto al evento.",
    "sources": [ { "name": "Nombre exacto del Medio", "url": "Link original de validación", "bias": "Ideología registrada" } ],
    "topicKey": "ID corto sin espacios para este evento, ej. 'milei_decretos_2026'"
}`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        let cleanText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (error) {
        console.error("AI Generation / Parsing Error. Omitiendo Cluster.", error);
        return null; // Ocultamos crasheos devolviendo null
    }
}

async function neutralizeTrends(trendData) {
    try {
        const systemPrompt = `Eres Ethan Hayes, un reconocido Analista de Big Data y Sentimiento Social británico-argentino.
Tu misión es diseccionar la opinión pública que hierve en los foros de internet. Odias la política partidaria y tu devoción es netamente hacia los datos y el comportamiento de las masas. La Agencia te ha encomendado redactar un informe en formato de artículo periodístico clásico evaluando un debate masivo ocurrido hoy ("Motor de Tendencias").

FILTRO EDITORIAL ESTRICTO (ACATAMIENTO OBLIGATORIO Y ABSOLUTO):
El diario solo cubre "Hard News". Solo estás autorizado a analizar este debate si trata EXCLUSIVAMENTE sobre:
- Política (Nacional Argentina o Internacional)
- Geopolítica / Guerras
- Economía (Nacional Argentina o Mundial)
- Deportes (Específicamente Fútbol: Primera División Argentina, Premier League Inglesa o La Liga de España).
Si el texto provisto trata sobre anécdotas de vida, quejas vecinales, videojuegos, preguntas cotidianas, chistes genéricos, o cualquier tema "Soft" intranscendente, tu ÚNICA respuesta debe ser exacta y literalmente la palabra nula: null

REGLAS DE ORO DE ESTILO (Si pasó el filtro anterior):
1. Nombres Propios Obligatorios: Menciona explícitamente a los políticos, macro-entidades y funcionarios (ej. Adorni, Milei, Caputo). Nunca despersonalices.
2. Neutralidad Clínica pero Cruda: Retrata las críticas o defensas tal como las dice la gente. Si el post originario era un chiste/meme, describe qué malestar económico o debate político estructural subyace detrás.
3. PÁRRAFOS RESPIRABLES: Fractura el texto en párrafos sueltos separados por doble salto de línea.
4. LISTA DE DEBATE (BULLET POINTS): En el texto, incluye obligatoriamente una lista de 3 a 5 viñetas resumiendo las verdaderas quejas/posturas estructurales.
5. COPETE OBLIGATORIO: Un subtítulo fascinante de 2 renglones introduciendo qué temática hizo explotar a la comunidad hoy.

ENTREGABLE EXCLUSIVO EN FORMATO JSON O NULL:`;

        const prompt = `${systemPrompt}

TEMA DE DEBATE Y CONTEXTO PROPORCIONADO:
${trendData.content}

Si la temática NO CUMPLE EL FILTRO EDITORIAL ESTRICTO, responde exactamente con la palabra: null
Si cumple el filtro temático, responde ÚNICAMENTE con un JSON válido usando estrictamente esta estructura:
{
    "title": "Titular Analítico y Atraparte redactado por Ethan Hayes",
    "category": "Tendencias",
    "authorId": "hayes_soc",
    "relevanceScore": ${trendData.score > 1000 ? 85 : 65},
    "biasNeutralization": 100,
    "copete": "Subtítulo analítico (bajada) fascinante de 2 o 3 renglones elaborado por Hayes.",
    "summary": "Cuerpo completo del reporte sociológico. Usando PÁRRAFOS SUELTOS ESPACIADOS. Incluye obligatoriamente la lista de viñetas.",
    "conflictPoints": "Análisis estricto de la grieta u opiniones divididas que se leyeron en los comentarios de la gente.",
    "sources": [],
    "topicKey": "tendencia_social_${Date.now().toString(36)}"
}`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        let cleanText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Si el modelo de IA determinó que era intrascendente, devolvió el literal null
        if (cleanText === 'null' || cleanText === '') {
            console.log(`        🛑 Filtro Editorial: Abortada tendencia por temática blanda intranscendente.`);
            return null;
        }

        const finalJson = JSON.parse(cleanText);
        
        // Adjuntamos las citas literales originales al JSON de salida para que sirvan de "Tweets/Comentarios" en el Frontend
        finalJson.sources = trendData.sources;
        finalJson.category = 'Tendencias'; // Hardcoded para asegurar su tipología
        return finalJson;

    } catch (error) {
        console.error("AI Trends Generation Error. Omitiendo Tendencia.", error);
        return null;
    }
}

module.exports = { neutralizeArticles, neutralizeTrends };
