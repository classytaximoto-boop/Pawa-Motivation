import { store } from '../utils/store.js';

/**
 * Popup affichée à l'ouverture de l'app pour le récap du jour (matin / midi /
 * soir selon l'heure). S'appuie uniquement sur store.getDailySummaryData() —
 * mêmes données que la notification native, donc toujours cohérent entre
 * barre de notification et popup.
 *
 * Ne s'affiche qu'une fois par jour par créneau (matin / midi / soir), tracé
 * via notificationLog comme les autres notifications, pour ne pas revenir
 * gêner l'utilisateur à chaque ouverture de l'app dans la même journée.
 */

function row(label, value) {
  if (value == null || value === '') return '';
  return `
    <div class="goal-card__meta-row" style="margin-top:var(--sp-1)">
      <span class="detail-desc">${label}</span>
      <span>${value}</span>
    </div>`;
}

function buildFullSummaryContent(d, title, subtitle) {
  const goalsList = d.goals.touchedToday.length
    ? d.goals.touchedToday.map((g) => `${g.name} (${g.progress}%)`).join(', ')
    : 'Aucun mouvement pour l\'instant';
  const skillsList = d.skills.updatedToday.length
    ? d.skills.updatedToday.map((s) => `${s.name} (niv. ${s.level})`).join(', ')
    : null;
  const victoriesList = d.victories.length
    ? d.victories.map((v) => v.text).join(' · ')
    : null;

  return `
    <h2 class="confirm-sheet__title">${title}</h2>
    <p class="confirm-sheet__desc">${subtitle}</p>
    <div class="card" style="margin-top:var(--sp-3)">
      ${row('Objectifs avancés', goalsList)}
      ${row('Missions du jour', `${d.missions.done}/${d.missions.total}`)}
      ${row('Habitudes tenues', `${d.habits.doneToday}/${d.habits.total}`)}
      ${row('XP gagné aujourd\'hui', d.xpEarnedToday > 0 ? `+${d.xpEarnedToday}` : '0')}
      ${row('Argent — entrées', d.money.todayIncome > 0 ? `+${d.money.todayIncome}` : null)}
      ${row('Argent — sorties', d.money.todayExpense > 0 ? `-${d.money.todayExpense}` : null)}
      ${row('Total épargné (objectifs)', d.money.savedTotal > 0 ? d.money.savedTotal : null)}
      ${skillsList ? row('Nouveau skill / expérience', skillsList) : ''}
      ${victoriesList ? row('Réussites récentes', victoriesList) : ''}
      ${row('Série en cours', d.streak > 0 ? `${d.streak} jour(s)` : null)}
    </div>
  `;
}

function buildEveningContent(d) {
  return buildFullSummaryContent(d, 'Ton récap du jour', 'Où tu en es aujourd\'hui, en un coup d\'œil.');
}

function buildMiddayContent(d) {
  return buildFullSummaryContent(d, 'Ton récap du midi', 'Où en est ta matinée, en un coup d\'œil.');
}

function buildMorningContent(d) {
  return `
    <h2 class="confirm-sheet__title">Ton point du matin</h2>
    <p class="confirm-sheet__desc">${d.streak > 0 ? `Jour ${d.streak} de ta série. ` : ''}Où en es-tu, quelle est ta motivation aujourd'hui ?</p>
    <div class="card" style="margin-top:var(--sp-3)">
      ${row('Objectifs actifs', d.goals.activeCount)}
      ${row('Missions du jour', `${d.missions.done}/${d.missions.total}`)}
      ${row('Habitudes à cocher', d.habits.remaining.length ? d.habits.remaining.join(', ') : 'Toutes faites hier ✅')}
      ${row('XP total', d.xpSummary.totalEarned)}
    </div>
  `;
}

/** Construit le popup et le retourne, ou null si rien à afficher aujourd'hui. */
export function DailySummaryModal() {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);
  const dayKey = store.todayKey(now);
  const prefs = store.getNotificationPrefs();
  const log = store.listNotificationLog();

  const alreadyShown = (typeId) => log.some((n) => n.typeId === typeId && n.date.slice(0, 10) === dayKey);

  // Priorité au créneau le plus tardif dû et pas encore vu (soir > midi > matin).
  // Un seul popup à la fois pour ne jamais empiler deux modals à l'ouverture :
  // si plusieurs créneaux sont en retard (app pas ouverte depuis un moment),
  // on ne montre que le plus récent — les autres restent tracés comme "dus"
  // mais ne redemandent pas l'attention en rafale.
  const slots = [
    { mode: 'evening', typeId: 'daily_summary_evening', pref: prefs.daily_summary_evening },
    { mode: 'midday', typeId: 'daily_summary_midday', pref: prefs.daily_summary_midday },
    { mode: 'morning', typeId: 'daily_reminder_morning', pref: prefs.daily_reminder_morning },
  ];

  const due = slots.find(
    (s) => s.pref?.enabled && hhmm >= s.pref.time && !alreadyShown(s.typeId)
  );
  if (!due) return null;

  const { mode, typeId } = due;
  const d = store.getDailySummaryData(now);

  let content;
  if (mode === 'evening') content = buildEveningContent(d);
  else if (mode === 'midday') content = buildMiddayContent(d);
  else content = buildMorningContent(d);

  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      ${content}
      <div class="form-actions" style="margin-top:var(--sp-4)">
        <button class="btn-primary" id="daily-summary-close" style="width:100%;">Continuer</button>
      </div>
    </div>
  `;

  const close = () => {
    // Trace le popup comme "vu" pour la journée, sur le même log que les
    // notifications natives — évite qu'il ne réapparaisse à chaque ouverture
    // et garde un historique cohérent avec le reste du système de rappels.
    store.markDailySummarySeen(typeId, d);
    backdrop.remove();
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('#daily-summary-close').addEventListener('click', close);

  return backdrop;
}
