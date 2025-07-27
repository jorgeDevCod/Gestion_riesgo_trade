
// Variables globales
let trades = [];
let currentCapital = 1930;
let dailyPnL = 0;

// Inicialización
document.addEventListener( 'DOMContentLoaded', function () {
    loadData();
    updateCapitalInfo();
    updateCurrentTime();
    updateTradingStatus();
    setInterval( updateCurrentTime, 1000 );
    setInterval( updateTradingStatus, 60000 );
} );

function showTab( tabName ) {
    // Ocultar todos los tabs
    const tabContents = document.querySelectorAll( '.tab-content' );
    tabContents.forEach( tab => tab.classList.remove( 'active' ) );

    // Remover clase active de todos los botones
    const tabButtons = document.querySelectorAll( '.tab' );
    tabButtons.forEach( btn => btn.classList.remove( 'active' ) );

    // Mostrar tab seleccionado
    document.getElementById( tabName ).classList.add( 'active' );
    event.target.classList.add( 'active' );
}

function checkSignalQuality() {
    const buySignals = [
        'buy_h4_macd', 'buy_h1_macd', 'buy_h4_williams',
        'buy_h1_williams', 'buy_m15_timing', 'buy_price_structure', 'buy_candle_pattern'
    ];

    const sellSignals = [
        'sell_h4_macd', 'sell_h1_macd', 'sell_h4_williams',
        'sell_h1_williams', 'sell_m15_timing', 'sell_price_structure', 'sell_candle_pattern'
    ];

    const buyCount = buySignals.filter( id => document.getElementById( id ).checked ).length;
    const sellCount = sellSignals.filter( id => document.getElementById( id ).checked ).length;

    let direction = '';
    let count = 0;

    if ( buyCount > sellCount ) {
        direction = 'COMPRA';
        count = buyCount;
    } else if ( sellCount > buyCount ) {
        direction = 'VENTA';
        count = sellCount;
    }

    const result = document.getElementById( 'signalResult' );
    const quality = document.getElementById( 'signalQuality' );
    const recommendation = document.getElementById( 'signalRecommendation' );

    let qualityText = '';
    let recommendationText = '';

    if ( count >= 6 ) {
        qualityText = `🟢 SEÑAL DE ALTA CALIDAD (${count}/7) - ${direction}`;
        recommendationText = '✅ EJECUTAR TRADE - Probabilidad >80%';
        result.style.background = 'rgba(76, 175, 80, 0.3)';
    } else if ( count >= 4 ) {
        qualityText = `🟡 SEÑAL MODERADA (${count}/7) - ${direction}`;
        recommendationText = '⚠️ CONSIDERAR CON CAUTELA - Probabilidad ~60%';
        result.style.background = 'rgba(255, 152, 0, 0.3)';
    } else if ( count >= 1 ) {
        qualityText = `🔴 SEÑAL DÉBIL (${count}/7) - ${direction}`;
        recommendationText = '❌ NO EJECUTAR - Probabilidad <50%';
        result.style.background = 'rgba(244, 67, 54, 0.3)';
    } else {
        qualityText = '⚪ SIN SEÑAL CLARA';
        recommendationText = '⏳ ESPERAR - No hay confluencia suficiente';
        result.style.background = 'rgba(158, 158, 158, 0.3)';
    }

    quality.textContent = qualityText;
    recommendation.textContent = recommendationText;
    result.style.display = 'block';
}

function resetSignals() {
    const checkboxes = document.querySelectorAll( '#signals input[type="checkbox"]' );
    checkboxes.forEach( cb => cb.checked = false );
    document.getElementById( 'signalResult' ).style.display = 'none';
    showNotification( '✅ Señales reseteadas', 'success' );
}

