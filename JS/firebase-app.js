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

auth.setPersistence( firebase.auth.Auth.Persistence.LOCAL )
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
let currentSelectedStrategy = 'regulares';
let currentTab = "signals";
let currentUser = null;
let isInitializing = true;
let hasShownWelcomeBanner = false;
let hasShownAuthModal = false;
let criticalLevels = { resistances: [], supports: [], lastUpdate: null };
let editingTradeId = null;
let dailyTradesCount = 0; // Conteo diario de trades (máx 3)
let dailyPnL = 0; // P&L diario para límite de pérdida

// Strategy configs
const strategyConfigs = {
    regulares: {
        name: "Trades Regulares",
        winRate: 65,
        rrRatio: 2.2,
        stopLoss: 6,
        takeProfit1: 13,
        takeProfit2: 24,
        riskPercent: 2.5,
        minRisk: 2.5,
        maxRisk: 5.0
    },
    "estructura-confluencia": {
        name: "Estructura + Confluencia",
        winRate: 70,
        rrRatio: 2.4,
        stopLoss: 5,
        takeProfit1: 12,
        takeProfit2: 18,
        riskPercent: 2.5,
        minRisk: 2.0,
        maxRisk: 4.0
    },
    "ema-macd": {
        name: "EMA + MACD",
        winRate: 62,
        rrRatio: 2.8,
        stopLoss: 8,
        takeProfit1: 18,
        takeProfit2: 32,
        riskPercent: 3.0,
        minRisk: 3.0,
        maxRisk: 5.0
    },
    "contra-tendencia": {
        name: "Contra-Tendencia",
        winRate: 62,
        rrRatio: 2.8,
        stopLoss: 6,
        takeProfit1: 10,
        takeProfit2: 17,
        riskPercent: 2.2,
        minRisk: 1.8,
        maxRisk: 2.8
    }
};

// Checklists (sin cambios)
const setupChecklists = {
    regulares: [
        "4H/1H: Estructura Alcista/Bajista + MACD sin divergencia (seguir tendencia) | con divergencia (buscar giro)",
        "4H y 1H: Detectar fin de impulso o retroceso con R. Fibo/E. Fibo + zonas de liquidez",
        "1H y 15M: Williams%R saliendo de -80↗/-50↗ + Soporte (Compra) | -20↘/-50↘ + Resistencia (Venta)",
        "1H y 15M: EMA21>EMA50 + Precio en Soporte (Compra) | EMA21 < EMA50 + Resistencia (Venta)",
        "15M/5M: Validación (Rechazo claro o patrón en zona clave + cambio de estructura y volumen)",
        "Entrada (5M/3M): Retesteo o rebote en EMA21/EMA50 + volumen y confluencias"
    ],

    "estructura-confluencia": [
        "4H/1H: T. alcista (máx crecientes + EMA21>EMA50) | T. bajista (Min decrecientes + EMA21<EMA50)",
        "4H/1H: Marcar zonas de confluencia importantes → S/R + Fibonacci (38%-61% o 76%) o extensión F. (61.8%-127%)",
        "1H y 15M: MACD cruzando o por cruzar + histograma en dirección del trade",
        "15M: Precio valida zona importante de parada con patrón o cambio de estructura",
        "15M y 5M: Estocástico cruza ↑20 o rebota ↑50 (Compra) | cruza ↓80 o rebota ↓50 (Venta)",
        "Entrada1 (15M/5M): EMA21>EMA50 y rebote(Compra) | EMA21 < EMA50 y rechazo(Venta)",
        "Entrada2 (5M/3M): Precio reacciona en zona clave con patrón o ruptura + retesteo con volumen",

    ],
    "ema-macd": [
        "4H: MACD sin divergencia bajista + histograma creciendo",
        "4H: Precio rompe 2 o + soportes/resistencias clave y retestea",
        "4H/1H: Precio por encima/debajo de ema21/ema50 en direccion del trade",
        "1H: Precio atracvieza ema21>ema50 con volumen compras | ema21<ema50 ventas",
        "15M: MACD líneas e histograma por cambiar de direccion y color a favor del trade",
        "15M: Precio rebota hacia ↗️ en EMA21>EMA50 Compras | Precio rebota hacia ↗↘️ en EMA21<ema50 Ventas",
        "Entrada Small (5M/3M): Rebote con volumen en EMAS + histograma y lineas confirmando dirección"
    ],

    "contra-tendencia": [
        "4H/1H: ChoCH o rechazo fuerte en zona relevante (soporte o resistencia mayor)",
        "4H/1H: EMA21 y EMA50 comienzan a cruzarse o aplanarse (señal de posible cambio de tendencia)",
        "1H/15M: MACD muestra divergencia clara entre precio y momentum",
        "1H/15M: Williams %R en extremo y saliendo (-20↘️ venta / -80↗️ compra)",
        "15M: Patrón de reversión visible (envolvente, martillo o pin bar) en zona clave",
        "5M: Volumen aumenta en ruptura del micro soporte/resistencia (>1.25x promedio)",
        "Entrada(5M/3M): Pullback suave con volumen decreciente antes de entrada"
    ]
};

// ===== INSTALACIÓN PWA =====
let deferredPrompt = null;
let isAppInstalled = false;

// Detectar si la app ya está instalada
function checkIfAppInstalled() {
    // Verificar si se está ejecutando como PWA instalada
    if ( window.matchMedia( '(display-mode: standalone)' ).matches ||
        window.navigator.standalone === true ) {
        isAppInstalled = true;
        return true;
    }

    // Verificar cookie de instalación
    const installedCookie = getCookie( 'pwa_installed' );
    if ( installedCookie === 'true' ) {
        isAppInstalled = true;
        return true;
    }

    return false;
}

// Mostrar/ocultar botón de instalación
function toggleInstallButton() {
    const container = document.getElementById( 'installAppContainer' );

    if ( !container ) {
        console.warn( 'Install button container not found' );
        return;
    }

    if ( isAppInstalled || !deferredPrompt ) {
        container.style.display = 'none'; // Forzar con style
        container.classList.add( 'hidden' );
    } else {
        container.style.display = 'block'; // Forzar visibilidad
        container.classList.remove( 'hidden' );
        console.log( 'PWA: Install button shown' );
    }
}

// Capturar el evento beforeinstallprompt
window.addEventListener( 'beforeinstallprompt', ( e ) => {
    // Prevenir que el navegador muestre su propio prompt
    e.preventDefault();

    // Guardar el evento para usarlo después
    deferredPrompt = e;

    // Verificar si ya está instalado
    if ( !checkIfAppInstalled() ) {
        toggleInstallButton();
    }

    console.log( 'PWA: beforeinstallprompt event captured' );
} );

// Detectar cuando la app es instalada
window.addEventListener( 'appinstalled', ( e ) => {
    console.log( 'PWA: App installed successfully' );

    // Marcar como instalado
    isAppInstalled = true;
    setCookie( 'pwa_installed', 'true', 365 );

    // Ocultar botón
    toggleInstallButton();

    // Limpiar prompt diferido
    deferredPrompt = null;

    // Mostrar notificación de éxito
    updateSyncStatus( 'Aplicación instalada correctamente', true );
} );

// Función para instalar la PWA
async function installPWA() {
    if ( !deferredPrompt ) {
        console.warn( 'PWA: No hay prompt de instalación disponible' );
        alert( 'La instalación no está disponible en este momento' );
        return;
    }

    try {
        // Mostrar el prompt de instalación
        deferredPrompt.prompt();

        // Esperar la respuesta del usuario
        const { outcome } = await deferredPrompt.userChoice;

        console.log( `PWA: User choice: ${outcome}` );

        if ( outcome === 'accepted' ) {
            console.log( 'PWA: User accepted installation' );
            // El evento appinstalled se encargará del resto
        } else {
            console.log( 'PWA: User dismissed installation' );
            updateSyncStatus( 'Instalación cancelada', false );
        }

        // Limpiar el prompt diferido
        deferredPrompt = null;

    } catch ( error ) {
        console.error( 'PWA: Error during installation:', error );
        alert( 'Ocurrió un error durante la instalación' );
    }
}

// Función para verificar soporte de PWA
function checkPWASupport() {
    const supportsPWA = 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;

    if ( !supportsPWA ) {
        console.warn( 'PWA: Este navegador no soporta instalación PWA' );
        const installButton = document.getElementById( 'installAppBtn' );
        if ( installButton ) {
            installButton.classList.add( 'hidden' );
        }
    }

    return supportsPWA;
}

// Inicializar PWA al cargar el documento
function initializePWA() {
    // Verificar soporte
    checkPWASupport();

    // Verificar si ya está instalado
    checkIfAppInstalled();

    // Configurar visibilidad inicial del botón
    toggleInstallButton();

    // Agregar listener al botón de instalación
    const installButton = document.getElementById( 'installAppBtn' );
    if ( installButton ) {
        installButton.addEventListener( 'click', installPWA );
    }

    console.log( 'PWA: Initialization complete' );
}

// Exponer funciones globalmente
window.installPWA = installPWA;
window.checkIfAppInstalled = checkIfAppInstalled;


// Provider Google
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope( "profile email" );
provider.setCustomParameters( { login_hint: "user@example.com" } );
auth.useDeviceLanguage();

// Funciones de autenticación (sin cambios mayores, optimicé algunos checks)
function showAuthModal() {
    if ( !currentUser && !isInitializing && !hasShownAuthModal ) {
        document.getElementById( "authModal" ).classList.remove( "hidden" );
        hasShownAuthModal = true;
    }
}

// Cookies (sin cambios)
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

function hideAuthModal() {
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

    showWelcomeBanner( user );
}

