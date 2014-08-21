/*
 var D2={"status":"ok","comm_midchange":"-0.0349065","area_midchange":"-0.00834928",
 "allcount":36,//3有三年,2有2年 1只有6个月,0
 "data":{
 "comm":{
 "201402":{"mid_price":"33800","month":1},
 "201403":{"mid_price":"33860","month":2},
 "201404":{"mid_price":"34790","month":3},
 "201405":{"mid_price":"34760","month":4},
 "201406":{"mid_price":"34260","month":5},
 "201407":{"mid_price":"34200","month":6}
 },
 "region":{
 "201402":{"mid_price":"32350","month":1},
 "201403":{"mid_price":"32140","month":2},
 "201404":{"mid_price":"33240","month":3},
 "201405":{"mid_price":"32760","month":4},
 "201406":{"mid_price":"31260","month":5},
 "201407":{"mid_price":"33200","month":6}
 }
 }
 };
*/
;(function(J,D,undefined){

  function zChart(options) {
    var defs={
        ymbBox:null,
        ele:null,
        resize:true,
        url:options.url,
        commColor:"#E64A00",
        regionColor:"#999999",
        cityColor:"#E64A00",
        X:'normal',//large
        Y:"万",
        nearby:6,//默认月份 hy,oy,ty
        showTip:false,
        price:false,
        src:"http://pages.ajkcdn.com/touch/img/global/3/canvasDraw2.png"
    }

    var opts,ele,ctx,showTip,D=document,mainData=null,evented=false;
    var pointArr=[],name=[],maxlen=[],sort=[];
    var width,height,NOW,image;
    var AXIS={};

    ;(function(){
        opts= J.mix(defs,options||{});
        showTip = J.g(opts.showTip)||null;
        var args= J.mix(opts.data,{nearby:opts.data.nearby||defs.nearby});//?commid=100&nearby=6
        ele=D.getElementById(opts.ele);
        if(!ele){return}
        ctx=ele.getContext("2d");
        init();
        getData(args);
       // NOW=initData(D2);
        //drawLine(NOW);//{comm:[],region:[]}
        bindEvent();
    })();

    function init(){
        var upper=J.g(ele).up(0);
        pointArr=[],name=[],maxlen=[];
        width=parseInt(upper.getStyle("width")),
            height=Math.round(width*0.5);
        upper.setStyle({'height':height+"px"});
        changePixelRatio(ctx, width, height);
        width -= 60,height -=20;    //canvas宽度，留出空隙给Y轴文字和x轴文字
        ctx.clearRect(0,0,ele.width,ele.height);
        ctx.translate(0,height);
    }

    function drawLine(data,resizing){//{region: Array[3], comm: Array[6]}
        var painted=false,evented=false,arr=[],name=[],sort=[];
        var obj={};
        init();
        for(var k in data){
            arr.push(data[k]);//[Array[3], Array[6]]
            name.push(k);     //["region", "comm"]
            obj[k]=data[k].length;
        }

        var iMax;
        for(var k in obj){
            var o=k;
            if(!iMax||obj[k]>iMax){
                sort.unshift(o);
                iMax=obj[k];
            }else{
                sort.push(o)
            }
        }

        //添加当前小区价格
        if(opts.price){arr.push(opts.price)};   //[Array[3], Array[6],31000]
        mainData=coreData(arr);

        for(var i=0;i<sort.length;i++){
            draw(data[[sort[i]]],opts[sort[i]+"Color"]);
        }
        function draw(e,lineColor,eventPosition) {

           if(name.length<2 && e.length<2){//如果只能一跟线并且只有1个数据
              hideBlock();
           }
            var dlen= e.length,points=[],space=width/dlen;

            if(!painted){
                painted=true;
                bgY(dlen,space);
                bgX(dlen,space);
                //opts.price && addOnImg();
                opts.price&&propPrice(dlen-1);
            }
            for(var i=0;i<dlen;i++){
                var px=space*(i+0.5);
                var py=scalePrice(e[i],height,mainData.min,mainData.avg);
                points.push({"x" : px,"y" : py});
            }
            //dotted(iMax,space);
            line(dlen,points,lineColor);
            circle(dlen,points,lineColor,data,eventPosition);

            function addOnImg(){
                var ww=null,hh=null;
                if(!image){
                    image = new Image();
                    image.src = opts.src;
                    image.onload = function(){
                            ww= image.width;
                            hh= image.height;
                        propPrice(dlen-1,image,ww,hh);
                    }
                }else{
                    propPrice(dlen-1,image,ww,hh);
                }
            }
            function propPrice(i,image,ww,hh){
                var py = scalePrice(opts.price,height,mainData.min,mainData.avg);
                var px=space*(i+0.5);
                //var imagePointY=74;
               // ctx.drawImage(image, 0,hh-imagePointY, ww+1, 23, px - image.width/3, py -7, 15,15);

                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.fillStyle = "white";
                ctx.strokeStyle = '#2CAE00';
                ctx.arc(px, py, 5, 0, 2* Math.PI, false);
                ctx.fill();
                ctx.stroke();
            }

        }

        if(!evented){//防止重复绑定
            evented=true;
            showTip&&ele.addEventListener('touchstart', function(e){//一些属性需要充值掉
                painted=false;//背景线
                pointArr=[];
                var touchEvent = e.touches[0];
                ctx.clearRect(0,20, width+60, -height-20);
                for(var i in data){
                    draw(data[i],opts[i + "Color"],{x: touchEvent.pageX, y: touchEvent.pageY - J.g(ele).up(0).offset().y});
                }
            }, false);

        }
    }

    function bindEvent(){
        if(opts.ymdBox && D.getElementById(opts.ymdBox)){
            var btns=D.getElementById(opts.ymdBox).children;
            var len=btns.length;
            btns[0].className="hover";//需要根据nearby动态改进
            (J.g(opts.ymdBox).length&&J.g(opts.ymdBox)).on("click",function(e){
                if(e.target.hasAttribute("data-nearby")){
                    var node= e.target;
                    var type=node.getAttribute("data-nearby");
                    if(type){
                        var args= J.mix(opts.data,{nearby:type});
                        hideMsg();
                        changeYmd(node,len,btns)
                        getData(args);
                    }
                }
                return false;
            });
        }

        if(opts.resize){
            var timer=null;
            window.addEventListener("resize",function(e){ //todo 需要当前的DATA[args.nearby]
                clearTimeout(timer);

                timer=setTimeout(function(){
                    hideMsg();
                    drawLine(NOW); //走缓存当前的 DATA[args.nearby]
                },100);
            });
        }
    }

    function line(dlen,points,lineColor){
        ctx.lineWidth = 2;
        ctx.strokeStyle = lineColor;
        ctx.beginPath();
        ctx.font = '12px simsun';
        ctx.textAlign='center';//start end left right center
        for (var i = 0; i < dlen; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    function circle(dlen,points,lineColor,data,eventPosition){
        for (var i = 0; i < dlen; i++) {
            var p = points[i];
            if(i!=dlen-1){
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.fillStyle = "white";
                ctx.strokeStyle = lineColor;
                ctx.arc(p.x, p.y, 3, 0, 2* Math.PI, false);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.fillStyle = "transparent";
                ctx.strokeStyle = "transparent";
                ctx.arc(p.x, p.y, 10, 0, 2* Math.PI, false);
                ctx.fill();
                ctx.stroke();

            }else{//最后一个圈
                ctx.beginPath();
                ctx.fillStyle = colorRgb(lineColor,0.3);
                //ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.arc(p.x, p.y,8, 0, 2* Math.PI, false);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.fillStyle = lineColor;//最后一个圆圈内部
                ctx.strokeStyle =lineColor;
                ctx.arc(p.x, p.y,3, 0, 2* Math.PI, false);
                ctx.fill();
                ctx.stroke();
            }

            if(!!eventPosition){
                var key={
                    comm:'小区',
                    region:'区域',
                    city:"城市"
                }
                var ex=eventPosition.x * window.devicePixelRatio;
                var ey=eventPosition.y * window.devicePixelRatio;
                if(!!ctx.isPointInPath(ex,ey)){
                    var names=Object.keys(data);

                    for(var n=0;n<names.length;n++){
                        showTip.s("span").eq(n).html(key[names[n]])
                        showTip.s("i").eq(n).html(data[names[n]][i]);
                    }
                    var showLeft =ex/window.devicePixelRatio- (parseInt(showTip.getStyle("width"))/2 + 5),
                        tempValue = parseInt(showTip.up(0).getStyle("width")) - parseInt(showTip.getStyle("width")) -75;
                    if(showLeft < -10){
                        showLeft = -10
                    }else if(showLeft > tempValue){
                        showLeft = tempValue;
                    }//devicePixelRatio 定位过程需要还原
                    showTip.setStyle({"display":"block","left":showLeft + "px","top":ey/ window.devicePixelRatio-70+"px"});
                }
            }
        }
    }
    function dotted(dlen,space){
        var step = dlen - 1;
        ctx.beginPath();
        ctx.strokeStyle = "#CCCCCC";
        ctx.lineWidth =1+0.5;
        ctx.fillStyle = "#FFFFFF";
        ctx.moveTo(space * (step + 0.5),0);
        ctx.lineTo(space * (step + 0.5), -height);
        ctx.stroke();
        ctx.beginPath();
        for(var m = 0,n = height/7;m<n;m++){
            ctx.fillRect(space * (step + 0.5) - 2, m*7 + 2 - height, 4, 2);
        }
        ctx.stroke();
    }
    function bgX(dlen,space) {

        //背景线
        ctx.lineWidth = 1+0.5;
        ctx.fillStyle='#666666';
        ctx.strokeStyle =  "#EFEFEF";
        ctx.font = '12px arial';
        ctx.textAlign='center';
        //背景 竖线和X标注
        for(var i=1;i<dlen + 1;i++) {
            ctx.beginPath();
            ctx.strokeStyle = (i == dlen ? "#ccc" : "#EFEFEF");
            ctx.moveTo(space * (i - 0.5), 0);
            ctx.lineTo(space * (i - 0.5), -height);
            var theX=formatX(AXIS["region"][i - 1]||AXIS["city"][i - 1]||AXIS["comm"][i - 1]);
            if((opts.data.nearby==36) || opts.data.nearby==12) {//三年显示逻辑和1年
                if((i%3==1)){
                    ctx.fillText(theX+ "", space * (i - 0.5)+0, 15);
                }else if(i==dlen){ //最后一个需要显示
                    ctx.fillText(theX+ "", space * (i - 0.5)+0, 15);
                }else{
                    ctx.fillText("",space * (i - 0.5)+5, 15);
                }
            }
            if(opts.data.nearby==6){//6个月显示逻辑
                ctx.fillText(theX, space * (i - 0.5)+0, 15);
            }
            ctx.stroke();
        }
    }
    function bgY(dlen,space){
        //背景 横线和Y标注
        ctx.lineWidth = 1;
        ctx.fillStyle='#666666';

        for(var i=0; i<5;i++){
            ctx.beginPath();
            ctx.strokeStyle = (i == 0 ? "#bbbbbb" : "#EFEFEF");
            ctx.moveTo(0, -height/5 * i);
            ctx.lineTo(width, -height/5 * i);

            var value=formatY(i,opts.Y);
            if (value < 0) value = 0;
            if(i==0 && value==0){ //第一格 默认0的时候 不再显示
                ctx.fillText("", width + 10, -height/5 * i);//y轴文字贴边偏移
            }else{
                if(value==0){value=parseInt(value)} //0.000 => 0
                ctx.fillText(value + opts.Y, width + 10, -height/5 * i);
            }
            ctx.stroke();
        }
    }

    function getData(args){//统一走缓存
        //if(!DATA[args.df]){
        J.get({
            url:opts.url,
            type: "json",
            data:args,
            timeout:15000,
            onSuccess:function(res){
                if(res.status=="ok"){

                    NOW=initData(res);
                    drawLine(NOW);
                    opts.callback&&opts.callback(NOW);
                }
            },
            onFailure:function(res){}
        })
        //            }else{
        //                NOW=DATA[args.df];
        //                drawLine(DATA[args.df]);
        //            }
    }
    function hideBlock(){
       J.g(ele).up(0).setStyle({'display':'none'});
    };
    function changeYmd(node,len,btns){
        while(len--){
            btns[len].className="";
        }
        node.className="hover";
    }

    function showYmd(e){//1,2,3//todo 判断按钮的隐藏显示

        if(opts.ymdBox && D.getElementById(opts.ymdBox)){
            var map={
                36:3,
                12:2,
                6:1
            },l;

            var btns=D.getElementById(opts.ymdBox).children;


            if(e==36){
                l=map[36];
            }
            if(e>12 && e<36){
                l=map[12]
            }
            if(e>6 && e<12){
                l=map[6]
            }
            if(e==6){
                l=map[6];
            }
            if(e<6){
                J.g(opts.ele).up(0).setStyle({'display':'none'});
                l=0;
            }
            while(l--){
                btns[l].style.display="inline-block";
            }
        }
    }
    function initData(e){
        showYmd(e.hasData);
        var DATA={};
        /*
         var names=Object.keys(e.data);
         for(var i=0;i<names.length;i++){//comm,region
         var res=e.data[names[i]];
         DATA[names[i]]=[];
         AXIS[names[i]]=Object.keys(res);
         //console.log(e.data[names[i]]);
         for(var n in res){
         DATA[names[i]].push(res[n].mid_price);
         }
         }*/

        var commData = e.data.comm,regionData = e.data.region,cityData=e.data.city,
            commArr = [], regionArr = [],cityArr=[],
            month = [],month_2 = [],month_3=[];

        for(var i in commData){ //最大个数
            commArr.push(parseInt(commData[i].mid_price));
            month.push(i);
        }
        for(var i in regionData){
            regionArr.push(parseInt(regionData[i].mid_price));
            month_2.push(i);
        }
        for(var i in cityData){
            cityArr.push(parseInt(cityData[i].mid_price));
            month_3.push(i);
        }

        //把最大的放开始
        if(cityArr.length>=1){DATA.city=cityArr}
        if(regionArr.length>=1){DATA.region=regionArr}
        if(commArr.length>=1){DATA.comm=commArr}
        //[32344, 32348, 33243]
        AXIS.city=month_3;
        AXIS.region=month_2;
        AXIS.comm=month;

        return DATA;
    }

    function changePixelRatio(context, w, h){
        if (window.devicePixelRatio) {
            context.canvas.style.width = w + "px";
            context.canvas.style.height = h + "px";
            context.canvas.height = h * window.devicePixelRatio;
            context.canvas.width = w * window.devicePixelRatio;
            context.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
    }

    function formatX(e){//公开,长度不一画线,租房少金额y轴显示元补是万,背景线

        switch(opts.X){
            case 'normal':
                return e.toString().replace(/^(2|3)0/g,'').replace(/^(..)/g,"$1.");
                break;
            case "large":
                return e.toString().replace(/^(....)/g,"$1.");
                break;
            default:
        }
    }
    function formatY(i,Y){
        var res=mainData.min + Math.round(mainData.avg/3) * (i==0 ? -1 : (i-1));
        switch(Y){
            case '元':
                return res;
                break;
            case "万":
                return (res / 10000).toFixed(3);
                break;
            default:
        }
    }
    function hideMsg(){
        showTip&&showTip.setStyle({"display":"none"});
    }
    function scalePrice(v,height,min,dataAvg){
        return -(height * 3 / 5) * (v - min) / dataAvg - height / 5;
    }
    function colorRgb(color,e) {
        var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        var sColor = color.toLowerCase();
        if (sColor && reg.test(sColor)){
            if (sColor.length === 4) {
                var sColorNew = "#";
                for (var i = 1; i < 4; i += 1) {
                    sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
                }
                sColor = sColorNew;
            }
            var sColorChange = [];
            for (var i = 1; i < 7; i += 2) {
                sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
            }
            return "rgba(" + sColorChange.join(",") + (e?','+e+'':'')+")";
        } else {
            return sColor;
        }
    };
    function coreData(arr){
        var mixData= Array.prototype.concat.apply([],arr);
        var max = Math.max.apply(null, mixData);
        var min = Math.min.apply(null, mixData);
        var avg = (max - min);

        return{
            mixData:mixData,
            max:max,
            min:min,
            avg:avg
        }
    }
}
    J.ui.zChart=zChart;
})(J,document);