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
        isDev = /\.(dev\.|test)/.test(host),
        domain = host.match(/\w+\.\w+$/),
        baseDomain = domain ? domain[0] : host,
        createGuid = J.utils.uuid;

    site.info = {
        baseDomain:baseDomain,
        host:host,
        href:href,
        dev:isDev
    };

    site.cookies = {
        ctid:'ctid',
        guid:'aQQ_ajkguid',
        ssid:'sessid'
    };

    site.init = function(p){
        p = p || {};
        var cks = site.cookies, ckGuid = cks.guid, ckCity = cks.ctid, ckSession = cks.ssid, cityId = p.city_id || '',
            setCookie = J.setCookie, getCookie = J.getCookie;

        getCookie(ckGuid) || (J.iN = 1, setCookie(ckGuid, createGuid(), expire, baseDomain));
        getCookie(ckSession) || setCookie(ckSession, createGuid(), 0, baseDomain);
        (cityId && (cityId != getCookie(ckCity))) && setCookie(ckCity, cityId, expire, baseDomain);

        site.info.ctid = cityId || getCookie(ckCity);
        p.cityAlias && (site.info.cityAlias = p.cityAlias);
        p.includePrefix && (site.info.includePrefix = p.includePrefix);

    };
})(J);
