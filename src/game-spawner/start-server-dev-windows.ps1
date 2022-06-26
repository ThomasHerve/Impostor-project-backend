$program = "node"
$arguments = "main.mjs devel"
Start-Process -NoNewWindow  $program $arguments
node ..\main-server\server.mjs