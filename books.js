var summaries = require('./summaries.js');

var request = require('request'); // for NYT call only at present

const NodeCache = require( "node-cache" );
const myCache = new NodeCache({ checkperiod: 3600 }); // 1hr, not changing frequently

exports.amazonBookSearch = function (searchString, response) {
    //searchString = encodeURIComponent(searchString);
    console.log('About to execute book search for : ' + searchString);
    var options = {SearchIndex: "Books", Keywords: searchString, Availability: "Available", MerchantId: "Amazon", ResponseGroup: "ItemAttributes"};

    //http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html
    prodAdv.call("ItemSearch", options, function(err, result) {
        if(err) {
            console.error('Amazon Book Search Problem', err);
            response.end(null);
        } else {
            //response.end(JSON.stringify(result));

            //console.log('Amazon Book Search Results Size: ' + result.Items.Item.length);

            var books = [];
            var exactMatchAlreadyAdded = false;

            //iterate Item, we only care about the top 5
            for(var index in result.Items.Item) {
                var item = result.Items.Item[index];

                //return the ASIN, but call it the ISBN - no, the ASIN/ISBN is not the correct 13 digit ISBN, use the EAN
                //also return the Title from the ItemAttributes

                // only paperbacks, if there is a paperback (some books will be only hardback)?
                // item.ItemAttributes.Binding == 'Paperback'
                // FIXME many more improvements possible here
                // actually maybe just include exact match only once?
                // what we really need is - are we returning the same title twice, if so, is it just because binding is different - if so, ignore them
                // we have to check there is actually a full response in the result first! There wouldn't be for 'Breakfast at Ti', for example.
                if(item.ItemAttributes) {
                  var count = 0;
                  for (var key in summaries.summaryCountJSON) {
                    if (summaries.summaryCountJSON.hasOwnProperty(key)) {
                      var summaryResult = summaries.summaryCountJSON[key];
                      if(summaryResult.isbn == item.ASIN) {
                        count = summaryResult.count;
                        //console.log('adding summary count : ' + count + ' for ASIN ' + item.ASIN);
                      }
                    }
                  }
                  var JSONObj = { "title":item.ItemAttributes.Title, "isbn":item.ItemAttributes.EAN, "asin":item.ASIN, "synopsis":count };
                  if(searchString.toUpperCase() === item.ItemAttributes.Title.toUpperCase() && !exactMatchAlreadyAdded) {
                      books.push(JSONObj);
                      exactMatchAlreadyAdded = true;
                  } else if (searchString.toUpperCase() != item.ItemAttributes.Title.toUpperCase()) {
                      books.push(JSONObj);
                  }
                }
            }

            response.end(JSON.stringify(books));
        }
    })
}

exports.amazonBookLookupOnly = function(ASIN, callback) {
    var options = {ResponseGroup: "ItemAttributes,AlternateVersions,Images,Large", ItemId : ASIN};
    //var options = {ResponseGroup: "ItemAttributes,Images", IdType : "EAN", SearchIndex : "Books", ItemId : ISBN};

    // FIXME - 2 cache checks, a bit wasteful etc
    var cacheValueBook = myCache.get("book_" + ASIN);
    var cacheValueList = myCache.get("bookList_" + ASIN);
    if(cacheValueBook != undefined) {
        console.log('found book in cache!');
        callback(cacheValueBook);
    } else if (cacheValueList != undefined) {
        console.log('found book list in cache!');
        callback(cacheValueList);
    } else {
        // go to amazon!
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

                        var newAsin;
                        if(aBook.ItemAttributes.Binding === "Kindle Edition") {
                            //SKIP ME?
                            for(var i2 in aBook.AlternateVersions.AlternateVersion) {
                                if(aBook.AlternateVersions.AlternateVersion[i2].Binding === "Paperback" || aBook.AlternateVersions.AlternateVersion[i2].Binding === "Hardback") {
                                    newAsin = aBook.AlternateVersions.AlternateVersion[i2].ASIN;
                                    //break; //deliberately taking the last one in the list for now, seems to maybe be more recent!? //FIXME not working and unreliable
                                }
                            }
                        }
                        var book = {
                            "book": {
                                "title":aBook.ItemAttributes.Title,
                                "author":aBook.ItemAttributes.Author,
                                "url":aBook.DetailPageURL,
                                "asin":aBook.ASIN,
                                "newAsin":newAsin,
                                "isbn":aBook.ItemAttributes.EAN
                            }
                        };
                        bookList.push(book);
                    }
                    myCache.set("bookList_" + ASIN, bookList);
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
            response.end(null);
        } else {
          // iterate Item, we only care about the first (there should only ever be one)
          // now that we aren't using a unique amazon ID there won't only be one! use the first for now...
          var item = result.Items.Item;

          // looks like some books, e.g. 'Lonely Planet France 9th Ed'
          // dont have an image, resulting in an app crash when trying to read image URL here!
          var imageURL = null;
          if(item && item.LargeImage) {
              imageURL = item.LargeImage.URL
          }

          if(item) {
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
            summaries.summaryFromDB(ASIN, response, JSONObj);
          } else {
            response.end(null);
          }
        }
    })
}

