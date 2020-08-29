/**
使用说明
首先将 okhttpfind.dex 拷贝到 /mnt/sdcard/ 目录下，然后给目标App授予存储权限；
例：frida -U com.example.demo -l okhttp_poker.js
接下来使用okhttp的所有请求将被拦截并打印出来；
扩展函数：
    history()   //会打印出所有的被抓到的请求信息
	resend(index)   //重新发送请求 例子： resend(0) 重新发送第一个请求
		
	
如果项目被混淆，那么可以使用okhttp_find.js打印出okhttp被混淆后的关键函数名称，然后替换已声明的内容即可。
例：frida -U com.example.demo -l okhttp_find.js

备注 ： okhtpfind.dex 内包含了 更改了包名的okio以及Gson，以及Java写的寻找okhttp特征的代码。

原理：由于所有使用的okhttp框架的App发出的请求都是通过RealCall.java发出的，那么我们可以hook此类拿到request和response,
也可以缓存下来每一个请求的call对象，进行再次请求，所以选择了此处进行hook。
						
*/




var Cls_OkHttpClient = "okhttp3.OkHttpClient";
var M_req_body = "body";
var M_reqbody_contentLength = "contentLength";
var M_reqbody_contentType = "contentType";
var M_contentType_charset = "charset";
var M_reqbody_writeTo = "writeTo";
var M_req_headers = "headers";
var M_header_get = "get";
var M_header_name = "name";
var M_header_size = "size";
var M_header_value = "value";
var M_req_method = "method";
var M_req_url = "url";
var M_rsp$builder_body = "body";
var M_rsp$builder_build = "build";
var M_rsp_body = "body";
var Cls_ResponseBody = "okhttp3.ResponseBody";
var M_rspBody_create = "create";
var M_rspBody_contentLength = "contentLength";
var M_rspBody_contentType = "contentType";
var M_rspBody_source = "source";
var M_rsp_code = "code";
var M_rsp_headers = "headers";
var M_rsp_message = "message";
var M_rsp_newBuilder = "newBuilder";
var M_rsp_request = "request";

var Cls_okio_Buffer = "okio.Buffer";
var M_buffer_readByteArray = "readByteArray";


//----------------------------------

var requestClazz = null;

var Call_requestMethodName = ""
var Call_executeMethodName = ""

var CallCache = []


function hookRealCall(realCallClassName,requestClassName){

    Java.perform(function(){

        var Modifier = Java.use("java.lang.reflect.Modifier")

        // console.log("RealCallClassName : " + realCallClassName)

        var executeMethodName = ""
        var enqueueMethodName = ""

        var RealCallClazz = Java.use(realCallClassName)
        var callMethodArray = RealCallClazz.class.getDeclaredMethods()
        for(var i = 0;i<callMethodArray.length;i++){
            var method = callMethodArray[i]
            method.setAccessible(true)

            if(method.toGenericString().indexOf("Exception") != -1
                && method.getParameterCount() == 0
                && Modifier.isFinal(method.getReturnType().getModifiers())
            ){

                if("" == executeMethodName){
                    executeMethodName = method.getName();
                    Call_executeMethodName = executeMethodName;
                    // console.log("find >> call execute : ",executeMethodName)
                }
            }

            if(method.getParameterCount() == 1 && method.getParameterTypes()[0].isInterface()){

                enqueueMethodName = method.getName();

                // console.log("find >> call enqueue : ",enqueueMethodName)

            }

            if(requestClassName == method.getReturnType().getName() 
                && method.getParameterCount() == 0
            ){
                Call_requestMethodName = method.getName()
            }

        }

        RealCallClazz[executeMethodName].overload().implementation = function(){

            var response = this[executeMethodName]()

            var newResponse = findRequestAndPrint(response)

            return newResponse;


        }
        RealCallClazz[enqueueMethodName].implementation = function(callback){

            var callbackClassName = callback.$className

            var RealCallBack = Java.use(callbackClassName)

            var onResponseMethodName = ""

            var methodArray = RealCallBack.class.getDeclaredMethods()
            for(var i=0;i<methodArray.length;i++){
                var method = methodArray[i]
                method.setAccessible(true)
                
                if(method.toGenericString().indexOf("IOException") != -1 
                    && method.getParameterCount() == 2
                    && Modifier.isFinal(method.getParameterTypes()[1].getModifiers())
                ){
                    onResponseMethodName = method.getName()
                    // console.log("find >> onResponseMethodName : ",onResponseMethodName)
                }
            }
            
            RealCallBack[onResponseMethodName].implementation = function(call,response){

                var newResponse = findRequestAndPrint(response)

                this[onResponseMethodName](call,newResponse)

            }
        }

    })

}


