// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD3-dDGO-8fXo-l5MdZ0ip6y4q8VC3v0Og",
    authDomain: "tradingapp-9c93a.firebaseapp.com",
    projectId: "tradingapp-9c93a",
    storageBucket: "tradingapp-9c93a.firebasestorage.app",
    messagingSenderId: "1047446621998",
    appId: "1:1047446621998:web:829b640a8dba719b08f4bf",
};

// Inicializar Firebase
firebase.initializeApp( firebaseConfig );

// Referencias a los servicios
const auth = firebase.auth();
const db = firebase.firestore();

auth
    .setPersistence( firebase.auth.Auth.Persistence.LOCAL )
    .then( () => {
        console.log( "Persistencia de autenticación configurada" );
    } )
    .catch( ( error ) => {
        console.log( "Error configurando persistencia:", error );
    } );

// Variables globales
let trades = [];
let observations = [];
let withdrawals = [];
let capitalAdditions = [];
let currentCapital = 0;
let currentTab = "signals";
let currentUser = null;
let isInitializing = true;
let hasShownWelcomeBanner = false;
let hasShownAuthModal = false;
let criticalLevels = {
    resistances: [],
    supports: [],
    lastUpdate: null,
};
let editingTradeId = null;

// Configuraciones de estrategias
const strategyConfigs = {
    regulares: {
        name: "Trades Regulares",
        riskPercent: 2.0,
        stopLoss: 6,
        takeProfit1: 13,
        takeProfit2: 24,
        winRate: 65,
        rrRatio: 2.2,
        timeframes: "4H/1h → 15M → 3M"
    },
    "ema-macd": {
        name: "EMA + MACD",
        riskPercent: 3.0,
        stopLoss: 5,
        takeProfit1: 12,
        takeProfit2: 22,
        winRate: 62,
        rrRatio: 2.4,
        timeframes: "4H → 1H → 15M → 5M"
    },
    "contra-tendencia": {
        name: "Contra-Tendencia Flexible",
        riskPercent: 2.5,
        stopLoss: 6,
        takeProfit1: 15,
        takeProfit2: 28, // TP2 extendible +10 con ruptura EMA
        winRate: 48,
        rrRatio: 2.8,
        timeframes: "4H → 1H → 15M → 5M" // Actualizado para reflejar todos los TF
    },
    extremos: {
        name: "Trades Extremos",
        riskPercent: 3.0,
        stopLoss: 5,
        takeProfit1: 13,
        takeProfit2: 25,
        winRate: 65,
        rrRatio: 2.6,
        timeframes: "4H → 1H → 15M"
    }
};

// Setup checklists para cada estrategia
const setupChecklists = {
    regulares: [
        // PASO 1 - Contexto 4H (3 de 4 requerido)
        "4H Estructura + MACD sin divergencia(operar a favor) | con divergencia(operar contra)",
        "4H/1h: Williams %R saliendo de extremo -80↗ O -50↗ compra | -20↘ O -50↘ venta)",
        "✨Refuerzo(1h): Mecha larga en S/R ≥ 5 pips en ultima vela",
        // PASO 2 - Validacion 15M (3 de 4 requerido)
        "15M: Williams %R subiendo de -80/-60 (compras) | bajando de -20/-30 (ventas)",
        "15M: Precio rebota/rompe S/R o ema21/50 + patrón con volumen",
        "15M: MACD líneas por cruzar o cruzando en zona retesteada",
        "✨Refuerzo(15M): EMA21 cruza EMA50 en dirección del trade",
        // PASO 3 - Confirmación 3M (2 de 3 requerido)
        "3M: Williams %R girando de -80/-60↗ O -50↗ compra | -20/-40↘ O -50↘ venta)",
        "3M: Precio rebota EMA 21/50 O rompe estructura con volumen 1.2x",
        "✨Refuerzo(3M): MACD: Cruce de líneas + histograma creciente",
    ],

    // Mantener las otras estrategias existentes...
    "ema-macd": [
        "4H: MACD sin divergencia bajista + histograma creciendo 2+ velas",
        "4H: Precio supera +2 resistencias/soportes clave",
        "4H: En zona soporte técnico o retesteo de nivel roto",
        "H1: EMA 21 cruza EMA 50 con separación >3 pips",
        "H1: MACD líneas por cruzar hacia dirección del trade",
        "H1: Precio rebota/rompe en zona soporte/resistencia",
        "H1: Precio encima/debajo EMA 21 por 3+ velas",
        "15M: Histograma MACD creciendo/decreciendo 2+ velas",
        "15M: Precio encima/debajo ambas EMAs por 2+ velas",
        "5M: Vela rebota en EMA con histograma confirmando"
    ],

    "contra-tendencia": [
        "4H: Tendencia clara 24H+ (EMA 21 vs EMA 50 correcta)",
        "4H: Precio en zona crítica S/R fuerte identificada",
        "H1: MACD divergencia confirmada O línea señal aplanándose/girando",
        "H1: Mechas rechazo 3+ pips en soporte O 4+ pips en resistencia",
        "15M: Williams %R extremos (<-75 compra, >-25 venta) por 2+ velas",
        "15M: Nivel crítico retestado 2+ veces (volumen direccional correcto)",
        "15M: Patrón vela válido (martillo/doji/mecha >50% cuerpo)",
        "15M: MACD líneas cambiando dirección O divergencia confirmada",
        "5M: Williams girando desde extremo (<-80→>-70 O >-20→<-30)",
        "5M: Volumen explosivo >1.3x promedio últimas 10 velas",
        "5M: MACD líneas e histograma en dirección del trade"
    ],

    extremos: [
        "Precio en zona crítica histórica ±5 pips",
        "4H: Williams %R extremo (-95/-85 o -15/-5)",
        "4H: Mecha institucional 8+ pips tras movimiento 35+ pips",
        "Volumen explosivo: 4H (2x) + 1H (1.8x) promedio",
        "EMA: Precio superando/cayendo EMA 21/50 con fuerza",
        "MACD: Triple divergencia (4H, 1H, 15M)",
        "15M: Rebote/rechazo confirmado en EMA o nivel"
    ]
};

// Configurar proveedor de autenticación de Google
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope( "profile" );
provider.addScope( "email" );

// AGREGAR estas configuraciones adicionales:
provider.setCustomParameters( {
    login_hint: "user@example.com",
} );

// Configurar parámetros adicionales para evitar problemas de CORS
auth.useDeviceLanguage();

// ===== FUNCIONES DE AUTENTICACIÓN =====
function showAuthModal() {
    // Solo mostrar si no está logueado, no está inicializando Y no se ha mostrado antes en esta sesión
    if ( !currentUser && !isInitializing && !hasShownAuthModal ) {
        document.getElementById( "authModal" ).classList.remove( "hidden" );
        hasShownAuthModal = true;
    }
}

