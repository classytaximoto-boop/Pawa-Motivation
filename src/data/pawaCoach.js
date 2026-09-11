import { PAWA_KNOWLEDGE, PAWA_PRINCIPLES } from './pawaKnowledge.js';
import { PAWA_MISSIONS } from './pawaMissions.js';

const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const includes=(s,arr)=>arr.some(x=>s.includes(x));

export function analyzePawaCoach(state={}) {
 const profile=state.developmentProfile||{};
 const analytics=state.analytics || state._pawaAnalytics || {};
 const checkins=Array.isArray(state.behaviorCheckins)?state.behaviorCheckins:[];
 const evidence=Array.isArray(state.developmentEvidence)?state.developmentEvidence:[];
 const recent=checkins.slice(0,10);
 const traits=recent.flatMap(x=>x.badTraits||[]).map(x=>String(x).toLowerCase());
 const speech=recent.map(x=>x.recentSpeech||'').join(' ').toLowerCase();
 const weaknesses=analytics.weakest?.length?analytics.weakest.map(x=>x.key||x):[];
 const has=(...words)=>includes(traits,words)||includes(speech,words);
 let priority='discipline', reason='La régularité est le levier le plus simple à transformer en preuves réelles.';
 if(has('colère','impulsivité','agressivité')) { priority='calm'; reason='Les dernières entrées montrent un besoin de renforcer le délai entre émotion et réponse.'; }
 else if(has('procrastination','évitement')) { priority='discipline'; reason='Le principal levier est de passer de l’intention à une action terminée.'; }
 else if(has('ego','arrogance','validation')) { priority='emotionalControl'; reason='Travaille la maîtrise de l’ego et la capacité à rester centré sur les faits.'; }
 else if(has('peur')) { priority='courage'; reason='Transforme l’inconfort en petites preuves d’action.'; }
 else if(weaknesses.length) { priority=weaknesses[0]; reason='Cette dimension fait partie de tes priorités actuelles selon tes données.'; }
 const knowledge=PAWA_KNOWLEDGE[priority]||PAWA_KNOWLEDGE.discipline;
 const mission=PAWA_MISSIONS.find(m=>m.dimension===priority)||PAWA_MISSIONS[0];
 const score=analytics.scores?.[priority];
 const totalXp=analytics.xp?.totalEarned||state.user?.xp||0;
 const todayXp=analytics.xp?.today||0;
 const evidenceCount=evidence.length;
 return {
  priority, reason, knowledge, mission,
  score: typeof score==='number'?clamp(score):null,
  totalXp,todayXp,evidenceCount,
  principles:PAWA_PRINCIPLES,
  dominantBehaviors:[...new Set(traits)].slice(0,5),
  greeting: totalXp===0?'On commence par les preuves.':'Tu as déjà des preuves. Maintenant, transforme-les en constance.',
 };
}

export function buildCoachReply(text, state={}) {
 const q=String(text||'').toLowerCase();
 const a=analyzePawaCoach(state);
 if(q.includes('résume')||q.includes('journée')) return `${a.greeting}\n\nPriorité : ${a.knowledge.title}. ${a.reason}\n\nAujourd’hui : ${a.todayXp} XP · ${a.evidenceCount} preuves enregistrées.\n\nAction : ${a.mission.prompt}`;
 if(q.includes('procrast')) return `${PAWA_KNOWLEDGE.procrastination.title}\n\n${PAWA_KNOWLEDGE.procrastination.advice}\n\nMission : ${PAWA_KNOWLEDGE.procrastination.action}`;
 if(q.includes('provoc')||q.includes('insulte')||q.includes('attaque')) return `${PAWA_KNOWLEDGE.provocation.title}\n\n${PAWA_KNOWLEDGE.provocation.advice}\n\nMission : ${PAWA_MISSIONS.find(m=>m.id==='m_calm').prompt}`;
 if(q.includes('calme')||q.includes('colère')) return `${PAWA_KNOWLEDGE.anger.title}\n\n${PAWA_KNOWLEDGE.anger.advice}\n\n${PAWA_KNOWLEDGE.anger.action}`;
 if(q.includes('mission')||q.includes('action')) return `MISSION PAWA — ${a.mission.title}\n\n${a.mission.prompt}\n\nObjectif : renforcer ${a.priority}.`;
 if(q.includes('progresser')||q.includes('priorité')) return `Ta priorité actuelle : ${a.knowledge.title}.\n\n${a.reason}\n\n${a.knowledge.advice}`;
 if(q.includes('motive')) return `Pas besoin d’attendre de te sentir prêt. Fais une preuve maintenant.\n\n${a.mission.prompt}`;
 return `Je fonctionne offline à partir de tes données.\n\nCe que je vois : priorité ${a.knowledge.title}.\n${a.reason}\n\nTu peux me demander : « résume ma journée », « sur quoi progresser ? », « donne-moi une mission », ou « comment rester calme face à une provocation ? »`;
}
