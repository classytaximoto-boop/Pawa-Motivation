import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

// État local de l'écran (mémoire vive, pas persisté) : étape de la double
// confirmation de réinitialisation Wallet. 0 = fermé, 1 = premier avertissement,
// 2 = confirmation finale (texte à saisir).
let resetStep = 0;
let resetConfirmText = '';

const SEPARATOR_OPTIONS = [
  { id: 'space', label: '12 345' },
  { id: 'comma', label: '12,345' },
  { id: 'dot', label: '12.345' },
  { id: 'none', label: '12345' },
];

const POSITION_OPTIONS = [
  { id: 'after', label: 'Montant devise (1000 MGA)' },
  { id: 'before', label: 'Devise montant (MGA 1000)' },
];

const RESET_KEYWORD = 'SUPPRIMER';

function resetStep1Sheet(onNext, onCancel) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title" style="color:var(--danger-500)">${icons.alertTriangle}Réinitialiser le Wallet ?</h2>
      <p class="confirm-sheet__desc">
        Cette action efface définitivement <strong>tous</strong> les comptes, transactions, catégories personnalisées,
        budgets, objectifs financiers, dettes et paiements planifiés. Le reste de BOOST (objectifs de vie, projets,
        habitudes, journal, etc.) n'est pas concerné.
      </p>
      <p class="confirm-sheet__desc" style="color:var(--danger-500)">Cette opération est irréversible.</p>
      <div class="form-actions">
        <button class="btn-secondary" id="cancel-reset">Annuler</button>
        <button class="btn-danger" id="next-reset">Continuer</button>
      </div>
    </div>
  `;
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) onCancel();
  });
  backdrop.querySelector('#cancel-reset').addEventListener('click', onCancel);
  backdrop.querySelector('#next-reset').addEventListener('click', onNext);
  return backdrop;
}

function resetStep2Sheet(onConfirm, onCancel) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title" style="color:var(--danger-500)">${icons.alertTriangle}Dernière confirmation</h2>
      <p class="confirm-sheet__desc">
        Pour confirmer, tape <strong>${RESET_KEYWORD}</strong> ci-dessous. Aucune sauvegarde automatique n'existe pour
        cette action — pense à exporter tes données en CSV ou JSON avant si besoin.
      </p>
      <div class="form-group">
        <input class="form-input" id="reset-confirm-input" placeholder="${RESET_KEYWORD}" autocomplete="off" autocapitalize="off" />
      </div>
      <div class="form-actions">
        <button class="btn-secondary" id="cancel-reset-2">Annuler</button>
        <button class="btn-danger" id="confirm-reset-2" disabled>Tout effacer</button>
      </div>
    </div>
  `;
  const input = backdrop.querySelector('#reset-confirm-input');
  const confirmBtn = backdrop.querySelector('#confirm-reset-2');
  input.addEventListener('input', () => {
    confirmBtn.disabled = input.value.trim().toUpperCase() !== RESET_KEYWORD;
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) onCancel();
  });
  backdrop.querySelector('#cancel-reset-2').addEventListener('click', onCancel);
  confirmBtn.addEventListener('click', () => {
    if (confirmBtn.disabled) return;
    onConfirm();
  });
  return backdrop;
}

