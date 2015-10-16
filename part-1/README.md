# Skinning the Blue Billywig player - Part 1: Basic controls

In June 2014, we released our new online video player with version five. One of the biggest changes was an all new JavaScript API which enabled every script to take full control of the player. In this step-by-step guide we will build a new, custom skin using HTML, CSS and JavaScript. The end result can be viewed at **%TODO[INSERT LINK]**.

## First things first

I was in charge with building the skin used in our player today, and I learned the hard way that building the controls of a video player isn't that easy. There are a number of things that should be accounted for, along with basic functionality like starting, pausing, seeking, and controlling the volume: The controls should work with the mouse and touch, it should scale up on mobile devices, regular controls shouldn't be visible when advertisements are playing and various player sizes have to be accounted for.

In order to keep things simple for this tutorial, we will be focussing on controlling the video player only. I suspect that most front-end developers will have no trouble with supporting mobile devices.

To keep things organised, we will split the tutorial into 3 parts:

* Part 1: Introduction and basic controls (initial setup and code architecture, play / pause, mute / unmute, time display)
* Part 2: Advanced controls (progress bar, volume bar, quality selection)
* Part 3: Start- & endscreen (fullscreen, big play button, title, replay and next video)

An overview of all available events and methods is available on the Blue Billywig Support site: [Blue Billywig Player API](https://support.bluebillywig.com/blue-billywig-player-api).

## Initial setup

Our code will exist of three things every front-end developer will be familiair with: HTML, CSS and JavaScript. We will create an initial file structure and an `index.html` that includes the CSS and JavaScript files. We use jQuery to make our life easy, and [Font-Awesome](http://fontawesome.io/) for our graphics. Since the example will not be used in a production environment, it will be using CSS techniques that might not be supported on all browsers.

All JavaScript code related to the skin will be written in a single object, please refer to the [MDN Introduction to Object-Oriented Javascript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript) for more information on objects in JavaScript. Furthermore, it might be useful to initialise the skin when a player is found on the page. For the sake of simplicity, that won't be covered in this tutorial.

## The player object

In order to listen to events from the players and use methods available in the API, we have to get the player object. We will insert a Blue Billywig player with the Launchpad, using an example clip and a playout we created for this tutorial:

`player.js`
	
	// Create a new object for all player logic.
	var myPlayer = {};
	
	// Add an API variable containing the Blue Billywig player
	myPlayer.api = new bluebillywig.Player( "http://bluebillywig.bbvms.com/p/skin-tutorial/c/2530517.json", {
		target : $('#player')[0]
	});
	
And the HTML that loads the script and contains a div element in which the player will be rendered:

`index.html`

	<script src="http://bluebillywig.bbvms.com/launchpad/"></script>
	
	<div id="player">
	</div>


In our playout options, we disable every visual element we can find: Hide the controlbar, the big play button, title and related items. The only thing that will be visible is the video itself. The size is also set to 100% width and height, since we want our skin to decide on the player size. For now, we will use a static 1280x720:

`style.css`

	#player {
		position: relative;
		height: 720px;
		width: 1280px;
		margin: 20px auto;
	}

## The skin container

Since we want our skin to appear on top of the video, we create a new element (`#skin`) inside the `#player` container which will contain all skin elements like the controlbar, big play button, title and more.

`index.html`

	<div id="player">
		<div class="skin">
			<div class="controlbar"></div>
		</div>
	</div>

`player.css`

	.skin {
		/* Overlay skin on top of the video */
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 1;
	}
	
	.controlbar {
		/* Stick controlbar to the bottom of the skin */
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
	}

## Adding a play and pause button

Now for the fun part! Let's add some buttons to our skin:

`index.html`

	<div class="controlbar">
		<div class="button play">
			<i class="fa fa-play"></i>
		</div>
		<div class="button pause">
			<i class="fa fa-pause"></i>
		</div>
	</div>

*"Woah, two separate buttons for playing and pausing?"*

Yes! We will be using a class on our `#player` element that specifies wether the video is paused or playing, allowing us to use CSS to display the play button, or the pause button.

`player.css`

	/* Show play button on default */
	.pause.button {
		display: none;
	}
	.play.button {
		display: block;
	}
	
	#player.playing .play.button {
		display: none;
	}
	#player.playing .pause.button {
		display: block;
	}

### Using methods to control the player

In order for the buttons to actually do something, we have to bind a function to it that plays or pauses the video. We create two functions that issue the play or pause method from the player API. We could use the player API directly, but using a function is a good practice:

`player.js`

	myPlayer.play = function(){
		this.api.play();
	};
	
	myPlayer.pause = function(){
		this.api.pause();
	};

Next, we need to bind the buttons to these functions. We create an `init()` function that will take care of all these bindings and other logic that has to be executed once.

`player.js`
	
	myPlayer.init = function(targetContainer){
		this.$container = $(targetContainer);
		// Find the skin container
		this.$skin = this.$container.find('.skin');
		// Find the controlbar
		this.$controlbar = this.$skin.find('.controlbar');
		
		// Bind elements
		this.$controlbar.find('.play.button').on('click', $.proxy(this.play, this));
		this.$controlbar.find('.pause.button').on('click', $.proxy(this.pause, this));
	};

In order to execute this function correctly, we have to bind it to the `ready` event from the API. Since we cannot bind directly on the player at this moment (since it does not yet exist), we bind it to the parent element to which the event bubbles. It is important that we bind this function *before* we load the player:

