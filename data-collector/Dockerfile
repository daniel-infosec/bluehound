#FROM python:windowsservercore-1809
#FROM mcr.microsoft.com/dotnet/core/sdk:3.0
#FROM mcr.microsoft.com/dotnet/runtime:latest
FROM mcr.microsoft.com/dotnet/framework/runtime:4.8

SHELL ["cmd", "/S", "/C" ]

#USER "NT AUTHORITY\NETWORK SERVICE"

COPY installation_executables C:\\installation_executables

#RUN powershell Invoke-WebRequest 'https://github.com/git-for-windows/git/releases/download/v2.12.2.windows.2/MinGit-2.12.2.2-64-bit.zip' -OutFile MinGit.zip && \
RUN	powershell Expand-Archive c:\installation_executables\MinGit.zip -DestinationPath c:\MinGit && \
	msiexec.exe /a C:\installation_executables\node-v12.16.3-x64.msi /quiet && \
	setx path "%path%;C:\MinGit\cmd\;C:\MinGit\cmd;C:\nodejs"

RUN git clone https://github.com/BloodHoundAD/BloodHound.git

RUN npm init -y && \
	npm install neo4j-driver && \
	npm install stream-json && \
	npm install stream-chain && \
	npm install async && \
	npm install temp-dir && \
	npm install tmp && \
	npm install path && \
	npm install sanitize-filename && \
	npm install unzipper && \
	npm install is-zip-file && \
	npm install lodash && \
	npm install toml && \
	npm install node-powershell && \
	npm install underscore && \
	npm install node

#ENTRYPOINT ["node","c:\\data-collector\\dataingestor.js"]
