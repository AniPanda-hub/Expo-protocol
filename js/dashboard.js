/* ===== CREATE PROJECT ===== */
$('#btnNewProject').addEventListener('click',()=>{$('#projName').value='';$('#projDesc').value='';$('#projDate').value=new Date().toISOString().split('T')[0];$('#createModal').classList.add('active');});
$('#confirmCreate').addEventListener('click',()=>{
  const name=$('#projName').value.trim();
  if(!name){showToast('Project name required',true);return;}
  const date=$('#projDate').value||new Date().toISOString().split('T')[0];
  const projects=getProjects();
  const project={
    id:genId(),name,description:$('#projDesc').value.trim(),
    startDate:date,status:'Active',created:Date.now(),
    gx:0.3+Math.random()*0.4, gy:0.3+Math.random()*0.4,
    vx:0, vy:0
  };
  projects.push(project);
  saveProjects(projects);
  closeModal();
  initGraph();
  updateHeaderStats();
  showToast('Project created — '+name);
});

/* ===== HAMBURGER SIDEBAR ===== */
function toggleSidebar(){
  const drawer=$('#sidebarDrawer');
  const isOpen=drawer.classList.contains('open');
  if(isOpen){
    drawer.classList.remove('open');
  } else {
    drawer.classList.add('open');
  }
  // Resize canvas after sidebar transition completes
  setTimeout(()=>{
    if($('#dashScreen').classList.contains('active')){resizeCanvas();renderGraph();}
  },320);
}
$('#hamburgerBtn').addEventListener('click',toggleSidebar);

/* ===== DATE/TIME CLOCK ===== */
function updateDashDateTime(){
  const el=$('#dashDateTime');
  if(!el)return;
  const now=new Date();
  const opts={weekday:'short',month:'short',day:'numeric',year:'numeric'};
  const date=now.toLocaleDateString('en-US',opts);
  const time=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  el.textContent=date+' · '+time;
}

/* ===== DASHBOARD INIT ===== */
function initDashboard(){
  applyLogo(localStorage.getItem('expo_logo'));
  updateHeaderStats();
  renderGoals();
  renderLinks();
  initGraph();
  // Open sidebar by default
  $('#sidebarDrawer').classList.add('open');
  // Start clock
  updateDashDateTime();
  setInterval(updateDashDateTime,1000);
}

function updateHeaderStats(){
  const projects=getProjects();
  const live=projects.filter(p=>p.status==='Active').length;
  const completed=projects.filter(p=>p.status==='Completed').length;
  const papers=parseInt(localStorage.getItem('expo_papers')||'0');
  $('#headerStats').innerHTML=`
    <div class="header-stat"><div class="header-stat-dot" style="background:var(--accent)"></div><span class="header-stat-value">${live}</span><span class="header-stat-label">Live</span></div>
    <div class="header-stat"><div class="header-stat-dot" style="background:var(--green)"></div><span class="header-stat-value">${completed}</span><span class="header-stat-label">Completed</span></div>
    <div class="header-stat"><div class="header-stat-dot" style="background:var(--amber)"></div><span class="header-stat-value">${papers}</span><span class="header-stat-label">Published</span></div>`;
}

/* ===== SIDEBAR GOALS (editable) ===== */
function getGoals(){return JSON.parse(localStorage.getItem('expo_goals')||'[]');}
function saveGoals(d){localStorage.setItem('expo_goals',JSON.stringify(d));}

function renderGoals(){
  const goals=getGoals();
  const container=$('#leftGoals');
  if(!container)return;
  if(goals.length===0){
    const defaults=[
      'Advance core research objectives',
      'Publish findings in peer-reviewed journals',
      'Build collaborative project networks'
    ];
    saveGoals(defaults);
    renderGoals();
    return;
  }
  container.innerHTML=goals.map((g,i)=>`
    <div class="left-goal-row">
      <div class="left-goal"><div class="left-goal-bullet"></div><span>${escHtml(g)}</span></div>
      <button class="left-goal-delete" onclick="deleteGoal(${i})" title="Remove goal">✕</button>
    </div>
  `).join('');
}

function deleteGoal(idx){
  const goals=getGoals();
  goals.splice(idx,1);
  saveGoals(goals);
  renderGoals();
  showToast('Goal removed');
}

