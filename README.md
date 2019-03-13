# react-kekkai
It's a component library for React, and named 'Kekkai'(Japanese). Let's see Kekkai via the agenda as follows:
- [What is Kekkai?](#what-is-kekkai)
- [Abount Install](#abount-install)
- [Import Kekkai](#import-kekkai)
- [5 Components](#5-components)
- [API](#api)
  - [Components API](#components-api)
  - [Options API](#options-api)
  - [Types API](#types-api)

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

## Abount Install
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
  LayoutOpts, TriggerOpts, EditingModeOpts,

  // Operations Building Helper
  Todo, TodoScripts
} from 'react-kekkai';

import 'react-kekkai/dist/index.css';
```

## 5 Components
Using this pattern concept to accomplish building the different layout via the only one way.  It will reduce our work for HTML, and make sure all the layout could follow the same business rule.  Now, let's check the purposes of these 5 components:
- `<KekkaiContainer />` ([API](#KekkaiContainer))<br>
  1 `<KekkaiContainer />` means 1 data source, all the data will work under the container.  `<KekkaiContainer />` is responsible for privding a basic Toolbar / Pagination, and allocating HTML Layout Panel.
- `<KekkaiDataview />` ([API](#KekkaiDataview))<br>
  1 <KekkaiDataview /> means 1 data, so there will be many `<KekkaiDataview />` in 1 `<KekkaiContainer />`.  We use `<KekkaiDataview />` to pack the data columns(field), and it provided Data-Row Selection / Menu.
- `<KekkaiField />` ([API](#KekkaiField))<br>
  `<KekkaiField />` is used to pack Display and Editor, and responsible for switching them by data status on the right time.  So, we don't need to use any skill to make up the switching control.  It could also define the column layout under the different panel.
- `<KekkaiDisplay />` ([API](#KekkaiDisplay))<br>
  `<KekkaiField />` has provided a default `<KekkaiDisplay />` to show value.  If you wanna use different ways or format to show the value, you could override it by your own.  This is responsibility of `<KekkaiDisplay />`.
- `<KekkaiEditor />` ([API](#KekkaiEditor))<br>
  When data need to be edited, we could use `<KekkaiEditor />` to pack the form items.  We could also bind the events to append rule to control editable status / handle data changed / do validation and tip, and make every form item be unified into one solution by these 3 events.  By the way, the form item which is packed by `<KekkaiEditor />` must have supported properties of 'value' and 'onChange'.

## API
After the introduction of Kekkai, let's see the API to know how to use Kekkai.  (PS. '*' means required.)
### Components API
#### `<KekkaiContainer />`
- ##### Options(props)
  - *`ref`: `string` - Define a ref, we could call the methods through ref.
  - `panel`: [LayoutOpts](#LayoutOpts) - Specify the HTML layout, default is `LayoutOpts.List`.
  - `toolBgColor`: `string` - Define background-color of tool, default is `#007bff`.
  - `toolTxColor`: `string` - Define text-color of tool, default is `white`.
  - `pageSize`: `number` - Define data count in 1 page, and the allowed number is `10` / `25` / `50` / `100(means show all by infinite-scroll)`, default is `10`.
  - `todos`: ([Todo](#Todo) | [TodoScripts](#TodoScripts))[] - Inject the data manipulations which are defined by yourself or Kekkai provided.  If there is not any `todos`, users could only read the data in <KekkaiContainer />.
- ##### Events
  - *`getSearchResponse`: async ({ `sort`, `filters`, `page`}) => { `data`, `total` } - This is the most important event, all the data that <KekkaiContainer /> needs are returned by it.  You can also make up parameters of request and send request here. Check more as follows:
    - Parameters
      - `sort`: `[{ name, dir }]` - 
        - `name`: `string` - means the field name of data.
        - `dir`: `string` - will be `asc` or `desc`.
      - `filters`: `[{ name, operator, value }]` -
        - `name`: `string` - means the field name of data.
        - `operator`: `string` - means condition, and it's defined by [`<KekkaiField />`](#KekkaiField)'s property: `filter`.
        - `value`: `any` - This is input by user filtering.
      - `page`: `{ page, pageSize, skip, start }` -
        - `page`: `number` - The target page index of loading.
        - `pageSize`: `number` - Data count of 1 page.
        - `skip`: `number` - Skip count.
        - `start`: `number` - Target start data index in the page.
    - Return: `{ data, total }`
      - `data`: `Object[]` - When you get the data json array from response with await, please put the data json into this property.
      - `total`: `number` - Set the total count of data to make pagination work.
  - *`view`: (`data`) => [`<KekkaiDataview />`](#KekkaiDataview) - This event will be fired when Kekkai get the response data and convert json to [KekkaiModel](#KekkaiModel).  [KekkaiModel](#KekkaiModel) will be inputted in this event, so we could build [`<KekkaiDataview />`](#KekkaiDataview) by it.
    - Parameters
      - `data`: [KekkaiModel](#KekkaiModel) - The converted data from response.
    - Return: [`<KekkaiDataview />`](#KekkaiDataview)<br>
      Defined layout of data.
  - `onCommit`: async (`todoRef`, { `target`, `modifieds`, `removes` }) => { `success`, `msg` } - If there is any request-process in `todos`, this event will be fired when user submit modifieds.  We could get the target modified data to make up the parameters and send request here.  Check more as follows:
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
- ##### Methods
  - 

#### `<KekkaiDataview />`
- ##### Options(props)
- ##### Events
- ##### Methods

#### `<KekkaiField />`
- ##### Options(props)
- ##### Events
- ##### Methods

#### `<KekkaiDisplay />`
- ##### Options(props)
- ##### Events
- ##### Methods

#### `<KekkaiEditor />`
- ##### Options(props)
- ##### Events
- ##### Methods

### Options API

### Types API
#### KekkaiModel

#### Todo

#### TodoScript

by Taco (tabacotaco@gmail.com)
