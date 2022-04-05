# https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands?view=powershell-7

# Aufruf:   .\delete-pvc.ps1

Set-StrictMode -Version Latest

$versionMinimum = [Version]'7.3.0'
$versionCurrent = $PSVersionTable.PSVersion
if ($versionMinimum -gt $versionCurrent) {
    throw "PowerShell $versionMinimum statt $versionCurrent erforderlich"
}

# Titel setzen
$host.ui.RawUI.WindowTitle = 'mongodb delete pvc'

$namespace = 'acme'
kubectl delete pvc/mongodb-data-volume-mongodb-0 --namespace $namespace
kubectl delete pvc/mongodb-tmp-volume-mongodb-0 --namespace $namespace
kubectl delete pvc/mongodb-home-volume-mongodb-0 --namespace $namespace
