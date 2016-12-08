var books = require('./books.js');

const NodeCache = require( "node-cache" );
const myCache = new NodeCache({ checkperiod: 7200 }); // this can be a long life cache, it never changes! 2hrs

exports.featuredBooks = function (bookCategory, response) {
    console.log('About to execute featured book lookup!');

    var cacheValue = myCache.get("featuredBooks_" + bookCategory);
    if(cacheValue != undefined) {
      response.end(JSON.stringify(cacheValue));
    } else {
      var parsedJSON;
      switch (bookCategory) {
          case "programming":
              parsedJSON = require('./data/programming.json');
              break;
          case "management":
              parsedJSON = require('./data/management.json');
              break;
          case "classics":
              parsedJSON = require('./data/classics.json');
              break;
          case "searched":
              parsedJSON = require('./data/searched.json');
              break;
          case "satire":
              parsedJSON = require('./data/satire.json');
              break;
      }

      if(parsedJSON) {
          var asinCommaList = '';

          for(var bookIndex in parsedJSON.bookList) {
              asinCommaList += parsedJSON.bookList[bookIndex].asin + ',';
          }
          asinCommaList = asinCommaList.substring(0, asinCommaList.length - 1);

          var booksData = [];

          books.amazonBookLookupOnly(asinCommaList, function(result) {
              for(var i = 0; i < result.length; i++) {
                  var book = { "title":result[i].book.title, "asin":result[i].book.asin,  "url":result[i].book.url, "author":result[i].book.author, "isbn":result[i].book.isbn};
                  booksData.push(book);

              }
              myCache.set("featuredBooks_" + bookCategory, booksData);
              response.end(JSON.stringify(booksData));
          });
      } else {
          response.end();
      }
    }
}
