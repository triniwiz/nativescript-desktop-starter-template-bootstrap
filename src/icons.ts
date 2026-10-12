// Bootstrap Icons (MIT, https://icons.getbootstrap.com), as SVG asset URLs.
// Vite inlines these small icons as data URLs in both HMR and production.
// Avoid ?raw: NativeScript's HMR import rewriter drops that query.
import bootstrapFill from 'bootstrap-icons/icons/bootstrap-fill.svg';
import chevronDown from 'bootstrap-icons/icons/chevron-down.svg';
import gridOneByTwo from 'bootstrap-icons/icons/grid-1x2.svg';
import house from 'bootstrap-icons/icons/house.svg';
import list from 'bootstrap-icons/icons/list.svg';
import sliders from 'bootstrap-icons/icons/sliders.svg';
import xLg from 'bootstrap-icons/icons/x-lg.svg';

export const icons = {
  'bootstrap-fill': bootstrapFill,
  'chevron-down': chevronDown,
  'grid-1x2': gridOneByTwo,
  house,
  list,
  sliders,
  'x-lg': xLg,
};

export type IconName = keyof typeof icons;
