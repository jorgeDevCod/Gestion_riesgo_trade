// Swipe Navigation System - Versión Optimizada Final
class SwipeNavigation {
    constructor( containerSelector, tabsSelector ) {
        this.container = document.querySelector( containerSelector );
        this.tabs = document.querySelectorAll( tabsSelector );

        // Encontrar el índice del tab activo inicial
        this.currentTab = 0;
        this.tabs.forEach( ( tab, index ) => {
            if ( tab.getAttribute( 'data-tab' ) === 'signals' ) {
                this.currentTab = index;
            }
        } );

        // Touch tracking
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.isMouseDown = false;
        this.startTime = 0;
        this.scrollLocked = false;
        this.scrollDirection = null;

        // Configuración
        this.threshold = 100;
        this.allowedTime = 500;
        this.verticalThreshold = 15;

        this.init();
    }

    init() {
        this.updateCurrentTab();
        this.attachEventListeners();
        this.setupScrollableAreas();

        this.container.style.userSelect = 'none';
        this.container.style.webkitUserSelect = 'none';
        this.container.style.cursor = 'grab';
    }

    setupScrollableAreas() {
        // Identificar TODAS las áreas con scroll interno
        this.scrollableSelectors = [
            '.overflow-x-auto',
            '.overflow-y-auto',
            '[id$="Content"]',
            '#tradesTableBody',
            '#setupCheckerContent',
            '#observationsList',
            '#recentWithdrawals',
            '.max-h-64',
            '.max-h-96',
            '.max-h-screen',
            'table',
            '.overflow-auto'
        ];
    }

