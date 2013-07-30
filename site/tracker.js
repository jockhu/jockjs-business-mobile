/**
 * Aifang Javascript Framework.
 * Copyright 2012 ANJUKE Inc. All rights reserved.
 *
 * @path: site/tracker.js
 * @author: Jock
 * @version: 1.0.0
 * @date: 2012/11/15
 *
 */

/// require('site.site');


(function () {

    var site = J.site, siteCookies = site.cookies, siteInfo = site.info, EventTracker;

    // 以下用于页面曝光量统计，以及SOJ A标签处理
    var sojTag = "soj", traceTag = 'data-trace', traceFinished = false, v, d, Arr = [], Ret = {}, l, http = 'http://';


    function getCustomData() {
        traceFinished || getDataTrace();
        var U = [];
        for (var item in Ret) {
            U.push('"' + item + '":[' + Ret[item].join(',') + ']')
        }
        return U;
    }

    function setData(items) {
        for (var key in items) {
            /^\d+$/.test(items[key]) && (Ret[key] || (Ret[key] = []), Ret[key].push(items[key]))
        }
    }

    function sojBase(s, v) {
        s.on("click", function () {
            var r, i, n = this.href;
            if (!n.match(/^http/) || n.match(/from=/))return;
            r = n.split("#"), i = r[0] + (n.match(/\?/) ? "&" : "?") + "from=" + encodeURIComponent(v), r[1] && (i += "#" + r[1]), this.href = i
        });
    }

    function getDataTrace() {
        J.s("a").each(function (i, s) {
            (d = s.attr(traceTag)) && Arr.push(d);
            (d = s.attr(sojTag)) && sojBase(s, d);
        });
        v = eval('([' + Arr.join(',') + '])');
        l = v.length;
        while (l--) {
            setData(v[l]);
        }
        traceFinished = true;
    }

    site.soj = function (e) {
        J.g(e).s("a").each(function (i, s) {
            (d = s.attr(sojTag)) && sojBase(s, d);
        });
    };

    // 以下是页面停留时间获取
    site.waited = function (target, id) {
        J.on(window, 'unload', function () {
            var getCookie = J.getCookie, siteCookies = site.cookies,
            data = {
                starttime:J.times.PS,
                endtime:J.getTime(),
                target:target,
                id:id,
                guid:getCookie(siteCookies.guid),
                ssid:getCookie(siteCookies.ssid)
            }, url;
            if(site.info.dev){
                url = 'dev.aifang'
            }else{
                url = site.info.isAifang ? 'aifang' : 'fang.anjuke';
            }
            url = http + 'www.' + url + '.com/lenger.html';
            J.get({url:url, data:data, type:'jsonp'});
        });
    };

    /**
     * AA log && SOJ
     * @param s site
     * @param p page
     * @param u user Cookie Name
     * @returns Tracker Object
     */
    site.tracker = function (s, p, u) {
        var D = document, o = {}, getCookie = J.getCookie, customData = [], m = {
            track:track,
            addCustomParam : function(params){
                params && J.each(params, function(i, v){
                    customData.push(J.isNumber(i) ? v : '"' + i + '":"' + v + '"')
                });
            },
            getCustomParam : function(){
                return customData.length ? '{' + customData.join(",") + '}' : ''
            }
        };
        s && (o.site = s);
        p && (o.page = p);
        o.referrer = D.referrer || '';

        J.each('Site Page PageName Referrer Uid Method NGuid NCtid NLiu NSessid NUid Cst CustomParam SendType'.split(' '), function (i, v) {
            var a = v.substring(0, 1).toLowerCase() + v.substring(1);
            m['set' + v] = function (v) {
                o[a] = v
            }
        });

        function buildParams() {
            var ret = {
                p:o.page,
                h:D.location.href,
                r:o.referrer || D.referrer || '',
                site:o.site || '',
                guid:getCookie(o.nGuid || siteCookies.guid) || '',
                ctid:getCookie(o.nCtid || siteCookies.ctid) || '',
                luid:getCookie(o.nLiu || 'lui') || '',
                ssid:getCookie(o.nSessid || siteCookies.ssid) || '',
                uid:u || getCookie(o.nUid || siteCookies.said) || '0',
                t:siteInfo.time
            };
            o.method && (ret.m = o.method);
            (o.cst && /[0-9]{13}/.test(o.cst)) && (ret.lt = ret.t - parseInt(o.cst));
            o.pageName && (ret.pn = o.pageName);
            ret.cp = o.customParam ? o.customParam : m.getCustomParam();
            return ret
        }

        function track(url) {
            !J.isUndefined(o.customParam) || m.addCustomParam(getCustomData());// 添加曝光量统计
            var P = buildParams(), T = '.com/st';
            url = url || 'http://' + ((siteInfo.dev) ? 'soj.dev.aifang' + T : 's.anjuke' + T + 'b');
            try{
                J[o.sendType||'post']({url:url, type:'jsonp', data:P});
            }catch(e){
            }
        }

        return m;
    };

    /**
     * @param o.site site
     * @param o.page page
     * @param o.referrer referrer
     * @param o.options options
     */
    site.eventTracking = function(o){
        EventTracker = EventTracker || new site.tracker();
        EventTracker.setSendType('get');
        EventTracker.setSite(o.site);
        o.page && EventTracker.setPage(o.page);
        o.page && EventTracker.setPageName(o.page);
        o.referrer && EventTracker.setReferrer(o.referrer);
        o.customparam ? EventTracker.setCustomParam(o.customparam) : EventTracker.setCustomParam("");
        EventTracker.track();
    }

})();