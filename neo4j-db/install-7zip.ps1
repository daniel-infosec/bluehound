$7Zip = $true;
$WebClient = New-Object -TypeName System.Net.WebClient;
$7ZipUrl = "http://downloads.sourceforge.net/sevenzip/7z920-x64.msi";
$7ZipInstaller = "$env:TEMP\7z920-x64.msi";
 
 
try {
 
$7ZipPath = Resolve-Path -Path ((Get-Item -Path HKLM:\SOFTWARE\7-Zip -ErrorAction SilentlyContinue).GetValue("Path") + "\7z.exe");
if (!$7ZipPath) {
$7Zip = $false;
}
}
catch {
$7Zip = $false;
}
 
 
 
if (!$7Zip) {
	$WebClient.DownloadFile($7ZipUrl,$7ZipInstaller);
	Start-Process -Wait -FilePath $7ZipInstaller;
	Remove-Item -Path $7ZipInstaller -Force -ErrorAction SilentlyContinue;
}
else
{
   Write-Warning "7 Zip already installed"
}