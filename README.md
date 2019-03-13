# react-kekkai
It's a component library for React, and named 'Kekkai'(Japanese). Let's see Kekkai via the agenda as follows:
- [What is Kekkai?](#what-is-kekkai)
- [5 Components](#5-components)
- [API](#api)

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
It looks like a magic circle, so I named it as 'Kekkai'.  In Japanese, 'Kekkai' means magic circle.

## 5 Components
Using this pattern concept to accomplish building the different layout via the only one way.  It will reduce our work for HTML, and make sure all the layout could follow the same business rule.  Now, let's check the purposes of these 5 components:
- <KekkaiContainer /> ([API](#kekkai-container))<br>
  1 <KekkaiContainer /> means 1 data source, all the data will work under the container.  <KekkaiContainer /> is responsible for privding a basic Toolbar / Pagination, and allocating HTML Layout Panel.
- <KekkaiDataview /> ([API](#kekkai-dataview))<br>
  1 <KekkaiDataview /> means 1 data, so there will be many <KekkaiDataview /> in 1 <KekkaiContainer />.  We use <KekkaiDataview /> to pack the data columns(field), and it provided Data-Row Selection / Menu.
- <KekkaiField /> ([API](#kekkai-field))<br>
  <KekkaiField /> is used to pack Display and Editor, and responsible for switching them by data status on the right time.  So, we don't need to use any skill to make up the switching control.  It could also define the column layout under the different panel.
- <KekkaiDisplay /> ([API](#kekkai-display))<br>
  <KekkaiField /> has provided a default <KekkaiDisplay /> to show value.  If you wanna use different ways or format to show the value, you could override it by your own.  This is responsibility of <KekkaiDisplay />.
- <KekkaiEditor /> ([API](#kekkai-editor))<br>
  When data need to be edited, we could use <KekkaiEditor /> to pack the form items.  We could also bind the events to append rule to control editable status / handle data changed / do validation and tip, and make every form item be unified into one solution by these 3 events.  By the way, the form item which is packed by <KekkaiEditor /> must have supported properties of 'value' and 'onChange'.

## API

by Taco (tabacotaco@gmail.com)