// rather than using the TopSellers (see below), just do a regular search ranked by sales
exports.amazonBookLists = function (response) {
    console.log('About to execute book search for top books!');

    var cacheValue = myCache.get("topBooks");
    if(cacheValue != undefined) {
      response.end(JSON.stringify(cacheValue));
    } else {
      var options = {SearchIndex: "Books", Keywords: "*", Availability: "Available", MerchantId: "Amazon", ResponseGroup: "ItemAttributes", Sort: "salesrank"};

      prodAdv.call("ItemSearch", options, function(err, result) {
          if(err) {
              console.error('Amazon Top Book Search Problem', err);
              response.end(null);
          } else {
              var books = [];

              for(var index in result.Items.Item) {
                  var item = result.Items.Item[index];
                  var JSONObj = { "title":item.ItemAttributes.Title, "asin":item.ASIN, "url":item.DetailPageURL, "author":item.ItemAttributes.Author, "isbn":item.ItemAttributes.EAN };
                  books.push(JSONObj);
              }
              myCache.set("topBooks", books);
              response.end(JSON.stringify(books));
          }
      })
    }
}

/*
// could never get this version to really work - it's always returning kindle books which just mess everything up and then require translating to usable ISBN's etc.
exports.amazonBookLists = function (responseGroup, response) {
    console.log('About to execute book list lookup!');
    var options = {ResponseGroup: responseGroup, BrowseNodeId : "1025612"}; // can't seem to find a browse node for printed books! convert them later instead!

    //http://docs.aws.amazon.com/AWSECommerceService/latest/DG/TopSellers.html
    prodAdv.call("BrowseNodeLookup", options, function(err, result) {
        if(err) {
            console.error('Amazon Book List Problem', err);
            response.end(null);
        } else {

            var books = [];
            var asinList = [];

            var resultArray;
            if(responseGroup == "TopSellers") {
                resultArray = result.BrowseNodes.BrowseNode.TopSellers.TopSeller;
            } else if(responseGroup == "NewReleases") {

                // FIXME US locale only, so not currently returning anything for UK! not used, but I'm leaving the code here for now
                resultArray = result.BrowseNodes.BrowseNode.NewReleases.NewRelease;
            }

            // usually 10 best sellers
            for(var index in resultArray) {
                var item = resultArray[index];

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
                    for(var i2 = 0; i2 < books.length; i2++) {
                        if(books[i2].asin == result[i1].book.asin) {
                            books[i2]['url'] = result[i1].book.url;
                            books[i2]['isbn'] = result[i1].book.isbn;
                            books[i2]['author'] = result[i1].book.author;
                            books[i2]['asin'] = result[i1].book.newAsin;
                        }
                    }
                }
                response.end(JSON.stringify(books));
            });
        }
    })
}*/

exports.nytBookLists = function (response) {
    console.log('About to execute book search for top books on NYT!');

    var cacheValue = myCache.get("topBooksNyt");
    if(cacheValue != undefined) {
      response.end(JSON.stringify(cacheValue));
    } else {
      request.get({
        url: "https://api.nytimes.com/svc/books/v3/lists.json",
        qs: {
          'api-key': "35ae9d527f0848a6843b3cef66afb73b",
          'list': "combined-print-and-e-book-nonfiction"
        },
      }, function(err, resp, body) {
        body = JSON.parse(body);

        var books = [];

        for(var i = 0; i < 10; i++) {
          var bookDetails = body.results[i].book_details[0];
          // I 'think' that primary_isbn10 is usually the ASIN!
          var bookTitle = bookDetails.title.charAt(0).toUpperCase() + bookDetails.title.slice(1).toLowerCase();
          var JSONObj = { "title":bookTitle, "asin":bookDetails.primary_isbn10, "url":body.results[i].amazon_product_url, "author":bookDetails.author, "isbn":bookDetails.primary_isbn13 };
          books.push(JSONObj);
        }
        myCache.set("topBooksNyt", books);
        response.end(JSON.stringify(books));
      });
    }
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
