// ==================== CONFIG (Constantes centralisées) ====================
const CONFIG = {
    VERSION: 2,
    STORAGE_KEY: 'sf_ultimate_pro_v2',
    
    // Planning
    HOURS: { min: 6, max: 22 },
    DAYS: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    SLOT_DURATION: 60,
    
    // Types de créneaux avec couleurs
    SLOT_TYPES: {
        cours: { label: 'Cours', color: 'indigo', gradient: 'from-indigo-600 to-indigo-800', icon: '📚' },
        revisions: { label: 'Révision', color: 'amber', gradient: 'from-amber-500 to-amber-700', icon: '✏️' },
        repos: { label: 'Repos', color: 'emerald', gradient: 'from-emerald-500 to-emerald-700', icon: '😴' },
        sport: { label: 'Sport', color: 'rose', gradient: 'from-rose-500 to-rose-700', icon: '🏃' },
        social: { label: 'Social', color: 'purple', gradient: 'from-purple-500 to-purple-700', icon: '👥' },
        admin: { label: 'Admin', color: 'slate', gradient: 'from-slate-500 to-slate-700', icon: '📋' },
        repas: { label: 'Repas', color: 'orange', gradient: 'from-orange-500 to-orange-700', icon: '🍽️' }
    },
    
    // Safe Mode
    SAFE_MODE: {
        THRESHOLDS: {
            critical: { score: 80, sleepMin: 5, stressMin: 8, loadMax: 35 },
            alert: { score: 60, sleepMin: 6, stressMin: 7, loadMax: 30 },
            watch: { score: 40, sleepMin: 6.5, stressMin: 6, loadMax: 25 }
        },
        WEIGHTS: { sleep: 0.3, stress: 0.3, load: 0.2, streak: 0.1, restRatio: 0.1 }
    },
    
    // Focus / Pomodoro
    POMODORO: {
        WORK: 25,
        SHORT_BREAK: 5,
        LONG_BREAK: 15,
        SESSIONS_BEFORE_LONG: 4
    },
    
    // Gamification
    GAMIFICATION: {
        WISDOM_PER_LEVEL: 100,
        STREAK_BONUS_THRESHOLD: 7,
        STREAK_MULTIPLIER: 2
    },
    
    // Rappels (minutes)
    REMINDERS: {
        water: 45,
        eyes: 20,
        stretch: 60,
        journalHour: 21
    },
    
    // Quiet hours
    QUIET_HOURS: { start: 23, end: 7 }
};
