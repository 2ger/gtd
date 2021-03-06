# 消息推送开发指南

消息推送，使得开发者可以即时地向其应用程序的用户推送通知或者消息，与用户保持互动，从而有效地提高留存率，提升用户体验。平台提供整合了 Android 推送、iOS 推送的统一推送服务。

除了 iOS、Android SDK 做推送服务之外，你还可以通过我们的 REST API 来发送推送请求。

## 基本概念

### Installation

Installation 表示一个允许推送的设备的唯一标示，对应[数据管理](/data.html?appid={{appid}})平台中的 `_Installation` 表。它就是一个普通的对象，主要属性包括:

* deviceType  设备类型，目前只支持"ios"和"android"
* deviceToken iOS设备才有的用于 APNS 推送的唯一标识符，只对 iOS 有效。
* installationId LeanCloud 为每个 Android 设备产生的唯一标识符，只对 android 有效。
* badge iOS 设备呈现在应用程序图标右上角的红色圆形数字提示,用于提示一些无需即时处置的音讯,比方程序更新数、未读数等。
* timeZone 设备设定的时区
* channels 设备订阅的频道
* subscriptionUri Windows Phone 设备才有的 MPNS（微软推送服务）推送的通道 ID，只针对微软平台的设备（微软的平板以及手机）有效，目前仅支持 Windows Phone。

增删改查设备，请看后面的 SDK 说明和 REST API 一节。


### Notification

对应 `_Notification` 表，表示一条推送消息，它包括下列属性：

* subscribers 本条消息推送到的设备数量（不表示一定到达）
* status 状态，可能是"in queue","done"或者错误信息
* data 推送的内容数据，JSON 对象。
* where 推送的查询 `_Installation` 表的查询条件

如何发送消息也请看下面的详细指南。

推送本质上是根据一个 query 条件来查询 `_Installation` 表里符合条件的设备，然后将消息推送给设备。因为 `_Installation` 是一个可以完全自定义属性的 Key-Value Object，因此可以实现各种复杂条件推送，例如频道订阅、地理位置信息推送、特定用户推送等。

## iOS 消息推送

### 如何使用 LeanCloud 的 Push 功能

本节将向您简单介绍如何在 iOS 设备中使用 LeanCloud 的推送功能。

### 配置 iOS 推送证书

配置 iOS 证书相对麻烦，但是却是必须的步骤，请仔细看[iOS推送证书设置指南](./ios_push_cert.html)。


### 保存 Installation

在保存 installation 前，要先通过下列代码获取用户推送权限：

```objc
// Before iOS 8:
- (BOOL)application:(UIApplication *)application
didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    ...
    // Register for push notifications
    [application registerForRemoteNotificationTypes:
                                UIRemoteNotificationTypeBadge |
                                UIRemoteNotificationTypeAlert |
                                UIRemoteNotificationTypeSound];
    ...
}
```
```objc
//For iOS 8:
- (BOOL)application:(UIApplication *)application
didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    ...
    UIUserNotificationSettings *settings = [UIUserNotificationSettings settingsForTypes:UIUserNotificationTypeAlert
                                            | UIUserNotificationTypeBadge
                                            | UIUserNotificationTypeSound
                                                                             categories:nil];
    [application registerUserNotificationSettings:settings];
    [application registerForRemoteNotifications];
    ...
}
```

在 iOS 设备中，Installation 的类是 AVInstallation，并且是 AVObject 的子类，使用同样的 API 存储和查询。如果要访问当前应用的 Installation 对象，可以通过`[AVInstallation currentInstallation]`方法。当你第一次保存 AVInstallation 的时候，它会插入`_Installation`表，你可以在[数据管理](/data.html?appid={{appid}})平台看到和查询。当 deviceToken 一被保存，你就可以向这台设备推送消息了。

```objc
- (void)application:(UIApplication *)app didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    AVInstallation *currentInstallation = [AVInstallation currentInstallation];
    [currentInstallation setDeviceTokenFromData:deviceToken];
    [currentInstallation saveInBackground];
}
```

可以像修改 AVObject 那样去修改 AVInstallation，但是有一些特殊字段可以帮你管理目标设备：

* badge 应用 icon 旁边的红色数字，修改 AVInstallation 的这个值将修改应用的 badge。修改应该保存到服务器，以便为以后做 badge 增量式的推送做准备。
* channels 当前设备订阅的频道数组。
* appName 应用名称，只读
* appVersion 应用版本，只读

### 发送推送消息

发送 iOS 推送消息，可以通过 REST API，或者我们的消息推送 web 平台，请进入你的应用管理界面查看。

### 使用频道

使用频道可以实现发布——订阅的模型。设备订阅某个频道，然后发送消息的时候指定要发送的频道即可。

#### 订阅和退订

订阅"Giants"频道：

```objc
// When users indicate they are Giants fans, we subscribe them to that channel.
AVInstallation *currentInstallation = [AVInstallation currentInstallation];
[currentInstallation addUniqueObject:@"Giants" forKey:@"channels"];
[currentInstallation saveInBackground];
```

订阅后要记得保存，即可在[数据管理](/data.html?appid={{appid}})平台看到该installation的channels字段多了"Giants"。

退订：

```objc
// When users indicate they are no longer Giants fans, we unsubscribe them.
AVInstallation *currentInstallation = [AVInstallation currentInstallation];
[currentInstallation removeObject:@"Giants" forKey:@"channels"];
[currentInstallation saveInBackground];
```

获取所有订阅的频道：

```objc
NSArray *subscribedChannels = [AVInstallation currentInstallation].channels;
```

#### 发送消息到频道

例如，发送消息到刚才订阅的"Giants"频道：

```objc
// Send a notification to all devices subscribed to the "Giants" channel.
AVPush *push = [[AVPush alloc] init];
[push setChannel:@"Giants"];
[push setMessage:@"The Giants just scored!"];
[push sendPushInBackground];
```

如果你想发送到多个频道，可以指定 channels 数组:

```objc
NSArray *channels = [NSArray arrayWithObjects:@"Giants", @"Mets", nil];
AVPush *push = [[AVPush alloc] init];

// Be sure to use the plural 'setChannels'.
[push setChannels:channels];
[push setMessage:@"The Giants won against the Mets 2-3."];
[push sendPushInBackground];
```

