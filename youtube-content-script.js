/*
 * Copyright 2009, Mark Renouf
 * Copyright 2009, Stephen Fluin
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ 
/**
 * Content script which performs the modifications to the YouTube video page.
 */
var video_id = null;
var video_hash = null;
var video_player = document.getElementById('movie_player');
var mp4_video_src = null;

var replaced_player = null;


// If we are on a valid youtube page with a movie player.
if (video_player) {
	// Create MP4 download url
	// Based on the original bookmarklet by http://googlesystem.blogspot.com 
	var flash_variables = video_player.attributes.getNamedItem('flashvars');
	if (flash_variables) { 
		var flash_values = flash_variables.value;
		if (flash_values) {
			var video_id_match = flash_values.match(/[^a-z]video_id=([^(\&|$)]*)/);
			if (video_id_match != null) {
				video_id = video_id_match[1];}
			else {
				// Couldn't find id for video.
			}

			var video_hash_match=flash_values.match(/[^a-z]t=([^(\&|$)]*)/);
			if (video_hash_match != null) {
				
				video_hash = video_hash_match[1];
			} else {
				// Couldn't find hash for video, let's look for token= instead.
				video_hash_match=flash_values.match(/[^a-z]token=([^(\&|$)]*)/);
				if (video_hash_match != null) {
				
					video_hash = video_hash_match[1];
				}
			}
		}
	}
}

if (video_id != null && video_hash != null) {
	if(window.localStorage["onlysd"] == "true"){
		//alert("skipping hd option.");
	}  else {
		var hd = document.createElement("source");
		hd.src = 'http://www.youtube.com/get_video?fmt=22&video_id=' + video_id + '&t=' + video_hash;  
		//alert("adding hd option because localstorage reported" + window.localStorage["onlysd"]);
	}
	var std = document.createElement("source");
	std.src = 'http://www.youtube.com/get_video?fmt=18&video_id=' + video_id + '&t=' + video_hash;
	var old = document.createElement("source");
	old.src = 'http://www.youtube.com/get_video?video_id=' + video_id + '&t=' + video_hash;
  
  
	var player = document.getElementById('watch-player-div');
	if(!player) {
		player = document.getElementById('playnav-player');
	}
	if (player) {
		
		var options = document.createElement('div');
		options.innerHTML = " <form onsubmit='return false;' style='color:white;background-color:black;' id='html5-options'>" +
		"<h1>YouTube HTML 5 Options</h1>" + 
		"<label><input type='checkbox' name='autoplay' id='html5-autoplay'/> Autoplay Videos</label>" +
		"<label><input type='checkbox' name='preload' id='html5-preload'/> Preload Videos</label>" +
		"<label><input type='checkbox' name='onlysd' id='html5-onlysd'/> Show only Standard Definition Videos</label><button id='html5-save' style='color:white;border:1px solid blue;'>Save</button><button id='html5-disable' style='margin-left:100px;color:white;border:1px solid blue;'>Disable</button>" +
		"<div><em>Note, autobuffer/preload is ignored until <a href='http://code.google.com/p/chromium/issues/detail?id=16482'>Issue 16482</a> is fixed.</em></div><div id='html5-settings'></div>" + 
		"</form>";
		player.appendChild(options);
		document.getElementById('html5-save').onclick = save_options;
		document.getElementById('html5-disable').onclick = disable_player;
		
	
		// This video hasn't had the HTML5 version disabled, so replace it.
		if(!window.localStorage["html5-disabledvideos"+video_id] ||  window.localStorage["html5-disabledvideos"+ video_id] != "disabled") {
				
			var video = document.createElement('video');
			video.id = "html5-player";
			video.autoplay = (window.localStorage["autoplay"] == "true");
			video.controls = true;
			video.autobuffer = (window.localStorage["preload"] == "true");
			
			// New Volume change tracking - doesn't work.
			video.volumechange = volume_change;
			
			// Get the offset of the video (@TODO make this a real function somehow)
			var offset = 0;
			var offsetPattern = /t=((\d+)m)?((\d+)s)/i;
			result =  parent.location.hash.match(offsetPattern);

			if(result) {
				offset += parseInt(result[2])*60;
				offset += parseInt(result[4]);
			}
			if(!video.currentTime) {
				// alert("Chromium doesn't yet support <video> time offsets.");
			} else {
				video.currentTime = offset;
			}
			video.style.width='100%';
			if(!window.localStorage["onlysd"] || window.localStorage["onlysd"] == "false") {
				video.appendChild(hd);
			}
			
			
			
			
			video.appendChild(std);
			video.appendChild(old);
			replaced_player = player.firstChild;
			player.replaceChild(video, player.firstChild);
		} else {
			document.getElementById("html5-disable").style.display="none";
		}
		load_options();
	}
} else {
	// Fail silently
	//alert("Couldn't find movie. id="+ video_id + " and hash ="+video_hash);
}


// Saves options to window.localStorage.
function save_options() {
	var preload = document.getElementById("html5-preload");
	var autoplay = document.getElementById("html5-autoplay");
	var onlySD = document.getElementById("html5-onlysd");
	
	if(preload.checked) {
		window.localStorage["preload"] = "true";
		//alert("was checked, setting true");
	} else {
		window.localStorage["preload"] = "false";
		//alert("Wasn't checked, setting false");
	}
	if(autoplay.checked) {
		window.localStorage["autoplay"] = "true";
	} else {
		window.localStorage["autoplay"] = "false";
	}
	window.localStorage["onlysd"] = (onlySD.checked ? "true" : "false");
		
	
	alert("saved!");
	load_options();
}

function load_options() {
	var preload = document.getElementById("html5-preload");
	var autoplay = document.getElementById("html5-autoplay");
	var onlySD = document.getElementById("html5-onlysd");

	var p = window.localStorage["preload"];
	var a = window.localStorage["autoplay"];
	var o = window.localStorage["onlysd"];
	
	p = (!p) ? true : (p == "true");
	a = (!a) ? true : (a == "true");
	o = (!o) ? false : (o == "true");
	
	//document.getElementById("html5-settings").innerHTML = "Preload is " + p + " and autoload is " + a + " onlysd is " + o + ".";

	preload.checked = p;
	autoplay.checked = a;
	onlySD.checked = o
	window.localStorage["html5-disabledvideos" + video_id] = "enabled";
	
}
function volume_change(event) {
	alert("Volume change with " + event);
}
function disable_player() {
	var tmp = player.firstChild;
	player.replaceChild(replaced_player, player.firstChild);
	replaced_player = tmp;
	window.localStorage["html5-disabledvideos" + video_id] = "disabled";
	
}