// Funciones para manejar cookies
function setCookie( name, value, days = 365 ) {
    const expires = new Date();
    expires.setTime( expires.getTime() + days * 24 * 60 * 60 * 1000 );
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie( name ) {
    const nameEQ = name + "=";
    const ca = document.cookie.split( ";" );
    for ( let i = 0; i < ca.length; i++ ) {
        let c = ca[ i ];
        while ( c.charAt( 0 ) === " " ) c = c.substring( 1, c.length );
        if ( c.indexOf( nameEQ ) === 0 ) return c.substring( nameEQ.length, c.length );
    }
    return null;
}

function deleteCookie( name ) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function hideAuthModal() {
    document.getElementById( "authModal" ).classList.add( "hidden" );
}

function closeAuthModal() {
    document.getElementById( "authModal" ).classList.add( "hidden" );
}

function showUserMenu( user ) {
    const guestSection = document.getElementById( "guestSection" );
    const userMenu = document.getElementById( "userMenu" );
    const userPhoto = document.getElementById( "userPhoto" );

    if ( guestSection ) guestSection.classList.add( "hidden" );

    if ( userPhoto ) {
        userPhoto.src = user.photoURL || "https://via.placeholder.com/32";
        userPhoto.title = `${user.displayName || user.email} - Click para opciones`;
    }

    if ( userMenu ) userMenu.classList.remove( "hidden" );

    // Mostrar banner de bienvenida
    showWelcomeBanner( user );
}

function showWelcomeBanner( user ) {
    // Solo mostrar si no se ha mostrado antes en esta sesión
    if ( hasShownWelcomeBanner ) return;

    const banner = document.getElementById( "welcomeBanner" );
    const userPhoto = document.getElementById( "welcomeUserPhoto" );
    const userName = document.getElementById( "welcomeUserName" );

    if ( banner && userPhoto && userName ) {
        userPhoto.src = user.photoURL || "https://via.placeholder.com/32";
        userName.textContent = user.displayName || user.email;

        banner.classList.remove( "hidden" );
        banner.style.transform = "translateY(0)";
        hasShownWelcomeBanner = true;

        // Ocultar después de 5 segundos
        setTimeout( () => {
            banner.style.transform = "translateY(-100%)";
            setTimeout( () => {
                banner.classList.add( "hidden" );
            }, 500 );
        }, 5000 );
    }
}

function showGuestSection() {
    const guestSection = document.getElementById( "guestSection" );
    const userMenu = document.getElementById( "userMenu" );

    if ( userMenu ) userMenu.classList.add( "hidden" );
    if ( guestSection ) guestSection.classList.remove( "hidden" );
}

function updateSyncStatus( status, isOnline = true ) {
    const syncStatus = document.getElementById( "syncStatus" );
    const syncIndicator = document.getElementById( "syncIndicator" );
    const syncText = document.getElementById( "syncText" );

    if ( syncText ) syncText.textContent = status;
    if ( syncIndicator ) {
        syncIndicator.className = `w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`;
    }

    if ( syncStatus ) syncStatus.classList.remove( "hidden" );

    if ( isOnline ) {
        setTimeout( () => {
            if ( syncStatus ) syncStatus.classList.add( "hidden" );
        }, 3000 );
    }
}

function signInWithGoogle() {
    // Configurar opciones adicionales para el popup
    const authOptions = {
        prompt: "select_account",
    };

    auth
        .signInWithPopup( provider, authOptions )
        .then( ( result ) => {
            hideAuthModal();
            authModalShownInSession = true;
            updateSyncStatus( "Conectado y sincronizado", true );
        } )
        .catch( ( error ) => {
            console.error( "Error al iniciar sesión:", error );

            // Si falla el popup, intentar con redirect como fallback
            if (
                error.code === "auth/popup-blocked" ||
                error.code === "auth/popup-closed-by-user"
            ) {
                console.log( "Popup bloqueado, intentando redirect..." );
                auth.signInWithRedirect( provider );
            }

            updateSyncStatus( "Error de conexión", false );
        } );
}

function signOut() {
    auth
        .signOut()
        .then( () => {
            showGuestSection();
            updateSyncStatus( "Desconectado", false );
            // NO resetear hasShownAuthModal aquí para evitar que aparezca el modal automáticamente
        } )
        .catch( ( error ) => {
            console.error( "Error al cerrar sesión:", error );
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
        criticalLevels: criticalLevels,
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
    };

    return db.collection( "users" ).doc( currentUser.uid ).set( userData );
}

function loadDataFromFirebase() {
    if ( !currentUser ) return Promise.resolve();

    return db
        .collection( "users" )
        .doc( currentUser.uid )
        .get()
        .then( ( doc ) => {
            if ( doc.exists ) {
                const data = doc.data();
                trades = data.trades || [];
                observations = data.observations || [];
                withdrawals = data.withdrawals || [];
                capitalAdditions = data.capitalAdditions || [];
                currentCapital = data.currentCapital || 0;

                criticalLevels = data.criticalLevels || { resistances: [], supports: [], lastUpdate: null };
                updateLevelsLastUpdate();

                renderAllData();
                updateSyncStatus( "Datos sincronizados", true );
            }
        } )
        .catch( ( error ) => {
            console.error( "Error cargando datos:", error );
            updateSyncStatus( "Error de sincronización", false );
        } );
}

function saveDataLocally() {
    const data = {
        trades: trades,
        observations: observations,
        withdrawals: withdrawals,
        capitalAdditions: capitalAdditions,
        currentCapital: currentCapital,
        criticalLevels: criticalLevels
    };

    Object.keys( data ).forEach( ( key ) => {
        localStorage.setItem( `trading_${key}`, JSON.stringify( data[ key ] ) );
    } );
}

function loadDataLocally() {
    try {
        trades = JSON.parse( localStorage.getItem( "trading_trades" ) || "[]" );
        observations = JSON.parse(
            localStorage.getItem( "trading_observations" ) || "[]"
        );
        withdrawals = JSON.parse(
            localStorage.getItem( "trading_withdrawals" ) || "[]"
        );
        capitalAdditions = JSON.parse(
            localStorage.getItem( "trading_capitalAdditions" ) || "[]"
        );
        currentCapital = parseFloat(
            localStorage.getItem( "trading_currentCapital" ) || "0"
        );
        criticalLevels = JSON.parse( localStorage.getItem( 'trading_criticalLevels' ) ||
            '{"resistances":[],"supports":[],"lastUpdate":null}'
        );

    } catch ( error ) {
        console.error( "Error cargando datos locales:", error );
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
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
    };

    trades.push( trade );

    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    renderAllData();
}

function deleteTrade( tradeId ) {
    trades = trades.filter( ( trade ) => trade.id !== tradeId );

    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    renderAllData();
}

function editTrade( tradeId, updatedData ) {
    const tradeIndex = trades.findIndex( ( trade ) => trade.id === tradeId );
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
        timestamp: new Date().toISOString(),
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
    const winningTrades = trades.filter( ( trade ) => trade.result === "win" ).length;
    return Math.round( ( winningTrades / trades.length ) * 100 );
}

function calculateTotalPnL() {
    return trades.reduce( ( total, trade ) => total + parseFloat( trade.pnl || 0 ), 0 );
}

function calculateDailyPnL() {
    const today = new Date().toISOString().split( "T" )[ 0 ];
    const todayTrades = trades.filter( ( trade ) => trade.date === today );
    return todayTrades.reduce(
        ( total, trade ) => total + parseFloat( trade.pnl || 0 ),
        0
    );
}

function getTodayTradesCount() {
    const today = new Date().toISOString().split( "T" )[ 0 ];
    return trades.filter( ( trade ) => trade.date === today ).length;
}

function getTotalWithdrawals() {
    return withdrawals.reduce( ( total, w ) => total + parseFloat( w.amount || 0 ), 0 );
}

function calculateDrawdown() {
    const totalPnL = calculateTotalPnL();
    const effectiveCapital = calculateEffectiveCapital();

    if ( effectiveCapital === 0 ) return 0;

    // Calcular el drawdown como el porcentaje de pérdida desde el pico más alto
    const peakCapital = Math.max( effectiveCapital, currentCapital );
    const currentDrawdown = Math.max(
        0,
        ( ( peakCapital - effectiveCapital ) / peakCapital ) * 100
    );

    return Math.round( currentDrawdown );
}

function calculateStrategyStats() {
    const stats = {};

    Object.keys( strategyConfigs ).forEach( ( strategy ) => {
        const strategyTrades = trades.filter(
            ( trade ) => trade.strategy === strategy
        );
        const wins = strategyTrades.filter(
            ( trade ) => trade.result === "win"
        ).length;
        const winRate =
            strategyTrades.length > 0
                ? Math.round( ( wins / strategyTrades.length ) * 100 )
                : 0;
        const pnl = strategyTrades.reduce(
            ( total, trade ) => total + parseFloat( trade.pnl || 0 ),
            0
        );

        stats[ strategy ] = {
            winRate: winRate,
            pnl: pnl,
            count: strategyTrades.length,
        };
    } );

    return stats;
}

// 10. Función para actualizar el desglose de capital
function updateCapitalBreakdown() {
    const totalPnL = calculateTotalPnL();
    const effectiveCapital = calculateEffectiveCapital();

    const baseCapitalEl = document.getElementById( "baseCapital" );
    const tradingPnLEl = document.getElementById( "tradingPnL" );
    const effectiveCapitalEl = document.getElementById( "effectiveCapitalDisplay" );

    if ( baseCapitalEl )
        baseCapitalEl.textContent = `$${currentCapital.toFixed( 2 )}`;

    if ( tradingPnLEl ) {
        tradingPnLEl.textContent = `$${totalPnL.toFixed( 2 )}`;
        tradingPnLEl.className = `text-lg font-bold ${totalPnL >= 0 ? "text-profit" : "text-loss"}`;
    }

    if ( effectiveCapitalEl ) {
        effectiveCapitalEl.textContent = `$${effectiveCapital.toFixed( 2 )}`;
        effectiveCapitalEl.className = `text-lg font-bold ${effectiveCapital >= currentCapital ? "text-profit" : "text-loss"}`;
    }
}

// ===== FUNCIONES DE RENDERIZADO =====
function renderDashboard() {
    const winRate = calculateWinRate();
    const totalPnL = calculateTotalPnL();
    const dailyPnL = calculateDailyPnL();
    const todayTrades = getTodayTradesCount();
    const totalWithdrawals = getTotalWithdrawals();
    const drawdown = calculateDrawdown();
    const effectiveCapital = calculateEffectiveCapital();
    const maxDailyRisk = effectiveCapital * 0.05; // Usar capital efectivo para el riesgo

    // Actualizar elementos del dashboard
    document.getElementById( "dashCapital" ).textContent =
        `$${effectiveCapital.toFixed( 2 )}`;
    document.getElementById( "dashRisk" ).textContent =
        `$${maxDailyRisk.toFixed( 2 )}`;
    document.getElementById( "currentWinRate" ).textContent = `${winRate}%`;
    document.getElementById( "totalTrades" ).textContent = trades.length;

    const dailyPnLElement = document.getElementById( "dailyPnL" );
    dailyPnLElement.textContent = `$${dailyPnL.toFixed( 2 )}`;
    dailyPnLElement.className = `text-lg sm:text-xl font-bold ${dailyPnL >= 0 ? "text-profit" : "text-loss"}`;

    document.getElementById( "drawdown" ).textContent = `${drawdown}%`;
    document.getElementById( "todayTrades" ).textContent = todayTrades;
    document.getElementById( "totalWithdrawals" ).textContent =
        `$${totalWithdrawals.toFixed( 2 )}`;

    const totalPnLElement = document.getElementById( "totalPnL" );
    totalPnLElement.textContent = `$${totalPnL.toFixed( 2 )}`;
    totalPnLElement.className = `text-lg sm:text-xl font-bold ${totalPnL >= 0 ? "text-profit" : "text-loss"}`;

    // Renderizar estadísticas por estrategia
    renderStrategyStats();
}

function renderStrategyStats() {
    const stats = calculateStrategyStats();

    Object.keys( stats ).forEach( ( strategy ) => {
        const strategyElement = document.querySelector(
            `.strategy-stats[data-strategy="${strategy}"]`
        );
        if ( strategyElement ) {
            const winRateElement = strategyElement.querySelector( ".strategy-winrate" );
            const pnlElement = strategyElement.querySelector( ".strategy-pnl" );
            const countElement = strategyElement.querySelector( ".strategy-count" );

            if ( winRateElement ) {
                winRateElement.textContent = `${stats[ strategy ].winRate}%`;
            }

            if ( pnlElement ) {
                pnlElement.textContent = `$${stats[ strategy ].pnl.toFixed( 2 )}`;
                // Aplicar color según P&L
                pnlElement.className = `strategy-pnl ${stats[ strategy ].pnl >= 0 ? "text-profit" : "text-loss"}`;
            }

            if ( countElement ) {
                countElement.textContent = stats[ strategy ].count;
            }
        }
    } );
}

function calculateEffectiveCapital() {
    const totalPnL = calculateTotalPnL();
    const totalWithdrawals = getTotalWithdrawals();
    return currentCapital + totalPnL - totalWithdrawals;
}

function renderCapitalSection() {
    const effectiveCapital = calculateEffectiveCapital();
    const inputCapital = document.getElementById( "currentCapitalDisplay" );

    // Mostrar el capital base ingresado (sin P&L ni retiros)
    inputCapital.value = currentCapital.toFixed( 2 );

    // Actualizar el riesgo diario máximo basado en capital efectivo
    document.getElementById( "maxDailyRisk" ).textContent =
        `$${( effectiveCapital * 0.05 ).toFixed( 2 )}`;

    // Actualizar calculadora de estrategia
    updateStrategyCalculator();
}

function updateStrategyCalculator() {
    const selectedStrategy =
        document.getElementById( "strategySelect" )?.value || "regulares";
    const config = strategyConfigs[ selectedStrategy ];

    if ( config ) {
        document.getElementById( "strategyWinRate" ).textContent =
            `${config.winRate}%`;
        document.getElementById( "strategyRR" ).textContent = `${config.rrRatio}:1`;
        document.getElementById( "strategyRiskPercent" ).textContent =
            `${config.riskPercent}%`;

        // Usar capital efectivo para los cálculos
        const effectiveCapital = calculateEffectiveCapital();
        const maxRisk = ( effectiveCapital * config.riskPercent ) / 100;
        const optimalContracts =
            calculateOptimalContractsWithEffectiveCapital( selectedStrategy );

        document.getElementById( "maxRiskPerTrade" ).textContent =
            `$${maxRisk.toFixed( 2 )}`;
        document.getElementById( "optimalContracts" ).textContent = optimalContracts;
        document.getElementById( "suggestedSL" ).textContent =
            `${config.stopLoss} pips`;
        document.getElementById( "takeProfit1" ).textContent =
            `${config.takeProfit1} pips`;
        document.getElementById( "takeProfit2" ).textContent =
            `${config.takeProfit2} pips`;
    }
}

function calculateOptimalContractsWithEffectiveCapital( strategy ) {
    const config = strategyConfigs[ strategy ];
    const effectiveCapital = calculateEffectiveCapital();

    if ( !config || effectiveCapital <= 0 ) return 0;

    const riskAmount = ( effectiveCapital * config.riskPercent ) / 100;
    const stopLossPips = config.stopLoss;
    const pipValue = 1; // $1 por pip por contrato

    return Math.floor( riskAmount / ( stopLossPips * pipValue ) );
}

function renderTrades() {
    const tbody = document.getElementById( "tradesTableBody" );
    if ( !tbody ) return;

    let filteredTrades = [ ...trades ];

    // Aplicar filtros
    const strategyFilter = document.getElementById( "filterStrategy" )?.value;
    const resultFilter = document.getElementById( "filterResult" )?.value;
    const dateFilter = document.getElementById( "filterDate" )?.value;

    if ( strategyFilter ) {
        filteredTrades = filteredTrades.filter(
            ( trade ) => trade.strategy === strategyFilter
        );
    }

    if ( resultFilter ) {
        filteredTrades = filteredTrades.filter(
            ( trade ) => trade.result === resultFilter
        );
    }

    if ( dateFilter ) {
        filteredTrades = filteredTrades.filter(
            ( trade ) => trade.date === dateFilter
        );
    }

    // Ordenar por fecha descendente
    filteredTrades.sort( ( a, b ) => new Date( b.date ) - new Date( a.date ) );

    tbody.innerHTML = filteredTrades
        .map( ( trade ) => {
            const strategyName =
                strategyConfigs[ trade.strategy ]?.name || trade.strategy;
            const pnlClass = parseFloat( trade.pnl ) >= 0 ? "text-profit" : "text-loss";

            return `
            <tr class="border-b border-gray-700 hover:bg-gray-800">
                <td class="p-3">${new Date( trade.date ).toLocaleDateString()}</td>
                <td class="p-3">${strategyName}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs ${trade.direction === "buy" ? "bg-green-800 text-green-200" : "bg-red-800 text-red-200"}">
                        ${trade.direction === "buy" ? "Compra" : "Venta"}
                    </span>
                </td>
                <td class="p-3">${trade.contracts}</td>
                <td class="p-3">${trade.sl.toFixed( 1 )} pips</td>
                <td class="p-3">${trade.tp.toFixed( 1 )} pips</td>  
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs ${trade.result === "win" ? "bg-green-800 text-green-200" : "bg-red-800 text-red-200"}">
                        ${trade.result === "win" ? "Ganador" : "Perdedor"}
                    </span>
                </td>
                <td class="p-3 ${pnlClass} font-semibold">$${parseFloat( trade.pnl ).toFixed( 2 )}</td>
                <td class="p-3">
                    <span class="cursor-pointer text-blue-400 hover:text-blue-300" 
                          onclick="showCommentTooltip(event, '${trade.comments.replace( /'/g, "\\'" )}')">
                        ${trade.comments.length > 20 ? trade.comments.substring( 0, 20 ) + "..." : trade.comments}
                    </span>
                </td>
                <td class="p-3">
    <div class="flex space-x-2">
        <button onclick="showEditTradeModal('${trade.id}')" 
                class="text-blue-400 hover:text-blue-300 text-sm">
            Editar
        </button>
        <button onclick="deleteTrade('${trade.id}')" 
                class="text-red-400 hover:text-red-300 text-sm">
            Eliminar
        </button>
    </div>
</td>
            </tr>
        `;
        } )
        .join( "" );
}

function renderObservations() {
    const container = document.getElementById( "observationsList" );
    if ( !container ) return;

    const sortedObservations = [ ...observations ].sort(
        ( a, b ) => new Date( b.timestamp ) - new Date( a.timestamp )
    );

    container.innerHTML = sortedObservations
        .map(
            ( obs ) => `
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
    `
        )
        .join( "" );
}

function renderRecentWithdrawals() {
    const container = document.getElementById( "recentWithdrawals" );
    if ( !container ) return;

    const recentWithdrawals = withdrawals
        .sort( ( a, b ) => new Date( b.timestamp ) - new Date( a.timestamp ) )
        .slice( 0, 3 );

    container.innerHTML =
        recentWithdrawals
            .map(
                ( w ) => `
        <div class="text-sm bg-gray-800 p-2 rounded">
            <div class="flex justify-between">
                <span>${w.concept}</span>
                <span class="text-orange-400">-$${w.amount.toFixed( 2 )}</span>
            </div>
            <div class="text-xs text-gray-500">${new Date( w.date ).toLocaleDateString()}</div>
        </div>
    `
            )
            .join( "" ) ||
        '<p class="text-sm text-gray-500">No hay retiros recientes</p>';
}

// ===== SETUP CHECKER MEJORADO =====
function renderSetupChecklist() {
    const strategySelector = document.getElementById( "signalStrategySelect" );

    if ( !strategySelector ) {
        console.warn( "No se encontró selector de estrategia" );
        return;
    }

    const strategy = strategySelector.value || "regulares";

    // Actualizar información rápida de la estrategia
    updateQuickStrategyInfo( strategy );

    // Renderizar checklist
    renderDynamicChecklist( strategy );

    // Mostrar template de la estrategia
    displayStrategyTemplate( strategy );

    // Actualizar score inicial
    updateDynamicSetupScore();

    // Restaurar estado si existe
    restoreSetupState();
}

// Nueva función para actualizar la información rápida de la estrategia
function updateQuickStrategyInfo( strategy ) {
    const config = strategyConfigs[ strategy ];
    if ( !config ) return;

    const effectiveCapital = calculateEffectiveCapital();
    const optimalContracts = calculateOptimalContractsWithEffectiveCapital( strategy );

    // Valores con fallbacks para evitar "undefined"
    const elements = {
        'strategyWinRateQuick': `${config.winRate || 0}%`,
        'strategyRRQuick': `${config.rrRatio || 2.0}:1`, // ✅ Fallback agregado
        'strategyRiskQuick': `${config.riskPercent || 2.0}%`,
        'optimalContractsQuick': optimalContracts.toString(),
        'strategyTimeframesQuick': config.timeframes || "Multiple TF"
    };

    Object.entries( elements ).forEach( ( [ id, value ] ) => {
        const element = document.getElementById( id );
        if ( element ) element.textContent = value;
    } );
}

// Nueva función para mostrar el template de estrategia en el lado derecho
function displayStrategyTemplate( strategy ) {
    const container = document.getElementById( 'strategyTemplateDisplay' );
    if ( !container ) return;

    // Limpiar contenido anterior
    container.innerHTML = '';

    // Obtener template
    const templateId = `template-${strategy}`;
    const templateElement = document.getElementById( templateId );

    if ( templateElement ) {
        // Clonar y mostrar template
        const templateClone = templateElement.cloneNode( true );
        templateClone.classList.remove( 'strategy-template', 'hidden' );
        templateClone.id = `active-${templateId}`;

        // Aplicar estilos para el contenedor más pequeño
        templateClone.classList.add( 'text-sm' );

        // Ajustar grid para espacios más pequeños
        const grids = templateClone.querySelectorAll( '.grid' );
        grids.forEach( grid => {
            if ( grid.classList.contains( 'md:grid-cols-2' ) ) {
                grid.classList.remove( 'md:grid-cols-2' );
                grid.classList.add( 'grid-cols-1' );
            }
        } );

        container.appendChild( templateClone );
    } else {
        // Fallback: mostrar información básica
        const config = strategyConfigs[ strategy ];
        container.innerHTML = `
            <div class="p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-gold/20">
                <h3 class="text-lg font-bold text-gold mb-3">${config.name}</h3>
                <div class="text-sm text-gray-300">
                    <p><strong>Win Rate:</strong> ${config.winRate}%</p>
                    <p><strong>R:R Ratio:</strong> ${config.rrRatio}:1</p>
                    <p><strong>Riesgo:</strong> ${config.riskPercent}%</p>
                    <p><strong>Stop Loss:</strong> ${config.stopLoss} pips</p>
                    <p><strong>Take Profit:</strong> ${config.takeProfit1}/${config.takeProfit2} pips</p>
                </div>
            </div>
        `;
    }
}

// Función actualizada para renderizar checklist dinámico
function renderDynamicChecklist( strategy ) {
    const container = document.getElementById( "setupCheckerContent" );
    if ( !container ) return;

    const checklist = setupChecklists[ strategy ] || [];
    const config = strategyConfigs[ strategy ];

    if ( checklist.length === 0 ) {
        container.innerHTML = `
            <div class="bg-yellow-900 bg-opacity-20 p-4 rounded-lg border border-yellow-500">
                <p class="text-yellow-400 text-sm">⚠️ Checklist no disponible para esta estrategia</p>
            </div>
        `;
        return;
    }

    const checklistHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h4 class="text-lg font-semibold text-white">✅ ${config?.name || 'Setup'} Verification</h4>
                    <p class="text-xs text-gray-400 mt-1">📊 ${config?.timeframes || 'Multiple TF'}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="toggleAllCheckboxes(true)" 
                            class="text-xs px-4 py-1 bg-green-700 hover:bg-green-600 rounded transition-colors">
                        Todo
                    </button>
                    <button onclick="toggleAllCheckboxes(false)" 
                            class="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded transition-colors">
                        Limpiar
                    </button>
                </div>
            </div>
            
            <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
                ${checklist.map( ( item, index ) => `
                    <div class="flex items-start space-x-3 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group">
                        <input type="checkbox" 
                               id="dynamic_check_${index}" 
                               class="mt-0.5 rounded text-gold focus:ring-gold focus:ring-1 h-4 w-4 flex-shrink-0" 
                               onchange="updateDynamicSetupScore()">
                        <label for="dynamic_check_${index}" 
                               class="text-sm flex-1 cursor-pointer hover:text-gold transition-colors leading-relaxed group-hover:text-gray-200">
                            ${item}
                        </label>
                    </div>
                `).join( '' )}
            </div>

            <div class="mt-4 p-3 bg-gray-800/30 rounded-lg border-l-4 border-gold/50">
                <p class="text-xs text-gray-400">
                    💡 <strong>Tip:</strong> Para ${config?.name || 'esta estrategia'}, 
                    necesitas al menos 70% de los factores para ejecutar con seguridad.
                </p>
            </div>
        </div>
    `;

    container.innerHTML = checklistHTML;
}


// Función actualizada para el listener del selector de estrategia
function setupImprovedStrategyListeners() {
    const strategySelector = document.getElementById( 'signalStrategySelect' );

    if ( strategySelector ) {
        let debounceTimer;

        strategySelector.addEventListener( 'change', function () {
            clearTimeout( debounceTimer );
            debounceTimer = setTimeout( () => {
                console.log( 'Strategy changed to:', this.value );
                renderSetupChecklist();
            }, 200 );
        } );
    }
}

function initializeImprovedSetupListeners() {
    setupImprovedStrategyListeners();
    setupButtonListeners(); // Esta función ya existe en tu código

    // Auto-save periódico del estado
    setInterval( () => {
        const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );
        if ( checkboxes.length > 0 ) {
            saveSetupState();
        }
    }, 30000 );

    console.log( 'Setup listeners mejorados inicializados correctamente' );
}


// Función para actualizar solo el display del score
function updateScoreDisplay() {
    // Buscar elementos existentes del score
    let scoreSection = document.getElementById( "setupScore" );

    // Si no existe, buscar en el HTML fijo
    if ( !scoreSection ) {
        scoreSection = document.querySelector( '[role="progressbar"]' )?.parentElement;
    }

    // Si aún no existe, crear solo la sección de score (sin botones)
    if ( !scoreSection ) {
        const container = document.getElementById( "setupCheckerContent" );
        if ( container ) {
            const scoreHTML = `
                <div id="setupScore" class="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div class="text-center mb-4">
                        <div id="scoreValue" class="text-3xl font-bold text-gray-400 mb-2">0%</div>
                        <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                            <div id="scoreBar" class="h-2 rounded-full bg-gray-600 transition-all duration-500" style="width: 0%"></div>
                        </div>
                        <div id="setupFeedback" class="text-sm text-gray-400 hidden"></div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML( 'beforeend', scoreHTML );
        }
    }
}

