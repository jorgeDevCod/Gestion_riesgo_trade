// Swipe Navigation System - Vista previa en movimiento
class SwipeNavigation {
    constructor( containerSelector, tabsSelector ) {
        this.container = document.querySelector( containerSelector );
        this.tabs = document.querySelectorAll( tabsSelector );
        this.currentTab = 0;

        // Touch tracking
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.isDragging = false;
        this.isMouseDown = false;
        this.startTime = 0;

        // Configuración
        this.threshold = 100; // Distancia para cambiar tab
        this.allowedTime = 500;

        // Para vista previa
        this.previewLayer = null;
        this.currentSection = null;
        this.nextSection = null;

        this.init();
    }

    init() {
        this.updateCurrentTab();
        this.setupPreviewLayer();
        this.attachEventListeners();

        this.container.style.userSelect = 'none';
        this.container.style.webkitUserSelect = 'none';
        this.container.style.cursor = 'grab';
    }

    setupPreviewLayer() {
        // Crear capa de vista previa (invisible por defecto)
        this.previewLayer = document.createElement( 'div' );
        this.previewLayer.id = 'swipe-preview-layer';
        this.previewLayer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            display: none;
        `;
        document.body.appendChild( this.previewLayer );
    }

    attachEventListeners() {
        this.container.addEventListener( 'touchstart', ( e ) => this.handleStart( e ), { passive: true } );
        this.container.addEventListener( 'touchmove', ( e ) => this.handleMove( e ), { passive: false } );
        this.container.addEventListener( 'touchend', ( e ) => this.handleEnd( e ), { passive: true } );

        this.container.addEventListener( 'mousedown', ( e ) => this.handleStart( e ) );
        this.container.addEventListener( 'mousemove', ( e ) => this.handleMove( e ) );
        this.container.addEventListener( 'mouseup', ( e ) => this.handleEnd( e ) );
        this.container.addEventListener( 'mouseleave', ( e ) => this.handleEnd( e ) );

        this.container.addEventListener( 'click', ( e ) => {
            if ( this.isDragging ) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true );
    }

    updateCurrentTab() {
        this.tabs.forEach( ( tab, index ) => {
            if ( tab.classList.contains( 'border-gold' ) || tab.classList.contains( 'text-gold' ) ) {
                this.currentTab = index;
            }
        } );
    }

    handleStart( e ) {
        if ( this.isFixedElement( e.target ) ) return;

        const point = e.touches ? e.touches[ 0 ] : e;
        this.startX = point.pageX;
        this.startY = point.pageY;
        this.currentX = point.pageX;
        this.startTime = new Date().getTime();
        this.isDragging = false;

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

        const diffX = this.currentX - this.startX;
        const diffY = Math.abs( ( e.touches ? e.touches[ 0 ].pageY : e.pageY ) - this.startY );

        if ( Math.abs( diffX ) > 15 && Math.abs( diffX ) > diffY ) {
            this.isDragging = true;
            if ( e.cancelable ) {
                e.preventDefault();
            }

            this.showPreview( diffX );
        }
    }

    showPreview( diffX ) {
        const direction = diffX < 0 ? 'left' : 'right';
        const targetIndex = direction === 'left' ?
            Math.min( this.currentTab + 1, this.tabs.length - 1 ) :
            Math.max( this.currentTab - 1, 0 );

        // Si no hay tab siguiente/anterior, aplicar resistencia
        if ( targetIndex === this.currentTab ) {
            const resistance = Math.sign( diffX ) * Math.pow( Math.abs( diffX ), 0.7 ) * 0.3;
            this.applyTransform( resistance );
            return;
        }

        // Limitar el deslizamiento
        const maxSlide = window.innerWidth * 0.85;
        const limitedDiff = Math.sign( diffX ) * Math.min( Math.abs( diffX ), maxSlide );

        this.applyTransform( limitedDiff );
    }

    applyTransform( diffX ) {
        const currentSection = document.querySelector( '.tab-content:not(.hidden)' );
        if ( !currentSection ) return;

        // Aplicar transformación suave
        currentSection.style.transition = 'none';
        currentSection.style.transform = `translateX(${diffX}px)`;

        // Calcular opacidad
        const opacity = 1 - Math.abs( diffX ) / ( window.innerWidth * 0.5 );
        currentSection.style.opacity = Math.max( 0.3, Math.min( 1, opacity ) );

        // Mostrar indicador visual del siguiente tab
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
                z-index: 10000;
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

        if ( this.isDragging ) {
            this.processSwipe( diffX, elapsedTime );
        }

        this.isDragging = false;
        this.isMouseDown = false;
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
            // Animación de salida completa
            const exitDistance = direction === 'left' ? '-100%' : '100%';
            currentSection.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
            currentSection.style.transform = `translateX(${exitDistance})`;
            currentSection.style.opacity = '0';
        }

        setTimeout( () => {
            targetTab.click();
            this.currentTab = index;

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
                    }, 350 );
                }
            }, 50 );
        }, 150 );
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
                'syncStatus'
            ];
            if ( fixedIds.includes( el.id ) ) return true;

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
}

// Inicializar
document.addEventListener( 'DOMContentLoaded', () => {
    new SwipeNavigation( 'main', '.tab-btn' );
} );
