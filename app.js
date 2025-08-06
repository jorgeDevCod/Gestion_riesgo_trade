// Variables globales
let trades = [];
let observations = [];
let currentCapital = parseFloat( localStorage.getItem( 'currentCapital' ) || '1930' );
let currentTab = 'dashboard';

// Configuraciones de estrategias corregidas
const strategyConfigs = {
    'regulares': {
        name: 'Trades Regulares',
        riskPercent: 2.0, // Promedio entre 1.5-2.5%
        stopLoss: 6,
        takeProfit1: 13,
        takeProfit2: 24,
        winRate: 55,
        rrRatio: 2.2
    },
    'ema-macd': {
        name: 'EMA + MACD',
        riskPercent: 3.0,
        stopLoss: 5,
        takeProfit1: 12,
        takeProfit2: 22,
        winRate: 62,
        rrRatio: 2.4
    },
    'contra-tendencia': {
        name: 'Contra-Tendencia',
        riskPercent: 2.5,
        stopLoss: 6,
        takeProfit1: 15,
        takeProfit2: 28,
        winRate: 48,
        rrRatio: 2.8
    },
    'extremos': {
        name: 'Trades Extremos',
        riskPercent: 3.0,
        stopLoss: 5,
        takeProfit1: 13,
        takeProfit2: 25,
        winRate: 65,
        rrRatio: 2.6
    }
};

// Setup checklists para cada estrategia
const setupChecklists = {
    'regulares': [
        'Estructura mínimos/máximos en dirección correcta (4H)',
        'Williams %R en zona objetivo y moviéndose correctamente',
        'MACD cambiando dirección + histograma cambiando color',
        'Precio en/cerca de nivel clave (soporte/resistencia)',
        'Volumen > 1.2x promedio en vela de señal',
        'Confirmación 15M: Mecha larga >4 pips + cuerpo pequeño',
        'Williams %R 15M en zona -20 a -40',
        'Incremento volumen acompañando precio'
    ],
    'ema-macd': [
        'EMA 21 cruza EMA 50 con separación >3 pips',
        'MACD: Línea cruza por encima/debajo de señal',
        'Precio en zona soporte/resistencia clave',
        'Williams %R saliendo de extremo hacia objetivo',
        'Histograma MACD creciendo/decreciendo 2+ velas',
        'Precio manteniéndose respecto EMA 21 por 2+ velas',
        'Vela confirmando EMA y MACD en misma dirección'
    ],
    'contra-tendencia': [
        'Tendencia fuerte 3+ días consecutivos (4H)',
        'Williams %R en extremos 4+ velas 4H (-95/-85 o -15/-5)',
        'Precio alejado 30+ pips de EMA 21 en 4H',
        'Divergencia clara MACD 4H',
        'Precio llegando a soporte/resistencia extrema ±3 pips',
        'Williams %R 15M divergencia clara',
        'Vela rechazo: mecha 6-7+ pips + cuerpo direccional',
        'Volumen rechazo 1.8x promedio',
        '2+ velas consecutivas cuerpos 4+ pips (5M)',
        'Cierre 50%+ rango vela rechazo'
    ],
    'extremos': [
        'Precio en zona crítica histórica ±5 pips',
        'Williams %R extremo 4H (-95/-85 o -15/-5)',
        'Mecha institucional 4H: 8+ pips tras movimiento 35+ pips',
        'Volumen explosivo: 4H 2x + 1H 1.8x promedio',
        'EMA confluencia: Precio superando/cayendo EMA 21/50',
        'MACD triple divergencia: 4H, 1H y 15M',
        'Confirmación 15M: Rebote/rechazo EMA o nivel',
        'Mínimo 7 factores de confluencia cumplidos'
    ]
};

// Inicialización
document.addEventListener( 'DOMContentLoaded', function () {
    loadData();
    initializeApp();
    updateTime();
    setInterval( updateTime, 1000 );
} );

function loadData() {
    try {
        trades = JSON.parse( localStorage.getItem( 'trades' ) || '[]' );
        observations = JSON.parse( localStorage.getItem( 'observations' ) || '[]' );
    } catch ( e ) {
        trades = [];
        observations = [];
    }
}

