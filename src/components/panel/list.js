import React, { Component } from 'react';

import KekkaiDataview from 'components/dataview';
import KekkaiField from 'components/field';

import { HeaderColumn, HeaderFilter, ColumnMenu } from 'tool/header';
import { AllSelection } from 'tool/selection';

import { LayoutOpts } from 'types/layout';
import { Trigger } from 'types/todo';
import { UUID, toArray, defaultListColumnWidth } from 'types/util';

import 'scss/list.scss';


function getGroupWidth({ locked = false, selectable = false, menus = [], columns = [] }) {
  let result = !locked ? 0 : ((!selectable ? 0 : ListPanel.toolWidth) + (menus.length === 0 ? 0 : ListPanel.toolWidth));

  columns.forEach(({ width = defaultListColumnWidth }) =>
    result += width === false ? 0 : ('number' === typeof width && !isNaN(width)) ? width : (() => {
      throw new Error('Must set a Number or false to <KekkaiField list="...">.');
    })()
  );
  return result;
}

// TODO: <colgroup />
function ColumnGroup({ locked = false, selectable = false, menus = [], columns = [] }) {
  return (
    <colgroup>
      {!locked || !selectable ? null : (
        <col style={{ width: ListPanel.toolWidth }} />
      )}

      {!locked || menus.length === 0 ? null : (
        <col style={{ width: ListPanel.toolWidth }} />
      )}

      {columns.map(({ name, width = defaultListColumnWidth }) =>
        width === false ? null : (
          <col key={name} style={{
            width: 'number' === typeof width && !isNaN(width) ? width : defaultListColumnWidth
          }} />
        )
      )}
    </colgroup>
  );
}

// TODO: <table class="content" />
function ContentTable({ locked = false, selectable = false, menus = [], children = [], columns = [] }) {
  return (
    <table style={{ width: getGroupWidth({ locked, selectable, menus, columns }) }}>
      <ColumnGroup {...{ locked, selectable, menus, columns }} />

      <tbody>
        {children}
      </tbody>
    </table>
  );
}


// TODO: <table calss="header" />
class HeaderTable extends Component {
  static Body = document.body;

  state = {
    reordering: false,
    resizing: false,
    resizeOpts: null
  };

  get isResizing() { return this.state.resizeOpts !== null; }

  get resizingName() { return !this.isResizing ? null : this.state.resizeOpts.name; }

  get defaultGroupProps() {
    const { locked = false, selectable = false, menus = [], columns = [] } = this.props;

    return {
      locked,
      selectable,
      menus,
      columns: JSON.parse(JSON.stringify(columns)).map(col => {
        const { name } = col;

        if (this.isResizing && this.resizingName === name) {
          const { resizeOpts: { distance } } = this.state;

          col.width += distance;
        }
        return col;
      })
    };
  }

  get defaultHeaderColProps() {
    const { reordering } = this.state;
    const { container, onSorting, locked = false } = this.props;

    return {
      toolColor: container.bgColor,
      locked,
      reordering,
      onSorting,
      onStartReordering: this.onStartReordering,
      onReorderingDone: this.onReorderingDone,
      onStartResizing: this.onStartResizing,
      onLayoutChange: container[ListPanel.onLayoutChange]
    }
  }

  onStartReordering = (turnOn, { name, seq }) => this.setState({ reordering: turnOn ? { name, seq } : false });

  onReorderingDone = (name, seq) => {
    const { container } = this.props;

    container[ListPanel.onLayoutChange]('Reorder', name, { seq });
  };

  onStartResizing = (name, x) => {
    this.setState({ resizeOpts: { name, x, distance: 0 } }, () => {
      HeaderTable.Body.addEventListener('mouseover', this.onResizing);
      HeaderTable.Body.addEventListener('mouseup', this.onCancelResizing);
      HeaderTable.Body.addEventListener('mouseleave', this.onCancelResizing);
    });
  };

