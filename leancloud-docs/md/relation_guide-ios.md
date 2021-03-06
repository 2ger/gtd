# 关系建模指南
数据对象之间存在 3 种类型的关系。一对一关系可以将一个对象与另一个对象关联。一对多关系可以使一个对象关联多个对象。多对多关系可以实现大量对象之间的复杂关系。

## LeanCloud中的关系
LeanCloud中有 4 种方式构建对象之间的关系：

1. Pointers （适合一对一和一对多关系）
2. Arrays （适合一对多和多对多关系）
3. AVRelation （适合多对多关系）
4. 关联表 （适合多对多关系）

## 一对多关系
当你需要一个一对多关系的时候，该使用 Pointers 还是 Arrays 实现，需要考虑几个因素。首先，需要考虑关系中包含的对象数量。如果关系「多」方包含的对象数量可能非常大（大于 100 左右），那么你就必须使用 Pointers。反之，如果对象数量很小（低于 100 或更少），那么 Arrays 可能会更方便，特别是如果你经常需要获取父对象同时得到所有相关的对象（一对多关系中的「多」）。

### 使用 Pointers 实现一对多关系
假如我们有一个摄影社交应用，需要记录用户每条动态的内容、创建时间等。我们可以构造一个`Post`对象来存储这些数据。如果这个摄影社交应用非常成功，每个用户将拥有成百上千的`Post`对象。类似这样的情况，关系中的对象数量可能无限制地增长，Pointer 是最好的选择。
假设在这个应用中，我们确定每个`Post`对象都会与一个 AVUser 关联。我们可以像这样实现：


```objc
    AVObject *post = [AVObject objectWithClassName:@"Post"];
    [post setObject:[AVUser currentUser] forKey:@"createdBy"];
```


我们可以使用下面的代码来查询某个 AVUser 创建的`Post`对象：


```objc
    AVQuery *postQuery = [AVQuery queryWithClassName:@"Post"];
    [postQuery whereKey:@"createdBy" equalTo:[AVUser currentUser]];
```


如果我们需要查询某个`Post`对象的创建者，也就是获取 `createdBy` 属性：


```objc
    AVUser *createdBy = [post objectForKey:@"createdBy"];
```


大多数场景下，Pointers 是实现一对多关系的最好选择。

### 使用 Arrays 实现一对多关系
当我们知道一对多关系中包含的对象数量很小时，使用 Arrays 实现是比较理想的。Arrays 可以通过 `includeKey` 简化查询。传递对应的 key 可以在获取「一」方对象数据的同时获取到所有「多」方对象的数据。但是，如果关系中包含的对象数量巨大，查询将响应缓慢。

假设我们有一个在线购物的应用，需要保存用户购物车中的商品，我们知道购物车中的商品数量有大小限制。同时，我们还想保存购物车中商品的顺序。这种情况正好适合用 Arrays 实现，因为数组的大小不会很大，而且还需要保存数组内元素的顺序：

我们可以在 AVUser 上创建添加一列`cartProducts`。

现在我们存入一些`Product`对象到`cartProducts`中：

 
```objc
    // 假设我们有四件商品
    AVObject *coffee;
    AVObject *chip;
    AVObject *beer;
    AVObject *cookie;
    
    // 将商品保存在数组中
    NSArray *products = @[coffee, chip, beer, cookie];
    
    // 将商品保存在用户的购物车中
    [[AVUser currentUser] setObject:products forKey:@"cartProducts"];
```


然后，如果我们需要获取这些`Product`对象，仅仅需要一行代码：


```objc
    NSArray *products = [[AVUser currentUser] objectForKey:@"cartProducts"];
```


有时候，我们会想获取我们一对多中「一」的对象的同时获取「多」的对象。我们可以在使用 AVQuery 查询 AVUser 的时候，使用`includeKey`（或 Android 中的`include`）来同时获取`cartProducts`列中存放的`Product`对象：


```objc
    // 从 AVUser 对象获得 AVQuery 对象
    AVQuery *userQuery = [AVUser query];
    
    // 为查询设置约束
    // 比如，你想查询最近一个小时登录过的用户
    
    // 让这个查询得到用户的同时，得到他们购物车上的商品列表
    [userQuery includeKey:@"cartProducts"];
    
    // 执行查询
    [userQuery findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
        // objects 包含了所有满足条件的用户，和与之关联购物车商品列表
    }];
```


你也可以在一对多关系中通过「多」方对象获取到「一」方对象。例如，我们想找出所有拥有某个特定`Product`的 AVUser，可以像这样来查询：


