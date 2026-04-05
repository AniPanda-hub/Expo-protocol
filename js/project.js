/* ===== PROJECT DETAIL ===== */
let currentProjectId=null;

function openProject(id){
  currentProjectId=id;
  if(graphAnimId){cancelAnimationFrame(graphAnimId);graphAnimId=null;}
  showScreen('projectScreen');
  renderProjectDetail();
}

function goBackToDash(){
  currentProjectId=null;
  showScreen('dashScreen');
  initDashboard();
}

$('#projBack').addEventListener('click',goBackToDash);

/* Toggle description */
$('#projDescToggle').addEventListener('click',()=>{
  $('#projDescBlock').classList.toggle('open');
});

/* Save description on blur */
$('#projDescArea').addEventListener('blur',()=>{
  if(!currentProjectId)return;
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(p){p.description=$('#projDescArea').value.trim();saveProjects(projects);}
});

/* Toggle status */
$('#projStatusToggle').addEventListener('click',()=>{
  if(!currentProjectId)return;
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(p){
    p.status=p.status==='Active'?'Completed':'Active';
    saveProjects(projects);
    renderProjectDetail();
    showToast('Status changed to '+p.status);
  }
});

/* Delete project */
$('#projDeleteBtn').addEventListener('click',()=>{
  if(!currentProjectId)return;
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(!p)return;
  if(!confirm('Delete project "'+p.name+'" and all its logs? This cannot be undone.'))return;
  const updated=projects.filter(x=>x.id!==currentProjectId);
  saveProjects(updated);
  showToast('Project deleted');
  goBackToDash();
});

/* Delete individual log */
function deleteLog(logId){
  if(!currentProjectId)return;
  if(!confirm('Delete this log entry? This cannot be undone.'))return;
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(!p||!p.logs)return;
  p.logs=p.logs.filter(l=>l.id!==logId);
  saveProjects(projects);
  renderProjectDetail();
  showToast('Log deleted');
}

/* New log */
$('#btnNewLog').addEventListener('click',()=>{
  if(!currentProjectId)return;
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(!p)return;
  if(!p.logs)p.logs=[];
  const now=new Date();
  const log={
    id:'L-'+Date.now().toString(36).toUpperCase(),
    date:now.toISOString().split('T')[0],
    time:now.toTimeString().substring(0,5),
    text:'',
    images:[],
    audio:null,
    video:null,
    created:Date.now()
  };
  p.logs.push(log);
  saveProjects(projects);
  renderProjectDetail();
  // Auto-open the new log
  setTimeout(()=>{
    const cards=document.querySelectorAll('.log-card');
    if(cards.length>0){
      const last=cards[cards.length-1];
      last.classList.add('open');
    }
  },50);
});

