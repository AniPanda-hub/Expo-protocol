/* ===== SETTINGS ===== */
$('#btnSettings').addEventListener('click',()=>{
  $('#settCurrPw').value='';$('#settNewPw').value='';$('#settConfirmPw').value='';
  $('#credMsg').textContent='';$('#credMsg').className='settings-msg';
  $('#syncStatus').textContent='';
  const creds=getCreds();
  $('#settNewId').value=creds.id;
  $('#settingsModal').classList.add('active');
});

$('#btnSaveCreds').addEventListener('click',()=>{
  const currPw=$('#settCurrPw').value;
  const newId=$('#settNewId').value.trim();
  const newPw=$('#settNewPw').value;
  const confirmPw=$('#settConfirmPw').value;
  const msg=$('#credMsg');
  const creds=getCreds();
  if(currPw!==creds.pw){msg.textContent='Current password is incorrect';msg.className='settings-msg err';return;}
  if(!newId){msg.textContent='Admin ID cannot be empty';msg.className='settings-msg err';return;}
  if(!newPw){msg.textContent='New password cannot be empty';msg.className='settings-msg err';return;}
  if(newPw!==confirmPw){msg.textContent='Passwords do not match';msg.className='settings-msg err';return;}
  if(newPw.length<4){msg.textContent='Password must be at least 4 characters';msg.className='settings-msg err';return;}
  saveCreds(newId,newPw);
  msg.textContent='Credentials updated successfully';msg.className='settings-msg ok';
  $('#settCurrPw').value='';$('#settNewPw').value='';$('#settConfirmPw').value='';
  showToast('Credentials updated');
});

$('#btnExportData').addEventListener('click',()=>{
  const data={
    expo_projects:localStorage.getItem('expo_projects')||'[]',
    expo_creds:localStorage.getItem('expo_creds')||null,
    expo_logo:localStorage.getItem('expo_logo')||null,
    expo_papers:localStorage.getItem('expo_papers')||'0',
    exportDate:new Date().toISOString(),version:'1.0'
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='expo-protocol-backup-'+new Date().toISOString().split('T')[0]+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
  $('#syncStatus').textContent='Exported: '+a.download;
  showToast('Data exported');
});

$('#btnImportData').addEventListener('click',()=>$('#importFileInput').click());
$('#importFileInput').addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
    try{
      const data=JSON.parse(reader.result);
      if(!data.expo_projects)throw new Error('Invalid');
      if(!confirm('This will replace all current data. Continue?'))return;
      localStorage.setItem('expo_projects',data.expo_projects);
      if(data.expo_creds)localStorage.setItem('expo_creds',data.expo_creds);
      if(data.expo_logo)localStorage.setItem('expo_logo',data.expo_logo);
      if(data.expo_papers)localStorage.setItem('expo_papers',data.expo_papers);
      $('#syncStatus').textContent='Imported: '+file.name;
      showToast('Data imported — refreshing...');
      setTimeout(()=>location.reload(),1500);
    }catch(err){showToast('Invalid backup file',true);}
  };
  reader.readAsText(file);e.target.value='';
});

$('#btnClearAll').addEventListener('click',()=>{
  if(!confirm('Delete ALL projects, logs, and settings permanently?'))return;
  if(!confirm('This cannot be undone. Are you absolutely sure?'))return;
  localStorage.removeItem('expo_projects');localStorage.removeItem('expo_creds');
  localStorage.removeItem('expo_logo');localStorage.removeItem('expo_papers');
  localStorage.removeItem('expo_auth');localStorage.removeItem('expo_sync_key');
  showToast('All data cleared');
  setTimeout(()=>location.reload(),1500);
});