$('#btnAddGoal').addEventListener('click',()=>{
  const form=$('#addGoalForm');
  form.style.display=form.style.display==='none'?'block':'none';
  if(form.style.display==='block')$('#goalInput').focus();
});

$('#btnCancelGoal').addEventListener('click',()=>{
  $('#addGoalForm').style.display='none';
  $('#goalInput').value='';
});

$('#btnSaveGoal').addEventListener('click',()=>{
  const text=$('#goalInput').value.trim();
  if(!text){showToast('Enter a goal',true);return;}
  const goals=getGoals();
  goals.push(text);
  saveGoals(goals);
  renderGoals();
  $('#goalInput').value='';
  $('#addGoalForm').style.display='none';
  showToast('Goal added');
});

$('#goalInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#btnSaveGoal').click();});

/* ===== SIDEBAR LINKS (editable with icons) ===== */
function getLinks(){return JSON.parse(localStorage.getItem('expo_links')||'[]');}
function saveLinks(d){localStorage.setItem('expo_links',JSON.stringify(d));}

function renderLinks(){
  const links=getLinks();
  const container=$('#leftLinks');
  if(!container)return;
  if(links.length===0){
    const defaults=[
      {name:'Google Scholar',url:'https://scholar.google.com',icon:'🎓'},
      {name:'arXiv',url:'https://arxiv.org',icon:'📄'},
      {name:'GitHub',url:'https://github.com',icon:'💻'}
    ];
    saveLinks(defaults);
    renderLinks();
    return;
  }
  container.innerHTML=links.map((l,i)=>{
    const icon=l.icon||'🔗';
    return `
    <div class="left-link-row">
      <a class="left-link" href="${escHtml(l.url)}" target="_blank">
        <span class="left-link-icon">${icon}</span>
        ${escHtml(l.name)}
      </a>
      <button class="left-link-delete" onclick="deleteLink(${i})" title="Remove link">✕</button>
    </div>`;
  }).join('');
}

function deleteLink(idx){
  const links=getLinks();
  links.splice(idx,1);
  saveLinks(links);
  renderLinks();
  showToast('Link removed');
}

$('#btnAddLink').addEventListener('click',()=>{
  const form=$('#addLinkForm');
  form.style.display=form.style.display==='none'?'block':'none';
  if(form.style.display==='block')$('#linkNameInput').focus();
});

$('#btnCancelLink').addEventListener('click',()=>{
  $('#addLinkForm').style.display='none';
  $('#linkNameInput').value='';$('#linkUrlInput').value='';$('#linkIconInput').value='';
});

$('#btnSaveLink').addEventListener('click',()=>{
  const name=$('#linkNameInput').value.trim();
  let url=$('#linkUrlInput').value.trim();
  const icon=$('#linkIconInput').value.trim()||'🔗';
  if(!name){showToast('Enter a label',true);return;}
  if(!url){showToast('Enter a URL',true);return;}
  if(!url.startsWith('http://') && !url.startsWith('https://')){url='https://'+url;}
  const links=getLinks();
  links.push({name,url,icon});
  saveLinks(links);
  renderLinks();
  $('#linkNameInput').value='';$('#linkUrlInput').value='';$('#linkIconInput').value='';
  $('#addLinkForm').style.display='none';
  showToast('Link added');
});

$('#linkUrlInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#btnSaveLink').click();});

/* ===== SPHERE NETWORK GRAPH ===== */
let graphNodes=[], graphAnimId=null;
const COMPLETED_RADIUS=30;
const MIN_RADIUS=14;
const GROWTH_PER_DAY=0.15;
const MAX_RADIUS=70;

function initGraph(){
  const canvas=$('#graphCanvas');
  const projects=getProjects();
  const now=Date.now();

  graphNodes=projects.map(p=>{
    const daysSinceStart=Math.max(1,(now-new Date(p.startDate+'T00:00:00').getTime())/864e5);
    const isCompleted=p.status==='Completed';
    let radius;
    if(isCompleted){
      radius=COMPLETED_RADIUS;
    } else {
      radius=Math.min(MAX_RADIUS, MIN_RADIUS + daysSinceStart * GROWTH_PER_DAY);
    }
    return {
      id:p.id, name:p.name, status:p.status,
      startDate:p.startDate, description:p.description,
      x:p.gx*canvas.offsetWidth, y:p.gy*canvas.offsetHeight,
      vx:p.vx||0, vy:p.vy||0,
      radius, isCompleted,
      daysSinceStart:Math.floor(daysSinceStart)
    };
  });

  if(graphAnimId)cancelAnimationFrame(graphAnimId);
  resizeCanvas();
  runPhysics();
  setupGraphInteraction();
}

