-- The procedural 3D product viewer was replaced by photographic renders.
update public.products set animation = 'float' where animation = 'airpods-3d';
alter table public.products drop constraint if exists products_animation_check;
alter table public.products add constraint products_animation_check check (animation in ('none', 'float'));
