const pages = Array.from(document.querySelectorAll('.page'));
const buttons = Array.from(document.querySelectorAll('[data-next]'));
const closeButtons = Array.from(document.querySelectorAll('[data-close]'));

// Optional: add a Formspree, Supabase Edge Function, Firebase Function, or other endpoint here.
// Leave it empty for the simple version. The selected answer will still be saved on the same device.
const RESPONSE_WEBHOOK_URL = '';

// Load the small polish stylesheet without needing to touch index.html again.
function loadPolishStylesheet() {
  const alreadyLoaded = document.querySelector('link[href="fixes.css"]');
  if (alreadyLoaded) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `fixes.css?v=${Date.now()}`;
  document.head.appendChild(link);
}

loadPolishStylesheet();

const MUSIC_SOURCES = [
  'assets/audio/music.mp3',
  'assets/music.mp3',
  'music.mp3',
  'assets/audio/music.m4a',
  'assets/audio/music.ogg',
];

function createMusicElement() {
  let audio = document.getElementById('background-music');
  if (audio) return audio;

  audio = document.createElement('audio');
  audio.id = 'background-music';
  audio.preload = 'auto';
  audio.loop = true;
  audio.playsInline = true;

  MUSIC_SOURCES.forEach((src) => {
    const source = document.createElement('source');
    source.src = src;
    source.type = src.endsWith('.m4a') ? 'audio/mp4' : src.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg';
    audio.appendChild(source);
  });

  document.body.appendChild(audio);
  return audio;
}

const backgroundMusic = createMusicElement();
const musicToggle = document.createElement('button');
musicToggle.className = 'music-toggle is-hidden';
musicToggle.type = 'button';
musicToggle.setAttribute('aria-label', 'Play music');
musicToggle.setAttribute('aria-pressed', 'false');
musicToggle.textContent = '♪';
document.body.appendChild(musicToggle);

let currentPage = 'welcome';
let musicTried = false;
let musicAvailable = true;

function updateMusicButton() {
  if (!musicAvailable) {
    musicToggle.classList.add('is-hidden');
    return;
  }

  musicToggle.classList.remove('is-hidden');
  const isPlaying = !backgroundMusic.paused;
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.textContent = isPlaying ? 'Ⅱ' : '♪';
}

async function startMusic() {
  if (!backgroundMusic || !musicAvailable) return;

  musicTried = true;
  backgroundMusic.volume = 0.28;

  try {
    await backgroundMusic.play();
    updateMusicButton();
  } catch (error) {
    // Browsers block audio until the user taps something. The visible music button
    // gives a clear second chance if the first attempt is blocked.
    updateMusicButton();
    console.info('Music could not start yet. Try tapping the music button.', error);
  }
}

backgroundMusic.addEventListener('playing', updateMusicButton);
backgroundMusic.addEventListener('pause', updateMusicButton);
backgroundMusic.addEventListener('error', () => {
  musicAvailable = false;
  updateMusicButton();
  console.info('No playable music file was found. Use assets/audio/music.mp3 for the safest path.');
});

musicToggle.addEventListener('click', async () => {
  if (backgroundMusic.paused) {
    await startMusic();
  } else {
    backgroundMusic.pause();
  }
});

function showPage(pageName) {
  const target = pages.find((page) => page.dataset.page === pageName);
  if (!target) return;

  pages.forEach((page) => {
    page.classList.toggle('active', page.dataset.page === pageName);
  });

  currentPage = pageName;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function tapFeedback(button) {
  button.classList.add('button-tap');
  window.setTimeout(() => button.classList.remove('button-tap'), 160);
}

async function saveResponse(selectedOption, pageName) {
  const payload = {
    selectedOption,
    pageName,
    timestamp: new Date().toISOString(),
  };

  localStorage.setItem('leeAnnResponse', JSON.stringify(payload));

  if (!RESPONSE_WEBHOOK_URL) return;

  try {
    await fetch(RESPONSE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    console.info('Response saved locally. Remote tracking was not available.', error);
  }
}

buttons.forEach((button) => {
  button.addEventListener('click', async () => {
    tapFeedback(button);

    if (!musicTried) {
      startMusic();
    }

    const selectedOption = button.dataset.response;
    const nextPage = button.dataset.next;

    if (selectedOption) {
      await saveResponse(selectedOption, currentPage);
    }

    window.setTimeout(() => showPage(nextPage), 170);
  });
});

closeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    tapFeedback(button);
    window.setTimeout(() => {
      document.body.innerHTML = `
        <main class="app-shell closed-state">
          <section class="page active" data-page="maybe-response">
            <div class="page-inner final-page calm-final">
              <div class="heart-line" aria-hidden="true"><span>♡</span></div>
              <h1>Thank you for opening it 🤍</h1>
              <article class="note-card">
                <p>I hope it made you smile, even just a little.</p>
              </article>
            </div>
          </section>
        </main>
      `;
    }, 170);
  });
});

updateMusicButton();
showPage(currentPage);
