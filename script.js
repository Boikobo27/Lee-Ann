const pages = Array.from(document.querySelectorAll('.page'));
const buttons = Array.from(document.querySelectorAll('[data-next]'));
const closeButtons = Array.from(document.querySelectorAll('[data-close]'));
const flowNav = document.querySelector('.flow-nav');
const backButton = document.querySelector('[data-back]');
const progressDots = document.querySelector('.progress-dots');
const music = document.querySelector('#site-music');
const musicToggle = document.querySelector('[data-music-toggle]');
const musicHint = document.querySelector('[data-music-hint]');
const musicHintClose = document.querySelector('[data-music-hint-close]');
const openGuide = document.querySelector('[data-open-guide]');
const openGuideClose = document.querySelector('[data-open-guide-close]');
const flowPages = ['welcome', 'thank-you', 'liked-most', 'how-i-see-you', 'what-it-meant', 'next-step'];

// Optional: add a Formspree, Supabase Edge Function, Firebase Function, or other endpoint here.
// Leave it empty for the simple version. The selected answer will still be saved on the same device.
const RESPONSE_WEBHOOK_URL = 'https://formspree.io/f/xrewqqek';

const MUSIC_SOURCES = [
  'assets/audio/best-part.mp3',
  'assets/audio/music.mp3',
  'assets/music.mp3',
  'music.mp3',
];

let currentPage = 'welcome';
let musicWanted = true;
let musicHintDismissed = false;
let openGuideDismissed = false;
let currentMusicSourceIndex = 0;
let triedMusicFallback = false;
const pageHistory = [];

function injectLandingPolish() {
  if (document.querySelector('#landing-polish-style')) return;

  const style = document.createElement('style');
  style.id = 'landing-polish-style';
  style.textContent = `
    .page[data-page="welcome"] .page-inner {
      height: 100%;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .page[data-page="welcome"] .welcome-action {
      width: min(100%, 346px);
      margin-top: auto;
      flex: 0 0 auto;
    }

    .page[data-page="welcome"] .welcome-action .primary-button {
      width: 100%;
    }

    .page[data-page="welcome"] .footer-note {
      margin-top: 10px;
      flex: 0 0 auto;
    }
  `;
  document.head.appendChild(style);
}