function showWelcomeBanner( user ) {
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

        setTimeout( () => {
            banner.style.transform = "translateY(-100%)";
            setTimeout( () => banner.classList.add( "hidden" ), 500 );
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
    if ( syncIndicator )
        syncIndicator.className = `w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`;

    if ( syncStatus ) syncStatus.classList.remove( "hidden" );

    if ( isOnline ) {
        setTimeout( () => syncStatus?.classList.add( "hidden" ), 3000 );
    }
}

function signInWithGoogle() {
    auth
        .signInWithPopup( provider )
        .then( ( result ) => {
            hideAuthModal();
            hasShownAuthModal = true;
            updateSyncStatus( "Conectado y sincronizado", true );
        } )
        .catch( ( error ) => {
            console.error( "Error al iniciar sesión:", error );
            if (
                error.code === "auth/popup-blocked" ||
                error.code === "auth/popup-closed-by-user"
            ) {
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
        } )
        .catch( ( error ) => {
            console.error( "Error al cerrar sesión:", error );
        } );
}

// Datos y sincronización (optimizado)
function syncDataToFirebase() {
    if ( !currentUser ) return;
    const userData = {
        trades,
        observations,
        withdrawals,
        capitalAdditions,
        currentCapital,
        criticalLevels,
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
                criticalLevels = data.criticalLevels || {
                    resistances: [],
                    supports: [],
                    lastUpdate: null,
                };
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
        trades,
        observations,
        withdrawals,
        capitalAdditions,
        currentCapital,
        criticalLevels,
    };
    Object.keys( data ).forEach( ( key ) =>
        localStorage.setItem( `trading_${key}`, JSON.stringify( data[ key ] ) )
    );
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
        criticalLevels = JSON.parse(
            localStorage.getItem( "trading_criticalLevels" )
        ) || { resistances: [], supports: [], lastUpdate: null };
    } catch ( error ) {
        console.error( "Error cargando datos locales:", error );
        resetAllData();
    }
}

// Capital
function addCapital( amount, concept, notes, date ) {
    const addition = {
        id: Date.now().toString(),
        date,
        amount,
        concept,
        notes,
        timestamp: new Date().toISOString(),
    };
    capitalAdditions.push( addition );
    currentCapital += amount;
    saveDataLocally();
    if ( currentUser ) syncDataToFirebase();
    renderAllData();

    // LLAMADAS CORRECTAS:
    renderRecentWithdrawals();
    renderCapitalMovementsTable();

    if ( window.updateAllCharts ) {
        window.updateAllCharts();
    }
}

function registerWithdrawal( amount, concept, notes, date ) {
    const withdrawal = {
        id: Date.now().toString(),
        date,
        amount,
        concept,
        notes,
        timestamp: new Date().toISOString(),
    };
    withdrawals.push( withdrawal );
    currentCapital -= amount;
    if ( currentCapital < 0 ) currentCapital = 0;
    saveDataLocally();
    if ( currentUser ) syncDataToFirebase();
    renderAllData();

    // LLAMADAS CORRECTAS:
    renderRecentWithdrawals();
    renderCapitalMovementsTable();

    if ( window.updateAllCharts ) {
        window.updateAllCharts();
    }
}

function resetAllData() {
    trades = [];
    withdrawals = [];
    capitalAdditions = [];
    currentCapital = 0;
    saveDataLocally();
    if ( currentUser ) syncDataToFirebase();
    renderAllData();

    renderRecentWithdrawals();
    renderCapitalMovementsTable();

    if ( window.updateAllCharts ) {
        window.updateAllCharts();
    }

    updateSyncStatus( "Capital reseteado. Las observaciones se mantienen intactas.", true );
}

// Agregar campo result en addTrade =====
function addTrade( tradeData ) {
    if ( !tradeData || !tradeData.strategy || !tradeData.direction || !tradeData.contracts ) {
        console.error( "Datos de trade incompletos:", tradeData );
        alert( "❌ Datos de trade incompletos. Verifica strategy, direction y contracts." );
        return false;
    }

    if ( isNaN( tradeData.contracts ) || tradeData.contracts <= 0 ) {
        alert( "❌ Número de contratos debe ser mayor a 0" );
        return false;
    }

    const today = new Date().toISOString().split( "T" )[ 0 ];
    const todayTrades = trades.filter( t => t.date === today );
    const todayClosedTrades = todayTrades.filter( t => t.closed === true );

    if ( todayClosedTrades.length >= 3 ) {
        alert( "❌ Límite diario alcanzado: Máximo 3 trades cerrados por día." );
        return false;
    }

    const effectiveCapital = calculateEffectiveCapital();
    const maxDailyLoss = effectiveCapital * 0.05;
    const todayPnL = todayClosedTrades.reduce( ( total, t ) => total + ( parseFloat( t.pnl ) || 0 ), 0 );

    if ( todayPnL <= -maxDailyLoss ) {
        alert( "❌ Límite de pérdida diaria excedido: No se pueden agregar más trades hoy." );
        return false;
    }

    if ( !tradeData.date ) tradeData.date = today;

    // Asegúrate de que incluya symbol:
    let finalTradeData = {
        ...tradeData,
        totalContracts: tradeData.contracts,
        contracts: tradeData.contracts,
        symbol: tradeData.symbol || 'XAUUSD' // Valor por defecto
    };

    const hasValidOpenPrice = tradeData.openPrice && !isNaN( tradeData.openPrice ) && tradeData.openPrice > 0;
    const hasValidClosePrice = tradeData.closePrice && !isNaN( tradeData.closePrice ) && tradeData.closePrice > 0;

    if ( hasValidOpenPrice && hasValidClosePrice ) {
        const priceDifference = tradeData.closePrice - tradeData.openPrice;
        const partialPnL = ( tradeData.direction === 'buy' ? 1 : -1 ) * priceDifference * tradeData.contracts;

        // ✅ CORRECCIÓN: Calcular result basado en P&L
        finalTradeData.pnl = partialPnL;
        finalTradeData.result = partialPnL > 0 ? 'win' : partialPnL < 0 ? 'loss' : 'breakeven';
        finalTradeData.closed = true;
        finalTradeData.status = 'Cierre total';
        finalTradeData.closePrice = tradeData.closePrice;
        finalTradeData.tpLevel = 'tp1';
        finalTradeData.contracts = 0;
        finalTradeData.partials = [ {
            type: 'Initial Close',
            price: tradeData.closePrice,
            contracts: tradeData.contracts,
            pnl: partialPnL,
            timestamp: new Date().toISOString(),
            reason: 'Cierre inicial'
        } ];

        console.log( `Trade cerrado calculado: P&L=${partialPnL}, Result=${finalTradeData.result}` );
    } else {
        finalTradeData.pnl = 0;
        finalTradeData.result = ''; // Vacío si está abierto
        finalTradeData.closed = false;
        finalTradeData.status = 'Abierto';
        finalTradeData.closePrice = null;
        finalTradeData.tpLevel = '';
        finalTradeData.partials = [];
    }

    const trade = {
        id: Date.now().toString() + Math.random().toString( 36 ).substr( 2, 9 ),
        timestamp: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        ...finalTradeData
    };

    trades.push( trade );
    console.log( `Trade agregado: ${trade.id}, Result: ${trade.result}, P&L: ${trade.pnl}` );

    saveDataLocally();
    if ( currentUser ) syncDataToFirebase();
    renderAllData();

    if ( window.forceUpdateDashboard ) {
        setTimeout( () => window.forceUpdateDashboard(), 200 );
    }

    if ( trade.closed ) {
        const disciplinaryMsg = generateDisciplinaryMessage();
        if ( disciplinaryMsg ) {
            setTimeout( () => showDisciplinaryMessage( disciplinaryMsg ), 500 );
        }
    }

    return true;
}

//editTrade para calcular result =====
function editTrade( tradeId, updatedData ) {
    const tradeIndex = trades.findIndex( t => t.id === tradeId );
    if ( tradeIndex === -1 ) {
        console.error( "Trade no encontrado:", tradeId );
        return false;
    }

    const trade = trades[ tradeIndex ];
    console.log( `Editando trade: ${tradeId.substr( -6 )}` );

    const isPartialUpdate = updatedData.partials && updatedData.partials.length > 0;
    const hasExistingPartials = trade.partials && trade.partials.length > 0;
    const isPnLPreCalculated = updatedData.pnl !== undefined && ( isPartialUpdate || hasExistingPartials );

    Object.assign( trade, updatedData );

    // Recalcular P&L y result si NO hay parciales
    if ( !isPartialUpdate && !hasExistingPartials && !isPnLPreCalculated ) {
        const hasValidOpenPrice = trade.openPrice && !isNaN( trade.openPrice ) && trade.openPrice > 0;
        const hasValidClosePrice = trade.closePrice && !isNaN( trade.closePrice ) && trade.closePrice > 0;

        if ( hasValidOpenPrice && hasValidClosePrice ) {
            const priceDifference = trade.closePrice - trade.openPrice;
            const newPnL = ( trade.direction === 'buy' ? 1 : -1 ) * priceDifference * ( trade.totalContracts || trade.contracts );

            trade.pnl = newPnL;
            // ✅ CORRECCIÓN: Calcular result
            trade.result = newPnL > 0 ? 'win' : newPnL < 0 ? 'loss' : 'breakeven';
            trade.closed = true;
            trade.status = trade.partials && trade.partials.length > 0 ? 'Cerrado por TP' : ( trade.closeReason === 'manual' ? 'Cierre manual' : 'Cierre total' );
            trade.tpLevel = trade.tpLevel || 'tp1';
        } else if ( hasValidOpenPrice && ( !trade.closePrice || trade.closePrice === 0 ) ) {
            trade.pnl = trade.pnl || 0;
            trade.result = ''; // Vacío si está abierto
            trade.closed = false;
            trade.status = 'Abierto';
            trade.closePrice = null;
            trade.tpLevel = '';
        }
    } else if ( trade.closed && trade.pnl !== undefined ) {
        // ✅ Si hay P&L pre-calculado y está cerrado, calcular result
        const pnl = parseFloat( trade.pnl ) || 0;
        trade.result = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven';
    }

    trade.lastModified = new Date().toISOString();
    trades[ tradeIndex ] = trade;

    saveDataLocally();
    if ( currentUser ) syncDataToFirebase();
    renderAllData();

    return true;
}

//Filtros basados en P&L =====
function renderTrades() {
    const tbody = document.getElementById( "tradesTableBody" );
    if ( !tbody ) return;

    let filteredTrades = [ ...trades ];

    const strategyFilter = document.getElementById( "filterStrategy" )?.value;
    const resultFilter = document.getElementById( "filterResult" )?.value;
    const dateFilter = document.getElementById( "filterDate" )?.value;

    // Aplicar filtros
    if ( strategyFilter && strategyFilter !== 'all' ) {
        filteredTrades = filteredTrades.filter( trade => trade.strategy === strategyFilter );
    }

    // ✅ CORRECCIÓN: Filtro de resultado mejorado
    if ( resultFilter && resultFilter !== 'all' ) {
        if ( resultFilter === 'open' ) {
            filteredTrades = filteredTrades.filter( trade => !trade.closed );
        } else if ( resultFilter === 'win' ) {
            filteredTrades = filteredTrades.filter( trade => {
                if ( !trade.closed ) return false;
                const pnl = parseFloat( trade.pnl ) || 0;
                return pnl > 0 || trade.result === 'win';
            } );
        } else if ( resultFilter === 'loss' ) {
            filteredTrades = filteredTrades.filter( trade => {
                if ( !trade.closed ) return false;
                const pnl = parseFloat( trade.pnl ) || 0;
                return pnl < 0 || trade.result === 'loss';
            } );
        }
    }

    if ( dateFilter ) {
        filteredTrades = filteredTrades.filter( trade => trade.date === dateFilter );
    }

    // Mostrar indicador de filtros activos
    const hasActiveFilters = strategyFilter || resultFilter !== 'all' || dateFilter;
    const activeFiltersIndicator = document.getElementById( "activeFiltersIndicator" );
    const filteredCountEl = document.getElementById( "filteredTradesCount" );

    if ( hasActiveFilters && activeFiltersIndicator && filteredCountEl ) {
        activeFiltersIndicator.classList.remove( "hidden" );
        filteredCountEl.textContent = filteredTrades.length;
    } else if ( activeFiltersIndicator ) {
        activeFiltersIndicator.classList.add( "hidden" );
    }

    filteredTrades.sort( ( a, b ) => new Date( b.timestamp ) - new Date( a.timestamp ) );

    // ✅ CORRECCIÓN: Calcular stats basado en P&L
    const closedTrades = trades.filter( t => t.closed );
    const winningTrades = closedTrades.filter( t => {
        const pnl = parseFloat( t.pnl ) || 0;
        return pnl > 0;
    } );

    const allPnLs = closedTrades.map( t => parseFloat( t.pnl || 0 ) );
    const bestTrade = allPnLs.length > 0 ? Math.max( ...allPnLs ) : 0;
    const worstTrade = allPnLs.length > 0 ? Math.min( ...allPnLs ) : 0;
    const totalPnL = calculateTotalPnL();
    const winRate = closedTrades.length > 0 ? Math.round( ( winningTrades.length / closedTrades.length ) * 100 ) : 0;
    const openTrades = trades.filter( t => !t.closed ).length;

    // Actualizar badges y stats
    updateElement( "tradesCountBadge", trades.length );
    updateElement( "openTradesCountBadge", openTrades );
    updateElement( "tradesWinRate", `${winRate}%` );
    updateElement( "tradesPnLTotal", `$${totalPnL.toFixed( 2 )}`, totalPnL >= 0 ? 'text-profit' : 'text-loss' );
    updateElement( "tradesBestTrade", `$${bestTrade.toFixed( 2 )}` );
    updateElement( "tradesWorstTrade", `$${worstTrade.toFixed( 2 )}` );
    updateElement( "displayedTradesCount", filteredTrades.length );
    updateElement( "totalTradesCount", trades.length );
    updateElement( "lastTradesUpdate", new Date().toLocaleTimeString( 'es-PE', { hour: '2-digit', minute: '2-digit' } ) );

    // Renderizar filas
    if ( filteredTrades.length === 0 ) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="p-12 mt-6 text-center text-gray-400">
                    <div class="flex flex-col items-center space-y-3 py-6">
                        <div class="text-5xl">${hasActiveFilters ? '🔍' : '📊'}</div>
                        <div class="text-lg font-semibold">
                            ${hasActiveFilters ? 'No hay trades que coincidan con los filtros' : 'No hay trades registrados'}
                        </div>
                        ${hasActiveFilters ? `
                            <div class="text-sm text-gray-500">
                                Intenta ajustar los filtros o <button onclick="clearTradeFilters()" class="text-blue-400 hover:text-blue-300 underline">limpiar todos los filtros</button>
                            </div>
                        ` : `
                            <div class="text-sm text-gray-500">Comienza registrando tu primer trade</div>
                            <button onclick="document.getElementById('addTradeBtn').click()" 
                                    class="hover:bg-slate-700 p-2 rounded-lg font-medium text-sm transition-colors text-blue-400">
                                ➕ Registrar mi primer trade
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredTrades.map( trade => {
        const strategyName = strategyConfigs[ trade.strategy ]?.name || trade.strategy;
        const pnlValue = parseFloat( trade.pnl ) || 0;
        const pnlClass = pnlValue >= 0 ? "text-profit" : "text-loss";
        const symbolDisplay = trade.symbol || 'XAUUSD'; // Valor por defecto

        // Determinar resultado visual
        let resultBadge = '';
        if ( trade.closed ) {
            if ( pnlValue > 0 || trade.result === 'win' ) {
                resultBadge = '<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-900/40 text-green-300 border border-green-600/50">✅ Ganador</span>';
            } else if ( pnlValue < 0 || trade.result === 'loss' ) {
                resultBadge = '<span class="px-2 py-1 rounded-full text-xs font-bold bg-red-900/40 text-red-300 border border-red-600/50">❌ Perdedor</span>';
            } else {
                resultBadge = '<span class="px-2 py-1 rounded-full text-xs font-bold bg-gray-700 text-gray-300">⚖️ Break Even</span>';
            }
        } else {
            resultBadge = '<span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-900/40 text-blue-300 animate-pulse">⏳ Abierto</span>';
        }

        const statusDisplay = trade.closed ? trade.status : 'Abierto';
        const statusClass = trade.closed
            ? ( trade.status === 'Cerrado por TP' ? 'bg-green-800 text-green-200'
                : trade.status === 'Cierre manual' ? 'bg-orange-800 text-orange-200'
                    : 'bg-gray-800 text-gray-200' )
            : 'bg-green-800 text-green-200 animate-pulse';

        const closePrice = trade.closePrice
            ? `$${trade.closePrice.toFixed( 2 )}`
            : ( trade.closed ? 'Cerrado' : '⏳ Pendiente' );

        return `
<tr class="border-b border-gray-700 hover:bg-gray-800/50 transition-all duration-200 group">
    <td class="p-3 text-sm whitespace-nowrap w-[5%]">
        ${new Date( trade.date ).toLocaleDateString( 'es-PE', { day: '2-digit', month: 'short' } )}
    </td>

    <td class="p-3 text-center w-[8%]">
        <span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-900/40 text-blue-300 border border-blue-600/50">
            ${symbolDisplay}
        </span>
    </td>

    <td class="p-3 text-sm font-medium w-[12%]">
        <span class="inline-block truncate" title="${strategyName}">
            ${strategyName}
        </span>
    </td>

    <td class="p-3 text-center w-[8%] whitespace-nowrap">
        <span class="px-2 py-1 rounded-full inline-flex items-center justify-center text-xs font-bold 
            ${trade.direction === 'buy'
                ? 'bg-green-900/40 text-green-300 border border-green-600/50'
                : 'bg-red-900/40 text-red-300 border border-red-600/50'} 
            min-w-[70px]">
            ${trade.direction === 'buy' ? '↗️ LONG' : '↘️ SHORT'}
        </span>
    </td>

    <td class="p-3 text-sm font-bold text-center w-[6%]">${trade.totalContracts || trade.contracts}</td>

    <td class="p-3 text-sm font-mono text-right w-[8%]">${trade.openPrice ? `$${trade.openPrice.toFixed( 2 )}` : '—'}</td>

    <td class="p-3 text-sm font-mono text-right w-[8%]">${closePrice}</td>

    <td class="p-3 text-center w-[9%]">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass} whitespace-nowrap">
            ${statusDisplay} ${trade.tpLevel ? `(${trade.tpLevel.toUpperCase()})` : ''}
        </span>
    </td>

    <td class="p-3 text-center w-[9%] whitespace-nowrap">
        ${resultBadge}
    </td>

    <td class="p-3 ${pnlClass} font-bold text-sm font-mono text-right w-[8%]">
        ${pnlValue >= 0 ? '+' : ''}$${pnlValue.toFixed( 2 )}
    </td>

    <td class="p-3 w-[8%] max-w-[150px]">
        <span class="cursor-pointer text-blue-400 hover:text-blue-300 text-xs truncate block" 
              onclick="showCommentTooltip(event, '${( trade.comments || '' ).replace( /'/g, "\\'" )}')">
            ${trade.comments && trade.comments.length > 20
                ? trade.comments.substring( 0, 20 ) + "..."
                : ( trade.comments || '📝 Sin notas' )}
        </span>
    </td>

    <td class="p-3 w-[6%]">
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
            <button onclick="showEditTradeModal('${trade.id}')" 
                    class="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 text-xs px-2 py-1 rounded transition-all"
                    title="Editar trade">✏️</button>
            <button onclick="showTradeDetails('${trade.id}')" 
                    class="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 text-xs px-2 py-1 rounded transition-all"
                    title="Ver detalles">👁️</button>
            <button onclick="deleteTrade('${trade.id}')" 
                    class="text-red-400 hover:text-red-300 hover:bg-red-900/30 text-xs px-2 py-1 rounded transition-all"
                    title="Eliminar trade">🗑️</button>
        </div>
    </td>
</tr>`;
    } ).join( "" );

    console.log( `Tabla renderizada: ${filteredTrades.length} trades de ${trades.length} totales` );
}

// NUEVA FUNCIÓN: Helper para actualizar elementos
function updateElement( id, content, className = null ) {
    const el = document.getElementById( id );
    if ( el ) {
        el.textContent = content;
        if ( className ) {
            el.className = className;
        }
    }
}

// NUEVA FUNCIÓN: Limpiar filtros
function clearTradeFilters() {
    const strategyFilter = document.getElementById( "filterStrategy" );
    const resultFilter = document.getElementById( "filterResult" );
    const dateFilter = document.getElementById( "filterDate" );

    if ( strategyFilter ) strategyFilter.value = "";
    if ( resultFilter ) resultFilter.value = "all";
    if ( dateFilter ) dateFilter.value = "";

    renderTrades();
    updateSyncStatus( "Filtros limpiados", true );
}

function deleteTrade( tradeId ) {
    if ( trades.length > 0 ) {
        trades = trades.filter( ( trade ) => trade.id !== tradeId );
    }
    saveDataLocally();
    if ( currentUser ) syncDataToFirebase();
    renderAllData();
    updateRiskIndicators(); // Actualizar indicadores de riesgo
}

// CORREGIDA: Función para actualizar contadores diarios
function updateDailyCountersFromTrades() {
    if ( updatingRisk ) return;
    updatingRisk = true;

    try {
        checkAndResetDailyCounters(); // Verificar si es nuevo día

        const today = new Date().toISOString().split( "T" )[ 0 ];

        // Validar que trades sea un array
        if ( !Array.isArray( trades ) ) {
            console.warn( "trades no es un array válido" );
            updatingRisk = false;
            return;
        }

        const todayTrades = trades.filter( trade => trade && trade.date === today );
        // CORREGIDO: Solo contar trades CERRADOS para límites
        const todayClosedTrades = todayTrades.filter( trade => trade && trade.closed === true );

        dailyTradesExecuted = todayClosedTrades.length;
        dailyPnLAccumulated = todayClosedTrades.reduce(
            ( total, trade ) => total + parseFloat( trade.pnl || 0 ), 0
        );

        console.log( `Contadores actualizados: ${dailyTradesExecuted} trades cerrados, P&L: ${dailyPnLAccumulated.toFixed( 2 )}` );

        const effectiveCapital = calculateEffectiveCapital();
        const maxDailyLoss = effectiveCapital * 0.05;

        // Actualizar estado de bloqueo
        if ( Math.abs( dailyPnLAccumulated ) >= maxDailyLoss && dailyPnLAccumulated < 0 ) {
            dailyLossLimitReached = true;
            tradingBlocked = true;
        } else if ( dailyTradesExecuted >= 3 ) {
            // CORREGIDO: No bloquear por límite de trades si no hay pérdidas significativas
            tradingBlocked = dailyPnLAccumulated < -20;
        } else {
            dailyLossLimitReached = false;
            tradingBlocked = false;
        }

    } catch ( error ) {
        console.error( "Error actualizando contadores diarios:", error );
    } finally {
        updatingRisk = false;
    }
}

// Observaciones
function addObservation( text ) {
    const observation = {
        id: Date.now().toString(),
        text,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
    };
    observations.push( observation );
    saveDataLocally();
    if ( currentUser ) syncDataToFirebase();
    renderObservations();
}

// Cálculos
function calculateWinRate() {
    const closedTrades = trades.filter( t => t.closed );
    if ( closedTrades.length === 0 ) return 0;

    const winningTrades = closedTrades.filter( trade => {
        const pnl = parseFloat( trade.pnl ) || 0;
        return pnl > 0;
    } );

    return Math.round( ( winningTrades.length / closedTrades.length ) * 100 );
}

function calculateTotalPnL() {
    return trades.reduce(
        ( total, trade ) => total + ( parseFloat( trade.pnl ) || 0 ),
        0
    );
}

function calculateDailyPnL() {
    const today = new Date().toISOString().split( "T" )[ 0 ];
    return trades
        .filter( ( trade ) => trade.date === today )
        .reduce( ( total, trade ) => total + ( parseFloat( trade.pnl ) || 0 ), 0 );
}

function getTodayTradesCount() {
    const today = new Date().toISOString().split( "T" )[ 0 ];
    return trades.filter( ( trade ) => trade.date === today ).length;
}

function getTotalWithdrawals() {
    return withdrawals.reduce(
        ( total, w ) => total + ( parseFloat( w.amount ) || 0 ),
        0
    );
}

function calculateDrawdown() {
    const totalPnL = calculateTotalPnL();
    const effectiveCapital = calculateEffectiveCapital();
    if ( effectiveCapital === 0 ) return 0;
    const peakCapital = Math.max( effectiveCapital, currentCapital );
    return Math.round(
        Math.max( 0, ( ( peakCapital - effectiveCapital ) / peakCapital ) * 100 )
    );
}

function calculateStrategyStats() {
    const stats = {};
    Object.keys( strategyConfigs ).forEach( ( strategy ) => {
        const strategyTrades = trades.filter(
            ( trade ) => trade.strategy === strategy
        );

        // ✅ CORRECCIÓN: Solo contar trades cerrados para Win Rate
        const closedTrades = strategyTrades.filter( t => t.closed );
        const wins = closedTrades.filter( trade => {
            const pnl = parseFloat( trade.pnl ) || 0;
            return pnl > 0 || trade.result === "win";
        } ).length;

        const winRate = closedTrades.length > 0
            ? Math.round( ( wins / closedTrades.length ) * 100 )
            : 0;

        const pnl = strategyTrades.reduce(
            ( total, trade ) => total + ( parseFloat( trade.pnl ) || 0 ),
            0
        );

        stats[ strategy ] = {
            winRate,
            pnl,
            count: strategyTrades.length,
            closedCount: closedTrades.length,
            wins: wins
        };
    } );
    return stats;
}

function updateCapitalBreakdown() {
    const totalPnL = calculateTotalPnL();
    const effectiveCapital = calculateEffectiveCapital();

    document.getElementById( "baseCapital" ).textContent = `$${currentCapital.toFixed( 2 )}`;
    const tradingPnLEl = document.getElementById( "tradingPnL" );
    if ( tradingPnLEl ) {
        tradingPnLEl.textContent = `$${totalPnL.toFixed( 2 )}`;
        tradingPnLEl.className = `text-lg font-bold ${totalPnL >= 0 ? "text-profit" : "text-loss"}`;
    }
    document.getElementById( "effectiveCapitalDisplay" ).textContent = `$${effectiveCapital.toFixed( 2 )}`;

    // Actualizar métricas adicionales con los IDs correctos
    document.getElementById( "capitalGrowth" ).textContent = calculateCapitalGrowth();// Crecimiento
    document.getElementById( "riskUtilization" ).textContent = calculateRiskUtilization(); // Riesgo Utilizado
    document.getElementById( "withdrawalRatio" ).textContent = calculateWithdrawalRatio(); // Ratio Retiros
    document.getElementById( "profitFactor" ).textContent = calculateProfitFactor();  // Factor Beneficio
}

function calculateCapitalGrowth() {
    const effectiveCapital = calculateEffectiveCapital();
    if ( currentCapital === 0 ) return "0%";
    return `${Math.round( ( ( effectiveCapital - currentCapital ) / currentCapital ) * 100 )}%`;
}

function calculateRiskUtilization() {
    // Ejemplo: Riesgo como porcentaje del capital efectivo (ajusta según tu lógica)
    const openTradesRisk = trades.filter( t => !t.closed ).reduce( ( sum, t ) => sum + ( parseFloat( t.riskAmount ) || 0 ), 0 );
    const effectiveCapital = calculateEffectiveCapital();
    if ( effectiveCapital === 0 ) return "0%";
    return `${Math.round( ( openTradesRisk / effectiveCapital ) * 100 )}%`;
}

function calculateWithdrawalRatio() {
    const totalWithdrawals = withdrawals.reduce( ( sum, w ) => sum + parseFloat( w.amount || 0 ), 0 );
    if ( currentCapital === 0 ) return "0%";
    return `${Math.round( ( totalWithdrawals / currentCapital ) * 100 )}%`;
}

function calculateProfitFactor() {
    const closedTrades = trades.filter( t => t.closed );
    const totalWins = closedTrades.filter( t => parseFloat( t.pnl ) > 0 ).reduce( ( sum, t ) => sum + parseFloat( t.pnl ), 0 );
    const totalLosses = Math.abs( closedTrades.filter( t => parseFloat( t.pnl ) < 0 ).reduce( ( sum, t ) => sum + parseFloat( t.pnl ), 0 ) );
    if ( totalLosses === 0 ) return "0.0";
    return ( totalWins / totalLosses ).toFixed( 1 );
}

function calculateOptimalContractsWithEffectiveCapital( strategy ) {
    const config = strategyConfigs[ strategy ] || strategyConfigs.regulares;
    const effectiveCapital = calculateEffectiveCapital();
    if ( !config || effectiveCapital <= 0 ) return 1;

    // ← FIX: usar config.riskPercent correctamente
    const riskAmount = ( effectiveCapital * config.riskPercent ) / 100;
    const stopLossPips = config.stopLoss;
    return Math.max( 1, Math.floor( riskAmount / stopLossPips ) );
}

// Función corregida para calcular result y pnl
function calculateTradeResult( openPrice, closePrice, direction, contracts ) {
    // Si no hay closePrice o es 0, retornar valores neutros
    if ( !closePrice || closePrice === 0 ) {
        return { pnl: 0, result: "" };
    }

    if ( !openPrice || !direction || !contracts ) {
        return { pnl: 0, result: "" };
    }

    let difference = direction === "buy" ? closePrice - openPrice : openPrice - closePrice;
    const pnl = difference * contracts;

    return {
        pnl: pnl,
        result: pnl > 0 ? "win" : pnl < 0 ? "loss" : ""
    };
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
    const maxDailyRisk = effectiveCapital * 0.05;

    // NUEVA LÍNEA: Actualizar capital base
    const dashBaseCapitalEl = document.getElementById( "dashBaseCapital" );
    if ( dashBaseCapitalEl ) {
        const totalAdded = capitalAdditions.reduce( ( sum, a ) => sum + parseFloat( a.amount || 0 ), 0 );
        dashBaseCapitalEl.textContent = `$${totalAdded.toFixed( 2 )}`;
    }

    // Actualizar elementos básicos del dashboard
    const dashCapitalEl = document.getElementById( "dashCapital" );
    const dashRiskEl = document.getElementById( "dashRisk" );
    const currentWinRateEl = document.getElementById( "currentWinRate" );
    const totalTradesEl = document.getElementById( "totalTrades" );
    const dailyPnLElement = document.getElementById( "dailyPnL" );
    const drawdownEl = document.getElementById( "drawdown" );
    const todayTradesEl = document.getElementById( "todayTrades" );
    const totalWithdrawalsEl = document.getElementById( "totalWithdrawals" );
    const totalPnLElement = document.getElementById( "totalPnL" );

    // Actualizar solo si los elementos existen
    if ( dashCapitalEl ) dashCapitalEl.textContent = `$${effectiveCapital.toFixed( 2 )}`;
    if ( dashRiskEl ) dashRiskEl.textContent = `$${maxDailyRisk.toFixed( 2 )}`;
    if ( currentWinRateEl ) currentWinRateEl.textContent = `${winRate}%`;
    if ( totalTradesEl ) totalTradesEl.textContent = trades.length;

    if ( dailyPnLElement ) {
        dailyPnLElement.textContent = `$${dailyPnL.toFixed( 2 )}`;
        dailyPnLElement.className = `text-lg sm:text-xl font-bold ${dailyPnL >= 0 ? "text-profit" : "text-loss"}`;
    }

    if ( drawdownEl ) drawdownEl.textContent = `${drawdown}%`;
    if ( todayTradesEl ) todayTradesEl.textContent = todayTrades;

    if ( totalPnLElement ) {
        totalPnLElement.textContent = `$${totalPnL.toFixed( 2 )}`;
        totalPnLElement.className = `text-lg sm:text-xl font-bold ${totalPnL >= 0 ? "text-profit" : "text-loss"}`;
    }

    // ... resto del código
    renderStrategyStats();
}

function renderStrategyStats() {
    const stats = calculateStrategyStats();

    // Actualizar stats individuales por estrategia
    Object.keys( stats ).forEach( ( strategy ) => {
        const strategyElement = document.querySelector(
            `.strategy-stats[data-strategy="${strategy}"]`
        );
        if ( strategyElement ) {
            strategyElement.querySelector( ".strategy-winrate" ).textContent =
                `${stats[ strategy ].winRate}%`;
            const pnlEl = strategyElement.querySelector( ".strategy-pnl" );
            pnlEl.textContent = `$${stats[ strategy ].pnl.toFixed( 2 )}`;
            pnlEl.className = `strategy-pnl font-bold ${stats[ strategy ].pnl >= 0 ? "text-profit" : "text-loss"}`;
            strategyElement.querySelector( ".strategy-count" ).textContent =
                stats[ strategy ].count;
        }
    } );

    // ✅ NUEVA LÓGICA: Calcular y actualizar resúmenes generales
    const usedStrategies = Object.values( stats ).filter( s => s.count > 0 );
    const totalStrategiesUsed = usedStrategies.length;
    const totalBalance = Object.values( stats ).reduce( ( sum, s ) => sum + s.pnl, 0 );

    // Estrategia más usada (por count total)
    let mostUsedStrategy = '-';
    let maxCount = 0;
    let mostUsedKey = '';
    Object.entries( stats ).forEach( ( [ key, s ] ) => {
        if ( s.count > maxCount ) {
            maxCount = s.count;
            mostUsedKey = strategyConfigs[ key ]?.name || key;
        }
    } );
    if ( maxCount > 0 ) mostUsedStrategy = mostUsedKey;

    // Mejor Win Rate (solo estrategias con trades cerrados > 0)
    let bestWinRate = 0;
    Object.values( stats ).forEach( s => {
        if ( s.closedCount > 0 && s.winRate > bestWinRate ) {
            bestWinRate = s.winRate;
        }
    } );

    // Actualizar elementos del resumen
    updateElement( "totalStrategiesUsed", totalStrategiesUsed );
    updateElement( "bestStrategyWR", `${bestWinRate}%` );
    updateElement( "mostUsedStrategy", mostUsedStrategy );
    updateElement( "strategiesBalance", `$${totalBalance.toFixed( 2 )}`, totalBalance >= 0 ? 'text-profit' : 'text-loss' );

    console.log( 'Resúmenes actualizados:', { totalStrategiesUsed, bestWinRate, mostUsedStrategy, totalBalance } );
}

function calculateEffectiveCapital() {
    try {
        if ( typeof currentCapital !== 'number' || isNaN( currentCapital ) || currentCapital < 0 ) {
            console.warn( "currentCapital inválido:", currentCapital );
            return 0;
        }

        const totalAdditions = capitalAdditions.reduce( ( sum, a ) => sum + parseFloat( a.amount || 0 ), 0 );
        const totalWithdrawals = withdrawals.reduce( ( sum, w ) => sum + parseFloat( w.amount || 0 ), 0 );
        const totalPnL = calculateTotalPnL();
        const effectiveCapital = totalAdditions - totalWithdrawals + totalPnL;

        return Math.max( 0, effectiveCapital );
    } catch ( error ) {
        console.error( "Error calculando capital efectivo:", error );
        return 0;
    }
}

function renderCapitalSection() {
    const effectiveCapital = calculateEffectiveCapital();
    const inputCapital = document.getElementById( "currentCapitalDisplay" );
    if ( inputCapital ) inputCapital.value = currentCapital.toFixed( 2 );

    const maxDailyRiskEl = document.getElementById( "maxDailyRisk" );
    if ( maxDailyRiskEl ) {
        maxDailyRiskEl.textContent = `$${( effectiveCapital * 0.05 ).toFixed( 2 )}`;
    }

    updateStrategyDisplay();
}


function showTradeDetails( tradeId ) {
    const trade = trades.find( t => t.id === tradeId );
    if ( !trade ) return;

    const displayedPnL = trade.partials && trade.partials.length > 0 && !trade.closed ? ( trade.partials.reduce( ( sum, p ) => sum + ( parseFloat( p.pnl ) || 0 ), 0 ) ) : ( parseFloat( trade.pnl ) || 0 );
    const pnlClass = displayedPnL >= 0 ? 'text-green-400' : 'text-red-400';

    const partialsInfo = trade.partials && trade.partials.length > 0 ? `
        <div class="mt-4">
            <h4 class="text-lg font-semibold text-gold">Detalles de Parciales</h4>
            <ul class="list-disc pl-5 text-sm text-gray-300">
                ${trade.partials.map( p => `<li>${p.type}: ${p.contracts} contratos @ $${p.price.toFixed( 2 )} (P&L: $${p.pnl.toFixed( 2 )})</li>` ).join( '' )}
            </ul>
            <p class="text-sm text-gray-400 mt-2">Tamaño total de contratos: ${trade.totalContracts}</p>
            <p class="text-sm text-gray-400 mt-2">P&L Total de Parciales: $${trade.partials.reduce( ( sum, p ) => sum + ( parseFloat( p.pnl ) || 0 ), 0 ).toFixed( 2 )}</p>
        </div>
    ` : '';

    const modalHTML = `
        <div id="tradeDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-trading-card p-6 rounded-lg border border-gray-700 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold text-gold">👁️ Detalles del Trade</h3>
                    <button onclick="closeTradeDetailsModal()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div class="space-y-4">
                    <div class="bg-gray-800 p-3 rounded-lg">
                        <p class="text-sm text-gray-400">Estrategia: ${strategyConfigs[ trade.strategy ]?.name || trade.strategy}</p>
                        <p class="text-white">Dirección: ${trade.direction === 'buy' ? 'Compra' : 'Venta'}</p>
                        <p class="text-sm text-gray-400">Fecha: ${new Date( trade.date ).toLocaleDateString()}</p>
                        <p class="text-sm text-gray-400">Entrada: $${trade.openPrice?.toFixed( 2 ) || 'N/A'}</p>
                        <p class="text-sm text-gray-400">Cierre: ${trade.closePrice ? `$${trade.closePrice.toFixed( 2 )}` : 'Sin cerrar'}</p>
                        <p class="text-sm text-gray-400">Estado: ${trade.status} ${trade.tpLevel ? `(${trade.tpLevel})` : ''}</p>
                        <p class="text-sm ${pnlClass} font-bold">P&L: $${displayedPnL.toFixed( 2 )}</p>
                    </div>
                    ${partialsInfo}
                    <div class="text-sm text-gray-400">
                        <p>Comentarios: ${trade.comments || 'Sin comentarios'}</p>
                        <p>Motivo de cierre: ${trade.closeReason || 'N/A'}</p>
                        <p>Notas adicionales: ${trade.closeNotes || 'N/A'}</p>
                    </div>
                </div>
                <div class="mt-6">
                    <button onclick="closeTradeDetailsModal()" 
                            class="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML( "beforeend", modalHTML );
    document.getElementById( "tradeDetailsModal" ).addEventListener( "click", function ( e ) {
        if ( e.target === this ) closeTradeDetailsModal();
    } );
}

function closeTradeDetailsModal() {
    const modal = document.getElementById( "tradeDetailsModal" );
    if ( modal ) modal.remove();
}

function renderObservations() {
    const container = document.getElementById( "observationsList" );
    const placeholder = document.getElementById( "observationsPlaceholder" );
    const countElement = document.getElementById( "observationsCount" );

    if ( !container ) return;

    const sortedObservations = [ ...observations ].sort(
        ( a, b ) => new Date( b.timestamp ) - new Date( a.timestamp )
    );

    // Actualizar contador
    if ( countElement ) {
        countElement.textContent = `${observations.length} observación${observations.length !== 1 ? 'es' : ''}`;
    }

    // Mostrar/ocultar placeholder
    if ( placeholder ) {
        placeholder.classList.toggle( 'hidden', sortedObservations.length > 0 );
    }

    // Si hay observaciones, renderizar en grid
    if ( sortedObservations.length > 0 ) {
        container.innerHTML = sortedObservations
            .map( obs => `
                <div class="observation-card bg-gray-800/70 p-4 rounded-lg border border-gray-600 hover:border-gold/50 transition-all duration-200">
                    <!-- Fecha y acciones -->
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-xs text-gray-500 flex items-center gap-1">
                            <span>📅</span>
                            <span>${obs.date}</span>
                        </span>
                        <button onclick="deleteObservation('${obs.id}')" 
                                class="text-red-400 hover:text-red-300 text-sm transition-colors hover:scale-110"
                                title="Eliminar observación">
                            🗑️
                        </button>
                    </div>
                    
                    <!-- Contenido de la observación -->
                    <div class="text-sm text-gray-200 leading-relaxed break-words">
                        ${obs.text}
                    </div>
                    
                    <!-- Indicador de tipo (si existe) -->
                    ${obs.type ? `
                        <div class="mt-3 pt-3 border-t border-gray-700">
                            <span class="text-xs px-2 py-1 rounded-full ${obs.type === 'post-trade'
                        ? 'bg-blue-900/40 text-blue-300'
                        : 'bg-purple-900/40 text-purple-300'
                    }">
                                ${obs.type === 'post-trade' ? '📊 Post-Trade' : '💭 General'}
                            </span>
                        </div>
                    ` : ''}
                </div>
            `)
            .join( "" );
    }
}