// Función mejorada para actualizar score dinámico
function updateDynamicSetupScore() {
    const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );

    if ( checkboxes.length === 0 ) {
        console.warn( "No se encontraron checkboxes para calcular score" );
        return;
    }

    const checkedCount = Array.from( checkboxes ).filter( cb => cb.checked ).length;
    const totalCount = checkboxes.length;
    const score = Math.round( ( checkedCount / totalCount ) * 100 );

    // Obtener estrategia actual
    const strategySelector = document.getElementById( 'signalStrategySelect' );
    const currentStrategy = strategySelector?.value || 'regulares';
    const config = strategyConfigs[ currentStrategy ];

    // Actualizar elementos de score
    const scoreElement = document.getElementById( "scoreValue" );
    const scoreBar = document.getElementById( "scoreBar" );
    const feedbackElement = document.getElementById( "setupFeedback" );

    // Actualizar valor
    if ( scoreElement ) {
        scoreElement.textContent = `${score}%`;
    }

    // Actualizar barra y colores
    if ( scoreBar ) {
        scoreBar.style.width = `${score}%`;

        let barClass, scoreClass;
        if ( score >= 85 ) {
            barClass = "h-4 rounded-full bg-green-500 transition-all duration-500";
            scoreClass = "text-4xl font-bold text-green-400 mb-2";
        } else if ( score >= 70 ) {
            barClass = "h-4 rounded-full bg-yellow-500 transition-all duration-500";
            scoreClass = "text-4xl font-bold text-yellow-400 mb-2";
        } else {
            barClass = "h-4 rounded-full bg-red-500 transition-all duration-500";
            scoreClass = "text-3xl font-bold text-red-400 mb-2";
        }

        scoreBar.className = barClass;
        if ( scoreElement ) scoreElement.className = scoreClass;
    }

    // Actualizar botones ejecutar
    const executeButtons = document.querySelectorAll( '#executeSetupBtn, [data-action="execute"]' );
    executeButtons.forEach( btn => {
        const isEnabled = score >= 70;
        btn.disabled = !isEnabled;

        if ( isEnabled ) {
            btn.className = "flex-1 bg-green-600 hover:bg-green-500 px-2 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg";
            btn.innerHTML = `
                <span class="flex items-center justify-center space-x-2">
                    <span>✅ Ejecutar ${config?.name || 'Trade'} (${score}%)</span>
                </span>
            `;
        } else {
            btn.className = "flex-1 bg-gray-600 px-3 py-2 rounded-lg font-medium cursor-not-allowed opacity-75";
            btn.innerHTML = `
                <span class="flex items-center justify-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <span>Necesario 70%+ (${score}%)</span>
                </span>
            `;
        }
    } );

    // Feedback específico por estrategia
    if ( feedbackElement ) {
        let feedbackText, feedbackClass;

        if ( score >= 90 ) {
            feedbackText = `🎯 ${config?.name || 'Setup'} excepcional - Ejecutar inmediatamente`;
            feedbackClass = "text-green-400 font-bold animate-pulse";
        } else if ( score >= 85 ) {
            feedbackText = `✅ ${config?.name || 'Setup'} sólido - Alta probabilidad R:R ${config?.rrRatio || '2.2'}:1`;
            feedbackClass = "text-green-400 font-semibold";
        } else if ( score >= 70 ) {
            feedbackText = `⚠️ ${config?.name || 'Setup'} aceptable - Proceder maximo con SL ${config?.stopLoss || '5'} pips`;
            feedbackClass = "text-yellow-400 font-medium";
        } else if ( score >= 50 ) {
            feedbackText = `⚡ Setup débil para ${config?.name || 'esta estrategia'} - Esperar más confluencias`;
            feedbackClass = "text-orange-400";
        } else if ( score === 0 ) {
            feedbackText = `❌ ${config?.name || 'Setup'} - Solo ingresar si cumple + 70% de señales`;
            feedbackClass = "text-red-400 font-medium";
        } else {
            feedbackText = `❌ insuficiente( Continuar buscando señales). No entrar con menos de 70%`;
            feedbackClass = "text-red-400 font-medium";
        }

        feedbackElement.innerHTML = `
            <div class="text-center">
                <p class="${feedbackClass} text-sm mb-2">${feedbackText}</p>
                <p class="text-xs text-gray-500">
                    📊 Factores: ${checkedCount}/${totalCount} | 
                    📈 TF: ${config?.timeframes || 'Multiple'} | 
                    💰 Riesgo: ${config?.riskPercent || '2.5'}%
                </p>
            </div>
        `;
        feedbackElement.classList.remove( "hidden" );
    }

    // Auto-save del estado
    saveSetupState();

    console.log( `${config?.name || 'Setup'} Score: ${score}% (${checkedCount}/${totalCount})` );
}


