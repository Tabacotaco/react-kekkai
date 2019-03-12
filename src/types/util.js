import moment from 'moment';

import KekkaiField from 'components/field';


export const defaultListColumnWidth = 120;

export function UUID() {
  const s = [];
  const hexDigits = '0123456789abcdef';

  for (let i = 0; i < 36; i++)
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);

  s[14] = '4';
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = '-';
  s[13] = '-';
  s[18] = '-';
  s[23] = '-';

  return s.join('');
}

export function toArray(value) {
  return (Array.isArray(value) ? value : [value]).filter(v => v);
}

export function isEmpty(value = null) {
  if (value && value !== null) switch (typeof value) {
    case 'boolean': return false;
    case 'number': return isNaN(value) && value !== 0;
    case 'string': return value.trim().length === 0;
    default:
      if (moment.isDate(value))
        return !moment(value).isValid();
  }
  return true;
}

export function getRwdSizeName() {
  const width = window.clientWidth;

  return width < 576 ? 'def' : width < 768 ? 'sm' : width < 992 ? 'md' : width < 1200 ? 'lg' : 'xl';
}

export function getGridClassName({ def = null, sm = null, md = null, lg = null, xl = null } = {}) {
  const opts = { sm, md, lg, xl };
  const cls = [
    'col',
    def === null ? 'col-12' : def === false || 'number' !== typeof def || isNaN(def) ? 'col-none' : `col-${def}`
  ];

  Object.keys(opts).filter(size =>
    opts[size] !== null && (opts[size] === false || ('number' === typeof opts[size] && !isNaN(opts[size])))
  ).forEach(size => cls.push(
    opts[size] === false ? `col-${size}-none` : `col-${size}-${opts[size]}`
  ));
  return cls.join(' ');
}


// TODO: For <KekkaiContainer />
export function $RemoteState($container, $symbol) {
  const symbol = Symbol('TRANS');

  $container[symbol] = $container[$symbol];
  delete $container[$symbol];

  return symbol;
}

export function generateMessageOpts() {
  return { type: 'info', icon: null, title: null, show: false, content: null, callbackFn: null };
}

export function generateSort(intiData) {
  return intiData.$fieldOpts
    .filter(({ type, props: { sortable = false } }) => type === KekkaiField && 'boolean' !== typeof sortable)
    .map(({ props: { name, sortable }, $sortable = KekkaiField.getSortable({ sortable }) }) => ({
      name,
      dir: $sortable.dir.toLowerCase(),
      seq: $sortable.seq
    }))
    .sort((s1, s2) => s1.seq - s2.seq)
    .map(({ name, dir }) => ({ name, dir }));
}

export function generateCardOptions(initData, columns) {
  return columns ? columns : initData.$fieldOpts.filter(
    ({ type }) => KekkaiField === type
  ).map(({
    key,
    props: {
      name = key,
      label,
      card = { def: 12 },
      sortable = false
    }
  }) => ({
    name,                                            // 欄位名稱 (React key)
    label,
    width: getGridClassName(card),                   // 寬度 (false 表隱藏)
    sortable
  }));
}

export function generateListOptions(initData, columns) {
  const { props: { reorderable = false } } = initData.$dataviewOpts;

  return columns ? columns : initData.$fieldOpts.filter(
    ({ type }) => KekkaiField === type
  ).sort(
    ({ locked: l1 = false }, { locked: l2 = false }) => l1 === l2 ? 0 : l1 === true ? -1 : 1
  ).map(({
    key,
    props: {
      name = key,
      label,
      list = defaultListColumnWidth,
      filter = null,
      locked = false,
      hidden = false,
      resizable = false,
      lockable = false,
      hideable = true,
      sortable = false
    }
  }, i) => ({
    name,                                            // 欄位名稱 (React key)
    label,
    width: list,                                     // 寬度 (false 表隱藏)
    locked,                                          // 是否為鎖定欄位
    seq: i,                                          // 欄位順序
    hidden,                                          // 隱藏狀態
    filterUID: filter === null ? null : UUID(),      // 過濾識別碼
    filter,                                          // 是否具有資料過濾功能
    resizable,                                       // 可否重新調整欄寬
    lockable,                                        // 可否手動設置欄位鎖定狀態
    reorderable,                                     // 可否任意進行欄位拖曳排序
    hideable: hideable && 'string' === typeof label, // 可否自行變更欄位隱藏狀態
    sortable
  }));
}


// TODO: For <KekkaiDataview />
function onListRowActived(isActive = false, lockedRow, row) {
  lockedRow.classList[isActive ? 'add' : 'remove']('active');
  row.classList[isActive ? 'add' : 'remove']('active');
}

function onListRowHovered(isHover = false, lockedRow, row, e) {
  lockedRow.classList[isHover ? 'add' : 'remove']('hover');
  row.classList[isHover ? 'add' : 'remove']('hover');
}

export function bindListRowSyncEvents(lockedRow, row) {
  [{
    name: 'mousedown', fn: onListRowActived, value: true
  }, {
    name: 'mouseup', fn: onListRowActived, value: false
  }, {
    name: 'mouseover', fn: onListRowHovered, value: true
  }, {
    name: 'mouseleave', fn: [onListRowHovered, onListRowActived], value: false
  }, {
    name: 'mouseout', fn: [onListRowHovered, onListRowActived], value: false
  }].forEach(({ name, fn, value }) => {
    lockedRow.addEventListener(name, (e) => toArray(fn).forEach($fn => $fn(value, lockedRow, row, e)));
    row.addEventListener(name, (e) => toArray(fn).forEach($fn => $fn(value, lockedRow, row, e)));
  });
}