import React, { Component } from 'react';

import { LayoutOpts } from 'types/layout';
import { toArray, isEmpty, getGridClassName } from 'types/util';

import 'scss/field.scss';


const Symbols = {
  defaultClassName: Symbol('DEFAULT_CLASS_NAME'),
  listClassName: Symbol('CELL_CLASS_NAME'),
  groupClassName: Symbol('GROUP_CLASS_NAME'),
  getGridClassName: Symbol('GRID_CLASS_NAME'),
  gridLabelCSS: Symbol('GRID_LABEL_CSS'),
  validCells: Symbol('VALID_CELLS'),
  getCell: Symbol('GET_CELL'),
  isDisplay: Symbol('IS_DISPLAY'),

  onHover: Symbol('ON_HOVER')
};


// TODO: <Display /> 用於設定資料輸出之外觀
export function Display(props) {
  return (
    <div className="kekkai-display">{props.children}</div>
  );
};

// TODO: <Editor /> 用於設置資料編輯時採用的輸入 Element
export function Editor({ dataModel, name, children = [], onChange = () => { } }) {
  return (
    <div className="kekkai-editor">
      {toArray(children).map(editor => (
        <editor.type key="editor" {...{
          ...editor.props,
          value: dataModel[name],
          onChange(e) {
            dataModel[name] = e.target.value;
            onChange(name, dataModel[name], dataModel);
          }
        }} />
      ))}
    </div>
  );
};


// TODO: <KekkaiField />
export default class KekkaiField extends Component {

  static isEditable({ props: { name, dataModel, children = [] } }) {
    const $editor = toArray(children).filter(child =>
      child !== null && Editor === child.type
    );

    return $editor.length === 0 ? false : (({ props: { editable = () => true } }) =>
      editable instanceof Function ? editable(dataModel[name], dataModel) : (editable === true)
    )($editor[0]) === true;
  }

  static isValid({ props: { name, dataModel, children = [] } }) {
    const $editor = toArray(children).filter(child =>
      child !== null && Editor === child.type
    );

    return $editor.length === 0 ? true : (({ props: { required = false, validation = () => true } }) =>
      required && isEmpty(dataModel[name]) ? false : validation(name, dataModel[name], dataModel)
    )($editor[0]) === true;
  }

  static getSortable({ sortable = false } = {}, { seq, dir = 'asc' } = {}) {
    const { seq: s, dir: d } = 'boolean' === typeof sortable ? {} : sortable;

    return 'boolean' === typeof sortable ? sortable : {
      seq: 'number' === typeof s && (!isNaN(s) || s === 0) ? s : seq,
      dir: 'string' === typeof d && ['asc', 'desc'].indexOf(d.toLowerCase()) ? d.toLowerCase() : dir
    };
  }


  get $owner() { return this.props.owner; }

  get $container() { return this.props.container; }

  get $dataview() { return this.props.dataview; }


  // FIXME: Private Properties
  get [Symbols.defaultClassName]() {
    const { name, dataModel, overflow = true, align = 'left' } = this.props;
    const valid = dataModel.$getValid(name);

    return [
      'kekkai-field',
      `text-${align}`,
      overflow === false && LayoutOpts.List !== this.$dataview.panel ? '' : 'text-overflow',
      valid === true ? '' : 'invalid'
    ].filter(cls => 'string' === typeof cls && cls.trim().length > 0);
  }

  get [Symbols.listClassName]() {
    return [...this[Symbols.defaultClassName]].join(' ');
  }

  get [Symbols.groupClassName]() {
    const labelSize = this.$dataview.labelSize;
    const cls = ['form-group'];

    if (LayoutOpts.Form === this.$dataview.panel
    && 'number' === typeof labelSize && !isNaN(labelSize) && labelSize > 0 && labelSize < 13) {
      cls.push('horizontal');
      cls.push(`horizontal-${labelSize}`);
    }
    return cls.join(' ');
  }

  get [Symbols.validCells]() {
    const { name, dataModel, children = [] } = this.props;
    const result = toArray(children).filter(child =>
      child !== null && [Display, Editor].indexOf(child.type) >= 0
    );

    if (result.findIndex(cell => cell.type === Display) < 0) result.push(
      <Display>{dataModel[name]}</Display>
    );
    return result;
  }

  get [Symbols.isDisplay]() {
    const { name, dataModel } = this.props;
    const editor = this[Symbols.getCell](this[Symbols.validCells], Editor);

    return dataModel.$editable && editor !== null && editor.filter(({ props: { editable = () => true } }) =>
      editable instanceof Function ? editable(dataModel[name], dataModel) : (editable === true)
    ).length === editor.length ? false : true;
  }


  // FIXME: Private Methods
  [Symbols.getCell]($cells, $type) {
    const cells = $cells.filter(cell => cell.type === $type);

    return cells.length === 0 ? null : cells;
  }

  [Symbols.getGridClassName](optionName) {
    const { [optionName]: $opts } = this.props;

    return [...this[Symbols.defaultClassName], getGridClassName($opts)].join(' ');
  }


  // FIXME: Private Events
  [Symbols.onHover] = () => {
    const { name, dataModel } = this.props;
    const valid = dataModel.$getValid(name);

    if (this.$container && valid !== true) this.$container.setAlert(valid, {
      type: 'warning',
      icon: 'fa fa-exclamation-triangle'
    });
  };


  render() {
    const $cells = this[Symbols.validCells];
    const $display = this[Symbols.getCell]($cells, Display);
    const $editor = this[Symbols.getCell]($cells, Editor);

    const { label, name, dataModel } = this.props;

    switch (this.$dataview.panel) {
      case LayoutOpts.List: return (
        <td className={this[Symbols.listClassName]} onMouseOver={this[Symbols.onHover]}>
          {this[Symbols.isDisplay] ? $display.map(cell => (
            <cell.type key="display" {...cell.props} />
          )) : $editor.map(cell => (
            <cell.type key="editor" {...cell.props} dataModel={dataModel} name={name} />
          ))}
        </td>
      );

      default: return (
        <div className={this[Symbols.getGridClassName]('form')}>
          <div className={this[Symbols.groupClassName]} onMouseOver={this[Symbols.onHover]}>
            <label>{label}</label>

            {this[Symbols.isDisplay] ? $display.map(cell => (
              <cell.type key="display" {...cell.props} />
            )) : $editor.map(cell => (
              <cell.type key="editor" {...cell.props} dataModel={dataModel} name={name} />
            ))}
          </div>
        </div>
      );
    }
  }
}