// ===== SISTEMA DE CONTROL DE DISCIPLINA =====
function updateDisciplineIndicators() {
    if ( !trades || trades.length === 0 ) {
        // Si no hay trades, mantener 100%
        updateDisciplineDisplay( 100, 100, 100 );
        return;
    }

    const today = new Date().toISOString().split( "T" )[ 0 ];
    const todayTrades = trades.filter( t => t.date === today );
    const effectiveCapital = calculateEffectiveCapital();
    const maxDailyRisk = effectiveCapital * 0.05;

    // 1. RESPETO A STOP LOSS
    // Verificar si algún trade tiene historial de modificación de SL indebida
    const slViolations = trades.filter( t => t.slModified && t.slModifiedReason === 'increase_risk' ).length;
    const slDiscipline = trades.length > 0 ? Math.max( 0, 100 - ( slViolations / trades.length ) * 100 ) : 100;

    // 2. LÍMITE DIARIO
    const dailyPnL = calculateDailyPnL();
    const dailyRiskUsed = Math.abs( dailyPnL );
    const dailyDiscipline = dailyRiskUsed <= maxDailyRisk ? 100 : Math.max( 0, 100 - ( ( dailyRiskUsed - maxDailyRisk ) / maxDailyRisk ) * 50 );

    // 3. GESTIÓN DE RIESGO
    // Verificar cuántos trades respetan el sizing correcto
    let properSizing = 0;
    todayTrades.forEach( trade => {
        const config = strategyConfigs[ trade.strategy ] || strategyConfigs.regulares;
        const optimalContracts = calculateOptimalContractsWithEffectiveCapital( trade.strategy );
        const variance = Math.abs( trade.contracts - optimalContracts ) / optimalContracts;

        // Permitir hasta 20% de variación
        if ( variance <= 0.2 ) {
            properSizing++;
        }
    } );

    const riskDiscipline = todayTrades.length > 0
        ? ( properSizing / todayTrades.length ) * 100
        : 100;

    // Actualizar display
    updateDisciplineDisplay(
        Math.round( slDiscipline ),
        Math.round( dailyDiscipline ),
        Math.round( riskDiscipline )
    );
}

