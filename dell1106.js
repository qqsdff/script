/*
 * @Author: qqsdf 
 * @Date: 2020-11-12 10:00:00 
 */

/**
 
 本代码基于大佬lxk0301
 https://github.com/lxk0301/jd_scripts
 
 
 戴尔新品上市脚本 https://raw.githubusercontent.com/qqsdff/script/main/dell1106.js
 活动地址：https://computerdigital.m.jd.com/#/share?shareId=284af206-3a85-4697-adde-195291ef8128&activityId=dell1106&t=1605143153710
 活动时间截止：2020年11月13日 23:59:59
 出现任务做完没领取的情况，就再运行一次脚本，脚本会给内置的shareId助力,介意请删除
 支持京东双账号
 脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
 
 // quantumultx
 [task_local]
 #戴尔新品上市
 2 0 * * * https://raw.githubusercontent.com/qqsdff/script/main/dell1106.js, tag=戴尔新品上市, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/jd.png,enabled=true
 
 // Loon
 [Script]
 cron "2 0 * * *" script-path=https://raw.githubusercontent.com/qqsdff/script/main/dell1106.js,tag=戴尔新品上市
 
 // Surge
 戴尔新品上市 = type=cron,cronexp=2 0 * * *,wake-system=1,timeout=320,script-path=https://raw.githubusercontent.com/qqsdff/script/main/dell1106.js
 
 // JSBox
 请把cookie 填入数组cookiesArr，
 **/

//设置cookie
let cookiesArr = [];

const $= new Env('戴尔新品上市');
const shareID = [];
const activeID = 'dell1106';
const activeEndTime = '2020/11/13 23:59:59';
const JD_API_HOST = 'https://computerdigital.m.jd.com/acd';
let cookie = '';

const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

function init() {
    initCookie(); 
	!(async() =>{
        if (!cookiesArr[0]) {
            $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
            return;
        }
        for (let i = 0; i < cookiesArr.length; i++) {
            if (cookiesArr[i]) {
                cookie = cookiesArr[i];
                $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
				$.index = i + 1;
                $.beanCount = 0;
                $.jdNum = 0;
                $.isLogin = true;
                $.nickName = '';
                const beforeTotal = await TotalBean();
				console.log(`\n =====开始【京东账号${$.index}】${$.nickName || $.UserName} =====\n`);
				//获取助力码
				var resp = await doPost(`${JD_API_HOST}/task/getSupport?t=${Date.now()}`, `activityId=${activeID}`);
				if(resp.code===200){
					console.log(`\n 助力码【${resp.data.shareId}】\n`);
				}
                if (!$.isLogin) {
                    $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index}${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {"open-url": "https://bean.m.jd.com/"});
                    $.setdata('', `CookieJD${i ? i + 1 : ""}`); //cookie失效，故清空cookie。
                    if ($.isNode()) await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
                    continue
                }
                $.beanCount = beforeTotal && beforeTotal['base'].jdNum;
                for(let item of shareID){
                await doPost(`${JD_API_HOST}/task/doSupport?t=${Date.now()}`, `shareId=${item}&activityId=${activeID}`);}
                await doJob();
                console.log(`\n等待8秒后，再去领取奖励\n`);
				console.log(`做任务之前京豆总计: ${$.beanCount}`);
				await $.wait(8000);
                await doJob();
                const afterTotal = await TotalBean();
                $.jdNum = afterTotal['base'].jdNum;
                await showMsg();
            }
        }
    })().
    catch((e) =>{
         $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    }).
    finally(() =>{
        $.done();
    })

}

