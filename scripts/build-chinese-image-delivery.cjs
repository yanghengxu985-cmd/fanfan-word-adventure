/**
 * Build delivery encodings from intact source artwork.
 * Requires Sharp, locally or via CODEX_SHARP_PATH. No new picture content is made.
 * Run from the project root: node scripts/build-chinese-image-delivery.cjs sample|build
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require(process.env.CODEX_SHARP_PATH || 'sharp');
sharp.concurrency(1);
sharp.cache({memory:16,files:8,items:32});
const root = process.cwd();
const mode = process.argv[2] || 'build';
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const output = path.join(root, 'output/image-delivery');
const publicOutput = path.join(root, 'public/images/chinese-delivery');
const rgba = async data => sharp(data).ensureAlpha().raw().toBuffer({resolveWithObject:true});

async function compare(original, encoded) {
  const a = await rgba(original), b = await rgba(encoded);
  if(a.info.width !== b.info.width || a.info.height !== b.info.height) throw new Error('Geometry changed');
  let error = 0, visible = 0, maxAlphaError = 0;
  for(let i = 0; i < a.data.length; i += 4) {
    maxAlphaError = Math.max(maxAlphaError, Math.abs(a.data[i+3] - b.data[i+3]));
    if(!a.data[i+3]) continue;
    for(let c=0;c<3;c++) { error += (a.data[i+c] - b.data[i+c]) ** 2; visible++; }
  }
  const rms = Math.sqrt(error / visible);
  return {maxAlphaError, visibleRgbRms:rms, visibleRgbPsnr:rms ? 20*Math.log10(255/rms) : null};
}

async function sample() {
  const samples = [
    ['cn-01-atlas-v3.webp', {left:265,top:170,width:256,height:256}],
    ['cn-21-atlas-v3.webp', {left:235,top:440,width:256,height:256}],
    ['cn-15-flower-states-v3.webp', {left:555,top:510,width:256,height:256}],
  ];
  const results=[];
  for(const [name, crop] of samples) {
    const original = await fs.readFile(path.join(root,'public/images/chinese-polished',name));
    const metadata = await sharp(original).metadata();
    const comparisons=[];
    const cells=[];
    const cropView=async data=>sharp(data).extract(crop).flatten({background:'#f7f5ea'}).resize(512,512,{kernel:'nearest'}).png().toBuffer();
    cells.push({input:await cropView(original),left:0,top:0});
    for(const quality of [86,90,94]) {
      const encoded = await sharp(original).webp({quality,alphaQuality:100,effort:6,smartSubsample:true}).toBuffer();
      await fs.writeFile(path.join(output,`${name}-q${quality}.webp`),encoded);
      comparisons.push({quality,bytes:encoded.length,ratio:encoded.length/original.length,...await compare(original,encoded)});
      cells.push({input:await cropView(encoded),left:cells.length*512,top:0});
    }
    const sheet=await sharp({create:{width:2048,height:512,channels:3,background:'#f7f5ea'}}).composite(cells).png().toBuffer();
    await fs.writeFile(path.join(output,`${name}-comparison.png`),sheet);
    results.push({file:name,width:metadata.width,height:metadata.height,alpha:metadata.hasAlpha,sourceBytes:original.length,panels:['source','quality86','quality90','quality94'],comparisons});
  }
  await fs.writeFile(path.join(output,'sample-report.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results));
}

async function sourceFiles() {
  const folders=['chinese-polished','chinese-precision','chinese-scenes','kingfisher'];
  const sources=[];
  for(const folder of folders) {
    const base=path.join(root,'public/images',folder);
    for(const name of (await fs.readdir(base)).sort()) if(/\.(webp|png)$/i.test(name)) sources.push(`images/${folder}/${name}`);
  }
  sources.push('images/golden-meadow/meadow-landscape-v1.png');
  sources.push('images/old-house/old-house-landscape-v1.webp','images/old-house/old-house-landscape-v1.png');
  return sources;
}

async function build() {
  const sources=await sourceFiles();
  const mapping={},verification=[];
  const manifest=path.join(root,'src/data/chineseImageDelivery.json');
  async function persist() {
    const next=`${manifest}.next`;
    await fs.writeFile(next,JSON.stringify(mapping,null,2)+'\n');
    await fs.rename(next,manifest);
  }
  async function encode(file, original, stem, frame) {
    const source=frame?await sharp(original).extract(frame.crop).png().toBuffer():original;
    const meta=await sharp(source).metadata();
    const quality=meta.hasAlpha?94:90;
    const options={quality,alphaQuality:100,effort:6,smartSubsample:true};
    const full=await sharp(source).webp(options).toBuffer();
    const preview=await sharp(source).resize({width:192,height:192,fit:'inside',withoutEnlargement:true}).webp({quality:60,alphaQuality:100,effort:5}).toBuffer();
    const fullName=`${stem}-${digest(full).slice(0,12)}.webp`;
    const previewName=`${stem}-${digest(preview).slice(0,12)}-preview.webp`;
    await fs.writeFile(path.join(publicOutput,fullName),full);
    await fs.writeFile(path.join(publicOutput,previewName),preview);
    const comparison=await compare(source,full);
    if(comparison.maxAlphaError!==0) throw new Error(`Alpha changed: ${file}`);
    mapping[file]={full:`images/chinese-delivery/${fullName}`,preview:`images/chinese-delivery/${previewName}`,width:meta.width,height:meta.height,alpha:Boolean(meta.hasAlpha),sourceBytes:original.length,fullBytes:full.length,previewBytes:preview.length};
    verification.push({source:file,sourceSha256:digest(original),fullSha256:digest(full),previewSha256:digest(preview),quality,...comparison,...(frame?{parent:frame.parent,crop:frame.crop}: {})});
    await persist();
    console.log(JSON.stringify({source:file,sourceBytes:original.length,fullBytes:full.length,previewBytes:preview.length,alpha:Boolean(meta.hasAlpha),...comparison}));
  }
  for(const file of sources) {
    const original=await fs.readFile(path.join(root,'public',file));
    const meta=await sharp(original).metadata();
    const stem=path.basename(file,path.extname(file));
    await encode(file,original,stem);
    const split=/-atlas-v[34]\.webp$/.test(file)||/chinese-scenes\/.*-atlas\.webp$/.test(file)||file==='images/chinese-scenes/cn-23-context.webp';
    const single=/-sculpture-atlas-v3\.webp$/.test(file)||/-saved-atlas-v3\.webp$/.test(file);
    if(split&&!single) {
      const columns=2,rows=Math.round(3*meta.height/meta.width);
      for(let index=0;index<columns*rows;index++) {
        const column=index%columns,row=Math.floor(index/columns);
        const left=Math.floor(column*meta.width/columns),top=Math.floor(row*meta.height/rows);
        const right=Math.floor((column+1)*meta.width/columns),bottom=Math.floor((row+1)*meta.height/rows);
        await encode(`${file}#frame=${index}`,original,`${stem}-frame-${index}`,{parent:file,crop:{left,top,width:right-left,height:bottom-top}});
      }
    }
  }
  const report={generatedOn:'2026-10-05',mode:'deterministic lossy delivery encoding; original lossless and legacy sources retained',fullImageGeometry:'parent copies unchanged; frame copies use integer source-pixel grid cells, no resizing',fullAlpha:'exactly preserved',opaqueQuality:90,transparentQuality:94,previewMaxEdge:192,assets:verification};
  await fs.writeFile(path.join(root,'docs/CHINESE_IMAGE_DELIVERY_VERIFICATION.json'),JSON.stringify(report,null,2)+'\n');
  const all=Object.entries(mapping),entries=all.filter(([file])=>!file.includes('#frame=')),frames=all.filter(([file])=>file.includes('#frame=')),polished=entries.filter(([file])=>file.includes('/chinese-polished/'));
  const sum=values=>values.reduce((total,[,item])=>({count:total.count+1,sourceBytes:total.sourceBytes+item.sourceBytes,fullBytes:total.fullBytes+item.fullBytes,previewBytes:total.previewBytes+item.previewBytes}),{count:0,sourceBytes:0,fullBytes:0,previewBytes:0});
  const frameTotals=frames.reduce((total,[,item])=>({count:total.count+1,fullBytes:total.fullBytes+item.fullBytes,previewBytes:total.previewBytes+item.previewBytes}),{count:0,fullBytes:0,previewBytes:0});
  console.log(JSON.stringify({complete:true,total:sum(entries),polished:sum(polished),frames:frameTotals}));
}

(async()=>{await fs.mkdir(output,{recursive:true}); await fs.mkdir(publicOutput,{recursive:true}); if(mode==='sample') await sample(); else if(mode==='build') await build(); else throw new Error('Use sample or build');})().catch(error=>{console.error(error);process.exitCode=1;});
