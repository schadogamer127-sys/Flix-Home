/* Offline, original UI textures. Logos remain separate transparent SVGs. */
const fs=require('fs'),path=require('path');
const sharp=require('sharp');
const dir=path.resolve(__dirname,'../app/assets');
const sourceDir=path.resolve(__dirname,'marks');
const colors={youtube:'#e45953',netflix:'#d85663',primevideo:'#63a8d6',disneyplus:'#65b7b0',max:'#7b9ac7',twitch:'#b596dd',appletv:'#c4c9d3',spotify:'#74bc91',plex:'#d3aa68',crunchyroll:'#d3a576',dazn:'#c4cb7c',movistar:'#68b4cf',neutral:'#d2b77d'};
(async()=>{
 for(const light of [false,true]){
  const mode=light?'light':'dark';
  const scene=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><defs>
   <linearGradient id="b" x2=".85" y2="1"><stop stop-color="${light?'#f6f0e6':'#080a0d'}"/><stop offset=".62" stop-color="${light?'#f0e8db':'#050608'}"/><stop offset="1" stop-color="${light?'#e5dac8':'#030405'}"/></linearGradient>
   <radialGradient id="l" cx=".35" cy=".18" r=".8"><stop stop-color="${light?'#fffaf0':'#76818b'}" stop-opacity="${light?'.28':'.055'}"/><stop offset="1" stop-color="${light?'#fffaf0':'#76818b'}" stop-opacity="0"/></radialGradient>
   </defs><rect width="960" height="540" fill="url(#b)"/><rect width="960" height="540" fill="url(#l)"/></svg>`;
  await sharp(Buffer.from(scene)).png().toFile(path.join(dir,`scene-${mode}.png`));
  for(const active of [false,true]){
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="282" height="248"><defs>
    <linearGradient id="body" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="${light?(active?'#fffaf0':'#f5f0e6'):(active?'#89939f':'#7f8b96')}"/><stop offset=".52" stop-color="${light?(active?'#faf2e5':'#f2ebdf'):(active?'#56616d':'#424d59')}"/><stop offset="1" stop-color="${light?(active?'#eee2cf':'#e9dfcf'):(active?'#222b35':'#18232e')}"/></linearGradient>
    <linearGradient id="edge" x2=".7" y2="1"><stop stop-color="${light?'#ffffff':'#d5dfe7'}" stop-opacity="${active?'.78':'.44'}"/><stop offset=".48" stop-color="${light?'#b6a78e':'#8c9aa6'}" stop-opacity=".12"/><stop offset="1" stop-color="${light?'#fefaf2':'#7b8996'}" stop-opacity=".30"/></linearGradient>
    <linearGradient id="shine" x2="1" y2=".8"><stop stop-color="#fff" stop-opacity="${light?'.38':'.13'}"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="shadow" x="-20%" y="-30%" width="140%" height="170%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <rect x="15" y="21" width="252" height="214" rx="28" fill="${light?'#61513a':'#000'}" opacity="${light?'.075':'.16'}" filter="url(#shadow)"/>
    <rect x="12" y="12" width="258" height="220" rx="28" fill="url(#body)" fill-opacity="${light?(active?'.28':'.17'):(active?'.26':'.16')}" stroke="url(#edge)" stroke-width="1.2"/>
    <rect x="14" y="14" width="254" height="216" rx="26" fill="url(#shine)"/>
    <path d="M38 14H244 Q268 14 268 38" fill="none" stroke="${light?'#fffdf8':'#dbe4eb'}" opacity="${light?'.55':'.16'}" stroke-width="1"/>
    <path d="M37 229H245" fill="none" stroke="${light?'#fff9ec':'#87939e'}" opacity="${light?'.5':'.16'}" stroke-width="1"/>
   </svg>`;
   await sharp(Buffer.from(svg)).png().toFile(path.join(dir,`glass-${mode}-${active?'active':'normal'}.png`));
  }
 }
 for(const [key,color] of Object.entries(colors)){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="330" height="284"><defs><filter id="g" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="12"/></filter></defs><rect x="40" y="41" width="250" height="203" rx="23" fill="${color}" opacity=".55" filter="url(#g)"/></svg>`;
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
  const vb=svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const raster=await sharp(Buffer.from(svg)).resize(480,480,{fit:'fill'}).png().toBuffer();
  const crop=(await sharp(raster).trim().png().toBuffer({resolveWithObject:true})).info;
  const x=Math.max(0,-crop.trimOffsetLeft-2),y=Math.max(0,-crop.trimOffsetTop-2),w=Math.min(480-x,crop.width+4),h=Math.min(480-y,crop.height+4);
  svg=svg.replace(/viewBox="[^"]+"/,'viewBox="'+[vb[0]+x*vb[2]/480,vb[1]+y*vb[3]/480,w*vb[2]/480,h*vb[3]/480].map(n=>n.toFixed(3)).join(' ')+'"');
  fs.writeFileSync(path.join(dir,`logo-${key}-${light?'light':'dark'}.svg`),svg);
 }
 console.log('Built 2 static scenes, 4 glass surfaces, 13 local glows, 24 transparent vector logos.');
})();