  onCancelResizing = () => {
    const { container, columns = [] } = this.props;
    const { resizeOpts: { name, distance } } = this.state;

    if (this.isResizing) this.setState({ resizeOpts: null }, () => {
      HeaderTable.Body.removeEventListener('mouseover', this.onResizing);
      HeaderTable.Body.removeEventListener('mouseup', this.onCancelResizing);
      HeaderTable.Body.removeEventListener('mouseleave', this.onCancelResizing);

      container[ListPanel.onLayoutChange]('Resize', name, {
        width: columns.filter(({ name: $name }) => $name === name).map(({ width }) => width + distance)[0]
      });
    });
  };

  onResizing = ({ clientX: $x }) => {
    if (this.isResizing) {
      const { resizeOpts: { name, x } } = this.state;

      this.setState({ resizeOpts: { name, x, distance: $x - x } });
    }
  };

  render() {
    const groupProps = this.defaultGroupProps;
    const { container, filtering = false, sort = [], menus = [], children } = this.props;
    const { columns = [] } = groupProps;
    const filters = columns.filter(({ hidden = false, filter = null }) => !hidden && filter !== null);

    return (
      <table style={{ width: getGroupWidth(this.defaultGroupProps) }}>
        <ColumnGroup {...this.defaultGroupProps} />

        <thead>
          <tr>
            {children}
            {menus.length === 0 ? null : (<th rowSpan={filtering ? 2 : 1}>&nbsp;</th>)}

            {columns.map(({ name, label, seq, filter = null, sortable, lockable, hideable, resizable, reorderable }) => (
              <HeaderColumn key={name} {...{
                ...this.defaultHeaderColProps,
                filter,
                filtering,
                name,
                label,
                seq,
                lockable,
                hideable,
                resizable,
                reorderable,
                sortable,
                sortStatus: sort.filter(({ name: $name }) => $name === name).map(({ dir }) => dir)[0] || true
              }} />
            ))}
          </tr>

          {!filtering || filters.length === 0 ? null : (
            <tr>
              {filters.map(({ name, filter, filterUID }) => (
                <HeaderFilter key={name} {...{ name, filterUID, filter, container }} />
              ))}
            </tr>
          )}
        </thead>
      </table>
    );
  }
}


// TODO: List Panel Component
export default class ListPanel extends Component {
  static onLayoutChange = Symbol('ON_LAYOUT_CHANGE');
  static onGetLockedRow = UUID();
  static defaultColumnWidth = 120;
  static toolWidth = 48;

  state = {
    dropdowning: false,
    filtering: false
  };

  get isFiltering() {
    const { container } = this.props;
    const { filtering } = this.state;

    return container.editings.length === 0 && filtering;
  }

  get defaultHeaderProps() {
    const { container, onSorting, selectable = false, sort = [] } = this.props;

    return { container, filtering: this.isFiltering, selectable, sort, onSorting };
  }

  get defaultDataviewProps() {
    const { owner, container, manager } = this.props;

    return { owner, container, manager };
  }

  getFieldChildren(fields = [], columns = []) {
    return toArray(fields).filter(({ type, key, props: { name: $name = key } }) =>
      type === KekkaiField && columns.filter(({ name }) => name === $name).length > 0
    ).sort((
      { props: { name: n1 } },
      { props: { name: n2 } },
      { seq: s1 = 0 } = columns.filter(({ name }) => name === n1)[0] || {},
      { seq: s2 = 0 } = columns.filter(({ name }) => name === n2)[0] || {}
    ) => s1 - s2);
  }

  onScroll = ({ target: { scrollLeft = 0, scrollTop = 0 } }) => {
    this.refs.unlockedH.scrollLeft = scrollLeft;
    this.refs.lockedC.scrollTop = scrollTop;
  };

  onAllSelectionRender = (allSelection) => {
    const { container } = this.props;

    container.refs.allSelection = allSelection;
  };

