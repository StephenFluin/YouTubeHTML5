
var download = document.getElementById('download-youtube-video');
if (download) {
  // Find the signed MP4 download url
  var links = download.getElementsByTagName('A');
  
  if (links.length > 0) {
    var href = links[0].href;

    var player = document.getElementById('watch-player-div');
    if (player) {
      var video = document.createElement('video');
      video.autobuffer = true;
      video.controls = true;
      video.src = mp4src;
  
      player.replaceChild(player.firstChild, video);
    }
  }
}

