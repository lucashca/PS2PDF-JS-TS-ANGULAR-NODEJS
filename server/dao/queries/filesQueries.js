module.exports = {
    insert_file: `INSERT INTO file(originalName,mimeType,size,path,systemInfo,fileName,ipRequest,host,file,date) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    read_file: `SELECT * FROM file WHERE file.fileName = ?`,
    read_all: 'SELECT * FROM file;',
    insert: (originalName, mimeType, size, path, systemInfo, fileName, ipRequest, host, file, date) => {
        return 'INSERT INTO file("originalName", "mimeType", size, path, "fileName", "ipRequest", "systemInfo", host, date, file) VALUES(' +
            "'" + originalName + "','" + mimeType + "','" + size + "','" + path + "','" + fileName + "','" + ipRequest + "','" + systemInfo + "','" + host + "','" + date + "','" + file + "');"
    },
    readFile: (name) => {
        return "SELECT * FROM selectFile WHERE" + '"fileName"=' + "'" + name + "';"
    },
    getAllfiles: () => {
        return "SELECT * FROM selectFile;";
    },
    insertReq: (ipRequest, date, host) => {
        return 'INSERT INTO request("ip_request","date","host") values(' + "'" + ipRequest + "','" + date + "','" + host + "');"
    },
    insertFileInfo: (originalName, fileName, path) => {
        return 'INSERT INTO "fileInfo"("originalName","fileName",path) values(' + "'" + originalName + "','" + fileName + "','" + path + "');"
    }


}
