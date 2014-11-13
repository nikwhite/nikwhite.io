function init() {
	var cube;

	if ( Modernizr.touch ) {

		cube = new Cube();

		PubSub.subscribe('overlayVisible', function(){
			cube.detach();
		});
		PubSub.subscribe('overlayHidden', function(){
			cube.attach();
		});
	}

	var screenshotSections = Array.prototype.slice.call( document.querySelectorAll('.screenshots') );

	var galleries = [ ];

	screenshotSections.forEach( function( section, i ) {
		galleries.push( new Gallery({root: section}) );
		galleries[i];
	});
	
}

window.addEventListener('DOMContentLoaded', init, false);