const dbConnection = require("../dbConnection");
const fileQueries = require("../queries/filesQueries");

module.exports = class FileDao {
  async saveEntity(entity) {
    let con = await dbConnection();
    try {
      await con.query("START TRANSACTION");
      
      let savedFile = await con.query(
        fileQueries.insert_file,
        [entity.originalName, entity.mimeType,entity.size,entity.path,entity.sysInfo,entity.fileName,entity.ipRequest,entity.host,entity.file,entity.date]
      );
      await con.query("COMMIT");
      entity.idfiles = savedFile.insertId;
      return entity;
    } catch (error) {
        await con.query("ROLLBACK");
        console.log(error);
        throw error;
    } finally {
        await con.release();
        await con.destroy();
    }
  }
  async readEntities(idfiles) {
    let con = await dbConnection();
    try {
      await con.query("START TRANSACTION");
      let file = await con.query(fileQueries.read_file,[idfiles]);
      await con.query("COMMIT");
      file = JSON.parse(JSON.stringify(file));
      return file;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await con.release();
      await con.destroy();
    }
  }

  async getAllFiles(){
    let con = await dbConnection();
    try {
      await con.query("START TRANSACTION");
      let file = await con.query(fileQueries.read_all);
      await con.query("COMMIT");
      file = JSON.parse(JSON.stringify(file));
      return file;
    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        await con.release();
        await con.destroy();
    }

  }



};