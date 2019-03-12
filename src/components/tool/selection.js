import React, { Component } from 'react';


function getClassName({ checked = false, indeterminate = false }) {
  const cls = ['fa'];

  if (checked)
    cls.push('fa-check-square');
  else if (indeterminate)
    cls.push('fa-minus-square');
  else
    cls.push('fa-square-o');

  return cls.join(' ');
}

export function CheckboxSelection(props) {
  const {
    color = '#007bff',
    visible = true,
    disabled = false,
    checked = false,
    indeterminate = false,
    onChange = () => { }
  } = props;

  return !visible ? null : (
    <button type="button" className="kekkai-checkbox-selection" disabled={disabled} onClick={() =>
      onChange(indeterminate ? checked : !checked)
    }>
      <i className={getClassName(props)} style={{
        color: checked || indeterminate ? color : '#6c757d'
      }} />
    </button>
  );
}

export class AllSelection extends Component {

  render() {
    const { container, rowSpan = 1 } = this.props;
    const { data = [], selecteds = [] } = container;
    const { toolBgColor: color = '#007bff' } = container.props;
    const checked = selecteds.length > 0 && selecteds.length === data.length;

    return (
      <th className="row-selection" rowSpan={rowSpan}>
        <CheckboxSelection {...{
          color,
          checked,
          visible: container.editings.length === 0,
          indeterminate: !checked && selecteds.length > 0,
          onChange: (checked) => data.forEach(data => data.$setChecked(checked))
        }} />
      </th>
    );
  }
}