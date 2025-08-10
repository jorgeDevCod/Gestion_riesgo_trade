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
let withdrawals = [];
let capitalAdditions = [];
let currentCapital = 0;
let currentTab = 'dashboard';
let currentUser = null;
let isInitializing = true;
let hasShownWelcomeBanner = false;
let hasShownAuthModal = false;

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
    // Solo mostrar si no está logueado, no está inicializando Y no se ha mostrado antes en esta sesión
    if ( !currentUser && !isInitializing && !hasShownAuthModal ) {
        document.getElementById( 'authModal' ).classList.remove( 'hidden' );
        hasShownAuthModal = true;
    }
}

function hideAuthModal() {
    document.getElementById( 'authModal' ).classList.add( 'hidden' );
}

function closeAuthModal() {
    document.getElementById( 'authModal' ).classList.add( 'hidden' );
}

function showUserMenu( user ) {
    const guestSection = document.getElementById( 'guestSection' );
    const userMenu = document.getElementById( 'userMenu' );
    const userPhoto = document.getElementById( 'userPhoto' );

    if ( guestSection ) guestSection.classList.add( 'hidden' );

    if ( userPhoto ) {
        userPhoto.src = user.photoURL || 'https://via.placeholder.com/32';
        userPhoto.title = `${user.displayName || user.email} - Click para opciones`;
    }

    if ( userMenu ) userMenu.classList.remove( 'hidden' );

    // Mostrar banner de bienvenida
    showWelcomeBanner( user );
}

function showWelcomeBanner( user ) {
    // Solo mostrar si no se ha mostrado antes en esta sesión
    if ( hasShownWelcomeBanner ) return;

    const banner = document.getElementById( 'welcomeBanner' );
    const userPhoto = document.getElementById( 'welcomeUserPhoto' );
    const userName = document.getElementById( 'welcomeUserName' );

    if ( banner && userPhoto && userName ) {
        userPhoto.src = user.photoURL || 'https://via.placeholder.com/32';
        userName.textContent = user.displayName || user.email;

        banner.classList.remove( 'hidden' );
        banner.style.transform = 'translateY(0)';
        hasShownWelcomeBanner = true;

        // Ocultar después de 5 segundos
        setTimeout( () => {
            banner.style.transform = 'translateY(-100%)';
            setTimeout( () => {
                banner.classList.add( 'hidden' );
            }, 500 );
        }, 5000 );
    }
}

function showGuestSection() {
    const guestSection = document.getElementById( 'guestSection' );
    const userMenu = document.getElementById( 'userMenu' );

    if ( userMenu ) userMenu.classList.add( 'hidden' );
    if ( guestSection ) guestSection.classList.remove( 'hidden' );
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

    if ( isOnline ) {
        setTimeout( () => {
            if ( syncStatus ) syncStatus.classList.add( 'hidden' );
        }, 3000 );
    }
}

function signInWithGoogle() {
    auth.signInWithPopup( provider )
        .then( ( result ) => {
            // Ocultar modal inmediatamente al loguearse
            hideAuthModal();
            hasShownAuthModal = true; // Marcar como mostrado para evitar que aparezca de nuevo
            updateSyncStatus( 'Conectado y sincronizado', true );
        } )
        .catch( ( error ) => {
            console.error( 'Error al iniciar sesión:', error );
            updateSyncStatus( 'Error de conexión', false );
        } );
}

function signOut() {
    auth.signOut()
        .then( () => {
            showGuestSection();
            updateSyncStatus( 'Desconectado', false );
            // NO resetear hasShownAuthModal aquí para evitar que aparezca el modal automáticamente
        } )
        .catch( ( error ) => {
            console.error( 'Error al cerrar sesión:', error );
        } );
}

// ===== FUNCIONES DE DATOS =====
function syncDataToFirebase() {
    if ( !currentUser ) return;

    const userData = {
        trades: trades,
        observations: observations,
        withdrawals: withdrawals,
        capitalAdditions: capitalAdditions,
        currentCapital: currentCapital,
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
    };

    return db.collection( 'users' ).doc( currentUser.uid ).set( userData );
}

function loadDataFromFirebase() {
    if ( !currentUser ) return Promise.resolve();

    return db.collection( 'users' ).doc( currentUser.uid ).get()
        .then( ( doc ) => {
            if ( doc.exists ) {
                const data = doc.data();
                trades = data.trades || [];
                observations = data.observations || [];
                withdrawals = data.withdrawals || [];
                capitalAdditions = data.capitalAdditions || [];
                currentCapital = data.currentCapital || 0;

                renderAllData();
                updateSyncStatus( 'Datos sincronizados', true );
            }
        } )
        .catch( ( error ) => {
            console.error( 'Error cargando datos:', error );
            updateSyncStatus( 'Error de sincronización', false );
        } );
}