function calculateRisk() {
    const entry = parseFloat( document.getElementById( 'entryPrice' ).value );
    const stop = parseFloat( document.getElementById( 'stopLoss' ).value );
    const tp1 = parseFloat( document.getElementById( 'takeProfit1' ).value );
    const tp2 = parseFloat( document.getElementById( 'takeProfit2' ).value );

    if ( !entry || !stop ) {
        showNotification( '❌ Ingresa precio de entrada y stop loss', 'error' );
        return;
    }

    const riskPerTrade = currentCapital * 0.05; // 5%
    const pointsRisk = Math.abs( entry - stop );
    const contractCost = 17;
    const totalRiskPerContract = pointsRisk + contractCost;
    const contracts = Math.floor( riskPerTrade / totalRiskPerContract );

    const tp1Points = Math.abs( tp1 - entry );
    const tp2Points = Math.abs( tp2 - entry );

    const tp1Profit = tp1Points * contracts - ( contracts * contractCost );
    const tp2Profit = tp2Points * contracts - ( contracts * contractCost );

    const ratio1 = tp1Points / pointsRisk;
    const ratio2 = tp2Points / pointsRisk;

    const resultDiv = document.getElementById( 'riskResult' );
    const detailsDiv = document.getElementById( 'riskDetails' );

    detailsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
                <strong>📊 Análisis de Riesgo:</strong><br>
                • Riesgo por operación: ${riskPerTrade.toFixed( 2 )}<br>
                • Puntos de riesgo: ${pointsRisk.toFixed( 1 )}<br>
                • Contratos recomendados: <strong>${contracts}</strong><br>
                • Riesgo total real: ${( pointsRisk * contracts + contracts * contractCost ).toFixed( 2 )}
            </div>
            <div>
                <strong>💰 Proyección TP1:</strong><br>
                • Puntos: ${tp1Points.toFixed( 1 )}<br>
                • Ganancia: <span class="profit">${tp1Profit.toFixed( 2 )}</span><br>
                • Ratio: ${ratio1.toFixed( 1 )}:1<br>
                • Estado: ${ratio1 >= 2 ? '✅ Bueno' : '⚠️ Bajo'}
            </div>
            <div>
                <strong>🎯 Proyección TP2:</strong><br>
                • Puntos: ${tp2Points.toFixed( 1 )}<br>
                • Ganancia: <span class="profit">${tp2Profit.toFixed( 2 )}</span><br>
                • Ratio: ${ratio2.toFixed( 1 )}:1<br>
                • Estado: ${ratio2 >= 3 ? '✅ Excelente' : ratio2 >= 2 ? '✅ Bueno' : '⚠️ Bajo'}
            </div>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: rgba(255,215,0,0.1); border-radius: 5px;">
            <strong>📋 Recomendación:</strong> 
            ${contracts > 0 ?
            `Usar ${contracts} contratos. ${ratio1 >= 2 && ratio2 >= 2.5 ? 'Setup con buena relación riesgo/beneficio ✅' : 'Considerar ajustar niveles para mejor ratio ⚠️'}`
            : 'Riesgo muy alto, reducir stop loss o esperar mejor entrada ❌'
        }
        </div>
    `;

    resultDiv.style.display = 'block';
}

function saveTrade() {
    const direction = document.getElementById( 'tradeDirection' ).value;
    const entry = parseFloat( document.getElementById( 'tradeEntry' ).value );
    const exit = parseFloat( document.getElementById( 'tradeExit' ).value );
    const contracts = parseInt( document.getElementById( 'tradeContracts' ).value );
    const points = parseFloat( document.getElementById( 'tradePoints' ).value );
    const pnl = parseFloat( document.getElementById( 'tradePnL' ).value );
    const notes = document.getElementById( 'tradeNotes' ).value;

    if ( !entry || !exit || !contracts ) {
        showNotification( '❌ Completa todos los campos obligatorios', 'error' );
        return;
    }

    const trade = {
        id: Date.now(),
        date: new Date().toLocaleString( 'es-ES' ),
        direction: direction,
        entry: entry,
        exit: exit,
        contracts: contracts,
        points: points || ( direction === 'buy' ? exit - entry : entry - exit ),
        pnl: pnl || ( ( direction === 'buy' ? exit - entry : entry - exit ) * contracts - contracts * 17 ),
        notes: notes
    };

    trades.push( trade );
    dailyPnL += trade.pnl;

    updateTradesTable();
    updateCapitalInfo();
    updateStats();
    clearTradeForm();
    saveData();

    showNotification( '✅ Operación guardada exitosamente', 'success' );
}

function clearTradeForm() {
    document.getElementById( 'tradeEntry' ).value = '';
    document.getElementById( 'tradeExit' ).value = '';
    document.getElementById( 'tradeContracts' ).value = '';
    document.getElementById( 'tradePoints' ).value = '';
    document.getElementById( 'tradePnL' ).value = '';
    document.getElementById( 'tradeNotes' ).value = '';
}

function updateTradesTable() {
    const tbody = document.getElementById( 'tradesTableBody' );
    tbody.innerHTML = '';

    trades.slice( -10 ).reverse().forEach( trade => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${trade.date}</td>
            <td>${trade.direction === 'buy' ? '🟢 COMPRA' : '🔴 VENTA'}</td>
            <td>${trade.entry.toFixed( 2 )}</td>
            <td>${trade.exit.toFixed( 2 )}</td>
            <td>${trade.points.toFixed( 1 )}</td>
            <td class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${trade.pnl.toFixed( 2 )}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${trade.notes}</td>
        `;
    } );
}

