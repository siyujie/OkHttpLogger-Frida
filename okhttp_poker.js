/**
使用说明
首先将 okhttpfind.dex 拷贝到 /data/local/tmp/ 目录下，然后给目标App授予存储权限；
例：frida -U -l okhttp_poker.js -f com.example.demo --no-pause
接下来使用okhttp的所有请求将被拦截并打印出来；
扩展函数：
	find()                                         检查是否使用了Okhttp & 是否可能被混淆 & 寻找okhttp3关键类及函数
	switchLoader(\"okhttp3.OkHttpClient\")         参数：静态分析到的okhttpclient类名
	hold()                                         开启HOOK拦截
	history()                                      打印可重新发送的请求				
	resend(index)                                  重新发送请求		
		
	

备注 ： okhtpfind.dex 内包含了 更改了包名的okio以及Gson，以及Java写的寻找okhttp特征的代码。

原理：由于所有使用的okhttp框架的App发出的请求都是通过RealCall.java发出的，那么我们可以hook此类拿到request和response,
也可以缓存下来每一个请求的call对象，进行再次请求，所以选择了此处进行hook。
							
*/
var Cls_Call = "okhttp3.Call";
var Cls_CallBack = "okhttp3.Callback";
var Cls_OkHttpClient = "okhttp3.OkHttpClient";
var Cls_Request = "okhttp3.Request";
var Cls_Response = "okhttp3.Response";
var Cls_ResponseBody = "okhttp3.ResponseBody";
var Cls_okio_Buffer = "okio.Buffer";
var F_header_namesAndValues = "namesAndValues";
var F_req_body = "body";
var F_req_headers = "headers";
var F_req_method = "method";
var F_req_url = "url";
var F_rsp$builder_body = "body";
var F_rsp_body = "body";
var F_rsp_code = "code";
var F_rsp_headers = "headers";
var F_rsp_message = "message";
var F_rsp_request = "request";
var M_CallBack_onFailure = "onFailure";
var M_CallBack_onResponse = "onResponse";
var M_Call_enqueue = "enqueue";
var M_Call_execute = "execute";
var M_Call_request = "request";
var M_Client_newCall = "newCall";
var M_buffer_readByteArray = "readByteArray";
var M_contentType_charset = "charset";
var M_reqbody_contentLength = "contentLength";
var M_reqbody_contentType = "contentType";
var M_reqbody_writeTo = "writeTo";
var M_rsp$builder_build = "build";
var M_rspBody_contentLength = "contentLength";
var M_rspBody_contentType = "contentType";
var M_rspBody_create = "create";
var M_rspBody_source = "source";
var M_rsp_newBuilder = "newBuilder";


//----------------------------------
var JavaStringWapper = null;
var JavaIntegerWapper = null;
var JavaStringBufferWapper = null;
var GsonWapper = null;
var ListWapper = null;
var ArrayListWapper = null;
var ArraysWapper = null;
var CharsetWapper = null;
var CharacterWapper = null;

var OkioByteStrngWapper = null;
var OkioBufferWapper = null;

var OkHttpClientWapper = null;
var ResponseBodyWapper = null;
var BufferWapper = null;
//----------------------------------
var CallCache = []
var hookedArray = []
var filterArray = ["jpg", "png", "webp", "jpeg", "gif", ".data"]


function buildNewResponse(responseObject) {
    var newResponse = null;
    Java.perform(function () {
        try {
            var logString = JavaStringBufferWapper.$new()

            logString.append("").append("\n");
            logString.append("┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────").append("\n");

            newResponse = printAll(responseObject, logString)

            logString.append("└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────").append("\n");
            logString.append("").append("\n");

            console.log(logString)
        } catch (error) {
            console.log("printAll ERROR : " + error);
        }
    })
    return newResponse;
}


function printAll(responseObject, logString) {
    try {
        var request = getFieldValue(responseObject, F_rsp_request)
        printerRequest(request, logString)
    } catch (error) {
        console.log("print request error : ", error)
        return responseObject;
    }
    var newResponse = printerResponse(responseObject, logString)
    return newResponse;
}


