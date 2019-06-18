module.exports = {
    insert_file: `INSERT INTO files(name,size,format,date,file,user_iduser) VALUES(?,?,?,?,?,?)`,
    read_file: `SELECT * FROM files WHERE files.idfiles = ?`,
    read_all:'SELECT * FROM files;'

}
