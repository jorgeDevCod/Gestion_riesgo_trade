// ============================================
// MARKET SESSIONS TRACKER - CORREGIDO
// ============================================

const MARKET_SESSIONS = {
    'sydney': {
        name: 'Sídney',
        emoji: '🇦🇺',
        timezone: 'Australia/Sydney',
        utcOpen: 22,
        utcClose: 7,
        dayStart: 0 // Domingo
    },
    'tokyo': {
        name: 'Tokio',
        emoji: '🇯🇵',
        timezone: 'Asia/Tokyo',
        utcOpen: 0,
        utcClose: 9,
        dayStart: 0
    },
    'hongkong': {
        name: 'Hong Kong',
        emoji: '🇭🇰',
        timezone: 'Asia/Hong_Kong',
        utcOpen: 1,
        utcClose: 10,
        dayStart: 0
    },
    'frankfurt': {
        name: 'Frankfurt',
        emoji: '🇩🇪',
        timezone: 'Europe/Berlin',
        utcOpen: 7,
        utcClose: 16,
        dayStart: 1 // Lunes
    },
    'london': {
        name: 'Londres',
        emoji: '🇬🇧',
        timezone: 'Europe/London',
        utcOpen: 8,
        utcClose: 17,
        dayStart: 1
    },
    'newyork': {
        name: 'Nueva York',
        emoji: '🇺🇸',
        timezone: 'America/New_York',
        utcOpen: 13,
        utcClose: 22,
        dayStart: 1
    }
};

let updateInterval = null;
let isInitialized = false;

// ✅ NUEVA FUNCIÓN: Verificar si es fin de semana
function isWeekend() {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();

    // Sábado completo (día 6)
    if ( day === 6 ) return true;

    // Domingo hasta antes de Sydney (22:00 UTC)
    if ( day === 0 && hour < 22 ) return true;

    // Viernes después del cierre de NY (22:00 UTC)
    if ( day === 5 && hour >= 22 ) return true;

    return false;
}

function getUTCTime() {
    const now = new Date();
    return {
        hours: now.getUTCHours(),
        minutes: now.getUTCMinutes(),
        seconds: now.getUTCSeconds(),
        day: now.getUTCDay()
    };
}

function formatTimeDisplay( hours, minutes ) {
    return `${String( hours ).padStart( 2, '0' )}:${String( minutes ).padStart( 2, '0' )}`;
}

function convertUTCtoPeruHour( utcHour ) {
    const peruOffset = -5;
    let peruHour = utcHour + peruOffset;
    if ( peruHour < 0 ) peruHour += 24;
    if ( peruHour >= 24 ) peruHour -= 24;
    return peruHour;
}

// ✅ FUNCIÓN CORREGIDA: Verifica día y hora
function isSessionActive( session ) {
    if ( isWeekend() ) return false;

    const { hours, day } = getUTCTime();

    // Sydney y Tokyo abren domingo, resto el lunes
    if ( day < session.dayStart ) return false;

    if ( session.utcClose > session.utcOpen ) {
        return hours >= session.utcOpen && hours < session.utcClose;
    } else {
        return hours >= session.utcOpen || hours < session.utcClose;
    }
}

function getTimeToNextEvent( session ) {
    const { hours, minutes, seconds } = getUTCTime();
    const currentMinutes = hours * 60 + minutes;
    const isActive = isSessionActive( session );

    let targetHour = isActive ? session.utcClose : session.utcOpen;
    let targetMinutes = targetHour * 60;
    let diff = targetMinutes - currentMinutes;
    if ( diff < 0 ) diff += 1440;

    const remainingSeconds = 60 - seconds;
    if ( remainingSeconds < 60 ) diff -= 1;

    return {
        hours: Math.floor( diff / 60 ),
        minutes: diff % 60,
        seconds: remainingSeconds === 60 ? 0 : remainingSeconds,
        isActive
    };
}

function formatTime( h, m, s ) {
    return `${String( h ).padStart( 2, '0' )}:${String( m ).padStart( 2, '0' )}:${String( s ).padStart( 2, '0' )}`;
}

