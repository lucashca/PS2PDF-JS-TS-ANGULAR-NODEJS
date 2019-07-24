// Imports
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}
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

//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}


//Setup
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}
const PORT = process.env.PORT || 4000;
const DIR = './temp/uploads';
const fileDao = new FileDao();
const app = express();
const redisClient = redis.createClient();
var doneFIles = new Map();
var allRequest = new Map();
var dataNodes = new Map();

var host = "localhost";
var myHost ="localhost:4000";
var cargaTrabalho = 5;

var iHaveWorkers = false;
var nodes = [];
var cmds = [];

var contFinishUploades = 0;
var contFinishRedis = 0;
var jobNames = [];

var withoutWorkers = 0;

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

//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}


//Set Middlewares
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{[{{{{}}}}]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}
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
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}

//Functions and Utils
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}

async function saveFile(file){
  return fileDao.saveEntity(file);
}

async function createFileData(req){
  let path = req.file.path;
  var f = fs.readFileSync(path,"utf8");
  console.log(req.file.originalname);
  let file = new FileEntity(req.file.originalname,req.file.mimetype,req.file.size,req.file.path,req.rawHeaders[9],req.file.filename,req.connection.remoteAddress,req.headers.host,f,new Date())

  await saveFile(file);
  console.log("The file has been saved in database");
  await createJob(file);
  contFinishUploades+=1;
  //console.log(contFinishUploades)
}

function verifyKeys(){
  let repetidos = [];
  for(let k of jobNames){
    let cont = 0;
    for(let j of jobNames){
      if(k == j){
        cont+=1;
        if(cont > 1){
          console.log(k+" é repetida");
          repetidos.push(k);
        }
      }
    }
  }
  return repetidos;

}

function randomNumber(low, high) {
  //console.log("randomNumber")
  return Math.random() * (high - low) + low;
}

async function createJob(file){
    
  let sleep = randomNumber(10,50);
  sleep = sleep/25;
  let a = randomInt(1,100);
  let b = randomInt(1,100);
  let c = randomInt(1,100);
  let d = randomInt(1,100); 
  let appendKey = randomNumber(a,b)*1000*randomNumber(c,d);
  let aK = "hash-"+appendKey;
  await resolveAfterXSeconds(sleep);

  let key = 'job-'+Date.now()+'-'+aK;
  jobNames.push(key);
  let value = 
  {
    fileName:file.fileName,
    originalname:file.originalName,
    state:stateEnum.WAITING

  }
  console.log(JSON.stringify(value));
  return redisClient.set(key,JSON.stringify(value),function(err,rep){
    contFinishRedis += 1;
    console.log(key+' is now on the Redis server.Redis response:'+rep);
  });  
  
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
    console.log(stderr);
    console.log(error); 
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


function sendMessage(URL,origin){

  request.get(URL,async function(error,res,body){
    
    try {
      let data = JSON.parse(res.body);
      
      dataNodes.set(origin,data);     
    
    } catch (error) {
      if(iHaveWorkers){
        console.log("removendo "+origin);
        dataNodes.delete(origin);
        nodes.splice(nodes.indexOf(origin));
        if(nodes.length==0){
          dataNodes = new Map();
          iHaveWorkers = false;
        }
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

//Endpoints
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}

function killAllNodes(){
  for(let n of nodes){
    let url = n+'kill';
    console.log("Kill "+n);
    request.get(url,function(e,r,re){
      console.log("Kiled")
    });
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
  let reqFaltante = allRequest.size - doneFIles.size;
  if(nodes.length == 0 && reqFaltante > 0){
    withoutWorkers +=1;
  }
  console.log(nodes.length, reqFaltante)
  if(nodes.length > 0 && reqFaltante == 0){
    killAllNodes();
  }
  if(nodes.length > reqFaltante){
    let i = randomInt(0,nodes.length-1);
    console.log("Killing "+nodes[i]);
    url = nodes[i] + 'kill';
    request.get(url,function(e,r,re){
      console.log("Kiled")
    });
  }
    if(withoutWorkers > 15 && reqFaltante > 0){
    verifyWorkers();
    withoutWorkers = 0;
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
  console.log(doneFIles);
  let r = JSON.stringify({msg:DEFINED_MSGS.OK});
  res.end(r);
});

app.post('verifyKeys',function(req,res){
  let r = verifyKeys();

  res.send(JSON.stringify(r));

});

app.post('/getMyconvertedFile',function(req,res){
  let key = JSON.parse(req.body.key);
  //if(contFinishUploades == allRequest.size){
   // verifyWorkers();
    //contFinishUploades = 0;
  //}
  if(doneFIles.has(key)){
    res.end(JSON.stringify({msg:DEFINED_MSGS.OK}));
  }else{
    res.end(JSON.stringify({msg:DEFINED_MSGS.NO}));
  }
});

app.get('/endUpload',async function(req,res){
    //verifyKeys();
    console.log("endUplaoa");
    verifyWorkers();
    res.status(200).end(JSON.stringify({msg:DEFINED_MSGS.OK}));  
});

app.get('/download/:key',function(req,res){
  let key = req.params.key;
  console.log(key);
  if(doneFIles.has(key)){
    //allRequest.delete(key);
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
  console.log("VerifyWorkers");
  let maxNodes = 15;
  let reqFaltante = allRequest.size - doneFIles.size;

  need = parseInt(''+reqFaltante/cargaTrabalho);
 
  if (need==0) need =1;

  if(need > nodes.length && nodes.length < maxNodes){ 
    need =  need - nodes.length;

    console.log("Criando");
    if(need > maxNodes) need  = maxNodes;
   
    console.log("Criando Workers "+need); 
    for(let i = 0;i < need; i++){
      await resolveAfterXSeconds(0.5);
      console.log("Criando Workers "+i);
      if(nodes.length < maxNodes){      
      createWork();  
      } 
    }
    await resolveAfterXSeconds(3);
    iHaveWorkers = true;

  }
  

}

//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}
cmdExecutor('node redisCleaner.js cls');

//Start Server
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}
app.listen(PORT, function () {
  console.log('Node.js server is running on port ' + PORT);
});
//{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}
