var http = require('http'); //require the 'http' module
var url = require('url'); // just for parsing request
var pg = require('pg'); 

// my stuff
var books = require('./books.js');
var users = require('./users.js');
var summaries = require('./summaries.js');

var express = require('express');
var app = express();

// https://github.com/livelycode/aws-lib
aws = require('aws-lib'); // same as GLOBAL.

prodAdv = aws.createProdAdvClient(process.env.AWS_ACCESSKEYID, process.env.AWS_SECRETACCESSKEY, process.env.AWS_ASSOCIATETAG, {"host":"webservices.amazon.co.uk"});

conString = process.env.DATABASE_URL;

// let the port be set by Heroku
var port = process.env.PORT || 1337; // locally, use 1337

// a middleware with no mount path; gets executed for every request to the app
app.use(function(req, res, next) {
    //res.setHeader('charset', 'utf-8')
    // CORS for local testing only?
    res.writeHead(200, {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'});
    //res.writeHead(200, {'Content-Type': 'application/json'});
    next();
});

// respond with "hello world" when a GET request is made to the homepage
app.get('/bookSearch', function(request, response) {
    var queryData = url.parse(request.url, true).query;
    books.amazonBookSearch(queryData.q, response);
});
/*
app.get('/movieSearch', function(request, response) {
    var queryData = url.parse(request.url, true).query;
    books.amazonMovieSearch(queryData.q, response);
});
app.get('/movieLookup', function(request, response) {
    var queryData = url.parse(request.url, true).query;
    books.amazonMovieLookupOnly(queryData.ASIN, response);
});
*/
app.get('/bookLookup', function(request, response) {
    var queryData = url.parse(request.url, true).query;
    books.amazonBookLookup(queryData.ASIN, response);
});
app.get('/topBooks', function(request, response) {
    var queryData = url.parse(request.url, true).query;
    books.amazonTopBooks(response);
});
app.get('/userLookup', function(request, response) {
    var queryData = url.parse(request.url, true).query;
    users.userLookup(queryData.oAuthToken, response);
});
app.get('/topSummaries', function(request, response) {
    var queryData = url.parse(request.url, true).query;
    summaries.topSummaries(queryData.number, response);
});
app.get('/votesLookup', function(request, response) {
    var queryData = url.parse(request.url, true).query;
    summaries.voteSummaryFromDB(queryData.oAuthID, response);
});

// POST method route
app.post('/writeSummary', function (request, response) {
    var body = '';
    request.on('data', function (data) {
        body += data;
        //console.log("Partial body: " + body);
    });
    request.on('end', function () {
        //console.log("Body: " + body);
        // body text looks like; "summary=just another summary test after star wars&isbn=1742207863"
        
        var parsedResponse = body.split('&');
        var oAuthID = parsedResponse[0].split('=')[1];
        var summaryText = decodeURIComponent(parsedResponse[1].substring(parsedResponse[1].indexOf('=') + 1));
        //var summaryText = parsedResponse[1].split(/=(.+)?/)[1]; // important, split only on first '=', otherwise you will ignore that character and everything after it, if it occurs in the body of the posted text! that reg expression can't be trusted!
        var ISBN = parsedResponse[2].split('=')[1];
        
        summaries.summaryToDB(oAuthID, ISBN, summaryText, response);

        //async db call here is fine - actually it's not, hence have completed the response after the db inset in this case - to allow for a page refresh

        //response.writeHead(200, {'Content-Type': 'text/html'});
        //response.end('post acknowledged');
    });
    //response.send('POST request to the homepage');
});

app.post('/voteSummary', function (request, response) {
    var body = '';
    request.on('data', function (data) {
        body += data;
    });
    request.on('end', function () {
        
        var parsedResponse = body.split('&');
        var oAuthID = parsedResponse[0].split('=')[1];
        var summaryID = parsedResponse[1].split('=')[1];
        var upDown = parsedResponse[2].split('=')[1];
        
        summaries.voteSummaryToDB(oAuthID, summaryID, upDown, response);

        //async db call here is fine
        //not really, because subsequent page refresh will occur before the db has necessarily updated!

        //response.end('post acknowledged');
    });
});

app.post('/writeUser', function (request, response) {
    var body = '';
    request.on('data', function (data) {
        body += data;
    });
    request.on('end', function () {
        var parsedResponse = body.split('&');
        var oAuthID = parsedResponse[0].split('=')[1];
        var oAuthMethod = parsedResponse[1].split('=')[1];
        var name = parsedResponse[2].split('=')[1];
        var email = parsedResponse[3].split('=')[1];
        var oAuthToken = parsedResponse[4].split('=')[1];
        var oAuthTokenSecret = parsedResponse[5].split('=')[1];
        users.newUser(oAuthID, oAuthMethod, name, email, oAuthToken, oAuthTokenSecret);

        //async db call here is fine

        //response.writeHead(200, {'Content-Type': 'text/html'});
        response.end('post acknowledged');
    });
});

app.listen(port, function () {
    console.log('WellRead Server - listening on port ' + port);
});