function saveDataLocally() {
    const data = {
        trades: trades,
        observations: observations,
        withdrawals: withdrawals,
        capitalAdditions: capitalAdditions,
        currentCapital: currentCapital
    };

    Object.keys( data ).forEach( key => {
        localStorage.setItem( `trading_${key}`, JSON.stringify( data[ key ] ) );
    } );
}

function loadDataLocally() {
    try {
        trades = JSON.parse( localStorage.getItem( 'trading_trades' ) || '[]' );
        observations = JSON.parse( localStorage.getItem( 'trading_observations' ) || '[]' );
        withdrawals = JSON.parse( localStorage.getItem( 'trading_withdrawals' ) || '[]' );
        capitalAdditions = JSON.parse( localStorage.getItem( 'trading_capitalAdditions' ) || '[]' );
        currentCapital = parseFloat( localStorage.getItem( 'trading_currentCapital' ) || '0' );
    } catch ( error ) {
        console.error( 'Error cargando datos locales:', error );
        resetAllData();
    }
}

// ===== FUNCIONES DE CAPITAL =====
function addCapital( amount, concept, notes, date ) {
    const addition = {
        id: Date.now().toString(),
        date: date,
        amount: amount,
        concept: concept,
        notes: notes,
        timestamp: new Date().toISOString()
    };

    capitalAdditions.push( addition );
    currentCapital += amount;

    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    renderAllData();
}

function registerWithdrawal( amount, concept, notes, date ) {
    const withdrawal = {
        id: Date.now().toString(),
        date: date,
        amount: amount,
        concept: concept,
        notes: notes,
        timestamp: new Date().toISOString()
    };

    withdrawals.push( withdrawal );
    currentCapital -= amount;

    if ( currentCapital < 0 ) currentCapital = 0;

    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    renderAllData();
    renderRecentWithdrawals();
}

function resetAllData() {
    trades = [];
    observations = [];
    withdrawals = [];
    capitalAdditions = [];
    currentCapital = 0;

    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    renderAllData();
}

// ===== FUNCIONES DE TRADES =====
function addTrade( tradeData ) {
    const trade = {
        id: Date.now().toString(),
        ...tradeData,
        timestamp: new Date().toISOString()
    };

    trades.push( trade );

    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    renderAllData();
}

function deleteTrade( tradeId ) {
    trades = trades.filter( trade => trade.id !== tradeId );

    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    renderAllData();
}

function editTrade( tradeId, updatedData ) {
    const tradeIndex = trades.findIndex( trade => trade.id === tradeId );
    if ( tradeIndex !== -1 ) {
        trades[ tradeIndex ] = { ...trades[ tradeIndex ], ...updatedData };

        saveDataLocally();
        if ( currentUser ) {
            syncDataToFirebase();
        }

        renderAllData();
    }
}

// ===== FUNCIONES DE OBSERVACIONES =====
function addObservation( text ) {
    const observation = {
        id: Date.now().toString(),
        text: text,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString()
    };

    observations.push( observation );

    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    renderObservations();
}

// ===== FUNCIONES DE CÁLCULO =====
function calculateWinRate() {
    if ( trades.length === 0 ) return 0;
    const winningTrades = trades.filter( trade => trade.result === 'win' ).length;
    return Math.round( ( winningTrades / trades.length ) * 100 );
}

function calculateTotalPnL() {
    return trades.reduce( ( total, trade ) => total + parseFloat( trade.pnl || 0 ), 0 );
}

function calculateDailyPnL() {
    const today = new Date().toISOString().split( 'T' )[ 0 ];
    const todayTrades = trades.filter( trade => trade.date === today );
    return todayTrades.reduce( ( total, trade ) => total + parseFloat( trade.pnl || 0 ), 0 );
}

function getTodayTradesCount() {
    const today = new Date().toISOString().split( 'T' )[ 0 ];
    return trades.filter( trade => trade.date === today ).length;
}

function getTotalWithdrawals() {
    return withdrawals.reduce( ( total, w ) => total + parseFloat( w.amount || 0 ), 0 );
}

function calculateDrawdown() {
    const totalPnL = calculateTotalPnL();
    if ( currentCapital === 0 ) return 0;
    return Math.round( Math.abs( Math.min( 0, totalPnL / currentCapital ) * 100 ) );
}

