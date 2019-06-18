// Author Lucas Henrique Costa Araújo
// Date 17/06/2019


const UserDao = require("./dao/transactions/userTrasactions");
const userDao = new UserDao();
const FileDao = require("./dao/transactions/fileTransactions")
const fileDao = new FileDao();

var sys = require('sys')
var exec = require('child_process').exec;
var child;

const fs = require('fs');



filePath = "./dataFolder/ps/a.ps"

var size = fs.statSync(filePath).size;
var file = fs.readFileSync(filePath,"utf8");

console.log(file)
//var file = new Buffer(file, 'binary').toString('base64');
    

const app = async () => {
    let savedUser = await userDao.saveEntity({
        name: "Luacs ",
        email: "lucas@lucas",
        password:"senha"
    });
    console.log("Saved todo --> ", savedUser)

    savedUser.completed = 1;
    let isUpdated = await userDao.updateEntity(savedUser);
    console.log("Is it updated --> ", isUpdated);

    let todoList = await userDao.readEntities();
    console.log("List of todo --> ", todoList);

    let isDeleted = await userDao.deleteEntity(savedUser.id);
    console.log("Is it deleted --> ", isDeleted)

}


const app2 = async () => {
    let savedFiles = await fileDao.saveEntity({
        name: "Luacs",
        size: size,
        format:"ps",
        date:new Date(),
        file:file,
        user_iduser: "1"
    });
    //console.log("Saved todo --> ", savedUser)
    let files = await fileDao.readEntities(savedFiles.idfiles);
    //console.log("File -->",files[0].file.data);
    name = files[0].name;
    format = files[0].format;
    encode = files[0].file.data;
    // Decode from base64
    // console.log(encode);
    var decodedFile = new Buffer(encode, 'base64').toString('binary');
    //console.log(decodedFile);
    fileName = name +"-bd."+ format;
    //console.log(fileName);
    fs.writeFile("./dataFolder/ps/"+fileName, decodedFile, (err) => {
        if (err) throw err;
    
        console.log("The file was succesfully saved!");
        cmd = "ps2pdf ./dataFolder/ps/"+fileName+ " ./dataFolder/pdf/"+name+"-bd.pdf";
        child = exec(cmd, function (error, stdout, stderr) {
        console.log('stdout: ' + stdout)
        console.log('stderr: ' + stderr)

        if (error !== null) {
          console.log('exec error: ' + error);
        }
    });

    }); 

    
    //let filesList = await fileDao.getAllFiles();
   // console.log("Files --> ",filesList);
    
}
 
//app();
app2();