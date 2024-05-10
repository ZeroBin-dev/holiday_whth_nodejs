const oracleDB = require('oracledb');

async function init() {
    oracleDB.initOracleClient({ libDir: '../lib/instantclient_21_13' });

    await oracleDB.createPool({
        user: 'pharmorder',
        password: 'cresoty',
        connectionString: '220.86.83.22:65065/ebiz',
        poolAlias: 'default'
    });
}

async function close() {
    await oracleDB.getPool().close();
}

async function getConnection() {
    let connection;
    try {
        connection = await oracleDB.getConnection();
        return connection;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports = {
    init: init,
    close: close,
    getConnection: getConnection
}