function Gallery(options) {
	this.el = options.root;
	this.active = false;
	this.activeImage = null;

	this.el.addEventListener('click', function(e) {
		if ( e.target.nodeName.toUpperCase() === 'A' ) {
			e.preventDefault();

			//this.el.parentNode.parentNode.style.position = 'fixed';

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

	frag.appendChild(close);
	frag.appendChild(root);
	root.appendChild(inner);
	inner.appendChild(imgWrap);

	this.overlayFragment = frag;
	this.overlay = root;
	this.imgWrap = imgWrap;
	this.close = close;
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

	setTimeout(function(){
		this.el.classList.remove('active-gallery');
		this.overlay.classList.remove('visible');

		//this.el.parentNode.parentNode.style.position = '';

		PubSub.publish('overlayHidden', this.el);
	}.bind(this), 20);
	
}

Gallery.prototype.showOverlay = function () {

	this.el.classList.add('active-gallery');
	document.body.classList.add('overlay-visible');

	document.body.appendChild(this.overlayFragment);

	setTimeout( function() {
		this.active = true;
		this.overlay.classList.add('visible');
		this.bindEvents();
	}.bind(this), 20);

	PubSub.publish('overlayVisible', this.el);
	
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
		setTimeout(onload.bind(this), 20);
	}

	if (img.complete) {
		addNewImage.call(this);
	} else {
		img.onload = addNewImage.call(this);
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