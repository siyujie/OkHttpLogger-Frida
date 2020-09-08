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
        var lineLength = 200;
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
                    console.log("");
                    console.log("┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");

                    //URL
                    console.log("| URL")
                    console.log(splitLine(url, "|    "))

                    if(filterUrl(url)){
                        console.log("|  ","Is File")
                        console.log("└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");
                        console.log("");  
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
                        console.log("|  " ,"");
                        console.log("| " ,"Method : ", httpMethod, "  originUrl : ", originUrl)
                    }
        
                    //Request Headers
                    var requestHeadersString = extraInfo.getClass().getField("requestHeaders").get(extraInfo)
                    console.log("|  " ,"");
                    console.log("| ","Request Headers")
                    // console.log(splitLine(requestHeadersString, "|    "))
                    var requestHeaderMapObj = gson.fromJson(requestHeadersString,JavaMap.class)
                    var requestHeaderMap = Java.cast(requestHeaderMapObj,JavaLinkedTreeMap)
                    var keyArray = requestHeaderMap.keySet().toArray()
                    for(var i = 0;i<keyArray.length;i++){
                        var key = keyArray[i]
                        var value = requestHeaderMap.get(key)
                        console.log("|    ",key+":"+value)
                    }

                    //Request Bodys
                    var requestBody = request["getBody"]()
                    if(null != requestBody){
                        console.log("|  " ,"");
                        console.log("| " ,"Request Body");
                        var byteArrayOutputStream = ByteArrayOutputStream.$new()
                        requestBody["writeTo"](byteArrayOutputStream)
                        var bodyString = "";
                        try {
                            var bodyByteString = ByteString.of(byteArrayOutputStream.toByteArray())
                            bodyString = bodyByteString.utf8()
                        } catch (error) {
                            bodyString = "Base64["+bodyByteString.base64()+"]"
                        }
                        console.log(splitLine(bodyString ,"|    "))
                    }
                    //Response
                    //Response Code & Message
                    var code = response["getStatus"]()
                    var reason = response["getReason"]()
                    console.log("|  " ,"");
                    console.log("|  " ,"");
                    console.log("| " ,"code : ", code, "/ reason : ", reason)
        
        
                    //Response Headers
                    var responseHeadersString = extraInfo.getClass().getField("responseHeaders").get(extraInfo)
                    console.log("|  " ,"");
                    console.log("| ","Response Headers")
                    // console.log(splitLine(responseHeadersString, "|    "))
                    var responseHeaderMapObj = gson.fromJson(responseHeadersString,JavaMap.class)
                    var responseHeaderMap = Java.cast(responseHeaderMapObj,JavaLinkedTreeMap)
                    var keyArray = responseHeaderMap.keySet().toArray()
                    for(var i = 0;i<keyArray.length;i++){
                        var key = keyArray[i]
                        var value = responseHeaderMap.get(key)
                        console.log("|    ",key+":"+value)
                    }
        
                    //Response Body
                    var responseBody = response["getBody"]()
                    console.log("|  " ,"");
                    console.log("| " ,"mimeType : ", responseBody["mimeType"]())
                    console.log("|  " ,"");
                    console.log("| " ,"Body");
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
                        console.log(splitLine(bodyString ,"|    "))
                    } else {
                        var toString = responseBody.toString()
                        console.log("|  " ,"respone body [Unknow Type] : ", responseBody.$className," toString:",toString)
                    }
        
                    console.log("└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");
                    console.log("");                
                } catch (error) {
                    console.log(error)
                    console.log("└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");
                    console.log("");   
                }

                return response;

            }

        })
    }


    setImmediate(aweme_httpcat)