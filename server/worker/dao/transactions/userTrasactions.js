const dbConnection = require("../dbConnection");
const userQueries = require("../queries/userQueries");
const User = require("../../schemes/user")

module.exports = class UserDao {
  async saveEntity(entity) {
    typeof(entity) == User
    let con = await dbConnection();
    try {
      await con.query("START TRANSACTION");
      console.log(userQueries.insert_user,
        [entity.name, entity.email,entity.password])
      let savedUser = await con.query(
        userQueries.insert_user,
        [entity.name, entity.email,entity.password]
      );
      await con.query("COMMIT");
      entity.iduser = savedUser.insertId;
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

  async updateEntity(entity) {
    let con = await dbConnection();
    try {
      await con.query("START TRANSACTION");
      await con.query(userQueries.update_user, [
        entity.name,
        entity.email,
        entity.password,
        entity.id
      ]);
      await con.query("COMMIT");
      return true;
    } catch (error) {
        await con.query("ROLLBACK");
        console.log(error);
        throw error;
    } finally {
        await con.release();
        await con.destroy();
    }
  }
  async deleteEntity(id) {
    let con = await dbConnection();
    try {
      await con.query("START TRANSACTION");
      await con.query(userQueries.delete_user, [id]);
      await con.query("COMMIT");
      return true;
    } catch (error) {
      await con.query("ROLLBACK");
      console.log(error);
      throw error;
    } finally {
      await con.release();
      await con.destroy();
    }
  }
  async readEntities() {
    let con = await dbConnection();
    try {
      await con.query("START TRANSACTION");
      let user = await con.query(userQueries.read_user);
      await con.query("COMMIT");
      user = JSON.parse(JSON.stringify(user));
      return user;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await con.release();
      await con.destroy();
    }
  }
};