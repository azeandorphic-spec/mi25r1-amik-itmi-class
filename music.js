const music = document.getElementById('storeMusic');
const musicButton = document.getElementById('musicToggle');

if (music && musicButton) {
  const playlist = [
    'assets/penggantibacksound1.mp3.mp3',
    'assets/penggantibacksound2.mp.mp3',
    'assets/backsound3.mp3',
    'assets/2112.mp3',
    'assets/A Sorrowful Reunion.mp3',
    'assets/anything you want.mp3',
    'assets/magnolia.mp3'
  ];
  const trackNames = [
    'Treat You Better',
    'Shape My Heart',
    'Line Without a Hook',
    '2112',
    'A Sorrowful Reunion',
    'Anything You Want',
    'Magnolia'
  ];
  const musicStateKey = 'classMusicState';
  const savedState = JSON.parse(localStorage.getItem(musicStateKey) || '{}');
  let currentTrack = 0;
  let restoredTime = 0;
  let trackLoadId = 0;
  let mediaSourceUrl = '';
  music.muted = true;

  const musicControls = document.createElement('span');
  musicControls.className = 'music-controls';
  const previousButton = document.createElement('button');
  previousButton.className = 'music-skip';
  previousButton.type = 'button';
  previousButton.textContent = '‹';
  previousButton.title = 'Lagu sebelumnya';
  const trackSelect = document.createElement('select');
  trackSelect.className = 'music-select';
  trackSelect.setAttribute('aria-label', 'Pilih lagu');
  playlist.forEach((track, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = trackNames[index] || `Lagu ${index + 1}`;
    trackSelect.appendChild(option);
  });
  const nextButton = document.createElement('button');
  nextButton.className = 'music-skip';
  nextButton.type = 'button';
  nextButton.textContent = '›';
  nextButton.title = 'Lagu berikutnya';
  musicControls.append(previousButton, trackSelect, nextButton);
  musicButton.parentNode.insertBefore(musicControls, musicButton);

  const loadTrack = async (index, shouldPlay = false) => {
    currentTrack = (index + playlist.length) % playlist.length;
    trackSelect.value = String(currentTrack);
    const loadId = ++trackLoadId;
    const codec = 'audio/mp4; codecs="mp4a.40.2"';
    musicButton.disabled = true;
    music.pause();

    if (mediaSourceUrl) URL.revokeObjectURL(mediaSourceUrl);
    if (!window.MediaSource || !MediaSource.isTypeSupported(codec)) {
      musicButton.textContent = 'Browser tidak mendukung format lagu';
      return;
    }

    const mediaSource = new MediaSource();
    mediaSourceUrl = URL.createObjectURL(mediaSource);
    const sourceOpened = new Promise((resolve, reject) => {
      mediaSource.addEventListener('sourceopen', resolve, { once: true });
      mediaSource.addEventListener('error', reject, { once: true });
    });
    music.src = mediaSourceUrl;
    music.load();
    try {
      await sourceOpened;
      if (loadId !== trackLoadId) return;
      const response = await fetch(playlist[currentTrack]);
      if (!response.ok) throw new Error('Lagu tidak ditemukan.');
      const audioData = await response.arrayBuffer();
      if (loadId !== trackLoadId) return;
      const sourceBuffer = mediaSource.addSourceBuffer(codec);
      await new Promise((resolve, reject) => {
        sourceBuffer.addEventListener('updateend', resolve, { once: true });
        sourceBuffer.addEventListener('error', reject, { once: true });
        sourceBuffer.appendBuffer(audioData);
      });
      if (mediaSource.readyState === 'open') mediaSource.endOfStream();
      musicButton.disabled = false;
      if (shouldPlay && loadId === trackLoadId) {
        try {
          await music.play();
          saveMusicState();
          setMusicState(true);
        } catch (error) {
          setMusicState(false);
        }
      }
    } catch (error) {
      if (loadId !== trackLoadId) return;
      musicButton.textContent = 'Lagu tidak bisa dimuat';
      musicButton.disabled = true;
      setMusicState(false);
    }
  };

  const saveMusicState = () => {
    localStorage.setItem(musicStateKey, JSON.stringify({
      track: currentTrack,
      time: music.currentTime || 0,
      playing: !music.paused
    }));
  };

  const setMusicState = (isPlaying) => {
    musicButton.textContent = isPlaying && !music.muted ? '⏸ Matikan musik' : '▶ Nyalakan musik';
    musicButton.classList.toggle('is-playing', isPlaying);
    musicButton.setAttribute('aria-pressed', String(isPlaying));
  };

  musicButton.addEventListener('click', async () => {
    if (!music.paused && music.muted) {
      music.muted = false;
      saveMusicState();
      setMusicState(true);
    } else if (music.paused) {
      try {
        music.muted = false;
        await music.play();
        saveMusicState();
        setMusicState(true);
      } catch (error) {
        musicButton.textContent = 'Gagal memutar musik';
      }
    } else {
      music.pause();
      saveMusicState();
      setMusicState(false);
    }
  });

  trackSelect.addEventListener('change', () => loadTrack(Number(trackSelect.value), !music.paused));
  previousButton.addEventListener('click', () => loadTrack(currentTrack - 1, true));
  nextButton.addEventListener('click', () => loadTrack(currentTrack + 1, true));

  music.addEventListener('loadedmetadata', () => {
    if (restoredTime > 0 && restoredTime < music.duration) music.currentTime = restoredTime;
    restoredTime = 0;
  });

  const enableSound = () => {
    if (!music.paused) music.muted = false;
    saveMusicState();
    setMusicState(!music.paused);
  };

  music.addEventListener('play', saveMusicState);
  music.addEventListener('pause', () => { saveMusicState(); setMusicState(false); });
  music.addEventListener('timeupdate', saveMusicState);
  music.addEventListener('ended', () => {
    loadTrack(currentTrack + 1, true);
    saveMusicState();
  });
  music.addEventListener('error', () => {
    musicButton.textContent = 'Lagu tidak bisa dimuat';
    musicButton.disabled = true;
  });

  currentTrack = Number.isInteger(savedState.track) ? savedState.track : 0;
  restoredTime = Number(savedState.time) || 0;
  const shouldAutoplay = savedState.playing !== false;
  loadTrack(currentTrack, shouldAutoplay);
  if (shouldAutoplay) {
    document.addEventListener('click', enableSound, { once: true });
    document.addEventListener('scroll', enableSound, { once: true, passive: true });
    document.addEventListener('keydown', enableSound, { once: true });
  } else {
    setMusicState(false);
  }
}
