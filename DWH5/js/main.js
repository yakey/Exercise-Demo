/**
 * Created by licheng on 16/8/2.
 */

/*typing*/
(function (root, factory) {
    if (typeof exports === "object") {
        module.exports = factory()
    } else if (typeof define === "function" && define.amd) {
        define("Typing", [], function ($) {
            return root.Typing = factory($)
        })
    } else {
        root.Typing = factory()
    }
})(this, function () {
    function Typing(opts) {
        this.startFun = opts.startFun;
        this.opts = opts || {};
        this.num = 0;
        this.source = opts.source;
        this.output = opts.output;
        this.delay = opts.delay || 80;
        this.flagInsert = opts.flagInsert;
        this.chain = {parent: null, dom: this.output, val: []};
        this._stop = true;
        if (!(typeof this.opts.done == "function"))this.opts.done = function () {
        }
    }

    Typing.fn = Typing.prototype = {
        toArray: function (eles) {
            var result = [];
            for (var i = 0; i < eles.length; i++) {
                result.push(eles[i])
            }
            return result
        }, init: function () {
            this.chain.val = this.convert(this.source, this.chain.val)

        }, convert: function (dom, arr) {
            var that = this, children = this.toArray(dom.childNodes);
            for (var i = 0; i < children.length; i++) {
                var node = children[i];
                if (node.nodeType === 3) {
                    arr = arr.concat(node.nodeValue.split(""))
                } else if (node.nodeType === 1) {
                    var val = [];
                    val = that.convert(node, val);
                    arr.push({dom: node, val: val})
                }
            }
            return arr
        }, print: function (dom, val, callback,flagInsert) {
            var dom = dom;
            var val = val;
            var callback = callback;
            var interval = this.delay;
            var then = Date.now();
            var  that = this;
            //requestAnimationFrame(insert)
            setTimeout(function () {
                dom.appendChild(document.createTextNode(val));
                that.num++;
                if(that.num > flagInsert){
                    dom.scrollIntoView(false)
                }
                callback()
            }, this.delay);
            /*function insert(timeStamp){
             console.log(timeStamp)
             dom.appendChild(document.createTextNode(val));
             callback()
             }*/






        }, play: function (ele) {
            if (this._stop)return;
            if (!ele)return;
            if (!ele.val.length) {
                if (ele.parent)this.play(ele.parent); else this.opts.done();
                return
            }
            var curr = ele.val.shift();
            var that = this;
            if (typeof curr === "string") {
                var num = 0;
                var flagInsert = this.flagInsert;
                this.print(ele.dom, curr, function () {
                    that.play(ele)
                },flagInsert)
            } else {
                var dom = document.createElement(curr.dom.nodeName);
                var attrs = that.toArray(curr.dom.attributes);
                for (var i = 0; i < attrs.length; i++) {
                    var attr = attrs[i];
                    dom.setAttribute(attr.name, attr.value)
                }
                ele.dom.appendChild(dom);
                curr.parent = ele;
                curr.dom = dom;
                this.play(curr.val.length ? curr : curr.parent)
            }
        }, start: function () {
            this._stop = false;
            this.init();

            this.play(this.chain)
        }, pause: function () {
            this._stop = true
        }, resume: function () {
            this._stop = false;
            this.play(this.chain)
        }
    };
    Typing.version = "2.1";
    return Typing
});