function resizeCanvas(){
  const canvas=$('#graphCanvas');
  canvas.width=canvas.offsetWidth*2;
  canvas.height=canvas.offsetHeight*2;
}
window.addEventListener('resize',()=>{if($('#dashScreen').classList.contains('active')){resizeCanvas();renderGraph();}});

function runPhysics(){
  const canvas=$('#graphCanvas');
  const W=canvas.offsetWidth, H=canvas.offsetHeight;
  const centerX=W/2, centerY=H/2;
  const damping=0.92;

  function step(){
    for(let i=0;i<graphNodes.length;i++){
      const a=graphNodes[i];
      const dx=centerX-a.x, dy=centerY-a.y;
      const distC=Math.sqrt(dx*dx+dy*dy)||1;
      a.vx+=dx*0.0003;
      a.vy+=dy*0.0003;

      for(let j=i+1;j<graphNodes.length;j++){
        const b=graphNodes[j];
        const ex=a.x-b.x, ey=a.y-b.y;
        const dist=Math.sqrt(ex*ex+ey*ey)||1;
        const minDist=(a.radius+b.radius)*1.8;
        if(dist<minDist){
          const force=(minDist-dist)*0.02;
          const fx=(ex/dist)*force, fy=(ey/dist)*force;
          a.vx+=fx; a.vy+=fy;
          b.vx-=fx; b.vy-=fy;
        }
      }

      for(let j=i+1;j<graphNodes.length;j++){
        const b=graphNodes[j];
        const ex=b.x-a.x, ey=b.y-a.y;
        const dist=Math.sqrt(ex*ex+ey*ey)||1;
        const idealDist=180;
        const force=(dist-idealDist)*0.0004;
        const fx=(ex/dist)*force, fy=(ey/dist)*force;
        a.vx+=fx; a.vy+=fy;
        b.vx-=fx; b.vy-=fy;
      }

      a.vx*=damping; a.vy*=damping;
    }

    for(const n of graphNodes){
      n.x+=n.vx; n.y+=n.vy;
      const pad=n.radius+10;
      if(n.x<pad){n.x=pad;n.vx*=-0.5;}
      if(n.x>W-pad){n.x=W-pad;n.vx*=-0.5;}
      if(n.y<pad){n.y=pad;n.vy*=-0.5;}
      if(n.y>H-pad){n.y=H-pad;n.vy*=-0.5;}
    }

    const projects=getProjects();
    for(const n of graphNodes){
      const p=projects.find(x=>x.id===n.id);
      if(p){p.gx=n.x/W;p.gy=n.y/H;p.vx=n.vx;p.vy=n.vy;}
    }
    saveProjects(projects);

    renderGraph();
    graphAnimId=requestAnimationFrame(step);
  }
  step();
}

