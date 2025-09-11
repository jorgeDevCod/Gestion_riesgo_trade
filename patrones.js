// ======================
// tradingPatterns (títulos ajustados al español latino)
// ======================
const tradingPatterns = {
    hammer: {
        name: "Martillo",
        category: [ "bullish", "reversal" ],
        reliability: 75,
        timeframe: "15M+",
        description: "Patrón de reversión alcista con cuerpo pequeño en la parte superior y mecha inferior larga que indica rechazo de precios bajos.",
        candles: [
            { open: 100, high: 105, low: 85, close: 103 }
        ],
        context: "Final de tendencia bajista, en niveles de soporte clave",
        confirmation: "Vela alcista siguiente que supere el máximo del martillo",
        entry: "Ruptura del máximo del martillo",
        stopLoss: "Por debajo del mínimo (-3 pips)",
        target: "1.5-2R del riesgo asumido",
        tips: [
            "Verificar que la mecha inferior sea al menos 2x el cuerpo",
            "Mayor efectividad en soportes importantes",
            "Confirmar con volumen alto en la vela siguiente"
        ]
    },

    bullish_engulfing: {
        name: "Envolvente Alcista",
        category: [ "bullish", "reversal" ],
        reliability: 85,
        timeframe: "15M+",
        description: "Patrón potente de dos velas donde una vela verde grande envuelve completamente el cuerpo de la vela roja anterior.",
        candles: [
            { open: 105, high: 107, low: 95, close: 97 },
            { open: 96, high: 115, low: 94, close: 112 }
        ],
        context: "Final de tendencia bajista con volumen alto",
        confirmation: "Segunda vela debe cerrar por encima de la apertura de la primera",
        entry: "Cierre de la segunda vela",
        stopLoss: "Por debajo del mínimo del patrón (-3 pips)",
        target: "2-3R del riesgo asumido",
        tips: [
            "El cuerpo de la segunda vela debe envolver completamente la primera",
            "Volumen alto en la segunda vela es crucial",
            "Más efectivo después de tendencias bajistas prolongadas"
        ]
    },

    morning_star: {
        name: "Estrella del Amanecer",
        category: [ "bullish", "reversal" ],
        reliability: 90,
        timeframe: "1H+",
        description: "Patrón de tres velas: bajista larga, estrella pequeña con gap, y alcista larga que confirma reversión.",
        candles: [
            { open: 110, high: 112, low: 90, close: 92 },
            { open: 91, high: 96, low: 88, close: 94 },
            { open: 95, high: 118, low: 94, close: 115 }
        ],
        context: "Mercado sobrevendido, final de tendencia bajista",
        confirmation: "Tercera vela cierra por encima del punto medio de la primera",
        entry: "Cierre de la tercera vela",
        stopLoss: "Por debajo del mínimo de la estrella (-5 pips)",
        target: "3-4R del riesgo asumado",
        tips: [
            "Gap entre velas fortalece la señal",
            "La segunda vela debe ser pequeña (doji ideal)",
            "Patrón muy confiable en timeframes altos"
        ]
    },

    shooting_star: {
        name: "Estrella Fugaz",
        category: [ "bearish", "reversal" ],
        reliability: 70,
        timeframe: "15M+",
        description: "Vela con mecha superior larga y cuerpo pequeño cerca del mínimo, indica rechazo en niveles altos.",
        candles: [
            { open: 97, high: 115, low: 95, close: 99 }
        ],
        context: "En resistencias clave, después de movimiento alcista",
        confirmation: "Vela bajista siguiente que rompa por debajo del cuerpo",
        entry: "Ruptura del mínimo de la estrella fugaz",
        stopLoss: "Por encima del máximo (+3 pips)",
        target: "1.5-2R del riesgo asumido",
        tips: [
            "Mecha superior debe ser mínimo 2x el cuerpo",
            "Más efectiva en resistencias importantes",
            "Confirmar con volumen en la vela siguiente"
        ]
    },

    bearish_engulfing: {
        name: "Envolvente Bajista",
        category: [ "bearish", "reversal" ],
        reliability: 83,
        timeframe: "15M+",
        description: "Patrón bajista donde una vela roja grande envuelve completamente el cuerpo de la vela verde anterior.",
        candles: [
            { open: 95, high: 108, low: 93, close: 106 },
            { open: 107, high: 109, low: 85, close: 88 }
        ],
        context: "Final de tendencia alcista o en resistencia",
        confirmation: "Apertura por encima del cierre anterior, cierre por debajo de la apertura anterior",
        entry: "Cierre de la segunda vela",
        stopLoss: "Por encima del máximo del patrón (+3 pips)",
        target: "2-3R del riesgo asumido",
        tips: [
            "Envolvimiento completo del cuerpo es esencial",
            "Volumen alto fortalece la señal",
            "Efectivo en máximos de tendencia"
        ]
    },

    evening_star: {
        name: "Estrella del Atardecer",
        category: [ "bearish", "reversal" ],
        reliability: 88,
        timeframe: "1H+",
        description: "Patrón bajista de tres velas que indica reversión desde niveles altos del mercado.",
        candles: [
            { open: 90, high: 112, low: 88, close: 110 },
            { open: 111, high: 116, low: 108, close: 109 },
            { open: 108, high: 110, low: 85, close: 87 }
        ],
        context: "Mercado sobrecomprado, final de tendencia alcista",
        confirmation: "Tercera vela cierra por debajo del punto medio de la primera",
        entry: "Cierre de la tercera vela",
        stopLoss: "Por encima del máximo de la estrella (+5 pips)",
        target: "3-4R del riesgo asumido",
        tips: [
            "Gap entre primera y segunda vela ideal",
            "Segunda vela debe ser pequeña (indecisión)",
            "Muy confiable en timeframes mayores"
        ]
    },

    doji: {
        name: "Doji de Indecisión",
        category: [ "reversal" ],
        reliability: 65,
        timeframe: "15M+",
        description: "Vela de indecisión donde apertura y cierre son prácticamente iguales, indica equilibrio de fuerzas.",
        candles: [
            { open: 100, high: 110, low: 90, close: 100 }
        ],
        context: "En niveles clave después de movimientos fuertes",
        confirmation: "Dirección confirmada por la vela siguiente",
        entry: "Ruptura en dirección de confirmación",
        stopLoss: "Lado opuesto del doji",
        target: "1-2R dependiendo del contexto",
        tips: [
            "Más efectivo en soportes/resistencias",
            "Requiere confirmación direccional",
            "Mechas largas aumentan significancia"
        ]
    },

    rising_three: {
        name: "Tres Velas de Continuación Alcista",
        category: [ "bullish", "continuation" ],
        reliability: 75,
        timeframe: "1H+",
        description: "Patrón de continuación alcista de cinco velas que confirma la tendencia tras consolidación.",
        candles: [
            { open: 90, high: 108, low: 88, close: 106 },
            { open: 105, high: 106, low: 98, close: 100 },
            { open: 101, high: 103, low: 96, close: 99 },
            { open: 100, high: 102, low: 94, close: 97 },
            { open: 98, high: 115, low: 96, close: 112 }
        ],
        context: "Durante tendencia alcista establecida",
        confirmation: "Quinta vela supera máximo de la primera",
        entry: "Ruptura del máximo de la primera vela",
        stopLoss: "Por debajo del mínimo del patrón",
        target: "Proyección igual al rango inicial",
        tips: [
            "Tres velas intermedias deben estar contenidas",
            "Volumen decreciente en consolidación",
            "Quinta vela con volumen alto"
        ]
    },

    falling_three: {
        name: "Tres Velas de Continuación Bajista",
        category: [ "bearish", "continuation" ],
        reliability: 73,
        timeframe: "1H+",
        description: "Patrón bajista de cinco velas que confirma continuación de tendencia descendente tras pausa.",
        candles: [
            { open: 108, high: 110, low: 88, close: 90 },
            { open: 91, high: 98, low: 89, close: 95 },
            { open: 94, high: 99, low: 92, close: 96 },
            { open: 95, high: 100, low: 93, close: 98 },
            { open: 97, high: 99, low: 82, close: 85 }
        ],
        context: "Durante tendencia bajista con consolidación temporal",
        confirmation: "Quinta vela rompe por debajo del mínimo de la primera",
        entry: "Ruptura del mínimo de la primera vela",
        stopLoss: "Por encima del máximo del patrón",
        target: "Proyección igual al rango de la primera vela",
        tips: [
            "Las tres velas intermedias deben estar dentro del rango",
            "Pausa de consolidación indica acumulación bajista",
            "Quinta vela debe ser fuerte con volumen"
        ]
    },

    inverted_hammer: {
        name: "Martillo Invertido",
        category: [ "bullish", "reversal" ],
        reliability: 68,
        timeframe: "15M+",
        description: "Vela con mecha superior larga y cuerpo pequeño abajo, sugiere agotamiento vendedor tras caída.",
        candles: [
            { open: 88, high: 105, low: 86, close: 90 }
        ],
        context: "Final de tendencia bajista, necesita confirmación alcista fuerte",
        confirmation: "Vela alcista siguiente que supere el máximo de la mecha",
        entry: "Confirmación alcista por encima del máximo",
        stopLoss: "Por debajo del mínimo (-3 pips)",
        target: "1.5-2R del riesgo",
        tips: [
            "Mecha superior mínimo 2x el cuerpo",
            "Requiere confirmación más fuerte que martillo normal",
            "Efectivo en soportes importantes"
        ]
    },

    hanging_man: {
        name: "Martillo Colgado",
        category: [ "bearish", "reversal" ],
        reliability: 72,
        timeframe: "15M+",
        description: "Vela bajista con mecha inferior larga tras tendencia alcista, indica posible reversión.",
        candles: [
            { open: 103, high: 105, low: 88, close: 101 }
        ],
        context: "Final de tendencia alcista, en resistencias clave",
        confirmation: "Vela bajista siguiente que rompa por debajo del mínimo",
        entry: "Ruptura bajista del mínimo de la vela",
        stopLoss: "Por encima del máximo (+3 pips)",
        target: "1.5-2R del riesgo",
        tips: [
            "Mecha inferior larga indica rechazo de compradores",
            "Más efectivo tras movimientos alcistas fuertes",
            "Volumen alto en confirmación es crucial"
        ]
    },

    dragonfly_doji: {
        name: "Doji Libélula",
        category: [ "bullish", "reversal" ],
        reliability: 78,
        timeframe: "30M+",
        description: "Doji con mecha inferior larga, sin mecha superior, señala rechazo fuerte de precios bajos.",
        candles: [
            { open: 100, high: 101, low: 85, close: 100 }
        ],
        context: "En soportes importantes tras caída significativa",
        confirmation: "Vela alcista siguiente con volumen alto",
        entry: "Ruptura alcista del máximo del doji",
        stopLoss: "Por debajo del mínimo de la mecha (-5 pips)",
        target: "2-2.5R del riesgo",
        tips: [
            "Sin mecha superior es ideal",
            "Mecha inferior muy larga indica rechazo fuerte",
            "Más confiable que doji regular"
        ]
    },

    gravestone_doji: {
        name: "Doji Lápida",
        category: [ "bearish", "reversal" ],
        reliability: 76,
        timeframe: "30M+",
        description: "Doji con mecha superior larga y sin mecha inferior, indica rechazo en máximos.",
        candles: [
            { open: 100, high: 115, low: 99, close: 100 }
        ],
        context: "En resistencias clave tras subida significativa",
        confirmation: "Vela bajista siguiente",
        entry: "Ruptura bajista del mínimo del doji",
        stopLoss: "Por encima del máximo de la mecha (+5 pips)",
        target: "2-2.5R del riesgo",
        tips: [
            "Sin mecha inferior es señal más fuerte",
            "Mecha superior larga muestra rechazo vendedor",
            "Efectivo en resistencias importantes"
        ]
    },

    long_legged_doji: {
        name: "Doji Extendido",
        category: [ "reversal" ],
        reliability: 65,
        timeframe: "1H+",
        description: "Doji con mechas superior e inferior largas, indica gran indecisión en el mercado.",
        candles: [
            { open: 100, high: 112, low: 88, close: 100 }
        ],
        context: "En niveles clave tras movimientos fuertes, máxima indecisión",
        confirmation: "Dirección definida por vela siguiente con volumen",
        entry: "Ruptura en dirección confirmada",
        stopLoss: "Lado opuesto del rango del doji",
        target: "1.5-2R dependiendo de confirmación",
        tips: [
            "Ambas mechas deben ser significativas",
            "Indica equilibrio perfecto de fuerzas",
            "Requiere confirmación direccional fuerte"
        ]
    },

    piercing_line: {
        name: "Vela Perforante",
        category: [ "bullish", "reversal" ],
        reliability: 80,
        timeframe: "15M+",
        description: "Patrón de dos velas: bajista seguida de alcista que cierra por encima del punto medio.",
        candles: [
            { open: 105, high: 107, low: 88, close: 90 },
            { open: 85, high: 108, low: 83, close: 102 }
        ],
        context: "Final de tendencia bajista con gap down",
        confirmation: "Segunda vela cierra por encima del 50% de la primera",
        entry: "Cierre de la segunda vela",
        stopLoss: "Por debajo del mínimo de la segunda vela (-3 pips)",
        target: "2-3R del riesgo",
        tips: [
            "Gap down entre velas fortalece la señal",
            "Cierre debe superar punto medio de primera vela",
            "Volumen alto en segunda vela es crucial"
        ]
    },

    dark_cloud_cover: {
        name: "Nube Oscura",
        category: [ "bearish", "reversal" ],
        reliability: 78,
        timeframe: "15M+",
        description: "Patrón bajista de dos velas: alcista seguida de bajista que cierra por debajo del punto medio.",
        candles: [
            { open: 88, high: 105, low: 86, close: 103 },
            { open: 108, high: 110, low: 92, close: 95 }
        ],
        context: "Final de tendencia alcista, en resistencias",
        confirmation: "Segunda vela cierra por debajo del 50% de la primera",
        entry: "Cierre de la segunda vela",
        stopLoss: "Por encima del máximo de la segunda vela (+3 pips)",
        target: "2-3R del riesgo",
        tips: [
            "Apertura de segunda vela debe ser gap up",
            "Cierre debe penetrar más del 50% de la primera",
            "Más efectivo en resistencias clave"
        ]
    },

    tweezer_tops: {
        name: "Doble Techo (Pinzas Superiores)",
        category: [ "bearish", "reversal" ],
        reliability: 70,
        timeframe: "30M+",
        description: "Dos o más velas consecutivas con máximos prácticamente iguales, indica resistencia fuerte.",
        candles: [
            { open: 95, high: 110, low: 93, close: 108 },
            { open: 109, high: 110, low: 98, close: 102 }
        ],
        context: "En resistencias importantes, tras tendencia alcista",
        confirmation: "Ruptura bajista del soporte del patrón",
        entry: "Ruptura del mínimo más bajo del patrón",
        stopLoss: "Por encima del máximo común (+3 pips)",
        target: "1.5-2R del riesgo",
        tips: [
            "Máximos deben ser muy similares",
            "Segunda vela debe mostrar rechazo",
            "Más efectivo con volumen alto"
        ]
    },

    tweezer_bottoms: {
        name: "Doble Piso (Pinzas Inferiores)",
        category: [ "bullish", "reversal" ],
        reliability: 72,
        timeframe: "30M+",
        description: "Dos o más velas con mínimos iguales, señala soporte fuerte y posible reversión alcista.",
        candles: [
            { open: 105, high: 107, low: 88, close: 92 },
            { open: 90, high: 98, low: 88, close: 96 }
        ],
        context: "En soportes clave tras tendencia bajista",
        confirmation: "Ruptura alcista de la resistencia del patrón",
        entry: "Ruptura del máximo más alto del patrón",
        stopLoss: "Por debajo del mínimo común (-3 pips)",
        target: "1.5-2R del riesgo",
        tips: [
            "Mínimos deben ser prácticamente idénticos",
            "Segunda vela debe mostrar rechazo alcista",
            "Confirmar con volumen creciente"
        ]
    },

    spinning_top: {
        name: "Peonza",
        category: [ "reversal" ],
        reliability: 60,
        timeframe: "15M+",
        description: "Vela con cuerpo pequeño y mechas largas, indica indecisión y posible cambio de tendencia.",
        candles: [
            { open: 98, high: 108, low: 90, close: 102 }
        ],
        context: "Tras movimientos fuertes, en niveles técnicos importantes",
        confirmation: "Dirección confirmada por vela siguiente",
        entry: "Ruptura en dirección de confirmación",
        stopLoss: "Extremo opuesto del rango",
        target: "1-1.5R dependiendo del contexto",
        tips: [
            "Cuerpo pequeño con mechas largas",
            "Indica equilibrio temporal de fuerzas",
            "Requiere confirmación direccional clara"
        ]
    },

    marubozu_bullish: {
        name: "Vela Fuerte Alcista (Marubozu)",
        category: [ "bullish", "continuation" ],
        reliability: 82,
        timeframe: "15M+",
        description: "Vela verde larga sin mechas, indica presión compradora muy fuerte y continuación alcista.",
        candles: [
            { open: 90, high: 110, low: 90, close: 110 }
        ],
        context: "Durante tendencia alcista o en rupturas importantes",
        confirmation: "Continuación de la presión compradora",
        entry: "En pullback al nivel de apertura",
        stopLoss: "Por debajo de la apertura (-3 pips)",
        target: "Proyección igual al rango de la vela",
        tips: [
            "Sin mechas indica control total de compradores",
            "Muy efectivo en rupturas de resistencias",
            "Señal de continuación muy fuerte"
        ]
    },

    marubozu_bearish: {
        name: "Vela Fuerte Bajista (Marubozu)",
        category: [ "bearish", "continuation" ],
        reliability: 80,
        timeframe: "15M+",
        description: "Vela roja larga sin mechas, muestra presión vendedora extrema y continuación bajista.",
        candles: [
            { open: 110, high: 110, low: 90, close: 90 }
        ],
        context: "Durante tendencia bajista o en rupturas de soportes",
        confirmation: "Continuación de la presión vendedora",
        entry: "En retroceso al nivel de apertura",
        stopLoss: "Por encima de la apertura (+3 pips)",
        target: "Proyección igual al rango de la vela",
        tips: [
            "Ausencia de mechas muestra dominio vendedor",
            "Efectivo en rupturas de soportes clave",
            "Indica continuación bajista fuerte"
        ]
    },

    three_white_soldiers: {
        name: "Tres Velas Verdes Seguidas",
        category: [ "bullish", "reversal" ],
        reliability: 85,
        timeframe: "1H+",
        description: "Tres velas verdes consecutivas con cierres progresivamente más altos, reversión alcista potente.",
        candles: [
            { open: 88, high: 95, low: 87, close: 94 },
            { open: 95, high: 102, low: 94, close: 101 },
            { open: 102, high: 110, low: 101, close: 108 }
        ],
        context: "Final de tendencia bajista con momentum alcista creciente",
        confirmation: "Cada vela abre dentro de la anterior y cierra más alto",
        entry: "Cierre de la tercera vela",
        stopLoss: "Por debajo del mínimo de la primera vela (-5 pips)",
        target: "3-4R del riesgo",
        tips: [
            "Cada vela debe ser progresivamente más fuerte",
            "Volumen creciente refuerza la señal",
            "Una de las reversiones alcistas más confiables"
        ]
    },

    three_black_crows: {
        name: "Tres Velas Rojas Seguidas",
        category: [ "bearish", "reversal" ],
        reliability: 83,
        timeframe: "1H+",
        description: "Tres velas rojas consecutivas con cierres progresivamente más bajos, reversión bajista fuerte.",
        candles: [
            { open: 110, high: 111, low: 103, close: 104 },
            { open: 103, high: 104, low: 96, close: 97 },
            { open: 96, high: 97, low: 88, close: 90 }
        ],
        context: "Final de tendencia alcista con momentum bajista acelerado",
        confirmation: "Cada vela abre dentro de la anterior y cierra más bajo",
        entry: "Cierre de la tercera vela",
        stopLoss: "Por encima del máximo de la primera vela (+5 pips)",
        target: "3-4R del riesgo",
        tips: [
            "Cada vela debe mostrar mayor presión vendedora",
            "Volumen alto fortalece la señal de reversión",
            "Patrón muy confiable en timeframes altos"
        ]
    }
};

