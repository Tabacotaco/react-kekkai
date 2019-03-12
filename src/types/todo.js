import { UUID, toArray } from 'types/util';
import { LayoutOpts } from 'types/layout';

import KekkaiModel from 'types/model';


const Symbols = {
  tgToolbar: Symbol('TG_TOOLBAR'),
  tgSelection: Symbol('TG_SELECTION'),
  tgRowMenu: Symbol('TG_ROW_MENU'),
  tgRowDbclick: Symbol('TG_ROW_DBCLICK'),

  emNone: Symbol('EM_NONE'),
  emInline: Symbol('EM_INLINE'),
  emPopup: Symbol('EM_POPUP'),

  ref: Symbol('REF'),
  uuid: Symbol('UUID'),
  container: Symbol('CONTAINER'),
  showMessage: Symbol('SHOW_MESSAGE'),
  options: Symbol('OPTIONS'),
  todos: Symbol('TODOS'),
  getTargetData: Symbol('GET_TARGET_DATA')
};


// TODO: Enum Options
class TriggerEnum {

  get TOOLBAR() { return Symbols.tgToolbar; }

  get SELECTION() { return Symbols.tgSelection; }

  get ROW_MENU() { return Symbols.tgRowMenu; }

  get ROW_DBCLICK() { return Symbols.tgRowDbclick; }
}

class EditingModeEnum {

  get NONE() { return Symbols.emNone; }

  get INLINE() { return Symbols.emInline; }

  get POPUP() { return Symbols.emPopup; }
}

export const Trigger = new TriggerEnum();

export const EditingMode = new EditingModeEnum();


// TODO: KekkaiTodo
export default class KekkaiTodo {
  [Symbols.uuid] = UUID();
  [Symbols.ref] = null;
  [Symbols.container] = null;
  [Symbols.options] = {};

  constructor({
    ref,
    concat,
    text,
    icon,
    trigger = Trigger.TOOLBAR,
    editingMode = EditingMode.NONE,
    executable = () => true,
    execute = () => { },
    onSuccess = () => { },
    confirmMsg = { type: '', icon: '', title: '', content: '' },
    responseMsg = { type: '', icon: '', title: '', content: '' }
  }) {
    if ('string' !== typeof ref || ref.trim().length === 0)
      throw new Error('KekkaiTodo\'ref is required.');

    this[Symbols.ref] = ref;

    this[Symbols.options] = {
      // FIXME: Layout
      concat, text, icon, trigger,

      // FIXME: Executing Options
      editingMode, executable, confirmMsg, execute,

      // FIXME: Request Options
      onSuccess, responseMsg
    };
  }

  set container(value) { this[Symbols.container] = value; }

  get uuid() { return this[Symbols.uuid]; }
  get ref() { return this[Symbols.ref]; }
  get concat() { return this[Symbols.options].concat || null; }
  get text() { return this[Symbols.options].text; }
  get icon() { return this[Symbols.options].icon; }
  get trigger() { return this[Symbols.options].trigger; }
  get editingMode() { return this[Symbols.options].editingMode; }


  isExecutable({ data = null, list = [] } = {}) {
    const container = this[Symbols.container];
    const executableFn = this[Symbols.options].executable;

    return executableFn({ data, list }, container) === true;
  }

  execute({ data = null, list = [] } = {}) {
    const container = this[Symbols.container];
    const executeFn = this[Symbols.options].execute;
    const { show, type, icon, title, content } = this[Symbols.showMessage]('confirmMsg');

    if (!this.isExecutable({ data, list }))
      return;
    else if (!show)
      executeFn({ data, list }, container);
    else container.setConfirm(content, {
      type,
      icon,
      title,
      callbackFn(isAllowed = false) {
        if (isAllowed)
          executeFn({ data, list }, container);
        else {
          container.data.forEach(data => data.$undo(false));
          container.forceUpdate();
        }
      }
    });
  }

  onResponse({ success = false, msg = '' }) {
    const container = this[Symbols.container];

    try {
      const { onSuccess = () => { } } = this[Symbols.options];
      const { show, type, icon, title, content } = this[Symbols.showMessage]('responseMsg');

      if (!success)
        throw new Error(msg);
      else container.setState({
        executing: { todo: null, data: null },
        alert: { show, type, icon, title, content }
      }, () => {
        onSuccess({ success, msg }, container);
      });
    } catch (e) {
      console.error(e);

      container.setAlert('系統發生預期外之錯誤.', {
        type: 'danger',
        icon: 'fa fa-exclamation-circle',
        title: 'System Error'
      });
    }
  }

