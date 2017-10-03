electron = require('electron');

let fs = require('fs'),
  path = require('path'),
  ul = document.querySelector('ul'),
  folder = document.querySelector('input'),
  config = JSON.parse(fs.readFileSync('config.json', 'utf8')), {shell, BrowserWindow, ipcRenderer} = electron,
  vd = document.querySelector('video'),
  browser = document.querySelector('.browser'),
  player = document.querySelector('.player'),
  aCtrl = document.querySelector('.app-control'),
  fScreen = document.querySelector('.app-fullscreen'),
  mScreen = document.querySelector('.app-minimize'),
  fcls = document.querySelector('.app-close'),
  vdCtrl = document.querySelector(".video-controls"),
  isVideoFullScreen = false,
  Mousetrap = require('mousetrap'),
  bdy = document.querySelector('body'),
  timeBkd = 5,
  timeFrw = 5,
  timeCBkd = 30,
  timeCFrw = 30,
  vdBck = document.querySelector('.video-back'),
  dir,
  videoPlayer;

dir = config.directory;
readFolder(dir);

fScreen.addEventListener("click", function () {
  toggleFullScreen();
});

mScreen.addEventListener("click", function () {
  ipcRenderer.send('window:minimize');
});

vdBck.addEventListener("click", function () {
  dir = path.resolve(dir, '../');
  closePlayer();
  readFolder(dir);
});

function closePlayer() {
  toggle(player);
  toggle(browser);
  toggle(aCtrl, 'video-player-on');
  videoPlayer.stop();
  vd.innerHTML = '';
}

bdy
  .addEventListener('keydown', function (e) {
    switch (e.keyCode) {
      case 27:
        toggleFullScreen(true);
        break;
    }
  });

function toggleFullScreen(force = '') {
  isVideoFullScreen = isVideoFullScreen
    ? false
    : true;
  if (force) {
    isVideoFullScreen = false;
  }
  ipcRenderer.send('window:minmax', isVideoFullScreen);
}

fcls
  .addEventListener("click", function () {
    ipcRenderer.send('window:close');
  });

function readFolder(p) {
  ul.innerHTML = '';
  fs.readdir(p, (err, files) => {
    'use strict';
    if (err)
      throw err;
    if ((path.resolve(dir) !== path.resolve(dir, '../')) && (path.resolve(dir) !== path.parse(config.directory))) {
      fs.stat(path.join(dir, '../'), (err, stats) => {
        if (!stats) {
          return;
        }
        createItem(p, 'back', stats, path.join(dir, '../'));
      });
    }
    for (let file of files) {
      fs.stat(path.join(p, file), (err, stats) => {
        if (!stats) {
          return;
        }
        createItem(p, file, stats)
      });
    }
  });
}

function clickEvent(e, isDir) {
  e
    .addEventListener('dblclick', function (e) {
      dir = this.getAttribute('path');
      if (isDir) {
        readFolder(dir);
      } else {
        var tmp = dir.split('.');
        createPlayer(dir, tmp[tmp.length - 1]);
      }
    });
}

function toggle(e, cls = 'active') {
  e
    .classList
    .toggle(cls);
}

function createPlayer(file, type) {
  toggle(player);
  toggle(browser);
  switch (type) {
    case 'mkv':
    case 'avi':
      type = 'webm';
      break;

  }
  var src = createEle('SOURCE');
  src.setAttribute('type', 'video/' + type);
  src.setAttribute('src', file);
  vd.innerHTML = '';
  vd.appendChild(src);
  toggle(aCtrl, 'video-player-on');
  playerControls();
}