// ======================
// Función para crear SVG de vela mejorado (con pequeña mejora de robustez)
// ======================
function createCandleSVG( candle, width = 30, height = 80 ) {
    const { open, high, low, close } = candle;
    const isGreen = close > open;
    const bodyColor = isGreen ? '#10b981' : '#ef4444';
    const wickColor = '#64748b';

    const priceRange = high - low;
    const scale = priceRange === 0 ? 1 : height / priceRange; // evita división por cero

    const bodyTop = Math.max( open, close );
    const bodyBottom = Math.min( open, close );
    const bodyHeight = Math.max( ( bodyTop - bodyBottom ) * scale, 2 );

    const upperWickY = 0;
    const bodyY = ( high - bodyTop ) * scale;
    const lowerWickY = ( high - low ) * scale;

    return `
                <svg width="${width}" height="${height + 20}" class="candle-svg">
                    <!-- Mecha superior -->
                    <line x1="${width / 2}" y1="${upperWickY}" x2="${width / 2}" y2="${bodyY}" 
                          stroke="${wickColor}" stroke-width="2"/>
                    
                    <!-- Cuerpo -->
                    <rect x="${width * 0.25}" y="${bodyY}" width="${width * 0.5}" height="${bodyHeight}" 
                          fill="${bodyColor}" stroke="${bodyColor}" class="candle-body"/>
                    
                    <!-- Mecha inferior -->
                    <line x1="${width / 2}" y1="${bodyY + bodyHeight}" x2="${width / 2}" y2="${lowerWickY}" 
                          stroke="${wickColor}" stroke-width="2"/>
                    
                    <!-- Labels de precio -->
                    <text x="${width + 5}" y="8" class="price-label" font-size="10">H: ${high}</text>
                    <text x="${width + 5}" y="${height - 10}" class="price-label" font-size="10">L: ${low}</text>
                    <text x="${width + 5}" y="${bodyY + bodyHeight / 2}" class="price-label ${isGreen ? 'text-green-400' : 'text-red-400'}" font-size="10">
                        O: ${open} C: ${close}
                    </text>
                </svg>
            `;
}

