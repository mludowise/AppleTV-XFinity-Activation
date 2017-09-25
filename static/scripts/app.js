const LOGIN_URL = "https://login.comcast.net";

$(document).ready(function() {
	app.init();
});

var app = {
	networks: {},
	selectedNetwork: null,
	loginWindow: null,
	
	init: function() {
		
		// Empty code input field (in case user hit back)
		$("#activation-code").val("");
		
		// Load networks from JSON file
		$.getJSON("static/data/networks.json", function(json) {
			
			var $networkTemplate = $(".network-container")
		
			$.each(json.networks, function(index, network) {
				var id = network.id;
				app.networks[id] = network;
				
				var $networkEl = $networkTemplate.clone()
				$networkEl.appendTo($networkTemplate.parent());
				
				$networkEl.find(".network").attr("id", network.id);
				
				var $networkImg = $networkEl.find("img");
				$networkImg.attr("src", network.image);
				$networkImg.attr("alt", network.name);
			});
			
			$networkTemplate.remove();
			
			// When user selects network
			$(".network").click(function() {
				app.selectedNetwork = this.id;
				
				// Highlight selected network in UI
				$("#network-panel-body").find(".network").removeClass("active");
				$(this).addClass("active");
				
				var valid = app.validate();
				$("#submit-button").prop("disabled", !valid);
			});
		});
		
		// Clicking "Log In With Comcast" button, open new window to comcast login
		$("#login-button").click(function() {
			$("#login-next").removeClass("hidden");
			var win = window.open(LOGIN_URL, "login-window");
		});
		
		// When opening code panel, focus on input
		$('#code-panel-body').on('shown.bs.collapse', function () {
			$("#activation-code").focus();
		});
		
		// When typing in code
		$("#activation-code").on("input", function() {
			// Change to upper-case
			var input = $(this);
 			var pos = input[0].selectionStart;
			input.val(function(_, value) {
				return value.toUpperCase();
			});
			input[0].selectionStart = input[0].selectionEnd = pos;
			
			var valid = app.validate();
			$("#submit-button").prop("disabled", !valid);
		});
		
		// When user clicks Submit
		$("#activation-form").submit(function(e) {
			e.preventDefault();
			
			if (app.validate()) {
				// Track analytics of which network is submitted
				if (ga != undefined) {
					ga('send', 'event', "Activate", app.selectedNetwork, {
						hitCallback: function() {
							app.openActivationURL();
						}
					});
				} else {
					app.openActivationURL();
				}
			} else {
				$("#submit-button").prop("disabled", true);
			}
		});
	},
	
	// Check if the user has selected a network and entered a valid code
	validate: function() {
		var code = $("#activation-code").val();
		
		if ( !(this.selectedNetwork in this.networks) ) {
			// No network selected
			app.showError("Select a network.");
			return false;
		}
		
		if (code.length > 7) {
			app.showError("Activation codes should be 7 characters.");
			return false;
		}
		
		if ( !(code.match("^[0-9a-zA-Z]*$")) ) {
			// Code is not alphanumeric
			app.showError("Only letters and numbers are allowed in the activation code.");
			return false;
		}
		
		app.hideError();
		
		if (code.length != 7) {
			return false;
		}
		
		return true;
	},
	
	// Display or hide error message
	showError: function(message) {
		var errorMsg = $("#error-message");
		errorMsg.text(message);
		errorMsg.addClass("in");
		errorMsg.prop("aria-hidden", false);
	},
	
	hideError: function() {
		var errorMsg = $("#error-message");
		errorMsg.text("");
		errorMsg.removeClass("in");
		errorMsg.prop("aria-hidden", true);
	},
	
	// Open URL to activate for the selected network
	openActivationURL: function() {
		var url = app.networks[app.selectedNetwork].url;
		var code = $("#activation-code").val().toUpperCase();
		url = url.replace("*******", code);
		window.location.href = url;
	}
}