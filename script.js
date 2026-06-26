const pages = Array.from(document.querySelectorAll('.page'));
const buttons = Array.from(document.querySelectorAll('[data-next]'));
const closeButtons = Array.from(document.querySelectorAll('[data-close]'));

// Optional: add a Formspree, Supabase Edge Function, Firebase Function, or other endpoint here.
// Leave it empty for the simple version. The selected answer will still be saved on the same device.
const RESPONSE_WEBHOOK_URL = '';

let currentPage = 'welcome';

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

showPage(currentPage);
