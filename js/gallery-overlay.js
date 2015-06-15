function Gallery(options) {
	this.el = options.root;
	this.active = false;
	this.activeImage = null;
	this.activeTrigger = null;

	this.el.addEventListener('click', function(e) {
		if ( e.target.nodeName.toUpperCase() === 'A' ) {
			e.preventDefault();

			if ( e.target === this.activeTrigger ) return;

			if ( !this.overlay ) {
				this.createOverlay();
			}

			if ( !this.active ) {
				this.showOverlay();
			} 

			this.transitionImage(e.target.href);

			this.toggleTrigger(e.target)

		}
	}.bind( this ));
}

Gallery.prototype.toggleTrigger = function (activator) {
	if ( activator && activator.classList.contains('active') ) return

	this.activeTrigger && this.activeTrigger.classList.remove('active')
	this.activeTrigger = activator
	activator && activator.classList.add('active')
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

	frag.appendChild(close);
	frag.appendChild(root);
	root.appendChild(inner);
	inner.appendChild(imgWrap);

	this.overlayFragment = frag;
	this.overlay = root;
	this.imgWrap = imgWrap;
	this.close = close;
	this.$overlay = $(root);
}

Gallery.prototype.removeOverlay = function () {
	
	var onEnd = function() {
		document.body.removeChild(this.overlay);
		document.body.removeChild(this.close);

		this.overlay.removeEventListener( this.transitionEvent, onEnd );
		this.close.removeEventListener( 'click', this.boundRemoveFn )

		this.close = null;
		this.overlay = null;
		this.active = false;

	}.bind(this);

	this.overlay.addEventListener( this.transitionEvent, onEnd );

	document.body.classList.remove('overlay-visible');

	this.el.classList.remove('active-gallery');
	this.overlay.classList.remove('visible');
	this.toggleTrigger();

	PubSub.publishSync('overlayHidden', this.el);
	
}

Gallery.prototype.showOverlay = function () {

	PubSub.publishSync('beforeOverlayVisible', this.el);

	this.el.classList.add('active-gallery');
	document.body.classList.add('overlay-visible');

	document.body.appendChild(this.overlayFragment);

	setTimeout( function() {
		this.active = true;
		this.overlay.classList.add('visible');
		this.bindEvents();
	}.bind(this), 20);

	PubSub.publishSync('overlayVisible', this.el);
	
};

Gallery.prototype.bindEvents = function () {
	this.boundRemoveFn = this.removeOverlay.bind(this);
	this.close.addEventListener('click', this.boundRemoveFn);
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
				currentImg.parentNode.removeChild( currentImg );
				currentImg.removeEventListener( this.transitionEvent, onEnd );
			}.bind(this);

			currentImg.addEventListener( this.transitionEvent, onEnd);
		}

		this.activeImage = img;
	}

	function addNewImage() {
		if (img.complete) {
			setTimeout(onload.bind(this), 50);
		} else {
			img.onload = function(){
				setTimeout(onload.bind(this), 50);
			}.bind(this);
		}
	}

	// scroll back to top if not already there
	if ( this.overlay.scrollTop ) {
		this.$overlay.animate({ scrollTop: 0 }, 400, function(){	
			addNewImage.call(this);
		}.bind(this));

	} else {
		addNewImage.call(this);
	}

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