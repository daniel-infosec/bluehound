FROM mcr.microsoft.com/windows:1809

RUN powershell.exe Invoke-WebRequest 'https://github.com/git-for-windows/git/releases/download/v2.12.2.windows.2/MinGit-2.12.2.2-64-bit.zip' -OutFile MinGit.zip

RUN powershell.exe Expand-Archive c:\MinGit.zip -DestinationPath c:\MinGit
RUN setx path "%path%;C:\MinGit\cmd\;C:\MinGit\cmd"

RUN git clone https://github.com/BloodHoundAD/BloodHound.git

ENTRYPOINT ["cmd.exe"]