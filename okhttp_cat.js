/*

放弃维护了


 此实现是通过添加Interceptor的方法进行的打印okhttp日志，
 动态代理创建Interceptor的实现类对象，添加到OkhttpClient的interceptors中
 主要实现过程和之前写的Xposed实现的okhttp的Interceptor同一流程
 
    https://github.com/siyujie/OkHttpLoggerInterceptor-hook
 
*/
/*
var Cls_OkHttpClient = "okhttp3.OkHttpClient";
var F_Client_interceptors = "interceptors";
var Cls_OkHttpClient$Builder = "okhttp3.OkHttpClient$Builder";
var M_Builder_build = "build";
var F_Builder_interceptors = "interceptors";
var Cls_Interceptor = "okhttp3.Interceptor";
var M_Interceptor_intercept = "intercept";
var M_chain_connection = "connection";
var M_connection_protocol = "protocol";
var M_chain_proceed = "proceed";
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
var M_req_newBuilder = "newBuilder";
var M_req_url = "url";
var M_rsp$builder_body = "body";
var M_rsp$builder_build = "build";
var M_rsp_body = "body";
var Cls_ResponseBody = "okhttp3.ResponseBody";
var M_rspBody_create = "create";
var M_rspBody_contentLength = "contentLength";
var M_rspBody_contentType = "contentType";
var M_rspBody_source = "source";
var M_source_request = "request";
var M_rspBody_string = "string";
var M_rsp_code = "code";
var M_rsp_headers = "headers";
var M_rsp_message = "message";
var M_rsp_newBuilder = "newBuilder";
var M_rsp_request = "request";
var M_rsp_headers = "trailers";
var M_chain_request = "request";

var Cls_okio_Buffer = "okio.Buffer";
var M_buffer_readByteArray = "readByteArray";
var M_buffer_readUtf8CodePoint = "readUtf8CodePoint";



function newInterceptor(InterceptorImplName){

    var loggerInterceptor = null;

    Java.perform(function(){


        var classLoader = Java.classFactory.loader

        var javaString = Java.use("java.lang.String")
        var Charset = Java.use("java.nio.charset.Charset")
        var defChatset = Charset.forName("UTF-8")

        var interceptor = Java.use(InterceptorImplName);
        var Proxy = Java.use("java.lang.reflect.Proxy");
        var interfaces = interceptor.class.getInterfaces()

        var InvocationHandler = Java.use("java.lang.reflect.InvocationHandler");

        var mInvocationHandler = Java.registerClass({
            name:"okhttp.MyInvocationHandler",
            implements:[InvocationHandler],
            methods:{
                //public Object invoke(Object proxy, Method method, Object[] args)
                invoke: function(param_obj,param_method,param_arg){
                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Invoke     .....")
                    if(param_method.getName() == M_Interceptor_intercept){
                        
                        try {
                            
                            var chain = getWrapper(param_arg[0]);

                            var request = chain[M_chain_request]()
                            var requestBody = request[M_req_body]();
                            var hasRequestBody = true
                            if(null == requestBody){
                                hasRequestBody = false
                            }
                            var connection = chain[M_chain_connection]()

                            var protocol = "http/1.1"
                            if(null != connection){
                                protocol = connection[M_connection_protocol]()
                            }

                            var httpUrl = request[M_req_url]()

                            console.log("");
                            console.log("┌─────────────────────────────────────────────────────────────────────────────────────");

                            var requestStartMessage = "--->"+request[M_req_method]()+" "+httpUrl+" "+protocol
                            if(hasRequestBody){
                                requestStartMessage += "("+requestBody[M_reqbody_contentLength]()+"-byte body)"
                            }
                            console.log("| "+requestStartMessage)

                            if(hasRequestBody){
                                var contentType = requestBody[M_reqbody_contentType]()
                                if(null != contentType){
                                    console.log("| "+"Content-Type: " + contentType)
                                }
                                var contentLength = requestBody[M_reqbody_contentLength]()
                                if(contentLength != -1){
                                    console.log("| "+"Content-Length: "+contentLength)
                                }
                            }
                            var requestHeaders = request[M_req_headers]()
                            var headersSize = requestHeaders[M_header_size]()
                            console.log("| headersSize : "+headersSize)
                            for(var i=0;i<headersSize;i++){
                                var name = requestHeaders[M_header_name](i)
                                if(!javaString.$new("Content-Type").equalsIgnoreCase(name) && !javaString.$new("Content-Length").equalsIgnoreCase(name)){
                                    var value = requestHeaders[M_header_value](i)
                                    console.log("| "+name + ": "+value)
                                }
                            }
                            if(!hasRequestBody){
                                console.log("|"+"--> END " + request[M_req_method]());
                            }else if(bodyEncoded(requestHeaders)){
                                console.log("|"+"--> END " + request[M_req_method]() + " (encoded body omitted)");
                            }else {
                                var BufferCls = Java.use(Cls_okio_Buffer)
                                var buffer = BufferCls.$new()
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
                                console.log("|")
                                if(isPlaintext(reqByteString)){
                                    console.log("|"+readBufferString(reqByteString,charset))
                                    console.log("|"+"--> END "+request[M_req_method]()+" ("+requestBody[M_reqbody_contentLength]()+"-byte body)")
                                }else{
                                    console.log("|"+"--> END "+request[M_req_method]()+"  (binary "+requestBody[M_reqbody_contentLength]()+"-byte body omitted)")
                                }
                            }
                            var startNs = new Date().getTime()

                            var response = null;
                            try {
                                response = chain[M_chain_proceed](request)
                            } catch (error) {
                                console.log("M_chain_proceed error : "+ error)
                            }

                            if(null == response){
                                console.log("| <-- HTTP FAILED")
                                return param_method.invoke(param_obj,param_arg)
                            }

                            var tookMs = new Date().getTime() - startNs
                            var responseBody = response[M_rsp_body]()
                            // console.log("responseBody : "+responseBody)
                            var contentLength = responseBody[M_rspBody_contentLength]()
                            // console.log("contentLength : "+contentLength)
                            var bodySize = contentLength != -1 ? contentLength + "-byte" : "unknown-length";
                        
                            console.log("|<---"+response[M_rsp_code]()+"  "+ response[M_rsp_message]()+"  "+
                                        response[M_rsp_request]()[M_req_url]()+
                                        " (" + tookMs + "ms ," +  bodySize + " body"+")"
                                        )

                            var resp_headers = response[M_rsp_headers]()
                            var respHeaderSize = resp_headers[M_header_size]()
                            for (var i = 0; i < respHeaderSize;i++) {
                                console.log("| "+resp_headers[M_header_name](i)+": "+resp_headers[M_header_value](i))
                            }
                            var hasbody = !hasBody(response)
                            // console.log("hasbody : ",hasbody)
                            if(hasbody){
                                console.log("| No Body : ",response)
                                console.log("|"+"<-- END HTTP")
                            }else if(bodyEncoded(resp_headers)){
                                console.log("|"+"<-- END HTTP (encoded body omitted)")
                            }else{
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
                                if(!isPlaintext(rspByteString)){
                                    console.log("| ");
                                    console.log("|"+"<-- END HTTP (binary " + rspByteString.size() + "-byte body omitted)");
                                    return param_method.invoke(param_obj,param_arg);
                                }
                                
                                if (contentLength != 0) {
                                    console.log("| "+response)
                                    console.log("| "+JSON.stringify(JSON.parse(readBufferString(rspByteString, charset)), null, 4));
                                    console.log("| ");
                                }
                                console.log("|"+"<-- END HTTP (" +  rspByteString.size() + "-byte body)");

                            }
                            console.log("└───────────────────────────────────────────────────────────────────────────────────────");
                            console.log("");
                            var content = responseBody[M_rspBody_string]()
                            var mediaType = responseBody[M_rspBody_contentType]()
                            var class_responseBody = Java.use(Cls_ResponseBody)
                            var newBody = class_responseBody[M_rspBody_create](mediaType, content)
                            var newBuilder = response[M_rsp_newBuilder]()
                            return newBuilder[M_rsp$builder_body](newBody)[M_rsp$builder_build]()
                        } catch (error) {
                            console.log("Error MyInvocationHandler : ",error)
                        }

                    }else{
                        // console.log(">>>>>>>>>>>>error ");
                    }
                    return param_method.invoke(param_obj,param_arg);
                }
            }

        })
        
        loggerInterceptor = Proxy.newProxyInstance(classLoader,interfaces,mInvocationHandler.$new())
        
    })

    return loggerInterceptor;
}


function getWrapper(handle){
    var chooseInstance = null;
    Java.choose(handle.getClass().getName(),{

        onMatch:function(instance){
            if(instance.hashCode() == handle.hashCode()){
                chooseInstance = instance
            }
        },
        onComplete : function(){
            // console.log("invokeMethod choose complete")
        }
    })
    return chooseInstance;
}

function bodyEncoded(headers){
    if(null == headers) return false;
    var javaString = Java.use("java.lang.String")
    var contentEncoding = headers[M_header_get]("Content-Encoding")
    return contentEncoding != null && !contentEncoding.equalsIgnoreCase(javaString.$new("identity"))

}


function hasBody(response){
    var javaString = Java.use("java.lang.String")
    var m = response[M_rsp_request]()[M_req_method]();
    // console.log(" >>>> hasBody   mmmm : ",m)
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
    // console.log(" >>>> hasBody   Transfer_Encoding : ",Transfer_Encoding)
    var code = response[M_rsp_code]()
    // console.log(" >>>> hasBody  code : ",code)
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
        // console.log(" isPlaintext >  bufferSize >>> "+ bufferSize)
        
        var buffer = NewBuffer(byteString)

        for (var i = 0; i < 16; i++) {
            if(bufferSize == 0){
                break
            }
            var codePoint = buffer.readUtf8CodePoint()
            // console.log(" isPlaintext >  codePoint >>> "+ codePoint)
            var Character = Java.use("java.lang.Character")
            //console.log(" isPlaintext  ???? "+(Character.isISOControl(codePoint) && !Character.isWhitespace(codePoint)))
            if(Character.isISOControl(codePoint) && !Character.isWhitespace(codePoint)){
                return false;
            }
        }
        return true;
    } catch (error) {
        // return false;
        return true;
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

function findClassLoader(){
    Java.perform(function(){
        Java.enumerateClassLoaders({

            onMatch:function(loader){
                // console.log("loader : "+loader)
                try {
                    if(loader.findClass(Cls_OkHttpClient$Builder)){
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



function hookbychoose(){

    Java.perform(function(){

        var okhttpDex = Java.openClassFile("/mnt/sdcard/okhttpfind.dex").load()

        Java.choose(Cls_OkHttpClient,{
            onMatch:function(instance){

                try {

                    var interceptorsF = instance.class.getDeclaredField(F_Client_interceptors)
                    interceptorsF.setAccessible(true)
                    var interceptors = interceptorsF.get(instance)
    
                    var newInterceptors = Java.use("java.util.ArrayList").$new()
                    if(null != interceptors){
                        newInterceptors.addAll(interceptors)
                    }
                    if(newInterceptors.size() > 0){
                        var interImplClassName = newInterceptors.get(0).getClass().getName()
                        console.log("already Interceptor : "+interImplClassName)
                        var proxyObj = newInterceptor(interImplClassName);
                        newInterceptors.add(proxyObj)
                        console.log("")
                        console.log("Add Interceptor Success !! ")
                        console.log("")
                    }
                    instance[F_Client_interceptors].value = newInterceptors
    
                } catch (error) {
                    
                    console.log("Error : "+ error)
    
                }

            },
            onComplete : function(){
            }
        })
        
    })

}



function hookbyuse(){

    Java.perform(function(){

        var okhttpDex = Java.openClassFile("/mnt/sdcard/okhttpfind.dex").load()

        Java.use(Cls_OkHttpClient$Builder)[M_Builder_build].overload().implementation = function(){
            try {

                var interceptorsF = this.class.getDeclaredField(F_Builder_interceptors)
                interceptorsF.setAccessible(true)
                var interceptors = interceptorsF.get(this)

                var newInterceptors = Java.use("java.util.ArrayList").$new()
                if(null != interceptors){
                    newInterceptors.addAll(interceptors)
                }
                if(newInterceptors.size() > 0){
                    // var interImplClassName = newInterceptors.get(0).getClass().getName()
                    // console.log("already Interceptor : "+interImplClassName)
                    // var proxyObj = newInterceptor(interImplClassName);
                    var proxyObj = newInterceptor("com.xingin.xhs.model.b.a");
                    newInterceptors.add(proxyObj)
                    console.log("Add Interceptor Success !! ")
                }else{
                    var proxyObj = newInterceptor("com.xingin.xhs.model.b.a");
                    newInterceptors.add(proxyObj)
                    console.log("....Add Interceptor Success !! ")
                }
                this[F_Builder_interceptors].value = newInterceptors

            } catch (error) {
                
                console.log("Error : "+ error)

            }

            return this[M_Builder_build]()
        }

    })

}

// setImmediate(hookbychoose)
setImmediate(hookbyuse)
*/