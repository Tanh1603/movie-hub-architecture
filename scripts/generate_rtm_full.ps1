$root = "docs/functional_specs"
$outFile = "docs/architecture/RTM_FULL.md"
$files = Get-ChildItem -Path $root -Recurse -Filter *.md | Sort-Object @{ Expression = { $_.Directory.Name } }, @{ Expression = { $_.Name } }

# Read template header (first 6 lines match sample) - reuse header from RTM.md
$template = Get-Content -Path "docs/architecture/RTM.md" -Raw -ErrorAction SilentlyContinue
# Extract header up to the table header row (the line that starts with '| No')
$headerLines = @()
if ($template) {
    $lines = $template -split "`n"
    foreach ($line in $lines) {
        $headerLines += $line
        if ($line -match '^\| No\s*\| Req ID') { break }
    }
} else {
    # fallback minimal header
    $headerLines = @(
"| No | Req ID | Req Desc | TC ID | TC Desc | Test Design | Test Designer | UAT Test Req? | Test Execution | Test Env | UAT Env | Prod Env | Defects? | Defect ID | Defect Status | Req Coverage Status |",
"| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
)
}

# Start building rows
$rows = @()
$index = 1

# Track per-usecase TC counter
$tcCounters = @{}

# helper to generate TC id
function Get-TCId($usecase) {
    if (-not $tcCounters.ContainsKey($usecase)) { $tcCounters[$usecase] = 1 }
    $num = $tcCounters[$usecase]
    $tcCounters[$usecase] = $num + 1
    return "TC-$usecase-{0:D2}" -f $num
}

foreach ($f in $files) {
    $text = Get-Content -Path $f.FullName -Raw -ErrorAction SilentlyContinue
    if ($null -eq $text) { continue }
    if ($text -notmatch '## 4. Business Rules') { continue }
    # Extract usecase id from title or filename
    $usecase = ""
    if ($text -match '^#\s*\[(.*?)\]' ) { $usecase = $matches[1] }
    if (-not $usecase) {
        # fallback: filename prefix before underscore
        $usecase = ($f.BaseName -split '_')[0]
    }
    # module is folder name
    $module = $f.Directory.Name
    # find business rule table rows
    $lines = $text -split "`n"
    $inTable = $false
    foreach ($line in $lines) {
        if ($line -match '^\|\s*Activity Step\s*\|\s*Rule ID\s*\|') { $inTable = $true; continue }
        if (-not $inTable) { continue }
        if ($line.Trim() -eq '') { break }
        if ($line -match '^\|') {
            # match BR row
            # regex to capture activity step, BR id, description
            if ($line -match '^\|\s*(.*?)\s*\|\s*(BR[0-9]{1,3})\s*\|\s*(.*?)\s*\|') {
                $activity = $matches[1].Trim()
                $brid = $matches[2].Trim()
                $desc = $matches[3].Trim()
                # prepare TC id
                $tcId = Get-TCId $usecase
                # craft TC Desc
                $tcDesc = ''
                if ($desc -match 'HTTP\s*401|401') {
                    $tcDesc = "Verify that requests missing or with invalid tokens are rejected with HTTP 401 as per $brid."
                } elseif ($desc -match 'HTTP\s*400|400') {
                    $tcDesc = "Verify that invalid input is rejected with HTTP 400 as per $brid."
                } elseif ($desc -match 'soft-?delet') {
                    $tcDesc = "Verify that promotions used in completed bookings are deactivated (soft-deleted) and not removed permanently as per $brid."
                } elseif ($desc -match 'unique|uniqu') {
                    $tcDesc = "Verify that duplicate values are rejected and uniqueness is enforced as per $brid."
                } elseif ($desc -match 'must include|include') {
                    $tcDesc = "Verify that response payload includes required fields as specified by $brid."
                } else {
                    $tcDesc = "Verify that the system enforces: $desc"
                }
                # assemble row with defaults
                $row = "| $index | $brid | $desc | $tcId | $tcDesc | Manual | QA Team | Yes | Not Run | Not Run | Not Run | Not Run | None | N/A | N/A | Planned |"
                $rows += $row
                $index++
            }
        }
    }
}

# write output
$headerText = ($headerLines -join "`n")
$content = $headerText + "`n" + ($rows -join "`n") + "`n"
Set-Content -Path $outFile -Value $content -Encoding utf8
Write-Host "Generated $outFile with $($rows.Count) rows."
