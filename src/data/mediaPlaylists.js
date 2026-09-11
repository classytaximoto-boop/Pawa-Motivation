// Catégories de playlist — le "pourquoi" d'un média motivant, distinct du
// type de fichier (voir mediaCategories.js : video/audio/article/livre/autre,
// qui détermine le lecteur à utiliser). Un média peut être classé dans une
// seule playlist à la fois (le champ le plus utile pour "quand l'écouter").
export const mediaPlaylists = [
  { id: 'morning_motivation', label: 'Morning Motivation', icon: 'flame', color: '--ember-500' },
  { id: 'focus', label: 'Focus', icon: 'target', color: '--steel-500' },
  { id: 'before_work', label: 'Before Work', icon: 'compass', color: '--steel-400' },
  { id: 'before_training', label: 'Before Training', icon: 'bolt', color: '--ember-600' },
  { id: 'when_i_want_to_quit', label: 'When I Want To Quit', icon: 'mind', color: '--danger-500' },
  { id: 'relaxation', label: 'Relaxation', icon: 'inbox', color: '--success-500' },
  { id: 'leadership', label: 'Leadership', icon: 'user', color: '--warning-500' },
];

export const mediaPlaylistMap = Object.fromEntries(mediaPlaylists.map((p) => [p.id, p]));
