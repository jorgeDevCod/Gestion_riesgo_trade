// charts.js - Sistema de gráficas para el dashboard

// Configuración global de Chart.js
Chart.defaults.color = '#9CA3AF';
Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';

// Instancias de las gráficas
let dailyPnLChart = null;
let strategyWinRateChart = null;
let resultsDistributionChart = null;
let capitalEvolutionChart = null;

// ==================== FUNCIONES DE INICIALIZACIÓN ====================

function initializeCharts() {
    console.log( 'Inicializando todas las gráficas...' );
    initDailyPnLChart();
    initStrategyWinRateChart();
    initResultsDistributionChart();
    initCapitalEvolutionChart();
}

// ==================== GRÁFICA 1: P&L DIARIO ====================

function initDailyPnLChart() {
    const ctx = document.getElementById( 'dailyPnLChart' );
    if ( !ctx ) {
        console.warn( 'Canvas dailyPnLChart no encontrado' );
        return;
    }

    const data = getDailyPnLData();
    if ( dailyPnLChart ) dailyPnLChart.destroy();

    const gradientGreen = ctx.getContext( '2d' ).createLinearGradient( 0, 0, 0, 300 );
    gradientGreen.addColorStop( 0, 'rgba(16, 185, 129, 0.9)' );
    gradientGreen.addColorStop( 1, 'rgba(16, 185, 129, 0.2)' );

    const gradientRed = ctx.getContext( '2d' ).createLinearGradient( 0, 0, 0, 300 );
    gradientRed.addColorStop( 0, 'rgba(239, 68, 68, 0.9)' );
    gradientRed.addColorStop( 1, 'rgba(239, 68, 68, 0.2)' );

    const colors = data.values.map( v => v >= 0 ? gradientGreen : gradientRed );

    dailyPnLChart = new Chart( ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [ {
                label: 'P&L Diario',
                data: data.values,
                backgroundColor: colors,
                borderWidth: 0,
                borderRadius: 8,
                hoverBackgroundColor: colors,
                hoverBorderWidth: 1.5,
            } ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 900,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderWidth: 1,
                    titleColor: '#FCD34D',
                    bodyColor: '#F9FAFB',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: ( ctx ) => `P&L: $${ctx.parsed.y.toFixed( 2 )}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9CA3AF', font: { size: 11 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#374151' },
                    ticks: {
                        color: '#D1D5DB',
                        callback: v => '$' + v
                    }
                }
            }
        }
    } );

    console.log( 'Gráfica P&L Diario creada' );
}


// ==================== GRÁFICA 2: WIN RATE POR ESTRATEGIA ====================
function initStrategyWinRateChart() {
    const ctx = document.getElementById( 'strategyWinRateChart' );
    if ( !ctx ) {
        console.warn( 'Canvas strategyWinRateChart no encontrado' );
        return;
    }

    const data = getStrategyWinRateData();
    if ( strategyWinRateChart ) strategyWinRateChart.destroy();

    // Colores condicionales según si hay datos
    const colors = data.isEmpty
        ? [ '#6B7280' ]
        : [ '#3B82F6', '#06B6D4', '#A855F7', '#F97316' ];

    strategyWinRateChart = new Chart( ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [ {
                data: data.values,
                backgroundColor: colors,
                borderColor: '#111827',
                borderWidth: 3,
                hoverOffset: 10
            } ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#E5E7EB',
                        padding: 16,
                        usePointStyle: true,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: '#111827',
                    borderColor: '#1F2937',
                    borderWidth: 1,
                    titleColor: '#FCD34D',
                    bodyColor: '#F9FAFB',
                    padding: 12,
                    callbacks: {
                        label: ( ctx ) => {
                            if ( data.isEmpty ) return 'Agrega trades para ver win rate';
                            return `${ctx.label}: ${ctx.parsed}%`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    } );

    console.log( 'Gráfica Win Rate creada' );
}


// ==================== GRÁFICA 3: DISTRIBUCIÓN DE RESULTADOS ====================
function initResultsDistributionChart() {
    const ctx = document.getElementById( 'resultsDistributionChart' );
    if ( !ctx ) {
        console.warn( 'Canvas resultsDistributionChart no encontrado' );
        return;
    }

    const data = getResultsDistributionData();
    if ( resultsDistributionChart ) resultsDistributionChart.destroy();

    const colors = data.isEmpty
        ? [ '#6B7280' ]
        : [ '#10B981', '#EF4444', '#9CA3AF' ];

    resultsDistributionChart = new Chart( ctx, {
        type: 'pie',
        data: {
            labels: data.isEmpty ? [ 'Sin datos aún' ] : [ 'Ganadores', 'Perdedores', 'Breakeven' ],
            datasets: [ {
                data: data.values,
                backgroundColor: colors,
                borderColor: '#1F2937',
                borderWidth: 2,
                hoverOffset: 10
            } ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#D1D5DB',
                        padding: 15,
                        usePointStyle: true,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderWidth: 1,
                    titleColor: '#FCD34D',
                    bodyColor: '#F9FAFB',
                    padding: 12,
                    callbacks: {
                        label: ( ctx ) => {
                            if ( data.isEmpty ) return 'Agrega trades para ver datos';
                            const total = ctx.dataset.data.reduce( ( a, b ) => a + b, 0 );
                            const pct = ( ( ctx.parsed / total ) * 100 ).toFixed( 1 );
                            return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    } );

    console.log( 'Gráfica Distribución creada' );
}


// ==================== GRÁFICA 4: EVOLUCIÓN DE CAPITAL ====================
function initCapitalEvolutionChart() {
    const ctx = document.getElementById( 'capitalEvolutionChart' );
    if ( !ctx ) {
        console.warn( 'Canvas capitalEvolutionChart no encontrado' );
        return;
    }

    const data = getCapitalEvolutionData();
    if ( capitalEvolutionChart ) capitalEvolutionChart.destroy();

    const gradient = ctx.getContext( '2d' ).createLinearGradient( 0, 0, 0, 300 );
    gradient.addColorStop( 0, 'rgba(245, 158, 11, 0.4)' );
    gradient.addColorStop( 1, 'rgba(245, 158, 11, 0.05)' );

    capitalEvolutionChart = new Chart( ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [ {
                label: 'Evolución de Capital',
                data: data.values,
                borderColor: '#F59E0B',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#FBBF24',
                pointBorderColor: '#1F2937',
                pointBorderWidth: 2,
                hoverBorderWidth: 3
            } ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderWidth: 1,
                    titleColor: '#FCD34D',
                    bodyColor: '#F9FAFB',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: ( ctx ) => `Capital: $${ctx.parsed.y.toFixed( 2 )}`
                    }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: '#374151' },
                    ticks: {
                        color: '#D1D5DB',
                        callback: v => '$' + v
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9CA3AF', font: { size: 11 } }
                }
            }
        }
    } );

    console.log( 'Gráfica Evolución Capital creada' );
}


// ==================== FUNCIONES DE DATOS ====================

function getDailyPnLData() {
    // Intentar obtener trades desde variables globales primero
    const trades = window.getTrades ? window.getTrades() :
        JSON.parse( localStorage.getItem( 'trading_trades' ) ) || [];

    console.log( `getDailyPnLData: ${trades.length} trades encontrados` );

    const last7Days = getLast7Days();
    const dailyPnL = {};

    last7Days.forEach( day => {
        dailyPnL[ day ] = 0;
    } );

    trades.forEach( trade => {
        if ( trade.closed && trade.pnl !== undefined ) {
            const tradeDate = formatDateForChart( trade.date );
            if ( dailyPnL.hasOwnProperty( tradeDate ) ) {
                dailyPnL[ tradeDate ] += parseFloat( trade.pnl ) || 0;
            }
        }
    } );

    const values = last7Days.map( day => dailyPnL[ day ] );

    console.log( 'P&L últimos 7 días:', values );

    return { labels: last7Days, values };
}

function getStrategyWinRateData() {
    const trades = window.getTrades ? window.getTrades() :
        JSON.parse( localStorage.getItem( 'trading_trades' ) ) || [];

    console.log( `getStrategyWinRateData: ${trades.length} trades encontrados` );

    const strategies = {};

    // Contar trades por estrategia
    trades.forEach( trade => {
        if ( !trade.strategy ) return;

        // Solo contar trades cerrados
        const hasPnL = trade.pnl !== undefined && trade.pnl !== null;
        const isClosed = trade.closed === true;

        if ( !isClosed && !hasPnL ) return;

        const key = trade.strategy;
        if ( !strategies[ key ] ) {
            strategies[ key ] = { wins: 0, total: 0 };
        }

        strategies[ key ].total++;

        // Determinar ganancia por P&L
        const pnl = parseFloat( trade.pnl ) || 0;
        if ( pnl > 0 || trade.result === 'win' ) {
            strategies[ key ].wins++;
        }
    } );

    const labels = [];
    const values = [];

    Object.keys( strategies ).forEach( key => {
        const s = strategies[ key ];
        if ( s.total > 0 ) {
            const winRate = ( ( s.wins / s.total ) * 100 ).toFixed( 1 );
            labels.push( getStrategyName( key ) );
            values.push( parseFloat( winRate ) );
        }
    } );

    console.log( 'Win Rate por estrategia:', { labels, values } );

    // Si no hay datos reales
    if ( labels.length === 0 ) {
        return {
            labels: [ 'Sin trades aún' ],
            values: [ 100 ],
            isEmpty: true
        };
    }

    return { labels, values, isEmpty: false };
}

function getResultsDistributionData() {
    const trades = window.getTrades ? window.getTrades() :
        JSON.parse( localStorage.getItem( 'trading_trades' ) ) || [];

    console.log( `getResultsDistributionData: ${trades.length} trades encontrados` );

    let wins = 0, losses = 0, breakeven = 0;

    trades.forEach( trade => {
        if ( trade.closed && trade.pnl !== undefined ) {
            const pnl = parseFloat( trade.pnl ) || 0;
            if ( pnl > 0 ) wins++;
            else if ( pnl < 0 ) losses++;
            else breakeven++;
        }
    } );

    console.log( 'Distribución:', { wins, losses, breakeven } );

    if ( wins === 0 && losses === 0 && breakeven === 0 ) {
        return { values: [ 0, 0, 1 ], isEmpty: true };
    }

    return { values: [ wins, losses, breakeven ], isEmpty: false };
}

function getCapitalEvolutionData() {
    // Obtener datos desde variables globales o localStorage
    const trades = window.getTrades ? window.getTrades() :
        JSON.parse( localStorage.getItem( 'trading_trades' ) ) || [];
    const capitalAdditions = window.getCapitalAdditions ? window.getCapitalAdditions() :
        JSON.parse( localStorage.getItem( 'capital_additions' ) ) || [];
    const withdrawals = window.getWithdrawals ? window.getWithdrawals() :
        JSON.parse( localStorage.getItem( 'withdrawals' ) ) || [];

    console.log( `getCapitalEvolutionData: ${trades.length} trades, ${capitalAdditions.length} depósitos, ${withdrawals.length} retiros` );

    // Combinar todos los movimientos
    const allEvents = [];

    // Agregar adiciones de capital
    capitalAdditions.forEach( addition => {
        allEvents.push( {
            date: addition.date,
            type: 'deposit',
            amount: parseFloat( addition.amount ) || 0,
            timestamp: addition.timestamp || new Date( addition.date ).toISOString()
        } );
    } );

    // Agregar retiros
    withdrawals.forEach( withdrawal => {
        allEvents.push( {
            date: withdrawal.date,
            type: 'withdrawal',
            amount: -( parseFloat( withdrawal.amount ) || 0 ),
            timestamp: withdrawal.timestamp || new Date( withdrawal.date ).toISOString()
        } );
    } );

    // Agregar trades cerrados
    trades.filter( t => t.closed ).forEach( trade => {
        allEvents.push( {
            date: trade.date,
            type: 'trade',
            amount: parseFloat( trade.pnl ) || 0,
            timestamp: trade.timestamp || new Date( trade.date ).toISOString()
        } );
    } );

    // Ordenar por fecha
    allEvents.sort( ( a, b ) => new Date( a.timestamp ) - new Date( b.timestamp ) );

    if ( allEvents.length === 0 ) {
        console.log( 'Sin eventos para evolución de capital' );
        return { labels: [ formatDateForChart( new Date() ) ], values: [ 0 ] };
    }

    // Calcular evolución del capital
    const capitalPoints = [];
    let runningCapital = 0;

    // Punto inicial
    capitalPoints.push( {
        date: allEvents[ 0 ].date,
        capital: 0
    } );

    // Procesar cada evento
    allEvents.forEach( event => {
        runningCapital += event.amount;
        capitalPoints.push( {
            date: event.date,
            capital: Math.max( 0, runningCapital )
        } );
    } );

    // Tomar los últimos 30 puntos
    const recentPoints = capitalPoints.slice( -30 );

    console.log( `Evolución de capital: ${recentPoints.length} puntos` );

    return {
        labels: recentPoints.map( p => formatDateForChart( p.date ) ),
        values: recentPoints.map( p => p.capital )
    };
}

// ==================== FUNCIONES AUXILIARES ====================

function getLast7Days() {
    const days = [];
    const today = new Date();
    for ( let i = 6; i >= 0; i-- ) {
        const date = new Date( today );
        date.setDate( date.getDate() - i );
        days.push( formatDateForChart( date ) );
    }
    return days;
}

function formatDateForChart( date ) {
    if ( typeof date === 'string' ) {
        date = new Date( date );
    }
    const day = date.getDate().toString().padStart( 2, '0' );
    const month = ( date.getMonth() + 1 ).toString().padStart( 2, '0' );
    return `${day}/${month}`;
}

function getStrategyName( key ) {
    const names = {
        'regulares': 'Regulares',
        'estructura-confluencia': 'Estructura',
        'ema-macd': 'EMA+MACD',
        'contra-tendencia': 'Contra-T'
    };
    return names[ key ] || key;
}

function updateAllCharts() {
    console.log( 'Actualizando todas las gráficas...' );
    initDailyPnLChart();
    initStrategyWinRateChart();
    initResultsDistributionChart();
    initCapitalEvolutionChart();
}

// ==================== FUNCIONES GLOBALES ====================

window.forceUpdateDashboard = function () {
    try {
        console.log( 'Forzando actualización del dashboard...' );
        updateAllCharts();
        console.log( 'Dashboard actualizado correctamente' );
    } catch ( error ) {
        console.error( 'Error actualizando dashboard:', error );
    }
};

// ==================== INICIALIZACIÓN ====================

document.addEventListener( 'DOMContentLoaded', function () {
    console.log( '=== INICIALIZANDO CHARTS.JS ===' );

    // Verificar dependencias
    if ( typeof Chart === 'undefined' ) {
        console.error( 'Chart.js no está cargado' );
        return;
    }

    console.log( 'Chart.js disponible:', typeof Chart );

    // Esperar un momento para que firebase-app.js termine de inicializar
    setTimeout( () => {
        console.log( 'Verificando datos disponibles:' );
        console.log( '- Trades:', window.getTrades ? window.getTrades().length : 'función no disponible' );
        console.log( '- Capital:', window.getCapitalAdditions ? window.getCapitalAdditions().length : 'función no disponible' );
        console.log( '- Retiros:', window.getWithdrawals ? window.getWithdrawals().length : 'función no disponible' );

        initializeCharts();
    }, 1000 );

    // Listener para el tab de dashboard
    const dashboardTab = document.querySelector( '[data-tab="dashboard"]' );
    if ( dashboardTab ) {
        dashboardTab.addEventListener( 'click', function () {
            setTimeout( () => {
                updateAllCharts();
            }, 150 );
        } );
    }
} );

// Event listener para cambios en localStorage
window.addEventListener( 'storage', function ( e ) {
    if ( e.key && e.key.startsWith( 'trading_' ) ) {
        console.log( 'Cambio detectado en localStorage:', e.key );
        setTimeout( () => {
            if ( window.forceUpdateDashboard ) {
                window.forceUpdateDashboard();
            }
        }, 100 );
    }
} );

// Exportar funciones
window.updateAllCharts = updateAllCharts;

console.log( 'charts.js cargado correctamente' );
