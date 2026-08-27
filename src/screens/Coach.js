import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { AIService, isAIConfigured, isAIEnabled } from '../utils/aiService.js';

// Historique de conversation volontairement non persisté : c'est un coach
// conversationnel léger, pas un journal. Il repart à vide à chaque visite,
// ce qui limite aussi la quantité de contexte à re-transmettre à l'IA.
let conversation = []; // { role: 'user'|'assistant', text, isError? }

const SUGGESTIONS = [
  { label: 'Résume ma journée', prompt: 'Résume ma journée.' },
  { label: 'Une action pour aujourd\'hui', prompt: "Quelle action simple pourrais-je faire aujourd'hui ?" },
  { label: 'Motive-moi', prompt: 'Motive-moi.' },
  { label: 'Sur quoi progresser ?', prompt: 'Sur quoi devrais-je progresser en priorité en ce moment ?' },
];

function bubble(msg) {
  const row = document.createElement('div');
  row.className = `coach-bubble-row coach-bubble-row--${msg.role}`;
  const bubbleEl = document.createElement('div');
  bubbleEl.className = `coach-bubble coach-bubble--${msg.role} ${msg.isError ? 'coach-bubble--error' : ''}`;
  bubbleEl.textContent = msg.text;
  row.appendChild(bubbleEl);
  return row;
}

export function Coach() {
  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen coach-screen';

  screen.innerHTML = `
    <div class="detail-header-row" style="padding:0;">
      <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
      <h1 style="font-size:var(--fs-xl)">Mon Coach</h1>
    </div>
    <p class="detail-desc" style="margin-top:var(--sp-2)">
      Un espace de discussion basé sur tes objectifs, projets, émotions, journal et habitudes.
      Le contenu Secret n'est jamais transmis.
    </p>

    ${!isAIEnabled() ? `
      <div class="mind-disclaimer" style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:var(--sp-3); margin-top:var(--sp-3);">
        L'IA est désactivée dans tes paramètres — tu reçois des réponses locales simplifiées. Réactive-la depuis Profil si tu veux les réponses complètes.
      </div>` : !isAIConfigured() ? `
      <div class="mind-disclaimer" style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:var(--sp-3); margin-top:var(--sp-3);">
        Le coach IA n'est pas encore connecté à un service en ligne — tu reçois des réponses locales simplifiées en attendant.
      </div>` : ''}

    <div class="coach-messages" id="coach-messages" aria-live="polite"></div>

    <div class="coach-suggestions" id="coach-suggestions">
      ${SUGGESTIONS.map((s, i) => `<button type="button" class="chip" data-suggestion="${i}">${s.label}</button>`).join('')}
    </div>

    <form class="coach-input-row" id="coach-form">
      <input type="text" class="form-input" id="coach-input" placeholder="Écris un message…" autocomplete="off" />
      <button type="submit" class="btn-primary" id="coach-send" aria-label="Envoyer">${icons.chevronRight}</button>
    </form>

    <p class="mind-disclaimer">Le coach IA ne pose pas de diagnostic médical ou psychologique. Pour un sujet difficile, en parler à un professionnel reste la meilleure option.</p>
  `;

  el.appendChild(screen);

  screen.querySelector('.back-btn').addEventListener('click', () => router.navigate('/mind'));

  const messagesEl = screen.querySelector('#coach-messages');
  const form = screen.querySelector('#coach-form');
  const input = screen.querySelector('#coach-input');
  const sendBtn = screen.querySelector('#coach-send');
  const suggestionsEl = screen.querySelector('#coach-suggestions');

  function renderMessages() {
    messagesEl.innerHTML = '';
    if (!conversation.length) {
      messagesEl.innerHTML = `
        <div class="state-block" style="padding-top: var(--sp-6)">
          ${icons.mind.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Dis-moi où tu en es</h2>
          <p class="state-block__desc">Pose une question ou choisis une suggestion ci-dessous.</p>
        </div>`;
      return;
    }
    conversation.forEach((m) => messagesEl.appendChild(bubble(m)));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    conversation.push({ role: 'user', text: trimmed });
    renderMessages();
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;

    const typing = { role: 'assistant', text: 'Le coach réfléchit…', isTyping: true };
    conversation.push(typing);
    renderMessages();

    const history = conversation.filter((m) => !m.isTyping).slice(0, -1);
    const result = await AIService.coachReply(trimmed, history);

    conversation = conversation.filter((m) => !m.isTyping);
    conversation.push({ role: 'assistant', text: result.text, isError: !result.ok });
    renderMessages();

    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
  });

  suggestionsEl.querySelectorAll('[data-suggestion]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = SUGGESTIONS[Number(btn.dataset.suggestion)];
      send(s.prompt);
    });
  });

  renderMessages();

  return el;
}
