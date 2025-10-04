// ======================
// PATRONES DE TENDENCIA MEJORADOS - Archivo independiente
// ======================
const trendPatterns = {
    // PATRONES DE CONTINUACIÓN ALCISTA
    bull_flag: {
        name: "Bandera Alcista",
        category: [ "bullish_continuation" ],
        reliability: 85,
        timeframe: "1H+",
        strength: "high",
        description: "Patrón de continuación que aparece tras un fuerte movimiento alcista, seguido de una consolidación en forma de canal descendente. Indica pausa temporal antes de continuar al alza.",
        context: "Aparece tras impulso alcista fuerte (asta de la bandera) durante tendencia alcista establecida. La consolidación muestra toma de ganancias temporal.",
        confirmation: "Ruptura al alza del canal descendente con volumen alto. El precio debe superar la resistencia superior del canal.",
        entry: "Ruptura confirmada de la resistencia superior del canal de consolidación",
        stopLoss: "Por debajo del soporte del canal (-2% desde entrada)",
        target: "Proyección igual al asta de la bandera (altura del impulso inicial)",
        tips: [
            "El volumen debe decrecer durante la consolidación",
            "La ruptura debe tener volumen significativamente alto",
            "El patrón no debe durar más de 3 semanas",
            "La consolidación debe retroceder máximo 38% del impulso"
        ]
    },

    bull_pennant: {
        name: "Banderín Alcista",
        category: [ "bullish_continuation" ],
        reliability: 82,
        timeframe: "30m+",
        strength: "high",
        description: "Patrón de continuación alcista con consolidación triangular tras impulso fuerte. Más compacto que la bandera, indica continuación inmediata.",
        context: "Aparece tras movimiento alcista explosivo. La consolidación forma triángulo simétrico pequeño con volumen decreciente.",
        confirmation: "Ruptura al alza del triángulo con volumen creciente y momentum renovado",
        entry: "Ruptura confirmada del vértice superior del banderín",
        stopLoss: "Por debajo del punto más bajo del banderín (-1.5% desde entrada)",
        target: "Altura del asta proyectada desde la ruptura del banderín",
        tips: [
            "Duración típica: 1-3 semanas máximo",
            "El volumen debe colapsar durante la formación",
            "Patrón muy confiable en tendencias fuertes",
            "La ruptura suele ser explosiva y rápida"
        ]
    },

    ascending_triangle: {
        name: "Triángulo Ascendente",
        category: [ "bullish_continuation" ],
        reliability: 78,
        timeframe: "4H+",
        strength: "high",
        description: "Patrón de continuación con resistencia horizontal y soporte ascendente. La presión compradora creciente eventualmente rompe la resistencia.",
        context: "Durante tendencia alcista establecida. Múltiples toques en nivel de resistencia con mínimos cada vez más altos.",
        confirmation: "Ruptura de la resistencia horizontal con volumen alto. Cierre por encima de la resistencia.",
        entry: "Cierre confirmado por encima de la resistencia horizontal",
        stopLoss: "Por debajo de la línea de soporte ascendente (-3% desde entrada)",
        target: "Altura del triángulo proyectada desde el punto de ruptura",
        tips: [
            "Requiere mínimo 2 máximos en la resistencia horizontal",
            "Necesita mínimo 2 mínimos ascendentes claramente definidos",
            "El volumen debe decrecer durante la formación",
            "Mayor efectividad en timeframes de 4H o superiores"
        ]
    },

    symmetrical_triangle_bull: {
        name: "Triángulo Simétrico Alcista",
        category: [ "bullish_continuation" ],
        reliability: 73,
        timeframe: "4H+",
        strength: "medium",
        description: "Patrón de consolidación con líneas convergentes simétricas durante tendencia alcista. Indica pausa antes de continuar al alza.",
        context: "En tendencia alcista establecida. Máximos descendentes y mínimos ascendentes convergen formando triángulo equilibrado.",
        confirmation: "Ruptura al alza con volumen significativo, preferiblemente en el tercio final del triángulo",
        entry: "Ruptura confirmada de la línea de resistencia descendente",
        stopLoss: "Por debajo de la línea de soporte ascendente (-2.5% desde entrada)",
        target: "Altura máxima del triángulo proyectada desde el punto de ruptura",
        tips: [
            "La ruptura en el último tercio es más confiable",
            "Volumen debe decrecer hacia el vértice",
            "En tendencia alcista, sesgo hacia ruptura al alza",
            "Confirmar con indicadores de momentum"
        ]
    },

    falling_wedge: {
        name: "Cuña Descendente",
        category: [ "bullish_continuation" ],
        reliability: 82,
        timeframe: "4H+",
        strength: "high",
        description: "Patrón de continuación alcista con líneas de tendencia convergentes descendentes. Indica agotamiento de la presión vendedora.",
        context: "Durante tendencia alcista como corrección temporal bajista. Las líneas convergen mostrando menor volatilidad.",
        confirmation: "Ruptura al alza de la línea de tendencia superior con volumen creciente",
        entry: "Cierre confirmado por encima de la resistencia de la cuña",
        stopLoss: "Por debajo del último mínimo de la cuña (-2% desde entrada)",
        target: "Retorno al punto de inicio de la cuña o proyección igual a la altura máxima",
        tips: [
            "Ambas líneas de tendencia deben converger claramente",
            "El volumen típicamente decrece durante la formación",
            "Es un patrón común de corrección en tendencias alcistas fuertes",
            "La ruptura suele ser explosiva con volumen alto"
        ]
    },

    bull_range: {
        name: "Rango Alcista",
        category: [ "bullish_continuation" ],
        reliability: 68,
        timeframe: "4H+",
        strength: "medium",
        description: "Consolidación horizontal entre soporte y resistencia definidos durante tendencia alcista. Acumulación antes de continuar al alza.",
        context: "Pausa en tendencia alcista con trading lateral. Indica equilibrio temporal entre oferta y demanda.",
        confirmation: "Ruptura del nivel de resistencia superior con volumen alto y momentum positivo",
        entry: "Cierre por encima de la resistencia del rango con confirmación",
        stopLoss: "Por debajo del soporte del rango (-2% desde entrada)",
        target: "Altura del rango proyectada desde la ruptura alcista",
        tips: [
            "Requiere múltiples toques en soporte y resistencia",
            "Volumen debe aumentar en la ruptura",
            "Duración típica: 2-8 semanas",
            "Confirmar con breakout de momentum"
        ]
    },

    // PATRONES DE CONTINUACIÓN BAJISTA
    bear_flag: {
        name: "Bandera Bajista",
        category: [ "bearish_continuation" ],
        reliability: 83,
        timeframe: "1H+",
        strength: "high",
        description: "Patrón de continuación bajista que aparece tras caída fuerte, seguido de consolidación en canal ascendente. Indica pausa antes de continuar la caída.",
        context: "Tras impulso bajista fuerte durante tendencia bajista establecida. La consolidación al alza es corrección temporal.",
        confirmation: "Ruptura a la baja del soporte del canal ascendente con volumen",
        entry: "Ruptura confirmada del soporte inferior del canal",
        stopLoss: "Por encima de la resistencia del canal (+2% desde entrada)",
        target: "Proyección igual al asta de la bandera (caída inicial)",
        tips: [
            "El volumen debe ser bajo durante la consolidación alcista",
            "La ruptura bajista debe tener volumen significativo",
            "Duración máxima recomendada de 3 semanas",
            "La corrección no debe superar 50% de la caída inicial"
        ]
    },

    bear_pennant: {
        name: "Banderín Bajista",
        category: [ "bearish_continuation" ],
        reliability: 80,
        timeframe: "30m+",
        strength: "high",
        description: "Consolidación triangular pequeña tras caída fuerte. Indica pausa breve antes de continuar la tendencia bajista.",
        context: "Aparece tras impulso bajista explosivo. La consolidación es muy compacta y de corta duración.",
        confirmation: "Ruptura a la baja con volumen y aceleración del movimiento bajista",
        entry: "Ruptura confirmada por debajo del soporte del banderín",
        stopLoss: "Por encima del punto más alto del banderín (+1.5% desde entrada)",
        target: "Altura del asta bajista proyectada desde la ruptura",
        tips: [
            "Muy similar a bandera pero más compacto",
            "Duración máxima: 1-3 semanas",
            "Alto volumen en la ruptura confirma continuación",
            "Patrón muy confiable en bear markets"
        ]
    },

    descending_triangle: {
        name: "Triángulo Descendente",
        category: [ "bearish_continuation" ],
        reliability: 76,
        timeframe: "4H+",
        strength: "high",
        description: "Patrón bajista con soporte horizontal y resistencia descendente. Muestra presión vendedora creciente que romperá el soporte.",
        context: "Durante tendencia bajista. Múltiples toques en nivel de soporte con máximos cada vez más bajos.",
        confirmation: "Ruptura del soporte horizontal con volumen alto",
        entry: "Cierre confirmado por debajo del soporte horizontal",
        stopLoss: "Por encima de la línea de resistencia descendente (+3% desde entrada)",
        target: "Altura del triángulo proyectada desde la ruptura",
        tips: [
            "Requiere mínimo 2 mínimos en el soporte horizontal",
            "Necesita mínimo 2 máximos descendentes",
            "La presión vendedora debe ser constante",
            "Volumen creciente hacia la ruptura fortalece la señal"
        ]
    },

    symmetrical_triangle_bear: {
        name: "Triángulo Simétrico Bajista",
        category: [ "bearish_continuation" ],
        reliability: 71,
        timeframe: "4H+",
        strength: "medium",
        description: "Consolidación triangular en tendencia bajista. Las líneas convergentes indican pausa antes de continuar la caída.",
        context: "Durante tendencia bajista establecida. Presión equilibrada temporalmente con sesgo hacia continuación bajista.",
        confirmation: "Ruptura a la baja del soporte con volumen creciente en último tercio del triángulo",
        entry: "Ruptura confirmada por debajo de la línea de soporte ascendente",
        stopLoss: "Por encima de la línea de resistencia descendente (+2.5% desde entrada)",
        target: "Altura del triángulo proyectada desde la ruptura bajista",
        tips: [
            "En tendencia bajista, probabilidad de ruptura bajista del 65%",
            "Ruptura hacia el vértice es menos confiable",
            "Confirmar con indicadores de volumen y momentum",
            "El contexto de tendencia es crucial"
        ]
    },

    rising_wedge: {
        name: "Cuña Ascendente",
        category: [ "bearish_continuation" ],
        reliability: 79,
        timeframe: "4H+",
        strength: "high",
        description: "Patrón bajista con líneas convergentes ascendentes. Indica agotamiento de compradores y próxima continuación bajista.",
        context: "Durante tendencia bajista como corrección temporal alcista. Menor fuerza compradora en cada impulso al alza.",
        confirmation: "Ruptura a la baja del soporte de la cuña con volumen",
        entry: "Cierre confirmado por debajo del soporte de la cuña",
        stopLoss: "Por encima del último máximo de la cuña (+2% desde entrada)",
        target: "Punto de inicio de la cuña o proyección igual a la altura",
        tips: [
            "Las líneas deben converger mostrando agotamiento",
            "Volumen típicamente decreciente durante la formación",
            "Representa falsa fuerza alcista en tendencia bajista",
            "La ruptura suele ser rápida y decisiva"
        ]
    },

    bear_range: {
        name: "Rango Bajista",
        category: [ "bearish_continuation" ],
        reliability: 66,
        timeframe: "4H+",
        strength: "medium",
        description: "Consolidación horizontal durante tendencia bajista. Distribución en rango antes de continuar la caída.",
        context: "Pausa en tendencia bajista con trading lateral. Equilibrio temporal con sesgo bajista.",
        confirmation: "Ruptura del soporte inferior con volumen alto y momentum negativo",
        entry: "Cierre por debajo del soporte del rango con confirmación",
        stopLoss: "Por encima de la resistencia del rango (+2% desde entrada)",
        target: "Altura del rango proyectada desde la ruptura bajista",
        tips: [
            "Múltiples rechazos en resistencia y soporte",
            "En bear market, sesgo hacia ruptura bajista",
            "Volumen clave en la ruptura",
            "Duración típica: 2-6 semanas"
        ]
    },

    // PATRONES DE REVERSIÓN
    cup_handle: {
        name: "Taza y Asa",
        category: [ "reversal" ],
        reliability: 84,
        timeframe: "1D+",
        strength: "very_high",
        description: "Patrón de reversión alcista con forma de taza seguida de pequeña consolidación (asa). Indica acumulación institucional y cambio de tendencia.",
        context: "Final de tendencia bajista o en bases de mercado. La 'taza' muestra distribución seguida de acumulación gradual.",
        confirmation: "Ruptura alcista del asa con volumen alto y nuevo máximo relativo",
        entry: "Ruptura confirmada por encima de la resistencia del asa",
        stopLoss: "Por debajo del punto más bajo del asa (-3% desde entrada)",
        target: "Profundidad de la taza proyectada desde el punto de ruptura",
        tips: [
            "La taza debe tener forma redondeada, no en V",
            "Duración ideal: 7 semanas a 65 semanas",
            "El asa debe retroceder 1/3 del avance de la taza",
            "Volumen bajo en el asa, alto en la ruptura",
            "Patrón favorito de William O'Neil"
        ]
    },

    head_shoulders: {
        name: "Hombro-Cabeza-Hombro",
        category: [ "reversal" ],
        reliability: 89,
        timeframe: "1D+",
        strength: "very_high",
        description: "Patrón de reversión bajista con tres picos: hombro izquierdo, cabeza (más alto), y hombro derecho. Indica agotamiento de compradores.",
        context: "Final de tendencia alcista prolongada. Muestra distribución institucional y agotamiento comprador en máximos históricos.",
        confirmation: "Ruptura de la línea de cuello con volumen alto. El precio debe cerrar por debajo de la línea de cuello.",
        entry: "Ruptura confirmada de la línea de cuello hacia abajo",
        stopLoss: "Por encima del hombro derecho (+3% desde entrada)",
        target: "Distancia desde la cabeza hasta la línea de cuello, proyectada desde la ruptura",
        tips: [
            "Los hombros deben tener altura similar (±5%)",
            "Volumen alto en cabeza, decreciente en hombro derecho",
            "La línea de cuello debe ser claramente definida",
            "Uno de los patrones de reversión más confiables"
        ]
    },

    inverse_head_shoulders: {
        name: "Hombro-Cabeza-Hombro Invertido",
        category: [ "reversal" ],
        reliability: 87,
        timeframe: "1D+",
        strength: "very_high",
        description: "Patrón de reversión alcista con tres valles. Señala agotamiento vendedor y cambio alcista tras tendencia bajista prolongada.",
        context: "Final de tendencia bajista prolongada. Indica acumulación institucional y agotamiento vendedor en mínimos importantes.",
        confirmation: "Ruptura alcista de la línea de cuello con volumen creciente",
        entry: "Ruptura confirmada al alza de la línea de cuello",
        stopLoss: "Por debajo del hombro derecho (-3% desde entrada)",
        target: "Distancia desde la cabeza hasta la línea de cuello, proyectada al alza",
        tips: [
            "El valle central (cabeza) debe ser más profundo",
            "Volumen creciente hacia la ruptura es crucial",
            "Los hombros deben estar a nivel similar",
            "Muy confiable para reversiones mayores"
        ]
    },

    // PATRONES M, W y V - VARIANTES TÉCNICAS
    m_pattern_1st_variant: {
        name: "Patrón M - 1ª Variante",
        category: [ "reversal" ],
        reliability: 88,
        timeframe: "1D+",
        strength: "very_high",
        description: "Doble techo clásico con ruptura directa del soporte. La variante más común y confiable del patrón M de reversión bajista.",
        context: "Final de tendencia alcista con doble rechazo en resistencia clave. Ruptura directa sin formaciones adicionales.",
        confirmation: "Ruptura del valle intermedio con volumen alto y continuación bajista inmediata",
        entry: "Ruptura confirmada del soporte con volumen superior al promedio",
        stopLoss: "Por encima del segundo pico (+2% desde entrada)",
        target: "100% de la altura del patrón proyectada desde la ruptura",
        tips: [
            "Patrón más directo y agresivo",
            "Ruptura limpia sin retrocesos",
            "Alto volumen en la ruptura es crucial",
            "Primera variante: máxima simplicidad técnica"
        ]
    },

    m_pattern_2nd_variant: {
        name: "Patrón M - 2ª Variante",
        category: [ "reversal" ],
        reliability: 82,
        timeframe: "1D+",
        strength: "very_high",
        description: "Doble techo con formación de triángulo descendente tras el segundo pico. Combina dos patrones bajistas para mayor confirmación.",
        context: "Tras segundo pico, el precio forma triángulo descendente antes de ruptura final. Doble confirmación bajista.",
        confirmation: "Ruptura del triángulo descendente seguida de ruptura del soporte principal del patrón M",
        entry: "Ruptura del triángulo o del soporte principal, el que ocurra primero",
        stopLoss: "Por encima del punto más alto del triángulo (+2.5% desde entrada)",
        target: "Combinado: altura del M + altura del triángulo",
        tips: [
            "Doble confirmación bajista muy confiable",
            "El triángulo actúa como patrón de continuación",
            "Mayor tiempo de desarrollo pero más seguro",
            "Segunda variante: confirmación adicional"
        ]
    },

    m_pattern_3rd_variant: {
        name: "Patrón M - 3ª Variante",
        category: [ "reversal" ],
        reliability: 79,
        timeframe: "4H+",
        strength: "high",
        description: "Doble techo con pullback al soporte roto antes de continuación bajista. Incluye retroceso de confirmación.",
        context: "Tras ruptura inicial, el precio retrocede para testear el soporte roto como nueva resistencia antes de continuar.",
        confirmation: "Pullback fallido al soporte roto seguido de nueva caída con momentum bajista",
        entry: "En el rechazo del pullback o en nueva ruptura a la baja",
        stopLoss: "Por encima del nivel del pullback (+2% desde entrada)",
        target: "Altura del M proyectada desde el segundo punto de ruptura",
        tips: [
            "El pullback ofrece mejor punto de entrada",
            "Confirma la fortaleza del patrón",
            "Más tiempo pero mayor precisión",
            "Tercera variante: incluye retroceso de confirmación"
        ]
    },

    w_pattern_1st_variant: {
        name: "Patrón W - 1ª Variante",
        category: [ "reversal" ],
        reliability: 85,
        timeframe: "1D+",
        strength: "very_high",
        description: "Doble suelo clásico con ruptura directa de la resistencia. La variante más agresiva y directa del patrón W alcista.",
        context: "Final de tendencia bajista con doble soporte exitoso. Ruptura directa sin consolidaciones adicionales.",
        confirmation: "Ruptura del pico intermedio con volumen alto y momentum alcista sostenido",
        entry: "Ruptura confirmada de la resistencia con volumen creciente",
        stopLoss: "Por debajo del segundo valle (-2% desde entrada)",
        target: "100% de la altura del patrón proyectada al alza",
        tips: [
            "Ruptura más directa y explosiva",
            "Menor tiempo de desarrollo",
            "Requiere volumen confirmatorio alto",
            "Primera variante: máxima agresividad alcista"
        ]
    },

    w_pattern_2nd_variant: {
        name: "Patrón W - 2ª Variante",
        category: [ "reversal" ],
        reliability: 80,
        timeframe: "1D+",
        strength: "very_high",
        description: "Doble suelo con formación de triángulo ascendente tras el segundo valle. Doble confirmación alcista para mayor seguridad.",
        context: "Después del segundo valle, se forma triángulo ascendente que actúa como patrón de continuación alcista.",
        confirmation: "Ruptura del triángulo ascendente seguida de ruptura de la resistencia principal",
        entry: "Ruptura del triángulo o de la resistencia principal",
        stopLoss: "Por debajo del punto más bajo del triángulo (-2.5% desde entrada)",
        target: "Combinado: altura del W + altura del triángulo",
        tips: [
            "Mayor tiempo de formación pero más confiable",
            "El triángulo añade confirmación alcista",
            "Dos niveles de confirmación técnica",
            "Segunda variante: seguridad adicional"
        ]
    },

    w_pattern_3rd_variant: {
        name: "Patrón W - 3ª Variante",
        category: [ "reversal" ],
        reliability: 76,
        timeframe: "4H+",
        strength: "high",
        description: "Doble suelo con pullback a la resistencia rota antes de continuar al alza. Incluye retroceso de confirmación.",
        context: "Tras ruptura inicial, retroceso para testear la resistencia rota como nuevo soporte antes de continuar al alza.",
        confirmation: "Pullback exitoso al soporte seguido de nueva ruptura alcista con momentum renovado",
        entry: "En el rebote del pullback o en confirmación de nuevo máximo",
        stopLoss: "Por debajo del nivel del pullback (-2% desde entrada)",
        target: "Altura del W proyectada desde el segundo punto de ruptura",
        tips: [
            "El pullback ofrece entrada más precisa",
            "Testeo del soporte confirma fortaleza",
            "Patrón más conservador y seguro",
            "Tercera variante: incluye confirmación por retroceso"
        ]
    },

    v_bottom: {
        name: "Suelo en V",
        category: [ "reversal" ],
        reliability: 71,
        timeframe: "1H+",
        strength: "high",
        description: "Reversión alcista súbita con forma de V. Cambio dramático de tendencia sin consolidación previa.",
        context: "Final abrupto de tendencia bajista por eventos fundamentales o agotamiento extremo de vendedores.",
        confirmation: "Reversión inmediata con volumen explosivo y momentum alcista sostenido",
        entry: "Ruptura de resistencia previa con confirmación de volumen",
        stopLoss: "Cerca del punto más bajo de la V (-4% desde entrada)",
        target: "Retorno a niveles previos al declive o resistencias técnicas",
        tips: [
            "Patrón poco común pero poderoso",
            "Requiere catalizador fundamental",
            "Volumen extremadamente alto es crucial",
            "Difícil de anticipar, más fácil de confirmar"
        ]
    },

    v_top: {
        name: "Techo en V",
        category: [ "reversal" ],
        reliability: 68,
        timeframe: "1H+",
        strength: "high",
        description: "Reversión bajista súbita con forma de V invertida. Cambio dramático desde máximos sin señales previas.",
        context: "Pico de mercado seguido de colapso inmediato. Euforia seguida de pánico vendedor.",
        confirmation: "Caída inmediata con volumen alto y momentum bajista acelerado",
        entry: "Ruptura de soporte previo con confirmación bajista",
        stopLoss: "Cerca del punto más alto de la V (+4% desde entrada)",
        target: "Retorno a soportes técnicos o niveles previos",
        tips: [
            "Más común en mercados especulativos",
            "Volumen de pánico confirma el patrón",
            "Reversión muy rápida y violenta",
            "Difícil de predecir, actuar rápido en confirmación"
        ]
    },

    // PATRONES TRIPLES
    triple_top: {
        name: "Triple Techo",
        category: [ "reversal" ],
        reliability: 83,
        timeframe: "1D+",
        strength: "very_high",
        description: "Tres picos consecutivos al mismo nivel seguidos de ruptura bajista. Patrón de reversión muy confiable tras tendencia alcista.",
        context: "Final de tendencia alcista prolongada. Triple rechazo institucional en nivel de resistencia crítico.",
        confirmation: "Ruptura del soporte de los valles con volumen alto y momentum bajista",
        entry: "Ruptura confirmada por debajo del soporte de los valles intermedios",
        stopLoss: "Por encima del tercer pico (+3% desde entrada)",
        target: "Altura desde los picos hasta el soporte, proyectada a la baja",
        tips: [
            "Los tres picos deben estar al mismo nivel (±2%)",
            "Volumen debe decrecer en cada pico sucesivo",
            "Formación requiere varios meses típicamente",
            "Uno de los patrones más confiables",
            "La ruptura suele generar movimientos significativos"
        ]
    },

    triple_bottom: {
        name: "Triple Suelo",
        category: [ "reversal" ],
        reliability: 81,
        timeframe: "1D+",
        strength: "very_high",
        description: "Tres valles consecutivos al mismo nivel seguidos de ruptura alcista. Reversión alcista muy confiable tras tendencia bajista.",
        context: "Final de tendencia bajista prolongada. Triple soporte con agotamiento progresivo de vendedores.",
        confirmation: "Ruptura alcista de la resistencia de los picos con volumen creciente",
        entry: "Ruptura confirmada por encima de la resistencia de los picos intermedios",
        stopLoss: "Por debajo del tercer valle (-3% desde entrada)",
        target: "Altura desde los valles hasta la resistencia, proyectada al alza",
        tips: [
            "Los tres valles deben estar al mismo nivel (±2%)",
            "Volumen creciente en cada valle es positivo",
            "Patrón de acumulación institucional",
            "Formación de varios meses de duración",
            "Alta confiabilidad para reversiones mayores"
        ]
    }
};

