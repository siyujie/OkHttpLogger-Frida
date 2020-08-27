function okhttp_find(){
    Java.perform(function(){
        
        var okhttpDex = Java.openClassFile("/mnt/sdcard/okhttpfind.dex").load()

        Java.use("com.singleman.okhttp.OKLog").debugLog.implementation = function(message){
            console.log(message)
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
                ){
                    return
                }
               
                var okhttpPackage = "okhttp3."
                var okioPackage = "okio."
                if(name.search(okhttpPackage) != -1){
                    var loadedClazz = Java.use(name).class
                    ok_loadedClazzList.add(loadedClazz)
                }
                if(name.search(okioPackage) != -1){
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


setImmediate(okhttp_find);