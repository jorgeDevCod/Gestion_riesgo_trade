// Configuración de factores de confluencia
const CONFLUENCE_FACTORS = {

    // 1️⃣ CONTEXTO REAL (solo lo que importa)
    marketContext: {
        label: "H1/H4: tendencia definida o rango identificado",
        category: "context",
        checked: false
    },

    // 2️⃣ LIQUIDEZ / EXTREMOS
    liquidityZone: {
        label: "Precio en zona de liquidez o Soporte/Resistencia en 1h/15m",
        category: "liquidity",
        checked: false
    },

    // 3️⃣ ESTRUCTURA EN LTF (5M)
    structureShift: {
        label: "H1/15M: Precio en cambio de estructura o validacion de zona macro",
        category: "structure",
        checked: false
    },

    // 4️⃣ ACCIÓN DEL PRECIO (CLAVE)
    priceReaction: {
        label: "Rechazo o roptura clara del nivel (mechas contrarias, absorción o envolventes)",
        category: "price",
        checked: false
    },

    // 4️⃣ ACCIÓN DEL PRECICLAVE)
    priceReaction2: {
        label: "Precio en rangos post-caida/subida rapida + vela de rechazo o manipulación",
        category: "price",
        checked: false
    },

    // 5️⃣ CONFIRMACIÓN DE TIMING (NO DIRECCIÓN)
    volumeConfirmation: {
        label: "Volumen confirma reacción (clímax, absorción o expansión)",
        category: "indicator",
        checked: false
    },

    williamsConfirmation: {
        label: "Williams %R en extremo y saliendo de sobreventa/sobrecompra en 15M/5m",
        category: "indicator",
        checked: false
    },

    mfiConfirmation: {
        label: "MFI confirma y acompaña direccion de precio y %R en 15M/5m | Divergencia a favor de trade",
        category: "indicator",
        checked: false
    },

    // 6️⃣ GATILLO FINAL
    entryTrigger: {
        label: "Cierre de vela de confirmacion de pullback post-roptura o rechazo de zona validada",
        category: "entry",
        checked: false
    }
};


// Tabla de referencia de patrones (según tu documento original)
const REFERENCE_PATTERNS = [
    {
        vela: "Verde grande",
        volumen: "Alto",
        interpretacionSR: {
            soporte: "Compra segura",
            resistencia: "Ruptura confiable"
        },
        confluencia: "W%R saliendo de sobreventa; MACD cruce alcista; Precio sobre EMA 21"
    },
    {
        vela: "Roja grande",
        volumen: "Alto",
        interpretacionSR: {
            soporte: "Ruptura bajista",
            resistencia: "Rechazo fuerte"
        },
        confluencia: "W%R cayendo bajo -80; MACD cruce bajista; Precio debajo EMA 21"
    },
    {
        vela: "Verde pequeña",
        volumen: "Alto",
        interpretacionSR: {
            soporte: "Absorción de ventas",
            resistencia: "Absorción de compras"
        },
        confluencia: "Confirmar con W%R y MACD divergentes"
    },
    {
        vela: "Roja pequeña",
        volumen: "Alto",
        interpretacionSR: {
            soporte: "Absorción compradora",
            resistencia: "Absorción vendedora"
        },
        confluencia: "W%R divergente; MACD confirmando giro"
    }
];

// Reglas de eficiencia (según tu documento)
const TRADING_RULES = [
    "1. Volumen confirma rupturas o rechazos",
    "2. Williams %R muestra fuerza o agotamiento",
    "3. MACD confirma dirección, no se usa como gatillo principal",
    "4. Medias móviles indican el camino de la tendencia",
    "5. Operar solo cuando al menos 2 factores confluyen junto con vela y volumen",
    "6. Limitarse a 1-3 operaciones diarias de alta calidad"
];

// Flujo de decisión (según tu documento)
const DECISION_FLOW = [
    "1. Revisar 1H/4H → Identificar dirección general de tendencia",
    "2. Observar 15M → Validar soporte/resistencia con volumen y velas",
    "3. Confirmar con W%R y MACD en 15M",
    "4. Ejecutar entrada en 5M con stop ajustado (5-10 pips)"
];

class ConfluenceAnalyzer {
    constructor() {
        this.factors = { ...CONFLUENCE_FACTORS };
        this.isOpen = false;
        this.init();
    }

    init() {
        this.loadState();
        this.bindEvents();
        this.generateChecklist();
        this.generateReferenceTable();
        this.generateRulesContent(); // Agregar esta línea
        this.updateProbability();
    }

