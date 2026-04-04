/* ===== TYPING WELCOME ===== */
(function(){
  const text='Welcome back, Captain.';
  const el=$('#welcomeText');
  el.classList.add('visible');
  let i=0;
  el.innerHTML='<span class="cursor"></span>';

  function typeChar(){
    if(i<text.length){
      el.innerHTML=text.substring(0,i+1)+'<span class="cursor"></span>';
      i++;
      setTimeout(typeChar,60+Math.random()*40);
    } else {
      setTimeout(()=>{
        el.style.transition='all 0.6s ease';
        el.style.opacity='0';
        el.style.transform='translateY(-20px)';
        setTimeout(showLogin,500);
      },1500);
    }
  }

  if(localStorage.getItem('expo_auth')==='true'){
    $('#welcomeLayer').classList.add('hidden');
    setTimeout(()=>{showScreen('dashScreen');initDashboard();},300);
  } else {
    setTimeout(typeChar,600);
  }
})();

function showLogin(){
  $('#welcomeLayer').classList.add('hidden');
  $('#loginPanel').classList.add('visible');
}

/* ===== LOGIN ===== */
$('#togglePw').addEventListener('click',()=>{
  const p=$('#loginPw'),b=$('#togglePw');
  if(p.type==='password'){p.type='text';b.textContent='HIDE';}
  else{p.type='password';b.textContent='SHOW';}
});
$('#loginBtn').addEventListener('click',doLogin);
$('#loginPw').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});

function doLogin(){
  const id=$('#loginId').value.trim(),pw=$('#loginPw').value;
  const creds=getCreds();
  if(id===creds.id&&pw===creds.pw){
    localStorage.setItem('expo_auth','true');
    showScreen('dashScreen');initDashboard();
  } else {
    $('#loginError').textContent='Invalid credentials';
    setTimeout(()=>$('#loginError').textContent='',3000);
  }
}

$('#btnLogout').addEventListener('click',()=>{localStorage.removeItem('expo_auth');location.reload();});

/* ===== LOGO UPLOAD ===== */
$('#logoInput').addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
    localStorage.setItem('expo_logo',reader.result);
    applyLogo(reader.result);
  };
  reader.readAsDataURL(file);
});

function applyLogo(dataUrl){
  if(dataUrl){$('#logoImg').src=dataUrl;$('#logoImg').style.display='block';$('#logoPlaceholder').style.display='none';}
  else{$('#logoImg').style.display='none';$('#logoPlaceholder').style.display='flex';}
}
