$(function () {

	var loading = false;
	var success = false;
	var form = document.getElementById('sayhello')

	function handleSubmit(e) {
		var form = this
		
		e.preventDefault()

		if ( loading ) return
		
		toggleLoading(true)
		toggleSuccess(false)
		toggleFailure(false)

		$.post( 'http://localhost:8080/sayhello', $(form).serialize() )
		 .then( function success() {

		 	toggleLoading(false)
		 	toggleSuccess(true)

		 }, function failure() {

		 	toggleLoading(false)
		 	toggleFailure(true)
		 	
		 })
	}

	function toggle(class, el, toggle) {
		if (toggle && !loading) {
			loading = true;
			form.classList.add('loading');
		} else {
			loading = false;
			form.classList.remove('loading');
		}
	}

	var toggleLoading = toggle.bind(window, 'loading', form)
	var toggleSuccess = toggle.bind(window, 'success', form)
	var toggleFailure = toggle.bind(window, 'failure', form)

	$(form).on('submit', handleSubmit)

})