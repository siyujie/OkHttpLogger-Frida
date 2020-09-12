    /**
     * 抖音的http请求打印小工具  版本 11.0.0 其他版本请自行适配吧，地方也不多
     * 
     *
     */


    var HttpOnly = "com.bytedance.frameworks.baselib.network.http.cronet.impl.b$a"
    var HttpOnlyMethod = "a"
    var HttpRequestClassName = "com.bytedance.retrofit2.client.Request"
    var HttpRequest = "e"

    var fileFilterArray = [".webp",".png",".jpg",".jpeg",".image"]

    function filterUrl(url) {
        for (var i = 0; i < fileFilterArray.length; i++) {
            if (url.indexOf(fileFilterArray[i]) != -1) {
                console.log(url + " ?? " + fileFilterArray[i])
                return true;
            }
        }
        return false;
    }

    function splitLine(string, tag) {
        var lineLength = 150;
        var newSB = Java.use("java.lang.StringBuilder").$new()
        var newString = Java.use("java.lang.String").$new(string)
        var lineNum = Math.ceil(newString.length() / lineLength)
        for (var i = 0; i < lineNum; i++) {
            var start = i * lineLength;
            var end = (i + 1) * lineLength
            newSB.append(tag)
            if (end > newString.length()) {
                newSB.append(newString.substring(start, newString.length()))
            } else {
                newSB.append(newString.substring(start, end))
            }
            newSB.append("\n")
        }
        return newSB.deleteCharAt(newSB.length() - 1).toString()
    }


    function aweme_httpcat() {
        Java.perform(function () {
            Java.openClassFile("/data/local/tmp/okhttpfind.dex").load()

            var JavaString = Java.use("java.lang.String")
            var JavaInteger = Java.use("java.lang.Integer")
            var JavaMap = Java.use("java.util.Map")
            var JavaLinkedTreeMap = Java.use("com.singleman.gson.internal.LinkedTreeMap")
            var ByteString = Java.use("com.singleman.okio.ByteString")
            var ByteArrayOutputStream = Java.use("java.io.ByteArrayOutputStream")
            var JSONObject = Java.use("org.json.JSONObject")

            var gson = Java.use("com.singleman.gson.Gson").$new()

            Java.use(HttpOnly)[HttpOnlyMethod].overload().implementation = function () {
                var response = this[HttpOnlyMethod]()
                var logString = Java.use("java.lang.StringBuffer").$new()
                //Request
                try {
                    var requestField = null
                    var fields = this.class.getDeclaredFields()
                    for(var i=0;i<fields.length;i++){
                        var field = fields[i]
                        field.setAccessible(true);
                        if(JavaString.$new(HttpRequest).equals(field.getName())){
                            requestField = field;
                            break;
                        }
                    }
                    var request = Java.cast(requestField.get(this),Java.use(HttpRequestClassName))
                    var url = request["getUrl"]()

                    logString.append("").append("\n")
                    logString.append("┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────").append("\n").append("\n")

                    //URL
                    logString.append("| URL").append("\n")
                    logString.append(splitLine(url, "|    ")).append("\n")

                    if(filterUrl(url)){
                        logString.append("|  "+"Is File").append("\n")
                        logString.append("└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────").append("\n").append("\n")
                        logString.append("").append("\n").append("\n")
                        console.log(logString)
                        return response; 
                    }
                    //
                    var extraInfo = response["getExtraInfo"]()
                    //Origin Url & HttpMethod
                    var requestLogString = extraInfo.getClass().getField("requestLog").get(extraInfo)
                    if (null != requestLogString) {
                        var jsonObject = JSONObject.$new(requestLogString)
                        var baseJsonObj = jsonObject.getJSONObject("base")
                        var httpMethod = baseJsonObj.getString("method")
                        var originUrl = baseJsonObj.getString("origin_url")
                        logString.append("|  ").append("\n")
                        logString.append("| " + "Method : " + httpMethod + "  originUrl : " + originUrl).append("\n")
                    }
        
                    //Request Headers
                    var requestHeadersString = extraInfo.getClass().getField("requestHeaders").get(extraInfo)
                    logString.append("|  ").append("\n")
                    logString.append("| " + "Request Headers").append("\n")
                    // console.log(splitLine(requestHeadersString, "|    "))
                    var requestHeaderMapObj = gson.fromJson(requestHeadersString,JavaMap.class)
                    var requestHeaderMap = Java.cast(requestHeaderMapObj,JavaLinkedTreeMap)
                    var keyArray = requestHeaderMap.keySet().toArray()
                    for(var i = 0;i<keyArray.length;i++){
                        var key = keyArray[i]
                        var value = requestHeaderMap.get(key)
                        logString.append("|    " + key+":"+value).append("\n")
                    }

                    //Request Bodys
                    var requestBody = request["getBody"]()
                    if(null != requestBody){
                        logString.append("|  ").append("\n")
                        logString.append("| " + "Request Body").append("\n")
                        var byteArrayOutputStream = ByteArrayOutputStream.$new()
                        requestBody["writeTo"](byteArrayOutputStream)
                        var bodyString = "";
                        try {
                            var bodyByteString = ByteString.of(byteArrayOutputStream.toByteArray())
                            bodyString = bodyByteString.utf8()
                        } catch (error) {
                            bodyString = "Base64["+bodyByteString.base64()+"]"
                        }
                        logString.append(splitLine(bodyString ,"|    ")).append("\n")
                    }
                    //Response
                    //Response Code & Message
                    var code = response["getStatus"]()
                    var reason = response["getReason"]()
                    logString.append("|  ").append("\n")
                    logString.append("|  " ).append("\n")
                    logString.append("| " + "code : " + code +  "/ reason : " + reason).append("\n")
        
        
                    //Response Headers
                    var responseHeadersString = extraInfo.getClass().getField("responseHeaders").get(extraInfo)
                    logString.append("|  ").append("\n")
                    logString.append("| " + "Response Headers").append("\n")
                    // console.log(splitLine(responseHeadersString, "|    "))
                    var responseHeaderMapObj = gson.fromJson(responseHeadersString,JavaMap.class)
                    var responseHeaderMap = Java.cast(responseHeaderMapObj,JavaLinkedTreeMap)
                    var keyArray = responseHeaderMap.keySet().toArray()
                    for(var i = 0;i<keyArray.length;i++){
                        var key = keyArray[i]
                        var value = responseHeaderMap.get(key)
                        logString.append("|    " + key+":"+value).append("\n")
                    }
        
                    //Response Body
                    var responseBody = response["getBody"]()
                    logString.append("|  ").append("\n")
                    logString.append("| " + "mimeType : " + responseBody["mimeType"]()).append("\n")
                    logString.append("|  ").append("\n")
                    logString.append("| " + "Body").append("\n")
                    var inputSteam = responseBody["in"]()
                    var length = responseBody["length"]()
                    var lengthInt = JavaInteger.valueOf(JavaString.valueOf(length))
                    if (responseBody.$className.indexOf("TypedByteArray") != -1) {
                        var byteString = ByteString.read(inputSteam, lengthInt.intValue())
                        var bodyString = "";
                        try {
                            var bodyString = byteString.utf8()
                        } catch (error) {
                            bodyString = "Base64["+byteString.base64()+"]"
                        }
                        logString.append(splitLine(bodyString ,"|    ")).append("\n")
                    } else {
                        var toString = responseBody.toString()
                        logString.append("|  " + "respone body [Unknow Type] : " + responseBody.$className + " toString:" + toString).append("\n")
                    }
        
                    logString.append("└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────").append("\n")
                    logString.append("").append("\n")                
                } catch (error) {
                    logString.append(""+error).append("\n")
                    logString.append("└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────").append("\n")
                    logString.append("").append("\n")   
                }

                console.log(logString)
                return response;

            }

        })
    }


    setImmediate(aweme_httpcat)