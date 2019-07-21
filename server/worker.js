

const redis = require('redis');

const redisClient = redis.createClient();
const cmdExecutor = require('child_process').exec;


const weightOfWorker = 3;
this.allKeys;

this.allData = [];

this.jobs = [];



const stateEnum = {
    WAITING:'waiting',
    IN_PROGRESS:'progress',
    READY:'ready'
  }
  


function set(key,value){
    redisClient.set(key,value);
}

async function getValue(key,callback){
    redisClient.GET(key,function(err,reply){
        if (err) return console.log(err);
        callback(key,reply);   
     
    });
}

async function getAllKeys(callback){
    redisClient.keys('*',function (err, keys) {
        if (err){
            console.log(err);
        }else{
             callback(keys);
       }
    });
}


function sendFinishJobMsg(){

}

function sendCompleted(){

}

function sendIAmLiveMsg(){

}

async function convertPS2PDF(fileName,originalName){
    files = await fileDao.readEntities(fileName);
    encode = files[0].file.data;
    var decodedFile = new Buffer(encode, 'base64').toString('binary');
    let name = originalName+".ps";
    let saveFileName = originalName +"-ps2pdf.PDF";
    fs.writeFile("./dataFolder/ps/"+name, decodedFile, (err) => {
        if (err) throw err;
    
        console.log("The file was succesfully saved!");
        cmd = "ps2pdf ./dataFolder/ps/"+name+ " ./dataFolder/pdf/"+saveFileName;
        child = exec(cmd, function (error, stdout, stderr) {
        console.log('stdout: ' + stdout)
        console.log('stderr: ' + stderr)

        if (error !== null) {
          console.log('exec error: ' + error);
        }
    });

    });
}

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
 }

 function resolveAfterXSeconds(x) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(x);
      }, x * 1000);
    });
}

function filterAllKeys(){
    let auxKeys = [];
    for(let k of this.allKeys){
        let j = k.substring(0,3);
        if(j == 'job'){
            auxKeys.push({key:k,state:stateEnum.WAITING});
        }
        
    }
    this.allKeys = auxKeys;
}

function createNewWork(key){

    cmd = "node worker.js slave '"+JSON.stringify(key)+"'";
    console.log(cmd);
    child = cmdExecutor(cmd, function (error, stdout, stderr) {
        console.log('stdout: ' + stdout)
        console.log('stderr: ' + stderr)
        if (error !== null) {
          console.log('exec error: ' + error);
        }
    });
}

function getAllValues(){
    for(let k of this.allKeys){
        if(k.state == stateEnum.WAITING){
            getValue(k.key,function(key,value){
                this.allData.push({key:key,value:value});
            });
        }
    }
}

function filterAllData(){
    let auxData = [];
    for(let d of this.allData){
        d.value = JSON.parse(d.value);
        if (d.value.state == stateEnum.WAITING){
            auxData.push(d);
        }
    }
    this.jobs = auxData;
}

async function cleanCache(keys){
    for(let k of keys){
        console.log("deletando",k);
        redisClient.del(k);
    }
}


function slaveWorker(jobs){

    
    for(let j of jobs){
        console.log(j.value);
        convertPS2PDF(j.value.fileName,j.value.originalName);
    }
}
  

async function masterWorker(){
    this.allData = [];
    let haveAJob = false;
    getAllKeys(function (key){
        this.allKeys = key;
    });
    while(this.allKeys == undefined){
        const value =  await resolveAfterXSeconds(1);
    }
    //cleanCache(this.allKeys);
    filterAllKeys();
    getAllValues();
    if(this.allKeys.length > 0){
        while(this.allData.length == 0){
            const value =  await resolveAfterXSeconds(1);
        }
    }
    filterAllData();
    while(this.jobs.length > 0){
        
        let numberOfSlavesWorkers = parseInt(this.jobs.length/weightOfWorker);
        if(this.jobs.length != weightOfWorker){
            numberOfSlavesWorkers = numberOfSlavesWorkers + 1;
        }

        console.log(numberOfSlavesWorkers);
        for(var i = 0; i < numberOfSlavesWorkers; i++){
            let job = this.jobs.slice(0,weightOfWorker);
            this.jobs = this.jobs.slice(weightOfWorker,this.jobs.length);
            createNewWork({jobs:job});
        }
       
    }
}
console.log(process.argv)
if(process.argv[2]=='master'){
    masterWorker();
}else if(process.argv[2]=='slave'){
    this.jobs = JSON.parse(process.argv[3]).jobs;
    slaveWorker(this.jobs);
}else{
    console.log("Plese set the type of worker");
    console.log("For a master worker run -> node worker.js master ");
    console.log("For a slave worker run -> node worker.js slave ");
}