


# LeanCloud JavaScript SDK 安装指南

## 获取 SDK
获取 SDK 有多种方式，较为推荐的方式是通过包依赖管理工具下载最新版本。

### 包依赖管理工具安装



#### npm 安装

LeanCloud JavaScript SDK 也可在 Node.js 等服务器端环境运行，可以使用云引擎 来搭建服务器端，可以参考[相关文档](https://leancloud.cn/docs/leanengine_guide-node.html)。

```
# 存储服务
$ npm install avoscloud-sdk
# 实时消息服务
$ npm install leancloud-realtime
```
如果因为网络原因，无法通过官方的 npm 站点下载，推荐可以通过 [CNPM](https://cnpmjs.org/) 来下载，操作步骤如下：

首先，在本地安装 cnpm 工具，执行如下命令：

```
$ npm install -g cnpm --registry=http://r.cnpmjs.org
```
让本地安装 cnpm 工具。

然后执行：

```
# 存储服务
$ cnpm install -g avoscloud-sdk 
# 实时消息服务
$ cnpm install leancloud-realtime
```

#### bower 安装

也支持 bower 安装

```
$ bower install leancloud-javascript-sdk
```

#### CDN 加速

```
<script src="https://cdn1.lncld.net/static/js/av-mini-<版本号>.js"></script>
// 或者你只是用最核心的存储、推送等功能，可以使用精简版的core.js
<script src="https://cdn1.lncld.net/static/js/av-core-mini-<版本号>.js"></script>
```

#### Web 安全

如果在前端使用 JavaScript SDK，当你打算正式发布的时候，请务必配置 **Web 安全域名**，配置方式为：进入控制台，选择应用，再选择 **设置** > **安全中心** > **Web 安全域名**。这样就可以防止其他人，通过外网其他地址盗用你的服务器资源。

具体安全相关内容可以仔细阅读文档 [数据和安全](data_security.html) 。


### 手动安装
请访问 [SDK 下载](sdk_down.html) 来获取 JavaScript 最新版本的 SDK。



LeanCloud JavaScript SDK 是分模块使用的，可根据下列表格对应选择所需要的模块：

```
├── av-core-mini.js      // LeanCloud 核心框架（压缩版，建议用于生产环境）
├── av-core.js           // LeanCloud 核心框架（未压缩版）
├── av-mini.js           // LeanCloud 接口框架（压缩版）
├── av.js                // LeanCloud 接口框架（未压缩版）
├── AV.push.min.js       // LeanCloud 推送模块（压缩版）
├── AV.push.js           // LeanCloud 推送模板（未压缩版）
├── AV.realtime.min.js   // LeanCloud 实时消息模块（压缩版）
└── AV.realtime.js       // LeanCloud 实时消息模块（未压缩版）
```
**使用存储服务的时候，`av.js(min)` 和 `av-core.js(min)`  必须一起引用。**

聊天和推送各自可以独立引用。




## 初始化
首先来获取App ID以及App Key。

打开[**设置** > **应用 Key**](https://leancloud.cn/app.html?appid={{appid}}#/key)，如下图：

![setting_app_key](images/setting_app_key.png)

获取 `App ID` 以及 `App Key`


如果是在前端项目里面使用 LeanCloud JavaScript SDK，那么可以在页面加载的时候调用一下初始化的函数：

```
//参数依次为 AppId, AppKey
AV.initialize('{{appid}}', '{{appkey}}');
```



### LeanCloud 支持的节点
SDK 的初始化方法默认使用中国大陆节点，但是随着北美、欧洲、澳洲以及东南亚的开发者数量的增加，我们也在积极向海外拓展业务。目前除了中国大陆之外，我们已经上线或者正在计划内的节点有：

* 北美节点（试运行一年，目前已正式上线），主要为北美开发者提供服务
* 香港节点（正在部署，近期推出），主要为东南亚开发者提供服务

注意，目前各个节点是 **相互独立** 的，开发者账号不能跨区域创建应用或者调用 API。

#### 启用指定节点
初始化 SDK 时，可以使用如下代码，告知 SDK 对应的 App ID 以及 App Key 属于哪个节点：

启用北美节点代码如下：


```
//参数依次为 AppId, AppKey
AV.initialize('{{appid}}', '{{appkey}}');
// 启用美国节点
AV.useAVCloudUS()
```


## 验证
首先，确认本地网络环境是可以访问 LeanCloud 服务器的，可以执行以下命令行：

```
ping api.leancloud.cn
```
如果当前网路正常将会得到如下响应：

```
PING api.leancloud.cn (120.132.49.239): 56 data bytes
64 bytes from 120.132.49.239: icmp_seq=3 ttl=49 time=65.165 ms
64 bytes from 120.132.49.239: icmp_seq=4 ttl=49 time=53.273 ms
64 bytes from 120.132.49.239: icmp_seq=5 ttl=49 time=51.519 ms
64 bytes from 120.132.49.239: icmp_seq=6 ttl=49 time=68.442 ms
```
然后在项目中编写如下测试代码：



```
var TestObject = AV.Object.extend('TestObject');
var testObject = new TestObject();
testObject.save({
  words: 'Hello,World!'
}, {
  success: function(object) {
    alert('LeanCloud works!');
  }
});
```


然后打开[**控制台** > **存储** > **TestObject**](https://leancloud.cn/data.html?appid={{appid}}#/TestObject)
如果看到如下内容，说明 SDK 已经正确地执行了上述代码，安装完毕。

![testobject_saved](images/testobject_saved.png)

如果控制台没有发现对应的数据，请看下节的[问题排查](#问题排查)。

## 问题排查

### App ID 或者 App Key 有误
如果 SDK 抛出 401 异常或者查看本地网络访问日志存在：

```
{
  "code": 401,
  "error": "Unauthorized."
}
```
则可认定为 App ID 或者 App Key 输入有误，或者是不匹配，很多开发者同时注册了多个应用，导致拷贝粘贴的时候，用 A 应用的 App ID 匹配 B 应用的 App Key，这样就会出现服务端鉴权失败的错误。

### 客户端无法访问网络
客户端尤其是手机端，应用在访问网络的时候需要申请一定的权限。




