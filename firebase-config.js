/**
 * Daimoku Grow - Firebase Configurations & Services
 * 
 * ============================================================================
 * SETUP INSTRUCTIONS FOR CREATING A FREE GOOGLE FIREBASE DATABASE:
 * ============================================================================
 * 
 * 1. CREATE FIREBASE PROJECT:
 *    - Go to the Firebase Console: https://console.firebase.google.com/
 *    - Click "Add project" and follow the steps (name it e.g., "Daimoku Grow").
 * 
 * 2. ENABLE FIREBASE AUTHENTICATION:
 *    - In the left sidebar, click "Build" -> "Authentication".
 *    - Click "Get started".
 *    - Select the "Sign-in method" tab.
 *    - Click "Email/Password", toggle it to "Enabled", and click "Save".
 * 
 * 3. ENABLE CLOUD FIRESTORE:
 *    - Click "Build" -> "Firestore Database".
 *    - Click "Create database".
 *    - Select a location near you and click "Next".
 *    - Select "Start in test mode" (so rules allow read/write during setup) and click "Create".
 * 
 * 4. GET CONFIGURATION CREDENTIALS:
 *    - Click the Gear icon (Project settings) in the left sidebar next to "Project Overview".
 *    - Under "Your apps" at the bottom, click the "</>" (Web) icon.
 *    - Register the app nickname (e.g. "Chanting Garden") and click "Register app".
 *    - Copy the `firebaseConfig` object values and paste them into the object below.
 * 
 * 5. SEED INITIAL WHITELIST IN FIRESTORE:
 *    - Go to Firestore Database.
 *    - Click "Start collection" and name it "whitelist".
 *    - For the Document ID, enter your email (e.g., "admin@email.com" in lowercase).
 *    - Add a field named "code" (type: string) and set its value (e.g., "ADM-777"). Click Save.
 *    - Repeat for other users or use the admin panel inside the app once logged in.
 * ============================================================================
 */

// Paste your Firebase Config object values here:
const firebaseConfig = {
  apiKey: "AIzaSyC-NcOj07Ik-giXDCRFv-kpxgPI0YN7Eag",
  authDomain: "daimoku-grow.firebaseapp.com",
  projectId: "daimoku-grow",
  storageBucket: "daimoku-grow.firebasestorage.app",
  messagingSenderId: "297290695096",
  appId: "1:297290695096:web:ffacbb744bf1e666da8f4d",
  measurementId: "G-KRVJ5ZKVQ8"
};

// Check if Firebase is configured (i.e. the user replaced the placeholder text)
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes("YOUR_API_KEY_HERE");

let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("Firebase initialized successfully! Cloud Database sync is active.");
  } catch (e) {
    console.error("Firebase initialization failed. Falling back to local storage.", e);
  }
} else {
  console.log("Firebase configuration is not set. Operating in Local Mock Mode. Follow setup instructions in firebase-config.js to activate cloud sync.");
}

// Default initial whitelist with registration codes
const defaultWhitelist = [
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

const defaultCampaignTargets = {
  youth_division: 500,
  may_3rd: 1000,
  mens_division: 500,
  womens_division: 800,
  july_3rd: 50,
  november_18th: 1200
};

const defaultCampaignDates = {
  youth_division: { start: "2026-01-16", end: "2026-03-19" },
  may_3rd: { start: "2026-04-07", end: "2026-05-07" },
  mens_division: { start: "2026-01-16", end: "2026-03-19" },
  womens_division: { start: "2026-04-07", end: "2026-05-07" },
  july_3rd: { start: "2026-06-19", end: "2026-11-19" },
  november_18th: { start: "2026-09-19", end: "2026-11-19" }
};

// --- Real-time Firebase Sync Cache ---
let cachedWhitelist = [...defaultWhitelist];
let cachedCampaignTargets = { ...defaultCampaignTargets };
let cachedCampaignDates = { ...defaultCampaignDates };
let cachedActiveCampaigns = ['july_3rd'];
let cachedContributions = [];

if (isFirebaseConfigured && db) {
  // 1. Listen to Whitelist Changes
  db.collection('whitelist').onSnapshot((snapshot) => {
    const list = [];
    snapshot.forEach(doc => {
      list.push({ email: doc.id, code: doc.data().code });
    });
    if (list.length > 0) {
      cachedWhitelist = list;
    }
    window.dispatchEvent(new Event('db-updated'));
  }, err => console.warn("Firestore Whitelist listener error:", err));

  // 2. Listen to Campaign Configurations (targets, dates, active list)
  db.collection('settings').doc('campaigns').onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (data.targets) cachedCampaignTargets = data.targets;
      if (data.dates) cachedCampaignDates = data.dates;
      if (data.active) cachedActiveCampaigns = data.active;
      window.dispatchEvent(new Event('db-updated'));
    } else {
      // Seed default campaigns configurations document
      db.collection('settings').doc('campaigns').set({
        targets: defaultCampaignTargets,
        dates: defaultCampaignDates,
        active: ['july_3rd']
      });
    }
  }, err => console.warn("Firestore Settings listener error:", err));

  // 3. Listen to Campaign Contributions
  db.collection('contributions').onSnapshot((snapshot) => {
    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    cachedContributions = list;
    window.dispatchEvent(new Event('db-updated'));
  }, err => console.warn("Firestore Contributions listener error:", err));
}

