// Analyse comportementale transparente : signaux calculés uniquement à partir
// des données enregistrées dans l'application. Ce n'est pas un diagnostic.

const DAY = 86400000;

export const behaviorRules = [
  { id:'impulsivite', label:'Impulsivité / réaction rapide', icon:'⚡', keywords:['verbal_attack','social_direct'], moodIds:['angry','frustration','pressure'], negativeDims:['emotionalControl','calm'], instruction:'Quand la tension monte : pause 10 secondes → respiration → réponse courte et factuelle. Ne réponds jamais au pic de l’émotion.' },
  { id:'besoin_validation', label:'Besoin de validation', icon:'🎯', keywords:['ask_for_help'], moodIds:['need_validation','insecurity'], negativeDims:['confidence','selfEsteem','decisionMaking'], instruction:'Prends chaque jour une petite décision sûre sans demander d’approbation. Assume ensuite le résultat.' },
  { id:'evitement', label:'Évitement / difficulté à affronter', icon:'🧱', keywords:['fear_action','hard_decision','social_stranger'], moodIds:['fear_of_failure','fearful','anxious'], negativeDims:['courage','resilience'], instruction:'Choisis une action inconfortable mais sûre. Fais-la avant de chercher une tâche plus facile.' },
  { id:'difficultes_limites', label:'Limites trop faibles', icon:'🛡️', keywords:['assertive_no','boundary'], moodIds:['need_validation','insecurity'], negativeDims:['assertiveness','confidence'], instruction:'Utilise un refus clair et calme : « Non, je ne peux pas / je ne veux pas. » Une limite n’a pas besoin d’une longue justification.' },
  { id:'reaction_provocation', label:'Sensibilité à la provocation', icon:'🔥', keywords:['ignore_provocation','verbal_attack'], moodIds:['angry','frustration'], negativeDims:['emotionalControl','calm'], instruction:'Ne cherche pas à gagner l’échange. Gagne le contrôle de ta réponse : distance, calme, limite claire.' },
  { id:'discipline', label:'Discipline irrégulière', icon:'⏳', keywords:['promise_kept','focus_distraction','difficult_task'], moodIds:['emotional_exhaustion','boredom'], negativeDims:['discipline'], instruction:'Fixe une seule promesse quotidienne mesurable et tiens-la même quand la motivation baisse.' },
  { id:'surcontrole', label:'Besoin de contrôle', icon:'🎯', keywords:['calm_pressure','receptive_posture'], moodIds:['control_obsession','pressure'], negativeDims:['calm','receptivePosture'], instruction:'Sépare ce qui dépend de toi de ce qui ne dépend pas de toi. Laisse volontairement une petite chose à quelqu’un d’autre.' },
  { id:'isolement', label:'Retrait social', icon:'🌑', keywords:['social_stranger','social_direct','public_speaking'], moodIds:['lonely','sad','miss'], negativeDims:['communication','socialCourage','charisma'], instruction:'Initie chaque jour une interaction réelle, même courte : question, salutation, demande ou conversation.' },
  { id:'ego_defensif', label:'Ego défensif / difficulté à reconnaître une erreur', icon:'🪞', keywords:['apologize'], moodIds:['pride','shame'], negativeDims:['selfEsteem','emotionalControl'], instruction:'Quand tu as tort : reconnais le fait, corrige-le, puis avance. Ni justification interminable ni auto-dévalorisation.' },
  { id:'reaction_echec', label:'Sensibilité à l’échec', icon:'🧨', keywords:['comeback','difficult_task'], moodIds:['fear_of_failure','disappointment'], negativeDims:['resilience','courage'], instruction:'Après un échec, écris : ce qui a échoué / ce que j’ai appris / ma prochaine tentative. Puis recommence.' },
  { id:'surcharge', label:'Surcharge émotionnelle', icon:'🌊', keywords:['calm_pressure','difficult_task'], moodIds:['overwhelmed','emotional_exhaustion','anxious'], negativeDims:['emotionalControl','calm'], instruction:'Réduis le problème à une seule prochaine action. Fais une pause courte, puis reprends avec une priorité unique.' },
  { id:'procrastination', label:'Tendance à repousser', icon:'⏱️', keywords:['focus_distraction','difficult_task'], moodIds:['boredom','overwhelmed'], negativeDims:['discipline','focus'], instruction:'Lance un minuteur de 10 minutes et commence immédiatement. Le but est de démarrer, pas de finir parfaitement.' },
];