### 高级定向发送

频道对于大多数应用来说可能就足够了。但是某些情况下，你可能需要更高精度的定向推送。LeanCloud 允许你通过 AVQuery API 查询 Installation 列表，并向指定条件的 query 推送消息。

因为 AVInstallation 同时是 AVObject 的子类，因此你可以保存任何数据类型到 AVInstallation，并将它和你的其他应用数据对象关联起来，这样以来，你可以非常灵活地向你用户群做定制化、动态的推送。

#### 保存 Installation 数据

为 AVInstallation 添加三个新字段：

```objc
// Store app language and version
AVInstallation *installation = [AVInstallation currentInstallation];
[installation setObject:@(YES) forKey:@"scores"];
[installation setObject:@(YES) forKey:@"gameResults"];
[installation setObject:@(YES) forKey:@"injuryReports"];
[installation saveInBackground];
```

表示比赛的分数，比赛结果和受伤报告。

设置，你可以给 Installation 添加 owner 属性，比如当前的登陆用户：

```objc
// Saving the device's owner
AVInstallation *installation = [AVInstallation currentInstallation];
[installation setObject:[AVUser currentUser] forKey:@"owner"];
[installation saveInBackground];
```

#### 根据查询来推送消息

一旦 Installation保存了你的应用数据，你可以使用`AVQuery`来查询出设备的一个子集做推送。Installation 的查询跟其他对象的查询没有什么不同，只是使用特殊的静态方法
`[AVInstallation query]`创建查询对象：

```objc
// Create our Installation query
AVQuery *pushQuery = [AVInstallation query];
[pushQuery whereKey:@"injuryReports" equalTo:@(YES)];

// Send push notification to query
AVPush *push = [[AVPush alloc] init];
[push setQuery:pushQuery]; // Set our Installation query
[push setMessage:@"Willie Hayes injured by own pop fly."];
[push sendPushInBackground];
```

你也可以在查询中添加 channels 的条件：

```objc
// Create our Installation query
AVQuery *pushQuery = [AVInstallation query];
[pushQuery whereKey:@"channels" equalTo:@"Giants"]; // Set channel
[pushQuery whereKey:@"scores" equalTo:@(YES)];

// Send push notification to query
AVPush *push = [[AVPush alloc] init];
[push setQuery:pushQuery];
[push setMessage:@"Giants scored against the A's! It's now 2-2."];
[push sendPushInBackground];
```

如果你在 Installation 还保存了其他对象的关系，我们同样可以在查询条件中使用这些数据，例如，向靠近北京大学的设备推送消息：

```objc
// Find users near a given location
AVQuery *userQuery = [AVUser query];
[userQuery whereKey:@"location"
        nearGeoPoint:beijingUniversityLocation,
         withinMiles:[NSNumber numberWithInt:1]]

// Find devices associated with these users
AVQuery *pushQuery = [AVInstallation query];
[pushQuery whereKey:@"user" matchesQuery:userQuery];

// Send push notification to query
AVPush *push = [[AVPush alloc] init];
[push setQuery:pushQuery]; // Set our Installation query
[push setMessage:@"Free hotdogs at the AVOSCloud concession stand!"];
[push sendPushInBackground];
```

### 发送选项

除了发送一个文本信息之外，你还可以播放一个声音，设置 badge 数字或者其他想自定义的数据。你还可以设置一个消息的过期时间，如果对消息的时效性特别敏感的话。

#### 定制通知

如果你不仅想发送一条文本消息，你需要一个 NSDictionary 来打包想发送的数据。这里有一些保留字段有特殊含义需要说明下：

* alert: 推送消息的文本内容
* badge: (iOS only) app icon 右上角的数字。可以设置一个值或者递增当前值。
* sound: (iOS only) 应用 bundle 里的声音文件名称。
* content-available: (iOS only) 如果你在使用 Newsstand, 设置为 1 来开始一次后台下载。
* action: (Android only) 当消息收到的时候，触发的 Intent 名称。如果没有设置 title 或者 alert，Intent 将触发，但是不会显示通知给用户。
* title: (Android only) 显示在系统通知栏的标题。


例如，递增 badge 数字，并播放声音可以这样做:

```objc
NSDictionary *data = [NSDictionary dictionaryWithObjectsAndKeys:
    @"The Mets scored! The game is now tied 1-1!", @"alert",
    @"Increment", @"badge",
    @"cheering.caf", @"sound",
    nil];
AVPush *push = [[AVPush alloc] init];
[push setChannels:[NSArray arrayWithObjects:@"Mets", nil]];
[push setData:data];
[push sendPushInBackground];
```

当然，你还可以添加其他自定义的数据。你会在接收推送一节看到，当应用通过推送打开你的应用的时候，你就可以访问这些数据。当你要在用户打开通知的时候显示一个不同的 view controller 的时候，这特别有用。

```objc
NSDictionary *data = [NSDictionary dictionaryWithObjectsAndKeys:
    @"Ricky Vaughn was injured in last night's game!", @"alert",
    @"Vaughn", @"name",
    @"Man bites dog", @"newsItem",
    nil];
AVPush *push = [[AVPush alloc] init];
[push setQuery:injuryReportsQuery];
[push setChannel:@"Indians"];
[push setData:data];
[push sendPushInBackground];
```


#### 设置过期日期

当设备关闭或者无法连接到网络的时候，推送通知就无法被送达。如果你有一条时间敏感的推送通知，不希望在太长时间后被用户读到，那么可以设置一个过期时间来避免打扰用户。

AVPush 提供了两个方法来设置通知的过期日期，首先是 expireAtDate：接收 NSDate 来告诉 LeanCloud 不要再去发送通知。

```objc
NSDateComponents *comps = [[NSDateComponents alloc] init];
[comps setYear:2013];
[comps setMonth:10];
[comps setDay:12];
NSCalendar *gregorian =
  [[NSCalendar alloc] initWithCalendarIdentifier:NSGregorianCalendar];
NSDate *date = [gregorian dateFromComponents:comps];

// Send push notification with expiration date
AVPush *push = [[AVPush alloc] init];
[push expireAtDate:date];
[push setQuery:everyoneQuery];
[push setMessage:@"Season tickets on sale until October 12th"];
[push sendPushInBackground];
```