    bindEvents() {
        // Toggle panel
        document.getElementById( 'confluenceToggle' ).addEventListener( 'click', () => {
            this.togglePanel();
        } );

        document.getElementById( 'confluenceClose' ).addEventListener( 'click', () => {
            this.closePanel();
        } );

        // Acceso rápido con tecla 'C'
        document.addEventListener( 'keydown', ( e ) => {
            if ( e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.altKey ) {
                if ( document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' ) {
                    this.togglePanel();
                }
            }
        } );

        // Reset y guardar
        document.getElementById( 'resetFactors' ).addEventListener( 'click', () => {
            this.resetFactors();
        } );

        document.getElementById( 'saveAnalysis' ).addEventListener( 'click', () => {
            this.saveAnalysis();
        } );

        // Toggle tabla referencia
        document.getElementById( 'toggleReference' ).addEventListener( 'click', () => {
            this.toggleReference();
        } );

        // Toggle reglas (agregar esta línea si tienes el botón)
        const rulesButton = document.getElementById( 'toggleRules' );
        if ( rulesButton ) {
            rulesButton.addEventListener( 'click', () => {
                this.toggleRules();
            } );
        }
    }

    generateChecklist() {
        const container = document.getElementById( 'confluenceChecklist' );
        container.innerHTML = '';

        Object.entries( this.factors ).forEach( ( [ key, factor ] ) => {
            const item = document.createElement( 'div' );
            item.className = 'flex items-center space-x-2 p-2 rounded hover:bg-gray-800 transition-colors';

            item.innerHTML = `
                <input type="checkbox" 
                       id="factor_${key}" 
                       class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                       ${factor.checked ? 'checked' : ''}>
                <label for="factor_${key}" class="flex-1 text-sm cursor-pointer">
                    ${factor.label}
                </label>
                <span class="text-xs px-2 py-1 rounded ${this.getCategoryColor( factor.category )}">
                    ${factor.category}
                </span>
            `;

            // Event listener para checkbox
            item.querySelector( 'input' ).addEventListener( 'change', ( e ) => {
                this.toggleFactor( key, e.target.checked );
            } );

            container.appendChild( item );
        } );
    }

    getCategoryColor( category ) {
        const colors = {
            timeframe: 'bg-blue-600 text-blue-100',
            indicator: 'bg-green-600 text-green-100',
            price: 'bg-purple-600 text-purple-100'
        };
        return colors[ category ] || 'bg-gray-600 text-gray-100';
    }

    toggleFactor( key, checked ) {
        this.factors[ key ].checked = checked;
        this.updateProbability();
        this.saveState();
    }

    updateProbability() {
        const totalFactors = Object.keys( this.factors ).length;
        const checkedFactors = Object.values( this.factors )
            .filter( factor => factor.checked ).length;

        const probability = Math.round( ( checkedFactors / totalFactors ) * 100 );

        // Actualizar UI
        document.getElementById( 'probabilityText' ).textContent = `${probability}%`;

        const bar = document.getElementById( 'probabilityBar' );
        bar.style.width = `${probability}%`;

        // Cambiar color según probabilidad
        if ( probability >= 70 ) {
            bar.className = 'h-3 rounded-full transition-all duration-500 bg-green-500';
            document.getElementById( 'recommendation' ).textContent = 'ALTA PROBABILIDAD';
            document.getElementById( 'recommendation' ).className = 'text-center mt-2 text-sm font-medium text-green-400';
        } else if ( probability >= 40 ) {
            bar.className = 'h-3 rounded-full transition-all duration-500 bg-yellow-500';
            document.getElementById( 'recommendation' ).textContent = 'PRECAUCIÓN';
            document.getElementById( 'recommendation' ).className = 'text-center mt-2 text-sm font-medium text-yellow-400';
        } else {
            bar.className = 'h-3 rounded-full transition-all duration-500 bg-red-500';
            document.getElementById( 'recommendation' ).textContent = 'NO OPERAR';
            document.getElementById( 'recommendation' ).className = 'text-center mt-2 text-sm font-medium text-red-400';
        }
    }

    togglePanel() {
        const panel = document.getElementById( 'confluencePanel' );
        this.isOpen = !this.isOpen;

        if ( this.isOpen ) {
            panel.classList.add( 'show' );
        } else {
            panel.classList.remove( 'show' );
        }
    }

    closePanel() {
        this.isOpen = false;
        const panel = document.getElementById( 'confluencePanel' );
        panel.classList.remove( 'show' );
    }