function calculateStrategyStats() {
    const stats = {};

    Object.keys( strategyConfigs ).forEach( strategy => {
        const strategyTrades = trades.filter( trade => trade.strategy === strategy );
        const wins = strategyTrades.filter( trade => trade.result === 'win' ).length;
        const winRate = strategyTrades.length > 0 ? Math.round( ( wins / strategyTrades.length ) * 100 ) : 0;
        const pnl = strategyTrades.reduce( ( total, trade ) => total + parseFloat( trade.pnl || 0 ), 0 );

        stats[ strategy ] = {
            winRate: winRate,
            pnl: pnl,
            count: strategyTrades.length
        };
    } );

    return stats;
}

function calculateOptimalContracts( strategy ) {
    const config = strategyConfigs[ strategy ];
    if ( !config || currentCapital === 0 ) return 0;

    const riskAmount = ( currentCapital * config.riskPercent ) / 100;
    const stopLossPips = config.stopLoss;
    const pipValue = 1; // $1 por pip por contrato

    return Math.floor( riskAmount / ( stopLossPips * pipValue ) );
}

// ===== FUNCIONES DE RENDERIZADO =====
function renderDashboard() {
    const winRate = calculateWinRate();
    const totalPnL = calculateTotalPnL();
    const dailyPnL = calculateDailyPnL();
    const todayTrades = getTodayTradesCount();
    const totalWithdrawals = getTotalWithdrawals();
    const drawdown = calculateDrawdown();
    const maxDailyRisk = currentCapital * 0.05;

    // Actualizar elementos del dashboard
    document.getElementById( 'dashCapital' ).textContent = `$${currentCapital.toFixed( 2 )}`;
    document.getElementById( 'dashRisk' ).textContent = `$${maxDailyRisk.toFixed( 2 )}`;
    document.getElementById( 'currentWinRate' ).textContent = `${winRate}%`;
    document.getElementById( 'totalTrades' ).textContent = trades.length;

    const dailyPnLElement = document.getElementById( 'dailyPnL' );
    dailyPnLElement.textContent = `$${dailyPnL.toFixed( 2 )}`;
    dailyPnLElement.className = `text-xl font-bold ${dailyPnL >= 0 ? 'text-profit' : 'text-loss'}`;

    document.getElementById( 'drawdown' ).textContent = `${drawdown}%`;
    document.getElementById( 'todayTrades' ).textContent = todayTrades;
    document.getElementById( 'totalWithdrawals' ).textContent = `$${totalWithdrawals.toFixed( 2 )}`;

    const totalPnLElement = document.getElementById( 'totalPnL' );
    totalPnLElement.textContent = `$${totalPnL.toFixed( 2 )}`;
    totalPnLElement.className = `text-xl font-bold ${totalPnL >= 0 ? 'text-profit' : 'text-loss'}`;

    // Renderizar estadísticas por estrategia
    renderStrategyStats();
}

function renderStrategyStats() {
    const stats = calculateStrategyStats();

    Object.keys( stats ).forEach( strategy => {
        const strategyElement = document.querySelector( `.strategy-stats[data-strategy="${strategy}"]` );
        if ( strategyElement ) {
            const winRateElement = strategyElement.querySelector( '.strategy-winrate' );
            const pnlElement = strategyElement.querySelector( '.strategy-pnl' );
            const countElement = strategyElement.querySelector( '.strategy-count' );

            if ( winRateElement ) winRateElement.textContent = `${stats[ strategy ].winRate}%`;
            if ( pnlElement ) {
                pnlElement.textContent = `$${stats[ strategy ].pnl.toFixed( 2 )}`;
                pnlElement.className = stats[ strategy ].pnl >= 0 ? 'text-profit' : 'text-loss';
            }
            if ( countElement ) countElement.textContent = stats[ strategy ].count;
        }
    } );
}

function renderCapitalSection() {
    const inputCapital = document.getElementById( 'currentCapitalDisplay' );
    inputCapital.value = currentCapital.toFixed( 2 );

    document.getElementById( 'maxDailyRisk' ).textContent = `$${( currentCapital * 0.05 ).toFixed( 2 )}`;

    // Actualizar calculadora de estrategia
    updateStrategyCalculator();
}

