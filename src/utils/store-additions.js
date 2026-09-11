// ============================================================
// AJOUTS POUR LE MODULE AGENDA
// ============================================================

// --- 1) Dans `defaultState`, ajouter ces deux clés (par exemple juste après `onboarding: {...}`) :

  agendaTasks: [], // AgendaTask[] — { id, date (YYYY-MM-DD), hour (0-23), title, note, done, doneAt, createdAt }
  agendaXp: {
    xp: 0,
    totalEarned: 0,
  },

// --- 2) Dans la classe Store, ajouter ces méthodes (par exemple juste après addXp()/getXpSummary()) :

  // ============================================================
  // AGENDA — tâches planifiées par heure + XP séparé
  // ============================================================

  /** Liste les tâches d'un jour donné (YYYY-MM-DD), triées par heure. */
  getAgendaTasksForDate(dateKey) {
    return this.state.agendaTasks
      .filter((t) => t.date === dateKey)
      .sort((a, b) => a.hour - b.hour);
  }

  /** Crée une tâche planifiée. hour = 0-23. */
  addAgendaTask({ date, hour, title, note = '' }) {
    const task = {
      id: uid('agenda'),
      date,
      hour: Number(hour),
      title: title.trim(),
      note: note.trim(),
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
    };
    this.set({ agendaTasks: [...this.state.agendaTasks, task] });
    return task;
  }

  updateAgendaTask(id, patch) {
    this.set({
      agendaTasks: this.state.agendaTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  }

  deleteAgendaTask(id) {
    this.set({ agendaTasks: this.state.agendaTasks.filter((t) => t.id !== id) });
  }

  /**
   * Marque une tâche comme terminée (ou annule si déjà faite) et ajuste l'XP
   * Agenda en conséquence. Renvoie { justCompleted: boolean, xpGained: number }
   * pour que l'écran sache s'il doit afficher le message de félicitations.
   */
  toggleAgendaTask(id) {
    const task = this.state.agendaTasks.find((t) => t.id === id);
    if (!task) return { justCompleted: false, xpGained: 0 };
    const willBeDone = !task.done;
    const xpGained = 10; // XP fixe par tâche terminée — simple et prévisible
    this.updateAgendaTask(id, {
      done: willBeDone,
      doneAt: willBeDone ? new Date().toISOString() : null,
    });
    this.addAgendaXp(willBeDone ? xpGained : -xpGained);
    return { justCompleted: willBeDone, xpGained: willBeDone ? xpGained : 0 };
  }

  /** XP Agenda — système totalement séparé de l'XP global (user.xp). */
  addAgendaXp(amount) {
    const current = this.state.agendaXp ?? { xp: 0, totalEarned: 0 };
    const xp = Math.max(0, current.xp + amount);
    const totalEarned = amount > 0 ? current.totalEarned + amount : current.totalEarned;
    this.set({ agendaXp: { xp, totalEarned } });
  }

  getAgendaXpSummary() {
    return this.state.agendaXp ?? { xp: 0, totalEarned: 0 };
  }

  /**
   * Recherche dans l'historique des tâches Agenda (toutes dates confondues)
   * par mot-clé sur le titre ou la note. Insensible à la casse/accents basique.
   */
  searchAgendaHistory(query) {
    const q = query.trim().toLowerCase();
    if (!q) return this.state.agendaTasks.slice().sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour)).reverse();
    return this.state.agendaTasks
      .filter((t) => t.title.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q))
      .sort((a, b) => (a.date + String(a.hour).padStart(2, '0')).localeCompare(b.date + String(b.hour).padStart(2, '0')))
      .reverse();
  }
