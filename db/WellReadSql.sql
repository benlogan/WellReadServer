--INSERT INTO public."Users" (ID, name, email) VALUES ('1234','blob','blob@blob.com');

--INSERT INTO public."Users" (name, email) VALUES ('blob','blob@blob.com');

--delete from public."Users" where id = '999';

--delete from public."Users";
--delete from public."SummaryText";
--delete from public."SummaryVotes";

--select name from public."Users" where oAuthToken = '160674689-KfGH80of5oem1H3oz5DoOjm22ZgzEJXVMa8a2Lvw';

--select * from public."Users";
--SELECT oAuthID, name from public."Users" where oAuthToken = '160674689-KfGH80of5oem1H3oz5DoOjm22ZgzEJXVMa8a2Lvw'

--INSERT INTO public."SummaryText" (oAuthID, ISBN, text) VALUES ('911911', '12345', 'test summary');
--select * from public."SummaryText";



--delete from public."SummaryVotes";
--select * from public."SummaryVotes";
--select summaryid, SUM(vote) from public."SummaryVotes" group by summaryid;

--select id, text, SUM(v.vote) as votes from public."SummaryText" t, public."SummaryVotes" v where t.id=v.summaryid AND ISBN='1742200524' group by id;
-- doesn't handle null votes!

--select id, text, COALESCE(SUM(v.vote),0) as votes from public."SummaryText" t LEFT OUTER JOIN public."SummaryVotes" v ON t.id=v.summaryid where t.ISBN='1742207863' group by t.id;

--select id, text, COALESCE(SUM(v.vote),0) as votes from public."SummaryText" t LEFT OUTER JOIN public."SummaryVotes" v ON t.id=v.summaryid where t.ISBN='1742200524' group by t.id order by votes DESC, id;
-- pull back the summary author too
select t.id, t.text, u.name, COALESCE(SUM(v.vote),0) as votes from public."SummaryText" t JOIN public."Users" u ON t.oauthid=u.oauthid LEFT OUTER JOIN public."SummaryVotes" v ON t.id=v.summaryid where t.ISBN='1742200524' group by t.id, u.name order by votes DESC, id;


select summaryid, SUM(vote) from public."SummaryVotes" where oauthid = '160674689' group by summaryid;


--update public."SummaryText" SET isbn='9780141187761' where isbn = '014118776X';
--delete from public."SummaryText" where isbn = '0349113467';


--how many pages do we need for our sitemap?
--select isbn from public."SummaryText" group by isbn;
SELECT COUNT(*) FROM (SELECT DISTINCT isbn FROM public."SummaryText") AS temp;
SELECT isbn AS ASIN FROM (SELECT DISTINCT isbn FROM public."SummaryText" where isbn != '') AS temp;

--Most Read!
--top 10 books (based on number of summaries and eventually votes?)
--SELECT isbn, COUNT(text) as summary_count from public."SummaryText" group by isbn order by summary_count DESC limit 10;

--Most Recent! (only count a book once, so discard older reviews)
--SELECT isbn, text, datetime from public."SummaryText" order by datetime DESC limit 20;
--SELECT DISTINCT ON (isbn) isbn, text, datetime from public."SummaryText" order by isbn, datetime;
SELECT * from (SELECT DISTINCT ON (isbn) isbn, text, datetime from public."SummaryText" order by isbn, datetime DESC) s order by datetime DESC limit 10;

-- find duplicate users!
--SELECT oauthid from public."Users" group by oauthid having count(*) > 1;
-- remove a user when I don't have a primary key!
--delete from public."Users" where datetime = '2016-12-01 15:20:54.003206+00';
--SELECT * from public."Users";
--delete from public."Users" where oauthid = '999';