function printerRequest(request, logString) {
    var defChatset = CharsetWapper.forName("UTF-8")
    //URL
    var httpUrl = getFieldValue(request, F_req_url)
    logString.append("| URL: " + httpUrl).append("\n")
    logString.append("|").append("\n")
    logString.append("| Method: " + getFieldValue(request, F_req_method)).append("\n")
    logString.append("|").append("\n")
    var requestBody = getFieldValue(request, F_req_body);
    var hasRequestBody = true
    if (null == requestBody) {
        hasRequestBody = false
    }
    //Headers
    var requestHeaders = getFieldValue(request, F_req_headers)
    var headersList = headersToList(requestHeaders)
    var headersSize = getHeaderSize(headersList)

    logString.append("| Request Headers: ").append("" + headersSize).append("\n")
    if (hasRequestBody) {
        var requestBody = getWrapper(requestBody)
        var contentType = requestBody[M_reqbody_contentType]()
        if (null != contentType) {
            logString.append("|   ┌─" + "Content-Type: " + contentType).append("\n")
        }
        var contentLength = requestBody[M_reqbody_contentLength]()
        if (contentLength != -1) {
            var tag = headersSize == 0 ? "└─" : "┌─"
            logString.append("|   " + tag + "Content-Length: " + contentLength).append("\n")
        }
    }
    if (headersSize == 0) {
        logString.append("|     no headers").append("\n")
    }
    for (var i = 0; i < headersSize; i++) {
        var name = getHeaderName(headersList, i)
        if (!JavaStringWapper.$new("Content-Type").equalsIgnoreCase(name) && !JavaStringWapper.$new("Content-Length").equalsIgnoreCase(name)) {
            var value = getHeaderValue(headersList, i)
            var tag = i == (headersSize - 1) ? "└─" : "┌─"
            logString.append("|   " + tag + name + ": " + value).append("\n")
        }
    }
    var shielded = filterUrl(httpUrl.toString())
    if (shielded) {
        logString.append("|" + "     File Request Body Omit.....").append("\n")
        return;
    }
    logString.append("|").append("\n")
    if (!hasRequestBody) {
        logString.append("|" + "--> END ").append("\n")
    } else if (bodyEncoded(headersList)) {
        logString.append("|" + "--> END  (encoded body omitted > bodyEncoded)").append("\n")
    } else {
        logString.append("| Request Body:").append("\n")
        var buffer = BufferWapper.$new()
        requestBody[M_reqbody_writeTo](buffer)
        var reqByteString = getByteString(buffer)

        var charset = defChatset
        var contentType = requestBody[M_reqbody_contentType]()
        if (null != contentType) {
            var appcharset = contentType[M_contentType_charset](defChatset);
            if (null != appcharset) {
                charset = appcharset;
                // console.log("--------------->"+charset)
            }
        }
        //LOG Request Body
        try {
            if (isPlaintext(reqByteString)) {
                logString.append(splitLine(readBufferString(reqByteString, charset), "|   ")).append("\n")
                logString.append("|").append("\n")
                logString.append("|" + "--> END ").append("\n")
            } else {
                logString.append(splitLine("Base64[" + reqByteString.base64() + "]", "|   ")).append("\n")
                logString.append("|").append("\n");
                logString.append("|" + "--> END  (binary body omitted -> isPlaintext)").append("\n")
            }
        } catch (error) {
            logString.append(splitLine("Base64[" + reqByteString.base64() + "]", "|   ")).append("\n")
            logString.append("|").append("\n");
            logString.append("|" + "--> END  (binary body omitted -> isPlaintext)").append("\n")
        }

    }
    logString.append("|").append("\n");
}


