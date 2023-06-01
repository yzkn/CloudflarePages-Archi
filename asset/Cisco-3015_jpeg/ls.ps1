Get-ChildItem -Recurse -include *.jpg | ForEach-Object { $_.FullName } | Out-File files.txt
