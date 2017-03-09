/*
	@Author  Vlle
	@Date	 2017-03-08
	@Version 0.1.5.1
	
	@ToDo:
		- Loosing focus and other Bugs when clicking on the big Play-Button.
	
	@Description:
		Add Hotkeys to the Videoplayer of picarto.tv
		
		How to inject this Code:
			
			Browser Add-Ons:
				Firefox: "JS Injector"       - https://chrome.google.com/webstore/detail/resource-override/pkoacgokdfckfpndoffpifphamojphii
				Chrome:  "Recource Override" - https://addons.mozilla.org/de/firefox/addon/js-injector/?src=api
			
			URL-Filter: picarto.tv/*
*/



// =======================< picarto_hotkeys >===================================================
// ===================< picarto_hotkeys >===================================================

function PICARTO_HOTKEYS() {
	var self = this; // for use in callbacks, where this is something else
	
	this.version = '0.1.5.1';
	this.tested_in_picarto_version = '1.70';
	this.debug = false;
	
	this.is_popout = (window.opener && window.opener !== window)
	this.volume_step = 0.05;
	this.active_player = 1; // 0 = none, >0 = preselect
	
	this.infobox_selector = '.streamer_infos > div > div:visible'; // null or '.streamer_infos > div > div:visible'
	
	
	// add css to remove outline on focused elements (they have to be focusable for events to work)
	
	$(document.head).append('<style> div[tabindex="0"] { outline: none; } </style>');
	
	
	// change active player on focus
	
	if ($('.video-js').length == 1) { // event is unnecessary when only 1 player
		this.active_player = 1;
		
	} else {
		
		// player container
		var selector = '.video-js';
		$(selector).attr('tabindex', 0); // enable events (make elements focusable)
		$(document).on('focus', selector, function(event) {
			self.set_active_player( $(this).attr('data-playerid') );
		});
		
		// infobox
		if (this.infobox_selector) {
			$(this.infobox_selector).each(function(i, el) {
				//$(el).attr('tabindex', 0); // <-- will be done when creating hotkey events
				$(el).on('focus', null, {'id':i+1}, function(event) {
					self.set_active_player( event.data.id );
				});
			});
		}
	}
	
	
	// hotkey event
	
	var event_elements_selector = (this.is_popout ? 'body' : 
		'.flexPlayerOuter' + // player container
		(this.infobox_selector ? ', ' + this.infobox_selector : '')
	);
	
	$(event_elements_selector).attr('tabindex', 0); // enable events (make elements focusable)
	
	$(document).on('keydown', event_elements_selector, function(event){
		self.keydown_event(event);
	});
}

// ==================

PICARTO_HOTKEYS.prototype._debug = function(msg) {
	if (this.debug)
		console.debug('Picarto-Hotkeys:', msg);
}

// ==================

PICARTO_HOTKEYS.prototype.set_active_player = function(player_id) {
	
	this.active_player = parseInt(player_id);
	this._debug('changed player focus to: ' + player_id);
}

// ==================

