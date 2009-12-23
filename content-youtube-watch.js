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
// used for logging
var TAG = "[YouTubeHTML5] ";

// the default settings if no settings are saved
// make sure any expected structure is initialized here
var options = {
    "autoplay": true,
    "autobuffer": true,
    "prefer_hd": true,
    "disabled_videos": {}
};
options = load_options();
var video_id = get_video_id();
var disabled = !!(options.disabled_videos[video_id]);
var mode = "flash"; // or "html5"
var video_data = {};
var sources = {};
var flash_html;
var video_html;
var supported = true;
var formats;

var player_div = document.getElementById('watch-player-div');
if (!player_div) {
    // Channels: playnav-player
    player_div = document.getElementById('playnav-player');
}

if (!!player_div) {
    // save for restoration later
    flash_html = player_div.firstChild.outerHTML;
    
    player_div.appendChild(create_options());
    
    load_data(video_id, function(data) {
        video_data = data;
        
        // select 22 if hd available and requested,
        // else select 18
        // else not supported (until FLV support is fixed)
        var fmt = data.hd && (!!data.formats[22]) ? "22" : (!!data.formats[18]) ? "18" : "";
        
        if (mode == "html5" && fmt == "") {
            console.warn("No compatible video format is available for this browser's HTML5 implementation.");
            mode = "flash";
        }
        
        if (!disabled) {
            switch_mode();
        }
    });
}

function load_data(video_id, load_callback) {
    // Request data for the page through the background page since we can
    // only access DOM elements within the page and not JavaScript
    chrome.extension.sendRequest({
        'video_id': video_id
    }, function callback(data) {
        console.debug(TAG + "received data from background page");
        
        // True if the video is available in High Definition (720p -- fmt=22)
        var hd = (!!data.IS_HD_AVAILABLE);
        
        // fmt_list and fmt_map contain information on which formats the video is
        // available in, example:
        //
        // 18/512000/9/0/115,34/0/9/0/115,5/0/7/0/0
        //
        // The first number is the 'fmt' id. Unsure of the others. fmt_list and
        // fmt_map always seem to contain identical information.
        var formats = {};
        var formatList = unescape(data.SWF_ARGS.fmt_list);
        var fmtListArr = formatList.split(",");
        for (var i = fmtListArr.length - 1; i >= 0; i--) {
            var fields = fmtListArr[i].split("/");
            formats[fields[0]] = true;
        }
        
        console.log(TAG + "Available formats (fmt=xx): ", formats);
        
        // The simple way to retrieve the video stream is:
        //
        // http://www.youtube.com/get_video
        // ?fmt=22
        // &video_id={VIDEO_ID}
        // &t=
        //
        // (The 't' parameter must be supplied and can be read from the page. I
        // beleive it
        // is some sort of session key (32 bytes, base64 encoded)).
        //
        // This URL format generates a redirect to the full format shown above.
        
        var t = unescape(data.SWF_ARGS.t);
        
        load_callback({
            'video_id': video_id,
            'formats': formats,
            'hd': hd,
            't': t
        });
    });
}

/**
 * Swaps the Flash player with the HTML5 Video (and back)
 * Uses globals:
 *   player_div, flash_html, video_data, format
 */
function switch_mode() {
    if (mode == "flash") {
        if (options.preferhd && !video_data.hd) {
            console.warn(TAG + "HD format is not available for this video.");
        }
        
        var fmt = "";
        
        // For now, Chrome will only play back videos in MPEG4 containers, not FLV.
        var fmt18_available = (!!video_data.formats[18]); // ?? (600x360?)
        var fmt22_available = (!!video_data.formats[22]); // 720p
        var fmt37_available = (!!video_data.formats[37]); // 1080p TODO
        // This logic is a little complicated but it works for now since there's only two working formats.
        // Later, the available formats should probably be ranked and sorted to select the right one.
        
        if (options.preferhd && fmt22_available) {
            fmt = "22";
        }
        else 
            if (fmt18_available) {
                fmt = "18";
            }
            else 
                if (fmt22_available) {
                    fmt = "22"; // if fmt=18 not available use HD, no other format will work
                    console.warn(TAG + "Forcing HD mode since it's the only MPEG4 stream available.");
                }
                else {
                    console.warn(TAG + "No compatible video formats are available (FLV only).")
                    return "not_supported";
                }
        
        mode = "html5";
        player_div.innerHTML = "";
        player_div.appendChild(create_html5_video(video_data, fmt));
        player_div.appendChild(create_options());
    }
    else {
        mode = "flash";
        player_div.innerHTML = flash_html;
        player_div.appendChild(create_options());
    }
    return "ok";
}

