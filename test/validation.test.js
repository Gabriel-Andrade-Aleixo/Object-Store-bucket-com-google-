const test=require('node:test');const assert=require('node:assert/strict');const {parsePrice,normalizeProductName}=require('../src/services/productService');const {safeFileName}=require('../src/services/storageService');
test('normaliza preço brasileiro',()=>{assert.equal(parsePrice('199,90'),'199.90');assert.equal(parsePrice('10'),'10.00')});
test('rejeita preço inválido',()=>{assert.throws(()=>parsePrice('12,999'))});
test('normaliza nome de arquivo',()=>{assert.equal(safeFileName('Foto Número 1.PNG'),'foto-numero-1.png')});
test('padroniza nome do produto em formato de título',()=>{assert.equal(normalizeProductName('  BONECO   PANO 3d CHAPÉU  '),'Boneco Pano 3D Chapéu');assert.equal(normalizeProductName('câmera de ação com wi-fi'),'Câmera de Ação com Wi-Fi')});
