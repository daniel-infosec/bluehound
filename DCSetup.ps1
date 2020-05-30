# Replace 'WebApp01' and 'contoso.com' with your own gMSA and domain names, respectively

# To install the AD module on Windows Server, run Install-WindowsFeature RSAT-AD-PowerShell
# To install the AD module on Windows 10 version 1809 or later, run Add-WindowsCapability -Online -Name 'Rsat.ActiveDirectory.DS-LDS.Tools~~~~0.0.1.0'
# To install the AD module on older versions of Windows 10, see https://aka.ms/rsat

if(Get-KdsRootKey -eq $null or Get-KdsRootKey.Length -eq 0) {
	Write-Host "Please ensure a KDS root key has been created before running this script."
	Write-Host "https://docs.microsoft.com/en-us/virtualization/windowscontainers/manage-containers/manage-serviceaccounts#one-time-preparation-of-active-directory"
	exit
}

$serverHostName = "<Replace me with the correct hostname>"

if($serverHostName -eq "<Replace me with the correct hostname>") {
	Write-Host "Please update the DCSetup script with the correct hostname of the server where the docker containers will run on"
	exit
}

# Create the security group
New-ADGroup -Name "bloodhoundhost" -SamAccountName "bloodhoundhost" -GroupScope DomainLocal

# Create the gMSA
New-ADServiceAccount -Name "bloodhound01" -DnsHostName "bloodhound01.bluehound.local" -ServicePrincipalNames "host/bloodhound01", "host/bloodhound01.bluehound.local" -PrincipalsAllowedToRetrieveManagedPassword "bloodhoundhost"

# Add your container hosts to the security group
Add-ADGroupMember -Identity "bloodhoundhost" -Members $serverHostName + "$"