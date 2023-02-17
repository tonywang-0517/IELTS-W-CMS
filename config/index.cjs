const { APPID,APPSECRET,MCHID,MCHKEY } = process.env;


module.exports = {
    // baseUrl: 'http://x.x.x.x:3000',
    baseUrl: 'https://express-k32d-30706-7-1316829210.sh.run.tcloudbase.com', // 本机路由ip域名 + 端口
    // 微信小程序
    mp: {
        appId:APPID, // 微信小程序 appid (个人)
        appSecret:APPSECRET
    },
    // 商户号信息
    mch: {
        mchId: MCHID, // 商户 id
        mchKey: MCHKEY // 商户 key
    },
}
