# Setup docker network
$profiles = get-netconnectionprofile -networkcategory DomainAuthenticated
$domainProfile = $null
$inList = $null
while($inList -eq $null) {
    write-host "The following domain profiles have been identified: "
    write-host ($profiles.InterfaceAlias -join "`r`n")
    $NIC = read-host "Please enter the name of the profile you would like Docker to use to setup a virtual NIC"
    $inList = $profiles | where-object {$_.InterfaceAlias -eq $NIC}
    if ($inList -eq $null) {
        write-host "You did not enter a valid NIC profile. Please check your spelling and try again."
    } else {
    	$domainProfile = $NIC
    }
}
docker network create -d transparent -o com.docker.network.windowsshim.interface="$domainProfile" BHNet

#Setup DNS in docker-compose
$dnsaddresses = get-dnsclientserveraddress -interfacealias $domainProfile -addressfamily IPv4
$dnsservers = ''
foreach ($dnsserver in $dnsaddresses.ServerAddresses) {
    $body = '      - "' + $dnsserver + '"' + "`r`n"
    $dnsservers = $dnsservers + $body
    #$dnsservers= -join($dnsservers,'`r`n','- "dnsserver"')
}

$configPath = $PSScriptRoot + "\docker-compose.yml"
((get-content -path $configPath -raw) -replace "replace",$dnsservers.trimend()) | set-content -path $configPath

# Create Credential Spec
Import-Module ActiveDirectory
Install-Module CredentialSpec
New-CredentialSpec -AccountName Bloodhound01
