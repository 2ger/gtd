AV.initialize('1xp3XcR1Wh2euTYwFK7xD4qA', 'd7uNUfuJg3gUNnCtBfA0Sir5');
Task = AV.Object.extend('Task');// 表名
//用户是否登陆
var currentUser = AV.User.current();
if (currentUser) {
  uid = currentUser.id;    
  console.log('已登陆:'+currentUser.id);
} else {
  console.log('请先登陆！');
  self.location.href="signin.html";
}
var query = new AV.Query(Task);
query.equalTo("uid",uid);// 查询条件
query.find({
  success: function(results) {
    var allTask ="";
    for (var i = 0; i < results.length; i++) {
      var object = results[i];// 列出所有数据
      var task =object.attributes;
      //alert(object.id + ' - ' +task.title);
      allTask = allTask+'<li class="list-group-item dd-item dd3-item" data-id="'+object.id+'"><button data-action="collapse" type="button">Collapse</button><button data-action="expand" type="button" style="display: none;">展</button> <div class="dd-handle dd3-handle">拖</div> <div class="pull-right m-r"> <a href="#"><i class="icon-list"></i></a> </div> <a href="#" class="jp-play-me m-r-sm pull-left"> <i class="icon-check text-muted text"></i> <i class="icon-check bg-success text-active"></i> </a> <div class="clear text-ellipsis"> <span contenteditable="true" id="'+object.id+'" >'+task.title+'</span> </div><ol class="dd-list"></ol> </li>';
    }
    if(allTask == ''){
      allTask = '<li class="list-group-item dd-item dd3-item" data-id="999"><button data-action="collapse" type="button">Collapse</button><button data-action="expand" type="button" style="display: none;">展</button> <div class="dd-handle dd3-handle">拖</div> <div class="pull-right m-r"> <a href="#"><i class="icon-list"></i></a> </div> <a href="#" class="jp-play-me m-r-sm pull-left"> <i class="icon-check text-muted text"></i> <i class="icon-check bg-success text-active"></i> </a> <div class="clear text-ellipsis"> <span contenteditable="true" id="999" ></span> </div><ol class="dd-list"></ol> </li>';
    }
    //alert(allTask);
    $('ol#task').append(allTask);
  },
  error: function(error) {
    alert("Error: " + error.code + " " + error.message);
  }
});
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
      console.log("注册成功");
      AV.User.logIn(name, pass, {
        success: function(user) {
          window.location.href="task.html";
          console.log(user);
        },
        error: function(user, error) {
          console.log(error.message);
        }
      });
    },
    error: function(user, error) {
      alert("错误: " + error.code + " " + error.message);
    }
  });
}


// 任务操作
$("body").delegate('.text-ellipsis span','focus',function(){
  var  title  =   $(this).text();
  var taskid = $(this).closest('li').attr('data-id');
  localStorage.title=title;
  localStorage.taskid=taskid;
})
$("body").delegate('.text-ellipsis span','blur',function(){
  var taskid = localStorage.taskid;
  var title  = localStorage.title;
  var titlenow = $('#'+taskid).text();
  var query = new AV.Query(Task);

  if(taskid < 1000){
    console.log('新增');
    var task= new Task();
    task.save({
      title: titlenow,   // 字段名：值
      uid: uid   
    }, {
      success: function(object) {
         console.log(object.id+' 新增成功');
      }
    });
  }else if(title != titlenow){
    if(titlenow == ''){//del
      console.log(taskid+' 已删除');
      //query.destroy(taskid,{
      //success: function(query) {
      //console.log('对象的实例已经被删除了.'); 
      //},
      //error: function(query, error) {
      //// 出错了.
      //}
      //});
    }else{//update
      console.log(taskid+' 已更新');
      query.get(taskid, {
        success: function(post) {
          post.set('title',titlenow);
          post.save();
        },
        error: function(object, error) {
          console.log(object);
        }
      });
    }
  }  console.log(titlenow);

})
