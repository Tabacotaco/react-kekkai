import React, { Component } from 'react';

import KekkaiDataview from 'components/dataview';

import ListPanel from 'panel/list';
import FormPanel from 'panel/form';
import CardPanel from 'panel/card';
import ModalPanel from 'panel/modal';

import KekkaiToolbar from 'tool/toolbar';
import KekkaiPagerbar from 'tool/pagerbar';
import { HeaderFilter } from 'tool/header';
import { ConfirmMessage, AlertMessage } from 'tool/snackbar';

import KekkaiModel from 'types/model';
import KekkaiPager from 'types/pager';
import { TodoManager } from 'types/todo';
import { LayoutOpts } from 'types/layout';

import {
  toArray,
  isEmpty,
  $RemoteState,
  generateSort,
  generateCardOptions,
  generateListOptions,
  generateMessageOpts
} from 'types/util';

import 'fa/font-awesome.scss';
import 'scss/container.scss';


const Symbols = {
  initData: Symbol('INIT_DATA'),
  dataviews: Symbol('DATAVIEWS'),
  modalProps: Symbol('MODAL_PROPS'),
  isModalOpen: Symbol('IS_MODAL_OPEN'),
  getContainerClassName: Symbol('GET_CONTAINER_CLASS_NAME'),

  onPagerChange: Symbol('ON_PAGER_CHANGE'),
  onSorting: Symbol('ON_SORTING'),
  onRefresh: Symbol('ON_REFRESH'),
  onCloseMessage: Symbol('ON_CLOSE_MESSAGE'),
  onCloseModal: Symbol('ON_MODAL_CLOSE'),
  onModalTrigger: Symbol('ON_MODAL_TRIGGER')
};


// TODO: <KekkaiContaienr />
export default class KekkaiContainer extends Component {
  static CommitAll = Symbol('ALL_COMMIT');

  [Symbols.initData] = new KekkaiModel(this);

  constructor(props) {
    super(props);
    const { $GroupSymbol, $PagerSymbol } = this.state;

    this[$GroupSymbol] = new TodoManager(this, toArray(this.props.todos));
    this[$PagerSymbol] = new KekkaiPager(this.props.pageSize, ($type, pager) =>
      this[Symbols.onPagerChange]($type, pager)
    );
  }

  state = {
    $GroupSymbol: Symbol('GROUP'),
    $PagerSymbol: Symbol('PAGER'),

    alert: generateMessageOpts(),
    confirm: generateMessageOpts(),
    columns: ((panel) =>
      LayoutOpts.List === panel ? generateListOptions(this[Symbols.initData])
        : LayoutOpts.Card === panel ? generateCardOptions(this[Symbols.initData]) : []
    )(this.props.panel),

    data: [],
    filters: [],
    executing: { todo: null, data: null, popup: false },
    sort: generateSort(this[Symbols.initData])
  };


  // TODO: React Lifecycle
  componentWillReceiveProps(nextProps) {
    // FIXME: 1. todos 變更時, 需重新建立 TodoManager
    if ('todos' in nextProps) this.setState({
      $GroupSymbol: $RemoteState(this, this.state.$GroupSymbol)
    }, () => {
      const { $GroupSymbol } = this.state;

      this[$GroupSymbol] = new TodoManager(this, toArray(nextProps.todos));
    });

    // FIXME: 2. 當指定為 FormPanel 時, 元件將強制 pageSize 為 1, 其餘可透過開發人員自行指定 pageSize
    if ('panel' in nextProps && LayoutOpts.Form === nextProps.panel)
      this.pager.pageSize = 1;
    else if ('pageSize' in nextProps)
      this.pager.pageSize = nextProps.pageSize;

    // FIXME: 3. 當變更 LayoutOpts 時, 將重新建置 column options
    if ('panel' in nextProps) this.setState({
      columns: ((panel) =>
        LayoutOpts.List === panel ? generateListOptions(this[Symbols.initData])
          : LayoutOpts.Card === panel ? generateCardOptions(this[Symbols.initData]) : []
      )(nextProps.panel)
    });
  }


  // TODO: Readonly Properties
  get panel() { return this.props.panel || LayoutOpts.List; }

  get bgColor() { return this.props.toolBgColor || '#007bff'; }

  get txColor() { return this.props.toolTxColor || 'white'; }

  get pager() { return this[this.state.$PagerSymbol]; }