function create_html5_video(video_data, format) {
    console.debug(TAG + "init_video() data:", video_data, "fmt:", format);
    
    var html5_video = document.createElement('video');
    html5_video.setAttribute('width', '100%');
    // video.setAttribute('height', '100%');
    html5_video.setAttribute('controls', 'controls');
    
    if (!!options.autobuffer) 
        html5_video.setAttribute('autobuffer', 'autobuffer');
    
    if (!!options.autoplay) 
        html5_video.setAttribute('autoplay', 'autoplay');
    
    html5_video.addEventListener('error', function() {
        switch (video.error.code) {
            case 1:
                console.error(TAG + "VIDEO: MEDIA_ERR_ABORTED");
                break;
            case 2:
                console.error(TAG + "VIDEO: MEDIA_ERR_NETWORK");
                break;
            case 3:
                console.error(TAG + "VIDEO: MEDIA_ERR_DECODE");
                break;
            case 4:
                console.error(TAG + "VIDEO: MEDIA_ERR_SRC_NOT_SUPPORTED");
                break;
        }
    });
    
    html5_video.addEventListener('loadedmetadata', function() {
        console.log(TAG + "VIDEO: loadedmetadata (width: " + html5_video.videoWidth + ", height: " + html5_video.videoHeight + ", duration: " + html5_video.duration + ")");
    });
    
    html5_video.addEventListener('canplaythrough', function() {
        console.log(TAG + "VIDEO: canplaythrough");
        // video.play(); // experimenting...
    });
    
    html5_video.addEventListener('loadeddata', function() {
        console.log(TAG + "VIDEO: dataloaded");
    });
    
    //html5_video.addEventListener('progress', function() {
    //    console.log(TAG + "VIDEO: progress");
    //});
    
    var src = "http://www.youtube.com/get_video?fmt=" + format + "&video_id=" + video_data.video_id + "&t=" + video_data.t;
    html5_video.setAttribute('src', src);
    
    return html5_video;
}

function create_options() {
    var optionsDiv = document.createElement('div');
    optionsDiv.style.backgroundColor = "black";
    optionsDiv.style.color = "white";
    optionsDiv.innerHTML = "<h1>YouTube HTML 5 Options</h1>" +
    "<label><input type='checkbox' id='html5-autoplay'/> Autoplay Videos</label>" +
    "<label><input type='checkbox' id='html5-preload'/> Preload Videos</label>" +
    "<label><input type='checkbox' id='html5-preferhd'/> Show HD when available</label>" +
    "<button id='html5-disable' style='margin-left:100px;color:white;border:1px solid blue;'>" +
    (mode == "flash" ? "Switch to HTML5" : "Switch to Flash") +
    "</button>" +
    "<div><em>Note, autobuffer/preload is ignored until " +
    "<a href='http://code.google.com/p/chromium/issues/detail?id=16482'>Issue 16482</a>" +
    "is fixed.</em></div>";
    player_div.appendChild(optionsDiv);
    
    console.debug("autoplay");
    var ap = document.getElementById('html5-autoplay');
    ap.checked = options.autoplay;
    ap.onchange = function(e) {
        options.autoplay = e.target.checked;
        save_options();
    };
    
    console.debug("preload");
    var pl = document.getElementById('html5-preload');
    pl.checked = options.preload;
    pl.onchange = function(e) {
        options.preload = e.target.checked;
        save_options();
    };
    
    console.debug("preferhd");
    var hd = document.getElementById('html5-preferhd');
    hd.checked = options.preferhd;
    hd.onchange = function(e) {
        options.preferhd = e.target.checked;
        save_options();
    };
    
    console.debug("html5-disable");
    document.getElementById('html5-disable').onclick = function(e) {
        if (switch_mode() == "not_supported") {
            alert("Sorry, this video has no formats compatible with this browser's HTML video support.");
        }
        else {
            var disabled = !options.disabled_videos[video_id];
            options.disabled_videos[video_id] = disabled;
            save_options();
            e.target.innerText = mode == "flash" ? "Switch to HTML5" : "Switch to Flash";
        }
    };
    
    return optionsDiv;
}

/**
 * retrieves video id from the pages URL query parameters
 */
function get_video_id() {
    var q = document.location.search;
    var m = q.match(/v=([^&]+)/);
    var video_id = "";
    if (!!m && m.length > 1) {
        return m[1];
    }
    return "";
}

/**
 * Load options from local storage
 *
 * @return Settings object
 */
function load_options() {
    var jsondata = window.localStorage["ythtml5_options"];
    if (typeof jsondata != "undefined") {
        options = JSON.parse(jsondata);
    }
    return options;
}

/**
 * Saves options to local storage
 */
function save_options() {
    window.localStorage["ythtml5_options"] = JSON.stringify(options);
}

function volume_change(event) {
    alert("Volume change with " + event);
}
