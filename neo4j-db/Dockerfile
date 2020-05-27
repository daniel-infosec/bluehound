FROM mcr.microsoft.com/windows:1809

# Copy over necessary files
COPY neo4j C:\\neo4j
COPY jdk C:\\jdk
COPY 7z920-x64.msi C:\\7z920-x64.msi
COPY install-7zip.ps1 C:\\install-7zip.ps1

# Install 7-zip
RUN powershell Set-ExecutionPolicy -ExecutionPolicy Unrestricted && \
	powershell C:\\install-7zip.ps1 && \
	setx path "%path%;C:\program files\7-zip"

# Unzip files and delete artifacts
RUN 7z x C:\\jdk\\jdk.7az.* -y && \
	7z x C:\\neo4j\\n4j.7az.* -aoa && \
	rmdir C:\jdk /S /Q	 && \
	rmdir C:\neo4j /S /Q &&\
	# Install and setup Java
	powershell start-process -filepath C:\jdk.exe -passthru -wait -argumentlist "/s" && \
	setx path "%path%;C:\program files\java\jdk-14.0.1\bin"

# Install neo4j
RUN move C:\neo4j-community-4.0.4-windows\neo4j-community-4.0.4 C:\neo4j && \
	rmdir C:\neo4j-community-4.0.4-windows && \
	C:\\neo4j\\bin\\neo4j.bat install-service

# Copy over docker setup script
COPY docker-entrypoint.ps1 C:\\neo4j

ENTRYPOINT ["powershell.exe","C:/neo4j-db/docker-entrypoint.ps1"]
#CMD ["neo4j"]
#ENTRYPOINT ["cmd.exe"]
#EXPOSE 7474 7473 7687 1337