function updateCapitalInfo() {
    document.getElementById( 'currentCapital' ).textContent = `${currentCapital.toFixed( 2 )}`;
    document.getElementById( 'availableRisk' ).textContent = `${( currentCapital * 0.05 ).toFixed( 2 )}`;
    document.getElementById( 'dailyTarget' ).textContent = `${( currentCapital * 0.75 / 30 ).toFixed( 0 )}`;
    document.getElementById( 'todayPnL' ).textContent = `${dailyPnL.toFixed( 2 )}`;

    // Actualizar progreso mensual
    const monthlyTarget = currentCapital * 0.75;
    const totalPnL = trades.reduce( ( sum, trade ) => sum + trade.pnl, 0 );
    const progress = ( totalPnL / monthlyTarget * 100 ).toFixed( 1 );
    document.getElementById( 'monthlyProgress' ).textContent = `${progress}%`;
}

function updateStats() {
    const totalTrades = trades.length;
    const winningTrades = trades.filter( t => t.pnl > 0 ).length;
    const losingTrades = trades.filter( t => t.pnl < 0 ).length;
    const winRate = totalTrades > 0 ? ( ( winningTrades / totalTrades ) * 100 ).toFixed( 1 ) : 0;
    const totalProfit = trades.reduce( ( sum, trade ) => sum + trade.pnl, 0 );
    const avgTrade = totalTrades > 0 ? ( totalProfit / totalTrades ).toFixed( 2 ) : 0;

    document.getElementById( 'totalTrades' ).textContent = totalTrades;
    document.getElementById( 'winningTrades' ).textContent = winningTrades;
    document.getElementById( 'losingTrades' ).textContent = losingTrades;
    document.getElementById( 'winRate' ).textContent = `${winRate}%`;
    document.getElementById( 'totalProfit' ).textContent = `${totalProfit.toFixed( 2 )}`;
    document.getElementById( 'avgTrade' ).textContent = `${avgTrade}`;

    // Colorear total profit
    const profitElement = document.getElementById( 'totalProfit' );
    profitElement.className = totalProfit >= 0 ? 'stat-value profit' : 'stat-value loss';
}

