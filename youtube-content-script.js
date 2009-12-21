var video_id = null;
var video_hash = null;
var video_player = document.getElementById('movie_player');
var mp4_video_src = null;

if (video_player) {
  // Create MP4 download url
  // Based on the original bookmarklet by http://googlesystem.blogspot.com 
  var flash_variables = video_player.attributes.getNamedItem('flashvars');
  if (flash_variables) { 
    var flash_values = flash_variables.value;
    if (flash_values) {
      var video_id_match = flash_values.match(/[^a-z]video_id=([^(\&|$)]*)/);
      if (video_id_match != null)
        video_id = video_id_match[1];
        
      var video_hash_match=flash_values.match(/[^a-z]t=([^(\&|$)]*)/);
      if (video_hash_match != null)
        video_hash = video_hash_match[1]
    }
  }
}

if (video_id != null && video_hash != null) {
  var hd = document.createElement("source");
  hd.src = 'http://www.youtube.com/get_video?fmt=22&video_id=' + video_id + '&t=' + video_hash;  
  var std = document.createElement("source");
  std.src = 'http://www.youtube.com/get_video?fmt=18&video_id=' + video_id + '&t=' + video_hash;
  var old = document.createElement("source");
  old.src = 'http://www.youtube.com/get_video?video_id=' + video_id + '&t=' + video_hash;
  
  
  var player = document.getElementById('watch-player-div');
  if (player) {
    var video = document.createElement('video');
    video.autoplay = true;
    video.controls = true;
    video.style.width='100%';
    video.appendChild(hd);
    video.appendChild(std);
    video.appendChild(old);
    player.replaceChild(video, player.firstChild);
  }
}