function printerResponse(response, logString) {
    var newResponse = null;
    try {
        var defChatset = CharsetWapper.forName("UTF-8")

        var request = getFieldValue(response, F_rsp_request)
        var url = getFieldValue(request, F_req_url)
        var shielded = filterUrl(url.toString())
        if (shielded) {
            logString.append("|" + "     File Response Body Omit.....").append("\n")
            return response;
        }
        //URL
        logString.append("| URL: " + url).append("\n")
        logString.append("|").append("\n")
        logString.append("| Status Code: " + getFieldValue(response, F_rsp_code) + " / " + getFieldValue(response, F_rsp_message)).append("\n")
        logString.append("|").append("\n")
        var responseBodyObj = getFieldValue(response, F_rsp_body)
        var responseBody = getWrapper(responseBodyObj)
        var contentLength = responseBody[M_rspBody_contentLength]()
        //Headers
        var resp_headers = getFieldValue(response, F_rsp_headers)
        var respHeadersList = headersToList(resp_headers)
        var respHeaderSize = getHeaderSize(respHeadersList)
        logString.append("| Response Headers: ").append("" + respHeaderSize).append("\n")
        if (respHeaderSize == 0) {
            logString.append("|     no headers").append("\n")
        }
        for (var i = 0; i < respHeaderSize; i++) {
            var tag = i == (respHeaderSize - 1) ? "└─" : "┌─"
            logString.append("|   " + tag + getHeaderName(respHeadersList, i) + ": " + getHeaderValue(respHeadersList, i)).append("\n")
        }
        //Body
        var content = "";
        var nobody = !hasBody(response, respHeadersList)
        if (nobody) {
            logString.append("| No Response Body : " + response).append("\n")
            logString.append("|" + "<-- END HTTP").append("\n")
        } else if (bodyEncoded(respHeadersList)) {
            logString.append("|" + "<-- END HTTP (encoded body omitted)").append("\n")
        } else {
            logString.append("| ").append("\n");
            logString.append("| Response Body:").append("\n")
            var source = responseBody[M_rspBody_source]()
            var rspByteString = getByteString(source)
            var charset = defChatset
            var contentType = responseBody[M_rspBody_contentType]()
            if (null != contentType) {
                var appcharset = contentType[M_contentType_charset](defChatset)
                if (null != appcharset) {
                    charset = appcharset
                }
            }
            //newResponse
            var mediaType = responseBody[M_rspBody_contentType]()
            var newBody = null;
            try {
                newBody = ResponseBodyWapper[M_rspBody_create](mediaType, rspByteString.toByteArray())
            } catch (error) {
                newBody = ResponseBodyWapper[M_rspBody_create](mediaType, readBufferString(rspByteString, charset))
            }
            var newBuilder = null;
            if("" == M_rsp_newBuilder){
                var ResponseBuilderClazz = response.class.getDeclaredClasses()[0]
                newBuilder = Java.use(ResponseBuilderClazz.getName()).$new(response)
            }else{
                newBuilder = response[M_rsp_newBuilder]()
            }
            var bodyField = newBuilder.class.getDeclaredField(F_rsp$builder_body)
            bodyField.setAccessible(true)
            bodyField.set(newBuilder, newBody)
            newResponse = newBuilder[M_rsp$builder_build]()

            if (!isPlaintext(rspByteString)) {
                logString.append("|" + "<-- END HTTP (binary body omitted)").append("\n");
            }
            if (contentLength != 0) {
                try {
                    var content = readBufferString(rspByteString, charset)
                    logString.append(splitLine(content, "|   ")).append("\n")
                } catch (error) {
                    logString.append(splitLine("Base64[" + rspByteString.base64() + "]", "|   ")).append("\n")
                }

                logString.append("| ").append("\n");
            }
            logString.append("|" + "<-- END HTTP").append("\n");
        }
    } catch (error) {
        logString.append("print response error : " + error).append("\n")
        if (null == newResponse) {
            return response;
        }
    }
    return newResponse;
}


function getFieldValue(object, fieldName) {
    var field = object.class.getDeclaredField(fieldName);
    field.setAccessible(true)
    var fieldValue = field.get(object)
    if (null == fieldValue) {
        return null;
    }
    var FieldClazz = Java.use(fieldValue.$className)
    var fieldValueWapper = Java.cast(fieldValue, FieldClazz)
    return fieldValueWapper
}


function getWrapper(object) {
    var chooseInstance = null;
    Java.choose(object.getClass().getName(), {
        onMatch: function (instance) {
            if (object.equals(instance)) {
                chooseInstance = instance;
                return
            }
        },
        onComplete: function () {
        }
    })
    return chooseInstance
}

function headersToList(headers) {
    var gson = GsonWapper.$new()
    var namesAndValues = getFieldValue(headers, F_header_namesAndValues)
    var jsonString = gson.toJson(namesAndValues)
    var namesAndValuesList = Java.cast(gson.fromJson(jsonString, ListWapper.class), ListWapper)
    return namesAndValuesList;
}

function getHeaderSize(namesAndValuesList) {
    return namesAndValuesList.size() / 2
}

function getHeaderName(namesAndValuesList, index) {
    return namesAndValuesList.get(index * 2)
}
function getHeaderValue(namesAndValuesList, index) {
    return namesAndValuesList.get((index * 2) + 1)
}

function getByHeader(namesAndValuesList, name) {
    var nameString = JavaStringWapper.$new(name)
    Java.perform(function () {
        var length = namesAndValuesList.size()
        var nameByList = "";
        do {
            length -= 2;
            if (length < 0) {
                return null;
            }
            // console.log("namesAndValuesList: "+namesAndValuesList.$className)
            nameByList = namesAndValuesList.get(JavaIntegerWapper.valueOf(length).intValue())
        } while (!nameString.equalsIgnoreCase(nameByList));
        return namesAndValuesList.get(length + 1);

    })
}


