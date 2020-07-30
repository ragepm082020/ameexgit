var fs = require('fs');
var createFileCnt= parseInt(process.argv.slice(2));

for(i=1;i<=createFileCnt;i++){    
    var content = "Hello " + i;    
    try{
        fs.writeFileSync('File'+i+'.txt', content);        
    }catch (e){
        console.log("Cannot write file ", e);
    }
}