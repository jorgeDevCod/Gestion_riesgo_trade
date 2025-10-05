// charts.js - Sistema de gráficas para el dashboard
// VERSIÓN CORREGIDA - Unificación de nombres de localStorage

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

    if ( dailyPnLChart ) {
        dailyPnLChart.destroy();
    }

    dailyPnLChart = new Chart( ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [ {
                label: 'P&L Diario',
                data: data.values,
                backgroundColor: data.colors,
                borderColor: data.borderColors,
                borderWidth: 2,
                borderRadius: 6,
            } ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1F2937',
                    titleColor: '#F59E0B',
                    bodyColor: '#FFFFFF',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function ( context ) {
                            return '$' + context.parsed.y.toFixed( 2 );
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#374151',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function ( value ) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    } );
}

// ==================== GRÁFICA 2: WIN RATE POR ESTRATEGIA ====================

function initStrategyWinRateChart() {
    const ctx = document.getElementById( 'strategyWinRateChart' );
    if ( !ctx ) {
        console.warn( 'Canvas strategyWinRateChart no encontrado' );
        return;
    }

    const data = getStrategyWinRateData();

    if ( strategyWinRateChart ) {
        strategyWinRateChart.destroy();
    }

    strategyWinRateChart = new Chart( ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [ {
                data: data.values,
                backgroundColor: [
                    '#3B82F6',
                    '#06B6D4',
                    '#A855F7',
                    '#F97316'
                ],
                borderColor: '#1F2937',
                borderWidth: 2
            } ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1F2937',
                    titleColor: '#F59E0B',
                    bodyColor: '#FFFFFF',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function ( context ) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    } );
}

// ==================== GRÁFICA 3: DISTRIBUCIÓN DE RESULTADOS ====================

function initResultsDistributionChart() {
    const ctx = document.getElementById( 'resultsDistributionChart' );
    if ( !ctx ) {
        console.warn( 'Canvas resultsDistributionChart no encontrado' );
        return;
    }

    const data = getResultsDistributionData();

    if ( resultsDistributionChart ) {
        resultsDistributionChart.destroy();
    }

    // Labels y colores según si hay datos o no
    const labels = data.isEmpty ?
        [ 'Sin datos aún' ] :
        [ 'Ganadores', 'Perdedores', 'Breakeven' ];

    const backgroundColor = data.isEmpty ?
        [ '#6B7280' ] :
        [ '#10B981', '#EF4444', '#6B7280' ];

    resultsDistributionChart = new Chart( ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [ {
                data: data.values,
                backgroundColor: backgroundColor,
                borderColor: '#1F2937',
                borderWidth: 2
            } ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 11
                        },
                        color: data.isEmpty ? '#6B7280' : '#9CA3AF'
                    }
                },
                tooltip: {
                    backgroundColor: '#1F2937',
                    titleColor: '#F59E0B',
                    bodyColor: '#FFFFFF',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function ( context ) {
                            if ( data.isEmpty ) {
                                return 'Registra trades para ver estadísticas';
                            }
                            const total = context.dataset.data.reduce( ( a, b ) => a + b, 0 );
                            const percentage = total > 0 ? ( ( context.parsed / total ) * 100 ).toFixed( 1 ) : 0;
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    } );
}

// ==================== GRÁFICA 4: EVOLUCIÓN DE CAPITAL ====================

function initCapitalEvolutionChart() {
    const ctx = document.getElementById( 'capitalEvolutionChart' );
    if ( !ctx ) {
        console.warn( 'Canvas capitalEvolutionChart no encontrado' );
        return;
    }

    const data = getCapitalEvolutionData();

    if ( capitalEvolutionChart ) {
        capitalEvolutionChart.destroy();
    }

    capitalEvolutionChart = new Chart( ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [ {
                label: 'Capital',
                data: data.values,
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#F59E0B',
                pointBorderColor: '#1F2937',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            } ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1F2937',
                    titleColor: '#F59E0B',
                    bodyColor: '#FFFFFF',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function ( context ) {
                            return '$' + context.parsed.y.toFixed( 2 );
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#374151',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function ( value ) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    } );
}

// ==================== FUNCIONES DE DATOS ====================

function getDailyPnLData() {
    // CORRECCIÓN: Usar 'trading_trades' en lugar de 'trades'
    const trades = JSON.parse( localStorage.getItem( 'trading_trades' ) ) || [];
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
    const colors = values.map( value =>
        value > 0 ? 'rgba(16, 185, 129, 0.8)' :
            value < 0 ? 'rgba(239, 68, 68, 0.8)' :
                'rgba(107, 114, 128, 0.8)'
    );
    const borderColors = values.map( value =>
        value > 0 ? '#10B981' :
            value < 0 ? '#EF4444' :
                '#6B7280'
    );

    console.log( 'P&L Diario:', { labels: last7Days, values } );

    return {
        labels: last7Days,
        values: values,
        colors: colors,
        borderColors: borderColors
    };
}

function getStrategyWinRateData() {
    // CORRECCIÓN: Usar 'trading_trades'
    const trades = JSON.parse( localStorage.getItem( 'trading_trades' ) ) || [];
    const strategies = {
        'regulares': { wins: 0, total: 0 },
        'estructura-confluencia': { wins: 0, total: 0 },
        'ema-macd': { wins: 0, total: 0 },
        'contra-tendencia': { wins: 0, total: 0 }
    };

    trades.forEach( trade => {
        if ( trade.closed && trade.result ) {
            if ( strategies[ trade.strategy ] ) {
                strategies[ trade.strategy ].total++;
                if ( trade.result === 'win' ) {
                    strategies[ trade.strategy ].wins++;
                }
            }
        }
    } );

    const labels = [];
    const values = [];

    Object.keys( strategies ).forEach( key => {
        if ( strategies[ key ].total > 0 ) {
            const winRate = ( strategies[ key ].wins / strategies[ key ].total * 100 ).toFixed( 0 );
            labels.push( getStrategyName( key ) );
            values.push( parseFloat( winRate ) );
        }
    } );

    if ( labels.length === 0 ) {
        return {
            labels: [ 'Sin datos' ],
            values: [ 100 ]
        };
    }

    console.log( 'Win Rate por estrategia:', { labels, values } );

    return { labels, values };
}

function getResultsDistributionData() {
    // Usar 'trading_trades' para consistencia
    const trades = JSON.parse( localStorage.getItem( 'trading_trades' ) ) || [];
    let wins = 0, losses = 0, breakeven = 0;

    trades.forEach( trade => {
        if ( trade.closed && trade.pnl !== undefined ) {
            const pnl = parseFloat( trade.pnl ) || 0;

            if ( pnl > 0 ) {
                wins++;
            } else if ( pnl < 0 ) {
                losses++;
            } else {
                breakeven++;
            }
        }
    } );

    console.log( 'Distribución de resultados:', { wins, losses, breakeven, total: trades.length } );

    // Si no hay datos, retornar valores predeterminados para visualización
    if ( wins === 0 && losses === 0 && breakeven === 0 ) {
        return {
            values: [ 0, 0, 1 ], // Mostrar solo breakeven para indicar "sin datos"
            isEmpty: true
        };
    }

    return {
        values: [ wins, losses, breakeven ],
        isEmpty: false
    };
}

function getCapitalEvolutionData() {
    // CORRECCIÓN: Usar 'trading_trades' y 'trading_currentCapital'
    const trades = JSON.parse( localStorage.getItem( 'trading_trades' ) ) || [];
    const currentCapital = parseFloat( localStorage.getItem( 'trading_currentCapital' ) ) || 0;

    const sortedTrades = [ ...trades ]
        .filter( t => t.closed )
        .sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) );

    const capitalPoints = [];
    let runningCapital = currentCapital;

    // Calcular capital inicial (restar P&L de todos los trades)
    const totalPnL = sortedTrades.reduce( ( sum, t ) => sum + ( parseFloat( t.pnl ) || 0 ), 0 );
    const initialCapital = currentCapital - totalPnL;

    capitalPoints.push( {
        date: sortedTrades[ 0 ]?.date || formatDateForInput( new Date() ),
        capital: initialCapital
    } );

    runningCapital = initialCapital;

    sortedTrades.forEach( trade => {
        runningCapital += parseFloat( trade.pnl ) || 0;
        capitalPoints.push( {
            date: trade.date,
            capital: runningCapital
        } );
    } );

    const recentPoints = capitalPoints.slice( -30 );

    console.log( 'Evolución de capital:', recentPoints.length, 'puntos' );

    return {
        labels: recentPoints.map( p => formatDateForChart( p.date ) ),
        values: recentPoints.map( p => p.capital )
    };
}

// ==================== MOVIMIENTOS DE CAPITAL ====================

function updateCapitalMovementsList() {
    const container = document.getElementById( 'capitalMovementsList' );
    const noMovementsMsg = document.getElementById( 'noMovementsMessage' );

    if ( !container ) {
        console.warn( 'Container capitalMovementsList no encontrado' );
        return;
    }

    // CORRECCIÓN: Usar 'trading_capitalAdditions' y 'trading_withdrawals'
    const capitalAdded = JSON.parse( localStorage.getItem( 'trading_capitalAdditions' ) ) || [];
    const withdrawals = JSON.parse( localStorage.getItem( 'trading_withdrawals' ) ) || [];

    console.log( 'Capital agregado:', capitalAdded.length, 'registros' );
    console.log( 'Retiros:', withdrawals.length, 'registros' );

    const allMovements = [
        ...capitalAdded.map( item => ( { ...item, type: 'deposit' } ) ),
        ...withdrawals.map( item => ( { ...item, type: 'withdrawal' } ) )
    ].sort( ( a, b ) => new Date( b.date ) - new Date( a.date ) );

    if ( allMovements.length === 0 ) {
        container.classList.add( 'hidden' );
        if ( noMovementsMsg ) noMovementsMsg.classList.remove( 'hidden' );
        return;
    }

    container.classList.remove( 'hidden' );
    if ( noMovementsMsg ) noMovementsMsg.classList.add( 'hidden' );

    container.innerHTML = allMovements.map( movement => `
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all">
            <div class="flex items-start justify-between mb-2">
                <div class="flex items-center space-x-2">
                    <span class="text-lg">${movement.type === 'deposit' ? '💰' : '📤'}</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${movement.type === 'deposit'
            ? 'bg-green-900/50 text-green-300 border border-green-700'
            : 'bg-orange-900/50 text-orange-300 border border-orange-700'
        }">
                        ${movement.type === 'deposit' ? 'Depósito' : 'Retiro'}
                    </span>
                </div>
                <span class="text-xs text-gray-400">${formatDateForDisplay( movement.date )}</span>
            </div>
            
            <div class="space-y-1">
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-400">Cantidad:</span>
                    <span class="font-bold ${movement.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}">
                        ${movement.type === 'deposit' ? '+' : '-'}$${parseFloat( movement.amount ).toFixed( 2 )}
                    </span>
                </div>
                
                ${movement.concept ? `
                    <div class="flex justify-between items-start">
                        <span class="text-xs text-gray-400">Concepto:</span>
                        <span class="text-xs text-white text-right max-w-[60%]">${movement.concept}</span>
                    </div>
                ` : ''}
                
                ${movement.notes ? `
                    <div class="mt-2 pt-2 border-t border-gray-700">
                        <p class="text-xs text-gray-400 italic">${movement.notes}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join( '' );
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

function formatDateForDisplay( dateString ) {
    const date = new Date( dateString );
    return date.toLocaleDateString( 'es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    } );
}

function formatDateForInput( date ) {
    return date.toISOString().split( 'T' )[ 0 ];
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
        updateCapitalMovementsList();
        console.log( 'Dashboard actualizado correctamente' );
    } catch ( error ) {
        console.error( 'Error actualizando dashboard:', error );
    }
};

// ==================== INICIALIZACIÓN ====================

document.addEventListener( 'DOMContentLoaded', function () {
    console.log( '=== INICIALIZANDO CHARTS.JS ===' );

    setTimeout( () => {
        console.log( 'Chart.js disponible:', typeof Chart );
        initializeCharts();
        updateCapitalMovementsList();
    }, 800 );

    const dashboardTab = document.querySelector( '[data-tab="dashboard"]' );
    if ( dashboardTab ) {
        dashboardTab.addEventListener( 'click', function () {
            setTimeout( () => {
                updateAllCharts();
                updateCapitalMovementsList();
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
window.updateCapitalMovementsList = updateCapitalMovementsList;
window.updateCapitalMovementsTable = updateCapitalMovementsList; // Alias

console.log( 'charts.js cargado correctamente' );
