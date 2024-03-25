/** Emitted by qwik-loader when an element becomes visible. Used by `useVisibleTask$` @public */
export type QwikVisibleEvent = CustomEvent<IntersectionObserverEntry>;
/** Emitted by qwik-loader when a module was lazily loaded @public */
export type QwikSymbolEvent = CustomEvent<{
  symbol: string;
  element: Element;
  reqTime: number;
}>;
/** Emitted by qwik-loader on document when the document first becomes interactive @public */
export type QwikInitEvent = CustomEvent<{}>;
/** Emitted by qwik-loader on document when the document first becomes idle @public */
export type QwikIdleEvent = CustomEvent<{}>;

export interface QContainerElement {
  qFuncs?: Function[];
  _qwikjson_?: any;
}

export interface VirtualElement {
  readonly open: Comment;
  readonly close: Comment;
  readonly isSvg: boolean;
  readonly insertBefore: <T extends Node>(node: T, child: Node | null) => T;
  readonly appendChild: <T extends Node>(node: T) => T;
  readonly insertBeforeTo: (newParent: QwikElement, child: Node | null) => void;
  readonly appendTo: (newParent: QwikElement) => void;
  readonly ownerDocument: Document;
  readonly namespaceURI: string;
  readonly nodeType: 111;
  readonly childNodes: Node[];
  readonly firstChild: Node | null;
  readonly previousSibling: Node | null;
  readonly nextSibling: Node | null;
  readonly remove: () => void;
  readonly closest: (query: string) => Element | null;
  readonly hasAttribute: (prop: string) => boolean;
  readonly getAttribute: (prop: string) => string | null;
  readonly removeAttribute: (prop: string) => void;
  readonly querySelector: (query: string) => QwikElement | null;
  readonly querySelectorAll: (query: string) => QwikElement[];
  readonly compareDocumentPosition: (other: Node) => number;
  readonly matches: (query: string) => boolean;
  readonly setAttribute: (prop: string, value: string) => void;
  readonly removeChild: (node: Node) => void;
  readonly localName: string;
  readonly nodeName: string;
  readonly isConnected: boolean;
  readonly parentElement: Element | null;
  innerHTML: string;
}
export type QwikElement = Element | VirtualElement;

export type Listener = [eventName: string, qrl: any];

export interface ProcessedJSXNode {
  $type$: any;
  $id$: string;
  $props$: Record<string, any>;
  $immutableProps$: Record<string, any> | null;
  $flags$: number;
  $children$: ProcessedJSXNode[];
  $key$: string | null;
  $elm$: Node | VirtualElement | null;
  $text$: string;
  $signal$: any | null;
  $dev$?: any;
}
/** Qwik Context of an element. */
export interface QContext {
  /** VDOM element. */
  $element$: QwikElement;
  $refMap$: any[];
  $flags$: number;
  /** QId, for referenced components */
  $id$: string;
  /** Proxy for the component props */
  $props$: Record<string, any> | null;
  /** The QRL if this is `component$`-wrapped component. */
  $componentQrl$: any;
  /** The event handlers for this element */
  li: Listener[];
  /** Sequential data store for hooks, managed by useSequentialScope. */
  $seq$: any[] | null;
  $tasks$: any[] | null;
  /** The public contexts defined on this (always Virtual) component, managed by useContextProvider. */
  $contexts$: Map<string, any> | null;
  $appendStyles$: any[] | null;
  $scopeIds$: string[] | null;
  $vdom$: ProcessedJSXNode | null;
  $slots$: ProcessedJSXNode[] | null;
  $dynamicSlots$: QContext[] | null;
  /**
   * The Qwik Context of the virtual parent component, null if no parent. For an real element, it's
   * the owner virtual component, and for a virtual component it's the wrapping virtual component.
   */
  $parentCtx$: QContext | null | undefined;
  /**
   * During SSR, separately store the actual parent of slotted components to correctly pause
   * subscriptions
   */
  $realParentCtx$: QContext | undefined;
}
