/* Flix Home: lightweight NU7409 adaptation of arn0-tv (MIT).
   Uses its Apps, Inputs and brand modules; no Home interception or boot service. */
(function () {
 'use strict';
 var $=function(id){return document.getElementById(id);};
 var preview=!window.tizen, key='flixhome.prefs.v1', installed=[],shown=[], inputs=[], section=0,index=0,all=false,editing=false,menu=null,hold=null,held=false,toastTimer=null,hasApps=false;
 var defaults=['9Ur5IzDKqV.TizenYouTube','org.tizen.netflix-app','evKhCgZelL.AmazonIgnitionLauncher2','MCmYXNxgcu.DisneyPlus','5b8c3eb16b.BeamCTVDev','Jz7aUrV2Q4.Twitch'];
 var prefs={order:defaults.slice(),reduceMotion:false,glow:true,theme:'dark'};
 try{var saved=JSON.parse(localStorage.getItem(key));if(saved&&Array.isArray(saved.order)){prefs.order=saved.order;prefs.reduceMotion=saved.reduceMotion===true;prefs.glow=saved.glow!==false;prefs.theme=saved.theme==='light'?'light':'dark';}}catch(e){}
 function save(){try{localStorage.setItem(key,JSON.stringify(prefs));}catch(e){toast('Einstellungen konnten nicht gespeichert werden.');}}
 function toast(s){$('toast').textContent=s;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(function(){$('toast').classList.add('hidden');},4500);}
 function failure(e){toast('TV meldet: '+(e.message||e.name||String(e)));}
 function el(tag,cls,text){var n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;}
 function launch(id){if(preview){toast('Vorschau: '+id);return;}Apps.launch(id).catch(failure);}
 function appearance(){
  $('stage').classList.toggle('reduce-motion',prefs.reduceMotion);
  $('stage').classList.toggle('no-glow',!prefs.glow);
  $('stage').classList.toggle('light',prefs.theme==='light');
 }
 // Each glyph is a fixed 5 × 7 map. Only changed paths are updated once a second.
 var digits=[
  ['01110','10001','10001','10001','10001','10001','01110'],
  ['00100','01100','00100','00100','00100','00100','01110'],
  ['01110','10001','00001','00010','00100','01000','11111'],
  ['11110','00001','00001','01110','00001','00001','11110'],
  ['00010','00110','01010','10010','11111','00010','00010'],
  ['11111','10000','10000','11110','00001','00001','11110'],
  ['01110','10000','10000','11110','10001','10001','01110'],
  ['11111','00001','00010','00100','01000','01000','01000'],
  ['01110','10001','10001','01110','10001','10001','01110'],
  ['01110','10001','10001','01111','00001','00001','01110']
 ];
 var clockPaths=[],clockValues='',svgNS='http://www.w3.org/2000/svg';
 function matrixPath(value,size,gap){var path='';digits[Number(value)].forEach(function(row,y){row.split('').forEach(function(on,x){if(on==='1')path+='M'+(x*(size+gap))+' '+(y*(size+gap))+'h'+size+'v'+size+'h-'+size+'z';});});return path;}
 function makeClock(){
  var svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 625 145');svg.setAttribute('aria-hidden','true');
  [0,110,250,360,492,558].forEach(function(x,i){var path=document.createElementNS(svgNS,'path');path.setAttribute('class','matrix-digit');path.setAttribute('transform','translate('+x+' '+(i<4?4:58)+')');svg.appendChild(path);clockPaths.push(path);});
  [224,470].forEach(function(x,i){var path=document.createElementNS(svgNS,'path'),size=i?7:13,y=i?76:39;path.setAttribute('d','M'+x+' '+y+'h'+size+'v'+size+'h-'+size+'z M'+x+' '+(y+(i?29:48))+'h'+size+'v'+size+'h-'+size+'z');path.setAttribute('class','matrix-colon');svg.appendChild(path);});
  $('clock').appendChild(svg);
 }
 function clock(){
  if(document.hidden)return;
  var d=new Date(),value=('0'+d.getHours()).slice(-2)+('0'+d.getMinutes()).slice(-2)+('0'+d.getSeconds()).slice(-2);
  if(!clockPaths.length)makeClock();
  clockPaths.forEach(function(path,i){if(clockValues[i]!==value[i])path.setAttribute('d',matrixPath(value[i],i<4?15:8,i<4?4:3));});
  clockValues=value;$('clock').setAttribute('aria-label',value.slice(0,2)+':'+value.slice(2,4)+':'+value.slice(4));
  var date=d.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});if($('date').textContent!==date)$('date').textContent=date;
 }
 function appById(id){for(var i=0;i<installed.length;i++)if(installed[i].id===id)return installed[i];return null;}
 function visibleApps(){if(all)return installed.slice();var a=[];prefs.order.forEach(function(id){var x=appById(id);if(x)a.push(x);});return a;}
 var navIcons=[
 '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
 '<path d="M5 7h14M5 17h14"/><circle cx="9" cy="7" r="2.5"/><circle cx="15" cy="17" r="2.5"/>',
 '<path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>'
 ];
 function toolbar(){
  var n=$('toolbar');n.textContent='';
  [all?'Favoriten':'Alle Apps',editing?'Fertig':'Bearbeiten','Einstellungen','Darstellung'].forEach(function(label,i){
   var button=el('button','pill');button.setAttribute('aria-label',label);
   if(i===3){
    button.classList.add('theme-switch');button.setAttribute('role','switch');button.setAttribute('aria-checked',String(prefs.theme==='light'));button.setAttribute('aria-label','Heller Modus');
    button.appendChild(el('span','mode-selection'));button.appendChild(el('span','mode-label mode-light','Hell'));button.appendChild(el('span','mode-label mode-dark','Dunkel'));
   }else{
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">'+navIcons[i]+'</svg>';
    button.appendChild(el('span','nav-label',label));
   }
   button.onclick=function(){section=0;index=i;activate();};n.appendChild(button);
  });
 }
 var logoKeys=['youtube','netflix','primevideo','disneyplus','max','twitch','appletv','spotify','plex','crunchyroll','dazn','movistar'];
 function render(){
  toolbar();shown=visibleApps();$('heading').textContent=all?'Alle Apps':(editing?'Apps ordnen':'Apps');
  $('hint').textContent=editing?'App auswählen · Verschieben oder ausblenden · Zurück beendet Bearbeiten':'OK zum Öffnen · OK halten zum Bearbeiten';
  var box=$('tiles');box.textContent='';
  shown.forEach(function(app,i){
   var tile=el('button','app'),brand=findBrand(app),brandKey=brand&&logoKeys.indexOf(brand.key)>=0?brand.key:'neutral';
   tile.setAttribute('aria-label',app.name);tile.setAttribute('data-brand',brandKey);
   var glow=el('img','tile-glow');glow.src='assets/glow-'+brandKey+'.png';glow.alt='';tile.appendChild(glow);
   ['normal','active'].forEach(function(state){var surface=el('img','surface surface-'+state);surface.src='assets/glass-'+prefs.theme+'-'+state+'.png';surface.alt='';tile.appendChild(surface);});
   var face=el('span','logo-inner');
   if(brandKey!=='neutral'){
    var logo=el('img','logo logo-'+brandKey);logo.src='assets/logo-'+brandKey+'-'+prefs.theme+'.svg';logo.alt='';
    logo.onerror=function(){this.style.display='none';face.appendChild(el('span','fallback',app.name.charAt(0).toUpperCase()));};face.appendChild(logo);
   }else face.appendChild(el('span','fallback',app.name.charAt(0).toUpperCase()));
   tile.appendChild(face);tile.appendChild(el('span','label',app.name));tile.onclick=function(){section=1;index=i;activate();};box.appendChild(tile);
  });
  renderInputs();if(!shown.length)box.appendChild(el('p','empty-state',all?'Keine Apps gefunden.':'Noch keine Favoriten. Über „Alle Apps“ hinzufügen.'));focus();
 }
 function lineIcon(paths,cls){var n=document.createElementNS(svgNS,'svg');n.setAttribute('viewBox','0 0 24 24');n.setAttribute('class',cls);n.setAttribute('fill','none');n.setAttribute('stroke','currentColor');n.setAttribute('stroke-width','1.6');n.setAttribute('stroke-linecap','round');n.setAttribute('stroke-linejoin','round');n.setAttribute('aria-hidden','true');n.innerHTML=paths;return n;}
 var hdmiIcon='<path d="M3 7h18v7l-4 4H7l-4-4Z"/><path d="M7 11h10M9 14h6"/>',tvIcon='<rect x="3" y="6" width="18" height="14" rx="2"/><path d="m8 2 4 4 4-4"/>';
 function renderInputs(){var row=$('input-row');row.textContent='';inputs.forEach(function(a,i){var b=el('button','input');b.appendChild(lineIcon(a.hdmi?hdmiIcon:tvIcon,'input-symbol'));var copy=el('span','input-copy');copy.appendChild(el('span','input-name',a.label));if(a.connected!==undefined){copy.appendChild(el('small','',a.connected?'verbunden':'frei'));var dot=el('span','input-status'+(a.connected?' connected':''));dot.setAttribute('aria-hidden','true');b.appendChild(dot);}b.appendChild(copy);b.setAttribute('aria-label',a.label+(a.connected!==undefined?(a.connected?', verbunden':', frei'):''));b.onclick=function(){section=2;index=i;activate();};row.appendChild(b);});}
 function nodes(){return section===0?$('toolbar').children:section===1?$('tiles').querySelectorAll('.app'):$('input-row').children;}
 function focus(){
  var old=document.querySelectorAll('.focused');for(var j=0;j<old.length;j++){old[j].classList.remove('focused');old[j].removeAttribute('data-focused');}
  if(menu){var options=$('options').children;menu.index=Math.max(0,Math.min(menu.index,options.length-1));if(options[menu.index])options[menu.index].classList.add('focused');return;}
  var ns=nodes();if(!ns.length&&section===1){section=0;index=0;ns=nodes();}
  index=Math.max(0,Math.min(index,ns.length-1));if(ns[index]){ns[index].classList.add('focused');ns[index].setAttribute('data-focused','true');}
  var row=section===1?Math.floor(index/6):0;$('tiles').style.transform='translateY('+(-row*252)+'px)';
 }
 function openMenu(title,options){menu={options:options,index:0};$('dialog-title').textContent=title;$('options').textContent='';options.forEach(function(o,i){var b=el('button','option');var label=o[0],detail='';
   if(title==='Einstellungen'){
    if(i===0){label='Darstellung';detail=prefs.theme==='light'?'Hell':'Dunkel';}
    if(i===2)label='TV-Einstellungen';
    if(i===3)label='Eingangsquellen';
    if(i===4){label='Animationen';detail='Aus';}
    if(i===5){label='Kachellicht';detail=prefs.glow?'Ein':'Aus';}
    if(i===1||i===4||i===6)b.classList.add('group-start');
   }
   if(title==='Einstellungen'){
    var icons=['<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>','<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',tvIcon,hdmiIcon,'<path d="m12 3 2 4-2 4-2-4Zm-6 8 2 4-2 4-2-4Zm12 0 2 4-2 4-2-4Z"/>','<path d="M9 17c0-3-3-4-3-7a6 6 0 0 1 12 0c0 3-3 4-3 7ZM9 20h6"/>','<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>','<path d="m5 5 14 14M5 19 19 5"/>'];
    b.appendChild(lineIcon(icons[i]||icons[7],'option-icon'));
   }
   b.appendChild(el('span','option-name',label));
   if(detail)b.appendChild(el('span','option-detail',detail));
   b.setAttribute('aria-label',label+(detail?', '+detail:''));b.onclick=function(){menu.index=i;choose();};$('options').appendChild(b);});$('modal').classList.remove('hidden');focus();}
 function closeMenu(){menu=null;$('modal').classList.add('hidden');focus();}
 function choose(){var fn=menu.options[menu.index][1];closeMenu();fn();}
 function move(id,delta){var p=prefs.order.indexOf(id),q=p+delta;if(p<0||q<0||q>=prefs.order.length){toast('Hier ist der Rand der Favoriten.');return;}prefs.order.splice(p,1);prefs.order.splice(q,0,id);save();index=q;render();}
 function editApp(){var a=shown[index];if(!a)return;var pinned=prefs.order.indexOf(a.id)>=0;var options=[];if(pinned){options.push(['Nach links verschieben',function(){move(a.id,-1);}]);options.push(['Nach rechts verschieben',function(){move(a.id,1);}]);options.push(['Aus Favoriten ausblenden',function(){prefs.order=prefs.order.filter(function(id){return id!==a.id;});save();render();}]);}else{options.push(['Zu Favoriten hinzufügen',function(){prefs.order.push(a.id);save();render();toast('Zu Favoriten hinzugefügt');}]);}options.push(['Öffnen',function(){launch(a.id);}]);options.push(['Abbrechen',function(){}]);openMenu(a.name,options);}
 function settings(){openMenu('Einstellungen',[
 [prefs.theme==='dark'?'Darstellung: Dunkel → Hell':'Darstellung: Hell → Dunkel',function(){prefs.theme=prefs.theme==='dark'?'light':'dark';save();appearance();render();}],
 ['Samsung Home',function(){launch('com.samsung.tv.csfs');}],
 ['TV-Einstellungen über Samsung Home',function(){launch('com.samsung.tv.csfs');}],
 ['Quellen öffnen',function(){launch('org.tizen.SMSourceAPP');}],
 [prefs.reduceMotion?'Animationen: reduziert → normal':'Animationen: normal → reduziert',function(){toast('Animationen sind in dieser Version deaktiviert.');}],
 [prefs.glow?'Örtliches Kachellicht ausschalten':'Örtliches Kachellicht einschalten',function(){prefs.glow=!prefs.glow;save();appearance();}],
 ['Apps neu einlesen',function(){load();}],
 ['Schließen',function(){}]
 ]);}
 function activate(){if(menu){choose();return;}if(section===0){if(index===0){all=!all;section=1;index=0;render();}else if(index===1){editing=!editing;section=1;index=0;render();}else if(index===2)settings();else{prefs.theme=prefs.theme==='dark'?'light':'dark';save();appearance();render();}}else if(section===1){if(editing||all)editApp();else if(shown[index])launch(shown[index].id);}else if(inputs[index]){var a=inputs[index];if(a.hdmi){if(preview){toast('Vorschau: '+a.label);return;}Inputs.open(a.hdmi,'switch+viewer').catch(failure);}else launch(a.id);}}
 function back(){if(menu){closeMenu();return;}if(editing){editing=false;render();return;}if(all){all=false;section=1;index=0;render();return;}openMenu('Flix Home verlassen?', [['Zu Samsung Home',function(){launch('com.samsung.tv.csfs');}],['Hier bleiben',function(){}]]);}
 function arrow(code){if(menu){if(code===38)menu.index=Math.max(0,menu.index-1);if(code===40)menu.index=Math.min(menu.options.length-1,menu.index+1);focus();return;}var count=nodes().length;if(code===37)index=Math.max(0,index-1);if(code===39)index=Math.min(count-1,index+1);if(code===38){if(section===2){section=1;index=Math.max(0,shown.length-6+index);}else if(section===1&&index>=6)index-=6;else{section=0;index=0;}}if(code===40){if(section===0){section=1;index=0;}else if(section===1&&index+6<shown.length)index+=6;else{section=2;index=0;}}focus();}
 document.addEventListener('keydown',function(e){var c=e.keyCode;if([13,37,38,39,40,10009,27,8].indexOf(c)<0)return;e.preventDefault();if(c===13){if(hold||held)return;hold=setTimeout(function(){hold=null;held=true;if(section===1&&!menu)editApp();},650);return;}if(c===10009||c===27||c===8)back();else arrow(c);});
 document.addEventListener('keyup',function(e){if(e.keyCode!==13)return;clearTimeout(hold);hold=null;if(!held)activate();held=false;});
 window.addEventListener('blur',function(){clearTimeout(hold);hold=null;held=false;});
 function load(){if(preview){installed=[{id:defaults[0],name:'YouTube'},{id:defaults[1],name:'Netflix'},{id:defaults[2],name:'Prime Video'},{id:defaults[3],name:'Disney+'},{id:defaults[4],name:'HBO Max'},{id:defaults[5],name:'Twitch'},{id:'org.tizen.browser',name:'Internet'}];if(!hasApps){section=1;index=0;hasApps=true;}inputs=[{hdmi:1,label:'HDMI 1',connected:true},{hdmi:2,label:'HDMI 2',connected:false},{hdmi:3,label:'HDMI 3',connected:false},{id:'org.tizen.tv-viewer',label:'Fernsehen'}];render();return;}
 Apps.getInstalledApps().then(function(list){installed=Apps.launchable(list).filter(function(a){return Apps.describe(a).consumer||defaults.indexOf(a.id)>=0;});if(!hasApps){section=1;index=0;hasApps=true;}var nativeNetflix=appById('org.tizen.netflix-app');if(nativeNetflix)installed=installed.filter(function(a){return a.id!=='RN1MCdNq8t.Netflix';});render();},failure);
 Inputs.sources().then(function(info){inputs=[];var seen={};(info.connected||[]).concat(info.disconnected||[]).forEach(function(s){if(s.type!=='HDMI'||seen[s.number])return;seen[s.number]=true;inputs.push({hdmi:s.number,label:'HDMI '+s.number,connected:(info.connected||[]).some(function(c){return c.type==='HDMI'&&c.number===s.number;})});});inputs.sort(function(a,b){return a.hdmi-b.hdmi;});inputs.push({id:'org.tizen.tv-viewer',label:'Fernsehen'});renderInputs();},function(){inputs=[{id:'org.tizen.SMSourceAPP',label:'Quellen öffnen'},{id:'org.tizen.tv-viewer',label:'Fernsehen'}];renderInputs();});}
 if(preview)$('preview').textContent='Browser-Vorschau';
 function scale(){if(preview)$('stage').style.transform='scale('+Math.min(window.innerWidth/1920,window.innerHeight/1080)+')';}
 document.addEventListener('visibilitychange',function(){if(!document.hidden)clock();});window.addEventListener('resize',scale);scale();appearance();clock();setInterval(clock,1000);section=1;toolbar();load();
}());
