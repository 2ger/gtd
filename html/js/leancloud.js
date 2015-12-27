AV.initialize('1xp3XcR1Wh2euTYwFK7xD4qA', 'd7uNUfuJg3gUNnCtBfA0Sir5');
Task = AV.Object.extend('Task');// 表名
//用户是否登陆
var currentUser = AV.User.current();
if (currentUser) {
  uid = currentUser.id;    
  console.log('已登陆:'+currentUser.id);
  localStorage.userName=currentUser.attributes.username;
} else {
  console.log('请先登陆！');
  self.location.href="signin.html";
}
//初始化
var userName = localStorage.userName;
$('#userName').text(userName);
// TASK例表
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
  console.log('标题更新为：'+titlenow);

})

    // diy 按键操作
    $('.list-group-item .text-ellipsis').click(function(){//编辑变色
      $('.list-group-item').css("background","#fff");
      $(this).parent('li').css("background","#ffffdb");
    });

    localStorage.newTaskId = 1;
    $("body").on( 'keydown','.list-group-item .text-ellipsis span', function(e) {
      var shift =e.shiftKey;
      var key = e.keyCode;
      var me = $(this);
      var li = me.closest("li");
      var taskid = li.attr('data-id');
      var id = localStorage.newTaskId;
      if (key == 13) {// ENTER
        var newTask = '<li class="list-group-item dd-item dd3-item" data-id="'+id+'"> <button data-action="collapse" type="button">Collapse</button><button data-action="expand" type="button" style="display: none;">展</button> <div class="dd-handle dd3-handle">拖</div> <div class="pull-right m-r"> <a href="#"><i class="icon-list"></i></a> </div> <a href="#" class="jp-play-me m-r-sm pull-left"> <i class="icon-check text-muted text"></i> <i class="icon-check bg-success text-active"></i> </a> <div class="clear text-ellipsis"> <span  contenteditable="true"  id="'+id+'"></span> </div><ol class="dd-list"></ol> </li>';
         localStorage.newTaskId = id+1;
        li.after(newTask);
        var next = li.next();
        next.find("span").focus();
        me.closest('.list-group-item').css("backgroundColor", "#fff");
        next.css("backgroundColor", "#ffffdb");
        return false;
      }
      if (shift && key==9) {
        var left   = $(this).parent('div').prev('a').css("margin-left");
        left = parseInt(left.replace("px", ""));
        left = left-20;
        if (left<0) {
          left =0;
        }
        me.parent('div').prev('a').css("margin-left",left+'px');
        return false;
      }else if (key==9) {//tab
        var ol = li.prev().children('ol');
        ol.append(li);
        li.find("span").focus();
        //li.remove();
        return false;
      }else if (key==38) {//上下切换  在缩进后无效
        var prev = li.prev();
        prev.closest('li').find("span").focus();
        $('.list-group-item').css("background","#fff");
        prev.css("background","#ffffdb");
        return false;
      }else if (key==40) {
        var next = li.next();
        next.find("span").focus();
        $('.list-group-item').css("background","#fff");
        next.css("background","#ffffdb");
        return false;
      }else if (key == 8 && me.text()=='') {//无内容情况下，删除li
        var prev = li.prev();
        query.get(taskid, {
          success: function(thisTask) {
            thisTask.destroy();
            console.log(thisTask.id+' 已删除')
        }})
        prev.find("span").focus();
        $('.list-group-item').css("background","#fff");
        prev.css("background","#ffffdb");
        li.remove();
      };
    });

    $('body').on('click', '.jp-play-me',  function(){// 完成操作
      var me = $(this);
      //me.find('.text').toggle();
      //me.find('.text-active').toggle();
      me.closest('li').toggleClass('done');
      if(hasClass('done')){
      }else{
      }
    })
    // end  按键操作
    $('#logout').click(function(){
      AV.User.logOut();
      self.location.href="signin.html";
    })