  get data() { return Array.isArray(this.state.data) ? this.state.data : []; }

  get allselectable() { return this.data.filter(data => data.$selectionOpts.visible).length > 0; }

  get allselecteds() { return this.data.filter(data => data.$checked === true); }

  get selecteds() { return this.data.filter(data => !data.$editable && data.$checked === true); }

  get editings() { return this.data.filter(data => data.$editable); }

  get executingData() { return this.state.executing.data; }

  get executingTodo() { return this.state.executing.todo; }

  get modifieds() { return this.editings.filter(data => data.$checked && data.$isDirty && data.$isValid); }


  // TODO: Methods - Could be called by refs
  setAlert(content, { type = 'info', title = '', icon = null, callbackFn = null } = {}, $callbackFn = () => { }) {
    this.setState({
      alert: { type, icon, title, content, callbackFn, show: true }
    }, $callbackFn);
  }

  setConfirm(content, { type = 'info', title = '', icon = null, callbackFn = () => { } } = {}, $callbackFn = () => { }) {
    this.setState({
      confirm: { type, icon, title, content, callbackFn, show: true }
    }, $callbackFn);
  }

  setExecuting({ todo = this.executingTodo, data = this.executingData, popup = false, keepMsg = false }, callbackFn = () => { }) {
    this.setState({
      executing: { todo, data, popup },
      ...(keepMsg ? {} : {
        alert: generateMessageOpts(),
        confirm: generateMessageOpts()
      })
    }, callbackFn);
  }

  forceUpdateRef(refs, callbackFn = () => { }) {
    const $refs = toArray(refs).filter(ref => 'string' === typeof ref && ref.trim().length > 0 && (ref in this.refs));

    if ($refs.length === 0)
      callbackFn();
    else $refs.forEach((ref, i) =>
      this.refs[ref].forceUpdate(i === ($refs.length - 1) ? callbackFn : null)
    );
  }

  add(newData, { index = 0, callbackFn = () => { } } = {}) {
    const { data = [] } = this.state;

    data.splice(index, 0, newData);
    this.setState({ data }, callbackFn);
  }

  edit(turnOn = false, { editData = null, callbackFn = () => { } }) {
    const targets = editData === null ? this.data : toArray(editData);

    targets.filter((data, i) =>
      !data.$isNew && data.$setEditable(turnOn, i < (targets.length - 1) ? undefined : callbackFn)
    );
  }

  async doRollback(showConfirm = true) {
    const $container = this;
    const targets = this.data;
    const list = [...targets];
    const modifieds = this.modifieds; // 已異動過的資料

    if (modifieds.length === 0 || !showConfirm) {
      targets.forEach(data => data.$isNew ? list.splice(list.indexOf(data), 1) : data.$undo(false));
      this.setState({ data: list });
    } else return await (new Promise((resolve) => {
      $container.setConfirm('確認放棄目前已變更之資料 ?', {
        type: 'warning',
        title: '請確認',
        icon: 'fa fa-question',
        callbackFn(isAllowed = false) {
          if (!isAllowed)
            resolve(false);
          else {
            targets.forEach(data => data.$isNew ? list.splice(list.indexOf(data), 1) : data.$undo(false));
            $container.setState({ data: list }, () => resolve());
          }
        }
      });
    }));
  }

  async doSearch(filters = [], specifyPage = 1) {
    const { filters: orif = [] } = this.state;
    const { page: orip = 1 } = this.pager;

    if (JSON.stringify(filters) !== JSON.stringify(orif))
      this.setState({ filters }, () => this.pager.page = specifyPage);
    else {
      this.pager.page = specifyPage;

      if (this.pager.page === orip)
        await this[Symbols.onRefresh]();
    }
  }

  async doCommit() {
    const { onCommit = () => { } } = this.props;
    const { executing: { todo = null, data = null } } = this.state;
    const isAll = todo === null;
    const { success = false, msg = '' } = await onCommit(
      isAll ? KekkaiContainer.CommitAll : todo.ref,
      isAll ? { modifieds: this.modifieds, removes: [] } : { target: data }
    );

    if (!isAll)
      todo.onResponse({ success, msg });
    else if (!success) this.setAlert(msg, {
      type: 'danger',
      icon: 'fa fa-exclamation-circle'
    });
    else {
      this.setAlert('已完成資料異動', {
        type: 'success',
        icon: 'fa fa-check-square-o'
      });
      this.doSearch(this.state.filters, this.pager.page);
    }
  }


