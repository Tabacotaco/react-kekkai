import React from 'react';

export default function Button({ color = 'primary', icon, text, disabled, onClick = () => { } }) {
  const disabledFn = disabled instanceof Function ? disabled : (() => disabled === true);

  return (
    <button type="button" className={['kekkai-btn', color].join(' ')} disabled={disabledFn()} onClick={onClick}>
      {'string' !== typeof icon || icon.trim().length === 0 ? null : (
        <i className={icon} />
      )}

      {text}
    </button>
  );
}