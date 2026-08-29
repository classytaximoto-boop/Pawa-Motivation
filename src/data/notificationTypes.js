// Types de notifications locales — source unique de vérité (formulaire de préférences + planification).
// L'heure par défaut est indicative ; l'utilisateur peut la modifier dans les préférences.
export const notificationTypes = [
  { id: 'morning_boost', label: 'Morning Boost', icon: 'bolt', defaultTime: '07:00', description: 'Une dose de motivation pour démarrer la journée.' },
  { id: 'morning_mission', label: 'Mission du matin', icon: 'target', defaultTime: '07:15', description: 'Rappel de tes 3 missions du jour.' },
  { id: 'goal_reminder', label: "Rappel d'objectif", icon: 'compass', defaultTime: '12:00', description: 'Un objectif actif à ne pas perdre de vue.' },
  { id: 'habit_reminder', label: "Rappel d'habitude", icon: 'flame', defaultTime: '18:00', description: 'Une habitude du jour pas encore cochée.' },
  { id: 'evening_review', label: 'Evening Review', icon: 'notes', defaultTime: '21:00', description: 'Moment de faire ton rapport quotidien.' },
  { id: 'motivation', label: 'Motivation', icon: 'sparkles', defaultTime: '15:00', description: 'Une citation ou un rappel motivant dans la journée.' },
  { id: 'deadline', label: 'Deadline proche', icon: 'alertTriangle', defaultTime: '09:00', description: "Alerte quand une échéance d'objectif ou de projet approche." },
  { id: 'daily_reminder_morning', label: 'Rappel du jour', icon: 'compass', defaultTime: '08:00', description: 'Un point du matin : où tu en es, ta motivation, ce qui t\'attend aujourd\'hui.' },
  { id: 'daily_summary_midday', label: 'Récap du midi', icon: 'notes', defaultTime: '13:00', description: 'Résumé automatique de ta matinée : argent, progrès, apprentissages, réussites.' },
  { id: 'daily_summary_evening', label: 'Récap du soir', icon: 'notes', defaultTime: '20:30', description: 'Résumé automatique de ta journée : argent, progrès, apprentissages, réussites.' },
];

export const notificationTypeMap = Object.fromEntries(notificationTypes.map((n) => [n.id, n]));