function initializeApp() {
    setupEventListeners();
    updateCapitalDisplay();
    updateDashboard();
    renderTrades();
    updateStrategyCalculator();
    generateSetupChecklist();
    renderObservations();
    updateDisciplineMetrics();

    // Establecer fecha actual en formularios
    const today = new Date().toISOString().split( 'T' )[ 0 ];
    document.getElementById( 'tradeDate' ).value = today;
}

function setupEventListeners() {
    // Navegación de tabs
    document.querySelectorAll( '.tab-btn' ).forEach( btn => {
        btn.addEventListener( 'click', function () {
            switchTab( this.dataset.tab );
        } );
    } );

    // Capital input
    document.getElementById( 'capitalInput' ).addEventListener( 'input', function () {
        currentCapital = parseFloat( this.value ) || 0;
        localStorage.setItem( 'currentCapital', currentCapital.toString() );
        updateCapitalDisplay();
        updateStrategyCalculator();
        updateDashboard();
    } );

    // Strategy selector
    document.getElementById( 'strategySelect' ).addEventListener( 'change', updateStrategyCalculator );

    // Trade management
    document.getElementById( 'addTradeBtn' ).addEventListener( 'click', showTradeModal );
    document.getElementById( 'cancelTradeBtn' ).addEventListener( 'click', hideTradeModal );
    document.getElementById( 'tradeForm' ).addEventListener( 'submit', handleTradeSubmit );
    document.getElementById( 'exportTradesBtn' ).addEventListener( 'click', exportTrades );

    // Filtros
    document.getElementById( 'filterStrategy' ).addEventListener( 'change', renderTrades );
    document.getElementById( 'filterResult' ).addEventListener( 'change', renderTrades );
    document.getElementById( 'filterDate' ).addEventListener( 'change', renderTrades );

    // Setup checker
    document.getElementById( 'setupStrategy' ).addEventListener( 'change', generateSetupChecklist );
    document.getElementById( 'executeSetupBtn' ).addEventListener( 'click', executeSetup );
    document.getElementById( 'discardSetupBtn' ).addEventListener( 'click', discardSetup );

    // Observations
    document.getElementById( 'addObservationBtn' ).addEventListener( 'click', addObservation );
}

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString( 'es-PE', {
        timeZone: 'America/Lima',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    } );
    document.getElementById( 'currentTime' ).textContent = timeString;
}

function switchTab( tabName ) {
    currentTab = tabName;

    // Actualizar botones
    document.querySelectorAll( '.tab-btn' ).forEach( btn => {
        btn.classList.remove( 'active', 'border-gold', 'text-gold' );
        btn.classList.add( 'border-transparent' );
    } );

    document.querySelector( `[data-tab="${tabName}"]` ).classList.add( 'active', 'border-gold', 'text-gold' );

    // Mostrar contenido
    document.querySelectorAll( '.tab-content' ).forEach( content => {
        content.classList.add( 'hidden' );
    } );

    document.getElementById( tabName ).classList.remove( 'hidden' );
}

function updateCapitalDisplay() {
    const maxRisk = currentCapital * 0.05;

    document.getElementById( 'dashCapital' ).textContent = `${currentCapital.toLocaleString()}`;
    document.getElementById( 'dashRisk' ).textContent = `${maxRisk.toFixed( 2 )}`;
    document.getElementById( 'maxDailyRisk' ).textContent = `${maxRisk.toFixed( 2 )}`;

    updateProjections();
}

function updateProjections() {
    const capital = currentCapital;

    // Escenario Conservador
    const conservativeProfit = ( capital * 2.34 ).toFixed( 0 );
    const conservativeROI = ( ( conservativeProfit / capital ) * 100 ).toFixed( 0 );

    // Escenario Realista  
    const realisticProfit = ( capital * 3.06 ).toFixed( 0 );
    const realisticROI = ( ( realisticProfit / capital ) * 100 ).toFixed( 0 );

    // Escenario Optimista
    const optimisticProfit = ( capital * 3.92 ).toFixed( 0 );
    const optimisticROI = ( ( optimisticProfit / capital ) * 100 ).toFixed( 0 );

    document.getElementById( 'conservativeProfit' ).textContent = `${conservativeProfit}`;
    document.getElementById( 'conservativeROI' ).textContent = `${conservativeROI}%`;
    document.getElementById( 'realisticProfit' ).textContent = `${realisticProfit}`;
    document.getElementById( 'realisticROI' ).textContent = `${realisticROI}%`;
    document.getElementById( 'optimisticProfit' ).textContent = `${optimisticProfit}`;
    document.getElementById( 'optimisticROI' ).textContent = `${optimisticROI}%`;
}

