(function() {
  'use strict';

  var vid = document.getElementById('v');
  var stage = document.getElementById('stage');
  var load = document.getElementById('load');
  var hint = document.getElementById('hint');
  var playBtn = document.getElementById('play-btn');
  var playIcon = document.getElementById('play-icon');
  var muteBtn = document.getElementById('mute-btn');
  var volIcon = document.getElementById('vol-icon');
  var volSlider = document.getElementById('vol-slider');
  var fsBtn = document.getElementById('fs-btn');
  var gridBtn = document.getElementById('grid-btn');
  var quickGridToggle = document.getElementById('quick-grid-toggle');
  var pipBtn = document.getElementById('pip-btn');
  var liveBtn = document.getElementById('live-btn');
  var gridContainer = document.getElementById('grid-container');
  var vidContainer = document.getElementById('vid-container');
  var activeTitle = document.getElementById('active-channel-title');
  var castBtn = document.getElementById('cast-btn');

  var resoBtn = document.getElementById('reso-btn');
  var resoMenu = document.getElementById('reso-menu');
  var resoLabel = document.getElementById('reso-label');

  var player = null;
  var cur = 0;
  var watchdog = null;
  var isSplashActive = true;
  var isGridMode = false;
  var gridPlayers = [];
  var scale = 1, startDist = 0, isTouching = false;

  // User Customization State (Persisted in localStorage)
  var defaultPrefs = {
    layout: 'cinema',   // 'cinema' | 'grid' | 'theater'
    accent: 'crimson',  // 'crimson' | 'emerald' | 'blue' | 'mono'
    oled: false,
    glow: true,
    crop: false,
    compact: false
  };

  var prefs = Object.assign({}, defaultPrefs);
  try {
    var saved = JSON.parse(localStorage.getItem('lxwis_pbb_prefs'));
    if (saved) prefs = Object.assign(prefs, saved);
  } catch (e) {}

  function savePrefs() {
    try { localStorage.setItem('lxwis_pbb_prefs', JSON.stringify(prefs)); } catch (e) {}
  }

  function applyPrefs(skipLayoutSwitch) {
    document.body.setAttribute('data-accent', prefs.accent);
    document.body.classList.toggle('oled-mode', !!prefs.oled);
    document.body.classList.toggle('no-glow', !prefs.glow);
    document.body.classList.toggle('crop-video', !!prefs.crop);
    document.body.classList.toggle('compact-cards', !!prefs.compact);

    // Sync UI controls inside Customize Modal
    document.querySelectorAll('#layout-selector .seg-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-val') === prefs.layout);
    });
    document.querySelectorAll('#accent-selector .swatch-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-val') === prefs.accent);
    });

    var optOled = document.getElementById('opt-oled');
    var optGlow = document.getElementById('opt-glow');
    var optCrop = document.getElementById('opt-crop');
    var optCompact = document.getElementById('opt-compact');
    if (optOled) optOled.checked = !!prefs.oled;
    if (optGlow) optGlow.checked = !!prefs.glow;
    if (optCrop) optCrop.checked = !!prefs.crop;
    if (optCompact) optCompact.checked = !!prefs.compact;

    if (!skipLayoutSwitch) {
      if (prefs.layout === 'grid') {
        document.body.setAttribute('data-layout', 'cinema');
        if (!isGridMode) startGridMode();
      } else {
        document.body.setAttribute('data-layout', prefs.layout);
        if (isGridMode) stopGridMode(cur);
      }
    }
  }

  // Google Cast Setup
  var castContext = null, castSession = null, castApiReady = false;
  window.__onGCastApiAvailable = function(isAvailable) {
    if (!isAvailable) return;
    try {
      castContext = cast.framework.CastContext.getInstance();
      castContext.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });
      castApiReady = true;
      if (castBtn) castBtn.disabled = false;
    } catch (err) {}
  };

  if (castBtn) {
    castBtn.addEventListener('click', async function() {
      if (!castApiReady || !castContext || isGridMode || cur < 0) return;
      try {
        castSession = castContext.getCurrentSession() || (await castContext.requestSession(), castContext.getCurrentSession());
        if (!castSession) return;
        var channel = CH[cur];
        var mediaInfo = new chrome.cast.media.MediaInfo(channel[1], 'application/dash+xml');
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
        mediaInfo.metadata.title = channel[0] + ' — Live';
        await castSession.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo));
      } catch (err) {}
    });
  }

  // Visibility / Battery Saver
  document.addEventListener('visibilitychange', function() {
    if (document.pictureInPictureElement) return;
    if (document.hidden) {
      if (isGridMode) gridPlayers.forEach(p => { if (p.getMediaElement()) p.getMediaElement().pause(); });
      else if (!vid.paused) vid.pause();
    } else {
      if (isGridMode) {
        gridPlayers.forEach(p => { var el = p.getMediaElement(); if (el) el.play().catch(() => {}); });
      } else {
        if (player) {
          var r = player.seekRange();
          if (r && r.end) vid.currentTime = r.end - 1;
        }
        if (vid.paused) vid.play().catch(() => {});
      }
    }
  });

  // PiP
  if (pipBtn) {
    pipBtn.onclick = async function() {
      if (isGridMode) return;
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else if (vid.requestPictureInPicture) await vid.requestPictureInPicture();
      } catch (err) {}
    };
  }

  // Live Edge Sync
  liveBtn.onclick = function() {
    if (player && !isGridMode) {
      var r = player.seekRange();
      if (r && r.end) vid.currentTime = r.end - 1;
      if (vid.paused) vid.play().catch(() => {});
      liveBtn.classList.remove('behind-live');
      liveBtn.textContent = 'LIVE';
    }
  };

  // Pinch-to-Zoom & Double-Tap Reset
  stage.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2 && !isGridMode) {
      isTouching = true;
      startDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
    }
  }, { passive: true });

  stage.addEventListener('touchmove', function(e) {
    if (!isTouching || e.touches.length !== 2 || isGridMode) return;
    e.preventDefault();
    var currentDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
    scale = Math.min(Math.max(scale * (currentDist / startDist), 1), 4);
    vid.style.transform = 'scale(' + scale + ')';
    startDist = currentDist;
  }, { passive: false });

  stage.addEventListener('touchend', function(e) {
    if (e.touches.length < 2) isTouching = false;
  });

  var lastTap = 0;
  vid.addEventListener('touchend', function(e) {
    if (isGridMode) return;
    var now = Date.now();
    if (now - lastTap < 300 && now - lastTap > 0) {
      scale = 1;
      vid.style.transform = 'scale(1)';
      e.preventDefault();
    }
    lastTap = now;
  });

  function setLoad(on, name, msg) {
    if (on) {
      load.querySelector('.s').textContent = msg || ('Connecting to ' + name + '...');
      load.classList.add('show');
    } else {
      load.classList.remove('show');
    }
  }

  function revealSplashEnter() {
    if (!isSplashActive) return;
    var loadingUI = document.getElementById('splash-loading-ui');
    var enterBtn = document.getElementById('splash-enter-btn');
    if (loadingUI && enterBtn) {
      loadingUI.classList.add('hidden');
      enterBtn.classList.remove('hidden');
    }
  }

  function markRow(i) {
    var rows = document.querySelectorAll('.feed-card');
    rows.forEach(function(row, k) {
      var isSelected = (k === i && !isGridMode);
      row.classList.toggle('on', isSelected);
      var badge = row.querySelector('.ch-badge');
      if (badge) badge.textContent = isSelected ? 'ON AIR' : 'HD';
    });
  }

  function stopWatch() {
    if (watchdog) { clearInterval(watchdog); watchdog = null; }
  }

  function updateResolutionMenu() {
    if (!player) return;
    resoMenu.innerHTML = '';
    var tracks = player.getVariantTracks();
    var heights = [...new Set(tracks.map(t => t.height).filter(Boolean))].sort((a, b) => b - a);

    var autoBtn = document.createElement('button');
    autoBtn.className = 'reso-item active';
    autoBtn.textContent = 'Auto';
    autoBtn.onclick = function() {
      player.configure({ abr: { enabled: true } });
      resoLabel.textContent = 'AUTO';
      document.querySelectorAll('.reso-item').forEach(b => b.classList.remove('active'));
      autoBtn.classList.add('active');
      resoMenu.classList.add('hidden');
    };
    resoMenu.appendChild(autoBtn);

    heights.forEach(function(h) {
      var btn = document.createElement('button');
      btn.className = 'reso-item';
      btn.textContent = h + 'p';
      btn.onclick = function() {
        player.configure({ abr: { enabled: false } });
        var track = player.getVariantTracks().find(t => t.height === h);
        if (track) player.selectVariantTrack(track, true);
        resoLabel.textContent = h + 'p';
        document.querySelectorAll('.reso-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        resoMenu.classList.add('hidden');
      };
      resoMenu.appendChild(btn);
    });
  }

  resoBtn.onclick = function(e) {
    e.stopPropagation();
    resoMenu.classList.toggle('hidden');
  };

  document.addEventListener('click', function(e) {
    if (resoMenu && !e.target.closest('.reso-wrapper')) resoMenu.classList.add('hidden');
  });

  function buildDrmConfig(drmStr) {
    if (!drmStr) return null;
    if (drmStr.startsWith('http')) {
      return {
        servers: {
          'com.widevine.alpha': drmStr,
          'com.microsoft.playready': drmStr
        }
      };
    }
    if (drmStr.includes(':')) {
      var parts = drmStr.split(':');
      return { clearKeys: { [parts[0]]: parts[1] } };
    }
    return null;
  }

  async function play(i) {
    if (isGridMode) return;
    var ch = CH[i];
    if (!ch) return;
    cur = i;
    markRow(i);
    if (activeTitle) activeTitle.textContent = ch[0] + ' — LIVE';
    setLoad(true, ch[0]);
    stopWatch();
    hint.style.display = 'none';

    if (typeof shaka === 'undefined') {
      setLoad(true, ch[0], 'Loading player engine...');
      return;
    }

    try {
      shaka.polyfill.installAll();
      if (player) { try { await player.destroy(); } catch (e) {} player = null; }

      player = new shaka.Player();
      await player.attach(vid);

      var cfg = {
        streaming: { bufferingGoal: 12, rebufferingGoal: 2, bufferBehind: 20 }
      };
      var drm = buildDrmConfig(ch[2]);
      if (drm) cfg.drm = drm;
      player.configure(cfg);

      await player.load(ch[1]);
      revealSplashEnter();
      updateResolutionMenu();
      resoLabel.textContent = 'AUTO';
      setLoad(false);

      try {
        await vid.play();
      } catch (e) {
        vid.muted = true;
        await vid.play().catch(() => {});
      }
      updatePlayIcon();
      updateVolIcon();
      if (vid.muted) hint.style.display = 'flex';

      watchdog = setInterval(function() {
        try {
          if (!player || vid.paused || isGridMode) return;
          var r = player.seekRange();
          if (r.end - vid.currentTime > 12) vid.currentTime = r.end - 1;
          if (r.end - vid.currentTime > 4) {
            liveBtn.classList.add('behind-live');
            liveBtn.textContent = 'SYNC LIVE';
          } else {
            liveBtn.classList.remove('behind-live');
            liveBtn.textContent = 'LIVE';
          }
        } catch (e) {}
      }, 2000);
    } catch (e) {
      revealSplashEnter();
      setLoad(true, ch[0], 'Stream offline or unavailable.');
    }
  }

  async function startGridMode() {
    isGridMode = true;
    gridBtn.classList.add('active-mode');
    if (quickGridToggle) quickGridToggle.textContent = 'Single View';
    if (activeTitle) activeTitle.textContent = 'PBB STUDIO — 4-CAMERA MULTI-VIEW';
    stopWatch();

    if (player) { try { await player.destroy(); } catch (e) {} player = null; }

    vidContainer.style.display = 'none';
    gridContainer.style.display = 'grid';
    hint.style.display = 'none';
    liveBtn.style.display = 'none';
    setLoad(true, 'All Feeds', 'Loading 4-Camera Studio...');

    await Promise.all(gridPlayers.map(gp => gp.destroy().catch(() => {})));
    gridPlayers = [];

    await Promise.all(CH.map(async function(ch, k) {
      var gvid = document.getElementById('gv' + k);
      if (!gvid) return;

      var gp = new shaka.Player();
      gridPlayers.push(gp);
      await gp.attach(gvid);

      var gpCfg = {
        streaming: { bufferingGoal: 6, rebufferingGoal: 2, bufferBehind: 1 },
        restrictions: { maxHeight: 480 }
      };
      var drm = buildDrmConfig(ch[2]);
      if (drm) gpCfg.drm = drm;
      gp.configure(gpCfg);

      try {
        await gp.load(ch[1]);
        gvid.muted = true;
        await gvid.play();
      } catch (e) {}
    }));

    revealSplashEnter();
    setLoad(false);
    markRow(-1);
  }

  async function stopGridMode(targetIndex) {
    isGridMode = false;
    gridBtn.classList.remove('active-mode');
    if (quickGridToggle) quickGridToggle.textContent = '4-Cam Grid';
    liveBtn.style.display = 'inline-flex';

    await Promise.all(gridPlayers.map(gp => gp.destroy().catch(() => {})));
    gridPlayers = [];

    // Reset grid audio buttons
    document.querySelectorAll('.grid-mute-btn').forEach(b => {
      b.textContent = '🔇';
      b.classList.remove('unmuted');
    });

    gridContainer.style.display = 'none';
    vidContainer.style.display = 'flex';
    var nextIdx = (typeof targetIndex === 'number') ? targetIndex : (cur < 0 ? 0 : cur);
    play(nextIdx);
  }

  function toggleGrid() {
    if (!isGridMode) {
      prefs.layout = 'grid';
      savePrefs();
      applyPrefs(true);
      startGridMode();
    } else {
      prefs.layout = 'cinema';
      savePrefs();
      applyPrefs(true);
      stopGridMode(cur);
    }
  }

  gridBtn.onclick = toggleGrid;
  if (quickGridToggle) quickGridToggle.onclick = toggleGrid;

  // Individual Audio Toggle inside 4-Cam Grid
  document.querySelectorAll('.grid-mute-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var idx = parseInt(btn.getAttribute('data-grid-mute'), 10);
      var targetVid = document.getElementById('gv' + idx);
      if (!targetVid) return;

      var willUnmute = targetVid.muted;
      // Mute all other grid feeds first so audio doesn't clash
      document.querySelectorAll('.grid-item video').forEach(v => v.muted = true);
      document.querySelectorAll('.grid-mute-btn').forEach(b => {
        b.textContent = '🔇';
        b.classList.remove('unmuted');
      });

      if (willUnmute) {
        targetVid.muted = false;
        btn.textContent = '🔊';
        btn.classList.add('unmuted');
      }
    });
  });

  // Clicking a grid tile expands that camera
  document.querySelectorAll('.grid-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var idx = parseInt(item.getAttribute('data-idx'), 10);
      if (!isNaN(idx)) {
        prefs.layout = 'cinema';
        savePrefs();
        applyPrefs(true);
        stopGridMode(idx);
      }
    });
  });

  // Play / Pause & Audio
  function updatePlayIcon() {
    playIcon.innerHTML = vid.paused
      ? '<path d="M8 5v14l11-7z"/>'
      : '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  }

  playBtn.onclick = function() {
    if (isGridMode) {
      document.querySelectorAll('.grid-item video').forEach(v => {
        if (v.paused) v.play().catch(() => {});
        else v.pause();
      });
    } else {
      if (vid.paused) vid.play().catch(() => {});
      else vid.pause();
      updatePlayIcon();
    }
  };

  function updateVolIcon() {
    if (vid.muted || vid.volume === 0) {
      volIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
      volSlider.value = 0;
    } else {
      volIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
      volSlider.value = vid.volume;
    }
  }

  muteBtn.onclick = function() {
    if (isGridMode) return;
    vid.muted = !vid.muted;
    if (!vid.muted && vid.volume === 0) vid.volume = 1;
    updateVolIcon();
    hint.style.display = 'none';
  };

  volSlider.addEventListener('input', function(e) {
    if (isGridMode) return;
    vid.volume = parseFloat(e.target.value);
    vid.muted = (vid.volume === 0);
    updateVolIcon();
  });

  hint.onclick = function() {
    vid.muted = false;
    if (vid.volume === 0) vid.volume = 1;
    updateVolIcon();
    hint.style.display = 'none';
  };

  // Fullscreen
  function toggleFullScreen() {
    var isNativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    var isPseudoFs = stage.classList.contains('pseudo-fs');

    if (!isNativeFs && !isPseudoFs) {
      var req = stage.requestFullscreen || stage.webkitRequestFullscreen;
      if (req) {
        req.call(stage).then(function() {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
        }).catch(function() {
          stage.classList.add('pseudo-fs');
        });
      } else {
        stage.classList.add('pseudo-fs');
      }
    } else {
      if (isNativeFs) {
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document).catch(() => {});
      }
      stage.classList.remove('pseudo-fs');
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    }
  }

  fsBtn.onclick = toggleFullScreen;

  // Populate Camera Feed Cards
  var box = document.getElementById('channels');
  CH.forEach(function(c, i) {
    var card = document.createElement('div');
    card.className = 'feed-card';
    card.innerHTML =
      '<div class="ch-left">' +
        '<div class="ch-icon">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>' +
        '</div>' +
        '<div class="ch-info">' +
          '<div class="ch-name">' + c[0] + '</div>' +
          '<div class="ch-sub">Camera Feed 0' + (i + 1) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ch-badge">HD</div>';

    card.onclick = function() {
      if (isGridMode) {
        prefs.layout = 'cinema';
        savePrefs();
        applyPrefs(true);
        stopGridMode(i);
      } else {
        play(i);
      }
    };
    box.appendChild(card);
  });

  // Auto-Hiding HUD Controls
  var controlsEl = document.getElementById('controls');
  var hideTimer = null;

  function showControls() {
    controlsEl.classList.remove('hidden');
    resetHideTimer();
  }

  function resetHideTimer() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(function() {
      if (!load.classList.contains('show') && (!vid.paused || isGridMode) && resoMenu.classList.contains('hidden')) {
        controlsEl.classList.add('hidden');
      }
    }, 3500);
  }

  stage.addEventListener('click', function(e) {
    if (e.target.closest('#controls') || e.target.closest('.grid-mute-btn')) return;
    if (controlsEl.classList.contains('hidden')) showControls();
    else controlsEl.classList.add('hidden');
  });

  stage.addEventListener('mousemove', function() {
    if (!controlsEl.classList.contains('hidden')) resetHideTimer();
  });
  controlsEl.addEventListener('click', resetHideTimer);

  // Customize Modal Bindings
  var customizeBtn = document.getElementById('customize-btn');
  var customizeModal = document.getElementById('customize-modal');
  var closeCustomize = document.getElementById('close-customize');

  customizeBtn.onclick = function() { customizeModal.classList.remove('hidden'); };
  closeCustomize.onclick = function() { customizeModal.classList.add('hidden'); };
  customizeModal.addEventListener('click', function(e) {
    if (e.target === customizeModal) customizeModal.classList.add('hidden');
  });

  document.querySelectorAll('#layout-selector .seg-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      prefs.layout = btn.getAttribute('data-val');
      savePrefs();
      applyPrefs(false);
    });
  });

  document.querySelectorAll('#accent-selector .swatch-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      prefs.accent = btn.getAttribute('data-val');
      savePrefs();
      applyPrefs(true);
    });
  });

  document.getElementById('opt-oled').addEventListener('change', function(e) {
    prefs.oled = e.target.checked;
    savePrefs();
    applyPrefs(true);
  });

  document.getElementById('opt-glow').addEventListener('change', function(e) {
    prefs.glow = e.target.checked;
    savePrefs();
    applyPrefs(true);
  });

  document.getElementById('opt-crop').addEventListener('change', function(e) {
    prefs.crop = e.target.checked;
    savePrefs();
    applyPrefs(true);
  });

  document.getElementById('opt-compact').addEventListener('change', function(e) {
    prefs.compact = e.target.checked;
    savePrefs();
    applyPrefs(true);
  });

  document.getElementById('reset-prefs-btn').addEventListener('click', function() {
    prefs = Object.assign({}, defaultPrefs);
    savePrefs();
    applyPrefs(false);
  });

  // Support Modal & Copy Handler
  var donateBtn = document.getElementById('donate-btn');
  var supportModal = document.getElementById('support-modal');
  var closeSupport = document.getElementById('close-support');

  donateBtn.onclick = function() { supportModal.classList.remove('hidden'); };
  closeSupport.onclick = function() { supportModal.classList.add('hidden'); };
  supportModal.addEventListener('click', function(e) {
    if (e.target === supportModal) supportModal.classList.add('hidden');
  });

  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var textToCopy = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(textToCopy).then(function() {
        var originalHtml = btn.innerHTML;
        btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        btn.classList.add('copied');
        setTimeout(function() {
          btn.innerHTML = originalHtml;
          btn.classList.remove('copied');
        }, 1500);
      });
    });
  });

  // Splash Dismiss & Boot
  var splash = document.getElementById('splash-screen');
  var enterBtn = document.getElementById('splash-enter-btn');
  if (enterBtn) {
    enterBtn.addEventListener('click', function() {
      isSplashActive = false;
      splash.classList.add('fade-out');
      setTimeout(function() { splash.remove(); }, 500);
    });
  }

  // Keep your existing data.js intact!
  applyPrefs(true);
  if (prefs.layout === 'grid') {
    startGridMode();
  } else {
    document.body.setAttribute('data-layout', prefs.layout);
    play(1); // Defaults to Feed 02 (PBB Dining Area) like your screenshot
  }
  resetHideTimer();
})();
