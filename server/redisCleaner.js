
const redis = require('redis');
const redisClient = redis.createClient();


const stateEnum = {
    WAITING:'waiting',
    IN_PROGRESS:'progress',
    DONE:'done'
}

allKeys = [];
contador = 0;
contDel = 0;

var allProgrees = [];

async function getAllKeys(callback){
    redisClient.keys('*',function (err, keys) {
        if (err){
            console.log(err);
        }else{
             callback(keys);
       }
    });
}
function getAllValues(){
    for(let k of allKeys){
        if(k.state == stateEnum.WAITING){
            getValue(k.key,function(key,value){
                allData.push({key:key,value:value});
            });
        }
    }
}

async function getValue(key,callback){
    redisClient.GET(key,function(err,reply){
        if (err) return console.log(err);
        callback(key,reply);   
     
    });
}

async function cleanCache(keys){
    let i = 0;
    for(let k of keys){
        i +=1;
        console.log("deletando"+k+" i "+i);
        redisClient.del(k);
    }
}

function resolveAfterXSeconds(x) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(x);
      }, x * 1000);
    });
}

function callbackGetAllKeys(key){
    allKeys = key;
}

function callbackCleanCache(res){
    contador +=1;
    console.log(contador);
    console.log(allKeys.length);
    if(contador == allKeys.length){
        process.exit(0);
    }
}


async function start(){
    getAllKeys(callbackGetAllKeys);
    await resolveAfterXSeconds(2);
    if(contador == allKeys.length){
        console.log("Nenhuma chave encontrada!");
        process.exit(0);
    }
    cleanCache(allKeys,callbackCleanCache);
}

function filterAllKeys(){
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
    let auxData = [];
    let progressData = [];
    for(let d of allData){
        d.value = JSON.parse(d.value);
        if (d.value.state == stateEnum.WAITING){
            auxData.push(d);
        }
        if(d.value.state == stateEnum.IN_PROGRESS){
            progressData.push(d);
        }
    }
    allProgrees = progressData;
    jobs = auxData;
}

async function init(){
    allKeys = [];
    allData = [];
    jobs = [];
    job = null;
  
   
    getAllKeys(callbackGetAllKeys);

    let cont = 0;
    while(allKeys.length == 0) {
        if(cont%5==0){
            getAllKeys(callbackGetAllKeys);
        }
        await resolveAfterXSeconds(1);
    }

    filterAllKeys();
    getAllValues();
    
    while(allData.length == 0) await resolveAfterXSeconds(1);
    console.log("Jobs in the pile");
    console.log(allData);
    filterAllData();
    console.log("Jobs to be done");
    console.log(jobs);
    console.log("Jobs in progress")
    console.log(allProgrees);
    console.log("Total Jobs to be done "+jobs.length);
    console.log("Total Jobs"+allData.length);
    console.log("Total Jobs in progress"+allProgrees.length);
    
    
    
}


if(process.argv[2]=="cls"){
    start();
}
if(process.argv[2]=="ini"){
    init();;
}