  [Symbols.showMessage](optionName) {
    const { type = '', icon = '', title = '', content = '' } = this[Symbols.options][optionName];

    return {
      show: 'string' === typeof content && content.trim().length > 0,
      type, icon, title, content
    };
  }
}


// TODO: Todo Group Manager
export class TodoManager {
  [Symbols.container] = null;
  [Symbols.todos] = [];

  constructor(container, todos = []) {
    if (todos.filter(todo => Trigger.ROW_DBCLICK === todo.trigger).length > 1)
      throw new Error('Only could set 1 Trigger(ROW_DBCLICK).');

    this[Symbols.container] = container;

    this[Symbols.todos] = todos.map(todo => {
      todo.container = container;

      return todo;
    });
  }

  get container() { return this[Symbols.container]; }

  get todos() { return this[Symbols.todos]; }

  getAllowedTodos(trigger, { strict = true, targetData = null } = {}) {
    const container = this[Symbols.container];
    const isSelecting = container.selecteds.length > 0;
    const isEditing = container.editings.length > 0;
    const { data, list } = this[Symbols.getTargetData](trigger, { strict, targetData });

    switch (container.panel) {
      // TODO: FormPanel 模式下, 除原本的 TOOLBAR 判斷邏輯不變, 其餘動作皆視為已選取之狀態
      case LayoutOpts.Form: return Trigger.TOOLBAR !== trigger ? [] : this.todos.filter(todo => {
        return !isEditing && todo.isExecutable([Trigger.TOOLBAR, Trigger.SELECTION].indexOf(todo.trigger) >= 0 ?
          { data: null, list } : { data, list: [] }
        ) === true;
      });

      // TODO: ListPanel 模式下, 所有動作的 Trigger 皆按照各自的邏輯進行判斷
      case LayoutOpts.List: return this.todos.filter(todo => trigger === todo.trigger).filter(todo => {
        switch (todo.trigger) {
          case Trigger.TOOLBAR:
            return !isSelecting && todo.isExecutable({ data, list }) === true;
          case Trigger.SELECTION:
            return (!strict || isSelecting) && todo.isExecutable({ data, list }) === true;
          default:
            return !isSelecting && !isEditing && (strict ? todo.isExecutable({ data, list }) === true
              : list.filter($data => todo.isExecutable({ data: $data, list: [] }) === true).length > 0);
        }
      });

      // TODO: CardPanel 模式下, ROW_DBCLICK 將視為 ROW_MENU, 其餘動作皆按照各自的邏輯進行判斷
      case LayoutOpts.Card: return [Trigger.SELECTION, Trigger.ROW_DBCLICK].indexOf(trigger) >= 0 ? [] : this.todos.filter(todo =>
        trigger === ([Trigger.SELECTION, Trigger.ROW_DBCLICK].indexOf(todo.trigger) >= 0 ? Trigger.ROW_MENU : todo.trigger)
      ).filter(todo => {
        switch (todo.trigger) {
          case Trigger.TOOLBAR:
            return todo.isExecutable({ data, list }) === true;
          case Trigger.SELECTION:
            return !isEditing && todo.isExecutable({ data: null, list }) === true;
          default:
            return !isEditing && todo.isExecutable({ data, list: [] }) === true;
        }
      });

      default: return [];
    }
  }

  [Symbols.getTargetData](trigger, { strict = true, targetData = null }) {
    const container = this[Symbols.container];
    const data = targetData || container.executingData;

    switch (container.panel) {
      case LayoutOpts.Form: switch (trigger) {
        case Trigger.TOOLBAR:
        case Trigger.SELECTION:
          return { data, list: container.data };
        default:
          return { data, list: [] };
      }
      case LayoutOpts.List: switch (trigger) {
        case Trigger.TOOLBAR: return { data: null, list: container.data };
        case Trigger.SELECTION: return { data: null, list: strict ? container.selecteds : container.data };
        default:
          return strict ? { data, list: [] } : { data: null, list: container.data };
      }
      case LayoutOpts.Card: switch (trigger) {
        case Trigger.TOOLBAR: return { data: null, list: container.data };
        default: return { data, list: [data] };
      }
    }
  }
}


