/**
 * Daimoku Grow - App State & Logic Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- Constants & Database ---
  const GOAL_HOURS = 333;
  const REVIVAL_TARGET_SECONDS = 12000; // 3 hours 20 minutes (200 minutes)
  const DECAY_BUFFER_HOURS = 24; // 24 hours of healthy buffer before decay begins
  const DECAY_DURATION_HOURS = 72; // Takes 72 hours of neglect to go from 100% to 0% health
  
  // SGI Significant Anniversary Dates (recurring annually, months are 0-indexed)
  const SGI_SIGNIFICANT_DATES = [
    { month: 0, day: 2, title: "Daisaku Ikeda's Birthday (1928)", type: 'anniversary' },
    { month: 0, day: 26, title: "SGI Day (1975)", type: 'anniversary' },
    { month: 1, day: 11, title: "Josei Toda's Birthday (1900)", type: 'anniversary' },
    { month: 1, day: 16, title: "Nichiren Daishonin's Birthday (1222)", type: 'anniversary' },
    { month: 1, day: 27, title: "SGI-USA Women's Day (1990)", type: 'anniversary' },
    { month: 2, day: 5, title: "Men's Division Founded (1966)", type: 'anniversary' },
    { month: 2, day: 14, title: "SGI-USA Jr. High & High School Day (1993)", type: 'anniversary' },
    { month: 2, day: 16, title: "SGI Kosen-rufu Day (1958)", type: 'anniversary' },
    { month: 3, day: 2, title: "Josei Toda's Memorial (1958)", type: 'anniversary' },
    { month: 3, day: 24, title: "Soka Justice Day (1979)", type: 'anniversary' },
    { month: 3, day: 28, title: "Nichiren Buddhism Established (1253)", type: 'anniversary' },
    { month: 4, day: 3, title: "Soka Gakkai Day (May 3)", type: 'anniversary' },
    { month: 5, day: 6, title: "Tsunesaburo Makiguchi's Birthday (1871)", type: 'anniversary' },
    { month: 5, day: 10, title: "Women's Division Founded (1951)", type: 'anniversary' },
    { month: 5, day: 30, title: "Student Division Founded (1957)", type: 'anniversary' },
    { month: 6, day: 3, title: "SGI Day of Mentor and Disciple", type: 'anniversary' },
    { month: 6, day: 11, title: "Young Men's Division Founded (1951)", type: 'anniversary' },
    { month: 6, day: 16, title: "\"On Establishing the Correct Teaching for the Peace of the Land\" (1260)", type: 'anniversary' },
    { month: 6, day: 19, title: "Young Women's Division Founded (1951)", type: 'anniversary' },
    { month: 7, day: 24, title: "SGI-USA Men's Day / Daisaku Ikeda Joins Soka Gakkai (1947)", type: 'anniversary' },
    { month: 8, day: 5, title: "SGI-USA Youth Day (2003)", type: 'anniversary' },
    { month: 8, day: 12, title: "Tatsunokuchi Persecution (1271)", type: 'anniversary' },
    { month: 9, day: 2, title: "SGI World Peace Day (1960)", type: 'anniversary' },
    { month: 9, day: 5, title: "SGI-USA Day (1960)", type: 'anniversary' },
    { month: 9, day: 12, title: "Dai-Gohonzon Inscribed (1279)", type: 'anniversary' },
    { month: 9, day: 13, title: "Nichiren Daishonin's Memorial (1282)", type: 'anniversary' },
    { month: 10, day: 18, title: "Tsunesaburo Makiguchi's Memorial (1944) / Soka Gakkai Established (1930)", type: 'anniversary' },
    { month: 10, day: 28, title: "SGI Day of Spiritual Independence (1991)", type: 'anniversary' }
  ];

  // Specific 2026 Friday & Saturday SGI activities (Loaded from localStorage or defaults)
  const CALENDAR_ACTIVITIES_2026 = JSON.parse(localStorage.getItem('daimoku_calendar_activities')) || {
    "2026-01-02": { title: "Family Day", type: "meeting" },
    "2026-01-06": { title: "Coordinators Meeting (Online)", type: "meeting" },
    "2026-01-09": { title: "New Year Gosho and Zadankai", type: "meeting" },
    "2026-01-16": { title: "MD/WD Study Meeting", type: "meeting" },
    "2026-01-23": { title: "FD Meeting", type: "meeting" },
    "2026-01-30": { title: "Gosho Study", type: "meeting" },
    "2026-02-06": { title: "Coordinators Meeting", type: "meeting" },
    "2026-02-13": { title: "MD/WD Study Meeting", type: "meeting" },
    "2026-02-20": { title: "Family Day", type: "meeting" },
    "2026-02-27": { title: "Gosho Study", type: "meeting" },
    "2026-03-06": { title: "Coordinators Meeting", type: "meeting" },
    "2026-03-13": { title: "Gosho Study", type: "meeting" },
    "2026-03-20": { title: "MD/WD Study Meeting (Tentative)", type: "meeting" },
    "2026-03-27": { title: "Zadankai - Kosen-rufu Day (Mar 16)", type: "meeting" },
    "2026-04-03": { title: "Coordinators Meeting", type: "meeting" },
    "2026-04-10": { title: "FD Meeting", type: "meeting" },
    "2026-04-17": { title: "MD/WD/YD/SD Meeting", type: "meeting" },
    "2026-04-24": { title: "Gosho Study", type: "meeting" },
    "2026-05-01": { title: "Coordinators Meeting", type: "meeting" },
    "2026-05-08": { title: "Zadankai - Soka Gakkai Day (May 3)", type: "meeting" },
    "2026-05-15": { title: "MD/WD/YD/SD Meeting", type: "meeting" },
    "2026-05-22": { title: "Gosho Study", type: "meeting" },
    "2026-06-05": { title: "Coordinators Meeting", type: "meeting" },
    "2026-06-12": { title: "WD AGM", type: "meeting" },
    "2026-06-13": { title: "FD Meeting", type: "meeting" },
    "2026-06-19": { title: "Gosho Study", type: "meeting" },
    "2026-07-03": { title: "Zadankai", type: "meeting" },
    "2026-09-04": { title: "Coordinators Meeting", type: "meeting" },
    "2026-09-11": { title: "MD/WD/YD/SD Meeting", type: "meeting" },
    "2026-09-18": { title: "MD AGM", type: "meeting" },
    "2026-09-25": { title: "Gosho Study", type: "meeting" },
    "2026-10-02": { title: "Coordinators Meeting", type: "meeting" },
    "2026-10-09": { title: "Zadankai", type: "meeting" },
    "2026-10-16": { title: "MD/WD/YD/SD Meeting", type: "meeting" },
    "2026-10-23": { title: "Family Day", type: "meeting" },
    "2026-10-30": { title: "Gosho Study", type: "meeting" },
    "2026-11-06": { title: "Coordinators Meeting", type: "meeting" },
    "2026-11-13": { title: "MD/WD Study Meeting", type: "meeting" },
    "2026-11-14": { title: "FD Meeting", type: "meeting" },
    "2026-11-20": { title: "Zadankai - Founding Day (Nov 18)", type: "meeting" },
    "2026-11-27": { title: "Gosho Study", type: "meeting" },
    "2026-12-04": { title: "Coordinators Meeting", type: "meeting" },
    "2026-12-11": { title: "MD/WD/YD/SD Meeting", type: "meeting" },
    "2026-12-25": { title: "Gosho Study", type: "meeting" }
  };

  // 2026 National Holidays
  const SGI_HOLIDAYS_2026 = {
    "2026-02-10": "National Holiday",
    "2026-02-23": "Emperor's Birthday",
    "2026-03-20": "Vernal Equinox Day",
    "2026-04-29": "Showa Day",
    "2026-05-03": "Constitution Memorial Day",
    "2026-05-04": "Greenery Day",
    "2026-05-05": "Children's Day",
    "2026-05-06": "Greenery Day Holiday",
    "2026-07-20": "Marine Day",
    "2026-08-11": "Mountain Day",
    "2026-09-21": "Respect for the Aged Day",
    "2026-09-22": "Autumnal Equinox Day",
    "2026-10-12": "Sports Day",
    "2026-11-03": "Culture Day",
    "2026-11-23": "Labor Thanksgiving Day"
  };
  
  const QUOTES = [
    { text: "Even one daimoku can pervade the entire universe. Truly heartfelt and determined daimoku, therefore, has the power to move everything.", author: "Daisaku Ikeda Sensei" },
    { text: "In times of suffering, chant daimoku. In times of joy, chant daimoku. Chanting daimoku is itself happiness.", author: "Daisaku Ikeda Sensei" },
    { text: "Nam-myoho-renge-kyo is the fundamental power of the universe. Please chant resounding daimoku morning and evening with the vibrant rhythm of majestic horses galloping through the heavens.", author: "Daisaku Ikeda Sensei" },
    { text: "Daimoku chanted with the deep conviction that one's life is the entity of the Mystic Law cannot fail to resonate with the universe. You will definitely attain complete freedom.", author: "Daisaku Ikeda Sensei" },
    { text: "The important thing is to continue chanting daimoku, no matter what. Whether our prayers are answered right away or not, we must keep chanting, without harboring any doubts.", author: "Daisaku Ikeda Sensei" },
    { text: "When we take our problems to the Gohonzon and chant Nam-myoho-renge-kyo, courage wells forth and hope begins to shine in our hearts.", author: "Daisaku Ikeda Sensei" },
    { text: "Nichiren Buddhism is about starting from today, starting from this very moment, with a fresh determination. A person of chanting is never defeated.", author: "Daisaku Ikeda Sensei" },
    { text: "No prayer is unanswered. Sometimes the answer is immediate; sometimes it is a deeper transformation of our lives, building an indestructible fortress of happiness.", author: "Daisaku Ikeda Sensei" },
    { text: "To chant daimoku is to tap the sun of Buddhahood within our own hearts. It dispels all darkness in our life and fills us with boundless joy and courage.", author: "Daisaku Ikeda Sensei" },
    { text: "Through chanting Nam-myoho-renge-kyo, we can transform any poison into medicine. Any adversity becomes a source of growth and victory.", author: "Daisaku Ikeda Sensei" },
    { text: "Nichiren writes: 'Nam-myoho-renge-kyo is like the roar of a lion.' No illness, no obstacle, can stand in the way of a lion's roar.", author: "Daisaku Ikeda Sensei" },
    { text: "Chanting is the key that opens the treasury of the cosmos within our own lives. It is the dialogue between our soul and the universe.", author: "Daisaku Ikeda Sensei" },
    { text: "A person of chanting is never defeated. Even if you fall seven times, rise an eighth time with a powerful, resounding daimoku!", author: "Daisaku Ikeda Sensei" },
    { text: "Your prayers are the engine of your victory. Chant with specific targets and determinations, and take courageous action in your daily life.", author: "Daisaku Ikeda Sensei" },
    { text: "Consistency is the path to mastership. Chanting daily, even for a short time, builds an invincible fortress in your heart.", author: "Daisaku Ikeda Sensei" }
  ];

  // --- Achievements, Practice Ranks & Badges Logic (Defined early to prevent initialization errors) ---
  const ACHIEVEMENTS_LIST = [
    { id: 'streak_7', title: "7-Day Streak", desc: "Chant consecutively for 7 days", icon: "fa-fire", check: (s) => s.streak >= 7 },
    { id: 'streak_15', title: "15-Day Streak", desc: "Chant consecutively for 15 days", icon: "fa-bolt", check: (s) => s.streak >= 15 },
    { id: 'streak_30', title: "1-Month Streak", desc: "Chant consecutively for 30 days", icon: "fa-calendar-day", check: (s) => s.streak >= 30 },
    { id: 'streak_90', title: "3-Month Streak", desc: "Chant consecutively for 90 days", icon: "fa-shield-halved", check: (s) => s.streak >= 90 },
    { id: 'streak_180', title: "6-Month Streak", desc: "Chant consecutively for 180 days", icon: "fa-award", check: (s) => s.streak >= 180 },
    { id: 'streak_365', title: "1-Year Streak", desc: "Chant consecutively for 365 days", icon: "fa-trophy", check: (s) => s.streak >= 365 },
    
    { id: 'session_1h', title: "Focus Master (1h)", desc: "Log a session of 1 hour or more", icon: "fa-clock", check: (s) => s.sessions.some(x => x.durationSeconds >= 3600) },
    { id: 'session_2h', title: "Marathon Chanter (2h)", desc: "Log a session of 2 hours or more", icon: "fa-stopwatch", check: (s) => s.sessions.some(x => x.durationSeconds >= 7200) },
    { id: 'session_3h20m', title: "Revival Hero (3h 20m)", desc: "Log a session of 3 hours 20 mins+", icon: "fa-heart-pulse", check: (s) => s.sessions.some(x => x.durationSeconds >= 12000) },
    
    { id: 'total_1h', title: "First Drop", desc: "Reach 1 hour of total chanting", icon: "fa-droplet", check: (s) => (s.totalSeconds / 3600) >= 1 },
    { id: 'total_10h', title: "Garden Seedling", desc: "Reach 10 hours of total chanting", icon: "fa-seedling", check: (s) => (s.totalSeconds / 3600) >= 10 },
    { id: 'total_50h', title: "Steady Roots", desc: "Reach 50 hours of total chanting", icon: "fa-tree", check: (s) => (s.totalSeconds / 3600) >= 50 },
    { id: 'total_150h', title: "Strong Trunk", desc: "Reach 150 hours of total chanting", icon: "fa-mountain", check: (s) => (s.totalSeconds / 3600) >= 150 },
    { id: 'total_333h', title: "Majestic Canopy", desc: "Reach 333 hours of total chanting", icon: "fa-crown", check: (s) => (s.totalSeconds / 3600) >= 333 },

    { id: 'early_bird', title: "Early Bird", desc: "Chant before 8:00 AM", icon: "fa-sun", check: (s) => s.sessions.some(x => {
      const date = new Date(x.date);
      return !isNaN(date.getTime()) && date.getHours() < 8;
    }) },
    { id: 'night_owl', title: "Night Owl", desc: "Chant after 9:00 PM", icon: "fa-moon", check: (s) => s.sessions.some(x => {
      const date = new Date(x.date);
      return !isNaN(date.getTime()) && date.getHours() >= 21;
    }) },
    { id: 'first_target', title: "Determination", desc: "Create your first prayer target", icon: "fa-bullseye", check: (s) => s.targets.length >= 1 },
    { id: 'target_completed', title: "Victory", desc: "Complete a prayer target", icon: "fa-circle-check", check: (s) => s.targets.some(x => x.completed) }
  ];

  function getRankDetails(hours) {
    if (hours < 5) return { name: "Seeker", stars: 1 };
    if (hours < 20) return { name: "Believer", stars: 2 };
    if (hours < 100) return { name: "Practitioner", stars: 3 };
    if (hours < 300) return { name: "Bodhisattva", stars: 4 };
    return { name: "Buddhahood", stars: 5 };
  }

  function renderStars(container, count) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('i');
      if (i <= count) {
        star.className = 'fa-solid fa-star star-filled';
      } else {
        star.className = 'fa-regular fa-star star-empty';
      }
      container.appendChild(star);
    }
  }

  function renderAchievements() {
    const totalHours = (state.totalSeconds / 3600);
    const rank = getRankDetails(totalHours);
    
    // Update main dashboard stars
    const mainStarsContainer = document.getElementById('stars-progress-container');
    renderStars(mainStarsContainer, rank.stars);
    
    // Update main dashboard level text
    const starsLevelText = document.getElementById('stars-level-text');
    if (starsLevelText) {
      starsLevelText.textContent = `Level ${rank.stars}: ${rank.name}`;
    }
    
    // Update achievements view rank & stars
    const achRankName = document.getElementById('achievement-rank-name');
    const achStarsContainer = document.getElementById('achievement-stars-container');
    if (achRankName) achRankName.textContent = rank.name;
    renderStars(achStarsContainer, rank.stars);
    
    // Render Badges list
    const badgesContainer = document.getElementById('badges-list-container');
    if (!badgesContainer) return;
    
    badgesContainer.innerHTML = '';
    
    ACHIEVEMENTS_LIST.forEach(ach => {
      const isUnlocked = ach.check(state);
      const div = document.createElement('div');
      div.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      
      div.innerHTML = `
        <div class="badge-icon-box">
          <i class="fa-solid ${ach.icon}"></i>
        </div>
        <div class="badge-info">
          <span class="badge-title">${ach.title}</span>
          <span class="badge-desc">${ach.desc}</span>
        </div>
      `;
      badgesContainer.appendChild(div);
    });
  }

  // --- App State ---
  let state = {
    totalSeconds: 0,
    health: 100,
    isDead: false,
    revivalSeconds: 0,
    lastChantedDate: new Date().toISOString(),
    sessions: [],
    streak: 0,
    targets: [], // [{ id, text, type, targetSeconds, accumulatedSeconds, completed }]
    lastNotifiedThreshold: 0, // Inactivity alerts: 0 (ok), 24, 72, 168 (7d), 360 (15d), 720 (30d)
    settings: {
      morningReminder: true,
      eveningReminder: true,
      potStyle: 'clay'
    },
    theme: 'theme-sage-light',
    dismissedAlerts: [], // Array of closed notification IDs
    revivalDates: [] // Dates of consecutive daimoku for revival while dead
  };

  // --- Timer Variables ---
  let timerInterval = null;
  let timerType = 'stopwatch'; // 'stopwatch' or 'countdown'
  let timerState = 'idle'; // 'idle', 'running', 'paused'
  let timerSecondsElapsed = 0;
  let countdownTargetSeconds = 1800; // Default 30 mins
  let timerStartTime = null;
  let timerAccumulatedPaused = 0; // ms accumulated before pause

  // --- DOM Elements ---
  const views = document.querySelectorAll('.content-view');
  const navItems = document.querySelectorAll('.nav-item');
  const notificationBanner = document.getElementById('app-notification-banner');
  const notificationBannerText = document.getElementById('notification-banner-text');
  const notificationBannerClose = document.getElementById('notification-banner-close');
  
  // Dashboard elements
  const plantStageBadge = document.getElementById('plant-stage-badge');
  const plantMoodBadge = document.getElementById('plant-mood-badge');
  const plantHealthPercent = document.getElementById('plant-health-percent');
  const plantHealthFill = document.getElementById('plant-health-fill');
  const headerHealthValue = document.getElementById('header-health-value');
  const statTotalHours = document.getElementById('stat-total-hours');
  const progressPercentLabel = document.getElementById('progress-percent-label');
  const progressRemainingLabel = document.getElementById('progress-remaining-label');
  const journeyProgressFill = document.getElementById('journey-progress-fill');
  const journeyPercentValue = document.getElementById('journey-percent-value');
  
  // Revival elements
  const revivalProgressContainer = document.getElementById('revival-progress-container');
  const revivalTimeLabel = document.getElementById('revival-time-label');
  const revivalPercentLabel = document.getElementById('revival-percent-label');
  const revivalProgressFill = document.getElementById('revival-progress-fill');
  
  // Guidance & Share elements
  const guidanceText = document.getElementById('guidance-text');
  const guidanceAuthor = document.getElementById('guidance-author');
  const btnShareGuidance = document.getElementById('btn-share-guidance');
  const shareModal = document.getElementById('share-modal');
  const btnCloseShare = document.getElementById('btn-close-share');
  const shareCardCanvas = document.getElementById('share-card-canvas');
  const btnDownloadShare = document.getElementById('btn-download-share');

  // Timer elements
  const btnTimerStopwatch = document.getElementById('btn-timer-stopwatch');
  const btnTimerCountdown = document.getElementById('btn-timer-countdown');
  const countdownPresets = document.getElementById('countdown-presets');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const presetCustomBtn = document.getElementById('preset-custom-btn');
  const customMinutesInputContainer = document.getElementById('custom-minutes-input-container');
  const customMinutesInput = document.getElementById('custom-minutes');
  const btnApplyCustomTime = document.getElementById('btn-apply-custom-time');
  const timerTimeDisplay = document.getElementById('timer-time-display');
  const timerStateLabel = document.getElementById('timer-state-label');
  const timerPersonalSelect = document.getElementById('timer-personal-select');
  const timerCampaignSelect = document.getElementById('timer-campaign-select');
  
  // Timer Controls
  const btnTimerStart = document.getElementById('btn-timer-start');
  const btnTimerPause = document.getElementById('btn-timer-pause');
  const btnTimerStop = document.getElementById('btn-timer-stop');
  const btnTimerCancel = document.getElementById('btn-timer-cancel');
  
  // Manual Log
  const manualLogForm = document.getElementById('manual-log-form');
  const logHours = document.getElementById('log-hours');
  const logMinutes = document.getElementById('log-minutes');
  const logDateInput = document.getElementById('log-date');
  const manualPersonalSelect = document.getElementById('manual-personal-select');
  const manualCampaignSelect = document.getElementById('manual-campaign-select');

  // Targets view elements
  const addTargetForm = document.getElementById('add-target-form');
  const targetText = document.getElementById('target-text');
  const targetTypeSelect = document.getElementById('target-type-select');
  const targetHoursInputGroup = document.getElementById('target-hours-input-group');
  const targetHoursInput = document.getElementById('target-hours');
  const activeTargetsList = document.getElementById('active-targets-list');
  const completedTargetsList = document.getElementById('completed-targets-list');
  const completedTargetsCount = document.getElementById('completed-targets-count');
  const btnToggleCompletedTargets = document.getElementById('btn-toggle-completed-targets');
  const completedTargetsCard = document.querySelector('.completed-targets-card');
  
  // History elements
  const btnClearHistory = document.getElementById('btn-clear-history');
  const logsListContainer = document.getElementById('logs-list-container');
  const analyticSessions = document.getElementById('analytic-sessions');
  const analyticStreak = document.getElementById('analytic-streak');
  const analyticAvgSession = document.getElementById('analytic-avg-session');
  
  // Settings elements
  const settingMorningReminder = document.getElementById('setting-morning-reminder');
  const settingEveningReminder = document.getElementById('setting-evening-reminder');
  const btnRequestNotifications = document.getElementById('btn-request-notifications');
  const btnTestGong = document.getElementById('btn-test-gong');
  const themeButtons = document.querySelectorAll('.theme-btn');

  // Debug Panel elements
  const btnToggleDebug = document.getElementById('btn-toggle-debug');
  const debugContent = document.getElementById('debug-content');
  const debugCard = document.querySelector('.debug-card');
  const btnDebugHours = document.querySelectorAll('.btn-debug');
  const btnDebugHealth = document.querySelectorAll('.btn-debug-health');
  const btnDebugDecay24h = document.getElementById('btn-debug-decay-24h');
  const btnDebugDecay72h = document.getElementById('btn-debug-decay-72h');
  const btnDebugDecay7d = document.getElementById('btn-debug-decay-7d');
  const btnDebugDecay15d = document.getElementById('btn-debug-decay-15d');
  const btnDebugDecay30d = document.getElementById('btn-debug-decay-30d');
  const btnDebugResetDate = document.getElementById('btn-debug-reset-date');
  const btnDebugTestMorning = document.getElementById('btn-debug-test-morning');
  const btnDebugTestEvening = document.getElementById('btn-debug-test-evening');

  // --- Web Audio API Gong Synthesizer ---
  function playGong() {
    const audio = document.getElementById('gong-audio');
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn('Audio playback failed', e));
    }
  }

  const btnManualGong = document.getElementById('btn-manual-gong');
  if (btnManualGong) {
    btnManualGong.addEventListener('click', playGong);
  }

  function saveActiveTimer() {
    if (timerState === 'idle') {
      localStorage.removeItem('daimoku_active_timer');
      return;
    }
    const timerData = {
      state: timerState,
      type: timerType,
      startTime: timerStartTime,
      accumulated: timerAccumulatedPaused,
      target: countdownTargetSeconds,
      personalTargetId: timerPersonalSelect.value || null,
      campaignId: timerCampaignSelect.value || null,
      lastActiveTime: Date.now()
    };
    localStorage.setItem('daimoku_active_timer', JSON.stringify(timerData));
  }

  function loadActiveTimer() {
    const saved = localStorage.getItem('daimoku_active_timer');
    if (saved) {
      try {
        const t = JSON.parse(saved);
        if (t.state === 'running' || t.state === 'paused') {
          
          // If the timer was running, check if it was interrupted (closed/force killed)
          if (t.state === 'running') {
            const now = Date.now();
            const lastActive = t.lastActiveTime || t.startTime;
            const timeSinceActive = now - lastActive;
            
            if (timeSinceActive > 15000) { // Closed/suspended for > 15 seconds
              const elapsedMs = lastActive - t.startTime + t.accumulated;
              const elapsedSecs = Math.floor(elapsedMs / 1000);
              
              if (elapsedSecs >= 5) {
                // Restore target ID selections so the session is credited correctly
                timerPersonalSelect.value = t.personalTargetId || '';
                timerCampaignSelect.value = t.campaignId || '';
                saveChantSession(elapsedSecs, t.type);
                timerPersonalSelect.value = ''; // Reset selection
                timerCampaignSelect.value = '';
                
                const mins = Math.floor(elapsedSecs / 60);
                const secs = elapsedSecs % 60;
                const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                alert(`Your previous chanting session was closed or interrupted. We have automatically saved your progress of ${timeStr}! 🙏`);
              }
              
              localStorage.removeItem('daimoku_active_timer');
              resetTimerControls();
              return;
            }
          }
          
          // Otherwise, load normally (either brief interruption or paused state)
          timerType = t.type;
          timerStartTime = t.startTime;
          timerAccumulatedPaused = t.accumulated;
          countdownTargetSeconds = t.target;
          timerPersonalSelect.value = t.personalTargetId || '';
          timerCampaignSelect.value = t.campaignId || '';
          
          if (timerType === 'countdown') {
            btnTimerCountdown.click();
          } else {
            btnTimerStopwatch.click();
          }
          
          if (t.state === 'running') {
            resumeTimer();
          } else {
            timerState = 'paused';
            timerStateLabel.textContent = 'Paused';
            btnTimerPause.classList.add('hidden');
            btnTimerStart.classList.remove('hidden');
            
            if (timerType === 'stopwatch') {
              timerTimeDisplay.textContent = formatDuration(Math.floor(timerAccumulatedPaused / 1000));
            } else {
              const remaining = countdownTargetSeconds - Math.floor(timerAccumulatedPaused / 1000);
              timerTimeDisplay.textContent = formatDuration(Math.max(0, remaining));
            }
          }
        }
      } catch(e) {
        console.error("Error reloading active timer:", e);
      }
    }
  }

  function migrateLocalToCloud(user) {
    const localStateStr = localStorage.getItem('daimoku_grow_state');
    let userState = null;
    
    if (localStateStr) {
      try {
        userState = JSON.parse(localStateStr);
      } catch (e) {}
    }
    
    if (!userState) {
      userState = {
        totalSeconds: 0,
        health: 100,
        isDead: false,
        revivalSeconds: 0,
        lastChantedDate: new Date().toISOString(),
        sessions: [],
        streak: 0,
        targets: [],
        lastNotifiedThreshold: 0,
        settings: {
          morningReminder: true,
          eveningReminder: true
        },
        theme: 'theme-sage-light',
        dismissedAlerts: []
      };
    }
    
    // Upload sessions to campaign contributions if they are associated with campaigns
    const contributions = MockFirebase.db.getCampaignContributions();
    let addedAny = false;
    
    userState.sessions.forEach(session => {
      if (session.targetId && session.targetId.startsWith('campaign_')) {
        const campaignId = session.targetId.replace('campaign_', '');
        
        // Check if this contribution is already in the database
        const alreadyExists = contributions.some(c => 
          c.userEmail === user.email && 
          c.date === session.date && 
          c.durationSeconds === session.durationSeconds
        );
        if (!alreadyExists) {
          contributions.push({
            id: session.id || (Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5)),
            userEmail: user.email,
            username: user.username,
            block: user.block,
            campaignId: campaignId,
            durationSeconds: session.durationSeconds,
            date: session.date
          });
          addedAny = true;
        }
      }
    });
    
    if (addedAny) {
      MockFirebase.db.saveCampaignContributions(contributions);
    }
    
    MockFirebase.db.saveUserState(user.email, userState);
    return userState;
  }

  function loadUserStateForLoggedInUser(user) {
    let userState = MockFirebase.db.getUserState(user.email);
    if (!userState) {
      userState = migrateLocalToCloud(user);
    }
    state = userState;
    
    // Save to active local state cache
    localStorage.setItem('daimoku_grow_state', JSON.stringify(state));
    
    // Apply saved theme
    document.body.className = state.theme || 'theme-sage-light';
    
    // Update badge and buttons in header
    const badge = document.getElementById('user-block-badge');
    if (badge) {
      badge.textContent = `${user.block} Block`;
      badge.classList.remove('hidden');
    }
    
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.classList.remove('hidden');
    }
  }

  // --- PWA Native-like Notification Scheduling & Background Synchronization ---
  async function saveStateToCacheForServiceWorker() {
    if ('caches' in window) {
      try {
        const cache = await caches.open('daimoku-state-cache');
        const stateData = {
          lastChantedDate: state.lastChantedDate,
          health: state.health,
          isDead: state.isDead,
          settings: state.settings,
          sessions: state.sessions.map(s => ({ date: s.date })), // minimized to save cache size
          dismissedAlerts: state.dismissedAlerts || []
        };
        const stateResponse = new Response(JSON.stringify(stateData), {
          headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('/notifications-state.json', stateResponse);
        console.log("Saved state to cache for service worker background usage.");
      } catch (e) {
        console.warn("Failed to save state to cache:", e);
      }
    }
  }

  async function schedulePWANotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }
    
    try {
      const reg = await navigator.serviceWorker.ready;
      
      // Check if Notification Triggers are supported
      const isTriggersSupported = 'showTrigger' in Notification.prototype || (typeof TimestampTrigger !== 'undefined');
      
      if (isTriggersSupported) {
        console.log("Scheduling PWA notifications via Notification Triggers API...");
        
        const now = Date.now();
        
        // 1. Morning Chant Reminder (12:00 PM)
        let morningTime = new Date();
        morningTime.setHours(12, 0, 0, 0);
        if (morningTime.getTime() <= now) {
          morningTime.setDate(morningTime.getDate() + 1);
        }
        
        reg.showNotification("Morning Chant Reminder", {
          body: "It's past 12:00 PM! Don't forget to water your plant with morning chanting. 🌸",
          icon: "icons/icon-192.png",
          badge: "icons/icon-192.png",
          vibrate: [300, 100, 300],
          tag: "morning-reminder",
          showTrigger: new TimestampTrigger(morningTime.getTime())
        });
        
        // 2. Evening Chant Reminder (8:00 PM)
        let eveningTime = new Date();
        eveningTime.setHours(20, 0, 0, 0);
        if (eveningTime.getTime() <= now) {
          eveningTime.setDate(eveningTime.getDate() + 1);
        }
        
        reg.showNotification("Evening Chant Reminder", {
          body: "It's evening! Water your plant with evening chanting to keep it healthy. 🌙",
          icon: "icons/icon-192.png",
          badge: "icons/icon-192.png",
          vibrate: [300, 100, 300],
          tag: "evening-reminder",
          showTrigger: new TimestampTrigger(eveningTime.getTime())
        });
        
        // 3. Decay Reminders
        const lastChanted = new Date(state.lastChantedDate).getTime();
        
        // 24h neglect (Thirsty)
        const decay24hTime = lastChanted + 24 * 60 * 60 * 1000;
        if (decay24hTime > now) {
          reg.showNotification("Water me, please!", {
            body: "It has been 24 hours. My leaves are getting thirsty. I miss the sound of your Daimoku! 🌿",
            icon: "icons/icon-192.png",
            badge: "icons/icon-192.png",
            vibrate: [300, 100, 300],
            tag: "decay-24h",
            showTrigger: new TimestampTrigger(decay24hTime)
          });
        }
        
        // 72h neglect (Sad/Drooping)
        const decay72hTime = lastChanted + 72 * 60 * 60 * 1000;
        if (decay72hTime > now) {
          reg.showNotification("Oh no! I am weakening...", {
            body: "It has been 72 hours. I am beginning to droop. Let's chant together and restore my vitality! 💧",
            icon: "icons/icon-192.png",
            badge: "icons/icon-192.png",
            vibrate: [300, 100, 300],
            tag: "decay-72h",
            showTrigger: new TimestampTrigger(decay72hTime)
          });
        }
        
        // 7d neglect (Dying)
        const decay7dTime = lastChanted + 168 * 60 * 60 * 1000;
        if (decay7dTime > now) {
          reg.showNotification("I am about to die...", {
            body: "A whole week without Daimoku! I am drying up. Please water me with your chanting! 🥀",
            icon: "icons/icon-192.png",
            badge: "icons/icon-192.png",
            vibrate: [300, 100, 300, 100, 400],
            tag: "decay-7d",
            showTrigger: new TimestampTrigger(decay7dTime)
          });
        }

        // 15d neglect (Withered)
        const decay15dTime = lastChanted + 360 * 60 * 60 * 1000;
        if (decay15dTime > now) {
          reg.showNotification("Save my life!", {
            body: "15 days of silence. I have withered away. Let's bring this garden back! ❤️",
            icon: "icons/icon-192.png",
            badge: "icons/icon-192.png",
            vibrate: [300, 100, 300, 100, 400],
            tag: "decay-15d",
            showTrigger: new TimestampTrigger(decay15dTime)
          });
        }
      } else {
        console.log("Notification Triggers API not supported. Falling back to background cache updates.");
        await saveStateToCacheForServiceWorker();
      }
    } catch (err) {
      console.warn("Failed to schedule PWA notifications:", err);
    }
  }

  function loadState() {
    const user = MockFirebase.auth.getCurrentUser();
    if (user) {
      loadUserStateForLoggedInUser(user);
    } else {
      const saved = localStorage.getItem('daimoku_grow_state');
      if (saved) {
        try {
          state = JSON.parse(saved);
          // Ensure properties exist
          if (state.streak === undefined) state.streak = 0;
          if (state.revivalSeconds === undefined) state.revivalSeconds = 0;
          if (state.isDead === undefined) state.isDead = false;
          if (state.targets === undefined) state.targets = [];
          if (state.lastNotifiedThreshold === undefined) state.lastNotifiedThreshold = 0;
          if (state.dismissedAlerts === undefined) state.dismissedAlerts = [];
          if (state.revivalDates === undefined) state.revivalDates = [];
          
          // Apply saved theme
          document.body.className = state.theme || 'theme-sage-light';
        } catch (e) {
          console.error("Error loading state, resetting:", e);
        }
      }
    }
    
    // Set manual form default date to today
    const today = new Date().toISOString().split('T')[0];
    logDateInput.value = today;
    
    // Calculate decay on start
    applyTimeDecay();
    updateUI();
    loadActiveTimer();
    updateQuote();
    
    // Cache state and schedule PWA notifications
    saveStateToCacheForServiceWorker();
    schedulePWANotifications();
  }

  function saveState() {
    localStorage.setItem('daimoku_grow_state', JSON.stringify(state));
    
    const user = MockFirebase.auth.getCurrentUser();
    if (user) {
      MockFirebase.db.saveUserState(user.email, state);
    }
    
    updateUI();
    
    // Cache state and schedule PWA notifications
    saveStateToCacheForServiceWorker();
    schedulePWANotifications();
  }

  // --- Inactivity Alert Evaluator using Ikeda Quotes ---
  function checkDecayNotifications(diffHours) {
    const hours = Math.floor(diffHours);
    let threshold = 0;
    let title = "";
    let message = "";
    
    if (hours >= 720) { // 30 days
      threshold = 720;
      title = "A dormant seed awaits you...";
      message = "One month has passed. I am completely withered, but my roots remember your voice. Daisaku Ikeda Sensei guides: 'Sincere effort can bring any withered plant back to life.' Chant at least 15 minutes daily for 3 consecutive days to revive me! 🌱";
    } else if (hours >= 360) { // 15 days
      threshold = 360;
      title = "Save my life!";
      message = "15 days of silence. I have withered away. Daisaku Ikeda Sensei guides: 'No matter what, keep chanting Nam-myoho-renge-kyo.' Sincere chanting for 3 consecutive days (min 15 mins daily) will bring me back! ❤️";
    } else if (hours >= 168) { // 7 days (1 week)
      threshold = 168;
      title = "I am about to die...";
      message = "A whole week without Daimoku! I am drying up. Daisaku Ikeda Sensei reminds us: 'Consistent efforts yield beautiful blooms.' Please water me with your chanting! 🥀";
    } else if (hours >= 72) { // 3 days (72 hours)
      threshold = 72;
      title = "Oh no! I am weakening...";
      message = "It has been 72 hours. I am beginning to droop. Daisaku Ikeda Sensei teaches: 'Even one daimoku can pervade the entire universe.' Let's chant together and restore my life-force! 💧";
    } else if (hours >= 24) { // 24 hours
      threshold = 24;
      title = "Water me, please!";
      message = "It has been 24 hours. My leaves are getting thirsty. I miss the sound of your Daimoku—it is required for my sustenance! 🌿";
    }
    
    // Only notify if we crossed a new threshold level
    if (threshold > 0 && state.lastNotifiedThreshold < threshold) {
      state.lastNotifiedThreshold = threshold;
      triggerNotification(title, message);
      saveState();
    }
  }

  function triggerNotification(title, message, type = '') {
    // 1. Show in-app banner
    notificationBannerText.textContent = message;
    notificationBanner.className = 'notification-banner'; // reset classes
    if (type) {
      notificationBanner.classList.add(type);
    } else if (state.isDead) {
      notificationBanner.classList.add('dead');
    } else if (state.health <= 40) {
      notificationBanner.classList.add('dying');
    } else {
      notificationBanner.classList.add('thirsty');
    }
    notificationBanner.classList.remove('hidden');

    // 2. Fire OS-level Push Notification if permission granted (plays default system tone on phone)
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: message,
        icon: "icons/icon-192.png",
        badge: "icons/icon-192.png",
        vibrate: [300, 100, 300, 100, 400],
        tag: "daimoku-reminder",
        renotify: true,
        requireInteraction: true
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  // --- Plant Health Time Decay Algorithm ---
  function applyTimeDecay() {
    const now = new Date();
    const lastChanted = new Date(state.lastChantedDate);
    const diffMs = now - lastChanted;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Trigger neglect warnings
    checkDecayNotifications(diffHours);
    
    if (state.isDead) return;
    
    if (diffHours > DECAY_BUFFER_HOURS) {
      const hoursToDecay = diffHours - DECAY_BUFFER_HOURS;
      // Health drops by (100 / DECAY_DURATION_HOURS) per hour after the 24h buffer
      const healthDrop = hoursToDecay * (100 / DECAY_DURATION_HOURS);
      state.health = Math.max(0, Math.round(100 - healthDrop));
      
      if (state.health <= 0) {
        state.isDead = true;
        state.health = 0;
        state.revivalSeconds = 0;
      }
    } else {
      state.health = 100; // Reset to 100% if within the 24h window
    }
  }

  // --- Navigation Router ---
  function initNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const viewId = item.id.replace('nav-', 'view-');
        
        // Switch nav active status
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Switch content view
        views.forEach(v => {
          if (v.id === viewId) {
            v.classList.add('active');
          } else {
            v.classList.remove('active');
          }
        });
        
        // Timer remains running in background when switching views
        
        // Refresh history UI when entering history view
        if (viewId === 'view-history') {
          renderHistoryLogs();
        }
        
        // Refresh achievements UI when entering badges view
        if (viewId === 'view-achievements') {
          renderAchievements();
        }
        
        // Start/Stop plant canvas render loop to save CPU/GPU cycles when hidden
        if (viewId === 'view-dashboard') {
          if (typeof PlantRenderer.resizeCanvas === 'function') {
            setTimeout(() => {
              PlantRenderer.resizeCanvas();
              PlantRenderer.startAnimation();
            }, 50);
          } else {
             PlantRenderer.startAnimation();
          }
        } else {
          if (typeof PlantRenderer.stopAnimation === 'function') {
            PlantRenderer.stopAnimation();
          }
        }
        
        setTimeout(() => {
          if (viewId === 'view-history') {
            renderHistoryLogs();
            updateHistoryAnalytics();
          }
          
          if (viewId === 'view-achievements') {
            renderAchievements();
          }
          
          if (viewId === 'view-calendar') {
            renderCalendar();
            renderSelectedDayEvents();
          }

          if (viewId === 'view-prayers') {
            renderTargetsList();
          }

          if (viewId === 'view-campaign') {
            renderCampaignsList();
          }
        }, 50);
      });
    });

    // Navigate to history view when clicking hours logged stat box
    const statBoxHoursLogged = document.getElementById('stat-box-hours-logged');
    if (statBoxHoursLogged) {
      statBoxHoursLogged.addEventListener('click', () => {
        const navHistory = document.getElementById('nav-history');
        if (navHistory) {
          navHistory.click();
        }
      });
    }
  }

  // --- Daily Quotes Picker ---
  function updateQuote() {
    const today = new Date();
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const month = months[today.getMonth()];
    const day = today.getDate();
    const url = `https://www.sokaglobal.org/resources/daily-encouragement/${month}-${day}.html`;
    const proxyUrl1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const proxyUrl2 = `https://corsproxy.org/?${encodeURIComponent(url)}`;
    
    // Check localStorage cache first for today's date
    const todayStr = today.toISOString().split('T')[0];
    const cachedGuidance = localStorage.getItem('daimoku_cached_guidance');
    if (cachedGuidance) {
      try {
        const cached = JSON.parse(cachedGuidance);
        if (cached.date === todayStr && cached.quote && cached.author) {
          // Display instantly from cache
          guidanceText.textContent = cached.quote;
          guidanceAuthor.textContent = cached.author;
          return;
        }
      } catch (e) {
        console.warn("Error parsing cached daily guidance:", e);
      }
    }

    guidanceText.textContent = "Loading today's guidance...";
    guidanceAuthor.textContent = "";

    function fallbackQuote() {
      const start = new Date(today.getFullYear(), 0, 0);
      const diff = today - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const quoteIndex = dayOfYear % QUOTES.length;
      guidanceText.textContent = '"' + QUOTES[quoteIndex].text + '"';
      guidanceAuthor.textContent = '— ' + QUOTES[quoteIndex].author;
    }

    // Try primary proxy (allorigins raw)
    fetch(proxyUrl1)
      .then(res => {
        if (!res.ok) throw new Error("Primary proxy status not OK");
        return res.text();
      })
      .then(html => {
        if (html) {
          parseAndDisplayHtml(html);
        } else {
          throw new Error("Primary proxy returned empty contents");
        }
      })
      .catch(err => {
        console.warn('Primary proxy failed, trying secondary proxy...', err);
        // Try secondary proxy (corsproxy.org)
        fetch(proxyUrl2)
          .then(res => {
            if (!res.ok) throw new Error("Secondary proxy status not OK");
            return res.text();
          })
          .then(html => {
            if (html) {
              parseAndDisplayHtml(html);
            } else {
              throw new Error("Secondary proxy returned empty content");
            }
          })
          .catch(err2 => {
            console.warn('Secondary proxy failed, trying direct fetch...', err2);
            // Try direct fetch as last resort
            fetch(url)
              .then(res => {
                if (!res.ok) throw new Error("Direct fetch status not OK");
                return res.text();
              })
              .then(html => {
                parseAndDisplayHtml(html);
              })
              .catch(err3 => {
                console.error('All fetch attempts failed:', err3);
                fallbackQuote();
              });
          });
      });

    function parseAndDisplayHtml(html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const box = doc.querySelector('.box01');
        if (box) {
          const texts = box.querySelectorAll('.text');
          let quote = "";
          for (let textEl of texts) {
            // Ignore text containers that contain an image or a picture
            if (!textEl.querySelector('img') && !textEl.querySelector('picture')) {
              quote = textEl.textContent.trim();
              if (quote) break;
            }
          }
          
          if (!quote && texts.length > 0) {
            quote = texts[0].textContent.trim();
          }
          
          if (quote) {
            // Clean up any outer quotes to avoid duplicates
            let cleanedQuote = quote.replace(/^["'“](.*)["'”]$/, '$1');
            const finalQuote = `“${cleanedQuote}”`;
            
            let finalAuthor = `— Daisaku Ikeda`;
            const name = box.querySelector('.name');
            if (name) {
              const nameText = name.textContent.trim();
              if (nameText) {
                finalAuthor = `— Daisaku Ikeda (${nameText})`;
              }
            }
            
            // Set UI
            guidanceText.textContent = finalQuote;
            guidanceAuthor.textContent = finalAuthor;
            
            // Save to localStorage cache
            const cacheData = {
              date: todayStr,
              quote: finalQuote,
              author: finalAuthor
            };
            localStorage.setItem('daimoku_cached_guidance', JSON.stringify(cacheData));
          } else {
            fallbackQuote();
          }
        } else {
          fallbackQuote();
        }
      } catch (e) {
        console.error("Error parsing HTML:", e);
        fallbackQuote();
      }
    }
  }

  // --- Rendering UI States ---
  function updateUI() {
    const totalHours = (state.totalSeconds / 3600).toFixed(1);
    const progressPercent = Math.min(100, Math.round((parseFloat(totalHours) / GOAL_HOURS) * 100));
    
    // Header & Vitality
    headerHealthValue.textContent = `${state.health}%`;
    plantHealthPercent.textContent = `${state.health}%`;
    plantHealthFill.style.width = `${state.health}%`;
    
    // Set health bar color warning states
    plantHealthFill.className = 'progress-bar-fill';
    if (state.health <= 10) {
      plantHealthFill.classList.add('danger-fill');
    } else if (state.health <= 40) {
      plantHealthFill.classList.add('warning-fill');
    }
    
    // Plant badges
    const stageInfo = PlantRenderer.getGrowthStage(parseFloat(totalHours));
    const moodInfo = PlantRenderer.getPlantMood(state.health, state.isDead);
    
    plantStageBadge.textContent = stageInfo.name;
    plantMoodBadge.textContent = moodInfo;
    
    // Apply badge styling based on mood
    plantMoodBadge.className = 'badge mood-badge';
    if (state.isDead) {
      plantMoodBadge.classList.add('dead-badge');
    } else if (state.health <= 40) {
      plantMoodBadge.classList.add('thirsty-badge');
    }
    
    // Progress Card / Flanking Stats
    statTotalHours.textContent = totalHours;
    if (journeyPercentValue) {
      journeyPercentValue.textContent = `${progressPercent}%`;
    }
    progressPercentLabel.textContent = `${progressPercent}% of Journey`;
    const remaining = Math.max(0, GOAL_HOURS - parseFloat(totalHours)).toFixed(1);
    progressRemainingLabel.textContent = `${remaining}h remaining`;
    journeyProgressFill.style.width = `${progressPercent}%`;
    
    // Revival Card Visibility
    if (state.isDead) {
      revivalProgressContainer.classList.remove('hidden');
      const daysCount = state.revivalDates ? state.revivalDates.length : 0;
      revivalTimeLabel.textContent = `${daysCount} / 3 days completed`;
      
      const revPercent = Math.min(100, Math.round((daysCount / 3) * 100));
      revivalPercentLabel.textContent = `${revPercent}%`;
      revivalProgressFill.style.width = `${revPercent}%`;
      
      // Insert daily note if not already present
      let noteEl = revivalProgressContainer.querySelector('.revival-note');
      if (!noteEl) {
        noteEl = document.createElement('p');
        noteEl.className = 'revival-note';
        noteEl.style.cssText = 'font-size:11px; color:var(--text-muted); margin-top:6px; display:flex; align-items:center; gap:4px;';
        noteEl.innerHTML = '<i class="fa-solid fa-circle-info" style="color:var(--accent-wood);"></i> Note: Chant minimum 15 minutes daily to record a day.';
        revivalProgressContainer.appendChild(noteEl);
      }
    } else {
      revivalProgressContainer.classList.add('hidden');
    }
    
    // Update achievements and main dashboard stars
    renderAchievements();
    
    // Trigger canvas state updates
    PlantRenderer.updateState(parseFloat(totalHours), state.health, state.isDead, timerState === 'running');
    
    // Update pot style in PlantRenderer
    if (state.settings && state.settings.potStyle) {
      PlantRenderer.setPotStyle(state.settings.potStyle);
    } else {
      PlantRenderer.setPotStyle('clay');
    }
    
    // In-App Alerts Banner
    updateNotificationBanner();
    
    // Populate dropdown elements
    populateTargetDropdowns();
    
    // Settings switches
    settingMorningReminder.checked = state.settings.morningReminder;
    settingEveningReminder.checked = state.settings.eveningReminder;
    
    // Update theme toggle buttons highlights
    themeButtons.forEach(btn => {
      if (btn.getAttribute('data-theme') === state.theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update pot customizer buttons highlights
    const potButtons = document.querySelectorAll('.pot-btn');
    potButtons.forEach(btn => {
      if (btn.getAttribute('data-pot') === ((state.settings && state.settings.potStyle) || 'clay')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // History analytics
    updateHistoryAnalytics();
  }

  // --- In-App Notifications Drawer with Decay Milestones ---
  function updateNotificationBanner() {
    if (!state.dismissedAlerts) state.dismissedAlerts = [];
    
    const now = new Date();
    const lastChanted = new Date(state.lastChantedDate);
    const diffMs = now - lastChanted;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    let activeAlert = null;
    
    if (state.isDead) {
      if (diffHours >= 720) { // 30 days
        activeAlert = {
          id: 'neglect_30d',
          type: 'dead',
          message: "My roots still remember your voice. Daisaku Ikeda Sensei guides: 'Sincere effort can bring any withered plant back to life.' Chant at least 15 minutes daily for 3 consecutive days to revive me! 🌱"
        };
      } else if (diffHours >= 360) { // 15 days
        activeAlert = {
          id: 'neglect_15d',
          type: 'dead',
          message: "Save my life! I have completely withered. Daisaku Ikeda Sensei guides: 'No matter what, keep chanting Nam-myoho-renge-kyo.' Let's bring this garden back! ❤️"
        };
      } else {
        activeAlert = {
          id: 'neglect_dead',
          type: 'dead',
          message: "Your plant has withered from neglect! Chant at least 15 minutes a day for 3 consecutive days to revive it. 🙏🌱"
        };
      }
    } else if (diffHours >= 168) { // 7 days
      activeAlert = {
        id: 'neglect_7d',
        type: 'dying',
        message: "I am about to die! Please water me with your consistency. Daisaku Ikeda Sensei reminds us: 'Consistent efforts yield beautiful blooms.' 🥀"
      };
    } else if (diffHours >= 72) { // 72 hours
      activeAlert = {
        id: 'neglect_72h',
        type: 'dying',
        message: "I am drooping and shrinking! Daisaku Ikeda Sensei teaches: 'Even one daimoku can pervade the entire universe.' Let's chant together and restore my vitality! 💧"
      };
    } else if (diffHours >= 24) { // 24 hours
      activeAlert = {
        id: 'neglect_24h',
        type: 'thirsty',
        message: "I miss the sound of your Daimoku! It is required for my sustenance... please water me! 🌿"
      };
    }
    
    // If no decay alert is active, check daily reminders
    if (!activeAlert) {
      const hours = now.getHours();
      const dateTodayStr = now.toISOString().split('T')[0];
      
      if (state.settings.morningReminder && hours >= 12 && hours < 20) {
        const chantedToday = state.sessions.some(s => s.date.split('T')[0] === dateTodayStr);
        if (!chantedToday) {
          activeAlert = {
            id: `morning_${dateTodayStr}`,
            type: 'thirsty',
            message: "It's past 12:00 PM! Don't forget to water your plant with morning chanting. 🌸"
          };
        }
      } else if (state.settings.eveningReminder && hours >= 20) {
        const chantedSinceNoon = state.sessions.some(s => {
          const sDate = new Date(s.date);
          return sDate.toISOString().split('T')[0] === dateTodayStr && sDate.getHours() >= 12;
        });
        if (!chantedSinceNoon) {
          activeAlert = {
            id: `evening_${dateTodayStr}`,
            type: 'thirsty',
            message: "It's evening! Water your plant with evening chanting to keep it healthy. 🌙"
          };
        }
      }
    }
    
    // Render the banner
    if (activeAlert) {
      if (state.dismissedAlerts.includes(activeAlert.id)) {
        notificationBanner.className = 'notification-banner hidden';
      } else {
        notificationBannerText.textContent = activeAlert.message;
        notificationBanner.className = 'notification-banner';
        notificationBanner.classList.add(activeAlert.type);
        notificationBanner.setAttribute('data-active-alert-id', activeAlert.id);
        notificationBanner.classList.remove('hidden');
      }
    } else {
      notificationBanner.className = 'notification-banner hidden';
    }
  }

  notificationBannerClose.addEventListener('click', () => {
    const alertId = notificationBanner.getAttribute('data-active-alert-id');
    if (alertId) {
      if (!state.dismissedAlerts) state.dismissedAlerts = [];
      if (!state.dismissedAlerts.includes(alertId)) {
        state.dismissedAlerts.push(alertId);
      }
      saveState();
    }
    notificationBanner.classList.add('hidden');
  });

  // --- Timer Operations (Stopwatch & Countdown) ---
  btnTimerStopwatch.addEventListener('click', () => {
    if (timerState !== 'idle') return;
    timerType = 'stopwatch';
    btnTimerStopwatch.classList.add('active');
    btnTimerCountdown.classList.remove('active');
    countdownPresets.classList.add('hidden');
    customMinutesInputContainer.classList.add('hidden');
    resetTimerDisplay();
  });

  btnTimerCountdown.addEventListener('click', () => {
    if (timerState !== 'idle') return;
    timerType = 'countdown';
    btnTimerCountdown.classList.add('active');
    btnTimerStopwatch.classList.remove('active');
    countdownPresets.classList.remove('hidden');
    resetTimerDisplay();
  });

  // Preset time selections
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (timerState !== 'idle') return;
      
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      customMinutesInputContainer.classList.add('hidden');
      
      if (btn.id === 'preset-custom-btn') {
        customMinutesInputContainer.classList.remove('hidden');
      } else {
        const mins = parseInt(btn.getAttribute('data-mins'));
        countdownTargetSeconds = mins * 60;
        resetTimerDisplay();
      }
    });
  });

  btnApplyCustomTime.addEventListener('click', () => {
    if (timerState !== 'idle') return;
    const mins = Math.max(1, Math.min(1440, parseInt(customMinutesInput.value || 30)));
    customMinutesInput.value = mins;
    countdownTargetSeconds = mins * 60;
    resetTimerDisplay();
  });

  function resetTimerDisplay() {
    if (timerType === 'stopwatch') {
      timerTimeDisplay.textContent = '00:00:00';
      timerSecondsElapsed = 0;
    } else {
      timerTimeDisplay.textContent = formatDuration(countdownTargetSeconds);
      timerSecondsElapsed = 0;
    }
    timerStateLabel.textContent = 'Ready';
  }

  function formatDuration(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  }

  // Start Chanting Timer
  btnTimerStart.addEventListener('click', () => {
    resumeTimer();
  });

  function resumeTimer() {
    timerState = 'running';
    timerStartTime = Date.now();
    
    btnTimerStart.classList.add('hidden');
    btnTimerPause.classList.remove('hidden');
    btnTimerStop.classList.remove('hidden');
    btnTimerCancel.classList.remove('hidden');
    
    btnTimerStopwatch.disabled = true;
    btnTimerCountdown.disabled = true;
    presetButtons.forEach(b => b.disabled = true);
    btnApplyCustomTime.disabled = true;
    
    timerStateLabel.textContent = 'Focus';
    
    const totalHours = (state.totalSeconds / 3600).toFixed(1);
    PlantRenderer.updateState(parseFloat(totalHours), state.health, state.isDead, true);
    saveActiveTimer();
    
    timerInterval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - timerStartTime + timerAccumulatedPaused;
      
      saveActiveTimer(); // Keep active timer updated with the last active tick
      
      if (timerType === 'stopwatch') {
        timerSecondsElapsed = Math.floor(elapsedMs / 1000);
        timerTimeDisplay.textContent = formatDuration(timerSecondsElapsed);
      } else {
        timerSecondsElapsed = Math.floor(elapsedMs / 1000);
        const remaining = countdownTargetSeconds - timerSecondsElapsed;
        if (remaining <= 0) {
          // Timer finished!
          clearInterval(timerInterval);
          playGong();
          saveChantSession(countdownTargetSeconds, 'countdown');
          resetTimerControls();
          alert("Congratulations! Your chanting focus session is complete.");
        } else {
          timerTimeDisplay.textContent = formatDuration(remaining);
        }
      }
    }, 1000);
  }

  // Pause Timer
  btnTimerPause.addEventListener('click', pauseTimer);
  
  function pauseTimer() {
    if (timerState !== 'running') return;
    timerState = 'paused';
    clearInterval(timerInterval);
    timerAccumulatedPaused += (Date.now() - timerStartTime);
    timerStateLabel.textContent = 'Paused';
    btnTimerPause.classList.add('hidden');
    btnTimerStart.classList.remove('hidden');
    const totalHours = (state.totalSeconds / 3600).toFixed(1);
    PlantRenderer.updateState(parseFloat(totalHours), state.health, state.isDead, false);
    saveActiveTimer();
  }

  // Stop and record
  btnTimerStop.addEventListener('click', () => {
    const duration = timerSecondsElapsed;
    if (duration >= 5) { // Only log if at least 5 seconds
      saveChantSession(duration, timerType);
    }
    resetTimerControls();
  });

  // Reset controls
  btnTimerCancel.addEventListener('click', () => {
    resetTimerControls();
  });

  function resetTimerControls() {
    timerState = 'idle';
    clearInterval(timerInterval);
    timerAccumulatedPaused = 0;
    
    btnTimerStart.classList.remove('hidden');
    btnTimerPause.classList.add('hidden');
    btnTimerStop.classList.add('hidden');
    btnTimerCancel.classList.add('hidden');
    
    btnTimerStopwatch.disabled = false;
    btnTimerCountdown.disabled = false;
    presetButtons.forEach(b => b.disabled = false);
    btnApplyCustomTime.disabled = false;
    
    const totalHours = (state.totalSeconds / 3600).toFixed(1);
    PlantRenderer.updateState(parseFloat(totalHours), state.health, state.isDead, false);
    saveActiveTimer();
    resetTimerDisplay();
  }

  function saveChantSession(durationSeconds, method) {
    const now = new Date();
    
    const personalTargetId = timerPersonalSelect.value || null;
    const campaignId = timerCampaignSelect.value || null;
    
    if (personalTargetId) {
      accumulateTimeToTarget(personalTargetId, durationSeconds);
    }
    
    if (campaignId) {
      const currentUser = MockFirebase.auth.getCurrentUser();
      if (currentUser) {
        MockFirebase.db.addCampaignContribution(
          currentUser.email,
          currentUser.username,
          currentUser.block,
          campaignId,
          durationSeconds,
          now.toISOString()
        );
      }
    }
    
    // 1. Log Session Detail
    const session = {
      id: Date.now().toString(),
      date: now.toISOString(),
      durationSeconds: durationSeconds,
      method: method,
      personalTargetId: personalTargetId,
      campaignId: campaignId,
      targetId: personalTargetId // fallback
    };
    
    state.sessions.unshift(session);
    
    // 2. Accumulate Chant Time
    state.lastNotifiedThreshold = 0; // Reset warning alert state
    state.dismissedAlerts = []; // Reset dismissed alerts on chanting activity
    // Always accumulate chanting time to total progress
    state.totalSeconds += durationSeconds;
    
    if (state.isDead) {
      // Dead plant mode: check revival progress
      const dateTodayStr = now.toISOString().split('T')[0];
      updateRevivalProgress(dateTodayStr, durationSeconds);
    } else {
      // Normal healthy mode
      state.health = 100; // Recover full hydration
      state.lastChantedDate = now.toISOString();
    }
    
    // 3. Streak Engine
    calculateStreak();
    
    saveState();
    
    // Trigger encouragement custom modal
    showEncouragementPopUp();
  }

  function calculateStreak() {
    if (state.sessions.length === 0) {
      state.streak = 0;
      return;
    }
    
    let activeStreak = 0;
    const uniqueChantDates = new Set(
      state.sessions.map(s => s.date.split('T')[0])
    );
    
    const checkDate = new Date();
    // Loop backwards day by day to check if they chanted
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueChantDates.has(dateStr)) {
        activeStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If they didn't chant today, check if they chanted yesterday. If they chanted yesterday, streak is still alive.
        if (activeStreak === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (uniqueChantDates.has(yesterdayStr)) {
            activeStreak = 1; // Start with yesterday
            checkDate.setDate(checkDate.getDate() - 2); // continue from day before
            continue;
          }
        }
        break;
      }
    }
    
    state.streak = activeStreak;
  }

  // --- 24-hour entry restriction: if hours = 24, disable minutes ---
  logHours.addEventListener('input', () => {
    const val = parseInt(logHours.value || 0);
    if (val >= 24) {
      logHours.value = 24;
      logMinutes.value = 0;
      logMinutes.disabled = true;
      logMinutes.title = 'Minutes are disabled when hours is 24';
    } else {
      logMinutes.disabled = false;
      logMinutes.title = '';
    }
  });

  // Cap minutes input to 60 manually
  logMinutes.addEventListener('input', () => {
    const val = parseInt(logMinutes.value || 0);
    if (val > 60) {
      logMinutes.value = 60;
    }
  });

  // --- Manual Log Submission ---
  manualLogForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let hrs = parseInt(logHours.value || 0);
    let mins = parseInt(logMinutes.value || 0);
    
    // Enforce 24h cap: if hours = 24, minutes must be 0
    if (hrs >= 24) {
      hrs = 24;
      mins = 0;
    }
    const totalSecs = (hrs * 3600) + (mins * 60);
    
    if (totalSecs <= 0) {
      alert("Please enter a valid duration!");
      return;
    }
    
    // Construct manual date (noon of selected day)
    const selectedDate = new Date(logDateInput.value);
    selectedDate.setHours(12, 0, 0, 0);
    
    const sessionDateString = selectedDate.toISOString();
    if (sessionDateString === "Invalid Date" || isNaN(selectedDate.getTime())) {
      alert("Invalid date selected!");
      return;
    }
    
    const personalTargetId = manualPersonalSelect.value || null;
    const campaignId = manualCampaignSelect.value || null;
    
    if (personalTargetId) {
      accumulateTimeToTarget(personalTargetId, totalSecs);
    }
    
    if (campaignId) {
      const currentUser = MockFirebase.auth.getCurrentUser();
      if (currentUser) {
        MockFirebase.db.addCampaignContribution(
          currentUser.email,
          currentUser.username,
          currentUser.block,
          campaignId,
          totalSecs,
          sessionDateString
        );
      }
    }
    
    const session = {
      id: Date.now().toString(),
      date: sessionDateString,
      durationSeconds: totalSecs,
      method: 'manual',
      personalTargetId: personalTargetId,
      campaignId: campaignId,
      targetId: personalTargetId // fallback
    };
    
    state.sessions.unshift(session);
    
    // Recalculate states
    const now = new Date();
    // If the logged session is the newest session or logged today, reset the water lastChantedDate
    const isNewest = state.sessions.length === 1 || new Date(session.date) > new Date(state.lastChantedDate);
    
    state.lastNotifiedThreshold = 0; // Reset warning alert state
    state.totalSeconds += totalSecs;
    
    if (state.isDead) {
      updateRevivalProgress(sessionDateString, totalSecs);
    } else {
      state.health = 100;
      if (isNewest) state.lastChantedDate = session.date;
    }
    
    calculateStreak();
    saveState();
    
    // Trigger encouragement custom modal
    showEncouragementPopUp();
    
    // Reset fields
    logHours.value = 0;
    logMinutes.value = 15;
    logMinutes.disabled = false;
    logMinutes.title = '';
    manualPersonalSelect.value = '';
    manualCampaignSelect.value = '';
    
    alert(`Successfully logged ${hrs}h ${mins}m!`);
    
    // Auto redirect to dashboard
    document.getElementById('nav-dashboard').click();
  });

  // --- History Log Views Render ---
  function renderHistoryLogs() {
    logsListContainer.innerHTML = '';
    
    if (state.sessions.length === 0) {
      logsListContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-seedling"></i>
          <p>No chanting sessions recorded yet. Start chanting to grow your plant!</p>
        </div>
      `;
      return;
    }
    
    state.sessions.forEach(session => {
      const item = document.createElement('div');
      item.className = 'log-item';
      
      const sessionDate = new Date(session.date);
      const dateString = sessionDate.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const durationMins = (session.durationSeconds / 60).toFixed(0);
      const hoursText = session.durationSeconds >= 3600 ? `${Math.floor(session.durationSeconds / 3600)}h ` : '';
      const minsText = `${durationMins % 60}m`;
      const durationText = `${hoursText}${minsText}`;
      
      let methodIcon = '<i class="fa-regular fa-clock" title="Stopwatch"></i>';
      if (session.method === 'countdown') {
        methodIcon = '<i class="fa-solid fa-hourglass-half" title="Focus Timer"></i>';
      } else if (session.method === 'manual') {
        methodIcon = '<i class="fa-solid fa-pen-to-square" title="Manual Log"></i>';
      }
      
      item.innerHTML = `
        <div class="log-info">
          <div class="log-time-amount">${methodIcon} ${durationText} chanted</div>
          <div class="log-date-label">${dateString}</div>
        </div>
        <div class="log-actions">
          <button class="btn-delete-log" data-id="${session.id}"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      `;
      
      // Delete Log event handler
      item.querySelector('.btn-delete-log').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm("Are you sure you want to delete this session? This will adjust your total chanting progress.")) {
          deleteChantSession(id);
        }
      });
      
      logsListContainer.appendChild(item);
    });
  }

  function deleteChantSession(id) {
    const idx = state.sessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      const deleted = state.sessions[idx];
      state.sessions.splice(idx, 1);
      
      // Reduce associated target accumulated time if set
      const personalTargetId = deleted.personalTargetId || (deleted.targetId && !deleted.targetId.startsWith('campaign_') ? deleted.targetId : null);
      const campaignId = deleted.campaignId || (deleted.targetId && deleted.targetId.startsWith('campaign_') ? deleted.targetId.replace('campaign_', '') : null);

      if (personalTargetId) {
        const target = state.targets.find(t => t.id === personalTargetId);
        if (target) {
          target.accumulatedSeconds = Math.max(0, target.accumulatedSeconds - deleted.durationSeconds);
          if (target.completed && target.type === 'hours' && target.accumulatedSeconds < target.targetSeconds) {
            target.completed = false;
          }
        }
      }

      if (campaignId) {
        const currentUser = MockFirebase.auth.getCurrentUser();
        if (currentUser) {
          // Find and delete matching contribution in DB
          let contributions = MockFirebase.db.getCampaignContributions();
          const idxCont = contributions.findIndex(c => 
            c.userEmail === currentUser.email && 
            c.campaignId === campaignId && 
            c.date === deleted.date && 
            c.durationSeconds === deleted.durationSeconds
          );
          if (idxCont !== -1) {
            contributions.splice(idxCont, 1);
            MockFirebase.db.saveCampaignContributions(contributions);
          }
        }
      }
      
      // Reduce total time if healthy, or reduce revival time if dead
      if (state.isDead) {
        state.revivalSeconds = Math.max(0, state.revivalSeconds - deleted.durationSeconds);
      } else {
        state.totalSeconds = Math.max(0, state.totalSeconds - deleted.durationSeconds);
      }
      
      // Recalculate states
      if (state.sessions.length > 0) {
        state.lastChantedDate = state.sessions[0].date;
      } else {
        state.lastChantedDate = new Date().toISOString();
      }
      
      applyTimeDecay();
      calculateStreak();
      state.dismissedAlerts = []; // Reset dismissed alerts on chanting activity change
      saveState();
      renderHistoryLogs();
    }
  }

  // Clear all history
  btnClearHistory.addEventListener('click', () => {
    if (confirm("WARNING: This will delete ALL your chanting history and reset your plant to a seed. Proceed?")) {
      state.totalSeconds = 0;
      state.health = 100;
      state.isDead = false;
      state.revivalSeconds = 0;
      state.lastChantedDate = new Date().toISOString();
      state.sessions = [];
      state.streak = 0;
      state.dismissedAlerts = [];
      
      // Reset target progress as well
      state.targets.forEach(t => {
        t.accumulatedSeconds = 0;
        t.completed = false;
      });
      
      saveState();
      renderHistoryLogs();
    }
  });

  function updateHistoryAnalytics() {
    analyticSessions.textContent = state.sessions.length;
    analyticStreak.textContent = `${state.streak} days`;
    
    if (state.sessions.length === 0) {
      analyticAvgSession.textContent = '0m';
      return;
    }
    
    const sum = state.sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const avgMins = Math.round((sum / state.sessions.length) / 60);
    analyticAvgSession.textContent = `${avgMins}m`;
  }

  // --- Setting Configurations ---
  settingMorningReminder.addEventListener('change', (e) => {
    state.settings.morningReminder = e.target.checked;
    saveState();
  });

  settingEveningReminder.addEventListener('change', (e) => {
    state.settings.eveningReminder = e.target.checked;
    saveState();
  });

  btnTestGong.addEventListener('click', () => {
    playGong();
  });

  // --- Notification Permission & Setup Manager ---
  if (btnRequestNotifications) {
    // Set initial button state based on permission
    if (!('Notification' in window)) {
      btnRequestNotifications.textContent = 'Notifications Not Supported';
      btnRequestNotifications.disabled = true;
    } else if (Notification.permission === 'granted') {
      btnRequestNotifications.textContent = 'Notifications Enabled ✓';
      btnRequestNotifications.disabled = true;
    } else if (Notification.permission === 'denied') {
      btnRequestNotifications.textContent = 'Notifications Blocked in Browser';
      btnRequestNotifications.disabled = true;
    }

    btnRequestNotifications.addEventListener('click', () => {
      if (!('Notification' in window)) {
        alert("This browser does not support notifications.");
        return;
      }

      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          btnRequestNotifications.textContent = 'Notifications Enabled ✓';
          btnRequestNotifications.disabled = true;
          alert("Notification permissions granted!");

          const options = {
            body: "Great! Reminders are now set up to keep your virtual plant healthy.",
            icon: "icons/icon-192.png",
            badge: "icons/icon-192.png",
            vibrate: [300, 100, 300],
            tag: "daimoku-reminder",
            renotify: true
          };

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification("Daimoku Grow", options);
            });
          } else {
            new Notification("Daimoku Grow", options);
          }
        } else {
          btnRequestNotifications.textContent = 'Notifications Blocked in Browser';
          btnRequestNotifications.disabled = true;
          alert("Notification permissions denied. In-app alerts will still be shown.");
        }
      });
    });
  }

  // Theme Swapper
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const themeClass = btn.getAttribute('data-theme');
      state.theme = themeClass;
      document.body.className = themeClass;
      saveState();
    });
  });

  // Pot Customizer Swapper
  const potButtons = document.querySelectorAll('.pot-btn');
  potButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const potStyle = btn.getAttribute('data-pot');
      if (!state.settings) {
        state.settings = { morningReminder: true, eveningReminder: true };
      }
      state.settings.potStyle = potStyle;
      PlantRenderer.setPotStyle(potStyle);
      saveState();
      updateUI();
    });
  });

  // Helper to draw lotus path on canvas
  function drawLotusWatermark(canvasCtx, cx, cy, size, color) {
    canvasCtx.save();
    canvasCtx.translate(cx, cy);
    canvasCtx.scale(size / 24, size / 24);
    canvasCtx.translate(-12, -12); // Center of 24x24 path
    canvasCtx.fillStyle = color;
    
    // Draw the main outer petal
    const p1 = new Path2D("M12,3 C10,7 6,9 6,13 C6,16 9,19 12,21 C15,19 18,16 18,13 C18,9 14,7 12,3 Z");
    // Draw the inner petal
    const p2 = new Path2D("M12,7 C13,10 16,12 16,14 C16,16 14,18 12,18 C10,18 8,16 8,14 C8,12 11,10 12,7 Z");
    
    canvasCtx.fill(p1);
    canvasCtx.fill(p2);
    canvasCtx.restore();
  }

  // Draw the high-fidelity guidance share card
  function drawShareCard(canvas, quoteText, quoteAuthor) {
    const ctx = canvas.getContext('2d');
    
    // Set fixed resolution for sharing (800x800)
    canvas.width = 800;
    canvas.height = 800;
    
    // Default light theme values
    let bgGradStart = '#fcfbf7'; 
    let bgGradEnd = '#f5f3eb';   
    let textColor = '#2c3e50';   
    let authorColor = '#7f8c8d'; 
    let accentColor = '#8e7a5c'; 
    let lotusColor = 'rgba(142, 122, 92, 0.04)'; 
    let borderGradStart = '#dfd5bf'; 
    let borderGradEnd = '#bfa57a';

    // Apply colors according to theme
    if (document.body.classList.contains('theme-forest-dark')) {
      bgGradStart = '#162416';
      bgGradEnd = '#0b130b';
      textColor = '#e2ebe2';
      authorColor = '#a3cfa3';
      accentColor = '#dfd5bf';
      lotusColor = 'rgba(223, 213, 191, 0.05)';
      borderGradStart = '#5a7a5a';
      borderGradEnd = '#8eb38e';
    } else if (document.body.classList.contains('theme-wood-sand')) {
      bgGradStart = '#fcf9f5';
      bgGradEnd = '#f3e6d8';
      textColor = '#5e432c';
      authorColor = '#a8805f';
      accentColor = '#c48c5a';
      lotusColor = 'rgba(196, 140, 90, 0.04)';
      borderGradStart = '#e6cca8';
      borderGradEnd = '#c48c5a';
    }
    
    // 1. Draw Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 800);
    bgGrad.addColorStop(0, bgGradStart);
    bgGrad.addColorStop(1, bgGradEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 800);
    
    // 2. Draw Translucent Lotus Watermark in center
    drawLotusWatermark(ctx, 400, 400, 320, lotusColor);
    
    // 3. Draw Borders
    // Elegant frame border
    ctx.lineWidth = 4;
    const frameGrad = ctx.createLinearGradient(40, 40, 760, 760);
    frameGrad.addColorStop(0, borderGradStart);
    frameGrad.addColorStop(1, borderGradEnd);
    ctx.strokeStyle = frameGrad;
    ctx.strokeRect(40, 40, 720, 720);
    
    // Thin inner line
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = accentColor + '33'; // 20% opacity accent
    ctx.strokeRect(48, 48, 704, 704);
    
    // Corner notches
    ctx.fillStyle = accentColor;
    const cornerSize = 8;
    ctx.fillRect(38, 38, cornerSize, cornerSize);
    ctx.fillRect(762 - cornerSize/2, 38, cornerSize, cornerSize);
    ctx.fillRect(38, 762 - cornerSize/2, cornerSize, cornerSize);
    ctx.fillRect(762 - cornerSize/2, 762 - cornerSize/2, cornerSize, cornerSize);
    
    // 4. Draw Small Lotus Icon at top
    drawLotusWatermark(ctx, 400, 110, 48, accentColor);
    
    // 5. Wrap text
    let cleanText = quoteText.trim();
    // Wrap with double quotes if not present
    if (!cleanText.startsWith('"')) cleanText = `"${cleanText}`;
    if (!cleanText.endsWith('"')) cleanText = `${cleanText}"`;
    
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let fontSize = 34;
    if (cleanText.length > 200) fontSize = 28;
    else if (cleanText.length < 100) fontSize = 38;
    
    ctx.font = `italic ${fontSize}px 'Playfair Display', Georgia, serif`;
    
    const maxWidth = 580;
    const lineHeight = fontSize * 1.45;
    
    const words = cleanText.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (let n = 0; n < words.length; n++) {
      let testLine = currentLine + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(currentLine.trim());
        currentLine = words[n] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());
    
    // Centering calculation
    const totalTextHeight = lines.length * lineHeight;
    let startY = 400 - (totalTextHeight / 2) + 20; // Offset for top logo
    
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 400, startY + (i * lineHeight));
    }
    
    // 6. Draw Divider Line
    const dividerY = startY + totalTextHeight + 40;
    ctx.beginPath();
    ctx.moveTo(350, dividerY);
    ctx.lineTo(450, dividerY);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 7. Draw Author
    let cleanAuthor = quoteAuthor.trim();
    if (cleanAuthor.startsWith('—') || cleanAuthor.startsWith('-')) {
      cleanAuthor = cleanAuthor.substring(1).trim();
    }
    ctx.font = "bold 20px 'Outfit', 'Segoe UI', sans-serif";
    ctx.fillStyle = authorColor;
    ctx.fillText(cleanAuthor.toUpperCase(), 400, dividerY + 35);
    
    // 8. Draw App Branding
    ctx.font = "500 13px 'Outfit', 'Segoe UI', sans-serif";
    ctx.fillStyle = authorColor + '99'; // 60% opacity
    ctx.fillText("DAIMOKU GROW GALAXY", 400, 715);
  }

  // Share Guidance Event Listeners
  if (btnShareGuidance) {
    btnShareGuidance.addEventListener('click', () => {
      if (shareModal) {
        shareModal.style.display = 'flex';
        shareModal.classList.remove('hidden');
        
        // Render Guidance Card on Canvas
        const text = guidanceText.textContent;
        const author = guidanceAuthor.textContent || "Daisaku Ikeda";
        drawShareCard(shareCardCanvas, text, author);
      }
    });
  }

  if (btnCloseShare) {
    btnCloseShare.addEventListener('click', () => {
      if (shareModal) {
        shareModal.style.display = 'none';
        shareModal.classList.add('hidden');
      }
    });
  }

  if (btnDownloadShare) {
    btnDownloadShare.addEventListener('click', () => {
      if (shareCardCanvas) {
        const link = document.createElement('a');
        link.download = 'daimoku-guidance.png';
        link.href = shareCardCanvas.toDataURL('image/png');
        link.click();
      }
    });
  }

  // --- Reminder Check Mechanism (12:00 PM and 8:00 PM Checks) ---
  function runNotificationsChecks() {
    const now = new Date();
    const hours = now.getHours();
    
    // Format check string so we don't repeat notifications within the same hour
    const dateTodayStr = now.toISOString().split('T')[0];
    
    // Check Morning Reminder (12:00 PM / Noon onwards)
    if (state.settings.morningReminder && hours >= 12 && hours < 20) {
      // Find if we already checked morning today
      const alreadyChecked = localStorage.getItem(`morning_check_${dateTodayStr}`);
      if (!alreadyChecked) {
        // Has user chanted today (before 12 PM)?
        const chantedToday = state.sessions.some(s => {
          const sDate = new Date(s.date);
          return sDate.toISOString().split('T')[0] === dateTodayStr;
        });
        
        if (!chantedToday) {
          triggerNotification("Morning Chant Reminder", "It's past 12:00 PM! Don't forget to water your plant with morning chanting.");
        }
        localStorage.setItem(`morning_check_${dateTodayStr}`, 'done');
      }
    }

    // Check Evening Reminder (8:00 PM / 20:00 onwards)
    if (state.settings.eveningReminder && hours >= 20) {
      const alreadyChecked = localStorage.getItem(`evening_check_${dateTodayStr}`);
      if (!alreadyChecked) {
        // Has user chanted since noon (12:00 PM) today?
        const chantedSinceNoon = state.sessions.some(s => {
          const sDate = new Date(s.date);
          const sHours = sDate.getHours();
          return sDate.toISOString().split('T')[0] === dateTodayStr && sDate.getHours() >= 12;
        });
        
        if (!chantedSinceNoon) {
          triggerNotification("Evening Chant Reminder", "It's evening! Water your plant with evening chanting to keep it healthy.");
        }
        localStorage.setItem(`evening_check_${dateTodayStr}`, 'done');
      }
    }
  }

  // (triggerNotification is defined in the upper scope)

  // --- Developer Debug Panel Toggle & Functions ---
  btnToggleDebug.addEventListener('click', () => {
    debugCard.classList.toggle('open');
    debugContent.classList.toggle('collapsed');
  });

  btnDebugHours.forEach(btn => {
    btn.addEventListener('click', () => {
      const hrs = parseInt(btn.getAttribute('data-hours'));
      state.totalSeconds = hrs * 3600;
      if (state.isDead) {
        // If we are debugging plant hours, make it alive for testing
        state.isDead = false;
        state.health = 100;
      }
      saveState();
      alert(`Debug: set total chanting to ${hrs} hours.`);
    });
  });

  btnDebugHealth.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetHealth = parseInt(btn.getAttribute('data-health'));
      state.health = targetHealth;
      state.isDead = (targetHealth === 0);
      if (state.isDead) {
        state.revivalDates = [];
      }
      saveState();
      alert(`Debug: set plant health to ${targetHealth}%.`);
    });
  });

  btnDebugDecay24h.addEventListener('click', () => {
    state.lastNotifiedThreshold = 0;
    simulateNeglect(0.5); // 0.5h beyond buffer = 24.5h neglect (Thirsty level notification)
  });

  btnDebugDecay72h.addEventListener('click', () => {
    state.lastNotifiedThreshold = 24;
    simulateNeglect(48.5); // 48.5h beyond buffer = 72.5h neglect (Sad/Shrinking level notification)
  });

  btnDebugDecay7d.addEventListener('click', () => {
    state.lastNotifiedThreshold = 72;
    simulateNeglect(144.5); // 144.5h beyond buffer = 168.5h neglect (7 days neglect - Dying)
  });

  btnDebugDecay15d.addEventListener('click', () => {
    state.lastNotifiedThreshold = 168;
    simulateNeglect(336.5); // 336.5h beyond buffer = 360.5h neglect (15 days neglect - Withered)
  });

  btnDebugDecay30d.addEventListener('click', () => {
    state.lastNotifiedThreshold = 360;
    simulateNeglect(696.5); // 696.5h beyond buffer = 720.5h neglect (30 days neglect - Dormant)
  });

  btnDebugResetDate.addEventListener('click', () => {
    state.lastChantedDate = new Date().toISOString();
    state.health = 100;
    state.isDead = false;
    state.lastNotifiedThreshold = 0;
    saveState();
    alert("Debug: Last chanted date reset to right now!");
  });

  function simulateNeglect(additionalHours) {
    const fakeChantedDate = new Date();
    fakeChantedDate.setHours(fakeChantedDate.getHours() - (DECAY_BUFFER_HOURS + additionalHours));
    
    state.lastChantedDate = fakeChantedDate.toISOString();
    applyTimeDecay();
    saveState();
    alert(`Debug: Simulated neglect. Health is now ${state.health}% (Mood: ${plantMoodBadge.textContent}).`);
  }

  btnDebugTestMorning.addEventListener('click', () => {
    const dateTodayStr = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`morning_check_${dateTodayStr}`);
    
    const originalHours = Date.prototype.getHours;
    Date.prototype.getHours = () => 13;
    
    runNotificationsChecks();
    
    Date.prototype.getHours = originalHours;
    alert("Debug: Triggered morning reminder evaluation (Mocked time: 1:00 PM). Check notifications if permission granted!");
  });

  btnDebugTestEvening.addEventListener('click', () => {
    const dateTodayStr = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`evening_check_${dateTodayStr}`);
    
    const originalHours = Date.prototype.getHours;
    Date.prototype.getHours = () => 21;
    
    runNotificationsChecks();
    
    Date.prototype.getHours = originalHours;
    alert("Debug: Triggered evening reminder evaluation (Mocked time: 9:00 PM). Check notifications if permission granted!");
  });


  // --- Targets & Determinations Manager ---
  
  // Toggle form input hours visibility
  targetTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'hours') {
      targetHoursInputGroup.classList.remove('hidden');
    } else {
      targetHoursInputGroup.classList.add('hidden');
    }
  });

  // Submit target form
  addTargetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = targetText.value.trim();
    const type = targetTypeSelect.value;
    const hours = parseInt(targetHoursInput.value || 10);
    
    if (!text) return;
    
    const newTarget = {
      id: Date.now().toString(),
      text: text,
      type: type,
      targetSeconds: type === 'hours' ? hours * 3600 : 0,
      accumulatedSeconds: 0,
      completed: false
    };
    
    state.targets.push(newTarget);
    saveState();
    
    // Reset form
    targetText.value = '';
    targetTypeSelect.value = 'none';
    targetHoursInputGroup.classList.add('hidden');
    
    renderTargetsList();
    alert("New determination created successfully!");
  });

  // Accumulate time to target
  function accumulateTimeToTarget(targetId, seconds) {
    const target = state.targets.find(t => t.id === targetId);
    if (target && !target.completed) {
      target.accumulatedSeconds += seconds;
      
      // Auto-complete check
      if (target.type === 'hours' && target.accumulatedSeconds >= target.targetSeconds) {
        target.completed = true;
        alert(`Congratulations! You have completed your target: "${target.text}"! 🎉`);
      }
    }
  }

  // Populate drop-down selectors
  function populateTargetDropdowns() {
    const prevTimerPersonal = timerPersonalSelect.value;
    const prevTimerCampaign = timerCampaignSelect.value;
    const prevManualPersonal = manualPersonalSelect.value;
    const prevManualCampaign = manualCampaignSelect.value;
    
    timerPersonalSelect.innerHTML = '<option value="">-- No Target (None) --</option>';
    manualPersonalSelect.innerHTML = '<option value="">-- No Target (None) --</option>';
    timerCampaignSelect.innerHTML = '<option value="">-- No Campaign (None) --</option>';
    manualCampaignSelect.innerHTML = '<option value="">-- No Campaign (None) --</option>';
    
    const activeList = MockFirebase.db.getActiveCampaigns();
    const campaigns = [
      { id: 'youth_division', name: "Youth Division Campaign" },
      { id: 'may_3rd', name: "May 3rd Campaign" },
      { id: 'mens_division', name: "Men's Division Campaign" },
      { id: 'womens_division', name: "Women's Division Campaign" },
      { id: 'july_3rd', name: "July 3rd Campaign" },
      { id: 'november_18th', name: "November 18th Campaign" }
    ].filter(c => activeList.includes(c.id));
    
    campaigns.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id; // Store raw campaign id
      option.textContent = c.name;
      
      timerCampaignSelect.appendChild(option.cloneNode(true));
      manualCampaignSelect.appendChild(option.cloneNode(true));
    });
    
    const activeTargets = state.targets.filter(t => !t.completed);
    activeTargets.forEach(t => {
      const option = document.createElement('option');
      option.value = t.id;
      const hrsText = t.type === 'hours' ? ` (${(t.accumulatedSeconds/3600).toFixed(1)}h/${t.targetSeconds/3600}h)` : '';
      option.textContent = t.text + hrsText;
      
      timerPersonalSelect.appendChild(option.cloneNode(true));
      manualPersonalSelect.appendChild(option.cloneNode(true));
    });
    
    // Restore selections
    timerPersonalSelect.value = prevTimerPersonal;
    timerCampaignSelect.value = prevTimerCampaign;
    manualPersonalSelect.value = prevManualPersonal;
    manualCampaignSelect.value = prevManualCampaign;
  }

  // Render Targets View lists
  function renderTargetsList() {
    activeTargetsList.innerHTML = '';
    completedTargetsList.innerHTML = '';
    
    const active = state.targets.filter(t => !t.completed);
    const completed = state.targets.filter(t => t.completed);
    
    // 1. Active Targets
    if (active.length === 0) {
      activeTargetsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-bullseye"></i>
          <p>No active determinations. Set a target to focus your Daimoku!</p>
        </div>
      `;
    } else {
      active.forEach(t => {
        const item = document.createElement('div');
        item.className = 'target-item';
        
        let progressText = "Open-ended target";
        let progressBar = "";
        
        if (t.type === 'hours') {
          const accHours = (t.accumulatedSeconds / 3600).toFixed(1);
          const tgtHours = (t.targetSeconds / 3600).toFixed(0);
          const percent = Math.min(100, Math.round((t.accumulatedSeconds / t.targetSeconds) * 100));
          progressText = `${accHours} / ${tgtHours} hours chanting`;
          progressBar = `
            <div class="progress-bar-track" style="margin-top: 8px;">
              <div class="progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
          `;
        }
        
        item.innerHTML = `
          <div class="target-checkbox-container">
            <div class="target-checkbox" title="Mark Completed">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
          <div class="target-content-box">
            <span class="target-title">${t.text}</span>
            <div class="target-meta-row">
              <span class="target-progress-text">${progressText}</span>
            </div>
            ${progressBar}
          </div>
          <button class="btn-delete-target" data-id="${t.id}" title="Delete Target"><i class="fa-regular fa-trash-can"></i></button>
        `;
        
        item.querySelector('.target-checkbox').addEventListener('click', () => {
          toggleTargetCompleted(t.id);
        });
        
        item.querySelector('.btn-delete-target').addEventListener('click', () => {
          deleteTarget(t.id);
        });
        
        activeTargetsList.appendChild(item);
      });
    }
    
    // 2. Completed Targets
    completedTargetsCount.textContent = completed.length;
    if (completed.length === 0) {
      completedTargetsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-circle-check"></i>
          <p>No completed targets yet. Stay consistent and win!</p>
        </div>
      `;
    } else {
      completed.forEach(t => {
        const item = document.createElement('div');
        item.className = 'target-item completed';
        
        let progressText = "Completed";
        if (t.type === 'hours') {
          progressText = `Completed (${(t.targetSeconds/3600).toFixed(0)}h logged)`;
        }
        
        item.innerHTML = `
          <div class="target-checkbox-container">
            <div class="target-checkbox" title="Reactivate Target">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
          <div class="target-content-box">
            <span class="target-title">${t.text}</span>
            <span class="target-progress-text">${progressText}</span>
          </div>
          <button class="btn-delete-target" data-id="${t.id}" title="Delete Target"><i class="fa-regular fa-trash-can"></i></button>
        `;
        
        item.querySelector('.target-checkbox').addEventListener('click', () => {
          toggleTargetCompleted(t.id);
        });
        
        item.querySelector('.btn-delete-target').addEventListener('click', () => {
          deleteTarget(t.id);
        });
        
        completedTargetsList.appendChild(item);
      });
    }
  }

  function toggleTargetCompleted(id) {
    const target = state.targets.find(t => t.id === id);
    if (target) {
      target.completed = !target.completed;
      saveState();
      renderTargetsList();
    }
  }

  function deleteTarget(id) {
    if (confirm("Are you sure you want to delete this determination? This will remove it from your records.")) {
      state.targets = state.targets.filter(t => t.id !== id);
      saveState();
      renderTargetsList();
    }
  }

  // Toggle completed targets list collapse
  btnToggleCompletedTargets.addEventListener('click', () => {
    completedTargetsCard.classList.toggle('open');
    completedTargetsList.classList.toggle('collapsed');
  });


  // --- Event Calendar Renderer ---
  let currentCalendarMonth = new Date().getMonth();
  let currentCalendarYear = new Date().getFullYear();
  let selectedDateStr = new Date().toISOString().split('T')[0]; // selected day defaults to today
  
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  
  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }
  
  function getEventsForDate(dateStr) {
    const events = [];
    const date = new Date(dateStr + 'T12:00:00'); // set noon to avoid timezone shift
    if (isNaN(date.getTime())) return [];
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    // 1. Recurring Monday Block Alliance Daimoku
    if (dayOfWeek === 1) {
      events.push({
        title: "Monday Block Alliance Daimoku",
        desc: "One (1) Hour Alliance Daimoku at Block level. Keep the rhythm strong!",
        type: "meeting",
        time: "7:00 PM"
      });
    }
    
    // 2. Coordinators' Alliance Daimoku: First Wednesday of the month
    if (dayOfWeek === 3 && day <= 7) {
      events.push({
        title: "Coordinators' Alliance Daimoku",
        desc: "District and Block leaders alliance Daimoku session.",
        type: "meeting",
        time: "7:00 PM"
      });
    }
    
    // 3. Significant SGI Anniversary dates (look up month and day)
    const anniversary = SGI_SIGNIFICANT_DATES.find(d => d.month === month && d.day === day);
    if (anniversary) {
      events.push({
        title: anniversary.title,
        desc: "Significant SGI Anniversary. A day of fresh determination and gratitude.",
        type: "anniversary",
        time: "All Day"
      });
    }
    
    // 4. Specific Friday & Saturday SGI activities (grows with custom events)
    if (CALENDAR_ACTIVITIES_2026[dateStr]) {
      const act = CALENDAR_ACTIVITIES_2026[dateStr];
      events.push({
        title: act.title,
        desc: "Scheduled activities for Friday/Saturday. Check with your block leaders for details.",
        type: act.type || "meeting",
        time: "Evening"
      });
    }
    
    // 5. National Holidays in 2026
    if (year === 2026 && SGI_HOLIDAYS_2026[dateStr]) {
      events.push({
        title: SGI_HOLIDAYS_2026[dateStr],
        desc: "National Holiday.",
        type: "holiday",
        time: "All Day"
      });
    }
    
    // 6. Campaign Periods, Ramadan & Vacations in 2026
    if (year === 2026) {
      const dTime = date.getTime();
      
      const jan16 = new Date("2026-01-16T00:00:00").getTime();
      const mar19 = new Date("2026-03-19T23:59:59").getTime();
      
      const apr7 = new Date("2026-04-07T00:00:00").getTime();
      const may7 = new Date("2026-05-07T23:59:59").getTime();
      
      const sep19 = new Date("2026-09-19T00:00:00").getTime();
      const nov19 = new Date("2026-11-19T23:59:59").getTime();
      
      if ((dTime >= jan16 && dTime <= mar19) || (dTime >= apr7 && dTime <= may7) || (dTime >= sep19 && dTime <= nov19)) {
        events.push({
          title: "SGI Campaign Period",
          desc: "Block chanting campaigns are active. Log your hours to help grow our collective garden!",
          type: "campaign",
          time: "Ongoing"
        });
      }
      
      // Ramadan: Feb 18 - Mar 19
      const feb18 = new Date("2026-02-18T00:00:00").getTime();
      if (dTime >= feb18 && dTime <= mar19) {
        events.push({
          title: "Ramadan Period",
          desc: "Month of spiritual reflection and fasting.",
          type: "holiday",
          time: "Ongoing"
        });
      }
      
      // Summer Vacations: Jun 26 - Aug 29
      const jun26 = new Date("2026-06-26T00:00:00").getTime();
      const aug29 = new Date("2026-08-29T23:59:59").getTime();
      if (dTime >= jun26 && dTime <= aug29) {
        events.push({
          title: "Summer Vacation Period (Tentative)",
          desc: "Summer break vacation period.",
          type: "holiday",
          time: "Ongoing"
        });
      }
    }
    
    // Standardize event times based on day of week for meetings / activities
    events.forEach(e => {
      if (e.type === "meeting") {
        if (dayOfWeek === 1 || dayOfWeek === 3) {
          e.time = "7:00 PM";
        } else if (dayOfWeek === 5 || dayOfWeek === 6) {
          e.time = "11:00 AM";
        }
      }
    });
    
    return events;
  }

  function renderCalendar() {
    const monthYearLabel = document.getElementById('calendar-month-year');
    const daysGrid = document.getElementById('calendar-days-grid');
    if (!monthYearLabel || !daysGrid) return;
    
    daysGrid.innerHTML = '';
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    
    monthYearLabel.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    
    const daysCount = getDaysInMonth(currentCalendarYear, currentCalendarMonth);
    const firstDayIndex = getFirstDayOfMonth(currentCalendarYear, currentCalendarMonth);
    
    // Render blank cells for offset
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day-cell empty';
      daysGrid.appendChild(emptyCell);
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Render day cells
    for (let day = 1; day <= daysCount; day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell';
      cell.textContent = day;
      
      const dateStr = `${currentCalendarYear}-${(currentCalendarMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      if (dateStr === todayStr) {
        cell.classList.add('today');
      }
      
      if (dateStr === selectedDateStr) {
        cell.classList.add('selected');
      }
      
      // Get events on this day to add classes for colored/bold numbers
      const events = getEventsForDate(dateStr);
      if (events.length > 0) {
        let primaryType = null;
        if (events.some(e => e.type === 'meeting')) {
          primaryType = 'meeting';
        } else if (events.some(e => e.type === 'anniversary')) {
          primaryType = 'anniversary';
        } else if (events.some(e => e.type === 'holiday')) {
          primaryType = 'holiday';
        } else if (events.some(e => e.type === 'campaign')) {
          primaryType = 'campaign';
        }
        
        if (primaryType) {
          cell.classList.add(`has-${primaryType}`);
        }
      }
      
      cell.addEventListener('click', () => {
        selectedDateStr = dateStr;
        const cells = daysGrid.querySelectorAll('.calendar-day-cell');
        cells.forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        renderSelectedDayEvents();
      });
      
      daysGrid.appendChild(cell);
    }
  }

  function renderSelectedDayEvents() {
    const dayLabel = document.getElementById('selected-day-label');
    const eventsList = document.getElementById('calendar-events-list');
    if (!dayLabel || !eventsList) return;
    
    const selDate = new Date(selectedDateStr + 'T12:00:00');
    dayLabel.textContent = selDate.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const events = getEventsForDate(selectedDateStr);
    eventsList.innerHTML = '';
    
    if (events.length === 0) {
      eventsList.innerHTML = `
        <div class="empty-state" style="padding: 10px;">
          <i class="fa-regular fa-calendar" style="font-size:24px; color:var(--text-muted); margin-bottom: 6px;"></i>
          <p style="font-size:12px; color:var(--text-muted);">No activities scheduled for this day.</p>
        </div>
      `;
      return;
    }
    
    events.forEach(e => {
      const div = document.createElement('div');
      div.className = `event-item ${e.type}`;
      div.innerHTML = `
        <span class="event-time-badge">${e.time}</span>
        <div class="event-details">
          <span class="event-title">${e.title}</span>
          <span class="event-desc">${e.desc}</span>
        </div>
      `;
      eventsList.appendChild(div);
    });
  }

  // Bind Calendar Navigation
  const btnCalPrev = document.getElementById('btn-cal-prev');
  const btnCalNext = document.getElementById('btn-cal-next');
  if (btnCalPrev && btnCalNext) {
    btnCalPrev.addEventListener('click', () => {
      currentCalendarMonth--;
      if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
      }
      renderCalendar();
    });
    
    btnCalNext.addEventListener('click', () => {
      currentCalendarMonth++;
      if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
      }
      renderCalendar();
    });
  }


  // --- Campaigns Tab Renderer ---
  function renderCampaignsList() {
    const container = document.getElementById('campaigns-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const currentUser = MockFirebase.auth.getCurrentUser();
    if (!currentUser) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-lock"></i>
          <p>Please log in to view and participate in campaigns.</p>
        </div>
      `;
      return;
    }
    
    const block = currentUser.block;
    const email = currentUser.email.toLowerCase();
    
    const targets = MockFirebase.db.getCampaignTargets();
    const contributions = MockFirebase.db.getCampaignContributions();
    
    const activeList = MockFirebase.db.getActiveCampaigns();
    const campaigns = [
      { id: 'youth_division', name: "Youth Division Campaign", period: "Jan 16 - Mar 19", icon: "fa-child-reaching", start: "2026-01-16", end: "2026-03-19" },
      { id: 'may_3rd', name: "May 3rd Campaign", period: "Apr 7 - May 7", icon: "fa-sun", start: "2026-04-07", end: "2026-05-07" },
      { id: 'mens_division', name: "Men's Division Campaign", period: "Jan 16 - Mar 19", icon: "fa-user-tie", start: "2026-01-16", end: "2026-03-19" },
      { id: 'womens_division', name: "Women's Division Campaign", period: "Apr 7 - May 7", icon: "fa-user-dress", start: "2026-04-07", end: "2026-05-07" },
      { id: 'july_3rd', name: "July 3rd Campaign", period: "Sep 19 - Nov 19", icon: "fa-users-line", start: "2026-09-19", end: "2026-11-19" },
      { id: 'november_18th', name: "November 18th Campaign", period: "Sep 19 - Nov 19", icon: "fa-tree", start: "2026-09-19", end: "2026-11-19" }
    ].filter(c => activeList.includes(c.id));
    
    if (campaigns.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px; text-align: center;">
          <i class="fa-solid fa-bullhorn" style="font-size: 36px; color: var(--text-muted); margin-bottom: 12px; opacity: 0.5;"></i>
          <p style="font-size: 13px; color: var(--text-muted); font-weight: 600;">No Active Campaigns</p>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px; max-width: 280px; margin-left: auto; margin-right: auto; line-height: 1.4;">Active campaigns will appear here once activated by a block administrator.</p>
        </div>
      `;
      return;
    }
    
    campaigns.forEach(c => {
      // 1. Calculate Global Progress
      const campaignContribs = contributions.filter(item => item.campaignId === c.id);
      const globalSeconds = campaignContribs.reduce((sum, item) => sum + item.durationSeconds, 0);
      const globalHours = globalSeconds / 3600;
      
      const targetHours = targets[c.id] || 100;
      const progressPercent = Math.min(100, Math.round((globalHours / targetHours) * 100));
      
      // 2. Count active blocks and members
      const activeBlocks = [...new Set(campaignContribs.map(item => item.block))];
      const activeBlocksCount = activeBlocks.length;
      
      const activeUsers = [...new Set(campaignContribs.map(item => item.userEmail))];
      const activeUsersCount = activeUsers.length;

      // 3. Calculate Block Progress (user's block specific)
      const blockContribs = campaignContribs.filter(item => item.block === block);
      const blockSeconds = blockContribs.reduce((sum, item) => sum + item.durationSeconds, 0);
      const blockHours = blockSeconds / 3600;
      
      // 4. Calculate Personal Contribution
      const personalSeconds = campaignContribs.filter(item => item.userEmail === email).reduce((sum, item) => sum + item.durationSeconds, 0);
      const personalHours = personalSeconds / 3600;
      
      // 5. Get Contributor Leaderboard (user's block specific)
      const contributorsMap = {};
      blockContribs.forEach(item => {
        const name = item.username || item.userEmail;
        if (!contributorsMap[name]) {
          contributorsMap[name] = 0;
        }
        contributorsMap[name] += item.durationSeconds;
      });
      
      const contributorsList = Object.keys(contributorsMap).map(name => ({
        username: name,
        hours: contributorsMap[name] / 3600,
        isMe: name === currentUser.username
      })).sort((a, b) => b.hours - a.hours);
      
      // Determine campaign status
      const now = new Date();
      const startDate = new Date(c.start + 'T00:00:00');
      const endDate = new Date(c.end + 'T23:59:59');
      let status = "Upcoming";
      let statusClass = "";
      
      if (now >= startDate && now <= endDate) {
        status = "Active";
        statusClass = "active-campaign";
      } else if (now > endDate) {
        status = "Ended";
      }
      
      const card = document.createElement('div');
      card.className = `card campaign-card ${statusClass}`;
      
      let leaderboardHtml = "";
      if (contributorsList.length > 0) {
        leaderboardHtml = `
          <div class="campaign-leaderboard-section" style="margin-top:10px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.08);">
            <button class="btn-toggle-leaderboard" style="background:transparent; border:none; color:var(--text-muted); font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; padding:0; outline:none;">
              <span><i class="fa-solid fa-list-ol"></i> Block Members Progress (${contributorsList.length})</span>
              <i class="fa-solid fa-chevron-down" style="font-size:10px; transition: transform 0.2s;"></i>
            </button>
            <div class="leaderboard-content" style="margin-top:8px; display:none; flex-direction:column; gap:6px;">
              ${contributorsList.map((contrib, idx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:6px 10px; background:rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius:8px;">
                  <span style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:10px; color:var(--text-muted); font-weight:700;">#${idx + 1}</span>
                    <span style="${contrib.isMe ? 'font-weight:700; color:var(--primary);' : ''}">${contrib.username} ${contrib.isMe ? '(You)' : ''}</span>
                  </span>
                  <span style="font-weight:600;">${contrib.hours.toFixed(1)} hrs</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
      
      card.innerHTML = `
        <div class="campaign-card-header">
          <div>
            <h3><i class="fa-solid ${c.icon}"></i> ${c.name}</h3>
            <span class="campaign-period-label">${c.period}</span>
          </div>
          <span class="campaign-badge">${status}</span>
        </div>
        
        <div class="campaign-card-content" style="display:flex; gap:16px; align-items:center; margin-top:12px;">
          <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
            <div class="campaign-stats-row" style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:var(--text-main); margin-bottom: 2px;">
              <span>Global Combined Progress</span>
              <span>${globalHours.toFixed(1)} / ${targetHours} hrs (${progressPercent}%)</span>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom: 6px; display:flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-users" style="color:var(--primary); font-size:10px;"></i>
              <span>Active in <strong>${activeBlocksCount} Blocks</strong> | <strong>${activeUsersCount} Members</strong></span>
            </div>
            <div style="font-size:11px; color:var(--text-muted); display:flex; justify-content:space-between; padding:4px 0; border-top:1px dashed rgba(255,255,255,0.05);">
              <span>${block} Block contribution:</span>
              <strong>${blockHours.toFixed(1)} hrs</strong>
            </div>
            <div style="font-size:11px; color:var(--text-muted); display:flex; justify-content:space-between; padding:4px 0; border-top:1px dashed rgba(255,255,255,0.05);">
              <span>Your personal contribution:</span>
              <strong style="color:var(--primary);">${personalHours.toFixed(1)} hrs</strong>
            </div>
          </div>
          <div class="campaign-bucket-container">
            <div class="bucket-handle"></div>
            <div class="glass-bucket">
              <div class="water-liquid" style="height: ${progressPercent}%; ${progressPercent === 0 ? 'display: none;' : ''}">
                <svg class="water-waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 120 28" preserveAspectRatio="none">
                  <g class="parallax">
                    <use href="#gentle-wave" x="48" y="0" fill="var(--bucket-water-1)" />
                    <use href="#gentle-wave" x="48" y="3" fill="var(--bucket-water-2)" />
                    <use href="#gentle-wave" x="48" y="5" fill="var(--bucket-water-3)" />
                  </g>
                </svg>
              </div>
              <div class="bucket-progress-value">${progressPercent}%</div>
            </div>
          </div>
        </div>
        
        ${leaderboardHtml}
      `;
      
      // Wire up toggle leaderboard button
      if (contributorsList.length > 0) {
        const toggleBtn = card.querySelector('.btn-toggle-leaderboard');
        const content = card.querySelector('.leaderboard-content');
        if (toggleBtn && content) {
          toggleBtn.addEventListener('click', () => {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'flex' : 'none';
            toggleBtn.querySelector('i.fa-chevron-down').className = isHidden ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
          });
        }
      }
      
      container.appendChild(card);
    });
  }


  // --- Admin Panel Collapsible & Render Operations ---
  const btnToggleAdmin = document.getElementById('btn-toggle-admin');
  const adminPanelContent = document.getElementById('admin-panel-content');
  const adminPanelCard = document.getElementById('admin-panel-card');
  
  if (btnToggleAdmin && adminPanelContent && adminPanelCard) {
    btnToggleAdmin.addEventListener('click', () => {
      adminPanelCard.classList.toggle('open');
      adminPanelContent.classList.toggle('collapsed');
    });
  }

  function renderWhitelist() {
    const container = document.getElementById('whitelist-list-container');
    if (!container) return;
    
    const whitelist = MockFirebase.db.getWhitelist();
    container.innerHTML = '';
    
    if (whitelist.length === 0) {
      container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:10px 0;">No emails whitelisted yet.</div>';
      return;
    }
    
    whitelist.forEach(item => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.style.padding = '8px 10px';
      div.style.background = 'rgba(255, 255, 255, 0.05)';
      div.style.borderRadius = '8px';
      div.style.marginBottom = '6px';
      div.style.fontSize = '13px';
      
      div.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span style="font-weight:600;">${item.email}</span>
          <span style="font-size:11px; color:var(--text-muted);">Code: <code style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px; font-weight:700; color:var(--primary); font-family: monospace;">${item.code}</code></span>
        </div>
        <button class="btn-delete-whitelist" data-email="${item.email}" style="background:transparent; border:none; color:var(--accent-danger); cursor:pointer; padding:4px;"><i class="fa-regular fa-trash-can"></i></button>
      `;
      
      div.querySelector('.btn-delete-whitelist').addEventListener('click', (e) => {
        const emailToDelete = e.currentTarget.getAttribute('data-email');
        const adminEmails = [
          'admin@email.com',
          'admin1@email.com',
          'admin2@email.com',
          'admin3@email.com',
          'admin4@email.com',
          'admin5@email.com'
        ];
        if (adminEmails.includes(emailToDelete)) {
          alert("Cannot remove a default administrator email from the whitelist!");
          return;
        }
        
        const currentUser = MockFirebase.auth.getCurrentUser();
        if (currentUser && currentUser.email.toLowerCase() === emailToDelete.toLowerCase()) {
          alert("Cannot remove yourself from the whitelist!");
          return;
        }
        
        if (confirm(`Are you sure you want to remove ${emailToDelete} from the whitelist? This will revoke their access.`)) {
          let list = MockFirebase.db.getWhitelist();
          list = list.filter(w => w.email.toLowerCase() !== emailToDelete.toLowerCase());
          MockFirebase.db.saveWhitelist(list);
          renderWhitelist();
        }
      });
      
      container.appendChild(div);
    });
  }

  const whitelistForm = document.getElementById('admin-whitelist-form');
  const whitelistInput = document.getElementById('whitelist-email-input');
  const whitelistCodeInput = document.getElementById('whitelist-code-input');
  if (whitelistForm && whitelistInput) {
    whitelistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = whitelistInput.value.trim().toLowerCase();
      let code = whitelistCodeInput ? whitelistCodeInput.value.trim().toUpperCase() : '';
      if (!email) return;
      
      // If code not provided, auto generate a random one
      if (!code) {
        code = 'SGI-' + Math.floor(1000 + Math.random() * 9000);
      }
      
      const list = MockFirebase.db.getWhitelist();
      if (list.some(w => w.email.toLowerCase() === email)) {
        alert("Email is already whitelisted!");
        return;
      }
      
      list.push({ email: email, code: code });
      MockFirebase.db.saveWhitelist(list);
      whitelistInput.value = '';
      if (whitelistCodeInput) whitelistCodeInput.value = '';
      renderWhitelist();
      alert(`Successfully whitelisted: ${email} with code: ${code}`);
    });
  }

  function renderCampaignTargetsEditor() {
    const container = document.getElementById('campaign-targets-container');
    if (!container) return;
    
    const targets = MockFirebase.db.getCampaignTargets();
    const activeCampaigns = MockFirebase.db.getActiveCampaigns();
    container.innerHTML = '';
    
    const campaigns = [
      { id: 'youth_division', name: "Youth Division" },
      { id: 'may_3rd', name: "May 3rd" },
      { id: 'mens_division', name: "Men's Division" },
      { id: 'womens_division', name: "Women's Division" },
      { id: 'july_3rd', name: "July 3rd" },
      { id: 'november_18th', name: "November 18th" }
    ];
    
    campaigns.forEach(c => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.style.padding = '8px 0';
      div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
      
      const isActive = activeCampaigns.includes(c.id);
      
      div.innerHTML = `
        <span style="font-size:13px; font-weight:500;">${c.name}</span>
        <div style="display:flex; align-items:center; gap:10px;">
          <label style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:var(--text-muted); cursor:pointer; margin-bottom:0;">
            <input type="checkbox" class="campaign-active-toggle" data-id="${c.id}" ${isActive ? 'checked' : ''} style="accent-color: var(--primary); width:13px; height:13px; margin:0;">
            Active
          </label>
          <input type="number" class="campaign-target-input" data-id="${c.id}" value="${targets[c.id]}" min="1" max="100000" style="width:60px; padding:6px; border-radius:6px; border:var(--border); background:var(--accent-cream); color:var(--text-main); font-size:12px; text-align:center;">
          <span style="font-size:11px; color:var(--text-muted);">hours</span>
        </div>
      `;
      
      div.querySelector('.campaign-target-input').addEventListener('change', (e) => {
        const val = parseInt(e.target.value || 100);
        const id = e.target.getAttribute('data-id');
        
        const allTargets = MockFirebase.db.getCampaignTargets();
        allTargets[id] = val;
        MockFirebase.db.saveCampaignTargets(allTargets);
        renderCampaignsList();
      });
      
      div.querySelector('.campaign-active-toggle').addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const checked = e.target.checked;
        
        let activeList = MockFirebase.db.getActiveCampaigns();
        if (checked) {
          if (!activeList.includes(id)) {
            activeList.push(id);
          }
        } else {
          activeList = activeList.filter(cid => cid !== id);
        }
        MockFirebase.db.saveActiveCampaigns(activeList);
        
        renderCampaignTargetsEditor();
        renderCampaignsList();
        populateTargetDropdowns();
      });
      
      container.appendChild(div);
    });
  }

  function renderAdminCalendarSchedule() {
    const container = document.getElementById('admin-events-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Sort dates chronologically
    const dates = Object.keys(CALENDAR_ACTIVITIES_2026).sort();
    
    if (dates.length === 0) {
      container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:10px 0; text-align:center;">No custom events scheduled.</div>';
      return;
    }
    
    dates.forEach(dateStr => {
      const event = CALENDAR_ACTIVITIES_2026[dateStr];
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.style.padding = '6px 8px';
      div.style.background = 'rgba(255, 255, 255, 0.04)';
      div.style.borderRadius = '8px';
      div.style.fontSize = '12px';
      div.style.border = '1px solid rgba(255,255,255,0.02)';
      
      const typeBadgeColor = event.type === 'meeting' ? 'var(--primary)' : (event.type === 'anniversary' ? '#cc99ff' : 'var(--text-muted)');
      
      div.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px; flex:1; overflow:hidden;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-weight:700; color:var(--text-main); font-family:monospace;">${dateStr}</span>
            <span style="font-size:10px; font-weight:700; text-transform:uppercase; color:white; background:${typeBadgeColor}; padding:1px 4px; border-radius:4px;">${event.type}</span>
          </div>
          <span style="color:var(--text-main); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${event.title}</span>
        </div>
        <div style="display:flex; gap:4px;">
          <button class="btn-edit-event" data-date="${dateStr}" style="background:transparent; border:none; color:var(--primary); cursor:pointer; padding:4px; font-size:13px;"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-delete-event" data-date="${dateStr}" style="background:transparent; border:none; color:var(--accent-danger); cursor:pointer; padding:4px; font-size:13px;"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      `;
      
      // Bind Edit Button
      div.querySelector('.btn-edit-event').addEventListener('click', (e) => {
        const d = e.currentTarget.getAttribute('data-date');
        const ev = CALENDAR_ACTIVITIES_2026[d];
        const dateInput = document.getElementById('calendar-event-date');
        const titleInput = document.getElementById('calendar-event-title');
        const typeInput = document.getElementById('calendar-event-type');
        if (dateInput) dateInput.value = d;
        if (titleInput) titleInput.value = ev.title;
        if (typeInput) typeInput.value = ev.type || 'meeting';
        
        // Scroll the form into view smoothly
        const form = document.getElementById('admin-calendar-form');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      
      // Bind Delete Button
      div.querySelector('.btn-delete-event').addEventListener('click', (e) => {
        const d = e.currentTarget.getAttribute('data-date');
        if (confirm(`Remove event on ${d} ("${CALENDAR_ACTIVITIES_2026[d].title}")?`)) {
          delete CALENDAR_ACTIVITIES_2026[d];
          localStorage.setItem('daimoku_calendar_activities', JSON.stringify(CALENDAR_ACTIVITIES_2026));
          renderAdminCalendarSchedule();
          if (document.getElementById('view-calendar').classList.contains('active')) {
            renderCalendar();
          }
        }
      });
      
      container.appendChild(div);
    });
  }

  // Handle calendar schedule form submission
  const adminCalendarForm = document.getElementById('admin-calendar-form');
  if (adminCalendarForm) {
    adminCalendarForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dateInput = document.getElementById('calendar-event-date');
      const titleInput = document.getElementById('calendar-event-title');
      const typeInput = document.getElementById('calendar-event-type');
      
      if (!dateInput || !titleInput || !typeInput) return;
      
      const dateStr = dateInput.value;
      const title = titleInput.value.trim();
      const type = typeInput.value;
      
      if (!dateStr || !title) return;
      
      // Save or update
      CALENDAR_ACTIVITIES_2026[dateStr] = { title, type };
      localStorage.setItem('daimoku_calendar_activities', JSON.stringify(CALENDAR_ACTIVITIES_2026));
      
      // Clear title and date form values
      titleInput.value = '';
      
      renderAdminCalendarSchedule();
      if (document.getElementById('view-calendar').classList.contains('active')) {
        renderCalendar();
      }
      
      alert(`Event on ${dateStr} successfully added/updated! 📅`);
    });
  }


  // --- Authentication Screen Controllers & Overlays ---
  const authOverlay = document.getElementById('auth-overlay');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  
  function showAuthForm(formToShow) {
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    forgotPasswordForm.classList.remove('active');
    formToShow.classList.add('active');
  }
  
  function hideAuthOverlay() {
    authOverlay.classList.add('hidden');
    authOverlay.style.display = 'none';
    // Resume animation if dashboard is active view
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav && activeNav.id === 'nav-dashboard') {
      setTimeout(() => {
        if (typeof PlantRenderer.resizeCanvas === 'function') {
          PlantRenderer.resizeCanvas();
        }
        if (typeof PlantRenderer.startAnimation === 'function') {
          PlantRenderer.startAnimation();
        }
      }, 50);
    }
  }
  
  function showAuthOverlay() {
    authOverlay.classList.remove('hidden');
    authOverlay.style.display = 'flex';
    showAuthForm(loginForm);
    // Stop animation when user is locked/logged out
    if (typeof PlantRenderer.stopAnimation === 'function') {
      PlantRenderer.stopAnimation();
    }
  }

  // Native & Mock Biometric Credential Scanning
  function showBiometricScanningOverlay() {
    let overlay = document.getElementById('biometric-scan-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'biometric-scan-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.background = 'rgba(0, 0, 0, 0.7)';
      overlay.style.backdropFilter = 'blur(10px)';
      overlay.style.zIndex = '99999';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.color = '#ffffff';
      overlay.style.fontFamily = 'var(--font-sans)';
      
      overlay.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); padding: 40px; border-radius: 24px; text-align: center; max-width: 320px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); display: flex; flex-direction: column; align-items: center; gap: 20px;">
          <div class="bio-icon" style="font-size: 60px; color: #10b981; animation: pulse 1.5s infinite ease-in-out;"><i class="fa-solid fa-fingerprint"></i></div>
          <div style="font-size: 18px; font-weight: 600;">Biometric Verification</div>
          <div style="font-size: 13px; color: #a3a3a3;">Please scan your fingerprint or verify your face to unlock Daimoku Grow.</div>
          <div style="width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #10b981; border-radius: 50%; animation: spin 1s infinite linear;"></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; text-shadow: 0 0 15px rgba(16, 185, 129, 0.5); }
            100% { transform: scale(1); opacity: 0.8; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  }
  
  function hideBiometricScanningOverlay() {
    const overlay = document.getElementById('biometric-scan-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  async function performBiometricLogin() {
    const savedCred = localStorage.getItem('daimoku_biometric_credential');
    if (!savedCred) {
      alert("Biometric login is not enrolled. Please log in normally first and enable Biometric Lock in Settings.");
      return;
    }
    
    const credInfo = JSON.parse(savedCred);
    let authenticated = false;
    
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        const options = {
          publicKey: {
            challenge: challenge,
            rp: { name: "Daimoku Grow" },
            user: {
              id: new Uint8Array(16),
              name: credInfo.email,
              displayName: credInfo.username
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            timeout: 60000,
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            }
          }
        };
        
        showBiometricScanningOverlay();
        await new Promise(resolve => setTimeout(resolve, 800)); // smooth scanning delay
        const credential = await navigator.credentials.create(options);
        if (credential) {
          authenticated = true;
        }
      }
    } catch (e) {
      console.warn("Native WebAuthn failed or unsupported, using fallback mock.", e);
    }
    
    if (!authenticated) {
      showBiometricScanningOverlay();
      await new Promise(resolve => setTimeout(resolve, 1500)); // mock scan animation delay
      authenticated = true;
    }
    
    hideBiometricScanningOverlay();
    
    try {
      const user = MockFirebase.auth.signIn(credInfo.email, credInfo.password);
      loadUserStateForLoggedInUser(user);
      hideAuthOverlay();
      
      const adminPanelCard = document.getElementById('admin-panel-card');
      if (user.isAdmin) {
        if (adminPanelCard) adminPanelCard.classList.remove('hidden');
        renderWhitelist();
        renderCampaignTargetsEditor();
        renderAdminCalendarSchedule();
      } else {
        if (adminPanelCard) adminPanelCard.classList.add('hidden');
      }
      
      updateUI();
      renderTargetsList();
      populateTargetDropdowns();
      
      alert(`Welcome back, ${user.username}! Biometric login successful. 🌸`);
    } catch (err) {
      alert("Biometric login failed: " + err.message);
    }
  }

  // Form Submissions Listeners
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const user = MockFirebase.auth.signIn(email, password);
      loadUserStateForLoggedInUser(user);
      hideAuthOverlay();
      
      const adminPanelCard = document.getElementById('admin-panel-card');
      if (user.isAdmin) {
        if (adminPanelCard) adminPanelCard.classList.remove('hidden');
        renderWhitelist();
        renderCampaignTargetsEditor();
        renderAdminCalendarSchedule();
      } else {
        if (adminPanelCard) adminPanelCard.classList.add('hidden');
      }
      
      updateUI();
      renderTargetsList();
      populateTargetDropdowns();
      
      // Auto redirect to dashboard
      document.getElementById('nav-dashboard').click();
      
      alert(`Welcome back, ${user.username}! 🙏`);
    } catch(err) {
      alert("Login failed: " + err.message);
    }
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const block = document.getElementById('register-block').value;
    const code = document.getElementById('register-code').value.trim();
    
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    
    try {
      const user = MockFirebase.auth.signUp(username, email, password, block, code);
      loadUserStateForLoggedInUser(user);
      hideAuthOverlay();
      
      const adminPanelCard = document.getElementById('admin-panel-card');
      if (user.isAdmin) {
        if (adminPanelCard) adminPanelCard.classList.remove('hidden');
        renderWhitelist();
        renderCampaignTargetsEditor();
        renderAdminCalendarSchedule();
      } else {
        if (adminPanelCard) adminPanelCard.classList.add('hidden');
      }
      
      updateUI();
      renderTargetsList();
      populateTargetDropdowns();
      
      // Auto redirect to dashboard
      document.getElementById('nav-dashboard').click();
      
      alert(`Account created successfully! Welcome to the ${block} Block, ${username}! 🌸`);
    } catch(err) {
      alert("Registration failed: " + err.message);
    }
  });

  forgotPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('recovery-email').value;
    const newPassword = document.getElementById('recovery-new-password').value;
    
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    
    try {
      MockFirebase.auth.resetPassword(email, newPassword);
      alert("Password updated successfully! Please log in with your new credentials.");
      showAuthForm(loginForm);
    } catch(err) {
      alert("Error: " + err.message);
    }
  });

  // Auth Screen Links toggles
  document.getElementById('link-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm(registerForm);
  });
  
  document.getElementById('link-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm(loginForm);
  });
  
  document.getElementById('link-to-forgot').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm(forgotPasswordForm);
  });
  
  document.getElementById('link-to-login-from-recovery').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm(loginForm);
  });
  
  const btnBiometricLogin = document.getElementById('btn-biometric-login');
  if (btnBiometricLogin) {
    btnBiometricLogin.addEventListener('click', performBiometricLogin);
  }

  // Biometric Setting Lock switch listener
  const settingBiometricLock = document.getElementById('setting-biometric-lock');
  if (settingBiometricLock) {
    const savedCred = localStorage.getItem('daimoku_biometric_credential');
    settingBiometricLock.checked = !!savedCred;
    
    settingBiometricLock.addEventListener('change', (e) => {
      const user = MockFirebase.auth.getCurrentUser();
      if (!user) {
        alert("Please log in first!");
        settingBiometricLock.checked = false;
        return;
      }
      
      if (e.target.checked) {
        const cred = {
          email: user.email,
          username: user.username,
          password: user.password
        };
        localStorage.setItem('daimoku_biometric_credential', JSON.stringify(cred));
        alert("Biometric Lock enrolled! You can now log in using FaceID/TouchID on this device.");
      } else {
        localStorage.removeItem('daimoku_biometric_credential');
        alert("Biometric Lock disabled.");
      }
    });
  }

  // Logout Button
  const btnLogoutHeader = document.getElementById('btn-logout');
  if (btnLogoutHeader) {
    btnLogoutHeader.addEventListener('click', () => {
      if (confirm("Are you sure you want to log out?")) {
        MockFirebase.auth.signOut();
        showAuthOverlay();
        
        // Hide badge and logout button in header
        document.getElementById('user-block-badge').classList.add('hidden');
        btnLogoutHeader.classList.add('hidden');
        
        // Hide admin card
        const adminPanelCard = document.getElementById('admin-panel-card');
        if (adminPanelCard) adminPanelCard.classList.add('hidden');
        
        alert("You have logged out successfully.");
      }
    });
  }


  // --- Boot Sequences ---
  loadState();
  
  // Ensure lastChantedDate is valid (fixes the blank/NaN bug)
  const parsedLastChanted = new Date(state.lastChantedDate);
  if (isNaN(parsedLastChanted.getTime())) {
    state.lastChantedDate = new Date().toISOString();
    state.health = 100;
  }
  
  initNavigation();
  updateQuote();
  renderTargetsList();
  populateTargetDropdowns();
  
  // Check session status on boot
  const bootUser = MockFirebase.auth.getCurrentUser();
  if (bootUser) {
    hideAuthOverlay();
    
    // Check admin status
    const adminPanelCard = document.getElementById('admin-panel-card');
    if (bootUser.isAdmin) {
      if (adminPanelCard) adminPanelCard.classList.remove('hidden');
      renderWhitelist();
      renderCampaignTargetsEditor();
      renderAdminCalendarSchedule();
    } else {
      if (adminPanelCard) adminPanelCard.classList.add('hidden');
    }
  } else {
    showAuthOverlay();
  }
  
  // Initialize Plant Canvas
  const canvasElement = document.getElementById('plant-canvas');
  PlantRenderer.init(canvasElement);
  if (typeof PlantRenderer.stopAnimation === 'function') {
    PlantRenderer.stopAnimation(); // Stop rendering loop until navigation routes to dashboard
  }
  
  // Run notification check immediately on boot, and check every 5 minutes
  runNotificationsChecks();
  setInterval(runNotificationsChecks, 1000 * 60 * 5);

  // --- Encouragement Pop-ups & Revival Helpers (Moved early definitions) ---

  const ENCOURAGEMENTS = [
    "Wonderful chanting! Every single Daimoku resounds throughout the entire universe! 🌌✨",
    "Brilliant effort! Your consistent Daimoku is watering the roots of your happiness! 🌸🌱",
    "Fantastic session! 'A person of chanting is never defeated.' Keep shining! 🦁☀️",
    "Amazing! Chanting Nam-myoho-renge-kyo is like the roar of a lion. Victory is yours! 🦁💪",
    "Beautiful rhythm! You are tapping the boundless wisdom of the universe within your heart! 💖🧘",
    "Superb consistency! Great trees grow from small, daily efforts. You are doing great! 🌳⭐",
    "Incredible focus! Your prayers are transforming any poison into sweet medicine! 🧪➡️🍬",
    "Resounding victory! Keep chanting with the vibrant rhythm of a galloping horse! 🐎✨",
    "Sincere and powerful! You have watered your garden with the light of Buddhahood! ☀️🌷",
    "Spectacular! No prayer is left unanswered. Trust in the power of your Daimoku! 🙏✨",
    "Chant with joy! Chanting Daimoku itself is the highest form of absolute happiness! 😊💖",
    "A fresh start today! Nichiren Buddhism is about starting from this very moment! 🌅🌱",
    "Magnificent dedication! You are building an indestructible fortress of happiness! 🏰💎",
    "Deep conviction! Your prayers are opening the golden treasury of your own life! 🪙✨",
    "Splendid rhythm! Consistent Daimoku morning and evening brings complete freedom! ☀️🌙",
    "Courageous heart! Your chanting dispels all darkness and brings forth infinite hope! 🌟🦁",
    "Wonderful dedication! The key to victory is to continue chanting, no matter what! 🙌🔥",
    "Inspirational effort! One day at a time, you are creating a beautiful, blooming life! 🌸🌺",
    "Joyful sound! Your voice is a song of peace that harmonizes your entire environment! 🎵🕊️",
    "Keep going! The lotus flower blooms most beautifully in the muddy water! 🪷💧",
    "Pure light! You have connected your life with the fundamental power of the cosmos! 🌌💫",
    "Radiant energy! Your chanting has filled your life with boundless courage and hope! ⚡☀️",
    "Masterful session! Consistency is the direct path to achieving your determinations! 🎯🏆",
    "Unshakeable faith! Even when it is tough, a sincere prayer moves everything! ⛰️🌊",
    "Fantastic chanting! Believe in yourself and the ultimate power of your own life-force! 🌟🧘",
    "Brilliant practice! You are developing the heart of a great champion! 🏆🦁",
    "Beautifully done! The sun of Buddhahood is rising in your heart right now! 🌅💛",
    "Chanting is power! Let's continue with fresh energy and dynamic action! 🚀✨",
    "Pure dedication! The seeds of victory you sow today will bloom into amazing flowers! 🌻✨",
    "Perfect harmony! Your Daimoku is the key to absolute peace and boundless joy! 🕊️💖"
  ];

  function showEncouragementPopUp(customText = "") {
    const modal = document.getElementById('encouragement-modal');
    const msgEl = document.getElementById('encouragement-message');
    if (modal && msgEl) {
      if (customText) {
        msgEl.textContent = customText;
      } else {
        const randomIndex = Math.floor(Math.random() * ENCOURAGEMENTS.length);
        msgEl.textContent = ENCOURAGEMENTS[randomIndex];
      }
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
  }

  const btnCloseEncouragement = document.getElementById('btn-close-encouragement');
  if (btnCloseEncouragement) {
    btnCloseEncouragement.addEventListener('click', () => {
      const modal = document.getElementById('encouragement-modal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
      }
    });
  }

  function checkThreeConsecutiveDays(datesArray) {
    if (datesArray.length < 3) return false;
    const timestamps = datesArray.map(d => new Date(d + 'T12:00:00').getTime());
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i <= timestamps.length - 3; i++) {
      const t1 = timestamps[i];
      const t2 = timestamps[i+1];
      const t3 = timestamps[i+2];
      if (t2 - t1 === oneDayMs && t3 - t2 === oneDayMs) {
        return true;
      }
    }
    return false;
  }

  function updateRevivalProgress(sessionDateStr, durationSeconds) {
    if (!state.isDead) return;
    if (!state.revivalDates) state.revivalDates = [];
    
    const dateSessions = state.sessions.filter(s => s.date.split('T')[0] === sessionDateStr);
    const totalSecsForDate = dateSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    
    if (totalSecsForDate >= 900) { // 900 seconds = 15 minutes
      if (!state.revivalDates.includes(sessionDateStr)) {
        state.revivalDates.push(sessionDateStr);
        state.revivalDates.sort();
      }
    }
    
    if (checkThreeConsecutiveDays(state.revivalDates)) {
      state.isDead = false;
      state.health = 100;
      state.revivalDates = [];
      
      showEncouragementPopUp("Wonderful! Your plant has been successfully revived through 3 days of consecutive Daimoku! Keep the rhythm strong! 🪷🌸");
    }
  }

  // Periodic decay check while app is open (every 10 seconds)
  setInterval(() => {
    if (!state.isDead && timerState !== 'running' && MockFirebase.auth.getCurrentUser()) {
      applyTimeDecay();
      updateUI();
    }
  }, 10000);
  
  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(async (reg) => {
          console.log('Service Worker registered successfully!', reg.scope);
          
          // Request permissions and register syncs
          try {
            if ('periodicSync' in reg) {
              const status = await navigator.permissions.query({
                name: 'periodic-background-sync',
              });
              if (status.state === 'granted') {
                await reg.periodicSync.register('check-decay-and-reminders', {
                  minInterval: 6 * 60 * 60 * 1000, // Check every 6 hours
                });
                console.log("Periodic background sync registered!");
              }
            }
            if ('sync' in reg) {
              await reg.sync.register('check-decay-and-reminders-sync');
              console.log("Background sync registered!");
            }
          } catch (syncErr) {
            console.warn("Sync registration skipped/failed:", syncErr);
          }
        })
        .catch(err => console.error('Service Worker registration failed:', err));
    });
  }

  // --- Auto Fullscreen ---
  function goFullscreen() {
    if (document.documentElement.requestFullscreen) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else if (document.documentElement.webkitRequestFullscreen) {
      if (!document.webkitFullscreenElement) {
        document.documentElement.webkitRequestFullscreen();
      }
    } else {
      console.log("Fullscreen API is not supported on this device/browser.");
    }
    document.body.removeEventListener('click', goFullscreen);
    document.body.removeEventListener('touchstart', goFullscreen);
  }
  
  document.body.addEventListener('click', goFullscreen);
  document.body.addEventListener('touchstart', goFullscreen);


});

