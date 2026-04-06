/* ===== PROJECT DETAIL ===== */
let currentProjectId=null;
let projClockInterval=null;

function openProject(id){
  currentProjectId=id;
  if(graphAnimId){cancelAnimationFrame(graphAnimId);graphAnimId=null;}
  showScreen('projectScreen');
  renderProjectDetail();
  renderTasks();
  startProjClock();
}

function goBackToDash(){
  currentProjectId=null;
  if(projClockInterval){clearInterval(projClockInterval);projClockInterval=null;}
  showScreen('dashScreen');
  initDashboard();
}

function startProjClock(){
  updateProjDateTime();
  if(projClockInterval)clearInterval(projClockInterval);
  projClockInterval=setInterval(updateProjDateTime,1000);
}

function updateProjDateTime(){
  const el=$('#projDateTime');
  if(!el)return;
  const now=new Date();
  const opts={weekday:'short',month:'short',day:'numeric',year:'numeric'};
  const date=now.toLocaleDateString('en-US',opts);
  const time=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  el.textContent=date+' · '+time;
}

$('#projBack').addEventListener('click',goBackToDash);

/* ===== DESCRIPTION SECTIONS SYSTEM ===== */
const DESC_SECTION_DEFS=[
  {key:'project_header',label:'Project Header'},
  {key:'aim',label:'Aim of the Project'},
  {key:'study_design',label:'Study Design'},
  {key:'sampling',label:'Sampling'},
  {key:'research_questions',label:'Research Question(s)'},
  {key:'research_hypotheses',label:'Research Hypothesis(es)'},
  {key:'objectives',label:'Objective(s)'},
  {key:'literature_review',label:'Literature Review'},
  {key:'inclusion_criteria',label:'Inclusion Criteria'},
  {key:'exclusion_criteria',label:'Exclusion Criteria'},
  {key:'methodology',label:'Methodology'},
  {key:'data_collection',label:'Data Collection Proforma'},
  {key:'questionnaires',label:'Questionnaire(s)'},
  {key:'consent_forms',label:'Consent Forms'},
  {key:'others',label:'Others'}
];

function getProjectSections(){
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  return (p&&p.sections)||[];
}

function saveProjectSections(sections){
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(p){p.sections=sections;saveProjects(projects);}
}

function addSection(key){
  const sections=getProjectSections();
  if(sections.find(s=>s.key===key))return;
  const def=DESC_SECTION_DEFS.find(d=>d.key===key);
  if(!def)return;
  sections.push({key:def.key,label:def.label,text:''});
  saveProjectSections(sections);
  renderDescSystem();
}

function removeSection(key){
  let sections=getProjectSections();
  sections=sections.filter(s=>s.key!==key);
  saveProjectSections(sections);
  renderDescSystem();
  showToast('Section removed');
}

function saveSectionText(key,text){
  const sections=getProjectSections();
  const s=sections.find(x=>x.key===key);
  if(s){s.text=text;saveProjectSections(sections);}
}

function toggleSection(el){
  el.closest('.desc-section-card').classList.toggle('open');
}

function renderDescSystem(){
  const sections=getProjectSections();
  const addedKeys=sections.map(s=>s.key);

  // Render active sections
  const container=$('#descSections');
  if(sections.length===0){
    container.innerHTML='<div class="desc-sections-empty">Click a section on the right to add it here</div>';
  } else {
    container.innerHTML=sections.map(s=>`
      <div class="desc-section-card open" data-section-key="${s.key}">
        <div class="desc-section-header" onclick="toggleSection(this)">
          <span class="desc-section-title">${escHtml(s.label)}</span>
          <div class="desc-section-actions">
            <button class="desc-section-remove" onclick="event.stopPropagation();removeSection('${s.key}')" title="Remove section">✕</button>
            <span class="desc-section-chevron">▾</span>
          </div>
        </div>
        <div class="desc-section-body">
          <textarea class="desc-section-textarea" placeholder="Write ${escHtml(s.label).toLowerCase()} here..." onblur="saveSectionText('${s.key}',this.value)">${escHtml(s.text||'')}</textarea>
        </div>
      </div>
    `).join('');
  }

  // Render picker buttons
  const picker=$('#descPickerList');
  picker.innerHTML=DESC_SECTION_DEFS.map(d=>{
    const isAdded=addedKeys.includes(d.key);
    return `<button class="desc-picker-btn ${isAdded?'added':''}" ${isAdded?'disabled':''} onclick="addSection('${d.key}')">
      <span class="desc-picker-dot"></span>${escHtml(d.label)}
    </button>`;
  }).join('');
}

