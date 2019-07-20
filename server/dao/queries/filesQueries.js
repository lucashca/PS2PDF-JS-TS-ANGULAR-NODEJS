module.exports = {
    insert_file: `INSERT INTO file(originalName,mimeType,size,path,systemInfo,fileName,ipRequest,host,file,date) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    read_file: `SELECT * FROM file WHERE files.fileName = ?`,
    read_all:'SELECT * FROM file;'
}
