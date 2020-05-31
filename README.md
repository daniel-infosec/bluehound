# BloodHound in a Box

**This is in beta. There's probably still a lot of bugs.**

## Problem Statement

Red Teams and potentially attackers are using BloodHound asymmetrically to the supposed advantage it provides to Blue Team organizations. In my experience, this is due to the limited resources and knowledge of Blue Teams who treat Red Team tooling as contraband. To share the blame, Red Teams often say "just run BloodHound" without providing the training or resource necessary to make it easy for Blue Teams. This project aims to solve those problems by accomplishing the following.

* Make it terribly easy to setup a BloodHound server and ingestor
* Run ingestors on a scheduled basis and automatically ingest that data into the server
* Make it easy for Blue Teams to look for misconfigurations
* Automatically look for new attack paths and push new paths as alerts to a SIEM (not yet implemented)

## Instructions

1. Clone this project to a Domain joined Windows 2019 server (2016 support coming soon).
2. Copy the DCSetup script to a Domain Controller, update the script with the hostname of the server you'll be running BloodHound from, and run it.
3. Run the SetupRSAT.ps1 script. This will install the necessary AD modules on the server.
4. Run the ServerSetup.ps1 script. (This will force the server to reboot.)
5. Run StartContainers.ps1 script.
6. Download the latest BloodHound release on the target server and run it. Once the StartContainers script is done, you can login to BloodHound using "neo4j" as the username and "obiwankenobi" as the default password. These are customizable in the .\config\config.toml file.

That's it. The server will now be automatically collecting data.

## The Setup Scripts

### DCSetup

I know a lot of people are scared about running random code on their Domain Controllers. I tried my best to make this as simpel as possible and I copy-pasted the code and best practices from Microsoft. https://docs.microsoft.com/en-us/virtualization/windowscontainers/manage-containers/manage-serviceaccounts.

Feel free to review the DCSetup script and compare.

### ServerSetup

The server setup script does the following:

* Installs Docker
* Installs Docker-compose
* Setups a transparent docker network interface so the containers can communicate with the Domain

## Frequency

By default, the project will collect information every 1 hour. If you pop into https://github.com/daniel-infosec/bluehound/blob/master/config/config.toml, you can customize the collection frequency. It uses cron syntax.

https://crontab.guru/

## Jupyter Notebooks

I'm a big fan of @Cyb3rWard0g's ues of Jupyter notebooks for analysis. They're automatically included with this project.

https://medium.com/threat-hunters-forge/jupyter-notebooks-for-bloodhound-analytics-and-alternative-visualizations-9543c2df576a

You can access the Jupyter notebook server by going to the URL provided in the docker-compose output.

## Future Work

* On first run, store all attack paths to DA and then generate alerts for new attack paths added
* Add more nifty jupyter notebooks for analysis
* Provide support for deploying this app in Azure
* Make the output from the containers more user friendly
* Provide support for running this project with vagrant instead of docker-compose
