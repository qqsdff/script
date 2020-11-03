/*************************

    查询电信余额流量
	
更新时间: 2020.10.30 v1.00
本代码基于野比大佬代码，侵删。


【获取cookie】
开启抓包，关注微信公众号'中国电信营业厅'-查询办-查话费
如果通知获得cookie成功, 则可以使用此签到脚本。


*************************
【QX脚本配置】 :
*************************
[rewrite_local]
# 获取电信Cookie
^http://wt.189.cn/wx/czwap/phonebill2.do url script-request-body https://raw.githubusercontent.com/qqsdff/script/main/10001.js

[task_local]
5 0 * * * https://raw.githubusercontent.com/qqsdff/script/main/10001.js, tag=电信余额流量

*************************/
var $nobyda = nobyda();

function nobyda() {
    const start = Date.now();
    const isRequest = typeof $request != "undefined";
    const isSurge = typeof $httpClient != "undefined";
    const isQuanX = typeof $task != "undefined";
    const isLoon = typeof $loon != "undefined";
    const isJSBox = typeof $app != "undefined" && typeof $http != "undefined";
    const isNode = typeof require == "function" && !isJSBox;
    const NodeSet = 'CookieSet.json';
    const node = (() => {
        if (isNode) {
            const request = require('request');
            const fs = require("fs");
            return ({
                request,
                fs
            })
        } else {
            return (null)
        }
    })()
    const notify = (title, subtitle, message) => {
        if (isQuanX) $notify(title, subtitle, message);
        if (isSurge) $notification.post(title, subtitle, message);
        if (isNode) console.log(`${title}\n${subtitle}\n${message}`);
        if (isJSBox) $push.schedule({
            title: title,
            body: subtitle ? subtitle + "\n" + message : message
        })
    }
    const write = (value, key) => {
        if (isQuanX) return $prefs.setValueForKey(value, key)
        if (isSurge) return $persistentStore.write(value, key)
        if (isNode) {
            try {
                if (!node.fs.existsSync(NodeSet)) node.fs.writeFileSync(NodeSet, JSON.stringify({}));
                const dataValue = JSON.parse(node.fs.readFileSync(NodeSet));
                if (value) dataValue[key] = value;
                if (!value) delete dataValue[key];
                return node.fs.writeFileSync(NodeSet, JSON.stringify(dataValue));
            } catch (er) {
                return AnError('Node.js持久化写入', null, er);
            }
        }
        if (isJSBox) {
            if (!value) return $file.delete(`shared://${key}.txt`);
            return $file.write({
                data: $data({
                    string: value
                }),
                path: `shared://${key}.txt`
            })
        }
    }
    const read = (key) => {
        if (isQuanX) return $prefs.valueForKey(key)
        if (isSurge) return $persistentStore.read(key)
        if (isNode) {
            try {
                if (!node.fs.existsSync(NodeSet)) return null;
                const dataValue = JSON.parse(node.fs.readFileSync(NodeSet))
                return dataValue[key]
            } catch (er) {
                return AnError('Node.js持久化读取', null, er)
            }
        }
        if (isJSBox) {
            if (!$file.exists(`shared://${key}.txt`)) return null;
            return $file.read(`shared://${key}.txt`).string
        }
    }
    const adapterStatus = (response) => {
        if (response) {
            if (response.status) {
                response["statusCode"] = response.status
            } else if (response.statusCode) {
                response["status"] = response.statusCode
            }
        }
        return response
    }
    const get = (options, callback) => {
        options.headers['User-Agent'] = 'JD4iPhone/167169 (iPhone; iOS 13.4.1; Scale/3.00)'
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options
            }
            options["method"] = "GET"
                //options["opts"] = {
                //  "hints": false
                //}
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) {
            options.headers['X-Surge-Skip-Scripting'] = false
            $httpClient.get(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isNode) {
            node.request(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isJSBox) {
            if (typeof options == "string") options = {
                url: options
            }
            options["header"] = options["headers"]
            options["handler"] = function(resp) {
                let error = resp.error;
                if (error) error = JSON.stringify(resp.error)
                let body = resp.data;
                if (typeof body == "object") body = JSON.stringify(resp.data);
                callback(error, adapterStatus(resp.response), body)
            };
            $http.get(options);
        }
    }
    const post = (options, callback) => {
        options.headers['User-Agent'] = 'JD4iPhone/167169 (iPhone; iOS 13.4.1; Scale/3.00)'
        if (options.body) options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options
            }
            options["method"] = "POST"
                //options["opts"] = {
                //  "hints": false
                //}
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) {
            options.headers['X-Surge-Skip-Scripting'] = false
            $httpClient.post(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isNode) {
            node.request.post(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isJSBox) {
            if (typeof options == "string") options = {
                url: options
            }
            options["header"] = options["headers"]
            options["handler"] = function(resp) {
                let error = resp.error;
                if (error) error = JSON.stringify(resp.error)
                let body = resp.data;
                if (typeof body == "object") body = JSON.stringify(resp.data)
                callback(error, adapterStatus(resp.response), body)
            }
            $http.post(options);
        }
    }
    const AnError = (name, keyname, er, resp, body) => {
        if (typeof(merge) != "undefined" && keyname) {
            if (!merge[keyname].notify) {
                merge[keyname].notify = `${name}: 异常, 已输出日志 ‼️`
            } else {
                merge[keyname].notify += `\n${name}: 异常, 已输出日志 ‼️ (2)`
            }
            merge[keyname].error = 1
        }
        return console.log(`\n‼️${name}发生错误\n‼️名称: ${er.name}\n‼️描述: ${er.message}${JSON.stringify(er).match(/\"line\"/)?`\
            n‼ ️行列: $ {
                JSON.stringify(er)
            }
            `:`
            `}${resp&&resp.status?`\
            n‼ ️状态: $ {
                resp.status
            }
            `:`
            `}${body?`\
            n‼ ️响应: $ {
                body
            }
            `:`
            `}`)
    }
    const time = () => {
        const end = ((Date.now() - start) / 1000).toFixed(2)
        return console.log('\n用时: ' + end + ' 秒')
    }
    const done = (value = {}) => {
        if (isQuanX) return $done(value)
        if (isSurge) isRequest ? $done(value) : $done()
    }
    return {
        AnError,
        isRequest,
        isJSBox,
        isSurge,
        isQuanX,
        isLoon,
        isNode,
        notify,
        write,
        read,
        get,
        post,
        time,
        done
    }
};