// Funciones auxiliares para estado del setup
function saveSetupState() {
    const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );
    const state = Array.from( checkboxes ).map( cb => cb.checked );
    const strategy = document.getElementById( 'signalStrategySelect' )?.value ||
        document.getElementById( 'setupStrategy' )?.value || 'regulares';

    const setupState = {
        strategy: strategy,
        checkboxes: state,
        timestamp: Date.now()
    };

    localStorage.setItem( 'trading_setupState', JSON.stringify( setupState ) );
}

function restoreSetupState() {
    try {
        const savedState = localStorage.getItem( 'trading_setupState' );
        if ( !savedState ) return;

        const state = JSON.parse( savedState );
        const timeDiff = Date.now() - ( state.timestamp || 0 );

        // Solo restaurar si es menor a 2 horas
        if ( timeDiff > 7200000 ) return;

        // Restaurar checkboxes
        const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );
        checkboxes.forEach( ( cb, index ) => {
            if ( state.checkboxes && state.checkboxes[ index ] !== undefined ) {
                cb.checked = state.checkboxes[ index ];
            }
        } );

        // Actualizar score
        setTimeout( () => updateDynamicSetupScore(), 100 );

    } catch ( error ) {
        console.warn( 'Error restaurando estado del setup:', error );
    }
}

