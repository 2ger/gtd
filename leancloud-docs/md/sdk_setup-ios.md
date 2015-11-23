


# LeanCloud iOS / OS X SDK 安装指南

## 获取 SDK
获取 SDK 有多种方式，较为推荐的方式是通过包依赖管理工具下载最新版本。

### 包依赖管理工具安装



#### CocoaPods
[CocoaPods](http://www.cocoapods.org/) 是开发 OS X 和 iOS 应用程序的一个第三方库的依赖管理工具。利用 [CocoaPods](http://www.cocoapods.org/)，可以定义自己的依赖关系 (称作 pods)，并且随着时间的推移，它会让整个开发环境中对第三方库的版本管理变得非常方便。

首先确保开发环境中已经安装了 Ruby（一般安装了 XCode，Ruby 会被自动安装上），如果没有安装请执行以下命令行：

```sh
$ sudo gem install cocoapods
```

如果遇到网络问题无法从国外主站上直接下载，我们推荐一个国内的镜像：[RubyGems 镜像](http://ruby.taobao.org/)，具体操作步骤如下：

```sh
$ gem sources --remove https://rubygems.org/
$ gem sources -a https://ruby.taobao.org/
# 请确保下列命令的输出只有 ruby.taobao.org
$ gem sources -l
*** CURRENT SOURCES ***
https://ruby.taobao.org
```

然后再安装 CocoaPods，

```sh
$ sudo gem install cocoapods
```

在项目根目录下创建一个名为 `Podfile` 的文件（无扩展名），并添加以下内容：

  ```sh
  pod 'AVOSCloud'//数据存储，短信等基础服务模块
  pod 'AVOSCloudIM'//实时通信模块
  // 根据实际需要选择引入的 SDK 模块
  ```

执行命令 `pod install --verbose` 安装 SDK。如果本地安装过 SDK，则可执行 `pod install --verbose --no-repo-update` 来加快安装速度。

相关资料：《[CocoaPods 安装和使用教程](http://code4app.com/article/cocoapods-install-usage)》



### 手动安装
请访问 [SDK 下载](sdk_down.html) 来获取 iOS / OS X 最新版本的 SDK。



下载并解压成功之后将获得如下几个压缩包:

```
├── AVOSCloud.zip                  // LeanCloud 核心组件，包含数据存储，推送，统计等
├── AVOSCloudIM.zip                // LeanCloud 实时消息模块                          
└── AVOSCloudCrashReporting.zip    // LeanCloud 崩溃报告
```
根据上述包及其对应的功能模块，开发者可以根据需求自行导入对应的模块。

手动导入项目的过程请参考[快速入门](/start.html) 。

这里要特别注意如下几点：

* 手动添加下列依赖库：
  * SystemConfiguration.framework
  * MobileCoreServices.framework
  * CoreTelephony.framework
  * CoreLocation.framework
  * libicucore.dylib

* 如果使用 [崩溃报告 AVOSCloudCrashReporting](./ios_crashreporting_guide.html)，还需额外添加 **libc++.dylib**。

* 在 Target 的 **Build Settings** 中，为 **Other Linker Flags** 增加：
  * `-lz`
  * `-licucore`
  * `-ObjC`
  * `-lc++` （Crash Reporting 模块需要）
  * `-lsqlite3` （IM 模块需要）




## 初始化
首先来获取App ID以及App Key。

打开[**设置** > **应用 Key**](https://leancloud.cn/app.html?appid={{appid}}#/key)，如下图：

![setting_app_key](images/setting_app_key.png)

获取 `App ID` 以及 `App Key`



打开 `AppDelegate.m` 文件，添加下列导入语句到头部：

```
#import <AVOSCloud/AVOSCloud.h>;
//如果使用了实时通信模块，请添加下列导入语句到头部：
#import <AVOSCloudIM.h>
```

如果是使用 Swift 语言开发，直接包含 AVOSCloud 模块：

```swift
import AVOSCloud
//如果使用了实时通信模块，请添加下列导入语句到头部：
import AVOSCloudIM
```

然后粘贴下列代码到 `application:didFinishLaunchingWithOptions` 函数内：

```objc
// applicationId 即 App Id，clientKey 是 App Key。
[AVOSCloud setApplicationId:@"{{appid}}"
              clientKey:@"{{appkey}}"];
```

如果想跟踪统计应用的打开情况，后面还可以添加下列代码：

```objc
[AVAnalytics trackAppOpenedWithLaunchOptions:launchOptions];
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
// applicationId 即 App Id，clientKey 是 App Key。
[AVOSCloud setApplicationId:@"{{appid}}"
              clientKey:@"{{appkey}}"];
//如果使用美国站点，请加上这行代码 
[AVOSCloud useAVCloudUS];
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
AVObject *post = [AVObject objectWithClassName:@"TestObject"];
[post setObject:@"Hello,World!" forKey:@"words"];
[post saveInBackgroundWithBlock:^(BOOL succeeded, NSError *error) {
    if (succeeded) {
      // 保存成功了！
    }
}];
```

然后，点击 `Run` 运行调试，真机和虚拟机均可。


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