// Función completa mejorada para crear SVG de patrones
function createTrendPatternSVG( patternId, width = 320, height = 180 ) {
    const patterns = {
        // BANDERAS Y BANDERINES OPTIMIZADOS
        bull_flag: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Impulso inicial (asta) -->
    <path d="M20 110 L80 30" class="price-action" stroke="#10b981" stroke-width="4" fill="none"/>
    <!-- Línea superior del canal (resistencia) - más horizontal -->
    <line x1="80" y1="30" x2="188" y2="32" stroke="#ef4444" stroke-width="2" fill="none"/>
    <!-- Línea inferior del canal (soporte) - más horizontal -->
    <line x1="80" y1="48" x2="188" y2="56" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Precio moviéndose DENTRO del canal con líneas -->
    <path d="M80 35 L95 45 L110 32 L125 48 L140 35 L155 45 L170 38 L185 50 L190 45" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura -->
    <path d="M190 45 L220 20" class="price-action" stroke="#10b981" stroke-width="4" fill="none"/>
    <!-- Labels -->
    <text x="40" y="130" fill="#10b981" font-size="11">Impulso</text>
    <text x="120" y="130" fill="#fbbf24" font-size="11">Canal</text>
    <text x="200" y="130" fill="#10b981" font-size="11">Ruptura</text>
    <text x="90" y="25" fill="#ef4444" font-size="9">Resistencia</text>
    <text x="90" y="70" fill="#3b82f6" font-size="9">Soporte</text>
</svg>`,

        bull_pennant: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Impulso inicial -->
    <path d="M20 110 L80 25" stroke="#10b981" stroke-width="4" fill="none"/>
    <!-- Línea de resistencia del banderín -->
    <line x1="80" y1="22" x2="170" y2="40" stroke="#ef4444" stroke-width="2" fill="none"/>
    <!-- Línea de soporte del banderín -->
    <line x1="80" y1="48" x2="170" y2="42" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Precio moviéndose ENTRE las líneas convergentes -->
    <path d="M80 25 L95 42 L110 28 L125 40 L140 32 L155 38 L170 35" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura -->
    <path d="M170 35 L200 12" stroke="#10b981" stroke-width="4" fill="none"/>
    <text x="110" y="130" fill="#fbbf24" font-size="11">Banderín</text>
    <text x="90" y="15" fill="#ef4444" font-size="9">Resistencia</text>
    <text x="90" y="60" fill="#3b82f6" font-size="9">Soporte</text>
</svg>`,

        bear_flag: `
    
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Caída inicial -->
    <path d="M20 25 L80 110" stroke="#ef4444" stroke-width="4" fill="none"/>
    <!-- Línea superior del canal (resistencia) - más horizontal -->
    <line x1="80" y1="95" x2="190" y2="85" stroke="#ef4444" stroke-width="2" fill="none"/>
    <!-- Línea inferior del canal (soporte) - más horizontal -->
    <line x1="80" y1="115" x2="190" y2="105" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Precio moviéndose DENTRO del canal con líneas -->
    <path d="M80 105 L95 90 L110 108 L125 88 L140 105 L155 90 L170 102 L185 85 L190 95" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Continuación bajista -->
    <path d="M190 95 L220 120" stroke="#ef4444" stroke-width="4" fill="none"/>
    <text x="120" y="130" fill="#fbbf24" font-size="11">Canal Ascendente</text>
    <text x="90" y="80" fill="#ef4444" font-size="9">Resistencia</text>
    <text x="90" y="125" fill="#3b82f6" font-size="9">Soporte</text>
</svg>`,

        bear_pennant: `
<svg width="240" height="140" class="bg-slate-900 rounded-lg">
    <!-- Caída inicial -->
    <path d="M20 25 L80 110" stroke="#ef4444" stroke-width="4" fill="none"></path>
    <!-- Línea de resistencia del banderín -->
    <line x1="80" y1="102" x2="185" y2="106" stroke="#ef4444" stroke-width="2" fill="none"></line>
    <!-- Línea de soporte del banderín -->
    <line x1="80" y1="122" x2="185" y2="110" stroke="#3b82f6" stroke-width="2" fill="none"></line>
    <!-- Precio ENTRE las líneas convergentes -->
    <path d="M80 110 L95 105 L110 115 L125 108 L140 112 L155 109 L170 110" stroke="#fbbf24" stroke-width="3" fill="none"></path>
    <!-- Continuación -->
    <path d="M170 110 L200 128" stroke="#ef4444" stroke-width="4" fill="none"></path>
    <text x="110" y="130" fill="#fbbf24" font-size="11">Banderín</text>
    <text x="90" y="85" fill="#ef4444" font-size="9">Resistencia</text>
    <text x="90" y="135" fill="#3b82f6" font-size="9">Soporte</text>
</svg>`,

        // CUÑA ASCENDENTE OPTIMIZADA
        rising_wedge: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Línea de resistemcia descendente (arriba del precio)-->
    <line x1="30" y1="76" x2="180" y2="68" stroke="#ef4444" stroke-width="2" fill="none"></line>
    
    <!-- Línea de soporte ascendente (DEBAJO del precio) - ajustada -->
    <line x1="28" y1="98" x2="200" y2="80" stroke="#3b82f6" stroke-width="2" fill="none"></line>
    
    <!-- Precio moviéndose ENTRE las líneas con más contactos -->
    <path d="M30 95 L50 80 L70 92 L90 78 L110 88 L130 75 L150 85 L170 72 L180 78" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura bajista -->
    <path d="M180 78 L220 105" stroke="#ef4444" stroke-width="5" fill="none"/>
    <text x="100" y="130" fill="#64748b" font-size="11">Cuña Ascendente</text>
    <text x="90" y="40" fill="#ef4444" font-size="9">Resistencia</text>
    <text x="90" y="110" fill="#3b82f6" font-size="9">Soporte</text>
</svg>`,

        // CUÑA DESCENDENTE (mantengo la versión optimizada anterior)
        falling_wedge: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Líneas de la cuña descendente - tocando extremos -->
    <line x1="30" y1="40" x2="180" y2="75" stroke="#ef4444" stroke-width="2" fill="none"/>
    <line x1="30" y1="90" x2="180" y2="85" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Acción del precio tocando las líneas -->
    <path d="M30 90 L55 45 L80 85 L105 55 L130 80 L155 65 L180 80" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura explosiva -->
    <path d="M180 80 L220 45" stroke="#10b981" stroke-width="5" fill="none"/>
    <text x="100" y="25" fill="#ef4444" font-size="10">Resistencia</text>
    <text x="100" y="130" fill="#3b82f6" font-size="10">Soporte</text>
</svg>`,

        // RANGOS OPTIMIZADOS
        bull_range: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Resistencia horizontal -->
    <line x1="40" y1="45" x2="190" y2="45" stroke="#ef4444" stroke-width="2" fill="none"/>
    <!-- Soporte horizontal -->
    <line x1="40" y1="90" x2="190" y2="90" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Precio rebotando ENTRE las líneas con más movimientos -->
    <path d="M40 75 L55 48 L70 85 L85 52 L100 80 L115 55 L130 82 L145 50 L160 85 L175 58 L190 75" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura alcista -->
    <path d="M190 75 L220 35" stroke="#10b981" stroke-width="4" fill="none"/>
    <text x="100" y="40" fill="#ef4444" font-size="10">Resistencia</text>
    <text x="100" y="105" fill="#3b82f6" font-size="10">Soporte</text>
    <text x="100" y="130" fill="#64748b" font-size="11">Rango Lateral</text>
</svg>`,

        bear_range: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Resistencia -->
    <line x1="40" y1="45" x2="190" y2="45" stroke="#ef4444" stroke-width="2" fill="none"/>
    <!-- Soporte -->
    <line x1="40" y1="90" x2="190" y2="90" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Precio con más movimientos y sesgo bajista -->
    <path d="M40 60 L55 80 L70 52 L85 85 L100 58 L115 82 L130 62 L145 88 L160 65 L175 85 L190 78" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura bajista -->
    <path d="M190 78 L220 115" stroke="#ef4444" stroke-width="4" fill="none"/>
    <text x="100" y="130" fill="#64748b" font-size="11">Rango con Sesgo Bajista</text>
</svg>`,

        // TRIÁNGULOS
        ascending_triangle: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Línea de resistencia horizontal -->
    <line x1="50" y1="35" x2="190" y2="35" stroke="#ef4444" stroke-width="2" fill="none"/>
    <!-- Línea de soporte ascendente -->
    <line x1="50" y1="100" x2="190" y2="35" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Acción del precio -->
    <path d="M50 100 L70 35 L90 80 L110 35 L130 60 L150 35 L170 50" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura -->
    <path d="M190 35 L220 15" stroke="#10b981" stroke-width="4" fill="none"/>
    <text x="90" y="25" fill="#ef4444" font-size="10">Resistencia</text>
    <text x="90" y="130" fill="#3b82f6" font-size="10">Soporte</text>
</svg>`,

        descending_triangle: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Soporte horizontal -->
    <line x1="50" y1="100" x2="190" y2="100" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Resistencia descendente -->
    <line x1="50" y1="35" x2="190" y2="100" stroke="#ef4444" stroke-width="2" fill="none"/>
    <!-- Acción del precio -->
    <path d="M50 35 L70 100 L90 55 L110 100 L130 75 L150 100 L170 90" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura bajista -->
    <path d="M190 100 L220 120" stroke="#ef4444" stroke-width="4" fill="none"/>
    <text x="90" y="25" fill="#ef4444" font-size="10">Resistencia</text>
    <text x="90" y="130" fill="#3b82f6" font-size="10">Soporte</text>
</svg>`,

        symmetrical_triangle_bull: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Líneas convergentes simétricas -->
    <line x1="50" y1="45" x2="180" y2="75" stroke="#ef4444" stroke-width="2" fill="none"/>
    <line x1="50" y1="90" x2="180" y2="75" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Acción del precio -->
    <path d="M50 90 L70 50 L90 85 L110 55 L130 80 L150 65 L170 75" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura alcista -->
    <path d="M180 75 L210 45" stroke="#10b981" stroke-width="4" fill="none"/>
    <text x="100" y="130" fill="#64748b" font-size="11">Triángulo Simétrico</text>
</svg>`,

        symmetrical_triangle_bear: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Líneas simétricas -->
    <line x1="50" y1="45" x2="180" y2="75" stroke="#ef4444" stroke-width="2" fill="none"/>
    <line x1="50" y1="90" x2="180" y2="75" stroke="#3b82f6" stroke-width="2" fill="none"/>
    <!-- Precio con sesgo bajista -->
    <path d="M50 90 L70 50 L90 85 L110 55 L130 80 L150 65 L170 78" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura bajista -->
    <path d="M180 78 L210 105" stroke="#ef4444" stroke-width="4" fill="none"/>
    <text x="100" y="130" fill="#64748b" font-size="11">Triángulo Simétrico</text>
</svg>`,

        // PATRONES DE REVERSIÓN
        cup_handle: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Formación de la taza -->
    <path d="M30 55 Q70 100 110 65 Q150 45 180 55" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- El asa -->
    <path d="M180 55 L195 65 L210 60" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Línea de resistencia -->
    <line x1="30" y1="55" x2="210" y2="60" stroke="#ef4444" stroke-width="1" stroke-dasharray="3,3"/>
    <!-- Ruptura -->
    <path d="M210 60 L235 35" stroke="#10b981" stroke-width="4" fill="none"/>
    <text x="100" y="130" fill="#64748b" font-size="11">Taza</text>
    <text x="200" y="130" fill="#64748b" font-size="10">Asa</text>
</svg>`,

        head_shoulders: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Línea de cuello -->
    <line x1="30" y1="90" x2="210" y2="95" stroke="#3b82f6" stroke-width="2" fill="none" stroke-dasharray="5,5"/>
    <!-- Formación H-C-H -->
    <path d="M20 100 L60 65 L90 90 L120 35 L150 90 L180 60 L210 95" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura -->
    <path d="M210 95 L235 115" stroke="#ef4444" stroke-width="4" fill="none"/>
    <text x="55" y="130" fill="#64748b" font-size="9">H1</text>
    <text x="115" y="130" fill="#64748b" font-size="9">Cabeza</text>
    <text x="175" y="130" fill="#64748b" font-size="9">H2</text>
</svg>`,

        inverse_head_shoulders: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Línea de cuello -->
    <line x1="30" y1="45" x2="210" y2="40" stroke="#3b82f6" stroke-width="2" fill="none" stroke-dasharray="5,5"/>
    <!-- Formación invertida -->
    <path d="M20 35 L60 70 L90 45 L120 100 L150 45 L180 75 L210 40" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura alcista -->
    <path d="M210 40 L235 20" stroke="#10b981" stroke-width="4" fill="none"/>
    <text x="115" y="15" fill="#64748b" font-size="10">H-C-H Inv.</text>
</svg>`,

        // PATRONES M, W y V - VARIANTES
        m_pattern_1st_variant: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Tendencia alcista inicial -->
    <path d="M10 90 L50 30" stroke="#10b981" stroke-width="2" fill="none"/>
    <!-- Patrón M clásico -->
    <path d="M50 30 L80 65 L110 30 L140 70" stroke="#fbbf24" stroke-width="4" fill="none"/>
    <!-- Ruptura directa -->
    <path d="M140 70 L180 105" stroke="#ef4444" stroke-width="5" fill="none"/>
    <!-- Labels -->
    <text x="80" y="15" fill="#10b981" font-size="10">1ª Variante</text>
    <text x="120" y="130" fill="#64748b" font-size="9">Ruptura Directa</text>
    <!-- Puntos de picos -->
    <circle cx="80" cy="30" r="2" fill="#ef4444"/>
    <circle cx="110" cy="30" r="2" fill="#ef4444"/>
</svg>`,

        m_pattern_2nd_variant: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Patrón M completo -->
    <path d="M20 80 L60 25 L90 60 L120 25 L150 65" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Segundo triángulo descendente después del M -->
    <path d="M150 65 L170 55 L190 60 L205 55" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Líneas del triángulo descendente -->
    <line x1="150" y1="50" x2="205" y2="50" stroke="#ef4444" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="150" y1="70" x2="205" y2="60" stroke="#3b82f6" stroke-width="1" stroke-dasharray="2,2"/>
    <!-- Ruptura final -->
    <path d="M205 55 L230 85" stroke="#ef4444" stroke-width="4" fill="none"/>
    <!-- Puntos de picos del M -->
    <circle cx="60" cy="25" r="2" fill="#ef4444"/>
    <circle cx="120" cy="25" r="2" fill="#ef4444"/>
    <!-- Labels -->
    <text x="80" y="15" fill="#fbbf24" font-size="10">M + Triángulo</text>
    <text x="175" y="45" fill="#64748b" font-size="8">2º△</text>
</svg>`,

        m_pattern_3rd_variant: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Patrón M completo -->
    <path d="M20 80 L60 25 L90 60 L120 25 L150 65" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura inicial -->
    <path d="M150 65 L175 85" stroke="#ef4444" stroke-width="3" fill="none"/>
    <!-- Pullback al soporte roto -->
    <path d="M175 85 L195 70" stroke="#10b981" stroke-width="2" fill="none"/>
    <!-- Continuación bajista definitiva -->
    <path d="M195 70 L225 100" stroke="#ef4444" stroke-width="4" fill="none"/>
    <!-- Línea de soporte roto (ahora resistencia) -->
    <line x1="75" y1="60" x2="195" y2="60" stroke="#3b82f6" stroke-width="1" stroke-dasharray="3,3"/>
    <!-- Puntos del M -->
    <circle cx="60" cy="25" r="2" fill="#ef4444"/>
    <circle cx="120" cy="25" r="2" fill="#ef4444"/>
    <!-- Labels -->
    <text x="80" y="15" fill="#64748b" font-size="10">M + Pullback</text>
    <text x="180" y="50" fill="#10b981" font-size="8">PB</text>
</svg>`,

        w_pattern_1st_variant: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Tendencia bajista inicial -->
    <path d="M10 45 L50 105" stroke="#ef4444" stroke-width="2" fill="none"/>
    <!-- Patrón W clásico -->
    <path d="M50 105 L80 70 L110 105 L140 65" stroke="#fbbf24" stroke-width="4" fill="none"/>
    <!-- Ruptura directa -->
    <path d="M140 65 L180 30" stroke="#10b981" stroke-width="5" fill="none"/>
    <!-- Labels -->
    <text x="80" y="130" fill="#10b981" font-size="10">1ª Variante</text>
    <text x="120" y="15" fill="#64748b" font-size="9">Ruptura Directa</text>
    <!-- Puntos de valles -->
    <circle cx="80" cy="105" r="2" fill="#10b981"/>
    <circle cx="110" cy="105" r="2" fill="#10b981"/>
</svg>`,

        w_pattern_2nd_variant: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Patrón W completo -->
    <path d="M20 55 L60 110 L90 75 L120 110 L150 70" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Segundo triángulo ascendente después del W -->
    <path d="M150 70 L170 80 L190 75 L205 80" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Líneas del triángulo ascendente -->
    <line x1="150" y1="85" x2="205" y2="85" stroke="#ef4444" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="150" y1="65" x2="205" y2="75" stroke="#3b82f6" stroke-width="1" stroke-dasharray="2,2"/>
    <!-- Ruptura alcista final -->
    <path d="M205 80 L230 50" stroke="#10b981" stroke-width="4" fill="none"/>
    <!-- Puntos de valles del W -->
    <circle cx="60" cy="110" r="2" fill="#10b981"/>
    <circle cx="120" cy="110" r="2" fill="#10b981"/>
    <!-- Labels -->
    <text x="80" y="130" fill="#fbbf24" font-size="10">W + Triángulo</text>
    <text x="175" y="100" fill="#64748b" font-size="8">2º△</text>
</svg>`,

        w_pattern_3rd_variant: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Patrón W completo -->
    <path d="M20 55 L60 110 L90 75 L120 110 L150 70" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <!-- Ruptura inicial -->
    <path d="M150 70 L175 50" stroke="#10b981" stroke-width="3" fill="none"/>
    <!-- Pullback a la resistencia rota -->
    <path d="M175 50 L195 65" stroke="#ef4444" stroke-width="2" fill="none"/>
    <!-- Continuación alcista definitiva -->
    <path d="M195 65 L225 35" stroke="#10b981" stroke-width="4" fill="none"/>
    <!-- Línea de resistencia rota (ahora soporte) -->
    <line x1="75" y1="75" x2="195" y2="75" stroke="#ef4444" stroke-width="1" stroke-dasharray="3,3"/>
    <!-- Puntos del W -->
    <circle cx="60" cy="110" r="2" fill="#10b981"/>
    <circle cx="120" cy="110" r="2" fill="#10b981"/>
    <!-- Labels -->
    <text x="80" y="130" fill="#64748b" font-size="10">W + Pullback</text>
    <text x="180" y="90" fill="#ef4444" font-size="8">PB</text>
</svg>`,

        // PATRONES V
        v_bottom: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Caída dramática -->
    <path d="M20 35 L110 105" stroke="#ef4444" stroke-width="4" fill="none"/>
    <!-- Reversión en V -->
    <path d="M110 105 L200 35" stroke="#10b981" stroke-width="5" fill="none"/>
    <path d="M200 35 L230 20" stroke="#10b981" stroke-width="4" fill="none"/>
    <text x="100" y="125" fill="#64748b" font-size="11">V Bottom</text>
    <circle cx="110" cy="105" r="3" fill="#fbbf24"/>
</svg>`,

        v_top: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Subida dramática -->
    <path d="M20 105 L110 35" stroke="#10b981" stroke-width="4" fill="none"/>
    <!-- Reversión en V invertida -->
    <path d="M110 35 L200 105" stroke="#ef4444" stroke-width="5" fill="none"/>
    <path d="M200 105 L230 120" stroke="#ef4444" stroke-width="4" fill="none"/>
    <text x="100" y="20" fill="#64748b" font-size="11">V Top</text>
    <circle cx="110" cy="35" r="3" fill="#fbbf24"/>
</svg>`,

        // PATRONES TRIPLES
        triple_top: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Tres picos al mismo nivel -->
    <line x1="30" y1="30" x2="190" y2="30" stroke="#ef4444" stroke-width="2" stroke-dasharray="3,3"/>
    <path d="M20 85 L60 30 L85 70 L120 30 L145 70 L180 30 L210 85" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <path d="M210 85 L235 110" stroke="#ef4444" stroke-width="4" fill="none"/>
    <text x="100" y="125" fill="#64748b" font-size="10">Triple Techo</text>
    <circle cx="60" cy="30" r="2" fill="#ef4444"/>
    <circle cx="120" cy="30" r="2" fill="#ef4444"/>
    <circle cx="180" cy="30" r="2" fill="#ef4444"/>
</svg>`,

        triple_bottom: `
<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
    <!-- Tres valles al mismo nivel -->
    <line x1="30" y1="105" x2="190" y2="105" stroke="#3b82f6" stroke-width="2" stroke-dasharray="3,3"/>
    <path d="M20 50 L60 105 L85 65 L120 105 L145 65 L180 105 L210 50" stroke="#fbbf24" stroke-width="3" fill="none"/>
    <path d="M210 50 L235 25" stroke="#10b981" stroke-width="4" fill="none"/>
    <text x="100" y="20" fill="#64748b" font-size="10">Triple Suelo</text>
    <circle cx="60" cy="105" r="2" fill="#10b981"/>
    <circle cx="120" cy="105" r="2" fill="#10b981"/>
    <circle cx="180" cy="105" r="2" fill="#10b981"/>
</svg>`
    };

    return patterns[ patternId ] || `<svg width="${width}" height="${height}" class="bg-slate-900 rounded-lg">
        <text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-size="14">Patrón Visual</text>
    </svg>`;

}

