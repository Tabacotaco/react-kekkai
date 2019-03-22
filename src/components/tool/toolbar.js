import React, { Component } from 'react';

import Navbar, { Nav, NavMenu, NavBtn } from 'tool/navbar';

import { LayoutOpts } from 'types/layout';
import { Trigger } from 'types/todo';


const Symbols = {
  button: Symbol('Button'),
  concat: Symbol('Concat')
};

export default class KekkaiToolbar extends Component {

  get navitems() {
    const { manager } = this.props;
    const container = manager.container;
    const isFormCase = LayoutOpts.Form === container.panel;
    const isSelecting = container.selecteds.length > 0;
    const items = [];
    const todos = manager.getAllowedTodos(isSelecting ? Trigger.SELECTION : Trigger.TOOLBAR, isFormCase ? {
      targetData: container.data[0]
    } : undefined);

    todos.forEach($todo => {
      if ($todo.concat === null)
        items.push({ type: Symbols.button, $todo });
      else {
        const concat = items.filter(item => Symbols.concat === item.type && item.key === $todo.concat)[0] || null;

        if (concat === null)
          items.push({ type: Symbols.concat, key: $todo.concat, $todo: [$todo] });
        else
          concat.$todo.push($todo);
      }
    });

    return items.map(item => Symbols.button === item.type || item.$todo.length > 1 ? item : {
      type: Symbols.button, $todo: item.$todo[0]
    });
  }

  getExecuteParams(todo) {
    const { manager } = this.props;
    const container = manager.container;
    const isFormCase = LayoutOpts.Form === container.panel;

    switch (todo.trigger) {
      case Trigger.TOOLBAR: return { data: null, list: container.data };
      case Trigger.SELECTION: return { data: null, list: isFormCase ? container.data : container.selecteds };
      default: return isFormCase ? { data: container.data[0], list: [] } : { data: null, list: container.data };
    }
  }

  render() {
    const { bgColor, txColor, manager } = this.props;

    const $tbar = this;
    const items = this.navitems;
    const container = manager.container;
    const isVisible = items.length > 0 || container.modifieds.length > 0 || container.editings.length > 0;

    return !isVisible ? null : (
      <Navbar className="toolbar" style={{ backgroundColor: bgColor, color: txColor }}>
        <Nav>
          {items.map(({ type, key, $todo }) => Symbols.button === type ?
            (
              <NavBtn key={$todo.uuid} icon={$todo.icon} onClick={() => $todo.execute($tbar.getExecuteParams($todo))}>
                {$todo.text}
              </NavBtn>
            ) : (
              <NavMenu key={key} tag="li" bgColor={bgColor} txColor={txColor} display={(
                <span>{key} <i className="fa fa-caret-down" /></span>
              )}>
                {$todo.map(todo => (
                  <NavBtn key={todo.uuid} icon={todo.icon} onClick={() => todo.execute($tbar.getExecuteParams(todo))}>
                    {todo.text}
                  </NavBtn>
                ))}
              </NavMenu>
            )
          )}
        </Nav>

        <Nav>
          {container.modifieds.length === 0 ? null : (
            <NavBtn icon="fa fa-floppy-o" onClick={() => manager.container.doCommit()}>
              儲存
            </NavBtn>
          )}

          {container.editings.length === 0 ? null : (
            <NavBtn icon="fa fa-undo" onClick={() => container.doRollback()}>
              取消
            </NavBtn>
          )}
        </Nav>
      </Navbar>
    );
  }
}