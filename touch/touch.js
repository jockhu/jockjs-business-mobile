
/**
 * Aifang Javascript Framework.
 * Copyright 2012 ANJUKE Inc. All rights reserved.
 *
 * @path: touch/touch.js
 * @author: Jock
 * @version: 1.0.0
 * @date: 2013/05/05
 *
 */


J.add('touch');
(function(w){
    var T = {
            PAGES:{},
            FN:{},
            Resources:{},
            locked:false
        }, D = document,
        pageView = {
            width:0,
            height:0
        },
        isFistLoaded = true,
        currentPageName = '',
        resource = {},
        isSupportHistory = false, logger = J.logger,
        enableTransition = true;

    var prefixes = (function(){
        var preArr = ['', '-moz-', '-webkit-', '-khtml-', '-o-', '-ms-'],
            rcap = /-([a-z])/g, capfn = function ($0, $1) {
                return $1.toUpperCase();
            },
            cssItem;
        target = D.documentElement.style;
        for (var i = 0, l = preArr.length; i < l; i++) {
            cssItem = (preArr[i] + 'transform').replace(rcap, capfn);
            if (cssItem in target) {
                return preArr[i];
            }
        }
        return '';
    })();


    /**
     * 历史记录
     * @returns {{push: Function, replace: Function}}
     * @constructor
     */
    function History(){

        function pushHistory(opts){
            var info = {
                title : opts.title || D.title,
                url : opts.url,
                pageName : opts.pageName
            };
            if(history.pushState){
                history.pushState(info, info.title, info.url);
            }

        }

        function replaceHistory(opts){
            var info = {
                title : opts.title || D.title,
                url : opts.url,
                pageName : opts.pageName
            };
            if(history.replaceState){
                history.replaceState(info, info.title, info.url);
            }
        }

        w.onpopstate = function(event){
            enableTransition = false;
            var pn, currentPage, cubPage;
            event.state&&(pn=event.state.pageName);
            //跳过第一次处理
            if(!isFistLoaded){
                // 清除正在加载资源任务
                if(pn && pn != currentPageName && T.PAGES[pn]){
                    currentPage = T.PAGES[pn];
                    //console.log('---',currentPage.getOptions(), ops.pageName, currentPage.getSubPage(),'---')
                    if(cubPage = currentPage.getSubPage()){
                        // 如果有子Page，直接隐藏子Page
                        cubPage.hide(false, true);
                    } else {
                        // 已经有Page缓存，但没有子Page，直接显示被缓存的Page
                        currentPage.show(true, false);
                    }
                }else{
                    D.location.reload();
                }
            }else{
                isSupportHistory = true;
                isFistLoaded = false;
                enableTransition = true;
                preLoadWhenLoaded();
            }

        }

        return {
            push:pushHistory,
            replace:replaceHistory
        };

    }

    var defOptions = {
        header:'',
        content:'',
        footer:'',
        parent:'',
        pageName:'',
        pageClass:'',
        url: D.location.href,
        onShow:null,
        onHide:null,
        onShowBefore:null,
        onHideBefore:null
    }, identityIndex = 0, hs = new History();

    /**
     *
     * @param options 参数选项
     * @param stepHistory 跳过history操作
     * @param overLocked 哪怕是锁定的也执行
     * @returns {{addItemClick: Function, setSubPage: Function, getSubPage: Function, getOptions: Function, init: Function, getPageName: Function, resetSize: Function, getScroll: Function, setVisible: Function, transition: Function, setOptions: Function, resource: {}, show: Function, hide: Function, getBoxContainer: Function, getPageContainer: Function, getBodyContainer: Function, setContent: Function, remove: Function}}
     * @constructor
     */
    function Page(options, stepHistory, overLocked){

        var opts,
            pageSize,
            bodyContainer,
            pageContainer,
            boxContainer,
            boxHeader,
            boxContent,
            boxFooter,
            resourceLoaded = options.resourceLoaded||false,
            parentPage,
            subPage,
            iScrollObj = null,
            pageLocked = false,
            containerID = ('TW_' + Math.random()).replace(/\./,'')+(++identityIndex);

        var M = {
            isLocked:isLocked,
            addItemClick:addItemClick,
            setSubPage:setSubPage,
            getSubPage:getSubPage,
            getOptions:getOptions,
            init:init,
            getPageName:getPageName,
            resetSize:resetSize,
            getScroll:getScroll,
            setVisible:setVisible,
            transition:transition,
            setOptions:setOptions,
            resource:resource,
            show:show,
            hide:hide,
            getBoxContainer:getBoxContainer,
            getPageContainer:getPageContainer,
            getBodyContainer:getBodyContainer,
            setContent:setContent,
            resetContent:resetContent,
            remove:remove
        };

        (function(){
            opts = J.mix(defOptions, options || {}, true);
            pageSize = getPageSizeStyle(1);
            pageView = getPageSizeStyle();
            if(opts.parent){
                if(!isSupported()) goTo(opts.url);
                parentPage = T.PAGES[opts.parent] || new Page(J.mix(opts, {url: D.location.href, parent:''}, true));
                add();
            }else{
                currentPageName = opts.pageName;
                pageContainer = J.g(opts.pageName);
                opts.boxContainer && (boxContainer = J.g(opts.boxContainer));
                opts.boxContent && (boxContent = J.g(opts.boxContent));
                bodyContainer = pageContainer.first();
                pageContainer.setStyle(pageSize);
                bodyContainer.setStyle(pageSize);
                bodyContainer.get().id || bodyContainer.attr('id', containerID);

                D.addEventListener('touchmove', function(e){e.preventDefault()}, false);
                J.ready(function(){
                    iScrollObj = new iScroll(bodyContainer.get().id, {checkDOMChanges:true});
                });
            }
        })();

        function isLocked(){
            return pageLocked;
        }

        function getPageContainer(){
            return pageContainer;
        }

        function getBodyContainer(){
            return bodyContainer;
        }

        function getBoxContainer(){
            return boxContainer;
        }

        function resetSize(pageSize){
            pageSize || (pageSize = getPageSizeStyle(true));
            pageContainer && pageContainer.setStyle(pageSize);
            bodyContainer && bodyContainer.setStyle(pageSize);
        }

        function getScroll(){
            return iScrollObj;
        }

        function add(){
            pageLocked = true;
            if(opts.type == 'box'){
                boxContainer = J.create('div');
                opts.header && (boxHeader = J.create('div').html(opts.header).appendTo(boxContainer));
                boxContent = J.create('div').html(opts.content).appendTo(boxContainer);
                opts.footer && (boxFooter = J.create('div').html(opts.footer).appendTo(boxContainer));
                parentPage.getBoxContainer().insertAfter(boxContainer);
                bodyContainer = parentPage.getBodyContainer();
                pageContainer = parentPage.getPageContainer();
                iScrollObj = parentPage.getScroll();
            }else{
                var pageCss = prefixes+'transition: '+prefixes+'transform 350ms; transition: '+prefixes+'transform 350ms; '+prefixes+'transform: translate3d('+pageSize.width+', 0px, 0px)';
                pageContainer = J.create('div', {id:opts.pageName,'class':'container '+opts.pageName, style:'overflow: hidden;position:absolute;left:0;top:0;visibility:hidden'+pageCss}).setStyle(pageSize);
                bodyContainer = J.create('div', {id:containerID, 'class':opts.pageClass||opts.pageName, style:'position:absolute;left:0;top:0'}).setStyle(pageSize);
                boxContainer = J.create('div');
                opts.header && (boxHeader = J.create('div').html(opts.header).appendTo(boxContainer));
                boxContent = J.create('div').html(opts.content).appendTo(boxContainer);
                opts.footer && (boxFooter = J.create('div').html(opts.footer).appendTo(boxContainer));
                bodyContainer.append(boxContainer);
                parentPage.getPageContainer().insertAfter(pageContainer.append(bodyContainer));
                iScrollObj = new iScroll(containerID, {checkDOMChanges:true});
            }
            show(stepHistory, overLocked);
        }

        function setContent(content){
            boxContent && boxContent.html(content);
        }

        function resetContent(){
            setContent(getLoadingHtml());
        }

        function onActBack(){
            if(boxHeader){
                boxHeader.s('.ac_b').each(function(i, v){
                    v.on('click', function(e){
                        e.stop();
                        history.back();
                    });
                });
            }
        }

        function unActBack(){
            if(boxHeader){
                boxHeader.s('.ac_b').each(function(i, v){
                    v.un('click');
                });
            }
        }

        /**
         * css3 Transform
         * @param direction 方向
         * @param range 行程
         * @param duration 动画时长
         * @param callback 完成回调
         */
        function transition(direction, range, duration, callback){
            T.transition(pageContainer, direction, range, duration, callback);
        }

        function getPageName(){
            return opts.pageName;
        }

        /**
         * 显示当前的Page
         * @param stepHistory 跳过history操作
         * @param overLocked 哪怕是锁定的也执行
         */
        function show(stepHistory, overLocked){
            pageLocked = true;
            //console.log('show', opts,currentPageName)
            // if(!overLocked){
            //     if(T.locked) return;
            // }
            opts.onShowBefore && opts.onShowBefore(M);
            // T.locked = true;
            onActBack();

            currentPageName = opts.pageName
            parentPage = getParentPage(opts.parent);

            // 前进 后退 不需要重复更新 history
            if(!stepHistory) hs.push(opts);

            if(opts.type == 'box'){
                var sPage;
                if(parentPage){
                    parentPage.setSubPage(M);
                    parentPage.getBoxContainer().hide();
                }else if(sPage = getSubPage()){
                    sPage.getBoxContainer().hide();
                }
                boxContainer.show();
                if(!resourceLoaded){
                    setContent(getLoadingHtml());
                    load();
                }else{
                    D.title = opts.title;
                    // T.locked = false;
                    opts.onShow && opts.onShow(M);
                }

            }else{
                load();
                setContent(getLoadingHtml());
                // 更新当前 PageSize
                resetSize();
                setVisible(true);
                if(parentPage){
                    parentPage.setSubPage(M);
                    parentPage.transition(-1,null,null,function(){
                        parentPage.setVisible(false);
                    });
                }

                transition(0, null, null, function(){

                });
            }


            //console.log('  show', opts.type,currentPageName)

        }

        /**
         * 隐藏当前的Page
         * @param stepHistory 跳过history操作
         * @param overLocked 哪怕是锁定的也执行
         */
        function hide(stepHistory, overLocked){
            //console.log('hide', parentPage.getPageName(), opts.type, currentPageName)
            // if(!overLocked){
            //     if(T.locked) return;
            // }
            opts.onHideBefore && opts.onHideBefore(M);

            // T.locked = true;

            parentPage.setSubPage(null);
            if(opts.type == 'box'){
                boxContainer.hide();
                parentPage.getBoxContainer().show();
                parentPage.getOptions().onShowBefore && parentPage.getOptions().onShowBefore(parentPage);

                // T.locked = false;
            }else{
                parentPage.resetSize();
                transition(1, null, null, function(){
                    setVisible(false);
                });
                parentPage.setVisible(true);
                parentPage.transition(0,null,null,function(){
                    // T.locked = false;
                    unActBack();
                });
            }
            currentPageName = parentPage.getPageName();
            D.title = parentPage.getOptions().title;
            opts.onHide && opts.onHide(M);
            //console.log('  hide',opts.type, currentPageName)
        }

        function setVisible(isVisible){
            pageContainer && pageContainer.setStyle({width: isVisible ? getPageSizeStyle(true).width : '0px'});
        }

        function setSubPage(subPageObj){
            subPage = subPageObj;
        }

        function getSubPage(){
            return subPage
        }

        function getParentPage(pageName){
            return T.PAGES[pageName];
        }

        function load(){
            var BS,PS,CL,PL,li=0,ti=(+new Date());
            BS=PS=+new Date();
            function v(){
                return ((decodeURIComponent(location.href).indexOf(opts.url) == -1)||(!M.getPageContainer().s('.pload').length))? true:false;
            }
            function l(){
                li++;
                J.get({
                    url: opts.url,
                    cache: false,
                    type: 'json',
                    timeout: 15000,
                    headers: {
                        'X-TW-HAR': 'JCHTML'
                    },
                    onSuccess: function(rs) {
                        // 如果请求结果未返回，而页面已经被切换，跳出处理逻辑
                        if(v()) return;
                        var cssLoaded = false, jsLoaded = false, timer;
                        // 如果资源没有被加载过
                        if(!resourceLoaded){
                            loadResource(rs.css, 'css', function(){
                                cssLoaded = true;
                                setContent(rs.html);
                                setOptions({
                                    title:rs.title
                                });
                            });

                            loadResource(rs.js, 'js', function(){
                                resourceLoaded = true;
                                jsLoaded = true;
                            });
                            // 确保css和js都加载完成执行 page init 方法
                            (function(){
                                if(cssLoaded && jsLoaded){
                                    timer && clearTimeout(timer);
                                    CL=PL=+new Date();

                                    T.FN[opts.pageName] && T.FN[opts.pageName]();

                                    opts.trackSpeedName=w.PAGENAME;
                                    trackSpeedAjax(BS,PS,CL,PL,1,opts.trackSpeedName);
                                    newPageInit();

                                    //preload css & js

                                    preLoad(rs["pre-css"],"css");
                                    preLoad(rs["pre-js"],"js");
                                    return false;
                                }
                                timer = setTimeout(arguments.callee,10);
                            })();
                        }else{
                            setContent(rs.html);
                            setOptions({
                                title:rs.title
                            });
                            CL=PL=+new Date();
                            trackSpeedAjax(BS,PS,CL,PL,2,opts.trackSpeedName);
                            newPageInit()
                        }
                    },
                    onFailure: function(xhr){
                        trackTs('?tp=getJCHTML_failure&msg='+xhr.status+'&url='+encodeURIComponent(opts.url)+'&times='+li);
                        failure(li,true);
                    },
                    onTimeout:function(xhr){
                        trackTs('?tp=getJCHTML_timeout&url='+encodeURIComponent(opts.url)+'&times='+li);
                        failure(li,false);
                    }
                });
            }
            l();
            function failure(li,f) {
                if(v()) return;
                if ( (li < 2)&&!f ) {
                    setContent(getRetryHtml());
                    l();
                } else {
                    setContent(getFailureHtml());
                }
            }

            // new page init
            function newPageInit(){
                // T.locked = false;
                T.PAGES[opts.pageName].init(M);
                opts.onShow && opts.onShow(M);
                D.title = opts.title;
                pageLocked = false;
            }
        }

        /**
         * 加载资源
         * @param resArr
         * @param type
         * @param callback
         */
        function loadResource(resArr, type, callback){
            var l = resArr.length;
            if(!l) callback && callback();
            J.each(resArr, function(i, v){
                var key = md5(v);
                if(type == 'css'){
                    if(!T.Resources[key]){
                        J.load(v, type);
                        T.Resources[key] = true;
                    }
                    callback && callBackFn(callback);
                }else{
                    if(!T.Resources[key]){
                        J.load(v, type, function(){
                            T.Resources[key] = true;
                            callback && callBackFn(callback);
                        });
                    }else{
                        callback && callBackFn(callback);
                    }
                }
            });

            function callBackFn(callback){
                l--;
                if(l == 0) callback && callback();
            }
        }

        function remove(){
            bodyContainer.remove()
        }

        function setOptions(options){
            opts = J.mix(opts, options);
        }

        function getOptions(){
            return opts;
        }

        function init(){

        }

        function getElmUrl(elm){
            return elm.attr( elm.get().tagName === 'A' ? 'href' : 'link' );
        }

        function itemClick(elm, fn){
            if(!elm) return;
            elm.un('click');
            elm.on('click', function(e){
                var url = getElmUrl(elm);
                isSupported() ? (e.stop(), fn(url)) : goTo(url);
            });
        }

        /**
         * 动态添加项，同时绑定Click事件
         * @param elm 容器对象
         * @param clickItems 参数同 initPage clickItems
         */
        function addItemClick(elm, clickItems){
            if(elm && clickItems){
                J.each(clickItems, function(k, f){
                    if(/^\./.test(k)){
                        elm.s(k).each(function(i, v){
                            itemClick(v, f);
                        });
                    }else{
                        itemClick(J.g(k), f);
                    }
                });
            }
        }



        return M;

    }

    function getHtml(msg){
        var h = J.page.viewHeight() / 2 - 150;
        h = h < 50 ? 50 : h;
        return '<div class="pload" style="margin:'+h+'px auto 0;"><div class="ic" style="width:120px; height:110px; margin: 0 auto;"></div><div class="co">'+msg+'</div></div>';
    }

    function getLoadingHtml(){
        return getHtml('正在努力加载中...');
    }

    function getFailureHtml(){
        return getHtml('加载失败，请试试刷新页面...');
    }

    function getRetryHtml(){
        return getHtml('网速不给力，正在重新加载...');
    }


    /**
     * css3 Transform
     * @param elm Element
     * @param direction 方向
     * @param range 行程
     * @param duration 动画时长
     * @param callback 完成回调
     */
    function transition(elm, direction, range, duration, callback){
        var bodyContainer = J.g(elm) ,defaultDuration = 350, transitionEnd = (navigator.vendor && "webkitTransitionEnd") ||
            ( w.opera && "oTransitionEnd") || "transitionend";
        J.on(bodyContainer, transitionEnd, function(){
            bodyContainer.un(transitionEnd);
            enableTransition = true;
            callback && callback(bodyContainer);
        });
        range = range || J.page.viewWidth();
        duration = (duration == undefined || duration == null) ? defaultDuration : duration;
        var style = bodyContainer.get().style;
        range = direction == -1 ? -range : direction == 1 ? range : 0;


        //hack for uc 9.0+
        if(navigator.userAgent.match(/UCBrowser\/9\./)&&!enableTransition){
            duration = 1;
        };

        style[ prefixes + 'transition' ] =  prefixes + 'transform ' + duration + 'ms';
        style[ prefixes + 'transform' ] =  'translate3d('+ range +'px, 0px, 0px)';

    }


    /**
     *
     * @param iOpts
     * @param stepHistory 跳过history操作
     * @param overLocked 哪怕是锁定的也执行
     */
    function initPage(iOpts, stepHistory, overLocked){

        var page, pageElm = J.g(currentPageName = iOpts.pageName);

        function initialize(pageObj){
            iOpts.onInit && iOpts.onInit(pageObj);
            J.ready(function(){
                iOpts.onLoad && iOpts.onLoad(pageObj.getScroll());
            });

            page.addItemClick(pageElm || page.getPageContainer() , iOpts.clickItems);
        }

        try{
            if(page = T.PAGES[iOpts.pageName]){
                page.init = initialize;
            }else{
                iOpts.title = D.title;
                var opts = J.mix(defOptions, iOpts, true);
                opts.resourceLoaded = true;
                hs.replace(opts);
                page = T.PAGES[iOpts.pageName] = new Page(opts, stepHistory, overLocked);
                onPageResize(function(size){
                    T.PAGES[currentPageName].resetSize(size);
                });
                initialize(page);
            }
        }catch(ex){
            logger.log(ex)
        }
    }

    function preLoadWhenLoaded() {
        //css & js that loaded
        var CJload = J.g('cssAndJsLoaded').val();
        CJload && (CJload = CJload.split(','));
        CJload && (J.each(CJload, function(i, v) {
            T.Resources[md5(v)] = true;
        }));
        //preload css
        var cssPres = J.g('cssPreload').val();
        cssPres && (cssPres = cssPres.split(','));
        cssPres && preLoad(cssPres, 'css');
        //preload js
        var jsPres = J.g('jsPreload').val();
        jsPres && (jsPres = jsPres.split(','));
        jsPres && preLoad(jsPres, 'js');
    }

    function preLoad(resArr,type){
        J.each(resArr,function(i,v){
            var key=md5(v);
            if(!T.Resources[key]){
                if(type=="css"){
                    J.load(v, type);
                    T.Resources[key]=true;
                }else{
                    J.load(v, type, function(){
                        T.Resources[key]=true;
                    });
                }
            }
        });
    }


    /**
     * show Page，同时缓存Page
     * @param options
     * @param stepHistory 跳过history操作
     * @param overLocked 哪怕是锁定的也执行
     */
    function showPage(options, stepHistory, overLocked){
        // if(!overLocked){
        //     if(T.locked) return false;
        // }

        options.parent = currentPageName;

        var opts = J.mix(defOptions, options || {}, true),
            page;

        try{
            if(page = T.PAGES[opts.pageName]){
                if(opts.type != 'box')
                    page.getScroll().scrollTo(0, 0, 200);
                page.setOptions(opts);
                page.show(stepHistory, overLocked);
            }else{
                page = new Page(opts, stepHistory, overLocked);
                T.PAGES[opts.pageName] = page;
            }
        }catch(ex){
            logger.log(ex)
        }

    }


    /**
     * get page size
     * @returns {{width: string, height: string}}
     */
    function getPageSizeStyle(isStyle){
        return {
            width:J.page.viewWidth()+(isStyle ? 'px' : ''),
            height: (w.innerHeight || J.page.viewHeight())+(isStyle ? 'px' : '')
        };
    }


    /**
     * Make sure that the paper size is finished.
     * @param callback
     */
    function pageReadySize(callback){
        var width = pageView.width, height = pageView.height, timer = null, count = 50;
        
        (function(){
            if( width != J.page.viewWidth() || height != J.page.viewHeight() || count==1 ){
                timer && clearTimeout(timer);
                pageView.width = width = J.page.viewWidth();
                pageView.height = height = J.page.viewHeight();
                count && callback && callback(getPageSizeStyle(true));
                return false;
            }
            if( --count <= 0 ){
                timer && clearTimeout(timer);
                return false;
            }
            timer = setTimeout(arguments.callee,10);
        })();
    }


    /**
     * When the page size is changed.
     * @param callback
     */
    function onPageResize(callback) {
        w.addEventListener('resize', function() {
            var t = D.activeElement.tagName;
            if (t == 'INPUT' || t=='TEXTAREA')return;
            pageReadySize(callback);
        }, false);
        w.addEventListener('load',function(){
            pageReadySize(callback);
        });
        w.addEventListener('orientationchange',function(){
            var t = D.activeElement.tagName;
            if (t != 'INPUT' && t!='TEXTAREA')return;
            pageReadySize(callback);
        });
    }

    function jsonParse(jsonStr){
        return (new Function("return (" + jsonStr + ")"))();
    }

    // 等待废弃
    function loadResource(pagename, resArr, type, callback){
        var cRes = resource[pagename], key, l = resArr.length;
        J.each(resArr, function(i, v){
            key = md5(v);
            if(!cRes[type] || !cRes[type][key]){
                J.load(v, type, function(){
                    callback && callBackFn(callback)
                });
                cRes[type] || (cRes[type] = {});
                cRes[type][key] = 1;
            }else{
                callback && callBackFn(callback)
            }
        });

        function callBackFn(callback){
            l--;
            if(l == 0) callback();
        }
    }

    function track(page, customparam){
        J.site.eventTracking({site : 'm_anjuke', page : page, customparam:customparam, referrer : T.referrer, href: D.location.href });
        T.referrer = D.location.href;
    }

    function trackEvent(page, customparam){
        J.site.eventTracking({site : 'm_anjuke-npv', page : page, customparam : customparam, href: D.location.href});
    }

    function isSupported(){
       // alert(J.site.info.ctid);
        if(J.site.info.ctid==14) return false;
        return  isSupportHistory && history.pushState;
    }

    function goTo(url){
        D.location.href = url;
    }

    function trackTs(u){
        var img = new Image(),url = J.site.info.dev ? 'http://touch.fang.anjuke.test/ts.html' : 'http://m.anjuke.com/ts.html';
        url+=u;
        img.src = url;
    }

    function trackSpeed(){
        w.addEventListener && w.addEventListener('load',function(){
            var tm = J.times,url;
            url = '?pn='+ w.PAGENAME;
            url += '&in='+ J.site.info.isNew;
            url += '&PS='+ tm.PS;
            url += '&BS='+ tm.BS;
            url += '&CL='+ tm.CL;
            url += '&PL='+ tm.PL;
            url += '&as=0';
            trackTs(url);
        });
    }

    function trackSpeedAjax(BS,PS,CL,PL,as,pn){
        var url;
        url = '?pn='+ pn;
        url += '&in='+ J.site.info.isNew;
        url += '&PS='+ PS;
        url += '&BS='+ BS;
        url += '&CL='+ CL;
        url += '&PL='+ PL;
        url += '&as='+ as;
        trackTs(url);
    }

    function setCookie(name,value){
        var url = 'http://api.anjuke.com/common/cookie/add/guid/', img;
        url += J.getCookie(J.site.cookies.guid);
        url += '?' + name + "=" + value;
        img = new Image();
        img.src = url;
    }

    function lazyLoad(o){
        if(!o.iScroll)return;
        var that = this;
        this.Imgs = [];
        this.offsetY = o.offsetY || 100;
        this.reflesh = function(){
            this.Imgs = [];
            this.addImg(J.g(o.iScroll.scroller));
        };
        this.addImg = function(ele){
            ele = ele || J.g(document);
            var y = -o.iScroll.y + o.iScroll.wrapperH + that.offsetY;
            ele.s('img').each(function(i,v){
                if( v.offset().y < y){
                    if(!v.attr('data-src'))return;
                    replaceImg(v);
                    return;
                }
                v.attr('data-src') && that.Imgs.push(v);
            });
            that.Imgs.sort(function(a,b){
                return a.offset().y-b.offset().y;
            });
        };
        function replaceImg(v) {
            var s = v.attr('data-src'),re = s.split('/').pop().match(/\d+x\d+/g);
            if(u = v.attr('src')){
                v.on('error',function(){
                    v.attr('src',u);
                });
            }
            if(!re){
                v.attr('src', s).attr('data-src', '');
            }else{
                var w = parseInt(v.getStyle("width")),h = parseInt(v.getStyle("height"));
                if (window.devicePixelRatio && window.devicePixelRatio!=1) {
                    w = parseInt(w*window.devicePixelRatio);
                    h = parseInt(h*window.devicePixelRatio);
                }
                if(w && h)s = s.replace(re,w+'x'+h);
                v.attr('src', s).attr('data-src', '');
            }
        }
        function lazyOnpos(){
            var img = that.Imgs;
            if(img.length < 1) return;
            var y = -this.y + this.wrapperH + that.offsetY;
            for (var i =  0; i < img.length; i++) {
                var v = img[0];
                if( v.offset().y && v.offset().y < y ){
                    replaceImg(v);
                    img.shift();
                }else{
                    break;
                }
            };
        };
        var a;
        if(a=o.iScroll.options.lazyOnpos){
            a.push(lazyOnpos);
            o.iScroll.options.lazyOnpos = a;
        }else{
            o.iScroll.options.lazyOnpos = [lazyOnpos];
        }
        this.reflesh();
    }

    J.mix(T, {
        history:hs,
        lazyLoad:lazyLoad,
        transition:transition,
        goTo:goTo,
        isSupported:isSupported,
        track:track,
        trackEvent:trackEvent,
        trackSpeed:trackSpeed,
        setCookie:setCookie,
        initPage:initPage,
        loadResource:loadResource,
        prefixes:prefixes,
        showPage:showPage
    });

    w.T = T;

})(J.W);