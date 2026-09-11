// PAWA ANALYTICS — couche de calcul pure, offline et non destructive.
// Les données brutes ne sont jamais modifiées : on produit uniquement des scores.

const DIMENSIONS = [
  'confidence','selfEsteem','leadership','charisma','calm','discipline',
  'communication','assertiveness','courage','resilience','decisionMaking',
  'emotionalControl','socialCourage','focus','adaptability'
];

export const dimensionLabels = {
  confidence:'Confiance', selfEsteem:'Estime de soi', leadership:'Leadership', charisma:'Charisme',
  calm:'Calme', discipline:'Discipline', communication:'Communication', assertiveness:'Assertivité',
  courage:'Courage', resilience:'Résilience', decisionMaking:'Décision', emotionalControl:'Contrôle émotionnel',
  socialCourage:'Courage social', focus:'Focus', adaptability:'Adaptabilité'
};

const clamp = (n,min=0,max=100) => Math.max(min, Math.min(max, Number(n)||0));
const dayKey = d => { const x=new Date(d||Date.now()); const off=x.getTimezoneOffset()*60000; return new Date(x.getTime()-off).toISOString().slice(0,10); };

export function calculatePawaScores(state = {}) {
  const profile = state.developmentProfile || {};
  const evidence = Array.isArray(state.developmentEvidence) ? state.developmentEvidence : [];
  const emotions = Array.isArray(state.emotions) ? state.emotions : [];

  const scores = {};
  DIMENSIONS.forEach(k => {
    // Profil = construction lente. Les preuves récentes ajoutent un petit signal,
    // sans remplacer la valeur historique.
    const base = clamp((Number(profile[k])||0) * 100 / 55);
    const support = evidence.reduce((sum,e) => sum + (Number(e.dimensions?.[k])||0), 0);
    const recent = evidence.filter(e => Date.now() - new Date(e.createdAt||e.date||0).getTime() <= 30*86400000)
      .reduce((sum,e) => sum + (Number(e.dimensions?.[k])||0), 0);
    const score = clamp(base * 0.78 + Math.min(22, support * 1.8) * 0.16 + Math.min(12, recent * 1.5) * 0.06);
    scores[k] = Math.round(score);
  });

  // Les émotions ne deviennent jamais directement une "mauvaise note" :
  // elles servent à nuancer contrôle/calme et à signaler des contextes récurrents.
  const negativeMoods = new Set(['angry','frustration','pressure','fearful','fear_of_failure','need_validation','insecurity','overwhelmed','anxious','emotional_exhaustion']);
  const negativeRecent = emotions.filter(e => Date.now()-new Date(e.date||e.createdAt||0).getTime() <= 7*86400000 && negativeMoods.has(e.mood)).length;
  const calmHits = evidence.filter(e => ['calm_pressure','ignore_provocation','verbal_attack'].includes(e.challengeId)).length;
  if (negativeRecent > 0) scores.emotionalControl = clamp(scores.emotionalControl - Math.min(12, negativeRecent*1.5) + Math.min(8, calmHits*1.2));
  scores.calm = clamp(scores.calm - Math.min(8, negativeRecent) + Math.min(7, calmHits));
  return scores;
}

export function calculateIntegrityScore(state = {}) {
  const evidence = Array.isArray(state.developmentEvidence) ? state.developmentEvidence : [];
  const history = Array.isArray(state.xpHistory) ? state.xpHistory : [];
  const positiveActions = evidence.length;
  const reflected = evidence.filter(e => String(e.reflection||'').trim().length >= 20).length;
  const completedPromises = evidence.filter(e => e.challengeId === 'promise_kept').length;
  const deletedEvidence = 0; // append-only evidence : suppression n'est pas utilisée comme preuve.
  const base = positiveActions ? 55 + Math.min(25, reflected / positiveActions * 25) : 50;
  const consistency = history.length ? Math.min(20, positiveActions / Math.max(1, history.length) * 20) : 0;
  return Math.round(clamp(base + consistency + Math.min(10, completedPromises*2) - deletedEvidence));
}

export function calculateRecoveryScore(state = {}) {
  const reviews = Array.isArray(state.dailyReviews) ? state.dailyReviews : [];
  const evidence = Array.isArray(state.developmentEvidence) ? state.developmentEvidence : [];
  const comeback = evidence.filter(e => e.challengeId === 'comeback').length;
  const reviewed = reviews.filter(r => String(r.learned||'').trim() || String(r.tomorrow||'').trim()).length;
  const streak = Number(state.user?.streak)||0;
  return Math.round(clamp(45 + Math.min(25, comeback*8) + Math.min(20, reviewed*3) + Math.min(10, streak)));
}

export function calculateGapToBeast(state = {}, target = null) {
  const scores = calculatePawaScores(state);
  const keys = DIMENSIONS.filter(k => scores[k] != null);
  const average = keys.reduce((s,k)=>s+scores[k],0)/(keys.length||1);
  const priority = keys.map(k=>({key:k,score:scores[k],gap:100-scores[k]})).sort((a,b)=>b.gap-a.gap).slice(0,5);
  const beast = clamp(average);
  return { score:Math.round(beast), priority, target: target || 'BEAST VERSION' };
}

export function calculateXpQuality(state = {}) {
  const history = Array.isArray(state.xpHistory) ? state.xpHistory.filter(e=>Number(e.amount)>0) : [];
  const bySource = {};
  history.forEach(e => { const s=e.source||'autre'; bySource[s]=(bySource[s]||0)+Number(e.amount||0); });
  const today = dayKey();
  const todayXp = history.filter(e=>dayKey(e.date)===today).reduce((s,e)=>s+Number(e.amount||0),0);
  const last7 = history.filter(e=>Date.now()-new Date(e.date||0).getTime()<=7*86400000).reduce((s,e)=>s+Number(e.amount||0),0);
  const earned = history.reduce((s,e)=>s+Number(e.amount||0),0);
  return {earned,todayXp,last7,bySource,count:history.length,average:history.length?Math.round(earned/history.length):0};
}

export function getPawaAnalytics(state = {}) {
  const scores = calculatePawaScores(state);
  const sorted = Object.entries(scores).map(([key,score])=>({key,score,label:dimensionLabels[key]||key})).sort((a,b)=>b.score-a.score);
  const weakest = sorted.slice().sort((a,b)=>a.score-b.score).slice(0,5);
  return {
    scores,
    strongest: sorted.slice(0,5),
    weakest,
    integrity: calculateIntegrityScore(state),
    recovery: calculateRecoveryScore(state),
    gapToBeast: calculateGapToBeast(state),
    xp: calculateXpQuality(state),
    generatedAt: new Date().toISOString(),
  };
}
