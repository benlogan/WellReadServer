// try browse node - amazon video (3010085031), to see if something is available on prime video for viewing now;
// http://stackoverflow.com/questions/17131843/aws-api-for-whether-a-video-is-available-on-prime-instant-video
// also;
// http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CHAP_response_elements.html#IsEligibleForPrime

// problem is I can't find out if its rentable - I just get the buy price (and only cheapest, for SD) - would need scraping

// http://127.0.0.1:1337/movieSearch/?q=daddy's
exports.amazonMovieSearch = function (searchString, response) {
    console.log('About to execute movie search for : ' + searchString);
    var options = {SearchIndex: "UnboxVideo", Keywords: searchString, ResponseGroup: "Large"};
    
    //http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html
    prodAdv.call("ItemSearch", options, function(err, result) {
        if(err) {
            console.error('Amazon Movie Search Problem', err);
            response.end(null);
        } else {
            //response.end(JSON.stringify(result));
            
            var movies = [];
            
            //iterate Item, we only care about the top 5
            for(var index in result.Items.Item) {
                var item = result.Items.Item[index];
                
                //return the ASIN, but call it the ISBN
                //also return the Title from the ItemAttributes
                
                var JSONObj = { "title":item.ItemAttributes.Title, "itempage":item.ItemAttributes.ItemPage, "availability":item.ItemAttributes.Availability };
                movies.push(JSONObj);
            }
        
            response.end(JSON.stringify(movies));
        }
    })
}

// http://127.0.0.1:1337/movieLookup/?ASIN=B019EQ8KC0
//B019YHGOZO (US)
//B019EQ8KC0 (UK)
exports.amazonMovieLookupOnly = function(ASIN, response) {
    var options = {ResponseGroup: "ItemAttributes,Images,Large,OfferFull", ItemId : ASIN};
    
    prodAdv.call("ItemLookup", options, function(err, result) {
        if(err) {
            console.error('Amazon Movie Lookup Problem', err);
        }
        var item = result.Items.Item;

        var imageURL = null;
        if(item.MediumImage) {
            imageURL = item.MediumImage.URL
        }

        var movie = { 
            "movie": {
                "title":item.ItemAttributes.Title,
                "author":item.ItemAttributes.Author, 
                "publisher":item.ItemAttributes.Publisher, 
                "isbn":item.ItemAttributes.ISBN,
                "image":imageURL
            }
        };
        response.end(JSON.stringify(movie));
    })
}