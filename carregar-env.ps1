param([string]$Path)

if (-not (Test-Path -LiteralPath $Path)) {
    return
}

foreach ($line in Get-Content -LiteralPath $Path) {
    $text = $line.Trim()
    if (-not $text -or $text.StartsWith('#')) {
        continue
    }

    $separator = $text.IndexOf('=')
    if ($separator -le 0) {
        continue
    }

    $name = $text.Substring(0, $separator).Trim()
    $value = $text.Substring($separator + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
        ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
    }

    if ($name -match '^[A-Za-z_][A-Za-z0-9_]*$' -and -not [Environment]::GetEnvironmentVariable($name, 'Process')) {
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}