这个方法有个隐患，因为设备的时钟是无法保证精确的，你可能得到错误的结果。因此，AVPush 还提供了 expireAfterTimeInterval 方法，接收 NSTimeInterval 对象。通知将在指定间隔时间后失效：

```objc
// Create time interval
NSTimeInterval interval = 60*60*24*7; // 1 week

// Send push notification with expiration interval
AVPush *push = [[AVPush alloc] init];
[push expireAfterTimeInterval:interval];
[push setQuery:everyoneQuery];
[push setMessage:@"Season tickets on sale until October 18th"];
[push sendPushInBackground];
```



#### 指定设备平台

跨平台的应用，可能想指定发送的平台，比如 iOS 或者 Android:

```objc
AVQuery *query = [AVInstallation query];
[query whereKey:@"channels" equalTo:@"suitcaseOwners"];

// Notification for Android users
[query whereKey:@"deviceType" equalTo:@"android"];
AVPush *androidPush = [[AVPush alloc] init];
[androidPush setMessage:@"Your suitcase has been filled with tiny robots!"];
[androidPush setQuery:query];
[androidPush sendPushInBackground];

// Notification for iOS users
[query whereKey:@"deviceType" equalTo:@"ios"];
AVPush *iOSPush = [[AVPush alloc] init];
[iOSPush setMessage:@"Your suitcase has been filled with tiny apples!"];
[iOSPush setChannel:@"suitcaseOwners"];
[iOSPush setQuery:query];
[iOSPush sendPushInBackground];
```

### 定时推送

请进入消息推送的 web 管理平台，可以做到定时推送（延迟或者指定时间）。


### 接收推送通知

正如前面定制通知一节提到，你可以随通知发送任意的数据。我们使用这些数据修改应用的行为，当应用是通过通知打开的时候。例如，当打开一条通知告诉你有一个新朋友的时候，这时候如果显示一张图片会非常好。

由于 Apple 的对消息大小的限制，请尽量缩小要发送的数据大小，否则可能被截断：

```objc
NSDictionary *data = @{
  @"alert": @"James commented on your photo!",
  @"p": @"vmRZXZ1Dvo" // Photo's object id
};
AVPush *push = [[AVPush alloc] init];
[push setQuery:photoOwnerQuery];
[push setData:data];
[push sendPushInBackground];
```

### 响应通知数据

当应用是被通知打开的时候，, 你可以通过`application:didFinishLaunchingWithOptions: `方法的 launchOptions dictionary 访问到数据：

```objc
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  . . .
  // Extract the notification data
  NSDictionary *notificationPayload = launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey];

  // Create a pointer to the Photo object
  NSString *photoId = [notificationPayload objectForKey:@"p"];
  AVObject *targetPhoto = [AVObject objectWithoutDataWithClassName:@"Photo"
                                                          objectId:photoId];

  // Fetch photo object
  [targetPhoto fetchIfNeededInBackgroundWithBlock:^(AVObject *object, NSError *error) {
    // Show photo view controller
    if (!error && [AVUser currentUser]) {
      PhotoVC *viewController = [[PhotoVC alloc] initWithPhoto:object];
      [self.navController pushViewController:viewController animated:YES];
    }
  }];
}
```

如果当通知到达的时候，你的应用已经在运行，那么你可以通过`application:didReceiveRemoteNotification:fetchCompletionHandler:`方法的 userInfo dictionary 访问到数据：

```objc
- (void)application:(UIApplication *)application
      didReceiveRemoteNotification:(NSDictionary *)userInfo
            fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))handler {
  // Create empty photo object
  NSString *photoId = [userInfo objectForKey:@"p"];
  AVObject *targetPhoto = [AVObject objectWithoutDataWithClassName:@"Photo"
                                                          objectId:photoId];

  // Fetch photo object
  [targetPhoto fetchIfNeededInBackgroundWithBlock:^(AVObject *object, NSError *error) {
    // Show photo view controller
    if (error) {
      handler(UIBackgroundFetchResultFailed);
    } else if ([AVUser currentUser]) {
      PhotoVC *viewController = [[PhotoVC alloc] initWithPhoto:object];
      [self.navController pushViewController:viewController animated:YES];
    } else {
      handler(UIBackgroundModeNoData);
    }
  }];
}
```


