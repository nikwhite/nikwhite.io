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
	this.snapTransition = settings.snapTransition || 'all 350ms ease-out 0';
	
	this.transform();
}

Face.prototype.rotateX = function (delta) {
	this.zTranslation = document.body.clientHeight / 2;
	this.xRotation += delta;
	this.transform();
}

Face.prototype.rotateY = function (delta) {
	this.zTranslation = document.body.clientWidth / 2;
	this.yRotation += delta;
	this.transform();
}

Face.prototype.snapY = function () {

	this.transition( this.snapTransition );

	this.yRotation = Math.round(this.yRotation / 90) * 90;
	this.transform();

	this.el.addEventListener( transitionEnd, function (e) {
		this.transition( 'none' );
	}.bind( this ));
}

Face.prototype.snapX = function () {

	this.transition( this.snapTransition  );

	this.xRotation = Math.round(this.xRotation / 90) * 90;
	this.transform();

	this.el.addEventListener( transitionEnd, function (e) {
		this.transition( 'none' );
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

Face.prototype.goY = function(direction) {
	this.yRotation  = direction > 0 ? 
			this.yRotation - 90 : 
			this.yRotation + 90 ;

	this.snapY();
}

Face.prototype.goX = function(direction) {
	this.xRotation  = direction > 0 ? 
			this.xRotation + 90 : 
			this.xRotation - 90 ;

	this.snapX();
}