var pg = require('pg');

exports.userLookup = function (oAuthID, response) {
    var client = new pg.Client(conString);
    client.connect(function(err) {
        if(err) {
            return console.error('could not connect to postgres', err);
        }
        client.query('SELECT oAuthID, name from public."Users" where oAuthId = ($1)', [oAuthID], function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }
        if(result.rowCount > 0) {
            var user = {
                "oAuthID":result.rows[0].oauthid,
                "name":result.rows[0].name
            }
            console.log("Found User! oAuthID: " + oAuthID + " name: " + user.name);
        }

        response.end(JSON.stringify(user));

        client.end();
      });
    });
}

exports.newUser = function (oAuthID, oAuthMethod, name, email, oAuthToken, oAuthTokenSecret, screenName) {
    console.log('newUser oAuthID : ' + oAuthID + ' name : ' + name + ' email : ' + email);
    var client = new pg.Client(conString);
    client.connect(function(err) {
        if(err) {
            return console.error('could not connect to postgres', err);
        }
        console.log('newUser about to execute db insert');
        client.query('INSERT INTO public."Users" (oAuthID, oAuthMethod, name, email, oAuthToken, oAuthTokenSecret, datetime, screenname) VALUES (($1),($2),($3),($4),($5),($6),now(),($7))', [oAuthID, oAuthMethod, name, email, oAuthToken, oAuthTokenSecret, screenName], function(err, result) {
            if(err) {
                return console.error('error running query', err);
            }
            client.end();
        });
    });
}
