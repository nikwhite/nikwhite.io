function Gallery(options) {
	this.el = options.root;
	this.active = false;
	this.activeImage = null;

	this.el.addEventListener('click', function(e) {
		if ( e.target.nodeName.toUpperCase() === 'A' ) {
			e.preventDefault();

			this.el.parentNode.parentNode.style.position = 'fixed';

			if ( !this.overlay ) {
				this.createOverlay();
			}

			if ( !this.active ) {
				this.showOverlay();
			} 

			this.transitionImage(e.target.href);

		}
	}.bind( this ));
}

Gallery.prototype.createOverlay = function () {
	var frag = document.createDocumentFragment();
	var root = document.createElement('div');
	var inner = document.createElement('div');
	var imgWrap = document.createElement('div');
	var close = document.createElement('a');

	root.className = 'gallery-overlay';
	close.className = 'icon-cross close';
	inner.className = 'inner';
	imgWrap.className = 'img-wrap';

	frag.appendChild(root);
	root.appendChild(close);
	root.appendChild(inner);
	inner.appendChild(imgWrap);

	this.overlayFragment = frag;
	this.overlay = root;
	this.imgWrap = imgWrap;
	this.close = close;
}

Gallery.prototype.removeOverlay = function () {
	document.body.classList.remove('overlay-visible');
	
	var onEnd = function() {
		document.body.removeChild(this.overlay);

		this.overlay.removeEventListener( this.transitionEvent, onEnd );

		this.overlay = null;
		this.active = false;

	}.bind(this);

	this.el.parentNode.parentNode.style.position = '';
	
	this.overlay.addEventListener( this.transitionEvent, onEnd );

	PubSub.publish('overlayHidden');
}

Gallery.prototype.showOverlay = function () {

	document.body.appendChild(this.overlayFragment);

	document.body.classList.add('overlay-visible');

	setTimeout( function() {
		this.active = true;
		this.bindEvents();
	}.bind(this), 20);

	PubSub.publish('overlayVisible');
	
};

Gallery.prototype.bindEvents = function () {
	this.close.addEventListener('click', function(){
		this.removeOverlay();
	}.bind( this ));
}

Gallery.prototype.transitionImage = function (src) {
	
	var img = document.createElement('img');
	img.src = src;
	img.classList.add('in');

	this.imgWrap.appendChild(img);

	function onload() {
		img.onload = null;
		img.classList.remove('in');
		
		if ( this.activeImage ) {
			var currentImg = this.activeImage;

			currentImg.classList.add('out');

			var onEnd = function(){
				this.imgWrap.removeChild( currentImg );
				currentImg.removeEventListener( this.transitionEvent, onEnd );
			}.bind(this);

			currentImg.addEventListener( this.transitionEvent, onEnd);


		}

		// allow for browser paint
		setTimeout( function(){
		}.bind(this), 20);

		this.activeImage = img;
	}

	img.onload = onload.bind(this);
	
};

Gallery.prototype.transitionEvent = (function () {
	var el = document.createElement('div'),
		transition,

		eventNames = {
			'WebkitTransition': 'webkitTransitionEnd', 
			'MozTransition': 'transitionend',          
			'transition': 'transitionend'              
		};

	for (transition in eventNames) {
		if (el.style[transition] !== undefined) {
			return eventNames[transition];
		}
	}
}());