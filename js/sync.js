/* ===== CLOUD SYNC (Firebase — fully automatic) ===== */
let firebaseApp=null,firebaseDB=null,syncRef=null,syncListener=null;
let cloudConnected=false,ignorePull=false,syncDebounce=null;

function setSyncStatus(type,msg){
  const el=$('#cloudSyncStatus');
  if(!el)return;
  const dots={connected:'green',syncing:'blue',error:'red',info:''};
  el.className='sync-status-bar '+type;
  el.innerHTML=(dots[type]?`<span class="sync-dot ${dots[type]}"></span>`:'')+msg;
}

function updateSyncIndicator(state,text){
  const dot=$('#syncIndDot'),txt=$('#syncIndText');
  if(!dot||!txt)return;
  dot.className='sync-ind-dot '+state;
  txt.textContent=text;
}

function getSavedFbConfig(){
  const s=localStorage.getItem('expo_fb_config');
  return s?JSON.parse(s):null;
}

function initFirebase(url,apiKey){
  if(firebaseApp&&firebaseDB)return true;
  try{
    firebaseApp=firebase.initializeApp({apiKey:apiKey,databaseURL:url});
    firebaseDB=firebase.database();
    return true;
  }catch(e){
    try{
      firebaseApp=firebase.app();
      firebaseDB=firebase.database();
      return true;
    }catch(e2){
      console.error('Firebase init error:',e,e2);
      return false;
    }
  }
}

function getAllSyncData(){
  return{
    projects:localStorage.getItem('expo_projects')||'[]',
    creds:localStorage.getItem('expo_creds')||null,
    papers:localStorage.getItem('expo_papers')||'0',
    links:localStorage.getItem('expo_links')||'[]',
    goals:localStorage.getItem('expo_goals')||'[]',
    lastSync:Date.now()
  };
}

function applySyncData(data){
  if(data.projects)localStorage.setItem('expo_projects',data.projects);
  if(data.creds)localStorage.setItem('expo_creds',data.creds);
  if(data.papers)localStorage.setItem('expo_papers',data.papers);
  if(data.links)localStorage.setItem('expo_links',data.links);
  if(data.goals)localStorage.setItem('expo_goals',data.goals);
}

function pushToCloud(){
  if(!cloudConnected||!syncRef)return;
  clearTimeout(syncDebounce);
  syncDebounce=setTimeout(()=>{
    ignorePull=true;
    updateSyncIndicator('syncing','Syncing...');
    syncRef.set(getAllSyncData()).then(()=>{
      updateSyncIndicator('live','Synced');
      setTimeout(()=>{ignorePull=false;},2000);
    }).catch((err)=>{
      console.error('Push error:',err);
      updateSyncIndicator('off','Sync error');
      ignorePull=false;
    });
  },800);
}

function startRealtimeListener(){
  if(syncListener&&syncRef){syncRef.off('value',syncListener);syncListener=null;}
  syncListener=syncRef.on('value',snap=>{
    if(ignorePull)return;
    const data=snap.val();
    if(!data||!data.projects)return;
    const localProjects=localStorage.getItem('expo_projects')||'[]';
    if(data.projects!==localProjects){
      applySyncData(data);
      updateSyncIndicator('live','Synced');
      if($('#dashScreen').classList.contains('active')){updateHeaderStats();initGraph();}
      if($('#projectScreen').classList.contains('active')&&currentProjectId){renderProjectDetail();}
    }
  },err=>{
    console.error('Listener error:',err);
    updateSyncIndicator('off','Sync lost');
  });
}