/*page*/
function Page(layoutCode, projectCode, imgs, template) {
    this.dict = {one: '49%', two: '38%', three: '71%', four: '17%'};
    this.pass = false;
    this.imgLoaded = 0;
    var pageDom = template.cloneNode(true);
    pageDom.classList.add(layoutCode);
    this.self = pageDom;
    var ele = this.self;
    this.input = document.getElementById(projectCode);
    this.output = ele.getElementsByClassName('output')[0];
    this.out = ele.getElementsByClassName('out')[0];
    this.letters = ele.getElementsByClassName('keyboard')[0].getElementsByClassName('key');
    this.contain = document.getElementById('container');
    this.imgs = imgs;
    this.codeScroll = ele.getElementsByClassName('codescroll')[0];
    this.codeRun = ele.getElementsByClassName('code')[0];
    this.transpng = null;
    this.codeHeight = this.dict[layoutCode];
    //this.next = nextObj ? nextObj : null
    this.next = null;
    this.self.addEventListener('transitionend', function (e) {
        e.stopPropagation()
    })

}
Page.prototype = {
    start: function () {

        var that = this;
        var contain = this.contain;
        that.show();
        if (that.next) {
            that.next.getReady()
        }

        var  codeRunFunc =  function (e) {
            that.codeRun.classList.add('codeRun');
            that.codeScroll.removeEventListener('transitionend',codeRunFunc)
        };

        this.codeScroll.addEventListener('transitionend', codeRunFunc,false);
        // console.log(that.out.offsetHeight + '  fontSize:  '+that.out.style.fontSize + 'lineHeight :'+ that.out.style.lineHeight)
        var containStyle = window.getComputedStyle(that.out);
        var  trimPx = function(str){
            return str.replace('px','')
        };
        var cw = that.out.offsetWidth;
        var ch = that.out.offsetHeight;
        var fontSize = trimPx(containStyle.fontSize);
        var lh = trimPx(containStyle.lineHeight);
        var flagInsert = Math.floor(cw/fontSize) * (Math.floor(ch/lh) - 1);

        var typing = new Typing({
            flagInsert:flagInsert,
            source: that.input,
            output: that.output,
            delay: 60,
            done: function () {
                clearInterval(that.handle);
                setTimeout(function(){
                    if (that.imgCount == that.imgLoaded) {
                        that.pageChange()
                    } else {
                        that.pass = true
                    }
                },1200)
            } //打字结束调用callback
        });

        typing.start();
        codeScroll = this.codeScroll;

        setTimeout(function () {
            codeScroll.style.height = that.codeHeight;
            that.handle = that.randomKey(that.letters)
        }, 70)
    },

    clear: function () {
        this.self.style.display = 'none'
    } ,

    show: function () {
        this.self.style.display = 'block'
    } ,

    pageChange : function () {
        var pngs = this.transpng;
        var i = 0;
        var fps = 50;
        var len = pngs.length;
        var self = this.self;
        var next = this.next;
        var that = this;
        this.contain.classList.remove('showPage');

        if(next !== null){
            self.style.display = 'none';
            pngs[i].style.display = 'block';
            setTimeout(function transLoop() {
                i++;
                if (i < len) {
                    pngs[i - 1].style.display = 'none';
                    pngs[i].style.display = 'block';
                    setTimeout(transLoop, fps)
                } else {
                    pngs[i - 1].style.display = 'none';

                    next.start()
                }
            }, fps)
        }else{
            that.ending()
        }


    },

    randomKey: function (letters) {
        function toggleKey(key) {
            key.classList.add('key-down');
            setTimeout(function () {
                key.classList.remove('key-down')
            }, 300)
        }

        return setInterval(function () {
            toggleKey(letters[parseInt(Math.random() * 74, 10)]);
            toggleKey(letters[parseInt(Math.random() * 74, 10)]);
            toggleKey(letters[parseInt(Math.random() * 74, 10)])

        }, 200)


    },

    getReady : function () {
        var imgLoaded = this.imgLoaded;
        var page = this;

        function _countLoad() {
            page.imgLoaded++;
            if (page.imgLoaded == page.imgCount && page.pass === true) {
                page.pageChange()
            }
            this.removeEventListener('load',_countLoad)
        }

        var pagedom = this.self;
        var imgs = this.imgs;
        var mainGif = new Image();
        mainGif.src = imgs.main;
        mainGif.onload = _countLoad;
        pagedom.getElementsByClassName('gif-frame')[0].appendChild(mainGif);
        var pageTrans = [],
            trans = imgs.trans;
        len = trans.length;
        transBox = document.getElementsByClassName('trans')[0];
        this.imgCount = len + 1;
        for (var i = 0; i < len; i++) {
            var temp = new Image();
            temp.style.display = 'none';
            temp.src = trans[i];
            temp.onload = _countLoad;
            pageTrans.push(temp);
            transBox.appendChild(temp)
        }
        this.transpng = pageTrans;
        document.getElementById('container').appendChild(pagedom)


    } ,

    ending: function () {
        var logo = document.getElementById('ending');
        var ending = document.getElementById('ending-glow');
        var self = this.self;
        self.classList.remove('screenRotate');
        /*  this.contain.style.transform  = 'rotateY(90deg)'
         this.contain.style.webkitTransform = 'rotateY(90deg)'*/
        this.contain.classList.add('endingRotate');
        this.contain.addEventListener('animationend',function(){
            ending.style.display = 'block';
            ending.classList.add('flash');
            this.style.display = 'none';
            logo.style.opacity = 1
        });
        this.contain.addEventListener('webkitAnimationEnd',function(){
            ending.style.display = 'block';
            ending.classList.add('flash');
            this.style.display = 'none';
            logo.style.opacity = 1
        })
    } ,
};

