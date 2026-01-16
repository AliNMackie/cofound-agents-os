# Add The Gazette RSS sources
$baseUrl = "https://sentinel-growth-1005792944830.europe-west2.run.app/sources"

$sources = @(
    @{
        name   = "The Gazette (Insolvency Notices)"
        url    = "https://www.thegazette.co.uk/insolvency/data.feed"
        type   = "RSS"
        active = $true
    },
    @{
        name   = "The Gazette (Corporate Insolvency)"
        url    = "https://www.thegazette.co.uk/notice/data.feed?categorycode=G105000000"
        type   = "RSS"
        active = $true
    }
)

foreach ($source in $sources) {
    $body = @{
        name   = $source.name
        url    = $source.url
        type   = $source.type
        active = $source.active
    } | ConvertTo-Json

    Write-Host "Adding source: $($source.name)"
    try {
        Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body
        Write-Host "  ✅ Added successfully"
    }
    catch {
        Write-Host "  ⚠️ Error: $($_.Exception.Message)"
    }
}

Write-Host "`nDone!"
