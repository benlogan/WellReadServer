var pg = require('pg');

// my stuff
var books = require('./books.js');

exports.summaryToDB = function (oAuthID, ISBN, text, response) {
    console.log('summaryToDB ISBN : ' + ISBN + ' text : ' + text);
    var client = new pg.Client(conString);
    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      console.log('summaryToDB about to execute db insert');
      client.query('INSERT INTO public."SummaryText" (oAuthID, isbn, text) VALUES (($1),($2),($3))', [oAuthID, ISBN, text], function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }
        response.end('post acknowledged');
        client.end();
      });
    });
}

exports.voteSummaryToDB = function (oAuthID, summaryID, vote) {
    var client = new pg.Client(conString);
    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      console.log('voteSummaryToDB about to execute db insert');
      client.query('INSERT INTO public."SummaryVotes" (summaryID, vote, oAuthID, timestamp) VALUES (($1),($2),($3),($4))', [summaryID, vote, oAuthID, new Date()], function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }
        client.end();
      });
    });
}

// FIXME blocking call issue, just passing the response in for now to get it working!
exports.summaryFromDB = function (ISBN, response, bookJSON) {
    var client = new pg.Client(conString);
    client.connect(function(err) {
        if(err) {
            return console.error('could not connect to postgres', err);
        }
        //client.query('SELECT id, text from public."SummaryText" where ISBN = ($1)', [ISBN], function(err, result) {
        //select id, text, SUM(v.vote) as votes from public."SummaryText" t, public."SummaryVotes" v where t.id=v.summaryid AND ISBN='1742200524' group by id;
        client.query('SELECT id, text, COALESCE(SUM(v.vote),0) as votes from public."SummaryText" t LEFT OUTER JOIN public."SummaryVotes" v ON t.id=v.summaryid where ISBN = ($1) group by id order by votes DESC, id', [ISBN], function(err, result) {
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
                "text":result.rows[i].text,
                "votes":result.rows[i].votes
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

exports.topSummaries = function (number, response) {
    var client = new pg.Client(conString);
    client.connect(function(err) {
        if(err) {
            return console.error('could not connect to postgres', err);
        }
        client.query('select isbn, COUNT(text) as summary_count from public."SummaryText" group by isbn order by summary_count DESC limit ($1)', [number], function(err, result) {
        if(err) {
            return console.error('error running query', err);
        }
        var summary = [];
        var resultCount = result.rowCount;
        // need recursion here rather than iteration, to connect the response to the final callback!
        var counter = 0;
        repeater(counter);
        function repeater(i) {
            var isbn = result.rows[i].isbn;
            var summaryCount = result.rows[i].summary_count;
            books.amazonBookLookupOnly(isbn, function(result) { 
              var summaryJSON = {
                "isbn":isbn,
                "title":result.book.title,
                "author":result.book.author,
                "summary_count":summaryCount
              }
              console.log('adding to top summaries the book : ' + summaryJSON.title);  
              summary.push(summaryJSON);
              counter++;
              if(counter < resultCount) {
                repeater(counter);
              } else {
                // we are finished
                response.end(JSON.stringify(summary));
              }
            });
        }

        client.end();
        });
    });
}