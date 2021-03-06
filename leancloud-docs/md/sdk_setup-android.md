


# LeanCloud Android SDK 安装指南

## 获取 SDK
获取 SDK 有多种方式，较为推荐的方式是通过包依赖管理工具下载最新版本。

### 包依赖管理工具安装



#### Gradle
Gradle 是 Google 官方推荐的构建 Android 程序的工具，使用 Android Studio 进行开发的时候，它会自动在新建的项目中包含一个自带的命令行工具 **gradlew**。我们推荐开发者使用这个自带的命令行工具，这是因为 Gradle 存在版本兼容的问题，很多开发者即使正确配置了 Gradle 脚本，但由于使用了最新版本或不兼容的 Gradle 版本而仍然无法成功加载依赖包。

##### Android Studio
使用 Android Studio 创建一个新的项目的时候，它的目录结构如下：

```
.
├── app                 // 应用源代码
    ├── ...
    ├── build.gradle    // 应用 Gradle 构建脚本
    ├── ...
├── build.gradle        // 项目 Gradle 构建脚本
├── YOUR-APP-NAME.iml   // YOUR-APP-NAME 为你的应用名称
├── gradle                   
└── settings.gradle      
```

首先打开 `./build.gradle` ，按照如下进行标准配置，请注意：这一步我们修改的是根目录下的 `build.gradle`:

```
buildscript {
    repositories {
        jcenter()
        //这里是 LeanCloud 的包仓库
        maven {
            url "http://mvn.leancloud.cn/nexus/content/repositories/releases"
        }

    }
    dependencies {
        classpath 'com.android.tools.build:gradle:1.0.0'
    }
}

allprojects {
    repositories {
        jcenter()
        //这里是 LeanCloud 的包仓库
        maven {
            url "http://mvn.leancloud.cn/nexus/content/repositories/releases"
        }
    }
}
```

然后打开 `./app/build.gradle`，按照如下进行标准配置，请注意：这一步我们修改的是 `app` 目录下的 `build.gradle` :

```
android {
    //为了解决部分第三方库重复打包了META-INF的问题
    packagingOptions{
        exclude 'META-INF/LICENSE.txt'
        exclude 'META-INF/NOTICE.txt'
    }
    lintOptions {
        abortOnError false
    }
}

dependencies {
    compile 'com.android.support:support-v4:21.0.3'

    //avoscloud-sdk 为 LeanCloud基础包
    compile 'cn.leancloud.android:avoscloud-sdk:v3.+'

    //avoscloud-push 与 Java-WebSocket 为推送与IM需要的包
    compile 'cn.leancloud.android:avoscloud-push:v3.+@aar'
    compile 'cn.leancloud.android:Java-WebSocket:1.2.0-leancloud'

    //avoscloud-statistics 为 LeanCloud 统计包
    compile 'cn.leancloud.android:avoscloud-statistics:v3.+'

    //avoscloud-feedback 为 LeanCloud 用户反馈包
    compile 'cn.leancloud.android:avoscloud-feedback:v3.+@aar'

    //avoscloud-sns 为 LeanCloud 第三方登录包
    compile 'cn.leancloud.android:avoscloud-sns:v3.+@aar'
    compile 'cn.leancloud.android:qq-sdk:1.6.1-leancloud'

    //avoscloud-search 为 LeanCloud 应用内搜索包
    compile 'cn.leancloud.android:avoscloud-search:v3.+@aar'    
}
```