    attachEventListeners() {
        // Touch events
        this.container.addEventListener( 'touchstart', ( e ) => this.handleStart( e ), { passive: true } );
        this.container.addEventListener( 'touchmove', ( e ) => this.handleMove( e ), { passive: false } );
        this.container.addEventListener( 'touchend', ( e ) => this.handleEnd( e ), { passive: true } );

        // Mouse events
        this.container.addEventListener( 'mousedown', ( e ) => this.handleStart( e ) );
        this.container.addEventListener( 'mousemove', ( e ) => this.handleMove( e ) );
        this.container.addEventListener( 'mouseup', ( e ) => this.handleEnd( e ) );
        this.container.addEventListener( 'mouseleave', ( e ) => this.handleEnd( e ) );

        // Prevenir clicks durante drag
        this.container.addEventListener( 'click', ( e ) => {
            if ( this.isDragging ) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true );

        // Observer para tabs activos
        this.observeTabChanges();
    }

    observeTabChanges() {
        const observer = new MutationObserver( () => {
            this.updateCurrentTab();
        } );

        this.tabs.forEach( tab => {
            observer.observe( tab, { attributes: true, attributeFilter: [ 'class' ] } );
        } );
    }

    updateCurrentTab() {
        this.tabs.forEach( ( tab, index ) => {
            if ( tab.classList.contains( 'border-gold' ) || tab.classList.contains( 'text-gold' ) ) {
                this.currentTab = index;
            }
        } );
    }

    isScrollableElement( element ) {
        let el = element;
        while ( el && el !== this.container && el !== document.body ) {
            const computedStyle = window.getComputedStyle( el );
            const hasScrollX = el.scrollWidth > el.clientWidth;
            const hasScrollY = el.scrollHeight > el.clientHeight;
            const overflowX = computedStyle.overflowX;
            const overflowY = computedStyle.overflowY;

            // Verificar si tiene scroll activo
            if ( hasScrollY && ( overflowY === 'auto' || overflowY === 'scroll' ) ) {
                return true;
            }

            if ( hasScrollX && ( overflowX === 'auto' || overflowX === 'scroll' ) ) {
                return true;
            }

            // 🆕 VERIFICAR SI ES LA TABLA DE TRADES O SU CONTENEDOR
            if ( el.tagName === 'TABLE' ||
                el.tagName === 'TBODY' ||
                el.id === 'tradesTableBody' ||
                el.classList.contains( 'overflow-x-auto' ) ||
                el.classList.contains( 'overflow-y-auto' ) ) {
                return true;
            }

            // Verificar selectores conocidos
            const matchesSelector = this.scrollableSelectors.some( selector => {
                try {
                    return el.matches( selector );
                } catch ( e ) {
                    return false;
                }
            } );

            if ( matchesSelector ) {
                return true;
            }

            el = el.parentElement;
        }
        return false;
    }

    isFixedElement( element ) {
        let el = element;
        while ( el && el !== document.body ) {
            const position = window.getComputedStyle( el ).position;
            if ( position === 'fixed' ) return true;

            const fixedIds = [
                'confluenceToggle',
                'confluencePanel',
                'installAppContainer',
                'userSection',
                'syncStatus',
                'swipeIndicator',
                'swipe-direction-indicator'
            ];
            if ( fixedIds.includes( el.id ) ) return true;

            // Elementos interactivos
            if ( el.tagName === 'BUTTON' ||
                el.tagName === 'A' ||
                el.tagName === 'INPUT' ||
                el.tagName === 'SELECT' ||
                el.tagName === 'TEXTAREA' ) {
                return true;
            }

            el = el.parentElement;
        }
        return false;
    }

    handleStart( e ) {
        if ( this.isFixedElement( e.target ) ) return;

        const point = e.touches ? e.touches[ 0 ] : e;
        this.startX = point.pageX;
        this.startY = point.pageY;
        this.currentX = point.pageX;
        this.currentY = point.pageY;
        this.startTime = new Date().getTime();
        this.isDragging = false;
        this.scrollLocked = false;
        this.scrollDirection = null;

        if ( !e.touches ) {
            this.isMouseDown = true;
            this.container.style.cursor = 'grabbing';
        }
    }

    handleMove( e ) {
        if ( this.isFixedElement( e.target ) ) return;
        if ( e.touches && !e.touches[ 0 ] ) return;
        if ( !e.touches && !this.isMouseDown ) return;

        const point = e.touches ? e.touches[ 0 ] : e;
        this.currentX = point.pageX;
        this.currentY = point.pageY;

        const diffX = Math.abs( this.currentX - this.startX );
        const diffY = Math.abs( this.currentY - this.startY );

        // Determinar dirección solo una vez
        if ( !this.scrollDirection && ( diffX > 10 || diffY > 10 ) ) {
            this.scrollDirection = diffY > diffX ? 'vertical' : 'horizontal';

            // Si es vertical Y está en elemento scrolleable, bloquear swipe
            if ( this.scrollDirection === 'vertical' && this.isScrollableElement( e.target ) ) {
                this.scrollLocked = true;
                return;
            }
        }

        // Si está bloqueado por scroll vertical, salir
        if ( this.scrollLocked ) return;

        // Solo proceder si es horizontal
        if ( this.scrollDirection === 'horizontal' && diffX > 15 ) {
            this.isDragging = true;
            if ( e.cancelable ) {
                e.preventDefault();
            }

            const diffXSigned = this.currentX - this.startX;
            this.showPreview( diffXSigned );
        }
    }

    showPreview( diffX ) {
        const direction = diffX < 0 ? 'left' : 'right';
        const targetIndex = direction === 'left' ?
            Math.min( this.currentTab + 1, this.tabs.length - 1 ) :
            Math.max( this.currentTab - 1, 0 );

        // Resistencia si no hay tab siguiente/anterior
        if ( targetIndex === this.currentTab ) {
            const resistance = Math.sign( diffX ) * Math.pow( Math.abs( diffX ), 0.7 ) * 0.3;
            this.applyTransform( resistance );
            return;
        }

        // Limitar deslizamiento
        const maxSlide = window.innerWidth * 0.85;
        const limitedDiff = Math.sign( diffX ) * Math.min( Math.abs( diffX ), maxSlide );

        this.applyTransform( limitedDiff );
    }

    applyTransform( diffX ) {
        const currentSection = document.querySelector( '.tab-content:not(.hidden)' );
        if ( !currentSection ) return;

        // Aplicar transformación
        currentSection.style.transition = 'none';
        currentSection.style.transform = `translateX(${diffX}px)`;

        // Opacidad progresiva
        const opacity = 1 - Math.abs( diffX ) / ( window.innerWidth * 0.5 );
        currentSection.style.opacity = Math.max( 0.3, Math.min( 1, opacity ) );

        // Indicador visual
        const progress = Math.abs( diffX ) / this.threshold;
        if ( progress > 0.3 ) {
            this.showSwipeIndicator( diffX < 0 ? 'next' : 'prev', progress );
        } else {
            this.hideSwipeIndicator();
        }
    }

    showSwipeIndicator( direction, progress ) {
        let indicator = document.getElementById( 'swipe-direction-indicator' );
        if ( !indicator ) {
            indicator = document.createElement( 'div' );
            indicator.id = 'swipe-direction-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(245, 158, 11, 0.9);
                color: white;
                padding: 15px 25px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 14px;
                z-index: 9997;
                pointer-events: none;
                transition: opacity 0.2s;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            `;
            document.body.appendChild( indicator );
        }

        const targetTab = this.tabs[ direction === 'next' ?
            Math.min( this.currentTab + 1, this.tabs.length - 1 ) :
            Math.max( this.currentTab - 1, 0 ) ];

        const tabName = targetTab ? targetTab.textContent.trim() : '';
        const arrow = direction === 'next' ? '→' : '←';

        indicator.textContent = `${arrow} ${tabName}`;
        indicator.style.opacity = Math.min( progress, 1 );
        indicator.style.left = direction === 'next' ? 'auto' : '20px';
        indicator.style.right = direction === 'next' ? '20px' : 'auto';
    }

    hideSwipeIndicator() {
        const indicator = document.getElementById( 'swipe-direction-indicator' );
        if ( indicator ) {
            indicator.style.opacity = '0';
        }
    }

    handleEnd( e ) {
        if ( this.isFixedElement( e.target ) ) return;

        const endX = this.currentX;
        const diffX = endX - this.startX;
        const elapsedTime = new Date().getTime() - this.startTime;

        // Resetear transformación
        const currentSection = document.querySelector( '.tab-content:not(.hidden)' );
        if ( currentSection ) {
            currentSection.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            currentSection.style.transform = 'translateX(0)';
            currentSection.style.opacity = '1';

            setTimeout( () => {
                currentSection.style.transition = '';
                currentSection.style.transform = '';
                currentSection.style.opacity = '';
            }, 300 );
        }

        this.hideSwipeIndicator();

        if ( this.isDragging && !this.scrollLocked ) {
            this.processSwipe( diffX, elapsedTime );
        }

        this.isDragging = false;
        this.isMouseDown = false;
        this.scrollLocked = false;
        this.scrollDirection = null;
        this.container.style.cursor = 'grab';
    }

    processSwipe( diffX, elapsedTime ) {
        const velocity = Math.abs( diffX ) / elapsedTime;
        const isQuickSwipe = velocity > 0.5 && Math.abs( diffX ) > 40;
        const isLongSwipe = Math.abs( diffX ) >= this.threshold;

        if ( !isQuickSwipe && !isLongSwipe ) return;

        let newIndex = this.currentTab;

        if ( diffX < 0 && this.currentTab < this.tabs.length - 1 ) {
            newIndex = this.currentTab + 1;
        } else if ( diffX > 0 && this.currentTab > 0 ) {
            newIndex = this.currentTab - 1;
        }

        if ( newIndex !== this.currentTab ) {
            this.switchToTab( newIndex, diffX < 0 ? 'left' : 'right' );
        }
    }

    switchToTab( index, direction ) {
        const targetTab = this.tabs[ index ];
        if ( !targetTab ) return;

        const currentSection = document.querySelector( '.tab-content:not(.hidden)' );

        if ( currentSection ) {
            const exitDistance = direction === 'left' ? '-100%' : '100%';
            currentSection.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
            currentSection.style.transform = `translateX(${exitDistance})`;
            currentSection.style.opacity = '0';
        }

        setTimeout( () => {
            targetTab.click();
            this.currentTab = index;

            // Scroll horizontal de tabs si es necesario
            this.scrollTabIntoView( targetTab );

            setTimeout( () => {
                const newSection = document.querySelector( '.tab-content:not(.hidden)' );
                if ( newSection ) {
                    const enterDistance = direction === 'left' ? '100%' : '-100%';
                    newSection.style.transition = 'none';
                    newSection.style.transform = `translateX(${enterDistance})`;
                    newSection.style.opacity = '0';

                    newSection.offsetHeight;

                    newSection.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
                    newSection.style.transform = 'translateX(0)';
                    newSection.style.opacity = '1';

                    setTimeout( () => {
                        newSection.style.transition = '';
                        newSection.style.transform = '';
                        newSection.style.opacity = '';

                        // Scroll al inicio del contenido
                        this.scrollToTop();
                    }, 350 );
                }
            }, 50 );
        }, 150 );
    }

    scrollTabIntoView( tab ) {
        const navContainer = tab.closest( 'nav' );
        if ( !navContainer ) return;

        const tabRect = tab.getBoundingClientRect();
        const containerRect = navContainer.getBoundingClientRect();

        // Si el tab está fuera de vista a la derecha o izquierda
        if ( tabRect.right > containerRect.right ) {
            // Scroll para mostrar el tab en el centro
            const scrollAmount = tabRect.right - containerRect.right + ( tabRect.width / 2 );
            navContainer.scrollBy( {
                left: scrollAmount,
                behavior: 'smooth'
            } );
        } else if ( tabRect.left < containerRect.left ) {
            const scrollAmount = tabRect.left - containerRect.left - ( tabRect.width / 2 );
            navContainer.scrollBy( {
                left: scrollAmount,
                behavior: 'smooth'
            } );
        }
    }

    scrollToTop() {
        // Scroll suave al inicio del contenido
        window.scrollTo( {
            top: 0,
            behavior: 'smooth'
        } );

        const mainContainer = document.querySelector( 'main' );
        if ( mainContainer ) {
            mainContainer.scrollTo( {
                top: 0,
                behavior: 'smooth'
            } );
        }
    }
}

// Inicializar
document.addEventListener( 'DOMContentLoaded', () => {
    new SwipeNavigation( 'main', '.tab-btn' );
} );
