;(function (){
	'use strict'

	var cube

	function initTouch() {
		cube = new Cube()

		PubSub.subscribe('overlayVisible', function(msg, gallery){
			cube.detach()
			$(gallery).closest('.face').addClass('gallery-active-face')
		})
		PubSub.subscribe('overlayHidden', function(msg, gallery){
			cube.attach()
			$(gallery).closest('.face').removeClass('gallery-active-face')
		})
	}

	function initDesktop() {
		var lastLaxTop
		var laxLayer = $('.lax-layer')[0]

		// Because perspective: 1px creates a stacking context, it needs to be removed
		// to allow the gallery icons to be clickable by being in the same stacking context
		// as the image container. When it gets removed, the parallax element goes back to
		// its original position, so here I'm' offsetting it by its last parallaxed position
		PubSub.subscribe('beforeOverlayVisible', function(msg, gallery){
			lastLaxTop = 'translateY(' + laxLayer.getBoundingClientRect().top.toFixed(2) + 'px) scale(1)'
		})
		PubSub.subscribe('overlayVisible', function(msg, gallery){
			laxLayer.style.transform = lastLaxTop
		})
		PubSub.subscribe('overlayHidden', function(msg, gallery){
			laxLayer.style.transform = ''
		})
	}

	function init() {
		
		Modernizr.touch ? initTouch() : initDesktop()

		var screenshotSections = Array.prototype.slice.call( document.querySelectorAll('.screenshots') )

		var galleries = [ ]

		screenshotSections.forEach( function( section, i ) {
			galleries.push( new Gallery({root: section}) )
			//galleries[i];
		})

	}

	window.addEventListener('DOMContentLoaded', init, false)
}())
