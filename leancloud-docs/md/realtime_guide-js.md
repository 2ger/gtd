



#  实时通信开发指南

## 简介

实时通信服务可以让你一行后端代码都不用写，就能做出一个功能完备的实时聊天应用，或是一个实时对战类的游戏。所有聊天记录都保存在云端，离线消息会通过消息推送来及时送达，推送消息文本可以灵活进行定制。

>在继续阅读本文档之前，请先阅读[《实时通信开发指南》](./realtime_v2.html)，了解一下实时通信的基本概念和模型。



### 文档贡献
我们欢迎和鼓励大家对本文档的不足提出修改建议。请访问我们的 [Github 文档仓库](https://github.com/leancloud/docs) 来提交 Pull Request。

## Demo
相比阅读文档，如果你更喜欢从代码入手了解功能的具体实现，可以下载 Demo 来研究：

* [聊天 Demo](http://leancloud.github.io/js-realtime-sdk/demo/demo2/)（推荐！[源码](https://github.com/leancloud/js-realtime-sdk/tree/master/demo/demo2)）
* [实时对战游戏 Demo](http://cutpage.sinaapp.com/)（由我们的热心用户提供）

我们把所有 Demo 项目放在了 [LeanCloud Demos 资源库](https://github.com/leancloud/leancloud-demos) 中，方便大家浏览和参考。

## 安装和初始化

或者通过 [Bower](http://bower.io/) 安装：
```
bower install leancloud-realtime -- save
```
安装之后，页面直接加载 bower_components/leancloud-realtime/src/AV.realtime.js 即可。

### 兼容性
实时通信 SDK 轻量、高效、无依赖，支持移动终端的浏览器，也可以使用在微信、PhoneGap、Cordova 的多种 WebView 中。同时 SDK 提供插件化、无痛兼容 IE8+ 老版本 IE 浏览器的方式，具体请参考下文 [兼容性](#兼容性-1) 详细说明部分，默认不兼容且性能最佳。


## 兼容性

### 兼容 IE8+ 

JavaScript 实时通信 SDK 设计的目标是全面支持移动端，灵活高效，所以考虑主要实现轻量、提升性能、减少流量等特性（所以都没有默认支持 Promise），但是因为国内目前浏览器市场中仍然有很大量的 IE8+ 浏览器，所以我们提供一种非常轻量的插件方式来兼容 IE8+。

当你通过 Bower 或者 Github 下载 SDK，会有一个 plugin 目录，其中就是兼容 IE8+ 所需要用到的插件。主要实现原理就是通过 Flash 的 Socket 实现 WebSocket 协议通信，然后 JavaScript 包装下 window.WebSocket，再通过 Flash 与 JavaScript 通信完成对 SDK 的兼容。我们的 Demo 中是兼容 IE8+ 的，也可以参考代码。

**具体兼容方式：**

1、在页面中加入以下代码，路径改为你自己的路径

```html
<!-- 引入插件，兼容低 IE8+ 等低版本浏览器，注意看下面的注释。如果不需要兼容，可以去掉这部分。 -->
<!--[if lt IE 10]>
<script type="text/javascript" src="../../plugin/web-socket-js/swfobject.js"></script>
<script type="text/javascript" src="../../plugin/web-socket-js/web_socket.js"></script>
<script type="text/javascript">
// 设置变量，配置插件中 WebSocketMain.swf 的引用路径
WEB_SOCKET_SWF_LOCATION = "../../plugin/web-socket-js/WebSocketMain.swf";
</script>
<![endif]-->
<!-- 引入插件部分结束 -->

<!-- 引入 LeanCloud 实时通信 SDK -->
<script src="../../src/AV.realtime.js"></script>
```

2、IE8+ 等老版本浏览器中 JavaScript 的问题，要小心

* 要注意不能有 console.log，否则在不开启调试器的情况下 IE8 脚本会停在那个位置却不报错
* IE8 中的 JSON.stringify 会把中文转为 unicode 编码
* IE8 中支持 CORS 跨域请求，不需要使用 jsonp 来 hack，而是用 XDomainRequest 发 request，不过注意这个 request 成功回来没有 response.status

### 其他兼容问题

如果要想在 Android WebView 中使用，请务必开启 WebSocket 支持。另外根据用户反馈，在部分 Android 机型的 WebView 中不支持 WebSocket 的安全链接，所以需要从 wss 协议转为 ws 协议，关闭 WebSocket 的 SSL，RealtimeObject 在初始化时提供 secure 选项可以关闭，详细使用方式请看 [AV.realtime](#AV_realtime) 方法。

## 单聊

我们先从最简单的环节入手。此场景类似于微信的私聊、微博的私信和 QQ 单聊。我们创建了一个统一的概念来描述聊天的各种场景：`AVIMConversation`（对话），在[《实时通信开发指南》](./realtime_v2.html) 里也有相关的详细介绍。

### 发送消息

![Tom and Jerry](images/tom-and-jerry-avatar.png)

Tom 想给 Jerry 发一条消息，实现代码如下：



```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 向 Jerry 发送消息：'耗子，起床！' 
```


执行完以上代码，在 LeanCloud 网站的控制台找到指定的应用，进入 **存储** > **数据** 页面，可以看到默认表 `_Conversation` 中多了一行数据，其字段含义如下：

名称|类型|描述
---|---|---
name|String|对话唯一的名字
m|Array|对话中成员的列表
lm|Date|对话中最后一条消息发送的时间
c|String|对话的创建者的 ClientId
mu|Array|对话中设置了静音的成员，仅针对 iOS 以及 Windows Phone 用户有效。
attr|Object|开发者设置的对话的自定义属性


>提示：每次调用 `createConversation()` 方法，都会生成一个新的 Conversation 实例，即便使用相同 conversationMembers 和 name 也是如此。因此必要时可以先使用 `AVIMConversationQuery` 进行查询，避免重复创建。


### 接收消息

要让 Jerry 收到 Tom 的消息，需要这样写：


```
- 自定义消息响应类 CustomMessageHandler
- 在 application  的 onCreate() 中注册 CustomMessageHandler
- 初始化 ClientId = Jerry 
- Jerry 登录到系统
- 接收到 Tom 的消息
```


## 群聊

对于多人同时参与的固定群组，我们有成员人数限制，最大不能超过 500 人。对于另外一种多人聊天的形式，譬如聊天室，其成员不固定，用户可以随意进入发言的这种「临时性」群组，后面会单独介绍。

### 发送消息

Tom 想建立一个群，把自己好朋友都拉进这个群，然后给他们发消息，他需要做的事情是：

1. 建立一个朋友列表
2. 新建一个对话，把朋友们列为对话的参与人员
3. 发送消息


```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 建立一个朋友列表 friends：[Jerry, Bob, Harry, William]
- 新建对话，把朋友们列为对话的参与人员
- 发送消息：'Hey，你们在哪儿？'
```

### 接收消息

群聊的接收消息与单聊的接收消息在代码写法上是一致的。


```
- 自定义消息响应类 CustomMessageHandler
- 在 application  的 onCreate() 中注册 CustomMessageHandler
- 初始化 ClientId = Bob
- Bob 登录到系统
- 设置接收消息的方法
- Bob 收到消息后又回复了一条：@Tom, 我在 Jerry 家，你跟 Harry 什么时候过来？还有 William 和你在一起么？
```


以上由 Tom 和 Bob 发送的消息，William 在上线时都会收到。

由此可以看出，**群聊和单聊本质上都是对话**，只是参与人数不同。单聊是一对一的对话，群聊是多对多的对话。

用户在开始聊天之前，需要先登录 LeanCloud 云端。这个登录并不需要用户名和密码认证，只是与 LeanCloud 云端建立一个长连接，所以只需要传入一个唯一标识作为当前用户的 `clientId` 即可。

为直观起见，我们使用了 Tom、Jerry 等字符串作为 clientId 登录聊天系统。LeanCloud 云端只要求 clientId 在应用内唯一、不超过 64 个字符的字符串即可，具体用什么数据由应用层决定。

实时通信 SDK 在内部会为每一个 clientId 创建唯一的 `AVIMClient` 实例，也就是说多次使用相同的 clientId 创建出来的实例还是同一个。因此，如果要支持同一个客户端内多账号登录，只要使用不同的 clientId 来创建多个实例即可。我们的 SDK 也支持多账户同时登录。

## 消息
消息是一个对话的基本组成部分，我们支持的消息类型有：

- 文本消息：`AVIMTextMessage`
- 图像消息：`AVIMImageMessage`
- 音频消息：`AVIMAudioMessage`
- 视频消息：`AVIMVideoMessage`
- 文件消息：`AVIMFileMessage`
- 位置消息：`AVIMLocationMessage`

### 富媒体消息
#### 图像消息
图像可以从系统提供的拍照 API 或本地媒体库中获取，也可以用有效的图像 URL。先调用 SDK  方法构造出一个 `AVIMImageMessage` 对象，然后把它当做参数交由 `AVIMConversation` 发送出去即可。

##### 发送图像消息

【场景一】用系统自身提供的 API 去获取本地媒体库里的照片的数据流，然后构造出 `AVIMImageMessage` 来发送：


```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 从系统媒体库获取第一张照片
- 创建图像消息
- 给图像加一个自定义属性：location = '旧金山'
- 图像 Title：'发自我的小米'
- 发送
```


【场景二】从微博上复制的一个图像链接来创建图像消息：


```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 创建与 Jerry 的对话，对话名称是「猫和老鼠」
- 创建图像消息：http://pic2.zhimg.com/6c10e6053c739ed0ce676a0aff15cf1c.gif
- 加入文本：萌妹子一枚
- 发送
```


以上两种场景对于 SDK 的区别为：

* 场景一：SDK 获取了完整的图像数据流，先上传文件到云端，再将文件的元数据以及 URL 等一并包装，发送出去。

* 场景二：SDK 并没有将图像实际上传到云端，而仅仅把 URL 包装在消息体内发送出去，这种情况下接收方是无法从消息体中获取图像的元信息数据，但是接收方可以自行通过客户端技术去分析图片的格式、大小、长宽之类的元数据。

##### 接收图像消息







#### 音频消息

##### 发送音频消息

发送音频消息的基本流程是：读取音频文件（或者录制音频）> 构建音频消息 > 消息发送。


```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 创建与 Jerry 的对话，对话名称为「猫和老鼠」
- 本地读取音频文件：'忐忑.mp3' ，创建音频消息
- 加入文本：'听听人类的神曲~'
- 发送
``` 


与图像消息类似，音频消息也支持从 URL 构建：


```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 创建与 Jerry 的对话，对话名称为「猫和老鼠」
- 从外部链接创建音频消息：http://ac-lhzo7z96.clouddn.com/1427444393952
- 创建音频消息
- 发送
```


##### 接收音频消息




#### 视频消息

##### 发送视频消息

与发送音频消息的流程类似，视频的来源可以是手机录制，可以是系统中某一个具体的视频文件：


```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 创建与 Jerry 的对话，对话名称为「猫和老鼠」
- 打开本地文件夹
- 读取视频文件：'BBC_奶酪.mp4'，创建视频消息
- 发送
```


同样我们也支持从一个视频的 URL 创建视频消息，然后发送出去：



```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 创建与 Jerry 的对话，对话名称为「猫和老鼠」
- 从外部链接创建视频消息：http://ac-lhzo7z96.clouddn.com/1427267336319
- 发送给 Jerry
```


**注：这里说的 URL 指的是视频文件自身的 URL，而不是视频网站上播放页的 URL。**

##### 接收视频消息



```
- 视频元信息提取/列表[messageId, file.url, size, duration, format]
```




#### 地理位置消息

地理位置消息构建方式如下：


```
- 1.根据纬度和经度（latitude: 45.0 longitude:34.0）构建 
  AVIMLocationMessage()
- 2. AVGeoPoint 构建
  AVIMLocationMessage(
    AVGeoPoint(31.3853142377, 121.0553079844)
  )
```

##### 发送地理位置消息


```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 创建与 Jerry 的对话，对话名称为「猫和老鼠」
- 以经度和纬度为参数构建一个地理位置消息 AVIMLocationMessage(138.12454, 52.56461)
- 加入文本：好利来新店！！
//开发者更可以通过具体的设备的 API 去获取设备的地理位置
- 发送
}
```


##### 接收地理位置消息





### 接收富媒体消息

实时通信 SDK 内部封装了对富媒体消息的支持，所有富媒体消息都是从 AVIMTypedMessage 派生出来的。发送的时候可以直接调用 `conversation.sendMessage()` 函数。在接收端，我们也专门增加了一类回调接口 AVIMTypedMessageHandler，其定义为：

```
public class AVIMTypedMessageHandler<T extends AVIMTypedMessage> extends MessageHandler<T> {

  @Override
  public void onMessage(T message, AVIMConversation conversation, AVIMClient client);

  @Override
  public void onMessageReceipt(T message, AVIMConversation conversation, AVIMClient client);
}
```

开发者可以编写自己的消息处理 handler，然后调用 `AVIMMessageManager.registerMessageHandler()` 函数来注册目标 handler。

接收端对于富媒体消息的通知处理的示例代码如下：

```
class MsgHandler extends AVIMTypedMessageHandler<AVIMTypedMessage> {

  @Override
  public void onMessage(AVIMTypedMessage message, AVIMConversation conversation, AVIMClient client) {
    // 请按自己需求改写
    switch(message.getMessageType()) {
    case AVIMReservedMessageType.TextMessageType:
      AVIMTextMessage textMsg = (AVIMTextMessage)message;
      Logger.d("收到文本消息:" + textMsg.getText() + ", msgId:" + textMsg.getMessageId());
      break;

    case AVIMReservedMessageType.FileMessageType:
      AVIMFileMessage fileMsg = (AVIMFileMessage)message;
      Logger.id("收到文件消息。msgId=" + fileMsg.getMessageId() + ", url=" + fileMsg.getFileUrl() + ", size=" + fileMsg.getSize());
      break;

    case AVIMReservedMessageType.ImageMessageType:
      AVIMImageMessage imageMsg = (AVIMImageMessage)message;
      Logger.id("收到图片消息。msgId=" + imageMsg.getMessageId() + ", url=" + imageMsg.getFileUrl() + ", width=" + imageMsg.getWidth() + ", height=" + imageMsg.getHeight());
      break;

    case AVIMReservedMessageType.AudioMessageType:
      AVIMAudioMessage audioMsg = (AVIMAudioMessage)message;
      Logger.id("收到音频消息。msgId=" + audioMsg.getMessageId() + ", url=" + audioMsg.getFileUrl() + ", duration=" + audioMsg.getDuration());
      break;

    case AVIMReservedMessageType.VideoMessageType:
      AVIMVideoMessage videoMsg = (AVIMAudioMessage)message;
      Logger.id("收到视频消息。msgId=" + videoMsg.getMessageId() + ", url=" + videoMsg.getFileUrl() + ", duration=" + videoMsg.getDuration());
      break;

    case AVIMReservedMessageType.LocationMessageType:
      AVIMLocationMessage locMsg = (AVIMLocationMessage)message;
      Logger.id("收到位置消息。msgId=" + locMsg.getMessageId() + ", latitude=" + locMsg.getLocation().getLatitude() + ", longitude=" + locMsg.getLocation().getLongitude());
      break;
    }
  }

  @Override
  public void onMessageReceipt(AVIMTypedMessage message, AVIMConversation conversation, AVIMClient client) {
    // 请加入你自己需要的逻辑...
  }
}

MsgHandler msgHandler = new MsgHandler();
AVIMMessageManager.registerMessageHandler(AVIMTypedMessage.class, msgHandler);
```

SDK 内部在接收消息时的处理逻辑是这样的：

* 当收到新消息时，实时通信 SDK 会先解析消息的类型，然后找到开发者为这一类型所注册的处理响应 handler，再逐一调用这些 handler 的 onMessage 函数。
* 如果没有找到专门处理这一类型消息的 handler，就会转交给 defaultHandler 处理。

这样一来，在开发者为 `TypedMessage`（及其子类） 指定了专门的 handler，也指定了全局的 defaultHandler 了的时候，如果发送端发送的是通用的 AVIMMessage 消息，那么接受端就是 `AVIMMessageManager.registerDefaultMessageHandler()` 中指定的 handler 被调用；如果发送的是 AVIMTypedMessage（及其子类）的消息，那么接受端就是 `AVIMMessageManager.registerMessageHandler()` 中指定的 handler 被调用。


### 暂态消息

暂态消息不会被自动保存（以后在历史消息中无法找到它），也不支持延迟接收，离线用户更不会收到推送通知，所以适合用来做控制协议。譬如聊天过程中「某某正在输入...」这样的状态信息，就适合通过暂态消息来发送；或者当群聊的名称修改以后，也可以用暂态消息来通知该群的成员「群名称被某某修改为...」。



```
- 初始化 ClientId = Tom
- Tom 登录到系统
- 进入与 Jerry 的对话 id = 551260efe4b01608686c3e0f
- 在 Tom 输入的同时，向 Jerry 发送提示："Tom 正在输入……"
```


而对话中的其他成员在聊天界面中需要有以下代码做出响应：



```
- 初始化 ClientId = Jerry
- Jerry 登录到系统
- 进入与 Tom 的对话 id = 551260efe4b01608686c3e0f
- 此时收到提示："Tom 正在输入……"
```


### 消息的发送




#### 多媒体消息发送
目前 SDK 内置的多媒体消息类如下：

* 图像 `AVIMImageMessage`
* 音频 `AVIMAudioMessage`
* 视频 `AVIMVideoMessage`
* 文件 `AVIMFileMessage`

所有多媒体消息类型的发送流程如下：

如果文件是从**客户端 API 读取的数据流 (Stream)**，步骤为：

1. 从本地构造 AVFile
1. 调用 AVFile 的上传方法将文件上传到服务器，并获取文件元信息（MetaData）
1. 把 AVFile 的 objectId、URL ，以及文件的元信息封装在消息体内
1. 调用接口发送消息

如果文件是**外部链接的 URL**，则：

1. 直接将 URL 封装在消息体内，不获取元信息，不包含 objectId
1. 调用接口发送消息

#### 启用离线消息推送

不管是单聊还是群聊，当用户 A 发出消息后，如果目标对话的部分用户当前不在线，LeanCloud 云端可以提供离线推送的方式来提醒用户。

**Android 聊天服务是和后台的推送服务共享连接的，所以只要有网络就永远在线，不需要专门做推送。**消息达到后，你可以根据用户的设置来判断是否需要弹出通知。网络断开时，我们为每个对话保存 20 条离线消息。

这一功能默认是关闭的，你可以在 LeanCloud 应用控制台中开启它。操作方法请参考 [实时通信概览 &middot; 离线推送通知](realtime_v2.html/#离线推送通知)。



#### 消息送达回执

是指消息被对方收到之后，云端会发送一个回执通知给发送方，表明消息已经送达。
需要注意的是：

> 只有发送时设置了「等待回执」标记的，LeanCloud 云端才会发送回执，默认是不会发送回执的。并且，这个回执，不等于用户已读。



### 消息的接收


消息的接收策略在不同平台有不同的实现。




### 消息类详解




### 自定义消息

在某些场景下，开发者需要在发送消息时附带上自己业务逻辑需求的自定义属性，比如消息发送的设备名称，或是图像消息的拍摄地点、视频消息的来源等等，开发者可以通过  `AVIMMessage.Attributes`  实现这一需求。

【场景】发照片给朋友，告诉对方照片的拍摄地点：



```
- 构造一个 AVIMImageMessage
- 在 Attributes 中加入 location = "拉萨布达拉宫"
- 设置 Title = "这蓝天……我彻底是醉了";
- 发送
```


接收时可以读取这一属性：



```
- 初始化 ClientId = friend
- 登录到系统
- 接收消息，如果是 Image，读取 Attributes[location]
- //读取的结果就是拉萨布达拉宫
```


所有的 `AVIMTypedMessage` 消息都支持 `Attributes` 这一属性。

#### 创建新的消息类型


继承于 AVIMTypedMessage，开发者也可以扩展自己的富媒体消息。其要求和步骤是：

* 实现新的消息类型，继承自 AVIMTypedMessage。这里需要注意两点：
  * 在 class 上增加一个 @AVIMMessageType(type=123) 的 Annotation，具体消息类型的值（这里是 `123`）由开发者自己决定（LeanCloud 内建的 [消息类型使用负数](#消息类详解)，所有正数都预留给开发者扩展使用）。
  * 在消息内部属性上要增加 @AVIMMessageField(name="") 的 Annotation，name 为可选字段在声明字段属性，同时自定义的字段要有对应的 getter/setter 方法。
* 调用 `AVIMMessageManager.registerAVIMMessageType()` 函数进行类型注册。
* 调用 `AVIMMessageManager.registerMessageHandler()` 函数进行消息处理 handler 注册。

AVIMTextMessage 的源码如下，可供参考：

```
@AVIMMessageType(type = -1)
public class AVIMTextMessage extends AVIMTypedMessage {

  @AVIMMessageField(name = "_lctext")
  String text;
  @AVIMMessageField(name = "_lcattrs")
  Map<String, Object> attrs;

  public String getText() {
    return this.text;
  }

  public void setText(String text) {
    this.text = text;
  }

  public Map<String, Object> getAttrs() {
    return this.attrs;
  }

  public void setAttrs(Map<String, Object> attr) {
    this.attrs = attr;
  }
}
```


> **什么时候需要自己创建新的消息类型？**
>
>譬如有一条图像消息，除了文本之外，还需要附带地理位置信息，为此开发者需要创建一个新的消息类型吗？从上面的例子可以看出，其实完全没有必要。这种情况只要使用消息类中预留的 ` `AVIMMessage.Attributes` ` 属性就可以保存额外的地理位置信息了。
>
>只有在我们的消息类型完全无法满足需求的时候，才需要扩展自己的消息类型。譬如「今日头条」里面允许用户发送某条新闻给好友，在展示上需要新闻的标题、摘要、图片等信息（类似于微博中的 linkcard）的话，这时候就可以扩展一个新的 NewsMessage 类。



## 对话

以上章节基本演示了实时通信 SDK 的核心概念「对话」，即 `AVIMConversation`。我们将单聊和群聊（包括聊天室）的消息发送和接收都依托于 `AVIMConversation` 这个统一的概念进行操作，所以开发者需要强化理解的一个概念就是：
>SDK 层面不区分单聊和群聊。


Conversation（对话）这个概念有些人更喜欢叫做 Room（房间），就是几个客户端节点在通信之前要放到同一个房间中，其实这两个是一个道理，只是名字不同，SDK 中为了让大家好理解，两个名字都可以使用。如果你觉得更喜欢 Room 这个概念，那就可以使用 room 方法创建 Room，如果喜欢 Conversation，那就使用 conv 方法创建 Conversation。


对话的管理包括「成员管理」和「属性管理」两个方面。

在讲解下面的内容之前，我们先来创建一个多人对话。后面的举例都要基于这个对话，所以**这一步是必须的**。请将以下代码复制到 IDE 并且执行。


```
- 初始化 ClientId = Jerry
- Jerry 登录
- 创建朋友列表 friends = [Bob, Harry, William]
- 用 friends 创建新对话
```




### 对话的成员管理

成员管理，是在对话中对成员的一个实时生效的操作，一旦操作成功则不可逆。

#### 成员变更接口
成员变更操作接口简介如下表：

操作目的|接口名
----|---
自身主动加入 | 
添加其他成员 | 
自身主动退出 | 
剔除其他成员 | 

成员变动之后，所有对话成员如果在线的话，都会得到相应的通知。



#### 自身主动加入

Tom 想主动加入 Jerry、Bob、Harry 和 William 的对话，以下代码将帮助他实现这个功能：


```
- 初始化 ClientId = Tom
- Tom 登录
- 获取  id 为 551260efe4b01608686c3e0f 的对话 //获取 Jerry 创建的对话的 Id，这里是直接从控制台复制了上一节准备工作中所创建的对话的 objectId
- Tom 主动加入到对话中
```





#### 添加其他成员

Jerry 想再把 Mary 加入到对话中，需要如下代码帮助他实现这个功能：


```
- 初始化 ClientId = Jerry
- Jerry 登录
- 假定对话 Id = 551260efe4b01608686c3e0f
- 进入对话
- Jerry 把 Mary 加入到对话 //AddMembers
```


该对话的其他成员（例如 Harry）也会受到该项操作的影响，收到事件被响应的通知，类似于第一小节 [自身主动加入](#自身主动加入) 中**Tom 加入对话之后，Bob 受到的影响。**



>注意：如果在进行邀请操作时，被邀请者不在线，那么通知消息并不会被离线缓存，所以等到 Ta 再次上线的时候将不会收到通知。

#### 自身退出对话
这里一定要区分**自身退出对话**的主动性，它与**自身被动被踢出**（下一小节）在逻辑上完全是不一样的。

Tom 主动从对话中退出，他需要如下代码实现需求：


```
- 初始化 ClientId = Tom
- Tom 登录
- 假定对话 Id = 551260efe4b01608686c3e0f //由 Jerry 创建的对话
- 进入对话
- Tom 主动从对话中退出
``` 


#### 剔除其他成员

Harry 被 William 从对话中删除。实现代码如下（关于 William 如何获得权限在后面的 [签名和安全](#签名和安全) 中会做详细阐述，此处不宜扩大话题范围。）：


```
- 初始化 ClientId = William
- William 登录
- 对话 Id = 551260efe4b01608686c3e0f //由 Jerry 创建的对话
- 进入对话
- William 把 Harry 从对话中踢出去 //RemoveMembers
```




>注意：如果在进行踢人操作时，被踢者不在线，那么通知消息并不会被离线缓存，所以等到 Ta 再次上线的时候将不会收到通知。

#### 查询成员数量
 `conversation:countMembersWithCallback:` 这个方法返回的是实时数据：


```
- 初始化 ClientId = Tom
- Tom 登录
- 获取对话列表，找到第一个对话
- 获取该对话成员数量
```


### 对话的属性管理

对话实例（AVIMConversation）与控制台中 `_Conversation` 表是一一对应的，默认提供的属性的对应关系如下：



#### 名称

这是一个全员共享的属性，它可以在创建时指定，也可以在日后的维护中被修改。

Tom 想建立一个名字叫「喵星人」 对话并且邀请了好友 Black 加入对话：


```
- 初始化 ClientId = Tom
- Tom 登录
- 创建对话，同时邀请 Black，对话名称为 '喵星人'
```


Black 发现对话名字不够酷，他想修改成「聪明的喵星人」 ，他需要如下代码：


```
- 初始化 ClientId = Black
- Black 登录
- 进入 Tom 创建的对话「喵星人」，id = 55117292e4b065f7ee9edd29
- 修改对话名称为「聪明的喵星人」
- 保存到云端
```


####  成员

是当前对话中所有成员的 `clientId`。默认情况下，创建者是在包含在成员列表中的，直到 TA 退出对话。

>**强烈建议开发者切勿在控制台中对其进行修改**。所有关于成员的操作请参照上一章节中的 [对话的成员管理](#对话的成员管理) 来进行。

#### 静音
假如某一用户不想再收到某对话的消息提醒，但又不想直接退出对话，可以使用静音操作，即开启「免打扰模式」。

比如 Tom 工作繁忙，对某个对话设置了静音：


```
- 初始化 ClientId = Tom
- Tom 登录
- 进入对话：id = 551260efe4b01608686c3e0f
- 将其设置为静音 Mute
```


>设置静音之后，iOS 和 Windows Phone 的用户就不会收到推送消息了。

与之对应的就是取消静音的操作，即取消免打扰模式。此操作会修改云端 `_Conversation` 里面的 `mu` 属性。**强烈建议开发者切勿在控制台中对 `mu` 随意进行修改**。

#### 创建者

即对话的创建者，它的值是对话创建者的 `clientId`。

它等价于 QQ 群中的「群创建者」，但区别于「群管理员」。比如 QQ 群的「创建者」是固定不变的，它的图标颜色与「管理员」的图标颜色都不一样。所以根据对话中成员的 `clientId` 是否与 `AVIMConversation.Creator` 一致就可以判断出他是不是群的创建者。

#### 自定义属性

通过该属性，开发者可以随意存储自己的键值对，为对话添加自定义属性，来满足业务逻辑需求。

典型的场景是，给某个对话加上一个值为 private 的 tag 标签，表示这个对话被标记为私有，代码如下：


```
- 初始化 ClientId = Tom
- Tom 登录
- 创建属性 attr 列表对象
- 加入 tag = "private"
- 创建与 Jerry 的对话，对话名称「猫和老鼠」，传入刚加的 attr.tag
```


**自定义属性在 SDK 级别是对所有成员可见的**。如果要控制所谓的可见性，开发者需要自己维护这一属性的读取权限。关于自定义属性的更多的用法，请参见 [对话的查询](#对话的查询)。

### 对话的查询

<!-- #### 基础查询 -->

#### 根据 id 查询

假如已知某一对话的 Id，可以使用它来查询该对话的详细信息：



```
- 初始化 ClientId = Tom
- Tom 登录
- 异步从服务器拉取对话：id = 551260efe4b01608686c3e0f
```


#### 对话列表

用户登录进应用后，获取最近的 10 个对话（包含暂态对话，如聊天室）：


```
- 初始化 ClientId = Tom
- Tom 登录
- 获取对话列表
```


对话的查询默认返回 10 个结果，若要更改返回结果数量，请设置 `limit` 值。



```
- Tom 登录
- Tom 查询自己所在的最近 20 个活跃的对话
```


#### 条件查询
##### 构建查询
对话的条件查询需要注意的对话属性的存储结构，在对话的属性一章节我们介绍的对话的几个基本属性，这些属性都是 SDK 提供的默认属性，根据默认属性查询的构建如下：


```
- 查询对话名称为「LeanCloud 粉丝群」的对话
- 查询对话名称包含 「LeanCloud」 的对话
- 查询过去24小时活跃的对话
```


相对于默认属性的查询，开发者自定义属性的查询需要在构建查询的时在关键字(key)前加上一个特殊的前缀: `attr`，不过每个 SDK 都提供相关的快捷方式帮助开发者方便的构建查询:


```
- 查询话题为 DOTA2 对话
- 查询等级大于 5 的对话
```


默认属性以及自定义属性的区分便于 SDK 后续的内建属性拓展和维护，自定义属性的开放有利于开发者在可控的范围内进行查询的构建。

条件查询又分为：比较查询、正则匹配查询、包含查询，以下会做分类演示。

#### 比较查询

比较查询在一般的理解上都包含以下几种：



比较查询最常用的是等于查询：


```
- 初始化 ClientId = Tom
- Tom 登录
- 构建 attr 属性中 topic 是 movie 的查询
- 执行查询
```


目前条件查询只针对 `AVIMConversation` 对象的自定义属性进行操作，也就是针对 `_Conversation` 表中的 `attr` 字段进行 `AVQuery` 查询。



下面检索一下类型不是私有的对话：


```
- 初始化 ClientId = Tom
- Tom 登录
- 构建 attr 属性中 type 不等于 private 的查询
- 执行查询


对于可以比较大小的整型、浮点等常用类型，可以参照以下示例代码进行扩展：


```
- 初始化 ClientId = Tom
- Tom 登录
- 构建查询条件：attr.age > 18
- 执行查询
```


#### 正则匹配查询


匹配查询是指在 `AVIMConversationQuery` 的查询条件中使用正则表达式来匹配数据。


比如要查询所有 tag 是中文的对话：


```
- 初始化 ClientId = Tom
- Tom 登录
- 构建 attr.tag 是中文的查询 // 正则为 [\u4e00-\u9fa5] 
- 执行查询
```


#### 包含查询

包含查询是指方法名字包含 `Contains` 单词的方法，例如查询关键字包含「教育」的对话：


```
- 初始化 ClientId = Tom
- Tom 登录
- 构建 attr.keywords 包含「教育」的查询
- 执行查询
```


另外，包含查询还能检索与成员相关的对话数据。以下代码将帮助 Tom 查找出 Jerry 以及 Bob 都加入的对话：


```
- 初始化 ClientId = Tom
- Tom 登录
- 构建 clientIds 列表：[Bob, Jerry]
- 构建对话成员有 Bob 和 Jerry 的查询条件
- 执行查询
```


#### 组合查询

组合查询的概念就是把诸多查询条件合并成一个查询，再交给 SDK 去云端进行查询。

例如，要查询年龄小于 18 岁，并且关键字包含「教育」的对话：


```
- 初始化 ClientId = Tom
- Tom 登录
- 构建查询条件：attr.keywords 包含「教育」、attr.age < 18
- 执行查询
```


只要查询构建得合理，开发者完全不需要担心组合查询的性能。


#### 缓存查询

通常，将查询结果缓存到磁盘上是一种行之有效的方法，这样就算设备离线，应用刚刚打开，网络请求尚未完成时，数据也能显示出来。或者为了节省用户流量，在应用打开的第一次查询走网络，之后的查询可优先走本地缓存。

值得注意的是，默认的策略是先走本地缓存的再走网络的，缓存时间是一小时。AVIMConversationQuery 中有如下方法：



有时你希望先走网络查询，发生网络错误的时候，再从本地查询，可以这样：



各种查询缓存策略的行为可以参考 


## 聊天室

聊天室本质上就是一个对话，所以上面章节提到的**所有属性、方法、操作以及管理都适用于聊天室**，它仅仅在逻辑上是一种暂态的、临时的对话，应用场景有弹幕、直播等等。

聊天室与普通对话或群聊不一样的地方具体体现为：

* 无人数限制，而普通对话最多允许 500 人加入。
* 不支持查询成员列表，但可以通过相关 API 查询在线人数。
* 不支持离线消息、离线推送通知、消息回执等功能。
* 没有成员加入、成员离开的通知。
* 一个用户一次登录只能加入一个聊天室，加入新的聊天室后会自动离开原来的聊天室。
* 加入后半小时内断网重连会自动加入原聊天室，超过这个时间则需要重新加入。

### 创建聊天室


和建立普通对话类似，建立一个聊天室只是在 `AVIMClient.createConversation(conversationMembers, name, attributes, isTransient, callback)` 中传入 `isTransient=true`。


比如喵星球正在直播选美比赛，主持人 Tom 创建了一个临时对话，与喵粉们进行互动：


```
- 初始化 ClientId = Tom
- Tom 登录
- 创建暂态对话，名称 "HelloKitty PK 加菲猫"
```




### 查询在线人数

 `AVIMConversation.getMemberCount()` 可以用来查询普通对话的成员总数，在聊天室中，它返回的就是实时在线的人数：


```
- 初始化 ClientId = Tom
- Tom 登录
- 获取对话列表中的第一个对话对象
- 获取人数
```


### 查找聊天室

开发者需要注意的是，通过这样得到的 `AVIMConversationQuery` 实例默认是查询全部对话的，也就是说，如果想查询指定的聊天室，需要额外再调用 `whereKey:` 方法来限定更多的查询条件：

比如查询主题包含「奔跑吧，兄弟」的聊天室：


```
- 初始化 ClientId = Tom
- Tom 登录
- 获取对话列表中 attr.topic = "奔跑吧，兄弟"、tr = true
- 执行查询
```




## 聊天记录

聊天记录一直是客户端开发的一个重点，QQ 和 微信的解决方案都是依托客户端做缓存，当收到一条消息时就按照自己的业务逻辑存储在客户端的文件或者是各种客户端数据库中。

我们的 SDK 会将普通的对话消息自动保存在云端，开发者可以通过 AVIMConversation 来获取该对话的所有历史消息。

获取该对话中最近的 N （默认 20 ，最大值 1000）条历史消息，通常在第一次进入对话时使用：


```
- 初始化 ClientId = Tom
- Tom 登录
- 进入对话：id = 551260efe4b01608686c3e0f
- 获取最近的 10 条消息 //limit 取值范围 1~1000 之内的整数，默认为 20
```


获取某条消息之前的历史消息，通常用在翻页加载更多历史消息的场景中。

```
- ...//前几步与上例相同
- Tom 登录
- 获取消息历史，不指定 limit //  不使用 limit 默认返回 20 条消息
- 获取这 20 条中最早那条消息的信息
- 再获取之前的消息，不指定 limit // 依然默认返回 20 条消息
```


翻页获取历史消息的时候，LeanCloud 云端是从某条消息开始，往前查找所指定的 N 条消息来返回给客户端。为此，获取历史消息需要传入三个参数：

* 起始消息的 messageId
* 起始消息的发送时间戳
* 需要获取的消息条数

假如每一页为 10 条信息，下面的代码将演示如何翻页：


```
- 初始化 ClientId = Tom
- 获取对话对象 id = 2f08e882f2a11ef07902eeb510d4223b
- 获取最近的 10 条历史消息
- 再根据上一步的第 10 条消息的 msgId，timestamp 和 limit 获取第二页的数据
```



### 客户端聊天记录缓存
为了减少客户端的请求数量，以及减少用户的流量，SDK 实现了一套缓存同步策略。用户在调用获取聊天记录的接口时优先从缓存中获取，SDK 是有算法保证本地与服务器聊天记录是同步的。

聊天记录的缓存功能默认为**开启**，但如果开发者出于自身业务逻辑需求，不想在客户端使用缓存功能，可以使用如下接口将其关闭：





## 客户端事件

### 网络状态响应

当网络连接出现中断、恢复等状态变化时，可以通过以下接口来处理响应：


与网络相关的通知（网络断开、恢复等）会由 `AVIMClientEventHandler` 做出响应，接口函数有：

* `onConnectionPaused()` 指网络连接断开事件发生，此时聊天服务不可用。
* `onConnectionResume()` 指网络连接恢复正常，此时聊天服务变得可用。

在网络中断的情况下，所有的消息收发和对话操作都会出现问题。

通过 `AVIMClient.setClientEventHandler()` 可以设定全局的客户端事件响应（ClientEventHandler）。


>注意：网络状态在短时间内很可能会发生频繁变化，但这并不代表对话的接收与发送一定会受到影响，因此开发者在处理此类事件响应时，比如更新 UI，要适应加入更多的逻辑判断，以免影响用户的使用体验。

### 退出登录

要退出当前的登录状态或要切换账户，方法如下：


```
- 初始化 ClientId = Tom
- Tom 登录
- Tom 登出
```



## 与其他 SDK 通信

JavaScript 实时通信 SDK 可以与 iOS、Android 等 SDK 进行通信。当你不仅仅只是基于 Web 来实现一个实时通信程序，也想通过使用 LeanCloud 提供的其他类型（iOS、Android、Windows Phone 等）的 SDK 实现多端互通，就需要在发送数据时使用媒体类型配置项，具体要到 roomObject.send 方法中详细了解。

Web 端本身无论处理什么类型的数据，浏览器都可以自动解析并渲染，比如图片，只需要一个 img 标签。但是其他终端就不行，比如 iOS，所以你需要告知其他终端你发送的是什么类型的消息，这样其他客户端接收到之后会有相应的渲染处理方式，详情请看相应 SDK 的文档。目前支持：text（文本）、image（图片）、audio（声音）、video（视频）、location（地理位置）、file（各种类型文件）等类型。


## 安全与签名

在继续阅读下文之前，请确保你已经对 [实时通信服务开发指南—权限和认证](realtime_v2.html#权限和认证) 有了充分的了解。

### 实现签名工厂

为了满足开发者对权限和认证的要求，我们设计了操作签名的机制。签名启用后，所有的用户登录、对话创建/加入、邀请成员、踢出成员等登录都需要验证签名，这样开发者就对消息具有了完全的掌控。

我们强烈推荐启用签名，具体步骤是：进入 LeanCloud 应用控制台，选择 **设置** > **应用选项** > **聊天推送**，勾选 **聊天服务签名认证**。


### 安全域名

如果是纯前端使用 JavaScript SDK，请务必配置 **控制台** - **设置** - **基本信息** - **JavaScript 安全域名**，防止其他人盗用你的服务器资源。实时通信的安全域名设置会有三分钟的延迟，所以设置完毕后，请耐心等待一下。

详细请看「[数据和安全](data_security.html)」指南中的「Web 安全域名」部分。

### 权限和认证

为了满足开发者对权限和认证的需求，我们设计了 [签名的概念](realtime_v2.html#权限和认证)。

### 防御 XSS

Web 端实现任何可以将用户输入直接输出到界面上的应用都要注意防止产生 XSS（跨站脚本攻击），实时通信 SDK 支持在 SDK 层面开启这个防御，但是我们默认不开启，所以你可以在实例化 realtimeObject 的时候，开启这个选项。

>注意：我们没有对 clientId 做任何过滤，也不建议直接输出 clientId。如果需要将 clientId 输出到 Web 页面中，记得要对其进行 HTML 转义，防止 XSS。

```javascript
// 创建实时通信实例（支持单页多实例）
var appId = '{{appid}}';
realtimeObj = AV.realtime({
    appId: appId,
    clientId: clientId,
    // 是否开启 HTML 转义，SDK 层面开启防御 XSS
    encodeHTML: true,
    // 是否开启服务器端认证
    // auth: authFun
});
```



> 需要强调的是：开发者切勿在客户端直接使用 MasterKey 进行签名操作，因为 MaterKey 一旦泄露，会造成应用的数据处于高危状态，后果不容小视。因此，强烈建议开发者将签名的具体代码托管在安全性高稳定性好的服务器上（例如 LeanCloud 云引擎）。


### 单点登录
一款聊天应用，随着不断的发展，会衍生出多个平台的不同客户端。以 QQ 为例，目前它所提供的客户端如下：

- PC：Windows PC、Mac OS、Linux（已停止更新）
- 移动：Windows Phone、iOS、Android
- Web：<http://w.qq.com/>

经过测试，我们发现 QQ 存在以下几种行为：

1. 同一个 QQ 账号不可以同时在 2 个 PC 端登录（例如，在 Mac OS 上登录已经在另外一台 Windows PC 上登录的 QQ，该 QQ 号在 Windows PC 上会被强行下线）。
2. 同一个 QQ 账号不可以同时在 2 个移动端上登录。
3. Web QQ 也不能与 PC 端同时登录
4. 同一个 QQ 只能同时在 1 个移动版本和 1 PC 版本（或者 Web 版本）上登录，并实现一些 PC 与移动端互动的功能，例如互传文件。

通过规律不难发现，QQ 按照自己的需求实现了「单点登录」的功能：同一个平台上只允许一个 QQ 登录一台设备。

下面我们来详细说明：如何使用我们的 SDK 去实现单点登录。

#### 设置登录标记-Tag
假设开发者想实现 QQ 这样的功能，那么需要在登录到服务器的时候，也就是打开与服务器长连接的时候，标记一下这个链接是从什么类型的客户端登录到服务器的：



上述代码可以理解为 LeanCloud 版 QQ 的登录，而另一个带有同样 Tag 的客户端打开连接，则较早前登录系统的客户端会被强制下线。

#### 处理登录冲突
我们可以看到上述代码中，登录的 Tag 是 `Mobile`。
当存在与其相同的 Tag 登录的客户端，较早前登录的设备会被服务端强行下线，而且他会收到被服务端下线的通知：



如上述代码中，被动下线的时候，服务端会告知原因，因此客户端在做展现的时候也可以做出类似于 QQ 一样友好的通知。


## FAQ

**我只想实现两个用户的私聊，是不是每次都得重复创建对话？**

答：不需要重复创建。我们推荐的方式是开发者可以用自定义属性来实现对私聊和群聊的标识，并且在进行私聊之前，需要查询当前两个参与对话的 ClientId 是否之前已经存在一个私聊的对话了。另外，SDK 已经提供了创建唯一对话的接口，详情请查看[创建对话](#创建对话)这一章节。


**某个成员退出对话之后，再加入，在他离开的这段期间内的产生的聊天记录，他还能获取么？**

答：可以。目前聊天记录从属关系是属于对话的，也就是说，只要对话 Id 不变，不论人员如何变动，只要这个对话产生的聊天记录，当前成员都可以获取。

**我自己没有服务器，如何实现签名的功能？**

答：LeanCloud 云引擎提供了托管 Python 和 Node 运行的方式，开发者可以所以用这两种语言按照签名的算法实现签名，完全可以支持开发者的自定义权限控制。

## 问题排查

1. 客户端连接被关闭有许多原因，详细的请看[服务器端错误码说明](realtime_v2.html#服务器端错误码说明)
