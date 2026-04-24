$port = 8080
$path = "c:\Users\USER\OneDrive\문서\T"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Listening on http://localhost:$port/"
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $reqPath = $request.Url.LocalPath
        if ($reqPath -eq "/") {
            $localPath = Join-Path $path "index.html"
        } else {
            $localPath = Join-Path $path $reqPath.Replace("/", "\").TrimStart("\")
        }
        
        if (Test-Path $localPath) {
            $ext = [System.IO.Path]::GetExtension($localPath)
            if ($ext -eq ".css") { $response.ContentType = "text/css" }
            elseif ($ext -eq ".js") { $response.ContentType = "application/javascript" }
            else { $response.ContentType = "text/html" }
            
            $buffer = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
