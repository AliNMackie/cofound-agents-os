<#
.SYNOPSIS
    Invokes Google Vision API for OCR (Text Detection) using a secure API key from environment variables.

.DESCRIPTION
    This script reads an image file, encodes it to base64, and sends it to the Google Vision API
    for text detection. It requires the GOOGLE_API_KEY environment variable to be set.

.PARAMETER ImagePath
    The path to the image file to process.

.EXAMPLE
    .\Invoke-GoogleVisionOCR.ps1 -ImagePath "C:\path\to\document.png"
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$ImagePath
)

# 1. Securely retrieve API Key from Environment Variable
$apiKey = $env:GOOGLE_API_KEY

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Error "CRITICAL SECURITY WARNING: GOOGLE_API_KEY environment variable is not set."
    Write-Warning "Please set the environment variable securely: `$env:GOOGLE_API_KEY = 'your-key'"
    exit 1
}

# 2. Validate Image Path
if (-not (Test-Path $ImagePath)) {
    Write-Error "Image file not found: $ImagePath"
    exit 1
}

try {
    # 3. Prepare the Request Payload
    $imageBytes = [System.IO.File]::ReadAllBytes($ImagePath)
    $base64Image = [Convert]::ToBase64String($imageBytes)

    $body = @{
        requests = @(
            @{
                image = @{
                    content = $base64Image
                }
                features = @(
                    @{
                        type = "TEXT_DETECTION"
                    }
                )
            }
        )
    } | ConvertTo-Json -Depth 5

    # 4. Define API Endpoint (using the key from env var)
    $uri = "https://vision.googleapis.com/v1/images:annotate?key=$apiKey"

    # 5. Execute Request
    Write-Host "Sending request to Google Vision API..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $body -ContentType "application/json"

    # 6. Process Response
    $textAnnotations = $response.responses[0].textAnnotations
    
    if ($textAnnotations) {
        $fullText = $textAnnotations[0].description
        Write-Host "OCR Success! Detected Text:" -ForegroundColor Green
        Write-Host "----------------------------------------"
        Write-Host $fullText
        Write-Host "----------------------------------------"
        return $fullText
    } else {
        Write-Warning "No text detected in the image."
        return $null
    }

} catch {
    Write-Error "API Request Failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Error "API Error Details: $($reader.ReadToEnd())"
    }
    exit 1
}
