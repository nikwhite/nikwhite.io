
/**
 * @author Nik White
 * @copyright Nik White 2014
 * @license MIT
 */
var Cube = function(){
	
	'use strict';

	var transitionEnd = (function whichTransitionEvent(){
	    var t;
	    var el = document.createElement('div');
	    var transitions = {
	      'transition':'transitionend',
	      'OTransition':'oTransitionEnd',
	      'MozTransition':'transitionend',
	      'WebkitTransition':'webkitTransitionEnd'
	    }

	    for(t in transitions){
	        if( el.style[t] !== undefined ){
	            return transitions[t];
	        }
	    }
	}());

	/**
	 * @constructor Face
	 * holds translation and rotation values for a face of a cube and can 
	 * snap to 90 degree angles
	 * @param {HTMLElement} element of the face
	 * @param {object} settings with which to initialize the face
	**/
	function Face( element, settings ) {
		
		this.el = element;
		
		this.zTranslation = settings.zTranslation || 0;
		this.xRotation = settings.xRotation || 0;
		this.yRotation = settings.yRotation || 0;
		
		this.transform();
	}

	Face.prototype.rotateX = function (delta) {
		this.zTranslation = halfHeight;
		this.xRotation += delta;
		this.transform();
	}

	Face.prototype.rotateY = function (delta) {
		this.zTranslation = halfWidth;
		this.yRotation += delta;
		this.transform();
	}

	Face.prototype.snapY = function () {

		this.transition( bounceTransition );

		this.yRotation = Math.round(this.yRotation / 90) * 90;
		this.transform();

		this.el.addEventListener( transitionEnd, function (e) {
			this.transition( noTransition );
		}.bind( this ));
	}

	Face.prototype.snapX = function () {

		this.transition( bounceTransition );

		this.xRotation = Math.round(this.xRotation / 90) * 90;
		this.transform();

		this.el.addEventListener( transitionEnd, function (e) {
			this.transition( noTransition );
		}.bind( this ));
	}

	Face.prototype.transform = function () {
		
		var style = this.el.style;

		style.webkitTransform = 
	    style.msTransform = 
	    style.MozTransform = 
	    style.OTransform =
	    style.transform = 'rotateX(' + this.xRotation + 'deg) ' +
                          'rotateY(' + this.yRotation + 'deg) ' +
                          'translateZ(' + this.zTranslation + 'px)';

	}

	Face.prototype.transition = function ( transition ) {
		
		var style = this.el.style;
		
		style.webkitTransition = 
	    style.msTransition = 
	    style.MozTransition = 
	    style.OTransition = 
	    style.transition = transition;
	
	}

	Face.prototype.set = function (settings) {
		this.xRotation = settings.xRotation || this.xRotation;
		this.yRotation = settings.yRotation || this.yRotation;
		this.zTranslation = settings.zTranslation || this.zTranslation;

		this.transform();
	}



	
	// Find elements
	var cube = document.getElementById('cube'),
		top = document.getElementsByClassName('top')[0],
		bottom = document.getElementsByClassName('bottom')[0],
		middle = document.getElementsByClassName('middle')[0],

		topFace = { },
		bottomFace = { },
		
		bounceTransition = 'all 350ms ease-out 0',
		noTransition = 'none',
	
	// Define reused variables
		touchStart = undefined,
		direction = undefined,
		totalChange = 0,
		touches = { }, 
		lastTouch = { },
		change = { },
	
	// Setup window dimensions
		width = document.body.clientWidth,
		height = document.body.clientHeight,
		halfHeight = height / 2,
		halfWidth = width / 2,
		translateHeight = halfHeight,
		translateWidth = halfWidth,
		
	// the amount of rotation per 1 change - this maps the full width and height of the screen to 90 degree rotation
		yRotationPerChange = width / 90, 
		xRotationPerChange = height / 90,
		
	// pointer and DOM element caches
		perspectives = [ ],
		numPerspectives = 0,
		activeFace = 0,
		activePerspective = 0,
		middleFaces = [ ],
		contentsides = [ ]; // DOM order for middle sides

	Array.prototype.nextIndex = function(index){
		return index === this.length - 1 ? 0 : index + 1;
	}
	Array.prototype.prevIndex = function(index){
		return index <= 0 ? this.length - 1 : index - 1;
	}
	
	Array.prototype.eq = function(index){
		return this[ (this.length + (index % this.length)) % this.length ];
	}
	
	NodeList.prototype.each = Array.prototype.each = function( fn ){
		for ( var i=0, l = this.length; i < l; i++){
			fn.call(this[i], i);
		}
	}
	
	
	function init(){		
		
		setup();
		
		attach();
		
	}

	function attach() {
		window.addEventListener('touchstart', events);
	}

	function detach() {
		window.removeEventListener('touchstart', events);
	}
	
	function setup(){

		var currentState = history.state;

		if ( currentState.indices ) {
			activePerspective = currentState.indices[0];
			activeFace = currentState.indices[1];
		
		} else {
			activePerspective = 0;
			activeFace = 0;		
		}

		console.log(currentState.indices)

		var perspectiveDiff = activePerspective * 90;

		// cache all sides
		contentsides = document.querySelectorAll('.middle .face');
		
		topFace = new Face( top, {
			xRotation: perspectiveDiff,
			zTranslation: halfHeight
		});

		bottomFace = new Face( bottom, {
			xRotation: -180 + perspectiveDiff,
			zTranslation: halfHeight
		});

		perspectives = [ top, middle, bottom ];
		numPerspectives = perspectives.length;
		
		
		contentsides.each(function(i){
			var settings = {
				zTranslation: translateWidth
			}

			if ( i === activeFace ) {
				settings.xRotation = -90 + perspectiveDiff;
			
			} else {
				settings.yRotation = 90;
			}

			middleFaces.push( new Face(this, settings) );

		});
	}

	function setCurrentState() {

		var state = {
			perspective: perspectives[activePerspective].id,
			side: middleFaces[activeFace].el.id,
			indices: [ activePerspective, activeFace ]
		}

		history.pushState( state, '', '#/' + state.perspective + '/' + state.side);
	}
		
// ======== Event Handlers =========	
	var events = {
		
		handleEvent: function(event){
		
			// if explicitly prevented, using more than 1 finger, or scaling, dont do anything
			if ( event.touches.length > 1 || event.scale && event.scale !== 1 ) return;
			
			switch ( event.type ) {
				case 'touchmove' : this.move(event);  break;
				case 'touchstart': this.start(event); break;
				case 'touchend'  : this.end(event);   break;
			}
		},
		
		start: function (e){
		
		// Reset reused variables
			touches = e.touches[0];
			
			touchStart = {
				x: touches.pageX,
				y: touches.pageY
			}
			
			totalChange = {
				x: 0,
				y: 0
			};
			
			direction = undefined;

			middleFaces.eq( activeFace-1 ).set({ yRotation: -90 });
			middleFaces.eq( activeFace   ).set({ yRotation:   0 });
			middleFaces.eq( activeFace+1 ).set({ yRotation:  90 });
			
		// Add listeners to move and end
			window.addEventListener('touchmove', events);
			window.addEventListener('touchend', events);
		},
		
		move: function (e){
			
			e.preventDefault();
			
			touches = e.touches[0];
			
			lastTouch = touchStart;
			
			// calculate the change from the previous move event
			change = {
				x: touches.pageX - lastTouch.x,
				y: touches.pageY - lastTouch.y
			};
			
			console.log(change.x + ', ' + change.y);
			
			// update touchStart for the next move event
			touchStart = {
				x: touches.pageX,
				y: touches.pageY
			}

			// track the total change
			totalChange.x += change.x;
			totalChange.y += change.y;
			
			// determine the direction - one time 
			if ( !direction ) {
				direction = Math.abs(change.x) >= Math.abs(change.y) ?
					'x' : 'y' ;
			}
			
			if ( direction === 'x' && activePerspective !== 0 && activePerspective !== numPerspectives-1 ){
				var delta = change.x / yRotationPerChange;

				middleFaces.eq( activeFace-1 ).rotateY(delta);
				middleFaces.eq( activeFace   ).rotateY(delta);
				middleFaces.eq( activeFace+1 ).rotateY(delta);
				
			} else if ( direction === 'y' ){

				// if we're looking at the top and totalchange is less than 0, move move
				// if we're looking at the bottom and totalchange is greater than 0, move
				// > 0 = down
				// < 0 = up
				if ( (activePerspective === 0 && totalChange.y > 0) ||
					 (activePerspective === numPerspectives-1 && totalChange.y < 0) ) {
					return;
				}

				var delta = -change.y / xRotationPerChange;

				topFace.rotateX(delta);
				middleFaces.eq( activeFace ).rotateX(delta);
				bottomFace.rotateX(delta);
				
				
			}

				
		},
		
		end: function(e){
			window.removeEventListener('touchmove', events);
			window.removeEventListener('touchend', events);

			console.log(totalChange.x + ', ' + totalChange.y);
			
			// snap the active, left and right sides based on total change
			if ( direction === 'x' && activePerspective !== 0 && activePerspective !== numPerspectives-1 ){
				var totalX = totalChange.x;

				middleFaces.eq( activeFace-1 ).snapY();
				middleFaces.eq( activeFace   ).snapY();
				middleFaces.eq( activeFace+1 ).snapY();

				if ( Math.abs( totalX ) >= halfWidth  ) {

					activeFace = totalX < 0 ?
						middleFaces.nextIndex(activeFace) :
						middleFaces.prevIndex(activeFace) ;

					setCurrentState();
					
				}
				
			} else if ( direction === 'y' ){
				var totalY = totalChange.y;
				
				topFace.snapX();
				middleFaces[activeFace].snapX();
				bottomFace.snapX();

				if ( Math.abs( totalY ) >= halfHeight ) {

					// finger moving up - rotating up
					if ( totalY > 0 ){

						activePerspective = perspectives[activePerspective - 1] ? 
								activePerspective - 1 : 0;

					// finger moving down - ratating down
					} else {

						activePerspective = perspectives[activePerspective + 1] ?
								activePerspective + 1 : numPerspectives - 1;

					}

					setCurrentState();

				}
				
			}	
		}
	};
	
	// vroom vroom
	init();
	
}
