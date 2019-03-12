import React, { Component } from 'react';

import Button from 'tool/button';
import { UUID, toArray } from 'types/util';


const SnackMaskClass = 'kekkai-snack-mask';

const Symbols = {
  onTrigger: UUID()
};

export function ConfirmMessage({ type, icon, show = false, title, content, onClose = () => { } }) {
  return (
    <Snackbar {...{ type, show }} vertical="top" delay={false} mask={true} onClose={
      (btn = false) => onClose('confirm', btn)
    }>
      <SnackbarContent key="content" {...{ icon, title, content }} btns={[
        { icon: 'fa fa-times', color: 'secondary', text: '取消', value: false },
        { icon: 'fa fa-check', color: 'primary', text: '確定', value: true }
      ]} />
    </Snackbar>
  );
}

export function AlertMessage({ type, icon, show = false, title, content, onClose = () => { } }) {
  return (
    <Snackbar key="content" {...{ type, show }} delay={5000} onClose={() => onClose('alert')}>
      <SnackbarContent {...{ icon, title, content }} />
    </Snackbar>
  );
}

export function SnackbarContent({ icon, title, content, btns = [], [Symbols.onTrigger]: onTrigger = () => { } }) {
  return (
    <div className="snackbar-content">
      <div className="body">
        {'string' !== typeof icon || icon.trim().length === 0 ? null : (
          <strong>
            <i className={icon} />
          </strong>
        )}

        <div>
          {'string' !== typeof title || title.trim().length === 0 ? null : (
            <h3 className="snackbar-title">{title}</h3>
          )}

          {content}
        </div>
      </div>

      {!btns || btns.length === 0 ? null : (
        <div className="footer">
          {!Array.isArray(btns) ? btns : btns.filter(btn => btn !== null).map(({
            icon, text, value, color = 'primary'
          }) => (
              <Button key={value} {...{ color, icon, text }} onClick={() => onTrigger(value)} />
            ))}
        </div>
      )}
    </div>
  );
}

export default class Snackbar extends Component {
  delayID = null;

  state = { height: 0 };

  get closeMode() {
    const { delay = 5000 } = this.props;

    return delay === false ? 'TRIGGER' : 'TIMEOUT';
  }

  setDelayClose({ delay = 5000 } = this.props) {
    clearTimeout(this.delayID);

    if ('TIMEOUT' === this.closeMode) this.delayID = setTimeout(() => {
      this.doClose();
      clearTimeout(this.delayID);
    }, delay);
  }

  doClose = (btn) => {
    const { onClose = () => { } } = this.props;

    onClose(btn);
  };

  onSnackbarRender = (el) => {
    const { mask = false } = this.props;
    const onClickOutside = ({ target }) => {
      if (!el.contains(target)) {
        this.doClose();

        document.body.classList.remove(SnackMaskClass);
        document.body.removeEventListener('click', onClickOutside);
      }
    };

    if (el) this.setState({ height: el.clientHeight }, () => {
      this.setDelayClose();

      if (mask) {
        document.body.classList.add(SnackMaskClass);
        document.body.addEventListener('click', onClickOutside);
      }
    }); else if (mask) {
      document.body.classList.remove(SnackMaskClass);
      document.body.removeEventListener('click', onClickOutside);
    }
  }

  render() {
    const { show = false, type = 'info', vertical = 'bottom', children = [] } = this.props;
    const { height } = this.state;

    if (['info', 'success', 'warning', 'danger'].indexOf(type) < 0) throw new Error(
      'The type of Snackbar must be "info"/"success"/"warning"/"danger".'
    );

    return !show ? null : (
      <div ref={this.onSnackbarRender} className={['kekkai-snackbar', type].join(' ')} style={{
        ['top' === vertical ? 'marginBottom' : 'marginTop']: height * -1
      }}>
        {toArray(children).map(child => SnackbarContent !== child.type ? child : (
          <SnackbarContent key={child.key} {...{
            ...child.props,
            [Symbols.onTrigger]: (btn) => this.doClose(btn)
          }} />
        ))}
      </div>
    );
  }
}