  // FIXME: Private Properties
  get [Symbols.getContainerClassName]() {
    const cls = ['kekkai-container'];

    switch (this.panel) {
      case LayoutOpts.Card: cls.push('card'); break;
      case LayoutOpts.Form: cls.push('form'); break;
      case LayoutOpts.List: cls.push('list'); break;
    }
    return cls.join(' ');
  }

  get [Symbols.dataviews]() {
    return this.data.filter(data =>
      data.$hidden === false && data.$dataviewOpts && data.$dataviewOpts.type === KekkaiDataview
    ).map(data => data.$dataviewOpts);
  }

  get [Symbols.isModalOpen]() {
    const { popup = false, todo = null, data = null } = this.state.executing;

    return popup && todo !== null && data !== null;
  }

  get [Symbols.modalProps]() {
    return {
      closeByMask: false,
      alert: this.state.alert,
      confirm: this.state.confirm,
      onCloseMessage: this[Symbols.onCloseMessage],
      onTrigger: this[Symbols.onModalTrigger],
      onClose: this[Symbols.onCloseModal],
      bgColor: this.bgColor,
      txColor: this.txColor
    };
  }


  // FIXME: Private Events
  [Symbols.onPagerChange] = ($type, pager) => {
    const { data, $PagerSymbol } = this.state;

    this.setState({
      data: 'PAGE_SIZE' === $type && pager.pageSize === 100 ? [] : data,
      $PagerSymbol: $RemoteState(this, $PagerSymbol)
    }, 'TOTAL' === $type ? null : this[Symbols.onRefresh]);
  };

  [Symbols.onSorting] = (name, status) => {
    const { sort = [] } = this.state;

    if (this.editings.length > 0)
      return;
    else if (status === true) sort.push({
      name,
      dir: 'asc'
    });
    else switch (status.toLowerCase()) {
      case 'asc':
        sort.filter(({ name: $name }) => $name === name).forEach(s => s.dir = 'desc');
        break;
      case 'desc':
        sort.splice(sort.findIndex(({ name: $name }) => $name === name), 1);
        break;
    }
    this.setState({ sort }, this[Symbols.onRefresh]);
  };

  [Symbols.onRefresh] = async () => {
    const { getSearchResponse = () => { } } = this.props;
    const { filters = [], sort = [] } = this.state;
    const { data = [], total = 0 } = (await getSearchResponse({
      filters: filters.map(({ name, operator, value }) => ({ name, operator, value })),
      sort,
      page: this.pager.params
    })) || {};

    this.setState({ data: data.map(json => new KekkaiModel(this, json)) }, () => this.pager.total = total);
  };

  [Symbols.onCloseMessage] = (msgName, btn) => {
    const { type, icon, title, content, callbackFn } = this.state[msgName];

    this.setState({
      [msgName]: { type, icon, title, content, show: false }
    }, () => callbackFn instanceof Function ? callbackFn(btn) : null);
  };

  [Symbols.onCloseModal] = (btn) => {
    const { todo = null, data = null } = this.state.executing;
    const { alert } = this.state;

    this.setState({
      executing: { todo, data, popup: false },
      alert: btn === true ? alert : generateMessageOpts(),
      confirm: generateMessageOpts()
    }, btn === true ? null : () => {
      this.doRollback();
    });
  };

  [Symbols.onModalTrigger] = async (btn) => {
    const $container = this;
    const { todo, data } = this.state.executing;

    return await (new Promise((resolve) => {
      $container.setExecuting({ popup: false, todo, data }, async () => {
        const triggerRes = await (btn === true ? this.doCommit() : this.doRollback());

        if (triggerRes !== false)
          resolve(triggerRes)
        else $container.setExecuting({ popup: true, todo, data, keepMsg: true }, () => {
          resolve(triggerRes)
        });
      })
    }));
  };

