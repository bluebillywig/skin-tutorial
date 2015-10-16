// Create a new object for all player logic.
var myPlayer = {};

myPlayer.init = function(targetContainer){
	this.$container = $(targetContainer);
	// Find the skin container
	this.$skin = this.$container.find('.skin');
	// Find the controlbar
	this.$controlbar = this.$skin.find('.controlbar');
	
	this.$time = this.$controlbar.find('.time');
	
	// Bind elements
	this.$controlbar.find('.play.button').on('click', $.proxy(this.play, this));
	this.$controlbar.find('.pause.button').on('click', $.proxy(this.pause, this));
	
	this.$controlbar.find('.mute.button').on('click', $.proxy(this.mute, this));
	this.$controlbar.find('.unmute.button').on('click', $.proxy(this.unmute, this));
	
	// Bind api events
	this.api.on('playing', $.proxy(this.onPlaying, this));
	this.api.on('pause', $.proxy(this.onPause, this));
	
	this.api.on('volumechange', $.proxy(this.onVolumeChange, this));
	this.api.on('durationchange', $.proxy(this.onDurationChange, this));
	this.api.on('timeupdate', $.proxy(this.onTimeUpdate, this));
};

/* Controls */
// Play / pause
myPlayer.play = function(){
	this.api.play();
};

myPlayer.pause = function(){
	this.api.pause();
};

// Mute / unmute
myPlayer.mute = function(){
	this.api.setMuted(true);
};
myPlayer.unmute = function(){
	this.api.setMuted(false);
};

/* EVENTS */
myPlayer.onPlaying = function(){
	// Logically, the video isn't paused when it's playing
	this.$container.removeClass('paused').addClass('playing');
};
myPlayer.onPause = function(){
	// Logically, the video isn't playing when it's paused
	this.$container.removeClass('playing').addClass('paused');
};

myPlayer.onVolumeChange = function(){
	if(this.api.getMuted() == true){
		this.$container.addClass('muted');
	} else {
		this.$container.removeClass('muted');
	}
};

myPlayer.onDurationChange = function(){
	var duration = this.api.getDuration();
	this.$time.find('.duration').html(this.formatSeconds(duration));
};
myPlayer.onTimeUpdate = function(){
	var currentTime = this.api.getCurrentTime();
	this.$time.find('.elapsed').html(this.formatSeconds(currentTime));
};

/* Helpers */
myPlayer.formatSeconds = function(seconds){
	d = Number(seconds);
	var h = Math.floor(d / 3600);
	var m = Math.floor(d % 3600 / 60);
	var s = Math.floor(d % 3600 % 60);
	return ((h > 0 ? h + ':' : '') + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s);
};

// Listen to ready event that bubbles from the player
$('#player').on('ready', function(){
	myPlayer.init(this);
});

$(document).ready(function(){
	// Add an API variable containing the Blue Billywig player
	myPlayer.api = new bluebillywig.Player('//bluebillywig.bbvms.com/p/skin-tutorial/c/2530517.json', {
		target: $('#player')[0]
	});
});