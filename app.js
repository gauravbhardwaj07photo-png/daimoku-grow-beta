/**
 * Daimoku Grow - App State & Logic Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  try {
  
  // --- Constants & Database ---
  let GOAL_HOURS = 333;
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

  const SGI_HOLIDAYS_2026 = {};
  
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
    // --- STREAK ---
    { id: 'first_daimoku', title: "First Dew", desc: "Chant for the first time. Minimum 1 minute Daimoku recorded", icon: "fa-droplet", tier: "endeavor", check: (s) => s.sessions.some(x => x.durationSeconds >= 60) },
    { id: 'streak_3', title: "Sprout", desc: "Chant consecutively for 3 days. A quiet commitment begins to form like morning dew on a leaf.", icon: "fa-clover", tier: "endeavor", check: (s) => s.streak >= 3 },
    { id: 'streak_7', title: "Soka Resolve", desc: "Chant consecutively for 7 days. Your daily rhythm breaks through the soil of routine.", icon: "fa-seedling", tier: "endeavor", check: (s) => s.streak >= 7 },
    { id: 'streak_15', title: "Deepening Roots", desc: "Chant consecutively for 15 days. Standing steady and drawing silent strength from the earth.", icon: "fa-leaf", tier: "endeavor", check: (s) => s.streak >= 15 },
    { id: 'streak_30', title: "Steadfast Ichinen", desc: "Maintain consistency for 30 days. Establishing a powerful, single-minded determination in your daily life.", icon: "fa-fire", tier: "endeavor", check: (s) => s.streak >= 30 },
    { id: 'streak_90', title: "Lotus Pillar", desc: "Maintain consistency for 90 days. Weathering life's changes with an unshakeable, growing spirit.", icon: "fa-cloud-sun", tier: "endeavor", check: (s) => s.streak >= 90 },
    { id: 'streak_180', title: "Toda Medal", desc: "Chant consecutively for 180 days. Standing firm in faith, blooming pure above the mud of daily obstacles.", icon: "fa-monument", tier: "endeavor", check: (s) => s.streak >= 180 },
    { id: 'streak_365', title: "Shinichi's Vow", desc: "Chant daily for 365 days. Embodying the mentor-disciple spirit with an unbroken daily commitment to absolute victory.", icon: "fa-trophy", tier: "legendary", check: (s) => s.streak >= 365 },

    // --- FOCUS ---
    { id: 'session_15m', title: "Daimoku Fire", desc: "Log a continuous session of 15 minutes via timer or stopwatch. Cleansing the mind like a refreshing breeze.", icon: "fa-wind", tier: "endeavor", check: (s) => s.sessions.some(x => x.durationSeconds >= 900) },
    { id: 'session_30m', title: "Daimoku Thunder", desc: "Log a continuous session of 30 minutes. Your practice flows naturally, building steady momentum.", icon: "fa-water", tier: "endeavor", check: (s) => s.sessions.some(x => x.durationSeconds >= 1800) },
    { id: 'session_1h', title: "Daimoku Rain", desc: "Log a continuous session of 1 hour. Erecting a quiet monument of absolute concentration and peace.", icon: "fa-hourglass-half", tier: "endeavor", check: (s) => s.sessions.some(x => x.durationSeconds >= 3600) },
    { id: 'session_2h', title: "Treasure Tower", desc: "Log a continuous session of 2 hours. Sinking deep into the tranquil, bottomless depths of your own life.", icon: "fa-compass", tier: "endeavor", check: (s) => s.sessions.some(x => x.durationSeconds >= 7200) },
    { id: 'session_3h20m', title: "Lion's Roar", desc: "Log a continuous session of 3h 20m or more. A powerful, breakthrough chant that clears all obstacles.", icon: "icons/lion-head.png", tier: "rare", check: (s) => s.sessions.some(x => x.durationSeconds >= 12000) },

    // --- LIFETIME ---
    { id: 'total_1h', title: "First Leaf", desc: "Chant for the very first time. Planting the seed of Buddhahood and absolute happiness in your life.", icon: "fa-wand-magic-sparkles", tier: "endeavor", check: (s) => (s.totalSeconds / 3600) >= 1 },
    { id: 'total_10h', title: "Cherry Blossom", desc: "Reach 10 hours of total chanting. A young sapling rises, expressing hope and potential.", icon: "fa-bahai", tier: "endeavor", check: (s) => (s.totalSeconds / 3600) >= 10 },
    { id: 'total_30h', title: "Sun of Soka", desc: "Reach 30 hours of total chanting. Illumining your life and environment with the radiant light of Soka.", icon: "fa-sun", tier: "endeavor", check: (s) => (s.totalSeconds / 3600) >= 30 },
    { id: 'total_50h', title: "Bodhi Tree", desc: "Reach 50 hours of total chanting. Anchoring deep into the soil of daily discipline, unaffected by any storm.", icon: "fa-anchor", tier: "endeavor", check: (s) => (s.totalSeconds / 3600) >= 50 },
    { id: 'total_100h', title: "Mount Sumeru", desc: "Reach 100 hours of total chanting. Creating a shelter of peace and quiet encouragement for others.", icon: "fa-tree-city", tier: "endeavor", check: (s) => (s.totalSeconds / 3600) >= 100 },
    { id: 'total_150h', title: "Mount Fuji", desc: "Reach 150 hours of total chanting. Standing unshakeable and majestic, like Mount Fuji, against all adversity.", icon: "fa-mountain", tier: "endeavor", check: (s) => (s.totalSeconds / 3600) >= 150 },
    { id: 'total_200h', title: "Eagle Peak", desc: "Reach 200 hours of total chanting. Standing tall among giants in the global community of practitioners.", icon: "fa-tree", tier: "endeavor", check: (s) => (s.totalSeconds / 3600) >= 200 },
    { id: 'total_333h', title: "Shinichi's Triumph", desc: "Reach 333 hours of total chanting. Fully realizing the majestic tree milestone with President Ikeda's victorious spirit.", icon: "fa-crown", tier: "milestone", check: (s) => (s.totalSeconds / 3600) >= 333 },
    { id: 'daisado_medal', title: "Daisado Medal", desc: "Conferred when an active campaign in which you are contributing successfully reaches its target.", icon: "fa-medal", tier: "rare", check: (s) => {
      try {
        const dbContribs = MockFirebase.db.getCampaignContributions();
        const dbTargets = MockFirebase.db.getCampaignTargets();
        const dbCustomCampaigns = MockFirebase.db.getCustomCampaigns();
        const allCampaignIds = [...dbCustomCampaigns];
        const currentUser = MockFirebase.auth.getCurrentUser();
        if (!currentUser) return false;
        
        return allCampaignIds.some(cid => {
          const campaignContribs = dbContribs.filter(item => item.campaignId === cid);
          const globalSeconds = campaignContribs.reduce((sum, item) => sum + item.durationSeconds, 0);
          const globalHours = globalSeconds / 3600;
          const targetHours = dbTargets[cid] || 100;
          
          if (globalHours >= targetHours) {
            return campaignContribs.some(item => item.userEmail.toLowerCase() === currentUser.email.toLowerCase());
          }
          return false;
        });
      } catch (e) {
        console.error("Error in daisado_medal check:", e);
        return false;
      }
    } },

    // --- HABITS ---
    { id: 'early_bird', title: "Dawn Devotion", desc: "Chant before 8:00 AM. Welcoming the day with a clean mind and triumphant determination.", icon: "fa-mug-hot", tier: "endeavor", check: (s) => s.sessions.some(x => {
      const date = new Date(x.date);
      return !isNaN(date.getTime()) && date.getHours() < 8;
    }) },
    { id: 'night_owl', title: "Midnight Muse", desc: "Chant after 9:00 PM. Wrapping up the day in quiet reflection, sending peace to the world.", icon: "fa-cloud-moon", tier: "endeavor", check: (s) => s.sessions.some(x => {
      const date = new Date(x.date);
      return !isNaN(date.getTime()) && date.getHours() >= 21;
    }) },
    { id: 'diurnal_balance', title: "Buddha Day & Night", desc: "Chant in both morning (before 12 PM) and evening (after 6 PM) on the same day.", icon: "fa-circle-half-stroke", tier: "endeavor", check: (s) => {
      const days = {};
      s.sessions.forEach(x => {
        const d = new Date(x.date);
        if (!isNaN(d.getTime())) {
          const dateStr = d.toISOString().split('T')[0];
          if (!days[dateStr]) days[dateStr] = { morning: false, evening: false };
          if (d.getHours() < 12) days[dateStr].morning = true;
          if (d.getHours() >= 18) days[dateStr].evening = true;
        }
      });
      return Object.values(days).some(d => d.morning && d.evening);
    } },
    { id: 'weekend_warrior', title: "Weekend Sanctuary", desc: "Chant for at least 2 hours total over a single Saturday & Sunday.", icon: "fa-umbrella-beach", tier: "endeavor", check: (s) => {
      const weekendTotals = {};
      s.sessions.forEach(x => {
        const d = new Date(x.date);
        if (!isNaN(d.getTime())) {
          const day = d.getDay();
          if (day === 0 || day === 6) {
            const sat = new Date(d.getTime());
            sat.setDate(d.getDate() - (day === 0 ? 1 : 0));
            const satStr = sat.toISOString().split('T')[0];
            weekendTotals[satStr] = (weekendTotals[satStr] || 0) + x.durationSeconds;
          }
        }
      });
      return Object.values(weekendTotals).some(t => t >= 7200);
    } },

    // --- DETERMINATIONS ---
    { id: 'first_target', title: "Strong Ichinen", desc: "Create your first prayer target. Planting a deliberate vow in the garden of your life.", icon: "fa-bullseye", tier: "endeavor", check: (s) => s.targets.length >= 1 },
    { id: 'multi_target', title: "Many Vows, One Heart", desc: "Hold 3 active determinations at once - breadth of sincere prayer.", icon: "fa-heart", tier: "endeavor", check: (s) => s.targets.filter(x => !x.completed).length >= 3 },
    { id: 'target_completed', title: "Nanjo's Resolve", desc: "Complete your first prayer target. Watching a resolve bloom into a beautiful, solid reality.", icon: "fa-award", tier: "endeavor", check: (s) => s.targets.some(x => x.completed) },
    { id: 'victory_arch', title: "Kaneko Medal", desc: "Complete 3 prayer targets. A gorgeous medal of victory, representing gentle persistence and absolute proof.", icon: "fa-spa", tier: "milestone", check: (s) => s.targets.filter(x => x.completed).length >= 3 },

    // --- CAMPAIGN ---
    { id: 'soka_pioneer', title: "Shijo's Medal", desc: "Contribute to an SGI Campaign target. Embodying loyalty, courage, and global action for humanity's peace.", icon: "fa-users", tier: "endeavor", check: (s) => s.sessions.some(x => x.campaignId || (x.targetId && x.targetId.startsWith('campaign_'))) },
    { id: 'campaign_pillar', title: "Osaka Medal", desc: "Contribute to at least 3 distinct SGI campaigns over time - unwavering dedication to the collective vow.", icon: "fa-globe", tier: "legendary", check: (s) => {
      const ids = [...new Set(s.sessions.map(x => x.campaignId || (x.targetId && x.targetId.startsWith('campaign_') ? x.targetId.replace('campaign_', '') : null)).filter(Boolean))];
      return ids.length >= 3;
    } },

    // --- REVIVAL ---
    { id: 'self_healing', title: "Hossaku Kempon", desc: "Resume chanting after a break - love and attention always heals. Return after a 7-day gap.", icon: "fa-hand-holding-heart", tier: "endeavor", check: (s) => {
      if (s.sessions.length < 2) return false;
      const sorted = [...s.sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].date);
        const curr = new Date(sorted[i].date);
        const gapMs = curr.getTime() - prev.getTime();
        const gapDays = gapMs / (1000 * 60 * 60 * 24);
        if (gapDays >= 7) return true;
      }
      return false;
    } },
    { id: 'phoenix_sprout', title: "Esho Funi", desc: "Successfully revive a withered plant back to life.", icon: "fa-fire-flame-curved", tier: "rare", check: (s) => {
      if (s.sessions.length < 4) return false;
      const sorted = [...s.sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
      let gapCount = 0;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].date);
        const curr = new Date(sorted[i].date);
        const gapMs = curr.getTime() - prev.getTime();
        const gapDays = gapMs / (1000 * 60 * 60 * 24);
        if (gapDays >= 7) gapCount++;
      }
      return gapCount >= 3;
    } }
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

  function setBadgeIcon(element, iconStr, isLarge = false) {
    if (!element) return;
    if (iconStr && iconStr.startsWith('emoji:')) {
      element.className = 'badge-emoji-icon';
      element.innerHTML = iconStr.substring(6);
      element.style.fontSize = isLarge ? '36px' : '22px';
      element.style.display = 'inline-block';
      element.style.lineHeight = '1';
      element.style.fontStyle = 'normal';
    } else if (iconStr && (iconStr.startsWith('image:') || iconStr.endsWith('.png') || iconStr.includes('/'))) {
      const src = iconStr.startsWith('image:') ? iconStr.substring(6) : iconStr;
      element.className = 'badge-image-icon';
      element.innerHTML = `<img src="${src}" style="width: ${isLarge ? '70px' : '38px'}; height: ${isLarge ? '70px' : '38px'}; object-fit: contain; border-radius: 50%; display: block;" />`;
      element.style.fontSize = '';
      element.style.display = 'block';
      element.style.lineHeight = '';
      element.style.fontStyle = '';
    } else {
      element.className = `fa-solid ${iconStr}`;
      element.innerHTML = '';
      element.style.fontSize = '';
      element.style.display = '';
      element.style.lineHeight = '';
      element.style.fontStyle = '';
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
      div.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'} ${ach.tier || 'endeavor'}`;
      div.style.cursor = 'pointer';
      
      const tierText = ach.tier || 'endeavor';
      div.innerHTML = `
        <div class="badge-icon-box">
          <i class="badge-icon-target"></i>
        </div>
        <div class="badge-info">
          <div class="badge-title-row">
            <span class="badge-title">${ach.title}</span>
            <span class="badge-tier-tag ${tierText}">${tierText}</span>
          </div>
          <span class="badge-desc">${ach.desc}</span>
        </div>
      `;
      
      setBadgeIcon(div.querySelector('.badge-icon-target'), ach.icon, false);
      
      div.addEventListener('click', () => {
        showBadgePreviewModal(ach, isUnlocked);
      });
      
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
      potStyle: 'clay',
      treeTargetHours: 333,
      skyBackground: 'diurnal'
    },
    theme: 'theme-sage-light',
    dismissedAlerts: [], // Array of closed notification IDs
    revivalDates: [], // Dates of consecutive daimoku for revival while dead
    unlockedAchievements: [] // Array of persistently unlocked achievement IDs
  };

  let isCloudStateLoaded = false;
  let editingTargetId = null;
  const expandedTargetIds = new Set();

  // --- Timer Variables ---
  let timerInterval = null;
  let timerType = 'stopwatch'; // 'stopwatch' or 'countdown'
  let timerState = 'idle'; // 'idle', 'running', 'paused'
  let timerSecondsElapsed = 0;
  let countdownTargetSeconds = 1800; // Default 30 mins
  let timerStartTime = null;
  let timerAccumulatedPaused = 0; // ms accumulated before pause

  // --- Fireworks & Badge Celebration Variables (Moved to top to prevent startup TDZ errors) ---
  let celebrationQueue = [];
  let isCelebrationActive = false;
  let celebrationParticles = [];
  let celebrationRockets = [];
  let celebrationAnimationId = null;
  let celebrationCanvas = null;
  let celebrationCtx = null;
  let celebrationDurationTimeout = null;
  let isManualPreview = false;
  let editingCampaignId = null;

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
  const dashboardMiniTimer = document.getElementById('dashboard-mini-timer');
  const dashboardMiniTimerTime = document.getElementById('dashboard-mini-timer-time');
  
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
  const targetDeadlineInput = document.getElementById('target-deadline');
  const targetDeadlineInputGroup = document.getElementById('target-deadline-input-group');
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
  const settingTreeTargetHours = document.getElementById('setting-tree-target-hours');
  const btnRequestNotifications = document.getElementById('btn-request-notifications');
  const btnTestGong = document.getElementById('btn-test-gong');
  const themeButtons = document.querySelectorAll('.theme-btn');



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
          const now = Date.now();
          const lastActive = t.lastActiveTime || now;
          const elapsedMs = (t.state === 'running' ? lastActive : t.startTime) - t.startTime + t.accumulated;
          const elapsedSecs = Math.floor(elapsedMs / 1000);
          
          if (elapsedSecs >= 5) {
            // Restore target selections so the auto-saved session is credited correctly
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
        }
        localStorage.removeItem('daimoku_active_timer');
        resetTimerControls();
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
          eveningReminder: true,
          potStyle: 'clay',
          treeTargetHours: 333,
          skyBackground: 'diurnal'
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
    isCloudStateLoaded = false;
    const normalizedEmail = user.email.toLowerCase().trim();
    const localCachedState = localStorage.getItem(`daimoku_db_state_${normalizedEmail}`);
    
    // 1. Load local cache synchronously first (restores any existing data instantly)
    if (localCachedState) {
      try {
        state = JSON.parse(localCachedState);
        applyLoadedStateSafeguards();
      } catch (e) {
        console.warn("Error parsing local cached state:", e);
      }
    } else {
      // Fallback to guest state if no user state exists yet
      const guestState = localStorage.getItem('daimoku_grow_state');
      if (guestState) {
        try {
          state = JSON.parse(guestState);
          applyLoadedStateSafeguards();
        } catch (e) {}
      }
    }
    
    // Apply header & visual updates instantly from local cache
    applyLoggedInUserVisuals(user);
    
    // 2. Fetch from cloud asynchronously to revalidate and sync
    MockFirebase.db.getUserState(user.email).then(cloudState => {
      if (cloudState) {
        let merged = false;
        
        if (!cloudState.sessions) cloudState.sessions = [];
        if (!cloudState.targets) cloudState.targets = [];
        if (!cloudState.unlockedAchievements) cloudState.unlockedAchievements = [];

        // Reconcile locally saved sessions (e.g. exit auto-saves)
        if (state && state.sessions) {
          state.sessions.forEach(localSess => {
            const existsInCloud = cloudState.sessions.some(cloudSess => 
              cloudSess.id === localSess.id || 
              (cloudSess.date === localSess.date && cloudSess.durationSeconds === localSess.durationSeconds)
            );
            if (!existsInCloud) {
              cloudState.sessions.push(localSess);
              merged = true;
              console.log("Merge: Uploading local offline session to cloud:", localSess);
              
              // Upload campaign contribution if applicable
              if (localSess.targetId && localSess.targetId.startsWith('campaign_')) {
                const campaignId = localSess.targetId.replace('campaign_', '');
                const contributions = MockFirebase.db.getCampaignContributions();
                const contribExists = contributions.some(c => 
                  c.userEmail === user.email && 
                  c.date === localSess.date && 
                  c.durationSeconds === localSess.durationSeconds
                );
                if (!contribExists) {
                  contributions.push({
                    id: localSess.id || (Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5)),
                    userEmail: user.email,
                    username: user.username,
                    block: user.block,
                    campaignId: campaignId,
                    durationSeconds: localSess.durationSeconds,
                    date: localSess.date
                  });
                  MockFirebase.db.saveCampaignContributions(contributions);
                }
              }
            }
          });
          
          // Re-sort sessions descending by date
          cloudState.sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // Reconcile locally saved determinations/targets
        if (state && state.targets) {
          state.targets.forEach(localTarget => {
            const cloudTargetIdx = cloudState.targets.findIndex(cloudT => cloudT.id === localTarget.id);
            if (cloudTargetIdx === -1) {
              cloudState.targets.push(localTarget);
              merged = true;
            } else {
              const cloudT = cloudState.targets[cloudTargetIdx];
              if (localTarget.completed && !cloudT.completed) {
                cloudState.targets[cloudTargetIdx] = localTarget;
                merged = true;
              } else if (localTarget.accumulatedSeconds > cloudT.accumulatedSeconds) {
                cloudState.targets[cloudTargetIdx] = localTarget;
                merged = true;
              }
            }
          });
        }

        if (merged) {
          // Re-calculate total seconds on merged state
          cloudState.totalSeconds = cloudState.sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
          MockFirebase.db.saveUserState(user.email, cloudState);
          console.log("Merge: Synced merged offline progress back to Firestore.");
        }
        
        state = cloudState;
      } else {
        // First time cloud user: migrate local state to cloud
        state = migrateLocalToCloud(user);
      }
      applyLoadedStateSafeguards();
      
      isCloudStateLoaded = true;
      
      // Reconcile user state with campaign contributions (self-healing)
      healUserStateFromContributions(user);
      
      // Save updated cloud state back to localStorage caches
      localStorage.setItem('daimoku_grow_state', JSON.stringify(state));
      localStorage.setItem(`daimoku_db_state_${normalizedEmail}`, JSON.stringify(state));
      
      // Redraw UI with fresh cloud data
      rebuildRevivalDates();
      updateUI();
      console.log("Firebase sync: cloud state fetched and loaded.");
    }).catch(err => {
      isCloudStateLoaded = true;
      console.warn("Failed to fetch state from Firestore, running on local cache:", err);
    });
  }

  function healUserStateFromContributions(user) {
    if (!isCloudStateLoaded) {
      console.warn("State is not loaded from cloud yet, skipping self-healing.");
      return;
    }
    let stateChanged = false;
    if (!state) state = {};
    if (!state.sessions) state.sessions = [];
    
    const isTotalSecondsInvalid = isNaN(state.totalSeconds) || typeof state.totalSeconds !== 'number';
    
    // Re-map any existing incorrect sessions (self-repair schema differences)
    state.sessions.forEach(s => {
      if (s.durationSeconds === undefined && s.duration !== undefined) {
        s.durationSeconds = s.duration;
        stateChanged = true;
      }
      if (s.method === undefined && s.type !== undefined) {
        s.method = s.type;
        stateChanged = true;
      }
      if (s.campaignId === undefined && s.campaign !== undefined) {
        s.campaignId = s.campaign;
        stateChanged = true;
      }
    });

    if (stateChanged || isTotalSecondsInvalid) {
      // Recalculate totalSeconds safely
      state.totalSeconds = state.sessions.reduce((acc, s) => {
        return acc + (s.durationSeconds || 0);
      }, 0);
      
      // Sort sessions ascending
      state.sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Recalculate health and streaks
      state.health = 100;
      state.isDead = false;
      state.revivalSeconds = 0;
      calculateStreak();
      
      // Save state to local storage and Firestore
      saveState();
      console.log("Self-healing: personal state properties validated and repaired.");
    }
  }

  function applyLoadedStateSafeguards() {
    if (!state) state = {};
    if (state.sessions === undefined) state.sessions = [];
    if (state.streak === undefined) state.streak = 0;
    if (state.revivalSeconds === undefined) state.revivalSeconds = 0;
    if (state.isDead === undefined) state.isDead = false;
    if (state.targets === undefined) state.targets = [];
    if (state.lastNotifiedThreshold === undefined) state.lastNotifiedThreshold = 0;
    if (state.dismissedAlerts === undefined) state.dismissedAlerts = [];
    if (state.revivalDates === undefined) state.revivalDates = [];
    if (state.theme === undefined) state.theme = 'theme-sage-light';
    if (state.settings === undefined) {
      state.settings = { morningReminder: true, eveningReminder: true, potStyle: 'clay', treeTargetHours: 333, skyBackground: 'diurnal' };
    } else {
      if (state.settings.treeTargetHours === undefined) state.settings.treeTargetHours = 333;
      if (state.settings.skyBackground === undefined) state.settings.skyBackground = 'diurnal';
    }
    if (state.unlockedAchievements === undefined) state.unlockedAchievements = [];
    
    // Apply saved theme
    document.body.className = state.theme || 'theme-sage-light';
  }

  function applyLoggedInUserVisuals(user) {
    // Rebuild revival dates (self-healing)
    rebuildRevivalDates();
    initializeUnlockedAchievements(true);
    
    // Save to active local state cache
    localStorage.setItem('daimoku_grow_state', JSON.stringify(state));
    

    
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
    updateCampaignTabVisibility();
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
          dismissedAlerts: state.dismissedAlerts || [],
          calendarActivities: CALENDAR_ACTIVITIES_2026
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
          vibrate: [300, 100, 300],
          tag: "morning-reminder",
          showTrigger: new TimestampTrigger(morningTime.getTime())
        });
        
        // 2. Evening Chant Reminder (9:00 PM)
        let eveningTime = new Date();
        eveningTime.setHours(21, 0, 0, 0);
        if (eveningTime.getTime() <= now) {
          eveningTime.setDate(eveningTime.getDate() + 1);
        }
        
        reg.showNotification("Evening Chant Reminder", {
          body: "It's evening! Water your plant with evening chanting to keep it healthy. 🌙",
          icon: "icons/icon-192.png",
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
            vibrate: [300, 100, 300, 100, 400],
            tag: "decay-15d",
            showTrigger: new TimestampTrigger(decay15dTime)
          });
        }

        // 4. Calendar Event Reminders (One day prior at 7:00 PM)
        const eventDates = Object.keys(CALENDAR_ACTIVITIES_2026);
        eventDates.forEach(dateStr => {
          const event = CALENDAR_ACTIVITIES_2026[dateStr];
          if (event && event.type === 'meeting') {
            const eventDate = new Date(dateStr + 'T00:00:00');
            const reminderTime = new Date(eventDate.getTime());
            reminderTime.setDate(reminderTime.getDate() - 1);
            reminderTime.setHours(19, 0, 0, 0); // 7:00 PM
            
            const reminderTimestamp = reminderTime.getTime();
            if (reminderTimestamp > now) {
              reg.showNotification(`Meeting Reminder: ${event.title}`, {
                body: `Reminder: You have a scheduled ${event.title} tomorrow! 📅`,
                icon: "icons/icon-192.png",
                vibrate: [300, 100, 300],
                tag: `event-reminder-${dateStr}`,
                showTrigger: new TimestampTrigger(reminderTimestamp)
              });
            }
          }
        });
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
      isCloudStateLoaded = true;
      const saved = localStorage.getItem('daimoku_grow_state');
      if (saved) {
        try {
          state = JSON.parse(saved);
          // Ensure properties exist
          if (state.sessions === undefined) state.sessions = [];
          if (state.streak === undefined) state.streak = 0;
          if (state.revivalSeconds === undefined) state.revivalSeconds = 0;
          if (state.isDead === undefined) state.isDead = false;
          if (state.targets === undefined) state.targets = [];
          if (state.lastNotifiedThreshold === undefined) state.lastNotifiedThreshold = 0;
          if (state.dismissedAlerts === undefined) state.dismissedAlerts = [];
          if (state.revivalDates === undefined) state.revivalDates = [];
          if (state.unlockedAchievements === undefined) state.unlockedAchievements = [];
          
          // Apply saved theme
          document.body.className = state.theme || 'theme-sage-light';
        } catch (e) {
          console.error("Error loading state, resetting:", e);
        }
      }
    }
    
    // Run silent initialization of unlocked achievements
    initializeUnlockedAchievements(true);
    
    // Set manual form default date to today
    const localNow = new Date();
    const lYear = localNow.getFullYear();
    const lMonth = String(localNow.getMonth() + 1).padStart(2, '0');
    const lDay = String(localNow.getDate()).padStart(2, '0');
    const today = `${lYear}-${lMonth}-${lDay}`;
    logDateInput.value = today;
    logDateInput.max = today;
    if (targetDeadlineInput) {
      targetDeadlineInput.min = today;
    }
    
    // Rebuild revival dates (self-healing)
    rebuildRevivalDates();
    
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
    if (!isCloudStateLoaded) {
      console.warn("State is not loaded from cloud yet, skipping saveState to prevent data loss.");
      return;
    }
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
    if (notificationBanner && notificationBannerText) {
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
    }

    // 2. Fire OS-level Push Notification if permission granted (plays default system tone on phone)
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: message,
        icon: "icons/icon-192.png",
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
        
        // Render SGI Campaign if entering campaign view
        if (viewId === 'view-campaign') {
          renderCampaignDashboard();
        } else {
          stopFireworks();
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
            renderCampaignDashboard();
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
    GOAL_HOURS = (state && state.settings && state.settings.treeTargetHours) ? state.settings.treeTargetHours : 333;
    const statTargetHours = document.getElementById('stat-target-hours');
    if (statTargetHours) {
      statTargetHours.textContent = GOAL_HOURS;
    }
    rebuildRevivalDates();
    const decimalHours = state.totalSeconds / 3600;
    const progressPercent = Math.min(100, Math.round((decimalHours / GOAL_HOURS) * 100));
    
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
    const stageInfo = PlantRenderer.getGrowthStage(decimalHours);
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
    const hours = Math.floor(state.totalSeconds / 3600);
    const mins = Math.round((state.totalSeconds % 3600) / 60);
    statTotalHours.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    if (journeyPercentValue) {
      journeyPercentValue.textContent = `${progressPercent}%`;
    }
    progressPercentLabel.textContent = `${progressPercent}% of Journey`;
    const remaining = Math.max(0, GOAL_HOURS - decimalHours).toFixed(1);
    progressRemainingLabel.textContent = `${remaining}h remaining`;
    journeyProgressFill.style.width = `${progressPercent}%`;
    
    // Revival Card Visibility
    if (state.isDead) {
      revivalProgressContainer.classList.remove('hidden');
      
      let daysCount = getActiveRevivalStreak(state.revivalDates);
      
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
    
    // Update streak badge on main dashboard
    const dashboardStreakBadge = document.getElementById('plant-streak-badge');
    const dashboardStreakValue = document.getElementById('dashboard-streak-value');
    if (dashboardStreakBadge && dashboardStreakValue) {
      if (state.streak > 0) {
        dashboardStreakValue.textContent = state.streak;
        dashboardStreakBadge.classList.remove('hidden');
      } else {
        dashboardStreakBadge.classList.add('hidden');
      }
    }

    // Update goal milestone estimate
    updateMilestoneEstimate();

    // Update Sky background scenery
    updateSkyTheme();
    
    // Trigger canvas state updates
    PlantRenderer.updateState(decimalHours, state.health, state.isDead, timerState === 'running', state.settings.treeTargetHours || 333, state.targets.filter(t => !t.completed), state.settings.skyBackground || 'diurnal', state.streak || 0);
    
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
    if (settingTreeTargetHours) {
      settingTreeTargetHours.value = state.settings.treeTargetHours || 333;
    }
    
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

    // Update sky customizer buttons highlights
    const skyButtons = document.querySelectorAll('.sky-btn');
    skyButtons.forEach(btn => {
      if (btn.getAttribute('data-sky') === ((state.settings && state.settings.skyBackground) || 'diurnal')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // History analytics
    updateHistoryAnalytics();

    // Update campaign tab visibility dynamically
    updateCampaignTabVisibility();

    // If SGI Campaign view is currently active, refresh it
    const viewCampaign = document.getElementById('view-campaign');
    if (viewCampaign && viewCampaign.classList.contains('active')) {
      renderCampaignDashboard();
    }
  }

  // --- In-App Notifications Drawer with Decay Milestones ---
  function updateNotificationBanner() {
    if (!state.dismissedAlerts) state.dismissedAlerts = [];
    
    const now = new Date();
    const lastChanted = new Date(state.lastChantedDate);
    const diffMs = now - lastChanted;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    let activeAlert = null;

    // Check if an active campaign is announced today (High-Priority Alert Banner)
    const activeList = MockFirebase.db.getActiveCampaigns();
    if (activeList.length > 0 && isCampaignActiveToday(activeList[0])) {
      const activeId = activeList[0];
      const campaignNames = MockFirebase.db.getCampaignNames();
      const campaignName = campaignNames[activeId] || "New Campaign";
      const alertId = `campaign_announce_${activeId}`;
      if (!state.dismissedAlerts.includes(alertId)) {
        activeAlert = {
          id: alertId,
          type: 'info',
          message: `📢 Active Campaign Announced: "${campaignName}"! Visit the Campaign tab to see target goals and log hours to support the campaign! 🎯`
        };
      }
    }
    
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
    if (notificationBanner) {
      if (activeAlert) {
        if (state.dismissedAlerts.includes(activeAlert.id)) {
          notificationBanner.className = 'notification-banner hidden';
        } else {
          if (notificationBannerText) {
            notificationBannerText.textContent = activeAlert.message;
          }
          notificationBanner.className = 'notification-banner';
          notificationBanner.classList.add(activeAlert.type);
          notificationBanner.setAttribute('data-active-alert-id', activeAlert.id);
          notificationBanner.classList.remove('hidden');
        }
      } else {
        notificationBanner.className = 'notification-banner hidden';
      }
    }
  }

  if (notificationBannerClose) {
    notificationBannerClose.addEventListener('click', () => {
      const alertId = notificationBanner ? notificationBanner.getAttribute('data-active-alert-id') : null;
      if (alertId) {
        if (!state.dismissedAlerts) state.dismissedAlerts = [];
        if (!state.dismissedAlerts.includes(alertId)) {
          state.dismissedAlerts.push(alertId);
        }
        saveState();
      }
      if (notificationBanner) {
        notificationBanner.classList.add('hidden');
      }
    });
  }

  // --- Timer Operations (Stopwatch & Countdown) ---
  if (btnTimerStopwatch) {
    btnTimerStopwatch.addEventListener('click', () => {
      if (timerState !== 'idle') return;
      timerType = 'stopwatch';
      btnTimerStopwatch.classList.add('active');
      if (btnTimerCountdown) btnTimerCountdown.classList.remove('active');
      if (countdownPresets) countdownPresets.classList.add('hidden');
      if (customMinutesInputContainer) customMinutesInputContainer.classList.add('hidden');
      resetTimerDisplay();
    });
  }

  if (btnTimerCountdown) {
    btnTimerCountdown.addEventListener('click', () => {
      if (timerState !== 'idle') return;
      timerType = 'countdown';
      btnTimerCountdown.classList.add('active');
      if (btnTimerStopwatch) btnTimerStopwatch.classList.remove('active');
      if (countdownPresets) countdownPresets.classList.remove('hidden');
      resetTimerDisplay();
    });
  }

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

  if (btnApplyCustomTime) {
    btnApplyCustomTime.addEventListener('click', () => {
      if (timerState !== 'idle') return;
      const mins = Math.max(1, Math.min(1440, parseInt(customMinutesInput.value || 30)));
      customMinutesInput.value = mins;
      countdownTargetSeconds = mins * 60;
      resetTimerDisplay();
    });
  }

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
  if (btnTimerStart) {
    btnTimerStart.addEventListener('click', () => {
      resumeTimer(false);
    });
  }

  function resumeTimer(isBoot = false) {
    if (!isBoot) {
      playGong(); // Play gong on start
    }
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
    
    // Show dashboard mini timer
    if (dashboardMiniTimer) {
      dashboardMiniTimer.classList.remove('hidden');
    }
    
    const totalHours = (state.totalSeconds / 3600).toFixed(1);
    PlantRenderer.updateState(parseFloat(totalHours), state.health, state.isDead, true, state.settings.treeTargetHours || 333, state.targets.filter(t => !t.completed), state.settings.skyBackground || 'diurnal', state.streak || 0);
    saveActiveTimer();
    
    timerInterval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - timerStartTime + timerAccumulatedPaused;
      
      saveActiveTimer(); // Keep active timer updated with the last active tick
      
      let displayTimeStr = '00:00:00';
      if (timerType === 'stopwatch') {
        timerSecondsElapsed = Math.floor(elapsedMs / 1000);
        displayTimeStr = formatDuration(timerSecondsElapsed);
        timerTimeDisplay.textContent = displayTimeStr;
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
          return;
        } else {
          displayTimeStr = formatDuration(remaining);
          timerTimeDisplay.textContent = displayTimeStr;
        }
      }
      
      // Update dashboard mini timer text
      if (dashboardMiniTimerTime) {
        dashboardMiniTimerTime.textContent = displayTimeStr;
      }
    }, 1000);
  }

  // Pause Timer
  if (btnTimerPause) {
    btnTimerPause.addEventListener('click', pauseTimer);
  }
  
  function pauseTimer() {
    if (timerState !== 'running') return;
    timerState = 'paused';
    clearInterval(timerInterval);
    timerAccumulatedPaused += (Date.now() - timerStartTime);
    timerStateLabel.textContent = 'Paused';
    btnTimerPause.classList.add('hidden');
    btnTimerStart.classList.remove('hidden');
    
    // Hide dashboard mini timer when paused
    if (dashboardMiniTimer) {
      dashboardMiniTimer.classList.add('hidden');
    }
    
    const totalHours = (state.totalSeconds / 3600).toFixed(1);
    PlantRenderer.updateState(parseFloat(totalHours), state.health, state.isDead, false, state.settings.treeTargetHours || 333, state.targets.filter(t => !t.completed), state.settings.skyBackground || 'diurnal', state.streak || 0);
    saveActiveTimer();
  }

  // Stop and record
  if (btnTimerStop) {
    btnTimerStop.addEventListener('click', () => {
      playGong(); // Play gong on stop
      const duration = timerSecondsElapsed;
      if (duration >= 5) { // Only log if at least 5 seconds
        saveChantSession(duration, timerType);
      }
      resetTimerControls();
    });
  }

  // Reset controls
  if (btnTimerCancel) {
    btnTimerCancel.addEventListener('click', () => {
      resetTimerControls();
    });
  }

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
    
    // Reset selected target and campaign dropdowns
    if (timerPersonalSelect) timerPersonalSelect.value = '';
    if (timerCampaignSelect) timerCampaignSelect.value = '';
    
    // Hide dashboard mini timer
    if (dashboardMiniTimer) {
      dashboardMiniTimer.classList.add('hidden');
    }
    
    const totalHours = (state.totalSeconds / 3600).toFixed(1);
    PlantRenderer.updateState(parseFloat(totalHours), state.health, state.isDead, false, state.settings.treeTargetHours || 333, state.targets.filter(t => !t.completed), state.settings.skyBackground || 'diurnal', state.streak || 0);
    saveActiveTimer();
    resetTimerDisplay();
  }

  function saveChantSession(durationSeconds, method) {
    const now = new Date();
    
    // Check 24-hour daily limit
    const targetDateYMD = now.toISOString().split('T')[0];
    let alreadyChantedSecs = 0;
    state.sessions.forEach(s => {
      const sDateYMD = new Date(s.date).toISOString().split('T')[0];
      if (sDateYMD === targetDateYMD) {
        alreadyChantedSecs += s.durationSeconds;
      }
    });
    
    if (alreadyChantedSecs >= 86400) {
      alert("You have already logged 24 hours of chanting for today! This session cannot be saved.");
      return;
    }
    
    let actualDuration = durationSeconds;
    if (alreadyChantedSecs + durationSeconds > 86400) {
      actualDuration = 86400 - alreadyChantedSecs;
      const cappedMins = Math.floor(actualDuration / 60);
      alert(`Daily limit reached! Saving only the remaining ${cappedMins} minutes for today.`);
    }
    
    if (actualDuration <= 0) return;
    
    const personalTargetId = timerPersonalSelect.value || null;
    const campaignId = timerCampaignSelect.value || null;
    
    if (personalTargetId) {
      accumulateTimeToTarget(personalTargetId, actualDuration);
    }
    
    if (campaignId) {
      const currentUser = MockFirebase.auth.getCurrentUser();
      if (currentUser) {
        const targets = MockFirebase.db.getCampaignTargets();
        const contributions = MockFirebase.db.getCampaignContributions();
        const targetHours = targets[campaignId] || 100;
        
        const preSeconds = contributions
          .filter(item => item.campaignId === campaignId)
          .reduce((sum, item) => sum + item.durationSeconds, 0);
        const preHours = preSeconds / 3600;
        
        MockFirebase.db.addCampaignContribution(
          currentUser.email,
          currentUser.username,
          currentUser.block,
          campaignId,
          actualDuration,
          now.toISOString()
        );
        
        const postHours = preHours + (actualDuration / 3600);
        
        if (preHours < targetHours && postHours >= targetHours) {
          setTimeout(() => {
            playGong();
            alert(`🎉 VICTORY! Our collective SGI campaign has reached 100% of its target! Thank you for your victorious chanting! 🌸`);
          }, 600);
        }
      }
    }
    
    // 1. Log Session Detail
    const session = {
      id: Date.now().toString(),
      date: now.toISOString(),
      durationSeconds: actualDuration,
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
    state.totalSeconds += actualDuration;
    
    if (state.isDead) {
      // Dead plant mode: check revival progress
      const dateTodayStr = now.toISOString().split('T')[0];
      updateRevivalProgress(dateTodayStr, actualDuration);
    } else {
      // Normal healthy mode
      state.health = 100; // Recover full hydration
      state.lastChantedDate = now.toISOString();
    }
    
    // 3. Streak Engine
    calculateStreak();
    
    saveState();
    
    // Check for newly unlocked achievements
    const unlockedAny = checkNewAchievements();
    if (!unlockedAny) {
      // Trigger encouragement custom modal if no achievements unlocked
      showEncouragementPopUp();
    }
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
  if (logHours) {
    logHours.addEventListener('input', () => {
      const val = parseInt(logHours.value || 0);
      if (val >= 24) {
        logHours.value = 24;
        if (logMinutes) {
          logMinutes.value = 0;
          logMinutes.disabled = true;
          logMinutes.title = 'Minutes are disabled when hours is 24';
        }
      } else {
        if (logMinutes) {
          logMinutes.disabled = false;
          logMinutes.title = '';
        }
      }
    });
  }

  // Cap minutes input to 60 manually
  if (logMinutes) {
    logMinutes.addEventListener('input', () => {
      const val = parseInt(logMinutes.value || 0);
      if (val > 60) {
        logMinutes.value = 60;
      }
    });
  }

  // --- Manual Log Submission ---
  if (manualLogForm) {
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
    
    // Construct manual date using local time parts and current hours/minutes/seconds
    const now = new Date();
    
    // Prevent future date logs
    const lYear = now.getFullYear();
    const lMonth = String(now.getMonth() + 1).padStart(2, '0');
    const lDay = String(now.getDate()).padStart(2, '0');
    const todayLocalYMD = `${lYear}-${lMonth}-${lDay}`;
    
    if (logDateInput.value > todayLocalYMD) {
      alert("You cannot log chanting sessions for a future date!");
      return;
    }
    
    const dateParts = logDateInput.value.split('-');
    const selectedDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2])
    );
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    
    const sessionDateString = selectedDate.toISOString();
    if (sessionDateString === "Invalid Date" || isNaN(selectedDate.getTime())) {
      alert("Invalid date selected!");
      return;
    }
    
    // Calculate total chanting already logged for the selected day
    const targetDateYMD = selectedDate.toISOString().split('T')[0];
    let alreadyChantedSecs = 0;
    state.sessions.forEach(s => {
      const sDateYMD = new Date(s.date).toISOString().split('T')[0];
      if (sDateYMD === targetDateYMD) {
        alreadyChantedSecs += s.durationSeconds;
      }
    });
    
    if (alreadyChantedSecs >= 86400) {
      alert("You have already logged 24 hours of chanting for this day!");
      return;
    }
    
    if (alreadyChantedSecs + totalSecs > 86400) {
      const remainingSecs = 86400 - alreadyChantedSecs;
      const remHrs = Math.floor(remainingSecs / 3600);
      const remMins = Math.floor((remainingSecs % 3600) / 60);
      alert(`Adding this session would exceed the 24-hour daily limit. You have already logged ${Math.floor(alreadyChantedSecs / 3600)}h ${Math.floor((alreadyChantedSecs % 3600) / 60)}m, so you can only add up to ${remHrs}h ${remMins}m for this day.`);
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
        const targets = MockFirebase.db.getCampaignTargets();
        const contributions = MockFirebase.db.getCampaignContributions();
        const targetHours = targets[campaignId] || 100;
        
        const preSeconds = contributions
          .filter(item => item.campaignId === campaignId)
          .reduce((sum, item) => sum + item.durationSeconds, 0);
        const preHours = preSeconds / 3600;
        
        MockFirebase.db.addCampaignContribution(
          currentUser.email,
          currentUser.username,
          currentUser.block,
          campaignId,
          totalSecs,
          sessionDateString
        );
        
        const postHours = preHours + (totalSecs / 3600);
        
        if (preHours < targetHours && postHours >= targetHours) {
          setTimeout(() => {
            playGong();
            alert(`🎉 VICTORY! Our collective SGI campaign has reached 100% of its target! Thank you for your victorious chanting! 🌸`);
          }, 600);
        }
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
    
    // Check for newly unlocked achievements
    const unlockedAny = checkNewAchievements();
    if (!unlockedAny) {
      // Trigger encouragement custom modal if no achievements unlocked
      showEncouragementPopUp();
    }
    
    // Reset fields
    logHours.value = 0;
    logMinutes.value = 15;
    logMinutes.disabled = false;
    logMinutes.title = '';
    manualPersonalSelect.value = '';
    manualCampaignSelect.value = '';
    
    alert(`Successfully logged ${hrs}h ${mins}m!`);
    
    // Auto redirect to dashboard
    const navDashboard = document.getElementById('nav-dashboard');
    if (navDashboard) navDashboard.click();
  });
}

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
    
    // Group sessions by month (key: YYYY-MM)
    const groups = {};
    const groupOrder = []; // To keep track of month order (newest first)
    
    state.sessions.forEach(session => {
      const date = new Date(session.date);
      if (isNaN(date.getTime())) return;
      
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!groups[key]) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        groups[key] = {
          label: `${monthNames[month]} ${year}`,
          sessions: [],
          totalDuration: 0
        };
        groupOrder.push(key);
      }
      
      groups[key].sessions.push(session);
      groups[key].totalDuration += session.durationSeconds;
    });
    
    // Sort group keys in descending order (newest first)
    groupOrder.sort((a, b) => b.localeCompare(a));
    
    groupOrder.forEach((key, index) => {
      const group = groups[key];
      const section = document.createElement('div');
      section.className = 'history-month-section';
      
      // First month expanded by default, others collapsed
      if (index > 0) {
        section.classList.add('collapsed');
      }
      
      const totalHours = group.totalDuration >= 3600 ? `${Math.floor(group.totalDuration / 3600)}h ` : '';
      const totalMins = `${Math.round((group.totalDuration % 3600) / 60)}m`;
      const totalText = `Total: ${totalHours}${totalMins}`;
      
      section.innerHTML = `
        <div class="history-month-header">
          <div class="month-title">
            <span class="toggle-arrow"><i class="fa-solid fa-chevron-down"></i></span>
            <span class="month-name">${group.label}</span>
          </div>
          <div class="month-total">${totalText}</div>
        </div>
        <div class="history-month-body"></div>
      `;
      
      const header = section.querySelector('.history-month-header');
      header.addEventListener('click', () => {
        section.classList.toggle('collapsed');
      });
      
      const body = section.querySelector('.history-month-body');
      
      group.sessions.forEach(session => {
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
          <div class="log-info" style="flex-grow: 1;">
            <div class="log-time-amount">${methodIcon} ${durationText} chanted</div>
            <div class="log-date-label">${dateString}</div>
          </div>
          <div class="log-actions">
            <button class="btn-delete-log" data-id="${session.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        `;
        
        // Delete Log event handler
        item.querySelector('.btn-delete-log').addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm("Are you sure you want to delete this session? This will adjust your total chanting progress.")) {
            await deleteChantSession(id);
          }
        });
        
        body.appendChild(item);
      });
      
      logsListContainer.appendChild(section);
    });
  }



  // --- Goal Milestone Estimator ---
  function updateMilestoneEstimate() {
    const estimateText = document.getElementById('milestone-estimate-text');
    if (!estimateText) return;

    const decimalHours = state.totalSeconds / 3600;
    const remainingHours = GOAL_HOURS - decimalHours;

    if (remainingHours <= 0) {
      estimateText.textContent = "Goal achieved! Your plant is a Majestic Tree! 🌳";
      return;
    }

    // Calculate hours chattered in the last 7 days
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let secondsLastWeek = 0;
    state.sessions.forEach(s => {
      const sDate = new Date(s.date);
      if (sDate >= oneWeekAgo && sDate <= now) {
        secondsLastWeek += s.durationSeconds;
      }
    });

    const hoursLastWeek = secondsLastWeek / 3600;

    // Project target date
    if (hoursLastWeek > 0.05) {
      const weeksRemaining = remainingHours / hoursLastWeek;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + (weeksRemaining * 7));
      
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = targetDate.toLocaleDateString(undefined, options);
      
      estimateText.textContent = `Est. Tree Date: ${formattedDate} (~${hoursLastWeek.toFixed(1)}h/wk)`;
    } else {
      // Fallback: Check overall average chattered since their first record
      if (state.sessions.length > 0) {
        const dates = state.sessions.map(s => new Date(s.date).getTime());
        const firstDate = Math.min(...dates);
        const daysActive = Math.max(1, Math.ceil((now.getTime() - firstDate) / (24 * 60 * 60 * 1000)));
        const dailyRate = decimalHours / daysActive; // hours per day

        if (dailyRate > 0.01) {
          const daysRemaining = remainingHours / dailyRate;
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + daysRemaining);

          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          const formattedDate = targetDate.toLocaleDateString(undefined, options);
          const weeklyRate = dailyRate * 7;
          estimateText.textContent = `Est. Tree Date: ${formattedDate} (~${weeklyRate.toFixed(1)}h/wk overall)`;
        } else {
          estimateText.textContent = "Est. Tree Date: -- (active chanting needed)";
        }
      } else {
        estimateText.textContent = "Est. Tree Date: -- (chant to calculate)";
      }
    }
  }



  // --- Sky Theme Switcher ---
  function updateSkyTheme() {
    const bgSetting = (state && state.settings && state.settings.skyBackground) ? state.settings.skyBackground : 'diurnal';
    let phase = 'day';
    
    if (bgSetting === 'diurnal') {
      const nowHour = new Date().getHours();
      if (nowHour >= 5 && nowHour < 9) {
        phase = 'sunrise';
      } else if (nowHour >= 9 && nowHour < 17) {
        phase = 'day';
      } else if (nowHour >= 17 && nowHour < 20) {
        phase = 'sunset';
      } else {
        phase = 'night';
      }
    } else {
      phase = bgSetting; // 'rainforest', 'cherryblossoms', 'mountains', 'beach', 'bustlingcity'
    }
    
    document.body.classList.remove(
      'diurnal-sunrise', 'diurnal-day', 'diurnal-sunset', 'diurnal-night',
      'diurnal-rainforest', 'diurnal-cherryblossoms', 'diurnal-mountains', 'diurnal-beach', 'diurnal-bustlingcity'
    );
    document.body.classList.add('diurnal-' + phase);
  }

  async function deleteChantSession(id) {
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
          // Delete matching contribution in Firestore and local mock
          await MockFirebase.db.deleteCampaignContribution(
            currentUser.email,
            campaignId,
            deleted.date,
            deleted.durationSeconds
          );
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
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async () => {
      if (confirm("WARNING: This will delete ALL your chanting history and reset your plant to a seed. Proceed?")) {
        const currentUser = MockFirebase.auth.getCurrentUser();
        if (currentUser) {
          await MockFirebase.db.clearUserCampaignContributions(currentUser.email);
        }
        
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
  }

  function updateHistoryAnalytics() {
    analyticSessions.textContent = state.sessions.length;
    analyticStreak.textContent = `${state.streak} days`;
    
    if (state.sessions.length === 0) {
      analyticAvgSession.textContent = '0m';
      return;
    }
    
    const sum = state.sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const avgMins = Math.round((sum / state.sessions.length) / 60);
    if (avgMins >= 60) {
      const h = Math.floor(avgMins / 60);
      const m = avgMins % 60;
      analyticAvgSession.textContent = `${h}h ${m}m`;
    } else {
      analyticAvgSession.textContent = `${avgMins}m`;
    }
  }

  // --- Setting Configurations ---
  if (settingMorningReminder) {
    settingMorningReminder.addEventListener('change', (e) => {
      state.settings.morningReminder = e.target.checked;
      saveState();
    });
  }

  if (settingEveningReminder) {
    settingEveningReminder.addEventListener('change', (e) => {
      state.settings.eveningReminder = e.target.checked;
      saveState();
    });
  }

  if (settingTreeTargetHours) {
    settingTreeTargetHours.addEventListener('change', (e) => {
      const val = Math.max(1, parseInt(e.target.value) || 333);
      state.settings.treeTargetHours = val;
      saveState();
      updateUI();
    });
  }

  if (btnTestGong) {
    btnTestGong.addEventListener('click', () => {
      playGong();
    });
  }

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

  // Sky Customizer Swapper
  const skyButtons = document.querySelectorAll('.sky-btn');
  skyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const skyBg = btn.getAttribute('data-sky');
      if (!state.settings) {
        state.settings = { morningReminder: true, eveningReminder: true, potStyle: 'clay', treeTargetHours: 333 };
      }
      state.settings.skyBackground = skyBg;
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

  // --- Reminder Check Mechanism (12:00 PM and 9:00 PM Checks & Calendar Meeting Checks) ---
  function runNotificationsChecks() {
    const now = new Date();
    const hours = now.getHours();
    
    // Format check string so we don't repeat notifications within the same hour
    const dateTodayStr = now.toISOString().split('T')[0];
    
    // Check Morning Reminder (12:00 PM / Noon onwards)
    if (state.settings.morningReminder && hours >= 12 && hours < 21) {
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

    // Check Evening Reminder (9:00 PM / 21:00 onwards)
    if (state.settings.eveningReminder && hours >= 21) {
      const alreadyChecked = localStorage.getItem(`evening_check_${dateTodayStr}`);
      if (!alreadyChecked) {
        // Has user chanted since noon (12:00 PM) today?
        const chantedSinceNoon = state.sessions.some(s => {
          const sDate = new Date(s.date);
          return sDate.toISOString().split('T')[0] === dateTodayStr && sDate.getHours() >= 12;
        });
        
        if (!chantedSinceNoon) {
          triggerNotification("Evening Chant Reminder", "It's evening! Water your plant with evening chanting to keep it healthy.");
        }
        localStorage.setItem(`evening_check_${dateTodayStr}`, 'done');
      }
    }

    // Check Calendar Meeting Reminders (Eve of meeting at 7:00 PM / 19:00 onwards)
    if (hours >= 19) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const event = CALENDAR_ACTIVITIES_2026[tomorrowStr];
      if (event && event.type === 'meeting') {
        const alreadyChecked = localStorage.getItem(`event_check_${tomorrowStr}`);
        if (!alreadyChecked) {
          triggerNotification(`Meeting Reminder: ${event.title}`, `Reminder: You have a scheduled ${event.title} tomorrow! 📅`);
          localStorage.setItem(`event_check_${tomorrowStr}`, 'done');
        }
      }
    }
  }

  // (triggerNotification is defined in the upper scope)




  // --- Targets & Determinations Manager ---
  
  // Toggle form input hours & deadline visibility
  if (targetTypeSelect) {
    targetTypeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'hours') {
        if (targetHoursInputGroup) targetHoursInputGroup.classList.remove('hidden');
        if (targetDeadlineInputGroup) targetDeadlineInputGroup.classList.remove('hidden');
      } else {
        if (targetHoursInputGroup) targetHoursInputGroup.classList.add('hidden');
        if (targetDeadlineInputGroup) targetDeadlineInputGroup.classList.add('hidden');
      }
    });
  }

  // Submit target form
  if (addTargetForm) {
    addTargetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = targetText.value.trim();
    const type = targetTypeSelect.value;
    const hours = parseInt(targetHoursInput.value || 10);
    const deadlineVal = targetDeadlineInput ? targetDeadlineInput.value : '';
    
    if (!text) return;
    
    // Prevent setting a target deadline in the past
    if (type === 'hours' && deadlineVal) {
      const now = new Date();
      const lYear = now.getFullYear();
      const lMonth = String(now.getMonth() + 1).padStart(2, '0');
      const lDay = String(now.getDate()).padStart(2, '0');
      const todayLocalYMD = `${lYear}-${lMonth}-${lDay}`;
      
      if (deadlineVal < todayLocalYMD) {
        alert("The target deadline cannot be in the past!");
        return;
      }
    }
    
    const newTarget = {
      id: Date.now().toString(),
      text: text,
      type: type,
      targetSeconds: type === 'hours' ? hours * 3600 : 0,
      accumulatedSeconds: 0,
      completed: false,
      deadline: type === 'hours' && deadlineVal ? deadlineVal : null
    };
    
    state.targets.push(newTarget);
    saveState();
    checkNewAchievements();
    
    // Reset form
    targetText.value = '';
    targetTypeSelect.value = 'none';
    if (targetHoursInputGroup) targetHoursInputGroup.classList.add('hidden');
    if (targetDeadlineInputGroup) targetDeadlineInputGroup.classList.add('hidden');
    if (targetDeadlineInput) targetDeadlineInput.value = '';
    
    renderTargetsList();
    alert("New determination created successfully!");
  });
  }

  // Accumulate time to target
  function accumulateTimeToTarget(targetId, seconds) {
    const target = state.targets.find(t => t.id === targetId);
    if (target && !target.completed) {
      target.accumulatedSeconds += seconds;
      
      // Auto-complete check
      if (target.type === 'hours' && target.accumulatedSeconds >= target.targetSeconds) {
        target.completed = true;
        alert(`Congratulations! You have completed your target: "${target.text}"! 🎉`);
        checkNewAchievements();
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
    const campaignDates = MockFirebase.db.getCampaignDates();
    
    const campaignNames = MockFirebase.db.getCampaignNames();
    const customCampaigns = MockFirebase.db.getCustomCampaigns();
    const allCampaignIds = [...customCampaigns];
    
    const allCampaigns = allCampaignIds.map(id => {
      const name = campaignNames[id] || id;
      return {
        id: id,
        name: name.endsWith("Campaign") ? name : name + " Campaign"
      };
    });
    
    const now = new Date();
    const timerTime = now.getTime();
    
    let manualTime = now.getTime();
    const logDateVal = logDateInput ? logDateInput.value : '';
    if (logDateVal) {
      const logD = new Date(logDateVal + 'T12:00:00');
      if (!isNaN(logD.getTime())) {
        manualTime = logD.getTime();
      }
    }
    
    // 1. Filter campaigns active today for the Timer
    const timerCampaigns = allCampaigns.filter(c => {
      if (!activeList.includes(c.id)) return false;
      const dates = campaignDates[c.id];
      if (dates && dates.start && dates.end) {
        const startT = new Date(dates.start + 'T00:00:00').getTime();
        const endT = new Date(dates.end + 'T23:59:59').getTime();
        return timerTime >= startT && timerTime <= endT;
      }
      return true;
    });
    
    // 2. Filter campaigns active on the selected manual log date for the Manual Log
    const manualCampaigns = allCampaigns.filter(c => {
      if (!activeList.includes(c.id)) return false;
      const dates = campaignDates[c.id];
      if (dates && dates.start && dates.end) {
        const startT = new Date(dates.start + 'T00:00:00').getTime();
        const endT = new Date(dates.end + 'T23:59:59').getTime();
        return manualTime >= startT && manualTime <= endT;
      }
      return true;
    });
    
    timerCampaigns.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.name;
      timerCampaignSelect.appendChild(option);
    });
    
    manualCampaigns.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.name;
      manualCampaignSelect.appendChild(option);
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
    
    updateTargetPaceHint('timer-personal-select', 'timer-target-pace-tip');
    updateTargetPaceHint('manual-personal-select', 'manual-target-pace-tip');
  }

  function updateTargetPaceHint(selectId, tipId) {
    const select = document.getElementById(selectId);
    const tip = document.getElementById(tipId);
    if (!select || !tip) return;
    
    const targetId = select.value;
    if (!targetId) {
      tip.style.display = 'none';
      tip.textContent = '';
      return;
    }
    
    const t = state.targets.find(item => item.id === targetId);
    if (!t || t.type !== 'hours') {
      tip.style.display = 'none';
      tip.textContent = '';
      return;
    }
    
    if (t.deadline) {
      const deadlineDate = new Date(t.deadline + 'T23:59:59');
      const now = new Date();
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        const remainingHours = Math.max(0, (t.targetSeconds - t.accumulatedSeconds) / 3600);
        const minutesNeeded = Math.round((remainingHours * 60) / diffDays);
        
        if (remainingHours <= 0) {
          tip.style.display = 'block';
          tip.style.color = '#4caf50';
          tip.innerHTML = `<i class="fa-solid fa-check"></i> Goal reached!`;
        } else if (minutesNeeded > 1440) {
          tip.style.display = 'block';
          tip.style.color = 'var(--accent-danger)';
          tip.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Requires >24h/day`;
        } else if (minutesNeeded > 0) {
          const formatMins = minutesNeeded >= 60 ? `${Math.floor(minutesNeeded / 60)}h ${minutesNeeded % 60}m` : `${minutesNeeded}m`;
          
          const todayStr = new Date().toISOString().split('T')[0];
          const chantedTodaySeconds = state.sessions
            .filter(s => (s.personalTargetId === t.id || s.targetId === t.id) && s.date.split('T')[0] === todayStr)
            .reduce((sum, s) => sum + s.durationSeconds, 0);
          const chantedTodayMinutes = Math.round(chantedTodaySeconds / 60);
          const remainingMinutesToday = Math.max(0, minutesNeeded - chantedTodayMinutes);
          
          tip.style.display = 'block';
          tip.style.color = 'var(--primary)';
          if (remainingMinutesToday <= 0) {
            tip.innerHTML = `<i class="fa-solid fa-circle-check"></i> Today's target (${formatMins}) met! 🎉`;
          } else {
            tip.innerHTML = `<i class="fa-regular fa-clock"></i> Target: ${formatMins}/day (${remainingMinutesToday}m left today)`;
          }
        } else {
          tip.style.display = 'none';
        }
      } else {
        const remainingHours = Math.max(0, (t.targetSeconds - t.accumulatedSeconds) / 3600);
        tip.style.display = 'block';
        if (remainingHours <= 0) {
          tip.style.color = '#4caf50';
          tip.innerHTML = `<i class="fa-solid fa-check"></i> Completed!`;
        } else {
          tip.style.color = 'var(--accent-danger)';
          tip.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Deadline passed! (${remainingHours.toFixed(1)}h left)`;
        }
      }
    } else {
      tip.style.display = 'block';
      tip.style.color = 'var(--text-muted)';
      
      const createdTime = parseInt(t.id);
      const daysElapsed = Math.max(1, Math.ceil((Date.now() - createdTime) / (24 * 60 * 60 * 1000)));
      const averageSecondsPerDay = t.accumulatedSeconds / daysElapsed;
      const avgMinutesPerDay = Math.round(averageSecondsPerDay / 60);
      let avgText = avgMinutesPerDay >= 60 ? `${Math.floor(avgMinutesPerDay / 60)}h ${avgMinutesPerDay % 60}m/day` : `${avgMinutesPerDay}m/day`;
      
      tip.innerHTML = `<i class="fa-solid fa-circle-info"></i> Pace: ${avgText} (No deadline set)`;
    }
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
        let plannerText = "";
        
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
          
          // Calculate average rate
          const createdTime = parseInt(t.id);
          const daysElapsed = Math.max(1, Math.ceil((Date.now() - createdTime) / (24 * 60 * 60 * 1000)));
          const averageSecondsPerDay = t.accumulatedSeconds / daysElapsed;
          const avgMinutesPerDay = Math.round(averageSecondsPerDay / 60);
          
          let avgText = "";
          if (avgMinutesPerDay >= 60) {
            const h = Math.floor(avgMinutesPerDay / 60);
            const m = avgMinutesPerDay % 60;
            avgText = `${h}h ${m}m/day`;
          } else {
            avgText = `${avgMinutesPerDay}m/day`;
          }
          
          // Calculate estimated completion
          let estCompletionText = "Est. Completion: Not started yet";
          if (averageSecondsPerDay > 0) {
            const remainingSeconds = Math.max(0, t.targetSeconds - t.accumulatedSeconds);
            if (remainingSeconds <= 0) {
              estCompletionText = "Goal achieved!";
            } else {
              const daysRemaining = Math.ceil(remainingSeconds / averageSecondsPerDay);
              const estCompletionDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
              const estDateString = estCompletionDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              estCompletionText = `Est. Completion: <strong>${estDateString}</strong> at current pace (${avgText})`;
            }
          }
          
          let paceBadge = "";
          if (t.deadline) {
            const deadlineDate = new Date(t.deadline + 'T23:59:59');
            const now = new Date();
            const diffMs = deadlineDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
              const remainingHours = Math.max(0, (t.targetSeconds - t.accumulatedSeconds) / 3600);
              const minutesNeeded = Math.round((remainingHours * 60) / diffDays);
              
              if (remainingHours <= 0) {
                paceBadge = `
                  <div style="background: rgba(76,175,80,0.08); border: 1px solid rgba(76,175,80,0.2); color: #2e7d32; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-top: 6px;">
                    <i class="fa-solid fa-circle-check"></i> Goal reached! Completed in time!
                  </div>
                `;
              } else if (minutesNeeded > 1440) {
                paceBadge = `
                  <div style="background: rgba(217,83,79,0.08); border: 1px solid rgba(217,83,79,0.2); color: var(--accent-danger); padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-top: 6px;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Requires > 24 hours/day!
                  </div>
                `;
              } else if (minutesNeeded > 0) {
                const formatMins = minutesNeeded >= 60 ? `${Math.floor(minutesNeeded / 60)}h ${minutesNeeded % 60}m` : `${minutesNeeded}m`;
                paceBadge = `
                  <div style="background: var(--primary-light); border: 1px solid rgba(var(--primary-rgb), 0.2); color: var(--primary); padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-top: 6px; width: 100%;">
                    <i class="fa-regular fa-clock"></i> Chant <strong style="color:var(--text-main); font-weight:700; margin-left: 2px; margin-right: 2px;">${formatMins}/day</strong> to complete in time (by ${t.deadline})
                  </div>
                `;
              }
            } else {
              const remainingHours = Math.max(0, (t.targetSeconds - t.accumulatedSeconds) / 3600);
              if (remainingHours <= 0) {
                paceBadge = `
                  <div style="background: rgba(76,175,80,0.08); border: 1px solid rgba(76,175,80,0.2); color: #2e7d32; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-top: 6px;">
                    <i class="fa-solid fa-circle-check"></i> Completed in time!
                  </div>
                `;
              } else {
                paceBadge = `
                  <div style="background: rgba(217,83,79,0.08); border: 1px solid rgba(217,83,79,0.2); color: var(--accent-danger); padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-top: 6px;">
                    <i class="fa-solid fa-circle-exclamation"></i> Deadline passed! (${remainingHours.toFixed(1)}h left)
                  </div>
                `;
              }
            }
          } else {
            paceBadge = `
              <div style="background: var(--bg-card-header); border: 1px solid var(--border-color); color: var(--text-muted); padding: 6px 10px; border-radius: 8px; font-size: 11px; display: flex; align-items: center; gap: 6px; margin-top: 6px; width: 100%;">
                <i class="fa-solid fa-circle-info"></i> Set a deadline to track daily pace required to complete in time.
              </div>
            `;
          }
          
          plannerText = `
            <div class="target-stats-row" style="display:flex; flex-direction:column; gap:4px; margin-top:6px; font-size:11px; border-top:1px dashed rgba(0,0,0,0.05); padding-top:6px;">
              <span class="est-completion-text" style="color:var(--text-muted); margin-bottom: 2px;"><i class="fa-solid fa-chart-line" style="margin-right:4px;"></i> ${estCompletionText}</span>
              ${paceBadge}
            </div>
          `;
        }
        
        const isEditing = (editingTargetId === t.id);
        item.style.flexDirection = 'column';
        item.style.alignItems = 'stretch';
        item.style.gap = '0';
        
        if (isEditing) {
          item.innerHTML = `
            <div class="edit-target-form" style="display:flex; flex-direction:column; gap:10px; width:100%; padding: 4px;">
              <!-- Goal Text -->
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:11px; font-weight:600; color:var(--text-muted); margin-bottom:4px; display:block;"><i class="fa-solid fa-bullseye"></i> Goal / Determination</label>
                <input type="text" class="edit-target-text-input" value="${t.text}" style="width: 100%; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; font-size: 13.5px; background: var(--bg-card); color: var(--text-main); font-weight: 600; outline: none; box-sizing: border-box;" placeholder="e.g. Family health..." required>
              </div>
              
              ${t.type === 'hours' ? `
                <div style="display:flex; gap:10px;">
                  <div style="flex:1;">
                    <label style="font-size:11px; font-weight:600; color:var(--text-muted); margin-bottom:4px; display:block;"><i class="fa-solid fa-clock"></i> Target Hours</label>
                    <input type="number" class="edit-target-hours-input" value="${Math.round(t.targetSeconds / 3600)}" min="1" max="10000" style="width: 100%; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; font-size: 13.5px; background: var(--bg-card); color: var(--text-main); font-weight: 600; outline: none; box-sizing: border-box;">
                  </div>
                  <div style="flex:1;">
                    <label style="font-size:11px; font-weight:600; color:var(--text-muted); margin-bottom:4px; display:block;"><i class="fa-solid fa-calendar"></i> Deadline Date</label>
                    <input type="date" class="edit-target-deadline-input" value="${t.deadline || ''}" style="width: 100%; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; font-size: 13.5px; background: var(--bg-card); color: var(--text-main); font-weight: 600; outline: none; box-sizing: border-box;">
                  </div>
                </div>
              ` : ''}
              
              <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;">
                <button class="btn btn-secondary btn-cancel-target" style="padding: 6px 12px; font-size: 12px; height:auto; margin:0; line-height:1;" data-id="${t.id}"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button class="btn btn-primary btn-save-target" style="padding: 6px 12px; font-size: 12px; height:auto; margin:0; line-height:1;" data-id="${t.id}"><i class="fa-solid fa-check"></i> Save Details</button>
              </div>
            </div>
          `;
          
          const saveBtn = item.querySelector('.btn-save-target');
          if (saveBtn) {
            saveBtn.addEventListener('click', () => {
              const textInput = item.querySelector('.edit-target-text-input');
              const newText = textInput.value.trim();
              if (!newText) {
                alert("Goal text cannot be empty!");
                return;
              }
              
              let newHours = "";
              let newDeadline = "";
              if (t.type === 'hours') {
                const hoursInput = item.querySelector('.edit-target-hours-input');
                const deadlineInput = item.querySelector('.edit-target-deadline-input');
                newHours = hoursInput.value.trim();
                newDeadline = deadlineInput.value;
              }
              
              updateTargetDetails(t.id, newText, newHours, newDeadline);
            });
          }
          const cancelBtn = item.querySelector('.btn-cancel-target');
          if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
              editingTargetId = null;
              renderTargetsList();
            });
          }
          const editInput = item.querySelector('.edit-target-text-input');
          if (editInput) {
            editInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                saveBtn.click();
              } else if (e.key === 'Escape') {
                editingTargetId = null;
                renderTargetsList();
              }
            });
            setTimeout(() => {
              editInput.focus();
              editInput.select();
            }, 50);
          }
        } else {
          const isExpanded = expandedTargetIds.has(t.id);
          
          item.innerHTML = `
            <div class="target-header" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; width:100%; padding: 4px 0; user-select: none;">
              <div style="display:flex; align-items:center; gap:8px; flex:1; min-width: 0;">
                <i class="fa-solid fa-chevron-right target-chevron" style="font-size:10px; color:var(--text-muted); transition: transform 0.2s; transform: ${isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}; flex-shrink: 0;"></i>
                <span class="target-title" style="font-weight:600; color:var(--text-main); font-size:13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.text}</span>
              </div>
              ${t.type === 'hours' ? `
                <span style="font-size:10.5px; font-weight:700; background:var(--primary-light); color:var(--primary); padding:2px 8px; border-radius:12px; margin-left:8px; flex-shrink:0;">${Math.min(100, Math.round((t.accumulatedSeconds / t.targetSeconds) * 100))}%</span>
              ` : ''}
            </div>
            
            <div class="target-expandable-content" style="display: ${isExpanded ? 'flex' : 'none'}; flex-direction:column; gap:10px; border-top:1px dashed rgba(0,0,0,0.05); margin-top:8px; padding-top:8px; width:100%;">
              <div style="display:flex; align-items:center; gap:8px;">
                <div class="target-checkbox-container" style="margin:0; flex-shrink:0;">
                  <div class="target-checkbox" title="Mark Completed">
                    <i class="fa-solid fa-check"></i>
                  </div>
                </div>
                <div class="target-content-box" style="flex:1; min-width: 0;">
                  <span class="target-progress-text" style="font-size:11.5px; color:var(--text-main); font-weight:600; display:block;">${progressText}</span>
                  ${progressBar}
                </div>
              </div>
              
              ${plannerText}
              
              <div class="target-actions" style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px; border-top:1px solid rgba(0,0,0,0.02); padding-top:6px;">
                <button class="btn btn-secondary btn-edit-target" data-id="${t.id}" style="padding:4px 10px; font-size:11px; height:auto; margin:0; line-height:1.2; display:flex; align-items:center; gap:4px; border: 1px solid var(--border-color); background:transparent; color:var(--text-main);"><i class="fa-regular fa-pen-to-square"></i> Edit Details</button>
                <button class="btn btn-secondary btn-delete-target" data-id="${t.id}" style="padding:4px 10px; font-size:11px; height:auto; margin:0; line-height:1.2; display:flex; align-items:center; gap:4px; border: 1px solid var(--border-color); background:transparent; color:var(--accent-danger);"><i class="fa-regular fa-trash-can"></i> Delete</button>
              </div>
            </div>
          `;
          
          const header = item.querySelector('.target-header');
          const content = item.querySelector('.target-expandable-content');
          const chevron = item.querySelector('.target-chevron');
          
          header.addEventListener('click', () => {
            const currentExpanded = (content.style.display === 'flex');
            if (currentExpanded) {
              content.style.display = 'none';
              chevron.style.transform = 'rotate(0deg)';
              expandedTargetIds.delete(t.id);
            } else {
              content.style.display = 'flex';
              chevron.style.transform = 'rotate(90deg)';
              expandedTargetIds.add(t.id);
            }
          });
          
          const editBtnEl = item.querySelector('.btn-edit-target');
          if (editBtnEl) {
            editBtnEl.addEventListener('mouseenter', () => { editBtnEl.style.background = 'var(--primary-light)'; editBtnEl.style.color = 'var(--primary)'; });
            editBtnEl.addEventListener('mouseleave', () => { editBtnEl.style.background = 'transparent'; editBtnEl.style.color = 'var(--text-main)'; });
            editBtnEl.addEventListener('click', (e) => {
              e.stopPropagation();
              editingTargetId = t.id;
              renderTargetsList();
            });
          }
          const deleteBtnEl = item.querySelector('.btn-delete-target');
          if (deleteBtnEl) {
            deleteBtnEl.addEventListener('mouseenter', () => { deleteBtnEl.style.background = 'rgba(217,83,79,0.08)'; });
            deleteBtnEl.addEventListener('mouseleave', () => { deleteBtnEl.style.background = 'transparent'; });
            deleteBtnEl.addEventListener('click', (e) => {
              e.stopPropagation();
              deleteTarget(t.id);
            });
          }
          const checkbox = item.querySelector('.target-checkbox');
          if (checkbox) {
            checkbox.addEventListener('click', (e) => {
              e.stopPropagation();
              toggleTargetCompleted(t.id);
            });
          }
        }
        
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
        
        const checkbox = item.querySelector('.target-checkbox');
        if (checkbox) {
          checkbox.addEventListener('click', () => {
            toggleTargetCompleted(t.id);
          });
        }
        
        const deleteBtn = item.querySelector('.btn-delete-target');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            deleteTarget(t.id);
          });
        }
        
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
      if (target.completed) {
        const unlockedAny = checkNewAchievements();
        if (!unlockedAny) {
          showEncouragementPopUp("Victory achieved on your determination! Your completed targets can be seen below.", "Congratulations on the Victory! 🏆");
        }
      }
    }
  }

  function deleteTarget(id) {
    if (confirm("Are you sure you want to delete this determination? This will remove it from your records.")) {
      state.targets = state.targets.filter(t => t.id !== id);
      saveState();
      renderTargetsList();
    }
  }

  function updateTargetDetails(id, newText, newHours, newDeadline) {
    const target = state.targets.find(t => t.id === id);
    if (target) {
      target.text = newText;
      if (target.type === 'hours') {
        const hrs = parseInt(newHours);
        if (!isNaN(hrs) && hrs >= 1) {
          target.targetSeconds = hrs * 3600;
        }
        
        if (newDeadline) {
          const now = new Date();
          const lYear = now.getFullYear();
          const lMonth = String(now.getMonth() + 1).padStart(2, '0');
          const lDay = String(now.getDate()).padStart(2, '0');
          const todayLocalYMD = `${lYear}-${lMonth}-${lDay}`;
          
          if (newDeadline < todayLocalYMD) {
            alert("The target deadline cannot be in the past!");
            return;
          }
          target.deadline = newDeadline;
        } else {
          target.deadline = null;
        }
      }
      saveState();
      editingTargetId = null;
      renderTargetsList();
      populateTargetDropdowns();
    }
  }

  // Toggle completed targets list collapse
  if (btnToggleCompletedTargets) {
    btnToggleCompletedTargets.addEventListener('click', () => {
      if (completedTargetsCard) completedTargetsCard.classList.toggle('open');
      if (completedTargetsList) completedTargetsList.classList.toggle('collapsed');
    });
  }


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
    
    // 6. Campaign Periods (Dynamic)
    const activeCampaignsList = MockFirebase.db.getActiveCampaigns();
    const campaignDatesMap = MockFirebase.db.getCampaignDates();
    const targetDateMidnight = new Date(dateStr + 'T00:00:00').getTime();
    
    const campaignsConfig = [
      { id: 'youth_division', name: "Youth Division" },
      { id: 'may_3rd', name: "May 3rd" },
      { id: 'mens_division', name: "Men's Division" },
      { id: 'womens_division', name: "Women's Division" },
      { id: 'july_3rd', name: "July 3rd" },
      { id: 'november_18th', name: "November 18th" }
    ];
    
    let isCampaignPeriod = false;
    let activeCampaignNames = [];
    
    activeCampaignsList.forEach(cid => {
      const dates = campaignDatesMap[cid];
      if (dates && dates.start && dates.end) {
        const startT = new Date(dates.start + 'T00:00:00').getTime();
        const endT = new Date(dates.end + 'T23:59:59').getTime();
        if (targetDateMidnight >= startT && targetDateMidnight <= endT) {
          isCampaignPeriod = true;
          const meta = campaignsConfig.find(m => m.id === cid);
          if (meta) {
            activeCampaignNames.push(meta.name);
          }
        }
      }
    });
    
    if (isCampaignPeriod) {
      const namesStr = activeCampaignNames.join(" & ");
      events.push({
        title: namesStr ? `SGI Campaign (${namesStr})` : "SGI Campaign Period",
        desc: "Block chanting campaigns are active. Log your hours to help grow our collective garden!",
        type: "campaign",
        time: "Ongoing"
      });
    }
    
    // Ramadan & Vacations in 2026 (Static Holiday Highlights)
    if (year === 2026) {
      const dTime = date.getTime();
      // Ramadan: Feb 18 - Mar 19
      const feb18 = new Date("2026-02-18T00:00:00").getTime();
      const mar19 = new Date("2026-03-19T23:59:59").getTime();
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
      
      // Check if user chanted on this day
      const hasChanted = state.sessions.some(s => {
        const sDate = new Date(s.date);
        const matchStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
        return matchStr === dateStr;
      });
      
      if (hasChanted) {
        cell.classList.add('chanted');
        const leaf = document.createElement('i');
        leaf.className = 'fa-solid fa-leaf calendar-leaf-icon';
        cell.appendChild(leaf);
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
    
    // Get chanting sessions on this day
    const daySessions = state.sessions.filter(s => {
      const sDate = new Date(s.date);
      const matchStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
      return matchStr === selectedDateStr;
    });
    
    eventsList.innerHTML = '';
    
    if (events.length === 0 && daySessions.length === 0) {
      eventsList.innerHTML = `
        <div class="empty-state" style="padding: 10px;">
          <i class="fa-regular fa-calendar" style="font-size:24px; color:var(--text-muted); margin-bottom: 6px;"></i>
          <p style="font-size:12px; color:var(--text-muted);">No activities scheduled for this day.</p>
        </div>
      `;
      return;
    }
    
    // Render schedule events
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

    // Render chanting sessions
    daySessions.forEach((s, idx) => {
      const div = document.createElement('div');
      div.className = 'event-item chanting';
      
      const sh = Math.floor(s.durationSeconds / 3600);
      const sm = Math.round((s.durationSeconds % 3600) / 60);
      const durationText = sh > 0 ? `${sh}h ${sm}m` : `${sm}m`;
      const timeStr = new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      div.innerHTML = `
        <span class="event-time-badge" style="background-color: var(--primary-light); color: var(--primary); font-weight: bold; display: flex; align-items: center; justify-content: center;">
          <i class="fa-solid fa-leaf"></i>
        </span>
        <div class="event-details">
          <span class="event-title">Daimoku Chanted</span>
          <span class="event-desc">Logged session: <strong>${durationText}</strong> at ${timeStr}</span>
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


  // --- Fireworks Particle Engine ---
  let fireworksInterval = null;
  let fireworksCanvas = null;
  let fireworksCtx = null;
  let fireworksParticles = [];
  let fireworksRockets = [];
  
  function initFireworks(canvas) {
    fireworksCanvas = canvas;
    if (!fireworksCanvas) return;
    fireworksCtx = fireworksCanvas.getContext('2d');
    fireworksParticles = [];
    fireworksRockets = [];
    
    // Set resolution to match physical display dimensions
    const rect = fireworksCanvas.getBoundingClientRect();
    fireworksCanvas.width = rect.width || 320;
    fireworksCanvas.height = rect.height || 260;
    
    if (fireworksInterval) clearInterval(fireworksInterval);
    fireworksInterval = setInterval(updateAndDrawFireworks, 1000 / 60);
  }
  
  function stopFireworks() {
    if (fireworksInterval) {
      clearInterval(fireworksInterval);
      fireworksInterval = null;
    }
    if (fireworksCtx && fireworksCanvas) {
      fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    }
    fireworksCanvas = null;
    fireworksCtx = null;
  }
  
  function spawnFireworkRocket() {
    if (!fireworksCanvas) return;
    const w = fireworksCanvas.width;
    const h = fireworksCanvas.height;
    
    // Start at bottom, fly up to random height in top portion
    const rocket = {
      x: w * 0.2 + Math.random() * (w * 0.6),
      y: h,
      tx: w * 0.15 + Math.random() * (w * 0.7),
      ty: h * 0.15 + Math.random() * (h * 0.45),
      speed: 3 + Math.random() * 3,
      angle: 0,
      color: `hsl(${Math.random() * 360}, 100%, 65%)`
    };
    
    rocket.angle = Math.atan2(rocket.ty - rocket.y, rocket.tx - rocket.x);
    fireworksRockets.push(rocket);
  }
  
  function explodeFirework(x, y, color) {
    const particleCount = 45 + Math.floor(Math.random() * 25);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      fireworksParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.015,
        gravity: 0.04
      });
    }
  }
  
  function updateAndDrawFireworks() {
    if (!fireworksCanvas || !fireworksCtx) return;
    
    const w = fireworksCanvas.width;
    const h = fireworksCanvas.height;
    
    // Smooth trail clear
    fireworksCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    fireworksCtx.globalCompositeOperation = 'copy';
    fireworksCtx.fillRect(0, 0, w, h);
    fireworksCtx.globalCompositeOperation = 'source-over';
    
    // Launch logic
    if (Math.random() < 0.035 && fireworksRockets.length < 4) {
      spawnFireworkRocket();
    }
    
    // Rocket updates
    for (let i = fireworksRockets.length - 1; i >= 0; i--) {
      const r = fireworksRockets[i];
      const vx = Math.cos(r.angle) * r.speed;
      const vy = Math.sin(r.angle) * r.speed;
      
      r.x += vx;
      r.y += vy;
      
      fireworksCtx.beginPath();
      fireworksCtx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
      fireworksCtx.fillStyle = r.color;
      fireworksCtx.fill();
      
      const dx = r.tx - r.x;
      const dy = r.ty - r.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 10 || r.y < r.ty || r.y < 0) {
        explodeFirework(r.x, r.y, r.color);
        fireworksRockets.splice(i, 1);
      }
    }
    
    // Particle updates
    for (let i = fireworksParticles.length - 1; i >= 0; i--) {
      const p = fireworksParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;
      
      if (p.alpha <= 0) {
        fireworksParticles.splice(i, 1);
        continue;
      }
      
      fireworksCtx.save();
      fireworksCtx.globalAlpha = p.alpha;
      fireworksCtx.beginPath();
      fireworksCtx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      fireworksCtx.fillStyle = p.color;
      fireworksCtx.fill();
      fireworksCtx.restore();
    }
  }

  // --- Campaign Helpers for Navigation Tab Visibility ---
  function isCampaignActiveToday(campaignId) {
    const activeList = MockFirebase.db.getActiveCampaigns();
    if (!activeList.includes(campaignId)) return false;
    
    const campaignDates = MockFirebase.db.getCampaignDates();
    const dates = campaignDates[campaignId];
    if (dates && dates.start && dates.end) {
      const now = new Date();
      const startT = new Date(dates.start + 'T00:00:00').getTime();
      const endT = new Date(dates.end + 'T23:59:59').getTime();
      const todayTime = now.getTime();
      return todayTime >= startT && todayTime <= endT;
    }
    return false;
  }
  
  function hasActiveCampaignToday() {
    const activeList = MockFirebase.db.getActiveCampaigns();
    if (activeList.length === 0) return false;
    return isCampaignActiveToday(activeList[0]);
  }
  
  function updateCampaignTabVisibility() {
    const navCampaign = document.getElementById('nav-campaign');
    if (!navCampaign) return;
    
    const timerCampaignContainer = document.getElementById('timer-campaign-select-container');
    const manualCampaignContainer = document.getElementById('manual-campaign-select-container');
    
    const currentUser = MockFirebase.auth.getCurrentUser();
    if (!currentUser) {
      navCampaign.classList.add('hidden');
      if (timerCampaignContainer) timerCampaignContainer.classList.add('hidden');
      if (manualCampaignContainer) manualCampaignContainer.classList.add('hidden');
      return;
    }
    
    const activeList = MockFirebase.db.getActiveCampaigns();
    const campaignDates = MockFirebase.db.getCampaignDates();
    
    let isRunning = false;
    let activeId = null;
    if (activeList.length > 0) {
      activeId = activeList[0];
      const dates = campaignDates[activeId];
      if (dates && dates.start && dates.end) {
        const startT = new Date(dates.start + 'T00:00:00').getTime();
        const endT = new Date(dates.end + 'T23:59:59').getTime();
        const now = Date.now();
        if (now >= startT && now <= endT) {
          isRunning = true;
        }
      }
    }
    
    if (isRunning) {
      navCampaign.classList.remove('hidden');
      if (timerCampaignContainer) timerCampaignContainer.classList.remove('hidden');
      if (manualCampaignContainer) manualCampaignContainer.classList.remove('hidden');
      triggerCampaignAnnouncement(activeId);
    } else {
      navCampaign.classList.add('hidden');
      if (timerCampaignContainer) timerCampaignContainer.classList.add('hidden');
      if (manualCampaignContainer) manualCampaignContainer.classList.add('hidden');
      
      // Route user away if they are currently on the hidden campaign view
      const viewCampaign = document.getElementById('view-campaign');
      if (viewCampaign && viewCampaign.classList.contains('active')) {
        const navDashboard = document.getElementById('nav-dashboard');
        if (navDashboard) {
          navDashboard.click();
        }
      }
    }
  }

  function triggerCampaignAnnouncement(campaignId) {
    const key = `daimoku_grow_seen_campaign_${campaignId}`;
    const alreadySeen = localStorage.getItem(key);
    if (alreadySeen) return;

    const campaignNames = MockFirebase.db.getCampaignNames();
    const campaignDates = MockFirebase.db.getCampaignDates();
    const campaignTargetsMap = MockFirebase.db.getCampaignTargets();
    
    const name = campaignNames[campaignId] || "New Campaign";
    const dates = campaignDates[campaignId] || { start: 'TBD', end: 'TBD' };
    const target = campaignTargetsMap[campaignId] || 0;
    
    const modal = document.getElementById('campaign-announcement-modal');
    const titleEl = document.getElementById('campaign-announce-title');
    const durationEl = document.getElementById('campaign-announce-duration');
    const targetEl = document.getElementById('campaign-announce-target');
    
    if (modal && titleEl && durationEl && targetEl) {
      titleEl.textContent = name;
      durationEl.textContent = `${dates.start} to ${dates.end}`;
      targetEl.textContent = `${target} hours`;
      
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      
      const closeBtn = document.getElementById('btn-close-campaign-announce');
      if (closeBtn) {
        closeBtn.onclick = () => {
          modal.style.display = 'none';
          modal.classList.add('hidden');
          localStorage.setItem(key, 'true');
        };
      }
    }
  }

  // --- Campaign Canvas Animation Loops ---
  const campaignLoops = {};

  function initCampaignBucketCanvas(canvasId, progressPercent, blockSummaries) {
    // Run after a tiny timeout to ensure element exists in DOM
    setTimeout(() => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      
      if (campaignLoops[canvasId]) {
        cancelAnimationFrame(campaignLoops[canvasId]);
      }
      
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || 160;
      const h = rect.height || 220;
      canvas.width = w;
      canvas.height = h;
      
      const bubbles = [];
      const maxBubbles = 15;
      for (let i = 0; i < maxBubbles; i++) {
        bubbles.push({
          x: Math.random() * (w - 20) + 10,
          y: h - Math.random() * (h * (progressPercent / 100)),
          r: 1.0 + Math.random() * 2.2,
          speedY: 0.35 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2
        });
      }
      
      let localWindTime = 0;
      
      function tick() {
        if (!document.getElementById(canvasId)) {
          delete campaignLoops[canvasId];
          return;
        }
        
        localWindTime += 0.035;
        ctx.clearRect(0, 0, w, h);
        
        // Background soft inner glow
        const bgGrad = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w);
        bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
        bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        const totalSeconds = blockSummaries.reduce((sum, b) => sum + b.seconds, 0);
        const fillHeight = h * (progressPercent / 100);
        
        if (fillHeight > 0) {
          let currentBaseY = h;
          const blocksOrder = ['Harmony', 'Faith', 'Courage', 'Compassion', 'Wisdom'];
          
          blocksOrder.forEach((bName, idx) => {
            const b = blockSummaries.find(item => item.name === bName);
            if (!b || b.seconds === 0) return;
            
            const fraction = b.seconds / totalSeconds;
            const layerHeight = fillHeight * fraction;
            const targetY = currentBaseY - layerHeight;
            
            let grad = ctx.createLinearGradient(0, targetY, 0, currentBaseY);
            if (bName === 'Wisdom') {
              grad.addColorStop(0, 'rgba(255, 213, 79, 0.88)');
              grad.addColorStop(1, 'rgba(255, 179, 0, 0.94)');
            } else if (bName === 'Compassion') {
              grad.addColorStop(0, 'rgba(244, 143, 177, 0.88)');
              grad.addColorStop(1, 'rgba(216, 27, 96, 0.94)');
            } else if (bName === 'Courage') {
              grad.addColorStop(0, 'rgba(239, 83, 80, 0.88)');
              grad.addColorStop(1, 'rgba(183, 28, 28, 0.94)');
            } else if (bName === 'Faith') {
              grad.addColorStop(0, 'rgba(66, 165, 245, 0.88)');
              grad.addColorStop(1, 'rgba(13, 71, 161, 0.94)');
            } else if (bName === 'Harmony') {
              grad.addColorStop(0, 'rgba(102, 187, 106, 0.88)');
              grad.addColorStop(1, 'rgba(27, 94, 32, 0.94)');
            }
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, currentBaseY);
            for (let x = 0; x <= w; x += 10) {
              const waveHeight = 2.5 * Math.sin(x * 0.05 + localWindTime * 2.0 + idx);
              ctx.lineTo(x, targetY + waveHeight);
            }
            ctx.lineTo(w, currentBaseY);
            ctx.closePath();
            ctx.fill();
            
            currentBaseY = targetY;
          });
          
          // Draw sparkling rising bubbles
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          bubbles.forEach(p => {
            const topLimitY = h - fillHeight;
            p.y -= p.speedY;
            p.x += Math.sin(p.phase + localWindTime) * 0.12;
            
            if (p.y < topLimitY + 4) {
              p.y = h;
              p.x = Math.random() * (w - 20) + 10;
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          });
          
          // Draw sloshing transparent top surface waves
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          const topSurfaceY = h - fillHeight;
          ctx.moveTo(0, topSurfaceY);
          for (let x = 0; x <= w; x += 8) {
            const topWave = 3.5 * Math.sin(x * 0.065 + localWindTime * 2.2);
            ctx.lineTo(x, topSurfaceY + topWave);
          }
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fill();
        }
        
        // Glossy reflections
        ctx.save();
        const glossGrad = ctx.createLinearGradient(0, 0, w, 0);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        glossGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.06)');
        glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        glossGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.04)');
        glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
        ctx.fillStyle = glossGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Diagonal highlight glare
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(w * 0.12, 0);
        ctx.lineTo(w * 0.28, 0);
        ctx.lineTo(w * 0.08, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        campaignLoops[canvasId] = requestAnimationFrame(tick);
      }
      
      campaignLoops[canvasId] = requestAnimationFrame(tick);
    }, 50);
  }

  // --- Campaign View Dashboard Renderer ---
  function renderCampaignDashboard() {
    const detailsContainer = document.getElementById('campaign-view-details');
    if (!detailsContainer) return;
    
    if (!MockFirebase.db.isCampaignsLoaded() || !MockFirebase.db.isContributionsLoaded()) {
      detailsContainer.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px; text-align: center;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 36px; color: var(--primary); margin-bottom: 12px;"></i>
          <p style="font-size: 13px; color: var(--text-muted);">Syncing campaign database...</p>
        </div>
      `;
      stopFireworks();
      return;
    }
    
    const currentUser = MockFirebase.auth.getCurrentUser();
    if (!currentUser) {
      detailsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-lock"></i>
          <p>Please log in to view and participate in campaigns.</p>
        </div>
      `;
      stopFireworks();
      return;
    }
    
    const activeList = MockFirebase.db.getActiveCampaigns();
    const campaignDates = MockFirebase.db.getCampaignDates();
    const campaignNames = MockFirebase.db.getCampaignNames();
    const customCampaigns = MockFirebase.db.getCustomCampaigns();
    
    const allCampaignIds = [...customCampaigns];
    const campaigns = allCampaignIds
      .filter(id => isCampaignActiveToday(id))
      .map(id => {
        const name = campaignNames[id] || id;
        return {
          id: id,
          name: name.endsWith("Campaign") ? name : name + " Campaign",
          icon: "fa-bullhorn"
        };
      });
    
    if (campaigns.length === 0) {
      detailsContainer.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px; text-align: center;">
          <i class="fa-solid fa-bullhorn" style="font-size: 36px; color: var(--text-muted); margin-bottom: 12px; opacity: 0.5;"></i>
          <p style="font-size: 13.5px; color: var(--text-muted); font-weight: 600;">No Active Campaigns</p>
          <p style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; max-width: 280px; margin-left: auto; margin-right: auto; line-height: 1.4;">Active campaigns will appear here once activated by a block administrator in Settings.</p>
        </div>
      `;
      stopFireworks();
      return;
    }
    
    const targets = MockFirebase.db.getCampaignTargets();
    const contributions = MockFirebase.db.getCampaignContributions();
    const blocksList = ['Wisdom', 'Compassion', 'Courage', 'Faith', 'Harmony'];
    
    let htmlContent = '';
    let completedCampaignId = null;
    
    campaigns.forEach(campaign => {
      const selectedCampaignId = campaign.id;
      const campaignContribs = contributions.filter(item => item.campaignId === selectedCampaignId);
      
      const globalSeconds = campaignContribs.reduce((sum, item) => sum + item.durationSeconds, 0);
      const globalHours = globalSeconds / 3600;
      const targetHours = targets[selectedCampaignId] || 100;
      const progressPercent = Math.min(100, Math.round((globalHours / targetHours) * 100));
      
      const p1Mark = (targetHours / 4).toFixed(0);
      const p2Mark = (targetHours / 2).toFixed(0);
      const p3Mark = (3 * targetHours / 4).toFixed(0);
      const p4Mark = targetHours.toFixed(0);
      
      const dates = campaignDates[selectedCampaignId] || { start: '', end: '' };
      let periodStr = "No date set";
      if (dates.start && dates.end) {
        const startD = new Date(dates.start + 'T00:00:00');
        const endD = new Date(dates.end + 'T00:00:00');
        periodStr = `${startD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endD.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      
      const blockTotals = {};
      blocksList.forEach(b => {
        blockTotals[b] = 0;
      });
      
      campaignContribs.forEach(item => {
        if (blockTotals[item.block] !== undefined) {
          blockTotals[item.block] += item.durationSeconds;
        }
      });
      
      const blockSummaries = blocksList.map(bName => {
        const seconds = blockTotals[bName];
        const hours = seconds / 3600;
        let color = '#757575';
        if (bName === 'Wisdom') color = '#ffb300';
        else if (bName === 'Compassion') color = '#d81b60';
        else if (bName === 'Courage') color = '#b71c1c';
        else if (bName === 'Faith') color = '#0d47a1';
        else if (bName === 'Harmony') color = '#1b5e20';
        
        return {
          name: bName,
          hours: hours,
          seconds: seconds,
          color: color,
          isOwn: bName.toLowerCase() === currentUser.block.toLowerCase()
        };
      }).sort((a, b) => b.hours - a.hours);
      
      const maxBlockHours = Math.max(...blockSummaries.map(b => b.hours), 1);
      
      const personalSeconds = campaignContribs
        .filter(item => item.userEmail.toLowerCase() === currentUser.email.toLowerCase())
        .reduce((sum, item) => sum + item.durationSeconds, 0);
      const personalHours = personalSeconds / 3600;
      
      if (progressPercent >= 100 && !completedCampaignId) {
        completedCampaignId = selectedCampaignId;
      }
      
      // Calculate Est. Completion Date based on start date and daily average rate
      const now = new Date();
      let estCompletionStr = "Est. Completion Date: -- (chant to calculate)";
      
      if (globalHours >= targetHours) {
        estCompletionStr = "Goal achieved! Campaign target completed! 🎉";
      } else if (dates.start) {
        const startD = new Date(dates.start + 'T00:00:00');
        const msActive = now.getTime() - startD.getTime();
        const daysActive = Math.max(1, Math.ceil(msActive / (24 * 60 * 60 * 1000)));
        
        if (msActive < 0) {
          estCompletionStr = "Est. Completion Date: -- (campaign has not started)";
        } else {
          const dailyRate = globalHours / daysActive; // hours per day
          if (dailyRate > 0.01) {
            const daysRemaining = (targetHours - globalHours) / dailyRate;
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + daysRemaining);
            
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = targetDate.toLocaleDateString(undefined, options);
            const weeklyRate = dailyRate * 7;
            estCompletionStr = `Est. Completion Date: ${formattedDate} (~${weeklyRate.toFixed(1)}h/wk total)`;
          } else {
            estCompletionStr = "Est. Completion Date: -- (active chanting needed)";
          }
        }
      }
      
      htmlContent += `
        <div class="card campaign-view-card active-campaign-container" style="margin-bottom: 24px; padding: 20px; border: var(--border); border-radius: 16px; background: var(--bg-card);">
          <div class="campaign-title-row" style="display:flex; flex-direction:column; gap:4px; margin-bottom: 16px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="campaign-header-icon" style="font-size:20px; color:var(--primary);"><i class="fa-solid ${campaign.icon || 'fa-bullhorn'}"></i></span>
              <h3 style="margin:0; font-family:var(--font-serif); font-size:20px; color:var(--text-main);">${campaign.name}</h3>
            </div>
            <div class="campaign-period-badge" style="font-size: 11.5px; color: var(--text-muted); font-weight: 500; margin-left: 30px; margin-top: 2px;">
              <i class="fa-regular fa-calendar-days" style="margin-right: 4px;"></i> <strong>Period:</strong> ${periodStr}
            </div>
          </div>
          
          <!-- Grand Glass Bucket Visual Card -->
          <div class="grand-bucket-wrapper" style="position: relative; display: flex; justify-content: center; align-items: center; margin: 30px auto 10px auto; width: 100%; max-width: 320px;">
            <div class="grand-bucket-container" style="position: relative; width: 160px; height: 220px; margin-right: 40px;">
              <div class="grand-bucket-handle" style="position: absolute; top: -24px; left: 5px; width: 150px; height: 80px; border: 3px solid var(--text-muted); border-bottom: none; border-radius: 75px 75px 0 0; pointer-events: none; z-index: 1; opacity: 0.35;"></div>
              <div class="grand-glass-bucket" style="width: 100%; height: 100%; background: rgba(255, 255, 255, 0.03); border: 3px solid rgba(255, 255, 255, 0.28); border-top: 1.5px solid rgba(255, 255, 255, 0.5); border-radius: 8px 8px 36px 36px; position: relative; overflow: hidden; box-shadow: 0 16px 36px rgba(0,0,0,0.2), inset 0 4px 15px rgba(255,255,255,0.1), inset 0 -10px 25px rgba(0,0,0,0.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 2;">
                <!-- HTML5 Canvas liquid renderer -->
                <canvas id="campaign-bucket-canvas-${selectedCampaignId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; display: block;"></canvas>
                <div class="grand-bucket-progress-value" style="font-size: 26px; font-weight: 800; color: #ffffff; text-shadow: 0 2px 10px rgba(0,0,0,0.65), 0 0 15px rgba(255,255,255,0.25); pointer-events: none; z-index: 6; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); transition: all 0.3s ease;">${progressPercent}%</div>
              </div>
              
              <!-- Dynamic Target Markers Overlaid -->
              <div class="bucket-target-markers">
                <div class="bucket-marker-line ${globalHours >= (targetHours * 0.25) ? 'filled' : ''}" style="bottom: 25%;">
                  <span class="bucket-marker-label">${p1Mark}h (25%)</span>
                </div>
                <div class="bucket-marker-line ${globalHours >= (targetHours * 0.5) ? 'filled' : ''}" style="bottom: 50%;">
                  <span class="bucket-marker-label">${p2Mark}h (50%)</span>
                </div>
                <div class="bucket-marker-line ${globalHours >= (targetHours * 0.75) ? 'filled' : ''}" style="bottom: 75%;">
                  <span class="bucket-marker-label">${p3Mark}h (75%)</span>
                </div>
                <div class="bucket-marker-line ${globalHours >= targetHours ? 'filled' : ''}" style="bottom: 98%;">
                  <span class="bucket-marker-label">${p4Mark}h (100%)</span>
                </div>
              </div>
            </div>
            
            <!-- Fireworks Celebration Overlay Canvas -->
            <canvas id="fireworks-canvas-${selectedCampaignId}" class="fireworks-canvas"></canvas>
          </div>
          
          <div class="campaign-dates-desc" style="text-align: center; margin-top: 14px; margin-bottom: 4px;">
            <span style="font-size:13.5px; color:var(--text-main); font-weight:700;"><i class="fa-solid fa-calculator" style="color:var(--primary); margin-right:4px;"></i> Total Chanted: ${globalHours.toFixed(1)} / ${targetHours} hours</span>
          </div>
 
          <div class="campaign-est-completion" style="text-align: center; font-size: 12px; color: var(--text-muted); margin-bottom: 14px; font-weight: 500;">
            <i class="fa-regular fa-clock" style="color:var(--primary); margin-right:4px;"></i> ${estCompletionStr}
          </div>
 
          <!-- SGI Blocks Contribution Leaderboard -->
          <div class="card campaign-leaderboard-card">
            <h3 class="leaderboard-title"><i class="fa-solid fa-ranking-star"></i> SGI Blocks Leaderboard</h3>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${blockSummaries.map(b => {
                const relPercent = Math.min(100, Math.round((b.hours / maxBlockHours) * 100));
                return `
                  <div class="block-row ${b.isOwn ? 'own-block' : ''}">
                    <div class="block-meta" style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="display:flex; align-items:center; gap:8px;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${b.color}; display: inline-block;"></span>
                        <strong style="color: var(--text-main); font-size: 13px;">${b.name} Block</strong>
                        ${b.isOwn ? '<span class="block-badge" style="background: rgba(38,166,154,0.15); color: #26a69a; font-size: 9px; padding: 2px 6px; border-radius: 10px; font-weight: 700;">Your Block</span>' : ''}
                      </span>
                      <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${b.hours.toFixed(1)} hrs</span>
                    </div>
                    <div class="block-progress-track" style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden; margin-top: 6px;">
                      <div class="block-progress-fill" style="width: ${relPercent}%; background: ${b.color}; height: 100%; border-radius: 4px; transition: width 0.5s ease;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            
            <!-- Personal Campaign Contribution Info Box with Fills left to right -->
            <div class="personal-campaign-contribution" style="margin-top: 16px; padding: 12px 14px; border: 1px dashed rgba(var(--primary-rgb), 0.25); border-radius: 12px; background: rgba(var(--primary-rgb), 0.02); display: flex; flex-direction: column; gap: 6px;">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:600; color:var(--text-main);">
                <span class="personal-contrib-label" style="display:flex; align-items:center; gap:6px;">
                  <i class="fa-solid fa-hands-praying" style="color:var(--primary);"></i>
                  <strong>Your Contribution</strong>
                </span>
                <span class="personal-contrib-value" style="color:var(--primary); font-weight:700;">${personalHours.toFixed(1)} hrs</span>
              </div>
              <div class="block-progress-track" style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                <div class="block-progress-fill" style="width: ${Math.min(100, Math.round((personalHours / Math.max(blockSummaries.find(b => b.isOwn).hours, 1)) * 100))}%; height: 100%; border-radius: 4px;"></div>
              </div>
              <div style="font-size: 10px; color: var(--text-muted); text-align: right; font-weight: 500;">
                (${Math.round((personalHours / Math.max(blockSummaries.find(b => b.isOwn).hours, 0.001)) * 100)}% of your block's total)
              </div>
            </div>
          </div>
      `;
    });
    
    detailsContainer.innerHTML = htmlContent;
    
    // Setup loops for each active campaign bucket
    campaigns.forEach(campaign => {
      const selectedCampaignId = campaign.id;
      const canvasId = `campaign-bucket-canvas-${selectedCampaignId}`;
      const campaignContribs = contributions.filter(item => item.campaignId === selectedCampaignId);
      const targetHours = targets[selectedCampaignId] || 100;
      const globalSeconds = campaignContribs.reduce((sum, item) => sum + item.durationSeconds, 0);
      const globalHours = globalSeconds / 3600;
      const progressPercent = Math.min(100, Math.round((globalHours / targetHours) * 100));
      
      const campaignBlockTotals = {};
      blocksList.forEach(b => {
        campaignBlockTotals[b] = 0;
      });
      campaignContribs.forEach(item => {
        if (campaignBlockTotals[item.block] !== undefined) {
          campaignBlockTotals[item.block] += item.durationSeconds;
        }
      });
      
      const campaignBlockSummaries = blocksList.map(bName => {
        const seconds = campaignBlockTotals[bName];
        const hours = seconds / 3600;
        let color = '#757575';
        if (bName === 'Wisdom') color = '#ffb300';
        else if (bName === 'Compassion') color = '#d81b60';
        else if (bName === 'Courage') color = '#b71c1c';
        else if (bName === 'Faith') color = '#0d47a1';
        else if (bName === 'Harmony') color = '#1b5e20';
        
        return {
          name: bName,
          hours: hours,
          seconds: seconds,
          color: color
        };
      });
      
      initCampaignBucketCanvas(canvasId, progressPercent, campaignBlockSummaries);
    });
    
    if (completedCampaignId) {
      const fCanvas = document.getElementById(`fireworks-canvas-${completedCampaignId}`);
      if (fCanvas) {
        initFireworks(fCanvas);
      }
    } else {
      stopFireworks();
    }
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

  const btnToggleAdminUsers = document.getElementById('btn-toggle-admin-users');
  const adminUsersContent = document.getElementById('admin-users-content');
  const adminUsersCard = document.getElementById('admin-users-card');
  
  if (btnToggleAdminUsers && adminUsersContent && adminUsersCard) {
    btnToggleAdminUsers.addEventListener('click', () => {
      adminUsersCard.classList.toggle('open');
      adminUsersContent.classList.toggle('collapsed');
    });
  }

  const btnToggleAdminCalendar = document.getElementById('btn-toggle-admin-calendar');
  const adminCalendarContent = document.getElementById('admin-calendar-content');
  const adminCalendarCard = document.getElementById('admin-calendar-card');
  
  if (btnToggleAdminCalendar && adminCalendarContent && adminCalendarCard) {
    btnToggleAdminCalendar.addEventListener('click', () => {
      adminCalendarCard.classList.toggle('open');
      adminCalendarContent.classList.toggle('collapsed');
    });
  }

  function updateAdminCardsVisibility(isAdmin) {
    const pCard = document.getElementById('admin-panel-card');
    const cCard = document.getElementById('admin-calendar-card');
    const uCard = document.getElementById('admin-users-card');
    
    if (isAdmin) {
      if (pCard) pCard.classList.remove('hidden');
      if (cCard) cCard.classList.remove('hidden');
      if (uCard) uCard.classList.remove('hidden');
      renderWhitelist();
      renderCampaignTargetsEditor();
      renderAdminCalendarSchedule();
      renderUsersList();
    } else {
      if (pCard) pCard.classList.add('hidden');
      if (cCard) cCard.classList.add('hidden');
      if (uCard) uCard.classList.add('hidden');
    }
  }

  // Render the registered members list
  async function renderUsersList() {
    const container = document.getElementById('admin-users-list-container');
    if (!container) return;
    
    container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:10px 0;"><i class="fa-solid fa-spinner fa-spin"></i> Loading users...</div>';
    
    try {
      const users = await MockFirebase.db.getAllUsers();
      container.innerHTML = '';
      
      if (users.length === 0) {
        container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:10px 0;">No registered users found.</div>';
        return;
      }
      
      users.forEach(u => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '8px';
        div.style.padding = '10px';
        div.style.background = 'rgba(255, 255, 255, 0.03)';
        div.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        div.style.borderRadius = '10px';
        div.style.marginBottom = '8px';
        div.style.fontSize = '13px';
        
        div.innerHTML = `
          <div class="user-view-row" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span style="font-weight:700; font-size:14px; color:var(--text-main);">${u.username} ${u.isAdmin ? '<span style="background:var(--primary); color:#fff; font-size:9px; padding:2px 4px; border-radius:4px; margin-left:4px; font-weight:700;">ADMIN</span>' : ''}</span>
              <span style="color:var(--text-muted); font-size:12px;">${u.email}</span>
              <span style="font-size:11px; font-weight:600; color:var(--primary); margin-top:2px;">${u.block} Block</span>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn-edit-user btn btn-secondary" style="padding:6px 10px; font-size:12px;" data-email="${u.email}"><i class="fa-solid fa-user-pen"></i> Edit</button>
              ${u.isAdmin ? '' : `<button class="btn-delete-user" style="background:transparent; border:none; color:var(--accent-danger); cursor:pointer; padding:6px;" data-email="${u.email}"><i class="fa-regular fa-trash-can"></i></button>`}
            </div>
          </div>
          
          <div class="user-edit-form hidden" style="display:none; flex-direction:column; gap:8px; border-top:1px dashed rgba(255,255,255,0.15); padding-top:8px; margin-top:4px;">
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <div style="flex:1; min-width:120px;">
                <label style="font-size:10px; font-weight:700; color:var(--text-muted);">Username</label>
                <input type="text" class="edit-user-username" value="${u.username}" style="width:100%; padding:6px; border-radius:6px; border:var(--border); font-size:12px; background:var(--accent-cream); color:var(--text-main);">
              </div>
              <div style="flex:1.5; min-width:180px;">
                <label style="font-size:10px; font-weight:700; color:var(--text-muted);">Email</label>
                <input type="email" class="edit-user-email" value="${u.email}" style="width:100%; padding:6px; border-radius:6px; border:var(--border); font-size:12px; background:var(--accent-cream); color:var(--text-main);">
              </div>
              <div style="flex:1; min-width:100px;">
                <label style="font-size:10px; font-weight:700; color:var(--text-muted);">Block</label>
                <select class="edit-user-block" style="width:100%; padding:6px; border-radius:6px; border:var(--border); font-size:12px; background:var(--accent-cream); color:var(--text-main);">
                  <option value="Wisdom" ${u.block === 'Wisdom' ? 'selected' : ''}>Wisdom</option>
                  <option value="Compassion" ${u.block === 'Compassion' ? 'selected' : ''}>Compassion</option>
                  <option value="Courage" ${u.block === 'Courage' ? 'selected' : ''}>Courage</option>
                  <option value="Faith" ${u.block === 'Faith' ? 'selected' : ''}>Faith</option>
                  <option value="Harmony" ${u.block === 'Harmony' ? 'selected' : ''}>Harmony</option>
                </select>
              </div>
              <div style="flex:1; min-width:100px;">
                <label style="font-size:10px; font-weight:700; color:var(--text-muted);">Role</label>
                <select class="edit-user-role" style="width:100%; padding:6px; border-radius:6px; border:var(--border); font-size:12px; background:var(--accent-cream); color:var(--text-main);">
                  <option value="member" ${!u.isAdmin ? 'selected' : ''}>Member</option>
                  <option value="admin" ${u.isAdmin ? 'selected' : ''}>Admin</option>
                </select>
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:4px;">
              <button class="btn-cancel-edit btn btn-secondary" style="padding:4px 8px; font-size:11px;">Cancel</button>
              <button class="btn-save-user btn btn-primary" style="padding:4px 10px; font-size:11px;" data-old-email="${u.email}">Save Changes</button>
            </div>
          </div>
        `;
        
        container.appendChild(div);
        
        const viewRow = div.querySelector('.user-view-row');
        const editForm = div.querySelector('.user-edit-form');
        const editBtn = div.querySelector('.btn-edit-user');
        const cancelBtn = div.querySelector('.btn-cancel-edit');
        const saveBtn = div.querySelector('.btn-save-user');
        const deleteBtn = div.querySelector('.btn-delete-user');
        
        if (editBtn && editForm && viewRow) {
          editBtn.addEventListener('click', () => {
            editForm.classList.remove('hidden');
            editForm.style.display = 'flex';
            viewRow.classList.add('hidden');
            viewRow.style.display = 'none';
          });
        }
        
        if (cancelBtn && editForm && viewRow) {
          cancelBtn.addEventListener('click', () => {
            editForm.classList.add('hidden');
            editForm.style.display = 'none';
            viewRow.classList.remove('hidden');
            viewRow.style.display = 'flex';
          });
        }
        
        if (saveBtn && editForm && viewRow) {
          saveBtn.addEventListener('click', async (e) => {
            const oldEmail = e.currentTarget.getAttribute('data-old-email');
            const newUsername = div.querySelector('.edit-user-username').value.trim();
            const newEmail = div.querySelector('.edit-user-email').value.trim().toLowerCase();
            const newBlock = div.querySelector('.edit-user-block').value;
            const newIsAdmin = (div.querySelector('.edit-user-role').value === 'admin');
            
            if (!newUsername || !newEmail) {
              alert("Username and Email are required.");
              return;
            }
            
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            try {
              await MockFirebase.db.adminUpdateUser(oldEmail, newEmail, newUsername, newBlock, newIsAdmin);
              alert("Member account updated successfully!");
              
              if (currentUser && currentUser.email.toLowerCase() === oldEmail.toLowerCase()) {
                currentUser.username = newUsername;
                currentUser.email = newEmail;
                currentUser.block = newBlock;
                localStorage.setItem('daimoku_session_user', JSON.stringify(currentUser));
                
                const blockBadge = document.getElementById('user-block-badge');
                if (blockBadge) blockBadge.textContent = `${newBlock} Block`;
              }
              
              await renderUsersList();
              renderWhitelist();
              updateUI();
            } catch (err) {
              alert("Failed to update user: " + err.message);
              saveBtn.disabled = false;
              saveBtn.textContent = 'Save Changes';
            }
          });
        }
        
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async (e) => {
            const emailToDelete = e.currentTarget.getAttribute('data-email');
            if (confirm(`Are you sure you want to delete the account for ${emailToDelete}? This will remove their profile and database records.`)) {
              try {
                await MockFirebase.db.adminDeleteUser(emailToDelete);
                alert("Member account deleted successfully!");
                await renderUsersList();
                renderWhitelist();
                updateUI();
              } catch (err) {
                alert("Failed to delete user: " + err.message);
              }
            }
          });
        }
      });
    } catch (e) {
      container.innerHTML = '<div style="font-size:12px; color:var(--accent-danger); padding:10px 0;">Error loading users list.</div>';
    }
  }

  // Handle new account pre-creation form
  const adminCreateUserForm = document.getElementById('admin-create-user-form');
  if (adminCreateUserForm) {
    adminCreateUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('admin-create-username').value.trim();
      const email = document.getElementById('admin-create-email').value.trim().toLowerCase();
      const block = document.getElementById('admin-create-block').value;
      const isAdminChecked = document.getElementById('admin-create-is-admin').checked;
      const btn = adminCreateUserForm.querySelector('button[type="submit"]');
      
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';
      
      try {
        const code = await MockFirebase.db.adminCreateUser(username, email, block, isAdminChecked);
        alert(`Account profile pre-created successfully!\n\nMember: ${username}\nEmail: ${email}\nBlock: ${block}\nRole: ${isAdminChecked ? 'Administrator' : 'Member'}\nRegistration Code: ${code}\n\nThis email has also been added to the whitelist automatically.`);
        adminCreateUserForm.reset();
        await renderUsersList();
        renderWhitelist();
      } catch (err) {
        alert("Failed to create profile: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Member Profile';
      }
    });
  }

  function resetCampaignFormState() {
    editingCampaignId = null;
    if (adminCreateCampaignForm) {
      adminCreateCampaignForm.reset();
      const activeToggleEl = document.getElementById('campaign-create-active');
      if (activeToggleEl) {
        activeToggleEl.checked = false;
        activeToggleEl.disabled = true;
        activeToggleEl.title = "Please enter a campaign title and target hours first.";
      }
      const formTitle = adminCreateCampaignForm.previousElementSibling;
      if (formTitle && formTitle.tagName === 'H4') {
        formTitle.textContent = "Create New Campaign";
      }
      const submitBtn = adminCreateCampaignForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-bullhorn"></i> Create Campaign';
        submitBtn.disabled = false;
      }
      const cancelBtn = adminCreateCampaignForm.querySelector('.btn-cancel-edit');
      if (cancelBtn) {
        cancelBtn.remove();
      }
    }
  }

  // Handle custom campaign creation form
  const adminCreateCampaignForm = document.getElementById('admin-create-campaign-form');
  if (adminCreateCampaignForm) {
    const campaignCreateNameInput = document.getElementById('campaign-create-name');
    const campaignCreateTargetInput = document.getElementById('campaign-create-target');
    const campaignCreateEndInput = document.getElementById('campaign-create-end');
    const campaignCreateActiveInput = document.getElementById('campaign-create-active');
    
    if (campaignCreateNameInput && campaignCreateTargetInput && campaignCreateEndInput && campaignCreateActiveInput) {
      const validateActiveToggle = () => {
        const nameVal = campaignCreateNameInput.value.trim();
        const targetVal = campaignCreateTargetInput.value.trim();
        const endVal = campaignCreateEndInput.value;
        
        let hasPastEnd = false;
        if (endVal) {
          const endT = new Date(endVal + 'T23:59:59').getTime();
          if (Date.now() > endT) {
            hasPastEnd = true;
          }
        }
        
        if (!nameVal || !targetVal || hasPastEnd) {
          campaignCreateActiveInput.checked = false;
          campaignCreateActiveInput.disabled = true;
          if (hasPastEnd) {
            campaignCreateActiveInput.title = "Cannot mark an expired campaign as active.";
          } else {
            campaignCreateActiveInput.title = "Please enter a campaign title and target hours first.";
          }
        } else {
          campaignCreateActiveInput.disabled = false;
          campaignCreateActiveInput.title = "";
        }
      };
      
      campaignCreateNameInput.addEventListener('input', validateActiveToggle);
      campaignCreateTargetInput.addEventListener('input', validateActiveToggle);
      campaignCreateEndInput.addEventListener('input', validateActiveToggle);
      campaignCreateEndInput.addEventListener('change', validateActiveToggle);
      
      // Perform initial check
      validateActiveToggle();
    }

    adminCreateCampaignForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('campaign-create-name').value.trim();
      const targetHours = parseInt(document.getElementById('campaign-create-target').value);
      const start = document.getElementById('campaign-create-start').value;
      const end = document.getElementById('campaign-create-end').value;
      const isActive = document.getElementById('campaign-create-active').checked;
      
      const btn = adminCreateCampaignForm.querySelector('button[type="submit"]');
      
      // Basic validation
      if (!name) return;
      
      if (start && end && end < start) {
        alert("The campaign end date cannot be earlier than the start date!");
        return;
      }
      
      btn.disabled = true;
      
      try {
        if (editingCampaignId) {
          // Editing mode
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
          await MockFirebase.db.editCampaign(editingCampaignId, name, targetHours, { start, end }, isActive);
          alert(`Campaign "${name}" updated successfully!`);
          resetCampaignFormState();
        } else {
          // Creation mode
          const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');
          if (!id) {
            alert("Please enter a valid title containing alphanumeric characters.");
            btn.disabled = false;
            return;
          }
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';
          await MockFirebase.db.createCampaign(id, name, targetHours, { start, end }, isActive);
          alert(`Campaign "${name}" created successfully!`);
          adminCreateCampaignForm.reset();
        }
        
        renderCampaignTargetsEditor();
        renderCampaignDashboard();
        populateTargetDropdowns();
        updateCampaignTabVisibility();
        
        const calView = document.getElementById('view-calendar');
        if (calView && calView.classList.contains('active')) {
          renderCalendar();
        }
      } catch (err) {
        alert("Operation failed: " + err.message);
      } finally {
        btn.disabled = false;
        if (editingCampaignId) {
          btn.innerHTML = '<i class="fa-solid fa-save"></i> Save Changes';
        } else {
          btn.innerHTML = '<i class="fa-solid fa-bullhorn"></i> Create Campaign';
        }
      }
    });
  }

  function renderWhitelist() {
    const container = document.getElementById('whitelist-list-container');
    if (!container) return;
    
    if (!MockFirebase.db.isWhitelistLoaded()) {
      container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:15px 0; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Syncing whitelist...</div>';
      return;
    }
    
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
      
      const deleteBtn = div.querySelector('.btn-delete-whitelist');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
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
            try {
              await MockFirebase.db.saveWhitelist(list);
              renderWhitelist();
            } catch (err) {
              alert("Failed to save whitelist: " + err.message);
            }
          }
        });
      }
      
      container.appendChild(div);
    });
  }

  const whitelistForm = document.getElementById('admin-whitelist-form');
  const whitelistInput = document.getElementById('whitelist-email-input');
  const whitelistCodeInput = document.getElementById('whitelist-code-input');
  if (whitelistForm && whitelistInput) {
    whitelistForm.addEventListener('submit', async (e) => {
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
      try {
        await MockFirebase.db.saveWhitelist(list);
        whitelistInput.value = '';
        if (whitelistCodeInput) whitelistCodeInput.value = '';
        renderWhitelist();
        alert(`Successfully whitelisted: ${email} with code: ${code}`);
      } catch (err) {
        alert("Failed to whitelist email: " + err.message);
      }
    });
  }

  function renderCampaignTargetsEditor() {
    const container = document.getElementById('campaign-targets-container');
    if (!container) return;
    
    if (!MockFirebase.db.isCampaignsLoaded()) {
      container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:15px 0; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Syncing campaigns...</div>';
      return;
    }
    
    const targets = MockFirebase.db.getCampaignTargets();
    const activeCampaigns = MockFirebase.db.getActiveCampaigns();
    const campaignDates = MockFirebase.db.getCampaignDates();
    container.innerHTML = '';
    
    const campaignNames = MockFirebase.db.getCampaignNames();
    const customCampaigns = MockFirebase.db.getCustomCampaigns();
    const allCampaignIds = [...customCampaigns];
    
    const campaigns = allCampaignIds.map(id => {
      return {
        id: id,
        name: campaignNames[id] || id,
        isCustom: true
      };
    });
    
    if (campaigns.length === 0) {
      container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:10px 0; text-align:center;">No custom campaigns created yet.</div>';
      return;
    }
    
    campaigns.forEach(c => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.padding = '10px 0';
      div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
      div.style.gap = '6px';
      
      const isActive = activeCampaigns.includes(c.id);
      const dates = campaignDates[c.id] || { start: '', end: '' };
      
      let isExpired = false;
      if (dates && dates.end) {
        const endT = new Date(dates.end + 'T23:59:59').getTime();
        if (Date.now() > endT) {
          isExpired = true;
        }
      }
      
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; font-weight:600; color:var(--text-main);">${c.name}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:var(--text-muted); cursor:${isExpired ? 'not-allowed' : 'pointer'}; margin-bottom:0;">
              <input type="checkbox" class="campaign-active-toggle" data-id="${c.id}" ${isActive ? 'checked' : ''} ${isExpired ? 'disabled' : ''} style="accent-color: var(--primary); width:13px; height:13px; margin:0; cursor:${isExpired ? 'not-allowed' : 'pointer'};" title="${isExpired ? 'Cannot activate an expired campaign' : ''}">
              Active
            </label>
            <input type="number" class="campaign-target-input" data-id="${c.id}" value="${targets[c.id] || 100}" min="1" max="100000" style="width:60px; padding:6px; border-radius:6px; border:var(--border); background:var(--accent-cream); color:var(--text-main); font-size:12px; text-align:center; outline:none;" disabled>
            <span style="font-size:11px; color:var(--text-muted);">hours</span>
            <button class="btn-edit-campaign" data-id="${c.id}" style="background:transparent; border:none; color:var(--text-main); cursor:pointer; padding:4px 6px; font-size:13px;" title="Edit Campaign"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn-delete-campaign" data-id="${c.id}" style="background:transparent; border:none; color:var(--accent-danger); cursor:pointer; padding:4px 6px; font-size:13px;" title="Delete Campaign"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-muted);">
          <span>Period: ${dates.start || 'N/A'} to ${dates.end || 'N/A'} ${isExpired ? '<strong style="color:var(--accent-danger);">(Expired)</strong>' : ''}</span>
        </div>
      `;
      
      // Edit button handler
      const editBtn = div.querySelector('.btn-edit-campaign');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          editingCampaignId = id;
          
          document.getElementById('campaign-create-name').value = c.name;
          document.getElementById('campaign-create-target').value = targets[c.id] || 100;
          document.getElementById('campaign-create-start').value = dates.start || '';
          document.getElementById('campaign-create-end').value = dates.end || '';
          
          const activeToggleEl = document.getElementById('campaign-create-active');
          activeToggleEl.checked = isActive;
          if (isExpired) {
            activeToggleEl.checked = false;
            activeToggleEl.disabled = true;
            activeToggleEl.title = "Cannot mark an expired campaign as active.";
          } else {
            activeToggleEl.disabled = false;
            activeToggleEl.title = "";
          }
          
          const formTitle = adminCreateCampaignForm.previousElementSibling;
          if (formTitle && formTitle.tagName === 'H4') {
            formTitle.textContent = "Edit Campaign: " + c.name;
          }
          const submitBtn = adminCreateCampaignForm.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Changes';
            
            // Add Cancel button if not already present
            let cancelBtn = adminCreateCampaignForm.querySelector('.btn-cancel-edit');
            if (!cancelBtn) {
              cancelBtn = document.createElement('button');
              cancelBtn.type = 'button';
              cancelBtn.className = 'btn btn-secondary btn-cancel-edit';
              cancelBtn.style.marginTop = '6px';
              cancelBtn.style.padding = '10px 14px';
              cancelBtn.style.fontSize = '13px';
              cancelBtn.style.width = '100%';
              cancelBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancel Edit';
              cancelBtn.addEventListener('click', () => {
                resetCampaignFormState();
              });
              submitBtn.parentNode.appendChild(cancelBtn);
            }
          }
          
          // Scroll form into view
          adminCreateCampaignForm.scrollIntoView({ behavior: 'smooth' });
        });
      }
      
      const activeToggle = div.querySelector('.campaign-active-toggle');
      if (activeToggle) activeToggle.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const checked = e.target.checked;
        
        let activeList = MockFirebase.db.getActiveCampaigns();
        if (checked) {
          activeList = [id]; // Set as the ONLY active campaign
        } else {
          activeList = activeList.filter(cid => cid !== id);
        }
        MockFirebase.db.saveActiveCampaigns(activeList);
        
        updateCampaignTabVisibility();
        renderCampaignTargetsEditor();
        renderCampaignDashboard();
        populateTargetDropdowns();
      });
      
      const deleteBtn = div.querySelector('.btn-delete-campaign');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm("Are you sure you want to delete this custom campaign? This will remove all target settings and dates.")) {
            try {
              if (editingCampaignId === id) {
                resetCampaignFormState();
              }
              await MockFirebase.db.deleteCampaign(id);
              alert("Campaign deleted successfully!");
              renderCampaignTargetsEditor();
              renderCampaignDashboard();
              populateTargetDropdowns();
              updateCampaignTabVisibility();
            } catch (err) {
              alert("Failed to delete campaign: " + err.message);
            }
          }
        });
      }
      
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
      const editBtn = div.querySelector('.btn-edit-event');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
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
      }
      
      // Bind Delete Button
      const deleteBtn = div.querySelector('.btn-delete-event');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          const d = e.currentTarget.getAttribute('data-date');
          if (confirm(`Remove event on ${d} ("${CALENDAR_ACTIVITIES_2026[d].title}")?`)) {
            delete CALENDAR_ACTIVITIES_2026[d];
            localStorage.setItem('daimoku_calendar_activities', JSON.stringify(CALENDAR_ACTIVITIES_2026));
            renderAdminCalendarSchedule();
            const calView = document.getElementById('view-calendar');
            if (calView && calView.classList.contains('active')) {
              renderCalendar();
            }
          }
        });
      }
      
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
      const calView = document.getElementById('view-calendar');
      if (calView && calView.classList.contains('active')) {
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
  
  // Adjust recovery form fields based on Firebase configuration
  const recoveryPasswordGroup = document.getElementById('recovery-password-group');
  const recoveryNewPasswordInput = document.getElementById('recovery-new-password');
  const btnRecoverySubmit = document.getElementById('btn-recovery-submit');
  
  if (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured) {
    if (recoveryPasswordGroup) recoveryPasswordGroup.classList.add('hidden');
    if (recoveryNewPasswordInput) recoveryNewPasswordInput.required = false;
    if (btnRecoverySubmit) {
      btnRecoverySubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Reset Email';
    }
  }
  
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
    updateAdminCardsVisibility(false);
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
      const user = await MockFirebase.auth.signIn(credInfo.email, credInfo.password);
      loadUserStateForLoggedInUser(user);
      hideAuthOverlay();
      
      updateAdminCardsVisibility(user.isAdmin);
      
      updateUI();
      renderTargetsList();
      populateTargetDropdowns();
      
      alert(`Welcome back, ${user.username}! Biometric login successful. 🌸`);
    } catch (err) {
      alert("Biometric login failed: " + err.message);
    }
  }

  // Form Submissions Listeners
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        const user = await MockFirebase.auth.signIn(email, password);
        loadUserStateForLoggedInUser(user);
        hideAuthOverlay();
        
        updateAdminCardsVisibility(user.isAdmin);
        
        updateUI();
        renderTargetsList();
        populateTargetDropdowns();
        
        // Auto redirect to dashboard
        const navDashboard = document.getElementById('nav-dashboard');
        if (navDashboard) navDashboard.click();
        
        alert(`Welcome back, ${user.username}! 🙏`);
      } catch(err) {
        alert("Login failed: " + err.message);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
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
        const user = await MockFirebase.auth.signUp(username, email, password, block, code);
        loadUserStateForLoggedInUser(user);
        hideAuthOverlay();
        
        updateAdminCardsVisibility(user.isAdmin);
        
        updateUI();
        renderTargetsList();
        populateTargetDropdowns();
        
        // Auto redirect to dashboard
        const navDashboard = document.getElementById('nav-dashboard');
        if (navDashboard) navDashboard.click();
        
        alert(`Account created successfully! Welcome to the ${block} Block, ${username}! 🌸`);
      } catch(err) {
        alert("Registration failed: " + err.message);
      }
    });
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('recovery-email').value;
      
      const firebaseActive = (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured);
      let newPassword = '';
      
      if (!firebaseActive) {
        newPassword = document.getElementById('recovery-new-password').value;
        if (newPassword.length < 6) {
          alert("Password must be at least 6 characters.");
          return;
        }
      }
      
      try {
        await MockFirebase.auth.resetPassword(email, newPassword);
        if (!firebaseActive) {
          alert("Password updated successfully! Please log in with your new credentials.");
        }
        showAuthForm(loginForm);
      } catch(err) {
        alert("Error: " + err.message);
      }
    });
  }

  // Auth Screen Links toggles
  const linkToRegister = document.getElementById('link-to-register');
  if (linkToRegister) {
    linkToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthForm(registerForm);
    });
  }
  
  const linkToLogin = document.getElementById('link-to-login');
  if (linkToLogin) {
    linkToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthForm(loginForm);
    });
  }
  
  const linkToForgot = document.getElementById('link-to-forgot');
  if (linkToForgot) {
    linkToForgot.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthForm(forgotPasswordForm);
    });
  }
  
  const linkToLoginFromRecovery = document.getElementById('link-to-login-from-recovery');
  if (linkToLoginFromRecovery) {
    linkToLoginFromRecovery.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthForm(loginForm);
    });
  }
  
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

        
        // Hide admin cards
        updateAdminCardsVisibility(false);
        
        alert("You have logged out successfully.");
      }
    });
  }

  // initGardenSubviews deleted as subviews are rolled back to separate bottom navigation tabs

  // --- Boot Sequences ---
  loadState();
  
  // Ensure lastChantedDate is valid (fixes the blank/NaN bug)
  const parsedLastChanted = new Date(state.lastChantedDate);
  if (isNaN(parsedLastChanted.getTime())) {
    state.lastChantedDate = new Date().toISOString();
    state.health = 100;
  }
  
  initNavigation();
  updateSkyTheme();
  updateCampaignTabVisibility();
  updateQuote();
  renderTargetsList();
  populateTargetDropdowns();
  
  if (logDateInput) {
    logDateInput.addEventListener('change', populateTargetDropdowns);
  }
  
  if (timerPersonalSelect) {
    timerPersonalSelect.addEventListener('change', () => {
      updateTargetPaceHint('timer-personal-select', 'timer-target-pace-tip');
    });
  }
  if (manualPersonalSelect) {
    manualPersonalSelect.addEventListener('change', () => {
      updateTargetPaceHint('manual-personal-select', 'manual-target-pace-tip');
    });
  }
  
  // Check session status on boot
  const bootUser = MockFirebase.auth.getCurrentUser();
  if (bootUser) {
    hideAuthOverlay();
    updateCampaignTabVisibility();
    
    // Check admin status
    updateAdminCardsVisibility(bootUser.isAdmin);
  } else {
    showAuthOverlay();
    updateCampaignTabVisibility();
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

  function showEncouragementPopUp(customText = "", customTitle = "") {
    const modal = document.getElementById('encouragement-modal');
    const msgEl = document.getElementById('encouragement-message');
    const titleEl = document.getElementById('encouragement-title');
    if (modal && msgEl) {
      if (customText) {
        msgEl.textContent = customText;
      } else {
        const randomIndex = Math.floor(Math.random() * ENCOURAGEMENTS.length);
        msgEl.textContent = ENCOURAGEMENTS[randomIndex];
      }
      if (titleEl) {
        titleEl.textContent = customTitle || "Session Recorded! 🙏";
      }
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
  }

  const btnCloseEncouragement = document.getElementById('btn-close-encouragement');
  if (btnCloseEncouragement) {
    btnCloseEncouragement.addEventListener('click', () => {
      const modal = document.getElementById('encouragement-modal');
      const titleEl = document.getElementById('encouragement-title');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
      }
      if (titleEl) {
        titleEl.textContent = "Session Recorded! 🙏";
      }
    });
  }

  // --- Fireworks & Badge Celebration System ---

  class CelebrationParticle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.radius = Math.random() * 3 + 1.5;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.gravity = 0.1;
      this.friction = 0.98;
      this.alpha = 1;
      this.decay = Math.random() * 0.015 + 0.01;
    }

    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  class CelebrationRocket {
    constructor(startX, startY, targetX, targetY, color, particleColors) {
      this.x = startX;
      this.y = startY;
      this.targetX = targetX;
      this.targetY = targetY;
      this.color = color;
      this.particleColors = particleColors;
      const dx = targetX - startX;
      const dy = targetY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = 10;
      this.vx = (dx / distance) * speed;
      this.vy = (dy / distance) * speed;
      this.exploded = false;
      this.trail = [];
    }

    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 8) this.trail.shift();
      this.x += this.vx;
      this.y += this.vy;
      if (this.vy >= 0 || this.y <= this.targetY) {
        this.exploded = true;
      }
    }

    draw(ctx) {
      ctx.save();
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  function getColorsForRarity(rarity) {
    switch (rarity) {
      case 'legendary':
        return ['#ffd700', '#ffcc00', '#ffa500', '#ff8c00', '#ff4500', '#ffffff'];
      case 'rare':
        return ['#8a2be2', '#9370db', '#da70d6', '#ba55d3', '#ff00ff', '#ffffff'];
      case 'milestone':
        return ['#008080', '#20b2aa', '#3cb371', '#2e8b57', '#00ff7f', '#ffffff'];
      case 'endeavor':
      default:
        return ['#8ea68e', '#8fbc8f', '#98fb98', '#c2d9c2', '#e2ede2', '#ffffff'];
    }
  }

  function startFireworks(rarity) {
    celebrationCanvas = document.getElementById('celebration-canvas');
    if (!celebrationCanvas) return;
    celebrationCtx = celebrationCanvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    celebrationCanvas.width = window.innerWidth * dpr;
    celebrationCanvas.height = window.innerHeight * dpr;
    celebrationCtx.scale(dpr, dpr);
    
    celebrationCanvas.style.display = 'block';
    
    celebrationParticles = [];
    celebrationRockets = [];
    
    if (celebrationAnimationId) {
      cancelAnimationFrame(celebrationAnimationId);
    }
    if (celebrationDurationTimeout) {
      clearTimeout(celebrationDurationTimeout);
    }
    
    const colors = getColorsForRarity(rarity);
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    // Launch a few initial rockets
    const numRockets = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numRockets; i++) {
      setTimeout(() => {
        if (!isCelebrationActive) return;
        const startX = w * (0.2 + Math.random() * 0.6);
        const startY = h;
        const targetX = w * (0.15 + Math.random() * 0.7);
        const targetY = h * (0.2 + Math.random() * 0.45);
        const color = colors[Math.floor(Math.random() * colors.length)];
        celebrationRockets.push(new CelebrationRocket(startX, startY, targetX, targetY, color, colors));
      }, i * 400);
    }
    
    // Continually launch rockets for 4 seconds
    const intervalId = setInterval(() => {
      if (!isCelebrationActive) {
        clearInterval(intervalId);
        return;
      }
      const startX = w * (0.2 + Math.random() * 0.6);
      const startY = h;
      const targetX = w * (0.15 + Math.random() * 0.7);
      const targetY = h * (0.2 + Math.random() * 0.45);
      const color = colors[Math.floor(Math.random() * colors.length)];
      celebrationRockets.push(new CelebrationRocket(startX, startY, targetX, targetY, color, colors));
    }, 1200);
    
    function animate() {
      celebrationCtx.clearRect(0, 0, w, h);
      
      // Update & Draw Rockets
      for (let i = celebrationRockets.length - 1; i >= 0; i--) {
        const rocket = celebrationRockets[i];
        rocket.update();
        rocket.draw(celebrationCtx);
        
        if (rocket.exploded) {
          const numParticles = rarity === 'legendary' ? 100 : (rarity === 'rare' ? 70 : 50);
          for (let p = 0; p < numParticles; p++) {
            const pColor = rocket.particleColors[Math.floor(Math.random() * rocket.particleColors.length)];
            celebrationParticles.push(new CelebrationParticle(rocket.x, rocket.y, pColor));
          }
          celebrationRockets.splice(i, 1);
        }
      }
      
      // Update & Draw Particles
      for (let i = celebrationParticles.length - 1; i >= 0; i--) {
        const particle = celebrationParticles[i];
        particle.update();
        particle.draw(celebrationCtx);
        
        if (particle.alpha <= 0) {
          celebrationParticles.splice(i, 1);
        }
      }
      
      if (isCelebrationActive) {
        celebrationAnimationId = requestAnimationFrame(animate);
      }
    }
    
    animate();
    
    celebrationDurationTimeout = setTimeout(() => {
      clearInterval(intervalId);
      stopFireworksGracefully();
    }, 6000);
  }

  function stopFireworksGracefully() {
    celebrationRockets = [];
    setTimeout(() => {
      if (celebrationAnimationId) {
        cancelAnimationFrame(celebrationAnimationId);
        celebrationAnimationId = null;
      }
      const canvas = document.getElementById('celebration-canvas');
      if (canvas) {
        canvas.style.display = 'none';
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 1500);
  }

  function showBadgePreviewModal(badge, isUnlocked) {
    const modal = document.getElementById('badge-unlock-modal');
    const icon = document.getElementById('unlock-badge-icon');
    const tier = document.getElementById('unlock-badge-tier');
    const title = document.getElementById('unlock-badge-title');
    const desc = document.getElementById('unlock-badge-desc');
    const card = document.querySelector('.badge-unlock-card');
    const closeBtn = document.getElementById('btn-close-badge-unlock');
    
    if (modal && icon && tier && title && desc && card && closeBtn) {
      isManualPreview = true;
      
      setBadgeIcon(icon, badge.icon, true);
      title.textContent = badge.title;
      desc.textContent = badge.desc;
      
      const tierText = badge.tier || 'endeavor';
      tier.textContent = isUnlocked ? tierText : `${tierText} (Pending)`;
      tier.className = `badge-tier ${tierText}`;
      
      // Dynamic color style for center badge icon container
      const iconContainer = card.querySelector('.modal-badge-icon');
      if (iconContainer) {
        iconContainer.className = `modal-badge-icon ${tierText}`;
        if (!isUnlocked) {
          iconContainer.style.filter = 'grayscale(0.2) opacity(0.8)';
        } else {
          iconContainer.style.filter = 'none';
        }
      }
      
      card.classList.remove('legendary-glow', 'rare-glow', 'milestone-glow');
      card.classList.remove('swirl-anim', 'zoom-anim');
      
      if (isUnlocked) {
        if (tierText === 'legendary') card.classList.add('legendary-glow');
        else if (tierText === 'rare') card.classList.add('rare-glow');
        else if (tierText === 'milestone') card.classList.add('milestone-glow');
        
        card.classList.add('swirl-anim');
        closeBtn.textContent = "Awesome! 🎉";
        
        startFireworks(tierText);
      } else {
        card.classList.add('zoom-anim');
        closeBtn.textContent = "Close";
      }
      
      // Force restart CSS animation
      card.style.animation = 'none';
      void card.offsetWidth; /* trigger reflow */
      card.style.animation = '';
      
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
  }

  function queueBadgeCelebration(badge) {
    celebrationQueue.push(badge);
    if (!isCelebrationActive) {
      showNextCelebration();
    }
  }

  function showNextCelebration() {
    if (celebrationQueue.length === 0) {
      isCelebrationActive = false;
      return;
    }
    isCelebrationActive = true;
    isManualPreview = false;
    const badge = celebrationQueue.shift();
    
    const modal = document.getElementById('badge-unlock-modal');
    const icon = document.getElementById('unlock-badge-icon');
    const tier = document.getElementById('unlock-badge-tier');
    const title = document.getElementById('unlock-badge-title');
    const desc = document.getElementById('unlock-badge-desc');
    const card = document.querySelector('.badge-unlock-card');
    const closeBtn = document.getElementById('btn-close-badge-unlock');
    
    if (modal && icon && tier && title && desc && card) {
      setBadgeIcon(icon, badge.icon, true);
      title.textContent = badge.title;
      desc.textContent = badge.desc;
      
      const tierText = badge.tier || 'endeavor';
      tier.textContent = tierText;
      tier.className = `badge-tier ${tierText}`;
      
      if (closeBtn) {
        closeBtn.textContent = "Awesome! 🎉";
      }
      
      // Dynamic color style for center badge icon container
      const iconContainer = card.querySelector('.modal-badge-icon');
      if (iconContainer) {
        iconContainer.className = `modal-badge-icon ${tierText}`;
        iconContainer.style.filter = 'none';
      }
      
      card.classList.remove('legendary-glow', 'rare-glow', 'milestone-glow');
      card.classList.remove('swirl-anim', 'zoom-anim');
      
      if (tierText === 'legendary') card.classList.add('legendary-glow');
      else if (tierText === 'rare') card.classList.add('rare-glow');
      else if (tierText === 'milestone') card.classList.add('milestone-glow');

      card.classList.add('swirl-anim');
 
      // Force restart CSS animation for consecutive modals
      card.style.animation = 'none';
      void card.offsetWidth; /* trigger reflow */
      card.style.animation = '';
 
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      
      startFireworks(tierText);
    }
  }

  const btnCloseBadgeUnlock = document.getElementById('btn-close-badge-unlock');
  if (btnCloseBadgeUnlock) {
    btnCloseBadgeUnlock.addEventListener('click', () => {
      const modal = document.getElementById('badge-unlock-modal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
      }
      
      stopFireworksGracefully();
      
      if (isManualPreview) {
        isManualPreview = false;
      } else {
        isCelebrationActive = false;
        showNextCelebration();
      }
    });
  }

  function checkNewAchievements() {
    if (!state.unlockedAchievements) {
      state.unlockedAchievements = [];
    }
    const newUnlocks = [];
    ACHIEVEMENTS_LIST.forEach(ach => {
      if (ach.check(state)) {
        if (!state.unlockedAchievements.includes(ach.id)) {
          state.unlockedAchievements.push(ach.id);
          newUnlocks.push(ach);
        }
      }
    });

    if (newUnlocks.length > 0) {
      saveState();
      newUnlocks.forEach(ach => {
        queueBadgeCelebration(ach);
      });
      return true;
    }
    return false;
  }

  function initializeUnlockedAchievements(silent = true) {
    if (!state.unlockedAchievements) {
      state.unlockedAchievements = [];
    }
    let stateChanged = false;
    ACHIEVEMENTS_LIST.forEach(ach => {
      if (ach.check(state)) {
        if (!state.unlockedAchievements.includes(ach.id)) {
          state.unlockedAchievements.push(ach.id);
          stateChanged = true;
        }
      }
    });
    if (stateChanged && silent) {
      localStorage.setItem('daimoku_grow_state', JSON.stringify(state));
      const user = MockFirebase.auth.getCurrentUser();
      if (user) {
        MockFirebase.db.saveUserState(user.email, state);
      }
    }

    // One-time retroactive badge showcase for the new animation update
    const hasRetriggered = localStorage.getItem('daimoku_grow_badges_retriggered_v34');
    if (!hasRetriggered && state.unlockedAchievements.length > 0) {
      state.unlockedAchievements.forEach(achId => {
        const ach = ACHIEVEMENTS_LIST.find(x => x.id === achId);
        if (ach) {
          queueBadgeCelebration(ach);
        }
      });
      localStorage.setItem('daimoku_grow_badges_retriggered_v34', 'true');
    }
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

  function getActiveRevivalDates(validDates) {
    if (!validDates || validDates.length === 0) return [];
    
    const sorted = [...new Set(validDates)].sort();
    const timestamps = sorted.map(d => new Date(d + 'T12:00:00').getTime());
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    const todayLocalStr = new Date().toISOString().split('T')[0];
    const yesterdayLocalStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayT = new Date(todayLocalStr + 'T12:00:00').getTime();
    const yesterdayT = new Date(yesterdayLocalStr + 'T12:00:00').getTime();
    
    let lastIndex = -1;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i] === todayT || timestamps[i] === yesterdayT) {
        lastIndex = i;
        break;
      }
    }
    
    if (lastIndex === -1) {
      return [];
    }
    
    const activeList = [sorted[lastIndex]];
    let expectedT = timestamps[lastIndex] - oneDayMs;
    
    for (let i = lastIndex - 1; i >= 0; i--) {
      if (timestamps[i] === expectedT) {
        activeList.unshift(sorted[i]);
        expectedT -= oneDayMs;
      } else {
        break; // Gap detected, streak broken
      }
    }
    
    return activeList;
  }

  function getActiveRevivalStreak(revivalDates) {
    return getActiveRevivalDates(revivalDates).length;
  }

  function rebuildRevivalDates() {
    // Recompute totalSeconds from sessions to ensure they are always in sync!
    if (state.sessions) {
      state.totalSeconds = state.sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    } else {
      state.totalSeconds = 0;
    }

    if (!state.sessions || state.sessions.length === 0) {
      state.revivalDates = [];
      return;
    }

    // 1. Group sessions by date (YYYY-MM-DD)
    const dateMap = {};
    state.sessions.forEach(s => {
      if (!s.date) return;
      const dateKey = s.date.split('T')[0];
      dateMap[dateKey] = (dateMap[dateKey] || 0) + s.durationSeconds;
    });

    // 2. Find all dates with at least 15 minutes (900 seconds)
    const validDates = Object.keys(dateMap).filter(dateKey => dateMap[dateKey] >= 900);
    validDates.sort(); // Sort chronologically

    // 3. Check if there are 3 consecutive days in the history
    const consecutiveFound = checkThreeConsecutiveDays(validDates);

    if (consecutiveFound) {
      if (state.isDead) {
        state.isDead = false;
        state.health = 100;
        state.revivalDates = [];
        state.lastNotifiedThreshold = 0; // Reset notification threshold
        
        // Reset lastChantedDate to the most recent session's date, or current time if none
        if (state.sessions && state.sessions.length > 0) {
          const sorted = [...state.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
          state.lastChantedDate = sorted[0].date;
        } else {
          state.lastChantedDate = new Date().toISOString();
        }
        
        localStorage.setItem('daimoku_grow_state', JSON.stringify(state));
        const user = MockFirebase.auth.getCurrentUser();
        if (user) {
          MockFirebase.db.saveUserState(user.email, state);
        }
        console.log("Self-healing: Plant revived based on history logs.");
      }
      return;
    }

    // 4. If the plant is dead, populate revivalDates with only active consecutive streak dates
    if (state.isDead) {
      state.revivalDates = getActiveRevivalDates(validDates);
    } else {
      state.revivalDates = [];
    }
  }

  function updateRevivalProgress(sessionDateStr, durationSeconds) {
    if (!state.isDead) return;
    if (!state.revivalDates) state.revivalDates = [];
    
    // Normalize date string to ignore any time component
    const normalizedDateStr = sessionDateStr.split('T')[0];
    
    const dateSessions = state.sessions.filter(s => s.date.split('T')[0] === normalizedDateStr);
    const totalSecsForDate = dateSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    
    if (totalSecsForDate >= 900) { // 900 seconds = 15 minutes
      if (!state.revivalDates.includes(normalizedDateStr)) {
        state.revivalDates.push(normalizedDateStr);
        state.revivalDates.sort();
      }
    }
    
    // Enforce active consecutive streak filter on current revival progress dates
    state.revivalDates = getActiveRevivalDates(state.revivalDates);
    
    if (checkThreeConsecutiveDays(state.revivalDates)) {
      state.isDead = false;
      state.health = 100;
      state.revivalDates = [];
      state.lastNotifiedThreshold = 0; // Reset notification threshold
      
      // Reset lastChantedDate to the most recent session's date, or current time if none
      if (state.sessions && state.sessions.length > 0) {
        const sorted = [...state.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
        state.lastChantedDate = sorted[0].date;
      } else {
        state.lastChantedDate = new Date().toISOString();
      }
      
      localStorage.setItem('daimoku_grow_state', JSON.stringify(state));
      const user = MockFirebase.auth.getCurrentUser();
      if (user) {
        MockFirebase.db.saveUserState(user.email, state);
      }
      
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
    // Force reload on new service worker activation
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log("Service Worker controller changed! Reloading page...");
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(async (reg) => {
          console.log('Service Worker registered successfully!', reg.scope);
          
          // Force update check
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log("New service worker version detected! Reloading to apply update...");
                window.location.reload();
              }
            });
          });
          
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

  // Listen for real-time Firebase database changes (contributions & general state)
  window.addEventListener('db-contributions-updated', () => {
    console.log("Firebase sync: contributions updated.");
    const user = MockFirebase.auth.getCurrentUser();
    if (user) {
      healUserStateFromContributions(user);
    }
    updateUI();
  });

  // Listen for real-time campaign settings modifications
  window.addEventListener('db-campaigns-updated', () => {
    console.log("Firebase sync: campaign configurations updated.");
    const user = MockFirebase.auth.getCurrentUser();
    if (user && user.isAdmin) {
      renderCampaignTargetsEditor();
    }
    updateCampaignTabVisibility();
  });

  // Listen for real-time whitelist access modifications
  window.addEventListener('db-whitelist-updated', () => {
    console.log("Firebase sync: whitelist updated.");
    const user = MockFirebase.auth.getCurrentUser();
    if (user && user.isAdmin) {
      renderWhitelist();
    }
  });

  // Listen for real-time member account updates
  window.addEventListener('db-users-updated', () => {
    console.log("Firebase sync: user profiles updated.");
    const user = MockFirebase.auth.getCurrentUser();
    if (user && user.isAdmin) {
      renderUsersList();
    }
  });

  function handleTimerExitAutoSave() {
    if (timerState === 'running' || timerState === 'paused') {
      const now = Date.now();
      const elapsedMs = (timerState === 'running' ? now : timerStartTime) - timerStartTime + timerAccumulatedPaused;
      const elapsedSecs = Math.floor(elapsedMs / 1000);
      if (elapsedSecs >= 5) {
        saveChantSession(elapsedSecs, timerType);
      }
      localStorage.removeItem('daimoku_active_timer');
    }
  }

  window.addEventListener('pagehide', handleTimerExitAutoSave);
  window.addEventListener('beforeunload', handleTimerExitAutoSave);

  // Encyclopedia Collapsible
  const btnToggleEncyclopedia = document.getElementById('btn-toggle-encyclopedia');
  const encyclopediaContent = document.getElementById('encyclopedia-content');
  const encyclopediaCard = document.getElementById('encyclopedia-card');
  if (btnToggleEncyclopedia && encyclopediaContent && encyclopediaCard) {
    btnToggleEncyclopedia.addEventListener('click', () => {
      encyclopediaContent.classList.toggle('collapsed');
      encyclopediaCard.classList.toggle('open');
    });
  }

  } catch (err) {
    console.error("Initialization Error:", err);
    var banner = document.getElementById('debug-error-banner');
    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML += 'Caught Init Error: ' + err.message + '\nStack:\n' + err.stack + '\n\n';
    }
  }
});