// Función para crear tarjeta de patrón de tendencia
function createTrendPatternCard( patternId, pattern ) {
    const reliabilityColor = pattern.reliability >= 80 ? 'text-green-400' :
        pattern.reliability >= 70 ? 'text-yellow-400' : 'text-red-400';

    const strengthColors = {
        very_high: 'bg-green-600',
        high: 'bg-blue-600',
        medium: 'bg-yellow-600',
        low: 'bg-gray-600'
    };

    const categoryColors = {
        bullish_continuation: 'bg-green-500',
        bearish_continuation: 'bg-red-500',
        reversal: 'bg-purple-500'
    };

    const categoryLabels = {
        bullish_continuation: 'Cont. Alcista',
        bearish_continuation: 'Cont. Bajista',
        reversal: 'Reversión'
    };

    const categories = pattern.category.map( cat =>
        `<span class="px-2 py-1 ${categoryColors[ cat ]} text-xs rounded font-medium">${categoryLabels[ cat ]}</span>`
    ).join( ' ' );

    return `
        <div class="pattern-card bg-card-dark rounded-xl p-6 cursor-pointer hover:bg-slate-700 transition-all" 
             data-categories="${pattern.category.join( ' ' )}" data-pattern="${patternId}">
            
            <!-- Header -->
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-bold text-white">${pattern.name}</h3>
                <div class="text-right">
                    <div class="${reliabilityColor} text-xl font-bold">${pattern.reliability}%</div>
                    <div class="text-xs text-slate-400">Éxito</div>
                </div>
            </div>

            <!-- Badges -->
            <div class="mb-4 flex gap-1 flex-wrap">
                ${categories}
                <span class="px-2 py-1 bg-slate-600 text-xs rounded font-medium">${pattern.timeframe}</span>
                <span class="px-2 py-1 ${strengthColors[ pattern.strength ]} text-xs rounded font-medium">
                    ${pattern.strength === 'very_high' ? 'Muy Alta' :
            pattern.strength === 'high' ? 'Alta' :
                pattern.strength === 'medium' ? 'Media' : 'Baja'}
                </span>
            </div>

            <!-- Visualización del patrón -->
            <div class="bg-slate-800 rounded-lg p-3 mb-4 min-h-[180px] flex items-center justify-center">
                ${createTrendPatternSVG( patternId )}
            </div>

            <!-- Barra de confiabilidad -->
            <div class="mb-4">
                <div class="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Confiabilidad</span>
                    <span>${pattern.reliability}%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                    <div class="reliability-bar rounded-full h-2 transition-all duration-500" 
                         style="width: ${pattern.reliability}%"></div>
                </div>
            </div>

            <!-- Descripción -->
            <p class="text-sm text-slate-300 mb-4">${pattern.description.substring( 0, 100 )}...</p>

            <!-- Info trading rápida -->
            <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="bg-slate-700 rounded p-2">
                    <div class="text-slate-400 mb-1">Entrada</div>
                    <div class="text-blue-300 font-medium">Al romper nivel clave</div>
                </div>
                <div class="bg-slate-700 rounded p-2">
                    <div class="text-slate-400 mb-1">R:R</div>
                    <div class="text-green-300 font-medium">1:2 - 1:3</div>
                </div>
            </div>

            <!-- Botón de acción -->
            <button class="w-full mt-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold py-2 px-4 rounded-lg transition-all">
                Ver Estrategia Completa
            </button>
        </div>
    `;
}