function change(num) {
    if (num >= 1024) {
        var num1 = (num / 1024).toFixed(3);
        return num1.substring(0, num1.lastIndexOf('.') + 3) + "GB";
    } else {
        var num1 = num.toFixed(3);
        return num1.substring(0, num1.lastIndexOf('.') + 3) + "MB";
    }
}
if ($nobyda.isRequest) {
    if ($request.headers && $request.url.match(/phonebill2/)) {
        $nobyda.write($request.body.replace("phone=", ""), "dxPhone");
        $nobyda.notify("电信", "", "写入cookie成功.");
        $nobyda.done();
        return;
    }
    return;
} else {
    var key = $nobyda.read("dxPhone");
    if (key) {
        var str = "";
        $nobyda.post({
            url: 'http://wt.189.cn/wx/czwap/phonebill2.do',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: "phone=" + key
        }, (error, response, data) => {
            try {
                console.log(data);
                if (error) throw new Error(error);
                const cc = JSON.parse(data);
                if (cc.error) {
                    str += "获取余额失败\n";
                } else {
                    str += "我的余额:" + cc.allmoney + "元" + "\n本月话费：" + cc.monthused + "元\n";
                }
            } catch (eor) {
                str += eor + "\n";
            } finally {
                //$nobyda.done();
            }
        });
        $nobyda.post({
                url: 'http://wt.189.cn//wx/czwap/notll_tcquery3.do',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: "phone=" + key
            }, (error, response, data) => {
                try {
                    console.log(data);
                    if (error) throw new Error(error);
                    const cc = JSON.parse(data);
                    if (cc.error) {
                        str += "获取余额失败\n";
                    } else {
			    for (var item of data) {
                                var flag = item.flag;
                                if (flag == 1) {
                                    if (item.symount > 0) {
                                        str += "国际剩余流量:" + change(item.symount) + "/n";
                                    }
                                } else if (flag == 2) {
                                    if (item.symount > 0) {
                                        str += "国内剩余流量:" + change(item.symount) + "/n";
                                    }

                                } else if (flag == 3) {
                                    if (item.symount > 0) {
                                        str += "省内剩余流量:" + change(item.symount) + "/n";
                                    }

                                } else if (flag == 4) {
                                    if (item.symount > 0) {
                                        str += "本地剩余流量:" + change(item.symount) + "/n";
                                    }

                                }
                            });

                        }
                    } catch (eor) {
                        str += eor + "\n";
                    } finally {
					 $nobyda.notify("电信", "", str);
                     $nobyda.done();
                    }
                };
        } else {
            $nobyda.notify("电信", "", "脚本终止, 未获取Cookie ‼️");
            $nobyda.done()
        }
    }
