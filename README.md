# Projeto Object Store - Grupo C

Aplicação de e-commerce em JavaScript/Node.js. Produtos e metadados das imagens ficam no PostgreSQL local; somente os arquivos de imagem ficam no bucket público `fatec-2026-grupo-c`.

## Recursos recebidos para o grupo C

- projeto Google Cloud: `serjava-demo`;
- bucket: `fatec-2026-grupo-c`;
- URL pública: `https://storage.googleapis.com/fatec-2026-grupo-c/`;
- localização e classe: `us-central1`, `STANDARD`;
- conta de serviço: `sa-grupo-c@serjava-demo.iam.gserviceaccount.com`;
- papel: `roles/storage.objectAdmin`, limitado à leitura, escrita e exclusão de objetos.

## Arquitetura

```text
src/
  routes/       URLs da aplicação
  controllers/  entrada e resposta HTTP
  services/     regras de negócio e Google Cloud Storage
  models/       consultas PostgreSQL
  database/     conexão e criação das tabelas
  views/        telas EJS
```

Fluxo: `Navegador -> Route -> Controller -> Service -> Model/PostgreSQL`, com o service enviando os arquivos ao Google Cloud Storage.

## Funcionalidades

- cadastro de produto com nome, descrição e preço;
- várias imagens por produto e definição da capa;
- catálogo com miniatura pública;
- detalhe com galeria;
- upload, listagem de objetos, download e exclusão pela aplicação;
- carga idempotente com 10 produtos e 3 imagens por produto.

## Primeira execução no PowerShell

1. Inicie o serviço PostgreSQL 18 no Windows.
2. Na pasta do projeto, crie o banco:

```powershell
.\configurar-banco.ps1
```

Se o serviço do Windows estiver parado, o script tentará iniciar o PostgreSQL diretamente pelo `pg_ctl`.

3. Se a autenticação salva não funcionar, o script solicitará a senha do usuário `postgres` de forma oculta. Ela será usada somente no processo atual. Você também pode defini-la previamente na sessão:

```powershell
$env:PGPASSWORD='sua_senha_local'
```

Os scripts e a aplicação também carregam automaticamente o arquivo `.env`. Assim, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGHOST` e `PGPORT` podem ser configurados apenas nesse arquivo local, que está ignorado pelo Git.

4. Inicie a aplicação:

```powershell
.\executar.ps1
```

5. Abra `http://localhost:8080`.

As tabelas são criadas automaticamente pela aplicação dentro de `mensageria_object_store`.

## Demonstração exigida

```powershell
.\executar.ps1 -Seed
.\executar.ps1
```

O primeiro comando cria 10 produtos e envia 3 SVGs para cada um. Pode ser repetido sem duplicar os produtos.

## Diagnóstico e testes

```powershell
.\executar.ps1 -VerificarBucket
npm test
```

## Segurança

`sa-grupo-c-key.json`, `.env` e credenciais são ignorados pelo Git. Não publique a chave nem a senha do PostgreSQL.
