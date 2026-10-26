param(
    [string]$Database = 'mensageria_object_store',
    [string]$User = 'postgres',
    [string]$Server = 'localhost',
    [int]$Port = 5432
)
$ErrorActionPreference='Stop'
if ($Database -notmatch '^[a-zA-Z][a-zA-Z0-9_]*$') { throw 'Nome de banco inválido.' }
$pgBin='C:\Program Files\PostgreSQL\18\bin'
$ready=Join-Path $pgBin 'pg_isready.exe';$psql=Join-Path $pgBin 'psql.exe';$createdb=Join-Path $pgBin 'createdb.exe'
if (-not (Test-Path -LiteralPath $psql)) { throw 'PostgreSQL 18 não encontrado.' }
& $ready -h $Server -p $Port
if ($LASTEXITCODE -ne 0) { throw 'O PostgreSQL não está ativo na porta 5432. Inicie o serviço e tente novamente.' }
$exists=& $psql -w -h $Server -p $Port -U $User -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$Database'" 2>$null
if ($LASTEXITCODE -ne 0) {
    $secure=Read-Host 'Senha local do usuário postgres' -AsSecureString
    $env:PGPASSWORD=[System.Net.NetworkCredential]::new('', $secure).Password
    $exists=& $psql -w -h $Server -p $Port -U $User -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$Database'"
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível autenticar no PostgreSQL com a senha informada.' }
}
if ($exists.Trim() -ne '1') { & $createdb -h $Server -p $Port -U $User $Database; if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o banco.' }; Write-Host "Banco criado: $Database" } else { Write-Host "Banco já existe: $Database" }