// Define the namespace matching MockFirebase API
const MockFirebase = {
  auth: {
    // Current user local session cache
    currentUser: null,
    
    // Register User
    async signUp(username, email, password, block, code) {
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedCode = code ? code.trim().toUpperCase() : '';
      
      // 1. Check if whitelisted
      const entry = cachedWhitelist.find(w => w.email.toLowerCase() === normalizedEmail);
      if (!entry) {
        throw new Error("This email is not whitelisted. Please contact your block administrator to gain access.");
      }
      if (entry.code.toUpperCase() !== normalizedCode) {
        throw new Error("Invalid registration code. Please verify the code assigned to your email.");
      }

      const adminEmails = [
        'admin@email.com', 'admin1@email.com', 'admin2@email.com', 
        'admin3@email.com', 'admin4@email.com', 'admin5@email.com'
      ];
      const isAdmin = adminEmails.includes(normalizedEmail);
      const userProfile = { username, email: normalizedEmail, block, isAdmin };

      if (isFirebaseConfigured && auth && db) {
        // Register in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(normalizedEmail, password);
        
        // Write profile details to Firestore users collection
        await db.collection('users').doc(normalizedEmail).set(userProfile);
        
        this.currentUser = userProfile;
        localStorage.setItem('daimoku_session_user', JSON.stringify(userProfile));
        return userProfile;
      } else {
        // Local Mock Fallback
        const users = JSON.parse(localStorage.getItem('daimoku_db_users') || '[]');
        if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
          throw new Error("An account with this email already exists.");
        }
        users.push({ ...userProfile, password });
        localStorage.setItem('daimoku_db_users', JSON.stringify(users));
        
        this.currentUser = userProfile;
        localStorage.setItem('daimoku_session_user', JSON.stringify(userProfile));
        return userProfile;
      }
    },
    
    // Login User
    async signIn(email, password) {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Verify whitelisted first
      const isWhitelisted = cachedWhitelist.some(w => w.email.toLowerCase() === normalizedEmail);
      if (!isWhitelisted) {
        throw new Error("Your access has been revoked by the administrator.");
      }

      if (isFirebaseConfigured && auth && db) {
        // Firebase Auth login
        const userCredential = await auth.signInWithEmailAndPassword(normalizedEmail, password);
        
        // Retrieve profile details from Firestore
        const userDoc = await db.collection('users').doc(normalizedEmail).get();
        if (!userDoc.exists) {
          throw new Error("User profile not found in database.");
        }
        
        const profile = userDoc.data();
        this.currentUser = profile;
        localStorage.setItem('daimoku_session_user', JSON.stringify(profile));
        return profile;
      } else {
        // Local Mock Fallback
        const users = JSON.parse(localStorage.getItem('daimoku_db_users') || '[]');
        const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
        if (!user) {
          throw new Error("Invalid email or password.");
        }
        
        const profile = { username: user.username, email: user.email, block: user.block, isAdmin: user.isAdmin };
        this.currentUser = profile;
        localStorage.setItem('daimoku_session_user', JSON.stringify(profile));
        return profile;
      }
    },
    
    // Password Recovery/Reset
    async resetPassword(email, newPassword) {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Verify whitelisted
      const isWhitelisted = cachedWhitelist.some(w => w.email.toLowerCase() === normalizedEmail);
      if (!isWhitelisted) {
        throw new Error("This email is no longer on the whitelist.");
      }

      if (isFirebaseConfigured && auth) {
        // Send a reset password email to the user
        await auth.sendPasswordResetEmail(normalizedEmail);
        alert("A password reset email has been sent by Firebase! Please check your inbox.");
      } else {
        // Local Mock Fallback
        const users = JSON.parse(localStorage.getItem('daimoku_db_users') || '[]');
        const userIdx = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
        if (userIdx === -1) {
          throw new Error("No account found with this email.");
        }
        users[userIdx].password = newPassword;
        localStorage.setItem('daimoku_db_users', JSON.stringify(users));
      }
    },
    
    // Logout
    signOut() {
      if (isFirebaseConfigured && auth) {
        auth.signOut().catch(e => console.error(e));
      }
      this.currentUser = null;
      localStorage.removeItem('daimoku_session_user');
    },
    
    // Get Current Session (synchronous check)
    getCurrentUser() {
      if (this.currentUser) return this.currentUser;
      const saved = localStorage.getItem('daimoku_session_user');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          const isWhitelisted = cachedWhitelist.some(w => w.email.toLowerCase() === user.email.toLowerCase());
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
    // Whitelisted Emails Collection
    getWhitelist() {
      if (isFirebaseConfigured) {
        return cachedWhitelist;
      } else {
        const saved = localStorage.getItem('daimoku_db_whitelist');
        if (saved) return JSON.parse(saved);
        localStorage.setItem('daimoku_db_whitelist', JSON.stringify(defaultWhitelist));
        return defaultWhitelist;
      }
    },
    async saveWhitelist(list) {
      if (isFirebaseConfigured && db) {
        // Set all list entries in Firestore whitelist collection
        for (const item of list) {
          await db.collection('whitelist').doc(item.email.toLowerCase()).set({ code: item.code });
        }
        
        // Remove items not in list
        const snapshot = await db.collection('whitelist').get();
        snapshot.forEach(doc => {
          if (!list.some(item => item.email.toLowerCase() === doc.id)) {
            db.collection('whitelist').doc(doc.id).delete();
          }
        });
      } else {
        localStorage.setItem('daimoku_db_whitelist', JSON.stringify(list));
        window.dispatchEvent(new Event('db-updated'));
      }
    },
    
    // User States (private user logs & settings)
    async getUserState(email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (isFirebaseConfigured && db) {
        const doc = await db.collection('userStates').doc(normalizedEmail).get();
        return doc.exists ? doc.data() : null;
      } else {
        const saved = localStorage.getItem(`daimoku_db_state_${normalizedEmail}`);
        return saved ? JSON.parse(saved) : null;
      }
    },
    saveUserState(email, stateData) {
      const normalizedEmail = email.toLowerCase().trim();
      if (isFirebaseConfigured && db) {
        db.collection('userStates').doc(normalizedEmail).set(stateData).catch(e => {
          console.warn("Firestore save userState error:", e);
        });
      }
      // Always cache in localStorage for fast local bootstrap
      localStorage.setItem(`daimoku_db_state_${normalizedEmail}`, JSON.stringify(stateData));
    },
    
    // Shared Campaigns Targets
    getCampaignTargets() {
      if (isFirebaseConfigured) {
        return cachedCampaignTargets;
      } else {
        const saved = localStorage.getItem('daimoku_db_campaign_targets');
        if (saved) return JSON.parse(saved);
        localStorage.setItem('daimoku_db_campaign_targets', JSON.stringify(defaultCampaignTargets));
        return defaultCampaignTargets;
      }
    },
    saveCampaignTargets(targets) {
      if (isFirebaseConfigured && db) {
        db.collection('settings').doc('campaigns').update({ targets }).catch(e => {
          console.warn("Firestore update campaign targets error:", e);
        });
      } else {
        localStorage.setItem('daimoku_db_campaign_targets', JSON.stringify(targets));
        window.dispatchEvent(new Event('db-updated'));
      }
    },
    
    // Shared Campaign Dates
    getCampaignDates() {
      if (isFirebaseConfigured) {
        return cachedCampaignDates;
      } else {
        const saved = localStorage.getItem('daimoku_db_campaign_dates');
        if (saved) return JSON.parse(saved);
        localStorage.setItem('daimoku_db_campaign_dates', JSON.stringify(defaultCampaignDates));
        return defaultCampaignDates;
      }
    },
    saveCampaignDates(dates) {
      if (isFirebaseConfigured && db) {
        db.collection('settings').doc('campaigns').update({ dates }).catch(e => {
          console.warn("Firestore update campaign dates error:", e);
        });
      } else {
        localStorage.setItem('daimoku_db_campaign_dates', JSON.stringify(dates));
        window.dispatchEvent(new Event('db-updated'));
      }
    },
    
    // Shared Active Campaigns
    getActiveCampaigns() {
      if (isFirebaseConfigured) {
        return cachedActiveCampaigns;
      } else {
        const saved = localStorage.getItem('daimoku_db_active_campaigns');
        if (saved) return JSON.parse(saved);
        const defaults = ['july_3rd'];
        localStorage.setItem('daimoku_db_active_campaigns', JSON.stringify(defaults));
        return defaults;
      }
    },
    saveActiveCampaigns(activeList) {
      if (isFirebaseConfigured && db) {
        db.collection('settings').doc('campaigns').update({ active: activeList }).catch(e => {
          console.warn("Firestore update active campaigns error:", e);
        });
      } else {
        localStorage.setItem('daimoku_db_active_campaigns', JSON.stringify(activeList));
        window.dispatchEvent(new Event('db-updated'));
      }
    },
    
    // Shared Campaigns Contributions
    getCampaignContributions() {
      if (isFirebaseConfigured) {
        return cachedContributions;
      } else {
        const saved = localStorage.getItem('daimoku_db_campaign_contributions');
        return saved ? JSON.parse(saved) : [];
      }
    },
    saveCampaignContributions(contributions) {
      if (isFirebaseConfigured && db) {
        // Real database: items are added individually rather than overwriting the whole list
        // Local fallback: overwrite local array
      } else {
        localStorage.setItem('daimoku_db_campaign_contributions', JSON.stringify(contributions));
        window.dispatchEvent(new Event('db-updated'));
      }
    },
    addCampaignContribution(userEmail, username, block, campaignId, durationSeconds, date) {
      if (isFirebaseConfigured && db) {
        db.collection('contributions').add({
          campaignId,
          userEmail: userEmail.toLowerCase(),
          username,
          block,
          durationSeconds,
          date
        }).catch(e => {
          console.error("Firestore add contribution error:", e);
        });
      } else {
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
      }
    }
  }
};