// ======================
// Función para crear tarjeta de patrón refinada
// ======================
function createPatternCard( patternId, pattern ) {
    const reliabilityColor = pattern.reliability >= 80 ? 'text-green-400' :
        pattern.reliability >= 70 ? 'text-yellow-400' : 'text-red-400';

    const categories = pattern.category.map( cat => {
        const colors = {
            bullish: 'bg-green-500',
            bearish: 'bg-red-500',
            reversal: 'bg-purple-500',
            continuation: 'bg-blue-500'
        };
        const labels = {
            bullish: 'Alcista',
            bearish: 'Bajista',
            reversal: 'Reversión',
            continuation: 'Continuación'
        };
        return `<span class="px-2 py-1 ${colors[ cat ]} text-xs rounded font-medium">${labels[ cat ]}</span>`;
    } ).join( ' ' );

    return `
                <div class="pattern-card bg-card-dark rounded-xl p-5 cursor-pointer" 
                     data-pattern="${patternId}" data-categories="${pattern.category.join( ' ' )}">
                    
                    <!-- Header -->
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg font-bold text-white">${pattern.name}</h3>
                        <div class="text-right">
                            <div class="${reliabilityColor} text-xl font-bold">${pattern.reliability}%</div>
                            <div class="text-xs text-slate-400">Confiabilidad</div>
                        </div>
                    </div>

                    <!-- Badges -->
                    <div class="mb-4 flex gap-1 flex-wrap">
                        ${categories}
                        <span class="px-2 py-1 bg-slate-600 text-xs rounded font-medium">${pattern.timeframe}</span>
                    </div>

                    <!-- Visualización de velas -->
                    <div class="bg-slate-800 rounded-lg p-4 mb-4 min-h-[120px] flex items-center justify-center">
                        <div class="flex gap-2 items-end">
                            ${pattern.candles.map( ( candle, i ) => `
                                <div class="flex flex-col items-center">
                                    ${createCandleSVG( candle, 25, 60 )}
                                    <span class="text-xs text-slate-500 mt-1">${i + 1}</span>
                                </div>
                            `).join( '' )}
                        </div>
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
                    <p class="text-sm text-slate-300 mb-4 line-clamp-3">${pattern.description}</p>

                    <!-- Info trading rápida -->
                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div class="bg-slate-700 rounded p-2">
                            <div class="text-slate-400 mb-1">Contexto</div>
                            <div class="text-blue-300 font-medium truncate">${pattern.context.substring( 0, 25 )}...</div>
                        </div>
                        <div class="bg-slate-700 rounded p-2">
                            <div class="text-slate-400 mb-1">Objetivo</div>
                            <div class="text-green-300 font-medium">${pattern.target}</div>
                        </div>
                    </div>

                    <!-- Botón de acción -->
                    <button class="w-full mt-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold py-2 px-4 rounded-lg transition-all">
                        Ver Análisis Completo
                    </button>
                </div>
            `;
}

