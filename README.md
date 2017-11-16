# -
一个简单的双向绑定库。类Angularjs API，使用sx-model实现数据的绑定。
*
 * v0.1 create by lixiang in 2017/11/15
 * 双向绑定模型,Scope对象维护一个watchers数组，watchers存放检查的表达式和对应的回调函数,详见设计文档与example
 * 用例：
 * 在html中使用ng-model指令绑定值，例如：
 * <input type="text",ng-model="user.name">
 * 
 * 在js中实例化一个Scope，例如：
 * var scope = new Scope({reciprocal:true})//开启双向绑定。此时input中的变化会反应到Scope.user.name中。
 * scope.user = {name:'AHMI'};
 * scope.digest();//手动进行一次循环检查，更新视图。
 * 
 * 开发者在后期需要通过更新model来更新视图时，需要手动触发Scope.digest()
 *
 * —————————————————————————————————
 *
 * v0.2 edit by lixiang in 2017/11/16 
 * 通过es5的setter和getter机制，实现了无需手动digest()而触发数据刷新
 * 用例：
 * 在注入数据之后，调用scope.setup()取代scope.digest()方法。
 * 后面数据改变时直接操作scope中的数据就可以了，无需手动调用digest()方法。不过如果替换掉了整个user,则自动刷新失效
 