function updateCurrentTime() {
    const now = new Date();
    const limaTime = new Date( now.toLocaleString( "en-US", { timeZone: "America/Lima" } ) );
    const timeString = limaTime.toLocaleString( 'es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    } );

    document.getElementById( 'currentTime' ).textContent = `🕐 ${timeString}`;
}

function updateTradingStatus() {
    const now = new Date();
    const limaTime = new Date( now.toLocaleString( "en-US", { timeZone: "America/Lima" } ) );
    const hour = limaTime.getHours() + limaTime.getMinutes() / 60;
    const dayOfWeek = limaTime.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if it's weekend
    if ( dayOfWeek === 0 || dayOfWeek === 6 ) {
        updateScheduleStatus( 'status1', false, 'FIN DE SEMANA' );
        updateScheduleStatus( 'status2', false, 'FIN DE SEMANA' );
        return;
    }

    // Golden hours: 8:00 - 12:00
    const isGoldenTime = hour >= 8 && hour < 12;
    updateScheduleStatus( 'status1', isGoldenTime, isGoldenTime ? 'ACTIVO' : 'INACTIVO' );

    // Secondary hours: 13:30 - 15:30
    const isSecondaryTime = hour >= 13.5 && hour < 15.5;
    updateScheduleStatus( 'status2', isSecondaryTime, isSecondaryTime ? 'ACTIVO' : 'INACTIVO' );

    // Update schedule items visual status
    const scheduleItems = document.querySelectorAll( '.schedule-item[data-start]' );
    scheduleItems.forEach( item => {
        const start = parseFloat( item.dataset.start );
        const end = parseFloat( item.dataset.end );
        const isActive = hour >= start && hour < end && dayOfWeek >= 1 && dayOfWeek <= 5;

        item.className = `schedule-item ${isActive ? 'time-active' : 'time-inactive'}`;
    } );
}

function updateScheduleStatus( elementId, isActive, statusText ) {
    const element = document.getElementById( elementId );
    element.textContent = isActive ? '🟢 ' + statusText : '🔴 ' + statusText;
}

function enableNotifications() {
    if ( 'Notification' in window ) {
        Notification.requestPermission().then( permission => {
            if ( permission === 'granted' ) {
                showNotification( '✅ Notificaciones habilitadas', 'success' );
                scheduleNotifications();
            } else {
                showNotification( '❌ Permisos de notificación denegados', 'error' );
            }
        } );
    } else {
        showNotification( '❌ Navegador no soporta notificaciones', 'error' );
    }
}

function scheduleNotifications() {
    // Notificar 15 minutos antes del horario dorado
    setInterval( () => {
        const now = new Date();
        const limaTime = new Date( now.toLocaleString( "en-US", { timeZone: "America/Lima" } ) );
        const hour = limaTime.getHours();
        const minute = limaTime.getMinutes();

        if ( hour === 7 && minute === 45 ) {
            new Notification( '🥇 Gold Trading Alert', {
                body: '⏰ Horario Dorado en 15 minutos (08:00-12:00)',
                icon: '🥇'
            } );
        }

        if ( hour === 13 && minute === 15 ) {
            new Notification( '🥇 Gold Trading Alert', {
                body: '⏰ Horario Secundario en 15 minutos (13:30-15:30)',
                icon: '🥇'
            } );
        }
    }, 60000 );
}

function testNotification() {
    if ( 'Notification' in window && Notification.permission === 'granted' ) {
        new Notification( '🥇 Gold Trading Test', {
            body: '✅ Las notificaciones están funcionando correctamente',
            icon: '🥇'
        } );
        showNotification( '🧪 Notificación de prueba enviada', 'success' );
    } else {
        showNotification( '❌ Habilita las notificaciones primero', 'error' );
    }
}

function resetStats() {
    if ( confirm( '¿Estás seguro de que quieres resetear todas las estadísticas?' ) ) {
        trades = [];
        dailyPnL = 0;
        updateTradesTable();
        updateCapitalInfo();
        updateStats();
        saveData();
        showNotification( '✅ Estadísticas reseteadas', 'success' );
    }
}

function exportData() {
    const data = {
        trades: trades,
        currentCapital: currentCapital,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob( [ JSON.stringify( data, null, 2 ) ], { type: 'application/json' } );
    const url = URL.createObjectURL( blob );
    const a = document.createElement( 'a' );
    a.href = url;
    a.download = `gold-trading-data-${new Date().toISOString().split( 'T' )[ 0 ]}.json`;
    document.body.appendChild( a );
    a.click();
    document.body.removeChild( a );
    URL.revokeObjectURL( url );

    showNotification( '📊 Datos exportados exitosamente', 'success' );
}

function showNotification( message, type ) {
    const notification = document.getElementById( 'notification' );
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout( () => {
        notification.classList.remove( 'show' );
    }, 3000 );
}

function saveData() {
    const data = {
        trades: trades,
        currentCapital: currentCapital,
        dailyPnL: dailyPnL
    };
    // Note: In real environment, this would be stored in localStorage
    // but we're using memory storage as per constraints
    window.tradingData = data;
}

function loadData() {
    if ( window.tradingData ) {
        trades = window.tradingData.trades || [];
        currentCapital = window.tradingData.currentCapital || 1930;
        dailyPnL = window.tradingData.dailyPnL || 0;
        updateTradesTable();
        updateStats();
    }
}

// Auto-save every 5 minutes
setInterval( saveData, 300000 );

