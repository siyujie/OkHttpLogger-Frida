# OkHttpLogger-Frida
Frida 实现拦截okhttp的脚本


### 使用说明

> 首先将 `okhttpfind.dex` 拷贝到 `/mnt/sdcard/` 目录下，然后给目标App授予存储权限；
例：`frida -U com.example.demo -l okhttp_poker.js`

> 接下来使用okhttp的所有请求将被拦截并打印出来；

#### 扩展函数：
- `history()`    会打印出所有的被抓到的请求信息
- `resend(index)`   重新发送请求 例子： `resend(0)` 重新发送第一个请求

		
	
> 如果项目被混淆，那么可以使用okhttp_find.js打印出okhttp被混淆后的关键函数名称，然后替换已声明的内容即可。

> 例：`frida -U com.example.demo -l okhttp_find.js`

#### 备注 ：
`okhtpfind.dex` 内包含了 更改了包名的`okio`以及`Gson`，以及`Java`写的寻找`okhttp`特征的代码。

#### 原理：
由于所有使用的`okhttp`框架的App发出的请求都是通过`RealCall.java`发出的，那么我们可以hook此类拿到`request`和`response`,
也可以缓存下来每一个请求的`call`对象，进行再次请求，所以选择了此处进行hook。

#### 抓取打印的样例
>  一次性请求太多会出现打印错乱现象，由于自己太菜，暂时没有解决这个问题,希望求得大佬指点

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
| URL: https://lng.***.com/api/collect
|
| Method: POST
|
| Headers:
|   ┌─Content-Type: application/octet-stream; charset=utf-8
|   ┌─Content-Length: 3971
|   └─User-Agent: Dalvik/2.1.0 (Linux; U; Android 8.1.0; AOSP on msm8996 Build/OPM1.171019.011) Resolution/1080*1920 Version/6.59.0 Build/6590119 Device/(google;AOSP on msm8996) discover/6.59.0
|
| Body:
|   Base64[........]//省略了，太长了
|
|--> END  (binary body omitted -> isPlaintext)
|
| URL: https://lng.***.com/api/collect
|
| Status Code: 200 / 
|
| Headers:
|   ┌─date: Sat, 29 Aug 2020 10:09:28 GMT
|   ┌─content-type: text/json; charset=utf-8
|   ┌─content-length: 41
|   ┌─access-control-allow-origin: *
|   ┌─access-control-allow-credentials: true
|   ┌─access-control-allow-methods: GET,POST,OPTIONS,HEAD
|   └─access-control-allow-headers: Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Client-Build,X-Client-Platform,X-Client-Version,X-Mx-ReqToken,X-Requested-With,X-Sign
| 
| Body:
|   {"code":0,"msg":"Success","success":true}
| 
|<-- END HTTP
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

`