我们已经提供了官方的 [maven 仓库](http://mvn.leancloud.cn/nexus/)，推荐大家使用。

#### Eclipse 
Eclipse 用户首先 [下载 SDK](sdk_down.html)，然后按照 [手动安装步骤](#手动安装) 将 SDK 导入到项目里。



### 手动安装
请访问 [SDK下载](sdk_down.html) 来获取 Android 最新版本的 SDK。



下载成功之后将获得如下几个 lib 包:

```
├── avoscloud-feedback-{version-number}.zip     // LeanCloud 用户反馈模块
├── avoscloud-push-{version-number}.jar         // LeanCloud 推送模块和实时聊天模块
├── avoscloud-sdk-{version-number}.jar          // LeanCloud 基本存储模块
├── avoscloud-search-{version-number}.zip       // LeanCloud 应用内搜索模块
├── avoscloud-sns-{version-number}.zip          // LeanCloud SNS 模块
├── avoscloud-statistics-{version-number}.jar   // LeanCloud 统计模块
├── fastjson.jar                                // LeanCloud 基本存储模块
├── httpmime-4.2.4.jar                          // LeanCloud 基本存储模块
├── Java-WebSocket-1.2.0-leancloud.jar          // LeanCloud 推送模块和实时聊天模块
├── okhttp-2.5.0.jar                            // LeanCloud 基本存储模块
├── okio-1.6.0.jar                              // LeanCloud 基本存储模块
├── qq.sdk.1.6.1.jar                            // LeanCloud SNS 模块
└── weibo.sdk.android.sso.3.0.1-leancloud.jar   // LeanCloud SNS 模块
```

根据上述包及其对应的功能模块，开发者可以根据需求自行导入对应的模块。

##### LeanCloud 基本存储模块

* avoscloud-<版本号>.jar
* okhttp-2.5.0.jar
* okio-1.6.0.jar
* fastjson.jar (请一定要使用我们提供的 jar，针对原版有 bug 修正。)
* httpmime-4.2.4.jar

##### LeanCloud 推送模块和实时聊天模块

* LeanCloud 基础存储模块
* avospush-<版本号>.jar
* Java-WebSocket-1.2.0-leancloud.jar

##### LeanCloud 统计模块

* LeanCloud 基础存储模块
* avosstatistics-<版本号>.jar

##### LeanCloud SNS 模块

* LeanCloud 基础存储模块
* weibo.sdk.android.sso.jar
* qq.sdk.1.6.1.jar

我们提供的下载包里包含了必须的依赖库，请务必使用我们提供的 jar 包，才能保证 SDK 的正常运行。特别是 fastjson 必须使用我们提供的版本，否则无法运行。

**注意：如果需要使用美国站点，并且 SDK 版本是 3.3 及以上，则不需要引入 SSL 证书。其他低版本的用户，需要下载 [SSL 证书](https://download.leancloud.cn/sdk/android/current/avoscloud_us_ssl.bks)，将其拷贝到项目的 `res/raw/` 之下。**

#### Android Studio 
首先本地已经下载好了项目需要的 SDK 包，然后按照以下步骤导入：

1. 打开 **File** > **Project Structure** > **Modules** 对话框，点击 **Dependencies**；
2. 点击下方的**小 + 号**，选择要导入的 SDK 包（xxxx.jar），记得 **Scope** 选为 **Compile**；
3. 重复第 2 步，直到所有需要的包均已正确导入。

Eclipse 的导入与一般的 jar 导入无本质区别，不做赘述。




## 初始化
首先来获取App ID以及App Key。

打开[**设置** > **应用 Key**](https://leancloud.cn/app.html?appid={{appid}}#/key)，如下图：

![setting_app_key](images/setting_app_key.png)

获取 `App ID` 以及 `App Key`



然后新建一个 Java Class ，名字叫做 **MyLeanCloudApp**,让它继承自 **Application** 类，实例代码如下:

```
public class MyLeanCloudApp extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        // 初始化参数依次为 this, AppId, AppKey
        AVOSCloud.initialize(this,"{{appid}}","{{appkey}}");
    }
}
```
将上述代码中的 App ID 以及 App Key 替换成从控制台复制粘贴的对应的数据即可。

然后打开 `AndroidManifest.xml` 文件来配置 SDK 所需要的手机的访问权限以及声明刚才我们创建的 `MyLeanCloudApp` 类：

```
<!-- 基础模块所须声明，必填 - Start  !-->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<!-- 基础模块所须声明 - End  !-->

<!-- 实时通信模块，推送所须声明 ，可选- Start  !-->
<service android:name="com.avos.avoscloud.PushService"/>
    <receiver android:name="com.avos.avoscloud.AVBroadcastReceiver">
        <intent-filter>
            <action android:name="android.intent.action.BOOT_COMPLETED"/>
            <action android:name="android.intent.action.USER_PRESENT"/>
        </intent-filter>
    </receiver>
<!-- 实时通信模块，推送所须声明  - End  !-->

<application ...
  android:name=".MyLeanCloudApp"
  ... >
  <!-- 反馈组件 ，可选- Start  !-->
  <activity
     android:name="com.avos.avoscloud.feedback.ThreadActivity" >
  </activity>
  <!-- 反馈组件 ，可选- End  !-->
</application>
```



### LeanCloud 支持的节点
SDK 的初始化方法默认使用中国大陆节点，但是随着北美、欧洲、澳洲以及东南亚的开发者数量的增加，我们也在积极向海外拓展业务。目前除了中国大陆之外，我们已经上线或者正在计划内的节点有：

* 北美节点（试运行一年，目前已正式上线），主要为北美开发者提供服务
* 香港节点（正在部署，近期推出），主要为东南亚开发者提供服务

注意，目前各个节点是 **相互独立** 的，开发者账号不能跨区域创建应用或者调用 API。

#### 启用指定节点
初始化 SDK 时，可以使用如下代码，告知 SDK 对应的 App ID 以及 App Key 属于哪个节点：

启用北美节点代码如下：

只要在调用 `AVOSCloud.initialize` 之后调用一下 `AVOSCloud.useAVCloudUS()` 即可，如下： 

```java
public class MyLeanCloudApp extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        // 初始化参数依次为 this, AppId, AppKey
        AVOSCloud.initialize(this,"{{appid}}","{{appkey}}");
        // 启用北美节点
        AVOSCloud.useAVCloudUS();
    }
}

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


在 `MainActivity.java` 中的 `onCreate` 方法添加如下代码：

```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        ...
        // 测试 SDK 是否正常工作的代码
        AVObject testObject = new AVObject("TestObject");
        testObject.put("words","Hello,World!");
        testObject.saveInBackground(new SaveCallback() {
            @Override
            public void done(AVException e) {
                if(e == null){
                    Log.d("saved","success!");
                }
            }
        });
        
        ...

    }
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