  onDropdownMenu = (isOpen = false) => this.setState({ dropdowning: isOpen });

  onSwitchFilter = (turnOn = false) => {
    const { options } = this.props;

    this.setState({
      filtering: turnOn && options.filter(({ hidden = false, filter = null }) =>
        !hidden && filter !== null
      ).length > 0
    });
  };

  render() {
    const { container, manager, options, selectable = false, children = [] } = this.props;
    const { dropdowning } = this.state;

    const leftCols = options.filter(({ locked, hidden }) => !hidden && locked === true);
    const rightCols = options.filter(({ locked, hidden }) => !hidden && locked !== true);

    const filtering = this.isFiltering;
    const allowedTodos = manager.getAllowedTodos(Trigger.ROW_MENU, { strict: false });

    if (rightCols.length === 0) throw new Error(
      'The count of unlocked columns must be at least one.'
    );

    return (
      <div className="kekkai-list-panel" style={{ borderColor: container.bdColor }}>
        <div className={container.editings.length > 0 ? 'editing' : ''}>

          {/* TODO: Locked Header */}
          <div ref="lockedH" className="header locked">
            <HeaderTable locked={true} menus={allowedTodos} columns={leftCols} {...this.defaultHeaderProps}>
              {!selectable ? null : <AllSelection ref={this.onAllSelectionRender} container={container} rowSpan={filtering ? 2 : 1} />}
            </HeaderTable>
          </div>

          {/* TODO: Header */}
          <div ref="unlockedH" className="header">
            <HeaderTable locked={false} columns={rightCols} {...this.defaultHeaderProps} />
          </div>

          {/* TODO: Header Menu */}
          <ColumnMenu {...{ container, options, filtering }} onSwitchFilter={this.onSwitchFilter} />
        </div>

        {/* TODO: Data Not Found */}
        {toArray(children).length > 0 ? null : (
          <div className="data-not-found">
            <div ref="lockedC" className="content locked" style={{
              width: getGroupWidth({ locked: true, selectable, columns: leftCols })
            }} />

            <div ref="unlockedC" className="content" onScroll={this.onScroll}>
              <div style={{ height: 1, width: getGroupWidth({ locked: false, selectable, columns: rightCols }) }} />
            </div>
          </div>
        )}

        {toArray(children).length === 0 ? null : (
          <div className={dropdowning ? 'dropdowning' : ''}>
            {/* TODO: Locked Content */}
            <div ref="lockedC" className="content locked">
              <ContentTable locked={true} menus={allowedTodos} columns={leftCols} selectable={selectable}>
                {toArray(children).map(view => (
                  <KekkaiDataview key={view.key} locked={true} onDropdownMenu={this.onDropdownMenu} {...{
                    ...view.props,
                    ...this.defaultDataviewProps,
                    panel: LayoutOpts.List,
                    ref: `locked-${view.props.dataModel.$uid}`
                  }}>
                    {this.getFieldChildren(view.props.children, leftCols).map(field => (
                      <KekkaiField key={field.props.name || field.key} {...field.props} locked={true} />
                    ))}
                  </KekkaiDataview>
                ))}
              </ContentTable>
            </div>

            {/* TODO: Content */}
            <div ref="unlockedC" className="content" onScroll={this.onScroll}>
              <ContentTable locked={false} columns={rightCols}>
                {toArray(children).map(view => (
                  <KekkaiDataview key={view.key} locked={false} {...{
                    ...view.props,
                    ...this.defaultDataviewProps,
                    panel: LayoutOpts.List,
                    [ListPanel.onGetLockedRow]: () => this.refs[`locked-${view.props.dataModel.$uid}`]
                  }}>
                    {this.getFieldChildren(view.props.children, rightCols).map(field => (
                      <KekkaiField key={field.props.name || field.key} {...field.props} locked={false} />
                    ))}
                  </KekkaiDataview>
                ))}
              </ContentTable>
            </div>
          </div>
        )}
      </div>
    );
  }
}