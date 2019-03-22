import React, { Component } from 'react';

import KekkaiField, { Editor } from 'components/field';
import ListPanel from 'panel/list';
import { NavMenu, MenuDivider, NavBtn } from 'tool/navbar';

import KekkaiModel from 'types/model';

import { DropdownColors } from 'types/layout';
import { toArray, isEmpty } from 'types/util';


const { bdColor, bgColor, txColor } = DropdownColors;

export class ColumnMenu extends Component {

  get isFilterable() {
    const { container, options = [] } = this.props;
    const $p = container.pager;

    return $p.total > 0 && container.editings.length === 0 && options.filter(
      ({ hidden = false, filter = null }) => !hidden && filter !== null
    ).length > 0;
  }

  render() {
    const { container, filtering = false, options = [], onSwitchFilter = () => { } } = this.props;

    return (
      <div className="header locked menu">
        <NavMenu align="right" {...{ bdColor, bgColor, txColor }} display={(
          <i className="fa fa-bars" />
        )}>
          {[
            (<NavBtn key="undo" icon="fa fa-undo" onClick={() => container[ListPanel.onLayoutChange]('Revert')}>
              還原設置
            </NavBtn>),

            (<MenuDivider key="divider-up" color={txColor} />),

            ...options.filter(({ label }) => 'string' === typeof label).map(({ name, filter = null, hideable, hidden, label }) => (
              <NavBtn key={name} {...{
                icon: hidden ? 'fa fa-square-o' : 'fa fa-check-square',
                disabled: !hideable || (filtering && filter !== null),
                onClick: () => container[ListPanel.onLayoutChange]('Hidden', name, { hidden })
              }}>
                {label}
              </NavBtn>
            )),

            !this.isFilterable ? null : (<MenuDivider key="divider-down" color={txColor} />),

            !this.isFilterable ? null : (
              <NavBtn key="filter" icon={filtering ? 'fa fa-toggle-on' : 'fa fa-toggle-off'} onClick={() => onSwitchFilter(!filtering)}>
                {filtering ? '關閉過濾' : '開啟過濾'}
              </NavBtn>
            )
          ]}
        </NavMenu>
      </div>
    );
  }
}


export class HeaderFilter extends Component {
  static doFilter = Symbol('DO_FILTER');

  state = {
    filterData: new KekkaiModel(this.props.container, {
      [this.props.name]: this.initFilterVal
    })
  };

  get initFilterVal() {
    const { name, container: { state: { filters = [] } } } = this.props;

    return filters.filter(({ name: $name }) => $name === name).map(({ value }) => value)[0] || '';
  }

  get currFilterVal() {
    const { name } = this.props;
    const { filterData } = this.state;

    return filterData[name];
  }

  onChange = () => this.forceUpdate();

  doClear = () => {
    const { name } = this.props;
    const { filterData } = this.state;

    filterData[name] = '';
    this.forceUpdate(() => this.doFilter());
  };

  doFilter = () => {
    const { container, name, filterUID, filter } = this.props;

    container[HeaderFilter.doFilter](filterUID, { name, operator: filter, value: this.currFilterVal });
  };

  render() {
    const { name } = this.props;
    const { filterData } = this.state;

    return (
      <th className="filter-header">
        <form onSubmit={this.doFilter} onKeyDown={({ keyCode }) => 27 === keyCode ? this.doClear() : null}>
          {filterData.$fieldOpts.filter(
            ({ props: { name: $name } }) => $name === name
          ).map(({ props: { children = [] } }) => {
            const editors = toArray(children).filter(({ type }) => type === Editor);

            if (editors.length === 0)
              throw new Error('Filtering must be set <Editor />.');

            return editors.map(({ props }) => (
              <Editor key="editor" {...{ ...props, name, dataModel: filterData, editable: true }} onChange={this.onChange} />
            ))[0];
          })}

          <a className="kekkai-nav-btn" disabled={isEmpty(this.currFilterVal)} onClick={isEmpty(this.currFilterVal) ? null : this.doFilter}>
            <i className="fa fa-filter" />
          </a>

          <a className="kekkai-nav-btn" disabled={isEmpty(this.currFilterVal)} onClick={isEmpty(this.currFilterVal) ? null : this.doClear}>
            <i className="fa fa-eraser" />
          </a>
        </form>
      </th>
    );
  }
}


