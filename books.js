var summaries = require('./summaries.js');

exports.amazonBookSearch = function (searchString, response) {
    console.log('About to execute book search for : ' + searchString);
    var options = {SearchIndex: "Books", Keywords: searchString, ResponseGroup: "ItemAttributes"};
    
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
                
                //return the ASIN, but call it the ISBN - no, the ASIN/ISBN is not the correct 13 digit ISBN, use the EAN
                //also return the Title from the ItemAttributes
                
                var JSONObj = { "title":item.ItemAttributes.Title, "isbn":item.ItemAttributes.EAN, "asin":item.ASIN };
                books.push(JSONObj);
            }
        
            response.end(JSON.stringify(books));
        }
    })
}

exports.amazonBookLookupOnly = function(ASIN, callback) {
    var options = {ResponseGroup: "ItemAttributes,Images,Large", ItemId : ASIN};
    //var options = {ResponseGroup: "ItemAttributes,Images", IdType : "EAN", SearchIndex : "Books", ItemId : ISBN};
    
    prodAdv.call("ItemLookup", options, function(err, result) {
        if(err) {
            console.error('Amazon Book Lookup Problem', err);
            callback(null);
        } else {
            var item = result.Items.Item;

            var imageURL = null;
            if(item && item.LargeImage) {
                imageURL = item.LargeImage.URL
            }

            if(Array.isArray(item)) {
                var bookList = [];
                for(var index in item) {
                    var aBook = item[index];

                    var book = { 
                        "book": {
                            "title":aBook.ItemAttributes.Title,
                            "url":aBook.DetailPageURL,
                            "asin":aBook.ASIN
                        }
                    };
                    bookList.push(book);
                }
                callback(bookList);
            }
            else {

            if(item) {
                var book = { 
                    "book": {
                        "title":item.ItemAttributes.Title,
                        "author":item.ItemAttributes.Author, 
                        "publisher":item.ItemAttributes.Publisher, 
                        "isbn":item.ItemAttributes.EAN,
                        "asin":ASIN,
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

            }
            
            callback(book);
        }
    })
}

exports.amazonBookLookup = function (ASIN, response) {
    // ISBN for Freakonomics; 0141019018 (for books that is the ASIN)
    // we aren't searcing by ASIN any more, but by a proper 13 digit ISBN, the EAN - hence a search index (IdType) now needs to be specified!
    //var options = {ResponseGroup: "Images", ItemId : "0141019018"};
    //var options = {ResponseGroup: "ItemAttributes,Images", IdType : "EAN", SearchIndex : "Books", ItemId : ISBN};
    var options = {ResponseGroup: "ItemAttributes,Images", ItemId : ASIN};
    //Large,EditorialReview don't think this was needed?
    
    prodAdv.call("ItemLookup", options, function(err, result) {
        if(err) {
            console.error('Amazon Book Lookup Problem', err);
        }
        
        //response.end(JSON.stringify(result));
        
        // iterate Item, we only care about the first (there should only ever be one) 
        // now that we aren't using a unique amazon ID there won't only be one! use the first for now...
        var item = result.Items.Item;
        
        // looks like some books, e.g. 'Lonely Planet France 9th Ed'
        // dont have an image, resulting in an app crash when trying to read image URL here!
        var imageURL = null;
        if(item && item.LargeImage) {
            imageURL = item.LargeImage.URL
        }

        var JSONObj = 
                { 
                    "book": {
                        "urlAmazon":item.DetailPageURL,
                        "title":item.ItemAttributes.Title,
                        "author":item.ItemAttributes.Author, 
                        "publisher":item.ItemAttributes.Publisher, 
                        "isbn":item.ItemAttributes.EAN,
                        "asin":ASIN,
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
        summaries.summaryFromDB(ASIN, response, JSONObj);
    })
    
    // so, response used to look like this!
    /*
    {"book": {"title":"Lonely Planet Argentina (Travel Guide)","author":["Lonely Planet","Sandra Bao","Gregor Clark","Carolyn McCarthy","Andy Symington","Lucas Vidgen"],"publisher":"Lonely Planet","isbn":"1742207863","image":"http://ecx.images-amazon.com/images/I/51J4ZfgklaL.jpg"},"summary": {"text":"first argentina book review"},"summary": {"text":"second argentina book review!"}}
    */
}

exports.amazonTopBooks = function (response) {
    console.log('About to execute top book search!');
    var options = {ResponseGroup: "TopSellers", BrowseNodeId : "1025612"};
    
    //http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html
    prodAdv.call("BrowseNodeLookup", options, function(err, result) {
        if(err) {
            console.error('Amazon Book Search Problem', err);
            response.end(null);
        } else {
            //response.end(JSON.stringify(result));
            
            var books = [];
            var asinList = [];

            //iterate , we only care about the top 5?
            for(var index in result.BrowseNodes.BrowseNode.TopSellers.TopSeller) {
                var item = result.BrowseNodes.BrowseNode.TopSellers.TopSeller[index];
                
                var JSONObj = { "title":item.Title, "asin":item.ASIN };
                books.push(JSONObj);

                // so, we actually want to build an ASIN list, then run a search using that array and pull back product page URL's
                // those URL's can then be used by the scraper to retrieve a first synopsis (and editorial reviews etc)
                asinList.push(item.ASIN);
            }
        
            var asinCommaList = '';
            for(var asin in asinList) {
                asinCommaList += asinList[asin] + ',';
            }
            asinCommaList = asinCommaList.substring(0, asinCommaList.length - 1);

            exports.amazonBookLookupOnly(asinCommaList, function(result) { 
                for(var i1 = 0; i1 < result.length; i1++) {
                    var url = result[i1].book.url;
                    console.log('RETRIEVED URL ' + url);
                    
                    for(var i2 = 0; i2 < books.length; i2++) {
                        if(books[i2].asin == result[i1].book.asin) {
                            books[i2]['url'] = url;
                        }
                    }
                }
                response.end(JSON.stringify(books));
            });

            //response.end(JSON.stringify(books));
        }
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