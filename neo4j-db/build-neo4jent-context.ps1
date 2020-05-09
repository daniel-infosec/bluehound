[CmdletBinding()]
Param
(
[parameter(Mandatory=$false)]
  [Switch]$Force
) 

$tempDir = "$($PSScriptRoot)\temp"
If (-not (Test-Path -Path $tempDir)) { New-Item -Path $tempDir -ItemType 'Directory' | Out-Null } 

# Grab Neo4j Enterprise ZIP
$neo4jEnt = "$($tempDir)\neo4j.zip"
if (-not (Test-Path -Path $neo4jEnt)) {
  Write-Host "Downloading Neo4j Enterprise..."
  Invoke-WebRequest -Uri 'http://neo4j.com/artifact.php?name=neo4j-enterprise-3.0.6-windows.zip' -OutFile $neo4jEnt
}

# Extract Neo4j Enterprise ZIP
$neo4jEntSourceDir = "$($tempDir)\neo4j"
if (-not (Test-Path -Path $neo4jEntSourceDir)) {
  $tempExtractDir = "$($tempDir)\neo4jtemp"
  if (Test-Path -Path $tempExtractDir) { Remove-Item -Path $tempExtractDir -Recurse -Confirm:$false -Force | Out-Null }
  & 7z x "`"-o$tempExtractDir`"" $neo4jEnt
  Move-Item -Path (Get-ChildItem -Path $tempExtractDir | Select -First 1).Fullname -Destination $neo4jEntSourceDir -Force -Confirm:$false | Out-Null 
  # Cleanup
  if (Test-Path -Path $tempExtractDir) { Remove-Item -Path $tempExtractDir -Recurse -Confirm:$false -Force | Out-Null }
}

# Generate Docker Context files
$contextDir = "$($PSScriptRoot)\context"
# If -Force is set, remove current content directory
if ($Force) {
  If (Test-Path -Path $contextDir) { Remove-Item -path $contextDir -Recurse -Force -Confirm:$false | Out-Null }
  New-Item -Path $contextDir -ItemType Directory | Out-Null
}

# Copy the Neo4j and Java files
if (-not (Test-Path -Path "$($contextDir)\neo4j")) {
  # Copy Neo4j
  & robocopy /s /e /w:1 /r:1 /copy:dat "`"$($neo4jEntSourceDir)`"" "`"$($contextDir)\neo4j`""

  # Copy extra source files
  Copy-Item -Path "$($PSScriptRoot)\docker-entrypoint.ps1" -Destination "$($contextDir)\neo4j" -Force -Confirm:$false

  # Copy DockerFile
  Copy-Item -Path "$($PSScriptRoot)\DockerFile" -Destination "$($contextDir)\DockerFile" -Force -Confirm:$false
}
