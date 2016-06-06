chrome.app.runtime.onLaunched.addListener(function() {

  chrome.app.window.create('window.html', {
    'outerBounds': {
      'width': 600,
      'height': 500
    },
	'resizable': false,
  });
});