function updateStrategyCalculator() {
    const strategy = document.getElementById( 'strategySelect' ).value;
    const config = strategyConfigs[ strategy ];

    if ( !config ) return;

    // Calcular parámetros principales
    const maxRiskPerTrade = ( currentCapital * config.riskPercent / 100 );
    const optimalContracts = Math.floor( maxRiskPerTrade / config.stopLoss );
    const realRiskPerTrade = optimalContracts * config.stopLoss;

    // Calcular ganancias
    const profitTP1 = Math.floor( optimalContracts * 0.6 * config.takeProfit1 );
    const profitTP2 = Math.floor( optimalContracts * 0.4 * config.takeProfit2 );
    const totalExpectedProfit = profitTP1 + profitTP2;

    // Calcular métricas adicionales
    const realRR = ( totalExpectedProfit / realRiskPerTrade ).toFixed( 1 );
    const dailyRiskUsed = ( ( realRiskPerTrade / ( currentCapital * 0.05 ) ) * 100 ).toFixed( 1 );
    const maxDailyRisk = currentCapital * 0.05;
    const tradesRemaining = Math.floor( ( maxDailyRisk - realRiskPerTrade ) / realRiskPerTrade );

    // Actualizar información de estrategia
    document.getElementById( 'strategyWinRate' ).textContent = `${config.winRate}%`;
    document.getElementById( 'strategyRR' ).textContent = `${config.rrRatio}:1`;
    document.getElementById( 'strategyRiskPercent' ).textContent = `${config.riskPercent}%`;

    // Actualizar parámetros calculados
    document.getElementById( 'maxRiskPerTrade' ).textContent = `${maxRiskPerTrade.toFixed( 0 )}`;
    document.getElementById( 'optimalContracts' ).textContent = optimalContracts;
    document.getElementById( 'suggestedSL' ).textContent = `${config.stopLoss} pips`;
    document.getElementById( 'realRiskPerTrade' ).textContent = `${realRiskPerTrade}`;
    document.getElementById( 'takeProfit1' ).textContent = `${config.takeProfit1} pips`;
    document.getElementById( 'takeProfit2' ).textContent = `${config.takeProfit2} pips`;
    document.getElementById( 'profitTP1' ).textContent = `${profitTP1}`;
    document.getElementById( 'profitTP2' ).textContent = `${profitTP2}`;

    // Actualizar análisis de riesgo/retorno
    document.getElementById( 'totalExpectedProfit' ).textContent = `${totalExpectedProfit}`;
    document.getElementById( 'realRR' ).textContent = `${realRR}:1`;
    document.getElementById( 'dailyRiskUsed' ).textContent = `${dailyRiskUsed}%`;
    document.getElementById( 'tradesRemaining' ).textContent = `${Math.max( 0, tradesRemaining )} trades`;
}

