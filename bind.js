/**
 * Scope构造函数
 * @param {obj} options   选项，目前支持是否双向绑定。
 * @param {obj} dataModel 数据对象，通过这个方式初始化的数据模型，可以自动调用digest()
 */
var Scope = function(options) {
    this.watchers = [];

    var self = this;
    var reciprocal = options&&options.reciprocal||false;//是否支持视图到模型的绑定
    var elements = document.querySelectorAll('[ng-model]');//获取所有包含ng-model属性的元素

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
                    elements[i].value = args[0]||self.str2PropGet(elements[i].getAttribute('ng-model'));;
                } else {
                    elements[i].innerHTML = args[0]||self.str2PropGet(elements[i].getAttribute('ng-model'));
                }
            });
        })(i);

    }

    //事件处理与监听
    function pageElementEventHandler(e) {
        var target = e.target || e.srcElemnt;
        var fullPropName = target.getAttribute('ng-model');

        if(fullPropName && fullPropName !== '') {
            self.str2PropSet(target.getAttribute('ng-model'), target.value);
            self.digest();
        }

    }

    //开启视图监听，更新模型
    if(reciprocal){
        document.addEventListener('keyup', pageElementEventHandler, false);
        document.addEventListener('change', pageElementEventHandler, false);
    }
};


Object.assign(Scope.prototype,{
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
    // 获取Scope下的相关属性值
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
    // 设置Scope下的相关属性值
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
                        propType = judgeObjType(obj[prop]);
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
                                        self.digest()
                                    }
                                })
                            })(obj,prop,value);
                            if(propType==='object'){
                                parserData(obj[prop]);
                            }
                        }
                    }
                };
                return;
            };
        parserData(this);
        this.digest();
        // console.log(this['user'])
    }
})

/**
 * 判断一个对象的类型
 * @param  {obj} obj 待判断对象
 * @return {string}     对象类型字符串
 */
function judgeObjType(obj){
    var type = Object.prototype.toString.call(obj);
    switch(type){
        case '[object Array]':
            return 'array';
        case '[object String]':
            return 'string'
        case '[object Object]':
            return 'object';
        case '[object Function]':
            return 'function;';
        case '[object Number]':
            return 'number';
        default:
            return 'null';
    }
}
