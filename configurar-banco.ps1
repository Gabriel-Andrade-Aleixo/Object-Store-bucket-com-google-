param(
    [string]$Database,
    [string]$Server,
    [int]$Port
)
$ErrorActionPreference='Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $projectRoot 'carregar-env.ps1') -Path (Join-Path $projectRoot '.env')

if (-not $Database) { $Database = if ($env:PGDATABASE) { $env:PGDATABASE } else { 'mensageria_object_store' } }
$User = $env:PGUSER
if (-not $User) { throw 'PGUSER não foi definido. Configure o usuário do seu PostgreSQL no arquivo .env.' }
if (-not $Server) { $Server = if ($env:PGHOST) { $env:PGHOST } else { 'localhost' } }
if (-not $Port) { $Port = if ($env:PGPORT) { [int]$env:PGPORT } else { 5432 } }
if ($Database -notmatch '^[a-zA-Z][a-zA-Z0-9_]*$') { throw 'Nome de banco inválido.' }

& (Join-Path $projectRoot 'iniciar-postgres.ps1')
$pgBin='C:\Program Files\PostgreSQL\18\bin'
$ready=Join-Path $pgBin 'pg_isready.exe';$psql=Join-Path $pgBin 'psql.exe';$createdb=Join-Path $pgBin 'createdb.exe'
if (-not (Test-Path -LiteralPath $psql)) { throw 'PostgreSQL 18 não encontrado.' }
$exists=& $psql -w -h $Server -p $Port -U $User -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$Database'" 2>$null
if ($LASTEXITCODE -ne 0) {
    $secure=Read-Host "Senha local do usuário $User" -AsSecureString
    $env:PGPASSWORD=[System.Net.NetworkCredential]::new('', $secure).Password
    $exists=& $psql -w -h $Server -p $Port -U $User -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$Database'"
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível autenticar no PostgreSQL com a senha informada.' }
}
$existsValue = if ($null -eq $exists) { '' } else { ([string]$exists).Trim() }
if ($existsValue -ne '1') { & $createdb -h $Server -p $Port -U $User $Database; if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o banco.' }; Write-Host "Banco criado: $Database" } else { Write-Host "Banco já existe: $Database" }