function updateDashboard() {
    if ( trades.length === 0 ) {
        document.getElementById( 'currentWinRate' ).textContent = '0%';
        document.getElementById( 'totalTrades' ).textContent = '0';
        document.getElementById( 'dailyPnL' ).textContent = '$0.00';
        document.getElementById( 'drawdown' ).textContent = '0%';
        document.getElementById( 'todayTrades' ).textContent = '0';
        return;
    }

    // Calcular métricas generales
    const winningTrades = trades.filter( t => t.result === 'win' ).length;
    const winRate = ( ( winningTrades / trades.length ) * 100 ).toFixed( 1 );
    const totalPnL = trades.reduce( ( sum, t ) => sum + parseFloat( t.pnl ), 0 );

    // Trades de hoy
    const today = new Date().toISOString().split( 'T' )[ 0 ];
    const todayTrades = trades.filter( t => t.date === today ).length;
    const todayPnL = trades.filter( t => t.date === today ).reduce( ( sum, t ) => sum + parseFloat( t.pnl ), 0 );

    // Calcular drawdown (pérdida máxima desde el pico)
    let maxCapital = currentCapital;
    let maxDrawdown = 0;
    let runningPnL = 0;

    trades.forEach( trade => {
        runningPnL += parseFloat( trade.pnl );
        const currentTotal = currentCapital + runningPnL;
        if ( currentTotal > maxCapital ) {
            maxCapital = currentTotal;
        }
        const drawdown = ( ( maxCapital - currentTotal ) / maxCapital ) * 100;
        if ( drawdown > maxDrawdown ) {
            maxDrawdown = drawdown;
        }
    } );

    // Actualizar dashboard
    document.getElementById( 'currentWinRate' ).textContent = `${winRate}%`;
    document.getElementById( 'totalTrades' ).textContent = trades.length;
    document.getElementById( 'dailyPnL' ).textContent = `${todayPnL.toFixed( 2 )}`;
    document.getElementById( 'dailyPnL' ).className = `text-3xl font-bold ${todayPnL >= 0 ? 'text-profit' : 'text-loss'}`;
    document.getElementById( 'drawdown' ).textContent = `${maxDrawdown.toFixed( 1 )}%`;
    document.getElementById( 'todayTrades' ).textContent = todayTrades;

    // Actualizar performance por estrategia
    updateStrategyPerformance();
}

function updateStrategyPerformance() {
    const strategies = [ 'regulares', 'ema-macd', 'contra-tendencia', 'extremos' ];

    strategies.forEach( strategy => {
        const strategyTrades = trades.filter( t => t.strategy === strategy );
        const element = document.querySelector( `[data-strategy="${strategy}"]` );

        if ( strategyTrades.length === 0 ) {
            element.querySelector( '.strategy-winrate' ).textContent = '0%';
            element.querySelector( '.strategy-pnl' ).textContent = '$0';
            element.querySelector( '.strategy-count' ).textContent = '0';
            return;
        }

        const winningTrades = strategyTrades.filter( t => t.result === 'win' ).length;
        const winRate = ( ( winningTrades / strategyTrades.length ) * 100 ).toFixed( 1 );
        const pnl = strategyTrades.reduce( ( sum, t ) => sum + parseFloat( t.pnl ), 0 );

        element.querySelector( '.strategy-winrate' ).textContent = `${winRate}%`;
        element.querySelector( '.strategy-pnl' ).textContent = `${pnl.toFixed( 0 )}`;
        element.querySelector( '.strategy-pnl' ).className = `strategy-pnl ${pnl >= 0 ? 'text-profit' : 'text-loss'}`;
        element.querySelector( '.strategy-count' ).textContent = strategyTrades.length;
    } );
}

function showTradeModal() {
    document.getElementById( 'tradeModal' ).classList.remove( 'hidden' );
    document.getElementById( 'tradeModal' ).classList.add( 'flex' );
}

function hideTradeModal() {
    document.getElementById( 'tradeModal' ).classList.add( 'hidden' );
    document.getElementById( 'tradeModal' ).classList.remove( 'flex' );
    document.getElementById( 'tradeForm' ).reset();
    document.getElementById( 'tradeDate' ).value = new Date().toISOString().split( 'T' )[ 0 ];
}

function handleTradeSubmit( e ) {
    e.preventDefault();

    const trade = {
        id: Date.now(),
        date: document.getElementById( 'tradeDate' ).value,
        strategy: document.getElementById( 'tradeStrategy' ).value,
        direction: document.getElementById( 'tradeDirection' ).value,
        contracts: parseInt( document.getElementById( 'tradeContracts' ).value ),
        stopLoss: parseInt( document.getElementById( 'tradeSL' ).value ),
        takeProfit: parseInt( document.getElementById( 'tradeTP' ).value ),
        result: document.getElementById( 'tradeResult' ).value,
        pnl: parseFloat( document.getElementById( 'tradePnL' ).value ),
        comments: document.getElementById( 'tradeComments' ).value
    };

    trades.push( trade );
    localStorage.setItem( 'trades', JSON.stringify( trades ) );

    hideTradeModal();
    renderTrades();
    updateDashboard();
    updateDisciplineMetrics();
}

