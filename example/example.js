var scope = new Scope({
	reciprocal:true
});

scope.user = {
    name:'lixiang',
    age: 25,
    gender: 2
};

scope.user.incAge = function() {
    scope.user.age += 1;
}

scope.user.decAge = function() {
    scope.user.age -= 1;
}

scope.setup();

document.getElementById('switch').addEventListener('click',function(){
	console.log('haha');
	scope.user = {
		name:'xin',
		age:20,
		gender:2
	}
},false)
