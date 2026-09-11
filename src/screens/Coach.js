import { AppHeader } from '../components/AppHeader.js';
import { router } from '../utils/router.js';
import { PawaCoach } from '../components/PawaCoach.js';

export function Coach() {
  const el = document.createElement('div');
  el.appendChild(AppHeader());
  const screen = document.createElement('main');
  screen.className = 'screen coach-screen';
  screen.innerHTML = `
    <div class="detail-header-row" style="padding:0;">
      <button class="back-btn" aria-label="Retour">←</button>
      <h1 style="font-size:var(--fs-xl)">Mon Coach</h1>
    </div>
    <p class="detail-desc" style="margin-top:var(--sp-2)">Le Coach analyse tes données locales : actions, émotions, comportements, paroles récentes, progression et priorités.</p>
  `;
  screen.querySelector('.back-btn').addEventListener('click', () => router.navigate('/mind'));
  screen.appendChild(PawaCoach());
  el.appendChild(screen);
  return el;
}
