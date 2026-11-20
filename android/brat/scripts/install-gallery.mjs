import {copyFile,readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const javaDir=resolve(root,'android/app/src/main/java/site/lxwis/brat');
await mkdir(javaDir,{recursive:true});
await copyFile(resolve(root,'native/BratGalleryPlugin.java'),resolve(javaDir,'BratGalleryPlugin.java'));
const activity=resolve(javaDir,'MainActivity.java');
let code=await readFile(activity,'utf8');
if(!code.includes('registerPlugin(BratGalleryPlugin.class)')){
 code=code.replace(/public class MainActivity extends BridgeActivity\s*\{/,match=>match+'\n  @Override public void onCreate(android.os.Bundle savedInstanceState) {\n    registerPlugin(BratGalleryPlugin.class);\n    super.onCreate(savedInstanceState);\n  }');
}
if(!code.includes('registerPlugin(BratGalleryPlugin.class)'))throw new Error('Could not register gallery plugin');
await writeFile(activity,code);
console.log('BRAT gallery plugin installed');