  [ListPanel.onLayoutChange] = (type, name, { seq, locked = false, hidden = false, width = 0 }) => {
    const { columns = [] } = this.state;

    if ('Revert' === type) this.setState({
      columns: generateListOptions(this[Symbols.initData])
    });
    else if ('Reorder' === type) {
      const $seq = columns.filter(({ name: $name }) => $name === name).map(({ seq }) => seq)[0];

      if ($seq !== seq) {
        const opts = [].concat(columns);
        const isRear = seq > $seq;

        for (let i = Math.min($seq, seq); i <= Math.max($seq, seq); i++)
          opts[i].seq = i === $seq ? seq : isRear ? (opts[i].seq - 1) : (opts[i].seq + 1)

        this.setState({ columns: opts.sort(({ seq: s1 }, { seq: s2 }) => s1 - s2) });
      }
    } else this.setState({
      columns: columns.map(opts => {
        if (opts.name === name) switch (type) {
          case 'Locked': opts.locked = !locked; break;
          case 'Hidden': opts.hidden = !hidden; break;
          case 'Resize': opts.width = width; break;
        }
        return opts;
      }).sort(
        ({ locked: l1 = false }, { locked: l2 = false }) => l1 === l2 ? 0 : l1 === true ? -1 : 1
      ).map((opt, i) => ({
        ...opt,
        seq: i
      }))
    });
  };

  [HeaderFilter.doFilter] = (filterUID, { name, operator, value } = {}) => {
    const { filters = [] } = this.state;
    const mapping = filters.filter(({ $uid }) => $uid === filterUID)[0];

    if (mapping) {
      if (isEmpty(value))
        filters.splice(filters.indexOf(mapping), 1);
      else
        mapping.value = value;
    } else if (!isEmpty(value))
      filters.push({ $uid: filterUID, name, operator, value });

    this.doSearch(JSON.parse(JSON.stringify(filters)));
  };


  // TODO: Do React Render
  render() {
    const $container = this;
    const { $GroupSymbol, sort, columns } = this.state;
    const { owner } = this.props;
    const { bgColor, txColor } = this;

    return (
      <div className={this[Symbols.getContainerClassName]}>

        {/* FIXME: Confirm Message */}
        {this[Symbols.isModalOpen] ? null : (
          <ConfirmMessage {...this.state.confirm} onClose={this[Symbols.onCloseMessage]} />
        )}

        {/* FIXME: Toolbar (Trigger: TOOLBAR / SELECTION) */}
        <KekkaiToolbar ref="tbar" {...{ bgColor, txColor, manager: this[$GroupSymbol] }} />

        {/* FIXME: Pagerbar */}
        <KekkaiPagerbar {...{ bgColor, txColor, pager: this.pager, onRefresh: this[Symbols.onRefresh] }} />

        {/* FIXME: Data Content */}
        {(() => {
          switch (this.panel) {
            case LayoutOpts.Form: return (
              <FormPanel {...{ owner, container: this, manager: this[$GroupSymbol] }}>
                {this[Symbols.dataviews]}
              </FormPanel>
            );

            case LayoutOpts.List: return (
              <ListPanel onSorting={this[Symbols.onSorting]} {...{
                owner,
                sort,
                options: columns,
                container: this,
                manager: this[$GroupSymbol],
                selectable: this.allselectable
              }}>
                {this[Symbols.dataviews]}
              </ListPanel>
            );

            case LayoutOpts.Card: return (
              <CardPanel onSorting={this[Symbols.onSorting]} {...{
                owner,
                sort,
                options: columns,
                container: this,
                manager: this[$GroupSymbol]
              }}>
                {this[Symbols.dataviews]}
              </CardPanel>
            );
          }
        })()}

        {/* FIXME: Alert Message */}
        {this[Symbols.isModalOpen] ? null : (
          <AlertMessage {...this.state.alert} onClose={this[Symbols.onCloseMessage]} />
        )}

        {/* FIXME: Edit Modal */}
        {(({ popup = false, todo = null, data = null }) => todo === null || data === null ? null : (
          <ModalPanel ref="modal" show={popup} icon={todo.icon} title={todo.text} {...{
            ...this[Symbols.modalProps],
            btns: [{
              icon: 'fa fa-undo',
              color: 'secondary',
              text: '取消',
              value: false
            }, {
              icon: 'fa fa-floppy-o',
              color: 'primary',
              text: '儲存',
              value: true,
              disabled: () => !data.$editable || !data.$isDirty || !data.$isValid
            }]
          }}>
            <FormPanel {...{
              owner,
              container: this,
              manager: this[$GroupSymbol],
              selectable: this.allselectable
            }}>
              {data.$dataviewOpts}
            </FormPanel>
          </ModalPanel>
        ))(this.state.executing)}
      </div>
    );
  }
}