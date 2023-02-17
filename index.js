const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const {init: initDB, Counter, User, Essay} = require("./db");
const request = require('request');
const commonUtil = require('./utils');
const mpPayUtil = require('./utils/mpPayUtil');

const wx = {
    appid: 'wxfb1c7b400451534a',
    secret: '07ecee655886a2ee666f6348a544c2a6'
}

const baseUrl = "https://express-k32d-30706-7-1316829210.sh.run.tcloudbase.com";

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
    const {action} = req.body;
    if (action === "inc") {
        await Counter.create();
    } else if (action === "clear") {
        await Counter.destroy({
            truncate: true,
        });
    }
    res.send({
        code: 0,
        data: await Counter.count(),
    });
});

// 获取计数
app.get("/api/count", async (req, res) => {
    const result = await Counter.count();
    res.send({
        code: 0,
        data: result,
    });
});


/**
 * 获取小程序 openid & session_key
 * @return {*} code 小程序登陆 code
 */
app.get('/api/getSession', async (req, res) => {
    const {code} = req.query;
    // 获取code失败
    if (!code) return res.send({code: 1001, data: null, mess: '未获取到 code'});

    const sessionUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${wx.appid}&secret=${wx.secret}&js_code=${code}&grant_type=authorization_code`;
    // 发起 http 请求
    request.get(sessionUrl, (error, response, body) => {
        const resResult = commonUtil.handleWxResponse(error, response, body);
        res.send(resResult);
    })
});

/**
 * 授权登录
 * @param userInfo 用户信息 + openid
 */
app.get('/api/login', async (req, res) => {
    const uid = req.query.uid // 字符串转对象
    // 获取用户信息失败
    if (!uid) return res.send({code: 1001, data: null, mess: '用户信息不能为空'});

    // 查询当前用户是否已经注册
    const userResult = await User.findOrCreate({where: {uid: uid}});
    res.send(commonUtil.resSuccess(userResult));
});

app.get('/api/user/addCredit', async (req, res) => {
    const uid = req.query.uid // 字符串转对象
    const times = +req.query.times // 字符串转对象
    // 获取用户信息失败
    if (!uid || !times) return res.send({code: 1001, data: null, mess: '用户信息不能为空'});

    // 查询当前用户是否已经注册
    const user = await User.findOne({where: {uid: uid}});
    await user.increment('credit', {by: times})

    res.send(commonUtil.resSuccess(user));
});

app.get('/api/essay/getEssay', async (req, res) => {
    const uid = req.query.uid // 字符串转对象
    // 获取用户信息失败
    if (!uid) return res.send({code: 1001, data: null, mess: '用户信息不能为空'});
    try {
        // 查询当前用户是否已经注册
        const essays = await Essay.findAll({where: {authorId: uid}});
        res.send(commonUtil.resSuccess(essays));
    } catch (e) {
        res.send(commonUtil.resSuccess(e));
    }


});

app.post('/api/essay/addEssay', async (req, res) => {
    const title = req.body.title // 字符串转对象
    const body = req.body.body // 字符串转对象
    const uid = req.body.uid // 字符串转对象
    const id = req.body.id // 字符串转对象

    // 获取用户信息失败
    if (!uid) return res.send({code: 1001, data: null, mess: '用户信息不能为空'});

    // 查询当前用户是否已经注册
    try {
        const essay = await Essay.create({title, body, authorId: uid, id});

        res.send(commonUtil.resSuccess(essay));
    } catch (e) {
        res.send(commonUtil.resSuccess(e));
    }

});


app.get('/api/essay/removeEssay', async (req, res) => {
    const id = req.query.id // 字符串转对象

    // 获取用户信息失败
    if (!id) return res.send({code: 1001, data: null, mess: 'id不能为空'});

    try {
        // 查询当前用户是否已经注册
        const essay = await Essay.destroy({where: {id: id}});

        res.send(commonUtil.resSuccess(essay));
    } catch (e) {
        res.send(commonUtil.resSuccess(e));
    }

});

app.post('/api/essay/updateEssay', async (req, res) => {
    const id = req.body.id // 字符串转对象
    const title = req.body.title // 字符串转对象
    const body = req.body.body // 字符串转对象
    // 获取用户信息失败
    if (!id) return res.send({code: 1001, data: null, mess: 'id不能为空'});

    try {
        // 查询当前用户是否已经注册
        const essay = await Essay.update({title, body}, {where: {id: id}});

        res.send(commonUtil.resSuccess(essay));
    } catch (e) {
        res.send(commonUtil.resSuccess(e));
    }

});


app.get('/api/essay/score', async (req, res) => {
    const id = req.body.id // 字符串转对象
    if (!id) return res.send({code: 1001, data: null, mess: 'id不能为空'});
    const essay = await Essay.findOne({where: {id: id}});
    await essay.update({score: true}, {where: {id: id}});

    res.send(commonUtil.resSuccess(essay));
});

/**
 * 微信支付下单 获取小程序端支付所需参数
 */
app.get('/api/v2Pay', async (req, res) => {
    const openid = req.query.uid; // 用户的 openid
    const total_fee = Number(req.query.money) * 100; // 支付金额 单位为分
    const attach = '支付附加数据'; // 附加数据
    const body = '小程序支付';  // 主体内容
    const notify_url = `${baseUrl}/api/payCallback`; // 异步接收微信支付结果通知的回调地址，通知 url必须为外网可访问的url，不能携带参数。公网域名必须为 https
    const spbill_create_ip = '124.223.121.60'; // 终端ip (可填本地路由 ip)


    const param = {openid, attach, body, total_fee, notify_url, spbill_create_ip};
    const payParam = await mpPayUtil.v2getPayParam(param);
    if (!payParam) return res.send(commonUtil.resFail('创建支付订单出错'));

    res.send(commonUtil.resSuccess(payParam));
});

/**
 * 支付结果通知 (需保证小程序上线后才能回调) 需要为 POST
 * 返回结果格式为 XML
 *
 * 此接口中编写相关业务逻辑、如支付成功后写入数据库等操作
 * https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_7&index=8
 */
app.post('/api/payCallback', async (req, res) => {
    // json 转 xml
    const _json2Xml = json => {
        let _xml = '';
        Object.keys(json).map((key) => {
            _xml += `<${key}>${json[key]}</${key}>`
        });
        return `<xml>${_xml}</xml>`;
    }
    const sendData = {return_code: 'SUCCESS', return_msg: 'OK'};
    res.end(_json2Xml(sendData));
});


// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
    if (req.headers["x-wx-source"]) {
        res.send(req.headers["x-wx-openid"]);
    }
});

const port = process.env.PORT || 80;

async function bootstrap() {
    await initDB();
    app.listen(port, () => {
        console.log("启动成功", port);
    });
}

bootstrap();
