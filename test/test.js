var assert = require('assert');

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});

var books = require('./../summaries.js');
describe('Summary', function() {
  describe('#indexOf()', function() {
    it('should return a non null json response', function(done) {
      conString = process.env.DATABASE_URL;
      // not the oauth token! the ID!
      books.voteSummaryFromDB('160674689', function(httpResponse) {
      	console.log('output : ' + httpResponse);
      	assert(httpResponse != null);
      	done();
      });
    });
  });
});