// Función para mostrar detalles en modal de tendencia
function showTrendPatternDetails( patternId ) {
    const pattern = trendPatterns[ patternId ];
    if ( !pattern ) return;

    const modal = document.getElementById( 'trendPatternModal' );
    const modalTitle = document.getElementById( 'trendModalTitle' );
    const modalBadges = document.getElementById( 'trendModalBadges' );
    const modalContent = document.getElementById( 'trendModalContent' );

    modalTitle.textContent = pattern.name;

    // Badges en el modal
    const categoryColors = {
        bullish_continuation: 'bg-green-500',
        bearish_continuation: 'bg-red-500',
        reversal: 'bg-purple-500'
    };

    const categoryLabels = {
        bullish_continuation: 'Continuación Alcista',
        bearish_continuation: 'Continuación Bajista',
        reversal: 'Reversión'
    };

    const badges = pattern.category.map( cat =>
        `<span class="px-3 py-1 ${categoryColors[ cat ]} text-sm rounded font-medium">${categoryLabels[ cat ]}</span>`
    ).join( ' ' );

    modalBadges.innerHTML = badges;

    // Contenido del modal
    modalContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Columna izquierda: Visualización y Descripción -->
            <div class="space-y-6">
                <div class="bg-slate-700 rounded-xl p-6">
                    <h4 class="text-xl font-semibold mb-4 text-yellow-400">Visualización del Patrón</h4>
                    <div class="bg-slate-800 rounded-lg p-6 flex justify-center items-center min-h-[250px]">
                        ${createTrendPatternSVG( patternId, 300, 180 )}
                    </div>
                </div>

                <div class="bg-slate-700 rounded-xl p-6">
                    <h4 class="text-xl font-semibold mb-4 text-blue-400">Descripción Técnica</h4>
                    <p class="text-slate-200 leading-relaxed mb-4">${pattern.description}</p>
                    
                    <div class="bg-slate-800 rounded-lg p-4">
                        <h5 class="font-semibold text-cyan-400 mb-2">Contexto de Aparición:</h5>
                        <p class="text-slate-300 text-sm">${pattern.context}</p>
                    </div>
                </div>

                <div class="bg-slate-700 rounded-xl p-6">
                    <h4 class="text-xl font-semibold mb-4 text-purple-400">Confirmación del Patrón</h4>
                    <p class="text-slate-200 leading-relaxed">${pattern.confirmation}</p>
                </div>
            </div>

            <!-- Columna derecha: Estrategia de Trading -->
            <div class="space-y-6">
                <div class="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-700/30">
                    <h4 class="text-xl font-semibold mb-4 text-green-300">Estrategia de Trading</h4>
                    <div class="space-y-4">
                        <div class="bg-slate-800/50 rounded-lg p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                                <span class="font-semibold text-green-300">Punto de Entrada:</span>
                            </div>
                            <p class="text-slate-200 text-sm pl-5">${pattern.entry}</p>
                        </div>
                        
                        <div class="bg-slate-800/50 rounded-lg p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="w-3 h-3 bg-red-400 rounded-full"></div>
                                <span class="font-semibold text-red-300">Stop Loss:</span>
                            </div>
                            <p class="text-slate-200 text-sm pl-5">${pattern.stopLoss}</p>
                        </div>

                        <div class="bg-slate-800/50 rounded-lg p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                                <span class="font-semibold text-blue-300">Objetivo (Take Profit):</span>
                            </div>
                            <p class="text-slate-200 text-sm pl-5">${pattern.target}</p>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-amber-900/50 to-yellow-900/50 rounded-xl p-6 border border-yellow-700/30">
                    <h4 class="text-xl font-semibold mb-4 text-yellow-300">Métricas de Rendimiento</h4>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="text-center p-3 bg-slate-800/50 rounded-lg">
                            <div class="text-3xl font-bold text-yellow-400">${pattern.reliability}%</div>
                            <div class="text-sm text-slate-300">Tasa de Éxito</div>
                        </div>
                        <div class="text-center p-3 bg-slate-800/50 rounded-lg">
                            <div class="text-3xl font-bold text-cyan-400">${pattern.timeframe}</div>
                            <div class="text-sm text-slate-300">Timeframe Mín.</div>
                        </div>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-3">
                        <div class="reliability-bar rounded-full h-3 transition-all" style="width: ${pattern.reliability}%"></div>
                    </div>
                    <div class="mt-2 text-center">
                        <span class="text-sm text-slate-400">Confiabilidad: </span>
                        <span class="text-sm font-bold ${pattern.reliability >= 80 ? 'text-green-400' : pattern.reliability >= 70 ? 'text-yellow-400' : 'text-red-400'}">
                            ${pattern.reliability >= 80 ? 'Alta' : pattern.reliability >= 70 ? 'Media' : 'Baja'}
                        </span>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl p-6 border border-purple-700/30">
                    <h4 class="text-xl font-semibold mb-4 text-indigo-300">Consejos Profesionales</h4>
                    <div class="space-y-3">
                        ${pattern.tips.map( tip => `
                            <div class="flex items-start gap-3">
                                <div class="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span class="text-slate-200 text-sm leading-relaxed">${tip}</span>
                            </div>
                        `).join( '' )}
                    </div>
                </div>

                <div class="bg-slate-700 rounded-xl p-6">
                    <h4 class="text-xl font-semibold mb-4 text-orange-400">Gestión de Riesgo</h4>
                    <div class="space-y-3 text-sm text-slate-300">
                        <div class="flex justify-between">
                            <span>Riesgo por operación:</span>
                            <span class="text-yellow-400 font-medium">1-2% del capital</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Ratio Riesgo/Beneficio:</span>
                            <span class="text-green-400 font-medium">1:2 mínimo</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Timeframe recomendado:</span>
                            <span class="text-blue-400 font-medium">${pattern.timeframe}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove( 'hidden' );
    modal.classList.add( 'flex' );
}

