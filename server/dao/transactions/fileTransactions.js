const dbConnection = require("../dbConnection");
const fileQueries = require("../queries/filesQueries");




module.exports = class FileDao {

  async saveReq(entity) {
    let con = await dbConnection();
    try {
      let query = fileQueries.insertReq(entity.ipRequest, entity.date, entity.host)
      let savedFile = await con.query(query)
    } catch (error) {
      console.log("Save file")
      console.log(error);
      throw error;
    } finally {
      //await con.release();
      //await con.destroy();
    }
  }

  async saveFileInfo(entity) {
    let con = await dbConnection();
    try {
      let query = fileQueries.insertFileInfo(entity.originalName, entity.fileName, entity.path)
      let savedFile = await con.query(query)
    } catch (error) {
      console.log("Save file")
      console.log(error);
      throw error;
    } finally {
      //await con.release();
      //await con.destroy();
    }
  }

  async saveEntity(entity) {
    let con = await dbConnection();
    try {


      await con.query("START TRANSACTION");

      entity.file = '\\x' + entity.file;


      let query = fileQueries.insert(entity.originalName, entity.mimeType, entity.size, entity.path, entity.sysInfo, entity.fileName, entity.ipRequest, entity.host, entity.file, entity.date)
      let savedFile = await con.query(query)

      /*let savedFile = await con.query(
        fileQueries.insert_file,
        [entity.originalName, entity.mimeType, entity.size, entity.path, entity.sysInfo, entity.fileName, entity.ipRequest, entity.host, entity.file, entity.date]
      );*/

      await con.query("COMMIT");
      entity.idfiles = savedFile.insertId;
      return entity;
    } catch (error) {
      await con.query("ROLLBACK");
      console.log("Save file")
      console.log(error);
      throw error;
    } finally {
      //await con.release();
      //await con.destroy();
    }
  }
  async readEntities(idfiles) {
    let con = await dbConnection();
    try {
      await con.query("START TRANSACTION");
      let query = fileQueries.readFile(idfiles)
      console.log(query)
      let file = await con.query(query)
      //let file = await con.query(fileQueries.read_file, [idfiles]);
      await con.query("COMMIT");
      file = JSON.parse(JSON.stringify(file));
      return file;
    } catch (error) {
      console.log("Erro readFile")
      console.log(error);
      throw error;
    } finally {
      //await con.release();
      //await con.destroy();
    }
  }

  async getAllFiles() {
    let con = await dbConnection();
    try {
      await con.query("START TRANSACTION");
      let query = fileQueries.getAllfiles();
      //let file = await con.query(fileQueries.read_all);
      let file = await con.query(query);

      await con.query("COMMIT");
      file = JSON.parse(JSON.stringify(file));
      return file;
    } catch (error) {
      console.log("Erro allFIles")
      console.log(error);
      throw error;
    } finally {
      //await con.release();
      //await con.destroy();
    }

  }



};