function renderTrades() {
    const tbody = document.getElementById( 'tradesTableBody' );
    const strategyFilter = document.getElementById( 'filterStrategy' ).value;
    const resultFilter = document.getElementById( 'filterResult' ).value;
    const dateFilter = document.getElementById( 'filterDate' ).value;

    let filteredTrades = trades;

    if ( strategyFilter ) {
        filteredTrades = filteredTrades.filter( t => t.strategy === strategyFilter );
    }
    if ( resultFilter ) {
        filteredTrades = filteredTrades.filter( t => t.result === resultFilter );
    }
    if ( dateFilter ) {
        filteredTrades = filteredTrades.filter( t => t.date === dateFilter );
    }

    tbody.innerHTML = filteredTrades.map( trade => `
        <tr class="border-b border-gray-700 hover:bg-gray-800">
            <td class="p-3">${trade.date}</td>
            <td class="p-3">
                <span class="px-2 py-1 rounded text-xs bg-blue-900 text-blue-200">
                    ${strategyConfigs[ trade.strategy ]?.name || trade.strategy}
                </span>
            </td>
            <td class="p-3">
                <span class="px-2 py-1 rounded text-xs ${trade.direction === 'buy' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}">
                    ${trade.direction === 'buy' ? '📈 Compra' : '📉 Venta'}
                </span>
            </td>
            <td class="p-3">${trade.contracts}</td>
            <td class="p-3">${trade.stopLoss} pips</td>
            <td class="p-3">${trade.takeProfit} pips</td>
            <td class="p-3">
                <span class="px-2 py-1 rounded text-xs ${trade.result === 'win' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}">
                    ${trade.result === 'win' ? '✅ Ganador' : '❌ Perdedor'}
                </span>
            </td>
            <td class="p-3 font-bold ${trade.pnl >= 0 ? 'text-profit' : 'text-loss'}">
                ${trade.pnl.toFixed( 2 )}
            </td>
            <td class="p-3 max-w-xs truncate" title="${trade.comments}">
                ${trade.comments || '-'}
            </td>
            <td class="p-3">
                <button onclick="deleteTrade(${trade.id})" class="text-red-400 hover:text-red-300 text-sm">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `).join( '' );
}

function deleteTrade( tradeId ) {
    if ( confirm( '¿Estás seguro de que quieres eliminar este trade?' ) ) {
        trades = trades.filter( t => t.id !== tradeId );
        localStorage.setItem( 'trades', JSON.stringify( trades ) );
        renderTrades();
        updateDashboard();
        updateDisciplineMetrics();
    }
}

function exportTrades() {
    if ( trades.length === 0 ) {
        alert( 'No hay trades para exportar' );
        return;
    }

    const headers = [ 'Fecha', 'Estrategia', 'Dirección', 'Contratos', 'Stop Loss', 'Take Profit', 'Resultado', 'P&L', 'Comentarios' ];
    const csvContent = [
        headers.join( ',' ),
        ...trades.map( trade => [
            trade.date,
            strategyConfigs[ trade.strategy ]?.name || trade.strategy,
            trade.direction === 'buy' ? 'Compra' : 'Venta',
            trade.contracts,
            `${trade.stopLoss} pips`,
            `${trade.takeProfit} pips`,
            trade.result === 'win' ? 'Ganador' : 'Perdedor',
            trade.pnl,
            `"${trade.comments || ''}"`
        ].join( ',' ) )
    ].join( '\n' );

    const blob = new Blob( [ csvContent ], { type: 'text/csv;charset=utf-8;' } );
    const link = document.createElement( 'a' );
    const url = URL.createObjectURL( blob );
    link.setAttribute( 'href', url );
    link.setAttribute( 'download', `trades_oro_${new Date().toISOString().split( 'T' )[ 0 ]}.csv` );
    link.style.visibility = 'hidden';
    document.body.appendChild( link );
    link.click();
    document.body.removeChild( link );
}