// ======================
// Función para mostrar detalles en modal
// ======================
function showPatternDetails( patternId ) {
    const pattern = tradingPatterns[ patternId ];
    if ( !pattern ) return;

    const modal = document.getElementById( 'patternModal' );
    const modalTitle = document.getElementById( 'modalTitle' );
    const modalBadges = document.getElementById( 'modalBadges' );
    const modalContent = document.getElementById( 'modalContent' );

    modalTitle.textContent = pattern.name;

    // Badges en el modal
    const badges = pattern.category.map( cat => {
        const colors = {
            bullish: 'bg-green-500',
            bearish: 'bg-red-500',
            reversal: 'bg-purple-500',
            continuation: 'bg-blue-500'
        };
        const labels = {
            bullish: 'Alcista',
            bearish: 'Bajista',
            reversal: 'Reversión',
            continuation: 'Continuación'
        };
        return `<span class="px-3 py-1 ${colors[ cat ]} text-sm rounded font-medium">${labels[ cat ]}</span>`;
    } ).join( ' ' );

    modalBadges.innerHTML = badges;

    // Contenido del modal
    modalContent.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Columna izquierda: Visualización -->
                    <div class="space-y-6">
                        <div class="bg-slate-700 rounded-xl p-6">
                            <h4 class="text-xl font-semibold mb-4 text-yellow-400">📊 Patrón Visual</h4>
                            <div class="bg-slate-800 rounded-lg p-6 flex justify-center items-center min-h-[200px]">
                                <div class="flex gap-4 items-end">
                                    ${pattern.candles.map( ( candle, i ) => `
                                        <div class="flex flex-col items-center">
                                            ${createCandleSVG( candle, 40, 120 )}
                                            <span class="text-sm text-slate-400 mt-2">Vela ${i + 1}</span>
                                        </div>
                                    `).join( '' )}
                                </div>
                            </div>
                        </div>

                        <div class="bg-slate-700 rounded-xl p-6">
                            <h4 class="text-xl font-semibold mb-4 text-blue-400">📋 Descripción</h4>
                            <p class="text-slate-200 leading-relaxed">${pattern.description}</p>
                        </div>

                        <div class="bg-slate-700 rounded-xl p-6">
                            <h4 class="text-xl font-semibold mb-4 text-purple-400">🎯 Contexto de Mercado</h4>
                            <p class="text-slate-200 leading-relaxed">${pattern.context}</p>
                        </div>
                    </div>

                    <!-- Columna derecha: Trading Info -->
                    <div class="space-y-6">
                        <div class="bg-gradient-to-r from-green-900 to-green-800 bg-opacity-50 rounded-xl p-6">
                            <h4 class="text-xl font-semibold mb-4 text-green-300">💰 Parámetros de Trading</h4>
                            <div class="space-y-4">
                                <div class="bg-slate-800 bg-opacity-50 rounded-lg p-4">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-green-400">🎯</span>
                                        <span class="font-semibold text-green-300">Entrada:</span>
                                    </div>
                                    <p class="text-slate-200 text-sm">${pattern.entry}</p>
                                </div>
                                
                                <div class="bg-slate-800 bg-opacity-50 rounded-lg p-4">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-red-400">🛡️</span>
                                        <span class="font-semibold text-red-300">Stop Loss:</span>
                                    </div>
                                    <p class="text-slate-200 text-sm">${pattern.stopLoss}</p>
                                </div>

                                <div class="bg-slate-800 bg-opacity-50 rounded-lg p-4">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-blue-400">💎</span>
                                        <span class="font-semibold text-blue-300">Objetivo:</span>
                                    </div>
                                    <p class="text-slate-200 text-sm">${pattern.target}</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gradient-to-r from-yellow-900 to-amber-900 bg-opacity-50 rounded-xl p-6">
                            <h4 class="text-xl font-semibold mb-4 text-yellow-300">📊 Métricas</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center">
                                    <div class="text-3xl font-bold text-yellow-400">${pattern.reliability}%</div>
                                    <div class="text-sm text-slate-300">Confiabilidad</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-3xl font-bold text-cyan-400">${pattern.timeframe}</div>
                                    <div class="text-sm text-slate-300">Timeframe</div>
                                </div>
                            </div>
                            <div class="w-full bg-slate-600 rounded-full h-3 mt-4">
                                <div class="reliability-bar rounded-full h-3" style="width: ${pattern.reliability}%"></div>
                            </div>
                        </div>

                        <div class="bg-slate-700 rounded-xl p-6">
                            <h4 class="text-xl font-semibold mb-4 text-purple-400">✅ Confirmación</h4>
                            <p class="text-slate-200 leading-relaxed">${pattern.confirmation}</p>
                        </div>

                        <div class="bg-gradient-to-r from-indigo-900 to-purple-900 bg-opacity-50 rounded-xl p-6">
                            <h4 class="text-xl font-semibold mb-4 text-indigo-300">💡 Tips Profesionales</h4>
                            <ul class="space-y-3">
                                ${pattern.tips.map( tip => `
                                    <li class="flex items-start gap-2">
                                        <span class="text-yellow-400 text-sm">▶</span>
                                        <span class="text-slate-200 text-sm">${tip}</span>
                                    </li>
                                `).join( '' )}
                            </ul>
                        </div>
                    </div>
                </div>
            `;

    modal.classList.remove( 'hidden' );
    modal.classList.add( 'flex' );
}

// ======================
// Función para filtrar patrones
// ======================
function filterPatterns( category ) {
    const cards = document.querySelectorAll( '.pattern-card' );
    let visibleCount = 0;

    cards.forEach( card => {
        const categories = card.dataset.categories;
        if ( category === 'all' || categories.includes( category ) ) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    } );

    // Actualizar botones activos
    document.querySelectorAll( '.category-button' ).forEach( btn => {
        btn.classList.remove( 'active' );
        if ( btn.dataset.category === category ) {
            btn.classList.add( 'active' );
        }
    } );

    updateStats( category );
}

// ======================
// Función para actualizar estadísticas
// ======================
function updateStats( category ) {
    const patterns = Object.values( tradingPatterns );
    let filteredPatterns = patterns;

    if ( category !== 'all' ) {
        filteredPatterns = patterns.filter( p => p.category.includes( category ) );
    }

    const totalPatterns = filteredPatterns.length;
    const avgReliability = totalPatterns === 0 ? 0 : Math.round( filteredPatterns.reduce( ( sum, p ) => sum + p.reliability, 0 ) / totalPatterns );
    const reversalCount = filteredPatterns.filter( p => p.category.includes( 'reversal' ) ).length;
    const continuationCount = filteredPatterns.filter( p => p.category.includes( 'continuation' ) ).length;

    const elTotal = document.getElementById( 'totalPatterns' );
    const elAvg = document.getElementById( 'avgReliability' );
    const elRev = document.getElementById( 'reversalCount' );
    const elCont = document.getElementById( 'continuationCount' );

    if ( elTotal ) elTotal.textContent = totalPatterns;
    if ( elAvg ) elAvg.textContent = avgReliability + '%';
    if ( elRev ) elRev.textContent = reversalCount;
    if ( elCont ) elCont.textContent = continuationCount;
}

// ======================
// Función para búsqueda
// ======================
function searchPatterns( searchTerm ) {
    const cards = document.querySelectorAll( '.pattern-card' );

    cards.forEach( card => {
        const patternId = card.dataset.pattern;
        const pattern = tradingPatterns[ patternId ];
        const searchableText = `${pattern.name} ${pattern.description} ${pattern.context} ${pattern.category.join( ' ' )}`.toLowerCase();

        if ( searchTerm === '' || searchableText.includes( searchTerm.toLowerCase() ) ) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    } );
}

// ======================
// Función de inicialización
// ======================
function init() {
    const grid = document.getElementById( 'patternsGrid' );
    if ( !grid ) return;

    // Generar tarjetas de patrones
    Object.entries( tradingPatterns ).forEach( ( [ patternId, pattern ] ) => {
        grid.innerHTML += createPatternCard( patternId, pattern );
    } );

    // Event listeners para tarjetas
    grid.addEventListener( 'click', ( e ) => {
        const card = e.target.closest( '.pattern-card' );
        if ( card ) {
            const patternId = card.dataset.pattern;
            showPatternDetails( patternId );
        }
    } );

    // Event listeners para filtros de categoría
    document.querySelectorAll( '.category-button' ).forEach( btn => {
        btn.addEventListener( 'click', () => {
            filterPatterns( btn.dataset.category );
        } );
    } );

    // Event listener para búsqueda
    const searchInput = document.getElementById( 'searchInput' );
    if ( searchInput ) {
        searchInput.addEventListener( 'input', ( e ) => {
            searchPatterns( e.target.value );
        } );
    }

    // Event listener para cerrar modal
    const closeModalEl = document.getElementById( 'closeModal' );
    if ( closeModalEl ) {
        closeModalEl.addEventListener( 'click', () => {
            const modal = document.getElementById( 'patternModal' );
            if ( modal ) {
                modal.classList.add( 'hidden' );
                modal.classList.remove( 'flex' );
            }
        } );
    }

    // Cerrar modal con click fuera
    const patternModalEl = document.getElementById( 'patternModal' );
    if ( patternModalEl ) {
        patternModalEl.addEventListener( 'click', ( e ) => {
            if ( e.target === patternModalEl ) {
                patternModalEl.classList.add( 'hidden' );
                patternModalEl.classList.remove( 'flex' );
            }
        } );
    }

    // Cerrar modal con ESC
    document.addEventListener( 'keydown', ( e ) => {
        if ( e.key === 'Escape' ) {
            const modal = document.getElementById( 'patternModal' );
            if ( modal ) {
                modal.classList.add( 'hidden' );
                modal.classList.remove( 'flex' );
            }
        }
    } );

    // Inicializar estadísticas
    updateStats( 'all' );
}

// Inicializar cuando el DOM esté listo
document.addEventListener( 'DOMContentLoaded', init );
