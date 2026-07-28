import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updateProfile as updateAuthProfile, updatePassword
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs,
  addDoc, serverTimestamp, arrayUnion, arrayRemove, writeBatch, limit
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const root = document.querySelector('#app');
const toastRoot = document.querySelector('#toast-root');
let config;
let app;
let auth;
let db;
let account;
let currentUser;
let selectedClassroomId = '';
let adminSection = sessionStorage.getItem('kuzenler-admin-section') || 'overview';
let adminSearch = '';
let adminSchoolFilter = '';
let adminTeacherFilter = '';
let adminParentFilter = '';
let adminStatusFilter = 'active';
let adminSelectedSchoolId = '';
let adminModalResolver = null;
let syncTimer = null;
let syncedAttemptIds = new Set();
let syncedReportIds = new Set();

const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const fmtDate = (value) => value?.toDate ? value.toDate().toLocaleString('tr-TR') : value ? new Date(value).toLocaleString('tr-TR') : '—';
const uid = (prefix='id') => `${prefix}-${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;

function toast(message, type='') {
  const element = document.createElement('div');
  element.className = `toast ${type}`;
  element.textContent = message;
  toastRoot.replaceChildren(element);
  setTimeout(() => element.remove(), 3200);
}

function firebaseConfig() {
  return {
    apiKey: config.firebase.apiKey,
    authDomain: config.firebase.authDomain,
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.storageBucket,
    messagingSenderId: config.firebase.messagingSenderId,
    appId: config.firebase.appId,
    measurementId: config.firebase.measurementId || undefined
  };
}


const TURKEY_PROVINCES = ['Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin','Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkâri','Hatay','Isparta','Mersin','İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir','Kocaeli','Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş','Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak','Aksaray','Bayburt','Karaman','Kırıkkale','Batman','Şırnak','Bartın','Ardahan','Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce'];
const DISTRICTS = {
  'Uşak':['Merkez','Banaz','Eşme','Karahallı','Sivaslı','Ulubey'],
  'İstanbul':['Adalar','Arnavutköy','Ataşehir','Avcılar','Bağcılar','Bahçelievler','Bakırköy','Başakşehir','Bayrampaşa','Beşiktaş','Beykoz','Beylikdüzü','Beyoğlu','Büyükçekmece','Çatalca','Çekmeköy','Esenler','Esenyurt','Eyüpsultan','Fatih','Gaziosmanpaşa','Güngören','Kadıköy','Kağıthane','Kartal','Küçükçekmece','Maltepe','Pendik','Sancaktepe','Sarıyer','Silivri','Sultanbeyli','Sultangazi','Şile','Şişli','Tuzla','Ümraniye','Üsküdar','Zeytinburnu'],
  'Ankara':['Altındağ','Çankaya','Etimesgut','Keçiören','Mamak','Sincan','Yenimahalle','Gölbaşı','Pursaklar','Polatlı'],
  'İzmir':['Aliağa','Balçova','Bayraklı','Bornova','Buca','Çeşme','Çiğli','Gaziemir','Karabağlar','Karşıyaka','Konak','Menemen','Narlıdere','Torbalı','Urla'],
  'Denizli':['Merkezefendi','Pamukkale','Acıpayam','Buldan','Çal','Çivril','Honaz','Sarayköy','Tavas']
};
function provinceOptions(selected=''){ return TURKEY_PROVINCES.map(x=>`<option value="${esc(x)}" ${x===selected?'selected':''}>${esc(x)}</option>`).join(''); }
function districtOptions(city,selected=''){ const list=DISTRICTS[city]||[]; return `<option value="">İlçe seçin</option>${list.map(x=>`<option value="${esc(x)}" ${x===selected?'selected':''}>${esc(x)}</option>`).join('')}${selected&&!list.includes(selected)?`<option value="${esc(selected)}" selected>${esc(selected)}</option>`:''}`; }
function openAdminModal({title,subtitle='',body,submitText='Kaydet'}){
  return new Promise((resolve)=>{
    adminModalResolver=resolve;
    document.body.insertAdjacentHTML('beforeend',`<div class="admin-modal-backdrop" id="admin-modal"><section class="admin-modal" role="dialog" aria-modal="true"><div class="admin-modal-head"><div><span class="badge orange">Yönetim</span><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><button class="icon-button" data-platform-action="admin-modal-close" aria-label="Kapat">✕</button></div><div class="admin-modal-body">${body}</div><div class="admin-modal-actions"><button class="secondary-button" data-platform-action="admin-modal-close">Vazgeç</button><button class="primary-button" data-platform-action="admin-modal-submit">${esc(submitText)}</button></div></section></div>`);
  });
}
function closeAdminModal(result=null){ document.querySelector('#admin-modal')?.remove(); const resolve=adminModalResolver; adminModalResolver=null; resolve?.(result); }

function studentEmail(code) {
  return `${String(code).trim().toLowerCase()}@${config.studentAuthDomain}`;
}

function studentPassword(code, pin) {
  return `Ky!${String(pin).trim()}-${String(code).trim().toUpperCase()}`;
}

function randomStudentCode() {
  const bytes = crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000;
  return `KY${bytes}`;
}

function randomPin() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000);
}

function defaultExamPlansForGrade(grade) {
  const g = Number(grade);
  if (g === 8) return ['LGS'];
  if (g === 12) return ['YKS', 'KPSS'];
  if (g === 11) return ['YKS'];
  return [];
}

function effectiveExamPlans(learner) {
  if (learner?.examPlansCustomized) return Array.isArray(learner.examPlans) ? learner.examPlans : [];
  const current = Array.isArray(learner?.examPlans) ? learner.examPlans : [];
  return [...new Set([...defaultExamPlansForGrade(learner?.grade), ...current])];
}

function authLayout(content) {
  return `<main class="platform-shell auth-shell">
    <section class="auth-brand"><div class="platform-logo">🏆</div><div><strong>${esc(config.appName)}</strong><span>Öğrenme • Zekâ • Olimpiyat</span></div></section>
    ${content}
  </main>`;
}

function renderAuth(mode='login', role='parent') {
  const signup = mode === 'signup';
  root.innerHTML = authLayout(`
    <section class="auth-card">
      <span class="badge cyan">V5 merkezi hesap sistemi</span>
      <h1>${signup ? 'Yeni hesap oluştur' : 'Hesabına giriş yap'}</h1>
      <p>${signup ? 'Veli veya öğretmen hesabı açın. Öğrenci hesapları daha sonra yetişkin panelinden oluşturulur.' : 'Veli ve öğretmen e-posta ile, öğrenciler kod ve PIN ile giriş yapar.'}</p>
      <div class="auth-tabs">
        <button class="${mode==='login'?'active':''}" data-platform-action="auth-mode" data-mode="login">Yetişkin girişi</button>
        ${config.features.studentAccounts ? `<button class="${mode==='student'?'active':''}" data-platform-action="auth-mode" data-mode="student">Öğrenci girişi</button>` : ''}
        ${config.features.allowPublicSignup ? `<button class="${signup?'active':''}" data-platform-action="auth-mode" data-mode="signup">Kayıt ol</button>` : ''}
      </div>
      ${mode === 'student' ? `
        <div class="form-field"><label for="student-code">Öğrenci kodu</label><input id="student-code" autocomplete="username" placeholder="KY123456"></div>
        <div class="form-field"><label for="student-pin">4 haneli PIN</label><input id="student-pin" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" placeholder="••••"></div>
        <button class="primary-button full-width" data-platform-action="student-login">Öğrenci olarak gir</button>` : `
        ${signup ? `<div class="form-field"><label for="auth-name">Ad soyad</label><input id="auth-name" autocomplete="name"></div>
        <div class="role-choice">
          ${config.features.parentAccounts ? `<label class="form-check"><input class="form-check-input" type="radio" name="signup-role" value="parent" ${role==='parent'?'checked':''}><span class="form-check-label">👨‍👩‍👧 Veli hesabı</span></label>` : ''}
          ${config.features.teacherAccounts ? `<label class="form-check"><input class="form-check-input" type="radio" name="signup-role" value="teacher" ${role==='teacher'?'checked':''}><span class="form-check-label">👩‍🏫 Öğretmen hesabı</span></label>` : ''}
        </div>` : ''}
        <div class="form-field"><label for="auth-email">E-posta</label><input id="auth-email" type="email" autocomplete="email"></div>
        <div class="form-field"><label for="auth-password">Şifre</label><input id="auth-password" type="password" minlength="6" autocomplete="${signup?'new-password':'current-password'}"></div>
        <button class="primary-button full-width" data-platform-action="${signup?'adult-signup':'adult-login'}">${signup?'Hesap oluştur':'Giriş yap'}</button>
        ${!signup ? '<button class="text-button full-width" data-platform-action="forgot-password">Şifremi unuttum</button>' : ''}`}
      <div class="auth-security-note">🔒 Canlı modda giriş yapılmadan hiçbir öğrenci verisine veya oyuna erişilemez.</div>
    </section>`);
}

function renderAccountRecovery(message) {
  const canComplete = Boolean(currentUser && config.features.allowPublicSignup);
  const defaultName = currentUser?.displayName || String(currentUser?.email || '').split('@')[0] || '';
  root.innerHTML = authLayout(`<section class="auth-card">
    <h1>Hesap kaydını tamamla</h1>
    <p>${esc(message)}</p>
    ${canComplete ? `
      <p>Bu kullanıcı Firebase Authentication bölümünde önceden oluşturulmuş. Aşağıdan hesap türünü seçerek uygulama kaydını tamamlayabilirsiniz.</p>
      <div class="form-field"><label for="recovery-name">Ad soyad</label><input id="recovery-name" autocomplete="name" value="${esc(defaultName)}"></div>
      <div class="role-choice">
        ${String(currentUser?.email||'').toLowerCase()===String(config.ownerAdminEmail||'').toLowerCase() ? `<label class="form-check"><input class="form-check-input" type="radio" name="recovery-role" value="admin" checked><span class="form-check-label">🛡️ Sistem yöneticisi</span></label>` : ''}
        ${config.features.parentAccounts ? `<label class="form-check"><input class="form-check-input" type="radio" name="recovery-role" value="parent" ${String(currentUser?.email||'').toLowerCase()===String(config.ownerAdminEmail||'').toLowerCase()?'':'checked'}><span class="form-check-label">👨‍👩‍👧 Veli hesabı</span></label>` : ''}
        ${config.features.teacherAccounts ? `<label class="form-check"><input class="form-check-input" type="radio" name="recovery-role" value="teacher"><span class="form-check-label">👩‍🏫 Öğretmen hesabı</span></label>` : ''}
      </div>
      <button class="primary-button full-width" data-platform-action="complete-existing-account">Hesabı tamamla</button>
    ` : ''}
    <button class="text-button full-width" data-platform-action="logout">Çıkış yap</button>
  </section>`);
}

async function accountFor(uidValue) {
  const snap = await getDoc(doc(db, 'accounts', uidValue));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function waitForAuth() {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, (user) => { stop(); resolve(user); });
  });
}

async function createAdultAccount(role, name, email, password) {
  if (!['parent','teacher'].includes(role)) throw new Error('Geçersiz hesap rolü.');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateAuthProfile(credential.user, { displayName: name });
  await setDoc(doc(db, 'accounts', credential.user.uid), {
    role, displayName: name, email: credential.user.email, status: 'active',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), schemaVersion: 5
  });
  return credential.user;
}

async function createStudentAuth({ name, grade, age, classroomIds=[], parentIds=[] }) {
  const secondaryName = `student-create-${Date.now()}-${Math.random()}`;
  const secondaryApp = initializeApp(firebaseConfig(), secondaryName);
  const secondaryAuth = getAuth(secondaryApp);
  let credential = null;
  let code = '';
  let pin = '';
  try {
    for (let attempt=0; attempt<12; attempt+=1) {
      code = randomStudentCode();
      pin = randomPin();
      try {
        credential = await createUserWithEmailAndPassword(secondaryAuth, studentEmail(code), studentPassword(code,pin));
        break;
      } catch (error) {
        if (error?.code !== 'auth/email-already-in-use') throw error;
      }
    }
    if (!credential) throw new Error('Benzersiz öğrenci kodu üretilemedi. Yeniden deneyin.');
    await updateAuthProfile(credential.user,{displayName:name});
  } finally {
    await signOut(secondaryAuth).catch(()=>{});
    await deleteApp(secondaryApp).catch(()=>{});
  }
  const learnerId = uid('learner');
  const learner = {
    id: learnerId, authUid: credential.user.uid, studentCode: code, accessPin: pin, name,
    grade: Number(grade), age: Number(age), avatar:'🎯', status:'active', examPlans:defaultExamPlansForGrade(grade), examPlansCustomized:false, examField:'',
    parentIds, teacherIds: account.role === 'teacher' ? [currentUser.uid] : [], classroomIds,
    createdBy: currentUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), schemaVersion:5
  };
  await setDoc(doc(db,'learners',learnerId),learner);
  await Promise.all([
    setDoc(doc(db,'accounts',credential.user.uid),{
      role:'student', displayName:name, learnerId, studentCode:code, status:'active',
      createdAt:serverTimestamp(), updatedAt:serverTimestamp(), schemaVersion:5
    }),
    setDoc(doc(db,'learnerStates',learnerId),defaultCloudState(learnerId,name,grade,age)),
    setDoc(doc(db,'learnerMetrics',learnerId),emptyMetrics(learnerId,name,grade,classroomIds)),
    setDoc(doc(db,'leaderboards',learnerId),{
      learnerId, displayName:name||'Öğrenci', grade:Number(grade||0), age:Number(age||0),
      xp:0, accuracy:0, totalQuestions:0, updatedAt:serverTimestamp()
    },{merge:true})
  ]);
  return { learnerId, code, pin, name, grade:Number(grade), age:Number(age) };
}

function defaultProfile(learnerId,name,grade,age) {
  return {id:learnerId,name,grade:Number(grade),age:Number(age),avatar:'🎯',subtitle:`${grade}. Sınıf • Kişisel Öğrenme Planı`,xp:0,stars:0,streak:0,lastActiveDate:null,skills:{},completedGames:0,examPlans:defaultExamPlansForGrade(grade),examPlansCustomized:false,examField:''};
}

function defaultCloudState(learnerId,name,grade,age) {
  return { version:5, activeProfileId:learnerId, profiles:[defaultProfile(learnerId,name,grade,age)], settings:{sound:true,timer:true,dailyMinutes:25,parentPin:'1453'}, daily:{}, badges:[], seenQuestions:{}, blockedQuestionKeys:{}, updatedAt:serverTimestamp() };
}

function emptyMetrics(learnerId,name,grade,classroomIds=[]) {
  return {learnerId,name,grade:Number(grade),classroomIds,totalQuestions:0,correctCount:0,accuracy:0,totalMinutes:0,totalHints:0,lastActiveAt:null,gameStats:{},updatedAt:serverTimestamp()};
}

async function accessibleLearners() {
  if (account.role === 'admin') {
    const snap = await getDocs(query(collection(db,'learners'), limit(1000)));
    return snap.docs.map((item)=>({id:item.id,...item.data()}));
  }
  if (account.role === 'parent') {
    const snap = await getDocs(query(collection(db,'learners'), where('parentIds','array-contains',currentUser.uid)));
    return snap.docs.map((item)=>({id:item.id,...item.data()}));
  }
  if (account.role === 'teacher') {
    const classroomSnap = await getDocs(query(collection(db,'classrooms'), where('teacherIds','array-contains',currentUser.uid)));
    const classrooms = classroomSnap.docs.map((item)=>({id:item.id,...item.data()}));
    const ids = [...new Set(classrooms.flatMap((room)=>room.studentIds||[]))];
    const learners=[];
    for (const id of ids) {
      const snap=await getDoc(doc(db,'learners',id));
      if (snap.exists()) learners.push({id:snap.id,...snap.data()});
    }
    return learners;
  }
  return [];
}

async function classroomsForTeacher() {
  if (account.role === 'admin') {
    const snap=await getDocs(query(collection(db,'classrooms'),limit(500)));
    return snap.docs.map((item)=>({id:item.id,...item.data()}));
  }
  if (account.role !== 'teacher') return [];
  const snap=await getDocs(query(collection(db,'classrooms'), where('teacherIds','array-contains',currentUser.uid)));
  return snap.docs.map((item)=>({id:item.id,...item.data()}));
}

async function metricsForLearners(learners) {
  const map=new Map();
  await Promise.all(learners.map(async learner=>{
    const snap=await getDoc(doc(db,'learnerMetrics',learner.id));
    map.set(learner.id,snap.exists()?snap.data():emptyMetrics(learner.id,learner.name,learner.grade,learner.classroomIds));
  }));
  return map;
}

function metricCards(learners,metrics) {
  const rows=learners.map(l=>metrics.get(l.id)||{});
  const questions=rows.reduce((s,r)=>s+Number(r.totalQuestions||0),0);
  const minutes=rows.reduce((s,r)=>s+Number(r.totalMinutes||0),0);
  const correct=rows.reduce((s,r)=>s+Number(r.correctCount||0),0);
  const hints=rows.reduce((s,r)=>s+Number(r.totalHints||0),0);
  const accuracy=questions?Math.round(correct/questions*100):0;
  return `<div class="platform-metric-grid">
    <div class="metric-card"><div class="metric-label">Öğrenci</div><div class="metric-value">${learners.length}</div></div>
    <div class="metric-card"><div class="metric-label">Toplam soru</div><div class="metric-value">${questions}</div></div>
    <div class="metric-card"><div class="metric-label">Doğruluk</div><div class="metric-value">%${accuracy}</div></div>
    <div class="metric-card"><div class="metric-label">Süre / ipucu</div><div class="metric-value">${minutes} dk</div><div class="metric-note">${hints} ipucu</div></div>
  </div>`;
}

function learnerTable(learners,metrics,classrooms=[]) {
  if (!learners.length) return '<div class="empty-state">Henüz öğrenci kaydı yok.</div>';
  const roomMap=new Map(classrooms.map(r=>[r.id,r.name]));
  return `<div class="analytics-table-wrap"><table class="analytics-table"><thead><tr><th>Öğrenci</th><th>Kod</th><th>PIN</th><th>Sınıf</th><th>Soru</th><th>Doğruluk</th><th>Süre</th><th>İpucu</th><th>Son çalışma</th><th></th></tr></thead><tbody>${learners.map(learner=>{
    const m=metrics.get(learner.id)||{};
    return `<tr><td><strong>${esc(learner.name)}</strong></td><td><code>${esc(learner.studentCode||'—')}</code></td><td><strong>${esc(learner.accessPin||'Kayıtlı değil')}</strong></td><td>${learner.grade}. sınıf${learner.classroomIds?.length?`<br><small>${esc(learner.classroomIds.map(id=>roomMap.get(id)).filter(Boolean).join(', '))}</small>`:''}</td><td>${Number(m.totalQuestions||0)}</td><td>%${Number(m.accuracy||0)}</td><td>${Number(m.totalMinutes||0)} dk</td><td>${Number(m.totalHints||0)}</td><td>${fmtDate(m.lastActiveAt)}</td><td><div class="button-row compact"><button class="text-button" data-platform-action="analysis-learner" data-learner-id="${learner.id}">Analiz</button><button class="text-button" data-platform-action="play-learner" data-learner-id="${learner.id}">Oyun görünümü</button></div></td></tr>`;
  }).join('')}</tbody></table></div>`;
}


function printStudentList(learners, classrooms=[]) {
  if (!learners.length) throw new Error('PDF için öğrenci kaydı bulunamadı.');
  const roomMap = new Map(classrooms.map((room)=>[room.id, room.name]));
  const title = selectedClassroomId ? (roomMap.get(selectedClassroomId) || 'Seçili Sınıf') : 'Tüm Öğrenciler';
  const rows = learners.map((learner, index)=>`<tr><td>${index+1}</td><td>${esc(learner.name)}</td><td>${learner.grade}. sınıf</td><td>${esc(learner.studentCode||'—')}</td><td>${esc(learner.accessPin||'Kayıtlı değil')}</td><td>${esc((learner.classroomIds||[]).map((id)=>roomMap.get(id)).filter(Boolean).join(', ')||'—')}</td></tr>`).join('');
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) throw new Error('PDF penceresi açılamadı. Tarayıcı açılır pencere iznini etkinleştirin.');
  popup.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(title)} - Öğrenci Giriş Listesi</title><style>
    @page{size:A4;margin:14mm} body{font-family:Arial,sans-serif;color:#111;margin:0} h1{font-size:22px;margin:0 0 6px} p{margin:0 0 18px;color:#555;font-size:12px} table{width:100%;border-collapse:collapse;font-size:12px} th,td{border:1px solid #bbb;padding:7px;text-align:left} th{background:#eee} .note{margin-top:16px;font-size:10px;color:#666} @media print{button{display:none}}
  </style></head><body><h1>${esc(title)} — Öğrenci Giriş Listesi</h1><p>Oluşturulma: ${new Date().toLocaleString('tr-TR')} • Toplam ${learners.length} öğrenci</p><table><thead><tr><th>No</th><th>Ad Soyad</th><th>Sınıf</th><th>Öğrenci Kodu</th><th>PIN</th><th>Sınıf/Grup</th></tr></thead><tbody>${rows}</tbody></table><p class="note">Bu liste giriş bilgileri içerir. Yetkisiz kişilerle paylaşmayın.</p><script>window.onload=()=>setTimeout(()=>window.print(),250);<\/script></body></html>`);
  popup.document.close();
}


