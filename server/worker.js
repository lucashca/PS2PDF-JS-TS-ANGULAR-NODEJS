
const express = require('express');
const redis = require('redis');
const fs = require('fs');
const redisClient = redis.createClient();
const cmdExecutor = require('child_process').exec;
const FileDao = require("./dao/transactions/fileTransactions");
const request = require('request')
const bodyParser = require('body-parser')


const fileDao = new FileDao();
const weightOfWorker = 3;
const app = express();

var desableConsole = true;


var dir_tempConvertedPS = './temp/converted/ps/';
var dir_tempConvertedPDF = './temp/converted/pdf/';
var dir_tempData = './temp/data';

var appendFileName = "-Converted by ps2pdf"

var allKeys = [];
var allData = [];
var jobs = [];

var contNoJobs = 0;
var contNoKeys = 0;

var napTime = 5;
var blockedFiles = [];
var job = null;

kill = false;

var receivedMsg = '';
var seendMsg = '';

var starving = 0;

PORT:Number;
HOST:String;
ADDRESS:String;
MAINSERVER:String;

var workersNodes = [];
var broadcastResponse = [];
var waitingBroadcastRes = false;



const DEFINED_MSGS = {
    LIVE: 'LIVE',
    BLOCK:'BLOCK' ,
    NO:'NO',
    OK:'OK',
    DONE:'DONE',
}

const DEFINED_ENDPOINTS = {
    LIVE:'setIAmLive',
    BLOCK:'blockJob',
    DONE:'done',
}

const stateEnum = {
    WAITING:'waiting',
    IN_PROGRESS:'progress',
    DONE:'done',
    SEARCH:'Looking for a job',
    HEARTBEAT:'Sending broadcast heartbeat',
    NAP:'Taking a nap'    
}


function goOn(){
    if(kill){
        process.exit(0);
    }
}

var myState = stateEnum.WAITING;

//Set Middlewares
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//Set Cors
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}

//{{{{{{{{{{{{{{{{{{{{{{{{{Endpoints}}}}}}}}}}}}}}}}}}}}}}}}}
app.get('/', function (req, res) {
    res.end('file catcher example');
});

app.get('/getData',function(req,res){
    console.log('getData')
    data = {
        blockedFiles:blockedFiles,
        currentJob:job,
        jobsPile:jobs,
        liveNodes:workersNodes,
        receivedMsg:receivedMsg,
        sendMsg:seendMsg,
        currentState:myState
    }

    res.end(JSON.stringify(data));
    /*
    res.send(blockedFiles);
    res.send(job);
    res.send(jobs);
    res.send(workersNodes);
    res.send(receivedMsg);
    res.send(seendMsg);
    */
});

app.get('/kill',function(req,res){
   res.send(JSON.stringify({msg:DEFINED_MSGS.OK}));
   if(job == null){
       process.exit(0);
   }else{
       changeJobStatus(stateEnum.WAITING);
       
    }


   kill = true;
});

app.post('/setIAmLive', function (req, res) {
    console.log("setIAmLive is requestesd");
  
    data = JSON.parse(req.body.data);
    address = data.origin;
    receivedMsg = {msg:'I am live from',address:address};
    seendMsg = {msg:'I am live too',address:address};
    if(!workersNodes.includes(address)){
        workersNodes.push(address);
    }
    data = createDataMsg(DEFINED_MSGS.LIVE)
    res.end(JSON.stringify(data));

});
app.post('/blockJob', function (req, res) {
    console.log("blockJob is requestesd");
    let data = JSON.parse(req.body.data);
    let originMsg = data.origin;
    let jobReceived = data.value;
    console.log(jobReceived);
    receivedMsg = {msg:'I can do this job '+jobReceived+" ?",address:originMsg};
     
    if(job){
        if(jobReceived == job.key){
            data = createDataMsg(DEFINED_MSGS.NO);
            res.end(JSON.stringify(data));   
            console.log("You can't do this job, "+jobReceived) 
            seendMsg = {msg:"You can't do this job",address:originMsg};
        }else{
            data = createDataMsg(DEFINED_MSGS.OK);
            res.end(JSON.stringify(data));   
            seendMsg = {msg:"Yes! you can do this job",address:originMsg}; 
        }
    }
    else{
        data = createDataMsg(DEFINED_MSGS.OK);
        res.end(JSON.stringify(data));   
        seendMsg = {msg:"Yes! you can do this job",address:originMsg};
    }
    /*
    if(blockedFiles.includes(jobReceived)){
        data = createDataMsg(DEFINED_MSGS.NO);
        res.end(JSON.stringify(data));   
        console.log("You can't do this job, "+jobReceived) 
        seendMsg = {msg:"You can't do this job",address:originMsg};

    }else{
        blockedFiles.push(jobReceived);
        data = createDataMsg(DEFINED_MSGS.OK);
        res.end(JSON.stringify(data));   
        seendMsg = {msg:"Yes! you can do this job",address:originMsg}; 
    }*/
});
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}