// Función para filtrar patrones de tendencia
function filterTrendPatterns( category ) {
    const cards = document.querySelectorAll( '#trendPatternsGrid .pattern-card' );
    let visibleCount = 0;

    cards.forEach( card => {
        const categories = card.dataset.categories || '';
        let shouldShow = false;

        if ( category === 'all' ) {
            shouldShow = true;
        } else {
            shouldShow = categories.includes( category );
        }

        card.style.display = shouldShow ? 'block' : 'none';
        if ( shouldShow ) visibleCount++;
    } );

    // Actualizar botones de categoría
    document.querySelectorAll( '.trend-category-button' ).forEach( btn => {
        btn.classList.remove( 'active' );
        if ( btn.dataset.category === category ) {
            btn.classList.add( 'active' );
        }
    } );

    updateTrendStats( category );
}

function searchTrendPatterns( searchTerm ) {
    const cards = document.querySelectorAll( '#trendPatternsGrid .pattern-card' );

    cards.forEach( card => {
        const patternId = card.dataset.pattern;
        const pattern = trendPatterns[ patternId ];
        const searchableText = `${pattern.name} ${pattern.description} ${pattern.context}`.toLowerCase();

        if ( searchTerm === '' || searchableText.includes( searchTerm.toLowerCase() ) ) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    } );
}