function initializeSessionContainers() {
    const container = document.getElementById( 'sessionsMainContainer' );
    if ( !container ) return false;

    // ✅ Mostrar mensaje si es fin de semana
    if ( isWeekend() ) {
        container.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                background: linear-gradient(135deg, #1f293715, #1f293708);
                border: 2px solid #374151;
                border-radius: 0.5rem;
            ">
                <span style="font-size: 1.5rem;">🔴</span>
                <div>
                    <div style="font-size: 0.875rem; font-weight: 700; color: #ef4444;">
                        Mercados Cerrados
                    </div>
                    <div style="font-size: 0.75rem; color: #9ca3af;">
                        Los mercados abren el domingo 22:00 UTC (17:00 PE)
                    </div>
                </div>
            </div>
        `;
        isInitialized = true;
        return true;
    }

    const sessions = Object.entries( MARKET_SESSIONS ).map( ( [ key, session ] ) => {
        const timeInfo = getTimeToNextEvent( session );
        return { key, session, ...timeInfo };
    } );

    const activeSessions = sessions.filter( s => s.isActive );
    const upcomingSessions = sessions
        .filter( s => !s.isActive )
        .sort( ( a, b ) => ( a.hours * 60 + a.minutes ) - ( b.hours * 60 + b.minutes ) );

    const allSessions = [ ...activeSessions, ...upcomingSessions ];

    container.innerHTML = allSessions.map( s => {
        return `<div id="session-${s.key}" class="session-item" data-session="${s.key}"></div>`;
    } ).join( '' );

    isInitialized = true;
    return true;
}

function updateSessionContent( sessionElement, session, timeInfo ) {
    const { hours, minutes, seconds, isActive } = timeInfo;
    const timeStr = formatTime( hours, minutes, seconds );
    const status = isActive ? 'ABIERTO' : 'CERRADO';

    const statusColor = isActive ? '#10b981' : '#ef4444';
    const statusBg = isActive ? '#10b98120' : '#ef444420';
    const borderColor = isActive ? '#10b981' : '#374151';
    const bgGradient = isActive
        ? 'linear-gradient(135deg, #10b98115, #10b98108)'
        : 'linear-gradient(135deg, #1f293715, #1f293708)';

    const openHourPeru = convertUTCtoPeruHour( session.utcOpen );
    const closeHourPeru = convertUTCtoPeruHour( session.utcClose );

    sessionElement.className = `session-item ${isActive ? 'active' : 'inactive'}`;
    sessionElement.style.cssText = `
        background: ${bgGradient};
        border: 2px solid ${borderColor};
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex-shrink: 0;
        transition: all 0.3s ease;
        min-width: 260px;
    `;

    sessionElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.375rem;">
            <span style="font-size: 1.25rem; line-height: 1;">${session.emoji}</span>
            <span style="font-size: 0.8125rem; font-weight: 700; color: ${isActive ? '#fff' : '#9ca3af'}; white-space: nowrap;">
                ${session.name}
            </span>
        </div>
        <div style="width: 1.5px; height: 2.25rem; background: ${borderColor}; opacity: 0.5;"></div>
        <div style="background: ${statusBg}; border: 1px solid ${statusColor}; border-radius: 0.375rem; padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 0.375rem;">
            <div style="width: 0.4rem; height: 0.4rem; border-radius: 50%; background: ${statusColor}; ${isActive ? `box-shadow: 0 0 6px ${statusColor}; animation: pulse 2s infinite;` : ''}"></div>
            <span style="font-size: 0.6875rem; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.3px;">
                ${status}
            </span>
        </div>
        <div style="width: 1px; height: 2.25rem; background: #374151; opacity: 0.3;"></div>
        <div style="display: flex; gap: 0.75rem;">
            ${isActive ? `
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.5625rem; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Abrió (PE)</span>
                    <span style="font-size: 0.6875rem; color: #d3dede; font-family: monospace; font-weight: 600;">${formatTimeDisplay( openHourPeru, 0 )}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.5625rem; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Cierra (PE)</span>
                    <span style="font-size: 0.6875rem; color: #10b981; font-family: monospace; font-weight: 700;">${formatTimeDisplay( closeHourPeru, 0 )}</span>
                </div>
            ` : `
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.5625rem; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Cerró (PE)</span>
                    <span style="font-size: 0.6875rem; color: #d3dede; font-family: monospace; font-weight: 600;">${formatTimeDisplay( closeHourPeru, 0 )}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.5625rem; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Abre (PE)</span>
                    <span style="font-size: 0.6875rem; color: #9ca3af; font-family: monospace; font-weight: 700;">${formatTimeDisplay( openHourPeru, 0 )}</span>
                </div>
            `}
        </div>
        <div style="width: 1px; height: 2.25rem; background: #374151; opacity: 0.3;"></div>
        <div style="display: flex; flex-direction: column; align-items: center; min-width: 70px;">
            <span style="font-size: 0.5625rem; color: #9ca3af; text-transform: uppercase; font-weight: 600;">
                ${isActive ? 'Cierra en' : 'Abre en'}
            </span>
            <span style="font-size: 0.9375rem; font-weight: 800; font-family: monospace; color: ${isActive ? '#10b981' : '#9ca3af'}; line-height: 1; letter-spacing: 0.5px;">
                ${timeStr}
            </span>
        </div>
    `;
}

function renderSessionsBanner() {
    const container = document.getElementById( 'sessionsMainContainer' );
    if ( !container ) return;

    if ( !isInitialized ) {
        const initialized = initializeSessionContainers();
        if ( !initialized ) return;
    }

    // ✅ Si es fin de semana, no actualizar más
    if ( isWeekend() ) return;

    Object.entries( MARKET_SESSIONS ).forEach( ( [ key, session ] ) => {
        const sessionElement = document.getElementById( `session-${key}` );
        if ( !sessionElement ) return;

        const timeInfo = getTimeToNextEvent( session );
        updateSessionContent( sessionElement, session, timeInfo );
    } );
}

function updateSessions() {
    renderSessionsBanner();
}

function startSessionTracker() {
    updateSessions();
    updateInterval = setInterval( updateSessions, 1000 );
    console.log( '🌍 Market Sessions Tracker iniciado' );
}

function stopSessionTracker() {
    if ( updateInterval ) {
        clearInterval( updateInterval );
        updateInterval = null;
    }
}

// ✅ Verificar cada hora cambios de fin de semana
setInterval( () => {
    console.log( '🔄 Verificando estado de mercados...' );
    isInitialized = false;
}, 3600000 );

if ( document.readyState === 'loading' ) {
    document.addEventListener( 'DOMContentLoaded', startSessionTracker );
} else {
    startSessionTracker();
}

// Drag to scroll (sin cambios)
function enableDragScroll() {
    const container = document.getElementById( 'sessionsMainContainer' );
    if ( !container ) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener( 'mousedown', ( e ) => {
        isDown = true;
        container.style.cursor = 'grabbing';
        container.style.userSelect = 'none';
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    } );

    container.addEventListener( 'mouseleave', () => {
        isDown = false;
        container.style.cursor = 'grab';
    } );

    container.addEventListener( 'mouseup', () => {
        isDown = false;
        container.style.cursor = 'grab';
    } );

    container.addEventListener( 'mousemove', ( e ) => {
        if ( !isDown ) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = ( x - startX ) * 2;
        container.scrollLeft = scrollLeft - walk;
    } );

    container.style.cursor = 'grab';
}

if ( document.readyState === 'loading' ) {
    document.addEventListener( 'DOMContentLoaded', () => {
        startSessionTracker();
        enableDragScroll();
    } );
} else {
    startSessionTracker();
    enableDragScroll();
}

window.addEventListener( 'beforeunload', stopSessionTracker );
window.startSessionTracker = startSessionTracker;
window.stopSessionTracker = stopSessionTracker;