function playerControls() {
  let video = vd,
    videoControls = document.getElementById('videoControls'),
    play = document.getElementById('play'),
    progressContainer = document.getElementById("progress"),
    progressHolder = document.getElementById("progress_box"),
    playProgressBar = document.getElementById("play_progress"),
    that;
  videoPlayer = {
    init: function () {
      // this is equal to the videoPlayer object.
      that = this;
      video.load();
      // Helpful CSS trigger for JS.
      document.documentElement.className = 'js';

      // Get rid of the default controls, because we'll use our own.
      video.removeAttribute('controls');

      videoPlayer.trackPlayProgress();
      // When meta data is ready, show the controls
      video.addEventListener('loadeddata', this.initializeControls, false);
      that.handleButtonPresses();
      that.mouseDetect();
      that.keyBind();
    },
    handleButtonPresses: function () {
      // When the video or play button is clicked, play/pause the video.
      player.addEventListener('click', this.playPause, false);
      // When the video has concluded, pause it.
      video.addEventListener('ended', function () {
        this.currentTime = 0;
        this.pause();
      }, false);
    },
    playPause: function () {
      toggle(player, 'pause');
      if (video.paused || video.ended) {
        if (video.ended) {
          video.currentTime = 0;
        }
        video.play();
        toggle(player, 'play');
        setTimeout(function () {
          toggle(player, 'play');
        }, 1500);
        videoPlayer.trackPlayProgress();
        ipcRenderer.send('window:onTop', true);
      } else {
        video.pause();
        videoPlayer.trackPlayProgress();
        ipcRenderer.send('window:onTop', false);
      }
    },
    trackPlayProgress: function () {
      (function progressTrack() {
        videoPlayer.updatePlayProgress();
        playProgressInterval = setTimeout(progressTrack, 50);
      })();
    },
    stopTrackingPlayProgress: function () {
      clearTimeout(playProgressInterval);
    },
    updatePlayProgress: function () {
      playProgressBar.style.width = ((video.currentTime / video.duration) * (progressHolder.offsetWidth)) + "px";
    },
    mouseDetect: function () {
      var timeout;
      document.onmousemove = function () {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          controlsAnimation(false);
        }, 2500);
        controlsAnimation(true);
      }
    },
    keyBind: function () {
      player
        .addEventListener('keydown', function (e) {
          console.log(e.keyCode, e);
        });
      // Mousetrap.bind('4', function () {   console.log('4'); }); Mousetrap.bind("?",
      // function () {   console.log('show shortcuts!'); });
      bdy.addEventListener('keydown', function (e) {
        switch (e.keyCode) {
          case 39:
            video.currentTime += (e.ctrlKey)
              ? timeCBkd
              : timeBkd;
            break;
          case 37:
            video.currentTime -= (e.ctrlKey)
              ? timeCBkd
              : timeBkd;
            break;
          case 27:
            toggleFullScreen(true);
            break;
          case 32:
            that.playPause();
            break;
        }
      });
    },
    stop: function () {
      video.ended = true;
      that.playPause();
    }
  };
  videoPlayer.init();
}

function controlsAnimation(shD) {
  if (shD) {
    aCtrl
      .classList
      .add('active');
    vdCtrl
      .classList
      .add('active');
  } else {
    aCtrl
      .classList
      .remove('active');
    vdCtrl
      .classList
      .remove('active');
  }
}

function createItem(p, file, stats, back = false) {
  if (checkMediaFile(file, back, stats.isDirectory())) {
    var li = createEle('LI', 'collection-item folder-item');
    li.setAttribute('path', back
      ? back
      : path.join(p, file));
    var i = createEle('I', 'material-icons dp48');
    i.innerHTML = back
      ? 'arrow_back'
      : stats.isDirectory()
        ? 'folder'
        : 'insert_drive_file';
    li.appendChild(i);
    var item = createEle('SPAN');
    item.innerHTML = file;
    li.appendChild(item);
    ul.appendChild(li);
    clickEvent(li, stats.isDirectory());
  }
}

function checkMediaFile(file, back, folder = false) {
  if (back || folder) {
    return true;
  }
  var mediaType = [
    'mp4',
    'mkv',
    'avi',
    'webm',
    'm4a'
  ]
  var tmp = file.split('.');
  if (mediaType.indexOf(tmp[tmp.length - 1]) == -1) {
    return false;
  }
  return true;
}

function createEle(ele, cls = '', id = '') {
  var e = document.createElement(ele);
  if (cls)
    e.className = cls;
  if (id)
    e.setAttribute("id", id)
  return e;
}