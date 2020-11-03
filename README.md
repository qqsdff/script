
    电信余额查询
	
更新时间: 2020.10.30 v1.00
第一次写，请体谅渣渣代码。
本代码基于野比大佬代码，侵删。
【获取cookie】
开启抓包，关注微信公众号'中国电信营业厅'-查询办-查话费
如果通知获得cookie成功, 则可以使用此签到脚本。
*************************
【QX脚本配置】 :
*************************
[rewrite_local]
# 获取电信Cookie
^http://wt.189.cn/wx/czwap/phonebill2.do url script-request-body https://raw.githubusercontent.com/15321929422/script/main/10001.js
[task_local]
5 0 * * * https://raw.githubusercontent.com/15321929422/script/main/10001.js, tag=电信余额

