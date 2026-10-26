param([switch]$Seed,[switch]$VerificarBucket)
$ErrorActionPreference='Stop';Set-Location -LiteralPath $PSScriptRoot
$credencial=Join-Path $PSScriptRoot 'sa-grupo-c-key.json';if(-not(Test-Path -LiteralPath $credencial)){throw "Credencial não encontrada: $credencial"}
$env:GOOGLE_APPLICATION_CREDENTIALS=$credencial;$env:BUCKET_NAME='fatec-2026-grupo-c'
if(-not $env:PGHOST){$env:PGHOST='localhost'};if(-not $env:PGPORT){$env:PGPORT='5432'};if(-not $env:PGDATABASE){$env:PGDATABASE='mensageria_object_store'};if(-not $env:PGUSER){$env:PGUSER='postgres'}
$psql='C:\Program Files\PostgreSQL\18\bin\psql.exe'
if(-not $VerificarBucket -and (Test-Path -LiteralPath $psql)){
    & (Join-Path $PSScriptRoot 'iniciar-postgres.ps1')
    & $psql -w -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d postgres -tAc 'SELECT 1' *> $null
    if($LASTEXITCODE -ne 0){
        $secure=Read-Host 'Senha local do usuário postgres' -AsSecureString
        $env:PGPASSWORD=[System.Net.NetworkCredential]::new('', $secure).Password
    }
}
if(-not(Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules'))){Write-Host 'Instalando dependências...';& npm.cmd install;if($LASTEXITCODE -ne 0){throw 'Falha ao instalar dependências.'}}
if($Seed){& npm.cmd run seed}elseif($VerificarBucket){& npm.cmd run bucket:check}else{& npm.cmd start};if($LASTEXITCODE -ne 0){throw 'Falha ao executar a aplicação.'}
