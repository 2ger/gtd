$('.list-group-item .text-ellipsis').click(function(){//编辑变色
	$('.list-group-item').css("background","#fff");
	$(this).parent('li').css("background","#ffffdb");
});
$('.list-group-item .text-ellipsis span').keydown(function(event){//快捷键
		   // tab 9 , enter 13
		   var shift =event.shiftKey;
		   var key =event.keyCode;
		   if (shift && key==9) {
			var left   = $(this).parent('div').prev('a').css("margin-left");
			// alert(left);
			left = parseInt(left.replace("px", ""));
			left = left-20;
			if (left<0) {
				left =0;
			}
			$(this).parent('div').prev('a').css("margin-left",left+'px');
		   	 return false;
		   }else if (key==9) {//tab
			var left   = $(this).parent('div').prev('a').css("margin-left");
			// alert(left);
			left = parseInt(left.replace("px", ""));
			left = left+20;
			$(this).parent('div').prev('a').css("margin-left",left+'px');
			 return false;
		   }else  if (key==13) {//回车
			   var newTask = '<li class="list-group-item"><div class="pull-right m-l"><a href="#"><i class="icon-list"></i></a></div><a href="#" class="jp-play-me m-r-sm pull-left"><i class="icon-check text-muted text"></i> <i class="icon-check bg-success text-active"></i></a><div class="clear text-ellipsis"><span contenteditable="true"></span></div></li>';
			$(this).parent('div').parent('li').after(newTask);
			var next = $(this).parent('div').parent('li').next();
			next.find("span").focus();
			$('.list-group-item').css("background","#fff");
			next.css("background","#ffffdb");
			    return false;
		   }else if (key==38) {
			var next = $(this).parent('div').parent('li').prev();
			next.find("span").focus();
			$('.list-group-item').css("background","#fff");
			next.css("background","#ffffdb");
			    return false;
		   }else if (key==40) {
			var next = $(this).parent('div').parent('li').next();
			next.find("span").focus();
			$('.list-group-item').css("background","#fff");
			next.css("background","#ffffdb");
			    return false;
		   }
        	  	 // alert(event.shiftKey);
         	  });