In part 1, we created our custom skin and added basic controls. In part 2, we added more advanced controls to further improve the user experience. In part 3, we will further improve our custom skin with a start- and end screen. The start screen will contain the media clip title and a big play button. The end screen will contain a replay button and a button to continue to the next video. Finally, we will add a full screen button which allows the video to be played in glorious full screen.

A working example can be found here, the sourcecode can be found here, and an overview of the complete tutorial can be found here.

## A bigger play button

A better user experience starts with obvious controls. What is the first thing that the users probably wants to do when he sees your video? Play the video ofcourse! A very big, bold button with a play icon provides this interface in a no-nonsense manner. And the best thing is? It only takes a few lines of code to implement this feature:

<html>
	<div class="big-play">
		<i class="fa fa-play"></i>
	</div>
</html>

Just like with the regular button, we use CSS to show and hide the play button:

<css>
	.big-play {
	    display: block;
	}
	#player.playing .big-play {
		display: none;
	}
	#player.paused .big-play {
		display: none;
	}
</css>

This requires only a single line of JavaScript, since we already have a play function for the regular play button.

<javascript>
	myPlayer.init = function(targetContainer){
		..
		this.$container.find('.big-play').on('click', $.proxy(this.play, this));
		..	
	}
</javascript>

## The replay button

The regular play button already acts as a replay button when the video has ended, because of the way the Blue Billywig player behaves. So the only thing left to do is adding an 'ended' class to our skin container, just like the 'playing' and 'paused' class. To make things easier to maintain, we introduce a variable that contains all classes that indicate the state, for easy removal.

<javascript>
	myPlayer.init = function(targetContainer){
		..
		this.states = 'playing paused ended';
		..
		this.api.on('ended', $.proxy(this.onEnded, this));
		this.$controlbar.find('.replay.button').on('click', $.proxy(this.play, this));
		..	
	}
	
	myPlayer.onEnded = function(){
		this.$container.removeClass(this.states).addClass('ended');
	};
</javascript>

<html>
	<div class="replay button">
		<i class="fa fa-repeat"></i>
	</div>
</html>

<css>
	#player.ended .replay.button {
		display: block;
	}
	#player.ended .play.button {
		display: none;
	}
</css>

## Playing the next video

Since we don't want users to leave our page right away, we offer them to view another video. The player API throws an event when the related clips have been loaded (`relatedclipschange`), so we use that to get our next video (if there is one available):

<javascript>
	myPlayer.init = function(targetContainer){
		..
		this.relatedClips = null;
		..
		this.api.on('relatedclipschange', $.proxy(this.onRelatedClipsChange, this));
		..
	}
	
	myPlayer.onRelatedClipsChange = function(){
		this.relatedClips = this.api.getRelatedClips();
	};
</javascript>

Next up, the play next button itself:

<html>
	<div class="play-next">
		<i class="fa fa-step-forward"></i>
		Play next
	</div>
</html>

<css>
	.play-next {
		display: none;
	}
	#player.ended .play-next {
		display: block;
	}
</css>

<javascript>
	myPlayer.init = function(targetContainer){
		..
		this.$container.find('.play-next').on('click', $.proxy(this.playNext, this));
		..
	}
	
	myPlayer.playNext = function(){
		if(this.relatedClips != null && typeof this.relatedClip[0] != undefined){
			var nextClipId = this.relatedClips[0].id;
			this.api.load({'clipId': nextClipId});
		} else {
			this.$container.find('.play-next').hide();
		}
	};
</javascript>

As you can see, we make sure to hide the play next button when our next clip is not available for some reason.

## Behold, the glory of fullscreen!

Fullscreen functionality might be one of the biggest user experience improvements in the player. For the sake of simplicity, we will only build a native fullscreen function. For better compatibility, we advice you to include a 'browser fullscreen'.

<html>
	<div class="fullscreen button">
		<i class="fa fa-expand"></i>
	</div>
</html>

<javascript>
	myPlayer.init = function(targetContainer){
		..
		this.fullscreen = false;
		..
		this.$controlbar.find('.fullscreen.button').on('click', $.proxy(this.toggleFullscreen, this));
		..
	}
	
	myPlayer.toggleFullscreen = function(){
		if(!this.fullscreen){
			this.enableFullscreen();
		} else {
			this.disableFullscreen();
		}
	};

	myPlayer.enableFullscreen = function(){
		if (this.$container[0].requestFullscreen) {
			this.$container[0].requestFullscreen();
		} else if (this.$container[0].msRequestFullscreen) {
			this.$container[0].msRequestFullscreen();
		} else if (this.$container[0].mozRequestFullScreen) {
			this.$container[0].mozRequestFullScreen();
		} else if (this.$container[0].webkitRequestFullscreen) {
			this.$container[0].webkitRequestFullscreen();
		}	
	};

	myPlayer.disableFullscreen = function(){
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	};
</javascript>

This correctly enables fullscreen functionality. But the icon remains the same, and we want to make sure that we know that the user has exited fullscreen, even if he uses the browser default functionality like ESC.

<javascript>
	myPlayer.fullscreenChange = function(ev){
		if((document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) == null){
			this.$container.removeClass('fullscreen');
			this.fullscreen = false;
		} else {
			this.$container.addClass('fullscreen');
			this.fullscreen = true;
		}
	};
</javascript>

<css>
	.fullscreen.button .fa-compress {
		display: none;
	}
	#player.fullscreen .fullscreen.button .fa-expand {
		display: none;
	}
	#player.fullscreen .fullscreen.button .fa-compress {
		display: block;
	}
</css>

As you can see, the player retains its original size, so we need to stretch it to fit the whole screen:

<css>
	#player.fullscreen {
		width: 100%;
		height: 100%;
	}
</css>