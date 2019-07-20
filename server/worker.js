

const redis = require('redis');

const redisClient = redis.createClient();

this.allKeys;


function set(key,value){
    redisClient.set(key,value);
}

async function get(key){
    k = "";
    await redisClient.GET(key,function(err,reply){
        if (err) return console.log(err);
        k = reply;
        console.log(reply);
    });
    return k;
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

function convertPS2PDF(){

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




async function work(){
    getAllKeys(function (key){
        this.allKeys = key;
    });
    while(this.allKeys == undefined){
        const value =  await resolveAfterXSeconds(1);
        console.log(this.allKeys);
    }


}

work();