function setup(){
    console.log("setup")
    this.HOST = process.argv[2];
    this.PORT = process.argv[3];
    this.MAINSERVER ="http://"+process.argv[4]+"/";
    this.ADDRESS = "http://"+this.HOST +":"+this.PORT+"/";
    workersNodes = JSON.parse(process.argv[5]);
    
    if(process.argv.length > 6){
        desableConsole = false;
    }

    //***********************************************************
    app.listen(PORT, function () {
        console.log('Node.js server is running on port ' + PORT);
        if(desableConsole == true){
            console.log = function(){};
        }

    });
    //***********************************************************
   
}   

async function init(){
    console.log("init")
    goOn();
    allKeys = [];
    allData = [];
    jobs = [];
    job = null;
    let data = createDataMsg(DEFINED_MSGS.LIVE);   
    if(workersNodes.length>0){
        myState = stateEnum.HEARTBEAT;
        sendBroadcast(data,DEFINED_ENDPOINTS.LIVE,callbackSetResLive);
    }
    getAllKeys(callbackGetAllKeys);

    let cont = 0;
    while(allKeys.length == 0) {
        myState = stateEnum.WAITING;
        cont +=1;
        if(cont%5==0){
            
            getAllKeys(callbackGetAllKeys);
        }
        await resolveAfterXSeconds(1);
    }

    filterAllKeys();
    getAllValues();
    
    while(allData.length == 0) {
        await resolveAfterXSeconds(1)
        console.log("Alldata vazio");
    };
    filterAllData();
    console.log("Jobs to be done");
    console.log(jobs);
    while(waitingBroadcastRes){
        await resolveAfterXSeconds(1);
        console.log(broadcastResponse.length, workersNodes.length);
        if(broadcastResponse.length >= workersNodes.length)
        {init();}

    }
    
    if(!job && jobs.length>0){
        
        contNoJobs = 0;
        let ind = randomInt(0,jobs.length - 1);
        job = jobs[ind];
        blockedFiles.push(job.key);
        data = createDataMsg(DEFINED_MSGS.BLOCK,job.key);
        if(workersNodes.length > 0){
            
            sendBroadcast(data,DEFINED_ENDPOINTS.BLOCK,callbackBlockJob);
        } else{
            startJob();
        }  
    }else{
        myState = stateEnum.NAP;
        if(contNoJobs > 2){
            console.log("I am out!");
            process.exit(0);
        }
        contNoJobs += 1;
        console.log("No jobs found");
        console.log("I'm going to take a nap");
        await takeANap();
        init();
    }
    
}


async function callbackBlockJob(err,res,body){
    console.log("callbackBlockJob")
    if(err){

    }else{
        let data = JSON.parse(res.body);
        console.log(data.msg);
        broadcastResponse.push(data);
        
        if(broadcastResponse.length == workersNodes.length){
            let canConvert = true;
            for(let r of broadcastResponse){
                if(r.msg != 'OK'){
                    canConvert = false;
                    break;
                }
            }
            if(canConvert){
                receivedMsg = {msg:"Yes you can do this job!",address:data.origin};
                let sleep = randomNumber(1,5);
                await resolveAfterXSeconds(sleep);    
                startJob();
            }else{
                receivedMsg = {msg:"No you can't do this job! "+job.key,address:data.origin};    
                blockedFiles.splice(blockedFiles.indexOf(job.key));
                job = null;
                starving +=1;
                if(starving == 5){
                    console.log("I am a starving worker");
                    process.exit(0);
                }
                let sleep = randomNumber(5,10);
                await resolveAfterXSeconds(sleep);
                init();
            }
        }
    }
}

