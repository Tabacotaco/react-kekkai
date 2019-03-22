import React, { Component } from 'react';

import KekkaiDataview from 'components/dataview';

import { LayoutOpts } from 'types/layout';
import { toArray } from 'types/util';

import 'scss/card.scss';


export default class CardPanel extends Component {

  state = {
    dropdowning: false
  };

  get defaultDataviewProps() {
    const { container, owner, manager } = this.props;

    return { owner, container, manager };
  }

  onDropdownMenu = (isOpen = false) => this.setState({ dropdowning: isOpen });

  render() {
    const { children = [] } = this.props;

    return (
      <div className="kekkai-card-panel">
        <div>
          {toArray(children).length > 0 ? null : (<div className="data-not-found" />)}

          {toArray(children).map(view => (
            <KekkaiDataview key={view.key} panel={LayoutOpts.Card} onDropdownMenu={this.onDropdownMenu} {...{
              ...view.props,
              ...this.defaultDataviewProps
            }} />
          ))}
        </div>
      </div>
    );
  }
}