/* ============================================================
   strategies-manager.js — Estrategias y Señales DINÁMICAS
   - No rompe nada: muta strategyConfigs/setupChecklists existentes,
     repuebla selects, añade cards de dashboard y modales CRUD.
   - Persistencia SOLO local: localStorage "trading_strategies".
   - Estilos: reutiliza clases Tailwind del proyecto (bg-trading-dark,
     border-gray-700, text-gold, bg-profit, etc.). Sin dependencias.
   ============================================================ */
(function () {
    'use strict';

    var LS_KEY = 'trading_strategies';
    var LS_VER_KEY = 'trading_strategies_version';
    var STORE_VERSION = 1;

    var SELECT_IDS = [
        'signalStrategySelect',
        'strategySelect',
        'filterStrategy',
        'tradeStrategy',
        'editTradeStrategy'
    ];

    var COLOR_MAP = {
        blue:   { grad: 'from-blue-900/20 to-blue-800/10',   border: 'border-blue-500/20',   hover: 'hover:border-blue-500/40',   text: 'text-blue-400',  dot: 'bg-blue-400',   divider: 'border-blue-500/20' },
        cyan:   { grad: 'from-cyan-900/20 to-cyan-800/10',   border: 'border-cyan-500/20',   hover: 'hover:border-cyan-500/40',   text: 'text-cyan-400',  dot: 'bg-cyan-400',   divider: 'border-cyan-500/20' },
        purple: { grad: 'from-purple-900/20 to-purple-800/10', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40', text: 'text-purple-400', dot: 'bg-purple-400', divider: 'border-purple-500/20' },
        orange: { grad: 'from-orange-900/20 to-orange-800/10', border: 'border-orange-500/20', hover: 'hover:border-orange-500/40', text: 'text-orange-400', dot: 'bg-orange-400', divider: 'border-orange-500/20' },
        green:  { grad: 'from-green-900/20 to-green-800/10',  border: 'border-green-500/20',  hover: 'hover:border-green-500/40',  text: 'text-green-400', dot: 'bg-green-400',  divider: 'border-green-500/20' },
        red:    { grad: 'from-red-900/20 to-red-800/10',      border: 'border-red-500/20',    hover: 'hover:border-red-500/40',    text: 'text-red-400',   dot: 'bg-red-400',    divider: 'border-red-500/20' },
        yellow: { grad: 'from-yellow-900/20 to-yellow-800/10', border: 'border-yellow-500/20', hover: 'hover:border-yellow-500/40', text: 'text-yellow-400', dot: 'bg-yellow-400', divider: 'border-yellow-500/20' },
        pink:   { grad: 'from-pink-900/20 to-pink-800/10',    border: 'border-pink-500/20',   hover: 'hover:border-pink-500/40',   text: 'text-pink-400',  dot: 'bg-pink-400',   divider: 'border-pink-500/20' }
    };

    var TF_SUGGESTIONS = ['4H/1H', '4H', '1H', '1H/15M', '15M', '15M/5M', '5M/3M', '5M', '3M', 'Multiple TF'];

    /* ---------- utils ---------- */
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function slugify(text) {
        return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 40) || ('estrategia-' + Date.now());
    }
    function uid(prefix) {
        return (prefix || 's') + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    }
    function getGlobals(name) {
        try {
            // Las const de nivel superior de firebase-app.js viven en el entorno
            // léxico global: se leen por nombre, no por window.*
            var v = (typeof window !== 'undefined' && window[name] !== undefined) ? window[name] : undefined;
            if (v !== undefined) return v;
            // eslint-disable-next-line no-eval
            v = eval('typeof ' + name + ' !== "undefined" ? ' + name + ' : undefined');
            return v;
        } catch (e) { return undefined; }
    }
    function num(v, fb) { var n = parseFloat(v); return isNaN(n) ? fb : n; }

    /* ---------- seed: estrategias actuales seteadas ---------- */
    function inferSignal(raw, idx) {
        var desc = String(raw || '');
        var tf = 'Multiple TF', session = 'Todas', tags = [];
        var m = desc.match(/^\s*([^:]{1,25}?)\s*:\s*(.+)$/);
        if (m && /H|M\b|Entrada/i.test(m[1]) && m[1].length <= 25) {
            tf = m[1].trim().replace(/^Entrada1?2?/i, '15M/5M').replace(/^Entrada Small/i, '5M/3M').replace(/^Entrada$/i, '5M/3M');
            desc = m[2].trim();
        } else {
            var m2 = raw.match(/(\d+H\/\d+H|\d+H|\d+M\/\d+M|\d+M)/);
            if (m2) tf = m2[1];
        }
        if (/williams|%R/i.test(raw)) tags.push('Williams %R');
        if (/macd/i.test(raw)) tags.push('MACD');
        if (/ema/i.test(raw)) tags.push('EMA');
        if (/volumen/i.test(raw)) tags.push('Volumen');
        if (/fibonacci|fibo/i.test(raw)) tags.push('Fibonacci');
        if (/estoc/i.test(raw)) tags.push('Estocástico');
        if (/soporte|resistencia|s\/r/i.test(raw)) tags.push('S/R');
        if (/divergencia/i.test(raw)) tags.push('Divergencia');
        if (/patr[oó]n|envolvente|martillo|pin bar/i.test(raw)) tags.push('Patrón');
        if (/londres|london/i.test(raw)) session = 'Londres';
        else if (/\bNY\b|nueva york/i.test(raw)) session = 'Nueva York';
        else if (/asia|tokio/i.test(raw)) session = 'Asia';
        return { id: uid('sig'), description: desc, timeframe: tf, session: session, tags: tags };
    }

    function buildSeed() {
        var cfgs = getGlobals('strategyConfigs') || {};
        var lists = getGlobals('setupChecklists') || {};
        var base = [
            { id: 'regulares', emoji: '📈', color: 'blue', sessionHours: 'Londres 02:00-05:00 + NY 08:00-11:00', description: 'Estrategia principal de tendencia con Williams %R, EMAs y confirmación en 5M/3M.' },
            { id: 'estructura-confluencia', emoji: '🎯', color: 'cyan', sessionHours: 'Londres 02:00-05:00 + NY 08:00-11:00', description: 'Alta precisión: estructura + zonas S/R con Fibonacci, MACD y Estocástico.' },
            { id: 'ema-macd', emoji: '📊', color: 'purple', sessionHours: 'NY 08:00-12:00 (tendencia fuerte)', description: 'Tendencia fuerte con EMAs 21/50 y jerarquía MACD 4H > 1H > 15M.' },
            { id: 'contra-tendencia', emoji: '⚡', color: 'orange', sessionHours: 'NY 08:00-11:00 (reversión intradía)', description: 'Reversión: agotamiento + divergencia + patrón en zona mayor.' }
        ];
        var templates = seedTemplates();
        return base.map(function (b) {
            var c = cfgs[b.id] || {};
            var rawList = lists[b.id] || [];
            return {
                id: b.id, name: c.name || b.id, emoji: b.emoji, color: b.color,
                description: b.description, sessionHours: b.sessionHours,
                params: {
                    winRate: num(c.winRate, 60), rrRatio: num(c.rrRatio, 2.0),
                    stopLoss: num(c.stopLoss, 6), takeProfit1: num(c.takeProfit1, 12),
                    takeProfit2: num(c.takeProfit2, 20), riskPercent: num(c.riskPercent, 2.5),
                    minRisk: num(c.minRisk, 2.0), maxRisk: num(c.maxRisk, 5.0)
                },
                signals: rawList.map(function (r, i) { return inferSignal(r, i); }),
                template: templates[b.id] || emptyTemplate()
            };
        });
    }

    function emptyTemplate() {
        return {
            invalidacion: [], confluencias: [], entrada: '',
            compras: { titulo: '🟢 SETUP COMPRAS', pasos: [] },
            ventas: { titulo: '🔴 SETUP VENTAS', pasos: [] }
        };
    }

    // Transcripción fiel de los 4 templates HTML actuales (index.html 2006-2388)
    function seedTemplates() {
        return {
            'regulares': {
                invalidacion: [
                    'Williams %R 4H en zona extrema opuesta (-95 compras, -5 ventas)',
                    'MACD 4H girando en contra con histograma acelerando',
                    'Ruptura fuerte contra dirección con volumen 2x+',
                    'Stop Loss alcanzado (sin excepciones)'
                ],
                compras: { titulo: '🟢 SETUP COMPRAS', pasos: [
                    { titulo: 'PASO 1 - Contexto 4H/1H (2 de 3)', items: ['Estructura alcista validada (máx/mín ascendentes)', 'Williams %R saliendo de -80/-60 o rebote en -50↑', 'EMA 21 > EMA 50 subiendo o Precio > de EMA21/EMA50'] },
                    { titulo: 'PASO 2 - Setup 1H/15M (2 de 3)', items: ['Rechazo en soporte o rompimiento de resistencia y retesteo con volumen bajo', 'Williams %R entre -80/-50 moviéndose hacia arriba', 'Vela con mecha larga (4+ pips) + cuerpo verde + siguiente vela cierra verde'] },
                    { titulo: 'PASO 3 - Confirmación 5M/3M', items: ['Precio rompe micro tendencia con volumen en ruptura + Williams saliendo de extremo', 'Retroceso del precio a zona de ruptura o confluencia sin volumen', 'Entrada: cierre de vela por encima de última vela bajista de parada'] }
                ]},
                ventas: { titulo: '🔴 SETUP VENTAS', pasos: [
                    { titulo: 'PASO 1 - Contexto 4H/1H (2 de 3)', items: ['Estructura bajista validada (máx/mín descendentes)', 'Williams %R saliendo de -20/-40 o rechazo en -50↓', 'EMA 21 < EMA 50 bajando o Precio < de EMA21/EMA50'] },
                    { titulo: 'PASO 2 - Setup 1H/15M (2 de 3)', items: ['Rechazo en resistencia o ruptura de soporte con retesteo de bajo volumen', 'Williams %R entre -20/-50 moviéndose hacia abajo', 'Vela con mecha superior larga (4+ pips) + cuerpo rojo + siguiente vela cierra roja'] },
                    { titulo: 'PASO 3 - Confirmación 5M/3M', items: ['Precio rompe micro soporte con volumen en ruptura + Williams saliendo de zona alta', 'Retroceso del precio a zona de ruptura o confluencia sin volumen', 'Entrada: cierre de vela por debajo de última vela alcista de parada'] }
                ]},
                confluencias: ['Williams %R alineado en 1H/15M | 15M/5M', 'MACD 1H y 15M por cruzar o ya cruzado', 'Nivel S/R o línea de tendencia clave', 'Vela 5M/3M confirmatoria con volumen 1.5x+'],
                entrada: 'Tras la vela confirmatoria en 5M/3M que valide la ruptura o el rebote del último máx o mín relevante en 15M.'
            },
            'estructura-confluencia': {
                invalidacion: ['MACD 4H/1H divergiendo fuertemente contra estructura', 'Estructura mayor rota con volumen 2x+ (cambio de contexto)', 'Estocástico sin reacción en zonas extremas por 3+ velas', 'Zona de confluencia invalidada por ruptura falsa'],
                compras: { titulo: '🟢 SETUP COMPRAS', pasos: [
                    { titulo: 'CONTEXTO (4H/1H)', items: ['Tendencia: 2+ máximos/mínimos consecutivos ascendentes', 'MACD alineado alcista o neutral (sin divergencia bajista)', 'Estructura respetando soportes dinámicos'] },
                    { titulo: 'CONFLUENCIA (1H/15M)', items: ['Zona clave: S/R histórico + Fibonacci confirmado', 'Divergencia: %K vs precio (valles ascendentes)', 'Mecha ≥5 pips en zona crítica (rechazo validado)'] },
                    { titulo: 'SEÑAL (15M)', items: ['MACD cruzando/por cruzar alcista + histograma verde', 'Estocástico: cruza ↑20 o rebota ↑50 con momentum'] },
                    { titulo: 'ENTRADA (3M/5M)', items: ['MACD histograma cambiando a verde', 'Estocástico saliendo de zona extrema hacia arriba', 'Reacción: patrón claro o ruptura+retesteo con volumen'] }
                ]},
                ventas: { titulo: '🔴 SETUP VENTAS', pasos: [
                    { titulo: 'CONTEXTO (4H/1H)', items: ['Tendencia: 2+ máximos/mínimos consecutivos descendentes', 'MACD alineado bajista o neutral (sin divergencia alcista)', 'Estructura respetando resistencias dinámicas'] },
                    { titulo: 'CONFLUENCIA (1H/15M)', items: ['Zona clave: R/S histórico + Fibonacci confirmado', 'Divergencia: %K vs precio (picos descendentes)', 'Mecha ≥5 pips en zona crítica (rechazo validado)'] },
                    { titulo: 'SEÑAL (15M)', items: ['MACD cruzando/por cruzar bajista + histograma rojo', 'Estocástico: cruza ↓80 o rebota ↓50 con momentum'] },
                    { titulo: 'ENTRADA (3M/5M)', items: ['MACD histograma cambiando a rojo', 'Estocástico saliendo de zona extrema hacia abajo', 'Reacción: patrón claro o ruptura+retesteo con volumen'] }
                ]},
                confluencias: ['Zona perfecta: S/R + Fibonacci cruzando y saliendo de extremos', 'Sincronización: MACD + Estocástico alineados direccionalmente', 'Confirmación: patrón claro + volumen + reacción inmediata'],
                entrada: 'Reacción en EMA21>EMA50 o zona S/R con volumen. Esperar retesteo con bajo volumen. Entrar al cierre de vela confirmatoria que rompa el máx/mín del retroceso.'
            },
            'ema-macd': {
                invalidacion: ['MACD 4H gira en contra con histograma acelerando', 'Precio en caída/subida libre de +3 días consecutivos', 'Operar contra MACD 4H sin validación extra'],
                compras: { titulo: '🟢 SETUP COMPRAS', pasos: [
                    { titulo: 'PASO 1 - Contexto 4H', items: ['MACD sin divergencia bajista + histograma verde creciendo', 'No en caída libre de +3 días consecutivos', 'Precio supera +2 resistencias y se mantiene como soporte'] },
                    { titulo: 'PASO 2 - Señal 1H (3 de 4)', items: ['Líneas MACD por cruzar hacia dirección alcista', 'Precio rompe o rebota en zona de SOPORTE', 'Precio encima o rebota en EMA 21 por 3+ velas', 'EMA 21 cruza EMA 50 al alza (opcional)'] },
                    { titulo: 'PASO 3 - Confirmación 15M (2 de 3)', items: ['Histograma MACD creciendo 2+ velas consecutivas', 'Precio encima de ambas EMAs por 2+ velas', 'Vela rebota en EMA 21 o 50 con histograma verde'] }
                ]},
                ventas: { titulo: '🔴 SETUP VENTAS', pasos: [
                    { titulo: 'PASO 1 - Contexto 4H', items: ['MACD con divergencia bajista e histograma rojo', 'No en subida libre de +3 días consecutivos', 'Precio rompe +2 soportes y rebota en último como resistencia'] },
                    { titulo: 'PASO 2 - Señal 1H (3 de 4)', items: ['Líneas MACD por cruzar hacia dirección bajista', 'Precio rompe o es rechazado en zona de RESISTENCIA', 'Precio debajo o rebota en EMA 21 por 3+ velas', 'EMA 21 cruza EMA 50 a la baja (opcional)'] },
                    { titulo: 'PASO 3 - Confirmación 15M (2 de 3)', items: ['Histograma MACD decreciendo 2+ velas consecutivas', 'Precio debajo de ambas EMAs por 2+ velas', 'Vela rechaza EMA 21 o 50 con histograma rojo'] }
                ]},
                confluencias: ['Jerarquía MACD: 4H contexto (80%) + 1H señal (15%) + 15M timing (5%)', 'Histograma acompaña el cruce', 'Precio respecto a EMA21/EMA50'],
                entrada: 'Siguiente vela 5M después de confirmación.'
            },
            'contra-tendencia': {
                invalidacion: ['MACD se expande sin divergencia (impulso aún vigente)', 'Williams %R no logra salir del extremo (-20/-80)', 'Ruptura sin volumen >1.2x promedio', 'Falla el patrón de reversión en 15M o no confirma en 5M'],
                compras: { titulo: '🟢 COMPRAS - Reversión desde precio barato', pasos: [
                    { titulo: '1️⃣ Detección de agotamiento (4H/1H)', items: ['Estructura: ChoCH o rechazo fuerte en soporte relevante', 'EMAs 21/50: comienzan a aplanarse o cruzarse', 'Fibo: traza extensión para proyectar objetivos del nuevo impulso'] },
                    { titulo: '2️⃣ Confirmación de giro (1H/15M)', items: ['MACD: divergencia alcista (precio cae / MACD sube)', 'Williams %R: en sobreventa y saliendo de -80↗', 'Patrón de reversión: martillo, doji o envolvente alcista'] },
                    { titulo: '3️⃣ Validación micro (15M/5M/3M)', items: ['Volumen: aumento >1.5x en ruptura del micro techo', 'Pullback con volumen decreciente', 'Williams %R confirma salida del extremo inferior'] }
                ]},
                ventas: { titulo: '🔴 VENTAS - Reversión desde precio caro', pasos: [
                    { titulo: '1️⃣ Detección de agotamiento (4H/1H)', items: ['Estructura: ChoCH o rechazo fuerte en resistencia relevante', 'EMAs 21/50: comienzan a aplanarse o cruzarse', 'Fibo: traza extensión 0–100% para proyectar retroceso'] },
                    { titulo: '2️⃣ Confirmación de giro (1H/15M)', items: ['MACD: divergencia bajista (precio sube / MACD cae)', 'Williams %R: en sobrecompra y saliendo de -20↘', 'Vela envolvente o pin bar en zona de resistencia'] },
                    { titulo: '3️⃣ Validación micro (15M/5M/3M)', items: ['Volumen: aumento >1.5x en ruptura del micro soporte', 'Pullback suave con volumen decreciente', 'Williams %R confirma salida del extremo superior'] }
                ]},
                confluencias: ['Divergencia simultánea MACD 1H + Williams %R 15M', 'Zona de soporte/resistencia + patrón de reversión', 'Volumen decreciente en retroceso + explosivo en ruptura', 'EMA21 rota y confirmada con volumen en 5M'],
                entrada: 'Pullback o ruptura confirmada en 5M/3M con volumen >1.5x.'
            }
        };
    }

    /* ---------- store ---------- */
    function loadStore() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            var arr = JSON.parse(raw);
            if (!Array.isArray(arr) || !arr.length) return null;
            return arr;
        } catch (e) { console.warn('StrategyStore: local corrupto, usando seed', e); return null; }
    }
    function persist(list) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(list));
            localStorage.setItem(LS_VER_KEY, String(STORE_VERSION));
        } catch (e) { console.warn('StrategyStore: no se pudo guardar', e); }
    }
    function getAll() {
        var list = loadStore();
        if (!list) { list = buildSeed(); persist(list); }
        return list;
    }
    function getById(id) {
        var list = getAll();
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return null;
    }

    // Sincroniza los objetos globales legacy (mutación, sin reasignar const)
    function syncGlobals() {
        var list = getAll();
        var cfgs = getGlobals('strategyConfigs');
        var lists = getGlobals('setupChecklists');
        if (!cfgs || !lists) return;
        // Eliminar ids que ya no existen (solo customs; legacy se recrean abajo)
        Object.keys(cfgs).forEach(function (k) {
            var found = list.some(function (s) { return s.id === k; });
            if (!found && cfgs[k] && cfgs[k].__custom) { delete cfgs[k]; delete lists[k]; }
        });
        list.forEach(function (s) {
            var tfs = {};
            (s.signals || []).forEach(function (sg) { if (sg.timeframe) tfs[sg.timeframe] = 1; });
            var tfSummary = Object.keys(tfs).slice(0, 3).join(' / ') || 'Multiple TF';
            cfgs[s.id] = {
                name: (s.emoji ? s.emoji + ' ' : '') + s.name,
                winRate: num(s.params.winRate, 60), rrRatio: num(s.params.rrRatio, 2),
                stopLoss: num(s.params.stopLoss, 6), takeProfit1: num(s.params.takeProfit1, 12),
                takeProfit2: num(s.params.takeProfit2, 20), riskPercent: num(s.params.riskPercent, 2.5),
                minRisk: num(s.params.minRisk, 2), maxRisk: num(s.params.maxRisk, 5),
                timeframes: tfSummary, sessionHours: s.sessionHours || '',
                __custom: true
            };
            // Compat: checklist legacy como strings "TF: desc [tags]"
            lists[s.id] = (s.signals || []).map(function (sg) {
                var tag = (sg.tags && sg.tags.length) ? ' [' + sg.tags.join(', ') + ']' : '';
                var sess = (sg.session && sg.session !== 'Todas') ? ' (' + sg.session + ')' : '';
                return (sg.timeframe ? sg.timeframe + ': ' : '') + sg.description + sess + tag;
            });
        });
    }

    /* ---------- selects + dashboard ---------- */
    function currentSelections() {
        var sel = {};
        SELECT_IDS.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) sel[id] = el.value;
        });
        return sel;
    }
    function populateSelects() {
        var list = getAll();
        var prev = currentSelections();
        SELECT_IDS.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            var isFilter = (id === 'filterStrategy');
            var keep = prev[id];
            el.innerHTML = '';
            if (isFilter) {
                var all = document.createElement('option');
                all.value = ''; all.textContent = '📋 Todas las estrategias';
                el.appendChild(all);
            }
            list.forEach(function (s) {
                var o = document.createElement('option');
                o.value = s.id;
                o.textContent = (s.emoji ? s.emoji + ' ' : '') + s.name;
                el.appendChild(o);
            });
            if (keep && list.some(function (s) { return s.id === keep; })) el.value = keep;
            else if (!isFilter && list.length) {
                if (!el.value) el.value = list[0].id;
            }
        });
    }

    function strategySubtitle(s) {
        var map = { 'regulares': 'Estrategia Principal', 'estructura-confluencia': 'Alta Precisión', 'ema-macd': 'Tendencia Fuerte', 'contra-tendencia': 'Reversión' };
        return map[s.id] || (s.sessionHours || s.description || 'Personalizada').toString().substring(0, 42);
    }

    function ensureDashboardCards() {
        var grid = document.querySelector('.strategy-stats') && document.querySelector('.strategy-stats').parentElement;
        if (!grid) return;
        var list = getAll();
        // Crear cards faltantes clonando la primera como plantilla
        var template = grid.querySelector('.strategy-stats');
        list.forEach(function (s) {
            var ex = grid.querySelector('.strategy-stats[data-strategy="' + s.id + '"]');
            var c = COLOR_MAP[s.color] || COLOR_MAP.blue;
            if (!ex && template) {
                var div = document.createElement('div');
                div.className = 'strategy-stats bg-gradient-to-br ' + c.grad + ' p-4 rounded-lg border ' + c.border + ' ' + c.hover + ' transition-all duration-200';
                div.setAttribute('data-strategy', s.id);
                div.innerHTML =
                    '<div class="flex items-center justify-between mb-3">' +
                    '<h4 class="font-semibold ' + c.text + ' text-sm sm:text-base flex items-center"><span class="text-lg mr-2">' + esc(s.emoji || '📌') + '</span><span class="strat-card-name">' + esc(s.name) + '</span></h4>' +
                    '<div class="w-2 h-2 ' + c.dot + ' rounded-full"></div></div>' +
                    '<div class="space-y-2">' +
                    '<div class="flex justify-between items-center text-xs sm:text-sm"><span class="text-gray-300">Win Rate:</span><span class="strategy-winrate font-bold">0%</span></div>' +
                    '<div class="flex justify-between items-center text-xs sm:text-sm"><span class="text-gray-300">P&L:</span><span class="strategy-pnl font-bold">$0</span></div>' +
                    '<div class="flex justify-between items-center text-xs sm:text-sm"><span class="text-gray-300">Trades:</span><span class="strategy-count font-bold text-gray-200">0</span></div></div>' +
                    '<div class="mt-3 pt-2 border-t ' + c.divider + '"><div class="text-xs text-gray-400 strat-card-sub">' + esc(strategySubtitle(s)) + '</div></div>';
                grid.appendChild(div);
            } else if (ex) {
                var nm = ex.querySelector('.strat-card-name') || ex.querySelector('h4');
                // Actualizar nombre visible si cambió (sin tocar WinRate/P&L/Trades)
                var nameEl = ex.querySelector('h4');
                if (nameEl && !ex.querySelector('.strat-card-name')) {
                    // card legacy: reemplaza solo texto del h4 preservando icono
                    var icon = (s.emoji || '📌') + ' ';
                    nameEl.innerHTML = '<span class="text-lg mr-2">' + esc(s.emoji || '📌') + '</span> ' + esc(s.name);
                } else if (nm && nm.classList.contains('strat-card-name')) {
                    nm.textContent = s.name;
                    var sub = ex.querySelector('.strat-card-sub');
                    if (sub) sub.textContent = strategySubtitle(s);
                }
            }
        });
        // Eliminar cards de estrategias borradas (no toca stats, solo DOM)
        Array.prototype.slice.call(grid.querySelectorAll('.strategy-stats')).forEach(function (card) {
            var id = card.getAttribute('data-strategy');
            if (!list.some(function (s) { return s.id === id; })) card.remove();
        });
    }

    /* ---------- render V2: checklist ---------- */
    function tagPills(sg) {
        var h = '';
        if (sg.timeframe) h += '<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 border border-blue-500/30 text-blue-200">⏱ ' + esc(sg.timeframe) + '</span>';
        if (sg.session && sg.session !== 'Todas') h += '<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-500/30 text-purple-200">🕐 ' + esc(sg.session) + '</span>';
        (sg.tags || []).forEach(function (t) {
            h += '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 border border-gray-600 text-gray-200">#' + esc(t) + '</span>';
        });
        return h ? '<div class="flex flex-wrap gap-1 mt-1">' + h + '</div>' : '';
    }

    function renderChecklistV2(strategy) {
        var container = document.getElementById('setupCheckerContent');
        if (!container) return;
        var s = getById(strategy);
        if (!s) {
            if (typeof window._legacyRenderDynamicChecklist === 'function') window._legacyRenderDynamicChecklist(strategy);
            return;
        }
        var cfgs = getGlobals('strategyConfigs') || {};
        var cfg = cfgs[strategy] || {};
        var signals = s.signals || [];
        if (!signals.length) {
            container.innerHTML = '<div class="space-y-4"><div class="flex justify-between items-center mb-2"><div><h4 class="text-lg font-semibold text-white">✅ ' + esc(s.name) + ' Verification</h4>' +
                '<p class="text-xs text-gray-400 mt-1">🕐 ' + esc(s.sessionHours || 'Sesión no definida') + '</p></div></div>' +
                '<div class="bg-yellow-900 bg-opacity-20 p-4 rounded-lg border border-yellow-500"><p class="text-yellow-400 text-sm">⚠️ Sin señales. Usa “+ Añadir señal”.</p></div>' +
                '<button onclick="StrategyStore.openSignalModal(\'' + esc(s.id) + '\')" class="w-full bg-green-700 hover:bg-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">+ Añadir primera señal</button></div>';
            return;
        }
        var html = '<div class="space-y-4"><div class="flex justify-between items-start gap-2 mb-2"><div class="min-w-0">' +
            '<h4 class="text-lg font-semibold text-white">✅ ' + esc(s.name) + ' Verification</h4>' +
            '<p class="text-xs text-gray-400 mt-1">🕐 ' + esc(s.sessionHours || '') + (s.description ? ' • ' + esc(s.description.substring(0, 90)) : '') + '</p></div>' +
            '<div class="flex space-x-2 flex-shrink-0"><button onclick="toggleAllCheckboxes(true)" class="text-xs px-3 py-1 bg-green-700 hover:bg-green-600 rounded transition-colors">Todo</button>' +
            '<button onclick="toggleAllCheckboxes(false)" class="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded transition-colors">Limpiar</button></div></div>' +
            '<div class="space-y-2 max-h-96 overflow-y-auto pr-2">';
        signals.forEach(function (sg) {
            html += '<div class="flex items-start space-x-3 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group">' +
                '<input type="checkbox" id="dynamic_check_' + esc(sg.id) + '" data-sig="' + esc(sg.id) + '" class="mt-0.5 rounded text-gold focus:ring-gold focus:ring-1 h-4 w-4 flex-shrink-0" onchange="updateDynamicSetupScore()">' +
                '<label for="dynamic_check_' + esc(sg.id) + '" class="text-sm flex-1 cursor-pointer hover:text-gold transition-colors leading-relaxed group-hover:text-gray-200">' +
                esc(sg.description) + tagPills(sg) + '</label>' +
                '<div class="flex flex-col gap-1 opacity-60 group-hover:opacity-100">' +
                '<button onclick="StrategyStore.openSignalModal(\'' + esc(s.id) + '\',\'' + esc(sg.id) + '\')" title="Editar señal" class="text-xs px-1.5 py-0.5 bg-blue-800 hover:bg-blue-700 rounded">✏️</button>' +
                '<button onclick="StrategyStore.deleteSignal(\'' + esc(s.id) + '\',\'' + esc(sg.id) + '\')" title="Eliminar señal" class="text-xs px-1.5 py-0.5 bg-red-900 hover:bg-red-800 rounded">🗑️</button>' +
                '</div></div>';
        });
        html += '</div><div class="flex gap-2"><button onclick="StrategyStore.openSignalModal(\'' + esc(s.id) + '\')" class="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">+ Añadir señal</button></div>' +
            '<div class="p-3 bg-gray-800/30 rounded-lg border-l-4 border-gold/50"><p class="text-xs text-gray-400">💡 <strong>Tip:</strong> Para ' + esc(s.name) +
            ', necesitas al menos 70% de los factores para ejecutar con seguridad.</p></div></div>';
        container.innerHTML = html;
    }

    /* ---------- render V2: template setup actual ---------- */
    function pasosHTML(lado, obj) {
        var h = '<div class="' + (lado === 'compra' ? 'bg-green-900 bg-opacity-20 p-4 rounded-lg border border-green-500' : 'bg-red-900 bg-opacity-20 p-4 rounded-lg border border-red-500') + '">';
        h += '<h5 class="font-semibold ' + (lado === 'compra' ? 'text-green-400' : 'text-red-400') + ' mb-3">' + esc(obj.titulo || (lado === 'compra' ? '🟢 COMPRAS' : '🔴 VENTAS')) + '</h5><div class="space-y-3 text-sm">';
        (obj.pasos || []).forEach(function (p) {
            h += '<div><h6 class="font-medium ' + (lado === 'compra' ? 'text-green-300' : 'text-red-300') + '">' + esc(p.titulo) + '</h6><ul class="mt-1 space-y-1 text-xs">';
            (p.items || []).forEach(function (it) { h += '<li>• ' + esc(it) + '</li>'; });
            h += '</ul></div>';
        });
        return h + '</div></div>';
    }
    function renderTemplateV2(strategy) {
        var container = document.getElementById('strategyTemplateDisplay');
        if (!container) return;
        var s = getById(strategy);
        if (!s || !s.template) {
            if (typeof window._legacyDisplayStrategyTemplate === 'function') window._legacyDisplayStrategyTemplate(strategy);
            return;
        }
        var t = s.template;
        var h = '<div class="text-sm"><div class="flex items-start justify-between gap-2 mb-3"><div><h4 class="text-lg font-semibold text-gold">' + esc((s.emoji ? s.emoji + ' ' : '') + s.name) + '</h4>' +
            (s.description ? '<p class="text-xs text-gray-400 mt-1">' + esc(s.description) + '</p>' : '') +
            (s.sessionHours ? '<p class="text-xs text-gray-400 mt-1">🕐 ' + esc(s.sessionHours) + '</p>' : '') + '</div>' +
            '<button onclick="StrategyStore.openStrategyModal(\'' + esc(s.id) + '\')" class="flex-shrink-0 text-xs px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded transition-colors" title="Editar estrategia y setup">✏️ Editar</button></div>';
        if ((t.invalidacion || []).length) {
            h += '<div class="mb-4 bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-500"><h5 class="font-semibold text-red-400 mb-2 text-sm">🚫 INVALIDACIÓN INMEDIATA:</h5><ul class="text-xs space-y-1">';
            t.invalidacion.forEach(function (x) { h += '<li>• ' + esc(x) + '</li>'; });
            h += '</ul></div>';
        }
        h += '<div class="grid grid-cols-1 gap-4">' + pasosHTML('compra', t.compras || { titulo: '🟢 COMPRAS', pasos: [] }) + pasosHTML('venta', t.ventas || { titulo: '🔴 VENTAS', pasos: [] }) + '</div>';
        if ((t.confluencias || []).length) {
            h += '<div class="mt-4 bg-purple-900 bg-opacity-20 p-3 rounded-lg border border-purple-400"><h5 class="font-semibold text-purple-400 mb-2">⚡ CONFLUENCIAS DE ALTA PROBABILIDAD:</h5><ul class="text-xs space-y-1">';
            t.confluencias.forEach(function (x) { h += '<li>• ' + esc(x) + '</li>'; });
            h += '</ul></div>';
        }
        if (t.entrada) h += '<div class="mt-4 bg-blue-900 bg-opacity-20 p-3 rounded-lg border border-blue-400"><p class="text-sm"><strong>ENTRADA:</strong> ' + esc(t.entrada) + '</p></div>';
        container.innerHTML = h + '</div>';
    }

    /* ---------- refresh global ---------- */
    function refreshAll(keepSelection) {
        syncGlobals();
        populateSelects();
        ensureDashboardCards();
        try {
            if (typeof updateStrategyDisplay === 'function') updateStrategyDisplay();
            else if (typeof window.updateStrategyDisplay === 'function') window.updateStrategyDisplay();
        } catch (e) { /* noop */ }
        try {
            var sel = document.getElementById('signalStrategySelect');
            if (sel && sel.value) {
                renderChecklistV2(sel.value);
                renderTemplateV2(sel.value);
                if (typeof updateDynamicSetupScore === 'function') updateDynamicSetupScore();
                else if (typeof window.updateDynamicSetupScore === 'function') window.updateDynamicSetupScore();
            }
        } catch (e) { /* noop */ }
        try {
            if (typeof renderTrades === 'function') renderTrades();
            else if (typeof window.renderTrades === 'function') window.renderTrades();
        } catch (e) { /* noop */ }
    }

    /* ---------- CRUD estrategias ---------- */
    function saveStrategy(formData, editingId) {
        var list = getAll();
        if (editingId) {
            for (var i = 0; i < list.length; i++) if (list[i].id === editingId) {
                list[i].name = formData.name; list[i].emoji = formData.emoji; list[i].color = formData.color;
                list[i].description = formData.description; list[i].sessionHours = formData.sessionHours;
                list[i].params = formData.params; list[i].template = formData.template;
                break;
            }
        } else {
            var id = slugify(formData.name);
            var n = 1, base = id;
            while (list.some(function (s) { return s.id === id; })) { id = base + '-' + (++n); }
            list.push({ id: id, name: formData.name, emoji: formData.emoji, color: formData.color, description: formData.description, sessionHours: formData.sessionHours, params: formData.params, signals: [], template: formData.template });
            editingId = id;
        }
        persist(list);
        refreshAll();
        return editingId;
    }
    function deleteStrategy(id) {
        var list = getAll();
        var s = null; list.forEach(function (x) { if (x.id === id) s = x; });
        if (!s) return;
        var trades = getGlobals('trades') || [];
        var used = 0;
        try { used = trades.filter(function (t) { return t && t.strategy === id; }).length; } catch (e) {}
        if (used > 0) { alert('⛔ No se puede eliminar "' + s.name + '": tiene ' + used + ' trades registrados. Reasigna esos trades a otra estrategia primero.'); return; }
        if (list.length <= 1) { alert('⛔ Debe existir al menos 1 estrategia.'); return; }
        if (!confirm('¿Eliminar la estrategia "' + s.name + '" y sus ' + (s.signals || []).length + ' señales?')) return;
        persist(list.filter(function (x) { return x.id !== id; }));
        try { localStorage.removeItem('trading_setupState'); } catch (e) {}
        refreshAll();
    }

    /* ---------- CRUD señales ---------- */
    function saveSignal(strategyId, signalId, data) {
        var list = getAll();
        for (var i = 0; i < list.length; i++) if (list[i].id === strategyId) {
            list[i].signals = list[i].signals || [];
            if (signalId) {
                list[i].signals.forEach(function (sg) {
                    if (sg.id === signalId) { sg.description = data.description; sg.timeframe = data.timeframe; sg.session = data.session; sg.tags = data.tags; }
                });
            } else {
                list[i].signals.push({ id: uid('sig'), description: data.description, timeframe: data.timeframe, session: data.session, tags: data.tags });
            }
            break;
        }
        persist(list);
        refreshAll();
    }
    function deleteSignal(strategyId, signalId) {
        if (!confirm('¿Eliminar esta señal?')) return;
        var list = getAll();
        for (var i = 0; i < list.length; i++) if (list[i].id === strategyId) {
            list[i].signals = (list[i].signals || []).filter(function (sg) { return sg.id !== signalId; });
            break;
        }
        persist(list);
        refreshAll();
    }

    /* ---------- export / import JSON (respaldo) ---------- */
    function normalizeSignal(sg) {
        var tags = Array.isArray(sg.tags) ? sg.tags.map(function (t) { return String(t).trim(); }).filter(Boolean).slice(0, 8) : [];
        return {
            id: String(sg.id || uid('sig')),
            description: String(sg.description || '').trim(),
            timeframe: String(sg.timeframe || 'Multiple TF').substring(0, 20),
            session: String(sg.session || 'Todas').substring(0, 40),
            tags: tags
        };
    }
    function normalizeStrategy(s) {
        var p = s.params || {};
        var t = s.template || {};
        return {
            id: String(s.id || slugify(s.name)),
            name: String(s.name || 'Sin título').substring(0, 60),
            emoji: String(s.emoji || '📌').substring(0, 4),
            color: COLOR_MAP[s.color] ? s.color : 'blue',
            description: String(s.description || '').substring(0, 300),
            sessionHours: String(s.sessionHours || '').substring(0, 80),
            params: {
                winRate: num(p.winRate, 60), rrRatio: num(p.rrRatio, 2),
                stopLoss: Math.max(0.5, num(p.stopLoss, 6)),
                takeProfit1: num(p.takeProfit1, 12), takeProfit2: num(p.takeProfit2, 20),
                riskPercent: num(p.riskPercent, 2.5),
                minRisk: num(p.minRisk, 2), maxRisk: num(p.maxRisk, 5)
            },
            signals: Array.isArray(s.signals) ? s.signals.map(normalizeSignal).filter(function (sg) { return sg.description; }) : [],
            template: {
                invalidacion: Array.isArray(t.invalidacion) ? t.invalidacion.map(String) : [],
                confluencias: Array.isArray(t.confluencias) ? t.confluencias.map(String) : [],
                entrada: String(t.entrada || ''),
                compras: { titulo: String((t.compras && t.compras.titulo) || '🟢 SETUP COMPRAS'), pasos: Array.isArray(t.compras && t.compras.pasos) ? t.compras.pasos : [] },
                ventas: { titulo: String((t.ventas && t.ventas.titulo) || '🔴 SETUP VENTAS'), pasos: Array.isArray(t.ventas && t.ventas.pasos) ? t.ventas.pasos : [] }
            }
        };
    }
    function exportStrategies() {
        try {
            var list = getAll();
            var payload = { app: 'Gestion_riesgo_trade', kind: 'strategies-backup', version: STORE_VERSION, exportedAt: new Date().toISOString(), strategies: list };
            var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            var a = document.createElement('a');
            var d = new Date();
            var stamp = d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
            a.href = URL.createObjectURL(blob);
            a.download = 'estrategias-backup-' + stamp + '.json';
            document.body.appendChild(a); a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        } catch (e) { alert('No se pudo exportar: ' + e.message); }
    }
    function importStrategiesFile(file) {
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var data = JSON.parse(reader.result);
                var arr = Array.isArray(data) ? data : data.strategies;
                if (!Array.isArray(arr) || !arr.length) throw new Error('formato inválido');
                var norm = arr.map(normalizeStrategy).filter(function (s) { return s.name && s.id; });
                if (!norm.length) throw new Error('sin estrategias válidas');
                // IDs únicos
                var seen = {};
                norm.forEach(function (s, i) {
                    var base = s.id, n = 1;
                    while (seen[s.id]) { s.id = base + '-' + (++n); }
                    seen[s.id] = 1;
                    var sn = {};
                    (s.signals || []).forEach(function (sg) {
                        var b = sg.id; var k = 1;
                        while (sn[sg.id]) { sg.id = b + '-' + (++k); }
                        sn[sg.id] = 1;
                    });
                });
                if (!confirm('Importar ' + norm.length + ' estrategia(s)? Se reemplazarán las actuales (tus trades no se tocan).')) return;
                persist(norm);
                try { localStorage.removeItem('trading_setupState'); } catch (e) {}
                refreshAll();
                alert('✅ ' + norm.length + ' estrategia(s) importadas.');
            } catch (e) { alert('❌ Archivo inválido: ' + e.message); }
        };
        reader.readAsText(file);
    }

    /* ---------- modales ---------- */
    function showModal(id) {
        var m = document.getElementById(id);
        if (!m) return;
        m.classList.remove('hidden'); m.classList.add('flex');
    }
    function hideModal(id) {
        var m = document.getElementById(id);
        if (!m) return;
        m.classList.add('hidden'); m.classList.remove('flex');
    }

    function pasoRow(paso) {
        paso = paso || { titulo: '', items: [] };
        var wrap = document.createElement('div');
        wrap.className = 'paso-row bg-gray-800/60 p-2 rounded-lg border border-gray-700 space-y-1';
        wrap.innerHTML = '<div class="flex gap-1"><input type="text" class="paso-titulo flex-1 p-1.5 bg-gray-900 border border-gray-600 rounded text-white text-xs" placeholder="Título del paso (ej: PASO 1 - Contexto 4H/1H)" value="' + esc(paso.titulo || '') + '">' +
            '<button type="button" class="paso-del text-xs px-2 py-1 bg-red-900 hover:bg-red-800 rounded" title="Quitar paso">✕</button></div>' +
            '<textarea class="paso-items w-full p-1.5 bg-gray-900 border border-gray-600 rounded text-white text-xs" rows="2" placeholder="Un ítem por línea">' + esc((paso.items || []).join('\n')) + '</textarea>';
        wrap.querySelector('.paso-del').addEventListener('click', function () { wrap.remove(); });
        return wrap;
    }
    function fillPasos(containerId, pasos) {
        var c = document.getElementById(containerId);
        if (!c) return;
        c.innerHTML = '';
        (pasos || []).forEach(function (p) { c.appendChild(pasoRow(p)); });
        if (!(pasos || []).length) c.appendChild(pasoRow(null));
    }
    function collectPasos(containerId) {
        var c = document.getElementById(containerId);
        var out = [];
        if (!c) return out;
        Array.prototype.forEach.call(c.querySelectorAll('.paso-row'), function (row) {
            var t = row.querySelector('.paso-titulo').value.trim();
            var items = row.querySelector('.paso-items').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
            if (t || items.length) out.push({ titulo: t || 'Paso', items: items });
        });
        return out;
    }

    function openStrategyModal(id) {
        var s = id ? getById(id) : null;
        document.getElementById('strategyModalTitle').textContent = s ? '✏️ Editar estrategia' : '➕ Nueva estrategia';
        document.getElementById('editingStrategyId').value = s ? s.id : '';
        document.getElementById('strategyName').value = s ? s.name : '';
        document.getElementById('strategyEmoji').value = s ? (s.emoji || '📌') : '📌';
        document.getElementById('strategyColor').value = s ? (s.color || 'blue') : 'blue';
        document.getElementById('strategyDescription').value = s ? (s.description || '') : '';
        document.getElementById('strategySession').value = s ? (s.sessionHours || '') : '';
        var p = (s && s.params) || {};
        document.getElementById('strategyWinRate').value = p.winRate != null ? p.winRate : 60;
        document.getElementById('strategyRR').value = p.rrRatio != null ? p.rrRatio : 2;
        document.getElementById('strategySL').value = p.stopLoss != null ? p.stopLoss : 6;
        document.getElementById('strategyTP1').value = p.takeProfit1 != null ? p.takeProfit1 : 12;
        document.getElementById('strategyTP2').value = p.takeProfit2 != null ? p.takeProfit2 : 20;
        document.getElementById('strategyRisk').value = p.riskPercent != null ? p.riskPercent : 2.5;
        document.getElementById('strategyMinRisk').value = p.minRisk != null ? p.minRisk : 2;
        document.getElementById('strategyMaxRisk').value = p.maxRisk != null ? p.maxRisk : 5;
        var t = (s && s.template) || emptyTemplate();
        document.getElementById('strategyInvalidacion').value = (t.invalidacion || []).join('\n');
        document.getElementById('strategyConfluencias').value = (t.confluencias || []).join('\n');
        document.getElementById('strategyEntrada').value = t.entrada || '';
        document.getElementById('strategyComprasTitulo').value = (t.compras && t.compras.titulo) || '🟢 SETUP COMPRAS';
        document.getElementById('strategyVentasTitulo').value = (t.ventas && t.ventas.titulo) || '🔴 SETUP VENTAS';
        fillPasos('comprasPasos', t.compras && t.compras.pasos);
        fillPasos('ventasPasos', t.ventas && t.ventas.pasos);
        var del = document.getElementById('deleteStrategyBtn');
        if (del) del.style.display = s ? '' : 'none';
        showModal('strategyModal');
    }

    function submitStrategyForm(e) {
        if (e) e.preventDefault();
        var editingId = document.getElementById('editingStrategyId').value || null;
        var name = document.getElementById('strategyName').value.trim();
        if (!name) { alert('El título de la estrategia es obligatorio.'); return; }
        var data = {
            name: name,
            emoji: document.getElementById('strategyEmoji').value.trim() || '📌',
            color: document.getElementById('strategyColor').value || 'blue',
            description: document.getElementById('strategyDescription').value.trim(),
            sessionHours: document.getElementById('strategySession').value.trim(),
            params: {
                winRate: num(document.getElementById('strategyWinRate').value, 60),
                rrRatio: num(document.getElementById('strategyRR').value, 2),
                stopLoss: num(document.getElementById('strategySL').value, 6),
                takeProfit1: num(document.getElementById('strategyTP1').value, 12),
                takeProfit2: num(document.getElementById('strategyTP2').value, 20),
                riskPercent: num(document.getElementById('strategyRisk').value, 2.5),
                minRisk: num(document.getElementById('strategyMinRisk').value, 2),
                maxRisk: num(document.getElementById('strategyMaxRisk').value, 5)
            },
            template: {
                invalidacion: document.getElementById('strategyInvalidacion').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean),
                confluencias: document.getElementById('strategyConfluencias').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean),
                entrada: document.getElementById('strategyEntrada').value.trim(),
                compras: { titulo: document.getElementById('strategyComprasTitulo').value.trim() || '🟢 COMPRAS', pasos: collectPasos('comprasPasos') },
                ventas: { titulo: document.getElementById('strategyVentasTitulo').value.trim() || '🔴 VENTAS', pasos: collectPasos('ventasPasos') }
            }
        };
        if (data.params.stopLoss <= 0) { alert('Stop Loss debe ser mayor a 0.'); return; }
        var newId = saveStrategy(data, editingId);
        hideModal('strategyModal');
        var sel = document.getElementById('signalStrategySelect');
        if (sel) { sel.value = newId; refreshAll(); sel.value = newId; }
    }

    function openSignalModal(strategyId, signalId) {
        var s = getById(strategyId);
        if (!s) return;
        var sg = null;
        (s.signals || []).forEach(function (x) { if (x.id === signalId) sg = x; });
        document.getElementById('signalModalTitle').textContent = sg ? '✏️ Editar señal' : '➕ Nueva señal en ' + s.name;
        document.getElementById('editingSignalStrategy').value = strategyId;
        document.getElementById('editingSignalId').value = sg ? sg.id : '';
        document.getElementById('signalDescription').value = sg ? sg.description : '';
        document.getElementById('signalTimeframe').value = sg ? (sg.timeframe || '') : '';
        document.getElementById('signalSession').value = sg ? (sg.session || 'Todas') : 'Todas';
        document.getElementById('signalTags').value = sg ? (sg.tags || []).join(', ') : '';
        showModal('signalModal');
        setTimeout(function () { var d = document.getElementById('signalDescription'); if (d) d.focus(); }, 100);
    }

    function submitSignalForm(e) {
        if (e) e.preventDefault();
        var strategyId = document.getElementById('editingSignalStrategy').value;
        var signalId = document.getElementById('editingSignalId').value || null;
        var desc = document.getElementById('signalDescription').value.trim();
        if (!desc) { alert('La descripción de la señal es obligatoria.'); return; }
        var tf = document.getElementById('signalTimeframe').value.trim() || 'Multiple TF';
        var sess = document.getElementById('signalSession').value.trim() || 'Todas';
        var tags = document.getElementById('signalTags').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 8);
        saveSignal(strategyId, signalId, { description: desc, timeframe: tf, session: sess, tags: tags });
        hideModal('signalModal');
    }

    /* ---------- estado setup (id-based, compatible) ---------- */
    function saveSetupStateV2() {
        try {
            var sel = document.getElementById('signalStrategySelect');
            var strategy = sel ? sel.value : 'regulares';
            var boxes = document.querySelectorAll('input[id^="dynamic_check_"]');
            var map = {}, order = [];
            Array.prototype.forEach.call(boxes, function (cb) {
                var id = cb.getAttribute('data-sig') || cb.id.replace('dynamic_check_', '');
                map[id] = cb.checked; order.push(id);
            });
            localStorage.setItem('trading_setupState', JSON.stringify({ strategy: strategy, map: map, order: order, checkboxes: order.map(function (k) { return map[k]; }), timestamp: Date.now() }));
        } catch (e) { /* noop */ }
    }
    function restoreSetupStateV2() {
        try {
            var raw = localStorage.getItem('trading_setupState');
            if (!raw) return;
            var state = JSON.parse(raw);
            if (Date.now() - (state.timestamp || 0) > 7200000) return;
            var boxes = document.querySelectorAll('input[id^="dynamic_check_"]');
            Array.prototype.forEach.call(boxes, function (cb, idx) {
                var id = cb.getAttribute('data-sig') || cb.id.replace('dynamic_check_', '');
                if (state.map && state.map[id] !== undefined) cb.checked = !!state.map[id];
                else if (state.checkboxes && state.checkboxes[idx] !== undefined) cb.checked = !!state.checkboxes[idx];
            });
            setTimeout(function () {
                if (typeof window.updateDynamicSetupScore === 'function') window.updateDynamicSetupScore();
            }, 100);
        } catch (e) { /* noop */ }
    }

    /* ---------- init ---------- */
    function bindUI() {
        var f1 = document.getElementById('strategyForm');
        if (f1 && !f1.dataset.bound) { f1.dataset.bound = '1'; f1.addEventListener('submit', submitStrategyForm); }
        var f2 = document.getElementById('signalForm');
        if (f2 && !f2.dataset.bound) { f2.dataset.bound = '1'; f2.addEventListener('submit', submitSignalForm); }
        [['newStrategyBtn', function () { openStrategyModal(null); }],
         ['exportStrategiesBtn', function () { exportStrategies(); }],
         ['importStrategiesBtn', function () { var f = document.getElementById('importStrategiesFile'); if (f) f.click(); }],
         ['editStrategyBtn', function () { var sel = document.getElementById('signalStrategySelect'); openStrategyModal(sel ? sel.value : null); }],
         ['editSetupBtn', function () { var sel = document.getElementById('signalStrategySelect'); openStrategyModal(sel ? sel.value : null); }],
         ['cancelStrategyBtn', function () { hideModal('strategyModal'); }],
         ['cancelSignalBtn', function () { hideModal('signalModal'); }],
         ['addCompraPasoBtn', function () { document.getElementById('comprasPasos').appendChild(pasoRow(null)); }],
         ['addVentaPasoBtn', function () { document.getElementById('ventasPasos').appendChild(pasoRow(null)); }]
        ].forEach(function (pair) {
            var el = document.getElementById(pair[0]);
            if (el && !el.dataset.bound) { el.dataset.bound = '1'; el.addEventListener('click', pair[1]); }
        });
        var imp = document.getElementById('importStrategiesFile');
        if (imp && !imp.dataset.bound) {
            imp.dataset.bound = '1';
            imp.addEventListener('change', function () {
                if (imp.files && imp.files[0]) importStrategiesFile(imp.files[0]);
                imp.value = '';
            });
        }
        var del = document.getElementById('deleteStrategyBtn');
        if (del && !del.dataset.bound) {
            del.dataset.bound = '1';
            del.addEventListener('click', function () {
                var id = document.getElementById('editingStrategyId').value;
                if (id) { deleteStrategy(id); hideModal('strategyModal'); }
            });
        }
        // Cerrar clic fuera
        ['strategyModal', 'signalModal'].forEach(function (id) {
            var m = document.getElementById(id);
            if (m && !m.dataset.outbound) {
                m.dataset.outbound = '1';
                m.addEventListener('click', function (e) { if (e.target === m) hideModal(id); });
            }
        });
    }

    function patchLegacy() {
        try {
            if (typeof window.renderDynamicChecklist === 'function' && !window._legacyRenderDynamicChecklist) {
                window._legacyRenderDynamicChecklist = window.renderDynamicChecklist;
            }
            if (typeof window.displayStrategyTemplate === 'function' && !window._legacyDisplayStrategyTemplate) {
                window._legacyDisplayStrategyTemplate = window.displayStrategyTemplate;
            }
            if (typeof window.saveSetupState === 'function' && !window._legacySaveSetupState) {
                window._legacySaveSetupState = window.saveSetupState;
            }
            window.renderDynamicChecklist = renderChecklistV2;
            window.displayStrategyTemplate = renderTemplateV2;
            window.saveSetupState = saveSetupStateV2;
            window.restoreSetupState = restoreSetupStateV2;
            // aliases bare (mismo entorno global)
            // eslint-disable-next-line no-global-assign
            try { renderDynamicChecklist = renderChecklistV2; } catch (e) {}
            try { displayStrategyTemplate = renderTemplateV2; } catch (e) {}
            try { saveSetupState = saveSetupStateV2; } catch (e) {}
            try { restoreSetupState = restoreSetupStateV2; } catch (e) {}
        } catch (e) { console.warn('StrategyStore patch:', e); }
    }

    function init() {
        syncGlobals();
        populateSelects();
        ensureDashboardCards();
        patchLegacy();
        bindUI();
        // Re-render con datos enriquecidos si el tab signals está activo
        try {
            var sel = document.getElementById('signalStrategySelect');
            if (sel && sel.value && document.getElementById('setupCheckerContent')) {
                renderChecklistV2(sel.value);
                renderTemplateV2(sel.value);
            }
        } catch (e) { /* noop */ }
        // Re-observar: si firebase-app repuebla después, re-aplicar
        setTimeout(function () { populateSelects(); ensureDashboardCards(); bindUI(); }, 800);
        setTimeout(function () { populateSelects(); ensureDashboardCards(); }, 2500);
    }

    window.StrategyStore = {
        getAll: getAll, getById: getById, refreshAll: refreshAll,
        openStrategyModal: openStrategyModal, openSignalModal: openSignalModal,
        deleteStrategy: deleteStrategy, deleteSignal: deleteSignal,
        exportStrategies: exportStrategies, importStrategiesFile: importStrategiesFile,
        syncGlobals: syncGlobals, populateSelects: populateSelects,
        TF_SUGGESTIONS: TF_SUGGESTIONS
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else setTimeout(init, 0);
})();
