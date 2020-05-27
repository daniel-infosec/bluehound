FROM python:windowsservercore-1809

SHELL ["cmd", "/S", "/C" ]

COPY notebooks C:\\notebooks

RUN pip3 install --upgrade pip && \
    msiexec.exe /a https://nodejs.org/dist/v12.16.3/node-v12.16.3-x64.msi /quiet && \
    setx path "%path%;C:\nodejs"
    # *********** Install Jupyter ************
RUN pip3 install jupyter \
    # *********** Install Libraries ************
    && pip3 install py2neo==4.3.0 plotly==4.3.0 altair==3.2.0 ipywidgets==7.5.1 jupyterlab \
    # *********** Install Extensions *******************
    # Jupyter widgets extension
    && jupyter labextension install @jupyter-widgets/jupyterlab-manager \
    # jupyterlab renderer support
    && jupyter labextension install jupyterlab-plotly --no-build \
    # FigureWidget support
    && jupyter labextension install plotlywidget --no-build \
    # Build extensions (must be done to activate extensions since --no-build is used above)
    && jupyter lab build --minimize=False --dev-build=False


WORKDIR C:\\notebooks

#ENTRYPOINT ["cmd.exe", "jupyter notebook"]
ENTRYPOINT ["cmd.exe", "/s", "/c", "jupyter notebook --ip=*"]

EXPOSE 8888