function bodyEncoded(namesAndValuesList) {
    if (null == namesAndValuesList) return false;
    var contentEncoding = getByHeader(namesAndValuesList, "Content-Encoding")
    var bodyEncoded = contentEncoding != null && !JavaStringWapper.$new("identity").equalsIgnoreCase(contentEncoding)
    return bodyEncoded

}


function hasBody(response, namesAndValuesList) {
    var request = getFieldValue(response, F_rsp_request)
    var m = getFieldValue(request, F_req_method);
    if (JavaStringWapper.$new("HEAD").equals(m)) {
        return false;
    }
    var Transfer_Encoding = "";
    var respHeaderSize = getHeaderSize(namesAndValuesList)
    for (var i = 0; i < respHeaderSize; i++) {
        if (JavaStringWapper.$new("Transfer-Encoding").equals(getHeaderName(namesAndValuesList, i))) {
            Transfer_Encoding = getHeaderValue(namesAndValuesList, i);
            break
        }
    }
    var code = getFieldValue(response, F_rsp_code)
    if (((code >= 100 && code < 200) || code == 204 || code == 304)
        && response[M_rspBody_contentLength] == -1
        && !JavaStringWapper.$new("chunked").equalsIgnoreCase(Transfer_Encoding)
    ) {
        return false;
    }
    return true;
}