const POSITIVE_SIGNAL_MAP = {
  leadership: ['leadership_responsibility','leadership_coordinate','lead_by_example'],
  communication: ['social_direct','social_stranger','public_speaking'],
  courage: ['fear_action','hard_decision','social_stranger'],
  assertiveness: ['assertive_no','boundary'],
  emotionalControl: ['verbal_attack','ignore_provocation','calm_pressure'],
  discipline: ['promise_kept','focus_distraction','difficult_task'],
  resilience: ['comeback','difficult_task'],
  decisionMaking: ['hard_decision'],
  socialCourage: ['social_stranger','social_direct','public_speaking'],
};

const EMOTION_SIGNAL_MAP = {
  angry:['emotionalControl','calm'], frustration:['emotionalControl','calm'], pressure:['emotionalControl','calm'],
  fear_of_failure:['courage','resilience'], fearful:['courage'], anxious:['emotionalControl','calm'],
  need_validation:['confidence','selfEsteem','decisionMaking'], insecurity:['confidence','selfEsteem'],
  lonely:['communication','socialCourage'], sad:['resilience'], miss:['socialCourage'],
  pride:['emotionalControl'], control_obsession:['calm'], emotional_exhaustion:['discipline','emotionalControl'],
  overwhelmed:['emotionalControl','discipline'], disappointment:['resilience'], boredom:['discipline','focus'],
  confidence:['confidence'], determination:['discipline','courage'], ambition:['confidence','leadership'], calm:['calm','emotionalControl'],
};

const BAD_TRAIT_RULES = {
  impulsivite:['impulsivite','reaction_provocation'], colere:['impulsivite','reaction_provocation'], ego:['ego_defensif'],
  mensonge:['ego_defensif'], procrastination:['procrastination'], validation:['besoin_validation'], evitement:['evitement'],
  jalousie:['besoin_validation'], peur:['evitement','reaction_echec'], arrogance:['ego_defensif'],
  manque_discipline:['discipline','procrastination'], agressivite:['impulsivite','reaction_provocation'],
  manipulable:['besoin_validation','difficultes_limites'], surcontrole:['surcontrole'], retrait:['isolement']
};

