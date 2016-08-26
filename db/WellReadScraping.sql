--INSERT INTO public."SummaryText" (isbn, oauthid, datetime, text) VALUES ('0751565350','752575310399475700',now(),$$<p>Based on an original new story by J.K. Rowling, John Tiffany and Jack Thorne, a new play by Jack Thorne, <i>Harry Potter and the Cursed Child</i> is the eighth story in the Harry Potter series and the first official Harry Potter story to be presented on stage. The play will receive its world premiere in London's West End on 30th July 2016.</p><p>It was always difficult being Harry Potter and it isn't much easier now that he is an overworked employee of the Ministry of Magic, a husband, and father of three school-age children.</p><p>While Harry grapples with a past that refuses to stay where it belongs, his youngest son Albus must struggle with the weight of a family legacy he never wanted. As past and present fuse ominously, both father and son learn the uncomfortable truth: sometimes, darkness comes from unexpected places.</p><p><i>This Special Rehearsal Edition will be available to purchase until early 2017, after which a Definitive Edition of the script will go on sale.</i></p>$$);

--delete from public."SummaryText" where id = '290';

--select * from public."SummaryText";

-- remove duplicate text, can result from scraping
DELETE FROM public."SummaryText" WHERE id IN (
SELECT id FROM (SELECT id, ROW_NUMBER() OVER (partition BY text ORDER BY id) AS rnum FROM public."SummaryText") t WHERE t.rnum > 1
);

--INSERT INTO public."Users" (name, oauthid, email, oauthmethod, oauthtoken, oauthtokensecret) VALUES ('Amazon','99991','','','','');
--INSERT INTO public."Users" (name, oauthid, email, oauthmethod, oauthtoken, oauthtokensecret) VALUES ('Waterstones','99992','','','','');