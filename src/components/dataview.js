import React, { Component } from 'react';

import KekkaiField from 'components/field';
import ListPanel from 'panel/list';

import { NavMenu, NavBtn } from 'tool/navbar';
import { CheckboxSelection } from 'tool/selection';

import { Trigger } from 'types/todo';
import { LayoutOpts } from 'types/layout';
import { toArray, getGridClassName, bindListRowSyncEvents } from 'types/util';


const Symbols = {
  getListRowClassName: Symbol('GET_LIST_ROW_CLASS_NAME'),
  getCardRowClassName: Symbol('GET_CARD_ROW_CLASS_NAME'),

  onRelaction: Symbol('ON_RELACTION'),
  onListRowRender: Symbol('ON_LIST_ROW_RENDER'),
  onSelected: Symbol('ON_SELECTED')
};


// TODO: <KekkaiDataview />
export default class KekkaiDataview extends Component {
  static defaultLabelSize = null;

  constructor(props) {
    super(props);
    this[Symbols.onRelaction](props);
  }

  componentWillReceiveProps(nextProps) {
    this[Symbols.onRelaction](nextProps);
  }


  // TODO: Readonly Properties
  get panel() { return this.props.panel || LayoutOpts.List; }

  get labelSize() { return this.props.labelSize || KekkaiDataview.defaultLabelSize; }

  get $owner() { return this.props.owner; }

  get $container() { return this.props.container; }

  get fields() {
    const { children } = this.props;

    return toArray(children).filter(({ type }) => type === KekkaiField);
  }


  // FIXME: Private Properties
  get [Symbols.getListRowClassName]() {
    const { dataModel } = this.props;
    const cls = ['kekkai-dataview'];

    if (!dataModel.$isValid)
      cls.push('invalid-row');

    return cls.join(' ');
  }

  get [Symbols.getCardRowClassName]() {
    const { dataModel, viewSize } = this.props;
    const cls = ['kekkai-dataview', 'container', getGridClassName(viewSize)];

    if (!dataModel.$isValid)
      cls.push('invalid-row');

    return cls.join(' ');
  }


  // FIXME: Private Methods
  [Symbols.onListRowRender] = (row = null) => {
    const { [ListPanel.onGetLockedRow]: onGetLockedRow } = this.props;
    const lockedRow = onGetLockedRow();

    if (lockedRow && row !== null) {
      const { listrow } = lockedRow.refs;

      row.style.height = `${Math.max(row.clientHeight, listrow.clientHeight, 38)}px`;
      listrow.style.height = row.style.height;

      bindListRowSyncEvents(listrow, row);
      this[Symbols.onRelaction](this.props);
    }
  };

  [Symbols.onRelaction]({
    dataModel,
    locked = this.props.container,
    [ListPanel.onGetLockedRow]: onGetLockedRow = this.props[ListPanel.onGetLockedRow]
  }) {
    if (LayoutOpts.List !== this.panel && onGetLockedRow)
      throw new Error('Only panel(list) could set event(onGetLockedRow).');
    else if (!dataModel)
      throw new Error('<KekkaiDataview /> must be binding props(dataModel).');
    else if (LayoutOpts.List === this.panel && !locked)
      dataModel.$dataview = [onGetLockedRow(), this];
    else if (LayoutOpts.List !== this.panel)
      dataModel.$dataview = this;
  }


  // FIXME: Private Events
  [Symbols.onSelected] = (checked) => {
    const { dataModel, onSelected = () => { } } = this.props;

    dataModel.$setChecked(checked, () => onSelected(dataModel.$checked, dataModel));
  };


  // TODO: Do React Render
  render() {
    const { owner, container, manager, dataModel, locked = false, onDropdownMenu = () => { } } = this.props;
    const { bgColor, txColor } = container;

    const dbclickTodos = manager.getAllowedTodos(Trigger.ROW_DBCLICK, { targetData: dataModel });
    const menuTodos = locked || LayoutOpts.Card === this.panel ? manager.getAllowedTodos(Trigger.ROW_MENU, { targetData: dataModel }) : [];

    switch (this.panel) {
      case LayoutOpts.Form: return (
        <div className="kekkai-dataview row">
          {this.fields.map((field, i) => <KekkaiField key={field.props.name || field.key} {...{
            ...field.props,
            dataModel,
            owner,
            container,
            dataview: this,
            sortable: KekkaiField.getSortable(field.props, { seq: i })
          }} />)}
        </div>
      );

      case LayoutOpts.Card: return (
        <div className={this[Symbols.getCardRowClassName]}>
          <div className="card container">
            {menuTodos.length === 0 ? null : (
              <div className="card-header">
                <NavMenu bgColor="#f7f7f7" txColor="#5c6b77" align="right" onOpen={() => onDropdownMenu(true)} onClose={() => onDropdownMenu(false)} display={(
                  <i className="fa fa-bars" />
                )}>
                  {menuTodos.map(todo => (
                    <NavBtn key={todo.uuid} icon={todo.icon} onClick={() => todo.execute(
                      Trigger.SELECTION === todo.trigger ? { list: [dataModel] } : { data: dataModel }
                    )}>
                      {todo.text}
                    </NavBtn>
                  ))}
                </NavMenu>
              </div>
            )}

            <div className="card-body row">
              {this.fields.map((field, i) => <KekkaiField key={field.props.name || field.key} {...{
                ...field.props,
                dataModel,
                owner,
                container,
                dataview: this,
                sortable: KekkaiField.getSortable(field.props, { seq: i })
              }} />)}
            </div>
          </div>
        </div>
      );

      case LayoutOpts.List: return (
        <tr {...{
          className: toArray([this[Symbols.getListRowClassName], dbclickTodos.length === 0 ? '' : 'row-pointer']).join(' '),
          ref: locked ? 'listrow' : this[Symbols.onListRowRender],
          onDoubleClick: dbclickTodos.length === 0 ? null : () => dbclickTodos[0].execute({ data: dataModel })
        }}>
          {!locked || !container.allselectable ? null : (
            <td className="row-selection">
              <CheckboxSelection {...{
                ...dataModel.$selectionOpts,
                color: bgColor,
                onChange: this[Symbols.onSelected]
              }} />
            </td>
          )}

          {menuTodos.length === 0 ? null : (
            <td className="row-menu">
              <NavMenu bgColor="#f7f7f7" txColor="#5c6b77" onOpen={() => onDropdownMenu(true)} onClose={() => onDropdownMenu(false)} display={(
                <i className="fa fa-bars" />
              )}>
                {menuTodos.map(todo => (
                  <NavBtn key={todo.uuid} icon={todo.icon} onClick={() => todo.execute({ data: dataModel })}>
                    {todo.text}
                  </NavBtn>
                ))}
              </NavMenu>
            </td>
          )}

          {this.fields.map((field, i) => <KekkaiField key={field.props.name || field.key} {...{
            ...field.props,
            dataModel,
            owner,
            container,
            dataview: this,
            sortable: KekkaiField.getSortable(field.props, { seq: i })
          }} />)}
        </tr>
      );
    }
  }
}