function generateSetupChecklist() {
    const strategy = document.getElementById( 'setupStrategy' ).value;
    const checklist = setupChecklists[ strategy ];
    const container = document.getElementById( 'setupChecklist' );

    container.innerHTML = checklist.map( ( item, index ) => `
        <label class="flex items-start space-x-3 cursor-pointer">
            <input type="checkbox" class="setup-checkbox mt-1 w-4 h-4 text-profit bg-gray-800 border-gray-600 rounded focus:ring-profit focus:ring-2" data-index="${index}">
            <span class="text-sm">${item}</span>
        </label>
    `).join( '' );

    // Agregar event listeners para actualizar score
    container.querySelectorAll( '.setup-checkbox' ).forEach( checkbox => {
        checkbox.addEventListener( 'change', updateSetupScore );
    } );

    updateSetupScore();
}

function updateSetupScore() {
    const strategy = document.getElementById( 'setupStrategy' ).value;
    const checkboxes = document.querySelectorAll( '.setup-checkbox' );
    const checked = document.querySelectorAll( '.setup-checkbox:checked' ).length;
    const total = checkboxes.length;
    const percentage = Math.round( ( checked / total ) * 100 );

    const scoreContainer = document.getElementById( 'setupScore' );
    const scoreValue = document.getElementById( 'scoreValue' );
    const scoreBar = document.getElementById( 'scoreBar' );
    const executeBtn = document.getElementById( 'executeSetupBtn' );

    scoreContainer.classList.remove( 'hidden' );
    scoreValue.textContent = `${checked}/${total} (${percentage}%)`;
    scoreBar.style.width = `${percentage}%`;

    // Colores según puntuación
    let colorClass = 'bg-red-500';
    if ( percentage >= 80 ) colorClass = 'bg-green-500';
    else if ( percentage >= 60 ) colorClass = 'bg-yellow-500';
    else if ( percentage >= 40 ) colorClass = 'bg-orange-500';

    scoreBar.className = `h-2 rounded-full transition-all duration-300 ${colorClass}`;

    // Habilitar/deshabilitar botón de ejecución
    const minRequired = strategy === 'extremos' ? 7 : strategy === 'contra-tendencia' ? 8 : 5;
    executeBtn.disabled = checked < minRequired;
    executeBtn.className = checked >= minRequired
        ? 'flex-1 bg-profit hover:bg-green-600 px-4 py-2 rounded-lg font-medium'
        : 'flex-1 bg-gray-600 px-4 py-2 rounded-lg font-medium cursor-not-allowed';
}

function executeSetup() {
    const strategy = document.getElementById( 'setupStrategy' ).value;
    const checked = document.querySelectorAll( '.setup-checkbox:checked' ).length;
    const total = document.querySelectorAll( '.setup-checkbox' ).length;

    alert( `Setup ejecutado!\n\nEstrategia: ${strategyConfigs[ strategy ].name}\nCondiciones cumplidas: ${checked}/${total}\n\nRecuerda configurar SL y TP antes de enviar la orden.` );

    // Reset checklist
    document.querySelectorAll( '.setup-checkbox' ).forEach( cb => cb.checked = false );
    updateSetupScore();
}

function discardSetup() {
    document.querySelectorAll( '.setup-checkbox' ).forEach( cb => cb.checked = false );
    updateSetupScore();

    const strategy = document.getElementById( 'setupStrategy' ).value;
    const observation = `Setup ${strategyConfigs[ strategy ].name} descartado - ${new Date().toLocaleTimeString()}`;

    observations.unshift( {
        id: Date.now(),
        text: observation,
        timestamp: new Date().toISOString()
    } );
    localStorage.setItem( 'observations', JSON.stringify( observations ) );
    renderObservations();
}

function addObservation() {
    const input = document.getElementById( 'observationInput' );
    const text = input.value.trim();

    if ( !text ) return;

    const observation = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toISOString()
    };

    observations.unshift( observation );
    localStorage.setItem( 'observations', JSON.stringify( observations ) );

    input.value = '';
    renderObservations();
}

