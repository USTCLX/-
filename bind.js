// *
//  * v0.1 create by lixiang in 2017/11/15
//  * 双向绑定模型,sx_Scope对象维护一个watchers数组，watchers存放检查的表达式和对应的回调函数,详见设计文档与example
//  * 用例：
//  * 在html中使用ng-model指令绑定值，例如：
//  * <input type="text",sx-model="user.name">
//  *
//  * 在js中实例化一个sx_Scope，例如：
//  * var myScope = new sx_Scope({reciprocal:true})//开启双向绑定。此时input中的变化会反应到sx_Scope.user.name中。
//  * myScope.user = {
//  *     name:'AHMI'
//  * };
//  * myScope.digest();//手动进行一次循环检查，更新视图。
//  *
//  * 开发者在后期需要通过更新model来更新视图时，出于性能考虑，需要手动触发myScope.digest()
//  *
//  * ————————————————————————————————————————————————————————————————————————————————————————————————
//  *
//  * v0.2 edit by lixiang in 2017/11/16
//  * 通过es5的setter和getter机制，实现了无需手动digest()而触发数据刷新
//  * 用例：
//  * 在注入数据之后，调用myScope.setup()取代myScope.digest()方法。
//  * 后面数据改变时直接操作myScope中的数据就可以了，无需手动调用digest()方法。



/**
 * sx_Scope构造函数
 * @param {obj} options   选项，目前支持是否双向绑定。
 * @param {obj} dataModel 数据对象，通过这个方式初始化的数据模型，可以自动调用digest()
 */
;(function(factory){
    if(typeof define==='function'&&define.amd){
        // AMD. Register as an anonymous module.
        define("sx_Scope",[],factory);
    }else if(typeof module ==='object' &&module.exports){
        // Node/CommonJS
        module.exports = factory()
    }else{
        // Browser globals
        window.sx_Scope = factory();
    }
}(function(){
    var sx_Scope = function(options) {
        this.watchers = [];

        var self = this;
        var reciprocal = options&&options.reciprocal||false;//是否支持视图到模型的绑定
        var elements = document.querySelectorAll('[sx-model]');//获取所有包含ng-model属性的元素

        for(var i = 0, len =elements.length; i < len; i++){

            (function(i) {
                self.watch(function() {
                    //获取属性名
                    return self.str2PropGet(elements[i].getAttribute('sx-model'));
                }, function() {
                    var args = Array.prototype.slice.call(arguments);
                    var elementType = elements[i].tagName.toLowerCase();
                    //设置属性值
                    if(elementType === 'input' || elementType === 'textarea' || elementType === 'select') {
                        elements[i].value = args[0]||self.str2PropGet(elements[i].getAttribute('sx-model'));;
                    } else {
                        elements[i].innerHTML = args[0]||self.str2PropGet(elements[i].getAttribute('sx-model'));
                    }
                });
            })(i);

        }

        //事件处理与监听
        function pageElementEventHandler(e) {
            var target = e.target || e.srcElemnt;
            var fullPropName = target.getAttribute('sx-model');

            if(fullPropName && fullPropName !== '') {
                self.str2PropSet(target.getAttribute('sx-model'), target.value);
                self.digest();
            }

        }

        //开启视图监听，更新模型
        if(reciprocal){
            document.addEventListener('keyup', pageElementEventHandler, false);
            document.addEventListener('change', pageElementEventHandler, false);
        }
    };


    Object.assign(sx_Scope.prototype,{
        watch:function(watchExp, callback) {
            this.watchers.push({
                watchExp: watchExp,
                callback: callback || function() {}
            });
        },
        digest:function(){
            var dirty;
            do {
                dirty = false;
                for(var i = 0; i < this.watchers.length; i++) {
                    var newVal = this.watchers[i].watchExp(),
                        oldVal = this.watchers[i].last;
                    if(newVal !== oldVal) {
                        this.watchers[i].callback(newVal, oldVal);
                        dirty = true;
                        this.watchers[i].last = newVal;
                    }
                }
            } while(dirty);
        },
        // 获取sx_Scope下的相关属性值
        str2PropGet:function(propPath){
            var props = propPath.split('.');
            var result = this;
            try{
                for(var i = 0; i < props.length; i++) {
                    result = result[props[i]];
                }
            }catch(err){
                throw new Error('ng-model reference err',err);
            }

            return result;
        },
        // 设置sx_Scope下的相关属性值
        str2PropSet:function(propPath,value){
            var props = propPath.split('.');
            var result = this;
            try{
                for(var i = 0; i < props.length - 1; i++) {
                    result = result[props[i]];
                }
            }catch(err){
                throw new Error('ng-model reference err',err);
            }
            result[props[i]] = value;
        },
        setup:function(){
            // 以数据劫持的方式支持数据绑定，可以自动刷新。
            var propType,
                value,
                self=this,
                //数据劫持函数，为属性添加getter和setter方法
                parserData = function(obj){
                    for(var prop in obj){
                        if(obj.hasOwnProperty(prop)){
                            propType = self._judgeObjType(obj[prop]);
                            value = obj[prop];
                            if((prop!=='watchers')&&(propType!=='function')){
                                (function(o,prop,value){
                                    Object.defineProperty(o,prop,{
                                        enumerable:true,
                                        configurable:true,
                                        get:function(){
                                            return value;
                                        },
                                        set:function(newVal){
                                            value = newVal;
                                            if(self._judgeObjType(value)==='object'){
                                                parserData(value)
                                            }
                                            self.digest()
                                        }
                                    })
                                })(obj,prop,value);
                                if(propType==='object'){
                                    parserData(obj[prop]);
                                }
                            }
                        }
                    }
                };
            parserData(this);
            this.digest();
        },
        /**
         * 判断一个对象的类型
         * @param  {obj} obj 待判断对象
         * @return {string}     对象类型字符串
         */
        _judgeObjType:function(obj){
            return Object.prototype.toString.call(obj).slice(8,-1).toLowerCase();
        }
    });

    return sx_Scope;
}));