async function doJob() {
    var homeData= await doPost(`${JD_API_HOST}/task/indexInfo?t=${Date.now()}`,`activityId=${activeID}`);
    
    if (homeData.code === 200) {
const presellInfoList=homeData.data.presellInfoVO.presellInfoList;
		const shopInfoList=homeData.data.shopInfoList.shopInfoList;
		const meetingInfoList=homeData.data.meetingInfoList.meetingInfoList;
        for (let item of presellInfoList) {
            console.log(`\n任务一：浏览商品${
                item['skuDescribe']
            }`) ;
			if (item['status'] === 1) {
                await doPost(`${JD_API_HOST}/index/browseSku?t=${Date.now()}`,`skuId=${item.skuId}&activityId=${activeID}`);
            }else
            if (item['status'] === 3) {
                await doPost(`${JD_API_HOST}/task/getPrize?t=${Date.now()}`,`id=${item.skuId}&activityId=${activeID}&type=0`);
            }else
            if (item['status'] === 4) {
                console.log(`此任务已做完，跳过`);
            }
        }

        for (let item of shopInfoList) {
            console.log('\n任务二：加入店铺会员，可能有问题');
			await doPost(`${JD_API_HOST}/task/getPrize?t=${Date.now()}`,`id=${item.shopId}&activityId=${activeID}&type=2`);
        }

        for (let item of meetingInfoList) {
            console.log(`\n任务三：浏览会场${
                item['meetingName']
            }`);
			if (item['status'] === 2) {
                await doPost(`${JD_API_HOST}/task/toBrowseMeeting?t=${Date.now()}`,`meetingId=${item.meetingId}&activityId=${activeID}`);
            }else
            if (item['status'] === 3) {
                await doPost(`${JD_API_HOST}/task/getPrize?t=${Date.now()}`,`id=${item.meetingId}&activityId=${activeID}&type=3`);
            }else
            if (item['status'] === 4) {
                console.log(`此任务已做完，跳过`);
            }
        }
	 console.log('\n任务四：关注公众号，可能有问题');
	 await doPost(`${JD_API_HOST}/task/getPrize?t=${Date.now()}`,`id=0&activityId=${activeID}&type=4`);
    }
}
function doPost(url, body) {
    var options = {
        url: url,
        body: body,
        headers: {
            "Accept": "application/json,text/plain, */*",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-cn",
            "Connection": "keep-alive",
            "Cookie": cookie,
            "Host": "computerdigital.m.jd.com",
            "Referer": "https://computerdigital.m.jd.com/?reloadWQPage=t_1605142940267",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        }
    };
    return new Promise(async resolve =>{
        $.post(options, (err, resp, data) =>{
            try {
                if (err) {
                    console.log(`${url}-----${JSON.stringify(err)}`);
					console.log(`${$.name} API请求失败，请检查网路重试`);
                } else {
                    //console.log(`做任务结果:${data}`);
                    data = JSON.parse(data);
                }
            } catch(e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}
//获取京豆
function TotalBean() {
    return new Promise(async resolve =>{
        const options = {
            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
            }
        }
        $.post(options, (err, resp, data) =>{
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`);
					console.log(`${$.name} API请求失败，请检查网路重试`);
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === 13) {
                            $.isLogin = false; //cookie过期
                            return
                        }
                        $.nickName = data['base'].nickname;
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch(e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

//显示信息
async function showMsg() {
   console.log(`\n做任务之前京豆总计:${$.beanCount}`)
  console.log(`做完任务后京豆总计:${$.jdNum}`);
  console.log(`活动活动京豆数量:${$.jdNum - $.beanCount}`);
    let nowTime = Date.now();
    const zone = new Date().getTimezoneOffset();
    if (zone === 0) {
        nowTime += 28800000; //UTC-0时区加上8个小时
    }
    if (nowTime > new Date(activeEndTime).getTime()) {
        $.msg($.name, '活动已结束', `请删除或禁用此脚本\n如果帮助到您可以点下🌟STAR鼓励我一下, 谢谢\n咱江湖再见\nhttps: //github.com/lxk0301/jd_scripts`, {"open-url": "https://github.com/lxk0301/jd_scripts"});
        if ($.isNode()) await notify.sendNotify($.name + '活动已结束', `请删除此脚本\n如果帮助到您可以点下🌟STAR鼓励我一下, 谢谢\n咱江湖再见\nhttps: //github.com/lxk0301/jd_scripts`)
    } else {
        $.msg($.name, `账号${$.index} ${$.nickName || $.UserName}`, `做任务之前京豆总计:${$.beanCount}\n做完任务后京豆总计:${$.jdNum}\n${($.jdNum - $.beanCount) > 0 ? `获得京豆：${$.jdNum - $.beanCount}京豆 🐶(仅供参考)\n` : ''}京豆先到先得\n活动地址点击弹窗跳转后即可查看\n注：如未获得京豆就是已被分完`, {"open-url": "https://prodev.m.jd.com/mall/active/3gSzKSnvrrhYushciUpzHcDnkYE3/index.html"})
    if ($.isNode()) await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}`, `账号${$.index} ${$.nickName || $.UserName}\n做任务之前京豆总计:${$.beanCount}\n做完任务后京豆总计:${$.jdNum}\n${($.jdNum - $.beanCount) > 0 ? `获得京豆：${$.jdNum - $.beanCount}京豆 🐶(仅供参考)\n` : ''}京豆先到先得\n注：如未获得京豆就是已被分完\n活动地址：https://computerdigital.m.jd.com/#/?activityId=dell1106`)
    }
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
      return [];
    }
  }
}
//初始化cookie
function initCookie() {
    if ($.isJsbox()) {

} else if ($.isNode()) {
        Object.keys(jdCookieNode).forEach((item) =>{
            cookiesArr.push(jdCookieNode[item])
        }) ;
		if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () =>{};
    } else {
        let cookiesData = $.getdata('CookiesJD') || "[]";
        cookiesData = jsonParse(cookiesData);
        cookiesArr = cookiesData.map(item =>item.cookie);
        cookiesArr.push($.getdata('CookieJD'));
        cookiesArr.push($.getdata('CookieJD2'));
    }

}

init();




function Env(t, e) {
    class s {
        constructor(t) {
            this.env = t
        }
        send(t, e = "GET") {
            t = "string" == typeof t ? {
                url: t
            }: t;
            let s = this.get;
            return "POST" === e && (s = this.post),
            new Promise((e, i) =>{
                s.call(this, t, (t, s, r) =>{
                    t ? i(t) : e(s)
                })
            })
        }
        get(t) {
            return this.send.call(this.env, t)
        }
        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }
    return new class {
        constructor(t, e) {
            this.name = t,
            this.http = new s(this),
            this.data = null,
            this.dataFile = "box.dat",
            this.logs = [],
            this.isMute = !1,
            this.isNeedRewrite = !1,
            this.logSeparator = "\n",
            this.startTime = (new Date).getTime(),
            Object.assign(this, e),
            this.log("", `🔔${this.name},开始 ! `)
        }
        isNode() {
            return "undefined" != typeof module && !!module.exports
        }
        isQuanX() {
            return "undefined" != typeof $task
        }
        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }
        isLoon() {
            return "undefined" != typeof $loon
        }
        isJsbox() {
            return typeof $app != "undefined" && typeof $http != "undefined";
        }
        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }
        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }
        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try {
                s = JSON.parse(this.getdata(t))
            } catch {}
            return s
        }
        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return ! 1
            }
        }
        getScript(t) {
            return new Promise(e =>{
                this.get({
                    url: t
                },
                (t, s, i) =>e(i))
            })
        }
        runScript(t, e) {
            return new Promise(s =>{
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r: 20,
                r = e && e.timeout ? e.timeout: r;
                const[o, h] = i.split("@"),
                a = {
                    url: `http: //${h}/v1/scripting/evaluate`,
                    body: {
                        script_text: t,
                        mock_type: "cron",
                        timeout: r
                    },
                    headers: {
                        "X-Key": o,
                        Accept: "*/*"
                    }
                };
                this.post(a, (t, e, i) =>s(i))
            }).
            catch(t =>this.logErr(t))
        }
        loaddata() {
            if (!this.isNode()) return {}; {
                this.fs = this.fs ? this.fs: require("fs"),
                this.path = this.path ? this.path: require("path");
                const t = this.path.resolve(this.dataFile),
                e = this.path.resolve(process.cwd(), this.dataFile),
                s = this.fs.existsSync(t),
                i = !s && this.fs.existsSync(e);
                if (!s && !i) return {}; {
                    const i = s ? t: e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch(t) {
                        return {}
                    }
                }
            }
        }
        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs: require("fs"),
                this.path = this.path ? this.path: require("path");
                const t = this.path.resolve(this.dataFile),
                e = this.path.resolve(process.cwd(), this.dataFile),
                s = this.fs.existsSync(t),
                i = !s && this.fs.existsSync(e),
                r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }
        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i) if (r = Object(r)[t], void 0 === r) return s;
            return r
        }
        lodash_set(t, e, s) {
            return Object(t) !== t ? t: (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) =>Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {},
            t)[e[e.length - 1]] = s, t)
        }
        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const[, s, i] = /^@(.*?)\.(.*?)$/.exec(t),
                r = s ? this.getval(s) : "";
                if (r) try {
                    const t = JSON.parse(r);
                    e = t ? this.lodash_get(t, i, "") : e
                } catch(t) {
                    e = ""
                }
            }
            return e
        }
        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const[, i, r] = /^@(.*?)\.(.*?)$/.exec(e),
                o = this.getval(i),
                h = i ? "null" === o ? null: o || "{}": "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t),
                    s = this.setval(JSON.stringify(e), i)
                } catch(e) {
                    const o = {};
                    this.lodash_set(o, r, t),
                    s = this.setval(JSON.stringify(o), i)
                }
            } else s = this.setval(t, e);
            return s
        }
        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }
        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }
        initGotEnv(t) {
            this.got = this.got ? this.got: require("got"),
            this.cktough = this.cktough ? this.cktough: require("tough-cookie"),
            this.ckjar = this.ckjar ? this.ckjar: new this.cktough.CookieJar,
            t && (t.headers = t.headers ? t.headers: {},
            void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }
        get(t, e = (() =>{})) {
            if (this.isJsbox()) {
                t["header"] = t["headers"];
                t["handler"] = function(resp) {
                    let error = resp.error;
                    if (error) 
						error = JSON.stringify(resp.error);
						let body = resp.data;
                    if (typeof body == "object") 
						body = JSON.stringify(resp.data);
						e(error, resp.response, body);
                }
                $http.get(t);

            } else {
                t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]),
                this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {},
                Object.assign(t.headers, {
                    "X-Surge-Skip-Scripting": !1
                })), $httpClient.get(t, (t, s, i) =>{ ! t && s && (s.body = i, s.statusCode = s.status),
                    e(t, s, i)
                })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {},
                Object.assign(t.opts, {
                    hints: !1
                })), $task.fetch(t).then(t =>{
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    },
                    o)
                },
                t =>e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) =>{
                    try {
                        if (t.headers["set-cookie"]) {
                            const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                            this.ckjar.setCookieSync(s, null),
                            e.cookieJar = this.ckjar
                        }
                    } catch(t) {
                        this.logErr(t)
                    }
                }).then(t =>{
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    },
                    o)
                },
                t =>{
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                }))
            }
        }
        post(t, e = (() =>{})) {
            if (this.isJsbox()) {
                t["header"] = t["headers"];
                t["handler"] = function(resp) {
                    let error = resp.error;
                    if (error) 
						error = JSON.stringify(resp.error);
						let body = resp.data;
                    if (typeof body == "object") 
						body = JSON.stringify(resp.data);
						e(error, resp.response, body);
                }
                $http.post(t);
            } else if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {},
            Object.assign(t.headers, {
                "X-Surge-Skip-Scripting": !1
            })),
            $httpClient.post(t, (t, s, i) =>{ ! t && s && (s.body = i, s.statusCode = s.status),
                e(t, s, i)
            });
            else if (this.isQuanX()) t.method = "POST",
            this.isNeedRewrite && (t.opts = t.opts || {},
            Object.assign(t.opts, {
                hints: !1
            })),
            $task.fetch(t).then(t =>{
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                },
                o)
            },
            t =>e(t));
            else if (this.isNode()) {
                this.initGotEnv(t);
                const {
                    url: s,
                    ...i
                } = t;
                this.got.post(s, i).then(t =>{
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    },
                    o)
                },
                t =>{
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                })
            }

        }
        adapterStatus(response) {
            if (response) {
                if (response.status) {
                    response["statusCode"] = response.status
                } else if (response.statusCode) {
                    response["status"] = response.statusCode
                }
            }
            return response
        }
        time(t) {
            let e = {
                "M+": (new Date).getMonth() + 1,
                "d+": (new Date).getDate(),
                "H+": (new Date).getHours(),
                "m+": (new Date).getMinutes(),
                "s+": (new Date).getSeconds(),
                "q+": Math.floor(((new Date).getMonth() + 3) / 3),
                S: (new Date).getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length)));
            return t
        }
        msg(e = t, s = "", i = "", r) {
            const o = t =>{
                if (!t) return t;
                if ("string" == typeof t) return this.isLoon() ? t: this.isQuanX() ? {
                    "open-url": t
                }: this.isSurge() ? {
                    url: t
                }: void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"],
                        s = t.mediaUrl || t["media-url"];
                        return {
                            openUrl: e,
                            mediaUrl: s
                        }
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl,
                        s = t["media-url"] || t.mediaUrl;
                        return {
                            "open-url": e,
                            "media-url": s
                        }
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {
                            url: e
                        }
                    }
                }
            };
            if (this.isJsbox()) {
                $push.schedule({
                    title: t,
                    body: s ? s + "\n" + i: i
                });
            } else {
                this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r)));
            }
            let h = ["", "==============📣系统通知📣=============="];
            h.push(e),
            s && h.push(s),
            i && h.push(i),
            console.log(h.join("\n")),
            this.logs = this.logs.concat(h)
        }
        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]),
            console.log(t.join(this.logSeparator))
        }
        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `❗️${his.name},错误 ! `, t.stack) : this.log("", `❗️${this.name}, 错误 ! `, t)
        }
        wait(t) {
            return new Promise(e =>setTimeout(e, t))
        }
        done(t = {}) {
            const e = (new Date).getTime(),
            s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}, 结束 ! 🕛${s }秒`),
            this.log(),
            (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    } (t, e)
}
