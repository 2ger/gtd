AV.initialize('1xp3XcR1Wh2euTYwFK7xD4qA', 'd7uNUfuJg3gUNnCtBfA0Sir5');

function save(){ // 存数据
  var TestObject = AV.Object.extend('Task');// 表名
  var testObject = new TestObject();
  testObject.save({
    title: 'bar'   // 字段名：值
  }, {
    success: function(object) {
    //  alert('LeanCloud works!');
    }
  });
}
//登陆
function login(){
  var name = $('#name').val();
  var pass = $('#pass').val();
  AV.User.logIn(name, pass, {
    success: function(user) {
    alert('ok');
    console.log(user);
    },
    error: function(user, error) {
      console.log(error.message);
    }
  });
}

//注册
function signup(){
  var name = $('#name').val();
  var pass = $('#pass').val();
  var user = new AV.User();
  user.set("username", name);
  user.set("password", pass);
  //user.set("email", "hang@leancloud.rocks");
  //user.set("phone", "15577729055");

  user.signUp(null, {
    success: function(user) {
      alert("注册成功，可以使用了");
  var currentUser = AV.User.current();
  window.location.href="task.html";
    },
    error: function(user, error) {
      alert("错误: " + error.code + " " + error.message);
    }
  });
}

//用户是否登陆
function islogin(){
  var currentUser = AV.User.current();
  if (currentUser) {
    //var user = request.user;
      alert('已登陆:'+currentUser.id);
      self.location.href="http://baidu.com";
      //console.log(currentUser);
  } else {
    alert('no login');
    // show the signup or login page
  }
}

 $(".text-ellipsis").click(function(){
var title  =   $(this).text();

  var TestObject = AV.Object.extend('Task');// 表名
  var testObject = new TestObject();
  testObject.save({
    task_name: title   // 字段名：值
  }, {
    success: function(object) {
    //  alert('保存成功！');
    }
  });

})
//$('.btn-dark').click(function(){
 //alert('dss');
//})
//$("input").blur(function(){
    //$("input").css("background-color","#000");
  //});

