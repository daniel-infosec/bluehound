var ZIP_FILE = require('is-zip-file');
var FS = require('fs');
var UNZIPPER = require('unzipper');
var sanitize = require('sanitize-filename');
var PATH = require('path')
var tempPath = require('temp-dir');
const tempDirectory = require('temp-dir');
var STREAM_CHAIN = require('stream-chain');
const Pick = require('stream-json/filters/Pick');
const {streamArray} = require('stream-json/streamers/StreamArray');
var neo4j = require('neo4j-driver')
var NewIngestion = require('./newingestion.js');
var toml = require('toml');
var http = require('http');
const { exec } = require("child_process");
const Shell = require('node-powershell');

String.prototype.format = function() {
    var i = 0,
        args = arguments;
    return this.replace(/{}/g, function() {
        return typeof args[i] !== 'undefined' ? args[i++] : '';
    });
};

String.prototype.formatAll = function() {
    var args = arguments;
    return this.replace(/{}/g, args[0]);
};

String.prototype.formatn = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

String.prototype.toTitleCase = function() {
    return this.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

Array.prototype.allEdgesSameType = function() {
    for (var i = 1; i < this.length; i++) {
        if (this[i].neo4j_type !== this[0].neo4j_type) return false;
    }

    return true;
};

Array.prototype.chunk = function() {
    let i = 0;
    let len = this.length;
    let temp = [];
    let chunkSize = 10000;

    for (i = 0; i < len; i += chunkSize) {
        temp.push(this.slice(i, i + chunkSize));
    }

    return temp;
};

if (!Array.prototype.last) {
    Array.prototype.last = function() {
        return this[this.length - 1];
    };
}

function fileDrop(filePath, fileName) {
    let fileNames = [];

    var ASYNC = require('async');

    fileNames.push({path: filePath, name: fileName})

    unzipNecessary(fileNames).then((results) => {
        ASYNC.eachSeries(
            results,
            (file, callback) => {
                var msg = 'Processing file ' + file.name;
                if (file.zip_name) {
                    msg += ' from ' + file.zip_name;
                }
                console.log(msg)
                getFileMeta(file.path, callback);
            },
            () => {
                addBaseProps();
                //$.each(results, function (_, file) {
                //    if (file.delete) {
                //        unlinkSync(file.path);
                //    }
                //});
                //this.props.alert.info('Finished processing all files', {
                //    timeout: 0,
                //});
                console.log('Finished processing all files')
            }
        );
    });
    return;
}

async function addBaseProps() {
    let s = driver.session();
    await s.run(
        'MATCH (n:User) WHERE NOT EXISTS(n.owned) SET n.owned=false'
    );
    await s.run(
        'MATCH (n:Computer) WHERE NOT EXISTS(n.owned) SET n.owned=false'
    );

    await s.run(
        'MATCH (n:Group) WHERE n.objectid ENDS WITH "-513" MATCH (m:Group) WHERE m.domain=n.domain AND m.objectid ENDS WITH "S-1-1-0" MERGE (n)-[r:MemberOf]->(m)'
    );

    await s.run(
        'MATCH (n:Group) WHERE n.objectid ENDS WITH "-515" MATCH (m:Group) WHERE m.domain=n.domain AND m.objectid ENDS WITH "S-1-1-0" MERGE (n)-[r:MemberOf]->(m)'
    );

    await s.run(
        'MATCH (n:Group) WHERE n.objectid ENDS WITH "-513" MATCH (m:Group) WHERE m.domain=n.domain AND m.objectid ENDS WITH "S-1-5-11" MERGE (n)-[r:MemberOf]->(m)'
    );

    await s.run(
        'MATCH (n:Group) WHERE n.objectid ENDS WITH "-515" MATCH (m:Group) WHERE m.domain=n.domain AND m.objectid ENDS WITH "S-1-5-11" MERGE (n)-[r:MemberOf]->(m)'
    );
    s.close();
}

async function unzipNecessary(files) {
    var index = 0;
    var processed = [];
    let promises = [];
    var ZIP_FILE = require('is-zip-file');
    var FS = require('fs');
    var UNZIPPER = require('unzipper');
    var sanitize = require('sanitize-filename');
    var PATH = require('path')
    var tempPath = require('temp-dir');
    const tempDirectory = require('temp-dir');
    while (index < files.length) {
        var path = files[index].path;
        var name = files[index].name;

        console.log("path to if zip:", path)

        if (ZIP_FILE.isZipSync(path)) {
            console.log(
                'Unzipping file ', name
            );

            await FS.createReadStream(path)
                .pipe(UNZIPPER.Parse())
                .on('error', function (error) {
                    console.log(name, 'is corrupted or password protected');
                })
                .on('entry', function (entry) {
                    let sanitized = sanitize(entry.path);
                    let output = PATH.join(tempPath, sanitized);
                    let write = entry.pipe(FS.createWriteStream(output));

                    let promise = new Promise((res) => {
                        write.on('finish', () => {
                            res();
                        });
                    });

                    promises.push(promise);
                    processed.push({
                        path: output,
                        name: sanitized,
                        zip_name: name,
                        delete: true,
                    });
                })
                .promise();
        } else {
            processed.push({ path: path, name: name, delete: false });
        }
        index++;
    }
    await Promise.all(promises);
    return processed;
}

function getFileMeta(file, callback) {
    let acceptableTypes = [
        'sessions',
        'ous',
        'groups',
        'gpomembers',
        'gpos',
        'computers',
        'users',
        'domains',
    ];
    let count;

    let size = FS.statSync(file).size;
    let start = size - 200;
    if (start <= 0) {
        start = 0;
    }
    FS.createReadStream(file, {
        encoding: 'utf8',
        start: start,
        end: size,
    }).on('data', (chunk) => {
        let type, version;
        try {
            type = /type.?:\s?"(\w*)"/g.exec(chunk)[1];
            count = /count.?:\s?(\d*)/g.exec(chunk)[1];
        } catch (e) {
            type = null;
        }
        try {
            version = /version.?:\s?(\d*)/g.exec(chunk)[1];
        } catch (e) {
            version = null;
        }

        if (version == null) {
            this.props.alert.error(
                'Version 2 data is not compatible with BloodHound v3.'
            );
            //this.setState({ uploading: false });
            callback();
            return;
        }

        if (!acceptableTypes.includes(type)) {
            this.props.alert.error('Unrecognized File');
            //this.setState({
            //    uploading: false,
            //});
            callback();
            return;
        }
        processJson(file, callback, parseInt(count), type, version);
    });
}

function processJson(file, callback, count, type, version = null) {
    let pipeline = STREAM_CHAIN.chain([
        FS.createReadStream(file, { encoding: 'utf8' }),
        Pick.withParser({ filter: type }),
        streamArray(),
    ]);

    let localcount = 0;
    let sent = 0;
    let chunk = [];
    //Start a timer for fun

    //this.setState({
    //    uploading: true,
    //    progress: 0,
    //});

    console.log(`Processing ${file}`);
    console.time('IngestTime');
    pipeline
        .on(
            'data',
            async function (data) {
                chunk.push(data.value);
                localcount++;

                if (localcount % 1000 === 0) {
                    pipeline.pause();
                    await uploadData(chunk, type, version);
                    sent += chunk.length;
                    //this.setState({
                    //    progress: Math.floor((sent / count) * 100),
                    //});
                    chunk = [];
                    pipeline.resume();
                }
            }.bind(this)
        )
        .on(
            'end',
            async function () {
                await uploadData(chunk, type, version);
                console.timeEnd('IngestTime');
                callback();
            }.bind(this)
        );
}

async function uploadData(chunk, type, version) {
    let session = driver.session();
    let funcMap;
    if (version == null) {
        funcMap = {
            computers: OldIngestion.buildComputerJson,
            domains: OldIngestion.buildDomainJson,
            gpos: OldIngestion.buildGpoJson,
            users: OldIngestion.buildUserJson,
            groups: OldIngestion.buildGroupJson,
            ous: OldIngestion.buildOuJson,
            sessions: OldIngestion.buildSessionJson,
            gpomembers: OldIngestion.buildGpoAdminJson,
        };
    } else {
        funcMap = {
            computers: NewIngestion.buildComputerJsonNew,
            groups: NewIngestion.buildGroupJsonNew,
            users: NewIngestion.buildUserJsonNew,
            domains: NewIngestion.buildDomainJsonNew,
            ous: NewIngestion.buildOuJsonNew,
            gpos: NewIngestion.buildGpoJsonNew,
        };
    }

    let data = funcMap[type](chunk);
    for (let key in data) {
        if (data[key].props.length === 0) {
            continue;
        }
        let arr = data[key].props.chunk();
        let statement = data[key].statement;
        for (let i = 0; i < arr.length; i++) {
            await session
                .run(statement, { props: arr[i] })
                .catch(function (error) {
                    //console.log(statement);
                    //console.log(data[key].props);
                    console.log("Error on line 334");
                    console.log(error);
                });
        }
    }

    session.close();
}

const checkDatabaseExists = () => {
    if (url === '') {
        return;
    }

    let tempUrl = url.replace(/\/$/, '');
    if (!tempUrl.includes(':')) {
        tempUrl = `${tempUrl}:7687`;
    }

    if (!url.startsWith('bolt://')) {
        tempUrl = `bolt://${tempUrl}`;
    }

    var username ='neo4j'
    var password = 'tootiefrutie'
    console.log(tempUrl)

    driver = neo4j.driver(tempUrl, neo4j.auth.basic(username, password));
    var session = driver.session();

    session
        .run('MATCH (n) RETURN n LIMIT 1')
        .then(result => {
            console.log("Successful database connection")
            url = tempUrl;
        })
        .catch(error => {
            if (error.message.includes('WebSocket connection failure')) {
                console.log("No database found")
            } else {
                console.log("Error message")
                console.log(error.message)
            }
        })
        .finally(() => {
            session.close();
            //driver.close();
            console.log("Session closed")
        });
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getFile(timeout) {
    const timeouts = setInterval(function() {

        //const fileExists = fs.existsSync(file);

        var files = FS.readdirSync('C:/').filter(fn => fn.endsWith('.zip')).filter(fn => fn.startsWith(count));

        console.log(files)

        //console.log('Checking for: ', file);
       //console.log('Exists: ', fileExists);

        if (files.length != 0 && fs.statSync(files).size > 0) {
            clearInterval(timeouts);
            checkDatabaseExists();
            fileDrop('C:\\' + files[0], files[0])
            count = count + 1;
            files = [];
            return;
        }
    }, timeout);
};

function collectData() {
    const ps = new Shell({
      executionPolicy: 'Bypass',
      noProfile: true
    });
     
    ps.addCommand('import-module c:\\BloodHound\\Ingestors\\SharpHound.ps1; invoke-bloodhound -collectionmethod all -outputdirectory c:\\ -outputprefix ' + count);
    var BHOutput = ""
    ps.invoke()
    .then(output => {
      console.log("BloodHound collection in progress");
      BHOutput = output;
    })
    .catch(err => {
      console.log(err);
    });

    getFile(3000)

    return;

    //for (let j = 0; j < process.argv.length; j++) {
    //    console.log(j + ' -> ' + (process.argv[j]));
   // }
   // let fileName = process.argv[process.argv.length-1]

    //console.log(fileName)
    //checkDatabaseExists();
    //fileDrop(process.cwd() + '\\' + fileName, fileName)
}

exec("powershell.exe ipconfig /renew", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});

const config = toml.parse(FS.readFileSync("C:\\config\\config.toml", 'utf-8'));
var url = config['database']['server'];
const username = config['database']['username'];
const password = config['database']['password'];
const schedule = config['collection_frequency']['schedule'];
var count = 1;
var driver;

var cron = require('node-cron');

cron.schedule(schedule, () => {
  console.log('Initiating scheduled data collection');
  collectData();
});

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});  
      
    var url = req.url; 
      
    if(url ==='/manual') { 
        res.write('Initiating manual data collection');
        console.log('Initiating manual data collection');
        collectData();
        res.end();  
    }  
    else { 
        res.write('Hello World!');  
        res.end();  
    } 
}).listen(8080);