--delete from public."SummaryText" where text = null or text = '';

select * from public."SummaryText" where text = null or text = '';

select * from public."SummaryText" where text = null or text = 'null';

select * from public."SummaryText" where char_length(text) < 10;

--delete from public."SummaryText" where id = '648';

select * from public."SummaryText";