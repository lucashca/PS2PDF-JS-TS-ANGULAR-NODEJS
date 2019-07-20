
module.exports = class FileEntity {
    constructor(originalName, mimeType,size,path,sysInfo,fileName,ipRequest,host,file,date) {
      this.originalName = originalName;
      this.mimeType = mimeType;
      this.size = size;
      this.path = path;
      this.sysInfo = sysInfo;
      this.fileName = fileName;
      this.ipRequest = ipRequest;
      this.host = host;
      this.file = file;
      this.date = date;
    }
  }

