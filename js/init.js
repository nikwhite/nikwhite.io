function init() {
	var cube;

	if ( Modernizr.touch ) {

		cube = new Cube();

		PubSub.subscribe('overlayVisible', function(msg, gallery){
			cube.detach();
			$(gallery).closest('.face').addClass('gallery-active-face');
		});
		PubSub.subscribe('overlayHidden', function(msg, gallery){
			cube.attach();
			$(gallery).closest('.face').removeClass('gallery-active-face');
		});
	}

	var screenshotSections = Array.prototype.slice.call( document.querySelectorAll('.screenshots') );

	var galleries = [ ];

	screenshotSections.forEach( function( section, i ) {
		galleries.push( new Gallery({root: section}) );
		//galleries[i];
	});
	
}

window.addEventListener('DOMContentLoaded', init, false);