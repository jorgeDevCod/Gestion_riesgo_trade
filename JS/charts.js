// charts.js - Sistema de gráficas para el dashboard
// VERSIÓN CORREGIDA - Sin duplicados ni llamadas incorrectas

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
    if ( !ctx ) return;

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
                legend: { display: false },
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
                    grid: { color: '#374151', drawBorder: false },
                    ticks: {
                        callback: function ( value ) {
                            return '$' + value;
                        }
                    }
                },
                x: { grid: { display: false } }
            }
        }
    } );
}

// ==================== GRÁFICA 2: WIN RATE POR ESTRATEGIA ====================

function initStrategyWinRateChart() {
    const ctx = document.getElementById( 'strategyWinRateChart' );
    if ( !ctx ) return;

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
                backgroundColor: [ '#3B82F6', '#06B6D4', '#A855F7', '#F97316' ],
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
                    labels: { padding: 15, usePointStyle: true, font: { size: 11 } }
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
    if ( !ctx ) return;

    const data = getResultsDistributionData();

    if ( resultsDistributionChart ) {
        resultsDistributionChart.destroy();
    }

    const labels = data.isEmpty ? [ 'Sin datos aún' ] : [ 'Ganadores', 'Perdedores', 'Breakeven' ];
    const backgroundColor = data.isEmpty ? [ '#6B7280' ] : [ '#10B981', '#EF4444', '#6B7280' ];

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
                        font: { size: 11 },
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
    if ( !ctx ) return;

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
                legend: { display: false },
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
                    grid: { color: '#374151', drawBorder: false },
                    ticks: {
                        callback: function ( value ) {
                            return '$' + value;
                        }
                    }
                },
                x: { grid: { display: false } }
            }
        }
    } );
}

// ==================== FUNCIONES DE DATOS ====================

function getDailyPnLData() {
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

    return { labels: last7Days, values, colors, borderColors };
}

function getStrategyWinRateData() {
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
        return { labels: [ 'Sin datos' ], values: [ 100 ] };
    }

    return { labels, values };
}

function getResultsDistributionData() {
    const trades = JSON.parse( localStorage.getItem( 'trading_trades' ) ) || [];
    let wins = 0, losses = 0, breakeven = 0;

    trades.forEach( trade => {
        if ( trade.closed && trade.pnl !== undefined ) {
            const pnl = parseFloat( trade.pnl ) || 0;
            if ( pnl > 0 ) wins++;
            else if ( pnl < 0 ) losses++;
            else breakeven++;
        }
    } );

    if ( wins === 0 && losses === 0 && breakeven === 0 ) {
        return { values: [ 0, 0, 1 ], isEmpty: true };
    }

    return { values: [ wins, losses, breakeven ], isEmpty: false };
}

function getCapitalEvolutionData() {
    // Combinar todos los movimientos: trades, depósitos y retiros
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
            amount: -( parseFloat( withdrawal.amount ) || 0 ), // Negativo para restar
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

    // Ordenar todos los eventos por fecha
    allEvents.sort( ( a, b ) => new Date( a.timestamp ) - new Date( b.timestamp ) );

    if ( allEvents.length === 0 ) {
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
            capital: Math.max( 0, runningCapital ) // Nunca negativo
        } );
    } );

    // Tomar los últimos 30 puntos
    const recentPoints = capitalPoints.slice( -30 );

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
    }, 800 );

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
