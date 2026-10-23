/* Offline, original UI textures. Logos remain separate transparent SVGs. */
const fs=require('fs'),path=require('path');
const sharp=require('sharp');
const dir=path.resolve(__dirname,'../app/assets');
const sourceDir=path.resolve(__dirname,'marks');
const colors={youtube:'#ff3b30',netflix:'#e50914',primevideo:'#00a8e1',disneyplus:'#3d8bff',max:'#8b5cf6',twitch:'#9146ff',appletv:'#c4c9d3',spotify:'#74bc91',plex:'#d3aa68',crunchyroll:'#d3a576',dazn:'#c4cb7c',movistar:'#68b4cf',neutral:'#d2b77d'};
(async()=>{
 for(const light of [false,true]){
  const mode=light?'light':'dark';
  await sharp({create:{width:960,height:540,channels:4,background:light?'#f3efe6':'#000000'}}).png().toFile(path.join(dir,`scene-${mode}.png`));
  for(const active of [false,true]){
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="292" height="248"><defs>
    <linearGradient id="rim" x2="0" y2="1"><stop stop-color="#fff" stop-opacity="${light?'.72':'.24'}"/><stop offset="1" stop-color="#fff" stop-opacity="${light?'.45':'.13'}"/></linearGradient>
    </defs><rect x="12.5" y="12.5" width="267" height="219" rx="27" fill="#fff" fill-opacity="${light?(active?'.32':'.30'):(active?'.045':'.035')}" stroke="url(#rim)" stroke-width="1"/>
    <path d="M40 14H252" stroke="#fff" stroke-opacity="${light?'.22':'.045'}" fill="none"/>
   </svg>`;
   await sharp(Buffer.from(svg)).png().toFile(path.join(dir,`glass-${mode}-${active?'active':'normal'}.png`));
  }
 }
 for(const [key,color] of Object.entries(colors)){
  // A symmetric, narrow rim glow; no filled pool, downward cast or ground shadow.
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="340" height="284"><defs>
   <filter id="near" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
   <filter id="far" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="8"/></filter>
   </defs><rect x="36" y="30" width="268" height="220" rx="28" fill="none" stroke="${color}" stroke-width="5" opacity=".42" filter="url(#near)"/>
   <rect x="36" y="30" width="268" height="220" rx="28" fill="none" stroke="${color}" stroke-width="6" opacity=".18" filter="url(#far)"/>
   <rect x="36" y="30" width="268" height="220" rx="28" fill="${color}" opacity=".040"/>
   </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir,`glow-${key}.png`));
 }
 for(const key of Object.keys(colors).filter(k=>k!=='neutral'))for(const light of [false,true]){
  let svg;
  svg=fs.readFileSync(path.join(sourceDir,key+'.svg'),'utf8');
  // Colour the vector mark itself, never add an opaque logo background.
  const brandColors={youtube:'#ff1827',netflix:'#e50914',primevideo:light?'#007da8':'#23b6ec',disneyplus:light?'#193d70':'#f1f3f6',max:light?'#171724':'#f5f5f3',twitch:light?'#7631b8':'#ad75f1',spotify:light?'#087d39':'#48ce7a',plex:light?'#8e650d':'#e4b44e',crunchyroll:'#df712e'};
  const color=brandColors[key]||(light?'#4b3d2c':'#f1f3f6');
  if(key==='disneyplus')svg=svg.replace(/#01147c/gi,light?'#112965':'#f5f5f3');
  svg=svg.replace(/#fff(?:fff)?\b/gi,color).replace(/currentColor/g,color);
  if(key==='youtube')svg=svg.replace('</svg>','<path fill="#ffffff" d="M9.545 15.568V8.432L15.818 12Z"/></svg>');
  const vb=svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const raster=await sharp(Buffer.from(svg)).resize(480,480,{fit:'fill'}).png().toBuffer();
  const crop=(await sharp(raster).trim().png().toBuffer({resolveWithObject:true})).info;
  const x=Math.max(0,-crop.trimOffsetLeft-2),y=Math.max(0,-crop.trimOffsetTop-2),w=Math.min(480-x,crop.width+4),h=Math.min(480-y,crop.height+4);
  svg=svg.replace(/viewBox="[^"]+"/,'viewBox="'+[vb[0]+x*vb[2]/480,vb[1]+y*vb[3]/480,w*vb[2]/480,h*vb[3]/480].map(n=>n.toFixed(3)).join(' ')+'"');
  fs.writeFileSync(path.join(dir,`logo-${key}-${light?'light':'dark'}.svg`),svg);
 }
 console.log('Built 2 static scenes, 4 glass surfaces, 13 local glows, 24 transparent vector logos.');
})();
