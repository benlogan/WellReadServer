--INSERT INTO public."Users" (ID, name, email) VALUES ('1234','blob','blob@blob.com');

--INSERT INTO public."Users" (name, email) VALUES ('blob','blob@blob.com');

--delete from public."Users" where id = '999';

delete from public."Users";
delete from public."SummaryText";
delete from public."SummaryVotes";

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



--top 10 books (based on number of summaries and votes?)
--select isbn, COUNT(text) as summary_count from public."SummaryText" group by isbn order by summary_count DESC limit 10;




select summaryid, SUM(vote) from public."SummaryVotes" where oauthid = '160674689' group by summaryid;



--select * from public."SummaryText";
--select isbn, count(isbn) as summaryTotals from public."SummaryText" group by isbn order by summaryTotals DESC limit 5;
--or, I'd already written this!
select isbn, COUNT(text) as summary_count from public."SummaryText" group by isbn order by summary_count DESC limit 5;