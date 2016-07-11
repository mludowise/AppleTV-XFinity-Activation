const LOGIN_URL = "https://login.comcast.net";
const AUTH_BASE_URL = "https://api.auth.adobe.com/api/v1/authenticate";
const AUTH_PARAMS = {
	noflash: true,
	mso_id: "Comcast_SSO"
};

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
			
			// Check if this page is loading after a successful authentication
			app.checkForSuccess();
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
				app.openActivationURL();
			} else {
				$("#submit-button").prop("disabled", true);
			}
		});
		
		// When clicking on "Activate Another Network"
		$("#activate-again").click(function() {
			$("#network-panel-body").collapse({parent: "#accordion"});
			$("#success-modal").modal('hide');
		});
	},
	
	// Check if the page is loaded after a successful authentication
	checkForSuccess: function() {
		var params = $.deparam.querystring();
		var network = params.success;
		if (network != undefined && network in app.networks) {
			// Remove params from URL
			history.pushState({}, '', baseUrl(window.location.href));
			
			// Show success modals
			$("#authenticated-network").text(app.networks[network].name);
			$("#success-modal").modal();
		}
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
		var code = $("#activation-code").val().toUpperCase();
		var networkConfig = app.networks[app.selectedNetwork];
		var url = "";
		
		// Check if this network has a requestor_id & domain_name that can be used with Xfinity's auth base URL
		var requestorId = networkConfig.requestor_id;
		var domainName = networkConfig.domain_name;
		if (requestorId != undefined && domainName != undefined) {
			// Prepare to redirect back to this page
			var redirectParams = { success: app.selectedNetwork };
			var redirectUrl = baseUrl(window.location.href);
			redirectUrl += "?" + $.param(redirectParams);
			
			var params = $.extend(AUTH_PARAMS, {
				reg_code: code,
				requestor_id: requestorId,
				domain_name: domainName,
				redirect_url: redirectUrl
			});
			url = AUTH_BASE_URL + "?" + $.param(params);
		} else {
			url = networkConfig.url;
			url = url.replace("*******", code);
		}
		
		window.location.href = url;
	}
}

function baseUrl(url) {
	return url.split("?")[0];
}