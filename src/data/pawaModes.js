// Mode de Pawa — archétypes calculés dynamiquement à partir des données existantes.
// Aucun champ utilisateur n'est modifié par ce module.

export const pawaModes = [
  { id:'pro', label:'PRO', icon:'💼', description:'Fiabilité, précision, constance et exécution.', weights:{discipline:1.2,decisionMaking:1,communication:0.9,focus:0.9,resilience:0.8}, actions:['Terminer une tâche importante avant toute distraction.','Tenir une promesse précise faite à toi-même.','Organiser ta prochaine journée en 3 priorités.'] },
  { id:'alpha', label:'ALPHA', icon:'🦁', description:'Présence, initiative, responsabilité et leadership.', weights:{leadership:1.2,confidence:1,assertiveness:1,socialCourage:0.9,courage:0.8}, actions:['Prendre volontairement une responsabilité.','Exprimer clairement ton avis sans chercher l’approbation.','Diriger une petite action ou décision.'] },
  { id:'sigma', label:'SIGMA', icon:'🐺', description:'Autonomie, discipline silencieuse et indépendance.', weights:{discipline:1.2,selfEsteem:0.9,decisionMaking:0.9,resilience:1,courage:0.8}, actions:['Faire une tâche utile sans en parler ni chercher de validation.','Prendre une décision raisonnable seul.','Continuer une tâche même sans motivation.'] },
  { id:'assertive', label:'ASSERTIF', icon:'🛡️', description:'Savoir dire oui ou non clairement sans agressivité.', weights:{assertiveness:1.3,confidence:1,communication:1,emotionalControl:0.9,courage:0.8}, actions:['Dire non à une demande que tu ne veux pas accepter.','Poser une limite claire et calme.','Exprimer un désaccord sans attaque personnelle.'] },
  { id:'strategist', label:'STRATÈGE', icon:'♟️', description:'Observer, anticiper, choisir et préparer plusieurs scénarios.', weights:{decisionMaking:1.3,calm:1,emotionalControl:1,communication:0.8,adaptability:1,leadership:0.7}, actions:['Avant d’agir, écrire : objectif → obstacles → option A/B → conséquence.','Observer une situation avant de réagir.','Préparer un plan B avant une décision importante.'] },
  { id:'observer', label:'OBSERVATEUR', icon:'🕵️', description:'Lire les signaux, comprendre le contexte et éviter les réactions automatiques.', weights:{calm:1.2,emotionalControl:1.2,communication:0.8,decisionMaking:0.9,adaptability:1}, actions:['Pendant une interaction, identifier faits, émotions et objectif séparément.','Attendre avant de répondre à une provocation.','Chercher une information manquante avant de conclure.'] },
  { id:'influence', label:'INFLUENCE', icon:'🧲', description:'Convaincre avec clarté, écoute et compréhension des intérêts — sans tromper.', weights:{charisma:1.2,communication:1.2,confidence:0.9,leadership:0.9,adaptability:0.8}, actions:['Présenter une proposition en expliquant le bénéfice pour l’autre.','Écouter avant de convaincre.','Négocier un résultat équitable sans pression ni mensonge.'] },
  { id:'unmanipulable', label:'INMANIPULABLE', icon:'🛡️', description:'Résister à la pression, à la culpabilisation et aux provocations.', weights:{emotionalControl:1.3,assertiveness:1.1,selfEsteem:1,decisionMaking:1,courage:0.9}, actions:['Refuser calmement une pression inutile.','Ne pas répondre immédiatement sous émotion.','Demander des faits avant d’accepter une affirmation.'] },
  { id:'control', label:'CONTROL', icon:'🧊', description:'Garder la maîtrise de ses réactions et de ses décisions sous pression.', weights:{emotionalControl:1.3,calm:1.3,discipline:0.9,resilience:0.9}, actions:['Faire une pause avant une réponse émotionnelle.','Transformer une émotion en prochaine action concrète.','Rester factuel pendant une situation tendue.'] },
  { id:'warrior', label:'COMBATTANT', icon:'🔥', description:'Courage, résilience et capacité à revenir après un échec.', weights:{courage:1.2,resilience:1.3,discipline:1,decisionMaking:0.7}, actions:['Faire une action inconfortable mais sûre.','Recommencer après un échec avec une correction précise.','Finir une tâche difficile commencée.'] },
  { id:'communicator', label:'COMMUNICATEUR', icon:'🗣️', description:'Parler clairement, écouter et adapter son message.', weights:{communication:1.3,charisma:0.9,confidence:0.9,socialCourage:1}, actions:['Dire directement ce que tu veux avec une phrase claire.','Lancer une conversation réelle.','Reformuler ce que l’autre a dit avant de répondre.'] },
  { id:'learner', label:'APPRENANT', icon:'📚', description:'Transformer chaque expérience en compétence et en amélioration.', weights:{adaptability:1.2,resilience:1,discipline:1,decisionMaking:0.7}, actions:['Après une erreur, noter ce qui a été appris.','Appliquer immédiatement une nouvelle connaissance.','Chercher un feedback concret puis l’utiliser.'] },
];

export function calculatePawaModes(profile = {}) {
  const values = Object.fromEntries(Object.entries(profile).map(([k,v])=>[k,Math.max(0,Math.min(1,Number(v)||0))]));
  return pawaModes.map(mode => {
    const entries = Object.entries(mode.weights);
    const total = entries.reduce((s,[k,w])=>s+w,0) || 1;
    const score = Math.round(entries.reduce((s,[k,w])=>s+(values[k]||0)*w,0)/total*100);
    const gaps = entries.map(([k,w])=>({key:k,gap:Math.max(0,1-(values[k]||0)),weight:w})).sort((a,b)=>(b.gap*b.weight)-(a.gap*a.weight));
    return {...mode,score:Math.max(0,Math.min(100,score)), priorities:gaps.slice(0,3)};
  }).sort((a,b)=>b.score-a.score);
}