function updateDisciplineDisplay( slPercent, limitPercent, riskPercent ) {
    // Función auxiliar para determinar color
    const getStatusColor = ( percent ) => {
        if ( percent >= 90 ) return 'bg-green-500';
        if ( percent >= 70 ) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Actualizar Respeto a Stop Loss
    const slIndicator = document.getElementById( 'slDiscipline' );
    const slPercentEl = document.getElementById( 'slPercentage' );
    if ( slIndicator && slPercentEl ) {
        slIndicator.className = `w-3 h-3 rounded-full ${getStatusColor( slPercent )}`;
        slPercentEl.textContent = `${slPercent}%`;
        slPercentEl.className = `text-sm font-bold ${slPercent >= 90 ? 'text-green-400' : slPercent >= 70 ? 'text-yellow-400' : 'text-red-400'}`;
    }

    // Actualizar Límite Diario
    const limitIndicator = document.getElementById( 'limitDiscipline' );
    const limitPercentEl = document.getElementById( 'limitPercentage' );
    if ( limitIndicator && limitPercentEl ) {
        limitIndicator.className = `w-3 h-3 rounded-full ${getStatusColor( limitPercent )}`;
        limitPercentEl.textContent = `${limitPercent}%`;
        limitPercentEl.className = `text-sm font-bold ${limitPercent >= 90 ? 'text-green-400' : limitPercent >= 70 ? 'text-yellow-400' : 'text-red-400'}`;
    }

    // Actualizar Gestión de Riesgo
    const riskIndicator = document.getElementById( 'riskDiscipline' );
    const riskPercentEl = document.getElementById( 'riskPercentage' );
    if ( riskIndicator && riskPercentEl ) {
        riskIndicator.className = `w-3 h-3 rounded-full ${getStatusColor( riskPercent )}`;
        riskPercentEl.textContent = `${riskPercent}%`;
        riskPercentEl.className = `text-sm font-bold ${riskPercent >= 90 ? 'text-green-400' : riskPercent >= 70 ? 'text-yellow-400' : 'text-red-400'}`;
    }

    // Calcular y actualizar Disciplina General (promedio ponderado)
    const overallDiscipline = Math.round( ( slPercent * 0.4 + limitPercent * 0.35 + riskPercent * 0.25 ) );

    const overallEl = document.getElementById( 'overallDiscipline' );
    const barEl = document.getElementById( 'disciplineBar' );

    if ( overallEl ) {
        overallEl.textContent = `${overallDiscipline}%`;
        overallEl.className = `text-3xl font-bold ${overallDiscipline >= 90 ? 'text-green-400' :
            overallDiscipline >= 70 ? 'text-yellow-400' :
                'text-red-400'
            }`;
    }

    if ( barEl ) {
        barEl.style.width = `${overallDiscipline}%`;
        barEl.className = `h-4 rounded-full transition-all duration-500 shadow-lg ${overallDiscipline >= 90 ? 'bg-gradient-to-r from-green-500 to-green-400' :
            overallDiscipline >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                'bg-gradient-to-r from-red-500 to-red-400'
            }`;
    }

    // Mostrar alerta si la disciplina es baja
    if ( overallDiscipline < 70 ) {
        showDisciplineAlert( overallDiscipline );
    }
}

function showDisciplineAlert( score ) {
    // Verificar si ya existe una alerta activa
    if ( document.getElementById( 'disciplineAlert' ) ) return;

    const alertHTML = `
        <div id="disciplineAlert" class="fixed top-4 right-4 z-50 max-w-sm animate-slide-in">
            <div class="bg-red-900/90 border border-red-500 rounded-lg p-4 shadow-xl">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">⚠️</span>
                            <h4 class="font-bold text-white">Alerta de Disciplina</h4>
                        </div>
                        <p class="text-sm text-red-200">
                            Tu nivel de disciplina está en <b>${score}%</b>. 
                            Revisa tus últimas operaciones y ajusta tu comportamiento.
                        </p>
                    </div>
                    <button onclick="closeDisciplineAlert()" 
                            class="text-white hover:text-gray-300 text-xl font-bold ml-3">×</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML( 'beforeend', alertHTML );

    // Auto-hide después de 8 segundos
    setTimeout( () => {
        closeDisciplineAlert();
    }, 8000 );
}

function closeDisciplineAlert() {
    const alert = document.getElementById( 'disciplineAlert' );
    if ( alert ) alert.remove();
}

// FUNCIÓN ÚNICA PARA MODAL DE RETIROS (recentWithdrawals)
function renderRecentWithdrawals() {
    const container = document.getElementById( "recentWithdrawals" );
    if ( !container ) return;

    // Combinar retiros y depósitos
    const allMovements = [
        ...withdrawals.map( w => ( { ...w, type: 'withdrawal' } ) ),
        ...capitalAdditions.map( d => ( { ...d, type: 'deposit' } ) )
    ].sort( ( a, b ) => new Date( b.date ) - new Date( a.date ) );

    const recentMovements = allMovements.slice( 0, 10 );

    if ( recentMovements.length === 0 ) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <div class="text-2xl mb-2">💰</div>
                <div class="text-sm">No hay movimientos registrados</div>
            </div>
        `;
        return;
    }

    container.innerHTML = recentMovements.map( movement => `
        <div class="capital-movement-item ${movement.type}">
            <div class="capital-movement-header">
                <span class="capital-movement-amount ${movement.type === 'deposit' ? 'text-profit' : 'text-orange-400'}">
                    ${movement.type === 'deposit' ? '+' : '-'}$${parseFloat( movement.amount ).toFixed( 2 )}
                </span>
                <span class="text-xs text-gray-500">
                    ${new Date( movement.date ).toLocaleDateString()}
                </span>
            </div>
            ${movement.concept ? `
                <div class="capital-movement-details">
                    ${movement.concept}
                </div>
            ` : ''}
        </div>
    `).join( '' );
}