// Función para manejar el click del botón ejecutar
function executeValidatedSetup() {
    const scoreElement = document.getElementById( "scoreValue" );
    const score = scoreElement ? parseInt( scoreElement.textContent ) : 0;

    if ( score >= 70 ) {
        const strategySelector =
            document.getElementById( "signalStrategySelect" ) ||
            document.getElementById( "setupStrategy" );

        if ( strategySelector ) {
            const strategy = strategySelector.value;

            // Prellenar formulario de trade
            const tradeStrategySelect = document.getElementById( "tradeStrategy" );
            if ( tradeStrategySelect ) {
                tradeStrategySelect.value = strategy;
            }

            // Rellenar datos sugeridos
            fillTradeFormFromStrategy( strategy );

            // Mostrar modal de trade
            showModal( "tradeModal" );

            // Limpiar checklist tras uso exitoso
            setTimeout( () => {
                resetSetupChecker();
            }, 500 );

            updateSyncStatus( "Setup ejecutado - Formulario preparado", true );
        }
    } else {
        // Feedback visual mejorado para score insuficiente
        const feedbackEl = document.getElementById( 'setupFeedback' );
        if ( feedbackEl ) {
            feedbackEl.innerHTML = `
                <p class="text-red-400 font-medium animate-bounce">
                    ⚠️ Score insuficiente: ${score}%. Mínimo requerido: 70%
                </p>
            `;
            feedbackEl.classList.remove( 'hidden' );

            // Auto-hide después de 3 segundos
            setTimeout( () => {
                feedbackEl.classList.add( 'hidden' );
            }, 3000 );
        }
    }
}

// Función mejorada para reset que funciona con botones existentes
function resetSetupChecker() {
    // Desmarcar todos los checkboxes dinámicos
    const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );

    checkboxes.forEach( cb => {
        cb.checked = false;
    } );

    // Resetear score
    updateDynamicSetupScore();

    // Ocultar feedback si existe
    const feedbackElement = document.getElementById( "setupFeedback" );
    if ( feedbackElement ) {
        feedbackElement.classList.add( "hidden" );
    }

    // Limpiar estado guardado
    localStorage.removeItem( 'trading_setupState' );

    updateSyncStatus( "Setup checker reiniciado", true );
}


// Función para prellenar formulario de trade basado en estrategia
function fillTradeFormFromStrategy( strategy ) {
    const config = strategyConfigs[ strategy ];
    if ( !config ) return;

    const today = new Date().toISOString().split( "T" )[ 0 ];
    const effectiveCapital = calculateEffectiveCapital();
    const optimalContracts = calculateOptimalContractsWithEffectiveCapital( strategy );

    // Prellenar campos básicos
    const fields = {
        "tradeDate": today,
        "tradeStrategy": strategy,
        "tradeContracts": Math.max( 1, optimalContracts ).toString(),
        "tradeSL": config.stopLoss.toString(),
        "tradeTP": config.takeProfit1.toString()
    };

    Object.entries( fields ).forEach( ( [ id, value ] ) => {
        const element = document.getElementById( id );
        if ( element ) {
            element.value = value;
        }
    } );

    // Agregar comentario automático
    const commentsField = document.getElementById( "tradeComments" );
    if ( commentsField ) {
        commentsField.value = `Setup ${config.name} validado con score alto. Capital efectivo: $${effectiveCapital.toFixed( 2 )}`;
    }
}

// Función para alternar todos los checkboxes
function toggleAllCheckboxes( checked = true ) {
    const checkboxes = document.querySelectorAll(
        '#setupCheckerContent input[type="checkbox"], #setupChecklist input[type="checkbox"], input[id^="dynamic_check_"]'
    );

    checkboxes.forEach( cb => {
        cb.checked = checked;
    } );

    updateDynamicSetupScore();
}

function showEditLevelsModal() {
    renderLevelsList();
    showModal( "editLevelsModal" );
}

function renderLevelsList() {
    const resistancesContainer = document.getElementById( "resistancesList" );
    const supportsContainer = document.getElementById( "supportsList" );

    if ( resistancesContainer ) {
        resistancesContainer.innerHTML = criticalLevels.resistances
            .map(
                ( level, index ) => `
            <div class="flex items-center space-x-2 mb-2">
                <input type="number" value="${level.price}" step="0.01" 
                       onchange="updateResistancePrice(${index}, this.value)"
                       class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm flex-1">
                <input type="text" value="${level.note || ""}" 
                       onchange="updateResistanceNote(${index}, this.value)"
                       placeholder="Nota opcional"
                       class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm flex-1">
                <button onclick="removeResistance(${index})" 
                        class="text-red-400 hover:text-red-300 px-2">×</button>
            </div>
        `
            )
            .join( "" );
    }

    if ( supportsContainer ) {
        supportsContainer.innerHTML = criticalLevels.supports
            .map(
                ( level, index ) => `
            <div class="flex items-center space-x-2 mb-2">
                <input type="number" value="${level.price}" step="0.01" 
                       onchange="updateSupportPrice(${index}, this.value)"
                       class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm flex-1">
                <input type="text" value="${level.note || ""}" 
                       onchange="updateSupportNote(${index}, this.value)"
                       placeholder="Nota opcional"
                       class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm flex-1">
                <button onclick="removeSupport(${index})" 
                        class="text-red-400 hover:text-red-300 px-2">×</button>
            </div>
        `
            )
            .join( "" );
    }
}

function addResistance() {
    criticalLevels.resistances.push( { price: 2500, note: "" } );
    renderLevelsList();
}

function addSupport() {
    criticalLevels.supports.push( { price: 2400, note: "" } );
    renderLevelsList();
}

function updateResistancePrice( index, price ) {
    criticalLevels.resistances[ index ].price = parseFloat( price );
}

function updateResistanceNote( index, note ) {
    criticalLevels.resistances[ index ].note = note;
}

function updateSupportPrice( index, price ) {
    criticalLevels.supports[ index ].price = parseFloat( price );
}

function updateSupportNote( index, note ) {
    criticalLevels.supports[ index ].note = note;
}

function removeResistance( index ) {
    criticalLevels.resistances.splice( index, 1 );
    renderLevelsList();
}

function removeSupport( index ) {
    criticalLevels.supports.splice( index, 1 );
    renderLevelsList();
}

function saveCriticalLevels() {
    criticalLevels.lastUpdate = new Date().toISOString();

    // Guardar localmente
    localStorage.setItem(
        "trading_criticalLevels",
        JSON.stringify( criticalLevels )
    );

    // Sincronizar con Firebase si está disponible
    if ( currentUser ) {
        syncDataToFirebase();
    }

    hideModal( "editLevelsModal" );
    updateLevelsLastUpdate();
    updateSyncStatus( "Niveles actualizados", true );
}

