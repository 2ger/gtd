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
//function islogin(){
  var currentUser = AV.User.current();
  if (currentUser) {
      uid = currentUser.id;    
    //var user = request.user;
      //alert('已登陆:'+currentUser.id);
      //self.location.href="http://baidu.com";
      //console.log(currentUser);
  } else {
    alert('no login');
    // show the signup or login page
  }
//}
 Task = AV.Object.extend('Task');// 表名

 var query = new AV.Query(Task);
query.notEqualTo("pubUser", "LeanCloud官方客服");// 查询条件
query.find({
  success: function(results) {
    //alert("你有 " + results.length + " 个任务");
    var allTask ="";
    for (var i = 0; i < results.length; i++) {
      var object = results[i];// 列出所有数据
      var task =object.attributes;
      //alert(object.id + ' - ' +task.title);
      allTask = allTask+'<li class="list-group-item dd-item dd3-item" data-id="'+object.id+'"><button data-action="collapse" type="button">Collapse</button><button data-action="expand" type="button" style="display: none;">展</button> <div class="dd-handle dd3-handle">拖</div> <div class="pull-right m-r"> <a href="#"><i class="icon-list"></i></a> </div> <a href="#" class="jp-play-me m-r-sm pull-left"> <i class="icon-check text-muted text"></i> <i class="icon-check bg-success text-active"></i> </a> <div class="clear text-ellipsis" data-id="3"> <span contenteditable="true" >'+task.title+'</span> </div><ol class="dd-list"></ol> </li>';
    }
    //alert(allTask);
    $('ol#task').append(allTask);
  },
  error: function(error) {
    alert("Error: " + error.code + " " + error.message);
  }
});

// 新建task
$("body").delegate('.text-ellipsis span','click',function(){
   var title  =   $(this).text();
    var taskid = $(this).closest('li').attr('data-id');
    alert(taskid);
    //更新
    var query = new AV.Query(Task);
    query.get(taskid, {
      success: function(post) {
        // 成功，回调中可以取得这个 Post 对象的一个实例，然后就可以修改它了
        post.set('title',title);
        post.save();
      },
      error: function(object, error) {
        // 失败了.
        console.log(object);
      }
    });
    // 新增
    //var task= new Task();
    //task.save({
      //objectid: taskid,
      //uid: uid,   // 字段名：值
      //title: title   // 字段名：值
    //}, {
      //success: function(object) {
      ////  alert('保存成功！');
      //}
    //});
 })
