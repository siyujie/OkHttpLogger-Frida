/**
	说明 ： 通过加载java实现的寻找okhttp3特征的代码打印出可能会用到的okhttp 关键类；
	代码中过滤了以 okio 和 okhttp3 字符串开头的包名，如果包名被混下了，需要自己去找一下包名，替换一下！
	
	可以去掉包名过滤限制，但是 会比较慢 & 准确性未知。
*/


function find(){
    Java.perform(function(){
        
        var okhttpDex = Java.openClassFile("/mnt/sdcard/okhttpfind.dex").load()

        Java.use("com.singleman.okhttp.OKLog").debugLog.implementation = function(message){
            

            if(message.indexOf("Start Find") != -1){
                console.log(message)
                console.log("")
            }
            if(message.indexOf("Find Complete") != -1){

                var OkCompatClazz = Java.use("com.singleman.okhttp.OkCompat").class
                var fields = OkCompatClazz.getDeclaredFields();
                for (var i = 0;i < fields.length; i++) {
                    var field = fields[i]
                    field.setAccessible(true);
                    var name = field.getName()
                    var value = field.get(null)

                    console.log("var "+name+" = \""+value+"\";")
                }

                console.log("")
                //console.log("   !!!!!!!!!   Please check whether [M_rsp_headers] is \"trailers\"   !!!!!!!!!    ")
                console.log("")
                console.log(message)
            }
        }

        Java.use("com.singleman.okhttp.OKLog").debugException.implementation = function(ex){
            console.log(Java.use("android.util.Log").getStackTraceString(ex))
        }

        var OkHttpPrinter = Java.use("com.singleman.okhttp.OkHttpFinder")

        var OkHttpPrinterObj = OkHttpPrinter.getInstance()

        var ok_loadedClazzList = Java.use("java.util.ArrayList").$new()
        var okio_loadedClazzList = Java.use("java.util.ArrayList").$new()

        Java.enumerateLoadedClasses({
            onMatch:function(name, hanlde){
                if(name.search("com.android.") != -1
                        || name.search("byte") != -1
                        || name.search("short") != -1
                        || name.search("char") != -1
                        || name.search("int") != -1
                        || name.search("long") != -1
                        || name.search("double") != -1
                        || name.search("float") != -1
                        || name.search("boolean") != -1
                        || name.search("void") != -1
                        || name.search("Proxy") != -1
                ){
                    return
                }
               
                var okhttpPackage = "okhttp3."
                var okioPackage = "okio."
                if(name.indexOf(okhttpPackage) == 0){
                    var loadedClazz = Java.use(name).class
                    ok_loadedClazzList.add(loadedClazz)
                }
                if(name.indexOf(okioPackage)  == 0){
                    var loadedClazz = Java.use(name).class
                    okio_loadedClazzList.add(loadedClazz)
                }

              

            },onComplete:function(){
                console.log(" ")
                console.log(" ")
                console.log("enum loaded classes Complete ! ")
                console.log(" ")
                console.log(" ")
            }
        })

        console.log(" ")
        console.log(" ")
        console.log(" ")

        OkHttpPrinterObj.findClassInit(ok_loadedClazzList,okio_loadedClazzList)
    })

}


setImmediate(find);