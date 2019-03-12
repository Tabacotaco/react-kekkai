# react-kekkai
It's a component library for React, and named 'Kekkai'(Japanese). Let's see Kekkai via the agenda as follows:
- [What is Kekkai?](#what-is-kekkai)

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
Using this pattern concept to accomplish building the different layout via only one way.  To reduce our work for HTML, and make sure all the layout could follow the same business rule.  Now, let's check the purposes of these 5 components:
- <KekkaiContainer /> ([API] (#kekkai-container))
- <KekkaiDataview /> ([API] (#kekkai-dataview))
- <KekkaiField /> ([API] (#kekkai-field))
- <KekkaiDisplay /> ([API] (#kekkai-display))
- <KekkaiEditor /> ([API] (#kekkai-editor))


by Taco (tabacotaco@gmail.com)
