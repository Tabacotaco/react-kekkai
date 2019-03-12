import React from 'react';

import Navbar, {
  Nav,
  NavBtn,
  NavText,
  NavInput,
  NavMenu,
  MenuDivider
} from 'tool/navbar';


export default function KekkaiPagerbar({ bgColor, txColor, pager: $p, onRefresh }) {
  return (
    <Navbar className="pagerbar" style={{ backgroundColor: bgColor, color: txColor }}>
      <Nav>
        <NavBtn icon="fa fa-step-backward" disabled={$p.page === 1} onClick={() => $p.toFirst()} />
        <NavBtn icon="fa fa-chevron-left" disabled={$p.page === 1} onClick={() => $p.toPrev()} />

        <NavInput type="number" className="pager-input" min="1" max={$p.maxPage} value={$p.page} onChange={({ target }) =>
          $p.page = parseFloat(target.value)
        } />

        <NavBtn icon="fa fa-chevron-right" disabled={$p.page === $p.maxPage} onClick={() => $p.toNext()} />
        <NavBtn icon="fa fa-step-forward" disabled={$p.page === $p.maxPage} onClick={() => $p.toLast()} />

        {$p.pageSize === 1 ? null : (
          <NavMenu tag="li" bgColor={bgColor} txColor={txColor} display={
            $p.pageSize === 100 ? '顯示全部資料' : `每頁 ${$p.pageSize} 筆`
          }>
            <NavBtn key="all" onClick={() => $p.pageSize = 100}>顯示全部資料</NavBtn>

            <MenuDivider key="divider" color={txColor} />

            <NavBtn key="50" onClick={() => $p.pageSize = 50}>50 筆</NavBtn>
            <NavBtn key="25" onClick={() => $p.pageSize = 25}>25 筆</NavBtn>
            <NavBtn key="10" onClick={() => $p.pageSize = 10}>10 筆</NavBtn>
          </NavMenu>
        )}
      </Nav>

      <Nav align="right">
        <NavText>顯示 {$p.start}-{$p.end} 筆 / 共 {$p.maxPage} 頁</NavText>

        {$p.total === 0 ? null : (
          <NavBtn icon="fa fa-refresh" onClick={onRefresh} />
        )}
      </Nav>
    </Navbar>
  );
}