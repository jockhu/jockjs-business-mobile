/**
 * <ul id="ymdRegion"> 可选
 <li date-type="6">6个月</li>
 <li date-type="12">1年</li>
 <li date-type="36">3年</li>
 </ul>

 *  <div>
 <canvas id="lineComm"></canvas>
 </div>
 *
 *  var chart=new J.ui.zChart({
                    url:"/ajax/propprice",
                    ele:"lineComm",
                    ymdBox:"ymdRegion可选",
                    regionColor : "black",
                    commColor : "green",
                    cityColor : "red",
                    data:{
                        comm_id:10086,
                        areacode:10086,
                        citycode:10086
                    },
                    callback:function(){}
        });
 */



;(function(J,D,undefined){

    function zChart(options){

        var defs = {
            ymdBox:null,
            ele:null,
            callback:options.callback,
            url:options.url,
            regionColor : "#999999",
            commColor : "#E64A00",
            cityColor : "#E64A00",
            changed:false,
            nearby:6     //默认是6个月
        }, opts,ele,ctx,width,height,max,min,dataAvg,name,pointArr,btns,AXIS={};//X轴
        var timer=null;
        var DATA=null;
        (function () {
            opts = J.mix(defs, options || {}, true);
            var args= J.mix(opts.data,{nearby:opts.nearby});//默认6个月
            ele=D.getElementById(opts.ele);
            ctx = ele.getContext("2d");
            init();
            getData(args);
            bindEvent();
           // drawLine(initData(D2));
            //bindEvent();
        })();

        function init(){
            pointArr = [],name=[];
            width = parseInt(J.g(ele).up(0).getStyle("width")),
                height = Math.round(width * 0.5);
            J.g(ele).up(0).setStyle({"height": height + "px"});
            changePixelRatio(ctx, width, height);
            width -= 55;
            height -= 20;
            ctx.clearRect(0, 0, ele.width, ele.height);
            ctx.translate(0, height);
        }


        function bindEvent(){
            if(opts.ymdBox&& D.getElementById(opts.ymdBox)){
                btns=D.getElementById(opts.ymdBox).children;
                btns[2].className="hover";//需要根据nearby动态改进
                var len=btns.length;
                (J.g(opts.ymdBox).length&&J.g(opts.ymdBox)).on("click",function(e){
                    if(e.target.hasAttribute("date-type")){
                        var node= e.target;
                        var type=node.getAttribute("date-type");
                        if(type){
                            T.trackEvent("track_"+ J.site.info.pageName.toLowerCase()+"_"+opts.ymdBox.toLowerCase()+type+"_click");
                            var args= J.mix(opts.data,{nearby:type});//传入月份或年份
                            getData(args);
                            changeYmd(node,len);
                        }
                    }
                    return false;
                });
            }
            window.addEventListener("resize",function(){
                clearTimeout(timer);
                timer=setTimeout(function(){
                    getData();
                },100);
            })
        }

        function changeYmd(node,len){
            while(len--){
                btns[len].className="";
            }
            node.className="hover";
        }

        function getData(args){
            if(args){
                J.get({
                    url:opts.url,
                    type: "json",
                    data:args,
                    timeout:15000,
                    onSuccess:function(res){
                       if(res.status=="ok"){
                            opts.callback&&opts.callback(res);
                            DATA=initData(res);
                            drawLine(DATA);
                       }
                    },
                    onFailure:function(res){}
                })
            }else{
                drawLine(DATA);
            }
        }

        function drawLine(data) {
            init();
            var painted=false,mixData,arr=[],lined=0;
            for(var i in data){
                arr.push(data[i]);
                name.push(i);
                lined++;
            }
            mixData= Array.prototype.concat.apply([],arr);
            max = Math.max.apply(null, mixData),min = Math.min.apply(null, mixData);
            dataAvg = (max - min);
            for(var i in data){
                draw(data[i],opts[i + "Color"]);
            }
            function draw(e,lineColor){
                var dlen = e.length, points = [], space = width / dlen;
                lineColor = lineColor || "#000000";

                if(!painted){
                    painted=true;
                    //背景线
                    ctx.lineWidth = 1+0.5;
                    ctx.strokeStyle = "#EFEFEF";
                    ctx.fillStyle = '#666666';
                    ctx.font = '12px arial';
                    ctx.textAlign='center';
                    //背景竖线和X标注
                    for(var i=1;i<dlen + 1;i++){
                        ctx.beginPath();
                        ctx.moveTo(space * (i - 0.5), 0);
                        ctx.lineTo(space * (i - 0.5), -height);
                        //                        if(i%2==0 && (opts.data.nearby==36)){//再加个判断上如果type==年
                        //                            ctx.fillText("",space * (i - 0.5)+5, 15);
                        //                        }else{
                        //                            var theX=AXIS["region"][i - 1]||AXIS["city"][i - 1]||AXIS["comm"][i - 1]
                        //                            ctx.fillText(theX+ "月", space * (i - 0.5)+10, 15);
                        //                        }

                        if((opts.data.nearby==36)) {
                            if(i%2==0){
                                var theX=AXIS["region"][i - 1]||AXIS["city"][i - 1]||AXIS["comm"][i - 1]
                                ctx.fillText(theX+ "", space * (i - 0.5)+10, 15);
                            }else{
                                ctx.fillText("",space * (i - 0.5)+5, 15);
                            }
                        }
                        if(opts.data.nearby!=36){
                            var theX=AXIS["region"][i - 1]||AXIS["city"][i - 1]||AXIS["comm"][i - 1]
                            ctx.fillText(theX+ "月", space * (i - 0.5)+0, 15);
                        }

                        ctx.stroke();
                    }
                    //背景横线和Y标注
                    for(var i=0; i<5;i++){
                        ctx.beginPath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = (i == 0 ? "#BBBBBB" : "#EFEFEF");
                        ctx.moveTo(0, -height/5 * i);
                        ctx.lineTo(width, -height/5 * i);
                        var value = ((min + Math.round(dataAvg/3) * (i==0 ? -1 : (i-1))) / 10000).toFixed(3);
                        if (value < 0) value = 0;
                        if(i==0 && value==0){ //默认补充0的时候 不再显示
                            ctx.fillText("", width + 30, -height/5 * i);
                        }else{
                            if(value==0){value=parseInt(value)} //0.000 => 0
                            ctx.fillText(value + "万", width + 30, -height/5 * i);
                        }
                        ctx.stroke();
                    }
                }
                for (var i = 0; i < dlen; i++) {
                    var px = space * (i+0.5);
                    var py = scalePrice(e[i],height,min,dataAvg);
                    points.push({"x" : px,"y" : py});
                }

                line();//画线
                circle();//画圈
                dotted();//画虚线

                function line(){
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
                function circle(){
                    for (var i = 0; i < dlen; i++) {
                        var p = points[i];
                        if(i!=dlen-1){//最后一个圈
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.fillStyle = "white";
                            ctx.strokeStyle = lineColor;
                            ctx.arc(p.x, p.y, 2+0.5, 0, 2* Math.PI, false);
                            ctx.fill();
                            ctx.stroke();
                            //ctx.beginPath();
                            //ctx.fillStyle = "transparent";
                            //ctx.strokeStyle = "transparent";
                            //ctx.arc(p.x, p.y, 12, 0, 2* Math.PI, false);
                            //ctx.fill();
                            //ctx.stroke();
                        }
                    }
                    addOnImg(points);
                }

                function dotted(){
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

                function addOnImg(array){
                    pointArr.push(array);
                    var step = array.length - 1;
                    if(pointArr.length !=lined)return;//只有数组长度足够的时候才执行
                    var image = new Image();
                    image.src = "http://pages.ajkcdn.com/touch/img/global/3/canvasDraw2.png";
                    image.onload = function(){
                        for(var i=0,len = pointArr.length;i<len;i++){
                            if(!opts.changed){
                                var imagePointY = (name[i] == "region" ? 124:179);
                            }else{
                                var imagePointY = (name[i] == "region" ? 179:124);
                            }
                            ctx.drawImage(image, 0, image.height - imagePointY, image.width, 21, pointArr[i][step].x - image.width/3, pointArr[i][step].y - 7, image.width*2/3, 14)
                            //   ctx.drawImage(image, 0,image.height - imagePointY,
                            //   image.width,22, //需要显示的图片宽高
                            //   pointArr[i][step].x - 7,
                            //   pointArr[i][step].y - 7,
                            //   15,15);//等比压缩后宽高
                        }
                    }
                }
            }
        }

        function initData(e) {

            //if(e.status!="ok"){return}
            var DATA={};
            var commData = e.data.comm,
                regionData = e.data.region,
                cityData=e.data.city,
                commArr = [], regionArr = [],cityArr=[],
                month = [],month_2 = [],month_3=[];

            for(var i in commData){
                commArr.push(parseInt(commData[i].mid_price));
                month.push(commData[i].month);
            }
            for(var i in regionData){
                regionArr.push(parseInt(regionData[i].mid_price));
                month_2.push(regionData[i].month);
            }
            for(var i in cityData){
                cityArr.push(parseInt(cityData[i].mid_price));
                month_3.push(cityData[i].month);
            }
            if(regionArr.length>1){DATA.region=regionArr}
            if(commArr.length>1){DATA.comm=commArr}
            if(cityArr.length>1){DATA.city=cityArr}
            AXIS.comm=month;
            AXIS.region=month_2;
            AXIS.city=month_3;
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
        function scalePrice(v,height,min,dataAvg){
            return -(height * 3 / 5) * (v - min) / dataAvg - height / 5;
        }
    }

    J.ui.zChart=zChart;
})(J,document);





