alter table templates add column is_featured boolean not null default false;

update templates set is_featured = true where name in ('Key Statistic', 'Live Event');