/* Editable project name — save on blur */
$('#projPageTitleInput').addEventListener('blur',()=>{
  if(!currentProjectId)return;
  const newName=$('#projPageTitleInput').value.trim();
  if(!newName)return;
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(p&&p.name!==newName){
    p.name=newName;
    saveProjects(projects);
    showToast('Project renamed');
  }
});
$('#projPageTitleInput').addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();$('#projPageTitleInput').blur();}
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
  setTimeout(()=>{
    const cards=document.querySelectorAll('.log-card');
    if(cards.length>0){cards[cards.length-1].classList.add('open');}
  },50);
});

/* ===== TASKS ===== */
function getTasks(){
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  return (p&&p.tasks)||[];
}

function saveTasks(tasks){
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(p){p.tasks=tasks;saveProjects(projects);}
}

function renderTasks(){
  const tasks=getTasks();
  const container=$('#tasksContainer');
  const footer=$('#tasksFooter');
  if(!container)return;

  if(tasks.length===0){
    container.innerHTML='<div class="proj-tasks-empty">No tasks yet</div>';
    footer.style.display='none';
    return;
  }

  footer.style.display='';
  container.innerHTML=tasks.map((t,i)=>`
    <div class="task-item">
      <input type="checkbox" class="task-checkbox" ${t.done?'checked':''} onchange="toggleTask(${i})">
      <span class="task-text ${t.done?'done':''}">${escHtml(t.text)}</span>
      <button class="task-delete" onclick="deleteTask(${i})" title="Delete task">✕</button>
    </div>
  `).join('');
}

function toggleTask(idx){
  const tasks=getTasks();
  if(tasks[idx]){tasks[idx].done=!tasks[idx].done;saveTasks(tasks);renderTasks();}
}

function deleteTask(idx){
  const tasks=getTasks();
  tasks.splice(idx,1);
  saveTasks(tasks);
  renderTasks();
  showToast('Task removed');
}

$('#btnAddTask').addEventListener('click',()=>{
  const form=$('#taskAddForm');
  form.style.display=form.style.display==='none'?'block':'none';
  if(form.style.display==='block')$('#taskInput').focus();
});

$('#btnCancelTask').addEventListener('click',()=>{
  $('#taskAddForm').style.display='none';
  $('#taskInput').value='';
});

$('#btnSaveTask').addEventListener('click',()=>{
  const text=$('#taskInput').value.trim();
  if(!text){showToast('Enter a task',true);return;}
  const tasks=getTasks();
  tasks.push({text,done:false});
  saveTasks(tasks);
  renderTasks();
  $('#taskInput').value='';
  $('#taskAddForm').style.display='none';
  showToast('Task added');
});

$('#taskInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#btnSaveTask').click();});

$('#btnClearTasks').addEventListener('click',()=>{
  if(!confirm('Clear all tasks for this project?'))return;
  saveTasks([]);
  renderTasks();
  showToast('All tasks cleared');
});

/* ===== RENDER PROJECT DETAIL ===== */
function renderProjectDetail(){
  const projects=getProjects();
  const p=projects.find(x=>x.id===currentProjectId);
  if(!p){goBackToDash();return;}

  // Editable title
  $('#projPageTitleInput').value=p.name;

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
  const taskCount=(p.tasks||[]).length;
  const tasksDone=(p.tasks||[]).filter(t=>t.done).length;
  $('#projMetaRow').innerHTML=`
    <div class="proj-meta-item">START <span>${p.startDate}</span></div>
    <div class="proj-meta-item">DURATION <span>${daysActive} day${daysActive!==1?'s':''}</span></div>
    <div class="proj-meta-item">LOGS <span>${logCount}</span></div>
    <div class="proj-meta-item">TASKS <span>${tasksDone}/${taskCount}</span></div>
  `;

  // Description sections
  renderDescSystem();

  // Logs
  const logs=p.logs||[];
  const container=$('#logsContainer');
  if(logs.length===0){
    container.innerHTML='<div class="logs-empty">No log entries yet. Click "+ New Log" to begin.</div>';
    return;
  }

  let html='';
  logs.forEach((log,idx)=>{
    const logDate=new Date(log.date+'T00:00:00');
    const tPlus=Math.max(1,Math.floor((logDate-startDate)/864e5)+1);
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
          <div class="log-panel active" data-panel="write-${log.id}">
            <textarea class="log-text-area" placeholder="Write your observations, notes, findings..." onblur="saveLogText(this,'${log.id}')">${escHtml(log.text||'')}</textarea>
          </div>
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
