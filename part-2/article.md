In the [previous part](https://www.bluebillywig.com/nl/blog/skinning-blue-billywig-player-part-1-basic-controls) of the skin tutorial, we covered the initial setup in HTML, CSS and Javascript along with a play/pause button, a mute/unmute button and a simple time display. Although we got a good, [working example](http://bluebillywig.github.io/skin-tutorial/part-1/), there are still a lot of features missing that every video player should have.

In part two of the custom skin tutorial, we will cover some more complicated user interface elements: The progress bar, volume bar and the video quality selector. If you have not done so, I strongly recommend reading through part one of the tutorial, since it covers some basic concepts that are important in the latter two parts of the tutorial.

A working example can be found [here](http://bluebillywig.github.io/skin-tutorial/part-2/), the source code can be found [here](https://github.com/bluebillywig/skin-tutorial/tree/master/part-2), and the complete tutorial can be found [here](http://bluebillywig.github.io/skin-tutorial/).

## The progress bar

One of the most common features in a video player is a progress bar, which allows the user to skip to a different part of the video, and gives a visual indication of the progress in the video.

We can divide the development of the progress bar into two parts: Visualising the progress in the video, and interacting with the bar to jump to a certain time.

### The HTML and CSS

First, we build a simple HTML structure and style it with CSS. Nothing fancy here, just a container that is the whole bar, and a child element (the progress indicator) that will display the progressed time.

<html>
<div class="progressbar">
    <div class="progress-indicator"></div>
</div>
</html>

There is very little CSS needed to get this working:

<css>
/* Progressbar */
.progressbar {
    position: relative;
    height: 5px;
}
.progressbar .progress-indicator {
    height: 100%;
    width: 0%;
}
</css>

In the example page, I've made the progress bar a little more appealing by adding a border to the container and a background to the progress indicator.

The key here is the `width` property of the progress indicator. We will adjust this using Javascript to actually display the correct progress. The advantage of using a percentage is the fact that the container can be any size and we can easily restyle the element using CSS at a later stage.

### Displaying the correct time

Adjusting the width to the correct time is pretty straightforward. In part one of this tutorial, we already made a function that listens to the `timeupdate` and `timeupdate` events to update the time that is displayed. Since we also want to adjust the progress indicator on that event, we have to do a little refactoring to keep things organised.

First, we create two variables that contain the duration of the video, and the current time. We also create a variable that we can use to access the progress bar element.

<javascript>
// Init variables
this.duration = 0;
this.currentTime = 0;
// Find the progress bar
this.$progressbar = this.$controlbar.find('.progressbar');
this.$progressIndicator = this.$progressbar.find('.progress-indicator');
</javascript>
    
We set them both to 0, since we start the video at 0 seconds. The duration can be a point of discussion, but for the sake of simplicity, we set it also to 0.

Next, we migrate the code to update the time display to separate functions:

<javascript>
// Text time / duration display
myPlayer.updateTimeDuration = function(){
    this.$time.find('.duration').html(this.formatSeconds(this.duration));
};
myPlayer.updateTimeElapsed = function(){
    this.$time.find('.elapsed').html(this.formatSeconds(this.currentTime));
};
</javascript>

Finally, we update our event handlers to update the variables we set earlier, and we call the newly created functions.

<javascript>
myPlayer.onDurationChange = function(){
    this.duration = this.api.getDuration();
    this.updateTimeDuration();
};
myPlayer.onTimeUpdate = function(){
    this.currentTime = this.api.getCurrentTime();
    this.updateTimeElapsed();
};
</javascript>

One might argue that this structure is way to abstract for such a simple component, but I noticed that things can get very complicated later on when more features are added. One example might be the introduction of a live video broadcast, which naturally will not have a duration. The introduction of the progress bar will already show the benefit!

<javascript>
myPlayer.updateProgressbar = function(){
    var percentagePlayed = (this.currentTime / this.duration);
    if(percentagePlayed > 1){
        percentagePlayed = 1;
    } else if(percentagePlayed < 0) {
        percentagePlayed = 0;
    }
    this.$progressIndicator.width(percentagePlayed * 100 + '%');
};
</javascript>

The `if` statement makes sure the progress bar will never display unusual values, just to be sure. Calling this new function will update the progress bar with the current time and duration that we set on the related events.

<javascript>
myPlayer.onDurationChange = function(){
    ..
    this.updateProgressbar();
};
myPlayer.onTimeUpdate = function(){
    ..
    this.updateProgressbar();
};
</javascript>

Right now, our progress bar displays the correct progress. Next up is user interaction!

### Seeking with the progress bar

Our progress bar can be used in multiple ways, clicking, dragging, what happens when the user drags out of the progress bar? These are all scenarios that have to be taken into account, and it is a good idea to identify all these scenarios in a very detailed manner:

* Mouse down on the progress bar should:
	* Pause the video (but not display the pause icon!).
	* Move the indicator to the mouse position.
	* Seek the video to that position (this allows the user to preview the frame at that position).
* Mouse move on the body after mouse down on the progress bar should:
	* Move the indicator to the mouse position.
	* Seek the video to that position.
* Mouse up on the body after mouse down on the progress bar should:
	* Move the indicator to the mouse position.
	* Seek the video to that position.
	* Play the video if it was paused at the mouse down event.

As you can see, the progress bar is a pretty complicated element. After mouse down on the progress bar, we should take into account all mouse movements on the body so that the user doesn't have to drag in the progress bar (which can be a hassle).


#### Mouse down

First the mouse down event, note that we also bind to the `touchstart` event:

<javascript>
this.$progressbar.on('mousedown touchstart', $.proxy(this.seekStart, this));
</javascript>
    
This is where it gets interesting. We should save the 'before-seek-state' to decide the playing on mouse up, then we should pause the video to prevent strange seeking / playing behaviour, and we should update the progress bar to a position where the mouse is. Last, but not least, the player should seek to the position.

<javascript>
myPlayer.seekStart = function(ev){
    this.seekWasPlaying = this.api.isPlaying();
    this.api.pause();
    var position = this.getPosInElement(ev, myPlayer.$progressbar);
    this.updateProgressbar(position.x);
    var positionInSeconds = this.duration * position.x;
    this.api.seek(positionInSeconds);
};
</javascript>

In order to avoid duplicate code, we extend our `updateProgressbar` function with an optional argument which we can use to supply a position.

<javascript>
myPlayer.updateProgressbar = function(position){
    if(typeof position == 'number'){
        // If we get a position passed, we force the progressbar to that position.
        var percentagePlayed = position;
    } else {
        // Else, we use the time.
        var percentagePlayed = (this.currentTime / this.duration);
    }
    ..
};
</javascript>

We get the position using a custom function that returns the position of a mouse event in a specified element in percentages.

<javascript>
myPlayer.getPosInElement = function(ev, element){
    var offset = element.offset();
    var relX = ev.pageX - offset.left;
    var relY = ev.pageY - offset.top;
    return {x: (relX / element.width()), y: (relY / element.height())};
};
</javascript>

#### Move event

After mouse down (or touch start), we should enable the user to *drag* the progress indicator to a different position. We bind the mouse move event inside the mouse down handler:

<javascript>
myPlayer.seekStart = function(ev){
    ..
    $(document).on('mousemove touchmove', $.proxy(this.seekMove, this));
};
</javascript>

The handler is pretty simple, doing a lot of the same stuff as the mouse down handler.

<javascript>
myPlayer.seekMove = function(ev){
    var position = this.getPosInElement(ev, myPlayer.$progressbar);
    this.updateProgressbar(position.x);
    var positionInSeconds = this.duration * position.x;
    this.api.seek(positionInSeconds);
};
</javascript>

But there is an important issue with this handler. When the user drags the indicator outside the progress bar, the progress bar will still remain inside due to our check in the `updateProgressbar` function. We need the same check before issuing the `seek` command on the API, however with a slight change.

<javascript>
myPlayer.gentleSeek = function(position){
    var positionInSeconds = this.duration * position;
    if(positionInSeconds > this.duration - 0.1){
        positionInSeconds = this.duration - 0.1;
    } else if(positionInSeconds < 0){
        positionInSeconds = 0;
    }
    this.api.seek(positionInSeconds);
};
</javascript>

If the user drags behind the progress bar, we limit our seek position to 0.1 seconds before the end. This makes sure the video does not get ended, and the user can drag back to the progress bar and continue seeking as usual. Note that this is a decision of taste, and that the behaviour might be different in various other use cases.

#### End event

Now for the final event: Ending the drag with mouse up / touch end. Bind the event on the body in the `seekStart` handler:

<javascript>
myPlayer.seekStart = function(ev){
    ..
    $(document).on('mouseup touchend', $.proxy(this.seekEnd, this));
};
</javascript>

The progress end handler has a lot in common with the other two events, but is also slightly different:

<javascript>
myPlayer.progressEnd = function(ev){
    var position = this.getPosInElement(ev, myPlayer.$progressbar);
    this.updateProgressbar(position.x);
    this.api.seek(this.duration * position.x);
};
</javascript>


We will not be using the `gentleSeek` function, because when the user stops seeking *behind the progressbar*, he probably wants to end the video. The saved variable from the `seekStart` handler is used to play the video again. We also check if the user hasn't seeked to the end of the video, to avoid starting the video from the start:

<javascript>
myPlayer.seekEnd = function(ev){
    ..
    if(this.seekWasPlaying && position.x < 1){
        this.api.play();
    }
    ..
};
</javascript>

Finally, we will also unbind the `move` and `end` event:

<javascript>
myPlayer.seekEnd = function(ev){
    ..
    $(document).off('mousemove touchmove', this.seekMove);
    $(document).off('mouseup touchend', this.seekEnd);
};
</javascript>

As you might notice, the play button will change when we are dragging the progress bar. In order to avoid this, we save a variable `seeking` that wil prevent the button to change.

<javascript>
this.seeking = false;

myPlayer.seekStart = function(ev){
    this.seeking = true;
    ..
};

myPlayer.seekEnd = function(ev){
    this.seeking = false;
    ..
};

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
</javascript>

Right now, we have a fully working progress bar which we can use to seek in the video. We can extend the progress bar with more features (like displaying the time when seeking), but I leave that up to you to figure out.

## The volume controls

An important aspect of video is audio, and we want to be able to control that too. We do not only want to mute and unmute the audio, but we also want to adjust the volume. The volume slider is a simpler concept than the progress bar, but shares a lot of the same logic in the way it handles dragging.

We adjust our HTML and CSS to fit a volume slider in:

<html>
<div class="volume-slider">
    <div class="volume-indicator">
</div>
</html>

<css>
/* Volume slider */
.volume-slider {
    position: relative;
    height: 5px;
}

.volume-slider .volume-indicator {
    height: 100%;
    width: 100%;
}
</css>

Some Javascript to initialise all the variables we need:

<javascript>
myPlayer.init = function(targetContainer){
    ..
    // Find the volume slider
    this.$volumeSlider = this.$controlbar.find('.volume-slider');
    this.$volumeIndicator = this.$volumeSlider.find('.volume-indicator');
    
    this.volume = 1;
    this.muted = false;
    ..
};
</javascript>

A function that updates the slider, with the same force functionality as the `updateProgressbar` function:

<javascript>
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
</javascript>

Note that we set the percentage to 0 if the volume is muted. This is a user interface choice, but in my opinion it would make sense.

Next up are the events that update the volume if the player itself changes the volume (this could happen when there are interactive elements in the video that influence the volume). Since we already have a function that handles volume changes, we can add it there:

<javascript>
myPlayer.onVolumeChange = function(){
    this.volume = this.api.getVolume();
    this.muted = this.api.getMuted();
    this.updateVolumeSlider();
    ..
};
</javascript>

Right now, the volume indicator will display the correct volume. However, it isn't much use if we can't adjust it anyway. We bind an event to the slider and use the same logic as we did in the progress bar:

<javascript>
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
</javascript>

## The quality selector

The Blue Billywig Online Video Platform generates multiple assets for each video, to ensure the best possible playback experience. However, some users might want to manually adjust the quality they are seeing. We will render a list of all available *assets* (our name for the same videos with different qualities), indicating the active asset and the ability to select another one. In the HTML, we place a container that will contain all the available assets in an unordered list:

<html>
<div class="quality-selector">
    <div class="quality button">
        <i class="fa fa-cog"></i>
    </div>
    <ul class="quality-list">
        <li class="active">Auto</li>
    </ul>
</div>
</html>

Next, we create a handler on the `assetlistchange` that will get the assets and store them in a variable. We will also listen to the `assetselected` event to store the active asset in a variable.

<javascript>
myPlayer.init = function(targetContainer){
    ..
    this.assets = [];
    this.activeAsset;
    ..
    this.api.on('assetlistchange assetselected', $.proxy(this.onAssetChange, this));
    ..
};
</javascript>

The handler updates the variables, and executes a function that renders the asset list. We render the whole asset list again every time something changes in the assets, since this event won't occur frequently. It makes our code a lot simpler and won't have a big impact in performance.

<javascript>
myPlayer.onAssetChange = function(){
    this.assets = this.api.getAssets();
    this.activeAsset = this.api.getCurrentAsset();
    this.renderAssets();
};
</javascript>

The `renderAssets` function loops through all the assets, and checks whether the asset is active and marks it as such.

<javascript>
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
</javascript>

Every element gets a handler that selects the asset, which is very easy since we save the asset id in the `id` attribute of the element.

<javascript>
myPlayer.selectAsset = function(ev){
    this.api.setAsset(ev.target.id);
};
</javascript>

That's all there is to the quality selector!

## Wrapping up

In this part of the tutorial, we created a progress bar that displays the progress and allows the user to seek through the video. The audio slider allows the user to change the volume and the quality selector will display the current quality, and allows the user to select a different quality. Our player skin is getting better and better, and provides a better experience to the end users.

The next and final tutorial (part 3) addresses the non-playing states: The start screen which contains a big play button and a title, and the end screen which contains a replay button and a *next video* button. In addition, we will take a look at the full screen functionality.