    resetFactors() {
        Object.keys( this.factors ).forEach( key => {
            this.factors[ key ].checked = false;
        } );
        this.generateChecklist();
        this.updateProbability();
        this.saveState();
    }

    saveAnalysis() {
        const analysis = {
            timestamp: new Date().toISOString(),
            factors: { ...this.factors },
            probability: this.calculateProbability()
        };

        // Guardar en historial
        const history = JSON.parse( localStorage.getItem( 'confluenceHistory' ) || '[]' );
        history.unshift( analysis );
        history.splice( 10 ); // Mantener solo los últimos 10
        localStorage.setItem( 'confluenceHistory', JSON.stringify( history ) );

        // Feedback visual
        const btn = document.getElementById( 'saveAnalysis' );
        const originalText = btn.textContent;
        btn.textContent = '✓ Guardado';
        btn.classList.add( 'bg-green-600' );

        setTimeout( () => {
            btn.textContent = originalText;
            btn.classList.remove( 'bg-green-600' );
        }, 1500 );
    }

    calculateProbability() {
        const total = Object.keys( this.factors ).length;
        const checked = Object.values( this.factors ).filter( f => f.checked ).length;
        return Math.round( ( checked / total ) * 100 );
    }

    saveState() {
        localStorage.setItem( 'confluenceFactors', JSON.stringify( this.factors ) );
    }

    loadState() {
        const saved = localStorage.getItem( 'confluenceFactors' );
        if ( saved ) {
            this.factors = { ...this.factors, ...JSON.parse( saved ) };
        }
    }

    generateReferenceTable() {
        const container = document.getElementById( 'referenceTable' );
        container.innerHTML = REFERENCE_PATTERNS.map( pattern => `
            <div class="bg-gray-800 p-3 rounded-lg mb-3 border-l-4 border-blue-500">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="font-semibold text-yellow-400">${pattern.vela}</span>
                        <span class="text-xs bg-gray-700 px-2 py-1 rounded">Vol: ${pattern.volumen}</span>
                    </div>
                </div>
                
                <div class="space-y-2 text-xs">
                    <div class="grid grid-cols-1 gap-1">
                        <div class="flex">
                            <span class="font-medium text-green-400 w-20">Soporte:</span>
                            <span class="text-gray-300">${pattern.interpretacionSR.soporte}</span>
                        </div>
                        <div class="flex">
                            <span class="font-medium text-red-400 w-20">Resistencia:</span>
                            <span class="text-gray-300">${pattern.interpretacionSR.resistencia}</span>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-700 pt-2">
                        <div class="text-blue-300">
                            <span class="font-medium">Confluencia:</span>
                            <div class="text-gray-300 mt-1 leading-relaxed">${pattern.confluencia}</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join( '' );
    }

    toggleReference() {
        const table = document.getElementById( 'referenceTable' );
        const arrow = document.getElementById( 'referenceArrow' );

        if ( table.classList.contains( 'hidden' ) ) {
            table.classList.remove( 'hidden' );
            arrow.classList.add( 'rotate-180' );
        } else {
            table.classList.add( 'hidden' );
            arrow.classList.remove( 'rotate-180' );
        }
    }

    generateRulesContent() {
        const container = document.getElementById( 'rulesContent' );
        if ( !container ) return; // Si no existe el contenedor, no hacer nada

        const rulesHTML = TRADING_RULES.map( rule =>
            `<div class="text-gray-300 py-1">${rule}</div>`
        ).join( '' );

        const flowHTML = `
            <div class="mt-3 pt-3 border-t border-gray-700">
                <div class="font-medium text-blue-400 mb-2">Flujo de Decisión:</div>
                ${DECISION_FLOW.map( step =>
            `<div class="text-gray-300 py-1">${step}</div>`
        ).join( '' )}
            </div>
        `;

        container.innerHTML = rulesHTML + flowHTML;
    }

    toggleRules() {
        const content = document.getElementById( 'rulesContent' );
        const arrow = document.getElementById( 'rulesArrow' );

        if ( content && arrow ) {
            if ( content.classList.contains( 'hidden' ) ) {
                content.classList.remove( 'hidden' );
                arrow.classList.add( 'rotate-180' );
            } else {
                content.classList.add( 'hidden' );
                arrow.classList.remove( 'rotate-180' );
            }
        }
    }
}


// Inicializar cuando el DOM esté listo
document.addEventListener( 'DOMContentLoaded', () => {
    new ConfluenceAnalyzer();
} );
