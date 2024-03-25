import type {
  QwikSymbolEvent,
  QwikVisibleEvent,
  QContext,
} from "./qwik-types.ts";

/**
 * Set up event listening for browser.
 *
 * Determine all the browser events and set up global listeners for them. If browser triggers event
 * search for the lazy load URL and `import()` it.
 *
 * @param doc - Document to use for setting up global listeners, and to determine all the browser
 *   supported events.
 */
export const createEvent = <T extends CustomEvent = any>(
  eventName: string,
  detail?: T["detail"]
) =>
  new CustomEvent(eventName, {
    detail,
  }) as T;

export const qwikLoader = (doc: any, hasInitialized?: number) => {
  const Q_CONTEXT = "__q_context__";
  const QC = "_qc_";
  const qFuncs = "qFuncs";
  const BASE = "q:base";
  const CONTAINER = "[q\\:container]";
  const TYPE_QWIK_JSON = "qwik/json";
  const win = window as any;
  const events = new Set();

  // Some shortenings for minification
  const replace = "replace";
  const forEach = "forEach";
  const target = "target";
  const getAttribute = "getAttribute";
  const isConnected = "isConnected";
  const qvisible = "qvisible";
  const Q_JSON = "_qwikjson_";
  const querySelectorAll = (query: string) => {
    return doc.querySelectorAll(query);
  };

  const broadcast = (infix: string, ev: any, type = ev.type) => {
    querySelectorAll("[on-" + infix + "\\:" + type + "]")[forEach]((el: any) =>
      dispatch(el, infix, ev, type)
    );
  };

  const resolveContainer = (containerEl: any) => {
    if ((containerEl as any)[Q_JSON] === undefined) {
      const parentJSON =
        containerEl === doc.documentElement ? doc.body : containerEl;
      let script = parentJSON.lastElementChild;
      while (script) {
        if (
          script.tagName === "SCRIPT" &&
          script[getAttribute]("type") === TYPE_QWIK_JSON
        ) {
          (containerEl as any)[Q_JSON] = JSON.parse(
            script.textContent![replace](/\\x3C(\/?script)/gi, "<$1")
          );
          break;
        }
        script = script.previousElementSibling;
      }
    }
  };

  const dispatch = async (
    element: any,
    onPrefix: string,
    ev: Event,
    eventName = ev.type
  ) => {
    const attrName = "on" + onPrefix + ":" + eventName;
    if (element.hasAttribute("preventdefault:" + eventName)) {
      ev.preventDefault();
    }
    const ctx = (element as any)[QC] as QContext | undefined;
    const relevantListeners = ctx && ctx.li.filter((li) => li[0] === attrName);
    if (relevantListeners && relevantListeners.length > 0) {
      for (const listener of relevantListeners) {
        // listener[1] holds the QRL
        await listener[1].getFn([element, ev], () => element[isConnected])(
          ev,
          element
        );
      }
      return;
    }
    const attrValue = element[getAttribute](attrName);
    if (attrValue) {
      const container = element.closest(CONTAINER)!;
      // get q:base which is base url for the container
      const base = new URL(container[getAttribute](BASE)!, doc.baseURI);
      // split urls by newline
      const separator = "\n";
      for (const qrl of attrValue.split(separator)) {
        // create full url
        const url = new URL(qrl, base);
        // get symbol name
        const symbolName =
          url.hash[replace](/^#?([^?[|]*).*$/, "$1") || "default";
        const reqTime = performance.now();
        let handler: any;
        // check if the symbol is synchronous
        // feat: sync: protocol for synchronous symbols
        const isSync = url.protocol === "sync:" || qrl.startsWith("#");
        if (isSync && Array.isArray((container as any)[qFuncs])) {
          handler = (container as any)[qFuncs][Number.parseInt(symbolName, 10)];
        } else {
          const [uri] = url.href.split("#");
          // @ts-ignore
          const factory = import(/* @vite-ignore */ uri);
          resolveContainer(container);
          const module = await factory;
          handler = module[symbolName];
        }

        const previousCtx = doc[Q_CONTEXT];
        if (element[isConnected]) {
          try {
            doc[Q_CONTEXT] = [element, ev, url];
            // emit event if symbol is async
            isSync ||
              emitEvent<QwikSymbolEvent>("qsymbol", {
                symbol: symbolName,
                element: element,
                reqTime,
              });
            await handler(ev, element);
          } finally {
            doc[Q_CONTEXT] = previousCtx;
          }
        }
      }
    }
  };

  const emitEvent = <T extends CustomEvent = any>(
    eventName: string,
    detail?: T["detail"]
  ) => {
    doc.dispatchEvent(createEvent<T>(eventName, detail));
  };

  const camelToKebab = (str: string) =>
    str[replace](/([A-Z])/g, (a) => "-" + a.toLowerCase());

  /**
   * Event handler responsible for processing browser events.
   *
   * If browser emits an event, the `eventProcessor` walks the DOM tree looking for corresponding
   * `(${event.type})`. If found the event's URL is parsed and `import()`ed.
   *
   * @param ev - Browser event.
   */
  const processDocumentEvent = async (ev: Event) => {
    // eslint-disable-next-line prefer-const
    let type = camelToKebab(ev.type);
    let element = ev[target] as any | null;
    broadcast("document", ev, type);

    while (element && element[getAttribute]) {
      await dispatch(element, "", ev, type);
      element =
        ev.bubbles && ev.cancelBubble !== true ? element.parentElement : null;
    }
  };

  const processWindowEvent = (ev: Event) => {
    broadcast("window", ev, camelToKebab(ev.type));
  };

  const processReadyStateChange = () => {
    const readyState = doc.readyState;
    if (
      !hasInitialized &&
      (readyState == "interactive" || readyState == "complete")
    ) {
      // document is ready
      hasInitialized = 1;

      emitEvent("qinit");
      const riC = win.requestIdleCallback ?? win.setTimeout;
      riC.bind(win)(() => emitEvent("qidle"));

      if (events.has(qvisible)) {
        const results = querySelectorAll("[on\\:" + qvisible + "]");
        const observer = new (window as any).IntersectionObserver(
          (entries: any) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                observer.unobserve(entry[target]);
                dispatch(
                  entry[target],
                  "",
                  createEvent<QwikVisibleEvent>(qvisible, entry)
                );
              }
            }
          }
        );
        results[forEach]((el: any) => observer.observe(el));
      }
    }
  };

  const addEventListener = (
    el: any | Window,
    eventName: string,
    handler: (ev: Event) => void,
    capture = false
  ) => {
    return el.addEventListener(eventName, handler, { capture, passive: false });
  };

  const push = (eventNames: string[]) => {
    for (const eventName of eventNames) {
      if (!events.has(eventName)) {
        addEventListener(doc, eventName, processDocumentEvent, true);
        addEventListener(win, eventName, processWindowEvent);
        events.add(eventName);
      }
    }
  };

  if (!(Q_CONTEXT in doc)) {
    // Mark qwik-loader presence but falsy
    doc[Q_CONTEXT] = 0;
    const qwikevents = win.qwikevents;
    // If `qwikEvents` is an array, process it.
    if (Array.isArray(qwikevents)) {
      push(qwikevents);
    }
    // Now rig up `qwikEvents` so we get notified of new registrations by other containers.
    win.qwikevents = {
      push: (...e: string[]) => push(e),
    };
    addEventListener(doc, "readystatechange", processReadyStateChange);
    processReadyStateChange();
  }
};

export interface QwikLoaderMessage extends MessageEvent {
  data: string[];
}
