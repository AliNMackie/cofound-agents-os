# Add new RSS sources to Sentinel Growth
$baseUrl = "https://sentinel-growth-1005792944830.europe-west2.run.app/sources"

$sources = @(
    @{
        name = "CVA UK"
        url  = "https://news.google.com/rss/search?q=CVA+UK+after:2024-12-15&hl=en-GB&gl=GB&ceid=GB:en"
    },
    @{
        name = "Administration UK"
        url  = "https://news.google.com/rss/search?q=administration+UK+company+after:2024-12-15&hl=en-GB&gl=GB&ceid=GB:en"
    },
    @{
        name = "Private Equity UK"
        url  = "https://news.google.com/rss/search?q=private+equity+UK+exit+after:2024-12-15&hl=en-GB&gl=GB&ceid=GB:en"
    },
    @{
        name = "Restructuring UK"
        url  = "https://news.google.com/rss/search?q=restructuring+UK+company+after:2024-12-15&hl=en-GB&gl=GB&ceid=GB:en"
    },
    @{
        name = "Distressed Debt UK"
        url  = "https://news.google.com/rss/search?q=distressed+debt+UK+after:2024-12-15&hl=en-GB&gl=GB&ceid=GB:en"
    },
    @{
        name = "M&A UK"
        url  = "https://news.google.com/rss/search?q=acquisition+merger+UK+after:2024-12-15&hl=en-GB&gl=GB&ceid=GB:en"
    }
)

foreach ($source in $sources) {
    $body = @{
        name   = $source.name
        url    = $source.url
        type   = "RSS"
        active = $true
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

Write-Host "`nDone! Triggering sweep..."
Invoke-RestMethod -Uri "https://sentinel-growth-1005792944830.europe-west2.run.app/tasks/sweep" -Method POST -Headers @{"Content-Length" = "0" }
Write-Host "Sweep started!"
