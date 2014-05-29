function init() {
	if ( 'ontouchstart' in window ) {
		document.body.className += ' touch';
	}

	var cube = new Cube();

	var screenshotSections = Array.prototype.slice.call( document.querySelectorAll('.screenshots') );

	var galleries = [ ];

	screenshotSections.forEach( function( section, i ) {
		galleries.push( new Gallery({root: section}) );
	});

	PubSub.subscribe('overlayVisible', function(){
		cube.detach();
	});
	PubSub.subscribe('overlayHidden', function(){
		cube.attach();
	});
}

window.addEventListener('DOMContentLoaded', init, false);