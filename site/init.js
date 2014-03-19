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

    site.createGuid = createGuid;

    site.init = function(p){
        p = p || {};
        var cks = site.cookies, ckGuid = cks.guid, ckCity = cks.ctid, ckSession = cks.ssid, cityId = p.city_id || '';

        getCookie(ckGuid) || (J.iN = 1, setCookie(ckGuid, createGuid(), expire, baseDomain));
        getCookie(ckSession) || setCookie(ckSession, createGuid(), 0, baseDomain);
        (cityId && (cityId != getCookie(ckCity))) && setCookie(ckCity, cityId, expire, baseDomain);

        site.info.ctid = cityId || getCookie(ckCity);
        p.cityAlias && (site.info.cityAlias = p.cityAlias);
        p.includePrefix && (site.info.includePrefix = p.includePrefix);

        var head = D.head || D.getElementsByTagName( "head" )[0], pageName = head.getAttribute('data-page'),testflag=head.getAttribute("data-testflag"),pageppc=head.getAttribute("data-ppc"),
        // browsemode=head.getAttribute("data-mode");
        // var isopener = head.getAttribute('data-opener');
          rent_new = head.getAttribute('data-flow'),
            random = head.getAttribute('data-random'),
            flow_list = head.getAttribute('data-flow-list'), 
            style = head.getAttribute('data-style');
        var soj_random = head.getAttribute('data-sojrandom');
        var rent_search = head.getAttribute('data-kw');
        var tagrandom1 = head.getAttribute("tagrandom");
        if(pageName){
            site.tracked = true;
            site.info.pageName = pageName;
            pageppc && ((new Image()).src = pageppc);
            var soj = {site:'m_anjuke', page:pageName};
            var customparam = {"refresh":"1","TH":"1","testflag":testflag};
            //好租单页abtest   房源属性标签
            if(pageName=='Rent_View'){
                if (rent_new==="new") { //好组单页ab test
                    customparam.test = pageName+'_0319_b';
                }else if(rent_new=='old'){
                    customparam.test = pageName+'_0319_a';
                }
            }
            

            if (style!="") { //付费用户页面soj
                customparam.style = style;
            }

            if(pageName=='Xinfang_Loupan_View'){
               if (soj_random=="1") { //新盘回拨样式abtest
                    customparam.test = pageName+"_0319_b";
                }else if(soj_random=="0"){
                    customparam.test = pageName+"_0319_a";
                } 
            }
            

            //notest
            if (rent_search!="") { //好租列表页搜索
                customparam.kw = rent_search;
            }
          
            //二手房标签测试
            if(pageName=='Anjuke_Prop_List' || pageName=='Anjuke_Prop_View'){
                if (tagrandom1=="1") { 
                    customparam.test = pageName+"_0319_b";
                }else if(tagrandom1=="0"){
                    customparam.test = pageName+"_0319_a";
                }
            }
            

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
