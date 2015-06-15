$(function () {

	var loading = false;
	var form = document.getElementById('sayhello')

	function handleSubmit(e) {
		var form = this
		
		e.preventDefault()

		if ( loading ) return
		
		loading = toggleLoading(true)
		toggleSuccess(false)
		toggleFailure(false)

		$.post( form.action, $(form).serialize() )
		 .then( function success() {

		 	loading = toggleLoading(false)
		 	toggleSuccess(true)

		 }, function failure() {

		 	loading = toggleLoading(false)
		 	toggleFailure(true)

		 })
	}

	function toggle(classname, el, toggle) {
		if (toggle) {
			form.classList.add(classname);
			return true
		} else {
			form.classList.remove(classname);
			return false
		}
	}

	var toggleLoading = toggle.bind(window, 'loading', form)
	var toggleSuccess = toggle.bind(window, 'success', form)
	var toggleFailure = toggle.bind(window, 'failure', form)

	$(form).on('submit', handleSubmit)

})