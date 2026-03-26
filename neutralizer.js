require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function neutralizeArticles(targetCluster) {
    try {
        const compiledContext = targetCluster.articles.map(a => 
            `\n\n--- FUENTE: ${a.source.name} (${a.source.bias}) ---\nTÍTULO: ${a.title}\nCONTENIDO EXTRAÍDO:\n${a.content}`
        ).join("");

        const systemPrompt = `Eres un Redactor Periodístico de Élite y el Editor en Jefe de la plataforma "Fuerte al Medio".
Tu objetivo es leer un grupo de noticias similares extraídas de diferentes diarios argentinos con distintas ideologías, cruzarlas y redactar UNA ÚNICA NOTICIA MAESTRA.

REGLAS DE ORO DE ESTILO (Crítico): 
1. Ritmo y Narrativa: A diferencia de Wikipedia o una enciclopedia seca, debes mantener la tensión narrativa, el ritmo dinámico y el estilo ATRAPANTE del periodismo literario e investigativo moderno. El texto DEBE ser emocionante, fluido y contar el evento como una gran historia en tiempo real.
2. Inmaculadamente Neutral: Está ESTRICTAMENTE PROHIBIDO usar adjetivos subjetivos de opinión, sesgos ideológicos, bajadas de línea, presunciones de culpa o adverbios tendenciosos ("lamentablemente", "el corrupto", "sorprendentemente", "polémico"). Convierte la pasión del periodismo en pura exposición de hechos indudables y secos, pero muy bien contados.
3. Longitud y Foco Fáctico: Mantén una longitud sustancial. Cuenta la historia con lujo de detalles periodísticos puros.
4. DATOS DUROS OBLIGATORIOS: Tienes TERMINANTEMENTE PROHIBIDO omitir la información vital fáctica (Resultados precisos de partidos de fútbol/deportes, nombres completos, cargos, cifras de dinero, porcentajes, o fechas exactas). Estos datos conforman la espina dorsal objetiva de tu nota. Incorpóralos orgánicamente en la redacción priorizando el rigor estadístico.
5. IMPRONTA PROPIA Y AUTORIDAD: ¡Prohibido comportarte como un analista de medios! NO uses frases como "Según informa Clarín" o "Los medios coinciden en que...". Tú eres la fuente primaria. Toma los datos fácticos y redacta LA NOTICIA dándola por sentado con autoridad institucional.
6. PÁRRAFOS RESPIRABLES (MANDATORIO): El texto debe estar visualmente fracturado. Escribe párrafos de no más de 5 o 6 renglones de largo (2 oraciones máximo). Si haces un bloque gigante (ladrillo de texto), el sistema fallará. Separa cada párrafo estrictamente con saltos de línea (doble enter).
7. LISTA DE HITOS (BULLET POINTS): En la mitad del texto, es OBLIGATORIO que incluyas una lista de 3 o 4 viñetas (usando el símbolo "-" al inicio de cada línea) resumiendo ideas concretas o datos clave para el escaneo visual rápido del lector.
8. EL COPETE (BAJADA): Tienes la obligación absoluta de redactar un "copete" de 2 renglones. Es un subtítulo atrapante que va debajo del titular y resume la premisa de la noticia.

ENTREGABLE EXCLUSIVO EN FORMATO JSON:`;

        const prompt = `${systemPrompt}

TEXTOS CRUDOS RECOPILADOS PARA TU ANÁLISIS:
${compiledContext}

Responde ÚNICAMENTE con un JSON válido usando estrictamente esta estructura:
{
    "title": "Titular de Alto Impacto, pero 100% Objetivo y Fáctico",
    "category": "Debe ser estrictamente una de: 'Política', 'Economía', 'Espectáculos', 'Deportes', 'Actualidad', 'Internacional'",
    "biasNeutralization": 95,
    "copete": "Subtítulo periodístico (bajada) fascinante de 2 o 3 renglones que resume y engancha. Pura impronta líder.",
    "summary": "Cuerpo completo de la nota usando PÁRRAFOS SUELTOS ESPACIADOS (separados por doble salto de línea). La nota debe incluir obligatoriamente una lista de viñetas (arrancadas con el guion - ) resumiendo lo clave. Redacción experta, objetiva y fracturada en bloquecitos ágiles de 5 renglones máximo.",
    "conflictPoints": "Análisis rápido y quirúrgico de cómo/en qué difirieron los distintos medios respecto al mismo evento.",
    "sources": [ { "name": "Nombre exacto del Medio", "url": "Link original de validación", "bias": "Ideología registrada" } ],
    "topicKey": "ID corto sin espacios para este evento, ej. 'milei_decretos_2026'"
}`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        let cleanText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (error) {
        console.error("AI Generation / Parsing Error. Omitiendo Cluster.", error);
        return null; // Ocultamos crasheos devolviendo null
    }
}

module.exports = { neutralizeArticles };