// Database Migration for July 3rd Campaign Sync (Local Storage Mock Mode Only)
function migrateDatabase() {
  try {
    const versionKey = 'daimoku_db_migration_version';
    const currentVersion = parseInt(localStorage.getItem(versionKey) || '0');
    
    if (currentVersion < 1) {
      let activeCampaigns = [];
      try {
        const savedActive = localStorage.getItem('daimoku_db_active_campaigns');
        activeCampaigns = savedActive ? JSON.parse(savedActive) : [];
      } catch (e) {}
      if (!activeCampaigns) activeCampaigns = [];
      
      if (!activeCampaigns.includes('july_3rd')) {
        activeCampaigns.push('july_3rd');
        localStorage.setItem('daimoku_db_active_campaigns', JSON.stringify(activeCampaigns));
      }
      
      let campaignDates = {};
      try {
        const savedDates = localStorage.getItem('daimoku_db_campaign_dates');
        campaignDates = savedDates ? JSON.parse(savedDates) : {};
      } catch (e) {}
      if (!campaignDates) campaignDates = {};
      
      if (!campaignDates.july_3rd || campaignDates.july_3rd.start !== '2026-06-19') {
        campaignDates.july_3rd = { start: '2026-06-19', end: '2026-11-19' };
        localStorage.setItem('daimoku_db_campaign_dates', JSON.stringify(campaignDates));
      }
      
      let campaignTargets = {};
      try {
        const savedTargets = localStorage.getItem('daimoku_db_campaign_targets');
        campaignTargets = savedTargets ? JSON.parse(savedTargets) : {};
      } catch (e) {}
      if (!campaignTargets) campaignTargets = {};
      
      if (!campaignTargets.july_3rd || campaignTargets.july_3rd !== 50) {
        campaignTargets.july_3rd = 50;
        localStorage.setItem('daimoku_db_campaign_targets', JSON.stringify(campaignTargets));
      }
      
      let contributions = [];
      try {
        const savedContribs = localStorage.getItem('daimoku_db_campaign_contributions');
        contributions = savedContribs ? JSON.parse(savedContribs) : [];
      } catch (e) {}
      if (!contributions) contributions = [];
      
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
  } catch (e) {
    console.error("Database migration failed:", e);
  }
}

// Run migration immediately on file load
migrateDatabase();
