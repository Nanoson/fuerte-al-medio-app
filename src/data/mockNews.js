export const mockNews = [
  {
    id: 1,
    title: "El Banco Central reduce la tasa de interés de referencia al 50%",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop",
    category: "Economía y Negocios",
    biasNeutralization: 88,
    date: "14 Mayo 2026",
    summary: "El Directorio del BCRA dispuso una nueva baja en la tasa de política monetaria. La medida busca incentivar el crédito privado y acompañar la desaceleración inflacionaria reportada por el INDEC.",
    conflictPoints: "Mientras algunos portales destacan que la baja licúa los ahorros en pesos de los pequeños ahorristas desincentivando los plazos fijos, otros medios enfocan la noticia como un logro hacia la normalización macroeconómica y el fin de los pasivos remunerados.",
    sources: [
      { name: "Bloomberg Línea", url: "#", bias: "Mercados" },
      { name: "La Nación", url: "#", bias: "Conservador" },
      { name: "Página/12", url: "#", bias: "Progresista" }
    ],
    related: [
      { title: "El dólar reacciona ante la bajada de tasas del central", id: 101 },
      { title: "Plazos fijos: Cuánto rendirán a partir de hoy", id: 102 }
    ]
  },
  {
    id: 2,
    title: "Debate en el Congreso por la nueva ley de reforma laboral",
    image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800&auto=format&fit=crop",
    category: "Política",
    biasNeutralization: 75,
    date: "13 Mayo 2026",
    summary: "Se debate en comisiones el nuevo proyecto de reforma laboral. El oficialismo consiguió el quórum necesario para avanzar con el dictamen de mayoría, estableciendo cambios en los periodos de prueba y multas indemnizatorias.",
    conflictPoints: "Los artículos difieren drásticamente en su interpretación. Un sector de la prensa lo cataloga como una modernización necesaria para generar empleo formal, mientras que el otro sector enfatiza la precarización y pérdida de derechos adquiridos por los trabajadores.",
    sources: [
      { name: "Infobae", url: "#", bias: "Centro" },
      { name: "Clarín", url: "#", bias: "Centro-Derecha" },
      { name: "C5N", url: "#", bias: "Centro-Izquierda" }
    ],
    related: [
      { title: "Los puntos clave del dictamen que debate la cámara baja", id: 201 }
    ]
  },
  {
    id: 3,
    title: "Boca y River empataron sin goles en el Superclásico",
    image: "https://images.unsplash.com/photo-1518605368461-1e12fc224aa5?q=80&w=800&auto=format&fit=crop",
    category: "Deportes",
    biasNeutralization: 95,
    date: "12 Mayo 2026",
    summary: "El partido finalizó 0 a 0 en el Monumental. Hubo pocas llegadas claras a los arcos, destacándose las actuaciones de los arqueros y el orden táctico de ambas defensas.",
    conflictPoints: "Hubo una ligera divergencia en el análisis del desempeño arbitral respecto a una supuesta falta en el área en el segundo tiempo, pero en general la coincidencia fue que el partido careció de profundidad ofensiva.",
    sources: [
      { name: "Olé", url: "#", bias: "Deportivo" },
      { name: "TyC Sports", url: "#", bias: "Deportivo" }
    ],
    related: []
  }
];