function renderObservations() {
    const container = document.getElementById( 'observationsList' );

    if ( observations.length === 0 ) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <p>No hay observaciones registradas</p>
                <p class="text-sm mt-2">Agrega tus primeras observaciones post-trade</p>
            </div>
        `;
        return;
    }

    container.innerHTML = observations.slice( 0, 10 ).map( obs => `
        <div class="bg-gray-800 p-3 rounded-lg border-l-4 border-blue-500">
            <p class="text-sm mb-2">${obs.text}</p>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-400">
                    ${new Date( obs.timestamp ).toLocaleString()}
                </span>
                <button onclick="deleteObservation(${obs.id})" class="text-red-400 hover:text-red-300 text-xs">
                    🗑️
                </button>
            </div>
        </div>
    `).join( '' );
}

function deleteObservation( obsId ) {
    observations = observations.filter( obs => obs.id !== obsId );
    localStorage.setItem( 'observations', JSON.stringify( observations ) );
    renderObservations();
}

function updateDisciplineMetrics() {
    if ( trades.length === 0 ) {
        // Valores por defecto si no hay trades
        updateDisciplineIndicator( 'slDiscipline', 'slPercentage', 100 );
        updateDisciplineIndicator( 'filterDiscipline', 'filterPercentage', 100 );
        updateDisciplineIndicator( 'limitDiscipline', 'limitPercentage', 100 );
        updateDisciplineIndicator( 'riskDiscipline', 'riskPercentage', 100 );
        updateOverallDiscipline( 100 );
        return;
    }

    // Calcular métricas de disciplina
    const today = new Date().toISOString().split( 'T' )[ 0 ];
    const todayTrades = trades.filter( t => t.date === today );

    // Stop Loss discipline - asumimos 100% si no hay datos sobre SL movidos
    const slDiscipline = 100;

    // Filter discipline - trades que respetan horarios y condiciones
    const filterDiscipline = 95; // Valor estimado

    // Daily limit discipline
    const limitDiscipline = todayTrades.length <= 4 ? 100 : Math.max( 0, 100 - ( ( todayTrades.length - 4 ) * 20 ) );

    // Risk management discipline
    const totalRisk = todayTrades.reduce( ( sum, t ) => sum + ( t.contracts * t.stopLoss ), 0 );
    const maxRisk = currentCapital * 0.05;
    const riskDiscipline = totalRisk <= maxRisk ? 100 : Math.max( 0, 100 - ( ( totalRisk - maxRisk ) / maxRisk * 100 ) );

    // Actualizar indicadores
    updateDisciplineIndicator( 'slDiscipline', 'slPercentage', slDiscipline );
    updateDisciplineIndicator( 'filterDiscipline', 'filterPercentage', filterDiscipline );
    updateDisciplineIndicator( 'limitDiscipline', 'limitPercentage', limitDiscipline );
    updateDisciplineIndicator( 'riskDiscipline', 'riskPercentage', riskDiscipline );

    // Disciplina general
    const overall = Math.round( ( slDiscipline + filterDiscipline + limitDiscipline + riskDiscipline ) / 4 );
    updateOverallDiscipline( overall );
}

function updateDisciplineIndicator( indicatorId, percentageId, value ) {
    const indicator = document.getElementById( indicatorId );
    const percentage = document.getElementById( percentageId );

    percentage.textContent = `${Math.round( value )}%`;

    let colorClass = 'bg-red-500';
    if ( value >= 90 ) colorClass = 'bg-green-500';
    else if ( value >= 70 ) colorClass = 'bg-yellow-500';
    else if ( value >= 50 ) colorClass = 'bg-orange-500';

    indicator.className = `w-4 h-4 rounded-full ${colorClass} mr-2`;
}

function updateOverallDiscipline( value ) {
    const overall = document.getElementById( 'overallDiscipline' );
    const bar = document.getElementById( 'disciplineBar' );

    overall.textContent = `${Math.round( value )}%`;
    bar.style.width = `${value}%`;

    let colorClass = 'bg-red-500';
    let textColorClass = 'text-red-400';
    if ( value >= 90 ) {
        colorClass = 'bg-green-500';
        textColorClass = 'text-profit';
    } else if ( value >= 70 ) {
        colorClass = 'bg-yellow-500';
        textColorClass = 'text-yellow-400';
    } else if ( value >= 50 ) {
        colorClass = 'bg-orange-500';
        textColorClass = 'text-orange-400';
    }

    bar.className = `h-3 rounded-full transition-all duration-300 ${colorClass}`;
    overall.className = `text-2xl font-bold ${textColorClass}`;
}

// Funciones globales para eventos onclick
window.deleteTrade = deleteTrade;
window.deleteObservation = deleteObservation;