export class HeaderColumn extends Component {
  static HoveringClassName = 'hovering';

  state = {
    resizing: false,
    reordering: false
  };

  get sortable() {
    const { sortable } = this.props;

    return KekkaiField.getSortable({ sortable }) !== false;
  }

  get className() {
    if (!this.sortable)
      return '';
    else {
      const cls = ['sortable'];
      const { sortStatus = true } = this.props;

      if (sortStatus !== true)
        cls.push(sortStatus);

      return cls.join(' ');
    }
  }

  get menu() {
    const {
      name,
      filter,
      filtering,
      lockable,
      locked,
      hideable,
      onLayoutChange = () => { }
    } = this.props;

    return !lockable && !hideable ? null : (
      <NavMenu align="right" {...{ bdColor, bgColor, txColor }} display={(
        <i className="fa fa-angle-down" />
      )}>
        {!lockable ? null : (
          <NavBtn key="locked" icon={locked ? 'fa fa-unlock-alt' : 'fa fa-lock'} onClick={() =>
            onLayoutChange('Locked', name, { locked })
          }>
            {locked ? '解鎖' : '鎖定'}
          </NavBtn>
        )}

        {!hideable ? null : (
          <NavBtn key="hidden" icon="fa fa-eye-slash" disabled={filtering && filter !== null} onClick={() =>
            onLayoutChange('Hidden', name, { hidden: false })
          }>
            隱藏
          </NavBtn>
        )}
      </NavMenu>
    );
  }

  onSorting = () => {
    if (this.sortable) {
      const { name, sortStatus = true, onSorting = () => { } } = this.props;

      onSorting(name, sortStatus);
    }
  };

  onStartResizing = ({ clientX: x }) => {
    const { name, onStartResizing = () => { } } = this.props;

    this.setState({ resizing: true }, () => onStartResizing(name, x));
  };

  onStartReordering = ({ }, turnOn = false) => {
    const { name, seq, onStartReordering = () => { } } = this.props;

    onStartReordering(turnOn, { name, seq });
  };

  onDragOver = (e, isHover = false) => {
    const { name, reordering = false } = this.props;
    const { name: reordName } = !reordering ? {} : reordering;

    if (reordName !== name)
      e.preventDefault();

    e.target.classList[isHover ? 'add' : 'remove'](HeaderColumn.HoveringClassName);
  };

  onDrop = ({ }, isBefore = false) => {
    const { seq, reordering = false, onReorderingDone = () => { } } = this.props;
    const { name: $name, seq: $seq } = !reordering ? {} : reordering;

    if (seq > $seq)
      onReorderingDone($name, isBefore ? (seq - 1) : seq);
    else if (seq < $seq)
      onReorderingDone($name, isBefore ? seq : (seq + 1));
  };

  render() {
    const { label, name, filter, filtering, resizable, reorderable = false, reordering = false } = this.props;
    const { name: reordName } = !reordering ? {} : reordering;

    return (
      <th className={this.className} rowSpan={filtering && filter === null ? 2 : 1}>
        {!reordering || reordName === name ? (
          <div draggable={reorderable} onDragStart={(e) => this.onStartReordering(e, true)} onDragEnd={(e) => this.onStartReordering(e, false)}>
            {/* TODO: Label & Sorting */}
            <span onClick={this.onSorting}>{label}</span>

            {/* TODO: Column Menu (For locked / hidden) */}
            {this.menu}
          </div>
        ) : (
            <div className="allowed-reordering">
              <div className="before" onDragOver={(e) => this.onDragOver(e, true)} onDragLeave={(e) => this.onDragOver(e, false)} onDrop={(e) => this.onDrop(e, true)} />
              <div className="behind" onDragOver={(e) => this.onDragOver(e, true)} onDragLeave={(e) => this.onDragOver(e, false)} onDrop={(e) => this.onDrop(e, false)} />
              <span onClick={this.onSorting}>{label}</span>
            </div>
          )}

        {'string' !== typeof label || !resizable ? null : (
          <div className="resizable" onMouseDown={this.onStartResizing} />
        )}
      </th>
    );
  }
}