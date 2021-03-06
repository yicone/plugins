//知识点选择组件

var Backbone = require("common:components/backbone/backbone.js");
var $ = require("common:components/jquery/jquery.js");
var KnowledgeTmpl = __inline('_knowledge.tmpl');
require('../lib/ztree/style/zTreeStyle.css');
require('../lib/ztree/jquery.ztree.all.min.js');
//var ztreeDom;
var KnowLadge = Backbone.View.extend({
    initialize: function(args) {
        Backbone.View.prototype.initialize.apply(this, arguments);
        this.$el = args.$el;
        this.treedata = args.data || {};
        this.url = args.url || '';
        this.knowText = args.knowTextArr;
        this.init(args);
        this.bindEvents();
    },
    events: {
        'click .addknowLadge': 'addknowLadgeHander',
        'click .cancel': 'cancelHander',
        'click .knowledge-confirm': 'confirmHander',
        'click .reset': 'resetHander',
        'click .btnsearch': 'btnsearchHander',
        'click .knowLadgeDel': 'knowLadgeBtnHander',
        'keydown .searchinput': 'searchinputBtnHander'

    },
    init: function(options) {

        this.knowText = options.knowTextArr || [];
        this.tmpknowArr = []; //存放弹窗上次查询结果选中节点的数组
        this.popkonwArr = []; //知识点展示文本数组
        this.sameelArr = []; //保存已经勾选的重复元素。
        this.knowTextStr = ""; //知识点字符串
        this.delkonwArr = []; //临时删除的知识点数组
        this.ztreeDom = null;
        this.knowTextStr = this.getKnowTextStr(this.knowText);
        if (this.knowText.length <= 0) {
            this.konwArr = [];
        } else {
            this.konwArr = this.knowText;
        }
        //console.log("this.konwArr", this.konwArr);
        var knowledgeTmpl = KnowledgeTmpl({
            knowTextArr: this.konwArr,
            knowTextStr: this.knowTextStr

        });
        this.$el.html(knowledgeTmpl);
        this.getKnowledgeData();

    },
    getKnowTextStr: function(varr) {
        var arr = varr || [];
        var tmparr = [];
        for (var i = 0, len = arr.length; i < len; i++) {
            var item = arr[i];
            tmparr.push(item.name);
        }
        return tmparr.join(",");
    },
    moreArrdelSameEl: function(varr1, varr2) {
        //清除两个数组（varr2中和varr1相同的元素）中的重复元素：清除tmpknowArr中sameelArr相同的元素
        var me = this;
        var konwArr = [],
            tmpObj = {};

        for (var h = 0, lenh = varr1.length; h < lenh; h++) {
            var itemh = varr1[h];
            tmpObj[itemh.name] = 1;

        }
        for (var k = 0, len = varr2.length; k < len; k++) {
            var item = varr2[k];

            if (!tmpObj[item.name]) {
                konwArr.push(item);
            }
        }
        me.sameelArr = []; //清空
        return konwArr;
    },
    arrDelSameEL: function(arr) {
        //数组去重 arr=[{id:1,name:'name'}];
        var varr = arr || [];
        var obj = {};
        var newArr = [];
        for (var i = 0, len = varr.length; i < len; i++) {
            var item = varr[i];
            var name = item.name;
            if (!obj[name]) {

                newArr.push(item);
                obj[name] = 1;
            }
        }
        return newArr;
    },
    rerenderTmpl: function() {
        this.konwArr = this.arrDelSameEL(this.konwArr);
        this.knowTextStr = this.getKnowTextStr(this.konwArr);
        var knowledgeTmpl = KnowledgeTmpl({
            knowTextArr: this.konwArr,
            knowTextStr: this.knowTextStr
        });
        this.$el.html(knowledgeTmpl);
        this.initTree(this.treedata);
    },
    getValue: function() {

        return this.konwArr;
    },
    reduceData: function(vtreeData, vknowTextJson) {
        //递归函数：优化数据，父节点去掉checkbox，只有叶子节点才有checkbox
        //vknowText,已选中的知识点

        var data = vtreeData || [];
        var knowTextJson = vknowTextJson || [];
        //var knowText = (vknowText||'') + ',';
        var me = this;

        function abc(vdata) {
            var data = vdata || [];
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                (function(item) {
                    //已有知识点设置选中 此功能去掉vknowText

                    for (var k = 0, len = knowTextJson.length; k < len; k++) {
                        var itemk = knowTextJson[k];
                        if (itemk.name == item.name) {
                            item.checked = true;
                            me.sameelArr.push(itemk);
                        }
                    }
                    //父节点去掉checkbox
                    if (item.hasOwnProperty('children') && item.children.length > 0) {
                        item.nocheck = true; //父节点添加属性nocheck
                        abc(item.children);
                    }
                })(item);
            }
            return data;
        }
        return abc(data);
    },
    initTree: function(treeData, knowText) {
        //初始化树结构
        var me = this;
        var zTree;
        var zNodes = me.reduceData(treeData, knowText);
        var t = me.$el.find(".knowLadge-tree");
        var num = new Date().getTime();
        t.attr('id', num);
        //var fistNodeId = zNodes[0].id;
        var setting = {
            check: {
                enable: true,
                chkboxType: {
                    "Y": "",
                    "N": ""
                }
            },
            view: {
                dblClickExpand: false,
                showLine: true,

                showIcon: function(treeId, treeNode) {
                    return false;
                }
            },
            data: {
                simpleData: {
                    enable: true
                }
            },
            callback: {
                beforeClick: function(treeId, treeNode) {
                    //var zTree = $.fn.zTree.getZTreeObj("treeDemo");
                    //console.log(111);
                    me.ztreeDom.checkNode(treeNode, !treeNode.checked, null, true);
                    return false;
                },
                onCheck: function(e, treeId, treeNode) {
                    var nodes = me.ztreeDom.getCheckedNodes(true),
                        v = "",
                        vArr = [],
                        konwArr = [];
                    //清除重复元素

                    konwArr = me.moreArrdelSameEl(me.sameelArr, me.tmpknowArr);
                    //获取勾选元素
                    for (var i = 0, l = nodes.length; i < l; i++) {
                        var vobj = {
                            name: nodes[i].name,
                            id: nodes[i].id
                        };
                        v += nodes[i].name + ",";
                        vArr.push(vobj);

                    }

                    me.tmpknowArr = konwArr;

                    if (v.length > 0) v = v.substring(0, v.length - 1);

                    //console.log(me.tmpknowArr);
                    me.setKnowShowText(false, vArr);
                }
            }
        };
        me.ztreeDom = $.fn.zTree.init(t, setting, zNodes);

    },
    getKnowledgeData: function(v_keyword) {
        //获取数据
        var keyword = v_keyword || '';
        //console.log("keyword...", v_keyword, keyword);
        if (this.url == '') {
            this.url = "/pc/pdv2/pointSearch.do?text=";
        }
        var url = this.url + encodeURIComponent(keyword);
        var params = {};
        var me = this;
        //console.log("url..",url);
        $.get(url, params).then(function(data) {
            //console.log(data);

            if (typeof data == "string") {
                data = $.parseJSON(data);
            }
            if (data.status.code == 0) {
                me.treedata = data.data;
                me.tmpknowArr = me.popkonwArr; //保存上次筛选结果
                me.initTree(me.treedata, me.tmpknowArr);

            } else {
                alert('数据请求失败！');
                return false;
            }
        });
    },
    setKnowShowText: function(vflag, vselArr) {
        //vflag true 清空
        if (vflag) {
            this.tmpknowArr = [];
        }
        var domObj = this.$el.find('.selected-kldage');

        var selArr = vselArr || [];
        var nameArr = [];
        var vdata = "";

        this.popkonwArr = this.tmpknowArr.concat(selArr);
        this.popkonwArr = this.arrDelSameEL(this.popkonwArr);

        var len = this.popkonwArr.length;
        for (var i = 0; i < len; i++) {
            var item = this.popkonwArr[i];
            nameArr.push(item.name);
        }
        vdata = nameArr.join('<br/>');
        domObj.html(vdata);
    },
    knowLadgeBtnHander: function(evt) {
        //移除知识点dom
        var $target = $(evt.currentTarget);
        var index = $target.data('index');

        $target.parent().remove();

        this.delkonwArr.push(this.konwArr[index]);
    },
    addknowLadgeHander: function(evt) {
        //添加知识点
        var me = this;
        var $curDom = this.$el.find('.pop-knowLadge');
        $curDom.toggle(0, function() {
            if ($curDom.is(':hidden')) {
                me.delkonwArr = [];
                me.rerenderTmpl();
            }
        });

    },
    btnsearchHander: function() {
        //搜索
        var me = this;
        var val = this.$el.find('.searchinput').val();
        me.getKnowledgeData(val);
    },
    resetHander: function(evt) {
        //清空
        this.ztreeDom.checkAllNodes(false);
        this.setKnowShowText(true);

    },
    cancelHander: function(evt) {
        //取消
        this.$el.find('.pop-knowLadge').hide();
        this.delkonwArr = [];
        this.rerenderTmpl();
    },
    searchinputBtnHander: function(evt) {
        //键盘操作--

        if (evt.keyCode == 13) {
            this.btnsearchHander(evt);
        }

    },
    confirmHander: function(evt) {
        //确定
        this.konwArr = this.moreArrdelSameEl(this.delkonwArr, this.konwArr);
        if (this.popkonwArr.length > 0) {
            this.konwArr.push.apply(this.konwArr, this.popkonwArr);
            this.popkonwArr = [];
            this.tmpknowArr = [];

        }
        this.delkonwArr = [];
        this.rerenderTmpl();
        this.cancelHander();
    }
});

return KnowLadge;
