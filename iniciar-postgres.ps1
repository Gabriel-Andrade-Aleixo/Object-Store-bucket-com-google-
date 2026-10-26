$ErrorActionPreference = 'Stop'

$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$dataDirectory = 'C:\Program Files\PostgreSQL\18\data'
$ready = Join-Path $pgBin 'pg_isready.exe'
$pgCtl = Join-Path $pgBin 'pg_ctl.exe'

if (-not (Test-Path -LiteralPath $ready) -or -not (Test-Path -LiteralPath $pgCtl)) {
    throw 'PostgreSQL 18 não foi encontrado em C:\Program Files\PostgreSQL\18.'
}

& $ready -h localhost -p 5432 *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host 'PostgreSQL já está ativo em localhost:5432.'
    return
}

Write-Host 'PostgreSQL está parado. Iniciando pelo pg_ctl...'
$logFile = Join-Path $env:TEMP 'postgresql-object-store-start.log'
& $pgCtl start -D $dataDirectory -l $logFile -w

if ($LASTEXITCODE -ne 0) {
    if (Test-Path -LiteralPath $logFile) {
        Get-Content -LiteralPath $logFile -Tail 30
    }
    throw 'Não foi possível iniciar o PostgreSQL. Feche outro programa que esteja usando a porta 5432 e tente novamente.'
}

& $ready -h localhost -p 5432
if ($LASTEXITCODE -ne 0) {
    throw 'O PostgreSQL foi iniciado, mas ainda não responde em localhost:5432.'
}
