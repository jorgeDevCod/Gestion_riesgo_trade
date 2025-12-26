// ===== SCHEMA DE ESTRATEGIAS =====

const StrategySchema = {
  id: String,              // UUID único generado automáticamente
  name: String,            // Nombre de la estrategia
  emoji: String,           // Emoji representativo (opcional)
  
  // Configuración de señales
  signals: [
    {
      id: String,          // ID único de señal
      description: String, // Descripción de la señal
      type: String,        // 'setup' | 'confirmation' | 'reinforcement'
      timeframe: String,   // '4H', '1H', '15M', '5M', '3M'
      weight: Number,      // Peso en el score (1-10)
      required: Boolean    // Si es obligatoria para ejecutar
    }
  ],
  
  // Temporalidades principales
  timeframes: {
    primary: String,       // Ej: '4H/1H'
    secondary: String,     // Ej: '15M/5M'
    execution: String      // Ej: '5M/3M'
  },
  
  // Configuración de riesgo
  risk: {
    percent: Number,       // % del capital a arriesgar (0.5 - 5)
    minPercent: Number,    // Mínimo recomendado
    maxPercent: Number,    // Máximo permitido
    stopLoss: Number,      // SL en pips
    takeProfit1: Number,   // TP1 en pips
    takeProfit2: Number,   // TP2 en pips (opcional)
    rrRatio: Number        // Relación Riesgo:Recompensa (ej: 2.5)
  },
  
  // Métricas históricas
  metrics: {
    winRate: Number,       // Win rate esperado (%)
    avgProfit: Number,     // Ganancia promedio por trade
    avgLoss: Number,       // Pérdida promedio por trade
    totalTrades: Number,   // Total de trades ejecutados
    profitFactor: Number   // Factor de beneficio
  },
  
  // Configuración adicional
  settings: {
    active: Boolean,       // Si está activa para usar
    type: String,          // 'principal' | 'secundaria' | 'especial'
    category: String,      // 'trend' | 'reversal' | 'range' | 'breakout'
    minScore: Number,      // Score mínimo para ejecutar (60-90)
    description: String    // Descripción breve
  },
  
  // Metadata
  metadata: {
    createdAt: String,     // ISO timestamp
    updatedAt: String,     // ISO timestamp
    createdBy: String,     // User ID
    version: Number,       // Versión de la estrategia
    tags: [String]         // Tags para búsqueda
  }
};