function findRequestAndPrint(responseObject){

    var newResponse = null;

    Java.perform(function(){
        try {
            
            var ResponseClazz = Java.use(responseObject.$className);
            var requestMethodName = ""
            var methodArray = ResponseClazz.class.getDeclaredMethods()
            for(var i = 0;i<methodArray.length;i++){
                var method = methodArray[i]
                method.setAccessible(true)

                if(method.getReturnType().getName() == requestClazz.getName()){

                    requestMethodName = method.getName()
                    // console.log("find >> requestMethodName : ",requestMethodName)

                }
            }

            var request = responseObject[requestMethodName]()

            console.log("");
            console.log("┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");

            printerRequest(request)
            newResponse =  printerResponse(responseObject)

            console.log("└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");
            console.log("");
        } catch (error) {
            console.log("findRequestAndPrint ERROR : "+error);
        }
    })

    return newResponse;
}



function printerRequest(request){
    var javaString = Java.use("java.lang.String")
    var BufferClsss = Java.use(Cls_okio_Buffer)
    var Charset = Java.use("java.nio.charset.Charset")
    var defChatset = Charset.forName("UTF-8")

    var httpUrl = request[M_req_url]()

    console.log("| URL: "+httpUrl)
    console.log("|")
    console.log("| Method: "+request[M_req_method]())
    console.log("|")

    var requestBody = request[M_req_body]();
    var hasRequestBody = true
    if(null == requestBody){
        hasRequestBody = false
    }
    var requestHeaders = request[M_req_headers]()
    var headersSize = requestHeaders[M_header_size]()

    console.log("| Headers:")
    if(hasRequestBody){
        var contentType = requestBody[M_reqbody_contentType]()
        if(null != contentType){
            console.log("|   ┌─"+"Content-Type: " + contentType)
        }
        var contentLength = requestBody[M_reqbody_contentLength]()
        if(contentLength != -1){
            var tag = headersSize == 0 ? "└─" : "┌─"
            console.log("|   "+tag+"Content-Length: "+contentLength)
        }
    }
    for(var i=0;i<headersSize;i++){
        var name = requestHeaders[M_header_name](i)
        if(!javaString.$new("Content-Type").equalsIgnoreCase(name) && !javaString.$new("Content-Length").equalsIgnoreCase(name)){
            var value = requestHeaders[M_header_value](i)
            var tag = i==(headersSize-1) ? "└─" : "┌─"
            console.log("|   "+tag+name + ": "+value)
        }
    }
    console.log("|");
    if(!hasRequestBody){
        console.log("|"+"--> END ");
    }else if(bodyEncoded(requestHeaders)){
        console.log("|"+"--> END  (encoded body omitted > bodyEncoded)");
    }else {
        console.log("| Body:")
        var buffer = BufferClsss.$new()
        requestBody[M_reqbody_writeTo](buffer)
        var reqByteString = getByteString(buffer)

        var charset = defChatset
        var contentType = requestBody[M_reqbody_contentType]()
        if(null != contentType){
            var appcharset = contentType[M_contentType_charset]();
            if(null != appcharset){
                charset = appcharset;
            }
        }
        if(isPlaintext(reqByteString)){
            console.log(splitLine(readBufferString(reqByteString,charset),"|   "))
            console.log("|");
            console.log("|"+"--> END ")
        }else{
            console.log(splitLine("Base64["+reqByteString.base64()+"]","|   "))
            console.log("|");
            console.log("|"+"--> END  (binary body omitted -> isPlaintext)")
        }
    }
    console.log("|");
}


