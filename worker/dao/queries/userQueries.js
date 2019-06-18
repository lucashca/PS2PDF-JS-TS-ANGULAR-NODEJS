module.exports = {
    insert_user: `INSERT INTO user(name,email,password) VALUES(?, ?,?)`,
    read_user: `SELECT * FROM user`,
    update_user: `UPDATE user SET user.name = ?, user.email = ?,user.password = ? WHERE user.iduser = ?`,
    delete_user: `DELETE FROM user WHERE user.iduser = ?`
}