function updateTrendStats( category ) {
    const patterns = Object.values( trendPatterns );
    let filteredPatterns = patterns;

    if ( category !== 'all' ) {
        filteredPatterns = patterns.filter( p => p.category.includes( category ) );
    }

    const totalPatterns = filteredPatterns.length;
    const avgReliability = totalPatterns === 0 ? 0 : Math.round( filteredPatterns.reduce( ( sum, p ) => sum + p.reliability, 0 ) / totalPatterns );
    const reversalCount = filteredPatterns.filter( p => p.category.includes( 'reversal' ) ).length;
    const continuationCount = filteredPatterns.filter( p =>
        p.category.includes( 'bullish_continuation' ) || p.category.includes( 'bearish_continuation' )
    ).length;

    // Usar IDs únicos para evitar conflictos con patrones de velas
    const elTotal = document.getElementById( 'trendTotalPatterns' );
    const elAvg = document.getElementById( 'trendAvgReliability' );
    const elRev = document.getElementById( 'trendReversalCount' );
    const elCont = document.getElementById( 'trendContinuationCount' );

    if ( elTotal ) elTotal.textContent = totalPatterns;
    if ( elAvg ) elAvg.textContent = avgReliability + '%';
    if ( elRev ) elRev.textContent = reversalCount;
    if ( elCont ) elCont.textContent = continuationCount;
}