/*loader*/
function Loader(pageArr,imgSrcArr){
    this.firstPage = null;
    this.pageQueue = pageArr;
    this.imgSrcArr = imgSrcArr;
    this.imgsCount = imgSrcArr.length;
    this.loaded = 0;
    this.loader = document.getElementById('loadwrap');
    this.wrap = document.getElementsByClassName('wrap')[0];

    var que = this.pageQueue;

    if(que.length > 0 ){
        this.firstPage  = que.shift();
        var qlen = que.length;
        var cur = this.firstPage;
        while(qlen > 0){
            cur.next = que.shift();
            cur = cur.next;
            qlen--
        }
    }
}
Loader.prototype = {
    go: function () {
        var imglen = this.imgsCount;
        var loadque = [];
        var imgSrcArr = this.imgSrcArr;
        var that = this;

        for (j = 0; j < imglen; j++) {
            loadque[j] = new Image();
            loadque[j].src = imgSrcArr[j];
            function start() {
                console.log(that);
                that.firstPage.getReady();
                setTimeout(function () {
                    var first = that.firstPage;
                    that.loader.style.display = 'none';
                    that.wrap.style.display = 'block';
                    first.contain.classList.add('showPage');
                    first.contain.style.transform = 'rotateY(0deg)';
                    first.start()
                }, 3000)
            }

            var loadImg = function () {
                that.loaded++;
                if (that.loaded === that.imgsCount) {
                    if (window.orientation) {
                        if (window.orientation === 0 || window.orientation === 180) {
                            start()
                        }
                        else {
                            /*do nothing*/
                        }
                    } else {
                        start()
                    }
                }
                this.removeEventListener('load', loadImg)
            };

            loadque[j].onload = loadImg
        }
    },

    uaJudge: function (uaRegArr, redirectUrl) {
        var userAgent = navigator.userAgent.toLowerCase();
        var len = uaRegArr.length;
        for (var i = 0; i < len; i++) {
            if (uaRegArr[i].test(userAgent)) {
                console.log(uaRegArr[i]);
                return
            }
        }
        window.location.href = redirectUrl
    }
} ;

/*main*/
(function(){
    document.addEventListener('touchmove',function (e) {
        e.preventDefault()
    });
    document.addEventListener('touchstart',function (e) {
        e.preventDefault()
    });

    var template = document.getElementsByClassName('page')[0];

    var shImgs = {
        main: 'http://mat1.gtimg.com/finance/cj/dw//SH.gif',
        trans: ['imgs/trans/SH-1.png', 'imgs/trans/SH-2.png', 'imgs/trans/WL-2.png', 'imgs/trans/WL-1.png']
    };
    var wlImgs = {
        main: 'http://mat1.gtimg.com/finance/cj/dw//WL.gif',
        trans: ['imgs/trans/WL-1.png', 'imgs/trans/WL-2.png', 'imgs/trans/SW-2.png', 'imgs/trans/SW-1.png' ]
    };

    var swImgs = {
        main: 'http://mat1.gtimg.com/finance/cj/dw/SW.gif',
        trans: ['imgs/trans/SW-1.png', 'imgs/trans/SW-2.png' , 'imgs/trans/GA-2.png', 'imgs/trans/GA-1.png']
    };

    var gaImgs = {
        main: 'http://mat1.gtimg.com/finance/cj/dw//GA.gif',
        trans: ['imgs/trans/GA-1.png', 'imgs/trans/GA-2.png', 'imgs/trans/BD-2.png', 'imgs/trans/BD-1.png']
    };
    var bdImgs = {
        main: 'imgs/BD.gif',
        trans: ['imgs/trans/BD-1.png', 'imgs/trans/BD-2.png', 'imgs/trans/TT-2.png', 'imgs/trans/TT-1.png']
    };
    var ttImgs = {
        main: 'http://mat1.gtimg.com/finance/cj/dw//TT.gif',
        trans: ['imgs/trans/TT-1.png', 'imgs/trans/TT-2.png', 'imgs/trans/DP-2.png', 'imgs/trans/DP-1.png' ]
    };
    var dpImgs = {
        main: 'http://mat1.gtimg.com/finance/cj/dw//DP.gif',
        trans: ['imgs/trans/DP-1.png']
    };

    var sh = new Page('one', 'SH', shImgs, template);
    var wl = new Page('two', 'WL', wlImgs, template);
    var sw = new Page('three', 'SW', swImgs, template);

    var ga = new Page('one', 'GA', gaImgs, template);
    var bd = new Page('two', 'BD', bdImgs, template);
    var tt = new Page('three', 'TT', ttImgs, template);
    var dp = new Page('one', 'DP', dpImgs, template);


    var imgUrl = ['http://mat1.gtimg.com/finance/cj/dw/bottom-glow.png','http://mat1.gtimg.com/finance/cj/dw/screen.png','http://mat1.gtimg.com/finance/cj/dw/gif-frame-wl.png',
        'http://mat1.gtimg.com/finance/cj/dw/bg.jpg',"http://mat1.gtimg.com/finance/cj/dw/gif-frame.png","http://mat1.gtimg.com/finance/cj/dw//SH.gif"];
    var myload = new Loader([sh,wl,sw,ga,bd,tt,dp],imgUrl);
//myload.uaJudge([/micromessenger/,/qqnews/i],'http://finance.qq.com/zt2016/Dreamwriter/redirect.htm')
    myload.go()

}());




/*  |xGv00|d3a98bbd2ce0f81c8288e67a2d990bb0 */