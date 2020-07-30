const fetch = require('node-fetch');
var dns = require('dns');
var retry = require('retry');
const http = require("http")
var express = require('express')
var morgan = require('morgan')
var fs = require('fs')
var path = require('path')
var app = express()
 
function faultTolerantResolve(address, cb) { 
 var operation = retry.operation({
	retries: 5,
	factor: 3,
	minTimeout: 1 * 100,
	maxTimeout: 60 * 10,
	randomize: true,
  });
 
  operation.attempt(function(currentAttempt) {
    dns.resolve(address, function(err, addresses) {
      if (operation.retry(err)) {    return;   } 
      cb(err ? operation.mainError() : null,addresses);
    });
  });
}
 
faultTolerantResolve('httpbin.org', function(err, addresses) {
 
if(err && err.code=='ENOTFOUND'){
  //when a wrong address is specified. For Example, httpbi.org
  console.log('server connection failed. Incorrect server address ');   return;
}

if(addresses.length > 0){
   //when a correct address is specified. For Example, httpbin.org
	console.log('server connection successful');	  
	fetch('https://httpbin.org/get').then(response => {
		if(response.ok){      
			response.json().then((data) => {				
				console.log('\nFetched Data From Server (https://httpbin.org)');
				console.log('************************************************');
				console.log(data);	
				var dataOriginIP = data.origin;
				var dataUrl = data.url;	
				const postBody = {
					postingOriginIP:dataOriginIP,
					postingURL: dataUrl					
				 }
				
				fetch("https://postman-echo.com/post", {
					method: "POST",
					body: JSON.stringify(postBody),
					headers: { "Content-Type": "application/json" }
					})
					.then(res => res.json())
					.then(
						function(json) { 
							console.log('\n\nPosted Data to server (https://postman-echo.com)');	
							console.log('**************************************');
							console.log(json)					
					})
					.catch(
						function(err) {
							if(err.errno){
								console.log('\n\nIncorrect posting server address');	
								console.log('**************************************');								
							}				
					})			
								
			});  	
		} else { throw 'Invalid API method used'  }
  	}).catch(error => {
		var errorStr = error.message;		
		if(errorStr){
			//when wrong external server location entered https://httpbin.or/get
			//  Displays : Incorrect external server location
			var incorrectExternalAPIAddress = errorStr.indexOf("ENOTFOUND"); 
			if(incorrectExternalAPIAddress > 0){
				console.log('Incorrect external server location');
			} else {
				//Rest of the errors captured here			
				console.log(errorStr);  	
			}
			return;
		}

		if(error){
			//when wrong external API entered https://httpbin.org/geet
			console.log(error); return; 
		}
	});
	
app.listen(3000, () => { 	console.debug('App listening on :3000');  });

app.use(morgan('dev', {	skip: function (req, res) { return res.statusCode < 400 } }))
	  
// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
 
// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))

app.get('/test', function (req, res) {
  res.send('hello, world!')
})
	

  }
});