function callbackSendToServer(err,res,body){
    console.log("callbackSendToServer")
    if(err){
        console.log(err);
        let key = job.value.fileName;
        let value = dir_tempConvertedPDF+""+job.value.originalname +""+appendFileName+".PDF";
        let pair = {key:key,value:value};
        let data = createDataMsg(DEFINED_MSGS.DONE,pair);   
        let URL = this.MAINSERVER+DEFINED_ENDPOINTS.DONE;
        sendMessage(URL,data,callbackSendToServer);
        
    }else{
        msg = JSON.parse(body);
        console.log(res.request.originalHost);
        console.log("Received form "+res.request.originalHost+":  message "+msg.msg);
        receivedMsg = {msg:msg.msg,address:msg.origin};
        job = null;
        
        init();
    }
}

function callbackConvertPS2PDF(error, stdout, stderr){
    console.log("callbackConvertPS2PDF")
    if (error) {
        console.log('exec error: ' + error);
    }else if(stderr){
        console.log('stderr: ' + stderr)
    }
    console.log("The file was succesfully saved!");   
    console.log(job.value); 
    changeJobStatus(stateEnum.DONE);
    console.log("appendFileName")
    console.log(job);
   
    let key = job.value.fileName;
    let value = dir_tempConvertedPDF+""+job.value.originalname +""+appendFileName+".PDF";
    let pair = {key:key,value:value};
    let data = createDataMsg(DEFINED_MSGS.DONE,pair);   
    let URL = this.MAINSERVER+DEFINED_ENDPOINTS.DONE;
    sendMessage(URL,data,callbackSendToServer);
}

function callbackSetResLive_Again(err,res,body){
    console.log("callbackSetResLive_Again")
    if(err){
        
        console.log(""+err);
        console.log("This node is off");
        let port = err.port;
        let host = err.address;
        if(host == '127.0.0.1'){
            host = 'localhost';
        }
        let address = "http://"+host+":"+port+"/";
        receivedMsg = {msg:err,address:address};
        workersNodes.splice(workersNodes.indexOf(address));
        if(broadcastResponse.length >= workersNodes.length){
            waitingBroadcastRes = false;
            console.log("EVENT - All responses are arrived");
            console.log("Actives nodes");
            console.log(workersNodes);
        }
    }else{
        let data = JSON.parse(res.body);
        receivedMsg = {msg:data.msg,address:data.origin};
        broadcastResponse.push(data.origin);
       if(broadcastResponse.length >= workersNodes.length){
            waitingBroadcastRes = false;
            console.log("EVENT - All responses are arrived");
        }
    }
}


function callbackSetResLive(err,res,body){
    if(err){
        console.log(""+err);
        console.log("Trying again");
        let port = err.port;
        let host = err.address;

        if(host == '127.0.0.1'){
            host = 'localhost';
        }

        let address = "http://"+host+":"+port+"/";
        receivedMsg = {msg:err,address:address};
        let data = createDataMsg(DEFINED_MSGS.LIVE);   
    
        let URL = address+DEFINED_ENDPOINTS.LIVE;
        sendMessage(URL,data,callbackSetResLive_Again);
    }else{
        console.log("Received response: "+res.body);
        let data = JSON.parse(res.body);
        broadcastResponse.push(data.origin);
        receivedMsg = {msg:data.msg,address:data.origin};
        if(broadcastResponse.length >= workersNodes.length){
            waitingBroadcastRes = false;
            console.log("All responses are arrived");
          
        }
    }
}


function callbackGetAllKeys(key){
    allKeys = key;
}

function startJob(){
    goOn();
    changeJobStatus(stateEnum.IN_PROGRESS);
    convertPS2PDF(job.value.fileName,job.value.originalname);
}


function changeJobStatus(status){
    console.log(status);
    console.log(job);
    let j = job;
    j.value.state = status;
    redisClient.SET(j.key,JSON.stringify(j.value));
    goOn();
}