function isPlaintext(byteString) {
    try {
        var bufferSize = byteString.size()
        var buffer = NewBuffer(byteString)
        for (var i = 0; i < 16; i++) {
            if (bufferSize == 0) {
                console.log("bufferSize == 0")
                break
            }
            var codePoint = buffer.readUtf8CodePoint()
            if (CharacterWapper.isISOControl(codePoint) && !CharacterWapper.isWhitespace(codePoint)) {
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


function getByteString(buffer) {
    var bytearray = buffer[M_buffer_readByteArray]();
    var byteString = OkioByteStrngWapper.of(bytearray)
    return byteString;
}

function NewBuffer(byteString) {
    var buffer = OkioBufferWapper.$new()
    byteString.write(buffer)
    return buffer;
}


function readBufferString(byteString, chatset) {
    var byteArray = byteString.toByteArray();
    var str = JavaStringWapper.$new(byteArray, chatset)
    return str;
}

function splitLine(string, tag) {
    var newSB = JavaStringBufferWapper.$new()
    var newString = JavaStringWapper.$new(string)
    var lineNum = Math.ceil(newString.length() / 150)
    for (var i = 0; i < lineNum; i++) {
        var start = i * 150;
        var end = (i + 1) * 150
        newSB.append(tag)
        if (end > newString.length()) {
            newSB.append(newString.substring(start, newString.length()))
        } else {
            newSB.append(newString.substring(start, end))
        }
        newSB.append("\n")
    }
    var lineStr = newSB.deleteCharAt(newSB.length() - 1).toString()
    return lineStr
}

/**
 * 
 */
function alreadyHook(str) {
    for (var i = 0; i < hookedArray.length; i++) {
        if (str == hookedArray[i]) {
            return true;
        }
    }
    return false;
}

/**
 * 
 */
function filterUrl(url) {
    for (var i = 0; i < filterArray.length; i++) {
        if (url.indexOf(filterArray[i]) != -1) {
            // console.log(url + " ?? " + filterArray[i])
            return true;
        }
    }
    return false;
}

function hookRealCall(realCallClassName) {
    Java.perform(function () {

        console.log(" ...........  hookRealCall  : " + realCallClassName)
        var RealCall = Java.use(realCallClassName)
        if ("" != Cls_CallBack) {
            //异步
            RealCall[M_Call_enqueue].overload(Cls_CallBack).implementation = function (callback) {
                // console.log("-------------------------------------HOOK SUCCESS 异步--------------------------------------------------")
                var interfaceClazz = callback.class;
                var interfaceName = interfaceClazz.getName();
                var interfaceWapper = Java.use(interfaceName);
                var proxyCallback = Java.registerClass({
                    name: "com.proxyCallback",
                    implements: [interfaceWapper],
                    methods: {
                        [M_CallBack_onResponse]: function (call, response) {
                            var newResponse = buildNewResponse(response)
                            var methods = interfaceClazz.getDeclaredMethods();
                            for (var i = 0; i < methods.length; i++) {
                                var method = methods[i]
                                method.setAccessible(true)
                                if (method.getName() == M_CallBack_onResponse) {
                                    method.invoke(callback, [call, newResponse])
                                    break;
                                }
                            }
                        },
                        [M_CallBack_onFailure]: function (call, ex) {
                            var methods = interfaceClazz.getDeclaredMethods();
                            for (var i = 0; i < methods.length; i++) {
                                var method = methods[i]
                                method.setAccessible(true)
                                if (method.getName() == M_CallBack_onFailure) {
                                    method.invoke(callback, [call, ex])
                                    break;
                                }
                            }
                        }
                    }

                })
                this[M_Call_enqueue](proxyCallback.$new())
            }
        }

        //同步  
        RealCall[M_Call_execute].overload().implementation = function () {
            // console.log("-------------------------------------HOOK SUCCESS 同步--------------------------------------------------")
            var response = this[M_Call_execute]()
            var newResponse = buildNewResponse(response)
            return newResponse;
        }
    })

}

/**
 * check className & filter
 */
function checkClass(name) {
    if (name.startsWith("com.")
        || name.startsWith("cn.")
        || name.startsWith("io.")
        || name.startsWith("org.")
        || name.startsWith("android")
        || name.startsWith("kotlin")
        || name.startsWith("[")
        || name.startsWith("java")
        || name.startsWith("sun.")
        || name.startsWith("net.")
        || name.indexOf(".") < 0
        || name.startsWith("dalvik")

    ) {
        return false;
    }
    return true;
}


/**
* print request history
*/
function history() {
    Java.perform(function () {
        try {
            console.log("")
            console.log("History Size : " + CallCache.length)
            for (var i = 0; i < CallCache.length; i++) {
                var call = CallCache[i]
                if ("" != M_Call_request) {
                    console.log("-----> index[" + i + "]" + " >> " + call[M_Call_request]())
                } else {
                    console.log("-----> index[" + i + "]" + "    ????  M_Call_execute = \"\"")
                }
                console.log("")
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
function resend(index) {
    Java.perform(function () {
        try {
            console.log("resend >> " + index)
            var call = CallCache[index]
            if ("" != M_Call_execute) {
                call[M_Call_execute]()
            } else {
                console.log("M_Call_execute = null")
            }
        } catch (error) {
            console.log("Error : " + error)
        }
    })

}



/**
 * 开启HOOK拦截
 */
function hold() {
    Java.perform(function () {
        //Init common
        JavaStringWapper = Java.use("java.lang.String")
        JavaStringBufferWapper = Java.use("java.lang.StringBuilder")
        JavaIntegerWapper = Java.use("java.lang.Integer")
        GsonWapper = Java.use("com.singleman.gson.Gson")
        ListWapper = Java.use("java.util.List")
        ArraysWapper = Java.use("java.util.Arrays")
        ArrayListWapper = Java.use("java.util.ArrayList")
        CharsetWapper = Java.use("java.nio.charset.Charset")
        CharacterWapper = Java.use("java.lang.Character")

        OkioByteStrngWapper = Java.use("com.singleman.okio.ByteString")
        OkioBufferWapper = Java.use("com.singleman.okio.Buffer")

        //Init OKHTTP
        OkHttpClientWapper = Java.use(Cls_OkHttpClient)
        ResponseBodyWapper = Java.use(Cls_ResponseBody)
        BufferWapper = Java.use(Cls_okio_Buffer)

        //Start Hook
        OkHttpClientWapper[M_Client_newCall].overload(Cls_Request).implementation = function (request) {
            var call = this[M_Client_newCall](request)
            try {
                CallCache.push(call["clone"]())
            } catch (error) {
                console.log("not fount clone method!")
            }
            var realCallClassName = call.$className
            if (!alreadyHook(realCallClassName)) {
                hookedArray.push(realCallClassName)
                hookRealCall(realCallClassName)
            }
            return call;
        }
    })
}

function switchLoader(clientName) {
    Java.perform(function () {
        if ("" != clientName) {
            try {
                var clz = Java.classFactory.loader.findClass(clientName)
                console.log("")
                console.log(">>>>>>>>>>>>>  ", clz, "  <<<<<<<<<<<<<<<<")
            } catch (error) {
                console.log(error)
                Java.enumerateClassLoaders({
                    onMatch: function (loader) {
                        try {
                            if (loader.findClass(clientName)) {
                                Java.classFactory.loader = loader
                                console.log("")
                                console.log("Switch ClassLoader To : ", loader)
                                console.log("")
                            }
                        } catch (error) {
                            // console.log(error)
                        }

                    },
                    onComplete: function () {
                        console.log("")
                        console.log("Switch ClassLoader Complete !")
                        console.log("")
                    }

                })
            }
        }
    })
}


/**
 * find & print used location
 */
function find() {
    Java.perform(function () {
        ArraysWapper = Java.use("java.util.Arrays")
        ArrayListWapper = Java.use("java.util.ArrayList")
        var isSupport = false;
        var clz_Protocol = null;
        try {
            var clazzNameList = Java.enumerateLoadedClassesSync()
            if (clazzNameList.length == 0) {
                console.log("ERROR >> [enumerateLoadedClasses] return null !!!!!!")
                return
            }
            for (var i = 0; i < clazzNameList.length; i++) {
                var name = clazzNameList[i]
                if (!checkClass(name)) {
                    continue
                }
                try {
                    var loadedClazz = Java.classFactory.loader.loadClass(name);
                    if (loadedClazz.isEnum()) {
                        var Protocol = Java.use(name);
                        var toString = ArraysWapper.toString(Protocol.values());
                        if (toString.indexOf("http/1.0") != -1
                            && toString.indexOf("http/1.1") != -1
                            && toString.indexOf("spdy/3.1") != -1
                            && toString.indexOf("h2") != -1
                        ) {
                            clz_Protocol = loadedClazz;
                            break;
                        }
                    }
                } catch (error) {
                }
            }
            if (null == clz_Protocol) {
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~ 寻找okhttp特征失败，请确认是否使用okhttp ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
                return
            }

            //enum values >> Not to be confused with!
            var okhttp_pn = clz_Protocol.getPackage().getName();
            var likelyOkHttpClient = okhttp_pn + ".OkHttpClient"
            try {
                var clz_okclient = Java.use(likelyOkHttpClient).class
                if (null != clz_okclient) {
                    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 未 混 淆 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
                    isSupport = true;
                }
            } catch (error) {
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 被 混 淆 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
                isSupport = true;
            }

        } catch (error) {
            console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~未使用okhttp~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
            isSupport = false;
        }

        if (!isSupport) {
            console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~ 寻找okhttp特征失败，请确认是否使用okhttp ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
            return
        }

        var likelyClazzList = ArrayListWapper.$new()
        for (var i = 0; i < clazzNameList.length; i++) {
            var name = clazzNameList[i]
            if (!checkClass(name)) {
                continue
            }
            try {
                var loadedClazz = Java.classFactory.loader.loadClass(name);
                likelyClazzList.add(loadedClazz)
            } catch (error) {
            }
        }

        console.log("likelyClazzList size :" + likelyClazzList.size())
        if (likelyClazzList.size() == 0) {
            console.log("Please make a network request and try again!")
        }

        console.log("")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Start Find~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log("")
        try {
            var OkHttpFinder = Java.use("com.singleman.okhttp.OkHttpFinder")
            OkHttpFinder.getInstance().findClassInit(likelyClazzList)

            console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Find Result~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

            var OkCompatClazz = Java.use("com.singleman.okhttp.OkCompat").class
            var fields = OkCompatClazz.getDeclaredFields();
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i]
                field.setAccessible(true);
                var name = field.getName()
                var value = field.get(null)
                console.log("var " + name + " = \"" + value + "\";")
            }
            console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Find Complete~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

        } catch (error) {
            console.log(error)
            console.log(Java.use("android.util.Log").getStackTraceString(error))
        }

    })
}

/**
 * 
 */
function main() {
    Java.perform(function () {
        Java.openClassFile("/data/local/tmp/okhttpfind.dex").load()
        var version = Java.use("com.singleman.SingleMan").class.getDeclaredField("version").get(null)
        console.log("");
        console.log("------------------------- OkHttp Poker by SingleMan ["+version+"]------------------------------------");
        console.log("API:")
        console.log("   >>>  find()                                         检查是否使用了Okhttp & 是否可能被混淆 & 寻找okhttp3关键类及函数");
        console.log("   >>>  switchLoader(\"okhttp3.OkHttpClient\")           参数：静态分析到的okhttpclient类名");
        console.log("   >>>  hold()                                         开启HOOK拦截");
        console.log("   >>>  history()                                      打印可重新发送的请求");
        console.log("   >>>  resend(index)                                  重新发送请求");
        console.log("----------------------------------------------------------------------------------------");

    })
}

setImmediate(main)