// TODO: Basic Todo
const basicTodo = {

  create({
    concat,
    ref,
    text,
    icon,
    overrideParams = () => ({}),
    editingMode = EditingMode.POPUP,
    executable = () => true,
    onSuccess = () => { },
    responseMsg = {
      type: 'success',
      icon: 'fa fa-check-square-o',
      content: '資料已完成新增'
    }
  }) {
    if (EditingMode.NONE === editingMode)
      throw new Error('Todo(Create)\'s editing mode must be INLINE / POPUP.');

    const todo = new KekkaiTodo({
      trigger: Trigger.TOOLBAR,
      concat,
      ref,
      text,
      icon,
      editingMode,
      executable,
      overrideParams,
      responseMsg,

      execute({ }, container) {
        const data = overrideParams();
        const newData = new KekkaiModel(container, data instanceof KekkaiModel ? data.$json : data, {
          editable: true,
          isNew: true,
          hidden: EditingMode.POPUP === editingMode
        });

        container.add(newData, {
          callbackFn() {
            const formCase = EditingMode.INLINE === editingMode && LayoutOpts.Form === container.panel;
            const editOnly = EditingMode.POPUP === editingMode || formCase;

            if (editOnly) container.setExecuting({ data: newData, todo, popup: !formCase }, !formCase ? null : () => {
              container.data.filter(data => data.$uid !== newData.$uid && data.$setHidden(true))
            });
          }
        });
      },

      onSuccess(res, container) {
        const page = container.pager.page;
        const { filters = [] } = container.state.filters;

        container.doSearch(filters, page);
        onSuccess(res);
      }
    });

    return todo;
  },

  update({
    trigger = Trigger.ROW_DBCLICK,
    concat,
    ref,
    text,
    icon,
    overrideParams = (params) => params,
    editingMode = EditingMode.POPUP,
    executable = () => true,
    onSuccess = () => { },
    responseMsg = {
      type: 'success',
      icon: 'fa fa-check-square-o',
      content: '資料已完成修改'
    }
  }) {
    if (Trigger.SELECTION === trigger)
      throw new Error('[BasicTodo.UPDATE] Trigger mustn\'t be "SELECTION".');
    else if (Trigger.TOOLBAR === trigger && EditingMode.POPUP === editingMode) throw new Error(
      '[BasicTodo.UPDATE] Trigger(TOOLBAR) means multiple-edit, so can\'t set editing mode as POPUP.'
    );

    const todo = new KekkaiTodo({
      trigger,
      concat,
      ref,
      text,
      icon,
      editingMode,
      responseMsg,

      executable({ data, list }, container) {
        const readData = container.data.filter(data => !data.$isNew);

        return readData.length > 0 && readData.filter(data => data.$editable === true).length === 0
          && executable(Trigger.TOOLBAR === trigger ? { list: readData } : { data }, container) === true;
      },

      execute({ data = null, list = [] }, container) {
        container.edit(true, {
          editData: Trigger.TOOLBAR === trigger ? list.map($data => overrideParams($data)) : [overrideParams(data)],
          callbackFn() {
            if (Trigger.TOOLBAR !== trigger) container.setExecuting({
              todo,
              data,
              popup: true
            });
          }
        });
      },

      onSuccess(res, container) {
        const page = container.pager.page;
        const { filters = [] } = container.state.filters;

        container.doSearch(filters, page);
        onSuccess(res);
      }
    });

    return todo;
  },

  remove({
    trigger,
    concat,
    ref,
    text,
    icon,
    overrideParams = (params) => params,
    executable = () => true,
    onSuccess = () => { },
    confirmMsg = {
      type: 'info',
      icon: 'fa fa-question-circle',
      title: '資料即將被刪除',
      content: '確定刪除所選取之資料 ?'
    },
    responseMsg = {
      type: 'success',
      icon: 'fa fa-check-square-o',
      content: '資料已完成刪除'
    }
  }) {
    if (Trigger.TOOLBAR === trigger)
      throw new Error('[BasicTodo.DELETE] Trigger(TOOLBAR) can\'t remove data.');

    const todo = new KekkaiTodo({
      trigger,
      concat,
      ref,
      text,
      icon,
      confirmMsg,
      responseMsg,

      executable({ list, data }) {
        return toArray(Trigger.SELECTION === trigger ? list : data).length > 0
          && executable({ list, data }) === true;
      },

      execute({ list, data }, container) {
        container.setExecuting({
          todo,
          data: Trigger.SELECTION === trigger ? list.map($data => overrideParams($data)) : overrideParams(data)
        }, () => container.doCommit());
      },

      onSuccess(res, container) {
        container.setExecuting({ todo: null, data: null }, () => {
          const page = container.pager.page;
          const { filters = [] } = container.state.filters;

          container.doSearch(filters, page);
          onSuccess(res);
        });
      }
    });

    return todo;
  }
};

class BasicTodoEnum {

  get CREATE() { return basicTodo.create; }

  get UPDATE() { return basicTodo.update; }

  get DELETE() { return basicTodo.remove; }
}

export const BasicTodo = new BasicTodoEnum();