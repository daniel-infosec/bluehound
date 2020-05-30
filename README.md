# BloodHound in a Box

## Problem Statement

Red Teams and potentially attackers are using BloodHound asymmetrically to the supposed advantage it provides to Blue Team organizations. In my experience, this is due to the limited resources and knowledge of Blue Teams who treat Red Team tooling as contraband. To share the blame, Red Teams often say "just run BloodHound" without providing the training or resource necessary to make it easy for Blue Teams. This project aims to solve those problems by accomplishing the following.

* Make it terribly easy to setup a BloodHound server and ingestor
* Run ingestors on a scheduled basis and automatically ingest that data into the server
* Make it easy for Blue Teams to look for misconfigurations
* Automatically look for new attack paths and push new paths as alerts to a SIEM (not yet implemented)

## Instructions

1. Clone this project to a Domain joined Windows 2019 server (2016 support coming soon).
2. Copy the DCSetup script to a Domain Controller, update the script with the hostname of the server you'll be running BloodHound from, and run it.
3. Run the ServerSetup.ps1 script. (This will force the server to reboot.)
4. Run dc-redo.ps1 script.
5. Download the latest BloodHound release on the target server and run it. Once the dc-redo script is done, you can login to BloodHound using "neo4j" as the username and "obiwankenobi" as the default password. These are customizable in the .\config\config.toml file.

That's it. The server will now be automatically collecting data.

## Jupyter Notebooks

I'm a big fan of @Cyb3rWard0g's ues of Jupyter notebooks for analysis. They're automatically included with this project.

https://medium.com/threat-hunters-forge/jupyter-notebooks-for-bloodhound-analytics-and-alternative-visualizations-9543c2df576a

You can access the Jupyter notebook server by going to the URL provided in the docker-compose output.