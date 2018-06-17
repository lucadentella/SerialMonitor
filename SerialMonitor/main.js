var connectionOptions = {
	"bitrate": 9600,
	"dataBits": "eight",
	"parityBit": "no",
	"stopBits": "one",
	"receiveTimeout": 500,
	"sendTimeout": 500
};

var connectionId = -1;
var selectedPort = "";
var selectedSpeed = 9600;
var connected = false;

$(function() {
	
	// get the available COM posts and add them to the combo list
	chrome.serial.getDevices(function(ports) {
		
		// sort the ports based on their names (path)
		ports.sort(function(a, b) {
			a = a.path.replace("COM", "");
			b = b.path.replace("COM", "");
			return a-b;
		});
		for (var i = 0; i < ports.length; i++) {
			var portName = ports[i].path;
			var newOption = '<option value="' + portName + '">' + portName + '</option>';
			$("#serial_ports_combobox").append(newOption);
		}
	});
	
	// update the GUI with the starting state (disconnected)
	updateGUI();
	
	// Event raised when data has been read from the connection.
	chrome.serial.onReceive.addListener(onReceive);
	
	// bind a click event on the "connect" button
	$("#connect_button").bind("click", function(event, ui) {
		
		if(!connected) {
			
			// try to connect to the selected port with the selected speed
			selectedPort = $("#serial_ports_combobox").val();
			selectedSpeed = $("#baud_rates_combobox").val();
			connectionOptions.bitrate = parseInt(selectedSpeed);
			chrome.serial.connect(selectedPort, connectionOptions, onConnect);
		}
		else {
			// try to connect to the selected port
			chrome.serial.disconnect(connectionId, onDisconnect);			
		}
	});
	
	// bind a click event on the "send" button
	$("#send_button").bind("click", function(event, ui) {
		
		if(connected) {
			
			var textToSend = $("#send_text").val();
			
			// add the selected end of line
			if($("#endofline_combobox").val() == "NL") textToSend += '\n';
			else if($("#endofline_combobox").val() == "CR") textToSend += '\r';
			else if($("#endofline_combobox").val() == "NLCR") textToSend += '\r\n';
			
			// send data
			chrome.serial.send(connectionId, convertStringToArrayBuffer(textToSend), function(sendInfo) {
				if(sendInfo.error) $.modal('<div id="title">Unable to send data: ' + sendInfo.error + '</div>');
			});
		}
	});	
});

// Update GUI function, enable/disable controls based on the connection status
function updateGUI() {
	
	if(connected) {
		$("#send_text").prop('disabled', false);
		$("#endofline_combobox").prop('disabled', false);
		$("#send_button").prop('disabled', false);
		$("#serial_ports_combobox").prop('disabled', true);
		$("#baud_rates_combobox").prop('disabled', true);
		$("#connect_button").prop('value', 'Disconnect');
	}
	else {
		$("#send_text").prop('disabled', true);
		$("#endofline_combobox").prop('disabled', true);
		$("#send_button").prop('disabled', true);
		$("#serial_ports_combobox").prop('disabled', false);
		$("#baud_rates_combobox").prop('disabled', false);
		$("#connect_button").prop('value', 'Connect');
	}
}

// Callback function for the connect method
function onConnect(connectionInfo) {
	
	// check if the connection was successful
	if(connectionInfo) {
		
		connectionId = connectionInfo.connectionId;
		connected = true;
		updateGUI();
		
	// if not, show the error message
	} else {
		if (chrome.runtime.lastError && chrome.runtime.lastError.message) 
			errorMsg = chrome.runtime.lastError.message;
		else 
			errorMsg = "Failed to connect to the port.";
		$.modal('<div id="title">' + errorMsg + '</div>');
	}
}

// Callback function for the disconnect method
function onDisconnect(result) {
	
	if(result) {
		connected = false;
		updateGUI();
	} 
	else $.modal('<div id="title">Unable to disconnect</div>');
}

// Callback function when new data is received
function onReceive(info) {
	
	// check if data is coming from the serial we opened
	if (info.connectionId == connectionId && info.data) {
		
		// convert the ArrayBuffer to string and add to the textarea
		var str = convertArrayBufferToString(info.data);
		$("#receive_textarea").append(str);
		$("#receive_textarea").scrollTop($("#receive_textarea")[0].scrollHeight);
	}
}

// Convert an array buffer to string
function convertArrayBufferToString(buf) {
	
	var bufView = new Uint8Array(buf);
	var encodedString = String.fromCharCode.apply(null, bufView);
	return decodeURIComponent(encodedString);
}

// convert a string to array buffer
var convertStringToArrayBuffer=function(str) {
	
	var buf = new ArrayBuffer(str.length);
	var bufView = new Uint8Array(buf);
	for (var i = 0; i < str.length; i++) bufView[i] = str.charCodeAt(i);
	return buf;
};

