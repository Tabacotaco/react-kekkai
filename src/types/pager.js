const Symbols = {
  options: Symbol('OPTIONS'),
  status: Symbol('STATUS'),
  doChange: Symbol('DO_CHANGE')
};

export default class KekkaiPager {
  [Symbols.options] = {};

  [Symbols.status] = {
    total: 0,
    currPage: 1
  };

  constructor(pageSize = 10, onPagerChange = () => { }) {
    this[Symbols.options] = { pageSize, onPagerChange };
  }

  get total() { return this[Symbols.status].total; }

  get page() { return this[Symbols.status].currPage; }

  get pageSize() { return this[Symbols.options].pageSize; }

  get maxPage() { return Math.max(1, Math.ceil(this.total / this.pageSize)); }

  get skip() { return (this.page - 1) * this.pageSize; }

  get start() { return this.skip + 1; }

  get end() { return Math.max(1, Math.min(this.skip + this.pageSize, this.total)); }

  get params() {
    return {
      page: this.page,
      pageSize: this.pageSize,
      skip: this.skip,
      start: this.start
    };
  }

  set total(value) {
    const ori = this.total;

    this[Symbols.status].total = 'number' === typeof value && !isNaN(value)? value : 0;
    this[Symbols.doChange]('TOTAL', ori, this.total);
  }

  set page(value) {
    const ori = this.page;

    this[Symbols.status].currPage = Math.min(
      Math.max(1, 'number' === typeof value && !isNaN(value)? value : ori),
      this.maxPage
    );
    this[Symbols.doChange]('PAGE', ori, this.page);
  }

  set pageSize(value) {
    const ori = this.pageSize;
    const start = this.start;

    this[Symbols.options].pageSize = 'number' === typeof value && !isNaN(value) ? value : ori;
    this[Symbols.status].currPage = Math.max(1, Math.ceil(start / this.pageSize));
    this[Symbols.doChange]('PAGE_SIZE', ori, this.pageSize);
  }

  toNext() {
    this.page = Math.min(this.maxPage, this.page + ((this.page * this.pageSize) < this.total? 1 : 0));
  }

  toPrev() {
    this.page = Math.max(1, this.page - (this.page > 1? 1 : 0));
  }

  toFirst() {
    this.page = 1;
  }

  toLast () {
    this.page = Math.ceil(this.total / this.pageSize);
  }

  [Symbols.doChange](changeType, oriValue, newValue) {
    if (oriValue !== newValue)
      this[Symbols.options].onPagerChange(changeType, this);
  }
}