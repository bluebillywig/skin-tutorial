// Create a new object for all player logic.
var myPlayer = {};

myPlayer.init = function(targetContainer){
	this.$container = $(targetContainer);
	// Find the skin container
	this.$skin = this.$container.find('.skin');
	// Find the controlbar
	this.$controlbar = this.$skin.find('.controlbar');
	// Find the time display
	this.$time = this.$controlbar.find('.time');
	// Find the progress bar
	this.$progressbar = this.$controlbar.find('.progressbar');
	this.$progressIndicator = this.$progressbar.find('.progress-indicator');
	// Find the volume slider
	this.$volumeSlider = this.$controlbar.find('.volume-slider');
	this.$volumeIndicator = this.$volumeSlider.find('.volume-indicator');
	// Find the quality list
	this.$qualityList = this.$controlbar.find('.quality-list');
	
	// Init variables
	this.duration = 0;
	this.currentTime = 0;
	this.volume = 1;
	this.muted = false;
	this.assets = [];
	this.activeAsset;
	
	this.seeking = false;
	this.seekWasPlaying = false;
	
	// Bind elements
	this.$controlbar.find('.play.button').on('click', $.proxy(this.play, this));
	this.$controlbar.find('.pause.button').on('click', $.proxy(this.pause, this));
	
	this.$controlbar.find('.mute.button').on('click', $.proxy(this.mute, this));
	this.$controlbar.find('.unmute.button').on('click', $.proxy(this.unmute, this));
	
	this.$progressbar.on('mousedown touchstart', $.proxy(this.seekStart, this));
	
	this.$volumeSlider.on('mousedown touchstart', $.proxy(this.volumeStart, this));
	
	// Bind api events
	this.api.on('playing', $.proxy(this.onPlaying, this));
	this.api.on('pause', $.proxy(this.onPause, this));
	
	this.api.on('volumechange', $.proxy(this.onVolumeChange, this));
	this.api.on('durationchange', $.proxy(this.onDurationChange, this));
	this.api.on('timeupdate', $.proxy(this.onTimeUpdate, this));
	
	this.api.on('assetlistchange assetselected', $.proxy(this.onAssetChange, this));
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
	if(!this.seeking){
		this.$container.removeClass('paused').addClass('playing');
	}
};
myPlayer.onPause = function(){
	if(!this.seeking){
		this.$container.removeClass('playing').addClass('paused');
	}
};

myPlayer.onVolumeChange = function(){
	this.volume = this.api.getVolume();
	this.muted = this.api.getMuted();
	this.updateVolumeSlider();
	if(this.api.getMuted() == true){
		this.$container.addClass('muted');
	} else {
		this.$container.removeClass('muted');
	}
};

myPlayer.onDurationChange = function(){
	this.duration = this.api.getDuration();
	this.updateTimeDuration();
	this.updateProgressbar();
};
myPlayer.onTimeUpdate = function(){
	this.currentTime = this.api.getCurrentTime();
	this.updateTimeElapsed();
	this.updateProgressbar();
};
myPlayer.onAssetChange = function(){
	this.assets = this.api.getAssets();
	this.activeAsset = this.api.getCurrentAsset();
	this.renderAssets();
};

/* Visuals */
// Text time / duration display
myPlayer.updateTimeDuration = function(){
    this.$time.find('.duration').html(this.formatSeconds(this.duration));
};
myPlayer.updateTimeElapsed = function(){
	this.$time.find('.elapsed').html(this.formatSeconds(this.currentTime));
};

// Progressbar
myPlayer.updateProgressbar = function(position){
	if(typeof position == 'number'){
		// If we get a position passed, we force the progressbar to that position.
		var percentagePlayed = position;
	} else {
		// Else, we use the time.
		var percentagePlayed = (this.currentTime / this.duration);
	}
	if(percentagePlayed > 1){
		percentagePlayed = 1;
	} else if(percentagePlayed < 0) {
		percentagePlayed = 0;
	}
	this.$progressIndicator.width(percentagePlayed * 100 + '%');
};

