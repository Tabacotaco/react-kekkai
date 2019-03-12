import React, { Component } from 'react';

import KekkaiDataview from 'components/dataview';

import { LayoutOpts } from 'types/layout';
import { toArray } from 'types/util';

import 'scss/form.scss';


export default class FormPanel extends Component {

  get defaultDataviewProps() {
    const { container, owner, manager } = this.props;

    return { owner, container, manager };
  }

  render() {
    const { children = [] } = this.props;

    return (
      <div className="kekkai-form-panel container">
        {toArray(children).length > 0 ? null : (<div className="data-not-found" />)}

        {toArray(children).map(view => (
          <KekkaiDataview key={view.key} panel={LayoutOpts.Form} {...{
            ...view.props,
            ...this.defaultDataviewProps
          }} />
        ))}
      </div>
    );
  }
}