function updateLevelsLastUpdate() {
    const element = document.getElementById( "levelsLastUpdate" );
    if ( element && criticalLevels.lastUpdate ) {
        const date = new Date( criticalLevels.lastUpdate );
        element.textContent = date.toLocaleDateString();
    }
}

function renderAllData() {
    renderDashboard();
    renderCapitalSection();
    renderTrades();
    renderObservations();
    renderRecentWithdrawals();
    updateCapitalBreakdown(); // Agregar esta línea
    if ( currentTab === "signals" ) {
        renderSetupChecklist();
    }
}

// ===== FUNCIONES DE INTERFAZ =====
function switchTab( tabName ) {
    // Ocultar todos los tabs
    document.querySelectorAll( ".tab-content" ).forEach( ( tab ) => {
        tab.classList.add( "hidden" );
    } );

    // Mostrar el tab seleccionado
    const selectedTab = document.getElementById( tabName );
    if ( selectedTab ) {
        selectedTab.classList.remove( "hidden" );
    }

    // Actualizar botones de navegación
    document.querySelectorAll( ".tab-btn" ).forEach( ( btn ) => {
        btn.classList.remove( "border-gold", "text-gold" );
        btn.classList.add( "border-transparent" );
    } );

    const activeBtn = document.querySelector( `.tab-btn[data-tab="${tabName}"]` );
    if ( activeBtn ) {
        activeBtn.classList.add( "border-gold", "text-gold" );
        activeBtn.classList.remove( "border-transparent" );
    }

    currentTab = tabName;

    // Renderizar datos específicos del tab
    if ( tabName === "signals" ) {
        renderSetupChecklist();
    }

    if ( tabName === 'trade-management' ) {
        updateLevelsLastUpdate();
    }
}

function showModal( modalId ) {
    const modal = document.getElementById( modalId );
    if ( modal ) {
        modal.classList.remove( "hidden" );
        modal.classList.add( "flex" );
    }
}

function hideModal( modalId ) {
    const modal = document.getElementById( modalId );
    if ( modal ) {
        modal.classList.add( "hidden" );
        modal.classList.remove( "flex" );
    }
}

function showCommentTooltip( event, comment ) {
    const tooltip = document.getElementById( "commentTooltip" );
    const content = document.getElementById( "tooltipContent" );

    if ( tooltip && content && comment ) {
        content.textContent = comment;
        tooltip.classList.remove( "hidden" );

        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 5}px`;

        // Ocultar tooltip al hacer click fuera
        setTimeout( () => {
            const hideTooltip = ( e ) => {
                if ( !tooltip.contains( e.target ) ) {
                    tooltip.classList.add( "hidden" );
                    document.removeEventListener( "click", hideTooltip );
                }
            };
            document.addEventListener( "click", hideTooltip );
        }, 100 );
    }
}

function updateCurrentTime() {
    const timeElement = document.getElementById( "currentTime" );
    if ( timeElement ) {
        const now = new Date();
        timeElement.textContent = now.toLocaleString( "es-ES", {
            timeZone: "America/Lima",
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        } );
    }
}

function calculatePnLFromPrices() {
    const entryPrice = parseFloat(
        document.getElementById( "entryPrice" )?.value || 0
    );
    const exitPrice = parseFloat(
        document.getElementById( "exitPrice" )?.value || 0
    );
    const contracts = parseInt(
        document.getElementById( "tradeContracts" )?.value || 1
    );
    const direction = document.getElementById( "tradeDirection" )?.value;

    if ( entryPrice && exitPrice && contracts && direction ) {
        let pnl = 0;
        // Para oro: cada punto = $1 por contrato (no cada pip)
        const pointDifference = Math.abs( exitPrice - entryPrice );

        if ( direction === "buy" ) {
            pnl =
                exitPrice > entryPrice
                    ? pointDifference * contracts
                    : -pointDifference * contracts;
        } else {
            // sell
            pnl =
                exitPrice < entryPrice
                    ? pointDifference * contracts
                    : -pointDifference * contracts;
        }

        const pnlInput = document.getElementById( "tradePnL" );
        if ( pnlInput ) {
            pnlInput.value = pnl.toFixed( 2 );

            // Actualizar automáticamente el resultado
            const resultSelect = document.getElementById( "tradeResult" );
            if ( resultSelect ) {
                resultSelect.value = pnl >= 0 ? "win" : "loss";
            }
        }
    }
}

function exportTradesToCSV() {
    if ( trades.length === 0 ) {
        alert( "No hay trades para exportar" );
        return;
    }

    const headers = [
        "Fecha",
        "Estrategia",
        "Dirección",
        "Contratos",
        "SL (pips)",
        "TP (pips)",
        "Resultado",
        "P&L ($)",
        "Comentarios",
    ];

    const csvContent = [
        headers.join( "," ),
        ...trades.map( ( trade ) =>
            [
                trade.date,
                strategyConfigs[ trade.strategy ]?.name || trade.strategy,
                trade.direction === "buy" ? "Compra" : "Venta",
                trade.contracts,
                trade.sl,
                trade.tp,
                trade.result === "win" ? "Ganador" : "Perdedor",
                trade.pnl,
                `"${trade.comments.replace( /"/g, '""' )}"`,
            ].join( "," )
        ),
    ].join( "\n" );

    const blob = new Blob( [ csvContent ], { type: "text/csv" } );
    const url = window.URL.createObjectURL( blob );
    const a = document.createElement( "a" );

    a.style.display = "none";
    a.href = url;
    a.download = `trades_${new Date().toISOString().split( "T" )[ 0 ]}.csv`;

    document.body.appendChild( a );
    a.click();
    window.URL.revokeObjectURL( url );
    document.body.removeChild( a );
}

function deleteObservation( obsId ) {
    observations = observations.filter( ( obs ) => obs.id !== obsId );
    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }
    renderObservations();
}

function showEditTradeModal( tradeId ) {
    const trade = trades.find( ( t ) => t.id === tradeId );
    if ( !trade ) return;

    editingTradeId = tradeId;

    // Llenar formulario con datos actuales
    document.getElementById( "editTradeId" ).value = trade.id;
    document.getElementById( "editTradeDate" ).value = trade.date;
    document.getElementById( "editTradeStrategy" ).value = trade.strategy;
    document.getElementById( "editTradeDirection" ).value = trade.direction;
    document.getElementById( "editTradeContracts" ).value = trade.contracts;
    document.getElementById( "editTradeSL" ).value = trade.sl;
    document.getElementById( "editTradeTP" ).value = trade.tp;
    document.getElementById( "editTradeResult" ).value = trade.result;
    document.getElementById( "editTradePnL" ).value = trade.pnl;
    document.getElementById( "editTradeComments" ).value = trade.comments || "";

    showModal( "editTradeModal" );
}

function updateTrade() {
    if ( !editingTradeId ) return;

    const updatedData = {
        date: document.getElementById( "editTradeDate" ).value,
        strategy: document.getElementById( "editTradeStrategy" ).value,
        direction: document.getElementById( "editTradeDirection" ).value,
        contracts: parseInt( document.getElementById( "editTradeContracts" ).value ),
        sl: parseFloat( document.getElementById( "editTradeSL" ).value ),
        tp: parseFloat( document.getElementById( "editTradeTP" ).value ),
        result: document.getElementById( "editTradeResult" ).value,
        pnl: parseFloat( document.getElementById( "editTradePnL" ).value ),
        comments: document.getElementById( "editTradeComments" ).value || "",
    };

    editTrade( editingTradeId, updatedData );
    hideModal( "editTradeModal" );
    editingTradeId = null;
    updateSyncStatus( "Trade actualizado correctamente", true );
}

function savePostTradeAnalysis() {
    const analysis = document.getElementById( "postTradeAnalysis" )?.value?.trim();
    if ( !analysis ) return;

    const analysisData = {
        id: Date.now().toString(),
        text: analysis,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        type: "post-trade",
    };

    observations.push( analysisData );

    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    document.getElementById( "postTradeAnalysis" ).value = "";
    renderObservations();
    updateSyncStatus( "Análisis post-trade guardado", true );
}

function generateWeeklyAnalysis() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate( oneWeekAgo.getDate() - 7 );

    const weeklyTrades = trades.filter(
        ( trade ) => new Date( trade.date ) >= oneWeekAgo
    );

    if ( weeklyTrades.length === 0 ) {
        alert( "No hay trades en la última semana para analizar" );
        return;
    }

    const wins = weeklyTrades.filter( ( t ) => t.result === "win" ).length;
    const losses = weeklyTrades.filter( ( t ) => t.result === "loss" ).length;
    const winRate = Math.round( ( wins / weeklyTrades.length ) * 100 );
    const totalPnL = weeklyTrades.reduce(
        ( sum, t ) => sum + parseFloat( t.pnl || 0 ),
        0
    );

    // Análisis por estrategia
    const strategyAnalysis = {};
    Object.keys( strategyConfigs ).forEach( ( strategy ) => {
        const stratTrades = weeklyTrades.filter( ( t ) => t.strategy === strategy );
        if ( stratTrades.length > 0 ) {
            const stratWins = stratTrades.filter( ( t ) => t.result === "win" ).length;
            strategyAnalysis[ strategy ] = {
                count: stratTrades.length,
                winRate: Math.round( ( stratWins / stratTrades.length ) * 100 ),
                pnl: stratTrades.reduce( ( sum, t ) => sum + parseFloat( t.pnl || 0 ), 0 ),
            };
        }
    } );

    const analysisText = `📊 ANÁLISIS SEMANAL
📅 Periodo: ${oneWeekAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}

📈 RESUMEN GENERAL:
• Total Trades: ${weeklyTrades.length}
• Ganadores: ${wins} | Perdedores: ${losses}
• Win Rate: ${winRate}%
• P&L Total: $${totalPnL.toFixed( 2 )}

🎯 POR ESTRATEGIA:
${Object.entries( strategyAnalysis )
            .map(
                ( [ strategy, data ] ) =>
                    `• ${strategyConfigs[ strategy ]?.name}: ${data.count} trades, ${data.winRate}% WR, $${data.pnl.toFixed( 2 )}`
            )
            .join( "\n" )}

💡 OBSERVACIONES:
${totalPnL >= 0 ? "✅ Semana positiva" : "❌ Semana negativa"}
${winRate >= 60 ? "✅ Win rate saludable" : winRate >= 50 ? "⚠️ Win rate aceptable" : "❌ Win rate bajo"}`;

    document.getElementById( "postTradeAnalysis" ).value = analysisText;
}