`player.js`

	// Listen to ready event that bubbles from the player
	$('#player').on('ready', function(){
		myPlayer.init(this);
	});
	
	// Add an API variable containing the Blue Billywig player
	myPlayer.api = new bluebillywig.Player( "http://bluebillywig.bbvms.com/p/skin-tutorial/c/2530517.json", {
		target : $('#player')[0]
	});

Right now, we should be able to start the player using the start button! But still one thing is missing: The play button does not change into a pause button. This is where we will experience the convenience of the CSS styling that switches the buttons.

### Listening to events

We will create two functions that handle the `playing` and `paused` events. We use the `playing` event instead of `play`, since the `playing` event will be thrown when the video actually plays. If, for some reason, the video failed to play, it will correctly be reflected in our skin.

In our init function, we will add the event handlers that are bound to the API:

`player.js`

	// Bind api events
	this.api.on('playing', $.proxy(this.onPlaying, this));
	this.api.on('pause', $.proxy(this.onPause, this));
	
	this.playing = false;
	
And we create two functions that are executed:

`player.js`

	myPlayer.onPlaying = function(){
		// Logically, the video isn't paused when it's playing
		this.$container.removeClass('paused').addClass('playing');
	};
	
	myPlayer.onPause = function(){
		// Logically, the video isn't playing when it's paused
		this.$container.removeClass('playing').addClass('paused');
	};

You will notice that the player also throws a pause event at the end of the video, and that issuing a play command starts playing the video from the start. For now, this is the intended behaviour, but we could change it later on using the `ended` event.

We basically build our skin around the player, hooking into the players' events to change things, instead of issuing commands directly in the skin. This is very good practice, since our skin will reflect exactly what is happening in the player.

## The mute button

The mute button is in many ways very similar to the play / pause button, which means we can use the same workflow:

`index.html`

	<div class="mute button">
		<i class="fa fa-volume-up"></i>
	</div>
	<div class="unmute button">
		<i class="fa fa-volume-off"></i>
	</div>

`player.css`
	
	/* Show mute button on default */
	.pause.unmute {
		display: none;
	}
	.play.mute {
		display: block;
	}
	
	#player.muted .mute.button {
		display: none;
	}
	#player.muted .unmute.button {
		display: block;
	}
	
`player.js`
	
	myPlayer.mute = function(){
		this.api.setMuted(true);
	};
	myPlayer.unmute = function(){
		this.api.setMuted(false);
	};

In the `init` function:

	this.$controlbar.find('.mute.button').on('click', $.proxy(this.mute, this));
	this.$controlbar.find('.unmute.button').on('click', $.proxy(this.unmute, this));

*"But wait, there are not `muted` and `unmuted` events!"*

This is correct. Instead, there is a `volumechange` event which indicates some form of change in volume (including `mute` / `unmute`). The reason behind this, is the fact that the volume not only can be changed by the mute button, but also by (for example) a volume slider.

`player.js`

	this.api.on('volumechange', $.proxy(this.onVolumeChange, this));

The result is that our `onVolumeChange` function gets a little bit more interesting. For now, we only have to deal with the muted status:

`player.js`

	myPlayer.onVolumeChange = function(){
		if(this.api.getMuted() == true){
			this.$container.addClass('muted');
		} else {
			this.$container.removeClass('muted');
		}
	};

For every volume change, we get the muted status from the API and add or remove the classes. If we extend our skin with a volume control later on, we will extend this function.

## Time display

Not everything in our skin is a button, some things just display something. Lets take a loot at displaying the time in the controlbar. We create a time container with appropriate elements to write a time in, and create a variable in our `init` function for easier access.

`index.html`

	<div class="time">
		<span class="elapsed">00:00</span>/<span class="duration">00:00</span>
	</div>
	
`player.js`

	this.$time = this.$controlbar.find('.time');

First, the duration (or total time) of the video. We can use the `getDuration` method in the api to get the duration of the video. We do this when the `durationchange` event has been thrown:

`player.js`
	
	this.api.on('durationchange', $.proxy(this.onDurationChange, this));

In our onDurationChange event, we get the duration and print it into the desired element. Since the duration is returned in seconds, we need a function to convert it to something that is formatted. We can insert the formatted string into the element.

`player.js`

	myPlayer.onDurationChange = function(){
		var duration = this.api.getDuration();
		this.$time.find('.duration').html(this.formatSeconds(duration));
	};

The same procedure is followed with the elapsed time, using the `timeupdate` event:

`player.js`

	this.api.on('timeupdate', $.proxy(this.onTimeUpdate, this));

Note that the `timeupdate` event is throttled due to performance reasons. This doesn't matter for now, since we only display seconds.

`player.js`

	myPlayer.onTimeUpdate = function(){
		var currentTime = this.api.getCurrentTime();
		this.$time.find('.elapsed').html(this.formatSeconds(currentTime));
	};

The way the time is formatted is fully customisable, and allows you to use elapsed time, remaining time, or even percentages. Do remember to account for videos that are more than an hour long. Even if you have none of those right now, they might be used in the future!

## Conclusion

That's it! We created a very simple skin with the Blue Billywig Player API, with a play / pause button, a mute / unmute button and a time display. There are many more features that can be implemented, but those will be covered in future posts. If you want to be kept informed, please subscribe to our newsletter at the top of this page!

The end result is available at **TODO: INSERT LINK**. To view the full code, please visit the [Github page](https://github.com/bluebillywig/skin-tutorial) with the source code.