function printerResponse(response){

    var newResponse = null;
    var Charset = Java.use("java.nio.charset.Charset")
    var defChatset = Charset.forName("UTF-8")
    //response.code() + ' ' + response.message() + ' ' + response.request().url()

    console.log("| URL: "+response[M_rsp_request]()[M_req_url]())
    console.log("|")
    console.log("| Status Code: "+response[M_rsp_code]()+" / "+response[M_rsp_message]())
    console.log("|")
    var responseBody = response[M_rsp_body]()
    var contentLength = responseBody[M_rspBody_contentLength]()
    var resp_headers = response[M_rsp_headers]()
    var respHeaderSize = resp_headers[M_header_size]()
    console.log("| Headers:")
    for (var i = 0; i < respHeaderSize;i++) {
        var tag = i==(respHeaderSize-1) ? "└─" : "┌─"
        console.log("|   "+tag+resp_headers[M_header_name](i)+": "+resp_headers[M_header_value](i))
    }

    var content = "";
    var nobody = !hasBody(response)
    if(nobody){
        console.log("| No Body : ",response)
        console.log("|"+"<-- END HTTP")
    }else if(bodyEncoded(resp_headers)){
        console.log("|"+"<-- END HTTP (encoded body omitted)")
    }else{
        console.log("| ");
        console.log("| Body:")
        var source = responseBody[M_rspBody_source]()
        var rspByteString = getByteString(source)
        var charset = defChatset
        var contentType = responseBody[M_rspBody_contentType]()
        if(null != contentType){
            var appcharset = contentType[M_contentType_charset]()
            if(null != appcharset){
                charset = appcharset
            }
        }
        var mediaType = responseBody[M_rspBody_contentType]()
        var class_responseBody = Java.use(Cls_ResponseBody)
        var newBody = class_responseBody[M_rspBody_create](mediaType, rspByteString.toByteArray())
        var newBuilder = response[M_rsp_newBuilder]()
        newResponse = newBuilder[M_rsp$builder_body](newBody)[M_rsp$builder_build]()    
        

        if(!isPlaintext(rspByteString)){
            console.log("|"+"<-- END HTTP (binary body omitted)");
        }
        if (contentLength != 0) {
            try {
                var content = readBufferString(rspByteString, charset)
                console.log(splitLine(content,"|   "))
            } catch (error) {
                console.log(splitLine("Base64["+rspByteString.base64()+"]","|   "))
            }
            
            console.log("| ");
        }
        console.log("|"+"<-- END HTTP");
    }

    
    return newResponse;
}


function bodyEncoded(headers){
    if(null == headers) return false;
    var javaString = Java.use("java.lang.String")
    var contentEncoding = headers[M_header_get]("Content-Encoding")
    return contentEncoding != null && !javaString.$new("identity").equalsIgnoreCase(contentEncoding)

}


function hasBody(response){
    var javaString = Java.use("java.lang.String")
    var m = response[M_rsp_request]()[M_req_method]();
    if(javaString.$new("HEAD").equals(m)){
        return false;
    }
    var Transfer_Encoding = "";
    var resp_headers = response[M_rsp_headers]()
    var respHeaderSize = resp_headers[M_header_size]()
    for (var i = 0; i < respHeaderSize;i++) {
         if(javaString.$new("Transfer-Encoding").equals(resp_headers[M_header_name](i))){
            Transfer_Encoding = resp_headers[M_header_value](i);
            break
         }
    }
    var code = response[M_rsp_code]()
    if(((code >= 100 && code < 200) || code == 204 || code == 304) 
        && response[M_rspBody_contentLength] == -1 
        && !javaString.$new("chunked").equalsIgnoreCase(Transfer_Encoding)
    ){
        return false;
    }
    return true;
}



function isPlaintext(byteString){
    try {
        var bufferSize = byteString.size()
        var buffer = NewBuffer(byteString)

        for (var i = 0; i < 16; i++) {
            if(bufferSize == 0){
                console.log("bufferSize == 0")
                break
            }
            var codePoint = buffer.readUtf8CodePoint()
            var Character = Java.use("java.lang.Character")
            if(Character.isISOControl(codePoint) && !Character.isWhitespace(codePoint)){
                return false;
            }
        }
        return true;
    } catch (error) {
        // console.log(error)
        // console.log(Java.use("android.util.Log").getStackTraceString(error))
        return false;
    }
    
}


