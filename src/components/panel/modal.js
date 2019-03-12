import React, { Component } from 'react';

import Button from 'tool/button';
import { ConfirmMessage, AlertMessage } from 'tool/snackbar';

import { generateMessageOpts } from 'types/util';

import 'scss/modal.scss';


function Header({ title, icon, bgColor, txColor, onClose = () => { } }) {
  return (
    <div className="header" style={{ backgroundColor: bgColor, color: txColor }}>
      <h3 className="title">
        {'string' !== typeof icon || icon.trim().length === 0 ? null : (<i className={icon} />)}
        {title}
      </h3>

      <button type="button" className="close" onClick={onClose} style={{ color: txColor }}>
        <span>&times;</span>
      </button>
    </div>
  );
}


export default class ModalPanel extends Component {

  doClose = (btn) => {
    const { onClose = () => { } } = this.props;

    onClose(btn);
  };

  onTrigger = async (btn) => {
    const { onTrigger = () => { } } = this.props;
    const done = await onTrigger(btn);

    if (done !== false)
      this.doClose(btn);
  };

  render() {
    const { show = false } = this.props;

    const {
      icon,
      title,
      bgColor,
      txColor,
      zIndex = 1000,
      closeByMask = true,
      children = [],
      btns = [],
      alert = generateMessageOpts(),
      confirm = generateMessageOpts(),
      onCloseMessage = () => { }
    } = this.props;

    return !show ? null : (
      <div className="kekkai-modal" style={{ zIndex }} onClick={() => closeByMask ? this.doClose() : null}>
        <div className="dialog">
          <div className="content">
            {'string' !== typeof title || title.trim().length === 0 ? null : (
              <Header {...{ icon, title, bgColor, txColor }} onClose={() => this.doClose()} />
            )}

            <div className="body">
              <ConfirmMessage {...confirm} onClose={onCloseMessage} />
              {children}
              <AlertMessage {...alert} onClose={onCloseMessage} />
            </div>

            {!btns || btns.length === 0 ? null : (
              <div className="footer">
                {!Array.isArray(btns) ? btns : btns.filter(btn => btn !== null).map(({
                  icon, text, value, disabled = false, color = 'primary'
                }) => (
                    <Button key={value} {...{ color, icon, text, disabled }} onClick={() => this.onTrigger(value)} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}