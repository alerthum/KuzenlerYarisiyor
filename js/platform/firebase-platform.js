import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updateProfile as updateAuthProfile
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs,
  addDoc, serverTimestamp, arrayUnion, writeBatch, limit
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
    id: learnerId, authUid: credential.user.uid, studentCode: code, name,
    grade: Number(grade), age: Number(age), avatar:'🎯', status:'active',
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
    setDoc(doc(db,'learnerMetrics',learnerId),emptyMetrics(learnerId,name,grade,classroomIds))
  ]);
  return { learnerId, code, pin, name, grade:Number(grade), age:Number(age) };
}

function defaultProfile(learnerId,name,grade,age) {
  return {id:learnerId,name,grade:Number(grade),age:Number(age),avatar:'🎯',subtitle:`${grade}. Sınıf • Kişisel Öğrenme Planı`,xp:0,stars:0,streak:0,lastActiveDate:null,skills:{},completedGames:0};
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
  return `<div class="analytics-table-wrap"><table class="analytics-table"><thead><tr><th>Öğrenci</th><th>Sınıf</th><th>Soru</th><th>Doğruluk</th><th>Süre</th><th>İpucu</th><th>Son çalışma</th><th></th></tr></thead><tbody>${learners.map(learner=>{
    const m=metrics.get(learner.id)||{};
    return `<tr><td><strong>${esc(learner.name)}</strong><br><small>${esc(learner.studentCode||'')}</small></td><td>${learner.grade}. sınıf${learner.classroomIds?.length?`<br><small>${esc(learner.classroomIds.map(id=>roomMap.get(id)).filter(Boolean).join(', '))}</small>`:''}</td><td>${Number(m.totalQuestions||0)}</td><td>%${Number(m.accuracy||0)}</td><td>${Number(m.totalMinutes||0)} dk</td><td>${Number(m.totalHints||0)}</td><td>${fmtDate(m.lastActiveAt)}</td><td><div class="button-row compact"><button class="text-button" data-platform-action="analysis-learner" data-learner-id="${learner.id}">Analiz</button><button class="text-button" data-platform-action="play-learner" data-learner-id="${learner.id}">Oyun görünümü</button></div></td></tr>`;
  }).join('')}</tbody></table></div>`;
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

function adminManagement(accounts,classrooms,learners) {
  const roleLabel={admin:'Yönetici',teacher:'Öğretmen',parent:'Veli',student:'Öğrenci'};
  return `<section class="section panel"><div class="section-header"><div><h2>Admin yönetim merkezi</h2><p>Veli, öğretmen, öğrenci ve sınıf kayıtlarını merkezi olarak yönetin. Görünüm değiştirme güvenlik rolünü değiştirmez; yalnız ekran önizlemesidir.</p></div><span class="badge orange">Tam yetki</span></div>
    <div class="button-row"><button class="secondary-button" data-platform-action="admin-view" data-view="admin">🛡️ Admin</button><button class="secondary-button" data-platform-action="admin-view" data-view="teacher">👩‍🏫 Öğretmen görünümü</button><button class="secondary-button" data-platform-action="admin-view" data-view="parent">👨‍👩‍👧 Veli görünümü</button></div>
    <div class="platform-metric-grid mt-18"><div class="metric-card"><div class="metric-label">Hesap</div><div class="metric-value">${accounts.length}</div></div><div class="metric-card"><div class="metric-label">Öğrenci</div><div class="metric-value">${learners.length}</div></div><div class="metric-card"><div class="metric-label">Sınıf</div><div class="metric-value">${classrooms.length}</div></div></div>
    <div class="analytics-table-wrap mt-18"><table class="analytics-table"><thead><tr><th>Kullanıcı</th><th>Rol</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>${accounts.map(row=>`<tr><td><strong>${esc(row.displayName||row.email||row.id)}</strong><br><small>${esc(row.email||row.studentCode||row.id)}</small></td><td>${esc(roleLabel[row.role]||row.role)}</td><td>${esc(row.status||'active')}</td><td>${row.role==='admin'?'<span class="badge">Sahip</span>':`<select data-admin-role="${row.id}"><option value="parent" ${row.role==='parent'?'selected':''}>Veli</option><option value="teacher" ${row.role==='teacher'?'selected':''}>Öğretmen</option><option value="student" ${row.role==='student'?'selected':''}>Öğrenci</option></select><button class="text-button" data-platform-action="admin-save-role" data-account-id="${row.id}">Kaydet</button>`}</td></tr>`).join('')}</tbody></table></div>
  </section>`;
}

function renderPlatformFailure(error) {
  console.error(error);
  root.innerHTML=authLayout(`<section class="auth-card"><span class="badge orange">Bağlantı veya yetki hatası</span><h1>Veriler yüklenemedi</h1><p>${esc(firebaseErrorMessage(error))}</p><p class="muted">Bu ekran artık yüklemede takılı kalmaz. Firebase hesabı, accounts belgesi ve Firestore kuralları kontrol edilmelidir.</p><button class="primary-button full-width" data-platform-action="retry-route">Yeniden dene</button><button class="text-button full-width" data-platform-action="logout">Çıkış yap</button></section>`);
}

async function renderAdultPortal() {
  root.innerHTML = '<main class="platform-shell"><div class="portal-loading">Veriler hazırlanıyor…</div></main>';
  const [learners,classrooms,adminAccounts]=await Promise.all([accessibleLearners(),classroomsForTeacher(),allAccountsForAdmin()]);
  const metrics=await metricsForLearners(learners);
  const adminView=account.role==='admin'?(sessionStorage.getItem('kuzenler-admin-view')||'admin'):account.role;
  if (!selectedClassroomId && classrooms.length) selectedClassroomId=classrooms[0].id;
  const visibleLearners=selectedClassroomId&&(account.role==='teacher'||adminView==='teacher')?learners.filter(l=>l.classroomIds?.includes(selectedClassroomId)):learners;
  const centerLabel=account.role==='admin'?(adminView==='teacher'?'Öğretmen görünümü':adminView==='parent'?'Veli görünümü':'Admin yönetim merkezi'):account.role==='teacher'?'Öğretmen merkezi':'Veli merkezi';
  const heroTitle=account.role==='admin'?(adminView==='teacher'?'Sınıfları öğretmen gözüyle takip et.':adminView==='parent'?'Çocukları veli gözüyle takip et.':'Tüm platformu tek ekrandan yönet.'):account.role==='teacher'?'Sınıfını tek ekrandan takip et.':'Çocuklarının gelişimini tek ekrandan izle.';
  const management=account.role==='admin'?(adminView==='teacher'?teacherManagement(classrooms,visibleLearners):adminView==='parent'?parentManagement(learners):adminManagement(adminAccounts,classrooms,learners)):account.role==='parent'?parentManagement(learners):teacherManagement(classrooms,visibleLearners);
  root.innerHTML=`<main class="platform-shell portal-shell">
    <header class="portal-topbar"><div class="auth-brand"><div class="platform-logo">🏆</div><div><strong>${esc(config.appName)}</strong><span>${centerLabel}</span></div></div><div class="portal-user"><span>${esc(account.displayName||currentUser.displayName||currentUser.email)}</span><button class="text-button" data-platform-action="logout">Çıkış</button></div></header>
    <section class="portal-hero"><div><span class="badge orange">V5 merkezi pilot</span><h1>${heroTitle}</h1><p>Soru sayısı, doğruluk, çalışma süresi, ipucu kullanımı ve son etkinlik merkezi olarak Firebase’de tutulur.</p></div></section>
    ${metricCards(visibleLearners,metrics)}
    ${management}
    <section class="section panel"><div class="section-header"><div><h2>${account.role==='admin'?'Tüm öğrenciler':account.role==='teacher'?'Toplu sınıf analizi':'Çocuklarım'}</h2><p>Her öğrenciyi oyun ekranında açabilir veya toplu verileri karşılaştırabilirsiniz.</p></div></div>${learnerTable(visibleLearners,metrics,classrooms)}</section>
    <section class="section panel"><h2>Hesap ayarları</h2><div class="form-grid"><div class="form-field"><label for="account-name">Görünen ad</label><input id="account-name" value="${esc(account.displayName||'')}"></div><div class="form-field"><label>E-posta</label><input value="${esc(currentUser.email||'')}" disabled></div></div><div class="button-row mt-18"><button class="secondary-button" data-platform-action="save-account">Adı kaydet</button><button class="text-button" data-platform-action="forgot-password" data-email="${esc(currentUser.email||'')}">Şifre yenileme e-postası</button></div></section>
  </main>`;
}

function parentManagement(learners) {
  const disabled=learners.length>=config.limits.maxChildrenPerParent;
  return `<section class="section panel"><div class="section-header"><div><h2>Çocuk ekle</h2><p>Bir veli hesabına birden fazla yaş ve sınıftaki çocuk bağlanabilir.</p></div><span class="badge cyan">${learners.length}/${config.limits.maxChildrenPerParent}</span></div>
    <div class="form-grid"><div class="form-field"><label for="child-name">Ad soyad</label><input id="child-name"></div><div class="form-field"><label for="child-grade">Sınıf</label><select id="child-grade">${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}. sınıf</option>`).join('')}</select></div><div class="form-field"><label for="child-age">Yaş</label><input id="child-age" type="number" min="6" max="19" value="9"></div></div>
    <button class="primary-button full-width mt-18" data-platform-action="add-child" ${disabled?'disabled':''}>Öğrenci hesabı ve kodu oluştur</button><p class="muted mt-12">Oluşan öğrenci kodu ve PIN yalnız oluşturma sonrasında gösterilir. Güvenli bir yere kaydedin.</p></section>`;
}

function teacherManagement(classrooms,learners) {
  return `<section class="portal-two-column"><div class="section panel"><h2>Sınıf oluştur</h2><div class="form-grid"><div class="form-field"><label for="class-name">Sınıf adı</label><input id="class-name" placeholder="4-A Matematik Kulübü"></div><div class="form-field"><label for="class-grade">Sınıf seviyesi</label><select id="class-grade">${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}. sınıf</option>`).join('')}</select></div></div><button class="secondary-button full-width mt-18" data-platform-action="create-class">Sınıf oluştur</button></div>
  <div class="section panel"><h2>Aktif sınıf</h2><div class="form-field"><label for="class-filter">Sınıf seç</label><select id="class-filter"><option value="">Tüm öğrenciler</option>${classrooms.map(r=>`<option value="${r.id}" ${r.id===selectedClassroomId?'selected':''}>${esc(r.name)} (${(r.studentIds||[]).length})</option>`).join('')}</select></div><p class="muted mt-12">Seçilen sınıf toplu öğrenci ekleme ve analiz tablosunda kullanılır.</p></div></section>
  <section class="section panel"><div class="section-header"><div><h2>Toplu öğrenci kaydı</h2><p>Her satır: <code>Ad Soyad;Sınıf;Yaş</code>. En fazla ${config.limits.maxBulkImport} öğrenci.</p></div><span class="badge orange">Kod + PIN üretilir</span></div><textarea id="bulk-students" class="story-input" placeholder="Ayşe Yılmaz;4;9\nMehmet Kaya;4;10"></textarea><button class="primary-button full-width mt-18" data-platform-action="bulk-import" ${!selectedClassroomId?'disabled':''}>Seçili sınıfa öğrencileri ekle</button></section>`;
}