function renderGraph(){
  const canvas=$('#graphCanvas');
  const ctx=canvas.getContext('2d');
  const dpr=2;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(graphNodes.length===0){
    ctx.font=`${13*dpr}px "DM Mono",monospace`;
    ctx.fillStyle='#c4c4c0';ctx.textAlign='center';
    ctx.fillText('Create your first project to begin',canvas.width/2,canvas.height/2);
    return;
  }

  // Draw strings
  for(let i=0;i<graphNodes.length;i++){
    for(let j=i+1;j<graphNodes.length;j++){
      const a=graphNodes[i],b=graphNodes[j];
      const dist=Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
      const maxDist=500;
      if(dist<maxDist){
        const alpha=0.55*(1-dist/maxDist);
        ctx.beginPath();
        ctx.moveTo(a.x*dpr,a.y*dpr);
        ctx.lineTo(b.x*dpr,b.y*dpr);
        ctx.strokeStyle=`rgba(37,99,235,${alpha})`;
        ctx.lineWidth=1.5*dpr;
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  for(const n of graphNodes){
    const x=n.x*dpr, y=n.y*dpr, r=n.radius*dpr;

    const glow=ctx.createRadialGradient(x,y,r*0.5,x,y,r*1.6);
    if(n.isCompleted){
      glow.addColorStop(0,'rgba(22,163,74,0.08)');
      glow.addColorStop(1,'rgba(22,163,74,0)');
    } else {
      glow.addColorStop(0,'rgba(37,99,235,0.06)');
      glow.addColorStop(1,'rgba(37,99,235,0)');
    }
    ctx.beginPath();ctx.arc(x,y,r*1.6,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();

    const grad=ctx.createRadialGradient(x-r*0.25,y-r*0.3,r*0.1,x,y,r);
    if(n.isCompleted){
      grad.addColorStop(0,'#4ade80');
      grad.addColorStop(0.6,'#16a34a');
      grad.addColorStop(1,'#0f7a36');
    } else {
      grad.addColorStop(0,'#60a5fa');
      grad.addColorStop(0.6,'#2563eb');
      grad.addColorStop(1,'#1d4ed8');
    }
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();

    const hl=ctx.createRadialGradient(x-r*0.3,y-r*0.35,0,x-r*0.2,y-r*0.25,r*0.6);
    hl.addColorStop(0,'rgba(255,255,255,0.35)');
    hl.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=hl;ctx.fill();

    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
    ctx.strokeStyle=n.isCompleted?'rgba(22,163,74,0.3)':'rgba(37,99,235,0.2)';
    ctx.lineWidth=1*dpr;ctx.stroke();

    ctx.font=`${Math.max(8,Math.min(11,n.radius*0.35))*dpr}px "DM Mono",monospace`;
    ctx.fillStyle='#ffffff';
    ctx.textAlign='center';ctx.textBaseline='middle';
    const displayName=n.name.length>12?n.name.substring(0,10)+'…':n.name;
    ctx.fillText(displayName,x,y);
  }
}

/* ===== GRAPH INTERACTION ===== */
let hoveredNode=null, dragNode=null, dragOffset={x:0,y:0}, didDragMove=false, graphInteractionReady=false;

function setupGraphInteraction(){
  if(graphInteractionReady)return;
  graphInteractionReady=true;
  const canvas=$('#graphCanvas');
  const tooltip=$('#sphereTooltip');

  function getMousePos(e){
    const rect=canvas.getBoundingClientRect();
    return {x:e.clientX-rect.left,y:e.clientY-rect.top};
  }
  function findNode(mx,my){
    for(let i=graphNodes.length-1;i>=0;i--){
      const n=graphNodes[i];
      const dist=Math.sqrt((mx-n.x)**2+(my-n.y)**2);
      if(dist<=n.radius)return n;
    }
    return null;
  }

  canvas.addEventListener('mousemove',e=>{
    const{x,y}=getMousePos(e);
    const node=findNode(x,y);
    if(dragNode){
      didDragMove=true;
      dragNode.x=x+dragOffset.x;
      dragNode.y=y+dragOffset.y;
      dragNode.vx=0;dragNode.vy=0;
      canvas.style.cursor='grabbing';
      return;
    }
    if(node){
      canvas.style.cursor='pointer';
      hoveredNode=node;
      const status=node.isCompleted?'COMPLETED':'ACTIVE · Day '+node.daysSinceStart;
      $('#tooltipName').textContent=node.name;
      $('#tooltipMeta').textContent=status;
      tooltip.style.left=(e.clientX-canvas.getBoundingClientRect().left+15)+'px';
      tooltip.style.top=(e.clientY-canvas.getBoundingClientRect().top-10)+'px';
      tooltip.classList.add('visible');
    } else {
      canvas.style.cursor='default';
      hoveredNode=null;
      tooltip.classList.remove('visible');
    }
  });

  canvas.addEventListener('mousedown',e=>{
    const{x,y}=getMousePos(e);
    const node=findNode(x,y);
    didDragMove=false;
    if(node){
      dragNode=node;
      dragOffset={x:node.x-x,y:node.y-y};
      canvas.style.cursor='grabbing';
    }
  });

  window.addEventListener('mouseup',()=>{
    dragNode=null;
    $('#graphCanvas').style.cursor='default';
  });

  canvas.addEventListener('click',e=>{
    if(didDragMove){didDragMove=false;return;}
    const{x,y}=getMousePos(e);
    const node=findNode(x,y);
    if(node){
      openProject(node.id);
    }
  });

  canvas.addEventListener('dblclick',e=>{e.preventDefault();});
}
