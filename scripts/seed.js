const { initDatabase, pool } = require('../src/database/database');
const productModel = require('../src/models/productModel');
const imageModel = require('../src/models/imageModel');
const productService = require('../src/services/productService');
const config = require('../src/config/config');

const products = [
  ['Notebook Aurora','Notebook leve para estudo e produtividade, com tela de alta definição.',4299.90],
  ['Fone Horizonte','Fone sem fio com cancelamento de ruído e estojo de carregamento.',599.90],
  ['Câmera Prisma','Câmera compacta para fotos e vídeos em alta resolução.',2899.00],
  ['Teclado Vale','Teclado mecânico silencioso com iluminação ajustável.',449.90],
  ['Mouse Brisa','Mouse ergonômico sem fio para uso prolongado.',229.90],
  ['Monitor Mirante','Monitor de 27 polegadas com painel IPS e cores precisas.',1599.00],
  ['Caixa Sonora Maré','Caixa de som portátil resistente à água.',389.90],
  ['Relógio Trilha','Relógio inteligente com monitoramento de atividades.',899.90],
  ['Luminária Lume','Luminária de mesa com temperatura de cor regulável.',179.90],
  ['Mochila Rota','Mochila impermeável com compartimento para notebook.',319.90]
];
const colors=['#174d3b','#31476a','#773d54','#284b63','#5b4a75','#3e6247','#8a4f3d','#264653','#6d597a','#344e41'];
function svg(title,number,color){const safe=title.replace(/[<>&"']/g,'');return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="${color}"/><circle cx="940" cy="130" r="300" fill="#e7a735"/><text x="80" y="110" fill="#e7a735" font-family="Arial" font-size="28" font-weight="700">GRUPO C · CATÁLOGO</text><text x="80" y="410" fill="white" font-family="Arial" font-size="78" font-weight="700">${safe}</text><text x="84" y="480" fill="white" opacity=".75" font-family="Arial" font-size="34">Imagem demonstrativa ${number}</text></svg>`)}

async function main(){if(!config.postgres.user)throw new Error('PGUSER não foi definido no arquivo .env.');await initDatabase();console.log('Preparando 10 produtos com 3 imagens cada...');for(let i=0;i<products.length;i+=1){const [name,description,price]=products[i];let product=await productModel.findByName(name);if(!product){product=await productService.createProduct({name,description,price:price.toFixed(2)});console.log(`Produto criado: ${name}`)}const count=await imageModel.countByProduct(product.id);const missing=Math.max(0,3-count);if(missing){const files=Array.from({length:missing},(_,offset)=>{const number=count+offset+1;return{buffer:svg(name,number,colors[i]),originalname:`produto-${i+1}-${number}.svg`,mimetype:'image/svg+xml'}});await productService.uploadImages(product.id,files,count===0);console.log(`${missing} imagem(ns) enviada(s): ${name}`)}}console.log('Demonstração pronta.');await pool.end()}
main().catch(async(error)=>{console.error('Falha ao preparar demonstração:',error.message);await pool.end().catch(()=>{});process.exitCode=1});