```objc
    // 加上约束，查询购物车里有某个特定的商品的用户
    [userQuery whereKey:@"cartProducts" equalTo:coffee];
    
    // 或者查询购物车中包含了几个商品的用户
    [userQuery whereKey:@"cartProducts" containedIn:arrayOfProducts];
```


## 多对多关系
现在让我们来处理多对多关系。假设我们有一个音乐应用，我们需要对`Song`对象和`Artist`对象建模。如我们所知，一个歌手可以创作多首歌，一首歌也可以有多个歌手演唱。这是一个典型的多对多关系，你必须选择使用 Arrays， AVRelation 或创建自己的关联表来实现这种关系。

决策的关键在于是否需要为这个关系附加一些属性。如果不需要，使用 AVRelation 或 Arrays 是最简单的。通常情况下，使用 Arrays 会有更好的性能和更少的查询。如果多对多关系中任何一方对象数量可能达到或超过 100，像一对多关系中描述的原因一样，使用 AVRelation 或关联表是更好的选择。

另一方面，如果你想为关系附加一些属性，则需要创建一个独立的表（关联表）来存储两端的关系。记住，附加的属性是描述这个关系的，不是描述关系中的任何一方。你可能会感兴趣的需要使用关联表附加一些属性的示例有：

* 关系创建的时间
* 关系创建者
* 某人查看此关系的次数

### 使用 AVRelation
我们可以使用 AVRelation 构建一个`Song`和`Artist`之间的关系。在后台的数据查看界面，你可以给 Song 对象添加一个名称为`artists`，类型为 relation 的列。

然后，我们可以关联一些歌手到这首歌：


```objc
    // 假如我们用下面的对象来表示几个歌手
    AVObject *artistOne;
    AVObject *artistTwo;
    AVObject *artistThree;
    
    // 创建一条歌曲记录
    AVObject *song= [AVObject objectWithClassName:@"Song"];
    
    // 我们把歌手和歌曲关联起来，在 Song 对象中创建一个 "artists" Relation
    AVRelation *relation = [song relationforKey:@"artists"];
    // 请确保这些对象在关联之前已经保存到了服务器上
    [relation addObject:artistOne];
    [relation addObject:artistTwo];
    [relation addObject:artistThree];
    
    // 保存 Song 对象
    [song saveInBackground];
```


** 注意： ** 这里 artistOne, artistTwo, artistThree 必需已经保存到云端之后才能添加到 relation，否则 [song saveInBackground] 会报错。

要获取某首歌的所有演唱者，使用如下查询：


```objc
    // 假如有一个 song 对象
    AVObject *song;
    
    // 在 artists 字段上得到一个 relation
    AVRelation *relation = [song relationforKey:@"artists"];
    
    // 根据上面的 relation 得到一个 AVQuery 对象
    AVQuery *query = [relation query];
    
    // 执行查询
```


也许你更需要获取某个歌手的所有歌曲。你可以构造一个稍微不同的查询来获取这种反向关系的结果：


```objc
    // 假如我们有一个 artist 对象，希望获得该 artist 创作的所有歌曲
    AVObject *artist;
    
    // 首先，对 Song 对象创建一个查询
    AVQuery *query = [AVQuery queryWithClassName:@"Song"];
    
    // 我们查询所有的 Song，看哪些 Song 的 artists 关联包含了特定的 artist
    [query whereKey:@"artists" equalTo:artist];
```


### 使用关联表
也许某些情况下，我们需要知道更多关系的附加信息。例如，假设我们为班级与成员的关系建模。在我们的应用里，我们不仅想知道用户 A 是否在某班，我们还想知道用户 A 在某班的角色。这样的信息不能使用 AVRelation 实现。为了保存这些数据，你必须创建一个独立的表保存这些关系。这个表我们叫做`MemberRelation`，它有一列叫`class`和一列叫`member`，都是 AVUser 的指针类型。除此之外，你还要添加一列名称为`role`，类型为`String`的列。

现在，当你要保存班级与成员之间的关系时，在`MemberRelation`表添加一行，给`class`，`member`和`role`填充恰当的数据：


```objc
    // 假定我们有一个即将要加入的班级
    AVObject *cls;
    
    // 在表中创建一条记录
    AVObject *memberRelation = [AVObject objectWithClassName:@"MemberRelation"];
    [memberRelation setObject:cls  forKey:@"class"];
    [memberRelation setObject:[AVUser currentUser] forKey:@"member"];
    [memberRelation setObject:@"leader" forKey:@"role"];
    [memberRelation saveInBackground];
```


如果我们想查询所有当前用户加入的班级，我们可以对`MemberRelation`表使用这样的查询：


