/**
 * Aifang Javascript Framework.
 * Copyright 2012 ANJUKE Inc. All rights reserved.
 *
 * @path: site/init.js
 * @author: Jock
 * @version: 1.0.0
 * @date: 2012/11/15
 *
 */

/// require('site.site');
/// require('utils.uuid');

(function (J) {
    J.iN = 0;
    var site = J.site, D = J.D,
        expire = 365 * 5,
        location = D.location,
        host = location.host,
        href = location.href,
        isDev = /dev|test/.test(href),
        domain = host.match(/\w+\.\w+$/),
        baseDomain = domain ? domain[0] : 'anjuke.com',
        createGuid = J.utils.uuid,
        setCookie = J.setCookie, getCookie = J.getCookie;

    site.info = {
        pageName:'',
        baseDomain:baseDomain,
        host:host,
        href:href,
        dev:isDev
    };

    /**
     * Get domain
     * @param string url.
     *  e.g.: shanghai.anjuke.com or shanghai.yourname.dev.anjuke.com
     * @return string domain. e.g.: anjuke.com or anjuke.test.
     */
    function getDomain(url) {
        return url.match(/\w+.(com|com.cn|cn|org|net|test)$/g)[0];
    }

    /**
     * Get host name.
     * @return string hostname.
     *  e.g.: shanghai.anjuke.com or shanghai.yourname.dev.anjuke.com
     */
    function getHostname() {
        var hostname = '';
        // referrer e.g.: http://www.example.com/refer.html or http://www.example.com/
        var referrer = document.referrer;
        try{
            // e.g.: shanghai.anjuke.com
            hostname = window.top.location.hostname;
        }catch(e){
            // e.g.: www.example.com
            hostname = referrer.match(/([0-9a-zA-Z.]+)/g)[1];
        }
        return hostname;
    }

    /**
     * Check environment. If unavailable,
     * redirect to anjuke site.
     * then, return true.
     */
    function checkEnvAvailable() {
        // Pre-defined white lists(1st level host).
        var whiteList = ['anjuke.com', 'anjuke.test', '2345.com', 'rising.cn', 'hao123.com'];

        return new RegExp(getDomain(getHostname())).test(whiteList.join(','));
    }

    function getRedirectUrl() {
        return ('anjuke.com' === getDomain(self.location.hostname)) ? self.location.href : 'http://m.anjuke.com/';
    }





    site.createGuid = createGuid;

    site.init = function(p){
        // check environment before init.
        if (! checkEnvAvailable()) {
            window.top.location.href = getRedirectUrl();
            return false;
        }

        p = p || {};
        var cks = site.cookies, ckGuid = cks.guid, ckCity = cks.ctid, ckSession = cks.ssid, cityId = p.city_id || '';

        getCookie(ckGuid) || (J.iN = 1, setCookie(ckGuid, createGuid(), expire, baseDomain));
        getCookie(ckSession) || setCookie(ckSession, createGuid(), 0, baseDomain);
        (cityId && (cityId != getCookie(ckCity))) && setCookie(ckCity, cityId, expire, baseDomain);

        site.info.ctid = cityId || getCookie(ckCity);
        p.cityAlias && (site.info.cityAlias = p.cityAlias);
        p.includePrefix && (site.info.includePrefix = p.includePrefix);

        var head = D.head || D.getElementsByTagName( "head" )[0], 
            pageName = head.getAttribute('data-page'),
            pageppc=head.getAttribute("data-ppc"),
            style = head.getAttribute('data-style'),
            soj_random = head.getAttribute('data-sojrandom'),
            rent_search = head.getAttribute('data-kw'),
            sale_php = head.getAttribute("data-soj-php"),
            appVersion=head.getAttribute("app-version");
        if(pageName){
            site.tracked = true;
            site.info.pageName = pageName;



            //ppc扣费 不可删除
            pageppc && ((new Image()).src = pageppc);

            var soj = {site:'m_anjuke', page:pageName};
            var customparam = {};
            //app增强测试 1弹层3秒
            if (appVersion=="1") {
                customparam.test = 'test_'+pageName+"_0721_a1";
            }else if(appVersion=="0"){
                customparam.test = 'test_'+pageName+"_0721_a0";
            }
            //楼盘单页
            if(pageName=='Xinfang_Loupan_View'){
               if (soj_random=="1") { //新盘回拨样式abtest
                    customparam.test = pageName+"_0319_b";
                }else if(soj_random=="0"){
                    customparam.test = pageName+"_0319_a";
                } 
            }
            //楼盘付费用户页面soj
            if (style!="") {
                customparam.style = style;
            }
            //好租列表页联想词
            if (rent_search!="") { //好租列表页搜索
                customparam.kw = rent_search;
            }
            //二手房单页php abtest
            if (sale_php) {
                customparam.test = sale_php;
            }
            //定位成功进入列表页
            var url = location.href;
            if ((url.indexOf("lat")!=-1)&&(url.indexOf("lng")!=-1)&&(url.indexOf("map")==-1)) {
                customparam.locate = "locate";
            }

            soj.customparam = JSON.stringify(customparam);
            J.logger.trackEvent(soj);
        }
        site.setRef();

    };

    /**
     * 为刷新版本返回记录当前的Herf，供历史返回后用作soj referrer
     */
    site.setRef = function(url){
        setCookie('Ref',url||href,expire,baseDomain);
    }

    /**
     * 获取 referrer
     */
    site.getRef = function(){
        return getCookie('Ref')
    }

    // 重写 onError 增加自定义错误监听
    J.logger.onError = function(message){
        J.logger.isDev && alert( decodeURIComponent( (message+'').replace(/,/g,'\n') ));
    }

    site.cookies = {
        ctid:'ctid',
        guid:'aQQ_ajkguid',
        ssid:'sessid'
    };
})(J);
