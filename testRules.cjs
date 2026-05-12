const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, updateDoc, getDoc } = require('firebase/firestore');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, getAuth } = require('firebase/auth');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);
const auth = getAuth(app);

async function runTest() {
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, "test.user8@example.com", "Fauzan123!");
    uid = cred.user.uid;
    console.log("Created test user:", uid);
    
    // Set initial user doc (mimics app logic)
    await setDoc(doc(db, 'users', uid), {
      uid,
      name: "Test User",
      email: "test.user8@example.com",
      role: "owner",
      createdAt: new Date().toISOString(),
      tenantId: uid,
      isOnboarded: false
    });
    
  } catch(e) {
    if (e.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, "test.user8@example.com", "Fauzan123!");
      uid = cred.user.uid;
      console.log("Logged in test user!", uid);
    } else {
      console.log("Error creating user", e);
      return;
    }
  }
  
  // Test 1: update users
  try {
    await setDoc(doc(db, 'users', uid), {
      uid: uid,
      name: 'Unknown User',
      email: 'test@example.com',
      role: 'owner',
      createdAt: new Date().toISOString(),
      tenantId: uid,
      isOnboarded: true
    }, { merge: true });
    console.log("Update users YES");
  } catch(e) {
    console.error("Update users failed:", e);
  }
  
  // Test 2: tenant
  const tenantId = uid;
  try {
    await setDoc(doc(db, "tenants", tenantId), {
      id: tenantId,
      name: "Perusahaan Saya",
      createdAt: new Date().toISOString(),
      ownerId: uid,
    });
    console.log("set tenant WOW YES");
  } catch(e) {
    console.error("set tenant partial error", e);
  }

  process.exit(0);
}
runTest();
