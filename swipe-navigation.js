// Swipe Navigation System
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
        this.threshold = 50; // Mínimo de pixels para activar swipe
        this.restraint = 100; // Máximo de desviación vertical
        this.allowedTime = 500; // Tiempo máximo para considerar swipe
        this.startTime = 0;

        this.init();
    }

    init() {
        // Event listeners para touch (móvil/tablet)
        this.container.addEventListener( 'touchstart', ( e ) => this.handleTouchStart( e ), { passive: true } );
        this.container.addEventListener( 'touchmove', ( e ) => this.handleTouchMove( e ), { passive: false } );
        this.container.addEventListener( 'touchend', ( e ) => this.handleTouchEnd( e ), { passive: true } );

        // Event listeners para mouse (desktop)
        this.container.addEventListener( 'mousedown', ( e ) => this.handleMouseDown( e ) );
        this.container.addEventListener( 'mousemove', ( e ) => this.handleMouseMove( e ) );
        this.container.addEventListener( 'mouseup', ( e ) => this.handleMouseUp( e ) );
        this.container.addEventListener( 'mouseleave', ( e ) => this.handleMouseUp( e ) );

        // Encontrar tab actual
        this.updateCurrentTab();
    }

    updateCurrentTab() {
        this.tabs.forEach( ( tab, index ) => {
            if ( tab.classList.contains( 'border-gold' ) || tab.classList.contains( 'text-gold' ) ) {
                this.currentTab = index;
            }
        } );
    }

    // Touch Events
    handleTouchStart( e ) {
        const touchObj = e.changedTouches[ 0 ];
        this.startX = touchObj.pageX;
        this.startY = touchObj.pageY;
        this.startTime = new Date().getTime();
    }

    handleTouchMove( e ) {
        // Prevenir scroll vertical mientras se hace swipe horizontal
        const touchObj = e.changedTouches[ 0 ];
        const distX = Math.abs( touchObj.pageX - this.startX );
        const distY = Math.abs( touchObj.pageY - this.startY );

        if ( distX > distY && distX > 10 ) {
            e.preventDefault();
        }
    }

    handleTouchEnd( e ) {
        const touchObj = e.changedTouches[ 0 ];
        this.distX = touchObj.pageX - this.startX;
        this.distY = touchObj.pageY - this.startY;
        const elapsedTime = new Date().getTime() - this.startTime;

        this.processSwipe( elapsedTime );
    }

    // Mouse Events
    handleMouseDown( e ) {
        this.isMouseDown = true;
        this.startX = e.pageX;
        this.startY = e.pageY;
        this.startTime = new Date().getTime();
        this.container.style.cursor = 'grabbing';
    }

    handleMouseMove( e ) {
        if ( !this.isMouseDown ) return;

        this.distX = e.pageX - this.startX;
        this.distY = e.pageY - this.startY;

        // Feedback visual opcional
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

    processSwipe( elapsedTime ) {
        // Validar que sea un swipe válido
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

        // Solo cambiar si hay un tab nuevo
        if ( newIndex !== this.currentTab ) {
            this.switchToTab( newIndex );
        }
    }

    switchToTab( index ) {
        const targetTab = this.tabs[ index ];
        if ( targetTab ) {
            // Añadir animación de transición
            this.addTransitionEffect( index > this.currentTab ? 'left' : 'right' );

            // Simular click en el tab
            targetTab.click();
            this.currentTab = index;
        }
    }

    addTransitionEffect( direction ) {
        const allSections = document.querySelectorAll( '.tab-content' );
        const activeSection = document.querySelector( '.tab-content:not(.hidden)' );

        if ( activeSection ) {
            activeSection.style.animation = `slideOut${direction === 'left' ? 'Left' : 'Right'} 0.3s ease-out`;

            setTimeout( () => {
                activeSection.style.animation = '';
            }, 300 );
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener( 'DOMContentLoaded', () => {
    const swipeNav = new SwipeNavigation( 'main', '.tab-btn' );
} );