function renderCredentialResult(rows,title='Öğrenci hesapları oluşturuldu') {
  root.innerHTML=`<main class="platform-shell auth-shell"><section class="auth-card credential-card"><span class="badge green">Başarılı</span><h1>${esc(title)}</h1><p>Bu ekran kapatıldıktan sonra PIN’ler yeniden görüntülenmez. Listeyi şimdi güvenli biçimde kaydedin.</p><div class="credential-list">${rows.map(row=>`<div><strong>${esc(row.name)}</strong><span>Kod: <b>${esc(row.code)}</b></span><span>PIN: <b>${esc(row.pin)}</b></span></div>`).join('')}</div><button class="primary-button full-width" data-platform-action="portal">Yönetim paneline dön</button></section></main>`;
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

async function loadLearnerState(learnerId) {
  const [learnerSnap,stateSnap,attemptSnap,reportSnap]=await Promise.all([
    getDoc(doc(db,'learners',learnerId)),
    getDoc(doc(db,'learnerStates',learnerId)),
    getDocs(query(collection(db,'attempts'),where('learnerId','==',learnerId),limit(1200))),
    getDocs(query(collection(db,'questionReports'),where('learnerId','==',learnerId),limit(500)))
  ]);
  if (!learnerSnap.exists()) throw new Error('Öğrenci kaydı bulunamadı.');
  const learner={id:learnerSnap.id,...learnerSnap.data()};
  const base=stateSnap.exists()?stateSnap.data():defaultCloudState(learnerId,learner.name,learner.grade,learner.age);
  const attempts=attemptSnap.docs.map(x=>x.data()).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  const reports=reportSnap.docs.map(x=>x.data()).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  syncedAttemptIds=new Set(attempts.map(x=>x.id));
  syncedReportIds=new Set(reports.map(x=>x.id));
  return {...base,version:5,activeProfileId:learnerId,profiles:[{...defaultProfile(learnerId,learner.name,learner.grade,learner.age),...(base.profiles?.[0]||{}),id:learnerId,name:learner.name,grade:learner.grade,age:learner.age}],attempts,questionReports:reports};
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
  batch.set(doc(db,'learnerMetrics',learnerId),computeMetrics(state,learner),{merge:true});
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
  const state=await loadLearnerState(learnerId);
  window.__KUZENLER_INITIAL_STATE__=state;
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
    if (action==='logout') { sessionStorage.removeItem('kuzenler-play-learner'); await signOut(auth); }
    if (action==='portal' || action==='retry-route') await routeSignedIn();
    if (action==='admin-view') { sessionStorage.setItem('kuzenler-admin-view',target.dataset.view||'admin'); await renderAdultPortal(); }
    if (action==='admin-save-role') {
      if (account.role!=='admin') throw new Error('Yalnız admin rol değiştirebilir.');
      const id=target.dataset.accountId; const select=document.querySelector(`[data-admin-role="${id}"]`); const role=select?.value;
      if (!['parent','teacher','student'].includes(role)) throw new Error('Geçersiz rol.');
      await updateDoc(doc(db,'accounts',id),{role,updatedAt:serverTimestamp()}); toast('Kullanıcı rolü güncellendi.','success'); await renderAdultPortal();
    }
    if (action==='create-class') await createClassroom();
    if (action==='add-child') await addChild();
    if (action==='bulk-import') await bulkImport();
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
  root.addEventListener('change',(event)=>{ if(event.target.id==='class-filter'){ selectedClassroomId=event.target.value; renderAdultPortal().catch(error=>toast(firebaseErrorMessage(error),'error')); } });
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