function renderProjectDetail(){
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(!p){goBackToDash();return;}

  // Notion-style big title
  $('#projPageTitle').textContent=p.name;

  // Status badge
  const badge=$('#projStatusBadge');
  badge.textContent=p.status;
  badge.className='proj-status-badge '+(p.status==='Active'?'active':'completed');

  // Toggle button text
  $('#projStatusToggle').textContent=p.status==='Active'?'Mark Completed':'Reactivate';

  // Meta row
  const startDate=new Date(p.startDate+'T00:00:00');
  const now=new Date();
  const daysActive=Math.max(1,Math.floor((now-startDate)/864e5)+1);
  const logCount=(p.logs||[]).length;
  $('#projMetaRow').innerHTML=`
    <div class="proj-meta-item">START <span>${p.startDate}</span></div>
    <div class="proj-meta-item">DURATION <span>${daysActive} day${daysActive!==1?'s':''}</span></div>
    <div class="proj-meta-item">LOGS <span>${logCount}</span></div>
  `;

  // Description
  $('#projDescArea').value=p.description||'';

  // Logs
  const logs=p.logs||[];
  const container=$('#logsContainer');
  if(logs.length===0){
    container.innerHTML='<div class="logs-empty">No log entries yet. Click "+ New Log" to begin.</div>';
    return;
  }

  let html='';
  logs.forEach((log,idx)=>{
    // T+ calculation
    const logDate=new Date(log.date+'T00:00:00');
    const tPlus=Math.max(1,Math.floor((logDate-startDate)/864e5)+1);
    // Day gap from previous log
    let gapText='';
    if(idx>0){
      const prevDate=new Date(logs[idx-1].date+'T00:00:00');
      const gap=Math.floor((logDate-prevDate)/864e5);
      if(gap>0)gapText='+'+gap+'d gap';
    }

    const dateFormatted=logDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

    html+=`
    <div class="log-card" data-log-id="${log.id}">
      <div class="log-card-header" onclick="toggleLog(this)">
        <div class="log-t-badge">T+${tPlus}</div>
        <div class="log-card-date">${dateFormatted}</div>
        <div class="log-card-time">${log.time}</div>
        ${gapText?`<div class="log-card-gap">${gapText}</div>`:''}
        <button class="log-delete-btn" onclick="event.stopPropagation();deleteLog('${log.id}')" title="Delete log">✕</button>
        <div class="log-card-chevron">▾</div>
      </div>
      <div class="log-card-body">
        <div class="log-card-content">
          <div class="log-tabs">
            <button class="log-tab active" onclick="switchLogTab(this,'write','${log.id}')"><span class="log-tab-icon">✎</span>Write</button>
            <button class="log-tab" onclick="switchLogTab(this,'image','${log.id}')"><span class="log-tab-icon">🖼</span>Image</button>
            <button class="log-tab" onclick="switchLogTab(this,'audio','${log.id}')"><span class="log-tab-icon">🎤</span>Audio</button>
            <button class="log-tab" onclick="switchLogTab(this,'video','${log.id}')"><span class="log-tab-icon">🎬</span>Video</button>
          </div>
          <!-- Write panel -->
          <div class="log-panel active" data-panel="write-${log.id}">
            <textarea class="log-text-area" placeholder="Write your observations, notes, findings..." onblur="saveLogText(this,'${log.id}')">${escHtml(log.text||'')}</textarea>
          </div>
          <!-- Image panel -->
          <div class="log-panel" data-panel="image-${log.id}">
            <div class="log-media-zone" onclick="this.querySelector('input').click()">
              <input type="file" accept="image/*" onchange="handleLogImage(this,'${log.id}')">
              <div class="log-media-icon">📷</div>
              <div class="log-media-label">Click or drop an image</div>
            </div>
            <div class="log-media-preview" id="imgPreview-${log.id}">
              ${(log.images||[]).map(src=>`<img src="${src}" style="margin-top:0.5rem">`).join('')}
            </div>
          </div>
          <!-- Audio panel -->
          <div class="log-panel" data-panel="audio-${log.id}">
            <div class="log-media-zone" onclick="this.querySelector('input').click()">
              <input type="file" accept="audio/*" onchange="handleLogAudio(this,'${log.id}')">
              <div class="log-media-icon">🎙️</div>
              <div class="log-media-label">Upload audio recording</div>
            </div>
            <div class="log-media-preview" id="audioPreview-${log.id}">
              ${log.audio?`<audio controls src="${log.audio}" style="margin-top:0.5rem;width:100%"></audio>`:''}
            </div>
          </div>
          <!-- Video panel -->
          <div class="log-panel" data-panel="video-${log.id}">
            <div class="log-media-zone" onclick="this.querySelector('input').click()">
              <input type="file" accept="video/*" onchange="handleLogVideo(this,'${log.id}')">
              <div class="log-media-icon">📹</div>
              <div class="log-media-label">Upload video recording</div>
            </div>
            <div class="log-media-preview" id="videoPreview-${log.id}">
              ${log.video?`<video controls src="${log.video}" style="margin-top:0.5rem;width:100%"></video>`:''}
            </div>
          </div>
          <div class="log-save-bar">
            <button class="btn-save-log" onclick="showToast('Log saved')">Save</button>
          </div>
        </div>
      </div>
    </div>`;
  });
  container.innerHTML=html;
}

function toggleLog(header){
  header.closest('.log-card').classList.toggle('open');
}

function switchLogTab(btn,panel,logId){
  const card=btn.closest('.log-card-content');
  card.querySelectorAll('.log-tab').forEach(t=>t.classList.remove('active'));
  card.querySelectorAll('.log-panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  card.querySelector(`[data-panel="${panel}-${logId}"]`).classList.add('active');
}

function saveLogText(textarea,logId){
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(!p||!p.logs)return;
  const log=p.logs.find(l=>l.id===logId);
  if(log){log.text=textarea.value;saveProjects(projects);}
}

function handleLogImage(input,logId){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
    const projects=getProjects();
    const p=projects.find(x=>x.id===currentProjectId);
    if(!p||!p.logs)return;
    const log=p.logs.find(l=>l.id===logId);
    if(log){
      if(!log.images)log.images=[];
      log.images.push(reader.result);
      saveProjects(projects);
      const preview=document.getElementById('imgPreview-'+logId);
      preview.innerHTML+=`<img src="${reader.result}" style="margin-top:0.5rem">`;
      showToast('Image added');
    }
  };
  reader.readAsDataURL(file);
}

function handleLogAudio(input,logId){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
    const projects=getProjects();
    const p=projects.find(x=>x.id===currentProjectId);
    if(!p||!p.logs)return;
    const log=p.logs.find(l=>l.id===logId);
    if(log){
      log.audio=reader.result;
      saveProjects(projects);
      document.getElementById('audioPreview-'+logId).innerHTML=`<audio controls src="${reader.result}" style="margin-top:0.5rem;width:100%"></audio>`;
      showToast('Audio added');
    }
  };
  reader.readAsDataURL(file);
}

function handleLogVideo(input,logId){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
    const projects=getProjects();
    const p=projects.find(x=>x.id===currentProjectId);
    if(!p||!p.logs)return;
    const log=p.logs.find(l=>l.id===logId);
    if(log){
      log.video=reader.result;
      saveProjects(projects);
      document.getElementById('videoPreview-'+logId).innerHTML=`<video controls src="${reader.result}" style="margin-top:0.5rem;width:100%"></video>`;
      showToast('Video added');
    }
  };
  reader.readAsDataURL(file);
}
