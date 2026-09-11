// Confidence Triggers — "I CAN DO IT."
// La confiance est alimentée par des preuves de CAPACITÉ réelle : problèmes
// résolus, objectifs tenus, compétences apprises, actions répétées avec
// succès. Ces textes ne sont jamais affichés seuls : ils accompagnent
// toujours 1 à 3 preuves concrètes tirées de l'historique réel de
// l'utilisateur (voir store.getConfidenceStats() / recordConfidenceEvidence()).
// Rien d'ici n'est une citation générique — le texte est le cadre, la preuve
// réelle est le contenu.

// type: 'problem_solved' | 'goal_completed' | 'project_completed' |
//       'habit_completed' | 'task_completed' | 'skill_learned' | 'kept_word'
export const confidenceTriggersByType = {
  problem_solved: [
    { headline: 'CAPABILITY CONFIRMED', body: 'You faced a problem.\nYou figured it out.\nYou solved it.' },
    { headline: 'PROBLEM SOLVED', body: 'That obstacle looked real. You handled it anyway.' },
  ],
  goal_completed: [
    { headline: 'YOU FOLLOW THROUGH', body: 'You said you would do it.\nYou did it.' },
    { headline: 'GOAL REACHED', body: 'You set a target and you hit it. That is not luck.' },
  ],
  project_completed: [
    { headline: 'YOU BUILT SOMETHING', body: 'From idea to finished. That takes real capacity.' },
  ],
  habit_completed: [
    { headline: 'CONSISTENCY CONFIRMED', body: 'You showed up again. That is how capability compounds.' },
  ],
  task_completed: [
    { headline: 'YOU DELIVERED', body: 'Small task, real proof: you do what you plan.' },
  ],
  skill_learned: [
    { headline: 'YOU CAN LEARN ANYTHING', body: 'A skill you didn\u2019t have before is now yours.' },
  ],
  kept_word: [
    { headline: 'YOU FOLLOW THROUGH', body: 'You said you would do it.\nYou did it.' },
  ],
  default: [
    { headline: 'CAPABILITY CONFIRMED', body: 'You don\u2019t need more motivation.\nYou need to remember your evidence.' },
  ],
};

export function pickConfidenceTrigger(type) {
  const pool = confidenceTriggersByType[type] || confidenceTriggersByType.default;
  return pool[Math.floor(Math.random() * pool.length)];
}
