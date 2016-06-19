var summaries = require('./summaries.js');

exports.amazonBookSearch = function (searchString, response) {
    console.log('About to execute book search for : ' + searchString);
    var options = {SearchIndex: "Books", Keywords: searchString};
    
    //http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html
    prodAdv.call("ItemSearch", options, function(err, result) {
        if(err) {
            console.error('Amazon Book Search Problem', err);
            response.end(null);
        } else {
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
        }
    })
}

exports.amazonBookLookupOnly = function(ISBN, callback) {
    var options = {ResponseGroup: "ItemAttributes,Images", ItemId : ISBN};
    
    prodAdv.call("ItemLookup", options, function(err, result) {
        if(err) {
            console.error('Amazon Book Lookup Problem', err);
        }
        var item = result.Items.Item;

        var imageURL = null;
        if(item && item.MediumImage) {
            imageURL = item.MediumImage.URL
        }

        if(item) {
            var book = { 
                "book": {
                    "title":item.ItemAttributes.Title,
                    "author":item.ItemAttributes.Author, 
                    "publisher":item.ItemAttributes.Publisher, 
                    "isbn":item.ItemAttributes.ISBN,
                    "image":imageURL
                }
            };
        } else {
            var book = {
                "book": {
                    "title":'Book not found!'
                }
            };
        }
        callback(book);
    })
}

exports.amazonBookLookup = function (ISBN, response) {
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
        
        // looks like some books, e.g. 'Lonely Planet France 9th Ed'
        // dont have an image, resulting in an app crash when trying to read image URL here!
        var imageURL = null;
        if(item && item.MediumImage) {
            imageURL = item.MediumImage.URL
        }

        var JSONObj = 
                { 
                    "book": {
                        "urlAmazon":item.DetailPageURL,
                        "title":item.ItemAttributes.Title,
                        "author":item.ItemAttributes.Author, 
                        "publisher":item.ItemAttributes.Publisher, 
                        "isbn":item.ItemAttributes.ISBN,
                        "image":imageURL
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
        summaries.summaryFromDB(item.ItemAttributes.ISBN, response, JSONObj);
    })
    
    // so, response used to look like this!
    /*
    {"book": {"title":"Lonely Planet Argentina (Travel Guide)","author":["Lonely Planet","Sandra Bao","Gregor Clark","Carolyn McCarthy","Andy Symington","Lucas Vidgen"],"publisher":"Lonely Planet","isbn":"1742207863","image":"http://ecx.images-amazon.com/images/I/51J4ZfgklaL.jpg"},"summary": {"text":"first argentina book review"},"summary": {"text":"second argentina book review!"}}
    */
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