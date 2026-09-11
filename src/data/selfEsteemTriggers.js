// Self-Esteem Triggers — "I HAVE VALUE."
// Distinct de la confiance ("I CAN"). L'estime de soi n'est pas calculée
// uniquement sur la performance : promesses tenues, courage, responsabilité,
// résilience après échec, aide apportée aux autres, actions alignées avec
// ses valeurs. Comme pour Confidence, ces textes accompagnent toujours des
// preuves réelles tirées de l'historique (voir store.getSelfEsteemStats() /
// recordSelfEsteemEvidence()) — jamais un score affiché seul.

// type: 'promise_kept' | 'courage' | 'responsibility' | 'comeback' |
//       'contribution' | 'growth' | 'self_respect'
export const selfEsteemTriggersByType = {
  promise_kept: [
    { headline: 'YOU CAN TRUST YOURSELF', body: 'A promise made to yourself, kept. That\u2019s the foundation.' },
  ],
  courage: [
    { headline: 'COURAGE CONFIRMED', body: 'You did the hard thing on purpose. That\u2019s who you are.' },
  ],
  responsibility: [
    { headline: 'THAT\u2019S CHARACTER', body: 'You took ownership when it would\u2019ve been easier not to.' },
  ],
  comeback: [
    { headline: 'YOU CAME BACK', body: 'You stopped. You didn\u2019t quit. You came back.' },
  ],
  contribution: [
    { headline: 'THAT MATTERED', body: 'You showed up for someone else. That has weight.' },
  ],
  growth: [
    { headline: 'GROWTH MOMENT', body: 'You are not the same person you were before this.' },
  ],
  self_respect: [
    { headline: 'YOU RESPECTED YOURSELF', body: 'You chose what was right for you, even when it was hard.' },
  ],
  default: [
    { headline: 'YOU HAVE VALUE', body: 'Not because of what you produced today \u2014 because of who you are showing up as.' },
  ],
};

export function pickSelfEsteemTrigger(type) {
  const pool = selfEsteemTriggersByType[type] || selfEsteemTriggersByType.default;
  return pool[Math.floor(Math.random() * pool.length)];
}
