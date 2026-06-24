/**
 * Daimoku Grow Beta - Mock Firebase Configurations & Services
 * Simulates Firebase Auth & Firestore using shared namespaces in localStorage.
 */

const MockFirebase = {
  auth: {
    currentUser: null,
    
    // Register User
    signUp(username, email, password, block, code) {
      const whitelist = MockFirebase.db.getWhitelist();
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedCode = code ? code.trim().toUpperCase() : '';
      
      // 1. Verify against Whitelist & Registration Code
      const entry = whitelist.find(w => w.email.toLowerCase() === normalizedEmail);
      if (!entry) {
        throw new Error("This email is not whitelisted. Please contact your block administrator to gain access.");
      }
      
      if (entry.code.toUpperCase() !== normalizedCode) {
        throw new Error("Invalid registration code. Please verify the code assigned to your email.");
      }
      
      // 2. Check if user already exists
      const users = MockFirebase.db.getUsers();
      if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
        throw new Error("An account with this email already exists.");
      }
      
      // 3. Create user profile (First registered user or one of the 6 admin emails is Admin)
      const adminEmails = [
        'admin@email.com',
        'admin1@email.com',
        'admin2@email.com',
        'admin3@email.com',
        'admin4@email.com',
        'admin5@email.com'
      ];
      const isFirstUser = users.length === 0;
      const isAdmin = isFirstUser || adminEmails.includes(normalizedEmail);
      
      const newUser = {
        username,
        email: normalizedEmail,
        password,
        block,
        isAdmin
      };
      
      users.push(newUser);
      MockFirebase.db.saveUsers(users);
      
      // Set current session
      this.currentUser = newUser;
      MockFirebase.db.saveSession(newUser);
      return newUser;
    },
    
    // Login User
    signIn(email, password) {
      const users = MockFirebase.db.getUsers();
      const normalizedEmail = email.toLowerCase().trim();
      
      const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
      if (!user) {
        throw new Error("Invalid email or password.");
      }
      
      // Verify they are still whitelisted
      const whitelist = MockFirebase.db.getWhitelist();
      const isWhitelisted = whitelist.some(w => w.email.toLowerCase() === normalizedEmail);
      if (!isWhitelisted) {
        throw new Error("Your access has been revoked by the administrator.");
      }
      
      this.currentUser = user;
      MockFirebase.db.saveSession(user);
      return user;
    },
    
    // Password Recovery/Reset
    resetPassword(email, newPassword) {
      const users = MockFirebase.db.getUsers();
      const normalizedEmail = email.toLowerCase().trim();
      
      const userIdx = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
      if (userIdx === -1) {
        throw new Error("No account found with this email.");
      }
      
      // Verify still whitelisted
      const whitelist = MockFirebase.db.getWhitelist();
      const isWhitelisted = whitelist.some(w => w.email.toLowerCase() === normalizedEmail);
      if (!isWhitelisted) {
        throw new Error("This email is no longer on the whitelist.");
      }
      
      users[userIdx].password = newPassword;
      MockFirebase.db.saveUsers(users);
      
      // If updating currently logged-in user
      if (this.currentUser && this.currentUser.email.toLowerCase() === normalizedEmail) {
        this.currentUser.password = newPassword;
        MockFirebase.db.saveSession(this.currentUser);
      }
    },
    
    // Logout
    signOut() {
      this.currentUser = null;
      localStorage.removeItem('daimoku_session_user');
    },
    
    // Get Current Session
    getCurrentUser() {
      if (this.currentUser) return this.currentUser;
      const saved = localStorage.getItem('daimoku_session_user');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          // Verify user is still whitelisted
          const whitelist = MockFirebase.db.getWhitelist();
          const isWhitelisted = whitelist.some(w => w.email.toLowerCase() === user.email.toLowerCase());
          if (isWhitelisted) {
            this.currentUser = user;
            return user;
          } else {
            localStorage.removeItem('daimoku_session_user');
          }
        } catch (e) {
          localStorage.removeItem('daimoku_session_user');
        }
      }
      return null;
    }
  },
  
  db: {
    // Registered Users Collection
    getUsers() {
      const saved = localStorage.getItem('daimoku_db_users');
      return saved ? JSON.parse(saved) : [];
    },
    saveUsers(users) {
      localStorage.setItem('daimoku_db_users', JSON.stringify(users));
    },
    
    // Whitelisted Emails Collection (mapped to codes)
    getWhitelist() {
      const saved = localStorage.getItem('daimoku_db_whitelist');
      if (saved) return JSON.parse(saved);
      
      // Default initial whitelist with codes (pre-seeded with 6 admin emails)
      const defaults = [
        { email: 'admin@email.com', code: 'ADM-777' },
        { email: 'admin1@email.com', code: 'ADM-111' },
        { email: 'admin2@email.com', code: 'ADM-222' },
        { email: 'admin3@email.com', code: 'ADM-333' },
        { email: 'admin4@email.com', code: 'ADM-444' },
        { email: 'admin5@email.com', code: 'ADM-555' },
        { email: 'user@email.com', code: 'WIS-111' },
        { email: 'courage@email.com', code: 'COU-222' },
        { email: 'wisdom@email.com', code: 'WIS-333' },
        { email: 'harmony@email.com', code: 'HAR-444' },
        { email: 'faith@email.com', code: 'FAI-555' },
        { email: 'compassion@email.com', code: 'COM-666' }
      ];
      localStorage.setItem('daimoku_db_whitelist', JSON.stringify(defaults));
      return defaults;
    },
    saveWhitelist(list) {
      localStorage.setItem('daimoku_db_whitelist', JSON.stringify(list));
    },
    
    saveSession(user) {
      localStorage.setItem('daimoku_session_user', JSON.stringify(user));
    },
    
    // Personal User States (private dashboards and targets)
    getUserState(email) {
      const normalizedEmail = email.toLowerCase().trim();
      const saved = localStorage.getItem(`daimoku_db_state_${normalizedEmail}`);
      return saved ? JSON.parse(saved) : null;
    },
    saveUserState(email, stateData) {
      const normalizedEmail = email.toLowerCase().trim();
      localStorage.setItem(`daimoku_db_state_${normalizedEmail}`, JSON.stringify(stateData));
    },
    
    // Shared Campaigns Targets (configurable by admin)
    getCampaignTargets() {
      const saved = localStorage.getItem('daimoku_db_campaign_targets');
      if (saved) return JSON.parse(saved);
      
      const defaults = {
        youth_division: 500,
        may_3rd: 1000,
        mens_division: 500,
        womens_division: 800,
        july_3rd: 50,
        november_18th: 1200
      };
      localStorage.setItem('daimoku_db_campaign_targets', JSON.stringify(defaults));
      return defaults;
    },
    saveCampaignTargets(targets) {
      localStorage.setItem('daimoku_db_campaign_targets', JSON.stringify(targets));
    },
    
    // Shared Campaign Dates (configurable by admin)
    getCampaignDates() {
      const saved = localStorage.getItem('daimoku_db_campaign_dates');
      if (saved) return JSON.parse(saved);
      
      const defaults = {
        youth_division: { start: "2026-01-16", end: "2026-03-19" },
        may_3rd: { start: "2026-04-07", end: "2026-05-07" },
        mens_division: { start: "2026-01-16", end: "2026-03-19" },
        womens_division: { start: "2026-04-07", end: "2026-05-07" },
        july_3rd: { start: "2026-06-19", end: "2026-11-19" },
        november_18th: { start: "2026-09-19", end: "2026-11-19" }
      };
      localStorage.setItem('daimoku_db_campaign_dates', JSON.stringify(defaults));
      return defaults;
    },
    saveCampaignDates(dates) {
      localStorage.setItem('daimoku_db_campaign_dates', JSON.stringify(dates));
    },
    
    // Shared Campaigns Contributions (synced real-time across block members)
    getCampaignContributions() {
      const saved = localStorage.getItem('daimoku_db_campaign_contributions');
      return saved ? JSON.parse(saved) : [];
    },
    saveCampaignContributions(contributions) {
      localStorage.setItem('daimoku_db_campaign_contributions', JSON.stringify(contributions));
    },
    addCampaignContribution(userEmail, username, block, campaignId, durationSeconds, date) {
      const contributions = this.getCampaignContributions();
      contributions.push({
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
        userEmail: userEmail.toLowerCase(),
        username,
        block,
        campaignId,
        durationSeconds,
        date
      });
      this.saveCampaignContributions(contributions);
    },
    
    getActiveCampaigns() {
      const saved = localStorage.getItem('daimoku_db_active_campaigns');
      if (saved) return JSON.parse(saved);
      // Default: July 3rd Campaign is active initially
      const defaults = ['july_3rd'];
      localStorage.setItem('daimoku_db_active_campaigns', JSON.stringify(defaults));
      return defaults;
    },
    saveActiveCampaigns(activeList) {
      localStorage.setItem('daimoku_db_active_campaigns', JSON.stringify(activeList));
    }
  }
};

