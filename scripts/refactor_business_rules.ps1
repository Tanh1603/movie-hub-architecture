$root = "docs/functional_specs"
$files = Get-ChildItem -Path $root -Recurse -Filter *.md | Sort-Object @{ Expression = { $_.Directory.Name } }, @{ Expression = { $_.Name } }
$br = 1
$filesProcessed = 0
$filesUpdated = 0
$rulesUpdated = 0

foreach ($f in $files) {
    $text = Get-Content -Path $f.FullName -Raw -ErrorAction SilentlyContinue
    if ($null -eq $text) { continue }
    if ($text -notmatch '## 4. Business Rules') { continue }
    $filesProcessed++
    $lines = $text -split "`n"
    $out = @()
    $i = 0
    $changed = $false
    while ($i -lt $lines.Length) {
        $out += $lines[$i]
        if ($lines[$i] -match '^## 4\. Business Rules') {
            $i++
            while ($i -lt $lines.Length -and ($lines[$i] -notmatch '\| Activity Step \| Rule ID \|')) {
                $out += $lines[$i]
                $i++
            }
            if ($i -ge $lines.Length) { break }
            $out += $lines[$i]  # table header
            $i++
            if ($i -lt $lines.Length -and $lines[$i] -match '\| :---') { $out += $lines[$i]; $i++ }
            while ($i -lt $lines.Length -and $lines[$i].TrimStart().StartsWith('|')) {
                $row = $lines[$i]
                $parts = $row -split '\|'
                if ($parts.Length -ge 4) {
                    $activity = $parts[1].Trim()
                    $oldId = $parts[2].Trim()
                    $desc = $parts[3].Trim()
                    $newId = ('BR{0:D2}' -f $br)
                    $br++
                    $rulesUpdated++
                    if ($desc.ToUpper() -eq 'N/A' -or $desc.Trim().ToLower() -in @( 'n/a', 'standard read operation for a single concession item.', 'standard read operation for a single genre.', 'typically used for general review feeds or admin moderation.', 'general', 'dependency on the selected city.' )) {
                        $desc = "Business rule for activity ${activity}: behavior must follow the defined sequence and validations for this step."
                    }
                    $newRow = "| $activity | $newId | $desc |"
                    $out += $newRow
                    $changed = $true
                } else {
                    $out += $row
                }
                $i++
            }
            continue
        }
        $i++
    }
    if ($changed) {
        $outText = ($out -join "`n") + "`n"
        $outText | Out-File -FilePath $f.FullName -Encoding utf8
        $filesUpdated++
    }
}
Write-Host "Files scanned: $($files.Count)"
Write-Host "Files with Business Rules: $filesProcessed"
Write-Host "Files updated: $filesUpdated"
Write-Host "Rules updated: $rulesUpdated"
Write-Host "Final BR: BR{0:D2}" -f ($br-1)