// ===== ESTRATEGIAS POR DEFECTO =====
const DefaultStrategies = [
  {
    id: "regulares",
    name: "Trades Regulares",
    emoji: "📈",
    signals: [
      {
        id: "reg_1",
        description: "4H/1H: Estructura Alcista/Bajista + MACD sin divergencia",
        type: "setup",
        timeframe: "4H/1H",
        weight: 8,
        required: true
      },
      {
        id: "reg_2",
        description: "4H y 1H: Detectar fin de impulso con Fibonacci",
        type: "setup",
        timeframe: "4H/1H",
        weight: 7,
        required: true
      },
      {
        id: "reg_3",
        description: "1H y 15M: Williams%R saliendo de extremos",
        type: "confirmation",
        timeframe: "1H/15M",
        weight: 9,
        required: true
      },
      {
        id: "reg_4",
        description: "1H y 15M: EMA21>EMA50 en dirección del trade",
        type: "confirmation",
        timeframe: "1H/15M",
        weight: 8,
        required: false
      },
      {
        id: "reg_5",
        description: "15M/5M: Validación con volumen y patrón",
        type: "reinforcement",
        timeframe: "15M/5M",
        weight: 10,
        required: true
      },
      {
        id: "reg_6",
        description: "5M/3M: Retesteo en EMA21/EMA50 + volumen",
        type: "reinforcement",
        timeframe: "5M/3M",
        weight: 9,
        required: true
      }
    ],
    timeframes: {
      primary: "4H/1H",
      secondary: "15M/5M",
      execution: "5M/3M"
    },
    risk: {
      percent: 2.5,
      minPercent: 2.0,
      maxPercent: 5.0,
      stopLoss: 6,
      takeProfit1: 13,
      takeProfit2: 24,
      rrRatio: 2.2
    },
    metrics: {
      winRate: 65,
      avgProfit: 45,
      avgLoss: 20,
      totalTrades: 0,
      profitFactor: 2.25
    },
    settings: {
      active: true,
      type: "principal",
      category: "trend",
      minScore: 70,
      description: "Estrategia principal basada en estructura y confluencias"
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      version: 1,
      tags: ["estructura", "williams", "ema", "tendencia"]
    }
  },
  {
    id: "estructura-confluencia",
    name: "Estructura + Confluencia",
    emoji: "🎯",
    signals: [
      {
        id: "ec_1",
        description: "4H/1H: Tendencia clara con máx/mín consecutivos",
        type: "setup",
        timeframe: "4H/1H",
        weight: 10,
        required: true
      },
      {
        id: "ec_2",
        description: "4H/1H: Zonas de confluencia S/R + Fibonacci",
        type: "setup",
        timeframe: "4H/1H",
        weight: 9,
        required: true
      },
      {
        id: "ec_3",
        description: "1H y 15M: MACD cruzando en dirección correcta",
        type: "confirmation",
        timeframe: "1H/15M",
        weight: 8,
        required: true
      },
      {
        id: "ec_4",
        description: "15M: Validación en zona con patrón claro",
        type: "confirmation",
        timeframe: "15M",
        weight: 9,
        required: true
      },
      {
        id: "ec_5",
        description: "15M y 5M: Estocástico en zona correcta",
        type: "reinforcement",
        timeframe: "15M/5M",
        weight: 7,
        required: false
      },
      {
        id: "ec_6",
        description: "5M/3M: Reacción en zona clave con volumen",
        type: "reinforcement",
        timeframe: "5M/3M",
        weight: 10,
        required: true
      }
    ],
    timeframes: {
      primary: "4H/1H",
      secondary: "1H/15M",
      execution: "5M/3M"
    },
    risk: {
      percent: 2.5,
      minPercent: 2.0,
      maxPercent: 4.0,
      stopLoss: 5,
      takeProfit1: 12,
      takeProfit2: 18,
      rrRatio: 2.4
    },
    metrics: {
      winRate: 70,
      avgProfit: 50,
      avgLoss: 18,
      totalTrades: 0,
      profitFactor: 2.78
    },
    settings: {
      active: true,
      type: "principal",
      category: "reversal",
      minScore: 75,
      description: "Alta precisión con múltiples confluencias"
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      version: 1,
      tags: ["confluencia", "fibonacci", "macd", "precision"]
    }
  },
  {
    id: "ema-macd",
    name: "EMA + MACD",
    emoji: "📊",
    signals: [
      {
        id: "em_1",
        description: "4H: MACD sin divergencia bajista",
        type: "setup",
        timeframe: "4H",
        weight: 9,
        required: true
      },
      {
        id: "em_2",
        description: "4H: Precio rompe 2+ S/R y retestea",
        type: "setup",
        timeframe: "4H",
        weight: 8,
        required: true
      },
      {
        id: "em_3",
        description: "4H/1H: Precio sobre/bajo EMA21/50",
        type: "confirmation",
        timeframe: "4H/1H",
        weight: 7,
        required: false
      },
      {
        id: "em_4",
        description: "1H: Precio cruza EMA21>EMA50 con volumen",
        type: "confirmation",
        timeframe: "1H",
        weight: 9,
        required: true
      },
      {
        id: "em_5",
        description: "15M: MACD líneas e histograma cambiando",
        type: "reinforcement",
        timeframe: "15M",
        weight: 8,
        required: true
      },
      {
        id: "em_6",
        description: "5M/3M: Rebote en EMAs + histograma",
        type: "reinforcement",
        timeframe: "5M/3M",
        weight: 10,
        required: true
      }
    ],
    timeframes: {
      primary: "4H/1H",
      secondary: "15M",
      execution: "5M/3M"
    },
    risk: {
      percent: 3.0,
      minPercent: 3.0,
      maxPercent: 5.0,
      stopLoss: 8,
      takeProfit1: 18,
      takeProfit2: 32,
      rrRatio: 2.8
    },
    metrics: {
      winRate: 62,
      avgProfit: 55,
      avgLoss: 22,
      totalTrades: 0,
      profitFactor: 2.5
    },
    settings: {
      active: true,
      type: "principal",
      category: "trend",
      minScore: 70,
      description: "Seguimiento de tendencias fuertes"
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      version: 1,
      tags: ["ema", "macd", "tendencia", "momentum"]
    }
  },
  {
    id: "contra-tendencia",
    name: "Contra-Tendencia",
    emoji: "⚡",
    signals: [
      {
        id: "ct_1",
        description: "4H/1H: ChoCH o rechazo en zona relevante",
        type: "setup",
        timeframe: "4H/1H",
        weight: 10,
        required: true
      },
      {
        id: "ct_2",
        description: "4H/1H: EMAs cruzándose o aplanándose",
        type: "setup",
        timeframe: "4H/1H",
        weight: 8,
        required: true
      },
      {
        id: "ct_3",
        description: "1H/15M: Divergencia MACD clara",
        type: "confirmation",
        timeframe: "1H/15M",
        weight: 9,
        required: true
      },
      {
        id: "ct_4",
        description: "1H/15M: Williams %R saliendo de extremo",
        type: "confirmation",
        timeframe: "1H/15M",
        weight: 9,
        required: true
      },
      {
        id: "ct_5",
        description: "15M: Patrón de reversión visible",
        type: "reinforcement",
        timeframe: "15M",
        weight: 8,
        required: false
      },
      {
        id: "ct_6",
        description: "5M: Volumen en ruptura >1.25x promedio",
        type: "reinforcement",
        timeframe: "5M",
        weight: 7,
        required: false
      },
      {
        id: "ct_7",
        description: "5M/3M: Pullback suave con volumen decreciente",
        type: "reinforcement",
        timeframe: "5M/3M",
        weight: 8,
        required: true
      }
    ],
    timeframes: {
      primary: "4H/1H",
      secondary: "1H/15M",
      execution: "5M/3M"
    },
    risk: {
      percent: 2.2,
      minPercent: 1.8,
      maxPercent: 2.8,
      stopLoss: 6,
      takeProfit1: 10,
      takeProfit2: 17,
      rrRatio: 2.8
    },
    metrics: {
      winRate: 62,
      avgProfit: 38,
      avgLoss: 16,
      totalTrades: 0,
      profitFactor: 2.38
    },
    settings: {
      active: true,
      type: "especial",
      category: "reversal",
      minScore: 75,
      description: "Reversiones intradía con alta precisión"
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      version: 1,
      tags: ["reversal", "divergencia", "contra-tendencia", "williams"]
    }
  }
];

// ===== INTEGRACIÓN CON GLOBALS =====
// Hacer disponible globalmente para compatibilidad
if (typeof window !== 'undefined') {
  window.DefaultStrategies = DefaultStrategies;
  window.StrategySchema = StrategySchema;
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StrategySchema, DefaultStrategies };
}
