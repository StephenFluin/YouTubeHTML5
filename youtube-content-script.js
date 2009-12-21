/**
* HTML5 Youtube Video Replacement
* Originally by mark renouf
* Modified by Stephen Fluin
*/

var video_id = null;
var video_hash = null;
var video_player = document.getElementById('movie_player');
var mp4_video_src = null;

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
	//alert("localstorage is " + window.localStorage + " and onlysd is " + window.localStorage["onlysd"]);
	//alert("autoplay is " + window.localStorage["autoplay"]);
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
		var video = document.createElement('video');
		video.id = "html5-player";
		video.autoplay = (window.localStorage["autoplay"] == "true");
		video.controls = true;
		video.autobuffer = (window.localStorage["preload"] == "true");
		video.style.width='100%';
		if(!window.localStorage["onlysd"] || window.localStorage["onlysd"] == "false") {
			video.appendChild(hd);
		}
		
		
		video.appendChild(std);
		video.appendChild(old);
		player.replaceChild(video, player.firstChild);
		
		var options = document.createElement('div');

		options.innerHTML = " <form onsubmit='return false;' style='color:white;background-color:black;' id='html5-options'>" +
		"<h1>YouTube HTML 5 Options</h1>" + 
		"<label><input type='checkbox' name='autoplay' id='html5-autoplay'/> Autoplay Videos</label>" +
		"<label><input type='checkbox' name='preload' id='html5-preload'/> Preload Videos</label>" +
		"<label><input type='checkbox' name='onlysd' id='html5-onlysd'/> Show only Standard Definition Videos</label><button id='html5-save' style='color:white;border:1px solid blue;'>Save</button>" +
		//"<!--<a href='" + hd.src + "' target='_blank'>Download</a><button id='html5-big' style='color:white;border:1px solid blue;'>Big</button>-->" +
		"<div><em>Note, autobuffer/preload is ignored until <a href='http://code.google.com/p/chromium/issues/detail?id=16482'>Issue 16482</a> is fixed.</em></div><div id='html5-settings'></div>" + 
		"</form>";
		
		player.appendChild(options);
		document.getElementById('html5-save').onclick = save_options;
		//document.getElementById('html5-big').onclick = makeItBig;
		
		
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
	
}
function makeItBig() {
	var vid =  document.getElementById("html5-player");
	vid.style.position = 'absolute';
	vid.style.top = "0px";
	vid.style.left = "0px";
	vid.style.width = document.innerWidth;
	vid.style.height = document.innerHeight;
	vid.style.index = '400';
}

function makeItSmall() {

}