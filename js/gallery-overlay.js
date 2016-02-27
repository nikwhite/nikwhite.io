var ACTIVE_CLASS = 'active';

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
	if ( activator && activator.classList.contains(ACTIVE_CLASS) ) return

	// Swap active trigger classes
	this.activeTrigger && this.activeTrigger.classList.remove(ACTIVE_CLASS)
	this.activeTrigger = activator
	activator && activator.classList.add(ACTIVE_CLASS)
}

Gallery.prototype.createOverlay = function () {
	var frag = document.createDocumentFragment();
	var root = document.createElement('div');
	var inner = document.createElement('div');
	var imgWrap = document.createElement('div');
	var close = document.createElement('a');
	var loader = document.createElement('div');

	root.className = 'gallery-overlay';
	close.className = 'icon-cross close';
	inner.className = 'gallery-inner';
	imgWrap.className = 'img-wrap';
	loader.className = 'loader';
	loader.innerHTML = '<div class="one"></div><div class="two"></div><div class="three"></div>';

	frag.appendChild(close);
	frag.appendChild(root);
	root.appendChild(inner);
	inner.appendChild(imgWrap);
	imgWrap.appendChild(loader);

	this.overlayFragment = frag;
	this.overlay = root;
	this.inner = inner;
	this.imgWrap = imgWrap;
	this.close = close;
	this.loader = loader;
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

	window.removeEventListener('resize', this._boundResize);

	document.body.classList.remove('overlay-visible');

	this.el.classList.remove('active-gallery');
	this.overlay.classList.remove('visible');
	this.toggleTrigger();

	PubSub.publishSync('overlayHidden', this.el);
	
}

Gallery.prototype.showOverlay = function () {

	PubSub.publishSync('beforeOverlayVisible', this.el);

	this.el.classList.add('active-gallery');
	
	this.resizeOverlay();
	this._boundResize = this._boundResize || this.resizeOverlay.bind(this);
	window.addEventListener('resize', this._boundResize)

	document.body.classList.add('overlay-visible');

	document.body.appendChild(this.overlayFragment);

	setTimeout( function() {
		this.active = true;
		this.overlay.classList.add('visible');
		this.bindEvents();
	}.bind(this), 20);

	PubSub.publishSync('overlayVisible', this.el);
};

Gallery.prototype.resizeOverlay = function () {
	this.inner.style.width = this.el.getBoundingClientRect().left + 'px';
};

Gallery.prototype.bindEvents = function () {
	this.boundRemoveFn = this.removeOverlay.bind(this);
	this.close.addEventListener('click', this.boundRemoveFn);
};

Gallery.prototype.transitionImage = function (src) {

	var img = document.createElement('img');
	img.src = src;
	img.classList.add('in');

	this.imgWrap.appendChild(img);

	function onload() {
		img.onload = null;
		img.classList.remove('in');

		this.hideLoader();
		
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

			this.showLoader();
			
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

Gallery.prototype.showLoader = function () {
	this.loader.classList.add(ACTIVE_CLASS);
};

Gallery.prototype.hideLoader = function () {
	this.loader.classList.remove(ACTIVE_CLASS);
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