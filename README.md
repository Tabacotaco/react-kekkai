# react-kekkai
It's a component library for React, and named 'Kekkai'(Japanese). Let's see Kekkai via the agenda as follows:
- [What is Kekkai?](#what-is-kekkai)
- [About Install](#about-install)
- [Import Kekkai](#import-kekkai)
- [5 Components](#5-components)
- [API Documentation](#api-documentation)
  - [Components](#components)
  - [Options](#options)
  - [Base Types](#base-types)

## What is Kekkai
Kekkai provided 5 components to build the common data layout(such as Form / Grid / Card).  You could use the same way to build the layout through these Kekkai components, and change layout via easy setting.

The pattern about using 5 components is...
```
<KekkaiContainer panel={LayoutOpts.List} view={data => (
  <KekkaiDataview key={data.$uid} dataModel={data}>
    <KekkaiField label="Name" name="fullName">
      <KekkaiDisplay># {data.fullName}</KekkaiDisplay>

      <KekkaiEditor required={true} validation={value =>
        value.trim().length === 0 ? 'Name is required.' : true
      }>
        <input type="text" />
      </KekkaiEditor>
    </KekkaiField>
  </KekkaiDataview>
)}/>
```
In Japanese, 'Kekkai' means magic circle, and the pattern just looks like a magic circle, so I named it as 'Kekkai' ^^.

## About Install
- 1. Download from NPM<br>
  `npm i react moment numeral react-kekkai -s`
- 2. Update your webpack.config.js<br>
  Find `resolve.alias`, and append as follows:
  ```
  resolve: {
    extensions: [/* Your extensions ... */],
    alias: {
      react: path.resolve('./node_modules/react'),
      moment: path.resolve('./node_modules/moment'),
      numeral: path.resolve('./node_modules/numeral'),

      /* Your alias ... */
    }
  }
  ```

## Import Kekkai
Except the kekkai components, also import the CSS.
```
import {
  // Components
  KekkaiContainer, KekkaiDataview, KekkaiField, KekkaiDisplay, KekkaiEditor,

  // Option Enums
  LayoutOpts, TriggerOpts, EditingOpts,

  // Operations Building Helper
  Todo, TodoScripts
} from 'react-kekkai';

import 'react-kekkai/dist/index.css';
```

## 5 Components
Using this pattern concept to accomplish building the different layout via the only one way.  It will reduce our work for HTML, and make sure all the layout could follow the same business rule.  Now, let's check the purposes of these 5 components:
- `<KekkaiContainer />` ([API Documentation](#KekkaiContainer-))<br>
  1 `<KekkaiContainer />` means 1 data source, all the data will work under the container.  `<KekkaiContainer />` is responsible for privding a basic Toolbar / Pagination, and allocating HTML Layout Panel.

- `<KekkaiDataview />` ([API Documentation](#KekkaiDataview-))<br>
  1 `<KekkaiDataview />` means 1 data, so there will be many `<KekkaiDataview />` in 1 `<KekkaiContainer />`.  We use `<KekkaiDataview />` to pack the data columns(field), and it provided Data-Row Selection / Menu.

- `<KekkaiField />` ([API Documentation](#KekkaiField-))<br>
  `<KekkaiField />` is used to pack Display and Editor, and responsible for switching them by data status on the right time.  So, we don't need to use any skill to make up the switching control.  It could also define the column layout under the different panel.

- `<KekkaiDisplay />` ([API Documentation](#KekkaiDisplay-))<br>
  `<KekkaiField />` has provided a default `<KekkaiDisplay />` to show value.  If you wanna use different ways or format to show the value, you could override it by your own.  This is responsibility of `<KekkaiDisplay />`.

- `<KekkaiEditor />` ([API Documentation](#KekkaiEditor-))<br>
  When data need to be edited, we could use `<KekkaiEditor />` to pack the form items.  We could also bind the events to append rule to control editable status / handle data changed / do validation and tip, and make every form item be unified into one solution by these 3 events.  By the way, the form item which is packed by `<KekkaiEditor />` must have supported properties of 'value' and 'onChange'.

## API Documentation
After the introduction of Kekkai, let's see the API to know how to use Kekkai.  (PS. '*' means required.)
### Components
#### `<KekkaiContainer />`
- ##### Options(props)
  - *`ref`: `string`<br>
  Define a ref, we could call the methods through ref.

  - `panel`: [LayoutOpts](#LayoutOpts)<br>
  Specify the HTML layout, default is `LayoutOpts.List`.

  - `toolBgColor`: `string`<br>
  Define background-color of tool, default is `#007bff`.

  - `toolTxColor`: `string`<br>
  Define text-color of tool, default is `white`.

  - `pageSize`: `number`<br>
  Define data count in 1 page, and the allowed number is `10` / `25` / `50` / `100(means show all by infinite-scroll)`, default is `10`.

  - `todos`: ([Todo](#Todo) | [TodoScripts](#TodoScripts))[]<br>
  Inject the data manipulations which are defined by yourself or Kekkai provided.  If there is not any `todos`, users could only read the data in <KekkaiContainer />.

- ##### Events
  - *`getSearchResponse`: `async ({ sort, filters, page}) => { data, total }`<br>
  This is the most important event, all the data that <KekkaiContainer /> needs are returned by it.  You can also make up parameters of request and send request here. Check more as follows:
    - Parameters
      - `sort`: `[{ name, dir }]` - 
        - `name`: `string` - means the field name of data.
        - `dir`: `string` - It will only be `asc` or `desc`.

      - `filters`: `[{ name, operator, value }]` -
        - `name`: `string` - means the field name of data.
        - `operator`: `string` - means condition, and it's defined by [`<KekkaiField />`](#KekkaiField-)'s property: `filter`.
        - `value`: `any` - This is input by user filtering.

      - `page`: `{ page, pageSize, skip, start }` -
        - `page`: `number` - The target page index of loading.
        - `pageSize`: `number` - Data count of 1 page.
        - `skip`: `number` - Skip count.
        - `start`: `number` - Target start data index in the page.

    - Return: `{ data, total }`
      - `data`: `Object[]` - When you get the data JSON array from response with await, please put the data JSON into this property.

      - `total`: `number` - Set the total count of data to make pagination work.
  - *`view`: (`data`) => [`<KekkaiDataview />`](#KekkaiDataview-)<br>
  This event will be fired when Kekkai get the response data and convert JSON to [KekkaiModel](#KekkaiModel).  KekkaiModel will be inputted in this event, so we could build [`<KekkaiDataview />`](#KekkaiDataview-) by it.
    - Parameters
      - `data`: [KekkaiModel](#KekkaiModel) - The converted data from response.

    - Return: [`<KekkaiDataview />`](#KekkaiDataview-)<br>
      Defined layout of data.

  - `onCommit`: `async (todoRef, { target, modifieds, removes }) => { success, msg }`<br>
  If there is any request-process in `todos`, this event will be fired when user submit modifieds.  We could get the target modified data to make up the parameters and send request here.  Check more as follows:
    - Parameters
      - `todoRef`: `string` - We could check what request should be sent by this parameter, and it's defined in [`todo`](#todo).  Here are 2 cases that we should know:
        - Specific Case:<br>
        Most manipulations and their own request process are explicitly and single, so we could get the only one `todoRef` that defined by ourself.

        - Commit Case :<br>
        Kekkai provided inline-editing, and user could edit multiple data via this feature.  No metter data is updated or created, we'll only get `todoRef` as `KekkaiContainer.CommitAll`, and it means this commit is for all modified data.

      - `target`: [KekkaiModel](#KekkaiModel)[] - In specific case, we could get the request target data from this parameter.

      - `modifieds`: [KekkaiModel](#KekkaiModel)[] - This parameter will be inputted when the `todoRef` is `KekkaiContainer.CommitAll`, and it contains the updated and created data.

      - `removes`: [KekkaiModel](#KekkaiModel)[] - This parameter will be inputted when the `todoRef` is `KekkaiContainer.CommitAll`.  It means the temporarily removed data.

    - Return: `{ success, msg }`
      - `success`: `boolean` - The response result, set as `false` will make Kekkai popup a Error Message Box, and the content is `msg`.

      - `msg`: `string` - Error message.

- ##### Readonly Properties
  - `panel`: [LayoutOpts](#LayoutOpts) - Get current layout type.

  - `pager`: [KekkaiPager](#KekkaiPager) - Get pagination manager.  If you wanna change page size or index, you could use this property.

  - `data`: [KekkaiModel](#KekkaiModel)[] - Get all data in current page.

  - `selecteds`: [KekkaiModel](#KekkaiModel)[] - Get the selected data in current page.

  - `editings`: [KekkaiModel](#KekkaiModel)[] - Get the editable data in current page.

  - `modifieds`: [KekkaiModel](#KekkaiModel)[] -  Get the dirty data in current page.

- ##### Methods
  - `setAlert(content, { type, title, icon, callbackFn }): void`<br>
  To show a message tip.
    - *`content`: `string` | `React Element` - The message content.

    - `type`: `string` - Define the background-color of message box, and the allowed values are `info` / `success` / `warning` / `danger`.  Default is `info`.

    - `title`: `string` - The message title.

    - `icon`: `string` - Set as a icon class name, such as [Font-Awesome](https://fontawesome.com/v4.7.0/icons/).  By the way, Kekkai use Font Awesome 4.7 as default icon.

    - `callbackFn`: `() => void` - This function will be called after the message box closed.

  - `setConfirm(content, { type, title, icon, callbackFn }): void`<br>
  To show a confirmed message.
    - *`content`: `string` | `React Element` - The message content.

    - `type`: `string` - Define the background-color of message box, and the allowed values are `info` / `success` / `warning` / `danger`.  Default is `info`.

    - `title`: `string` - The message title.

    - `icon`: `string` - Set as a icon class name, such as [Font-Awesome](https://fontawesome.com/v4.7.0/icons/).  By the way, Kekkai use Font Awesome 4.7 as default icon.

    - *`callbackFn`: `(isConfirmed: boolean) => void` - This function will be called after the message box closed.

  - `add(newData, { index }): void`<br>
  Append new JSON data to `<KekkaiContainer />`, and you could also specify the index of data(default is 0).

  - `edit(turnOn, { editData }): void`<br>
  Turn on/off the editable status of data.  If you haven't specified the target data, the default targets are all data.
    - *`turnOn`: `boolean` - Set as `true` to turn on editable, and `false` to turn off.

    - `editData`: [KekkaiModel](#KekkaiModel) | [KekkaiModel](#KekkaiModel)[] - Specify one or more target data.

  - `async doSearch(filters, specifyPage): void`<br>
  To load data.  Event - getSearchResponse will be fired when called this method.

  - `async doRollback(showConfirm): void`<br>
  To rollback all the modifieds of data, and you could also rollback without confirm message box.
    - `showConfirm`: `boolean` - Default is `true`, and setting as `false` could ignore confirming.
  
  - `async doCommit(): void`<br>
  To commit all the modifieds of data.  Kekkai will make up the target process data according to manipulation situational from user, and put `todoRef` and data into Event - onCommit.

#### `<KekkaiDataview />`
- ##### Options(props)
  - *`key`: `string`<br>
  In React, the element array must be set a key, so our suggest is setting as [KekkaiModel](#KekkaiModel).$uid.

  - *`dataModel`: [KekkaiModel](#KekkaiModel)<br>
  Binding data to this `<KekkaiDataview />` to make sure it could work.

  - `selectable`: `boolean` | `(data) => boolean`<br>
  This option will be actived when the panel is `LayoutOpts.List` or `LayoutOpts.Card`.  To define this `<KekkaiDataview />` could be selected by user, and default is false.  You could also set as a function to build business rules.
    - Parameters
      - `data`: [KekkaiModel](#KekkaiModel) - Kekkai will put the data into this function.

  - `reorderable`: `boolean`<br>
  This option will be actived when the panel is `LayoutOpts.List`.  To define all the columns in `<KekkaiDataview />` could be reorder by drag and drop.

  - `labelSize`: `number`<br>
  This option will be actived when the panel is `LayoutOpts.Form`.  To define all the `<label />`'s width, and the allowed values are between 1 ~ 12.

  - `viewSize`: [RWD Options](#rwd-options)<br>
  This option will be actived when the panel is `LayoutOpts.Card`.  To define `<KekkaiDataview />`'s width, and default is `{ def: 12 }`.

- ##### Events
  - `onSelected`: `(isChecked, data) => void`<br>
  This event will be fired when user select the data by Data-Row Selection.
    - Parameters
      - `isChecked`: `boolean` - `true` means data is selected, and `false` is deselected.

      - `data`: [KekkaiModel](#KekkaiModel) - The target data.

#### `<KekkaiField />`
- ##### Options(props)
  - *`name`: `string`<br>
  Binding data field name.

  - `key`: `string`<br>
  If you wanna build a pseudo column, you must have to set this property.  Just give it a unique name.

  - *`label`: `string`<br>
  Define description for field. When panel is `LayoutOpts.List`, this label will show on the header.  In other panel, it will become `<label />`.

  - `align`: `string`<br>
  Set the text-align in `<KekkaiDisplay />`, default is `left`.

  - `sortable`: `boolean` | `{ seq, dir }`<br>
  This option will make Kekkai generate sort parameters.  Set as `true` means this column will be sortable.
    - `seq`: `number` - Means priority order.

    - `dir`: `string` - The allowed values are `asc` or `desc`.

  - `form`: [RWD Options](#rwd-options)<br>
  When layout panel is `LayoutOpts.Form` or in Kekkai Popup Modal, the column width is set by this option.  Default is `{ def: 12 }`.

  - `card`: [RWD Options](#rwd-options)<br>
  When layout panel is `LayoutOpts.Card`, the column width is set by this option.  Default is `{ def: 12 }`.

  - `list`: `number`<br>
  When layout panel is `LayoutOpts.List`, the column width is set by this option.  The number means `px`, and default is `120`.

  - `locked`: `boolean`<br>
  Only for `LayoutOpts.List`.  Set column as locked, default is `false`.

  - `lockable`: `boolean`<br>
  Only for `LayoutOpts.List`.  Set column could be switched locked status by user, default is `false`.

  - `hidden`: `boolean`<br>
  Only for `LayoutOpts.List`.  Set column as hidden, default is `false`.

  - `hideable`: `boolean`<br>
  Only for `LayoutOpts.List`.  Set column could be switched hidden by user, default is `false`.

  - `resizable`: `boolean`<br>
  Only for `LayoutOpts.List`.  Set column could be resized, default is `false`.

  - `filter`: `any`<br>
  Only for `LayoutOpts.List`.  Kekkai will build a filter feature on the header which is like Excel.  This option could define filter condition, such as `'eq'` / `'like'`.  See your request parameter format to decide it.

#### `<KekkaiDisplay />`
There isn't not any options for this component.  It's just used to pack the value format.

#### `<KekkaiEditor />`
- ##### Options(props)
  - `required`: `boolean`<br>
  Set value as be required when user edits, default is `false`.

  - `editable`: `boolean` | `(value, data) => boolean`<br>
  This option will be used before Kekkai switch to edit mode.  If this option value is `false` or return `false`, that means this column wouldn't be switched to edit mode.
    - Parameters
      - `value`: `any` - The current field value.

      - `data`: [KekkaiModel](#KekkaiModel) - The data record.

    - Return: `boolean`<br>
    Return `true` or `false` to tell Kekkai this column is able to be swtiched to edit mode.

- ##### Events
  - `onChange`: `(name, value, data) => void`<br>
  This event is fired when field value changed.
    - Parameters
      - `name`: `string` - The field name of data.

      - `value`: `any` - The new value.

      - `data`: [KekkaiModel](#KekkaiModel) - The data record.

  - `validation`: `(name, value, data) => true | string`<br>
  This event is fired after `onChange`, and we could check the data validation in this event.  If data is valid, please return `true`, or return the error message tip.  Kekkai will popup a message tip when it get the error message.
    - Parameters
      - `name`: `string` - The field name of data.

      - `value`: `any` - The new value.

      - `data`: [KekkaiModel](#KekkaiModel) - The data record.
    
    - Return: `true` | `string`<br>
    `true` means valid, and `string` is error message.

### Options
#### LayoutOpts
This option will be used in [`<KekkaiContainer />`](##kekkaicontainer-).  There are 3 kinds layout, see as follows:
- ##### Card: `LayoutOpts.Card`<br>
Card layout is built by `Layout-Grid` & `Components-Card` from Bootstrap 4.0.  We could use it to show multiple data, and it's RWD design.  Under this panel, there isn't any Data-Row Selection, all the manipulations about Selection and Row Double Click will become to be triggered by Data-Row Menu.<br><br>
PS. I wanna append data sort feature on the label in the future.

- ##### Form: `LayoutOpts.Form`<br>
Form layout is built by `Layout-Grid` from Bootstrap 4.0, and it's also RWD design.  In Kekkai, if set `panel` as `LayoutOpts.Form`, the `pageSize` will become to `1`.  Yes, it means show only one data in Kekkai, so all the manipulations about data could only be triggered by Toolbar.  By the way, when Kekkai wanna generate a popup modal of single data, the content layout in modal are form the options of form.

- ##### List: `LayoutOpts.List`<br>
Show data by list.  List layout has 2 blocks: one is locked on the left, and one is scrollable on the right.  Under this panel, user could adjust the columns layout, such as width / hidden / order / locked / data sort, and also could use data filter feature on the header.  It distributes the manipulations into 4 kinds: Toolbar / Selection / Row Menu / Row Double Click.

#### TriggerOpts
This option will be bound in [Todo](#Todo) or [TodoScripts](#TodoScripts).  Kekkai distributes the manipulations about data into 4 kinds, and all the triggered ways are different. As follows:
- ##### TOOLBAR: `TriggerOpts.TOOLBAR`<br>
It means a initially state.  It will be default shown on the Toolbar, but if user selects any data, the toolbar buttons will be hidden(become to Selection-Mode).

- ##### SELECTION: `TriggerOpts.SELECTION`<br>
This trigger is different from TOOLBAR, and it means Selection-Mode.  When user selects data through Data-Row Selection, the selection button will be visible on the Toolbar.

- ##### ROW_MENU: `TriggerOpts.ROW_MENU`<br>
It means single-selection, so Kekkai will build a menu to show them on the row.  This menu will only be visible when there isn't any data which is selected or on editing.

- ##### ROW_DBCLICK: `TriggerOpts.ROW_DBCLICK`<br>
This trigger also means single-selection, but there could be only one [Todo](#Todo) set as ROW_DBCLICK at most.  

#### EditingOpts
If you want to set data as editable when [Todo](#Todo) is executing, you need to bind this option to [Todo](#Todo).
- ##### INLINE: `EditingOpts.INLINE`<br>
Means inline editing, edit data with popup modal.  It's for multiple case.

- ##### POPUP: `EditingOpts.POPUP`<br>
Means editing by popup modal, and it's for single case.

#### RWD Options
This option is base on Bootstrap 4.0, and it was designed from the default 5 sizes from Boostrap.
- ##### Default type is `{ def, sm, md, lg, xl }`
  - `def`: `false` | `number` - Allowed numbers are between 1 ~ 12, and `false` means hidden.  Default is `12`.

  - `sm`: `false` | `number` - Allowed numbers are between 1 ~ 12, and `false` means hidden.

  - `md`: `false` | `number` - Allowed numbers are between 1 ~ 12, and `false` means hidden.

  - `lg`: `false` | `number` - Allowed numbers are between 1 ~ 12, and `false` means hidden.

  - `xl`: `false` | `number` - Allowed numbers are between 1 ~ 12, and `false` means hidden.

### Base Types
#### KekkaiModel

#### KekkaiPager

#### Todo

#### TodoScripts

by Taco (tabacotaco@gmail.com)
