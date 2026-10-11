// Bootstrap Icons (MIT, https://icons.getbootstrap.com), as raw SVG text. Import only the
// icons you use: each one is a few hundred bytes in the bundle.
import bootstrapFill from 'bootstrap-icons/icons/bootstrap-fill.svg?raw';
import gridOneByTwo from 'bootstrap-icons/icons/grid-1x2.svg?raw';
import house from 'bootstrap-icons/icons/house.svg?raw';
import list from 'bootstrap-icons/icons/list.svg?raw';
import sliders from 'bootstrap-icons/icons/sliders.svg?raw';
import xLg from 'bootstrap-icons/icons/x-lg.svg?raw';

export const icons = {
  'bootstrap-fill': bootstrapFill,
  'grid-1x2': gridOneByTwo,
  house,
  list,
  sliders,
  'x-lg': xLg,
};

export type IconName = keyof typeof icons;
