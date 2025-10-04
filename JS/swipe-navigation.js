// Swipe Navigation System - Optimizado para no afectar elementos fixed
class SwipeNavigation {
    constructor( containerSelector, tabsSelector ) {
        this.container = document.querySelector( containerSelector );
        this.tabs = document.querySelectorAll( tabsSelector );
        this.currentTab = 0;

        // Touch tracking
        this.startX = 0;
        this.startY = 0;
        this.distX = 0;
        this.distY = 0;
        this.threshold = 50;
        this.restraint = 100;
        this.allowedTime = 500;
        this.startTime = 0;
        this.isMouseDown = false;

        this.init();
    }

    init() {
        // Asegurar que solo afecte al contenido de las tabs
        const swipeableArea = this.container;

        // Touch events
        swipeableArea.addEventListener( 'touchstart', ( e ) => this.handleTouchStart( e ), { passive: true } );
        swipeableArea.addEventListener( 'touchmove', ( e ) => this.handleTouchMove( e ), { passive: false } );
        swipeableArea.addEventListener( 'touchend', ( e ) => this.handleTouchEnd( e ), { passive: true } );

        // Mouse events
        swipeableArea.addEventListener( 'mousedown', ( e ) => this.handleMouseDown( e ) );
        swipeableArea.addEventListener( 'mousemove', ( e ) => this.handleMouseMove( e ) );
        swipeableArea.addEventListener( 'mouseup', ( e ) => this.handleMouseUp( e ) );
        swipeableArea.addEventListener( 'mouseleave', ( e ) => this.handleMouseUp( e ) );

        this.updateCurrentTab();
    }

    updateCurrentTab() {
        this.tabs.forEach( ( tab, index ) => {
            if ( tab.classList.contains( 'border-gold' ) || tab.classList.contains( 'text-gold' ) ) {
                this.currentTab = index;
            }
        } );
    }

    handleTouchStart( e ) {
        // Ignorar si el toque es en un elemento fixed
        if ( this.isFixedElement( e.target ) ) return;

        const touchObj = e.changedTouches[ 0 ];
        this.startX = touchObj.pageX;
        this.startY = touchObj.pageY;
        this.startTime = new Date().getTime();
    }

    handleTouchMove( e ) {
        if ( this.isFixedElement( e.target ) ) return;

        const touchObj = e.changedTouches[ 0 ];
        const distX = Math.abs( touchObj.pageX - this.startX );
        const distY = Math.abs( touchObj.pageY - this.startY );

        if ( distX > distY && distX > 10 ) {
            e.preventDefault();
        }
    }

    handleTouchEnd( e ) {
        if ( this.isFixedElement( e.target ) ) return;

        const touchObj = e.changedTouches[ 0 ];
        this.distX = touchObj.pageX - this.startX;
        this.distY = touchObj.pageY - this.startY;
        const elapsedTime = new Date().getTime() - this.startTime;

        this.processSwipe( elapsedTime );
    }

    handleMouseDown( e ) {
        if ( this.isFixedElement( e.target ) ) return;

        this.isMouseDown = true;
        this.startX = e.pageX;
        this.startY = e.pageY;
        this.startTime = new Date().getTime();
        this.container.style.cursor = 'grabbing';
    }

    handleMouseMove( e ) {
        if ( !this.isMouseDown || this.isFixedElement( e.target ) ) return;

        this.distX = e.pageX - this.startX;
        this.distY = e.pageY - this.startY;

        if ( Math.abs( this.distX ) > 10 ) {
            e.preventDefault();
        }
    }

    handleMouseUp( e ) {
        if ( !this.isMouseDown ) return;

        this.isMouseDown = false;
        this.container.style.cursor = 'grab';

        const elapsedTime = new Date().getTime() - this.startTime;
        this.processSwipe( elapsedTime );

        this.distX = 0;
        this.distY = 0;
    }

    isFixedElement( element ) {
        // Verificar si el elemento o sus padres son fixed
        let el = element;
        while ( el && el !== document.body ) {
            const position = window.getComputedStyle( el ).position;
            if ( position === 'fixed' ) return true;

            // IDs de elementos que deben ser ignorados
            const fixedIds = [
                'confluenceToggle',      // ⭐ AÑADE ESTO
                'confluencePanel',
                'installAppContainer',
                'userSection',
                'syncStatus'
            ];
            if ( fixedIds.includes( el.id ) ) return true;

            el = el.parentElement;
        }
        return false;
    }

    processSwipe( elapsedTime ) {
        if ( elapsedTime <= this.allowedTime &&
            Math.abs( this.distX ) >= this.threshold &&
            Math.abs( this.distY ) <= this.restraint ) {

            const direction = this.distX < 0 ? 'left' : 'right';
            this.navigate( direction );
        }
    }

    navigate( direction ) {
        this.updateCurrentTab();
        let newIndex = this.currentTab;

        if ( direction === 'left' ) {
            newIndex = Math.min( this.currentTab + 1, this.tabs.length - 1 );
        } else if ( direction === 'right' ) {
            newIndex = Math.max( this.currentTab - 1, 0 );
        }

        if ( newIndex !== this.currentTab ) {
            this.switchToTab( newIndex );
        }
    }

    switchToTab( index ) {
        const targetTab = this.tabs[ index ];
        if ( targetTab ) {
            this.addTransitionEffect( index > this.currentTab ? 'left' : 'right' );
            targetTab.click();
            this.currentTab = index;
        }
    }

    addTransitionEffect( direction ) {
        // Solo aplicar animación al contenido de la tab, no al contenedor
        const activeSection = document.querySelector( '.tab-content:not(.hidden)' );

        if ( activeSection ) {
            const animationName = direction === 'left' ? 'slideOutLeft' : 'slideOutRight';
            activeSection.style.animation = `${animationName} 0.3s ease-out`;

            setTimeout( () => {
                activeSection.style.animation = '';
            }, 300 );
        }
    }
}

// Inicializar
document.addEventListener( 'DOMContentLoaded', () => {
    new SwipeNavigation( 'main', '.tab-btn' );
} );
