// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD3-dDGO-8fXo-l5MdZ0ip6y4q8VC3v0Og",
    authDomain: "tradingapp-9c93a.firebaseapp.com",
    projectId: "tradingapp-9c93a",
    storageBucket: "tradingapp-9c93a.firebasestorage.app",
    messagingSenderId: "1047446621998",
    appId: "1:1047446621998:web:829b640a8dba719b08f4bf"
};

// Inicializar Firebase
firebase.initializeApp( firebaseConfig );

// Referencias a los servicios
const auth = firebase.auth();
const db = firebase.firestore();

// Variables globales
let trades = [];
let observations = [];
let currentCapital = 1930;
let currentTab = 'dashboard';
let currentUser = null;

// Configuraciones de estrategias
const strategyConfigs = {
    'regulares': {
        name: 'Trades Regulares',
        riskPercent: 2.0,
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

// Configurar proveedor de autenticación de Google
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope( 'profile' );
provider.addScope( 'email' );

// ===== FUNCIONES DE AUTENTICACIÓN =====
function showAuthModal() {
    document.getElementById( 'authModal' ).classList.remove( 'hidden' );
}

function hideAuthModal() {
    document.getElementById( 'authModal' ).classList.add( 'hidden' );
}

function closeAuthModal() {
    document.getElementById( 'authModal' ).classList.add( 'hidden' );
}

function showUserMenu( user ) {
    const userMenu = document.getElementById( 'userMenu' );
    const userPhoto = document.getElementById( 'userPhoto' );
    const userName = document.getElementById( 'userName' );

    if ( userPhoto ) userPhoto.src = user.photoURL || 'https://via.placeholder.com/32';
    if ( userName ) userName.textContent = user.displayName || user.email;

    userMenu.classList.remove( 'hidden' );
}

function hideUserMenu() {
    document.getElementById( 'userMenu' ).classList.add( 'hidden' );
}

function updateSyncStatus( status, isOnline = true ) {
    const syncStatus = document.getElementById( 'syncStatus' );
    const syncIndicator = document.getElementById( 'syncIndicator' );
    const syncText = document.getElementById( 'syncText' );

    if ( syncText ) syncText.textContent = status;
    if ( syncIndicator ) {
        syncIndicator.className = `w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`;
    }

    if ( syncStatus ) syncStatus.classList.remove( 'hidden' );

    // Auto-hide después de 3 segundos si es positivo
    if ( isOnline ) {
        setTimeout( () => {
            if ( syncStatus ) syncStatus.classList.add( 'hidden' );
        }, 3000 );
    }
}

// Función para iniciar sesión con Google
function signInWithGoogle() {
    auth.signInWithPopup( provider )
        .then( ( result ) => {
            updateSyncStatus( 'Conectado y sincronizado', true );
        } )
        .catch( ( error ) => {
            console.error( 'Error al iniciar sesión:', error );
            updateSyncStatus( 'Error de conexión', false );
        } );
}

// Función para cerrar sesión
function signOut() {
    auth.signOut()
        .then( () => {
            hideUserMenu();
            showAuthModal();
        } )
        .catch( ( error ) => {
            console.error( 'Error al cerrar sesión:', error );
        } );
}

// ===== FUNCIONES DE FIREBASE FIRESTORE =====
async function saveDataToFirebase( collection, data, docId = null ) {
    if ( !currentUser ) return;

    try {
        const userCollection = db.collection( 'users' ).doc( currentUser.uid ).collection( collection );

        if ( docId ) {
            await userCollection.doc( docId ).set( data );
        } else {
            await userCollection.add( data );
        }

        updateSyncStatus( 'Datos guardados', true );
    } catch ( error ) {
        console.error( `Error guardando ${collection}:`, error );
        updateSyncStatus( 'Error al guardar', false );
    }
}

async function loadDataFromFirebase( collection ) {
    if ( !currentUser ) return [];

    try {
        const userCollection = db.collection( 'users' ).doc( currentUser.uid ).collection( collection );
        const snapshot = await userCollection.orderBy( 'timestamp', 'desc' ).get();

        const data = [];
        snapshot.forEach( ( doc ) => {
            data.push( { id: doc.id, ...doc.data() } );
        } );

        return data;
    } catch ( error ) {
        console.error( `Error cargando ${collection}:`, error );
        updateSyncStatus( 'Error de sincronización', false );
        return [];
    }
}

// ===== FUNCIONES DE NAVEGACIÓN =====
function showTab( tabName ) {
    // Ocultar todas las tabs
    document.querySelectorAll( '.tab-content' ).forEach( tab => {
        tab.classList.add( 'hidden' );
    } );

    // Mostrar tab seleccionada
    const selectedTab = document.getElementById( tabName );
    if ( selectedTab ) {
        selectedTab.classList.remove( 'hidden' );
    }

    // Actualizar estado de botones
    document.querySelectorAll( '.tab-btn' ).forEach( btn => {
        btn.classList.remove( 'border-gold', 'text-gold' );
        btn.classList.add( 'border-transparent' );
    } );

    // Activar botón actual
    const activeBtn = document.querySelector( `[data-tab="${tabName}"]` );
    if ( activeBtn ) {
        activeBtn.classList.add( 'border-gold', 'text-gold' );
        activeBtn.classList.remove( 'border-transparent' );
    }

    currentTab = tabName;
}

// ===== FUNCIONES DE DASHBOARD =====
function updateDashboard() {
    const totalTrades = trades.length;
    const winningTrades = trades.filter( trade => trade.result === 'win' ).length;
    const winRate = totalTrades > 0 ? ( ( winningTrades / totalTrades ) * 100 ).toFixed( 1 ) : '0';

    // Calcular P&L diario
    const today = new Date().toISOString().split( 'T' )[ 0 ];
    const todayTrades = trades.filter( trade => trade.date === today );
    const dailyPnL = todayTrades.reduce( ( sum, trade ) => sum + parseFloat( trade.pnl || 0 ), 0 );

    // Calcular drawdown
    const drawdown = currentCapital > 0 ? ( ( Math.abs( Math.min( 0, dailyPnL ) ) / currentCapital ) * 100 ).toFixed( 1 ) : '0';

    // Actualizar elementos del dashboard solo si existen
    const dashCapital = document.getElementById( 'dashCapital' );
    const dashRisk = document.getElementById( 'dashRisk' );
    const currentWinRateEl = document.getElementById( 'currentWinRate' );
    const totalTradesEl = document.getElementById( 'totalTrades' );
    const dailyPnLEl = document.getElementById( 'dailyPnL' );
    const drawdownEl = document.getElementById( 'drawdown' );
    const todayTradesEl = document.getElementById( 'todayTrades' );

    if ( dashCapital ) dashCapital.textContent = `$${currentCapital.toLocaleString()}`;
    if ( dashRisk ) dashRisk.textContent = `$${( currentCapital * 0.05 ).toFixed( 2 )}`;
    if ( currentWinRateEl ) currentWinRateEl.textContent = `${winRate}%`;
    if ( totalTradesEl ) totalTradesEl.textContent = totalTrades;
    if ( dailyPnLEl ) {
        dailyPnLEl.textContent = `$${dailyPnL.toFixed( 2 )}`;
        dailyPnLEl.className = `text-3xl font-bold ${dailyPnL >= 0 ? 'text-profit' : 'text-loss'}`;
    }
    if ( drawdownEl ) drawdownEl.textContent = `${drawdown}%`;
    if ( todayTradesEl ) todayTradesEl.textContent = todayTrades.length;

    updateStrategyStats();
}

function updateStrategyStats() {
    Object.keys( strategyConfigs ).forEach( strategy => {
        const strategyTrades = trades.filter( trade => trade.strategy === strategy );
        const wins = strategyTrades.filter( trade => trade.result === 'win' ).length;
        const winRate = strategyTrades.length > 0 ? ( ( wins / strategyTrades.length ) * 100 ).toFixed( 0 ) : '0';
        const pnl = strategyTrades.reduce( ( sum, trade ) => sum + parseFloat( trade.pnl || 0 ), 0 );

        const statsElement = document.querySelector( `[data-strategy="${strategy}"]` );
        if ( statsElement ) {
            const winrateEl = statsElement.querySelector( '.strategy-winrate' );
            const pnlEl = statsElement.querySelector( '.strategy-pnl' );
            const countEl = statsElement.querySelector( '.strategy-count' );

            if ( winrateEl ) winrateEl.textContent = `${winRate}%`;
            if ( pnlEl ) {
                pnlEl.textContent = `$${pnl.toFixed( 0 )}`;
                pnlEl.className = `strategy-pnl ${pnl >= 0 ? 'text-profit' : 'text-loss'}`;
            }
            if ( countEl ) countEl.textContent = strategyTrades.length;
        }
    } );
}

// ===== FUNCIONES DE CAPITAL Y RIESGO =====
function updateCapitalCalculations() {
    const capitalInput = document.getElementById( 'capitalInput' );
    const capital = capitalInput ? parseFloat( capitalInput.value ) || 1930 : 1930;
    currentCapital = capital;

    const maxDailyRisk = capital * 0.05;
    const maxDailyRiskEl = document.getElementById( 'maxDailyRisk' );
    if ( maxDailyRiskEl ) {
        maxDailyRiskEl.textContent = `$${maxDailyRisk.toFixed( 2 )}`;
    }

    updateStrategyCalculations();
    updateDashboard();
}

function updateStrategyCalculations() {
    const strategySelect = document.getElementById( 'strategySelect' );
    if ( !strategySelect ) return;

    const selectedStrategy = strategySelect.value;
    const config = strategyConfigs[ selectedStrategy ];

    if ( !config ) return;

    const capital = currentCapital;
    const riskPercent = config.riskPercent / 100;
    const maxRiskPerTrade = capital * riskPercent;
    const stopLoss = config.stopLoss;
    const optimalContracts = Math.floor( maxRiskPerTrade / stopLoss );

    // Actualizar elementos solo si existen
    const elements = {
        'strategyWinRate': `${config.winRate}%`,
        'strategyRR': `${config.rrRatio}:1`,
        'strategyRiskPercent': `${config.riskPercent}%`,
        'maxRiskPerTrade': `$${maxRiskPerTrade.toFixed( 0 )}`,
        'optimalContracts': optimalContracts,
        'suggestedSL': `${stopLoss} pips`,
        'takeProfit1': `${config.takeProfit1} pips`,
        'takeProfit2': `${config.takeProfit2} pips`
    };

    Object.entries( elements ).forEach( ( [ id, value ] ) => {
        const element = document.getElementById( id );
        if ( element ) {
            element.textContent = value;
        }
    } );
}

// ===== FUNCIONES DE SETUP CHECKER =====
function updateSetupChecklist() {
    const setupStrategy = document.getElementById( 'setupStrategy' );
    if ( !setupStrategy ) return;

    const strategy = setupStrategy.value;
    const checklist = setupChecklists[ strategy ];
    const checklistContainer = document.getElementById( 'setupChecklist' );

    if ( !checklistContainer ) return;

    checklistContainer.innerHTML = checklist.map( ( item, index ) => `
        <div class="flex items-center space-x-3 p-2 bg-gray-800 rounded">
            <input type="checkbox" id="setup-${index}" class="setup-checkbox w-4 h-4 text-profit bg-gray-700 border-gray-600 rounded focus:ring-profit focus:ring-2">
            <label for="setup-${index}" class="text-sm">${item}</label>
        </div>
    `).join( '' );

    // Agregar event listeners a los checkboxes
    document.querySelectorAll( '.setup-checkbox' ).forEach( checkbox => {
        checkbox.addEventListener( 'change', updateSetupScore );
    } );
}

function updateSetupScore() {
    const checkboxes = document.querySelectorAll( '.setup-checkbox' );
    const checkedCount = document.querySelectorAll( '.setup-checkbox:checked' ).length;
    const totalCount = checkboxes.length;
    const score = Math.round( ( checkedCount / totalCount ) * 100 );

    const scoreElement = document.getElementById( 'setupScore' );
    const scoreValue = document.getElementById( 'scoreValue' );
    const scoreBar = document.getElementById( 'scoreBar' );
    const executeBtn = document.getElementById( 'executeSetupBtn' );

    if ( scoreValue ) scoreValue.textContent = `${score}%`;
    if ( scoreBar ) scoreBar.style.width = `${score}%`;

    // Colores según score
    let colorClass = 'bg-red-500';
    if ( score >= 70 ) colorClass = 'bg-yellow-500';
    if ( score >= 85 ) colorClass = 'bg-green-500';

    if ( scoreBar ) {
        scoreBar.className = `h-2 rounded-full transition-all duration-300 ${colorClass}`;
    }

    if ( scoreElement ) scoreElement.classList.remove( 'hidden' );

    // Habilitar botón de ejecutar si score >= 70
    if ( executeBtn ) {
        executeBtn.disabled = score < 70;
        if ( score >= 70 ) {
            executeBtn.classList.remove( 'opacity-50', 'cursor-not-allowed' );
        } else {
            executeBtn.classList.add( 'opacity-50', 'cursor-not-allowed' );
        }
    }
}

// ===== FUNCIONES DE TRADES =====
function showTradeModal() {
    const modal = document.getElementById( 'tradeModal' );
    const dateInput = document.getElementById( 'tradeDate' );

    if ( modal ) {
        modal.classList.remove( 'hidden' );
        modal.classList.add( 'flex' );
    }

    if ( dateInput ) {
        dateInput.value = new Date().toISOString().split( 'T' )[ 0 ];
    }
}

function hideTradeModal() {
    const modal = document.getElementById( 'tradeModal' );
    const form = document.getElementById( 'tradeForm' );

    if ( modal ) {
        modal.classList.add( 'hidden' );
        modal.classList.remove( 'flex' );
    }

    if ( form ) form.reset();
}

function saveTrade( tradeData ) {
    const trade = {
        ...tradeData,
        id: Date.now(),
        timestamp: firebase.firestore.Timestamp.now()
    };

    trades.unshift( trade );
    updateTradesTable();
    updateDashboard();
    updateDisciplineTracking();

    // Guardar en Firebase
    saveDataToFirebase( 'trades', trade );
}

function updateTradesTable() {
    const tbody = document.getElementById( 'tradesTableBody' );
    if ( !tbody ) return;

    const filteredTrades = getFilteredTrades();

    tbody.innerHTML = filteredTrades.map( trade => `
        <tr class="border-b border-gray-700 hover:bg-gray-800">
            <td class="p-3 text-sm">${formatDate( trade.date )}</td>
            <td class="p-3 text-sm">${strategyConfigs[ trade.strategy ]?.name || trade.strategy}</td>
            <td class="p-3 text-sm">
                <span class="px-2 py-1 rounded text-xs ${trade.direction === 'buy' ? 'bg-profit' : 'bg-loss'} text-white">
                    ${trade.direction === 'buy' ? 'COMPRA' : 'VENTA'}
                </span>
            </td>
            <td class="p-3 text-sm">${trade.contracts}</td>
            <td class="p-3 text-sm">${trade.stopLoss}</td>
            <td class="p-3 text-sm">${trade.takeProfit}</td>
            <td class="p-3 text-sm">
                <span class="px-2 py-1 rounded text-xs ${trade.result === 'win' ? 'bg-profit' : 'bg-loss'} text-white">
                    ${trade.result === 'win' ? 'GANADOR' : 'PERDEDOR'}
                </span>
            </td>
            <td class="p-3 text-sm font-semibold ${parseFloat( trade.pnl ) >= 0 ? 'text-profit' : 'text-loss'}">
                $${parseFloat( trade.pnl ).toFixed( 2 )}
            </td>
            <td class="p-3 text-sm text-gray-400 max-w-32 truncate" title="${trade.comments || ''}">
                ${trade.comments || '-'}
            </td>
            <td class="p-3 text-sm">
                <button onclick="deleteTrade('${trade.id}')" class="text-loss hover:text-red-400 text-xs">
                    Eliminar
                </button>
            </td>
        </tr>
    `).join( '' );
}

function getFilteredTrades() {
    let filtered = [ ...trades ];

    const strategyFilter = document.getElementById( 'filterStrategy' );
    if ( strategyFilter?.value ) {
        filtered = filtered.filter( trade => trade.strategy === strategyFilter.value );
    }

    const resultFilter = document.getElementById( 'filterResult' );
    if ( resultFilter?.value ) {
        filtered = filtered.filter( trade => trade.result === resultFilter.value );
    }

    const dateFilter = document.getElementById( 'filterDate' );
    if ( dateFilter?.value ) {
        filtered = filtered.filter( trade => trade.date === dateFilter.value );
    }

    return filtered;
}

function deleteTrade( tradeId ) {
    if ( confirm( '¿Estás seguro de eliminar este trade?' ) ) {
        trades = trades.filter( trade => trade.id != tradeId );
        updateTradesTable();
        updateDashboard();
        updateDisciplineTracking();
    }
}

function exportTradesToCSV() {
    const csvContent = generateCSV( trades );
    const blob = new Blob( [ csvContent ], { type: 'text/csv' } );
    const url = window.URL.createObjectURL( blob );
    const a = document.createElement( 'a' );
    a.href = url;
    a.download = `trades_${new Date().toISOString().split( 'T' )[ 0 ]}.csv`;
    a.click();
    window.URL.revokeObjectURL( url );
}

function generateCSV( data ) {
    if ( data.length === 0 ) return '';

    const headers = [ 'Fecha', 'Estrategia', 'Dirección', 'Contratos', 'Stop Loss', 'Take Profit', 'Resultado', 'P&L', 'Comentarios' ];
    const rows = data.map( trade => [
        trade.date,
        strategyConfigs[ trade.strategy ]?.name || trade.strategy,
        trade.direction,
        trade.contracts,
        trade.stopLoss,
        trade.takeProfit,
        trade.result,
        trade.pnl,
        `"${trade.comments || ''}"`
    ] );

    return [ headers, ...rows ].map( row => row.join( ',' ) ).join( '\n' );
}

// ===== FUNCIONES DE DISCIPLINA =====
function updateDisciplineTracking() {
    // Stop Loss discipline (siempre respetado por ahora)
    const slDiscipline = 100;

    // Límite diario (no más de 4 trades por día)
    const dailyLimit = calculateDailyLimitDiscipline();

    // Gestión de riesgo
    const riskDiscipline = calculateRiskDiscipline();

    const overallDiscipline = Math.round( ( slDiscipline + 100 + dailyLimit + riskDiscipline ) / 4 );

    // Actualizar UI solo si los elementos existen
    updateDisciplineIndicator( 'slDiscipline', 'slPercentage', slDiscipline );
    updateDisciplineIndicator( 'limitDiscipline', 'limitPercentage', dailyLimit );
    updateDisciplineIndicator( 'riskDiscipline', 'riskPercentage', riskDiscipline );

    const overallEl = document.getElementById( 'overallDiscipline' );
    const disciplineBar = document.getElementById( 'disciplineBar' );

    if ( overallEl ) overallEl.textContent = `${overallDiscipline}%`;

    if ( disciplineBar ) {
        disciplineBar.style.width = `${overallDiscipline}%`;
        const disciplineColor = overallDiscipline >= 80 ? 'bg-profit' : overallDiscipline >= 60 ? 'bg-gold' : 'bg-loss';
        disciplineBar.className = `h-3 rounded-full transition-all duration-300 ${disciplineColor}`;
    }
}

function updateDisciplineIndicator( indicatorId, percentageId, value ) {
    const indicator = document.getElementById( indicatorId );
    const percentage = document.getElementById( percentageId );

    if ( indicator ) {
        const color = value >= 80 ? 'bg-profit' : value >= 60 ? 'bg-gold' : 'bg-loss';
        indicator.className = `w-4 h-4 rounded-full ${color}`;
    }

    if ( percentage ) {
        percentage.textContent = `${value}%`;
    }
}

function calculateDailyLimitDiscipline() {
    const today = new Date().toISOString().split( 'T' )[ 0 ];
    const last7Days = [];

    for ( let i = 0; i < 7; i++ ) {
        const date = new Date();
        date.setDate( date.getDate() - i );
        last7Days.push( date.toISOString().split( 'T' )[ 0 ] );
    }

    let violations = 0;
    last7Days.forEach( date => {
        const dayTrades = trades.filter( trade => trade.date === date );
        if ( dayTrades.length > 4 ) violations++;
    } );

    return Math.max( 0, 100 - ( violations * 20 ) );
}

function calculateRiskDiscipline() {
    const recentTrades = trades.slice( 0, 10 );
    const violations = recentTrades.filter( trade => {
        const riskTaken = parseFloat( trade.contracts ) * parseFloat( trade.stopLoss );
        const maxRisk = currentCapital * 0.05; // 5% del capital
        return riskTaken > maxRisk;
    } ).length;

    return Math.max( 0, 100 - ( violations * 10 ) );
}

function addObservation() {
    const input = document.getElementById( 'observationInput' );
    if ( !input ) return;

    const text = input.value.trim();

    if ( !text ) return;

    const observation = {
        id: Date.now(),
        text: text,
        timestamp: new Date(),
        date: new Date().toISOString().split( 'T' )[ 0 ]
    };

    observations.unshift( observation );
    input.value = '';
    updateObservationsList();

    // Guardar en Firebase
    saveDataToFirebase( 'observations', observation );
}

function updateObservationsList() {
    const container = document.getElementById( 'observationsList' );
    if ( !container ) return;

    container.innerHTML = observations.slice( 0, 5 ).map( obs => `
        <div class="bg-gray-800 p-3 rounded-lg border-l-4 border-blue-500">
            <div class="flex justify-between items-start mb-2">
                <span class="text-xs text-gray-400">${formatDate( obs.date )}</span>
                <button onclick="deleteObservation('${obs.id}')" class="text-loss hover:text-red-400 text-xs">×</button>
            </div>
            <p class="text-sm">${obs.text}</p>
        </div>
    `).join( '' );
}

function deleteObservation( obsId ) {
    observations = observations.filter( obs => obs.id != obsId );
    updateObservationsList();
}

// ===== FUNCIONES UTILITARIAS =====
function formatDate( dateString ) {
    const date = new Date( dateString );
    return date.toLocaleDateString( 'es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    } );
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString( 'es-PE', {
        timeZone: 'America/Lima',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    } );

    const timeElement = document.getElementById( 'currentTime' );
    if ( timeElement ) {
        timeElement.textContent = `Lima: ${timeString}`;
    }
}

// ===== INICIALIZACIÓN Y EVENT LISTENERS =====
document.addEventListener( 'DOMContentLoaded', function () {
    console.log( '🚀 Sistema de Trading inicializado correctamente' );

    // Actualizar tiempo cada segundo
    setInterval( updateCurrentTime, 1000 );
    updateCurrentTime();

    // Event listeners para autenticación
    const googleSignInBtn = document.getElementById( 'googleSignInBtn' );
    const continueOfflineBtn = document.getElementById( 'continueOfflineBtn' );
    const signOutBtn = document.getElementById( 'signOutBtn' );

    if ( googleSignInBtn ) {
        googleSignInBtn.addEventListener( 'click', signInWithGoogle );
    }

    if ( continueOfflineBtn ) {
        continueOfflineBtn.addEventListener( 'click', closeAuthModal );
    }

    if ( signOutBtn ) {
        signOutBtn.addEventListener( 'click', signOut );
    }

    // Event listeners para navegación
    document.querySelectorAll( '.tab-btn' ).forEach( btn => {
        btn.addEventListener( 'click', ( e ) => {
            const tabName = e.target.getAttribute( 'data-tab' );
            showTab( tabName );
        } );
    } );

    // Event listeners para capital y riesgo
    const capitalInput = document.getElementById( 'capitalInput' );
    const strategySelect = document.getElementById( 'strategySelect' );

    if ( capitalInput ) {
        capitalInput.addEventListener( 'input', updateCapitalCalculations );
        capitalInput.addEventListener( 'change', () => {
            setTimeout( () => {
                saveSettings();
            }, 1000 );
        } );
    }

    if ( strategySelect ) {
        strategySelect.addEventListener( 'change', updateStrategyCalculations );
    }

    // Event listeners para setup checker
    const setupStrategy = document.getElementById( 'setupStrategy' );
    const executeSetupBtn = document.getElementById( 'executeSetupBtn' );
    const discardSetupBtn = document.getElementById( 'discardSetupBtn' );

    if ( setupStrategy ) {
        setupStrategy.addEventListener( 'change', updateSetupChecklist );
    }

    if ( executeSetupBtn ) {
        executeSetupBtn.addEventListener( 'click', () => {
            showTradeModal();
            hideSetupModal();
        } );
    }

    if ( discardSetupBtn ) {
        discardSetupBtn.addEventListener( 'click', () => {
            document.querySelectorAll( '.setup-checkbox' ).forEach( cb => cb.checked = false );
            updateSetupScore();
        } );
    }

    // Event listeners para trades
    const addTradeBtn = document.getElementById( 'addTradeBtn' );
    const cancelTradeBtn = document.getElementById( 'cancelTradeBtn' );
    const exportTradesBtn = document.getElementById( 'exportTradesBtn' );

    if ( addTradeBtn ) {
        addTradeBtn.addEventListener( 'click', showTradeModal );
    }

    if ( cancelTradeBtn ) {
        cancelTradeBtn.addEventListener( 'click', hideTradeModal );
    }

    if ( exportTradesBtn ) {
        exportTradesBtn.addEventListener( 'click', exportTradesToCSV );
    }

    // Event listeners para filtros de trades
    const filterStrategy = document.getElementById( 'filterStrategy' );
    const filterResult = document.getElementById( 'filterResult' );
    const filterDate = document.getElementById( 'filterDate' );

    if ( filterStrategy ) {
        filterStrategy.addEventListener( 'change', updateTradesTable );
    }

    if ( filterResult ) {
        filterResult.addEventListener( 'change', updateTradesTable );
    }

    if ( filterDate ) {
        filterDate.addEventListener( 'change', updateTradesTable );
    }

    // Event listener para formulario de trades
    const tradeForm = document.getElementById( 'tradeForm' );
    if ( tradeForm ) {
        tradeForm.addEventListener( 'submit', function ( e ) {
            e.preventDefault();

            const tradeData = {
                date: document.getElementById( 'tradeDate' ).value,
                strategy: document.getElementById( 'tradeStrategy' ).value,
                direction: document.getElementById( 'tradeDirection' ).value,
                contracts: document.getElementById( 'tradeContracts' ).value,
                stopLoss: document.getElementById( 'tradeSL' ).value,
                takeProfit: document.getElementById( 'tradeTP' ).value,
                result: document.getElementById( 'tradeResult' ).value,
                pnl: document.getElementById( 'tradePnL' ).value,
                comments: document.getElementById( 'tradeComments' ).value
            };

            // Validar trade antes de guardar
            const errors = validateTrade( tradeData );
            if ( errors.length > 0 ) {
                alert( 'Errores en el trade:\n' + errors.join( '\n' ) );
                return;
            }

            saveTrade( tradeData );
            hideTradeModal();
        } );
    }

    // Event listener para observaciones
    const addObservationBtn = document.getElementById( 'addObservationBtn' );
    const observationInput = document.getElementById( 'observationInput' );

    if ( addObservationBtn ) {
        addObservationBtn.addEventListener( 'click', addObservation );
    }

    if ( observationInput ) {
        observationInput.addEventListener( 'keypress', function ( e ) {
            if ( e.key === 'Enter' && !e.shiftKey ) {
                e.preventDefault();
                addObservation();
            }
        } );
    }

    // Event listener para cerrar modales con Escape
    document.addEventListener( 'keydown', function ( e ) {
        if ( e.key === 'Escape' ) {
            hideTradeModal();
        }
    } );

    // Event listener para clics fuera del modal
    const tradeModal = document.getElementById( 'tradeModal' );
    if ( tradeModal ) {
        tradeModal.addEventListener( 'click', function ( e ) {
            if ( e.target === this ) {
                hideTradeModal();
            }
        } );
    }

    // Inicializar valores por defecto
    updateCapitalCalculations();
    updateSetupChecklist();
    updateDashboard();
    updateDisciplineTracking();
    updateObservationsList();
} );

// Observer para cambios de autenticación
auth.onAuthStateChanged( async ( user ) => {
    if ( user ) {
        currentUser = user;
        hideAuthModal();
        showUserMenu( user );

        // Cargar datos del usuario
        try {
            const loadedTrades = await loadDataFromFirebase( 'trades' );
            const loadedObservations = await loadDataFromFirebase( 'observations' );
            const loadedSettings = await loadDataFromFirebase( 'settings' );

            trades = loadedTrades || [];
            observations = loadedObservations || [];

            // Cargar configuraciones guardadas
            if ( loadedSettings && loadedSettings.length > 0 ) {
                const settings = loadedSettings[ 0 ];
                if ( settings.capital ) {
                    currentCapital = settings.capital;
                    const capitalInput = document.getElementById( 'capitalInput' );
                    if ( capitalInput ) {
                        capitalInput.value = settings.capital;
                    }
                }
            }

            // Actualizar UI con datos cargados
            updateDashboard();
            updateTradesTable();
            updateObservationsList();
            updateDisciplineTracking();
            updateCapitalCalculations();

            updateSyncStatus( 'Datos sincronizados', true );
        } catch ( error ) {
            console.error( 'Error cargando datos:', error );
            updateSyncStatus( 'Error de sincronización', false );
        }
    } else {
        currentUser = null;
        showAuthModal();
        hideUserMenu();

        // Limpiar datos
        trades = [];
        observations = [];
        currentCapital = 1930;

        // Resetear UI
        updateDashboard();
        updateTradesTable();
        updateObservationsList();
        updateDisciplineTracking();
    }
} );

// Función para guardar configuraciones
function saveSettings() {
    if ( !currentUser ) return;

    const settings = {
        capital: currentCapital,
        timestamp: firebase.firestore.Timestamp.now()
    };

    saveDataToFirebase( 'settings', settings, 'main' );
}

// Función para resetear el setup modal
function hideSetupModal() {
    document.querySelectorAll( '.setup-checkbox' ).forEach( cb => cb.checked = false );
    updateSetupScore();
}

// Función para validar trade antes de guardar
function validateTrade( tradeData ) {
    const errors = [];

    if ( !tradeData.date ) errors.push( 'Fecha requerida' );
    if ( !tradeData.strategy ) errors.push( 'Estrategia requerida' );
    if ( !tradeData.direction ) errors.push( 'Dirección requerida' );
    if ( !tradeData.contracts || tradeData.contracts <= 0 ) errors.push( 'Contratos debe ser mayor a 0' );
    if ( !tradeData.stopLoss || tradeData.stopLoss <= 0 ) errors.push( 'Stop Loss debe ser mayor a 0' );
    if ( !tradeData.takeProfit || tradeData.takeProfit <= 0 ) errors.push( 'Take Profit debe ser mayor a 0' );
    if ( !tradeData.result ) errors.push( 'Resultado requerido' );
    if ( tradeData.pnl === undefined || tradeData.pnl === '' ) errors.push( 'P&L requerido' );

    // Validaciones de lógica
    if ( parseFloat( tradeData.takeProfit ) <= parseFloat( tradeData.stopLoss ) ) {
        errors.push( 'Take Profit debe ser mayor que Stop Loss' );
    }

    const riskTaken = parseFloat( tradeData.contracts ) * parseFloat( tradeData.stopLoss );
    const maxRisk = currentCapital * 0.05;
    if ( riskTaken > maxRisk ) {
        errors.push( `Riesgo excede el máximo diario (${maxRisk.toFixed( 2 )})` );
    }

    return errors;
}

// Funciones adicionales para estadísticas avanzadas
function getAdvancedStats() {
    if ( trades.length === 0 ) return null;

    const wins = trades.filter( t => t.result === 'win' );
    const losses = trades.filter( t => t.result === 'loss' );

    const avgWin = wins.length > 0 ? wins.reduce( ( sum, t ) => sum + parseFloat( t.pnl ), 0 ) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs( losses.reduce( ( sum, t ) => sum + parseFloat( t.pnl ), 0 ) / losses.length ) : 0;

    const profitFactor = avgLoss > 0 ? ( avgWin * wins.length ) / ( avgLoss * losses.length ) : 0;
    const sharpeRatio = calculateSharpeRatio();
    const maxDrawdown = calculateMaxDrawdown();

    return {
        totalTrades: trades.length,
        winRate: ( wins.length / trades.length * 100 ).toFixed( 1 ),
        avgWin: avgWin.toFixed( 2 ),
        avgLoss: avgLoss.toFixed( 2 ),
        profitFactor: profitFactor.toFixed( 2 ),
        sharpeRatio: sharpeRatio.toFixed( 2 ),
        maxDrawdown: maxDrawdown.toFixed( 2 )
    };
}

function calculateSharpeRatio() {
    if ( trades.length < 2 ) return 0;

    const returns = trades.map( t => parseFloat( t.pnl ) / currentCapital );
    const avgReturn = returns.reduce( ( sum, r ) => sum + r, 0 ) / returns.length;

    const variance = returns.reduce( ( sum, r ) => sum + Math.pow( r - avgReturn, 2 ), 0 ) / ( returns.length - 1 );
    const stdDev = Math.sqrt( variance );

    return stdDev > 0 ? ( avgReturn / stdDev ) * Math.sqrt( 252 ) : 0; // Anualizado
}

function calculateMaxDrawdown() {
    if ( trades.length === 0 ) return 0;

    let peak = currentCapital;
    let maxDD = 0;
    let runningCapital = currentCapital;

    trades.forEach( trade => {
        runningCapital += parseFloat( trade.pnl );
        if ( runningCapital > peak ) {
            peak = runningCapital;
        }
        const drawdown = ( peak - runningCapital ) / peak * 100;
        if ( drawdown > maxDD ) {
            maxDD = drawdown;
        }
    } );

    return maxDD;
}

// Función para mostrar estadísticas avanzadas
function showAdvancedStats() {
    const stats = getAdvancedStats();
    if ( stats ) {
        console.table( stats );
    } else {
        console.log( 'No hay datos suficientes para estadísticas' );
    }
}

// Función para crear backup
function createBackup() {
    if ( !currentUser ) return;

    const backup = {
        trades: trades,
        observations: observations,
        settings: {
            capital: currentCapital
        },
        timestamp: new Date().toISOString()
    };

    const backupData = JSON.stringify( backup, null, 2 );
    const blob = new Blob( [ backupData ], { type: 'application/json' } );
    const url = window.URL.createObjectURL( blob );
    const a = document.createElement( 'a' );
    a.href = url;
    a.download = `backup_trading_${new Date().toISOString().split( 'T' )[ 0 ]}.json`;
    a.click();
    window.URL.revokeObjectURL( url );
}

// Función para importar backup
function importBackup( file ) {
    const reader = new FileReader();
    reader.onload = function ( e ) {
        try {
            const backup = JSON.parse( e.target.result );

            if ( backup.trades ) trades = backup.trades;
            if ( backup.observations ) observations = backup.observations;
            if ( backup.settings && backup.settings.capital ) {
                currentCapital = backup.settings.capital;
                const capitalInput = document.getElementById( 'capitalInput' );
                if ( capitalInput ) {
                    capitalInput.value = currentCapital;
                }
            }

            // Actualizar UI
            updateDashboard();
            updateTradesTable();
            updateObservationsList();
            updateDisciplineTracking();
            updateCapitalCalculations();

            // Guardar en Firebase
            trades.forEach( trade => saveDataToFirebase( 'trades', trade ) );
            observations.forEach( obs => saveDataToFirebase( 'observations', obs ) );
            saveSettings();

            updateSyncStatus( 'Backup importado exitosamente', true );
        } catch ( error ) {
            console.error( 'Error importando backup:', error );
            updateSyncStatus( 'Error importando backup', false );
        }
    };
    reader.readAsText( file );
}

// Función para limpiar datos antiguos
function cleanOldData() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth( sixMonthsAgo.getMonth() - 6 );

    const cutoffDate = sixMonthsAgo.toISOString().split( 'T' )[ 0 ];

    trades = trades.filter( trade => trade.date >= cutoffDate );
    observations = observations.filter( obs => obs.date >= cutoffDate );

    updateDashboard();
    updateTradesTable();
    updateObservationsList();

    updateSyncStatus( 'Datos antiguos limpiados', true );
}

// Exportar funciones globales para debugging
window.showAdvancedStats = showAdvancedStats;
window.createBackup = createBackup;
window.cleanOldData = cleanOldData;
window.importBackup = importBackup;
window.closeAuthModal = closeAuthModal;
window.deleteTrade = deleteTrade;
window.deleteObservation = deleteObservation;

console.log( '📊 Para ver estadísticas avanzadas, ejecuta: showAdvancedStats()' );
console.log( '💾 Para crear backup manual, ejecuta: createBackup()' );
console.log( '🧹 Para limpiar datos antiguos, ejecuta: cleanOldData()' );
console.log( '🚀 Sistema de Trading completamente inicializado' );