你可以阅读[Apple本地化和推送的文档](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Introduction.html#//apple_ref/doc/uid/TP40008194-CH1-SW1)来更多地了解推送通知。

### 跟踪推送和应用的打开情况

通过 AVAnalytics 你可以跟踪通知和应用的打开情况。添加下列代码到上面例子中的`application:didFinishLaunchingWithOptions: `方法来收集打开信息：

```objc
if (application.applicationState != UIApplicationStateBackground) {
  // Track an app open here if we launch with a push, unless
  // "content_available" was used to trigger a background push (introduced
  // in iOS 7). In that case, we skip tracking here to avoid double
  // counting the app-open.
  BOOL preBackgroundPush = ![application respondsToSelector:@selector(backgroundRefreshStatus)];
  BOOL oldPushHandlerOnly = ![self respondsToSelector:@selector(application:didReceiveRemoteNotification:fetchCompletionHandler:)];
  BOOL noPushPayload = ![launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
  if (preBackgroundPush || oldPushHandlerOnly || noPushPayload) {
    [AVAnalytics trackAppOpenedWithLaunchOptions:launchOptions];
  }
}
```


传递 nil 或者空白的参数给`trackAppOpenedWithLaunchOptions:`方法只是统计一次标准的应用打开事件 (比如不是通过通知打开的应用）。

你可以在[请求分析](/apistat.html?appid={{appid}}#/_apiRequest)菜单里看到通知和 app 的打开情况。


Application opens and push-related open rates will be available in your application's dashboard.

请注意，如果你的应用正在运行或者在后台，`application:didReceiveRemoteNotification:`方法将会处理收到的推送通知。

***如果您的应用处于运行状态，iOS 系统将不会在系统的通知中心显示推送消息，您可以使用`UILocalNotification`展示一个通知给用户。***

如果应用在后台，并且用户点击了通知，那么应用将被带到前台可视，为了跟踪这种通过通知打开应用的情况，你需要在跟踪代码里多作一个检查：

```objc
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo {
  if (application.applicationState == UIApplicationStateActive) {
    // 此处可以写上应用激活状态下接收到通知的处理代码，如无需处理可忽略
  } else {
    // The application was just brought from the background to the foreground,
    // so we consider the app as having been "opened by a push notification."
    [AVAnalytics trackAppOpenedWithRemoteNotificationPayload:userInfo];
  }
}
```
如果使用 iOS 7 push 的新特性（包括新的"content-available" 功能），你需要实现 iOS 7 新加的方法：
```objc
- (void)application:(UIApplication *)application
        didReceiveRemoteNotification:(NSDictionary *)userInfo
        fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  if (application.applicationState == UIApplicationStateActive) {
    // 此处可以写上应用激活状态下接收到通知的处理代码，如无需处理可忽略
  } else {
    [AVAnalytics trackAppOpenedWithRemoteNotificationPayload:userInfo];
  }
}
```

#### 跟踪本地通知 (iOS only)

为了统计跟踪本地通知消息，需要注意`application:didFinishLaunchingWithOptions:`和`application:didReceiveLocalNotification:`都会调用到，如果你实现了`application:didReceiveLocalNotification:`这个方法,要注意避免重复统计。

#### 清除 Badge

清除 Badge 数字的最好时机是打开 app 的时候。 设置当前 installation 的 badge 属性并保存到服务器:

```objc
- (void)applicationDidBecomeActive:(UIApplication *)application {
    int num=application.applicationIconBadgeNumber;
    if(num!=0){
        AVInstallation *currentInstallation = [AVInstallation currentInstallation];
        [currentInstallation setBadge:0];
        [currentInstallation saveEventually];
        application.applicationIconBadgeNumber=0;
    }
    [application cancelAllLocalNotifications];
    //...
}
```

清除 Badge 数字最相关的三个方法是`applicationDidBecomeActive:`, `application:didFinishLaunchingWithOptions:`和`application:didReceiveRemoteNotification:`。请阅读[ UIApplicationDelegate文档](http://developer.apple.com/library/ios/#DOCUMENTATION/UIKit/Reference/UIApplicationDelegate_Protocol/Reference/Reference.html)。


### Installation 自动过期和清理

我们根据 Apple 推送服务的反馈，将 Installation 设置为失效，失效后推送到该设备的消息就被忽略。当失效时间超过 60 天，并且用户没有再次使用这个 Installation，我们会删除该 Installation；在 60 天内，用户如果再次使用这个 Installation，将自动启用 Installation 并设置为有效状态，并继续推送消息给该设备。

## Android 消息推送

Android 推送功能除了需要必须的 avoscloud.jar 以外，还需要额外的 avospush.jar。

Android 消息推送有专门的 Demo，请见[AVOSCloud-Push](https://github.com/leancloud/Android-SDK-demos/tree/master/AVOSCloud-Push)项目。

### Installation

当您的应用安装在用户设备后，如果要使用消息推送功能，LeanCloud SDK 会自动生成一个 Installation 对象。Installation 对象包含了推送所需要的所有信息。您可以使用 Android SDK，通过 Installation 对象进行消息推送。Installation 对象本质上代表了设备安装您的应用的一个安装信息。

#### 保存 Installation

您可以通过以下代码保存您的 Installation id。如果您的系统之前还没有 Installation id, 系统会为您自动生成一个。如果您的应用卸载后，Installation id也将会被删除。


```java
AVInstallation.getCurrentInstallation().saveInBackground();
```

**这段代码应该在应用启动的时候调用一次，保证设备注册到 LeanCloud 平台，您可以监听调用回调，获取 installationId 做数据关联**

```
AVInstallation.getCurrentInstallation().saveInBackground(new SaveCallback() {
    public void done(AVException e) {
        if (e == null) {
            // 保存成功
            String installationId = AVInstallation.getCurrentInstallation().getInstallationId();
            // 关联  installationId 到用户表等操作……
        } else {
            // 保存失败，输出错误信息
        }
    }
});
```

### 订阅频道

你的应用可以订阅某个频道的消息，只要在保存 Installation 之前调用`PushService.subscribe`方法：

```java
// set a default callback. It's necessary for current SDK.
// 在v2.0以后的版本请务必添加这段代码，以避免推送无法成功达到客户端的问题
PushService.setDefaultPushCallback(this, PushDemo.class);
PushService.subscribe(this, "public", PushDemo.class);
PushService.subscribe(this, "private", Callback1.class);
PushService.subscribe(this, "protected", Callback2.class);
```

第一个参数是当前的 context，第二个参数是频道名称，第三个参数是回调对象的类，回调对象是指用户点击通知栏的通知进入的 Activity 页面。

退订频道也很简单：

```java
PushService.unsubscribe(context, "protected");
//退订之后需要重新保存 Installation
AVInstallation.getCurrentInstallation().saveInBackground();
```


### 推送消息

#### 配置

请确保您的 AndroidManifest.xml 包含如下内容
```xml
<service android:name="com.avos.avoscloud.PushService"/>
```

同时设置了必要的权限

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

为了让应用能在关闭的情况下也可以收到推送，你需要在`<application>`中加入：

```xml
<receiver android:name="com.avos.avoscloud.AVBroadcastReceiver">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.USER_PRESENT" />
    </intent-filter>
</receiver>
```

#### 推送给所有的设备

```java
AVPush push = new AVPush();
JSONObject object = new JSONObject();
object.put("alert", "push message to android device directly");
push.setPushToAndroid(true);
push.setData(object);
push.sendInBackground(new SendCallback() {
    @Override
    public void done(AVException e) {
        if (e == null) {
            // push successfully.
        } else {
            // something wrong.
        }
    });
```

#### 发送给特定的用户

* 发送给 public 频道的用户

```java
AVQuery pushQuery = AVInstallation.getQuery();
pushQuery.whereEqualTo("channels", "public");
AVPush push = new AVPush();
push.setQuery(pushQuery);
push.setMessage("Push to channel.");
push.setPushToAndroid(true);
push.sendInBackground(new SendCallback() {
    @Override
    public void done(AVException e) {
        if (e == null) {

        }   else {

        }
    }
});
```


* 发送给某个 Installation id的用户，通常来说，你会将 AVInstallation 关联到设备的登陆用户 AVUser 上作为一个属性，然后就可以通过下列代码查询 InstallationId 的方式来发送消息给特定用户，实现类似私信的功能：

```java
AVQuery pushQuery = AVInstallation.getQuery();
// 假设 THE_INSTALLATION_ID 是保存在用户表里的 installationId，
// 可以在应用启动的时候获取并保存到用户表
pushQuery.whereEqualTo("installationId", THE_INSTALLATION_ID);
AVPush.sendMessageInBackground("message to installation",  pushQuery, new SendCallback() {
    @Override
    public void done(AVException e) {

    }
});
```

在 2.6.7 以后，我们加入了通过 CQL 来筛选推送目标的功能，主要代码如下：

```java
    AVPush push = new AVPush();
    JSONObject data =
        new JSONObject(
            "{\"action\": \"com.avos.UPDATE_STATUS\", \"name\": \"Vaughn\", \"newsItem\": \"Man bites dog\"  }");
    push.setData(data);
    String installationId = AVInstallation.getCurrentInstallation().getInstallationId();
    push.setCloudQuery("select * from _Installation where installationId ='" + installationId
        + "'");
    push.sendInBackground(new SendCallback() {

      @Override
      public void done(AVException e) {

      }
    });
```
*注：CQL 与 AVQuery 同时只能设置一个，并且在设置 CQL 时，必须通过 CQL 来设置目标机器的类型(ios,android,wp)*

#### 自定义 Receiver

如果您想推送消息，但不显示在 Andoid 系统的通知栏中，而是执行应用程序预定义的逻辑，则可以发送类似下列这样的请求

```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "channels":[ "public"],
        "data": {
          "action": "com.avos.UPDATE_STATUS",
          "name": "LeanCloud."
        }
      }' \
  https://leancloud.cn/1.1/push
```

请注意：**如果您使用自定义的 Receiver，发送的消息必须带 action，并且其值在自定义的 Receiver 配置的 <intent-filter> 列表里存在，比如这里的'com.avos.UPDATE_STATUS'，请使用自己的 action，尽量不要跟其他应用混淆，推荐采用域名来定义**

您需要在您的 Android 项目中添加如下功能

AndroidManifest.xml 中声明您的 Receiver

```xml
<receiver android:name="com.avos.avoscloud.PushDemo.MyCustomReceiver">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.USER_PRESENT" />
        <action android:name="android.net.conn.CONNECTIVITY_CHANGE" />
        <action android:name="com.avos.UPDATE_STATUS" />
    </intent-filter>
</receiver>
```

其中 com.avos.avoscloud.PushDemo.MyCustomReceiver 是您的 Android 的 Receiver 类。

而 `<action android:name="com.avos.UPDATE_STATUS" />` 需要与 push 的 data 中指定的 action 相对应。


您的 Receiver 可以按照如下方式实现


```java
public class MyCustomReceiver extends BroadcastReceiver {
    private static final String TAG = "MyCustomReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        LogUtil.log.d(TAG, "Get Broadcat");
        try {
            String action = intent.getAction();
            String channel = intent.getExtras().getString("com.avos.avoscloud.Channel");
            //获取消息内容
            JSONObject json = new JSONObject(intent.getExtras().getString("com.avos.avoscloud.Data"));

            Log.d(TAG, "got action " + action + " on channel " + channel + " with:");
            Iterator itr = json.keys();
            while (itr.hasNext()) {
                String key = (String) itr.next();
                Log.d(TAG, "..." + key + " => " + json.getString(key));
            }
        } catch (JSONException e) {
            Log.d(TAG, "JSONException: " + e.getMessage());
        }
    }
}
```
#### 跟踪 Android 推送和应用的打开情况

您可以在订阅频道对应的 Activity 中添加跟踪应用打开情况的统计代码，您的 Activity 可以按照如下方式实现 `onStart` 方法：

```java
public class MyActivity extends Activity {
	@Override
	protected void onStart() {
		super.onStart();

		Intent intent = getIntent();
		AVAnalytics.trackAppOpened(intent);
	}
}
```

您可以在 [请求分析](/apistat.html?appid={{appid}}#/_appOpenWithPush) 菜单里看到通知和应用的打开情况。


#### Installation自动过期和清理

每当用户打开应用，我们都会更新该设备的 Installation 的 updatedAt 时间戳。当用户长期没有更新 Installation 的 updatedAt 时间戳，换句话说，就是用户长期没有打开应用（默认是超过 60 天没有打开），这个 Installation 的 valid 将被设置为 false，往这个 Installation 发送的消息将被忽略，直到用户以后某天打开应用更新了 updatedAt，valid 将再次设置为 true。

如果超过 120 天，用户仍然没有打开过应用，那么该 Installation 将被删除。不过您不需要担心，当用户再次打开应用的时候，仍然会自动创建一个新的 Installation 用于推送。

## Windows Phone 8 消息推送

Windows Phone 8 的推送较为特殊，因为微软在设计的时候把推送消息定义为一个包含跳转页面信息的载体，比如微信推送：你单击微信发送的 Windows Phone 的 Toast 推送消息，单击进去之后，它不是打开微信的默认首页（假如叫做 Main.xaml），而是进入某一个聊天的具体的页面（假如叫做 chat.xaml）。这种场景微软是通过在推送消息里面包含了代码逻辑来实现的，比如要实现刚才这一套流程，微信服务端必须向微软的 MPNS 发送一个如下类似的消息（Http 或者 Https Post 请求）：

```xml
<?xml version="1.0" encoding="utf-8"?>
    <wp:Notification xmlns:wp="WPNotification">
        <wp:Toast>
            <wp:Text1>微信</wp:Text1>
            <wp:Text2>您有一条聊天消息</wp:Text2>
            <wp:Param>/chat.xaml?NavigatedFrom=Toast Notification</wp:Param>
        </wp:Toast>
    </wp:Notification>
```
所以在使用 LeanCloud 推送服务向 Windows Phone 8 平台推送的时候一定要对微软官方的推送有所了解，如果想深入了解，可以点击详细查看微软官方关于 [Windows Phone 8 推送的官方教程](http://msdn.microsoft.com/en-us/library/windows/apps/hh202967\(v=vs.105\).aspx)。

针对 Windows Phone 8 的特殊性，LeanCloud 采用了统一接口去处理，如下 C# 代码可以实现以上所说的功能：
在 LeanCloud 所有 .NET 语言 SDK 均可如下进行操作。（注：Unity 暂时不支持.Wait（）方法 和 await 关键字，所以它需要使用任务的链式表达，详情请查看 Unity 的文档。）

```javascript
AVPush avPush = new AVPush();
avPush.Data = new Dictionary<string, object>();
avPush.Data.Add("title", "微信");
avPush.Data.Add("alert", "您有一条聊天消息");
avPush.Data.Add("wp-param", "/chat.xaml?NavigatedFrom=Toast Notification");
await avPush.SendAsync()；
```
### 推送给所有的设备

```javascript
AVPush push = new AVPush();
push.Alert = "message to all devices.";
var task = push.SendAsync();
await task;
```
以上这段代码就可以实现向所有安装了当前应用的设备推送消息。

### 发送给特定的用户
发送给 public 频道的用户：

```javascript
AVPush push = new AVPush();
push.Alert = "message to public channel.";
push.Query = new AVQuery<AVInstallation>().WhereEqualTo("channels", "public");
var task = push.SendAsync();
await task;
```


## 使用 REST API 推送消息


### Installation

当您的app安装在用户设备后，如果要使用消息推送功能，LeanCloud SDK 会自动生成一个 Installation 对象。Installation 对象包含了推送所需要的所有信息。您可以使用 REST API，通过 Installation 对象进行消息推送。

#### 保存 Installation

##### 保存 iOS 设备的 device token

iOS 设备通常使用 DeviceToken 来惟一标识一台设备。

```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "deviceType": "ios",
        "deviceToken": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
        "channels": [
          "public", "protected", "private"
        ]
      }' \
  https://leancloud.cn/1.1/installations
```

##### 保存 Android 设备的 installaitonId

对于 Android 设备，AVOS SDK 会自动生成 uuid 作为 installaitonId 保存到 LeanCloud. 您可以使用以下 REST API 保存 Android 设备的 installaiton ID.

```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "deviceType": "android",
        "installationId": "12345678-4312-1234-1234-1234567890ab",
        "channels": [
          "public", "protected", "private"
        ]
      }' \
  https://leancloud.cn/1.1/installations
```

`installaitonId` 必须在应用内唯一。

##### 订阅和退订频道

通过设置 `channels` 属性来订阅某个推送频道：

```sh
curl -X PUT \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "channels": [
          "Giants"
        ]
      }' \
  https://leancloud.cn/1.1/installations/mrmBZvsErB
```

退订一个频道：

```
curl -X PUT \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "channels": {
           "__op":"Remove",
           "objects":["Giants"]
        }
       }' \
  https://leancloud.cn/1.1/installations/mrmBZvsErB
```

`channels` 本质上是数组属性，因此可以使用标准 [REST API](./rest_api.html#数组) 操作。

#### 自定义属性

```sh
curl -X PUT \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "userObjectId": "user objectId"
      }' \
  https://leancloud.cn/1.1/installations/mrmBZvsErB
```

### 推送消息

通过 `POST /1.1/push` 来推送消息给设备，`push`接口支持下列属性：

* data 一个 JSON 对象，表示推送的内容数据，下文详解
* where 一个查询 `_Installation` 表的查询条件 JSON 对象
* channels 推送给哪些频道，将作为条件加入 `where` 对象。
* expiration_time 消息过期的绝对日期时间
* expiration_interval 消息过期的相对时间
* push_time 定期推送时间
* prod 设置使用测试证书(dev)还是生产证书(prod)，只对 iOS 有效。


#### 消息内容 Data

对于 iOS 设备，`data` 属性可以是：

```
{
  "data": {
   "alert": "消息内容",
   "category":"通知分类名称",
   "badge": "未读消息数目，应用图标边上的小红点数字，可以是数字，也可以设置为Increment字符串",
   "sound": "声音文件名，前提在应用里存在",
   "content-available":"如果你在使用Newsstand, 设置为1来开始一次后台下载"
  }
}
```

并且 iOS 设备支持 `alert` 本地化消息推送：

```
{
  "data":{
    "alert": {
      "body":"消息内容",
      "action-loc-key": "",
      "loc-key":"",
      "loc-args":"",
      "launch-image":""
     }
   }
}
```

详情参考 [Apple 文档](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/ApplePushService.html)。

如果是 Android 设备，默认的消息栏通知 data 支持下列属性：

```
{
  "data":{
    "alert":"消息内容",
    "title":"显示在通知栏的标题"
  }
}
```

如果自定义 Receiver，需要设置 action，当然也可以自己加属性了:

```
{
  "data":{
    "alert":"消息内容",
    "title":"显示在通知栏的标题",
    "action":"com.your_company.push",
    "fromUserId":"自定义属性"
  }
}
```

WindowsPhone 设备类似，也支持`title`和`alert`，同时支持`wp-param`用于定义打开通知的时候打开的是哪个 Page:

```
{
  "data":{
    "alert":"消息内容",
    "title":"显示在通知栏的标题",
    "wp-param":"/chat.xaml?NavigatedFrom=Toast Notification"
  }
}
```

但是如果想一次 push 调用**推送不同的数据给不同类型的设备**， `data`属性同时支持设定设备特定消息，例如：

```
{
  "data":{
    "ios": {
      "alert": "消息内容",
      "badge": "未读消息数目，应用图标边上的小红点数字，可以是数字，也可以设置为Increment字符串",
      "sound": "声音文件名，前提在应用里存在",
      "content-available":"如果你在使用Newsstand, 设置为1来开始一次后台下载"
    },
    "android": {
      "alert":"消息内容",
      "title":"显示在通知栏的标题",
      "action":"com.your_company.push",
      "fromUserId":"自定义属性"
    },
    "wp":{
      "alert":"消息内容",
      "title":"显示在通知栏的标题",
      "wp-param":"/chat.xaml?NavigatedFrom=Toast Notification"
    }
  }
}
```

#### iOS 测试和生产证书区分

我们现在支持上传两个环境的 iOS 推送证书：测试和生产环境，您可以通过设定 `prod` 属性来指定使用哪个环境证书

```
{
  "prod": "dev",
  "data": {
    "alert": "test"
  }
}
```

如果是 `dev` 值就表示使用测试证书，`prod` 值表示使用生产证书。默认使用生产证书。

#### 推送查询条件

where 是用来查询 `_Installation` 表的，`_Installation`表有的属性（无论是内置还是自定义的）都可以作为查询条件，并且支持 [REST API](./rest_api.html#查询) 定义的各种复杂查询。

后文会举一些例子，更多例子参考 REST API 查询文档。

#### expiration_time、expiration_interval 和 push_time

`expiration_time` 属性用于指定消息的过期时间，如果客户端收到消息的时间超过这个绝对时间，那么消息将不显示给用户。`expiration_time` 的格式是形如 `YYYY-MM-DDTHH:MM:SS.MMMMZ` 的 UTC 时间字符串。

```
{
      "expiration_time": "2013-12-04T00:51:13Z",
      "data": {
        "alert": "北京时间 12 月 4 号 8:51 过期。"
      }
}
```

`expiration_interval` 也可以用于指定过期时间，不过他是一个相对时间，以*秒为单位*，从 API 调用时间点开始计算起：

```
{
      "expiration_interval": "86400",
      "data": {
        "alert": "收到 push API 调用的一天内过期"
      }
}
```

`push_time`用来指定定期推送的时间，他也是形如`YYYY-MM-DDTHH:MM:SS.MMMMZ`的 UTC 时间，也可以结合`expiration_interval`设定过期时间：

```
{
      "push_time": "2013-12-04T00:51:13Z",
      "expiration_interval": "86400",
      "data": {
        "alert": "北京时间 12 月 4 号 8:51 发送这条推送,24小时后过期"
      }
}
```

下面是一些推送的例子

#### 推送给所有的设备
```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "data": {
          "alert": "Hello From LeanCloud."
        }
      }' \
  https://leancloud.cn/1.1/push
```

#### 发送给特定的用户

* 发送给public频道的用户

```sh
curl -X POST \
-H "X-AVOSCloud-Application-Id: {{appid}}"          \
-H "X-AVOSCloud-Application-Key: {{appkey}}"        \
-H "Content-Type: application/json" \
-d '{
      "where":{
        "channels":
          {"$regex":"\\Qpublic\\E"}
      },
      "data": {
        "alert": "Hello From LeanCloud."
      }
    }' \
https://leancloud.cn/1.1/push
```

或者更简便的方式

```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "channels":[ "public"],
        "data": {
          "alert": "Hello From LeanCloud."
        }
      }' \
  https://leancloud.cn/1.1/push

```

* 发送给某个 installation id 的用户

```sh
curl -X POST \
-H "X-AVOSCloud-Application-Id: {{appid}}"          \
-H "X-AVOSCloud-Application-Key: {{appkey}}"        \
-H "Content-Type: application/json" \
-d '{
      "where":{
          "installationId":"57234d4c-752f-4e78-81ad-a6d14048020d"
          },
      "data": {
        "alert": "Hello From LeanCloud."
      }
    }' \
https://leancloud.cn/1.1/push
```

* 推送给不活跃的用户

```sh
curl -X POST \
-H "X-AVOSCloud-Application-Id: {{appid}}"          \
-H "X-AVOSCloud-Application-Key: {{appkey}}"        \
-H "Content-Type: application/json" \
-d '{
      "where":{
          "updatedAt":{
              "$lt":{"__type":"Date","iso":"2013-06-29T11:33:53.323Z"}
            }
      },
      "data": {
          "alert": "Hello From LeanCloud."
      }
    }' \
https://leancloud.cn/1.1/push
```

* 根据查询条件做推送：

```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "where": {
          "injuryReports": true
        },
        "data": {
          "alert": "Willie Hayes injured by own pop fly."
        }
      }' \
  https://leancloud.cn/1.1/push
```

**请注意，where 条件查询的都是 installations 表。这里是假设 installations 表存储了 injuryReports 的布尔属性**

* 根据地理信息位置做推送：

```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "where": {
          "owner": {
            "$inQuery": {
              "location": {
                "$nearSphere": {
                  "__type": "GeoPoint",
                  "latitude": 30.0,
                  "longitude": -20.0
                },
                "$maxDistanceInMiles": 1.0
              }
            }
          }
        },
        "data": {
          "alert": "Free hotdogs at the avoscloud concession stand!"
        }
      }' \
  https://leancloud.cn/1.1/push
```

上面的例子假设 installation 有个 owner 属性指向 _User 表的记录，并且用户有个 location 属性是 GeoPoint 类型，我们就可以根据地理信息位置做推送。

#### 使用 CQL 查询推送

上述`where`的查询条件都可以使用 [CQL](./cql_guide.html) 查询替代，例如查询某个设备推送：

```sh
curl -X POST \
-H "X-AVOSCloud-Application-Id: {{appid}}"          \
-H "X-AVOSCloud-Application-Key: {{appkey}}"        \
-H "Content-Type: application/json" \
-d '{
      "cql":"select * from _Installation where installationId='xxxxxxxxxxxxx'",
      "data": {
        "alert": "Hello From LeanCloud."
      }
    }' \
https://leancloud.cn/1.1/push
```

#### 推送消息属性

##### 消息过期

 过期时间，可以是绝对时间：
```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "expiration_time": "2013-12-04T00:51:13Z",
        "data": {
          "alert": "Season tickets on sale until December  4, 2013"
        }
      }' \
  https://leancloud.cn/1.1/push
```

也可以是相对时间（从推送 API 调用开始算起，结合 push_time 做定期推送）:
```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "push_time": "2013-11-28T00:51:13Z",
        "expiration_interval": 518400,
        "data": {
          "alert": "Season tickets on sale until December  4, 2013"
        }
      }' \
  https://leancloud.cn/1.1/push
```

##### 定制消息属性：

```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "channels": [
          "Mets"
        ],
        "data": {
          "alert": "The Mets scored! The game is now tied 1-1.",
          "badge": "Increment",
          "sound": "cheering.caf",
          "title": "Mets Score!"
        }
      }' \
  https://leancloud.cn/1.1/push
```


#### Android 自定义 Receiver

* 推送消息，但不显示在 Andoid 系统的通知栏中，而是执行应用程序预定义的逻辑

```sh
curl -X POST \
  -H "X-AVOSCloud-Application-Id: {{appid}}"          \
  -H "X-AVOSCloud-Application-Key: {{appkey}}"        \
  -H "Content-Type: application/json" \
  -d '{
        "channels":[ "public"],
        "data": {
          "action": "com.avos.UPDATE_STATUS"
          "name": "LeanCloud."
        }
      }' \
  https://leancloud.cn/1.1/push
```

请注意：**如果您使用自定义的 Receiver，发送的消息必须带 action，并且值不能为'com.avos.UPDATE_STATUS'，请使用自己的 action，尽量不要跟其他应用混淆**

您需要在您的Android项目中添加如下功能

AndroidManifest.xml中声明您的receiver

```xml
<receiver android:name="com.avos.avoscloud.PushDemo.MyCustomReceiver">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.USER_PRESENT" />
        <action android:name="android.net.conn.CONNECTIVITY_CHANGE" />
        <action android:name="com.avos.UPDATE_STATUS" />
    </intent-filter>
</receiver>
```

其中 `com.avos.avoscloud.PushDemo.MyCustomReceiver` 是您的 Android 的 Receiver 类。

而 `<action android:name="com.avos.UPDATE_STATUS" />` 需要与 push 的 data 中指定的 action 相对应。

您的 Receiver 可以按照如下方式实现

```java
public class MyCustomReceiver extends BroadcastReceiver {
    private static final String TAG = "MyCustomReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        LogUtil.log.d(TAG, "Get Broadcat");
        try {
            String action = intent.getAction();
            String channel = intent.getExtras().getString("com.avos.avoscloud.Channel");
            JSONObject json = new JSONObject(intent.getExtras().getString("com.avos.avoscloud.Data"));

            Log.d(TAG, "got action " + action + " on channel " + channel + " with:");
            Iterator itr = json.keys();
            while (itr.hasNext()) {
                String key = (String) itr.next();
                Log.d(TAG, "..." + key + " => " + json.getString(key));
            }
        } catch (JSONException e) {
            Log.d(TAG, "JSONException: " + e.getMessage());
        }
    }
}
```

## 推送问题排查

推送因为环节较多，跟设备和网络都相关，并且调用都是异步化，因此问题比较难以查找，这里是一些 Tip 帮助排查消息推送遇到的问题。

### 推送结果查询

所有经过 `/push` 接口发出的消息的都可以在控制台的存储里的 `_Notification` 表看到。每次调用 `/push` 都将产生一条新的 `_Notification` 对象表示一次推送。这张表除了 objectId 等内置属性之外还包含下列属性：

* where 本次推送查询 `_Installation` 表的条件，符合这些查询条件的设备将接收本条推送消息。
* data 本次推送的消息内容。
* subscribers 本次推送的接收设备数目，注意这个数字并不表示实际送达，而是说当时符合查询条件的、并且已经推送给 Apple APNS 或者 Android Push Server的总设备数。
* invalidTokens 仅 iOS 消息推送有效，表示本次推送遇到多少次 APNs 返回 [INVALID TOKEN](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/CommunicatingWIthAPS.html#//apple_ref/doc/uid/TP40008194-CH101-SW12) 错误，如果这个数字过大，请留意证书是否正常。
* status 表示本次推送的状态，`in queue` 表示仍然在队列，`done`表示完成，`schedule`表示定时推送任务等待触发中。
* prod 仅对 iOS 有效，表示使用什么环境证书，`dev` 表示测试证书，`prod` 表示生产证书。


`/push` 接口会返回新建的 `_Notification` 对象的 `objectId`，您就可以在这张表里查找消息推送的结果。


### iOS 推送排查建议

一些建议和提示：

* 请确保在项目 `Info.plist` 文件中使用了正确的 `Bundle Identifier`。
* 请确保在 `Project > Build Settings` 设置了正确的 `provisioning profile`
* 尝试 clean 项目并重启 Xcode
* 尝试到 [Apple Developer](https://developer.apple.com/account/overview.action)重新生成 `provisioning profile`，修改 Apple ID，再改回来，然后重新生成。你需要重新安装 `provisioning profile` 并在 `Project > Build Settings` 里重新设置。
* 打开 XCode Organizer，从电脑和 iOS 设备里删除所有过期和不用的 `provisioning profile`。
* 如果编译和运行都没有问题，但是你仍然收不到推送，请确保你的应用打开了接收推送权限，在 iOS 设备的「设置 -> 通知 -> 你的应用」 里确认。
* 如果权限也没有问题，请确保使用了正确的 `provisioning profile` 打包你的应用。如果你上传了测试证书并使用测试证书推送，那么必须使用 `Development Provisioning Profile` 构建你的应用。如果你上传了生产证书，并且使用生产证书推送，请确保你的应用使用 `Distribution Provisioning Profile` 签名打包。`Ad Hoc` 和 `App Store Distribution Provisioning Profile` 都可以接收使用生产证书发送的消息。
* 当在一个已经存在的 Apple ID 上启用推送，请记得重新生成 `provisioning profile`，并到 XCode Organizer 更新。
* 生产环境的推送证书必须在提交到 App Store 之前启用推送并生成，否则你需要重新提交 App Store。
* 请在提交 App Store 之前，使用 Ad Hoc Profile 测试生产环境推送，这种情况下的配置最接近于 App Store。
* 检查 `_Notifcation` 表的 `subscribers` 和 `status`，确认推送状态和接收设备数目正常。


### Android 排查建议

* 请确保设备正确调用了 `AVInstallation` 保存了设备信息到 `_Installation` 表。
* 可以在控制台的 `消息 -> 推送 -> 帮助` 根据 `installationId` 查询设备是否在线。
* 请确保 `com.avos.avoscloud.PushService` 添加到 AndroidManifest.xml 文件中。
* 如果使用自定义 Receiver，请确保在 AndroidManifest.xml 中声明您的 Receiver，并且保证 data 里的 action 一致。
