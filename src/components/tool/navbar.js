import React, { Component } from 'react';

import { toArray } from 'types/util';


function Btn({ icon, disabled = false, children = [], onClick = () => { } }) {
  return (
    <a className="kekkai-nav-btn" disabled={disabled} onClick={disabled ? null : onClick}>
      {'string' !== typeof icon ? null : <i className={icon} />}

      {toArray(children)}
    </a>
  );
}

export function NavText({ className, children }) {
  return (
    <li {...{ className }}><a>{children}</a></li>
  );
}

export function NavBtn(props) {
  return (
    <li>
      <Btn {...props} />
    </li>
  );
}

export function NavInput(props) {
  return (
    <li>
      <input {...props} />
    </li>
  );
}

export function MenuDivider({ color }) {
  return (<li className="divider" style={{ backgroundColor: color }} />);
}

export function Nav({ className = '', align = 'left', children = [] }) {
  return (
    <ul className={['nav', className, 'left' !== align ? align : ''].join(' ')}>
      {toArray(children).filter(({ type }) => [NavBtn, NavInput, NavText, NavMenu].indexOf(type) >= 0)}
    </ul>
  );
}

export class NavMenu extends Component {
  static Body = document.body;

  state = { show: false };

  get positionCSS() {
    const { tag = 'div', align = 'left' } = this.props;

    if ('div' !== tag)
      return { position: 'absolute' };
    else {
      const { width = 0, height = 0, top = 0, left = 0, right = 0 } = 'dropdown' in this.refs ? this.refs.dropdown.getBoundingClientRect() : {};
      const bodyWidth = NavMenu.Body.clientWidth;

      return 'left' === align ? { top: top + height, left, right: 'auto' }
        : { top: top + height, left: 'auto', right: bodyWidth - left - width };
    }
  }

  componentDidMount() { NavMenu.Body.addEventListener('click', this.onClickOutside); }

  componentWillUnmount() { NavMenu.Body.removeEventListener('click', this.onClickOutside); }

  onTrigger = (callbackFn = () => { }) => {
    this.setState({ show: !this.state.show === true }, () => {
      const { onOpen = () => { }, onClose = () => { } } = this.props;
      const { show = false } = this.state;

      show ? onOpen() : onClose();
      callbackFn();
    });
  };

  onClickOutside = (e) => {
    const { show } = this.state;
    const { menu } = this.refs;

    if (show && !menu.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();

      this.onTrigger();
    }
  };

  render() {
    const { tag = 'div', display, bgColor, bdColor = 'none', txColor, children = [] } = this.props;
    const { show } = this.state;

    return React.createElement(tag, {
      ['data-tag']: tag,
      className: 'kekkai-dropdown',
      ref: 'dropdown'
    }, [
        (<Btn key="displayBtn" onClick={() => this.onTrigger()}>{display}</Btn>),

        (<ul key="menu" ref="menu" className="menu" style={{
          display: show ? 'block' : 'none',
          backgroundColor: bgColor,
          color: txColor,
          ...('none' === bdColor ? {} : { border: `1px solid ${bdColor}` }),
          ...this.positionCSS
        }}>
          {toArray(children).filter(({ type }) => [NavBtn, MenuDivider].indexOf(type) >= 0).map((item) =>
            MenuDivider === item.type ? item : (
              <NavBtn key={item.key} {...item.props} onClick={() => this.onTrigger(item.props.onClick)} />
            )
          )}
        </ul>),
      ]);
  }
}

export default class Navbar extends Component {

  render() {
    const { className = '', children = [], style = {} } = this.props;

    return (
      <nav className={['kekkai-navbar', className].join(' ')} style={style}>
        {toArray(children).filter(({ type }) => Nav === type)}
      </nav>
    );
  }
}