// Función de inicialización para patrones de tendencia
function initTrendPatterns() {
    // Generar grid de patrones
    const grid = document.getElementById( 'trendPatternsGrid' );
    if ( grid ) {
        Object.entries( trendPatterns ).forEach( ( [ patternId, pattern ] ) => {
            grid.innerHTML += createTrendPatternCard( patternId, pattern );
        } );

        // Event listeners para tarjetas
        grid.addEventListener( 'click', ( e ) => {
            const card = e.target.closest( '.pattern-card' );
            if ( card ) {
                const patternId = card.dataset.pattern;
                showTrendPatternDetails( patternId );
            }
        } );
    }

    // Event listeners para filtros
    document.querySelectorAll( '.trend-category-button' ).forEach( btn => {
        btn.addEventListener( 'click', function () {
            const category = this.dataset.category;
            filterTrendPatterns( category );
        } );
    } );

    // Event listener para búsqueda
    const searchInput = document.getElementById( 'trendSearchInput' );
    if ( searchInput ) {
        searchInput.addEventListener( 'input', ( e ) => {
            searchTrendPatterns( e.target.value );
        } );
    }

    // Event listeners para modal
    const closeModal = document.getElementById( 'closeTrendModal' );
    if ( closeModal ) {
        closeModal.addEventListener( 'click', () => {
            const modal = document.getElementById( 'trendPatternModal' );
            modal.classList.add( 'hidden' );
            modal.classList.remove( 'flex' );
        } );
    }

    // Cerrar modal con click fuera
    const modal = document.getElementById( 'trendPatternModal' );
    if ( modal ) {
        modal.addEventListener( 'click', ( e ) => {
            if ( e.target === modal ) {
                modal.classList.add( 'hidden' );
                modal.classList.remove( 'flex' );
            }
        } );
    }

    // Cerrar modal con ESC (solo si el modal de tendencia está abierto)
    document.addEventListener( 'keydown', ( e ) => {
        if ( e.key === 'Escape' ) {
            const modal = document.getElementById( 'trendPatternModal' );
            if ( modal && !modal.classList.contains( 'hidden' ) ) {
                modal.classList.add( 'hidden' );
                modal.classList.remove( 'flex' );
            }
        }
    } );

    // Inicializar estadísticas
    updateTrendStats( 'all' );
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener( 'DOMContentLoaded', () => {
    // Solo inicializar si estamos en la página correcta
    if ( document.getElementById( 'trendPatternsGrid' ) ) {
        initTrendPatterns();
    }
} );
