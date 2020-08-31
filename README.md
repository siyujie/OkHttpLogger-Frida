# OkHttpLogger-Frida
Frida 实现拦截okhttp的脚本



### 使用说明

> 首先将 `okhttpfind.dex` 拷贝到 `/mnt/sdcard/` 目录下，然后给目标App授予存储权限。

例：`frida -U com.example.demo -l okhttp_poker.js`

> 接下来使用okhttp的所有请求将被拦截并打印出来。

#### 扩展函数：
- `history()`    会打印出所有的被抓到请求的记录列表
```
History Size : 40
History index[0] >> Request{method=POST, url=https://www.****.com/api3/getads, tags={class retrofit2.O0000Oo0=cn.com.open.****.component.advertise.core.O00000Oo.O000000o() [jinzhiwei, 0]}}
History index[1] >> Request{method=POST, url=https://www.i****.com/api3/getads, tags={class retrofit2.O0000Oo0=cn.com.open.****.component.advertise.core.O00000Oo.O000000o() [classtop, 0]}}
History index[2] >> Request{method=GET, url=http://img.mukewang.com/5f4cadb80964527d03280188.png, tags={}}
History index[3] >> Request{method=POST, url=https://www.i****.com/api3/payarticlelist, tags={class retrofit2.O0000Oo0=O00o0OoO.O000000o() [0, 0]}}
History index[4] >> Request{method=POST, url=https://www.i****.com/api3/payarticlefilter, tags={class retrofit2.O0000Oo0=O00o0OoO.O000000o() []}}
History index[5] >> Request{method=POST, url=https://www.i****.com/api3/getads, tags={class retrofit2.O0000Oo0=cn.com.open.****.component.advertise.core.O00000Oo.O000000o() [columntop, 0]}}
```
- `resend(index)`   重新发送请求 例子： `resend(0)` 重新发送第一个请求

		
	
> 如果项目被混淆，那么可以使用okhttp_find.js打印出okhttp被混淆后的关键函数名称，然后替换已声明的内容即可。

> 例：`frida -U com.example.demo -l okhttp_find.js`

#### 备注 ：
`okhtpfind.dex` 内包含了 更改了包名的`okio`以及`Gson`，以及`Java`写的寻找`okhttp`特征的代码。

#### 原理：
由于所有使用的`okhttp`框架的App发出的请求都是通过`RealCall.java`发出的，那么我们可以hook此类拿到`request`和`response`,
也可以缓存下来每一个请求的`call`对象，进行再次请求，所以选择了此处进行hook。

#### 抓取打印的样例

>  一次性请求太多会出现打印错乱现象，由于自己太菜，暂时没有解决这个问题,希望求得大佬指点,万分感谢!!!

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
 
~~~~~~~~~~~~~~~Start Find~~~~~~~~~~~~~~~~~~~~~~~~

var Cls_Call = "okhttp3.O00000oO";
var Cls_CallBack = "okhttp3.O00000oo";
var Cls_Interceptor = "okhttp3.O0000oOo";
var Cls_OkHttpClient = "okhttp3.O0000ooO";
var Cls_OkHttpClient$Builder = "okhttp3.O0000ooO$O00000Oo";
var Cls_Request = "okhttp3.O00oOooO";
var Cls_Response = "okhttp3.O000O00o";
var Cls_ResponseBody = "okhttp3.O000O0OO";
var Cls_okio_Buffer = "okio.O00000o0";
var F_Builder_interceptors = "O00000oO";
var F_Client_interceptors = "O0000Oo";
var M_Builder_build = "O000000o";
var M_CallBack_onResponse = "O000000o";
var M_Call_enqueue = "O000000o";
var M_Call_execute = "execute";
var M_Call_request = "O0000oO";
var M_Client_newCall = "O000000o";
var M_Interceptor_intercept = "intercept";
var M_buffer_readByteArray = "O0000ooO";
var M_chain_connection = "O00000o0";
var M_chain_proceed = "O000000o";
var M_chain_request = "O0000oO";
var M_connection_protocol = "O000000o";
var M_contentType_charset = "O000000o";
var M_header_get = "O000000o";
var M_header_name = "O000000o";
var M_header_size = "O00000Oo";
var M_header_value = "O00000Oo";
var M_req_body = "O000000o";
var M_req_headers = "O00000o0";
var M_req_method = "O00000oO";
var M_req_newBuilder = "O00000oo";
var M_req_url = "O0000OOo";
var M_reqbody_contentLength = "contentLength";
var M_reqbody_contentType = "contentType";
var M_reqbody_writeTo = "writeTo";
var M_rsp$builder_body = "O000000o";
var M_rsp$builder_build = "O000000o";
var M_rspBody_contentLength = "contentLength";
var M_rspBody_contentType = "contentType";
var M_rspBody_create = "create";
var M_rspBody_source = "source";
var M_rspBody_string = "string";
var M_rsp_body = "O000000o";
var M_rsp_code = "O00000o0";
var M_rsp_headers = "O00000oO";
var M_rsp_message = "O0000O0o";
var M_rsp_newBuilder = "O0000Oo0";
var M_rsp_request = "O0000o00";
var M_source_request = "request";

~~~~~~~~~~~~~~~~Find Complete!~~~~~~~~~~~~~~~~~~~~~~
```