// Botones de setup con mejor manejo de errores
function setupButtonListeners() {
    // Ejecutar setup
    const executeButtons = [ 'executeSetupBtn', 'executeTradeBtn' ];
    executeButtons.forEach( btnId => {
        const btn = document.getElementById( btnId );
        if ( btn ) {
            btn.addEventListener( 'click', function ( e ) {
                e.preventDefault();

                const scoreElement = document.getElementById( 'scoreValue' );
                const score = scoreElement ? parseInt( scoreElement.textContent ) : 0;

                if ( score >= 70 ) {
                    executeValidatedSetup();
                } else {
                    // Feedback visual mejorado
                    const feedbackEl = document.getElementById( 'setupFeedback' );
                    if ( feedbackEl ) {
                        feedbackEl.innerHTML = `
                            <p class="text-red-400 font-medium animate-bounce">
                                ⚠️ Score insuficiente: ${score}%. Mínimo requerido: 70%
                            </p>
                        `;
                        feedbackEl.classList.remove( 'hidden' );

                        // Auto-hide después de 3 segundos
                        setTimeout( () => {
                            feedbackEl.classList.add( 'hidden' );
                        }, 3000 );
                    }
                }
            } );
        }
    } );

    // Reset setup
    const resetButtons = [ 'discardSetupBtn', 'resetSetupBtn', 'clearSetupBtn' ];
    resetButtons.forEach( btnId => {
        const btn = document.getElementById( btnId );
        if ( btn ) {
            btn.addEventListener( 'click', function ( e ) {
                e.preventDefault();
                resetSetupChecker();
            } );
        }
    } );

    // Utilidades adicionales
    const utilityButtons = [
        { id: 'selectAllBtn', action: () => toggleAllCheckboxes( true ) },
        { id: 'clearAllBtn', action: () => toggleAllCheckboxes( false ) }
    ];

    utilityButtons.forEach( ( { id, action } ) => {
        const btn = document.getElementById( id );
        if ( btn ) {
            btn.addEventListener( 'click', action );
        }
    } );
}

// Inicializar todos los listeners de setup
function initializeSetupListeners() {
    setupButtonListeners();

    // Auto-save periódico del estado
    setInterval( () => {
        const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );
        if ( checkboxes.length > 0 ) {
            saveSetupState();
        }
    }, 30000 ); // Cada 30 segundos

    console.log( 'Setup listeners inicializados correctamente' );
}

// Mostrar modal de autenticación solo bajo condiciones específicas
function checkAuthModalDisplay() {

    if ( !currentUser &&
        !isInitializing &&
        !hasShownAuthModal &&
        !getCookie( 'hideAuthModal' ) ) {

        // Verificar si hay datos locales significativos
        const hasLocalData = trades.length > 0 ||
            observations.length > 0 ||
            currentCapital > 0;

        // Si no hay datos locales, sugerir autenticación
        if ( !hasLocalData ) {
            setTimeout( () => {
                if ( !currentUser && !hasShownAuthModal ) {
                    showAuthModal();
                }
            }, 5000 ); // Esperar 5 segundos en lugar de 3
        }
    }
}

// Función mejorada para ocultar modal con opción de "No mostrar más"
function hideAuthModalPermanently() {
    hideAuthModal();
    setCookie( 'hideAuthModal', 'true', 7 ); // Por 7 días
    hasShownAuthModal = true;
}

