// Shared configuration and mock data for the app

export const ENABLE_FIREBASE = true; // set to false to run without firebase
export const WP_SITE_URL = "https://dnbpedia.in";
export const ENABLE_WP_REST_SYNC = false; // Backup Token REST API sync (inactive by default)

export const firebaseConfig = {
  apiKey: "AIzaSyC-qVqLhxs8EbC1CpB-t5Wa7ZDMKJ8pU64",
  authDomain: "dnbpediain.firebaseapp.com",
  projectId: "dnbpediain",
  storageBucket: "dnbpediain.firebasestorage.app",
  messagingSenderId: "960945553986",
  appId: "1:960945553986:web:f9b82bafb0391591ed23db",
  measurementId: "G-R9TFX56KXV"
};

export const ADMIN_EMAILS = ['pediatrics@dnbpedia.in'];
export const EXAM_TYPES = ['DNB', 'DCH', 'BONUS'];
export const SESSIONS = ['June', 'December'];
export const PAPERS = {
  DNB: ['1', '2', '3', '4'],
  DCH: ['1', '2', '3']
};
export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

export const INITIAL_DATA_STANDARD = [
  {
    id: '1',
    questionText: "Explain the function of the Mitochondria.",
    answerText: "<p>The <b>mitochondria</b> is often referred to as the powerhouse of the cell.</p>",
    mnemonic: "<b>M</b>ighty <b>M</b>itochondria = <b>M</b>akes ATP",
    topic: "Biology",
    importance: "High",
    collection: 'questions',
    appearances: [{ exam: 'DNB', year: 2023, session: 'June', paper: '1' }]
  },
  {
    id: '2',
    questionText: "What are the clinical features of Rickets?",
    answerText: "<p>Bone tenderness, dental problems, muscle weakness, increased tendency for fractures.</p>",
    topic: "Nutrition",
    importance: "High",
    collection: 'questions',
    appearances: [{ exam: 'DCH', year: 2022, session: 'December', paper: '1' }]
  },
  {
    id: 'b1',
    questionText: "Discuss the recent guidelines on managing Pediatric MIS-C.",
    answerText: "<p>New protocols emphasize prompt recognition, use of IVIG, and steroids...</p>",
    topic: "Infectious Diseases",
    importance: "High",
    collection: 'questions',
    appearances: [{ exam: 'BONUS', year: '', session: '', paper: '' }]
  }
];

export const INITIAL_DATA_GOLD = [
  {
    id: 'g1',
    questionText: "[GOLD] Advanced Management of Status Epilepticus",
    answerText: "<p>Detailed protocol involving Benzodiazepines, Phenytoin, and anesthetic agents...</p>",
    topic: "Neurology",
    importance: "High",
    collection: 'questions_gold',
    appearances: [{ exam: 'DNB', year: 2024, session: 'June', paper: '3' }]
  }
];

export const getLocalDeviceId = () => {
  let did = localStorage.getItem('device_id');
  if (!did) {
    did = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    localStorage.setItem('device_id', did);
  }
  return did;
};