export function WalletSettingsScreen() {
  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Paramètres Wallet</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/money'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  const settings = store.getWalletSettings();

  screen.innerHTML = `
    <section class="card">
      <div class="detail-section-title">Devise</div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Devise principale</span>
        <span class="chip">${settings.currency}</span>
      </div>
      <p class="detail-desc" style="margin-top:var(--sp-2)">
        Multi-devises non géré pour l'instant — le Wallet fonctionne uniquement en ${settings.currency}.
      </p>
    </section>

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Format monétaire</div>
      <div class="form-group">
        <label class="form-label">Séparateur de milliers</label>
        <div class="category-picker" id="separator-picker">
          ${SEPARATOR_OPTIONS.map((o) => `
            <button type="button" class="category-picker-item ${settings.thousandsSeparator === o.id ? 'is-selected' : ''}" data-sep="${o.id}">
              <span>${o.label}</span>
            </button>`).join('')}
        </div>
      </div>
      <div class="form-group" style="margin-top:var(--sp-4)">
        <label class="form-label">Position du symbole</label>
        <div class="category-picker" id="position-picker">
          ${POSITION_OPTIONS.map((o) => `
            <button type="button" class="category-picker-item ${settings.symbolPosition === o.id ? 'is-selected' : ''}" data-pos="${o.id}">
              <span>${o.label}</span>
            </button>`).join('')}
        </div>
      </div>
      <p class="detail-desc" style="margin-top:var(--sp-3)">Aperçu : <strong class="mono">${store.formatMoney(1234567)}</strong></p>
    </section>

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Budget mensuel</div>
      <div class="form-group">
        <label class="form-label" for="f-month-start">Premier jour du mois pour les budgets</label>
        <input class="form-input" type="number" min="1" max="28" id="f-month-start" value="${settings.budgetMonthStartDay}" />
      </div>
      <p class="detail-desc" style="margin-top:var(--sp-2)">
        Détermine quand repart le calcul de progression des budgets par catégorie (ex : 25 pour un cycle salaire-à-salaire).
      </p>
      <div class="form-actions" style="margin-top:var(--sp-3)">
        <button type="button" class="btn-primary" id="save-month-start">Enregistrer</button>
      </div>
    </section>

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Couleurs revenus / dépenses</div>
      <div class="detail-meta-item">
        <span class="category-tag" style="color:var(--success-500)">${icons.check}Revenus</span>
        <span class="chip">fixe</span>
      </div>
      <div class="detail-meta-item" style="margin-top:var(--sp-2)">
        <span class="category-tag" style="color:var(--danger-500)">${icons.trash}Dépenses</span>
        <span class="chip">fixe</span>
      </div>
      <p class="detail-desc" style="margin-top:var(--sp-2)">
        Pas encore personnalisables — couleurs câblées dans le thème de l'app pour l'instant.
      </p>
    </section>

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Export CSV Wallet</div>
      <p class="detail-desc">
        Exporte comptes, transactions, catégories, budgets, objectifs financiers, dettes et paiements planifiés
        dans un seul fichier CSV. Distinct de la sauvegarde JSON complète de l'app (voir Profil).
      </p>
      <div class="form-actions" style="margin-top:var(--sp-3)">
        <button type="button" class="btn-primary" id="export-csv-btn">${icons.upload}Exporter en CSV</button>
      </div>
    </section>

    <section class="card" style="margin-top:var(--sp-3); border-color:var(--danger-500)">
      <div class="detail-section-title" style="color:var(--danger-500)">Zone dangereuse</div>
      <p class="detail-desc">
        Efface uniquement les données Wallet (comptes, transactions, catégories, budgets, objectifs financiers,
        dettes, paiements planifiés). Le reste de BOOST n'est pas touché.
      </p>
      <div class="form-actions" style="margin-top:var(--sp-3)">
        <button type="button" class="btn-danger" id="reset-wallet-btn">${icons.trash}Réinitialiser le Wallet</button>
      </div>
    </section>
  `;

  el.appendChild(screen);

  function rerender() {
    el.replaceWith(WalletSettingsScreen());
  }

  screen.querySelectorAll('#separator-picker [data-sep]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.updateWalletSettings({ thousandsSeparator: btn.dataset.sep });
      rerender();
    });
  });

  screen.querySelectorAll('#position-picker [data-pos]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.updateWalletSettings({ symbolPosition: btn.dataset.pos });
      rerender();
    });
  });

  screen.querySelector('#save-month-start').addEventListener('click', () => {
    const input = screen.querySelector('#f-month-start');
    const day = Number(input.value);
    if (!day || day < 1 || day > 28) {
      alert('Choisis un jour entre 1 et 28.');
      return;
    }
    store.updateWalletSettings({ budgetMonthStartDay: day });
    rerender();
  });

  screen.querySelector('#export-csv-btn').addEventListener('click', () => {
    store.downloadMoneyCSV();
  });

  screen.querySelector('#reset-wallet-btn').addEventListener('click', () => {
    resetStep = 1;
    const step1 = resetStep1Sheet(
      () => {
        step1.remove();
        resetStep = 2;
        const step2 = resetStep2Sheet(
          () => {
            store.resetWalletData();
            step2.remove();
            resetStep = 0;
            router.navigate('/money');
          },
          () => {
            step2.remove();
            resetStep = 0;
          },
        );
        el.appendChild(step2);
      },
      () => {
        step1.remove();
        resetStep = 0;
      },
    );
    el.appendChild(step1);
  });

  return el;
}
