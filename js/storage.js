// ==================== STATE MANAGER ====================
const StateManager = {
    _state: null,
    _listeners: [],
    _charts: { main: null, radar: null, trend: null },
    
    init() {
        this._state = this._loadFromStorage();
        this._migrateIfNeeded();
        return this._state;
    },
    
    _loadFromStorage() {
        try {
            let data = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (data) return JSON.parse(data);
            
            data = localStorage.getItem('sf_ultimate_pro');
            if (data) {
                const parsed = JSON.parse(data);
                parsed.version = 1;
                return parsed;
            }
        } catch (e) {
            console.error('Erreur chargement localStorage:', e);
            this._backup();
        }
        return this._getDefaultState();
    },
    
    _getDefaultState() {
        return {
            schemaVersion: 1,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            appVersion: CONFIG.VERSION,
            timetable: {},
            logs: [],
            gamification: { level: 1, wisdom: 0, streak: 0, lastEntry: null },
            focusSessions: [],
            goals: [],
            notes: [],
            templates: {},
            settings: { 
                sound: true, 
                theme: 'dark', 
                notifications: false,
                quietHours: true,
                slotDuration: 60
            },
            safeMode: { active: false, score: 0, dismissedAt: null, reasons: [] }
        };
    },
    
    _migrateIfNeeded() {
        const currentSchema = this._state.schemaVersion || 0;
        
        if (currentSchema < 1) {
            console.log('[Migration] Schema 0 → 1');
            
            if (!this._state.schemaVersion) this._state.schemaVersion = 1;
            if (!this._state.createdAt) this._state.createdAt = new Date().toISOString();
            if (!this._state.lastModified) this._state.lastModified = new Date().toISOString();
            if (!this._state.appVersion) this._state.appVersion = CONFIG.VERSION;
            
            if (!this._state.templates) this._state.templates = {};
            if (!this._state.safeMode) this._state.safeMode = { active: false, score: 0, dismissedAt: null, reasons: [] };
            if (!this._state.settings) this._state.settings = {};
            if (this._state.settings.quietHours === undefined) this._state.settings.quietHours = true;
            if (!this._state.settings.slotDuration) this._state.settings.slotDuration = 60;
            
            if (this._state.notes) {
                this._state.notes = this._state.notes.map(n => ({
                    ...n,
                    id: n.id || this._generateId(),
                    category: n.category || '📚'
                }));
            }
            
            if (this._state.timetable) {
                const newTimetable = {};
                Object.entries(this._state.timetable).forEach(([key, slot]) => {
                    newTimetable[key] = {
                        ...slot,
                        id: slot.id || this._generateId(),
                        createdAt: slot.createdAt || new Date().toISOString()
                    };
                });
                this._state.timetable = newTimetable;
            }
            
            delete this._state.version;
        }
        
        this._state.schemaVersion = 1;
        this._state.appVersion = CONFIG.VERSION;
        this.save();
    },
    
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    _backup() {
        const backup = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (backup) {
            localStorage.setItem(CONFIG.STORAGE_KEY + '_backup_' + Date.now(), backup);
        }
    },
    
    get(path) {
        if (!path) return this._state;
        return path.split('.').reduce((obj, key) => obj?.[key], this._state);
    },
    
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this._state);
        target[lastKey] = value;
        this.save();
        this._notify(path);
    },
    
    update(partial) {
        Object.assign(this._state, partial);
        this.save();
        this._notify('*');
    },
    
    save() {
        try {
            this._state.lastModified = new Date().toISOString();
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this._state));
        } catch (e) {
            console.error('Erreur sauvegarde:', e);
            if (typeof showToast === 'function') showToast('⚠️ Erreur de sauvegarde');
        }
    },
    
    subscribe(callback) {
        this._listeners.push(callback);
        return () => this._listeners = this._listeners.filter(l => l !== callback);
    },
    
    _notify(path) {
        this._listeners.forEach(l => l(path, this._state));
    },
    
    setChart(name, instance) { this._charts[name] = instance; },
    getChart(name) { return this._charts[name]; },
    destroyChart(name) {
        if (this._charts[name]) {
            this._charts[name].destroy();
            this._charts[name] = null;
        }
    }
};

// ==================== HELPERS ====================
const Helpers = {
    genId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    today: () => new Date().toISOString().slice(0, 10),
    dayName: (date = new Date()) => CONFIG.DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1],
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    getWeeklyLoad() {
        const timetable = StateManager.get('timetable');
        return Object.values(timetable).filter(s => s.type !== 'repos').length;
    },
    
    getRestRatio() {
        const timetable = StateManager.get('timetable');
        const total = Object.keys(timetable).length;
        if (total === 0) return 0;
        const rest = Object.values(timetable).filter(s => s.type === 'repos').length;
        return rest / total;
    },
    
    getRecentStats(days = 7) {
        const logs = StateManager.get('logs');
        const recent = logs.slice(-days);
        if (recent.length === 0) return { avgStress: 5, avgSleep: 7, count: 0 };
        
        return {
            avgStress: recent.reduce((a, b) => a + b.stress, 0) / recent.length,
            avgSleep: recent.reduce((a, b) => a + b.sleep, 0) / recent.length,
            count: recent.length
        };
    },
    
    isQuietHours() {
        if (!StateManager.get('settings.quietHours')) return false;
        const hour = new Date().getHours();
        const { start, end } = CONFIG.QUIET_HOURS;
        return hour >= start || hour < end;
    }
};

// Shortcut function
function save() { 
    StateManager.update(db);
}
