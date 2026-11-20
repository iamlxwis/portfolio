import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=resolve(fileURLToPath(new URL('..',import.meta.url)),'android/app/src/main/res');
const green='#8ACE00';
const svg=(transparent=false)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
${transparent?'':`<rect width="512" height="512" fill="${green}"/>`}
<text x="256" y="279" text-anchor="middle" dominant-baseline="middle" font-family="Arial,DejaVu Sans,sans-serif" font-size="153" font-weight="400" letter-spacing="-9" fill="#111111">brat</text></svg>`);
const densities={mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192};
for(const [density,size] of Object.entries(densities)){
 const dir=join(base,'mipmap-'+density);await mkdir(dir,{recursive:true});
 for(const name of ['ic_launcher','ic_launcher_round'])await sharp(svg()).resize(size,size).png().toFile(join(dir,name+'.png'));
 // Foreground is intentionally smaller inside 108dp adaptive icon bounds.
 const fg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
 <text x="256" y="275" text-anchor="middle" dominant-baseline="middle" font-family="Arial,DejaVu Sans,sans-serif" font-size="142" letter-spacing="-7" fill="#111111">brat</text></svg>`);
 await sharp(fg).resize(Math.round(size*108/48),Math.round(size*108/48)).png().toFile(join(dir,'ic_launcher_foreground.png'));
}
const colors=join(base,'values','brat_icon_colors.xml');await mkdir(join(base,'values'),{recursive:true});
await writeFile(colors,`<?xml version="1.0" encoding="utf-8"?><resources><color name="brat_icon_background">${green}</color></resources>\n`);
const any=join(base,'mipmap-anydpi-v26');await mkdir(any,{recursive:true});
for(const name of ['ic_launcher','ic_launcher_round']){
 await writeFile(join(any,name+'.xml'),`<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/brat_icon_background"/><foreground android:drawable="@mipmap/ic_launcher_foreground"/></adaptive-icon>\n`);
}
console.log('Classic green BRAT icons generated for all Android launcher densities');
