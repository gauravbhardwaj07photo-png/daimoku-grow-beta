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

const defaultCampaignNames = {
  youth_division: "Youth Division Campaign",
  may_3rd: "May 3rd Campaign",
  mens_division: "Men's Division Campaign",
  womens_division: "Women's Division Campaign",
  july_3rd: "July 3rd Campaign",
  november_18th: "November 18th Campaign"
};

// --- Real-time Firebase Sync Cache ---
let cachedWhitelist = [...defaultWhitelist];
let cachedCampaignTargets = { ...defaultCampaignTargets };
let cachedCampaignDates = { ...defaultCampaignDates };
let cachedActiveCampaigns = ['july_3rd'];
let cachedCampaignNames = { ...defaultCampaignNames };
let cachedCustomCampaigns = [];
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
      
      // Perform whitelist access check asynchronously once cloud whitelist is fetched
      const saved = localStorage.getItem('daimoku_session_user');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          const isWhitelisted = list.some(w => w.email.toLowerCase() === user.email.toLowerCase());
          if (!isWhitelisted) {
            console.warn("User access revoked via Firestore whitelist.");
            localStorage.removeItem('daimoku_session_user');
            if (MockFirebase.auth.currentUser) {
              MockFirebase.auth.currentUser = null;
            }
          }
        } catch (e) {}
      }
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
      if (data.names) cachedCampaignNames = data.names;
      if (data.customCampaigns) cachedCustomCampaigns = data.customCampaigns;
      window.dispatchEvent(new Event('db-updated'));
    } else {
      // Seed default campaigns configurations document
      db.collection('settings').doc('campaigns').set({
        targets: defaultCampaignTargets,
        dates: defaultCampaignDates,
        active: ['july_3rd'],
        names: defaultCampaignNames,
        customCampaigns: []
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
          this.currentUser = user;
          return user;
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
        try {
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
        } catch (e) {
          console.warn("Firestore saveWhitelist error:", e);
        }
      } else {
        localStorage.setItem('daimoku_db_whitelist', JSON.stringify(list));
        window.dispatchEvent(new Event('db-updated'));
      }
    },
    
    // User States (private user logs & settings)
    async getUserState(email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (isFirebaseConfigured && db) {
        try {
          const doc = await db.collection('userStates').doc(normalizedEmail).get();
          return doc.exists ? doc.data() : null;
        } catch (e) {
          console.warn("Firestore getUserState error:", e);
          return null;
        }
      } else {
        const saved = localStorage.getItem(`daimoku_db_state_${normalizedEmail}`);
        return saved ? JSON.parse(saved) : null;
      }
    },
    saveUserState(email, stateData) {
      const normalizedEmail = email.toLowerCase().trim();
      if (isFirebaseConfigured && db) {
        try {
          db.collection('userStates').doc(normalizedEmail).set(stateData).catch(e => {
            console.warn("Firestore save userState error:", e);
          });
        } catch (e) {
          console.warn("Firestore save userState sync error:", e);
        }
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
        try {
          db.collection('settings').doc('campaigns').update({ targets }).catch(e => {
            console.warn("Firestore update campaign targets error:", e);
          });
        } catch (e) {
          console.warn("Firestore update campaign targets sync error:", e);
        }
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
        try {
          db.collection('settings').doc('campaigns').update({ dates }).catch(e => {
            console.warn("Firestore update campaign dates error:", e);
          });
        } catch (e) {
          console.warn("Firestore update campaign dates sync error:", e);
        }
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
      // Force only 1 active campaign at a time (take the last one selected)
      const singleActiveList = activeList.slice(-1);
      
      if (isFirebaseConfigured && db) {
        try {
          db.collection('settings').doc('campaigns').update({ active: singleActiveList }).catch(e => {
            console.warn("Firestore update active campaigns error:", e);
          });
        } catch (e) {
          console.warn("Firestore update active campaigns sync error:", e);
        }
      } else {
        localStorage.setItem('daimoku_db_active_campaigns', JSON.stringify(singleActiveList));
        window.dispatchEvent(new Event('db-updated'));
      }
    },

    // Get all campaign names
    getCampaignNames() {
      if (isFirebaseConfigured) {
        return cachedCampaignNames;
      } else {
        const saved = localStorage.getItem('daimoku_db_campaign_names');
        if (saved) return JSON.parse(saved);
        localStorage.setItem('daimoku_db_campaign_names', JSON.stringify(defaultCampaignNames));
        return defaultCampaignNames;
      }
    },

    // Get list of custom campaign IDs
    getCustomCampaigns() {
      if (isFirebaseConfigured) {
        return cachedCustomCampaigns;
      } else {
        const saved = localStorage.getItem('daimoku_db_custom_campaigns');
        return saved ? JSON.parse(saved) : [];
      }
    },

    // Create a new campaign (validation ensures only 1 active at a time)
    async createCampaign(id, name, targetHours, dates, isActive) {
      if (isFirebaseConfigured && db) {
        try {
          const docRef = db.collection('settings').doc('campaigns');
          const doc = await docRef.get();
          
          let targets = { ...defaultCampaignTargets };
          let campaignDates = { ...defaultCampaignDates };
          let names = { ...defaultCampaignNames };
          let customCampaigns = [];
          let active = ['july_3rd'];
          
          if (doc.exists) {
            const data = doc.data();
            if (data.targets) targets = data.targets;
            if (data.dates) campaignDates = data.dates;
            if (data.names) names = data.names;
            if (data.customCampaigns) customCampaigns = data.customCampaigns;
            if (data.active) active = data.active;
          }
          
          // Validation: check if campaign already exists
          if (targets[id] !== undefined) {
            throw new Error("A campaign with this ID or name already exists.");
          }
          
          // Add new configurations
          targets[id] = targetHours;
          campaignDates[id] = dates;
          names[id] = name;
          if (!customCampaigns.includes(id)) {
            customCampaigns.push(id);
          }
          
          if (isActive) {
            active = [id]; // Set this as the only active campaign
          }
          
          await docRef.set({
            targets,
            dates: campaignDates,
            names,
            customCampaigns,
            active
          });
        } catch (e) {
          console.error("Firestore createCampaign error:", e);
          throw e;
        }
      } else {
        // Local Mock Mode
        const targets = this.getCampaignTargets();
        const campaignDates = this.getCampaignDates();
        const names = this.getCampaignNames();
        const customCampaigns = this.getCustomCampaigns();
        let active = this.getActiveCampaigns();
        
        if (targets[id] !== undefined) {
          throw new Error("A campaign with this ID or name already exists.");
        }
        
        targets[id] = targetHours;
        campaignDates[id] = dates;
        names[id] = name;
        customCampaigns.push(id);
        
        if (isActive) {
          active = [id];
        }
        
        localStorage.setItem('daimoku_db_campaign_targets', JSON.stringify(targets));
        localStorage.setItem('daimoku_db_campaign_dates', JSON.stringify(campaignDates));
        localStorage.setItem('daimoku_db_campaign_names', JSON.stringify(names));
        localStorage.setItem('daimoku_db_custom_campaigns', JSON.stringify(customCampaigns));
        localStorage.setItem('daimoku_db_active_campaigns', JSON.stringify(active));
        
        window.dispatchEvent(new Event('db-updated'));
      }
    },

    // Delete a custom campaign
    async deleteCampaign(id) {
      if (isFirebaseConfigured && db) {
        try {
          const docRef = db.collection('settings').doc('campaigns');
          const doc = await docRef.get();
          if (doc.exists) {
            const data = doc.data();
            const targets = data.targets || {};
            const dates = data.dates || {};
            const names = data.names || {};
            let customCampaigns = data.customCampaigns || [];
            let active = data.active || [];
            
            // Delete key entries
            delete targets[id];
            delete dates[id];
            delete names[id];
            customCampaigns = customCampaigns.filter(cid => cid !== id);
            active = active.filter(cid => cid !== id);
            
            await docRef.set({
              targets,
              dates,
              names,
              customCampaigns,
              active
            });
          }
        } catch (e) {
          console.error("Firestore deleteCampaign error:", e);
          throw e;
        }
      } else {
        // Local Mock Mode
        const targets = this.getCampaignTargets();
        const campaignDates = this.getCampaignDates();
        const names = this.getCampaignNames();
        let customCampaigns = this.getCustomCampaigns();
        let active = this.getActiveCampaigns();
        
        delete targets[id];
        delete campaignDates[id];
        delete names[id];
        customCampaigns = customCampaigns.filter(cid => cid !== id);
        active = active.filter(cid => cid !== id);
        
        localStorage.setItem('daimoku_db_campaign_targets', JSON.stringify(targets));
        localStorage.setItem('daimoku_db_campaign_dates', JSON.stringify(campaignDates));
        localStorage.setItem('daimoku_db_campaign_names', JSON.stringify(names));
        localStorage.setItem('daimoku_db_custom_campaigns', JSON.stringify(customCampaigns));
        localStorage.setItem('daimoku_db_active_campaigns', JSON.stringify(active));
        
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
    async deleteCampaignContribution(userEmail, campaignId, date, durationSeconds) {
      const email = userEmail.toLowerCase().trim();
      if (isFirebaseConfigured && db) {
        try {
          const snapshot = await db.collection('contributions')
            .where('userEmail', '==', email)
            .where('campaignId', '==', campaignId)
            .where('date', '==', date)
            .where('durationSeconds', '==', durationSeconds)
            .get();
          
          const batch = db.batch();
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`Firestore delete contribution: deleted ${snapshot.size} matches.`);
        } catch (e) {
          console.warn("Firestore delete contribution error:", e);
        }
      } else {
        // Local Mock
        let contributions = this.getCampaignContributions();
        const idx = contributions.findIndex(c => 
          c.userEmail.toLowerCase() === email &&
          c.campaignId === campaignId &&
          c.date === date &&
          c.durationSeconds === durationSeconds
        );
        if (idx !== -1) {
          contributions.splice(idx, 1);
          localStorage.setItem('daimoku_db_campaign_contributions', JSON.stringify(contributions));
          window.dispatchEvent(new Event('db-updated'));
        }
      }
    },
    async clearUserCampaignContributions(userEmail) {
      const email = userEmail.toLowerCase().trim();
      if (isFirebaseConfigured && db) {
        try {
          const snapshot = await db.collection('contributions')
            .where('userEmail', '==', email)
            .get();
          
          const batch = db.batch();
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`Firestore clear user contributions: deleted ${snapshot.size} matches.`);
        } catch (e) {
          console.warn("Firestore clear user contributions error:", e);
        }
      } else {
        // Local Mock
        let contributions = this.getCampaignContributions();
        contributions = contributions.filter(c => c.userEmail.toLowerCase() !== email);
        localStorage.setItem('daimoku_db_campaign_contributions', JSON.stringify(contributions));
        window.dispatchEvent(new Event('db-updated'));
      }
    },
    addCampaignContribution(userEmail, username, block, campaignId, durationSeconds, date) {
      if (isFirebaseConfigured && db) {
        try {
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
        } catch (e) {
          console.error("Firestore add contribution sync error:", e);
        }
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
    },
    
    // Admin: Get all registered user profiles
    async getAllUsers() {
      if (isFirebaseConfigured && db) {
        try {
          const snapshot = await db.collection('users').get();
          const list = [];
          snapshot.forEach(doc => {
            list.push(doc.data());
          });
          return list;
        } catch (e) {
          console.warn("Firestore getAllUsers error:", e);
          return [];
        }
      } else {
        const users = JSON.parse(localStorage.getItem('daimoku_db_users') || '[]');
        return users.map(u => ({ username: u.username, email: u.email, block: u.block, isAdmin: u.isAdmin }));
      }
    },
    
    // Admin: Update user profile. If email is changed, migrates profile/states/whitelist docs
    async adminUpdateUser(oldEmail, newEmail, username, block) {
      const normOld = oldEmail.toLowerCase().trim();
      const normNew = newEmail.toLowerCase().trim();
      
      if (isFirebaseConfigured && db) {
        try {
          const batch = db.batch();
          
          if (normOld !== normNew) {
            // 1. Copy user profile
            const oldUserRef = db.collection('users').doc(normOld);
            const newUserRef = db.collection('users').doc(normNew);
            const userDoc = await oldUserRef.get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              userData.email = normNew;
              userData.username = username;
              userData.block = block;
              batch.set(newUserRef, userData);
              batch.delete(oldUserRef);
            } else {
              // If profile doesn't exist, create it fresh
              batch.set(newUserRef, { email: normNew, username, block, isAdmin: false });
            }
            
            // 2. Copy userState (keeps chanting hours and plant state)
            const oldStateRef = db.collection('userStates').doc(normOld);
            const newStateRef = db.collection('userStates').doc(normNew);
            const stateDoc = await oldStateRef.get();
            if (stateDoc.exists) {
              batch.set(newStateRef, stateDoc.data());
              batch.delete(oldStateRef);
            }
            
            // 3. Move/Update Whitelist entry
            const oldWhitelistRef = db.collection('whitelist').doc(normOld);
            const newWhitelistRef = db.collection('whitelist').doc(normNew);
            const whitelistDoc = await oldWhitelistRef.get();
            let code = 'WIS-333';
            if (whitelistDoc.exists) {
              code = whitelistDoc.data().code;
              batch.set(newWhitelistRef, whitelistDoc.data());
              batch.delete(oldWhitelistRef);
            } else {
              code = block.substr(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
              batch.set(newWhitelistRef, { code });
            }
            
            // 4. Update userEmail in past contributions (do NOT change the block field!)
            const contributionsSnapshot = await db.collection('contributions')
              .where('userEmail', '==', normOld)
              .get();
              
            contributionsSnapshot.forEach(doc => {
              batch.update(doc.ref, { userEmail: normNew });
            });
            
            await batch.commit();
            console.log("Admin email change completed in Firestore.");
          } else {
            // Just update username and block on the existing document (old block data stays in old block logs)
            const userRef = db.collection('users').doc(normOld);
            await userRef.update({ username, block });
            console.log("Admin profile update completed in Firestore (no email change).");
          }
        } catch (e) {
          console.error("Firestore adminUpdateUser error:", e);
          throw e;
        }
      } else {
        // Local Mock Mode
        const users = JSON.parse(localStorage.getItem('daimoku_db_users') || '[]');
        const userIdx = users.findIndex(u => u.email.toLowerCase() === normOld);
        if (userIdx !== -1) {
          if (normOld !== normNew) {
            users[userIdx].email = normNew;
            
            // Move state
            const stateData = localStorage.getItem(`daimoku_db_state_${normOld}`);
            if (stateData) {
              localStorage.setItem(`daimoku_db_state_${normNew}`, stateData);
              localStorage.removeItem(`daimoku_db_state_${normOld}`);
            }
            
            // Move whitelist
            const whitelist = JSON.parse(localStorage.getItem('daimoku_db_whitelist') || '[]');
            const wIdx = whitelist.findIndex(w => w.email.toLowerCase() === normOld);
            if (wIdx !== -1) {
              whitelist[wIdx].email = normNew;
              localStorage.setItem('daimoku_db_whitelist', JSON.stringify(whitelist));
            }
            
            // Update email in contributions
            let contributions = JSON.parse(localStorage.getItem('daimoku_db_campaign_contributions') || '[]');
            contributions.forEach(c => {
              if (c.userEmail.toLowerCase() === normOld) {
                c.userEmail = normNew;
              }
            });
            localStorage.setItem('daimoku_db_campaign_contributions', JSON.stringify(contributions));
          }
          users[userIdx].username = username;
          users[userIdx].block = block;
          localStorage.setItem('daimoku_db_users', JSON.stringify(users));
          window.dispatchEvent(new Event('db-updated'));
        }
      }
    },
    
    // Admin: Delete user profile, states, whitelist and contributions
    async adminDeleteUser(email) {
      const normEmail = email.toLowerCase().trim();
      if (isFirebaseConfigured && db) {
        try {
          const batch = db.batch();
          batch.delete(db.collection('users').doc(normEmail));
          batch.delete(db.collection('userStates').doc(normEmail));
          batch.delete(db.collection('whitelist').doc(normEmail));
          
          const contributionsSnapshot = await db.collection('contributions')
            .where('userEmail', '==', normEmail)
            .get();
          contributionsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
        } catch (e) {
          console.error("Firestore delete user error:", e);
          throw e;
        }
      } else {
        const users = JSON.parse(localStorage.getItem('daimoku_db_users') || '[]');
        const newUsers = users.filter(u => u.email.toLowerCase() !== normEmail);
        localStorage.setItem('daimoku_db_users', JSON.stringify(newUsers));
        
        localStorage.removeItem(`daimoku_db_state_${normEmail}`);
        
        const whitelist = JSON.parse(localStorage.getItem('daimoku_db_whitelist') || '[]');
        const newWhitelist = whitelist.filter(w => w.email.toLowerCase() !== normEmail);
        localStorage.setItem('daimoku_db_whitelist', JSON.stringify(newWhitelist));
        
        let contributions = JSON.parse(localStorage.getItem('daimoku_db_campaign_contributions') || '[]');
        contributions = contributions.filter(c => c.userEmail.toLowerCase() !== normEmail);
        localStorage.setItem('daimoku_db_campaign_contributions', JSON.stringify(contributions));
        window.dispatchEvent(new Event('db-updated'));
      }
    },
    
    // Admin: Pre-create user profile and whitelist
    async adminCreateUser(username, email, block) {
      const normEmail = email.toLowerCase().trim();
      const code = block.substr(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
      
      if (isFirebaseConfigured && db) {
        try {
          // Check if already exists in whitelist or users
          const whitelistDoc = await db.collection('whitelist').doc(normEmail).get();
          if (whitelistDoc.exists) {
            throw new Error("This email is already in the whitelist.");
          }
          
          await db.collection('whitelist').doc(normEmail).set({ code });
          await db.collection('users').doc(normEmail).set({
            username,
            email: normEmail,
            block,
            isAdmin: false
          });
          return code;
        } catch (e) {
          console.error("Firestore adminCreateUser error:", e);
          throw e;
        }
      } else {
        const whitelist = JSON.parse(localStorage.getItem('daimoku_db_whitelist') || '[]');
        if (whitelist.some(w => w.email.toLowerCase() === normEmail)) {
          throw new Error("This email is already in the whitelist.");
        }
        whitelist.push({ email: normEmail, code });
        localStorage.setItem('daimoku_db_whitelist', JSON.stringify(whitelist));
        
        const users = JSON.parse(localStorage.getItem('daimoku_db_users') || '[]');
        users.push({
          username,
          email: normEmail,
          block,
          password: 'password123',
          isAdmin: false
        });
        localStorage.setItem('daimoku_db_users', JSON.stringify(users));
        window.dispatchEvent(new Event('db-updated'));
        return code;
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
