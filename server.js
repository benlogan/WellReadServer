var http = require('http'); //require the 'http' module
var url = require('url'); // just for parsing request

// https://github.com/livelycode/aws-lib
aws = require('aws-lib');
prodAdv = aws.createProdAdvClient('AKIAJGCWOOREC5CFOMDQ', 'k7HMq6+6PV5HRq9jktvkbZfCH7iPZj02RVIgE+il', 'well0ac-21');

// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080; // was 1337

//create a server
http.createServer(function (request, response) {
  //function called when request is received
    
  //response.writeHead(200, {'Content-Type': 'text/plain'});
  response.writeHead(200, {'Content-Type': 'application/json'});
  
  // parse request parameter?
  var queryData = url.parse(request.url, true).query;
    
  //amazonBookSearch(response);
  amazonBookLookup(queryData.ISBN, response);
}).listen(port);//, '127.0.0.1');


function amazonBookSearch(response) {
    var options = {SearchIndex: "Books", Keywords: "Javascript"};
    
    prodAdv.call("ItemSearch", options, function(err, result) {
        console.log("Error : " + err);
        console.log("Results : " + result);
        response.end(JSON.stringify(result));
    })
}

function amazonBookLookup(ISBN, response) {
    // ISBN for Freakonomics; 0141019018 (for books that is the ASIN)
    // SuperFreakonomics; 0062063375 
    //var options = {ResponseGroup: "Images", ItemId : "0141019018"};
    var options = {ResponseGroup: "Images", ItemId : ISBN};
    
    prodAdv.call("ItemLookup", options, function(err, result) {
        console.log("Error : " + err);
        console.log("Results : " + result);
        response.end(JSON.stringify(result));
    })
}

function googleBooksLookup() {
    //https://books.google.co.uk/books?id=wNPnl5zYA-cC&dq=freakonomics&hl=en&sa=X&ei=ewmdVYs4xuVSrNyBoAs&redir_esc=y
    
    // api call; https://www.googleapis.com/books/v1/volumes/wNPnl5zYA-cC
    // need the equivelant by ISBN
    
    // interestingly this has a 'description' field which could be used for the first entry?
}

console.log('Server running at http://localhost:' + port + '/');