// ACTUALIZAR el contador de registros en la tabla
function renderCapitalMovementsTable() {
    const container = document.getElementById( 'capitalMovementsTableBody' );
    const summaryContainer = document.getElementById( 'capitalSummaryRow' );
    const tfoot = summaryContainer?.closest( 'tfoot' );

    if ( !container ) return;

    const allMovements = [
        ...capitalAdditions.map( d => ( { ...d, type: 'deposit' } ) ),
        ...withdrawals.map( w => ( { ...w, type: 'withdrawal' } ) )
    ].sort( ( a, b ) => new Date( b.date ) - new Date( a.date ) );

    // Calcular totales
    const totalDeposits = capitalAdditions.reduce( ( sum, d ) => sum + parseFloat( d.amount || 0 ), 0 );
    const totalWithdrawals = withdrawals.reduce( ( sum, w ) => sum + parseFloat( w.amount || 0 ), 0 );
    const netBalance = totalDeposits - totalWithdrawals;

    // Mostrar u ocultar tfoot
    if ( tfoot ) tfoot.classList.toggle( 'hidden', allMovements.length === 0 );

    if ( allMovements.length === 0 ) {
        container.innerHTML = `
            <tr>
                <td colspan="5" class="p-8 text-center">
                    <div class="text-gray-600 text-sm mt-4">Los depósitos y retiros aparecerán aquí</div>
                </td>
            </tr>
        `;
    } else {
        container.innerHTML = allMovements.map( movement => {
            const isDeposit = movement.type === 'deposit';
            const amount = parseFloat( movement.amount );
            return `
                <tr class="border-b border-gray-700/50 hover:bg-gray-800/50 transition-all group">
                    <td class="p-4 text-sm text-gray-300 font-medium">
                        ${new Date( movement.date ).toLocaleDateString( 'es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            } )}
                    </td>
                    <td class="p-4">
                        <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${isDeposit
                    ? 'bg-green-900/40 text-green-300 border border-green-600/50'
                    : 'bg-orange-900/40 text-orange-300 border border-orange-600/50'}">
                            ${isDeposit ? 'Ingreso' : 'Retiro'}
                        </span>
                    </td>
                    <td class="p-4 text-sm text-white font-medium">${movement.concept || 'Sin concepto'}</td>
                    <td class="p-4 text-right">
                        <span class="text-base font-bold ${isDeposit ? 'text-green-400' : 'text-orange-400'}">
                            ${isDeposit ? '+' : '-'}$${amount.toFixed( 2 )}
                        </span>
                    </td>
                    <td class="p-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-400 italic truncate max-w-[250px]" 
                                  title="${movement.notes || 'Sin notas'}">
                                ${movement.notes || '-'}
                            </span>
                            <button onclick="deleteCapitalMovement('${movement.id}', '${movement.type}')"
                                    class="ml-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 
                                           text-sm transition-all hover:scale-110"
                                    title="Eliminar movimiento">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } ).join( '' );
    }

    // Fila de totales
    if ( summaryContainer ) {
        summaryContainer.innerHTML = `
            <td class="p-5 text-left font-bold text-white uppercase tracking-wider text-base bg-gray-800/80">Totales:</td>
            <td class="p-5 bg-gray-800/80"></td>
            <td class="p-5 bg-gray-800/80"></td>
            <td class="p-5 text-right bg-gray-800/80">
                <div class="text-green-400 font-bold text-md">$${totalDeposits.toFixed( 2 )}</div>
                <div class="text-orange-400 font-bold text-md mt-1">$${totalWithdrawals.toFixed( 2 )}</div>
            </td>
            <td class="p-5 text-right font-bold ${netBalance >= 0 ? 'text-gold' : 'text-red-400'} text-xl bg-gray-800/80">
                $${netBalance.toFixed( 2 )}
            </td>
        `;
    }

    // ✅ Actualizar contador visible
    const countElement = document.getElementById( 'totalMovementsCount' );
    if ( countElement ) {
        countElement.textContent = allMovements.length.toString();
    }
}

// Asegurar que renderAllData incluya la tabla de movimientos
function renderAllData() {
    try {
        updateDailyCountersFromTrades();
        renderDashboard();
        renderCapitalSection();
        renderTrades();
        renderObservations();
        renderRecentWithdrawals();
        renderCapitalMovementsTable();
        updateCapitalBreakdown();
        updateStrategyDisplay();

        // ✅ AGREGAR ESTA LÍNEA
        updateDisciplineIndicators();

        if ( currentTab === "signals" ) {
            renderSetupChecklist();
        }

        // ... resto del código
    } catch ( error ) {
        console.error( "Error en renderAllData:", error );
        updateSyncStatus( "Error actualizando datos", false );
    }
}

//Mejorar la función deleteCapitalMovement con forzado de re-render
function deleteCapitalMovement( movementId, type ) {
    if ( !confirm( '¿Eliminar este movimiento? Esta acción no se puede deshacer.' ) ) return;

    try {
        if ( type === 'deposit' ) {
            const movement = capitalAdditions.find( d => d.id === movementId );
            if ( movement ) {
                currentCapital -= parseFloat( movement.amount );
                capitalAdditions = capitalAdditions.filter( d => d.id !== movementId );
            }
        } else if ( type === 'withdrawal' ) {
            const movement = withdrawals.find( w => w.id === movementId );
            if ( movement ) {
                currentCapital += parseFloat( movement.amount );
                withdrawals = withdrawals.filter( w => w.id !== movementId );
            }
        }

        // Guardar cambios y sincronizar
        saveDataLocally();
        if ( currentUser ) syncDataToFirebase();

        // 🔁 Re-render completo para asegurar sincronización visual
        renderCapitalMovementsTable();
        renderRecentWithdrawals();
        renderDashboard();
        updateCapitalBreakdown();

        // ✅ Forzar contador a actualizar (por si hay retardo visual)
        const countElement = document.getElementById( 'totalMovementsCount' );
        if ( countElement ) {
            const total = capitalAdditions.length + withdrawals.length;
            countElement.textContent = total.toString();
        }

        if ( window.updateAllCharts ) {
            setTimeout( () => window.updateAllCharts(), 100 );
        }

        updateSyncStatus( 'Movimiento eliminado correctamente', true );
    } catch ( error ) {
        console.error( 'Error eliminando movimiento:', error );
        updateSyncStatus( 'Error al eliminar movimiento', false );
        alert( 'Ocurrió un error al eliminar el movimiento. Por favor, intenta nuevamente.' );
    }
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
    updateStrategyDisplay();

    // Renderizar checklist
    renderDynamicChecklist( strategy );

    // Mostrar template de la estrategia
    displayStrategyTemplate( strategy );

    // Actualizar score inicial
    updateDynamicSetupScore();

    // Restaurar estado si existe
    restoreSetupState();
}

function updateStrategyDisplay() {
    // Detectar cual dropdown usar según el tab visible
    const capitalSection = document.getElementById( 'capital' );
    const signalsSection = document.getElementById( 'signals' );

    const isCapitalVisible = capitalSection && !capitalSection.classList.contains( 'hidden' );
    const isSignalsVisible = signalsSection && !signalsSection.classList.contains( 'hidden' );

    let selectedStrategy = 'regulares';

    // Obtener estrategia del dropdown correspondiente
    if ( isCapitalVisible ) {
        selectedStrategy = document.getElementById( 'strategySelect' )?.value || 'regulares';
    }
    if ( isSignalsVisible ) {
        selectedStrategy = document.getElementById( 'signalStrategySelect' )?.value || 'regulares';
    }

    const config = strategyConfigs[ selectedStrategy ];
    if ( !config ) {
        console.warn( "Configuración no encontrada para:", selectedStrategy );
        return;
    }

    const effectiveCapital = calculateEffectiveCapital();

    console.log( 'updateStrategyDisplay:', {
        selectedStrategy,
        isCapitalVisible,
        isSignalsVisible,
        effectiveCapital,
        config: config.riskPercent
    } );

    // ===== ACTUALIZAR SECCIÓN SIGNALS =====
    if ( isSignalsVisible ) {
        const signalsElements = {
            winRate: document.getElementById( 'strategyWinRateQuick' ),
            rrRatio: document.getElementById( 'strategyRRQuick' ),
            riskPercent: document.getElementById( 'strategyRiskQuick' ),
            optimalContracts: document.getElementById( 'optimalContractsQuick' ) // ← ID CORRECTO
        };

        // Actualizar info básica
        if ( signalsElements.winRate ) signalsElements.winRate.textContent = `${config.winRate}%`;
        if ( signalsElements.rrRatio ) signalsElements.rrRatio.textContent = `${config.rrRatio}:1`;
        if ( signalsElements.riskPercent ) signalsElements.riskPercent.textContent = `${config.riskPercent}%`;

        // Calcular contratos
        const maxRiskPerTrade = effectiveCapital * ( config.riskPercent / 100 );
        const optimalContracts = effectiveCapital > 0 ? Math.max( 1, Math.floor( maxRiskPerTrade / config.stopLoss ) ) : 0;

        if ( signalsElements.optimalContracts ) {
            signalsElements.optimalContracts.textContent = optimalContracts;
            // Color según resultado
            if ( optimalContracts === 0 ) {
                signalsElements.optimalContracts.className = 'text-lg font-bold text-red-400';
            } else {
                signalsElements.optimalContracts.className = 'text-lg font-bold text-gold';
            }
        }

        console.log( 'Signals updated:', {
            optimalContracts,
            maxRiskPerTrade: maxRiskPerTrade.toFixed( 2 )
        } );
    }

    // ===== ACTUALIZAR SECCIÓN CAPITAL =====
    if ( isCapitalVisible ) {
        const capitalElements = {
            winRate: document.getElementById( 'strategyWinRate' ),
            rrRatio: document.getElementById( 'strategyRR' ),
            riskPercent: document.getElementById( 'strategyRiskPercent' ),
            maxRiskPerTrade: document.getElementById( 'maxRiskPerTrade' ),
            optimalContracts: document.getElementById( 'optimalContracts' ), // ID único en capital
            suggestedSL: document.getElementById( 'suggestedSL' ),
            takeProfit1: document.getElementById( 'takeProfit1' ),
            takeProfit2: document.getElementById( 'takeProfit2' )
        };

        // Actualizar info básica
        if ( capitalElements.winRate ) capitalElements.winRate.textContent = `${config.winRate}%`;
        if ( capitalElements.rrRatio ) capitalElements.rrRatio.textContent = `${config.rrRatio}:1`;
        if ( capitalElements.riskPercent ) capitalElements.riskPercent.textContent = `${config.riskPercent}%`;

        // Calcular parámetros
        const maxRiskPerTrade = effectiveCapital * ( config.riskPercent / 100 );
        const optimalContracts = effectiveCapital > 0 ? Math.max( 1, Math.floor( maxRiskPerTrade / config.stopLoss ) ) : 0;

        if ( capitalElements.maxRiskPerTrade ) capitalElements.maxRiskPerTrade.textContent = `$${maxRiskPerTrade.toFixed( 2 )}`;
        if ( capitalElements.optimalContracts ) {
            capitalElements.optimalContracts.textContent = optimalContracts;
            if ( optimalContracts === 0 ) {
                capitalElements.optimalContracts.className = 'text-lg font-bold text-red-400';
            } else {
                capitalElements.optimalContracts.className = 'text-lg font-bold';
            }
        }
        if ( capitalElements.suggestedSL ) capitalElements.suggestedSL.textContent = `${config.stopLoss} pips`;
        if ( capitalElements.takeProfit1 ) capitalElements.takeProfit1.textContent = `${config.takeProfit1} pips`;
        if ( capitalElements.takeProfit2 ) capitalElements.takeProfit2.textContent = `${config.takeProfit2} pips`;

        console.log( 'Capital updated:', {
            optimalContracts,
            maxRiskPerTrade: maxRiskPerTrade.toFixed( 2 )
        } );
    }
}

// ===== INICIALIZACIÓN MEJORADA =====
function initializeStrategyCalculator() {
    console.log( 'Inicializando calculadora de estrategia...' );

    // Event listener para dropdown de Capital
    const capitalStrategySelect = document.getElementById( 'strategySelect' );
    if ( capitalStrategySelect ) {
        capitalStrategySelect.addEventListener( 'change', function () {
            console.log( "Capital strategy changed to:", this.value );
            updateStrategyDisplay();
        } );
        console.log( 'Listener agregado al dropdown de Capital' );
    }

    // Event listener para dropdown de Signals  
    const signalsStrategySelect = document.getElementById( 'signalStrategySelect' );
    if ( signalsStrategySelect ) {
        signalsStrategySelect.addEventListener( 'change', function () {
            console.log( "Signals strategy changed to:", this.value );
            updateStrategyDisplay();
        } );
        console.log( 'Listener agregado al dropdown de Signals' );
    }

    // Verificar capital actual
    console.log( 'Capital efectivo actual:', calculateEffectiveCapital() );

    // Cargar valores iniciales
    updateStrategyDisplay();
}


function displayStrategyTemplate( strategy ) {
    const container = document.getElementById( "strategyTemplateDisplay" );
    if ( !container ) return;

    // Limpiar contenido anterior
    container.innerHTML = "";

    // Obtener template
    const templateId = `template-${strategy}`;
    const templateElement = document.getElementById( templateId );

    if ( templateElement ) {
        // Clonar y mostrar template
        const templateClone = templateElement.cloneNode( true );
        templateClone.classList.remove( "strategy-template", "hidden" );
        templateClone.id = `active-${templateId}`;

        // Aplicar estilos para el contenedor más pequeño
        templateClone.classList.add( "text-sm" );

        // Ajustar grid para espacios más pequeños
        const grids = templateClone.querySelectorAll( ".grid" );
        grids.forEach( ( grid ) => {
            if ( grid.classList.contains( "md:grid-cols-2" ) ) {
                grid.classList.remove( "md:grid-cols-2" );
                grid.classList.add( "grid-cols-1" );
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
                    <h4 class="text-lg font-semibold text-white">✅ ${config?.name || "Setup"} Verification</h4>
                    <p class="text-xs text-gray-400 mt-1">📊 ${config?.timeframes || "Multiple TF"}</p>
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
                ${checklist
            .map(
                ( item, index ) => `
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
                `
            )
            .join( "" )}
            </div>

            <div class="mt-4 p-3 bg-gray-800/30 rounded-lg border-l-4 border-gold/50">
                <p class="text-xs text-gray-400">
                    💡 <strong>Tip:</strong> Para ${config?.name || "esta estrategia"}, 
                    necesitas al menos 70% de los factores para ejecutar con seguridad.
                </p>
            </div>
        </div>
    `;

    container.innerHTML = checklistHTML;
}

// Función actualizada para el listener del selector de estrategia
function setupImprovedStrategyListeners() {
    const strategySelector = document.getElementById( "signalStrategySelect" );

    if ( strategySelector ) {
        let debounceTimer;

        strategySelector.addEventListener( "change", function () {
            clearTimeout( debounceTimer );
            debounceTimer = setTimeout( () => {
                console.log( "Strategy changed to:", this.value );
                renderSetupChecklist();
            }, 200 );
        } );
    }
}

// Función para actualizar solo el display del score
function updateScoreDisplay() {
    // Buscar elementos existentes del score
    let scoreSection = document.getElementById( "setupScore" );

    // Si no existe, buscar en el HTML fijo
    if ( !scoreSection ) {
        scoreSection = document.querySelector(
            '[role="progressbar"]'
        )?.parentElement;
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
            container.insertAdjacentHTML( "beforeend", scoreHTML );
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

    const checkedCount = Array.from( checkboxes ).filter( ( cb ) => cb.checked ).length;
    const totalCount = checkboxes.length;
    const score = Math.round( ( checkedCount / totalCount ) * 100 );

    // Obtener estrategia actual
    const strategySelector = document.getElementById( "signalStrategySelect" );
    const currentStrategy = strategySelector?.value || "regulares";
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
            scoreClass = "text-3xl font-bold text-green-400 mb-2";
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
    const executeButtons = document.querySelectorAll(
        '#executeSetupBtn, [data-action="execute"]'
    );
    executeButtons.forEach( ( btn ) => {
        const isEnabled = score >= 70;
        btn.disabled = !isEnabled;

        if ( isEnabled ) {
            btn.className =
                "flex-1 bg-green-600 hover:bg-green-500 px-2 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg";
            btn.innerHTML = `
                <span class="flex items-center justify-center space-x-2">
                    <span>✅ Ejecutar (${score}%)</span>
                </span>
            `;
        } else {
            btn.className =
                "flex-1 bg-gray-600 px-3 py-2 rounded-lg font-medium cursor-not-allowed opacity-75";
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
            feedbackText = `🎯 ${config?.name || "Setup"} excepcional - Ejecutar inmediatamente`;
            feedbackClass = "text-green-400 font-bold animate-pulse";
        } else if ( score >= 85 ) {
            feedbackText = `✅ ${config?.name || "Setup"} sólido - Alta probabilidad R:R ${config?.rrRatio || "2.2"}:1`;
            feedbackClass = "text-green-400 font-semibold";
        } else if ( score >= 70 ) {
            feedbackText = `⚠️ ${config?.name || "Setup"} aceptable - Proceder maximo con SL ${config?.stopLoss || "5"} pips`;
            feedbackClass = "text-yellow-400 font-medium";
        } else if ( score >= 50 ) {
            feedbackText = `⚡ Setup débil para ${config?.name || "esta estrategia"} - Esperar más confluencias`;
            feedbackClass = "text-orange-400";
        } else if ( score === 0 ) {
            feedbackText = `❌ Solo ingresar si cumple + 70% de señales`;
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
                    📈 TF: ${config?.timeframes || "Multiple"} | 
                    💰 Riesgo: ${config?.riskPercent || "2.5"}%
                </p>
            </div>
        `;
        feedbackElement.classList.remove( "hidden" );
    }

    // Auto-save del estado
    saveSetupState();

    console.log(
        `${config?.name || "Setup"} Score: ${score}% (${checkedCount}/${totalCount})`
    );
}

// Funciones auxiliares para estado del setup
function saveSetupState() {
    const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );
    const state = Array.from( checkboxes ).map( ( cb ) => cb.checked );
    const strategy =
        document.getElementById( "signalStrategySelect" )?.value ||
        document.getElementById( "setupStrategy" )?.value ||
        "regulares";

    const setupState = {
        strategy: strategy,
        checkboxes: state,
        timestamp: Date.now(),
    };

    localStorage.setItem( "trading_setupState", JSON.stringify( setupState ) );
}

function restoreSetupState() {
    try {
        const savedState = localStorage.getItem( "trading_setupState" );
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
        console.warn( "Error restaurando estado del setup:", error );
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
        const feedbackEl = document.getElementById( "setupFeedback" );
        if ( feedbackEl ) {
            feedbackEl.innerHTML = `
                <p class="text-red-400 font-medium animate-bounce">
                    ⚠️ Score insuficiente: ${score}%. Mínimo requerido: 70%
                </p>
            `;
            feedbackEl.classList.remove( "hidden" );

            // Auto-hide después de 3 segundos
            setTimeout( () => {
                feedbackEl.classList.add( "hidden" );
            }, 3000 );
        }
    }
}

// Función mejorada para reset que funciona con botones existentes
function resetSetupChecker() {
    // Desmarcar todos los checkboxes dinámicos
    const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );

    checkboxes.forEach( ( cb ) => {
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
    localStorage.removeItem( "trading_setupState" );

    updateSyncStatus( "Setup checker reiniciado", true );
}

// Función para prellenar formulario de trade basado en estrategia
function fillTradeFormFromStrategy( strategy ) {
    const config = strategyConfigs[ strategy ] || strategyConfigs.regulares;
    const today = new Date().toISOString().split( "T" )[ 0 ];
    const effectiveCapital = calculateEffectiveCapital();
    const optimalContracts = calculateOptimalContractsWithEffectiveCapital( strategy );

    const fields = {
        tradeDate: today,
        tradeStrategy: strategy,
        tradeContracts: Math.max( 1, optimalContracts ).toString(),
        tradeSL: config.stopLoss.toString(),
        tradeTP: config.takeProfit1.toString(),
    };

    Object.entries( fields ).forEach( ( [ id, value ] ) => {
        const element = document.getElementById( id );
        if ( element ) element.value = value;
    } );

    const commentsField = document.getElementById( "tradeComments" );
    if ( commentsField ) {
        commentsField.value = `Setup ${config.name} validado con score alto. Capital efectivo: $${effectiveCapital.toFixed( 2 )}. SL: ${config.stopLoss} pips, TP1: ${config.takeProfit1} pips`;
    }
}

// Función para alternar todos los checkboxes
function toggleAllCheckboxes( checked = true ) {
    const checkboxes = document.querySelectorAll(
        '#setupCheckerContent input[type="checkbox"], #setupChecklist input[type="checkbox"], input[id^="dynamic_check_"]'
    );

    checkboxes.forEach( ( cb ) => {
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

// ===== FUNCIONES DE INTERFAZ =====
function switchTab( tabName ) {
    console.log( `Cambiando a tab: ${tabName}` );

    // Ocultar TODOS los tabs primero
    document.querySelectorAll( ".tab-content" ).forEach( ( tab ) => {
        tab.classList.add( "hidden" );
        // Asegurar que no haya estilos inline residuales
        tab.style.display = '';
        tab.style.transform = '';
        tab.style.opacity = '';
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

    if ( tabName === "trade-management" ) {
        updateLevelsLastUpdate();
    }

    // Actualizar estrategia después de cambiar tab
    setTimeout( () => {
        updateStrategyDisplay();
    }, 100 );
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
    const entryPrice = parseFloat( document.getElementById( "entryPrice" )?.value || 0 );
    const exitPrice = parseFloat( document.getElementById( "exitPrice" )?.value || 0 );
    const contracts = parseInt( document.getElementById( "tradeContracts" )?.value || 1 );
    const direction = document.getElementById( "tradeDirection" )?.value;

    const calculatedPnLEl = document.getElementById( "calculatedPnL" );
    if ( !calculatedPnLEl ) return;

    // Si no hay precio de salida o es 0, mostrar 0
    if ( !exitPrice || exitPrice === 0 ) {
        calculatedPnLEl.textContent = "$0.00";
        calculatedPnLEl.className = "font-bold text-gray-400";
        return;
    }

    // Si falta algún dato esencial, mostrar 0
    if ( !entryPrice || !contracts || !direction ) {
        calculatedPnLEl.textContent = "$0.00";
        calculatedPnLEl.className = "font-bold text-gray-400";
        return;
    }

    // Calcular P&L usando la función existente
    const result = calculateTradeResult( entryPrice, exitPrice, direction, contracts );

    calculatedPnLEl.textContent = `$${result.pnl.toFixed( 2 )}`;
    calculatedPnLEl.className = `font-bold ${result.pnl >= 0 ? "text-green-400" : "text-red-400"}`;
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
    document.getElementById( "editTradeSymbol" ).value = trade.symbol || 'XAUUSD'; // NUEVO
    document.getElementById( "editTradeDirection" ).value = trade.direction;
    document.getElementById( "editTradeContracts" ).value = trade.contracts;
    document.getElementById( "editOpenPrice" ).value = trade.openPrice || "";
    document.getElementById( "editClosePrice" ).value = trade.closePrice || "";
    document.getElementById( "editTradeSL" ).value = trade.sl;
    document.getElementById( "editTradeTP" ).value = trade.tp;
    document.getElementById( "editTradeComments" ).value = trade.comments || "";

    showModal( "editTradeModal" );

    setTimeout( () => {
        addRealTimeValidationsToEditModal();
    }, 100 );
}

function addRealTimeValidations() {
    const slInput = document.getElementById( "tradeSL" );
    const tpInput = document.getElementById( "tradeTP" );
    const contractsInput = document.getElementById( "tradeContracts" );

    if ( slInput?.hasAttribute( "data-validation-active" ) ) return;

    function validateForm() {
        const sl = parseFloat( slInput?.value || 0 );
        const tp = parseFloat( tpInput?.value || 0 );
        const contracts = parseInt( contractsInput?.value || 0 );

        const capital = calculateEffectiveCapital();
        const riskAmount = contracts * sl;
        const maxRisk = capital * 0.05;

        let status = { type: "", message: "" };

        // 🔸 Validaciones críticas
        checkAndResetDailyCounters();
        if ( dailyTradesExecuted >= 3 ) {
            status = { type: "error", message: "🚫 Límite diario: 3 trades máximo" };
        } else if ( calculateDailyPnL() <= -maxRisk ) {
            status = { type: "error", message: "🚫 Pérdida diaria máxima alcanzada" };
        } else if ( capital <= 0 ) {
            status = { type: "error", message: "Capital insuficiente. Agrega fondos primero" };
        } else if ( contracts <= 0 ) {
            status = { type: "error", message: "Contratos debe ser mayor a 0" };
        } else if ( riskAmount > maxRisk && capital > 0 ) {
            status = {
                type: "error",
                message: `Riesgo: $${riskAmount.toFixed( 2 )} excede máximo $${maxRisk.toFixed( 2 )}`
            };
        }
        // ⚠️ Validación de ratio 1:1
        else if ( tp > 0 && sl > 0 && tp < sl ) {
            status = {
                type: "warning",
                message: `Ratio TP:SL = ${( tp / sl ).toFixed( 2 )}:1 (mínimo recomendado 1:1)`
            };
        }
        // ✅ Todo correcto
        else if ( tp > 0 && sl > 0 ) {
            status = {
                type: "success",
                message: `Ratio ${( tp / sl ).toFixed( 2 )}:1 | Riesgo $${riskAmount.toFixed( 2 )} de $${capital.toFixed( 2 )}`
            };
        }

        // 🧱 Renderizar mensaje visual
        let container = document.getElementById( "tradeValidationAlert" );
        if ( !container ) {
            container = document.createElement( "div" );
            container.id = "tradeValidationAlert";
            container.className = "mb-3";

            const slContainer = slInput?.closest( ".space-y-4" ) || slInput?.parentElement;
            if ( slContainer ) slContainer.prepend( container );
        }

        const messages = {
            error: {
                bg: "bg-red-900/30",
                border: "border-red-500",
                text: "text-red-200",
                icon: "⚠️",
            },
            warning: {
                bg: "bg-yellow-900/30",
                border: "border-yellow-500",
                text: "text-yellow-200",
                icon: "⚡",
            },
            success: {
                bg: "bg-green-900/30",
                border: "border-green-500",
                text: "text-green-200",
                icon: "✓",
            },
        };

        if ( status.type ) {
            const m = messages[ status.type ];
            container.innerHTML = `
                <div class="${m.bg} ${m.border} rounded-lg p-2.5 flex items-center justify-center gap-2 border">
                    <span class="text-lg flex-shrink-0">${m.icon}</span>
                    <span class="${m.text} text-sm font-medium">${status.message}</span>
                </div>
            `;
        } else {
            container.innerHTML = "";
        }

        // 🟢 Control del botón submit
        const submitBtn = document.querySelector( '#tradeModal button[type="submit"]' );
        if ( submitBtn ) {
            // Bloquear en error o warning
            const isBlocked = status.type === "error" || status.type === "warning";
            submitBtn.disabled = isBlocked;

            submitBtn.className = isBlocked
                ? "flex-1 bg-gray-600 cursor-not-allowed px-4 py-2 rounded-lg font-medium opacity-50 transition-colors"
                : "flex-1 bg-profit hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors";
        }
    }

    // 🎯 Activar validaciones en tiempo real
    [ slInput, tpInput, contractsInput ].forEach( ( input ) => {
        if ( input ) {
            input.removeEventListener( "input", validateForm );
            input.addEventListener( "input", validateForm );
            input.setAttribute( "data-validation-active", "true" );
        }
    } );

    setTimeout( validateForm, 100 );
}


// Validaciones para modal de edición (versión simplificada)
function addRealTimeValidationsToEditModal() {
    const slInput = document.getElementById( "editTradeSL" );
    const tpInput = document.getElementById( "editTradeTP" );

    if ( !slInput || slInput.hasAttribute( "data-validation-active" ) ) return;

    function validateEditForm() {
        const sl = parseFloat( slInput?.value || 0 );
        const tp = parseFloat( tpInput?.value || 0 );

        let container = document.getElementById( "editTradeValidationAlert" );

        if ( !container ) {
            container = document.createElement( "div" );
            container.id = "editTradeValidationAlert";
            container.className = "mb-2";
            slInput?.parentElement?.parentElement?.insertBefore( container, slInput.parentElement );
        }

        if ( tp > 0 && sl > 0 ) {
            const ratio = ( tp / sl ).toFixed( 2 );
            const color = tp < sl ? 'yellow' : 'green';
            const icon = tp < sl ? '⚡' : '✓';

            container.innerHTML = `
                <div class="bg-${color}-900/30 border border-${color}-500 rounded p-2 flex items-center gap-2">
                    <span class="text-${color}-400">${icon}</span>
                    <span class="text-${color}-200 text-xs">Ratio ${ratio}:1${tp < sl ? ' (Bajo)' : ''}</span>
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    }

    [ slInput, tpInput ].forEach( input => {
        if ( input ) {
            input.addEventListener( "input", validateEditForm );
            input.setAttribute( "data-validation-active", "true" );
        }
    } );

    validateEditForm();
}

function updateTrade() {
    if ( !editingTradeId ) return;

    const updatedData = {
        date: document.getElementById( "editTradeDate" ).value,
        strategy: document.getElementById( "editTradeStrategy" ).value,
        symbol: document.getElementById( "editTradeSymbol" ).value.toUpperCase() || 'XAUUSD', // NUEVO
        direction: document.getElementById( "editTradeDirection" ).value,
        contracts: parseInt( document.getElementById( "editTradeContracts" ).value ),
        sl: parseFloat( document.getElementById( "editTradeSL" ).value ),
        tp: parseFloat( document.getElementById( "editTradeTP" ).value ),
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
    const executeButtons = [ "executeSetupBtn", "executeTradeBtn" ];
    executeButtons.forEach( ( btnId ) => {
        const btn = document.getElementById( btnId );
        if ( btn ) {
            btn.addEventListener( "click", function ( e ) {
                e.preventDefault();

                const scoreElement = document.getElementById( "scoreValue" );
                const score = scoreElement ? parseInt( scoreElement.textContent ) : 0;

                if ( score >= 70 ) {
                    executeValidatedSetup();
                } else {
                    // Feedback visual mejorado
                    const feedbackEl = document.getElementById( "setupFeedback" );
                    if ( feedbackEl ) {
                        feedbackEl.innerHTML = `
                            <p class="text-red-400 font-medium animate-bounce">
                                ⚠️ Score insuficiente: ${score}%. Mínimo requerido: 70%
                            </p>
                        `;
                        feedbackEl.classList.remove( "hidden" );

                        // Auto-hide después de 3 segundos
                        setTimeout( () => {
                            feedbackEl.classList.add( "hidden" );
                        }, 3000 );
                    }
                }
            } );
        }
    } );

    // Reset setup
    const resetButtons = [ "discardSetupBtn", "resetSetupBtn", "clearSetupBtn" ];
    resetButtons.forEach( ( btnId ) => {
        const btn = document.getElementById( btnId );
        if ( btn ) {
            btn.addEventListener( "click", function ( e ) {
                e.preventDefault();
                resetSetupChecker();
            } );
        }
    } );

    // Utilidades adicionales
    const utilityButtons = [
        { id: "selectAllBtn", action: () => toggleAllCheckboxes( true ) },
        { id: "clearAllBtn", action: () => toggleAllCheckboxes( false ) },
    ];

    utilityButtons.forEach( ( { id, action } ) => {
        const btn = document.getElementById( id );
        if ( btn ) {
            btn.addEventListener( "click", action );
        }
    } );
}

function initializeAllListeners() {
    setupImprovedStrategyListeners();
    setupButtonListeners();

    // Auto-save cada 30s
    setInterval( () => {
        const checkboxes = document.querySelectorAll( 'input[id^="dynamic_check_"]' );
        if ( checkboxes.length > 0 ) {
            saveSetupState();
        }
    }, 30000 );

    console.log( "Todos los listeners inicializados" );
}

function checkAuthModalDisplay() {
    if (
        !currentUser &&
        !isInitializing &&
        !hasShownAuthModal &&
        !getCookie( "hideAuthModal" )
    ) {
        // Verificar si hay datos locales significativos
        const hasLocalData =
            trades.length > 0 || observations.length > 0 || currentCapital > 0;

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

// ===== SISTEMA DE GESTIÓN DE RIESGO ESTRICTO =====
// Variables globales adicionales para gestión de riesgo
let dailyTradesExecuted = 0;
let dailyPnLAccumulated = 0;
let dailyLossLimitReached = false;
let tradingBlocked = false;
let lastResetDate = new Date().toDateString();
let updatingRisk = false; // Flag anti-recursión

// Configuración de límites de riesgo
const RISK_LIMITS = {
    MAX_DAILY_TRADES: 3,
    MAX_DAILY_LOSS_PERCENT: 5, // 5% del capital efectivo
    MIN_SETUP_SCORE: 70,
    MAX_SL_PERCENT: 5, // SL no debe superar 5% del capital
};

// Mensajes disciplinarios contextuales
const DISCIPLINARY_MESSAGES = {
    SL_NEAR_LIMIT:
        "⚠️ Solo tienes UNA oportunidad más. Opera con máxima probabilidad",
    LIMIT_REACHED: "🚫 Límite alcanzado. No operar hasta mañana",
    GOOD_TRADER:
        "✅ Buen trader. Opera con prudencia, busca márgenes pequeños en 2da operación",
    EXCELLENT_DAY: "🏆 EXCELENTE. Cierra la caja hasta mañana",
    RECOVERED:
        "✅ Sin problema. Descansa, analiza el fallo. Puedes intentar nuevamente con ratio 1:1",
    TIE_GAME: "⚖️ Empate. Respira y solo entra si es claro el panorama",
    ALERT_SEQUENCE: "🚨 ALERTA: Cierra el día. No operar hasta nuevo análisis",
    CAUTION_SEQUENCE:
        "⚠️ Respira. Solo entra si cumple TODAS las señales para ratio 1:1 a 1:2",
};

// ===== FUNCIONES DE VALIDACIÓN DE RIESGO =====
/**
Resetea contadores diarios si es un nuevo día
 */
function checkAndResetDailyCounters() {
    const today = new Date().toDateString();
    if ( lastResetDate !== today ) {
        dailyTradesExecuted = 0;
        dailyPnLAccumulated = 0;
        dailyLossLimitReached = false;
        tradingBlocked = false;
        lastResetDate = today;
        updateSyncStatus( "Contadores diarios reseteados", true );
    }
}

function renderAllData() {
    try {
        updateDailyCountersFromTrades();
        renderDashboard();
        renderCapitalSection();
        renderTrades();
        renderObservations();
        renderRecentWithdrawals();
        renderCapitalMovementsTable();
        updateCapitalBreakdown();
        updateStrategyDisplay();

        if ( currentTab === "signals" ) {
            renderSetupChecklist();
        }

        // AGREGAR ESTAS LÍNEAS
        if ( currentTab === "dashboard" ) {
            setTimeout( () => {
                if ( window.updateAllCharts ) {
                    window.updateAllCharts();
                }
                if ( window.updateCapitalMovementsList ) {
                    window.updateCapitalMovementsList();
                }
            }, 100 );
        }

        const disciplinaryMsg = generateDisciplinaryMessage();
        if ( disciplinaryMsg && ( disciplinaryMsg.priority === 'high' || disciplinaryMsg.priority === 'critical' ) ) {
            setTimeout( () => showDisciplinaryMessage( disciplinaryMsg ), 500 );
        }

    } catch ( error ) {
        console.error( "Error en renderAllData:", error );
        updateSyncStatus( "Error actualizando datos", false );
    }
}

function validateTradeExecution( tradeData ) {
    checkAndResetDailyCounters();

    const effectiveCapital = calculateEffectiveCapital();
    const maxDailyLoss =
        effectiveCapital * ( RISK_LIMITS.MAX_DAILY_LOSS_PERCENT / 100 );
    const potentialSLLoss =
        parseFloat( tradeData.contracts ) * parseFloat( tradeData.sl );

    const validations = {
        tradesLimit: {
            valid: dailyTradesExecuted < RISK_LIMITS.MAX_DAILY_TRADES,
            message: `Ya ejecutaste ${dailyTradesExecuted}/${RISK_LIMITS.MAX_DAILY_TRADES} trades hoy`,
        },
        dailyLossLimit: {
            valid: !dailyLossLimitReached,
            message: "Límite de pérdida diaria alcanzado (5%)",
        },
        slRiskLimit: {
            valid: potentialSLLoss <= effectiveCapital * 0.05,
            message: "Reduce contratos o ajusta stop loss - SL excede 5% del capital",
        },
        tradingBlocked: {
            valid: !tradingBlocked,
            message: "Trading bloqueado por límites de riesgo",
        },
    };

    const failedValidations = Object.entries( validations ).filter(
        ( [ key, validation ] ) => !validation.valid
    );

    if ( failedValidations.length > 0 ) {
        return {
            valid: false,
            errors: failedValidations.map( ( [ key, validation ] ) => validation.message ),
        };
    }

    return { valid: true, errors: [] };
}

/**
 * Valida ratio Take Profit vs Stop Loss
 */
function validateTPSLRatio( sl, tp ) {
    const ratio = tp / sl;

    if ( ratio < 1 ) {
        return {
            valid: false,
            message: "Busca mínimo ratio 1:1 - TP debe ser igual o mayor al SL",
            warning: true,
        };
    }

    return { valid: true, message: `Ratio ${ratio.toFixed( 1 )}:1 - Aceptable` };
}

/**
 * Calcula contratos óptimos considerando riesgo
 */
function calculateOptimalContractsWithRisk( strategy, riskPercent = null ) {
    const config = strategyConfigs[ strategy ] || strategyConfigs.regulares;
    const effectiveCapital = calculateEffectiveCapital();

    const risk = riskPercent || config.riskPercent || 3.0;
    const riskAmount = ( effectiveCapital * risk ) / 100;
    const stopLossPips = config.stopLoss || 6;

    const contracts = Math.floor( riskAmount / stopLossPips );

    return {
        contracts: Math.max( 1, contracts ),
        riskAmount: riskAmount,
        maxCapitalRisk: effectiveCapital * 0.05, // 5% máximo
        riskPercent: risk,
    };
}

// ===== SISTEMA DE MENSAJES DISCIPLINARIOS =====
function generateDisciplinaryMessage() {
    try {
        // Actualizar contadores antes de generar mensaje
        updateDailyCountersFromTrades();

        const today = new Date().toISOString().split( "T" )[ 0 ];
        const todayTrades = trades.filter( trade => trade.date === today && trade.closed );

        // Sin trades hoy
        if ( todayTrades.length === 0 ) return null;

        const effectiveCapital = calculateEffectiveCapital();
        if ( effectiveCapital <= 0 ) {
            console.warn( "Capital efectivo inválido para mensaje disciplinario" );
            return null;
        }

        const dailyPnL = todayTrades.reduce( ( sum, t ) => sum + parseFloat( t.pnl || 0 ), 0 );
        const dailyPnLPercent = ( dailyPnL / effectiveCapital ) * 100;

        const results = todayTrades.map( t => t.result ).filter( r => r );
        const wins = results.filter( r => r === "win" ).length;
        const losses = results.filter( r => r === "loss" ).length;

        console.log( `Generando mensaje: ${todayTrades.length} trades, P&L: ${dailyPnL.toFixed( 2 )} (${dailyPnLPercent.toFixed( 1 )}%), W:${wins} L:${losses}` );

        // Límite de pérdida alcanzado
        if ( dailyPnLPercent <= -5 ) {
            return {
                type: "blocked",
                message: "🚫 LÍMITE ALCANZADO. No operar hasta mañana. Capital efectivo protegido.",
                action: "block_trading",
                priority: "critical"
            };
        }

        // Cerca del límite de pérdida
        if ( dailyPnLPercent <= -4 ) {
            return {
                type: "critical",
                message: "⚠️ ALERTA CRÍTICA: Solo tienes UNA oportunidad más. Máxima probabilidad requerida.",
                action: "limit_warning",
                priority: "high"
            };
        }

        // Día muy positivo
        if ( dailyPnL >= 70 || dailyPnLPercent >= 8 ) {
            return {
                type: "excellent",
                message: "🏆 EXCELENTE día. Considera cerrar operaciones. Has cumplido el objetivo.",
                action: "stop_trading",
                priority: "success"
            };
        }

        // Buen día
        if ( dailyPnL >= 30 || wins >= 2 ) {
            return {
                type: "success",
                message: "✅ Buen progreso. Opera con menor riesgo en próximas operaciones.",
                action: "reduce_risk",
                priority: "medium"
            };
        }

        // Secuencias problemáticas
        if ( losses >= 2 ) {
            if ( todayTrades.length >= 3 ) {
                return {
                    type: "alert",
                    message: "🚨 STOP: Cierra el día. Analiza errores antes de continuar mañana.",
                    action: "stop_day",
                    priority: "high"
                };
            } else {
                return {
                    type: "caution",
                    message: "⚠️ Dos pérdidas. Solo entra con 85%+ de señales confirmadas.",
                    action: "strict_signals",
                    priority: "medium"
                };
            }
        }

        // Una sola pérdida
        if ( losses === 1 && wins === 0 ) {
            return {
                type: "caution",
                message: "⚠️ Primera pérdida del día. Mantén disciplina y busca setups de alta probabilidad.",
                action: "careful_continue",
                priority: "medium"
            };
        }

        // Recuperación después de pérdida
        if ( results.length >= 2 ) {
            const lastTwo = results.slice( -2 );
            if ( lastTwo[ 0 ] === "loss" && lastTwo[ 1 ] === "win" && dailyPnLPercent > -2 ) {
                return {
                    type: "recovery",
                    message: "✅ Recuperación exitosa. Mantén disciplina, evita sobre-tradear.",
                    action: "careful_continue",
                    priority: "low"
                };
            }
        }

        return null;

    } catch ( error ) {
        console.error( "Error en generateDisciplinaryMessage:", error );
        return null;
    }
}

function showDisciplinaryMessage( messageData ) {
    if ( !messageData || !messageData.message ) {
        console.warn( "Intento de mostrar mensaje disciplinario sin datos válidos" );
        return;
    }

    // Remover mensaje anterior si existe
    const existingMessage = document.getElementById( "disciplinaryMessages" );
    if ( existingMessage ) existingMessage.remove();

    const messageHTML = `
        <div id="disciplinaryMessages" class="fixed top-4 right-4 z-50 max-w-md">
            <div class="disciplinary-message bg-gradient-to-r ${getMessageStyles( messageData.type )} p-4 rounded-lg border-l-4 shadow-lg animate-slide-in">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="font-bold text-lg mb-2">${messageData.message}</div>
                        <div class="text-sm opacity-90">
                            Trades hoy: ${dailyTradesExecuted}/3 | P&L: ${dailyPnLAccumulated.toFixed( 2 )}
                        </div>
                        ${messageData.priority === 'critical' || messageData.priority === 'high' ?
            '<div class="text-xs mt-2 font-medium">⏰ Este mensaje permanecerá visible</div>' : ''}
                    </div>
                    <button onclick="closeDisciplinaryMessage()" 
                            class="text-white hover:text-gray-300 text-xl font-bold ml-3">×</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML( "beforeend", messageHTML );

    // Aplicar acción disciplinaria solo si existe
    if ( messageData.action ) {
        applyDisciplinaryAction( messageData.action );
    }

    // Auto-hide para mensajes no críticos
    if ( messageData.priority !== 'critical' && messageData.priority !== 'high' ) {
        setTimeout( () => {
            const msg = document.getElementById( "disciplinaryMessages" );
            if ( msg ) msg.remove();
        }, 8000 );
    }
}

function getMessageStyles( type ) {
    const styles = {
        critical: "from-red-800 to-red-900 border-red-500 text-red-100",
        blocked: "from-red-900 to-black border-red-600 text-red-100",
        success: "from-green-800 to-green-900 border-green-500 text-green-100",
        excellent:
            "from-yellow-800 to-yellow-900 border-yellow-500 text-yellow-100",
        recovery: "from-blue-800 to-blue-900 border-blue-500 text-blue-100",
        tie: "from-gray-800 to-gray-900 border-gray-500 text-gray-100",
        alert: "from-orange-800 to-orange-900 border-orange-500 text-orange-100",
        caution: "from-purple-800 to-purple-900 border-purple-500 text-purple-100",
    };
    return (
        styles[ type ] || "from-gray-800 to-gray-900 border-gray-500 text-gray-100"
    );
}

function applyDisciplinaryAction( action ) {
    const tradeButtons = document.querySelectorAll( "#addTradeBtn, #executeSetupBtn, .execute-trade-btn" );

    switch ( action ) {
        case "block_trading":
            tradingBlocked = true;
            tradeButtons.forEach( btn => {
                btn.disabled = true;
                btn.classList.add( "cursor-not-allowed", "opacity-50", "bg-red-600" );
                btn.innerHTML = "🚫 Trading Bloqueado Hoy";
            } );
            break;

        case "limit_warning":
            tradeButtons.forEach( btn => {
                btn.classList.add( "animate-pulse", "bg-red-600", "border-red-400" );
                btn.innerHTML = "⚠️ ÚLTIMA OPORTUNIDAD";
            } );
            updateSetupRequirements( 90 ); // Requerir 90% mínimo
            break;

        case "stop_trading":
        case "stop_day":
            tradeButtons.forEach( btn => {
                btn.disabled = true;
                btn.classList.add( "cursor-not-allowed", "opacity-75", "bg-yellow-600" );
                btn.innerHTML = action === "stop_trading" ? "🏆 Día Completado" : "🚨 Día Cerrado";
            } );
            break;

        case "reduce_risk":
            updateRiskCalculatorForReducedRisk();
            break;

        case "strict_signals":
            updateSetupRequirements( 85 );
            break;

        case "careful_continue":
            // Solo advertencia visual
            tradeButtons.forEach( btn => {
                btn.classList.add( "border-yellow-400" );
            } );
            break;
    }
}

function calculateDynamicRisk( strategy ) {
    const config = strategyConfigs[ strategy ] || strategyConfigs.regulares;
    const effectiveCapital = calculateEffectiveCapital();

    let recommendedRisk = config.riskMin || 2.5;
    let warningText = "";
    let warning = false;

    if ( dailyTradesExecuted >= 2 ) {
        recommendedRisk = Math.min( recommendedRisk, 2.0 );
        warningText = "Riesgo reducido: Ya tienes 2+ trades hoy";
        warning = true;
    }

    if ( dailyPnLAccumulated < 0 ) {
        recommendedRisk = Math.min( recommendedRisk, 2.5 );
        warningText = "Riesgo reducido: Día en negativo";
        warning = true;
    }

    const riskAmount = ( effectiveCapital * recommendedRisk ) / 100;
    const slPips = config.stopLoss || 6;
    const contracts = Math.floor( riskAmount / slPips );

    return {
        recommended: recommendedRisk,
        amount: riskAmount,
        contracts: Math.max( 1, contracts ),
        slPips: slPips,
        warning: warning,
        warningText: warningText,
    };
}
/**
 * Muestra modal de registro mejorado después de ejecutar setup
 */
function showEnhancedTradeModal( prefilledData = {} ) {
    const modal = document.getElementById( "tradeModal" );
    if ( !modal ) return;

    const today = new Date().toISOString().split( "T" )[ 0 ];
    const effectiveCapital = calculateEffectiveCapital();

    const fields = {
        tradeDate: prefilledData.date || today,
        tradeStrategy: prefilledData.strategy || "regulares",
        tradeContracts: prefilledData.contracts || "1",
        tradeSL: prefilledData.sl || "6",
        tradeTP: prefilledData.tp || "13",
    };

    Object.entries( fields ).forEach( ( [ id, value ] ) => {
        const element = document.getElementById( id );
        if ( element ) element.value = value;
    } );

    addRealTimeValidations();
    showModal( "tradeModal" );
}

// ===== INDICADORES VISUALES DE LÍMITES =====
function updateRiskIndicators() {
    try {
        // Verificar que existan los elementos antes de actualizarlos
        const riskIndicatorEl = document.getElementById( "riskIndicator" );
        const dailyPnLEl = document.getElementById( "dailyPnL" );

        // Calcular P&L total usando la función existente
        const totalPnL = calculateTotalPnL();
        const dailyPnLValue = calculateDailyPnL();
        const effectiveCapital = calculateEffectiveCapital();

        // Calcular porcentaje de riesgo solo si hay capital efectivo válido
        const riskPercent = effectiveCapital > 0 ? ( totalPnL / effectiveCapital ) * 100 : 0;

        // Actualizar indicador de riesgo solo si el elemento existe
        if ( riskIndicatorEl ) {
            riskIndicatorEl.textContent = `${riskPercent.toFixed( 2 )}%`;
            // Aplicar clase de color según el riesgo
            riskIndicatorEl.className = riskPercent >= 0 ? "text-green-400" : "text-red-400";
        }

        // Actualizar P&L diario solo si el elemento existe
        if ( dailyPnLEl ) {
            dailyPnLEl.textContent = `$${dailyPnLValue.toFixed( 2 )}`;
            dailyPnLEl.className = `text-lg sm:text-xl font-bold ${dailyPnLValue >= 0 ? "text-profit" : "text-loss"}`;
        }

        console.log( "Indicadores de riesgo actualizados correctamente" );

    } catch ( error ) {
        console.error( "Error en updateRiskIndicators:", error );
        // No fallar silenciosamente, pero tampoco romper la ejecución
    }
}

const originalExecuteValidatedSetup = executeValidatedSetup;

function executeValidatedSetupWithRisk() {
    checkAndResetDailyCounters();

    if ( tradingBlocked ) {
        alert( "🚫 Trading bloqueado por límites de riesgo diario" );
        return;
    }

    if ( dailyTradesExecuted >= RISK_LIMITS.MAX_DAILY_TRADES ) {
        alert(
            `⚠️ Límite diario alcanzado: ${dailyTradesExecuted}/${RISK_LIMITS.MAX_DAILY_TRADES} trades`
        );
        return;
    }

    const scoreElement = document.getElementById( "scoreValue" );
    const score = scoreElement ? parseInt( scoreElement.textContent ) : 0;

    if ( score < RISK_LIMITS.MIN_SETUP_SCORE ) {
        alert(
            `📊 Score insuficiente: ${score}%. Mínimo requerido: ${RISK_LIMITS.MIN_SETUP_SCORE}%`
        );
        return;
    }

    const strategySelector =
        document.getElementById( "signalStrategySelect" ) ||
        document.getElementById( "setupStrategy" );
    const strategy = strategySelector?.value || "regulares";

    const riskCalc = calculateDynamicRisk( strategy );

    const prefilledData = {
        strategy: strategy,
        contracts: riskCalc.contracts.toString(),
        sl: riskCalc.slPips.toString(),
        tp: ( strategyConfigs[ strategy ]?.takeProfit1 || 13 ).toString(),
        comments: `Setup ${strategyConfigs[ strategy ]?.name || strategy} validado (${score}%) - Riesgo ${riskCalc.recommended}%`,
    };

    showEnhancedTradeModal( prefilledData );
    setTimeout( () => resetSetupChecker(), 500 );
}

// ===== FUNCIONES AUXILIARES GLOBALES =====
function updateRiskCalculation( riskPercent ) {
    const effectiveCapital = calculateEffectiveCapital();
    const strategySelector =
        document.getElementById( "tradeStrategy" ) ||
        document.getElementById( "signalStrategySelect" );
    const strategy = strategySelector?.value || "regulares";
    const config = strategyConfigs[ strategy ] || strategyConfigs.regulares;

    const riskAmount = ( effectiveCapital * riskPercent ) / 100;
    const slPips = config.stopLoss || 6;
    const contracts = Math.floor( riskAmount / slPips );

    document.getElementById( "riskValue" ).textContent = `${riskPercent}%`;
    document.getElementById( "riskAmount" ).textContent =
        `${riskAmount.toFixed( 2 )}`;
    document.getElementById( "optimalContracts" ).textContent = contracts;

    const contractsInput = document.getElementById( "tradeContracts" );
    const slInput = document.getElementById( "tradeSL" );

    if ( contractsInput ) contractsInput.value = Math.max( 1, contracts );
    if ( slInput && !slInput.value ) slInput.value = slPips;

    const maxAllowedLoss = effectiveCapital * 0.05;
    const currentLoss = contracts * slPips;

    const warningEl = document.getElementById( "riskWarning" );
    if ( warningEl ) {
        if ( currentLoss > maxAllowedLoss ) {
            warningEl.textContent = `⚠️ Riesgo excede 5% del capital (${maxAllowedLoss.toFixed( 2 )})`;
            warningEl.classList.remove( "hidden" );
        } else {
            warningEl.classList.add( "hidden" );
        }
    }
}

function updateRiskCalculatorForReducedRisk() {
    const riskSlider = document.getElementById( "riskSlider" );
    if ( riskSlider ) {
        riskSlider.max = "3";
        riskSlider.value = "2";
        updateRiskCalculation( 2 );
    }
}

function updateSetupRequirements( minScore = 85 ) {
    const executeButtons = document.querySelectorAll(
        '#executeSetupBtn, [data-action="execute"]'
    );
    executeButtons.forEach( ( btn ) => {
        const scoreElement = document.getElementById( "scoreValue" );
        const currentScore = scoreElement ? parseInt( scoreElement.textContent ) : 0;

        const isEnabled = currentScore >= minScore;
        btn.disabled = !isEnabled;

        if ( !isEnabled ) {
            btn.innerHTML = `⚠️ Necesario ${minScore}%+ (${currentScore}%) - Modo Estricto`;
            btn.className =
                "flex-1 bg-red-600 px-3 py-2 rounded-lg font-medium cursor-not-allowed opacity-75";
        }
    } );
}

function closeDisciplinaryMessage() {
    const messageContainer = document.getElementById( "disciplinaryMessages" );
    if ( messageContainer ) messageContainer.remove();
}

function updateStrategyOptions() {
    const strategySelects = document.querySelectorAll( 'select[id*="Strategy"]' );
    strategySelects.forEach( ( select ) => {
        const extremosOption = select.querySelector( 'option[value="extremos"]' );
        if ( extremosOption ) extremosOption.remove();
    } );
}

function classifyTradeResult( pnl ) {
    const pnlNum = parseFloat( pnl );

    if ( pnlNum < 0 ) return { category: "MALO", color: "text-red-400" };
    if ( pnlNum >= 20 && pnlNum < 40 )
        return { category: "NORMAL", color: "text-yellow-400" };
    if ( pnlNum >= 40 && pnlNum < 70 )
        return { category: "BUENO", color: "text-green-400" };
    if ( pnlNum >= 70 && pnlNum < 90 )
        return { category: "MUY BUENO", color: "text-blue-400" };
    if ( pnlNum >= 90 ) return { category: "EXCELENTE", color: "text-gold" };

    return { category: "NORMAL", color: "text-gray-400" };
}

// Función mejorada para mostrar gestión de trades activos
function showClosureManagement() {
    const today = new Date().toISOString().split( "T" )[ 0 ];
    const yesterday = new Date();
    yesterday.setDate( yesterday.getDate() - 1 );
    const yesterdayStr = yesterday.toISOString().split( "T" )[ 0 ];

    const activeTrades = trades.filter( trade => {
        const isRecentDate = trade.date === today || trade.date === yesterdayStr;
        const isNotFullyClosed = !trade.closed || trade.status === 'Abierto' || ( trade.partials && trade.contracts > 0 );
        return isRecentDate && isNotFullyClosed;
    } );

    console.log( `Trades activos encontrados: ${activeTrades.length}` );
    console.log( 'Trades activos:', activeTrades.map( t => ( {
        id: t.id.substr( -6 ),
        status: t.status,
        closed: t.closed,
        date: t.date,
        totalContracts: t.totalContracts,
        contracts: t.contracts,
        pnl: t.pnl
    } ) ) );

    if ( activeTrades.length === 0 ) {
        alert( "No hay trades activos para gestionar" );
        return;
    }

    const modalHTML = `
        <div id="activeTradesModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-trading-card p-6 rounded-lg border border-gray-700 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold text-gold">⚡ Gestión de Trades Activos (${activeTrades.length})</h3>
                    <button onclick="closeActiveTradesModal()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div class="space-y-3" id="activeTradesList">
                    ${activeTrades.map( trade => {
        const strategyName = strategyConfigs[ trade.strategy ]?.name || trade.strategy;
        const currentPnL = parseFloat( trade.pnl ) || 0;
        const remainingContracts = trade.contracts || 0;

        return `
                            <div class="bg-gray-800 p-3 rounded-lg border border-gray-600" data-trade-id="${trade.id}">
                                <div class="grid grid-cols-1 lg:grid-cols-5 gap-3 items-center">
                                    <div class="lg:col-span-2">
                                        <div class="font-semibold text-white">${strategyName}</div>
                                        <div class="text-sm text-gray-400">
                                            ${trade.totalContracts} contratos totales • ${remainingContracts} restantes • 
                                            <span class="px-1 py-0.5 rounded text-xs ${trade.direction === 'buy' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}">
                                                ${trade.direction === 'buy' ? 'Compra' : 'Venta'}
                                            </span>
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">
                                            Entrada: $${trade.openPrice?.toFixed( 2 ) || 'N/A'} | SL: ${trade.sl || 'N/A'} pips | TP: ${trade.tp || 'N/A'} pips
                                        </div>
                                        <div class="text-xs mt-1">
                                            <span class="px-1 py-0.5 rounded bg-green-700 text-xs">
                                                ${trade.status} ${trade.tpLevel ? `(${trade.tpLevel})` : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-sm text-gray-400">P&L Actual</div>
                                        <div class="text-lg font-bold ${currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}">
                                            $${currentPnL.toFixed( 2 )}
                                        </div>
                                    </div>
                                    <div class="space-y-2">
                                        <button onclick="adjustStopLoss('${trade.id}')" 
                                                class="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm transition-colors">
                                            📈 Ajustar SL
                                        </button>
                                        <button onclick="partialTakeProfit('${trade.id}')" 
                                                class="w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm transition-colors ${remainingContracts <= 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                                                ${remainingContracts <= 0 ? 'disabled' : ''}>
                                            💰 TP Parcial
                                        </button>
                                    </div>
                                    <div class="space-y-2">
                                        <button onclick="manualClose('${trade.id}')" 
                                                class="w-full bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-sm transition-colors ${remainingContracts <= 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                                                ${remainingContracts <= 0 ? 'disabled' : ''}>
                                            🔒 Cerrar Manual
                                        </button>
                                        <button onclick="showTradeDetails('${trade.id}')" 
                                                class="w-full bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-sm transition-colors">
                                            👁️ Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
    } ).join( '' )}
                </div>
                
                <div class="flex justify-between items-center mt-4">
                    <div class="text-sm text-gray-400">
                        Total P&L Activo: $${activeTrades.reduce( ( sum, t ) => sum + ( parseFloat( t.pnl ) || 0 ), 0 ).toFixed( 2 )}
                    </div>
                    <button onclick="closeActiveTradesModal()" 
                            class="bg-gray-600 hover:bg-gray-700 px-4 py-1.5 rounded-lg font-medium">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML( "beforeend", modalHTML );
}

// Función para refrescar el modal después de una acción
function refreshClosureManagement() {
    const activeModal = document.getElementById( "activeTradesModal" );
    if ( activeModal ) {
        closeActiveTradesModal();
        setTimeout( showClosureManagement, 300 );  // Pequeño delay para evitar flickering
    }
}

function adjustStopLoss( tradeId ) {
    const trade = trades.find( t => t.id === tradeId );
    if ( !trade ) return;

    const effectiveCapital = calculateEffectiveCapital();
    const maxAllowedLoss = effectiveCapital * 0.05;

    const newSLInput = prompt(
        `Ajustar Stop Loss para ${trade.strategy}:\n` +
        `Actual: ${trade.sl} pips\n` +
        `Máximo permitido basado en riesgo 5%: $${maxAllowedLoss.toFixed( 2 )}\n\n` +
        `Nuevo SL (pips):`
    );

    if ( newSLInput ) {
        const newSL = parseFloat( newSLInput );

        if ( !isNaN( newSL ) && newSL > 0 ) {
            const potentialLoss = newSL * trade.contracts;

            if ( potentialLoss <= maxAllowedLoss ) {
                const success = editTrade( tradeId, { sl: newSL } );
                if ( success ) {
                    updateSyncStatus( "Stop Loss ajustado correctamente", true );
                    refreshClosureManagement();
                } else {
                    alert( "Error al ajustar Stop Loss" );
                }
            } else {
                alert(
                    `⚠️ El nuevo SL generaría una pérdida potencial de $${potentialLoss.toFixed( 2 )}, ` +
                    `que excede el límite de $${maxAllowedLoss.toFixed( 2 )} (5% del capital)`
                );
            }
        } else {
            alert( "❌ Debes ingresar un número válido mayor que 0." );
        }
    }
}

// Función mejorada para TP Parcial
function partialTakeProfit( tradeId ) {
    const trade = trades.find( t => t.id === tradeId );
    if ( !trade || trade.contracts <= 0 ) {
        alert( "No hay contratos disponibles para TP parcial" );
        return;
    }

    const modalHTML = `
        <div id="partialTPModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-trading-card p-6 rounded-lg border border-gray-700 w-full max-w-md mx-4">
                <h3 class="text-xl font-semibold text-gold mb-4">💰 Take Profit Parcial</h3>
                <div class="space-y-4">
                    <div class="bg-gray-800 p-3 rounded">
                        <div class="text-sm text-gray-400">Trade: ${strategyConfigs[ trade.strategy ]?.name}</div>
                        <div class="text-white">${trade.contracts} contratos restantes</div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Precio de Cierre TP1</label>
                        <input type="number" id="tp1Price" step="0.01" 
                               class="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white" 
                               placeholder="2465.50">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Contratos a Cerrar</label>
                        <input type="number" id="contractsToClose" min="1" max="${trade.contracts}" 
                               value="${Math.floor( trade.contracts / 2 )}"
                               class="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white">
                    </div>
                    <div class="space-y-2" id="tpActionSection">
                        <label class="flex items-center">
                            <input type="radio" name="tpAction" value="tp2" checked 
                                   class="mr-2 text-gold focus:ring-gold">
                            <span class="text-sm">Definir TP2 para contratos restantes</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="tpAction" value="close" 
                                   class="mr-2 text-gold focus:ring-gold">
                            <span class="text-sm">Cerrar todos los contratos</span>
                        </label>
                    </div>
                    <div id="tp2Section" class="space-y-2">
                        <label class="block text-sm font-medium">Nuevo TP2 (pips)</label>
                        <input type="number" id="newTP2" 
                               value="${strategyConfigs[ trade.strategy ]?.takeProfit2 || 24}"
                               class="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white">
                    </div>
                </div>
                <div class="flex space-x-4 mt-6">
                    <button id="executePartialBtn" onclick="executePartialTP('${tradeId}')" 
                            class="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium">
                        Ejecutar
                    </button>
                    <button onclick="closePartialTPModal()" 
                            class="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML( "beforeend", modalHTML );

    document.querySelectorAll( 'input[name="tpAction"]' ).forEach( radio => {
        radio.addEventListener( "change", function () {
            const executeBtn = document.getElementById( "executePartialBtn" );
            const tp2Section = document.getElementById( "tp2Section" );
            if ( executeBtn ) {
                executeBtn.textContent = this.value === "tp2" ? "Mantener TP2" : "Cerrar Todo";
            }
            if ( tp2Section ) {
                tp2Section.style.display = this.value === "tp2" ? "block" : "none";
            }
        } );
    } );

    const contractsCloseInput = document.getElementById( "contractsToClose" );
    contractsCloseInput.addEventListener( "input", function () {
        const contractsToClose = parseInt( this.value );
        const tpActionSection = document.getElementById( "tpActionSection" );
        const tp2Radio = document.querySelector( 'input[name="tpAction"][value="tp2"]' );
        const closeRadio = document.querySelector( 'input[name="tpAction"][value="close"]' );
        const executeBtn = document.getElementById( "executePartialBtn" );
        const tp2Section = document.getElementById( "tp2Section" );

        if ( contractsToClose === trade.contracts ) {
            closeRadio.checked = true;
            tp2Radio.disabled = true;
            closeRadio.disabled = true;
            tpActionSection.classList.add( "opacity-50" );
            executeBtn.textContent = "Cerrar Restantes";
            if ( tp2Section ) tp2Section.style.display = "none";
        } else {
            tp2Radio.disabled = false;
            closeRadio.disabled = false;
            tpActionSection.classList.remove( "opacity-50" );
            executeBtn.textContent = tp2Radio.checked ? "Mantener TP2" : "Cerrar Todo";
            if ( tp2Section ) tp2Section.style.display = tp2Radio.checked ? "block" : "none";
        }
        updateTPPreview();
    } );

    const tp1Input = document.getElementById( "tp1Price" );
    let previewEl = document.createElement( "div" );
    previewEl.id = "tpPreview";
    previewEl.className = "bg-gray-800 p-3 rounded-lg mt-2 text-center text-sm";
    tp1Input.parentElement.appendChild( previewEl );

    function updateTPPreview() {
        const tp1Price = parseFloat( tp1Input.value );
        const contractsToClose = parseInt( contractsCloseInput.value );
        if ( tp1Price > 0 && contractsToClose > 0 ) {
            const { pnl } = calculateTradeResult( trade.openPrice, tp1Price, trade.direction, contractsToClose );
            previewEl.innerHTML = `
                <span class="text-gray-400">P&L Parcial: </span>
                <span class="${pnl >= 0 ? 'text-green-400' : 'text-red-400'} font-bold">$${pnl.toFixed( 2 )}</span>
            `;
        } else {
            previewEl.innerHTML = "";
        }
    }

    tp1Input.addEventListener( "input", updateTPPreview );
    contractsCloseInput.addEventListener( "input", updateTPPreview );
}

function executePartialTP( tradeId ) {
    const trade = trades.find( t => t.id === tradeId );
    if ( !trade ) return;

    const tp1Price = parseFloat( document.getElementById( "tp1Price" ).value );
    const contractsToClose = parseInt( document.getElementById( "contractsToClose" ).value );
    let tpAction = document.querySelector( 'input[name="tpAction"]:checked' ).value;
    const newTP2 = parseFloat( document.getElementById( "newTP2" ).value );

    // Validaciones
    if ( isNaN( tp1Price ) || tp1Price <= 0 ) {
        alert( "Por favor ingrese un precio válido para TP1" );
        return;
    }

    if ( isNaN( contractsToClose ) || contractsToClose <= 0 || contractsToClose > trade.contracts ) {
        alert( "Número de contratos inválido. Debe ser entre 1 y " + trade.contracts );
        return;
    }

    if ( !trade.openPrice || isNaN( trade.openPrice ) ) {
        alert( "Error: Trade sin precio de apertura válido" );
        return;
    }

    if ( tpAction === 'tp2' && ( isNaN( newTP2 ) || newTP2 <= 0 ) ) {
        alert( "Por favor ingrese un TP2 válido" );
        return;
    }

    if ( contractsToClose === trade.contracts ) {
        tpAction = 'close';
    }

    // CÁLCULO CORRECTO DEL P&L PARCIAL
    const priceDifference = tp1Price - trade.openPrice;
    const partialPnL = ( trade.direction === 'buy' ? 1 : -1 ) * priceDifference * contractsToClose;

    console.log( `CÁLCULO PARCIAL:
        - Precio apertura: ${trade.openPrice}
        - Precio cierre: ${tp1Price}
        - Diferencia: ${priceDifference}
        - Contratos a cerrar: ${contractsToClose}
        - Dirección: ${trade.direction}
        - P&L parcial: ${partialPnL}
    `);

    // Obtener P&L existente
    const existingPnL = parseFloat( trade.pnl ) || 0;

    // Crear registro del parcial
    if ( !trade.partials ) trade.partials = [];

    const partialType = tpAction === 'close' ? 'Close All' : 'TP1';
    const partial = {
        type: partialType,
        price: tp1Price,
        contracts: contractsToClose,
        pnl: partialPnL, // ESTE es el P&L correcto para este parcial
        timestamp: new Date().toISOString(),
        reason: `${partialType === 'Close All' ? 'Cierre total' : 'TP1 parcial'}: ${contractsToClose} contratos @ ${tp1Price}`
    };

    trade.partials.push( partial );

    // ACTUALIZAR TRADE DIRECTAMENTE - EVITAR CUALQUIER RECÁLCULO
    const tradeIndex = trades.findIndex( t => t.id === tradeId );
    if ( tradeIndex === -1 ) return;

    // ACTUALIZACIÓN DIRECTA Y CONTROLADA
    trades[ tradeIndex ] = {
        ...trade,
        pnl: existingPnL + partialPnL, // Sumar SOLO el P&L parcial calculado
        contracts: trade.contracts - contractsToClose, // Restar contratos cerrados
        closePrice: tp1Price,
        tpLevel: partialType === 'TP1' ? 'tp1' : 'tp2',
        lastModified: new Date().toISOString(),
        closed: ( tpAction === "close" || ( trade.contracts - contractsToClose ) <= 0 ),
        status: ( tpAction === "close" || ( trade.contracts - contractsToClose ) <= 0 ) ? 'Cerrado por TP' : 'Cierre parcial',
        tp: ( tpAction === "close" || ( trade.contracts - contractsToClose ) <= 0 ) ? trade.tp : newTP2,
        partials: trade.partials,
        classification: classifyTradeResult( existingPnL + partialPnL ).category
    };

    // Si cerramos todos los contratos
    if ( tpAction === "close" || trades[ tradeIndex ].contracts <= 0 ) {
        trades[ tradeIndex ].contracts = 0;
    }

    console.log( `RESULTADO FINAL:
        - P&L anterior: ${existingPnL}
        - P&L parcial: ${partialPnL}
        - P&L total: ${trades[ tradeIndex ].pnl}
        - Contratos restantes: ${trades[ tradeIndex ].contracts}
    `);

    // Guardar sin llamar a editTrade
    saveDataLocally();
    if ( currentUser ) {
        syncDataToFirebase();
    }

    // Renderizar solo las partes necesarias
    renderTrades();
    renderDashboard();

    closePartialTPModal();
    updateSyncStatus(
        `TP parcial ejecutado: ${contractsToClose} contratos @ $${tp1Price.toFixed( 2 )} | P&L parcial: $${partialPnL.toFixed( 2 )} | P&L total: $${trades[ tradeIndex ].pnl.toFixed( 2 )}`,
        true
    );
    refreshClosureManagement();

    if ( trades[ tradeIndex ].closed ) {
        const disciplinaryMsg = generateDisciplinaryMessage();
        if ( disciplinaryMsg ) {
            setTimeout( () => showDisciplinaryMessage( disciplinaryMsg ), 1000 );
        }
    }
}

// CORRECCIÓN ADICIONAL: executeManualClose - Asegurar cálculo correcto
function executeManualClose( tradeId ) {
    const trade = trades.find( t => t.id === tradeId );
    if ( !trade ) return;

    const closePrice = parseFloat( document.getElementById( "manualClosePrice" ).value );
    const closeReason = document.getElementById( "closeReason" ).value;
    const closeNotes = document.getElementById( "closeNotes" ).value;

    if ( isNaN( closePrice ) || closePrice <= 0 ) {
        alert( "Por favor ingrese un precio de cierre válido" );
        return;
    }

    if ( !trade.openPrice || isNaN( trade.openPrice ) ) {
        alert( "Error: El trade no tiene precio de apertura registrado" );
        return;
    }

    // CORRECCIÓN: Usar trade.contracts (restantes) para el cálculo
    const { pnl, result } = calculateTradeResult( trade.openPrice, closePrice, trade.direction, trade.contracts );
    const classification = classifyTradeResult( pnl );

    const updateData = {
        closePrice: closePrice,
        pnl: ( parseFloat( trade.pnl ) || 0 ) + pnl, // Sumar al P&L existente
        result: result,
        closed: true,
        status: 'Cierre manual',
        closeReason: closeReason,
        closeNotes: closeNotes,
        classification: classification.category,
        closeTimestamp: new Date().toISOString(),
        contracts: 0, // Todos los contratos cerrados
        tpLevel: 'tp1 (manual)'
    };

    if ( !trade.partials ) trade.partials = [];
    trade.partials.push( {
        type: "Manual Close",
        price: closePrice,
        contracts: trade.contracts, // CORRECTO: usar contratos restantes
        pnl: pnl, // P&L solo de los contratos restantes
        timestamp: new Date().toISOString(),
        reason: `Cierre manual: ${closeReason} - ${closeNotes || 'Sin notas'}`
    } );

    const success = editTrade( tradeId, updateData );

    if ( success ) {
        closeManualCloseModal();
        updateSyncStatus( `Trade cerrado manualmente: P&L: $${pnl.toFixed( 2 )} | Total: $${updateData.pnl.toFixed( 2 )} | ${classification.category}`, true );
        refreshClosureManagement();

        const disciplinaryMsg = generateDisciplinaryMessage();
        if ( disciplinaryMsg ) {
            setTimeout( () => showDisciplinaryMessage( disciplinaryMsg ), 1000 );
        }
    } else {
        alert( "Error al cerrar el trade. Intente nuevamente." );
    }
}

function manualClose( tradeId ) {
    const trade = trades.find( t => t.id === tradeId );
    if ( !trade || trade.contracts <= 0 ) {
        alert( "No hay contratos disponibles para cierre manual" );
        return;
    }

    const modalHTML = `
        <div id="manualCloseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-trading-card p-6 rounded-lg border border-gray-700 w-full max-w-md mx-4">
                <h3 class="text-xl font-semibold text-gold mb-4">🔒 Cierre Manual</h3>
                
                <div class="bg-gray-800 p-4 rounded-lg mb-4">
                    <div class="text-sm text-gray-400">Trade:</div>
                    <div class="text-white font-medium">${strategyConfigs[ trade.strategy ]?.name || trade.strategy}</div>
                    <div class="text-sm text-gray-400 mt-1">
                        ${trade.totalContracts} contratos totales • ${trade.contracts} restantes • ${trade.direction === "buy" ? "Compra" : "Venta"}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        Entrada: $${trade.openPrice?.toFixed( 2 ) || 'N/A'}
                    </div>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Precio de Cierre</label>
                        <input type="number" id="manualClosePrice" step="0.01" 
                               placeholder="2465.50"
                               class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-gold">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Motivo del Cierre</label>
                        <select id="closeReason" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-gold">
                            <option value="manual">Cierre Manual</option>
                            <option value="sl_hit">Stop Loss Alcanzado</option>
                            <option value="tp_hit">Take Profit Alcanzado</option>
                            <option value="breakeven">Break Even</option>
                            <option value="time_exit">Cierre por Tiempo</option>
                            <option value="risk_mgmt">Gestión de Riesgo</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Notas Adicionales (Opcional)</label>
                        <textarea id="closeNotes" rows="2" 
                                  placeholder="Razón específica del cierre..."
                                  class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-gold resize-none"></textarea>
                    </div>
                    
                    <div id="closePreview" class="bg-gray-800 p-3 rounded-lg hidden">
                        <div class="text-sm text-gray-400">P&L Calculado:</div>
                        <div id="previewPnL" class="text-lg font-bold"></div>
                    </div>
                </div>
                
                <div class="flex space-x-4 mt-6">
                    <button id="executeCloseBtn" onclick="executeManualClose('${tradeId}')" 
                            class="flex-1 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-medium">
                        Ejecutar Cierre
                    </button>
                    <button onclick="closeManualCloseModal()" 
                            class="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML( "beforeend", modalHTML );

    const priceInput = document.getElementById( "manualClosePrice" );
    if ( priceInput ) {
        priceInput.addEventListener( "input", function () {
            const closePrice = parseFloat( this.value );
            const preview = document.getElementById( "closePreview" );
            const previewPnL = document.getElementById( "previewPnL" );

            if ( closePrice > 0 && trade.openPrice && !isNaN( trade.openPrice ) ) {
                const { pnl } = calculateTradeResult( trade.openPrice, closePrice, trade.direction, trade.contracts );
                const classification = classifyTradeResult( pnl );

                if ( previewPnL ) {
                    previewPnL.textContent = `$${pnl.toFixed( 2 )}`;
                    previewPnL.className = `text-lg font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`;
                }

                if ( preview ) {
                    preview.innerHTML = `
                        <div class="text-sm text-gray-400">P&L Calculado:</div>
                        <div class="text-lg font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}">$${pnl.toFixed( 2 )}</div>
                        <div class="text-xs ${classification.color} font-medium mt-1">${classification.category}</div>
                    `;
                    preview.classList.remove( "hidden" );
                }
            } else {
                if ( preview ) preview.classList.add( "hidden" );
            }
        } );
    }
}

function executeManualClose( tradeId ) {
    const trade = trades.find( t => t.id === tradeId );
    if ( !trade ) return;

    const closePrice = parseFloat( document.getElementById( "manualClosePrice" ).value );
    const closeReason = document.getElementById( "closeReason" ).value;
    const closeNotes = document.getElementById( "closeNotes" ).value;

    if ( isNaN( closePrice ) || closePrice <= 0 ) {
        alert( "Por favor ingrese un precio de cierre válido" );
        return;
    }

    if ( !trade.openPrice || isNaN( trade.openPrice ) ) {
        alert( "Error: El trade no tiene precio de apertura registrado" );
        return;
    }

    const { pnl, result } = calculateTradeResult( trade.openPrice, closePrice, trade.direction, trade.contracts );
    const classification = classifyTradeResult( pnl );

    const updateData = {
        closePrice: closePrice,
        pnl: ( parseFloat( trade.pnl ) || 0 ) + pnl,
        result: result,
        closed: true,
        status: 'Cierre manual',
        closeReason: closeReason,
        closeNotes: closeNotes,
        classification: classification.category,
        closeTimestamp: new Date().toISOString(),
        contracts: 0,
        tpLevel: 'tp1 (manual)'
    };

    if ( !trade.partials ) trade.partials = [];
    trade.partials.push( {
        type: "Manual Close",
        price: closePrice,
        contracts: trade.contracts,
        pnl: pnl,
        timestamp: new Date().toISOString(),
        reason: `Cierre manual: ${closeReason} - ${closeNotes || 'Sin notas'}`
    } );

    const success = editTrade( tradeId, updateData );

    if ( success ) {
        closeManualCloseModal();
        updateSyncStatus( `Trade cerrado manualmente: P&L: $${pnl.toFixed( 2 )} | Total: $${updateData.pnl.toFixed( 2 )} | ${classification.category}`, true );
        refreshClosureManagement();

        const disciplinaryMsg = generateDisciplinaryMessage();
        if ( disciplinaryMsg ) {
            setTimeout( () => showDisciplinaryMessage( disciplinaryMsg ), 1000 );
        }
    } else {
        alert( "Error al cerrar el trade. Intente nuevamente." );
    }
}

function closeManualCloseModal() {
    const modal = document.getElementById( "manualCloseModal" );
    if ( modal ) modal.remove();
}

function closePartialTPModal() {
    const modal = document.getElementById( "partialTPModal" );
    if ( modal ) modal.remove();
}

function closeActiveTradesModal() {
    const modal = document.getElementById( "activeTradesModal" );
    if ( modal ) modal.remove();
}


const additionalStyles = `
<style>
.animate-slide-in {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.disciplinary-message {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.transition-colors {
    transition: background-color 0.2s ease, color 0.2s ease;
}

/* Estados de botones mejorados */
.execute-trade-btn:disabled {
    cursor: not-allowed !important;
    opacity: 0.6 !important;
}

.execute-trade-btn.critical {
    animation: pulse 1s infinite;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
</style>
`;


function initializeRiskManagement() {
    // Agregar estilos CSS
    if ( !document.querySelector( '#risk-management-styles' ) ) {
        const styleElement = document.createElement( 'div' );
        styleElement.id = 'risk-management-styles';
        styleElement.innerHTML = additionalStyles;
        document.head.appendChild( styleElement );
    }

    // Actualizar contadores al cargar
    updateDailyCountersFromTrades();

    // Verificar estado de bloqueo al inicializar
    checkAndResetDailyCounters();

    console.log( "Sistema de gestión de riesgo inicializado" );
}

document.addEventListener( "DOMContentLoaded", function () {
    isInitializing = true;

    // Cargar datos locales inicialmente
    loadDataLocally();
    initializeAllListeners();
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

    const strategySelect = document.getElementById( 'strategySelect' );
    if ( strategySelect ) {
        strategySelect.addEventListener( 'change', updateStrategyDisplay );
    }
    updateStrategyDisplay();

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
        { id: "continueOfflineBtn", action: hideAuthModal },
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
        // AGREGAR: Inicializar validaciones después de mostrar modal
        setTimeout( () => {
            addRealTimeValidations();
        }, 100 );
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
    document.getElementById( "tradeForm" )?.addEventListener( "submit", function ( e ) {
        e.preventDefault();
        const tradeData = {
            date: document.getElementById( "tradeDate" ).value,
            strategy: document.getElementById( "tradeStrategy" ).value,
            symbol: document.getElementById( "tradeSymbol" ).value.toUpperCase() || 'XAUUSD', // NUEVO
            direction: document.getElementById( "tradeDirection" ).value,
            contracts: parseInt( document.getElementById( "tradeContracts" ).value ),
            openPrice: parseFloat( document.getElementById( "entryPrice" ).value ),
            closePrice: parseFloat( document.getElementById( "exitPrice" ).value ),
            sl: parseFloat( document.getElementById( "tradeSL" ).value ),
            tp: parseFloat( document.getElementById( "tradeTP" ).value ),
            comments: document.getElementById( "tradeComments" ).value || "",
        };

        addTrade( tradeData );
        hideModal( "tradeModal" );
        this.reset();
        document.getElementById( "tradeDate" ).value = new Date().toISOString().split( "T" )[ 0 ];
        document.getElementById( "tradeSymbol" ).value = "XAUUSD"; // Resetear al valor por defecto
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
            "authModal",
        ];
        modals.forEach( ( modalId ) => {
            const modal = document.getElementById( modalId );
            if ( modal && e.target === modal ) {
                hideModal( modalId );
            }
        } );
    } );

    // ===== EDICIÓN DE TRADES =====
    document
        .getElementById( "editTradeForm" )
        ?.addEventListener( "submit", function ( e ) {
            e.preventDefault();
            if ( !editingTradeId ) return;
            const updatedData = {
                date: document.getElementById( "editTradeDate" ).value,
                strategy: document.getElementById( "editTradeStrategy" ).value,
                direction: document.getElementById( "editTradeDirection" ).value,
                contracts: parseInt(
                    document.getElementById( "editTradeContracts" ).value
                ),
                openPrice: parseFloat( document.getElementById( "editOpenPrice" ).value ),
                closePrice: parseFloat( document.getElementById( "editClosePrice" ).value ),
                sl: parseFloat( document.getElementById( "editTradeSL" ).value ),
                tp: parseFloat( document.getElementById( "editTradeTP" ).value ),
                comments: document.getElementById( "editTradeComments" ).value || "",
            };
            editTrade( editingTradeId, updatedData ); // Aquí se recalcula pnl y result
            hideModal( "editTradeModal" );
            editingTradeId = null;
            updateSyncStatus( "Trade actualizado correctamente", true );
        } );

    document
        .getElementById( "deleteTradeBtn" )
        ?.addEventListener( "click", function () {
            if ( editingTradeId && confirm( "¿Estás seguro de eliminar este trade?" ) ) {
                deleteTrade( editingTradeId );
                hideModal( "editTradeModal" );
                editingTradeId = null;
            }
        } );

    document
        .getElementById( "cancelEditTradeBtn" )
        ?.addEventListener( "click", () => {
            hideModal( "editTradeModal" );
            editingTradeId = null;
        } );

    // ===== GESTIÓN DE NIVELES CRÍTICOS =====
    document
        .getElementById( "editLevelsBtn" )
        ?.addEventListener( "click", showEditLevelsModal );
    document
        .getElementById( "addResistanceBtn" )
        ?.addEventListener( "click", addResistance );
    document
        .getElementById( "addSupportBtn" )
        ?.addEventListener( "click", addSupport );

    document
        .getElementById( "editLevelsForm" )
        ?.addEventListener( "submit", function ( e ) {
            e.preventDefault();
            saveCriticalLevels();
        } );

    document
        .getElementById( "cancelEditLevelsBtn" )
        ?.addEventListener( "click", () => {
            hideModal( "editLevelsModal" );
        } );

    // ===== ANÁLISIS POST-TRADE =====
    document
        .getElementById( "savePostTradeBtn" )
        ?.addEventListener( "click", savePostTradeAnalysis );
    document
        .getElementById( "weeklyAnalysisBtn" )
        ?.addEventListener( "click", generateWeeklyAnalysis );

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

    setTimeout( () => {
        initializeStrategyCalculator();
    }, 100 );
} );

// ===== fUNCIONES GLOBALES =====
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
window.executeValidatedSetup = executeValidatedSetupWithRisk;
window.closeDisciplinaryMessage = closeDisciplinaryMessage;
window.closeTradeDetailsModal = closeTradeDetailsModal;
window.showClosureManagement = showClosureManagement;
window.adjustStopLoss = adjustStopLoss;
window.partialTakeProfit = partialTakeProfit;
window.executePartialTP = executePartialTP;
window.showTradeDetails = showTradeDetails;
window.executeManualClose = executeManualClose;
window.manualClose = manualClose;
window.closeActiveTradesModal = closeActiveTradesModal;
window.closePartialTPModal = closePartialTPModal;
window.closeManualCloseModal = closeManualCloseModal;
window.editTrade = editTrade;
window.addTrade = addTrade;
window.renderTrades = renderTrades;
window.calculateWinRate = calculateWinRate;
window.updateDisciplineIndicators = updateDisciplineIndicators;
window.closeDisciplineAlert = closeDisciplineAlert;
// Exponer funciones globalmente
window.renderCapitalMovementsTable = renderCapitalMovementsTable;
window.deleteCapitalMovement = deleteCapitalMovement;
window.clearTradeFilters = clearTradeFilters;
window.addRealTimeValidations = addRealTimeValidations;
window.addRealTimeValidationsToEditModal = addRealTimeValidationsToEditModal;

// ===== EXPONER VARIABLES PARA CHARTS.JS =====
window.getTrades = function () {
    return trades || [];
};

window.getCapitalAdditions = function () {
    return capitalAdditions || [];
};

window.getWithdrawals = function () {
    return withdrawals || [];
};

console.log( 'Variables globales exportadas para charts.js' );

// Inicializar al cargar el documento
if ( typeof document !== 'undefined' ) {
    document.addEventListener( 'DOMContentLoaded', initializeRiskManagement );
}