const SPEECH_PATTERNS = [
  { re:/\b(je dois|il faut que je|on m'a obligé|j'ai dû)\b/i, rule:'pression' },
  { re:/\b(tais[- ]toi|ferme[- ]la|connard|idiot|imbécile)\b/i, rule:'reaction_provocation' },
  { re:/\b(désolé mais|c'est pas ma faute|j'ai rien fait)\b/i, rule:'ego_defensif' },
  { re:/\b(oui|d'accord),? (je vais|je ferai)\b/i, rule:'besoin_validation' },
  { re:/\b(j'ai menti|je lui ai menti|j'ai caché)\b/i, rule:'ego_defensif' },
  { re:/\b(j'ai évité|je n'ai pas osé|j'ai eu peur)\b/i, rule:'evitement' },
  { re:/\b(je vais le faire demain|plus tard|j'ai pas le temps)\b/i, rule:'procrastination' },
];

function ageDays(date) {
  const t = new Date(date || 0).getTime();
  return Number.isFinite(t) ? Math.max(0, (Date.now() - t) / DAY) : 999;
}
function recencyWeight(date, horizon=90) {
  const d=ageDays(date);
  return d > horizon ? 0 : Math.pow(0.5, d / 21);
}
function countAction(evidence, ids) {
  return evidence.reduce((s,e)=>s+(ids.includes(e.challengeId)?recencyWeight(e.createdAt || e.date):0),0);
}

export function analyzeBehavior(state) {
  const evidence = Array.isArray(state?.developmentEvidence) ? state.developmentEvidence : [];
  const emotions = Array.isArray(state?.emotions) ? state.emotions : [];
  const profile = state?.developmentProfile || {};
  const recent = emotions.filter(e=>ageDays(e.date || e.createdAt)<=90);
  const behaviorCheckins = Array.isArray(state?.behaviorCheckins) ? state.behaviorCheckins : [];
  const recentBehavior = behaviorCheckins.filter(e=>ageDays(e.date || e.createdAt)<=30);
  const badTraitCounts = {};
  const speechSignals = [];
  recentBehavior.forEach(entry => {
    (entry.badTraits || []).forEach(trait => {
      badTraitCounts[trait] = (badTraitCounts[trait] || 0) + recencyWeight(entry.date || entry.createdAt,30);
      (BAD_TRAIT_RULES[trait] || []).forEach(ruleId => speechSignals.push({ruleId, weight:recencyWeight(entry.date || entry.createdAt,30)}));
    });
    const speech = entry.recentSpeech || '';
    SPEECH_PATTERNS.forEach(pat => { if (pat.re.test(speech)) speechSignals.push({ruleId:pat.rule, weight:recencyWeight(entry.date || entry.createdAt,30)}); });
  });

  const behaviorSignals = {};
  Object.entries(POSITIVE_SIGNAL_MAP).forEach(([dim,ids])=>{ behaviorSignals[dim]=countAction(evidence,ids); });
  recent.forEach(e=>{
    const w=recencyWeight(e.date || e.createdAt,90);
    (EMOTION_SIGNAL_MAP[e.mood] || []).forEach(dim=>behaviorSignals[dim]=(behaviorSignals[dim]||0)+w*.65);
  });

  const results = behaviorRules.map(rule=>{
    const actionHits=countAction(evidence,rule.keywords);
    const moodHits=recent.reduce((s,e)=>s+(rule.moodIds.includes(e.mood)?recencyWeight(e.date||e.createdAt,90):0),0);
    const checkinHits=recentBehavior.reduce((s,e)=>s+(e.badTraits||[]).reduce((a,t)=>a+((BAD_TRAIT_RULES[t]||[]).includes(rule.id)?recencyWeight(e.date||e.createdAt,30):0),0),0);
    const speechHits=speechSignals.filter(x=>x.ruleId===rule.id).reduce((s,x)=>s+x.weight,0);
    const weakest=rule.negativeDims.reduce((s,k)=>s+(1-Math.min(1,Number(profile[k]||0)))*12,0);
    const exposure=Math.min(1,(actionHits+moodHits)/5);
    const score=Math.min(100,Math.round(weakest + (1-exposure)*18 + moodHits*10 + checkinHits*18 + speechHits*16));
    const confidence=Math.min(99,Math.round(45 + Math.min(35,(actionHits+moodHits+checkinHits+speechHits)*7) + Math.min(14,evidence.length+recentBehavior.length)));
    return {...rule,score,confidence,actionHits:Number(actionHits.toFixed(1)),moodHits:Number(moodHits.toFixed(1)),checkinHits:Number(checkinHits.toFixed(1)),speechHits:Number(speechHits.toFixed(1))};
  }).filter(r=>r.score>=25).sort((a,b)=>b.score-a.score);

  const trend = Object.entries(behaviorSignals)
    .map(([dimension,signal])=>({dimension,signal:Number(signal.toFixed(2)),level:Math.min(100,Math.round(signal*10))}))
    .sort((a,b)=>b.signal-a.signal);

  const recentEmotionCounts={};
  recent.forEach(e=>recentEmotionCounts[e.mood]=(recentEmotionCounts[e.mood]||0)+1);
  const dominantEmotions=Object.entries(recentEmotionCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([mood,count])=>({mood,count}));
  const dimensions=['confidence','selfEsteem','leadership','charisma','calm','discipline','communication','assertiveness','courage','resilience','decisionMaking','emotionalControl','socialCourage'];
  const weakest=dimensions.map(key=>({key,value:Number(profile[key]||0),signal:Number(behaviorSignals[key]||0)})).sort((a,b)=>a.value-b.value).slice(0,5);
  return {results,weakest,trend,dominantEmotions,evidenceCount:evidence.length,recentEmotionCount:recent.length,recentBehaviorCheckins:recentBehavior.length,badTraitCounts, recentBehavior:recentBehavior.slice(0,10), speechSignals};
}