function connectCloud(url,apiKey){
  if(!url||!apiKey){updateSyncIndicator('off','Offline');return;}
  if(!initFirebase(url,apiKey)){
    updateSyncIndicator('off','Error');
    setSyncStatus('error','Failed to initialize Firebase — check URL and API Key');
    return;
  }
  syncRef=firebaseDB.ref('expo_data');
  updateSyncIndicator('syncing','Connecting...');

  syncRef.once('value').then(snap=>{
    const cloudData=snap.val();
    const localProjects=JSON.parse(localStorage.getItem('expo_projects')||'[]');

    if(cloudData&&cloudData.projects){
      const cloudProjs=JSON.parse(cloudData.projects||'[]');
      if(cloudProjs.length>=localProjects.length){
        applySyncData(cloudData);
        if($('#dashScreen').classList.contains('active')){updateHeaderStats();initGraph();}
      } else {
        syncRef.set(getAllSyncData());
      }
    } else if(localProjects.length>0){
      syncRef.set(getAllSyncData());
    }

    cloudConnected=true;
    updateSyncIndicator('live','Synced');
    setSyncStatus('connected','Connected — auto-syncing enabled');
    startRealtimeListener();
  }).catch(err=>{
    console.error('Connect error:',err);
    updateSyncIndicator('off','Error');
    let msg='Connection failed. ';
    if(err.code==='PERMISSION_DENIED'){
      msg+='Database rules are blocking access. In Firebase Console → Realtime Database → Rules → set both read and write to true.';
    } else if(err.message&&err.message.includes('projectId')){
      msg+='Invalid API Key. Go to Firebase → Project Settings → copy the Web API Key.';
    } else {
      msg+='Check that the URL and API Key are correct. Error: '+err.message;
    }
    setSyncStatus('error',msg);
    const cm=$('#cloudMsg');if(cm){cm.textContent=msg;cm.className='settings-msg err';}
  });
}

function disconnectCloud(){
  if(syncListener&&syncRef){syncRef.off('value',syncListener);syncListener=null;}
  cloudConnected=false;syncRef=null;
  localStorage.removeItem('expo_fb_config');
  updateSyncIndicator('off','Offline');
}

/* Settings: Enable cloud sync */
$('#btnCloudSave').addEventListener('click',()=>{
  const url=$('#fbUrl').value.trim();
  const apiKey=$('#fbApiKey').value.trim();
  const cm=$('#cloudMsg');

  if(!url||!url.startsWith('https://')){
    cm.textContent='Enter a valid Firebase Database URL (starts with https://)';cm.className='settings-msg err';return;
  }
  if(!apiKey||apiKey.length<10){
    cm.textContent='Enter the Web API Key from Firebase Project Settings';cm.className='settings-msg err';return;
  }

  // Reset if already initialized with different config
  if(firebaseApp){
    try{firebaseApp.delete();}catch(e){}
    firebaseApp=null;firebaseDB=null;
  }

  localStorage.setItem('expo_fb_config',JSON.stringify({url,apiKey}));
  cm.textContent='Connecting...';cm.className='settings-msg ok';
  $('#btnCloudDisconnect').style.display='';
  connectCloud(url,apiKey);
});

$('#btnCloudDisconnect').addEventListener('click',()=>{
  disconnectCloud();
  $('#btnCloudDisconnect').style.display='none';
  const cm=$('#cloudMsg');cm.textContent='Cloud sync disabled';cm.className='settings-msg info';
  setSyncStatus('info','Disconnected');
  showToast('Cloud sync disabled');
});

$('#syncIndicator').addEventListener('click',()=>{$('#btnSettings').click();});

/* Override saveProjects to auto-push */
const _origSaveProjects=saveProjects;
saveProjects=function(d){
  _origSaveProjects(d);
  pushToCloud();
};

/* Auto-connect on page load */
(function(){
  const cfg=getSavedFbConfig();
  if(cfg&&cfg.url&&cfg.apiKey){
    $('#fbUrl').value=cfg.url;
    $('#fbApiKey').value=cfg.apiKey;
    $('#btnCloudDisconnect').style.display='';
    setTimeout(()=>connectCloud(cfg.url,cfg.apiKey),800);
  } else {
    updateSyncIndicator('off','Offline');
  }
})();
