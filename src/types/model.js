import { Editor } from 'components/field';

import { Trigger } from 'types/todo';
import { UUID, toArray, isEmpty } from 'types/util';


const Symbols = {
  container: Symbol('CONTAINER'),
  dataview: Symbol('DATAVIEW'),
  viewopts: Symbol('VIEW_OPTIONS'),
  status: Symbol('STATUS'),
  values: Symbol('VALUES'),
  inits: Symbol('INITS'),
  uid: Symbol('UID'),
  refresh: Symbol('REFRESH')
};


export default class KekkaiModel {
  [Symbols.container] = null;
  [Symbols.dataview] = null;
  [Symbols.viewopts] = {};

  [Symbols.uid] = UUID();
  [Symbols.values] = {};
  [Symbols.inits] = '{}';

  [Symbols.status] = {
    checked: false,
    editable: false,
    isNew: false
  };

  constructor(container, json = {}, status = {
    checked: false,
    editable: false,
    isNew: false,
    hidden: false
  }) {
    // TODO: Binding Options
    const { checked = false, editable = false, isNew = false, hidden = false } = status;

    this[Symbols.status] = { checked, editable, isNew, hidden };
    this[Symbols.inits] = JSON.stringify(json);
    this[Symbols.values] = JSON.parse(this[Symbols.inits]);

    // TODO: Generate Data Getter/Setter
    Object.keys(this[Symbols.values]).forEach(name => Object.defineProperty(this, name, {
      get() { return this[Symbols.values][name]; },

      set(value) {
        this[Symbols.values][name] = value;
        this[Symbols.viewopts] = this[Symbols.container].props.view(this);
        this[Symbols.status].checked = this.$isValid;

        this[Symbols.refresh]();
      }
    }));

    // TODO: Build View
    this[Symbols.container] = container;
    this[Symbols.viewopts] = this[Symbols.container].props.view(this);
  }

  // TODO: Component Options
  set $dataview(value) { this[Symbols.dataview] = value; }

  get $dataviewOpts() { return this[Symbols.viewopts]; }

  get $fieldOpts() {
    const { props: { children = [] } } = this.$dataviewOpts;

    return children;
  }

  // TODO: Data Process
  get $json() { return JSON.parse(JSON.stringify(this[Symbols.values])); }

  get $uid() { return this[Symbols.uid]; }

  get $editable() { return this[Symbols.status].editable; }

  get $checked() { return this[Symbols.status].checked; }

  get $isNew() { return this[Symbols.status].isNew; }

  get $hidden() { return this[Symbols.status].hidden; }

  get $isDirty() { return this[Symbols.inits] !== JSON.stringify(this[Symbols.values]); }

  get $isValid() {
    const options = this.$fieldOpts;

    return options.filter(({ props: { name } }) => this.$getValid(name) === true).length === options.length;
  }

  get $selectionOpts() {
    const container = this[Symbols.container];
    const manager = container[container.state.$GroupSymbol];
    const isEditing = container.editings.length > 0;
    const { selectable = () => false } = this[Symbols.viewopts].props;

    return {
      checked: this.$checked,
      disabled: isEditing && (!this.$editable || !this.$isDirty || !this.$isValid),
      visible: (isEditing ? this.$editable : manager.getAllowedTodos(Trigger.SELECTION, { strict: false }).length > 0)
        && (selectable instanceof Function ? selectable(this) : selectable) === true
    };
  }

  // TODO: Methods
  $undo(sync = true) {
    this[Symbols.values] = JSON.parse(this[Symbols.inits]);
    this[Symbols.status].editable = false;
    this[Symbols.status].checked = false;
    this[Symbols.status].hidden = false;

    if (sync) this[Symbols.refresh](() => this[Symbols.container].forceUpdateRef('allSelection'));
  }

  $setHidden(hidden = false, callbackFn = () => { }) {
    const oriHidden = this.$hidden;

    this[Symbols.status].hidden = hidden === true;

    if (oriHidden !== this.$hidden)
      this[Symbols.refresh](callbackFn, true);

    return this.$hidden;
  }

  $setEditable(turnOn = false, callbackFn = () => { }) {
    const oriTurnOn = this.$editable;
    const isSelecting = this[Symbols.container].selecteds.length > 0;

    this[Symbols.status].editable = turnOn !== true ? false : this.$fieldOpts.filter(
      ({ props: { name, children = [] } }) => toArray(children).filter(
        ({ type, props: { editable } }) =>
          type === Editor && editable instanceof Function && editable(this[name], this) === true
      ).length > 0
    ).length > 0;

    if (oriTurnOn !== turnOn) this[Symbols.refresh](() => {
      if (isSelecting)
        this[Symbols.container].data.forEach(data => data.$setChecked(false));

      callbackFn();
    }, true);

    return this.$editable;
  }

  $setChecked(checked = false, callbackFn = () => { }) {
    const oriChecked = this.$checked;
    const { visible = false, disabled = true } = this.$selectionOpts;

    this[Symbols.status].checked = visible && !disabled && checked === true;

    if (oriChecked !== this.$checked) this[Symbols.refresh](() => {
      this[Symbols.container].forceUpdateRef('allSelection', callbackFn)
    }, true);
    return this.$checked;
  }

  $getValid(name) {
    const result = this.$fieldOpts.filter(({ props: { name: $name } }) =>
      $name === name
    ).map(({ props: { label, children = [] } }) =>
      toArray(children).map(({ props: { required = false, validation = () => true } }) =>
        required && isEmpty(this[name]) ? `${label} 必須輸入.` : validation(this[name], this)
      )[0]
    )[0];

    return 'string' === typeof result && result.trim().length > 0 ? result : true;
  }

  [Symbols.refresh](callbackFn = () => { }, isRefreshAll = false) {
    const targets = toArray(this[isRefreshAll ? Symbols.container : Symbols.dataview]);

    if (targets.length === 0)
      callbackFn();
    else targets.forEach((dataview, i) => dataview.forceUpdate(i !== (targets.length - 1) ? null : () => {
      if (isRefreshAll)
        callbackFn();
      else
        this[Symbols.container].forceUpdateRef(['tbar', 'modal'], callbackFn);
    }));
  }
}
