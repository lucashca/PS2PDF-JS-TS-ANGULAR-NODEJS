// Imports
//********************************************************
const path = require('path');
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser')
const FileDao = require("./dao/transactions/fileTransactions");
const FileEntity = require('./entities/fileEntity');
const fs = require('fs');
const redis = require('redis');
const cmdExecutor = require('child_process').exec;
const request = require('request')

//*********************************************************


//Setup
//*********************************************************
const PORT = process.env.PORT || 4000;
const DIR = './uploads';
const fileDao = new FileDao();
const app = express();
const redisClient = redis.createClient();
var doneFIles = new Map();
var allRequest = new Map();
var dataNodes = new Map();

var host = "localhost";
var myHost ="localhost:4000";
var cargaTrabalho = 5;

var nodes = [];
var cmds = [];

var contFinishUploades = 0;
var contRequestes = 0;

var createdNode = true;
const stateEnum = {
  WAITING:'waiting',
  IN_PROGRESS:'progress',
  READY:'ready'
}


const DEFINED_MSGS = {
  LIVE: 'LIVE',
  BLOCK:'BLOCK' ,
  NO:'NO',
  OK:'OK',
  DONE:'DONE',
}

var init = true;
//createMasterWork();

//*********************************************************


//Set Middlewares
//*********************************************************
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Set Cors
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  next();
});
//*********************************************************

//Functions and Utils
//*********************************************************

function saveFile(file){
  return fileDao.saveEntity(file);
}

async function createFileData(req){
  let path = req.file.path;
  var f = fs.readFileSync(path,"utf8");
  console.log(req.file.originalname);
  let file = new FileEntity(req.file.originalname,req.file.mimetype,req.file.size,req.file.path,req.rawHeaders[9],req.file.filename,req.connection.remoteAddress,req.headers.host,f,new Date())

  createJob(file);
  await saveFile(file);
  contFinishUploades+=1;
  console.log(contFinishUploades)
 
}


function createJob(file){
  let key = 'job-'+Date.now();
 let value = 
  {
    fileName:file.fileName,
    originalname:file.originalName,
    state:stateEnum.WAITING

  }
  console.log(JSON.stringify(value));
  redisClient.set(key,JSON.stringify(value));  
  
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}



function createWork(){
  console.log("criando workers");
  port = randomInt(4000,5000);
  h = host
  w = JSON.stringify(nodes);

  cmd = "node worker.js "+h+" "+port+" "+myHost+" '"+w+"'";
  cmds.push(cmd);
  createdNode = true;
  nodes.push("http://"+h+":"+port+"/");
  console.log(cmd)
  child = cmdExecutor(cmd, function (error, stdout, stderr) { 
  });
  
  

}

function resolveAfterXSeconds(x) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(x);
    }, x * 1000);
  });
}

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, DIR);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname + '-' + Date.now() + '.' + path.extname(file.originalname));
    }
});

let upload = multer({storage: storage});


//Endpoints
//*********************************************************
app.get('/api', async function (req, res) {
  await resolveAfterXSeconds()
  res.end('file catcher example');
});

function sendMessage(URL,origin){

  request.get(URL,async function(error,res,body){
    
    try {
      let data = JSON.parse(res.body);
      
      dataNodes.set(origin,data);     
    
    } catch (error) {
      if(!createdNode){
        console.log("removendo "+origin);
      dataNodes.delete(origin);
      nodes.splice(nodes.indexOf(origin));
      if(nodes.length==0){
        dataNodes = new Map();
      }
      }else{
        await resolveAfterXSeconds(5);
        createdNode =false;
        }
    }
  })
  
}

function sendBroadcast(endPoint){
  for(let n of nodes){
      let URL = n+endPoint;
      sendMessage(URL,n);
  }
}



app.get('/getDataWorkers',function(req,res){
  console.log("Getworkers is requested");
  console.log(nodes);
  //res.send(nodes);
  sendBroadcast('getData')
  if(nodes.length == 0){
    dataNodes = new Map();
  }
  let d = {nodes:nodes,data:Array.from(dataNodes.entries())};
  d = JSON.stringify(d);
  res.end(d);
});

app.post('/done', function (req, res) {
  console.log(req.body.data);

  let data = JSON.parse(req.body.data);
  if(nodes.indexOf(data.origin)==-1){
    console.log(data.origin);
    nodes.push(data.origin);
  }
  console.log(data.value.key,data.value.value)
  doneFIles.set(data.value.key,data.value.value);
  let r = JSON.stringify({msg:DEFINED_MSGS.OK});
  res.end(r);
});

app.post('/getMyconvertedFile',function(req,res){
  let key = JSON.parse(req.body.key);
  if(contFinishUploades == allRequest.size){
    verifyWorkers();
  }
  if(doneFIles.has(key)){
    res.end(JSON.stringify({msg:DEFINED_MSGS.OK}));
  }else{
    res.end(JSON.stringify({msg:DEFINED_MSGS.NO}));
  }
});

app.get('/endUpload',async function(req,res){
  await resolveAfterXSeconds(contFinishUploades/10);
  console.log("endUplaoa");
  verifyWorkers();
});

app.get('/download/:key',function(req,res){
  let key = req.params.key;
  console.log(key);
  if(doneFIles.has(key)){
    allRequest.delete(key);
    contFinishUploades -=1;
    if(  contFinishUploades < 0 )   contFinishUploades = 0;
    let path = doneFIles.get(key);
    res.download(path);
  }else{
    res.end(JSON.stringify({msg:DEFINED_MSGS.NO}));
  }
});



app.post('/api/upload',upload.single('file'), function (req, res) {
    console.log("api upload");
    if (!req.file) {
        console.log("No file received");
        return res.send({
          success: false,
        });
      } else { 
        createFileData(req); 
       
        allRequest.set(req.file.filename,true);
         
        
        return res.send({
          success: true,
          fileName:req.file.filename,
        })
      }
});

async function verifyWorkers(){
  need = parseInt(allRequest.size/cargaTrabalho);
 
  if (need==0) need =1;

  if(need > nodes.length){ 
    need =  need - nodes.length;
    console.log("Criando");
    if(need > 5) need  = 5;
    console.log("Criando Workers "+need); 
    for(let i = 0;i < need; i++){
      await resolveAfterXSeconds(0.5);
      console.log("Criando Workers "+i);       
      createWork();  
    }
  }
  

}

//***********************************************************

cmdExecutor('node redisCleaner.js cls');

//Start Server
//***********************************************************
app.listen(PORT, function () {
  console.log('Node.js server is running on port ' + PORT);
});
//***********************************************************