// Database Migration for July 3rd Campaign Sync
function migrateDatabase() {
  const versionKey = 'daimoku_db_migration_version';
  const currentVersion = parseInt(localStorage.getItem(versionKey) || '0');
  
  if (currentVersion < 1) {
    // 1. Ensure July 3rd is active
    let activeCampaigns = [];
    try {
      const savedActive = localStorage.getItem('daimoku_db_active_campaigns');
      activeCampaigns = savedActive ? JSON.parse(savedActive) : [];
    } catch (e) {}
    
    if (!activeCampaigns.includes('july_3rd')) {
      activeCampaigns.push('july_3rd');
      localStorage.setItem('daimoku_db_active_campaigns', JSON.stringify(activeCampaigns));
    }
    
    // 2. Ensure July 3rd dates are set correctly (start covers today)
    let campaignDates = {};
    try {
      const savedDates = localStorage.getItem('daimoku_db_campaign_dates');
      campaignDates = savedDates ? JSON.parse(savedDates) : {};
    } catch (e) {}
    
    if (!campaignDates.july_3rd || campaignDates.july_3rd.start !== '2026-06-19') {
      campaignDates.july_3rd = { start: '2026-06-19', end: '2026-11-19' };
      localStorage.setItem('daimoku_db_campaign_dates', JSON.stringify(campaignDates));
    }
    
    // 3. Ensure July 3rd target is 50 hours
    let campaignTargets = {};
    try {
      const savedTargets = localStorage.getItem('daimoku_db_campaign_targets');
      campaignTargets = savedTargets ? JSON.parse(savedTargets) : {};
    } catch (e) {}
    
    if (!campaignTargets.july_3rd || campaignTargets.july_3rd !== 50) {
      campaignTargets.july_3rd = 50;
      localStorage.setItem('daimoku_db_campaign_targets', JSON.stringify(campaignTargets));
    }
    
    // 4. Ensure Wisdom block has a contribution of 1.7 hours (6120 seconds) for July 3rd
    let contributions = [];
    try {
      const savedContribs = localStorage.getItem('daimoku_db_campaign_contributions');
      contributions = savedContribs ? JSON.parse(savedContribs) : [];
    } catch (e) {}
    
    const hasWisdomContrib = contributions.some(c => c.campaignId === 'july_3rd' && c.userEmail === 'wisdom@email.com');
    if (!hasWisdomContrib) {
      contributions.push({
        id: 'migration_seeded_wisdom_july3rd',
        userEmail: 'wisdom@email.com',
        username: 'Wisdom Member',
        block: 'Wisdom',
        campaignId: 'july_3rd',
        durationSeconds: 6120, // 1.7 hours
        date: '2026-06-19'
      });
      localStorage.setItem('daimoku_db_campaign_contributions', JSON.stringify(contributions));
    }
    
    localStorage.setItem(versionKey, '1');
  }
}

// Run migration immediately on file load
migrateDatabase();