```objc
    // 对 MemberRelation 表创建一个查询
    AVQuery *query = [AVQuery queryWithClassName:@"MemberRelation"];
    [query whereKey:@"member" equalTo:[AVUser currentUser]];
    
    // 执行查询
    [query findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
        for(AVObject *o in objects) {
            // o 是 MemberRelation 表的一条记录
            // 获取当前用户所在班级
            AVObject *cls = [o objectForKey:@"class"];
            
            // 获取当前用户在班级里的角色
            NSString *role = [o objectForKey:@"role"];
        }
    }];
```


同样，我们也可以很简单地查询所有当前班级的成员，我们可以对`MemberRelation`表使用这样的查询：

 
```objc
    AVObject *cls;
    
    // 对 MemberRelation 表创建一个查询
    AVQuery *query = [AVQuery queryWithClassName:@"MemberRelation"];
    [query whereKey:@"class" equalTo:cls];
    
    // 执行查询
    [query findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
        for(AVObject *o in objects) {
            // o 是 MemberRelation 表的一条记录
            // 获取相应的班级成员
            AVUser *member = [o objectForKey:@"member"];
            
            // 获取该成员在班级里的角色
            NSString *role = [o objectForKey:@"role"];
        }
    }];
```


### 使用 Arrays 实现多对多关系
使用 Arrays 实现多对多关系跟实现一对多关系大致相同。关系中一方的所有对象拥有一个数组列包含一些关系另一方的对象。

假设我们一个音乐应用拥有`Song`和`Artist`对象。`Song`对象包含一个`Artist`对象的数组（使用列名`artists`）。使用 Arrays 实现非常适合这样的场景，因为一首歌几乎不可能达到或超过 100 个演唱者。这是我们在`Song`对象中使用数组的原因。毕竟，一个歌手可能创作 100 首以上的歌曲。

这是我们怎么保存`Song`对象和`Artist`对象之间的关系：

 
```objc
    // 假设我们有一个歌手
    AVObject *artist;
    
    // 假设我们也有一首歌曲
    AVObject *song;
    
    // 把相应的歌手加到 song 的 artists 数组中
    [song addObject:artist forKey:@"artists"];
```


因为歌手列表使用的数组，当你获取一个`Song`对象的时候想要同时得到所有歌手的信息，则要使用`includeKey`（Android上是`include`）：


```objc
    // 对 Song 表创建一个查询
    AVQuery *songQuery = [AVQuery queryWithClassName:@"Song"];
    
    // 设置约束
    // 让查询同时返回每个 Song 中的 artists 列表
    [songQuery includeKey:@"artists"];
    
    // 执行查询
    [songQuery findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
        // objects 是所有 Song 对象，同时包含了关联的 Artist 对象
    }];
```


这样之后，获取某个`Song`对象的所有`Artist`对象很简单：

 
```objc
    NSArray *artistList = [song objectForKey:@"artists"];
```


最后，假设你有一个`Artist`对象，你需要找出所有他出现过的`Song`对象，这也很简单，只需要添加一个条件：


```objc
    // 假如我们有一个 artist 对象
    AVObject *artist;
    
    // 对 Song 表创建一个查询
    AVQuery *songQuery = [AVQuery queryWithClassName:@"Song"];
    
    // 约束查询
    [songQuery whereKey:@"artists" equalTo:artist];
    
    // 让查询同时返回 artists 列表
    [songQuery includeKey:@"artists"];
    
    // 执行查询
    [songQuery findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
        // objects 是所有 Song 对象，同时包含了关联的 Artist 对象
    }];
```


## 一对一关系
当你需要将一个对象拆分成两个对象时，一对一关系是一种重要的需求。这种需求应该很少见，但是在下面的实例中体现了这样的需求：

* **限制部分用户数据的权限** 在这个场景中，你可以将此对象拆分成两部分，一部分包含所有用户可见的数据，另一部分包含所有仅自己可见的数据（通过ACL控制）。同样，你也可以实现一部分包含所有用户可修改的数据，另一部分包含所有仅自己可修改的数据。
* **避免大对象** 在这个场景中，你的原始对象大小大于了对象的上限值（128K），你可以创建另一个对象来存储额外的数据。当然，这通常需要更好地设计你的数据模型来避免出现大对象。如果确实无法避免，你也可以考虑使用AVFile存储大数据。
* **更灵活的文件对象** AVFile 可以方便的存取文件，但是作为对象查询修改等不是很方便，可以使用 AVObject 构造一个自己的文件对象并与 AVFile 一对一关联，将文件属性存于AVObject 中，这样既可以方便查询修改文件属性，也可以方便存取文件。

感谢您阅读此文档。对于使用的复杂性我们深感抱歉。通常，数据的关系建模是一个难题。但是我们可以看到光明的一面：它仍然比人际关系简单。