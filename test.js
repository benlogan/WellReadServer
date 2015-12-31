var http = require('http'); //require the 'http' module
var url = require('url'); // just for parsing request
var pg = require('pg'); 

var conString = "DONT COMMIT"

readFromDB('1742207863');
//writeToDB('1742207863');
//jsonWriteTest();
//stringSplitTest();

function readFromDB(ISBN) {
    var client = new pg.Client(conString);
    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      client.query('SELECT text from public."SummaryText" where ISBN = ($1)', [ISBN], function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }
        //console.log(result.rows[0].text);
        //console.log(result.rows[1]);
        //console.log(result.rows[2]);

        for (var i = 0; i < result.rowCount; i++) {
            console.log("ITERATING : " + result.rows[i].text);
        }

        client.end();
      });
    });
}

function writeToDB(ISBN) {
    var client = new pg.Client(conString);
    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      client.query('INSERT INTO public."SummaryText" (isbn, text) VALUES (($1),($2))', [ISBN, 'unit test text'], function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }
        //console.log(result.rows[0]);
        client.end();
      });
    });
}

function jsonWriteTest() {
    var JSONObj = { 
                "book": {
                        "title":"title 123",
                        "author":"Joe Blogs", 
                        "publisher":"pub", 
                        "isbn":"67546549",
                        "image":"a url"
                    },
                "summary":{
                    "text":"summary text, yes indeedy"
                    }
                };
    console.log("JSON STRING:");
    console.log(JSON.stringify(JSONObj));
}

function stringSplitTest() {
    var body = "summary=just another summary test after star wars&isbn=1742207863";
    var parsedResponse = body.split('&');
    var summaryText = parsedResponse[0].split('=')[1];
    var ISBN = parsedResponse[1].split('=')[1];
    console.log("summaryText : " + summaryText);
    console.log("ISBN : " + ISBN);
}

console.log('TEST COMPLETE!');