import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const projectsSnap = await getDocs(collection(db, 'projects'));
  const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const reportsSnap = await getDocs(collection(db, 'reports'));
  const reports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log("Projects:", projects.map(p => ({ id: p.id, name: p.name })));
  console.log("Reports:", reports.map(r => ({ id: r.id, projectId: r.projectId })));
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
