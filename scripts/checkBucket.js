const storageService=require('../src/services/storageService');
async function main(){const info=storageService.getBucketInfo();const objects=await storageService.listObjects();console.log(`Bucket: ${info.name}`);console.log(`Localização: ${info.location}`);console.log(`Classe: ${info.storageClass}`);console.log('Autenticação e listagem de objetos confirmadas.');console.log(`Objetos em produtos/: ${objects.length}`);objects.slice(0,5).forEach((item)=>console.log(`- ${item.name}`))}
main().catch((error)=>{console.error('Falha ao consultar o bucket:',error.message);process.exitCode=1});
