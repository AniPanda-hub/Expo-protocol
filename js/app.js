/* ===== UTILITIES ===== */
const $=s=>document.querySelector(s);
const genId=()=>'P-'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).substring(2,5).toUpperCase();

function showToast(m,e=false){
  const t=$('#toast');t.textContent=m;
  t.className='toast'+(e?' error':'');
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>t.classList.remove('show'),2500);
}
function closeModal(){$('#createModal').classList.remove('active');}
function closeSettings(){$('#settingsModal').classList.remove('active');}
function escHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ===== CREDENTIALS ===== */
function getCreds(){
  const stored=localStorage.getItem('expo_creds');
  if(stored)return JSON.parse(stored);
  return {id:'admin',pw:'1234'};
}
function saveCreds(id,pw){localStorage.setItem('expo_creds',JSON.stringify({id,pw}));}

/* ===== DATA LAYER ===== */
function getProjects(){return JSON.parse(localStorage.getItem('expo_projects')||'[]');}
function saveProjects(d){localStorage.setItem('expo_projects',JSON.stringify(d));}
