import { View, ViewBase } from '@nativescript/core';

/**
 * Core has no structural pseudo-classes: `:first-child` and `:last-child` are
 * treated as states a view reports (like `:active`), and none ever does. So
 * Bootstrap's list groups, cards, button and input groups never round or trim
 * their ends. These keep `first-child`, `last-child`, `only-child` and their
 * `-of-type` forms set as pseudo-class states as children are added and
 * removed. `:nth-child()` and friends are still unsupported.
 */
function setPseudoClass(view: any, name: string, on: boolean) {
  if (on !== view.cssPseudoClasses.has(name)) {
    on ? view.addPseudoClass(name) : view.deletePseudoClass(name);
  }
}

function updateStructuralPseudoClasses(parent: ViewBase) {
  const children: ViewBase[] = [];
  const collect = (child: ViewBase) => {
    if (child.parent === parent) {
      children.push(child);
    }
    return true;
  };
  if (parent instanceof View) {
    parent.eachChildView(collect);
  } else {
    parent.eachChild(collect);
  }
  const mark = (siblings: ViewBase[], suffix: string) => {
    siblings.forEach((child, index) => {
      setPseudoClass(child, `first-${suffix}`, index === 0);
      setPseudoClass(child, `last-${suffix}`, index === siblings.length - 1);
      setPseudoClass(child, `only-${suffix}`, siblings.length === 1);
    });
  };
  mark(children, 'child');
  const byType = new Map<string, ViewBase[]>();
  for (const child of children) {
    byType.set(child.cssType, [...(byType.get(child.cssType) ?? []), child]);
  }
  byType.forEach((siblings) => mark(siblings, 'of-type'));
}

const addView = ViewBase.prototype._addView;
ViewBase.prototype._addView = function (view: ViewBase, atIndex?: number) {
  addView.call(this, view, atIndex);
  updateStructuralPseudoClasses(this);
};
const removeView = ViewBase.prototype._removeView;
ViewBase.prototype._removeView = function (view: ViewBase) {
  removeView.call(this, view);
  updateStructuralPseudoClasses(this);
};