function normalisePath(path) {
  return path.replace(/^\.\//, '').replace(/^\//, '');
}

function currentMusicPath() {
  try {
    const url = new URL(music.currentSrc || music.src, window.location.href);
    return normalisePath(url.pathname.split('/').slice(-3).join('/'));
  } catch {
    return '';
  }
}

function setMusicSource(index) {
  if (!music || index >= MUSIC_SOURCES.length) return false;

  currentMusicSourceIndex = index;
  music.src = MUSIC_SOURCES[index];
  music.preload = 'auto';
  music.load();
  return true;
}

function prepareMusic() {
  if (!music) return;

  music.preload = 'auto';

  const existingPath = currentMusicPath();
  const existingIndex = MUSIC_SOURCES.findIndex((source) => existingPath.endsWith(normalisePath(source)));

  if (existingIndex >= 0) {
    currentMusicSourceIndex = existingIndex;
  } else if (!music.getAttribute('src')) {
    setMusicSource(0);
  }
}

injectLandingPolish();
prepareMusic();

if (progressDots) {
  progressDots.innerHTML = flowPages.map(() => '<span></span>').join('');
}

const dots = progressDots ? Array.from(progressDots.querySelectorAll('span')) : [];

function isMusicHintActive() {
  return Boolean(musicHint && currentPage === 'welcome' && !musicHintDismissed && (!music || music.paused));
}

function updateMusicHint() {
  const shouldShowHint = isMusicHintActive();

  if (musicHint) {
    musicHint.classList.toggle('is-hidden', !shouldShowHint);
    musicHint.setAttribute('aria-hidden', String(!shouldShowHint));
  }
}

function updateOpenGuide() {
  if (!openGuide) return;

  const shouldShowGuide = currentPage === 'welcome' && !openGuideDismissed && !isMusicHintActive();

  openGuide.classList.toggle('is-hidden', !shouldShowGuide);
  openGuide.setAttribute('aria-hidden', String(!shouldShowGuide));
}

function updateGuides() {
  updateMusicHint();
  updateOpenGuide();
}

function hideMusicHint() {
  musicHintDismissed = true;
  updateGuides();
}

function hideOpenGuide() {
  openGuideDismissed = true;
  updateOpenGuide();
}

function updateMusicButton() {
  if (!music || !musicToggle) return;

  const isPlaying = !music.paused && !music.ended;

  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
  updateGuides();
}

async function playMusic() {
  if (!music) return false;

  musicWanted = true;
  musicToggle?.classList.remove('is-unavailable');

  try {
    await music.play();
    updateMusicButton();
    hideMusicHint();
    return true;
  } catch (error) {
    updateMusicButton();
    return false;
  }
}

function pauseMusic() {
  if (!music) return;

  musicWanted = false;
  music.pause();
  updateMusicButton();
}

function startMusicIfWanted() {
  if (!music || !musicWanted || !music.paused) return;

  playMusic();
}

function startMusicFromSiteTap(event) {
  const target = event.target;
  const tappedMusicControl = target instanceof Element && target.closest('[data-music-toggle], [data-music-hint], [data-open-guide]');

  if (!tappedMusicControl) {
    startMusicIfWanted();
  }
}

function updateNavigation() {
  const pageIndex = flowPages.indexOf(currentPage);
  const hasBackPage = pageHistory.length > 0;
  const shouldShowProgress = pageIndex > 0;

  if (!flowNav) return;

  flowNav.hidden = !hasBackPage && !shouldShowProgress;

  if (backButton) {
    backButton.hidden = !hasBackPage;
  }

  if (progressDots) {
    progressDots.hidden = !shouldShowProgress;

    if (shouldShowProgress) {
      progressDots.setAttribute('aria-label', `Step ${pageIndex + 1} of ${flowPages.length}`);
    }
  }

  dots.forEach((dot, index) => {
    dot.classList.toggle('complete', pageIndex > index);
    dot.classList.toggle('active', pageIndex === index);
  });
}

function showPage(pageName, options = {}) {
  const target = pages.find((page) => page.dataset.page === pageName);
  if (!target) return;

  if (options.resetHistory) {
    pageHistory.length = 0;
  } else if (options.pushHistory !== false && currentPage !== pageName) {
    pageHistory.push(currentPage);
  }

  pages.forEach((page) => {
    page.classList.toggle('active', page.dataset.page === pageName);
    page.scrollTop = 0;
  });

  currentPage = pageName;
  target.scrollTop = 0;
  window.scrollTo(0, 0);
  updateNavigation();
  updateGuides();
}

function tapFeedback(button) {
  button.classList.add('button-tap');
  window.setTimeout(() => button.classList.remove('button-tap'), 160);
}

if (music && musicToggle) {
  music.addEventListener('play', updateMusicButton);
  music.addEventListener('pause', updateMusicButton);
  music.addEventListener('ended', updateMusicButton);
  music.addEventListener('error', () => {
    const nextIndex = currentMusicSourceIndex + 1;

    if (!triedMusicFallback && nextIndex < MUSIC_SOURCES.length) {
      setMusicSource(nextIndex);
      startMusicIfWanted();
      return;
    }

    triedMusicFallback = true;
    musicToggle.classList.add('is-unavailable');
    musicToggle.setAttribute('aria-label', 'Add assets/audio/best-part.mp3 to enable music');
  });

  musicToggle.addEventListener('click', () => {
    tapFeedback(musicToggle);

    if (music.paused) {
      playMusic();
    } else {
      pauseMusic();
    }
  });

  document.addEventListener('pointerdown', startMusicFromSiteTap, { once: true });
  updateMusicButton();
}

if (musicHint) {
  musicHint.addEventListener('click', (event) => {
    const target = event.target;
    const clickedClose = target instanceof Element && target.closest('[data-music-hint-close]');

    if (!clickedClose) {
      startMusicIfWanted();
    }
  });
}

if (musicHintClose) {
  musicHintClose.addEventListener('click', (event) => {
    event.stopPropagation();
    tapFeedback(musicHintClose);
    hideMusicHint();
  });
}

if (openGuideClose) {
  openGuideClose.addEventListener('click', (event) => {
    event.stopPropagation();
    tapFeedback(openGuideClose);
    hideOpenGuide();
  });
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
    const response = await fetch(RESPONSE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`Formspree returned ${response.status}`);
    }
  } catch (error) {
    console.info('Response saved locally. Remote tracking was not available.', error);
  }
}

buttons.forEach((button) => {
  button.addEventListener('click', async () => {
    if (button.matches('[data-open-start]')) {
      hideOpenGuide();
    }

    startMusicIfWanted();
    tapFeedback(button);

    const selectedOption = button.dataset.response;
    const nextPage = button.dataset.next;

    if (selectedOption) {
      await saveResponse(selectedOption, currentPage);
    }

    window.setTimeout(() => {
      showPage(nextPage, { resetHistory: nextPage === 'welcome' });
    }, 170);
  });
});

if (backButton) {
  backButton.addEventListener('click', () => {
    tapFeedback(backButton);

    const previousPage = pageHistory.pop();
    if (!previousPage) {
      updateNavigation();
      return;
    }

    window.setTimeout(() => showPage(previousPage, { pushHistory: false }), 170);
  });
}

closeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    pauseMusic();
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

showPage(currentPage, { pushHistory: false });
