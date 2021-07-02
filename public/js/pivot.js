class Pivot {
  constructor(options) {
    this.config = Pivot.mergeSettings(options);

    this.elem =
      typeof this.config.selector === "string"
        ? document.querySelector(this.config.selector)
        : this.config.selector;

    if (this.elem === null) {
      throw new Error("Something wrong with your Pivot selector 😭");
    }

    this.panes = Array.from(this.elem.children);

    if (this.panes.some((p) => !p.dataset || !p.dataset.title)) {
      throw new Error('Every Pivot pane must have the "data-title" attribute');
    }

    this.selected = 0;
    this.pointerDown = false;
    this.clearDrag();

    this.init();
  }

  init() {
    this.attachEvents();

    const nav = document.createElement("nav");
    nav.classList.add("pivot__nav");

    const headers = (this.headersElem = document.createElement("ul"));
    headers.classList.add("pivot__headers");
    nav.appendChild(headers);

    const panes = (this.panesElem = document.createElement("div"));
    panes.classList.add("pivot__panes");
    panes.style.width = `${this.panes.length * 100}vw`;
    panes.style.maxWidth = `${this.panes.length * 1440}px`;

    for (const p of this.panes) {
      const title = p.dataset.title;
      const header = document.createElement("li");
      header.classList.add("pivot__header");
      header.innerText = title;
      headers.appendChild(header);

      const pane = document.createElement("div");
      pane.classList.add("pivot__pane");
      const content = document.createElement("div");
      content.classList.add("pivot__panecontent");
      pane.appendChild(content);
      content.innerHTML = p.innerHTML;
      panes.appendChild(pane);
    }

    this.scrollTo(this.selected);

    this.elem.innerHTML = "";
    this.elem.appendChild(nav);
    this.elem.appendChild(panes);
  }

  attachEvents() {
    this.elem.addEventListener("touchstart", this.touchstartHandler.bind(this));
    this.elem.addEventListener("touchend", this.touchendHandler.bind(this));
    this.elem.addEventListener("touchmove", this.touchmoveHandler.bind(this));

    this.elem.addEventListener("mousedown", this.mousedownHandler.bind(this));
    this.elem.addEventListener("mouseup", this.mouseupHandler.bind(this));
    this.elem.addEventListener("mouseleave", this.mouseleaveHandler.bind(this));
    this.elem.addEventListener("mousemove", this.mousemoveHandler.bind(this));
  }

  clearDrag() {
    this.drag = {
      startX: 0,
      endX: 0,
      startY: 0,
      letItGo: null,
    };
  }

  disableTransition() {
    this.panesElem.style.transition = this.headersElem.style.transition =
      "none";
  }

  enableTransition() {
    this.panesElem.style.transition = this.headersElem.style.transition =
      "transform 300ms ease";
  }

  touchstartHandler(e) {
    const ignore =
      ["TEXTAREA", "OPTION", "INPUT", "SELECT"].indexOf(e.target.nodeName) !==
      -1;
    if (ignore) {
      return;
    }

    e.stopPropagation();
    this.pointerDown = true;
    this.drag.startX = e.touches[0].pageX;
    this.drag.startY = e.touches[0].pageY;
  }

  touchendHandler(e) {
    e.stopPropagation();
    this.pointerDown = false;
    this.enableTransition();
    if (this.drag.endX) {
      this.updateAfterDrag();
    }
    this.clearDrag();
  }

  touchmoveHandler(e) {
    e.stopPropagation();

    if (this.drag.letItGo === null) {
      this.drag.letItGo =
        Math.abs(this.drag.startY - e.touches[0].pageY) <
        Math.abs(this.drag.startX - e.touches[0].pageX);
    }

    if (this.pointerDown && this.drag.letItGo) {
      e.preventDefault();
      this.disableTransition();

      this.drag.endX = e.touches[0].pageX;
      const offset = Pivot.snapToRange(
        -window.innerWidth,
        window.innerWidth,
        e.touches[0].pageX - this.drag.startX
      );
      const offsetRatio = Pivot.snapToRange(-1, 1, offset / window.innerWidth);
      this.panesElem.style.transform = `translateX(${
        this.selected * -1 * Pivot.paneOffset() + offset
      }px)`;

      const currentHeader = this.headersElem.children[this.selected];
      this.headersElem.style.transform = `translateX(-${
        -1 * this.headerPositionLeft(this.selected) -
        currentHeader.clientWidth * offsetRatio
      }px)`;
    }
  }

  mousedownHandler(e) {
    const ignore =
      ["TEXTAREA", "OPTION", "INPUT", "SELECT"].indexOf(e.target.nodeName) !==
      -1;
    if (ignore) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    this.pointerDown = true;
    this.drag.startX = e.pageX;
  }

  mouseupHandler(e) {
    e.stopPropagation();
    this.pointerDown = false;
    this.elem.style.cursor = "-webkit-grab";
    this.enableTransition();
    if (this.drag.endX) {
      this.updateAfterDrag();
    }
    this.clearDrag();
  }

  mouseleaveHandler(e) {
    if (this.pointerDown) {
      this.mouseupHandler(e);
    }
  }

  mousemoveHandler(e) {
    e.preventDefault();

    if (this.drag.letItGo === null) {
      this.drag.letItGo =
        Math.abs(this.drag.startY - e.pageY) <
        Math.abs(this.drag.startX - e.pageX);
    }

    if (this.pointerDown && this.drag.letItGo) {
      e.preventDefault();
      this.disableTransition();
      this.elem.style.cursor = "-webkit-grabbing";

      this.drag.endX = e.pageX;
      const offset = Pivot.snapToRange(
        -window.innerWidth,
        window.innerWidth,
        e.pageX - this.drag.startX
      );
      const offsetRatio = Pivot.snapToRange(-1, 1, offset / window.innerWidth);
      this.panesElem.style.transform = `translateX(${
        this.selected * -1 * Pivot.paneOffset() + offset
      }px)`;

      const currentHeader = this.headersElem.children[this.selected];
      this.headersElem.style.transform = `translateX(-${
        -1 * this.headerPositionLeft(this.selected) -
        currentHeader.clientWidth * offsetRatio
      }px)`;
    }
  }

  updateAfterDrag() {
    const movement = this.drag.endX - this.drag.startX;
    const movementDistance = Math.abs(movement);

    if (
      movement > 0 &&
      movementDistance > this.config.threshold &&
      this.selected > 0
    ) {
      this.selected -= 1;
    } else if (
      movement < 0 &&
      movementDistance > this.config.threshold &&
      this.selected < this.panes.length - 1
    ) {
      this.selected += 1;
    }

    this.scrollTo(this.selected);
  }

  scrollTo(i) {
    this.selected = i;

    this.headersElem.style.transform = `translateX(${
      this.headerPositionLeft(this.selected) * -1
    }px)`;

    for (let j = 0; j < this.headersElem.children.length; j++) {
      const header = this.headersElem.children[j];
      i === j
        ? header.classList.add("selected")
        : header.classList.remove("selected");
    }

    this.panesElem.style.transform = `translateX(${
      i * -1 * Pivot.paneOffset()
    }px)`;

    this.elem.dispatchEvent(
      new CustomEvent("changed", {
        detail: { i, title: this.panes[i].dataset.title },
      })
    );
  }

  headerPositionLeft(i) {
    return Array.from(this.headersElem.children)
      .slice(0, i)
      .map(window.getComputedStyle)
      .map((s) => parseFloat(s.width) + parseFloat(s.paddingRight))
      .reduce((acc, w) => acc + w, 0);
  }

  static mergeSettings(options) {
    const settings = {
      selector: ".pivot",
      threshold: 20,
    };

    return { ...settings, ...options };
  }

  static paneOffset() {
    return Math.min(window.innerWidth, 1440);
  }

  static remToPx(rem) {
    return rem * parseInt(getComputedStyle(document.documentElement).fontSize);
  }

  static snapToRange(min, max, val) {
    return val < min ? min : val > max ? max : val;
  }
}

window.Pivot = Pivot;
