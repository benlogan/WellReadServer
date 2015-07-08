var http = require('http'); //require the 'http' module
var url = require('url'); // just for parsing request

// https://github.com/livelycode/aws-lib
aws = require('aws-lib');
prodAdv = aws.createProdAdvClient('AKIAJGCWOOREC5CFOMDQ', 'k7HMq6+6PV5HRq9jktvkbZfCH7iPZj02RVIgE+il', 'well0ac-21');

// process.env.PORT lets the port be set by Heroku
//var port = process.env.PORT || 8080; // was 1337
var port = 1337;

//create a server
http.createServer(function (request, response) {
  //function called when request is received
    
  //response.writeHead(200, {'Content-Type': 'text/plain'});
  response.writeHead(200, {'Content-Type': 'application/json'});
    
    // CORS?
    //res.header 'Access-Control-Allow-Origin', '*'
    response.writeHead(200, {'Access-Control-Allow-Origin': '*'});
  
  // parse request parameter?
  var queryData = url.parse(request.url, true).query;
  
  if(queryData.q) {
    amazonBookSearch(queryData.q, response);
  } else if(queryData.ISBN) {
    amazonBookLookup(queryData.ISBN, response);
  }
}).listen(port);//, '127.0.0.1');


function amazonBookSearch(searchString, response) {
    var options = {SearchIndex: "Books", Keywords: searchString};
    
    prodAdv.call("ItemSearch", options, function(err, result) {
        console.log("Error : " + err);
        console.log("Results : " + result);
        
        //response.end(JSON.stringify(result));
        
        var books = [];
        
        //iterate Item, we only care about the top 5
        for(var index in result.Items.Item) {
            var item = result.Items.Item[index];
            
            //return the ASIN, but call it the ISBN
            //also return the Title from the ItemAttributes
            
            var JSONObj = { "title":item.ItemAttributes.Title, "isbn":item.ASIN };
            books.push(JSONObj);
        }
    
        response.end(JSON.stringify(books));
    })
}

function amazonBookLookup(ISBN, response) {
    // ISBN for Freakonomics; 0141019018 (for books that is the ASIN)
    // SuperFreakonomics; 0062063375 
    //var options = {ResponseGroup: "Images", ItemId : "0141019018"};
    var options = {ResponseGroup: "ItemAttributes,Images", ItemId : ISBN};
    
    prodAdv.call("ItemLookup", options, function(err, result) {
        console.log("Error : " + err);
        console.log("Results : " + result);
        
        //response.end(JSON.stringify(result));
        
        //iterate Item, we only care about the first (there should only ever be one)
        var item = result.Items.Item;//result.Items.Item[index];
            
        //return the ASIN, but call it the ISBN
        //also return the Title from the ItemAttributes
            
        var JSONObj = { "title":item.ItemAttributes.Title,
                        "author":item.ItemAttributes.Author, 
                        "publisher":item.ItemAttributes.Publisher, 
                        "isbn":item.ItemAttributes.ISBN,
                        "image":item.MediumImage.URL};
    
        response.end(JSON.stringify(JSONObj));
    })
}

function googleBooksLookup() {
    //https://books.google.co.uk/books?id=wNPnl5zYA-cC&dq=freakonomics&hl=en&sa=X&ei=ewmdVYs4xuVSrNyBoAs&redir_esc=y
    
    // api call; https://www.googleapis.com/books/v1/volumes/wNPnl5zYA-cC
    // need the equivelant by ISBN - you have to search instead;
    // https://www.googleapis.com/books/v1/volumes?q=isbn:0062132342
    
    // interestingly this has a 'description' field which could be used for the first entry?
    
    // JSON path; description
    //volumeInfo.description
    
    // JSON path; image
    //volumeInfo.imageLinks.thumbnail
}

console.log('Server running at http://localhost:' + port + '/');