function createDataMsg(msg,value=''){

    if(value == '')
    return {msg:msg,origin:this.ADDRESS};   
    return {msg:msg,origin:this.ADDRESS,value:value};
}

function sendBroadcast(data,endPoint,callback){
    broadcastResponse = []
    waitingBroadcastRes = true;
    for(let n of workersNodes){
        let URL = n+endPoint;
        sendMessage(URL,data,callback);
    }
}


function sendMessage(URL,DATA,callback){
    console.log("Request for "+URL+" with "+JSON.stringify(DATA));
    seendMsg = {msg:DATA.msg,address:URL};
    request.post({url:URL, form:{data:JSON.stringify(DATA)},timeout: 6000},callback)
    
}


async function convertPS2PDF(fileName,originalName){
    console.log("Convertendo");
    let ti = Date.now();
    let files = await fileDao.readEntities(fileName);
    await resolveAfterXSeconds(1);
    let t0 = Date.now();
    console.log(ti-t0);
    let encode = files[0].file.data;

    var decodedFile = new Buffer.from(encode, 'base64').toString('binary');
    console.log(originalName);
    let name = originalName+".ps";
    let saveFileName = originalName +""+appendFileName+".PDF";
    fs.writeFile(dir_tempData+""+name, decodedFile, (err) => {
        if (err){
            console.log("Erro");
            throw err;
        } 
        cmd = "ps2pdf '"+dir_tempData+''+name+ "' '"+dir_tempConvertedPDF+""+saveFileName+"'";
        child = cmdExecutor(cmd, callbackConvertPS2PDF);
    });
}



function filterAllKeys(){
    console.log("filterAllKeys")
    let auxKeys = [];
    for(let k of allKeys){
        let j = k.substring(0,3);
        if(j == 'job'){
            auxKeys.push({key:k,state:stateEnum.WAITING});
        }
        
    }
    allKeys = auxKeys;
}

function filterAllData(){
    console.log("filterAllData")
    myState = stateEnum.SEARCH;
    let auxData = [];
    for(let d of allData){
        d.value = JSON.parse(d.value);
        if (d.value.state == stateEnum.WAITING){
            auxData.push(d);
            if(blockedFiles.includes(d.name)){
                blockedFiles.splice(blockedFiles.indexOf(d.name));
            }
        }
    }
    jobs = auxData;
}



function getAllValues(){
    console.log("getAllValues")
    myState = stateEnum.SEARCH;
    for(let k of allKeys){
        if(k.state == stateEnum.WAITING){
            getValue(k.key,function(key,value){
                allData.push({key:key,value:value});
            });
        }
    }
}


async function getValue(key,callback){
    console.log("getValue")
    myState = stateEnum.SEARCH;
    redisClient.GET(key,function(err,reply){
        if (err) return console.log(err);
        callback(key,reply);   
     
    });
}

async function getAllKeys(callback){
    console.log("getAllKeys")
    myState = stateEnum.SEARCH;
    redisClient.keys('*',function (err, keys) {
        if (err){
            console.log(err);
        }else{
            if(keys.length == 0){
                if(contNoKeys > 2){
                    console.log("I am out!");
                    process.exit(0);
                }
                contNoKeys += 1;
                console.log("No jobs found!");
                
            }else{
                contNoKeys = 0;
            }
             callback(keys);
       }
    });
}



function randomInt(low, high) {
    console.log("randomInt")
    return Math.floor(Math.random() * (high - low) + low)
  }
  function randomNumber(low, high) {
    console.log("randomNumber")
    return Math.random() * (high - low) + low;
  }
  
async function takeANap(){
    console.log("takeANap")
    myState = stateEnum.NAP;
    for(let i = 0; i < napTime;i++){
        await resolveAfterXSeconds(1); 
        console.log(i+'s')
    }
}



function resolveAfterXSeconds(x) {
    console.log("resolveAfterXSeconds")
    myState = stateEnum.WAITING;
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(x);
      }, x * 1000);
    });
}

function printLiveLiveNodes(){
    console.log("Live nodes");
    //console.log(workersNodes);   
}


function test(){
    if(this.PORT == 5000){
       
                init();
    }
    if(this.PORT == 3500){
        this.workersNodes = [];

    }   
}



setup();
init();
