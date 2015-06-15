
/**
 * @author Nik White
 * @copyright Nik White 2014
 * @license MIT
 */
var Cube = function(){
	
	'use strict';
	
	// Find elements
	var cube = document.getElementById('cube'),
		top = document.getElementsByClassName('top')[0],
		bottom = document.getElementsByClassName('bottom')[0],
		middle = document.getElementsByClassName('middle')[0],

		perspectives = [ top, middle, bottom ],
		numPerspectives = perspectives.length,

		topFace = { },
		bottomFace = { },
	
	// Define reused variables
		touchStart = undefined,
		direction = undefined,
		totalChange = 0,
		touches = { }, 
		lastTouch = { },
		change = { },
	
	// Setup window dimensions
		width,
		height,
		halfHeight,
		halfWidth,
		
	// the amount of rotation per 1 change - this maps the full width and height of the screen to 90 degree rotation
		yRotationPerChange,
		xRotationPerChange,
		
	// pointer and DOM element caches
		activeFace = 0,
		activePerspective = 0,
		middleFaces = [ ],
		contentsides = [ ], // DOM order for middle sides

		currentState = { },
		map = { },
		noTransition = 'none';

	function nextIndex(arr, index) {
		return index === arr.length - 1 ? 0 : index + 1;
	}
	function prevIndex(arr, index) {
		return index <= 0 ? arr.length - 1 : index - 1;
	}
	
	function eq(arr, index) {
		var len = arr.length;
		return arr[ (len + (index % len)) % len ];
	}
	
	// create a square-map with an array of side counts the number at 
	// each array index corresponds to the number of sides in that perspective
	function CubeMap(map) {
		this.groups = [ ];
		this.map = map;
		this.fragment = document.createDocumentFragment();
		
		var maproot = document.createElement('div');
		maproot.className = 'map';

		this.mapInner = document.createElement('div');
		this.mapInner.className = 'map-inner';

		var referenceSide = document.createElement('div');
		referenceSide.className = 'reference side';

		this.fragment.appendChild(maproot);
		maproot.appendChild(referenceSide);
		maproot.appendChild(this.mapInner);

		for ( var i=0, l=map.length; i < l; i++ ){
			this.groups[i] = document.createElement('div');
			this.groups[i].className = 'group';

			this.mapInner.appendChild(this.groups[i]);

			for ( var j=0, k=map[i]; j < k; j++ ){
				var side = document.createElement('div');
				side.className = 'side';
				this.groups[i].appendChild( side );
			}
		}

		document.body.appendChild(this.fragment);
	}

	CubeMap.prototype.translateY = function (val) {
		var style = this.mapInner.style;

		style.webkitTransform = 
	    style.msTransform = 
	    style.MozTransform = 
	    style.OTransform =
	    style.transform = 'translateY(' + (val * -12) + 'px)';
	}

	CubeMap.prototype.translateX = function (val) {
		var style = this.groups[1].style;

		style.webkitTransform = 
	    style.msTransform = 
	    style.MozTransform = 
	    style.OTransform =
	    style.transform = 'translateX(' + (val * -12) + 'px)';
	}

	CubeMap.prototype.setIndex = function (x, y) {
		this.translateY(x);
		this.translateX(y);
	}



	function init(){
		setDimensions();
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

		var localState = history.state || {};

		contentsides = Array.prototype.slice.call( document.querySelectorAll('.middle .face') );

		// read current state from the hash
		if ( window.location.hash ) {
			var ids = parseUrl(window.location.hash);

			activePerspective = getPerspectiveIndex( ids[0] );
			activeFace = getSideIndex( ids[1] );

			currentState = {
				perspective: ids[0],
				side: ids[1]
			}

		// resort to defaults
		} else {
			activePerspective = 0;
			activeFace = 0;	

			currentState = {
				perspective: top.id,
				side: contentsides[0].id
			}	
		}

		var perspectiveDiff = activePerspective * 90;
		
		topFace = new Face( top, {
			xRotation: perspectiveDiff,
			zTranslation: halfHeight
		});

		bottomFace = new Face( bottom, {
			xRotation: -180 + perspectiveDiff,
			zTranslation: halfHeight
		});
		
		contentsides.forEach(function(side, i){
			var settings = {
				zTranslation: halfWidth
			}

			if ( i === activeFace ) {
				settings.xRotation = -90 + perspectiveDiff;
			
			} else {
				settings.yRotation = 90;
			}

			middleFaces.push( new Face(side, settings) );

		});

		map = new CubeMap( [1, contentsides.length, 1] );

		map.setIndex(activePerspective, activeFace);

		window.addEventListener('resize', setDimensions);
		window.onpopstate = stateChange;
	}

	function setDimensions() {
		width = document.body.clientWidth;
		height = document.body.clientHeight;
		halfHeight = height / 2;
		halfWidth = width / 2;
		yRotationPerChange = width / 90;
		xRotationPerChange = height / 90;
	}

	function setCurrentState() {

		currentState = {
			perspective: perspectives[activePerspective].id,
			side: middleFaces[activeFace].el.id
		}

		map.setIndex(activePerspective, activeFace);

		history.pushState( currentState, '', '#' + currentState.perspective + '/' + currentState.side );
	}

	function getStateFromHash() {

		var ids = parseUrl(window.location.hash);

		return {
			perspective: ids[0],
			side: ids[1],
			perspectiveIndex: getPerspectiveIndex( ids[0] ),
			sideIndex: getSideIndex( ids[1] )
		}

	}

	function getSideIndex(id) {

		var ret = 0;

		contentsides.forEach(function(side, i){
			if ( side.id === id ) {
				ret = i;
				return;
			}
		});

		return ret;
	}

	function getPerspectiveIndex(id) {
		
		var ret = 0;

		perspectives.forEach(function(perspective, i) {
			if ( perspective.id === id ) {
				ret = i;
				return;
			}
		});
		
		return ret;
	}

	function parseUrl(url) {
		var path = url.substring( url.indexOf('#') + 1 );
		
		return path.split('/');
	}

	function stateChange(event) { 
		var x, y;
		var ids = parseUrl(window.location.hash);

		setupForRotation();
		
		x = getPerspectiveIndex( ids[0] );
		y = getSideIndex( ids[1] );

		if ( nextIndex(perspectives, activePerspective) === x ){
			rotateX(1);
		} else if ( prevIndex(perspectives, activePerspective) === x ){
			rotateX(-1);
		}
		
		if ( getNextMiddleFaceIndex( activeFace ) === y ){
			rotateY(1);
		} else if ( getPrevMiddleFaceIndex( activeFace ) === y ){
			rotateY(-1);
		}

		map.setIndex(x, y);
 
	}

	function rotateY(val) {

		getMiddleFaceByIndex( activeFace-1 ).goY( val );
		getMiddleFaceByIndex( activeFace   ).goY( val );
		getMiddleFaceByIndex( activeFace+1 ).goY( val );

		activeFace = val > 0 ?
			getNextMiddleFaceIndex( activeFace ) :
			getPrevMiddleFaceIndex( activeFace ) ;

	}

	function rotateX(val) {

		topFace.goX(val);
		getMiddleFaceByIndex( activeFace ).goX(val);
		bottomFace.goX(val);

		activePerspective = val > 0 ?
			nextIndex(perspectives, activePerspective) :
			prevIndex(perspectives, activePerspective) ;
	}

	function setupForRotation(){
		getMiddleFaceByIndex( activeFace-1 ).transition(noTransition).set({ yRotation: -90 });
		getMiddleFaceByIndex( activeFace   ).transition(noTransition).set({ yRotation:   0 });
		getMiddleFaceByIndex( activeFace+1 ).transition(noTransition).set({ yRotation:  90 });
	}

// ======== Partially applied functions =========	

	var getMiddleFaceByIndex = eq.bind(null, middleFaces);
	var getNextMiddleFaceIndex = nextIndex.bind(null, middleFaces);
	var getPrevMiddleFaceIndex = prevIndex.bind(null, middleFaces);
		
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

			setupForRotation();
			
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
			
			// update touchStart for the next move event
			touchStart = {
				x: touches.pageX,
				y: touches.pageY
			}
			
			// determine the direction - one time 
			if ( !direction ) {
				direction = Math.abs(change.x) >= Math.abs(change.y) ?
					'x' : 'y' ;
			}
			
			if ( direction === 'x' && activePerspective !== 0 && activePerspective !== numPerspectives-1 ){
				var delta = change.x / yRotationPerChange;

				window.requestAnimationFrame(function(){
					getMiddleFaceByIndex( activeFace-1 ).rotateY(delta);
					getMiddleFaceByIndex( activeFace   ).rotateY(delta);
					getMiddleFaceByIndex( activeFace+1 ).rotateY(delta);
				});
				
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
				getMiddleFaceByIndex( activeFace ).rotateX(delta);
				bottomFace.rotateX(delta);
				
			}

			// track the total change
			totalChange.x += change.x;
			totalChange.y += change.y;
				
		},
		
		end: function(e){
			window.removeEventListener('touchmove', events);
			window.removeEventListener('touchend', events);

			// snap the active, left and right sides based on total change
			if ( direction === 'x' && activePerspective !== 0 && activePerspective !== numPerspectives-1 ){
				var totalX = totalChange.x;

				window.requestAnimationFrame(function(){
					getMiddleFaceByIndex( activeFace-1 ).snapY();
					getMiddleFaceByIndex( activeFace   ).snapY();
					getMiddleFaceByIndex( activeFace+1 ).snapY();
				});

				if ( Math.abs( totalX ) >= halfWidth  ) {

					if ( totalX < 0 ) {
						// hide the old ones by making them perpendicular to the viewport
						// this prevents being able to look through elements and see the backside 
						// of the old sides in certain situations
						getMiddleFaceByIndex( activeFace-1 ).transition(noTransition).set({ yRotation: -90 });

						activeFace = getNextMiddleFaceIndex( activeFace );
						

					} else if ( totalX > 0 ) {
						getMiddleFaceByIndex( activeFace+1 ).transition(noTransition).set({ yRotation: 90 });

						activeFace = getPrevMiddleFaceIndex( activeFace );
					}

					setCurrentState();
					
				}
				
			} else if ( direction === 'y' ){
				var totalY = totalChange.y;
				
				topFace.snapX();
				middleFaces[activeFace].snapX();
				bottomFace.snapX();

				if ( Math.abs( totalY ) >= halfHeight ) {

					// finger moving up - rotating up
					activePerspective = totalY > 0 ?
						prevIndex( perspectives, activePerspective ) :
						nextIndex( perspectives, activePerspective );

					setCurrentState();

				}
			}	
		}
	};
	
	this.attach = attach;
	this.detach = detach;


	// vroom vroom
	init();
	
}
