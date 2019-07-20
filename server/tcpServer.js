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

//*********************************************************


//Setup
//*********************************************************
const PORT = process.env.PORT || 4000;
const DIR = './uploads';
const fileDao = new FileDao();
const app = express();
const redisClient = redis.createClient();



const stateEnum = {
  WAITING:'WAITING',
  IN_PROGRESS:'progress',
  READY:'ready'
}


createMasterWork();

//*********************************************************


//Set Middlewares
//*********************************************************
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Set Cors
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
//*********************************************************

//Functions and Utils
//*********************************************************

function saveFile(file){
  fileDao.saveEntity(file);
}

function createFileData(req){
  let path = req.file.path;
  var f = fs.readFileSync(path,"utf8");
  let file = new FileEntity(req.file.originalname,req.file.mimetype,req.file.size,req.file.path,req.rawHeaders[9],req.file.filename,req.connection.remoteAddress,req.headers.host,f,new Date())
  saveFile(file);
  createJob(file);
}


function createJob(file){
  let value = 
  {
    path:file.path,
    state:stateEnum.WAITING
  }
  redisClient.set(file.fileName,JSON.stringify(value));  
  
}


function createMasterWork(){

  cmd = "node worker.js master";
  child = cmdExecutor(cmd, function (error, stdout, stderr) {
      console.log('stdout: ' + stdout)
      console.log('stderr: ' + stderr)
      if (error !== null) {
        console.log('exec error: ' + error);
      }
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
app.get('/api', function (req, res) {
  res.end('file catcher example');
});
 
app.post('/api/upload',upload.single('file'), function (req, res) {
    if (!req.file) {
        console.log("No file received");
        return res.send({
          success: false
        });
    
      } else { 
        createFileData(req); 
        return res.send({
          success: true,
          fileName:req.file.filename,
        })
      }
});

//***********************************************************

//Start Server
//***********************************************************
app.listen(PORT, function () {
  console.log('Node.js server is running on port ' + PORT);
});
//***********************************************************
