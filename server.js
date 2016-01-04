var http = require('http'); //require the 'http' module
var url = require('url'); // just for parsing request
var pg = require('pg'); 

// https://github.com/livelycode/aws-lib
aws = require('aws-lib');

prodAdv = aws.createProdAdvClient(process.env.AWS_ACCESSKEYID, process.env.AWS_SECRETACCESSKEY, process.env.AWS_ASSOCIATETAG);

var conString = process.env.DATABASE_URL;

// let the port be set by Heroku
var port = process.env.PORT || 1337; // locally, use 1337

//create a server
http.createServer(function (request, response) {
    //function called when request is received

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
        });
        response.writeHead(200, {'Content-Type': 'text/html'});
        // CORS for local testing
        response.writeHead(200, {'Access-Control-Allow-Origin': '*'});
        response.end('post received');
    }
    else if(request.method=='GET') {
        //response.writeHead(200, {'Content-Type': 'text/plain'});
        response.writeHead(200, {'Content-Type': 'application/json'});
        // CORS for local testing
        response.writeHead(200, {'Access-Control-Allow-Origin': '*'});
      
        // parse request parameter?
        var queryData = url.parse(request.url, true).query;
      
        if(queryData.q) {
            amazonBookSearch(queryData.q, response);
        } else if(queryData.ISBN) {
            amazonBookLookup(queryData.ISBN, response);
        }
    }
}).listen(port);

function amazonBookSearch(searchString, response) {
    var options = {SearchIndex: "Books", Keywords: searchString};
    
    prodAdv.call("ItemSearch", options, function(err, result) {
        if(err) {
            console.error('Amazon Book Search Problem', err);
        }
        
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
    //var options = {ResponseGroup: "Images", ItemId : "0141019018"};
    var options = {ResponseGroup: "ItemAttributes,Images", ItemId : ISBN};
    
    prodAdv.call("ItemLookup", options, function(err, result) {
        if(err) {
            console.error('Amazon Book Lookup Problem', err);
        }
        
        //response.end(JSON.stringify(result));
        
        //iterate Item, we only care about the first (there should only ever be one)
        var item = result.Items.Item;//result.Items.Item[index];
            
        //return the ASIN, but call it the ISBN
        //also return the Title from the ItemAttributes
            
        var JSONObj = 
                { 
                    "book": {
                        "title":item.ItemAttributes.Title,
                        "author":item.ItemAttributes.Author, 
                        "publisher":item.ItemAttributes.Publisher, 
                        "isbn":item.ItemAttributes.ISBN,
                        "image":item.MediumImage.URL
                }};
                /*    
                    },
                    "summary":{
                        "text":summaryFromDB(item.ItemAttributes.ISBN)
                    }
                };
                */
    
        //"text":summaryFromDB(item.ItemAttributes.ISBN);

        //response.end(JSON.stringify(JSONObj));

        //response.write(JSON.stringify(JSONObj));
        summaryFromDB(item.ItemAttributes.ISBN, response, JSONObj);
    })
    
    // so, response used to look like this!
    /*
    {"book": {"title":"Lonely Planet Argentina (Travel Guide)","author":["Lonely Planet","Sandra Bao","Gregor Clark","Carolyn McCarthy","Andy Symington","Lucas Vidgen"],"publisher":"Lonely Planet","isbn":"1742207863","image":"http://ecx.images-amazon.com/images/I/51J4ZfgklaL.jpg"},"summary": {"text":"first argentina book review"},"summary": {"text":"second argentina book review!"}}
    */
}

// FIXME blocking call issue, just passing the response in for now to get it working!
function summaryFromDB(ISBN, response, bookJSON) {
    var client = new pg.Client(conString);
    client.connect(function(err) {
        if(err) {
            return console.error('could not connect to postgres', err);
        }
        client.query('SELECT id, text from public."SummaryText" where ISBN = ($1)', [ISBN], function(err, result) {
        if(err) {
            return console.error('error running query', err);
        }
        //var summaryText = result.rows[0].text;
        var summary = [];

        // FIXME http://stackoverflow.com/questions/9205496/how-to-make-connection-to-postgres-via-node-js
        // shows a neat way of streaming back rows one at a time
        for (var i = 0; i < result.rowCount; i++) {
            var summaryJSON = {
                "id":result.rows[i].id,
                "text":result.rows[i].text
            }           
            summary.push(summaryJSON);
        }

        //bookJSON.summary = summaryJSON;
        if(summary.length > 0) {
            bookJSON.summaryList = summary;    
        }

        response.end(JSON.stringify(bookJSON));

        client.end();
        });
    });
}

function summaryToDB(ISBN, text) {
    var client = new pg.Client(conString);
    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      client.query('INSERT INTO public."SummaryText" (isbn, text) VALUES (($1),($2))', [ISBN, text], function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }
        client.end();
      });
    });
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

console.log('Server running on port:' + port + '/');