function updateStrategyCalculator() {
    const selectedStrategy = document.getElementById( 'strategySelect' )?.value || 'regulares';
    const config = strategyConfigs[ selectedStrategy ];

    if ( config ) {
        document.getElementById( 'strategyWinRate' ).textContent = `${config.winRate}%`;
        document.getElementById( 'strategyRR' ).textContent = `${config.rrRatio}:1`;
        document.getElementById( 'strategyRiskPercent' ).textContent = `${config.riskPercent}%`;

        const maxRisk = ( currentCapital * config.riskPercent ) / 100;
        const optimalContracts = calculateOptimalContracts( selectedStrategy );

        document.getElementById( 'maxRiskPerTrade' ).textContent = `$${maxRisk.toFixed( 2 )}`;
        document.getElementById( 'optimalContracts' ).textContent = optimalContracts;
        document.getElementById( 'suggestedSL' ).textContent = `${config.stopLoss} pips`;
        document.getElementById( 'takeProfit1' ).textContent = `${config.takeProfit1} pips`;
        document.getElementById( 'takeProfit2' ).textContent = `${config.takeProfit2} pips`;
    }
}

function renderTrades() {
    const tbody = document.getElementById( 'tradesTableBody' );
    if ( !tbody ) return;

    let filteredTrades = [ ...trades ];

    // Aplicar filtros
    const strategyFilter = document.getElementById( 'filterStrategy' )?.value;
    const resultFilter = document.getElementById( 'filterResult' )?.value;
    const dateFilter = document.getElementById( 'filterDate' )?.value;

    if ( strategyFilter ) {
        filteredTrades = filteredTrades.filter( trade => trade.strategy === strategyFilter );
    }

    if ( resultFilter ) {
        filteredTrades = filteredTrades.filter( trade => trade.result === resultFilter );
    }

    if ( dateFilter ) {
        filteredTrades = filteredTrades.filter( trade => trade.date === dateFilter );
    }

    // Ordenar por fecha descendente
    filteredTrades.sort( ( a, b ) => new Date( b.date ) - new Date( a.date ) );

    tbody.innerHTML = filteredTrades.map( trade => {
        const strategyName = strategyConfigs[ trade.strategy ]?.name || trade.strategy;
        const pnlClass = parseFloat( trade.pnl ) >= 0 ? 'text-profit' : 'text-loss';

        return `
            <tr class="border-b border-gray-700 hover:bg-gray-800">
                <td class="p-3">${new Date( trade.date ).toLocaleDateString()}</td>
                <td class="p-3">${strategyName}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs ${trade.direction === 'buy' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}">
                        ${trade.direction === 'buy' ? 'Compra' : 'Venta'}
                    </span>
                </td>
                <td class="p-3">${trade.contracts}</td>
                <td class="p-3">${trade.sl} pips</td>
                <td class="p-3">${trade.tp} pips</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs ${trade.result === 'win' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}">
                        ${trade.result === 'win' ? 'Ganador' : 'Perdedor'}
                    </span>
                </td>
                <td class="p-3 ${pnlClass} font-semibold">$${parseFloat( trade.pnl ).toFixed( 2 )}</td>
                <td class="p-3">
                    <span class="cursor-pointer text-blue-400 hover:text-blue-300" 
                          onclick="showCommentTooltip(event, '${trade.comments.replace( /'/g, "\\'" )}')">
                        ${trade.comments.length > 20 ? trade.comments.substring( 0, 20 ) + '...' : trade.comments}
                    </span>
                </td>
                <td class="p-3">
                    <button onclick="deleteTrade('${trade.id}')" 
                            class="text-red-400 hover:text-red-300 text-sm">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    } ).join( '' );
}

function renderObservations() {
    const container = document.getElementById( 'observationsList' );
    if ( !container ) return;

    const sortedObservations = [ ...observations ].sort( ( a, b ) =>
        new Date( b.timestamp ) - new Date( a.timestamp )
    );

    container.innerHTML = sortedObservations.map( obs => `
        <div class="bg-gray-800 p-3 rounded-lg border border-gray-600">
            <p class="text-sm">${obs.text}</p>
            <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-gray-500">${obs.date}</span>
                <button onclick="deleteObservation('${obs.id}')" 
                        class="text-red-400 hover:text-red-300 text-xs">
                    Eliminar
                </button>
            </div>
        </div>
    `).join( '' );
}

function renderRecentWithdrawals() {
    const container = document.getElementById( 'recentWithdrawals' );
    if ( !container ) return;

    const recentWithdrawals = withdrawals
        .sort( ( a, b ) => new Date( b.timestamp ) - new Date( a.timestamp ) )
        .slice( 0, 3 );

    container.innerHTML = recentWithdrawals.map( w => `
        <div class="text-sm bg-gray-800 p-2 rounded">
            <div class="flex justify-between">
                <span>${w.concept}</span>
                <span class="text-orange-400">-$${w.amount.toFixed( 2 )}</span>
            </div>
            <div class="text-xs text-gray-500">${new Date( w.date ).toLocaleDateString()}</div>
        </div>
    `).join( '' ) || '<p class="text-sm text-gray-500">No hay retiros recientes</p>';
}

function renderSetupChecklist() {
    const strategy = document.getElementById( 'setupStrategy' )?.value || 'regulares';
    const checklist = setupChecklists[ strategy ] || [];
    const container = document.getElementById( 'setupChecklist' );

    if ( !container ) return;

    container.innerHTML = checklist.map( ( item, index ) => `
        <div class="flex items-start space-x-3">
            <input type="checkbox" id="check_${index}" 
                   class="mt-1 rounded text-gold focus:ring-gold" 
                   onchange="updateSetupScore()">
            <label for="check_${index}" class="text-sm flex-1">${item}</label>
        </div>
    `).join( '' );

    updateSetupScore();
}

function updateSetupScore() {
    const checkboxes = document.querySelectorAll( '#setupChecklist input[type="checkbox"]' );
    const checkedCount = Array.from( checkboxes ).filter( cb => cb.checked ).length;
    const totalCount = checkboxes.length;
    const score = Math.round( ( checkedCount / totalCount ) * 100 );

    const scoreElement = document.getElementById( 'scoreValue' );
    const scoreBar = document.getElementById( 'scoreBar' );
    const executeBtn = document.getElementById( 'executeSetupBtn' );
    const scoreContainer = document.getElementById( 'setupScore' );

    if ( scoreElement ) scoreElement.textContent = `${score}%`;
    if ( scoreContainer ) scoreContainer.classList.remove( 'hidden' );

    if ( scoreBar ) {
        scoreBar.style.width = `${score}%`;
        if ( score >= 80 ) {
            scoreBar.className = 'h-2 rounded-full bg-profit transition-all duration-300';
            if ( scoreElement ) scoreElement.className = 'text-2xl font-bold text-profit';
        } else if ( score >= 60 ) {
            scoreBar.className = 'h-2 rounded-full bg-gold transition-all duration-300';
            if ( scoreElement ) scoreElement.className = 'text-2xl font-bold text-gold';
        } else {
            scoreBar.className = 'h-2 rounded-full bg-loss transition-all duration-300';
            if ( scoreElement ) scoreElement.className = 'text-2xl font-bold text-loss';
        }
    }

    if ( executeBtn ) {
        executeBtn.disabled = score < 70;
        executeBtn.className = score >= 70
            ? 'flex-1 bg-profit hover:bg-green-600 px-4 py-2 rounded-lg font-medium'
            : 'flex-1 bg-gray-600 px-4 py-2 rounded-lg font-medium cursor-not-allowed';
    }
}

function renderAllData() {
    renderDashboard();
    renderCapitalSection();
    renderTrades();
    renderObservations();
    renderRecentWithdrawals();
    if ( currentTab === 'signals' ) {
        renderSetupChecklist();
    }
}

// ===== FUNCIONES DE INTERFAZ =====
function switchTab( tabName ) {
    // Ocultar todos los tabs
    document.querySelectorAll( '.tab-content' ).forEach( tab => {
        tab.classList.add( 'hidden' );
    } );

    // Mostrar el tab seleccionado
    const selectedTab = document.getElementById( tabName );
    if ( selectedTab ) {
        selectedTab.classList.remove( 'hidden' );
    }

    // Actualizar botones de navegación
    document.querySelectorAll( '.tab-btn' ).forEach( btn => {
        btn.classList.remove( 'border-gold', 'text-gold' );
        btn.classList.add( 'border-transparent' );
    } );

    const activeBtn = document.querySelector( `.tab-btn[data-tab="${tabName}"]` );
    if ( activeBtn ) {
        activeBtn.classList.add( 'border-gold', 'text-gold' );
        activeBtn.classList.remove( 'border-transparent' );
    }

    currentTab = tabName;

    // Renderizar datos específicos del tab
    if ( tabName === 'signals' ) {
        renderSetupChecklist();
    }
}

function showModal( modalId ) {
    const modal = document.getElementById( modalId );
    if ( modal ) {
        modal.classList.remove( 'hidden' );
        modal.classList.add( 'flex' );
    }
}

function hideModal( modalId ) {
    const modal = document.getElementById( modalId );
    if ( modal ) {
        modal.classList.add( 'hidden' );
        modal.classList.remove( 'flex' );
    }
}

function showCommentTooltip( event, comment ) {
    const tooltip = document.getElementById( 'commentTooltip' );
    const content = document.getElementById( 'tooltipContent' );

    if ( tooltip && content && comment ) {
        content.textContent = comment;
        tooltip.classList.remove( 'hidden' );

        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 5}px`;

        // Ocultar tooltip al hacer click fuera
        setTimeout( () => {
            const hideTooltip = ( e ) => {
                if ( !tooltip.contains( e.target ) ) {
                    tooltip.classList.add( 'hidden' );
                    document.removeEventListener( 'click', hideTooltip );
                }
            };
            document.addEventListener( 'click', hideTooltip );
        }, 100 );
    }
}

function updateCurrentTime() {
    const timeElement = document.getElementById( 'currentTime' );
    if ( timeElement ) {
        const now = new Date();
        timeElement.textContent = now.toLocaleString( 'es-ES', {
            timeZone: 'America/Lima',
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        } );
    }
}

function calculatePnLFromPrices() {
    const entryPrice = parseFloat( document.getElementById( 'entryPrice' )?.value || 0 );
    const exitPrice = parseFloat( document.getElementById( 'exitPrice' )?.value || 0 );
    const contracts = parseInt( document.getElementById( 'tradeContracts' )?.value || 1 );
    const direction = document.getElementById( 'tradeDirection' )?.value;

    if ( entryPrice && exitPrice && contracts && direction ) {
        let pnl = 0;
        // Para oro: cada punto = $1 por contrato (no cada pip)
        const pointDifference = Math.abs( exitPrice - entryPrice );

        if ( direction === 'buy' ) {
            pnl = exitPrice > entryPrice ? pointDifference * contracts : -pointDifference * contracts;
        } else { // sell
            pnl = exitPrice < entryPrice ? pointDifference * contracts : -pointDifference * contracts;
        }

        const pnlInput = document.getElementById( 'tradePnL' );
        if ( pnlInput ) {
            pnlInput.value = pnl.toFixed( 2 );

            // Actualizar automáticamente el resultado
            const resultSelect = document.getElementById( 'tradeResult' );
            if ( resultSelect ) {
                resultSelect.value = pnl >= 0 ? 'win' : 'loss';
            }
        }
    }
}

function exportTradesToCSV() {
    if ( trades.length === 0 ) {
        alert( 'No hay trades para exportar' );
        return;
    }

    const headers = [ 'Fecha', 'Estrategia', 'Dirección', 'Contratos', 'SL (pips)', 'TP (pips)', 'Resultado', 'P&L ($)', 'Comentarios' ];

    const csvContent = [
        headers.join( ',' ),
        ...trades.map( trade => [
            trade.date,
            strategyConfigs[ trade.strategy ]?.name || trade.strategy,
            trade.direction === 'buy' ? 'Compra' : 'Venta',
            trade.contracts,
            trade.sl,
            trade.tp,
            trade.result === 'win' ? 'Ganador' : 'Perdedor',
            trade.pnl,
            `"${trade.comments.replace( /"/g, '""' )}"`
        ].join( ',' ) )
    ].join( '\n' );

    const blob = new Blob( [ csvContent ], { type: 'text/csv' } );
    const url = window.URL.createObjectURL( blob );
    const a = document.createElement( 'a' );

    a.style.display = 'none';
    a.href = url;
    a.download = `trades_${new Date().toISOString().split( 'T' )[ 0 ]}.csv`;

    document.body.appendChild( a );
    a.click();
    window.URL.revokeObjectURL( url );
    document.body.removeChild( a );
}

function deleteObservation( obsId ) {
    observations = observations.filter( obs => obs.id !== obsId );
    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }
    renderObservations();
}

