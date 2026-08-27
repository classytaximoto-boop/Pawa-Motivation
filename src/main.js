import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/goals.css';
import './styles/mind.css';

import { router } from './utils/router.js';
import { store } from './utils/store.js';
import { BottomNav } from './components/BottomNav.js';
import { OfflineBanner } from './components/OfflineBanner.js';
import { Home } from './screens/Home.js';
import { ComingSoon } from './screens/ComingSoon.js';
import { ObjectifsList } from './screens/ObjectifsList.js';
import { ObjectifForm } from './screens/ObjectifForm.js';
import { ObjectifDetail } from './screens/ObjectifDetail.js';
import { Mind } from './screens/Mind.js';
import { ProjetsList } from './screens/ProjetsList.js';
import { ProjetForm } from './screens/ProjetForm.js';
import { ProjetDetail } from './screens/ProjetDetail.js';
import { MoneyHome } from './screens/MoneyHome.js';
import { TransactionForm } from './screens/TransactionForm.js';
import { FinancialGoalForm } from './screens/FinancialGoalForm.js';
import { FinancialGoalDetail } from './screens/FinancialGoalDetail.js';
import { FamilyHome } from './screens/FamilyHome.js';
import { FamilyMemberForm } from './screens/FamilyMemberForm.js';
import { FamilyMemberDetail } from './screens/FamilyMemberDetail.js';
import { FamilyGoalForm } from './screens/FamilyGoalForm.js';
import { FamilyGoalDetail } from './screens/FamilyGoalDetail.js';
import { NotesList } from './screens/NotesList.js';
import { NoteForm } from './screens/NoteForm.js';
import { NoteDetail } from './screens/NoteDetail.js';
import { SecretList } from './screens/SecretList.js';
import { SecretForm } from './screens/SecretForm.js';
import { SecretDetail } from './screens/SecretDetail.js';
import { SecretLock } from './screens/SecretLock.js';
import { secretGuard } from './utils/secretGuard.js';
import { SecurityService } from './utils/securityService.js';
import { MediaList } from './screens/MediaList.js';
import { MediaForm } from './screens/MediaForm.js';
import { MediaDetail } from './screens/MediaDetail.js';
import { VoiceRecorder } from './screens/VoiceRecorder.js';
import { Coach } from './screens/Coach.js';
import { AbandonMode } from './screens/AbandonMode.js';
import { DifficultExperiencesAnalysis } from './screens/DifficultExperiencesAnalysis.js';
import { HabitsList } from './screens/HabitsList.js';
import { HabitForm } from './screens/HabitForm.js';
import { HabitDetail } from './screens/HabitDetail.js';
import { ReportsHome } from './screens/ReportsHome.js';
import { DailyReview } from './screens/DailyReview.js';
import { WeeklyReview } from './screens/WeeklyReview.js';
import { Profile } from './screens/Profile.js';
import { Help } from './screens/Help.js';
import { Onboarding } from './screens/Onboarding.js';

const app = document.getElementById('app');

app.appendChild(OfflineBanner());
const screenRoot = document.createElement('div');
screenRoot.id = 'screen-root';
app.appendChild(screenRoot);
app.appendChild(BottomNav());

router
  .register('/', Home)
  .register('/objectifs', ObjectifsList)
  .register('/objectifs/nouveau', ObjectifForm)
  .register('/objectifs/:id', ObjectifDetail)
  .register('/objectifs/:id/modifier', ObjectifForm)
  .register('/projets', ProjetsList)
  .register('/projets/nouveau', ProjetForm)
  .register('/projets/:id', ProjetDetail)
  .register('/projets/:id/modifier', ProjetForm)
  .register('/money', MoneyHome)
  .register('/money/transaction/nouveau', TransactionForm)
  .register('/money/transaction/:id/modifier', TransactionForm)
  .register('/money/objectifs/nouveau', FinancialGoalForm)
  .register('/money/objectifs/:id', FinancialGoalDetail)
  .register('/money/objectifs/:id/modifier', FinancialGoalForm)
  .register('/family', FamilyHome)
  .register('/family/membres/nouveau', FamilyMemberForm)
  .register('/family/membres/:id', FamilyMemberDetail)
  .register('/family/membres/:id/modifier', FamilyMemberForm)
  .register('/family/projets/nouveau', FamilyGoalForm)
  .register('/family/projets/:id', FamilyGoalDetail)
  .register('/family/projets/:id/modifier', FamilyGoalForm)
  .register('/mind', Mind)
  .register('/mind/experiences-difficiles', DifficultExperiencesAnalysis)
  .register('/coach', Coach)
  .register('/abandon', AbandonMode)
  .register('/notes', NotesList)
  .register('/notes/nouveau', NoteForm)
  .register('/notes/:id', NoteDetail)
  .register('/notes/:id/modifier', NoteForm)
  .register('/secret', secretGuard(SecretList))
  .register('/secret/nouveau', secretGuard(SecretForm))
  .register('/secret/securite', () => SecretLock({ mode: 'settings' }))
  .register('/secret/:id', secretGuard(SecretDetail))
  .register('/secret/:id/modifier', secretGuard(SecretForm))
  .register('/media', MediaList)
  .register('/media/nouveau', MediaForm)
  .register('/media/voix', VoiceRecorder)
  .register('/media/:id', MediaDetail)
  .register('/media/:id/modifier', MediaForm)
  .register('/habitudes', HabitsList)
  .register('/habitudes/nouveau', HabitForm)
  .register('/habitudes/:id', HabitDetail)
  .register('/habitudes/:id/modifier', HabitForm)
  .register('/rapports', ReportsHome)
  .register('/rapports/jour', DailyReview)
  .register('/rapports/semaine', WeeklyReview)
  .register('/profile', Profile)
  .register('/aide', Help)
  .register('/onboarding', Onboarding)
  .setNotFound(ComingSoon({
    title: 'Page introuvable',
    icon: 'alertTriangle',
    description: "Cette page n'existe pas encore.",
  }))
  // Tant que l'onboarding n'est pas terminé, toute route demandée (lien direct,
  // retour navigateur, hash tapé à la main, ou démarrage) est redirigée vers
  // /onboarding — même logique que secretGuard, au niveau global du router.
  .setBeforeResolve((path) => (!store.isOnboardingComplete() && path !== '/onboarding' ? '/onboarding' : null))
  .start('/');

// Enregistrement du service worker généré par vite-plugin-pwa (prod uniquement)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {});
}

// Vérification "best-effort" des rappels dus, tant que l'app reste ouverte.
// Sans serveur de push, il n'y a pas de vraie notification en arrière-plan possible.
store.checkDueNotifications();
setInterval(() => store.checkDueNotifications(), 60000);

// Dès que la session Secret se verrouille (auto-lock, mise en arrière-plan),
// si l'utilisateur est actuellement sur une route /secret*, on force un
// re-render immédiat pour remplacer l'écran affiché par SecretLock — sinon
// le contenu resterait visible à l'écran jusqu'à la prochaine navigation.
SecurityService.onChange((unlocked) => {
  if (!unlocked && router.currentPath?.startsWith('/secret') && router.currentPath !== '/secret/securite') {
    router._resolve();
  }
});

// Repousse le verrouillage auto sur toute interaction tant qu'on est dans Secret.
['click', 'keydown', 'touchstart'].forEach((evt) => {
  window.addEventListener(evt, () => {
    if (router.currentPath?.startsWith('/secret')) SecurityService.notifyActivity();
  }, { passive: true });
});
