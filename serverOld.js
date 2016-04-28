//old server, before introduction of express for handling multiple post types

//create a server
http.createServer(function (request, response) {
    //function called when request is received

    // WORKING HERE. handle multiple post requests, so we can process new users
    // FIXME - eventually split out into proper microservices, auth should be completely seperate etc

    if(request.method=='POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            //console.log("Partial body: " + body);
        });
        request.on('end', function () {
            //console.log("Body: " + body);
            // body text looks like; "summary=just another summary test after star wars&isbn=1742207863"
            
            var parsedResponse = body.split('&');
            var summaryText = parsedResponse[0].split('=')[1];
            var ISBN = parsedResponse[1].split('=')[1];
            summaryToDB(ISBN, summaryText);

            //async db call here is fine

            response.writeHead(200, {'Content-Type': 'text/html'});
            // CORS for local testing only?
            //response.writeHead(200, {'Access-Control-Allow-Origin': '*'});
            response.end('post received');
        });
    }
    else if(request.method=='GET') {
        //response.writeHead(200, {'Content-Type': 'text/plain'});
        response.writeHead(200, {'Content-Type': 'application/json'});
        // CORS for local testing only?
        //response.writeHead(200, {'Access-Control-Allow-Origin': '*'});
      
        // parse request parameter?
        var queryData = url.parse(request.url, true).query;
      
        if(queryData.q) {
            amazonBookSearch(queryData.q, response);
        } else if(queryData.ISBN) {
            amazonBookLookup(queryData.ISBN, response);
        } else if(queryData.email) {
            userLookup(queryData.email, response);
        }
    }
}).listen(port);

console.log('Server running on port:' + port + '/');