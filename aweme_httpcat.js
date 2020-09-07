/**
 * [某音]的http请求打印小工具,大家自己找一下那个关键类吧，根据下面的代码分分钟找出来
 *
 */


var HttpOnly = ""
var HttpOnlyMethod = ""

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
    var newSB = Java.use("java.lang.StringBuilder").$new()
    var newString = Java.use("java.lang.String").$new(string)
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
    return newSB.deleteCharAt(newSB.length() - 1).toString()
}


function aweme_httpcat() {
    Java.perform(function () {
        Java.openClassFile("/data/local/tmp/okhttpfind.dex").load()
        Java.use(HttpOnly)[HttpOnlyMethod].overload().implementation = function () {
            var response = this[HttpOnlyMethod]()
            try {
                console.log("");
                console.log("┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");
    
                //URL
                var url = response["getUrl"]()
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
                    var jsonObject = Java.use("org.json.JSONObject").$new(requestLogString)
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
                console.log(splitLine(requestHeadersString, "|    "))
    
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
                console.log(splitLine(responseHeadersString, "|    "))
    
                //Response Body
                var responseBody = response["getBody"]()
                console.log("|  " ,"");
                console.log("| " ,"mimeType : ", responseBody["mimeType"]())
                console.log("|  " ,"");
                console.log("| " ,"Body");
                var inputSteam = responseBody["in"]()
                var length = responseBody["length"]()
                var lengthInt = Java.use("java.lang.Integer").valueOf(Java.use("java.lang.String").valueOf(length))
                if (responseBody.$className.indexOf("TypedByteArray") != -1) {
                    var bodyString = Java.use("com.singleman.okio.ByteString").read(inputSteam, lengthInt.intValue()).utf8()
                    console.log(splitLine(bodyString ,"|    "))
                }else {
                    var toString = responseBody.toString()
                    console.log("|  " ,"respone body [Unknow Type] : ", responseBody.$className," toString:",toString)
                }
    
                console.log("└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");
                console.log("");                
            } catch (error) {
                console.log(Java.use("android.util.Log").getStackTraceString(error))
                console.log("└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");
                console.log("");   
            }
            return response;

        }

    })
}


setImmediate(aweme_httpcat)