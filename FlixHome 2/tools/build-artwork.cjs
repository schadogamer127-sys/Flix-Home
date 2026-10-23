/* Offline, original UI textures. Logos remain separate transparent SVGs. */
const fs=require('fs'),path=require('path');
const sharp=require('sharp');
const dir=path.resolve(__dirname,'../app/assets');
const sourceDir=path.resolve(__dirname,'marks');
const colors={youtube:'#e45953',netflix:'#d85663',primevideo:'#63a8d6',disneyplus:'#65b7b0',max:'#7b9ac7',twitch:'#b596dd',appletv:'#c4c9d3',spotify:'#74bc91',plex:'#d3aa68',crunchyroll:'#d3a576',dazn:'#c4cb7c',movistar:'#68b4cf',neutral:'#d2b77d'};
(async()=>{
 for(const light of [false,true]){
  const mode=light?'light':'dark';
  const scene=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="${light?'#f0e6d2':'#222b35'}"/><stop offset=".58" stop-color="${light?'#e4d7bd':'#161e28'}"/><stop offset="1" stop-color="${light?'#cfba96':'#101820'}"/></linearGradient></defs><rect width="960" height="540" fill="url(#b)"/></svg>`;
  await sharp(Buffer.from(scene)).png().toFile(path.join(dir,`scene-${mode}.png`));
  for(const active of [false,true]){
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="258" height="158"><defs><linearGradient id="g" x2=".55" y2="1"><stop stop-color="${light?'#fffaf0':'#737f8d'}" stop-opacity="${light?.68:.20}"/><stop offset="1" stop-color="${light?'#ddceb2':'#283443'}" stop-opacity="${light?.68:.45}"/></linearGradient><linearGradient id="edge" x2=".7" y2="1"><stop stop-color="${light?'#fffaf0':'#dae4f0'}" stop-opacity="${active?.95:.50}"/><stop offset=".5" stop-color="${light?'#a58c62':'#8697ac'}" stop-opacity="${active?.50:.20}"/><stop offset="1" stop-color="${light?'#d6b879':'#b9c8d7'}" stop-opacity="${active?.8:.20}"/></linearGradient></defs><rect x="1" y="1" width="256" height="156" rx="23" fill="url(#g)" stroke="url(#edge)" stroke-width="${active?2:1}"/><path d="M26 2H232" stroke="${light?'#fffdf5':'#d5dfeb'}" opacity=".23"/></svg>`;
   await sharp(Buffer.from(svg)).png().toFile(path.join(dir,`glass-${mode}-${active?'active':'normal'}.png`));
  }
 }
 for(const [key,color] of Object.entries(colors)){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="330" height="230"><defs><filter id="g" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="12"/></filter></defs><rect x="40" y="41" width="250" height="149" rx="23" fill="${color}" opacity=".55" filter="url(#g)"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir,`glow-${key}.png`));
 }
 for(const key of Object.keys(colors).filter(k=>k!=='neutral'))for(const light of [false,true]){
  let svg;
  if(key==='max')svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100"><text x="75" y="43" text-anchor="middle" fill="currentColor" font-family="Arial,sans-serif" font-size="34" font-weight="700">HBO</text><text x="75" y="88" text-anchor="middle" fill="currentColor" font-family="Arial,sans-serif" font-size="49" font-weight="600">max</text></svg>';
  else svg=fs.readFileSync(path.join(sourceDir,key+'.svg'),'utf8');
  // Colour the vector mark itself, never add an opaque logo background.
  const color=key==='netflix'?(light?'#a82a38':'#f16d77'):(light?'#4b3d2c':'#f1f3f6');
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
