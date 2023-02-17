const { Sequelize, DataTypes } = require("sequelize");

// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

const [host, port] = MYSQL_ADDRESS.split(":");

const sequelize = new Sequelize("nodejs_demo", MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: "mysql" /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
});

// 定义数据模型
const Counter = sequelize.define("Counter", {
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

const Essay = sequelize.define("Essay", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  body: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  score: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  updatedAt: {
    type: DataTypes.TIME,
    defaultValue: new Date(),
  },
  createdAt: {
    type: DataTypes.TIME,
    defaultValue: new Date(),
  }
});

const User = sequelize.define("User", {
  uid: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true
  },
  credit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
  },
  serviceNo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
});

// 数据库初始化方法
async function init() {
  await Essay.sync({ alter: true })
  await Counter.sync({ alter: true });
  await User.sync({ alter: true });
}

// 导出初始化方法和模型
module.exports = {
  init,
  Essay,
  Counter,
  User
};
