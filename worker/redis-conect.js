
const redis = require('redis');
var client = redis.createClient();

function set(key,value){
    client.set(key,value);
}

async function get(key){
    k = "";
    await client.GET(key,function(err,reply){
        if (err) return console.log(err);
        k = reply;
        console.log(reply);
    });
    return k;
}

async function getAllKeys(){
    allKeys = "";
    await client.keys('*', function (err, keys) {
        if (err) return console.log(err);
      
        allKeys = keys;
        
    }); 
    return allKeys;
}



set("Lucas","veronica");
set("L2","V");
console.log("Key",get("Lucas"));
//console.log(getAllKeys());