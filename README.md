# OkHttpLogger-Frida
- Frida 实现拦截okhttp的脚本


### 使用说明

> ①  首先将 `okhttpfind.dex` 拷贝到 `/data/local/tmp/` 目录下。
>  [okhttpfind.dex源码链接](https://github.com/siyujie/okhttp_find)

执行命令启动`frida -U -l okhttp_poker.js -f com.example.demo --no-pause` 可追加 `-o [output filepath]`保存到文件

> ②  调用函数开始执行
-  **find() 要等完全启动并执行过网络请求后再进行调用**
-  **hold() 要等完全启动再进行调用**
-  **history() & resend() 只有可以重新发送的请求**

#### 函数：
```
  `find()`                                         检查是否使用了Okhttp & 是否可能被混淆 & 寻找okhttp3关键类及函数	
  `switchLoader(\"okhttp3.OkHttpClient\")`         参数：静态分析到的okhttpclient类名
  `hold()`                                         开启HOOK拦截
  `history()`                                      打印可重新发送的请求
  `resend(index)`                                  重新发送请求
```

#### 原理：
由于所有使用的`okhttp`框架的App发出的请求都是通过`RealCall.java`发出的，那么我们可以hook此类拿到`request`和`response`,
也可以缓存下来每一个请求的`call`对象，进行再次请求，所以选择了此处进行hook。
`find`前新增`check`，根据特征类寻找是否使用了`okhttp3`库，如果没有特征类，则说明没有使用`okhttp`;
找到特征类，说明使用了`okhttp`的库，并打印出是否被混淆。

#### 抓取打印的样例

###### 例子1
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
|   hex[........]//省略了，太长了
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

```
###### 例子2
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
| URL: http://****/searchByKeywork
|
| Method: POST
|                                                                                                                    
| Headers:
|   ┌─Content-Type: application/x-www-form-urlencoded
|   └─Content-Length: 20
|
| Body:
|   userId=*****&keyword=run
|
|--> END 
|
| URL: http://****/searchByKeywork
|
| Status Code: 200 / 
|
| Headers:
|   ┌─Content-Type: application/json;charset=UTF-8
|   ┌─Transfer-Encoding: chunked
|   └─Date: Sat, 29 Aug 2020 10:18:50 GMT
| 
| Body:
|   {"code":1000,"message":"成功","result":[{"id":"jqjcRQFO2","name":"RUN","remark":"","shareKey":"dRbkPjn
|   J2sjVJTP0G","cover":null,"list":null,"index":0,"note":"更新至20200123期"}]}
| 
|<-- END HTTP
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

```

#### okhttp_find结果样例

```
 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 被 混 淆 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Start Find~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Find Result~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var Cls_Call = "فمضﺝ.ثيغه";
var Cls_CallBack = "فمضﺝ.ﺙلﺩج";
var Cls_OkHttpClient = "فمضﺝ.ﻙﺫتك";
var Cls_Request = "فمضﺝ.ﺵكـﻅ";
var Cls_Response = "فمضﺝ.صرفج";
var Cls_ResponseBody = "فمضﺝ.ضتﻭذ";
var Cls_okio_Buffer = "ﻭﻍﺫﻉ.ﺵﺱﻭع";
var F_header_namesAndValues = "ﻝبـق";
var F_req_body = "ﺵﺱﻭع";
var F_req_headers = "بﺙذن";
var F_req_method = "ﺯﺵتﻝ";
var F_req_url = "ﻝبـق";
var F_rsp$builder_body = "ﻝجﻭق";
var F_rsp_body = "ﺹﻅﻍز";
var F_rsp_code = "ﻝجﻭق";
var F_rsp_headers = "غﻝزث";
var F_rsp_message = "فمضﺝ";
var F_rsp_request = "ثيغه";
var M_CallBack_onResponse = "onResponse";
var M_Call_enqueue = "ﻝبـق";
var M_Call_execute = "wait";
var M_Call_request = "";
var M_Client_newCall = "ﻝبـق";
var M_buffer_readByteArray = "ﺹﻅﻍز";
var M_contentType_charset = "ﻝبـق";
var M_reqbody_contentLength = "contentLength";
var M_reqbody_contentType = "contentType";
var M_reqbody_writeTo = "writeTo";
var M_rsp$builder_build = "ﻝبـق";
var M_rspBody_contentLength = "contentLength";
var M_rspBody_contentType = "contentType";
var M_rspBody_create = "create";
var M_rspBody_source = "source";
var M_rsp_newBuilder = "بﺙذن";


~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Find Complete!~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

#### 详情见动图吧！如有问题，请 issues
- 因为`okhttp_poker.js`覆盖了`okhttp_cat.js`的所有功能，所以放弃了`okhttp_cat.js`

#### 免责声明
- 仅做学习交流! 请勿商用!!
- 若因使用本服务与相关软件官方造成不必要的纠纷，本人概不负责!
- 本人纯粹技术爱好，若侵相关公司的权益，请告知删除!
#### 特别感谢
- https://github.com/r0ysue/AndroidSecurityStudy