myPlayer.seekStart = function(ev){
	this.seeking = true;
	this.seekWasPlaying = this.api.isPlaying();
	this.api.pause();
	var position = this.getPosInElement(ev, myPlayer.$progressbar);
	this.updateProgressbar(position.x);
	this.gentleSeek(position.x);
	$(document).on('mousemove touchmove', $.proxy(this.seekMove, this));
	$(document).on('mouseup touchend', $.proxy(this.seekEnd, this));
};

myPlayer.seekMove = function(ev){
	var position = this.getPosInElement(ev, myPlayer.$progressbar);
	this.updateProgressbar(position.x);
	this.gentleSeek(position.x);
};

myPlayer.seekEnd = function(ev){
	this.seeking = false;
	var position = this.getPosInElement(ev, myPlayer.$progressbar);
	this.updateProgressbar(position.x);
	this.api.seek(this.duration * position.x);
	if(this.seekWasPlaying && position.x < 1){
		this.api.play();
	}
	$(document).off('mousemove touchmove', this.progressMove);
	$(document).off('mouseup touchend', this.progressEnd);
};

// Volume slider
myPlayer.updateVolumeSlider = function(position){
	if(typeof position == 'number'){
		var percentage = position;
	} else {
		// Set volume indicator to 0 if muted.
		if(this.muted){
			var percentage = 0;
		} else {
			var percentage = this.volume;
		}
	}
	if(percentage > 1){
		percentage = 1;
	} else if(percentage < 0) {
		percentage = 0;
	}
	this.$volumeIndicator.width(percentage * 100 + '%');
};

myPlayer.volumeStart = function(ev){
	var position = this.getPosInElement(ev, myPlayer.$volumeSlider);
	this.updateVolumeSlider(position.x);
	this.api.setVolume(position.x);
	this.api.setMuted(false);
	$(document).on('mousemove touchmove', $.proxy(this.volumeMove, this));
	$(document).on('mouseup touchend', $.proxy(this.volumeEnd, this));
};
myPlayer.volumeMove = function(ev){
	var position = this.getPosInElement(ev, myPlayer.$volumeSlider);
	this.updateVolumeSlider(position.x);
	this.api.setVolume(position.x);
};
myPlayer.volumeEnd = function(ev){
	var position = this.getPosInElement(ev, myPlayer.$volumeSlider);
	this.updateVolumeSlider(position.x);
	this.api.setVolume(position.x);
	$(document).off('mousemove touchmove', this.volumeMove);
	$(document).off('mouseup touchend', this.volumeEnd);
};

/* Assets */
myPlayer.renderAssets = function(){
	this.$qualityList.empty();
	for (var i = 0; i < this.assets.length; i++) {
		var asset = this.assets[i];
		var $element = $('<li />')
			.text(asset.title)
			.attr('id', asset.id);
		
		if(asset.id == this.activeAsset.id){
			$element.addClass('active');
		}
		$element.on('click touchstart', $.proxy(this.selectAsset, this));
		$element.appendTo(this.$qualityList);
	}
};
myPlayer.selectAsset = function(ev){
	this.api.setAsset(ev.target.id);
};

/* Helpers */
myPlayer.formatSeconds = function(seconds){
	d = Number(seconds);
	var h = Math.floor(d / 3600);
	var m = Math.floor(d % 3600 / 60);
	var s = Math.floor(d % 3600 % 60);
	return ((h > 0 ? h + ':' : '') + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s);
};

myPlayer.getPosInElement = function(ev, element){
	var offset = element.offset();
	var relX = ev.pageX - offset.left;
	var relY = ev.pageY - offset.top;
	return {x: (relX / element.width()), y: (relY / element.height())};
};

myPlayer.gentleSeek = function(position){
	var positionInSeconds = this.duration * position;
	if(positionInSeconds > this.duration - 0.1){
		positionInSeconds = this.duration - 0.1;
	} else if(positionInSeconds < 0){
		positionInSeconds = 0;
	}
	this.api.seek(positionInSeconds);
};

// Listen to ready event that bubbles from the player
$('#player').on('ready', function(){
	myPlayer.init(this);
});

$(document).ready(function(){
	// Add an API variable containing the Blue Billywig player
	myPlayer.api = new bluebillywig.Player('//bluebillywig.bbvms.com/p/skin-tutorial/c/2575081.json', {
		target: $('#player')[0]
	});
});