const GAME_NAMES = {
  wordMine:'Kelime Madeni', wordLadder:'Kelime Merdiveni', paragraphDetective:'Paragraf Dedektifi',
  targetNumber:'Hedef Sayı', geometryLab:'Geometri', problemHunter:'Problem Avcısı', olympiad:'Olimpiyat Merdiveni',
  logicStation:'Zekâ İstasyonu', englishWords:'İngilizce Kelimeler', englishGap:'İngilizce Boşluk',
  englishSentence:'İngilizce Cümle', scienceLab:'Fen Laboratuvarı', experimentDetective:'Deney Dedektifi',
  socialTimeline:'Sosyal Zaman', socialMap:'Harita Becerileri', socialCitizenship:'Vatandaşlık'
};

function gameName(gameId) {
  return GAME_NAMES[gameId] || String(gameId || 'Bilinmeyen oyun').replace(/[-_]/g,' ');
}

async function renderLearnerAnalysis(learnerId) {
  root.innerHTML='<main class="platform-shell"><div class="portal-loading">Öğrenci analizi hazırlanıyor…</div></main>';
  const learners=await accessibleLearners();
  const learner=learners.find(item=>item.id===learnerId);
  if(!learner) throw new Error('Bu öğrenciye erişim yetkiniz yok.');
  const [metricSnap,reportSnap]=await Promise.all([
    getDoc(doc(db,'learnerMetrics',learnerId)),
    getDocs(query(collection(db,'questionReports'),where('learnerId','==',learnerId),limit(200)))
  ]);
  const metric=metricSnap.exists()?metricSnap.data():emptyMetrics(learner.id,learner.name,learner.grade,learner.classroomIds);
  const gameRows=Object.entries(metric.gameStats||{}).map(([gameId,row])=>({gameId,...row})).sort((a,b)=>Number(b.questions||0)-Number(a.questions||0));
  const reports=reportSnap.docs.map(item=>({id:item.id,...item.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  root.innerHTML=`<main class="platform-shell portal-shell">
    <header class="portal-topbar"><div class="auth-brand"><div class="platform-logo">📊</div><div><strong>${esc(learner.name)}</strong><span>${learner.grade}. sınıf öğrenci analizi</span></div></div><button class="text-button" data-platform-action="portal">← Yönetim paneli</button></header>
    <section class="portal-hero"><div><span class="badge cyan">Profil bazlı analiz</span><h1>Güçlü ve zayıf alanları oyun bazında izle.</h1><p>Soru sayısı, doğruluk, toplam süre, ipucu kullanımı ve ortalama cevap süresi birlikte değerlendirilir.</p></div></section>
    <div class="platform-metric-grid">
      <div class="metric-card"><div class="metric-label">Toplam soru</div><div class="metric-value">${Number(metric.totalQuestions||0)}</div></div>
      <div class="metric-card"><div class="metric-label">Doğruluk</div><div class="metric-value">%${Number(metric.accuracy||0)}</div></div>
      <div class="metric-card"><div class="metric-label">Çalışma süresi</div><div class="metric-value">${Number(metric.totalMinutes||0)} dk</div></div>
      <div class="metric-card"><div class="metric-label">Toplam ipucu</div><div class="metric-value">${Number(metric.totalHints||0)}</div></div>
    </div>
    <section class="section panel"><div class="section-header"><div><h2>Oyun bazında analiz</h2><p>İpucu yoğunluğu ve cevap süresi, yalnız doğru oranından daha anlamlı gelişim sinyali verir.</p></div></div>
      ${gameRows.length?`<div class="analytics-table-wrap"><table class="analytics-table"><thead><tr><th>Oyun</th><th>Soru</th><th>Doğruluk</th><th>İpucu</th><th>Ort. süre</th></tr></thead><tbody>${gameRows.map(row=>`<tr><td>${esc(gameName(row.gameId))}</td><td>${Number(row.questions||0)}</td><td>%${row.questions?Math.round(Number(row.correct||0)/Number(row.questions)*100):0}</td><td>${Number(row.hints||0)}</td><td>${row.questions?Math.round(Number(row.seconds||0)/Number(row.questions)):0} sn</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state">Henüz oyun verisi yok.</div>'}
    </section>
    <section class="section panel"><div class="section-header"><div><h2>Soru kalite bildirimleri</h2><p>Öğrencinin hatalı, belirsiz, çok kolay veya yetersiz açıklamalı bulduğu sorular.</p></div><span class="badge orange">${reports.length}</span></div>
      ${reports.length?`<div class="report-list">${reports.slice(0,30).map(report=>`<article class="report-item"><div><span class="badge">${esc(gameName(report.gameId))}</span><span class="badge ${report.status==='resolved'?'green':'orange'}">${esc(report.status||'pending')}</span></div><h3>${esc(report.prompt||'Soru metni yok')}</h3><p>${esc(report.reason||'other')}${report.note?` • ${esc(report.note)}`:''}</p></article>`).join('')}</div>`:'<div class="empty-state">Bu öğrenci henüz soru bildirmedi.</div>'}
    </section>
  </main>`;
}


async function allAccountsForAdmin() {
  if (account.role !== 'admin') return [];
  const snap=await getDocs(query(collection(db,'accounts'),limit(1000)));
  return snap.docs.map(item=>({id:item.id,...item.data()}));
}

function roleText(role) {
  return ({admin:'Yönetici',teacher:'Öğretmen',parent:'Veli',student:'Öğrenci'})[role] || role || '—';
}

function statusText(status) {
  return ({active:'Aktif',inactive:'Pasif',archived:'Arşiv',deleted:'Silinmiş'})[status || 'active'] || status;
}

function filterRows(rows, fields=[]) {
  const needle=adminSearch.trim().toLocaleLowerCase('tr-TR');
  return rows.filter((row)=>{
    if (adminStatusFilter && adminStatusFilter!=='all' && (row.status||'active')!==adminStatusFilter) return false;
    if (!needle) return true;
    return fields.some((field)=>String(row[field]||'').toLocaleLowerCase('tr-TR').includes(needle));
  });
}

function adminToolbar() {
  const tabs=[['overview','Genel Bakış'],['schools','Okullar'],['classrooms','Sınıflar'],['teachers','Öğretmenler'],['parents','Veliler'],['learners','Öğrenciler'],['question-reports','Soru İnceleme']];
  return `<div class="admin-module-tabs">${tabs.map(([id,label])=>`<button class="secondary-button ${adminSection===id?'active':''}" data-platform-action="admin-section" data-section="${id}">${label}</button>`).join('')}</div>
  <div class="admin-list-tools mt-18"><div class="form-field"><label for="admin-search">Ara</label><input id="admin-search" value="${esc(adminSearch)}" placeholder="Ad, e-posta, kod veya okul"></div><div class="form-field"><label for="admin-status-filter">Durum</label><select id="admin-status-filter"><option value="all" ${adminStatusFilter==='all'?'selected':''}>Tümü</option><option value="active" ${adminStatusFilter==='active'?'selected':''}>Aktif</option><option value="inactive" ${adminStatusFilter==='inactive'?'selected':''}>Pasif</option><option value="archived" ${adminStatusFilter==='archived'?'selected':''}>Arşiv</option><option value="deleted" ${adminStatusFilter==='deleted'?'selected':''}>Silinmiş</option></select></div><button class="secondary-button" data-platform-action="admin-apply-filter">Filtrele</button><button class="primary-button" data-platform-action="admin-new-menu">+ Yeni Kayıt</button></div>`;
}

function adminOverview(accounts,schools,classrooms,learners) {
  const teachers=accounts.filter(x=>x.role==='teacher' && (x.status||'active')!=='deleted');
  const parents=accounts.filter(x=>x.role==='parent' && (x.status||'active')!=='deleted');
  return `<div class="platform-metric-grid mt-18"><div class="metric-card"><div class="metric-label">Okul</div><div class="metric-value">${schools.length}</div></div><div class="metric-card"><div class="metric-label">Sınıf</div><div class="metric-value">${classrooms.length}</div></div><div class="metric-card"><div class="metric-label">Öğretmen</div><div class="metric-value">${teachers.length}</div></div><div class="metric-card"><div class="metric-label">Veli</div><div class="metric-value">${parents.length}</div></div><div class="metric-card"><div class="metric-label">Öğrenci</div><div class="metric-value">${learners.length}</div></div></div>
  <div class="portal-two-column mt-18"><div class="section panel"><h3>Hızlı işlemler</h3><div class="button-row"><button class="primary-button" data-platform-action="admin-create-school">Yeni okul</button><button class="secondary-button" data-platform-action="admin-create-adult" data-role="teacher">Yeni öğretmen</button><button class="secondary-button" data-platform-action="admin-create-adult" data-role="parent">Yeni veli</button><button class="secondary-button" data-platform-action="admin-create-learner">Yeni öğrenci</button></div></div><div class="section panel"><h3>Bağlantı modeli</h3><p>Öğrenci okul, sınıf, öğretmen veya veliye bağlı olabilir; bunların tamamı boş da bırakılabilir. Sınıf değişiminde öğrenci kaydı korunur ve geçmiş bağlantı kaydı yazılır.</p></div></div>`;
}

function schoolsModule(schools,classrooms,accounts,learners) {
  if (adminSelectedSchoolId) {
    const school=schools.find(x=>x.id===adminSelectedSchoolId);
    if (!school) adminSelectedSchoolId='';
    else {
      const rooms=classrooms.filter(x=>x.schoolId===school.id && (x.status||'active')!=='deleted');
      const teachers=accounts.filter(x=>x.role==='teacher'&&(x.schoolIds||[]).includes(school.id));
      const roomIds=rooms.map(x=>x.id);
      const students=learners.filter(x=>x.schoolId===school.id||(x.classroomIds||[]).some(id=>roomIds.includes(id)));
      return `<div class="school-detail-head"><button class="secondary-button" data-platform-action="admin-school-back">← Okullar</button><div><span class="badge orange">Okul detayı</span><h3>${esc(school.name)}</h3><p>${esc([school.city,school.district].filter(Boolean).join(' / ')||'Konum belirtilmedi')}</p></div></div><div class="platform-metric-grid"><div class="metric-card"><div class="metric-label">Sınıf</div><div class="metric-value">${rooms.length}</div></div><div class="metric-card"><div class="metric-label">Öğretmen</div><div class="metric-value">${teachers.length}</div></div><div class="metric-card"><div class="metric-label">Öğrenci</div><div class="metric-value">${students.length}</div></div></div><div class="button-row school-detail-actions"><button class="primary-button" data-platform-action="admin-create-classroom" data-school-id="${school.id}">+ Yeni sınıf</button><button class="secondary-button" data-platform-action="admin-edit-school" data-id="${school.id}">Okulu düzenle</button></div><div class="admin-card-list">${rooms.length?rooms.map(room=>`<article class="admin-entity-card"><div class="entity-icon">🏫</div><div class="entity-main"><h4>${esc(room.name)}</h4><p>${room.grade||'—'}. sınıf · ${(room.teacherIds||[]).length} öğretmen · ${(room.studentIds||[]).length} öğrenci</p></div><div class="entity-actions"><button class="secondary-button" data-platform-action="admin-edit-classroom" data-id="${room.id}">Düzenle</button></div></article>`).join(''):'<div class="empty-state">Bu okulda henüz sınıf yok.</div>'}</div>`;
    }
  }
  const rows=filterRows(schools,['name','city','district']);
  return `<div class="section-header"><div><h3>Okullar</h3><p>Okula dokun; okul özeti, sınıflar, öğretmenler ve öğrenciler tek ekranda açılsın.</p></div><button class="primary-button" data-platform-action="admin-create-school">+ Yeni okul</button></div><div class="admin-card-list">${rows.map(row=>{const roomIds=classrooms.filter(c=>c.schoolId===row.id).map(c=>c.id);const teacherCount=accounts.filter(a=>a.role==='teacher'&&(a.schoolIds||[]).includes(row.id)).length;const studentCount=learners.filter(l=>l.schoolId===row.id||(l.classroomIds||[]).some(id=>roomIds.includes(id))).length;return `<article class="admin-entity-card clickable" data-platform-action="admin-drill-school" data-id="${row.id}"><div class="entity-icon">🏫</div><div class="entity-main"><h4>${esc(row.name)}</h4><p>${esc([row.city,row.district].filter(Boolean).join(' / ')||'Konum belirtilmedi')}</p><div class="entity-stats"><span>${roomIds.length} sınıf</span><span>${teacherCount} öğretmen</span><span>${studentCount} öğrenci</span></div></div><span class="entity-chevron">›</span></article>`}).join('')||'<div class="empty-state">Henüz okul kaydı yok.</div>'}</div>`;
}

function classroomsModule(classrooms,schools,accounts,learners) {
  const schoolMap=new Map(schools.map(x=>[x.id,x.name]));
  const rows=filterRows(classrooms,['name']).filter(r=>!adminSchoolFilter||r.schoolId===adminSchoolFilter);
  return `<div class="section-header"><div><h3>Sınıflar</h3><p>Sınıfları okul, öğretmen ve öğrenci sayılarıyla mobil kartlarda yönetin.</p></div><button class="primary-button" data-platform-action="admin-create-classroom">+ Yeni sınıf</button></div><div class="form-field"><label for="admin-school-filter">Okula göre filtrele</label><select id="admin-school-filter"><option value="">Tüm okullar</option>${schools.map(s=>`<option value="${s.id}" ${adminSchoolFilter===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div class="admin-card-list">${rows.map(row=>`<article class="admin-entity-card"><div class="entity-icon">🧑‍🏫</div><div class="entity-main"><h4>${esc(row.name)}</h4><p>${esc(schoolMap.get(row.schoolId)||'Bağımsız')} · ${row.grade||'—'}. sınıf</p><div class="entity-stats"><span>${(row.teacherIds||[]).length} öğretmen</span><span>${(row.studentIds||[]).length} öğrenci</span><span>${statusText(row.status)}</span></div></div><div class="entity-actions"><button class="secondary-button" data-platform-action="admin-edit-classroom" data-id="${row.id}">Düzenle</button></div></article>`).join('')||'<div class="empty-state">Sınıf bulunamadı.</div>'}</div>`;
}

function adultsModule(role,accounts,schools,classrooms,learners) {
  const schoolMap=new Map(schools.map(x=>[x.id,x.name])); const rows=filterRows(accounts.filter(x=>x.role===role),['displayName','email']);
  const title=role==='teacher'?'Öğretmenler':'Veliler';
  return `<div class="section-header"><div><h3>${title}</h3><p>${role==='teacher'?'Okul, sınıf ve öğrenci bağlantılarını yönetin.':'Bağlı çocukları ve hesap durumunu yönetin.'}</p></div><button class="primary-button" data-platform-action="admin-create-adult" data-role="${role}">+ Yeni ${role==='teacher'?'öğretmen':'veli'}</button></div><div class="admin-card-list">${rows.map(row=>{const relation=role==='teacher'?`${(row.schoolIds||[]).map(id=>schoolMap.get(id)).filter(Boolean).join(', ')||'Okul bağlantısı yok'} · ${classrooms.filter(c=>(c.teacherIds||[]).includes(row.id)).length} sınıf`:`${learners.filter(l=>(l.parentIds||[]).includes(row.id)).length} öğrenci`;return `<article class="admin-entity-card"><div class="entity-icon">${role==='teacher'?'👩‍🏫':'👨‍👩‍👧'}</div><div class="entity-main"><h4>${esc(row.displayName||'—')}</h4><p>${esc(row.email||'—')}</p><div class="entity-stats"><span>${esc(relation)}</span><span>${statusText(row.status)}</span></div></div><div class="entity-actions"><button class="secondary-button" data-platform-action="admin-edit-adult" data-id="${row.id}">Düzenle</button><button class="icon-button" data-platform-action="admin-reset-password" data-email="${esc(row.email||'')}" title="Şifre yenile">🔑</button></div></article>`}).join('')||'<div class="empty-state">Kayıt bulunamadı.</div>'}</div>`;
}

function learnersModule(learners,schools,classrooms,accounts) {
  const schoolMap=new Map(schools.map(x=>[x.id,x.name])); const roomMap=new Map(classrooms.map(x=>[x.id,x.name])); const accountMap=new Map(accounts.map(x=>[x.id,x.displayName||x.email]));
  let rows=filterRows(learners,['name','studentCode']); if(adminSchoolFilter) rows=rows.filter(l=>l.schoolId===adminSchoolFilter||(l.classroomIds||[]).some(id=>classrooms.find(c=>c.id===id)?.schoolId===adminSchoolFilter)); if(adminTeacherFilter) rows=rows.filter(l=>(l.teacherIds||[]).includes(adminTeacherFilter)); if(adminParentFilter) rows=rows.filter(l=>(l.parentIds||[]).includes(adminParentFilter));
  const teachers=accounts.filter(a=>a.role==='teacher'&&(a.status||'active')!=='deleted'); const parents=accounts.filter(a=>a.role==='parent'&&(a.status||'active')!=='deleted');
  return `<div class="section-header"><div><h3>Öğrenciler</h3><p>Öğrenci bilgileri ve bağlantıları mobil kartlarda okunabilir.</p></div><div class="button-row"><button class="secondary-button" data-platform-action="print-student-list">PDF / Yazdır</button><button class="primary-button" data-platform-action="admin-create-learner">+ Yeni öğrenci</button></div></div><div class="form-grid"><div class="form-field"><label for="admin-school-filter">Okul</label><select id="admin-school-filter"><option value="">Tümü</option>${schools.map(s=>`<option value="${s.id}" ${adminSchoolFilter===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div class="form-field"><label for="admin-teacher-filter">Öğretmen</label><select id="admin-teacher-filter"><option value="">Tümü</option>${teachers.map(a=>`<option value="${a.id}" ${adminTeacherFilter===a.id?'selected':''}>${esc(a.displayName)}</option>`).join('')}</select></div><div class="form-field"><label for="admin-parent-filter">Veli</label><select id="admin-parent-filter"><option value="">Tümü</option>${parents.map(a=>`<option value="${a.id}" ${adminParentFilter===a.id?'selected':''}>${esc(a.displayName)}</option>`).join('')}</select></div></div><div class="admin-card-list">${rows.map(l=>`<article class="admin-entity-card"><div class="entity-icon">🎓</div><div class="entity-main"><h4>${esc(l.name)}</h4><p>${l.grade}. sınıf · ${l.age||'—'} yaş · ${esc(schoolMap.get(l.schoolId)||'Bağımsız')}</p><div class="credential-inline"><code>${esc(l.studentCode||'—')}</code><strong>PIN: ${esc(l.accessPin||'Kayıtlı değil')}</strong></div><div class="entity-stats"><span>${esc((l.classroomIds||[]).map(id=>roomMap.get(id)).filter(Boolean).join(', ')||'Sınıfsız')}</span><span>${(l.teacherIds||[]).length} öğretmen</span><span>${(l.parentIds||[]).length} veli</span></div></div><div class="entity-actions learner-actions" data-feature="learner-actions"><button class="secondary-button" data-platform-action="admin-edit-learner" data-id="${l.id}" data-feature="learner-edit">Düzenle</button><button class="secondary-button" data-platform-action="admin-reset-pin" data-id="${l.id}" data-feature="learner-random-pin">Yeni PIN</button><button class="secondary-button" data-platform-action="admin-custom-pin" data-id="${l.id}" data-feature="learner-custom-pin">Özel PIN</button><button class="secondary-button" data-platform-action="admin-edit-learner" data-id="${l.id}" data-feature="learner-links">Sınıf / Bağlantılar</button><button class="secondary-button" data-platform-action="analysis-learner" data-learner-id="${l.id}" data-feature="learner-analysis">Analiz</button><button class="secondary-button" data-platform-action="play-learner" data-learner-id="${l.id}" data-feature="learner-preview">Oyun görünümü</button><button class="secondary-button" data-platform-action="admin-toggle-record" data-collection="learners" data-id="${l.id}" data-status="${l.status||'active'}" data-feature="learner-toggle-status">${(l.status||'active')==='active'?'Pasife al':'Aktif et'}</button><button class="danger-button" data-platform-action="admin-delete-record" data-collection="learners" data-id="${l.id}" data-feature="learner-delete">Sil</button></div></article>`).join('')||'<div class="empty-state">Öğrenci bulunamadı.</div>'}</div>`;
}

function reportReasonText(reason) {
  return ({
    'answer-wrong':'Doğru cevap / çözüm yanlış', ambiguous:'Belirsiz veya birden fazla cevap',
    'same-question':'Aynı soru tekrar çıktı', 'expression-error':'İfade bozukluğu', typo:'Yazım / anlatım hatası',
    'too-easy':'Çok kolay', 'bad-hint':'İpucu hatalı', 'bad-solution':'Çözüm yetersiz',
    'visual-conflict':'Görsel ve metin çelişiyor', other:'Diğer'
  })[reason] || reason || 'Diğer';
}

function aiReviewForReport(report, duplicateCount=1) {
  const signals=[];
  let verdict='İnsan incelemesi gerekli';
  let confidence=58;
  if (report.reason==='same-question' || duplicateCount>1) { verdict='Tekrar üretim sorunu olası'; confidence=92; signals.push(`Aynı soru için ${duplicateCount} bildirim/kayıt bulundu.`); }
  if (report.reason==='answer-wrong') { verdict='Cevap ve çözüm yeniden hesaplanmalı'; confidence=Math.max(confidence,82); signals.push('Öğrenci doğru cevap veya açıklamayı işaretledi.'); }
  if (report.reason==='ambiguous') { verdict='Birden fazla geçerli cevap ihtimali'; confidence=Math.max(confidence,78); signals.push('Soru kökü ve seçenekler birlikte doğrulanmalı.'); }
  if (report.reason==='expression-error' || report.reason==='typo') { verdict='Dil ve ifade sorunu olası'; confidence=Math.max(confidence,86); signals.push('Soru metni Türkçe anlatım açısından incelenmeli.'); }
  if (report.wasAnswered===false) signals.push('Bildirim cevap verilmeden yapılmış; öğrenci soruyu anlamamış olabilir.');
  if (report.wasCorrect===false) signals.push('Öğrenci yanlış cevap sonrasında bildirmiş; bu tek başına sorunun hatalı olduğunu kanıtlamaz.');
  if (report.wasCorrect===true) signals.push('Öğrenci doğru cevaplamasına rağmen bildirmiş; içerik sorunu ihtimali güçlenir.');
  if (!String(report.canonicalAnswer||'').trim()) { signals.push('Sistem cevabı kayıtta yok; doğrulama yapılamıyor.'); confidence=Math.min(confidence,55); }
  return {verdict,confidence,signals,generatedAt:new Date().toISOString(),engine:'Kural + kanıt tabanlı AI ön inceleme v1'};
}

function questionReportsModule(reports,learners) {
  const learnerMap=new Map(learners.map(x=>[x.id,x.name]));
  const duplicateMap=new Map();
  reports.forEach(r=>duplicateMap.set(r.questionKey,(duplicateMap.get(r.questionKey)||0)+1));
  const rows=reports.filter(r=>!adminSearch || [r.prompt,r.note,r.gameTitle,learnerMap.get(r.learnerId)].some(v=>String(v||'').toLocaleLowerCase('tr-TR').includes(adminSearch.toLocaleLowerCase('tr-TR'))));
  return `<div class="section-header"><div><h3>Soru İnceleme Merkezi</h3><p>Hatalı, tekrarlanan veya anlaşılmayan soruları öğrenci cevabı ve sistem cevabıyla birlikte inceleyin. AI ön inceleme karar vermez; kanıtları özetler.</p></div><span class="badge orange">${rows.length} bildirim</span></div>
  ${rows.length?`<div class="report-list">${rows.map(report=>{const ai=report.aiReview;return `<article class="report-item"><div><span class="badge cyan">${esc(learnerMap.get(report.learnerId)||report.profileName||'Öğrenci')}</span><span class="badge">${esc(gameName(report.gameId))}</span><span class="badge orange">${esc(reportReasonText(report.reason))}</span><span class="badge ${report.status==='resolved'?'green':''}">${esc(report.reviewDecision||report.status||'pending')}</span></div><h3>${esc(report.prompt||'Soru metni yok')}</h3>${report.context?`<p>${esc(report.context)}</p>`:''}<div class="report-answer-grid"><p><small>Öğrencinin cevabı</small><br>${esc(report.userAnswer||'Cevap vermedi')}</p><p><small>Sistemin cevabı</small><br>${esc(report.canonicalAnswer||'Kayıtlı değil')}</p></div>${report.note?`<p><strong>Öğrenci notu:</strong> ${esc(report.note)}</p>`:''}${ai?`<div class="ai-review-box"><strong>🤖 ${esc(ai.verdict)}</strong><p>Güven: %${Number(ai.confidence||0)} • ${esc(ai.engine||'AI ön inceleme')}</p><ul>${(ai.signals||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<div class="button-row compact"><button class="text-button" data-platform-action="admin-ai-review-report" data-id="${report.id}">🤖 AI analiz et</button><button class="text-button" data-platform-action="admin-decide-report" data-id="${report.id}" data-decision="question_invalid">Soru hatalı</button><button class="text-button" data-platform-action="admin-decide-report" data-id="${report.id}" data-decision="answer_invalid">Cevap/çözüm hatalı</button><button class="text-button" data-platform-action="admin-decide-report" data-id="${report.id}" data-decision="student_struggled">Öğrenci zorlanmış</button><button class="text-button" data-platform-action="admin-decide-report" data-id="${report.id}" data-decision="duplicate">Tekrar soru</button><button class="text-button" data-platform-action="admin-decide-report" data-id="${report.id}" data-decision="dismissed">Geçersiz</button></div></article>`}).join('')}</div>`:'<div class="empty-state">Henüz soru bildirimi yok.</div>'}`;
}

function adminManagement(accounts,classrooms,learners,schools=[],questionReports=[]) {
  let body=adminOverview(accounts,schools,classrooms,learners);
  if(adminSection==='schools') body=schoolsModule(schools,classrooms,accounts,learners);
  if(adminSection==='classrooms') body=classroomsModule(classrooms,schools,accounts,learners);
  if(adminSection==='teachers') body=adultsModule('teacher',accounts,schools,classrooms,learners);
  if(adminSection==='parents') body=adultsModule('parent',accounts,schools,classrooms,learners);
  if(adminSection==='learners') body=learnersModule(learners,schools,classrooms,accounts);
  if(adminSection==='question-reports') body=questionReportsModule(questionReports,learners);
  return `<section class="section panel"><div class="section-header"><div><h2>Merkezi yönetim paneli</h2><p>Okuldan öğrenciye silsile, ayrı listeler, arama, filtre, düzenleme, pasife alma ve kontrollü silme.</p></div><span class="badge orange">Tam yetki</span></div>${adminToolbar()}<div class="mt-18">${body}</div></section>`;
}

async function allSchoolsForAdmin() {
  if(account.role!=='admin') return [];
  const snap=await getDocs(query(collection(db,'organizations'),limit(1000)));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}

async function createAdultByAdmin(role) {
  if(account.role!=='admin') throw new Error('Yalnız admin yetişkin hesabı oluşturabilir.');
  const name=prompt(`${role==='teacher'?'Öğretmen':'Veli'} ad soyad:`)?.trim(); if(!name) return;
  const email=prompt('E-posta adresi:')?.trim(); if(!email) return;
  const password=prompt('Geçici şifre (en az 6 karakter):')||''; if(password.length<6) throw new Error('Geçici şifre en az 6 karakter olmalıdır.');
  const secondaryApp=initializeApp(firebaseConfig(),`adult-create-${Date.now()}`); const secondaryAuth=getAuth(secondaryApp);
  try { const cred=await createUserWithEmailAndPassword(secondaryAuth,email,password); await updateAuthProfile(cred.user,{displayName:name}); await setDoc(doc(db,'accounts',cred.user.uid),{role,displayName:name,email,status:'active',schoolIds:[],createdBy:currentUser.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),schemaVersion:5.1}); }
  finally { await signOut(secondaryAuth).catch(()=>{}); await deleteApp(secondaryApp).catch(()=>{}); }
}

async function createSchoolByAdmin() {
  const name=prompt('Okul adı:')?.trim(); if(!name) return;
  const city=prompt('İl:','Uşak')?.trim()||''; const district=prompt('İlçe:')?.trim()||'';
  await addDoc(collection(db,'organizations'),{name,city,district,status:'active',createdBy:currentUser.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),schemaVersion:5.1});
}

async function createClassroomByAdmin(schools) {
  const name=prompt('Sınıf adı (ör. 4-A):')?.trim(); if(!name) return;
  const grade=Number(prompt('Sınıf seviyesi (1-12):','4')); if(!(grade>=1&&grade<=12)) throw new Error('Sınıf seviyesi 1-12 olmalıdır.');
  const schoolHint=schools.map(s=>`${s.id} = ${s.name}`).join('\n'); const schoolId=prompt(`Okul kimliği (bağımsız için boş):\n${schoolHint}`)?.trim()||'';
  await addDoc(collection(db,'classrooms'),{name,grade,schoolId,status:'active',teacherIds:[],studentIds:[],createdBy:currentUser.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),schemaVersion:5.1});
}

async function createLearnerByAdmin(schools,classrooms,accounts) {
  const name=prompt('Öğrenci ad soyad:')?.trim(); if(!name) return;
  const grade=Number(prompt('Sınıf seviyesi:','4')); const age=Number(prompt('Yaş:','9'));
  const schoolId=prompt(`Okul kimliği (bağımsız için boş):\n${schools.map(s=>`${s.id} = ${s.name}`).join('\n')}`)?.trim()||'';
  const classroomId=prompt(`Sınıf kimliği (sınıfsız için boş):\n${classrooms.filter(c=>!schoolId||c.schoolId===schoolId).map(c=>`${c.id} = ${c.name}`).join('\n')}`)?.trim()||'';
  const parentId=prompt(`Veli kimliği (velisiz için boş):\n${accounts.filter(a=>a.role==='parent').map(a=>`${a.id} = ${a.displayName}`).join('\n')}`)?.trim()||'';
  const teacherId=prompt(`Öğretmen kimliği (öğretmensiz için boş):\n${accounts.filter(a=>a.role==='teacher').map(a=>`${a.id} = ${a.displayName}`).join('\n')}`)?.trim()||'';
  const result=await createStudentAuth({name,grade,age,classroomIds:classroomId?[classroomId]:[],parentIds:parentId?[parentId]:[]});
  await updateDoc(doc(db,'learners',result.learnerId),{schoolId,teacherIds:teacherId?[teacherId]:[],examPlans:defaultExamPlansForGrade(grade),examPlansCustomized:false,updatedAt:serverTimestamp()});
  if(classroomId) await updateDoc(doc(db,'classrooms',classroomId),{studentIds:arrayUnion(result.learnerId),updatedAt:serverTimestamp()});
}

async function changeStudentPin(learner,newPin) {
  if(!/^\d{4}$/.test(newPin)) throw new Error('PIN dört rakam olmalıdır.');
  if(!learner.accessPin) throw new Error('Eski PIN kaydı bulunamadı. Bu öğrenci için yeni kod hesabı oluşturulmalıdır.');
  const secondaryApp=initializeApp(firebaseConfig(),`pin-reset-${Date.now()}`); const secondaryAuth=getAuth(secondaryApp);
  try { const cred=await signInWithEmailAndPassword(secondaryAuth,studentEmail(learner.studentCode),studentPassword(learner.studentCode,learner.accessPin)); await updatePassword(cred.user,studentPassword(learner.studentCode,newPin)); }
  finally { await signOut(secondaryAuth).catch(()=>{}); await deleteApp(secondaryApp).catch(()=>{}); }
  await updateDoc(doc(db,'learners',learner.id),{accessPin:newPin,updatedAt:serverTimestamp()});
}

async function editLearnerByAdmin(learner,schools,classrooms,accounts) {
  const name=prompt('Ad soyad:',learner.name)?.trim(); if(!name) return;
  const grade=Number(prompt('Sınıf seviyesi:',String(learner.grade||4))); const age=Number(prompt('Yaş:',String(learner.age||9)));
  const schoolId=prompt(`Okul kimliği (boş = bağımsız):\n${schools.map(s=>`${s.id} = ${s.name}`).join('\n')}`,learner.schoolId||'')?.trim()||'';
  const classroomId=prompt(`Yeni sınıf kimliği (boş = sınıfsız):\n${classrooms.filter(c=>!schoolId||c.schoolId===schoolId).map(c=>`${c.id} = ${c.name}`).join('\n')}`,(learner.classroomIds||[])[0]||'')?.trim()||'';
  const parentIdsRaw=prompt(`Veli kimlikleri, virgülle (boş = velisiz):\n${accounts.filter(a=>a.role==='parent').map(a=>`${a.id} = ${a.displayName}`).join('\n')}`,(learner.parentIds||[]).join(','))||'';
  const teacherIdsRaw=prompt(`Öğretmen kimlikleri, virgülle (boş = öğretmensiz):\n${accounts.filter(a=>a.role==='teacher').map(a=>`${a.id} = ${a.displayName}`).join('\n')}`,(learner.teacherIds||[]).join(','))||'';
  const suggestedPlans=effectiveExamPlans(learner);
  const examPlansRaw=prompt('Sınav planları, virgülle (LGS,YKS,KPSS). 8. sınıfta LGS, 12. sınıfta YKS+KPSS otomatik gelir; burada çıkarabilirsiniz:',suggestedPlans.join(','))??suggestedPlans.join(',');
  const examField=grade>=11?(prompt('YKS alanı (Sayısal, Eşit Ağırlık, Sözel, Dil):',learner.examField||'')||''):'';
  const examPlans=examPlansRaw.split(',').map(x=>x.trim().toUpperCase()).filter(x=>['LGS','YKS','KPSS'].includes(x));
  const oldClass=(learner.classroomIds||[])[0]||''; const classroomIds=classroomId?[classroomId]:[];
  await updateDoc(doc(db,'learners',learner.id),{name,grade,age,schoolId,classroomIds,examPlans,examPlansCustomized:true,examField,parentIds:parentIdsRaw.split(',').map(x=>x.trim()).filter(Boolean),teacherIds:teacherIdsRaw.split(',').map(x=>x.trim()).filter(Boolean),updatedAt:serverTimestamp()});
  if(oldClass!==classroomId){ if(oldClass) await updateDoc(doc(db,'classrooms',oldClass),{studentIds:arrayRemove(learner.id),updatedAt:serverTimestamp()}).catch(()=>{}); if(classroomId) await updateDoc(doc(db,'classrooms',classroomId),{studentIds:arrayUnion(learner.id),updatedAt:serverTimestamp()}); await addDoc(collection(db,'learnerEnrollmentHistory'),{learnerId:learner.id,fromClassroomId:oldClass,toClassroomId:classroomId,changedBy:currentUser.uid,changedAt:serverTimestamp()}); }
}

async function editAdultByAdmin(row,schools) {
  const displayName=prompt('Ad soyad:',row.displayName||'')?.trim(); if(!displayName) return;
  const schoolIdsRaw=row.role==='teacher'?(prompt(`Okul kimlikleri, virgülle:\n${schools.map(s=>`${s.id} = ${s.name}`).join('\n')}`,(row.schoolIds||[]).join(','))||''):'';
  await updateDoc(doc(db,'accounts',row.id),{displayName,schoolIds:schoolIdsRaw.split(',').map(x=>x.trim()).filter(Boolean),updatedAt:serverTimestamp()});
}

function renderPlatformFailure(error) {
  console.error(error);
  root.innerHTML=authLayout(`<section class="auth-card"><span class="badge orange">Bağlantı veya yetki hatası</span><h1>Veriler yüklenemedi</h1><p>${esc(firebaseErrorMessage(error))}</p><p class="muted">Bu ekran artık yüklemede takılı kalmaz. Firebase hesabı, accounts belgesi ve Firestore kuralları kontrol edilmelidir.</p><button class="primary-button full-width" data-platform-action="retry-route">Yeniden dene</button><button class="text-button full-width" data-platform-action="logout">Çıkış yap</button></section>`);
}

async function renderAdultPortal() {
  root.innerHTML = '<main class="platform-shell"><div class="portal-loading">Veriler hazırlanıyor…</div></main>';
  const [learners,classrooms,adminAccounts,schools]=await Promise.all([accessibleLearners(),classroomsForTeacher(),allAccountsForAdmin(),allSchoolsForAdmin()]);
  const metrics=await metricsForLearners(learners);
  const adminView=account.role==='admin'?(sessionStorage.getItem('kuzenler-admin-view')||'admin'):account.role;
  if (!selectedClassroomId && classrooms.length) selectedClassroomId=classrooms[0].id;
  const visibleLearners=selectedClassroomId&&(account.role==='teacher'||adminView==='teacher')?learners.filter(l=>l.classroomIds?.includes(selectedClassroomId)):learners;
  const centerLabel=account.role==='admin'?(adminView==='teacher'?'Öğretmen görünümü':adminView==='parent'?'Veli görünümü':'Admin yönetim merkezi'):account.role==='teacher'?'Öğretmen merkezi':'Veli merkezi';
  const heroTitle=account.role==='admin'?(adminView==='teacher'?'Sınıfları öğretmen gözüyle takip et.':adminView==='parent'?'Çocukları veli gözüyle takip et.':'Tüm platformu tek ekrandan yönet.'):account.role==='teacher'?'Sınıfını tek ekrandan takip et.':'Çocuklarının gelişimini tek ekrandan izle.';
  const adminReports=account.role==='admin'?(await getDocs(query(collection(db,'questionReports'),limit(1000)))).docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))):[];
  const management=account.role==='admin'?(adminView==='teacher'?teacherManagement(classrooms,visibleLearners):adminView==='parent'?parentManagement(learners):adminManagement(adminAccounts,classrooms,learners,schools,adminReports)):account.role==='parent'?parentManagement(learners):teacherManagement(classrooms,visibleLearners);
  root.innerHTML=`<main class="platform-shell portal-shell">
    <header class="portal-topbar"><div class="auth-brand"><div class="platform-logo">🏆</div><div><strong>${esc(config.appName)}</strong><span>${centerLabel}</span></div></div><div class="portal-user"><span>${esc(account.displayName||currentUser.displayName||currentUser.email)}</span><button class="text-button" data-platform-action="logout">Çıkış</button></div></header>
    ${account.role==='admin'?`<nav class="admin-view-switcher" aria-label="Admin görünüm seçici"><span class="badge orange">Gerçek yetki: Admin</span><button class="secondary-button ${adminView==='admin'?'active':''}" data-platform-action="admin-view" data-view="admin">🛡️ Admin</button><button class="secondary-button ${adminView==='teacher'?'active':''}" data-platform-action="admin-view" data-view="teacher">👩‍🏫 Öğretmen</button><button class="secondary-button ${adminView==='parent'?'active':''}" data-platform-action="admin-view" data-view="parent">👨‍👩‍👧 Veli</button></nav>`:''}
    <section class="portal-hero"><div><span class="badge orange">V5 merkezi pilot</span><h1>${heroTitle}</h1><p>Soru sayısı, doğruluk, çalışma süresi, ipucu kullanımı ve son etkinlik merkezi olarak Firebase’de tutulur.</p></div></section>
    ${metricCards(visibleLearners,metrics)}
    ${management}
    <section class="section panel"><div class="section-header"><div><h2>${account.role==='admin'?'Tüm öğrenciler':account.role==='teacher'?'Toplu sınıf analizi':'Çocuklarım'}</h2><p>Öğrenci kodu ve PIN’i görüntüleyebilir, listeyi yazdırılabilir PDF olarak alabilirsiniz.</p></div><button class="secondary-button" data-platform-action="print-student-list">🖨️ PDF / Yazdır</button></div>${learnerTable(visibleLearners,metrics,classrooms)}</section>
    <section class="section panel"><h2>Hesap ayarları</h2><div class="form-grid"><div class="form-field"><label for="account-name">Görünen ad</label><input id="account-name" value="${esc(account.displayName||'')}"></div><div class="form-field"><label>E-posta</label><input value="${esc(currentUser.email||'')}" disabled></div></div><div class="button-row mt-18"><button class="secondary-button" data-platform-action="save-account">Adı kaydet</button><button class="text-button" data-platform-action="forgot-password" data-email="${esc(currentUser.email||'')}">Şifre yenileme e-postası</button></div></section>
  </main>`;
}

function parentManagement(learners) {
  const disabled=learners.length>=config.limits.maxChildrenPerParent;
  return `<section class="section panel"><div class="section-header"><div><h2>Çocuk ekle</h2><p>Bir veli hesabına birden fazla yaş ve sınıftaki çocuk bağlanabilir.</p></div><span class="badge cyan">${learners.length}/${config.limits.maxChildrenPerParent}</span></div>
    <div class="form-grid"><div class="form-field"><label for="child-name">Ad soyad</label><input id="child-name"></div><div class="form-field"><label for="child-grade">Sınıf</label><select id="child-grade">${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}. sınıf</option>`).join('')}</select></div><div class="form-field"><label for="child-age">Yaş</label><input id="child-age" type="number" min="6" max="19" value="9"></div></div>
    <button class="primary-button full-width mt-18" data-platform-action="add-child" ${disabled?'disabled':''}>Öğrenci hesabı ve kodu oluştur</button><p class="muted mt-12">Oluşan öğrenci kodu ve PIN öğrenci listesinde yetkili kullanıcılar tarafından görüntülenebilir.</p></section>`;
}

function teacherManagement(classrooms,learners) {
  return `<section class="portal-two-column"><div class="section panel"><h2>Sınıf oluştur</h2><div class="form-grid"><div class="form-field"><label for="class-name">Sınıf adı</label><input id="class-name" placeholder="4-A Matematik Kulübü"></div><div class="form-field"><label for="class-grade">Sınıf seviyesi</label><select id="class-grade">${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}. sınıf</option>`).join('')}</select></div></div><button class="secondary-button full-width mt-18" data-platform-action="create-class">Sınıf oluştur</button></div>
  <div class="section panel"><h2>Aktif sınıf</h2><div class="form-field"><label for="class-filter">Sınıf seç</label><select id="class-filter"><option value="">Tüm öğrenciler</option>${classrooms.map(r=>`<option value="${r.id}" ${r.id===selectedClassroomId?'selected':''}>${esc(r.name)} (${(r.studentIds||[]).length})</option>`).join('')}</select></div><p class="muted mt-12">Seçilen sınıf toplu öğrenci ekleme ve analiz tablosunda kullanılır.</p></div></section>
  <section class="section panel"><div class="section-header"><div><h2>Toplu öğrenci kaydı</h2><p>Her satır: <code>Ad Soyad;Sınıf;Yaş</code>. En fazla ${config.limits.maxBulkImport} öğrenci.</p></div><span class="badge orange">Kod + PIN üretilir</span></div><textarea id="bulk-students" class="story-input" placeholder="Ayşe Yılmaz;4;9\nMehmet Kaya;4;10"></textarea><button class="primary-button full-width mt-18" data-platform-action="bulk-import" ${!selectedClassroomId?'disabled':''}>Seçili sınıfa öğrencileri ekle</button></section>`;
}

function renderCredentialResult(rows,title='Öğrenci hesapları oluşturuldu') {
  root.innerHTML=`<main class="platform-shell auth-shell"><section class="auth-card credential-card"><span class="badge green">Başarılı</span><h1>${esc(title)}</h1><p>Kod ve PIN bilgileri daha sonra öğrenci listesinden görüntülenebilir ve PDF olarak alınabilir.</p><div class="credential-list">${rows.map(row=>`<div><strong>${esc(row.name)}</strong><span>Kod: <b>${esc(row.code)}</b></span><span>PIN: <b>${esc(row.pin)}</b></span></div>`).join('')}</div><button class="primary-button full-width" data-platform-action="portal">Yönetim paneline dön</button></section></main>`;
}

async function createClassroom() {
  const name=document.querySelector('#class-name')?.value.trim();
  const grade=Number(document.querySelector('#class-grade')?.value||1);
  if (!name) throw new Error('Sınıf adı gereklidir.');
  const ref=await addDoc(collection(db,'classrooms'),{name,grade,teacherIds:[currentUser.uid],studentIds:[],status:'active',createdBy:currentUser.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),schemaVersion:5});
  selectedClassroomId=ref.id;
  toast('Sınıf oluşturuldu.','success');
  await renderAdultPortal();
}

async function addChild() {
  const name=document.querySelector('#child-name')?.value.trim();
  const grade=Number(document.querySelector('#child-grade')?.value||1);
  const age=Number(document.querySelector('#child-age')?.value||grade+5);
  if (!name) throw new Error('Çocuğun adı gereklidir.');
  const row=await createStudentAuth({name,grade,age,parentIds:[currentUser.uid]});
  renderCredentialResult([row]);
}

async function bulkImport() {
  if (!selectedClassroomId) throw new Error('Önce aktif sınıf seçin.');
  const text=document.querySelector('#bulk-students')?.value||'';
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,config.limits.maxBulkImport);
  if (!lines.length) throw new Error('Öğrenci listesi boş.');
  const rows=[];
  for (const line of lines) {
    const [name,gradeRaw,ageRaw]=line.split(';').map(x=>x?.trim());
    if (!name) continue;
    const grade=Math.max(1,Math.min(12,Number(gradeRaw||1)));
    const age=Math.max(6,Math.min(19,Number(ageRaw||grade+5)));
    const row=await createStudentAuth({name,grade,age,classroomIds:[selectedClassroomId]});
    rows.push(row);
    await updateDoc(doc(db,'classrooms',selectedClassroomId),{studentIds:arrayUnion(row.learnerId),updatedAt:serverTimestamp()});
  }
  renderCredentialResult(rows,`${rows.length} öğrenci hesabı oluşturuldu`);
}



async function ensureLeaderboardCoverage() {
  if (account?.role !== 'admin') return;
  try {
    const [learnerSnap, metricSnap, boardSnap] = await Promise.all([
      getDocs(query(collection(db,'learners'),limit(500))),
      getDocs(query(collection(db,'learnerMetrics'),limit(500))),
      getDocs(query(collection(db,'leaderboards'),limit(500)))
    ]);
    const metricsById = new Map(metricSnap.docs.map(x => [x.id, x.data()]));
    const existing = new Set(boardSnap.docs.map(x => x.id));
    const missing = learnerSnap.docs.filter(x => !existing.has(x.id) && (x.data().status || 'active') !== 'deleted');
    if (!missing.length) return;
    const batch = writeBatch(db);
    for (const learnerDoc of missing) {
      const learner = learnerDoc.data();
      const metrics = metricsById.get(learnerDoc.id) || {};
      batch.set(doc(db,'leaderboards',learnerDoc.id),{
        learnerId: learnerDoc.id,
        displayName: learner.name || 'Öğrenci',
        grade: Number(learner.grade || 0),
        age: Number(learner.age || 0),
        xp: Number(metrics.xp || 0),
        accuracy: Number(metrics.accuracy || 0),
        totalQuestions: Number(metrics.totalQuestions || 0),
        updatedAt: serverTimestamp()
      },{merge:true});
    }
    await batch.commit();
  } catch (error) {
    console.warn('Sıralama kapsamı tamamlanamadı:', error);
  }
}

async function loadPublicRankings() {
  try {
    const snap=await getDocs(query(collection(db,'leaderboards'),limit(200)));
    return snap.docs.map(x=>({learnerId:x.id,...x.data()}));
  } catch(error) { console.warn('Sıralama yüklenemedi:',error); return []; }
}

async function loadLearnerState(learnerId) {
  const [learnerSnap,stateSnap,attemptSnap,reportSnap,blockedSnap]=await Promise.all([
    getDoc(doc(db,'learners',learnerId)),
    getDoc(doc(db,'learnerStates',learnerId)),
    getDocs(query(collection(db,'attempts'),where('learnerId','==',learnerId))),
    getDocs(query(collection(db,'questionReports'),where('learnerId','==',learnerId),limit(500))),
    getDocs(query(collection(db,'blockedQuestions'),limit(1000)))
  ]);
  if (!learnerSnap.exists()) throw new Error('Öğrenci kaydı bulunamadı.');
  const learner={id:learnerSnap.id,...learnerSnap.data()};
  const base=stateSnap.exists()?stateSnap.data():defaultCloudState(learnerId,learner.name,learner.grade,learner.age);
  const attempts=attemptSnap.docs.map(x=>x.data()).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  const reports=reportSnap.docs.map(x=>x.data()).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  syncedAttemptIds=new Set(attempts.map(x=>x.id));
  syncedReportIds=new Set(reports.map(x=>x.id));
  const globalBlocked=Object.fromEntries(blockedSnap.docs.map(x=>[x.id,true]));
  const mergedBlocked={...(base.blockedQuestionKeys||{}),[learnerId]:{...(base.blockedQuestionKeys?.[learnerId]||{}),...globalBlocked}};
  return {...base,blockedQuestionKeys:mergedBlocked,version:5,activeProfileId:learnerId,profiles:[{...defaultProfile(learnerId,learner.name,learner.grade,learner.age),...(base.profiles?.[0]||{}),id:learnerId,name:learner.name,grade:learner.grade,age:learner.age,examPlans:effectiveExamPlans(learner),examPlansCustomized:Boolean(learner.examPlansCustomized),examField:learner.examField||''}],attempts,questionReports:reports};
}

function computeMetrics(state,learner) {
  const attempts=state.attempts||[];
  const totalQuestions=attempts.length;
  const correctCount=attempts.filter(x=>x.correct).length;
  const totalSeconds=attempts.reduce((s,x)=>s+Number(x.elapsedSeconds||0),0);
  const totalHints=attempts.reduce((s,x)=>s+Number(x.hintsUsed||0),0);
  const gameStats={};
  for (const item of attempts) {
    const row=gameStats[item.gameId]||{questions:0,correct:0,hints:0,seconds:0};
    row.questions+=1; row.correct+=item.correct?1:0; row.hints+=Number(item.hintsUsed||0); row.seconds+=Number(item.elapsedSeconds||0); gameStats[item.gameId]=row;
  }
  return {learnerId:learner.id,name:learner.name,grade:learner.grade,classroomIds:learner.classroomIds||[],totalQuestions,correctCount,accuracy:totalQuestions?Math.round(correctCount/totalQuestions*100):0,totalMinutes:Math.round(totalSeconds/60),totalHints,lastActiveAt:attempts.at(-1)?.createdAt||null,gameStats,updatedAt:serverTimestamp()};
}

async function syncStateNow(learnerId,state) {
  const learnerSnap=await getDoc(doc(db,'learners',learnerId));
  if (!learnerSnap.exists()) return;
  const learner={id:learnerSnap.id,...learnerSnap.data()};
  const durable={version:5,profiles:state.profiles,settings:state.settings,daily:state.daily,badges:state.badges,activeProfileId:learnerId,seenQuestions:state.seenQuestions,blockedQuestionKeys:state.blockedQuestionKeys||{},updatedAt:serverTimestamp()};
  const batch=writeBatch(db);
  batch.set(doc(db,'learnerStates',learnerId),durable,{merge:true});
  for (const attempt of (state.attempts||[])) {
    if (syncedAttemptIds.has(attempt.id)) continue;
    batch.set(doc(db,'attempts',attempt.id),{...attempt,learnerId,accountUid:currentUser.uid,classroomIds:learner.classroomIds||[]});
    syncedAttemptIds.add(attempt.id);
  }
  for (const report of (state.questionReports||[])) {
    if (syncedReportIds.has(report.id)) continue;
    batch.set(doc(db,'questionReports',report.id),{...report,learnerId,reportedBy:currentUser.uid,classroomIds:learner.classroomIds||[]});
    syncedReportIds.add(report.id);
  }
  const metrics=computeMetrics(state,learner);
  batch.set(doc(db,'learnerMetrics',learnerId),metrics,{merge:true});
  batch.set(doc(db,'leaderboards',learnerId),{learnerId,displayName:learner.name||'Öğrenci',grade:Number(learner.grade||0),age:Number(learner.age||0),xp:Number(state.profiles?.[0]?.xp||0),accuracy:metrics.accuracy,totalQuestions:metrics.totalQuestions,updatedAt:serverTimestamp()},{merge:true});
  batch.update(doc(db,'learners',learnerId),{updatedAt:serverTimestamp(),lastActiveAt:serverTimestamp()});
  await batch.commit();
}

function attachStateSync(learnerId) {
  window.addEventListener('kuzenler:state-saved',(event)=>{
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>syncStateNow(learnerId,event.detail).catch(error=>console.error('Firebase senkronizasyonu:',error)),650);
  });
}

async function launchLearner(learnerId,adultPreview=false) {
  const [state,rankings]=await Promise.all([loadLearnerState(learnerId),loadPublicRankings()]);
  window.__KUZENLER_INITIAL_STATE__=state;
  window.__KUZENLER_RANKINGS__=rankings;
  window.__KUZENLER_PLATFORM__={mode:'live',role:account.role,user:{uid:currentUser.uid,email:currentUser.email},learnerId,adultPreview};
  attachStateSync(learnerId);
  await import('../app.js');
}

async function routeSignedIn() {
  account=await accountFor(currentUser.uid);
  if (!account) { renderAccountRecovery('Firebase Authentication hesabı var ancak accounts belgesi bulunamadı.'); return; }
  if (account.status&&account.status!=='active') { renderAccountRecovery('Bu hesap pasif durumdadır.'); return; }
  if (account.role==='student') { await launchLearner(account.learnerId,false); return; }
  const playLearner=sessionStorage.getItem('kuzenler-play-learner');
  if (playLearner) {
    const learners=await accessibleLearners();
    if (!learners.some(x=>x.id===playLearner)) { sessionStorage.removeItem('kuzenler-play-learner'); toast('Bu öğrenciye erişim yetkiniz yok.','error'); }
    else { await launchLearner(playLearner,true); return; }
  }
  if (account.role === 'admin') await ensureLeaderboardCoverage();
  await renderAdultPortal();
}

async function handleAction(target) {
  const action=target.dataset.platformAction;
  try {
    if (action==='auth-mode') renderAuth(target.dataset.mode);
    if (action==='adult-login') {
      const email=document.querySelector('#auth-email')?.value.trim(); const password=document.querySelector('#auth-password')?.value;
      await signInWithEmailAndPassword(auth,email,password);
    }
    if (action==='adult-signup') {
      const name=document.querySelector('#auth-name')?.value.trim(); const email=document.querySelector('#auth-email')?.value.trim(); const password=document.querySelector('#auth-password')?.value; const role=document.querySelector('input[name="signup-role"]:checked')?.value;
      if (!name||!email||!password) throw new Error('Ad, e-posta ve şifre zorunludur.');
      await createAdultAccount(role,name,email,password); currentUser=auth.currentUser; await routeSignedIn();
    }
    if (action==='student-login') {
      const code=document.querySelector('#student-code')?.value.trim().toUpperCase(); const pin=document.querySelector('#student-pin')?.value.trim();
      if (!/^KY\d{6}$/.test(code)||!/^\d{4}$/.test(pin)) throw new Error('Öğrenci kodu KY123456, PIN dört rakam biçiminde olmalıdır.');
      await signInWithEmailAndPassword(auth,studentEmail(code),studentPassword(code,pin));
    }
    if (action==='forgot-password') {
      const email=target.dataset.email||document.querySelector('#auth-email')?.value.trim();
      if (!email) throw new Error('Önce e-posta adresini yazın.');
      await sendPasswordResetEmail(auth,email); toast('Şifre yenileme e-postası gönderildi.','success');
    }
    if (action==='complete-existing-account') {
      if (!currentUser) throw new Error('Oturum bulunamadı.');
      const name=document.querySelector('#recovery-name')?.value.trim();
      const role=document.querySelector('input[name="recovery-role"]:checked')?.value;
      if (!name || !['parent','teacher','admin'].includes(role)) throw new Error('Ad soyad ve hesap türü zorunludur.');
      if (role==='admin' && String(currentUser.email||'').toLowerCase()!==String(config.ownerAdminEmail||'').toLowerCase()) throw new Error('Bu kullanıcı admin olarak tanımlanamaz.');
      await setDoc(doc(db,'accounts',currentUser.uid),{
        role, displayName:name, email:currentUser.email, status:'active',
        createdAt:serverTimestamp(), updatedAt:serverTimestamp(), schemaVersion:5
      });
      await updateAuthProfile(currentUser,{displayName:name});
      account=await accountFor(currentUser.uid);
      await routeSignedIn();
    }
    if (action==='logout') {
      sessionStorage.removeItem('kuzenler-play-learner');
      sessionStorage.removeItem('kuzenler-admin-view');
      clearTimeout(syncTimer);
      syncTimer=null;
      await signOut(auth);
      currentUser=null;
      account=null;
      selectedClassroomId='';
      syncedAttemptIds=new Set();
      syncedReportIds=new Set();
      renderAuth('login');
      return;
    }
    if (action==='portal' || action==='retry-route') await routeSignedIn();
    if (action==='admin-view') { sessionStorage.setItem('kuzenler-admin-view',target.dataset.view||'admin'); await renderAdultPortal(); }
    if (action==='admin-modal-close') { closeAdminModal(null); return; }
    if (action==='admin-modal-submit') { const modal=document.querySelector('#admin-modal'); const payload={}; if(modal?.querySelector('input[name="new-record-type"]')) payload.type=modal.querySelector('input[name="new-record-type"]:checked')?.value; if(modal?.querySelector('#modal-school-name')) payload.name=modal.querySelector('#modal-school-name').value.trim(),payload.city=modal.querySelector('#modal-school-city').value,payload.district=modal.querySelector('#modal-school-district').value,payload.type=modal.querySelector('#modal-school-type').value,payload.phone=modal.querySelector('#modal-school-phone').value.trim(),payload.address=modal.querySelector('#modal-school-address').value.trim(); if(modal?.querySelector('#modal-class-name')) payload.name=modal.querySelector('#modal-class-name').value.trim(),payload.schoolId=modal.querySelector('#modal-class-school').value,payload.grade=modal.querySelector('#modal-class-grade').value,payload.academicYear=modal.querySelector('#modal-class-year').value.trim(),payload.teacherIds=[...modal.querySelectorAll('input[name="modal-class-teacher"]:checked')].map(x=>x.value); if(!payload.name){toast('Ad alanı zorunludur.','error');return;} closeAdminModal(payload); return; }
    if (action==='admin-section') { adminSection=target.dataset.section||'overview'; sessionStorage.setItem('kuzenler-admin-section',adminSection); await renderAdultPortal(); }
    if (action==='admin-apply-filter') { adminSearch=document.querySelector('#admin-search')?.value||''; adminStatusFilter=document.querySelector('#admin-status-filter')?.value||'all'; adminSchoolFilter=document.querySelector('#admin-school-filter')?.value||adminSchoolFilter; adminTeacherFilter=document.querySelector('#admin-teacher-filter')?.value||''; adminParentFilter=document.querySelector('#admin-parent-filter')?.value||''; await renderAdultPortal(); }
    if (action==='admin-new-menu') { const choice=await openAdminModal({title:'Yeni kayıt',subtitle:'Oluşturmak istediğiniz kayıt türünü seçin.',submitText:'Devam et',body:`<div class="new-record-grid"><label><input type="radio" name="new-record-type" value="okul" checked><span>🏫 Okul</span></label><label><input type="radio" name="new-record-type" value="sınıf"><span>🧑‍🏫 Sınıf</span></label><label><input type="radio" name="new-record-type" value="öğretmen"><span>👩‍🏫 Öğretmen</span></label><label><input type="radio" name="new-record-type" value="veli"><span>👨‍👩‍👧 Veli</span></label><label><input type="radio" name="new-record-type" value="öğrenci"><span>🎓 Öğrenci</span></label></div>`}); const normalized=choice?.type||choice; const type=normalized||document.querySelector('input[name="new-record-type"]:checked')?.value; const choiceText=type?.toLocaleLowerCase?.('tr-TR'); if(choiceText==='okul') await createSchoolByAdmin(); else if(choiceText==='sınıf'||choiceText==='sinif') await createClassroomByAdmin(await allSchoolsForAdmin()); else if(choiceText==='öğretmen'||choiceText==='ogretmen') await createAdultByAdmin('teacher'); else if(choiceText==='veli') await createAdultByAdmin('parent'); else if(choiceText==='öğrenci'||choiceText==='ogrenci') await createLearnerByAdmin(await allSchoolsForAdmin(),await classroomsForTeacher(),await allAccountsForAdmin()); if(choiceText) await renderAdultPortal(); }
    if (action==='admin-create-school') { await createSchoolByAdmin(); await renderAdultPortal(); }
    if (action==='admin-create-classroom') { await createClassroomByAdmin(await allSchoolsForAdmin(),target.dataset.schoolId||adminSelectedSchoolId); await renderAdultPortal(); }
    if (action==='admin-create-adult') { await createAdultByAdmin(target.dataset.role); await renderAdultPortal(); }
    if (action==='admin-create-learner') { await createLearnerByAdmin(await allSchoolsForAdmin(),await classroomsForTeacher(),await allAccountsForAdmin()); await renderAdultPortal(); }
    if (action==='admin-edit-learner') { const learners=await accessibleLearners(); const row=learners.find(x=>x.id===target.dataset.id); if(!row) throw new Error('Öğrenci bulunamadı.'); await editLearnerByAdmin(row,await allSchoolsForAdmin(),await classroomsForTeacher(),await allAccountsForAdmin()); await renderAdultPortal(); }
    if (action==='admin-reset-pin' || action==='admin-custom-pin') { const learners=await accessibleLearners(); const row=learners.find(x=>x.id===target.dataset.id); if(!row) throw new Error('Öğrenci bulunamadı.'); const pin=action==='admin-reset-pin'?randomPin():prompt('Dört haneli özel PIN:')?.trim(); if(!pin) return; await changeStudentPin(row,pin); toast(`Yeni PIN: ${pin}`,'success'); await renderAdultPortal(); }
    if (action==='admin-edit-adult') { const rows=await allAccountsForAdmin(); const row=rows.find(x=>x.id===target.dataset.id); if(!row) throw new Error('Hesap bulunamadı.'); await editAdultByAdmin(row,await allSchoolsForAdmin()); await renderAdultPortal(); }
    if (action==='admin-reset-password') { const email=target.dataset.email; if(!email) throw new Error('E-posta bulunamadı.'); await sendPasswordResetEmail(auth,email); toast('Şifre yenileme e-postası gönderildi.','success'); }
    if (action==='admin-edit-school') { const schools=await allSchoolsForAdmin(); const row=schools.find(x=>x.id===target.dataset.id); if(row) await createSchoolByAdmin(row); await renderAdultPortal(); }
    if (action==='admin-edit-classroom') { const rooms=await classroomsForTeacher(); const row=rooms.find(x=>x.id===target.dataset.id); if(row) await createClassroomByAdmin(await allSchoolsForAdmin(),row.schoolId,row); await renderAdultPortal(); }
    if (action==='admin-toggle-record') { const next=target.dataset.status==='active'?'inactive':'active'; await updateDoc(doc(db,target.dataset.collection,target.dataset.id),{status:next,updatedAt:serverTimestamp()}); await renderAdultPortal(); }
    if (action==='admin-delete-record') { if(!confirm('Bu kayıt silinmiş durumuna alınacak. Geçmiş analizler korunacak. Devam edilsin mi?')) return; await updateDoc(doc(db,target.dataset.collection,target.dataset.id),{status:'deleted',deletedAt:serverTimestamp(),deletedBy:currentUser.uid,updatedAt:serverTimestamp()}); await renderAdultPortal(); }
    if (action==='admin-ai-review-report') { const snap=await getDoc(doc(db,'questionReports',target.dataset.id)); if(!snap.exists()) throw new Error('Bildirim bulunamadı.'); const report={id:snap.id,...snap.data()}; const same=await getDocs(query(collection(db,'questionReports'),where('questionKey','==',report.questionKey),limit(50))); const aiReview=aiReviewForReport(report,same.size||1); await updateDoc(doc(db,'questionReports',report.id),{aiReview,reviewedAt:serverTimestamp(),reviewedBy:currentUser.uid,status:'reviewed'}); await renderAdultPortal(); }
    if (action==='admin-decide-report') { const labels={question_invalid:'Soru hatalı',answer_invalid:'Cevap/çözüm hatalı',student_struggled:'Öğrenci zorlanmış',duplicate:'Tekrar soru',dismissed:'Geçersiz bildirim'}; const reportRef=doc(db,'questionReports',target.dataset.id); const reportSnap=await getDoc(reportRef); const report=reportSnap.exists()?reportSnap.data():{}; await updateDoc(reportRef,{reviewDecision:target.dataset.decision,status:target.dataset.decision==='dismissed'?'dismissed':'resolved',resolutionNote:labels[target.dataset.decision]||target.dataset.decision,reviewedAt:serverTimestamp(),reviewedBy:currentUser.uid}); if(['question_invalid','answer_invalid','duplicate'].includes(target.dataset.decision)&&report.questionKey){ await setDoc(doc(db,'blockedQuestions',report.questionKey),{questionKey:report.questionKey,prompt:report.prompt||'',reason:target.dataset.decision,sourceReportId:target.dataset.id,blockedBy:currentUser.uid,blockedAt:serverTimestamp(),status:'blocked'},{merge:true}); } toast(target.dataset.decision==='dismissed'?'Bildirim kapatıldı.':'Karar kaydedildi; soru karantinaya alındı.','success'); await renderAdultPortal(); }
    if (action==='admin-drill-school') { adminSelectedSchoolId=target.dataset.id; adminSection='schools'; await renderAdultPortal(); }
    if (action==='admin-school-back') { adminSelectedSchoolId=''; await renderAdultPortal(); }
    if (action==='admin-save-role') {
      if (account.role!=='admin') throw new Error('Yalnız admin rol değiştirebilir.');
      const id=target.dataset.accountId; const select=document.querySelector(`[data-admin-role="${id}"]`); const role=select?.value;
      if (!['parent','teacher','student'].includes(role)) throw new Error('Geçersiz rol.');
      await updateDoc(doc(db,'accounts',id),{role,updatedAt:serverTimestamp()}); toast('Kullanıcı rolü güncellendi.','success'); await renderAdultPortal();
    }
    if (action==='create-class') await createClassroom();
    if (action==='add-child') await addChild();
    if (action==='bulk-import') await bulkImport();
    if (action==='print-student-list') {
      const learners=await accessibleLearners();
      const classrooms=await classroomsForTeacher();
      const visible=selectedClassroomId?learners.filter((item)=>item.classroomIds?.includes(selectedClassroomId)):learners;
      printStudentList(visible,classrooms);
    }
    if (action==='analysis-learner') await renderLearnerAnalysis(target.dataset.learnerId);
    if (action==='play-learner') { sessionStorage.setItem('kuzenler-play-learner',target.dataset.learnerId); location.reload(); }
    if (action==='save-account') {
      const name=document.querySelector('#account-name')?.value.trim(); if(!name) throw new Error('Görünen ad boş olamaz.');
      await updateDoc(doc(db,'accounts',currentUser.uid),{displayName:name,updatedAt:serverTimestamp()}); account.displayName=name; await updateAuthProfile(currentUser,{displayName:name}); toast('Hesap adı güncellendi.','success'); await renderAdultPortal();
    }
  } catch(error) { console.error(error); toast(firebaseErrorMessage(error),'error'); }
}

function firebaseErrorMessage(error) {
  const code=error?.code||'';
  const map={
    'auth/invalid-credential':'E-posta, öğrenci kodu, PIN veya şifre doğru değil.',
    'auth/email-already-in-use':'Bu e-posta veya öğrenci kodu daha önce kullanılmış.',
    'auth/weak-password':'Şifre en az 6 karakter olmalıdır.',
    'auth/invalid-email':'E-posta biçimi geçerli değil.',
    'auth/too-many-requests':'Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.',
    'permission-denied':'Bu işlem için yetkiniz yok.'
  };
  return map[code]||error?.message||'İşlem tamamlanamadı.';
}

export async function startFirebasePlatform(runtimeConfig) {
  config=runtimeConfig;
  app=initializeApp(firebaseConfig()); auth=getAuth(app); db=getFirestore(app);
  root.addEventListener('click',(event)=>{ const target=event.target.closest('[data-platform-action]'); if(target) handleAction(target); });
  root.addEventListener('change',(event)=>{ if(event.target.id==='modal-school-city'){ const d=document.querySelector('#modal-school-district'); if(d) d.innerHTML=districtOptions(event.target.value,''); } if(event.target.id==='class-filter'){ selectedClassroomId=event.target.value; renderAdultPortal().catch(error=>toast(firebaseErrorMessage(error),'error')); } if(['admin-school-filter','admin-teacher-filter','admin-parent-filter'].includes(event.target.id)){ if(event.target.id==='admin-school-filter') adminSchoolFilter=event.target.value; if(event.target.id==='admin-teacher-filter') adminTeacherFilter=event.target.value; if(event.target.id==='admin-parent-filter') adminParentFilter=event.target.value; renderAdultPortal().catch(error=>toast(firebaseErrorMessage(error),'error')); } });
  currentUser=await waitForAuth();
  if (!currentUser) renderAuth('login'); else await routeSignedIn().catch(renderPlatformFailure);
  onAuthStateChanged(auth,async user=>{
    const previousUid=currentUser?.uid||null;
    const nextUid=user?.uid||null;
    if (previousUid===nextUid) return;
    currentUser=user;
    if(!user) renderAuth('login'); else await routeSignedIn().catch(renderPlatformFailure);
  });
}

window.addEventListener('kuzenler:student-logout',async(event)=>{ try { clearTimeout(syncTimer); syncTimer=null; const learnerId=window.__KUZENLER_PLATFORM__?.learnerId; if(learnerId&&event.detail?.state) await syncStateNow(learnerId,event.detail.state); sessionStorage.removeItem('kuzenler-play-learner'); sessionStorage.removeItem('kuzenler-admin-view'); await signOut(auth); currentUser=null; account=null; syncedAttemptIds=new Set(); syncedReportIds=new Set(); window.__KUZENLER_INITIAL_STATE__=null; window.__KUZENLER_PLATFORM__=null; renderAuth('login'); } catch(error){ console.error(error); renderAuth('login'); } });
