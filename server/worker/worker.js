
const File = require('./schemes/file');

const fs = require('fs');

class Worker{

    fileIn = null;
    fileOut = null;
    idFile = 0;
    tempDataPath = "./dataFolder/";
     

    constructor(){
    
    }
   
    getJob(){
        //Do Something

        return fileId;


    }

    getFileInDB(idFile){
        let file = await fileDao.readEntities(idFile)[0];
        return file;
    }

    decodeFile(file){
        data = file.file;
        var decodedFile = new Buffer(data, 'base64').toString('binary');
        file.file = decodedFile;
        return file;   
    }

    createTempFile(file){
        filename = file.name;
        format = file.format;
        data = file.file;
        path = this.tempDataPath + format+"/"+filename+"."+format;
        fs.writeFileSync(path,data,() => {
            if(err) throw err;
        });
    }

    convertPSToPDF(file){
        
        filename = file.name;
        pathIn = this.tempDataPath +"ps/"+filename+".ps";
        pathOut = this.tempDataPath +"pdf/myconverter-"+filename+".pdf";
        cmd = "ps2pdf "+pathIn+" "+pathOut;
        child = exec(cmd, function (error, stdout, stderr) {
            console.log('stdout: ' + stdout)
            console.log('stderr: ' + stderr)
            if (error !== null) {
              console.log('exec error: ' + error);
            }
        });
        
    }

    convertPDFToPS(file){
        filename = file.name;
        pathIn = this.tempDataPath +"pdf/"+filename+".pdf";
        pathOut = this.tempDataPath +"ps/myconverter-"+filename+".ps";
        cmd = "pdf2ps "+pathIn+" "+pathOut;
        child = exec(cmd, function (error, stdout, stderr) {
            console.log('stdout: ' + stdout)
            console.log('stderr: ' + stderr)
            if (error !== null) {
              console.log('exec error: ' + error);
            }
        });
    }

    saveFileInDataBase(file){
        path = this.tempDataPath + format+"/"+filename+"."+format;
        
        var size = fs.statSync(filePath).size;
    }

    changeStatusOfJob(status){

    }


}

