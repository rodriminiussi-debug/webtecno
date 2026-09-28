-- New homepage section type: animated feature highlights for the hero product.
alter table public.homepage_sections drop constraint if exists homepage_sections_type_check;
alter table public.homepage_sections add constraint homepage_sections_type_check
  check (type in ('hero', 'features', 'featured_products', 'categories', 'story', 'benefits', 'newsletter'));