// Nueva función para agregar checklist dinámico
function addDynamicChecklist( strategy, container ) {
    const checklist = setupChecklists[ strategy ] || [];

    if ( checklist.length === 0 ) {
        container.innerHTML += `
            <div class="bg-yellow-900 bg-opacity-20 p-4 rounded-lg border border-yellow-500 mb-4">
                <p class="text-yellow-400">⚠️ Checklist no disponible para esta estrategia</p>
            </div>
        `;
        return;
    }

    const checklistHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center mt-6 mb-4">
                <h4 class="text-lg font-semibold text-white">✅ Setup Verification</h4>
                <div class="flex space-x-2">
                    <button onclick="toggleAllCheckboxes(true)" 
                            class="text-sm px-5 py-2 bg-green-700 hover:bg-green-600 rounded transition-colors">
                        Marcar Todo
                    </button>
                    <button onclick="toggleAllCheckboxes(false)" 
                            class="text-sm px-2 py-2 bg-red-700 hover:bg-red-600 rounded transition-colors">
                        Limpiar
                    </button>
                </div>
            </div>
            <div class="space-y-3">
                ${checklist.map( ( item, index ) => `
                    <div class="flex items-start space-x-3 p-1 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                        <input type="checkbox" 
                               id="dynamic_check_${index}" 
                               class="mt-1 rounded text-gold focus:ring-gold focus:ring-2 h-5 w-5" 
                               onchange="updateDynamicSetupScore()">
                        <label for="dynamic_check_${index}" 
                               class="text-sm flex-1 cursor-pointer hover:text-gold transition-colors leading-relaxed">
                            ${item}
                        </label>
                    </div>
                `).join( '' )}
            </div>
        </div>
    `;

    container.innerHTML += checklistHTML;
}


// ===== EVENT LISTENERS =====
document.addEventListener( "DOMContentLoaded", function () {
    isInitializing = true;

    // Cargar datos locales inicialmente
    loadDataLocally();
    renderAllData();

    // Inicializar elementos
    updateCurrentTime();
    setInterval( updateCurrentTime, 60000 );

    // Establecer fecha actual en formularios
    const today = new Date().toISOString().split( "T" )[ 0 ];
    const dateInputs = [ "tradeDate", "withdrawalDate", "addCapitalDate" ];
    dateInputs.forEach( ( id ) => {
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
    document.getElementById( "userPhoto" )?.addEventListener( "click", function () {
        const dropdown = document.getElementById( "userDropdown" );
        if ( dropdown ) {
            dropdown.classList.toggle( "hidden" );

            // Actualizar nombre en dropdown
            const userNameInDropdown = document.getElementById( "userNameInDropdown" );
            if ( userNameInDropdown && currentUser ) {
                userNameInDropdown.textContent =
                    currentUser.displayName || currentUser.email;
            }
        }
    } );

    // Cerrar dropdown al hacer click fuera
    document.addEventListener( "click", function ( e ) {
        const userPhoto = document.getElementById( "userPhoto" );
        const dropdown = document.getElementById( "userDropdown" );

        if (
            userPhoto &&
            dropdown &&
            !userPhoto.contains( e.target ) &&
            !dropdown.contains( e.target )
        ) {
            dropdown.classList.add( "hidden" );
        }
    } );

    // Botones de autenticación
    const authButtons = [
        { id: "googleSignInBtn", action: signInWithGoogle },
        { id: "topGoogleSignInBtn", action: signInWithGoogle },
        { id: "signOutBtn", action: signOut },
        { id: "continueOfflineBtn", action: hideAuthModal }
    ];

    authButtons.forEach( ( { id, action } ) => {
        document.getElementById( id )?.addEventListener( "click", action );
    } );

    // ===== TAB NAVIGATION =====
    document.querySelectorAll( ".tab-btn" ).forEach( ( btn ) => {
        btn.addEventListener( "click", function () {
            const tabName = this.getAttribute( "data-tab" );
            switchTab( tabName );
        } );
    } );

    // ===== CAPITAL MANAGEMENT =====
    document.getElementById( "addCapitalBtn" )?.addEventListener( "click", () => {
        showModal( "addCapitalModal" );
    } );

    document.getElementById( "withdrawalBtn" )?.addEventListener( "click", () => {
        showModal( "withdrawalModal" );
    } );

    document.getElementById( "resetCapitalBtn" )?.addEventListener( "click", () => {
        showModal( "resetConfirmModal" );
    } );

    // Formulario agregar capital
    document
        .getElementById( "addCapitalForm" )
        ?.addEventListener( "submit", function ( e ) {
            e.preventDefault();

            const amount = parseFloat(
                document.getElementById( "addCapitalAmount" ).value
            );
            const concept =
                document.getElementById( "addCapitalConcept" ).value ||
                "Adición de capital";
            const notes = document.getElementById( "addCapitalNotes" ).value || "";
            const date = document.getElementById( "addCapitalDate" ).value;

            if ( amount > 0 ) {
                addCapital( amount, concept, notes, date );
                this.reset();
                document.getElementById( "addCapitalDate" ).value = new Date()
                    .toISOString()
                    .split( "T" )[ 0 ];
                hideModal( "addCapitalModal" );

                // Mostrar notificación
                updateSyncStatus( `Capital agregado: +${amount.toFixed( 2 )}`, true );
            }
        } );

    // Formulario retiro
    document
        .getElementById( "withdrawalForm" )
        ?.addEventListener( "submit", function ( e ) {
            e.preventDefault();

            const amount = parseFloat(
                document.getElementById( "withdrawalAmount" ).value
            );
            const concept =
                document.getElementById( "withdrawalConcept" ).value || "Retiro";
            const notes = document.getElementById( "withdrawalNotes" ).value || "";
            const date = document.getElementById( "withdrawalDate" ).value;

            if ( amount > 0 && amount <= currentCapital ) {
                registerWithdrawal( amount, concept, notes, date );
                this.reset();
                document.getElementById( "withdrawalDate" ).value = new Date()
                    .toISOString()
                    .split( "T" )[ 0 ];
                hideModal( "withdrawalModal" );

                // Mostrar notificación
                updateSyncStatus( `Retiro registrado: -${amount.toFixed( 2 )}`, true );
            } else {
                alert(
                    amount > currentCapital
                        ? "No tienes suficiente capital"
                        : "Ingrese una cantidad válida"
                );
            }
        } );

    // Confirmación de reset
    document.getElementById( "confirmResetBtn" )?.addEventListener( "click", () => {
        resetAllData();
        hideModal( "resetConfirmModal" );
        updateSyncStatus( "Capital y datos reseteados", true );
    } );

    // Botones de cancelar modales
    const cancelButtons = [
        { id: "cancelAddCapitalBtn", modal: "addCapitalModal" },
        { id: "cancelWithdrawalBtn", modal: "withdrawalModal" },
        { id: "cancelResetBtn", modal: "resetConfirmModal" }
    ];

    cancelButtons.forEach( ( { id, modal } ) => {
        document.getElementById( id )?.addEventListener( "click", () => hideModal( modal ) );
    } );

    // ===== TRADES =====
    document.getElementById( "addTradeBtn" )?.addEventListener( "click", () => {
        showModal( "tradeModal" );
    } );

    document
        .getElementById( "exportTradesBtn" )
        ?.addEventListener( "click", exportTradesToCSV );

    // Filtros de trades
    document
        .getElementById( "filterStrategy" )
        ?.addEventListener( "change", renderTrades );
    document
        .getElementById( "filterResult" )
        ?.addEventListener( "change", renderTrades );
    document
        .getElementById( "filterDate" )
        ?.addEventListener( "change", renderTrades );

    // Formulario de trade
    document
        .getElementById( "tradeForm" )
        ?.addEventListener( "submit", function ( e ) {
            e.preventDefault();

            const tradeData = {
                date: document.getElementById( "tradeDate" ).value,
                strategy: document.getElementById( "tradeStrategy" ).value,
                direction: document.getElementById( "tradeDirection" ).value,
                contracts: parseInt( document.getElementById( "tradeContracts" ).value ),
                sl: parseFloat( document.getElementById( "tradeSL" ).value ),
                tp: parseFloat( document.getElementById( "tradeTP" ).value ),
                result: document.getElementById( "tradeResult" ).value,
                pnl: parseFloat( document.getElementById( "tradePnL" ).value ),
                comments: document.getElementById( "tradeComments" ).value || "",
            };

            addTrade( tradeData );
            this.reset();
            document.getElementById( "tradeDate" ).value = new Date()
                .toISOString()
                .split( "T" )[ 0 ];
            hideModal( "tradeModal" );

            updateSyncStatus( "Trade agregado correctamente", true );
        } );

    document
        .getElementById( "cancelTradeBtn" )
        ?.addEventListener( "click", () => hideModal( "tradeModal" ) );

    // Cálculo automático de P&L
    [ "entryPrice", "exitPrice", "tradeContracts", "tradeDirection" ].forEach(
        ( id ) => {
            document
                .getElementById( id )
                ?.addEventListener( "input", calculatePnLFromPrices );
        }
    );

    initializeImprovedSetupListeners();

    // ===== DISCIPLINE =====
    document
        .getElementById( "addObservationBtn" )
        ?.addEventListener( "click", () => {
            const text = document.getElementById( "observationInput" ).value.trim();
            if ( text ) {
                addObservation( text );
                document.getElementById( "observationInput" ).value = "";
                updateSyncStatus( "Observación agregada", true );
            }
        } );

    // ===== MODAL CLOSE ON OUTSIDE CLICK =====
    document.addEventListener( "click", function ( e ) {
        const modals = [
            "tradeModal",
            "withdrawalModal",
            "addCapitalModal",
            "resetConfirmModal",
            "editTradeModal",
            "editLevelsModal",
            "authModal"
        ];
        modals.forEach( ( modalId ) => {
            const modal = document.getElementById( modalId );
            if ( modal && e.target === modal ) {
                hideModal( modalId );
            }
        } );
    } );

    // ===== EDICIÓN DE TRADES =====
    document.getElementById( 'editTradeForm' )?.addEventListener( 'submit', function ( e ) {
        e.preventDefault();
        updateTrade();
    } );

    document.getElementById( 'deleteTradeBtn' )?.addEventListener( 'click', function () {
        if ( editingTradeId && confirm( '¿Estás seguro de eliminar este trade?' ) ) {
            deleteTrade( editingTradeId );
            hideModal( 'editTradeModal' );
            editingTradeId = null;
        }
    } );

    document.getElementById( 'cancelEditTradeBtn' )?.addEventListener( 'click', () => {
        hideModal( 'editTradeModal' );
        editingTradeId = null;
    } );

    // ===== GESTIÓN DE NIVELES CRÍTICOS =====
    document.getElementById( 'editLevelsBtn' )?.addEventListener( 'click', showEditLevelsModal );
    document.getElementById( 'addResistanceBtn' )?.addEventListener( 'click', addResistance );
    document.getElementById( 'addSupportBtn' )?.addEventListener( 'click', addSupport );

    document.getElementById( 'editLevelsForm' )?.addEventListener( 'submit', function ( e ) {
        e.preventDefault();
        saveCriticalLevels();
    } );

    document.getElementById( 'cancelEditLevelsBtn' )?.addEventListener( 'click', () => {
        hideModal( 'editLevelsModal' );
    } );

    // ===== ANÁLISIS POST-TRADE =====
    document.getElementById( 'savePostTradeBtn' )?.addEventListener( 'click', savePostTradeAnalysis );
    document.getElementById( 'weeklyAnalysisBtn' )?.addEventListener( 'click', generateWeeklyAnalysis );

    // Restaurar estado después de inicialización
    setTimeout( restoreSetupState, 500 );

    // Verificación de modal de autenticación con retraso
    setTimeout( checkAuthModalDisplay, 2000 );

    // Restaurar estado después de un pequeño delay
    setTimeout( () => {
        if ( currentTab === "signals" ) {
            renderSetupChecklist();
        }
    }, 500 );
} );

window.debugSetupChecker = function () {
    console.log( "=== DEBUG SETUP CHECKER ===" );

    // Verificar selectores de estrategia
    const strategySelectors = [
        { id: 'signalStrategySelect', element: document.getElementById( 'signalStrategySelect' ) },
        { id: 'setupStrategy', element: document.getElementById( 'setupStrategy' ) }
    ];

    strategySelectors.forEach( selector => {
        console.log( `${selector.id}:`, selector.element ? `Found - Value: ${selector.element.value}` : 'Not found' );
    } );

    // Verificar contenedores
    const containers = [
        { id: 'setupCheckerContent', element: document.getElementById( 'setupCheckerContent' ) },
        { id: 'setupChecklist', element: document.getElementById( 'setupChecklist' ) }
    ];

    containers.forEach( container => {
        console.log( `${container.id}:`, container.element ? 'Found' : 'Not found' );
    } );

    // Verificar checkboxes
    const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );
    console.log( `Dynamic checkboxes found: ${checkboxes.length}` );

    // Verificar botones
    const buttons = [
        { id: 'executeSetupBtn', element: document.getElementById( 'executeSetupBtn' ) },
        { id: 'discardSetupBtn', element: document.getElementById( 'discardSetupBtn' ) }
    ];

    buttons.forEach( button => {
        console.log( `${button.id}:`, button.element ? 'Found' : 'Not found' );
    } );

    // Verificar configuraciones
    console.log( 'Strategy configs:', Object.keys( strategyConfigs ) );
    console.log( 'Setup checklists:', Object.keys( setupChecklists ) );

    console.log( "========================" );
};

// ===== FUNCIONES GLOBALES =====
window.deleteTrade = deleteTrade;
window.deleteObservation = deleteObservation;
window.showCommentTooltip = showCommentTooltip;
window.showEditTradeModal = showEditTradeModal;
window.updateDynamicSetupScore = updateDynamicSetupScore;
window.updateResistancePrice = updateResistancePrice;
window.updateResistanceNote = updateResistanceNote;
window.updateSupportPrice = updateSupportPrice;
window.updateSupportNote = updateSupportNote;
window.removeResistance = removeResistance;
window.removeSupport = removeSupport;