// ===== EVENT LISTENERS =====
document.addEventListener( 'DOMContentLoaded', function () {
    isInitializing = true;

    // Cargar datos locales inicialmente
    loadDataLocally();
    renderAllData();

    // Inicializar elementos
    updateCurrentTime();
    setInterval( updateCurrentTime, 60000 );

    // Establecer fecha actual en formularios
    const today = new Date().toISOString().split( 'T' )[ 0 ];
    const dateInputs = [ 'tradeDate', 'withdrawalDate', 'addCapitalDate' ];
    dateInputs.forEach( id => {
        const input = document.getElementById( id );
        if ( input ) input.value = today;
    } );

    // ===== AUTH EVENT LISTENERS =====
    auth.onAuthStateChanged( function ( user ) {
        if ( user ) {
            currentUser = user;
            showUserMenu( user );
            // Ocultar modal si está visible cuando el usuario se autentica
            hideAuthModal();
            hasShownAuthModal = true;
            loadDataFromFirebase().then( () => {
                isInitializing = false;
            } );
        } else {
            currentUser = null;
            showGuestSection();
            isInitializing = false;
            // NO resetear hasShownAuthModal aquí para evitar modal automático tras logout
        }
    } );

    // Dropdown del usuario
    document.getElementById( 'userPhoto' )?.addEventListener( 'click', function () {
        const dropdown = document.getElementById( 'userDropdown' );
        if ( dropdown ) {
            dropdown.classList.toggle( 'hidden' );

            // Actualizar nombre en dropdown
            const userNameInDropdown = document.getElementById( 'userNameInDropdown' );
            if ( userNameInDropdown && currentUser ) {
                userNameInDropdown.textContent = currentUser.displayName || currentUser.email;
            }
        }
    } );

    // Cerrar dropdown al hacer click fuera
    document.addEventListener( 'click', function ( e ) {
        const userPhoto = document.getElementById( 'userPhoto' );
        const dropdown = document.getElementById( 'userDropdown' );

        if ( userPhoto && dropdown && !userPhoto.contains( e.target ) && !dropdown.contains( e.target ) ) {
            dropdown.classList.add( 'hidden' );
        }
    } );

    // Botones de autenticación
    document.getElementById( 'googleSignInBtn' )?.addEventListener( 'click', signInWithGoogle );
    document.getElementById( 'topGoogleSignInBtn' )?.addEventListener( 'click', signInWithGoogle );
    document.getElementById( 'signOutBtn' )?.addEventListener( 'click', signOut );
    document.getElementById( 'continueOfflineBtn' )?.addEventListener( 'click', hideAuthModal );

    // ===== TAB NAVIGATION =====
    document.querySelectorAll( '.tab-btn' ).forEach( btn => {
        btn.addEventListener( 'click', function () {
            const tabName = this.getAttribute( 'data-tab' );
            switchTab( tabName );
        } );
    } );

    // ===== CAPITAL MANAGEMENT =====
    document.getElementById( 'addCapitalBtn' )?.addEventListener( 'click', () => {
        showModal( 'addCapitalModal' );
    } );

    document.getElementById( 'withdrawalBtn' )?.addEventListener( 'click', () => {
        showModal( 'withdrawalModal' );
    } );

    document.getElementById( 'resetCapitalBtn' )?.addEventListener( 'click', () => {
        showModal( 'resetConfirmModal' );
    } );

    // Formulario agregar capital
    document.getElementById( 'addCapitalForm' )?.addEventListener( 'submit', function ( e ) {
        e.preventDefault();

        const amount = parseFloat( document.getElementById( 'addCapitalAmount' ).value );
        const concept = document.getElementById( 'addCapitalConcept' ).value || 'Adición de capital';
        const notes = document.getElementById( 'addCapitalNotes' ).value || '';
        const date = document.getElementById( 'addCapitalDate' ).value;

        if ( amount > 0 ) {
            addCapital( amount, concept, notes, date );
            this.reset();
            document.getElementById( 'addCapitalDate' ).value = new Date().toISOString().split( 'T' )[ 0 ];
            hideModal( 'addCapitalModal' );

            // Mostrar notificación
            updateSyncStatus( `Capital agregado: +${amount.toFixed( 2 )}`, true );
        }
    } );

    // Formulario retiro
    document.getElementById( 'withdrawalForm' )?.addEventListener( 'submit', function ( e ) {
        e.preventDefault();

        const amount = parseFloat( document.getElementById( 'withdrawalAmount' ).value );
        const concept = document.getElementById( 'withdrawalConcept' ).value || 'Retiro';
        const notes = document.getElementById( 'withdrawalNotes' ).value || '';
        const date = document.getElementById( 'withdrawalDate' ).value;

        if ( amount > 0 && amount <= currentCapital ) {
            registerWithdrawal( amount, concept, notes, date );
            this.reset();
            document.getElementById( 'withdrawalDate' ).value = new Date().toISOString().split( 'T' )[ 0 ];
            hideModal( 'withdrawalModal' );

            // Mostrar notificación
            updateSyncStatus( `Retiro registrado: -${amount.toFixed( 2 )}`, true );
        } else {
            alert( amount > currentCapital ? 'No tienes suficiente capital' : 'Ingrese una cantidad válida' );
        }
    } );

    // Confirmación de reset
    document.getElementById( 'confirmResetBtn' )?.addEventListener( 'click', () => {
        resetAllData();
        hideModal( 'resetConfirmModal' );
        updateSyncStatus( 'Capital y datos reseteados', true );
    } );

    // Botones de cancelar modales
    document.getElementById( 'cancelAddCapitalBtn' )?.addEventListener( 'click', () => hideModal( 'addCapitalModal' ) );
    document.getElementById( 'cancelWithdrawalBtn' )?.addEventListener( 'click', () => hideModal( 'withdrawalModal' ) );
    document.getElementById( 'cancelResetBtn' )?.addEventListener( 'click', () => hideModal( 'resetConfirmModal' ) );

    // ===== STRATEGY CALCULATOR =====
    document.getElementById( 'strategySelect' )?.addEventListener( 'change', updateStrategyCalculator );

    // ===== TRADES =====
    document.getElementById( 'addTradeBtn' )?.addEventListener( 'click', () => {
        showModal( 'tradeModal' );
    } );

    document.getElementById( 'exportTradesBtn' )?.addEventListener( 'click', exportTradesToCSV );

    // Filtros de trades
    document.getElementById( 'filterStrategy' )?.addEventListener( 'change', renderTrades );
    document.getElementById( 'filterResult' )?.addEventListener( 'change', renderTrades );
    document.getElementById( 'filterDate' )?.addEventListener( 'change', renderTrades );

    // Formulario de trade
    document.getElementById( 'tradeForm' )?.addEventListener( 'submit', function ( e ) {
        e.preventDefault();

        const tradeData = {
            date: document.getElementById( 'tradeDate' ).value,
            strategy: document.getElementById( 'tradeStrategy' ).value,
            direction: document.getElementById( 'tradeDirection' ).value,
            contracts: parseInt( document.getElementById( 'tradeContracts' ).value ),
            sl: parseInt( document.getElementById( 'tradeSL' ).value ),
            tp: parseInt( document.getElementById( 'tradeTP' ).value ),
            result: document.getElementById( 'tradeResult' ).value,
            pnl: parseFloat( document.getElementById( 'tradePnL' ).value ),
            comments: document.getElementById( 'tradeComments' ).value || ''
        };

        addTrade( tradeData );
        this.reset();
        document.getElementById( 'tradeDate' ).value = new Date().toISOString().split( 'T' )[ 0 ];
        hideModal( 'tradeModal' );

        updateSyncStatus( 'Trade agregado correctamente', true );
    } );

    document.getElementById( 'cancelTradeBtn' )?.addEventListener( 'click', () => hideModal( 'tradeModal' ) );

    // Cálculo automático de P&L
    [ 'entryPrice', 'exitPrice', 'tradeContracts', 'tradeDirection' ].forEach( id => {
        document.getElementById( id )?.addEventListener( 'input', calculatePnLFromPrices );
    } );

    // ===== SIGNALS & SETUP =====
    document.getElementById( 'setupStrategy' )?.addEventListener( 'change', renderSetupChecklist );

    document.getElementById( 'executeSetupBtn' )?.addEventListener( 'click', () => {
        const strategy = document.getElementById( 'setupStrategy' ).value;
        const score = parseInt( document.getElementById( 'scoreValue' ).textContent );

        if ( score >= 70 ) {
            // Redirigir al formulario de trade con estrategia preseleccionada
            document.getElementById( 'tradeStrategy' ).value = strategy;
            showModal( 'tradeModal' );

            // Reset checklist
            document.querySelectorAll( '#setupChecklist input[type="checkbox"]' ).forEach( cb => {
                cb.checked = false;
            } );
            updateSetupScore();
        }
    } );

    document.getElementById( 'discardSetupBtn' )?.addEventListener( 'click', () => {
        // Reset checklist
        document.querySelectorAll( '#setupChecklist input[type="checkbox"]' ).forEach( cb => {
            cb.checked = false;
        } );
        updateSetupScore();
    } );

    // ===== DISCIPLINE =====
    document.getElementById( 'addObservationBtn' )?.addEventListener( 'click', () => {
        const text = document.getElementById( 'observationInput' ).value.trim();
        if ( text ) {
            addObservation( text );
            document.getElementById( 'observationInput' ).value = '';
            updateSyncStatus( 'Observación agregada', true );
        }
    } );

    // ===== MODAL CLOSE ON OUTSIDE CLICK =====
    document.addEventListener( 'click', function ( e ) {
        const modals = [ 'tradeModal', 'withdrawalModal', 'addCapitalModal', 'resetConfirmModal' ];
        modals.forEach( modalId => {
            const modal = document.getElementById( modalId );
            if ( modal && e.target === modal ) {
                hideModal( modalId );
            }
        } );
    } );

    // Mostrar modal de autenticación después de un retraso si no está logueado
    setTimeout( () => {
        // Solo mostrar modal si nunca se ha autenticado en esta sesión
        if ( !currentUser && !isInitializing && !hasShownAuthModal ) {
            showAuthModal();
        }
    }, 3000 );
} );

// ===== FUNCIONES GLOBALES =====
window.deleteTrade = deleteTrade;
window.deleteObservation = deleteObservation;
window.showCommentTooltip = showCommentTooltip;
window.updateSetupScore = updateSetupScore;
