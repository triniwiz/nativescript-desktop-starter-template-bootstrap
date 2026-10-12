import { Color, FixedLength, Length, PercentLength, Style, View, ViewBase } from '@nativescript/core';
import { KeyframeAnimation, KeyframeAnimationInfo } from '@nativescript/core/ui/animation/keyframe-animation';
import { cssUnits } from '@triniwiz/nativescript-masonkit';

/**
 * Workarounds for gaps Bootstrap runs into at runtime. Each can go once the
 * fix lands in `@nativescript/core` or MasonKit.
 */

/**
 * Core's CSS variable resolution crashes on forward references.
 *
 * Custom properties may refer to ones declared after them (`--a: var(--b)`
 * before `--b`), which Bootstrap does throughout. Core resolves them in passes
 * (`settleCssVariables`), but the first pass stores core's `unsetValue`
 * sentinel for `--a`, and the next pass calls `.trim()` on it while reading
 * `var(--a)`. The TypeError aborts styling for the whole view, so the app
 * renders blank.
 *
 * Such a variable is read as if this view didn't declare it, so an ancestor's
 * value shows through, and the next pass picks up the real one. That also
 * keeps a mirror like `--ns-current-color: var(--bs-card-color)` (see
 * postcss-bootstrap-compat.mjs) from hiding the inherited colour when
 * `--bs-card-color` is `inherit`.
 */
const getCssVariable = Style.prototype.getCssVariable;
Style.prototype.getCssVariable = function (name: string) {
  const value = getCssVariable.call(this, name);
  if (typeof value === 'string' || value == null) {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  const parent = this.view?.parent;
  return parent?.style ? parent.style.getCssVariable(name) : null;
};

/**
 * Core's length parsers read `0.5rem` as `parseFloat('0.5rem')`, i.e. 0.5 dp.
 * MasonKit resolves rem itself for most properties, but `gap`, `row-gap` and
 * `column-gap` go through core's `PercentLength.parse`, so Bootstrap's
 * `gap-*` utilities collapsed to nothing. `em` is treated as `rem` here, as
 * these parsers don't know the element's font size.
 */
const REM = /^\s*(-?\d*\.?\d+)r?em\s*$/i;
for (const lengths of [PercentLength, FixedLength, Length]) {
  const parse = lengths.parse;
  lengths.parse = ((value: any) => {
    const rem = typeof value === 'string' ? REM.exec(value) : null;
    return rem ? parseFloat(rem[1]) * cssUnits.rootFontSize : parse(value);
  }) as typeof parse;
}

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

/**
 * Core plays the first keyframe interval as a jump and holds the last keyframe's
 * values, so keyframes without a 0% or 100% keyframe don't animate as in CSS,
 * where the element's own values fill in. Bootstrap's spinner, `to {
 * transform: rotate(360deg) }`, jumped to 360° (0°) and never turned, and
 * `spinner-grow`, which stops at 50%, never faded back out. The missing ends
 * are added when the animation is built and filled with the view's current
 * values when it plays.
 */
const implicitEnds = Symbol('implicitEnds');

const keyframeAnimationFromInfo = KeyframeAnimation.keyframeAnimationFromInfo;
KeyframeAnimation.keyframeAnimationFromInfo = function (info: KeyframeAnimationInfo) {
  const keyframes = info?.keyframes;
  if (!keyframes?.length || info.isReverse) {
    return keyframeAnimationFromInfo.call(this, info);
  }
  const from = keyframes[0].duration > 0;
  const to = keyframes[keyframes.length - 1].duration < 1;
  if (!from && !to) {
    return keyframeAnimationFromInfo.call(this, info);
  }
  const padded = Object.assign(new KeyframeAnimationInfo(), info, {
    keyframes: [...(from ? [{ duration: 0, declarations: [] }] : []), ...keyframes, ...(to ? [{ duration: 1, declarations: [] }] : [])],
  });
  const animation = keyframeAnimationFromInfo.call(this, padded);
  if (animation) {
    (animation as any)[implicitEnds] = { from, to };
  }
  return animation;
};

// The view's own value for each property core's keyframes animate.
function baseKeyframeValue(view: View, property: string): unknown {
  switch (property) {
    case 'rotate':
      return { x: view.rotateX ?? 0, y: view.rotateY ?? 0, z: view.rotate ?? 0 };
    case 'scale':
      return { x: view.scaleX ?? 1, y: view.scaleY ?? 1 };
    case 'translate':
      return { x: view.translateX ?? 0, y: view.translateY ?? 0 };
    case 'opacity':
      return view.opacity ?? 1;
    case 'backgroundColor':
      return view.backgroundColor ?? new Color(0, 0, 0, 0);
    default:
      // width and height may be `auto`, which can't be animated from.
      return undefined;
  }
}

const KEYFRAME_PROPERTIES = ['rotate', 'scale', 'translate', 'opacity', 'backgroundColor'];

const play = KeyframeAnimation.prototype.play;
KeyframeAnimation.prototype.play = function (this: any, view: View) {
  const ends = this[implicitEnds];
  if (ends && !ends.filled) {
    ends.filled = true;
    const segments: any[] = this.animations;
    const animated = KEYFRAME_PROPERTIES.filter((name) => segments.some((segment) => name in segment));
    const fill = (segment: any) => {
      for (const name of animated) {
        const value = baseKeyframeValue(view, name);
        if (value !== undefined) {
          segment[name] = value;
        }
      }
    };
    if (ends.from) {
      fill(segments[0]);
    }
    if (ends.to) {
      fill(segments[segments.length - 1]);
    }
  }
  return play.call(this, view);
};