PICARTO_HOTKEYS.prototype.keydown_event = function(event) {
	
	if (this.active_player == 0)
		return;
	
	var playerID = this.active_player;
	var player = videojs.getPlayers()['playerHolder' + playerID];
	var playerContainer = $('#playerHolder' + playerID);
	
	this._debug('keyboard-event: ' + event.key + '(' + event.which + ')' + ', id: ' + playerID);
	
	switch(event.which) {
		
		// Play/Pause
		case 32: // Spacebar
			if (!playerContainer.is(':visible')) break; // ignore if hidden
			if (player.paused()) {
				player.play();
				this._debug('Play');
			} else {
				player.pause();
				this._debug('Pause');
			}
			break;
		
		// toggle Fullscreen
		case 70: // f
			if (!playerContainer.is(':visible')) break; // ignore if hidden
			if (player.isFullscreen()) {
				player.exitFullscreen();
				this._debug('exit Fullscreen');
			} else {
				player.requestFullscreen();
				this._debug('requested Fullscreen');
			}
			break;
		
		// Enlarge/Shrink
		case 76: // l
			//if (!playerContainer.is(':visible')) break; // ignore if hidden
			if ($('.video-js').length > 1) { // more than 1 player
				if (playerContainer.parent().find('.ms_enlarge').css('display') == 'none' && playerContainer.is(':visible')) { // active player is enlarged
					//playerContainer.parent().find('.ms_shrink')[0].click(); // not optimal, leaves Player Options opened
					this._ms_shrink( playerContainer.parent().find('.ms_shrink') );
					this._debug('Shrinked Player ' + playerID);
				} else {
					//playerContainer.parent().find('.ms_enlarge')[0].click(); // not optimal, leaves Player Options opened
					this._ms_enlarge( playerContainer.parent().find('.ms_enlarge') );
					this._debug('Enlarged Player ' + playerID);
				}
			}
			break;
		
		// toggle Mute
		case 77: // m
			if (!playerContainer.is(':visible')) break; // ignore if hidden
			if (player.muted()) {
				player.muted( false );
				this._debug('unmuted');
			} else {
				player.muted( true );
				this._debug('muted');
			}
			break;
		
		// Volume up
		case 38: // Up
			if (!playerContainer.is(':visible')) break; // ignore if hidden
			if (player.muted()) {
				player.muted( false )
				this._debug('unmuted');
			}
			player.volume( player.volume() + this.volume_step );
			this._debug('Volume up, new vol: ' + player.volume());
			break;
		
		// Volume down
		case 40: //Down
			if (!playerContainer.is(':visible')) break; // ignore if hidden
			player.volume( player.volume() - this.volume_step );
			this._debug('Volume down, new vol: ' + player.volume());
			break;
		
		default:
			return;
	}
	
	event.target.focus(); // focus lost sometimes, when DOM is changed
	event.preventDefault();
}

// ==================

PICARTO_HOTKEYS.prototype._ms_enlarge = function(buttonContainer) { // anonymous function from player.min.js (added support for enlarging, when another player is already enlarged)
	//var buttonContainer = $(this);
	var streamCount = $('.ms_enlarge').length;
	var playerID = buttonContainer.attr('data-playerid');
	var playerContainer = $('#playerHolder' + playerID); // ADDED
	for (var i = 1; i <= streamCount; i++) {
		if (i != playerID) {
			videojs.getPlayers()['playerHolder' + i].pause(); // changed videojs(...) -> videojs.getPlayers()[...]
			$('#playerHolder' + i).parent().parent().css('width', '0px').css('height', '0px')
				.removeClass('flexPlayerInnerFull'); // ADDED
		}
	}
	if (!playerContainer.is(':visible')) // play if another player was enlarged // ADDED
		videojs.getPlayers()['playerHolder' + playerID].play(); // ADDED
	playerContainer.parent().parent().addClass('flexPlayerInnerFull') // changed $('#playerHolder' + playerID) --> playerContainer
		.css('width', '').css('height', ''); // ADDED
	$('.ms_enlarge').hide();
	$('.ms_shrink').show()
}

PICARTO_HOTKEYS.prototype._ms_shrink = function(buttonContainer) { // anonymous function from player.min.js
	//var buttonContainer = $(this);
	var streamCount = $('.ms_shrink').length;
	var playerID = buttonContainer.attr('data-playerid');
	for (var i = 1; i <= streamCount; i++) {
		if (i != playerID) {
			videojs.getPlayers()['playerHolder' + i].play(); // changed videojs(...) -> videojs.getPlayers()[...]
			$('#playerHolder' + i).parent().parent().css('width', '').css('height', '')
		}
	}
	$('#playerHolder' + playerID).parent().parent().removeClass('flexPlayerInnerFull');
	$('.ms_enlarge').show();
	$('.ms_shrink').hide()
}



// =======================< Initialize >===================================================
// ===================< Initialize >===================================================

var picarto_hotkeys = null; // define globally

$(document).ready(function () {
	
	if ($('.video-js').length == 0) { // Explore / Chat-Popout / anything without Player
		console.debug('Picarto-Hotkeys: No Player found, won\'t initialize.');
		return;
	}
	
	picarto_hotkeys = new PICARTO_HOTKEYS();
	
	console.info('Picarto-Hotkeys v' + picarto_hotkeys.version + ' (for Picarto v' + picarto_hotkeys.tested_in_picarto_version + ')');
});