function getByteString(buffer){
    var bytearray = buffer[M_buffer_readByteArray]();
    var byteString = Java.use("com.singleman.okio.ByteString").of(bytearray)
    return byteString;
}

function NewBuffer(byteString){
    var bufferCls = Java.use("com.singleman.okio.Buffer");
    var buffer = bufferCls.$new()
    byteString.write(buffer)
    return buffer;
}


function readBufferString(byteString, chatset){
    var byteArray = byteString.toByteArray();
    var str = Java.use("java.lang.String").$new(byteArray,chatset)
    return str;
}

function splitLine(string,tag){
    var newSB = Java.use("java.lang.StringBuilder").$new()
    var newString = Java.use("java.lang.String").$new(string)
    var lineNum = Math.ceil(newString.length()/100)
    for(var i = 0;i<lineNum;i++){
        var start = i*100;
        var end = (i+1)*100
        newSB.append(tag)
        if(end > newString.length()){
            newSB.append(newString.substring(start,newString.length()))
        }else{
            newSB.append(newString.substring(start,end))
        }
        newSB.append("\n")
    }
    return newSB.deleteCharAt(newSB.length()-1).toString()
}

/**
 * not use
 */
function findClassLoader(){
    Java.perform(function(){
        Java.enumerateClassLoaders({

            onMatch:function(loader){
                // console.log("loader : "+loader)
                try {
                    if(loader.findClass(Cls_OkHttpClient)){
                        Java.classFactory.loader = loader
                        console.log("")
                        console.log("Change ClassLoader Success !")
                        console.log("")
                    }
                } catch (error) {
                    // console.log(error)
                }

            },
            onComplete:function(){
                console.log("")
                console.log("CenumerateClassLoaders onComplete !")
                console.log("")
            }

        })

    })
}

/**
* print request history
*/
function history(){
    Java.perform(function(){
        try {
            console.log("")
            console.log("History Size : "+CallCache.length)
            for(var i=0;i<CallCache.length;i++){
                var call = CallCache[i]
                if("" != Call_requestMethodName){
                    console.log("History index["+i+"]"+" >> "+call[Call_requestMethodName]())
                }else{
                    console.log("History index["+i+"]")
                }
                
            }
            console.log("")
        } catch (error) {
            console.log(error)
        }
    })
}

/**
* resend request
*/
function resend(index){

    Java.perform(function(){

        try {
            console.log("resend >> "+index)
            var call = CallCache[index]
            if("" != Call_executeMethodName){
                call[Call_executeMethodName]()
            }else{
                console.log("Call_executeMethodName = null")
            }
            

        } catch (error) {
            console.log("Error : "+ error)
        }
    })

}


/**
 * Enter
 */
function findPokerEnter(){
    Java.perform(function(){
        //
        //findClassLoader()

        Java.openClassFile("/mnt/sdcard/okhttpfind.dex").load()

        var OkHttpClient = Java.use(Cls_OkHttpClient)

        var newCallMethodName = ""

        var okMethodArray = OkHttpClient.class.getDeclaredMethods()
        for(var i = 0;i<okMethodArray.length;i++){
            var method = okMethodArray[i]
            method.setAccessible(true)

            if(method.getParameterCount() == 1 && method.getReturnType().isInterface()){

                newCallMethodName = method.getName();

                // var returnClazz = method.getReturnType()

                requestClazz = method.getParameterTypes()[0]

                // console.log("find >> newCall : ",newCallMethodName)
                // console.log("find >> newCall(params) : ",requestClazz.getName())

            }
        }

        OkHttpClient[newCallMethodName].implementation = function(request){

            var call = this[newCallMethodName](request)

            var cloneCall = call.clone();

            CallCache.push(cloneCall)

            var realCallClassName = call.$className

            console.log(" >>> : "+realCallClassName)

            hookRealCall(realCallClassName,request.$className)

            console.log("-------------------------------------HOOK SUCCESS--------------------------------------------------")

            return call;
        }

    })
}


setImmediate(findPokerEnter)