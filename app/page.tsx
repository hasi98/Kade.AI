"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CalendarDays,
  ChevronUp,
  Clock,
  Gift,
  History,
  Bookmark,
  Loader2,
  MapPin,
  MessageCircle,
  Mic,
  Minus,
  Moon,
  Sun,
  Package,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
  Truck,
  User,
  Check,
  ExternalLink,
  X,
} from "lucide-react";
import clsx from "clsx";
import { GoogleGenAI, Modality } from "@google/genai";
import type { CartItem, ChatMessage, Product, SelectedProduct } from "@/lib/types";
import styles from "./page.module.css";

/* ── Helpers ── */

const prompts = [
  "🎂 Birthday cake under LKR 8000 to Colombo",
  "🌺 අම්මාට flowers gift එකක් බලමු",
  "🍫 Premium chocolate hamper for a friend",
  "🎁 Machan surprise gift karanna, budget 5000",
];

const today = new Date().toISOString().slice(0, 10);

function money(price?: { amount: number | null; currency: string }) {
  if (!price || price.amount == null) return "Price on request";
  return `Rs. ${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(price.amount)}`;
}

function firstImage(product: Product) {
  return product.image_url || product.images?.[0] || "";
}

function labelText(label?: string) {
  switch (label) {
    case "AI_RECOMMENDATION": return "AI Recommendation";
    case "DIRECT_LINK": return "Direct Link";
    case "SEARCH_RESULT": return "Search Result";
    case "DELIVERY_INFO": return "Delivery Info";
    case "ORDER_UPDATE": return "Order Update";
    default: return null;
  }
}

/* ── Main Page ── */

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey! I'm **Kade**, your personal shopping concierge for Kapruka.com 🛍️\n\nTell me who you're shopping for — the occasion, your budget, and the delivery city. I'll find the perfect products, check delivery, and create your secure checkout link.\n\nI speak English, සිංහල, and Tanglish!",
      label: "AI_RECOMMENDATION",
      quickReplies: prompts,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);
  const [giftWrap, setGiftWrap] = useState(false);
  const [personalNote, setPersonalNote] = useState(false);
  const [city, setCity] = useState("Colombo 07");
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkout, setCheckout] = useState({
    recipientName: "",
    recipientPhone: "",
    address: "",
    senderName: "",
    anonymous: false,
    giftMessage: "",
  });
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const [showLiveCall, setShowLiveCall] = useState(false);
  const closeLiveCall = useCallback(() => setShowLiveCall(false), []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Conversation history for Gemini
  const conversationHistory = useMemo(() => {
    return messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.text }],
      }));
  }, [messages]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + (item.product.price?.amount ?? 0) * item.quantity, 0),
    [cart]
  );

  const canCheckout =
    cart.length > 0 &&
    checkout.recipientName.trim() &&
    checkout.recipientPhone.trim() &&
    checkout.address.trim();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (cart.length === 0) {
      setCartOpen(false);
    }
  }, [cart.length]);

  /* ── Chat ── */

  const sendMessage = useCallback(
    async (text = input, audioData?: { data: string; mimeType: string }) => {
      const trimmed = text.trim();
      if ((!trimmed && !audioData) || loading) return;

      const userMessage: ChatMessage = { 
        id: crypto.randomUUID(), 
        role: "user", 
        text: trimmed || (audioData ? "🔊 Audio Message" : "") 
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: conversationHistory,
            audio: audioData,
          }),
        });

        const data = await res.json();

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.reply || "I couldn't process that. Try again?",
          products: data.products?.length ? data.products : undefined,
          label: data.label || "AI_RECOMMENDATION",
          quickReplies: data.products?.length
            ? ["Show more options", "Check delivery cost", "Add all to cart"]
            : ["Browse cakes 🎂", "Find flowers 🌺", "Chocolate gifts 🍫", "Track my order"],
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Auto-select first product for detail panel
        if (data.products?.length && !selectedProduct) {
          setSelectedProduct({ product: data.products[0] });
          setDetailOpen(true);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "Something went wrong connecting to the server. Please try again! 🙏",
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, conversationHistory, selectedProduct]
  );

  function addToCart(product: Product) {
    setCartOpen(true);
    setCart((prev) => {
      const found = prev.find((item) => item.product.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  async function createOrder() {
    if (!cart.length) return;
    setBusyAction("order");
    setOrder(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            icing_text: item.icing_text || null,
          })),
          recipient: {
            name: checkout.recipientName,
            phone: checkout.recipientPhone,
          },
          delivery: {
            address: checkout.address,
            city,
            date: deliveryDate,
            location_type: "house",
            instructions: null,
          },
          sender: {
            name: checkout.senderName || "Kade AI shopper",
            anonymous: checkout.anonymous,
          },
          gift_message: checkout.giftMessage || null,
          currency: "LKR",
        }),
      });
      setOrder(await res.json());
    } finally {
      setBusyAction(null);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage();
  }

  const payUrl =
    typeof order?.pay_url === "string"
      ? order.pay_url
      : typeof order?.payment_url === "string"
        ? order.payment_url
        : null;

  return (
    <main
      className={clsx(
        styles.shell,
        !cartOpen && styles.cartCollapsed,
        !detailOpen && styles.detailCollapsed
      )}
    >
      {/* ═══ LEFT: Cart Sidebar ═══ */}
      <aside className={styles.cartSidebar}>
        {cartOpen ? (
          <>
            <div className={styles.cartHeader}>
              <div>
                <h2>Cart</h2>
                <p className={styles.cartSecured}>Secured by Kapruka</p>
              </div>
              <button className={styles.panelCloseBtn} onClick={() => setCartOpen(false)} aria-label="Close cart">
                <X size={16} />
              </button>
            </div>

            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <p className={styles.cartEmpty}>Search for products and add them here</p>
              ) : (
                cart.map((item) => (
                  <div className={styles.cartItem} key={item.product.id}>
                    {firstImage(item.product) ? (
                      <img className={styles.cartItemImg} src={firstImage(item.product)} alt="" />
                    ) : (
                      <div className={styles.cartItemFallback}>
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className={styles.cartItemInfo}>
                      <h4>{item.product.name}</h4>
                      <span className={styles.cartItemPrice}>{money(item.product.price)}</span>
                      <div className={styles.cartItemQty}>
                        <button onClick={() => updateQuantity(item.product.id, -1)} aria-label="Decrease">
                          <Minus size={12} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} aria-label="Increase">
                          <Plus size={12} />
                        </button>
                        <button
                          className={styles.cartItemRemove}
                          onClick={() => updateQuantity(item.product.id, -99)}
                          aria-label="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.cartFooter}>
              <div className={styles.cartTotal}>
                <span>Total</span>
                <span className={styles.cartTotalPrice}>{money({ amount: total, currency: "LKR" })}</span>
              </div>
              <button
                className={styles.checkoutBtn}
                disabled={cart.length === 0}
                onClick={() => setShowCheckout(true)}
              >
                <ShoppingBag size={16} />
                Proceed to Secure Kapruka Checkout
              </button>
            </div>

            <nav className={styles.bottomNav}>
              <button className={styles.bottomNavItem}>
                <History size={16} />
                History
              </button>
              <button className={styles.bottomNavItem}>
                <Bookmark size={16} />
                Saved
              </button>
              <button className={styles.bottomNavItem}>
                <Ticket size={16} />
                Vouchers
              </button>
              <button className={styles.bottomNavItem}>
                <Settings size={16} />
                Settings
              </button>
            </nav>
          </>
        ) : (
          <button
            className={styles.collapsedPanelBtn}
            onClick={() => cart.length > 0 && setCartOpen(true)}
            disabled={cart.length === 0}
            aria-label="Open cart"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && <span>{cart.length}</span>}
          </button>
          )}
      </aside>

      {/* ═══ CENTER: Chat ═══ */}
      <section className={styles.chatPane}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>
              <ShoppingBag size={20} />
            </div>
            <div className={styles.brandText}>
              <h1>Kade AI</h1>
              <span>Gemini buyer desk</span>
            </div>
          </div>

          <nav className={styles.navTabs}>
            <button className={styles.navTab}>Workspace</button>
            <button className={styles.navTab}>History</button>
            <button className={clsx(styles.navTab, styles.navTabActive)}>Explore</button>
          </nav>

          <div className={styles.topbarActions}>
            <div className={styles.livePill}>
              <span />
              MCP live
            </div>
            <button 
              className={clsx(styles.iconBtn, styles.themeToggle)} 
              aria-label={darkMode ? 'Light mode' : 'Dark mode'}
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className={styles.iconBtn}
              aria-label="Cart"
              onClick={() => cart.length > 0 && setCartOpen(true)}
              disabled={cart.length === 0}
            >
              <ShoppingCart size={18} />
            </button>
            <button className={styles.avatarBtn} aria-label="Profile">
              <User size={16} />
            </button>
          </div>
        </header>

        <div className={styles.messages}>
          {messages.length <= 1 && (
          <section className={styles.commandDeck}>
            <div className={styles.commandHero}>
              <div className={styles.commandKicker}>
                <Sparkles size={14} />
                Sri Lankan gift intelligence
              </div>
              <h2>Shop by feeling, not filters.</h2>
              <p>Say the person, occasion, budget, and city. Kade will turn it into live Kapruka products, delivery checks, and a cart.</p>
            </div>
            <div className={styles.giftLanes}>
              <button type="button" onClick={() => sendMessage("Birthday cake under LKR 8000 to Colombo")}>
                <Gift size={17} />
                <span>Birthday rescue</span>
              </button>
              <button type="button" onClick={() => sendMessage("Premium tea and biscuits hamper for office delivery")}>
                <Package size={17} />
                <span>Office hamper</span>
              </button>
              <button type="button" onClick={() => sendMessage("Red roses with chocolates to Galle tomorrow")}>
                <Sparkles size={17} />
                <span>Romance run</span>
              </button>
              <button type="button" onClick={() => sendMessage("අම්මාට ලස්සන gift එකක් budget 5000")}>
                <MessageCircle size={17} />
                <span>Sinhala mode</span>
              </button>
            </div>
          </section>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={clsx(styles.message, message.role === "user" && styles.messageUser)}
            >
              <div className={styles.messageAvatar}>
                {message.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={styles.messageBubble}>
                {message.label && labelText(message.label) && (
                  <div
                    className={clsx(
                      styles.messageLabel,
                      message.label === "DIRECT_LINK" && styles.messageLabelLink
                    )}
                  >
                    {message.label === "AI_RECOMMENDATION" && <Sparkles size={10} />}
                    {message.label === "SEARCH_RESULT" && <Search size={10} />}
                    {message.label === "DELIVERY_INFO" && <Truck size={10} />}
                    {labelText(message.label)}
                  </div>
                )}

                <div className={styles.messageText}>
                  <MessageContent text={message.text} />
                </div>

                {message.products?.length ? (
                  <div className={styles.productGrid}>
                    {message.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={addToCart}
                        onSelect={() => {
                          setSelectedProduct({ product });
                          setDetailOpen(true);
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                {message.quickReplies && (
                  <div className={styles.quickReplies}>
                    {message.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        className={styles.quickReplyBtn}
                        onClick={() => sendMessage(reply)}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}

          {loading && (
            <article className={styles.message}>
              <div className={styles.messageAvatar}>
                <Bot size={16} />
              </div>
              <div className={styles.messageBubble}>
                <div className={styles.typing}>
                  <div className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                  Searching Kapruka...
                </div>
              </div>
            </article>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showLiveCall ? (
          <LiveCallOverlay onClose={closeLiveCall} onShoppingRequest={sendMessage} />
        ) : (
          <form className={styles.composer} onSubmit={onSubmit}>
            <button type="button" className={styles.composerIconBtn} aria-label="Attach">
              <Paperclip size={18} />
            </button>
            <input
              ref={inputRef}
              className={styles.composerInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Kade AI to find more or refine search... / සිංහලෙන් ලියන්න"
              disabled={loading}
            />
            <button 
              type="button" 
              className={styles.composerIconBtn}
              aria-label="Voice"
              onClick={() => setShowLiveCall(true)}
            >
              <Mic size={18} />
            </button>
            <button
              type="submit"
              className={styles.composerSend}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              {loading ? <Loader2 size={18} className={styles.spinIcon} /> : <ChevronUp size={20} />}
            </button>
          </form>
        )}
      </section>

      {/* ═══ RIGHT: Product Detail ═══ */}
      <aside className={styles.detailPane}>
        {detailOpen ? (
          <>
            <div className={styles.detailPanelHeader}>
              <span>{selectedProduct ? "Product details" : "Details"}</span>
              <button className={styles.panelCloseBtn} onClick={() => setDetailOpen(false)} aria-label="Close product details">
                <X size={16} />
              </button>
            </div>
            {selectedProduct ? (
              <ProductDetailPanel
                selected={selectedProduct}
                city={city}
                deliveryDate={deliveryDate}
                onCityChange={setCity}
                onDateChange={setDeliveryDate}
                giftWrap={giftWrap}
                personalNote={personalNote}
                onGiftWrapToggle={() => setGiftWrap(!giftWrap)}
                onPersonalNoteToggle={() => setPersonalNote(!personalNote)}
                onAddToCart={() => addToCart(selectedProduct.product)}
              />
            ) : (
              <div className={styles.detailEmpty}>
                <div className={styles.detailEmptyIcon}>
                  <Package size={28} />
                </div>
                <h3>Product Details</h3>
                <p>Search for products and click one to see details, delivery info, and gift options here.</p>
              </div>
            )}
          </>
        ) : (
          <button className={styles.collapsedPanelBtn} onClick={() => setDetailOpen(true)} aria-label="Open product details">
            <Package size={20} />
          </button>
        )}

        {/* Checkout overlay within detail pane */}
        {detailOpen && showCheckout && (
          <div className={styles.checkoutSection}>
            <h3>
              <Gift size={16} /> Checkout
            </h3>
            <input
              className={styles.checkoutInput}
              placeholder="Recipient name"
              value={checkout.recipientName}
              onChange={(e) => setCheckout({ ...checkout, recipientName: e.target.value })}
            />
            <input
              className={styles.checkoutInput}
              placeholder="Recipient phone"
              value={checkout.recipientPhone}
              onChange={(e) => setCheckout({ ...checkout, recipientPhone: e.target.value })}
            />
            <textarea
              className={`${styles.checkoutInput} ${styles.checkoutTextarea}`}
              placeholder="Delivery address"
              value={checkout.address}
              onChange={(e) => setCheckout({ ...checkout, address: e.target.value })}
            />
            <input
              className={styles.checkoutInput}
              placeholder="Sender name (optional)"
              value={checkout.senderName}
              onChange={(e) => setCheckout({ ...checkout, senderName: e.target.value })}
            />
            <textarea
              className={`${styles.checkoutInput} ${styles.checkoutTextarea}`}
              placeholder="Gift message (optional) 💌"
              value={checkout.giftMessage}
              onChange={(e) => setCheckout({ ...checkout, giftMessage: e.target.value })}
            />
            <label className={styles.checkoutRow}>
              <input
                type="checkbox"
                checked={checkout.anonymous}
                onChange={(e) => setCheckout({ ...checkout, anonymous: e.target.checked })}
              />
              Send anonymously
            </label>
            <button
              className={styles.payBtn}
              onClick={createOrder}
              disabled={!canCheckout || busyAction === "order"}
            >
              {busyAction === "order" ? (
                <Loader2 size={16} className={styles.spinIcon} />
              ) : (
                <ShoppingBag size={16} />
              )}
              Create Kapruka Pay Link
            </button>

            {order && (
              <div className={styles.orderResult}>
                {payUrl && (
                  <a href={payUrl} target="_blank" rel="noreferrer" className={styles.orderResultLink}>
                    <ExternalLink size={16} /> Open Payment Link
                  </a>
                )}
                <pre className={styles.orderResultPre}>{JSON.stringify(order, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </aside>

    </main>
  );
}

/* ── Message Content — simple markdown-like rendering ── */

function MessageContent({ text }: { text: string }) {
  // Simple markdown: **bold**, split by newlines
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        // Bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </>
  );
}

/* ── Product Card ── */

function ProductCard({
  product,
  onAdd,
  onSelect,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  onSelect: () => void;
}) {
  return (
    <div className={styles.productCard} onClick={onSelect}>
      <div className={styles.productCardImage}>
        {firstImage(product) ? (
          <img src={firstImage(product)} alt={product.name} />
        ) : (
          <div className={styles.productCardFallback}>
            <ShoppingBag size={28} />
          </div>
        )}
        <span className={clsx(styles.stockBadge, !product.in_stock && styles.stockBadgeOut)}>
          {product.in_stock ? "In Stock" : "Check Stock"}
        </span>
      </div>
      <div className={styles.productCardBody}>
        <h4>{product.name}</h4>
        <p>{product.summary || product.category?.name || "Kapruka product"}</p>
        <div className={styles.productCardFoot}>
          <strong>{money(product.price)}</strong>
          <button
            className={styles.addCartBtn}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product);
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Product Detail Panel ── */

function ProductDetailPanel({
  selected,
  city,
  deliveryDate,
  onCityChange,
  onDateChange,
  giftWrap,
  personalNote,
  onGiftWrapToggle,
  onPersonalNoteToggle,
  onAddToCart,
}: {
  selected: SelectedProduct;
  city: string;
  deliveryDate: string;
  onCityChange: (v: string) => void;
  onDateChange: (v: string) => void;
  giftWrap: boolean;
  personalNote: boolean;
  onGiftWrapToggle: () => void;
  onPersonalNoteToggle: () => void;
  onAddToCart: () => void;
}) {
  const { product } = selected;

  return (
    <>
      <div className={styles.detailImage}>
        {firstImage(product) ? (
          <img src={firstImage(product)} alt={product.name} />
        ) : (
          <div className={styles.productCardFallback} style={{ aspectRatio: "4/3" }}>
            <ShoppingBag size={48} />
          </div>
        )}
        <div className={styles.detailBadges}>
          {product.in_stock && (
            <span className={clsx(styles.detailBadge, styles.detailBadgeStock)}>In Stock</span>
          )}
          <span className={clsx(styles.detailBadge, styles.detailBadgeDelivery)}>Next Day Delivery</span>
        </div>
      </div>

      <div className={styles.detailContent}>
        <h2>{product.name}</h2>

        <div className={styles.detailPricing}>
          <span className={styles.detailPrice}>{money(product.price)}</span>
          {product.compare_at_price?.amount && (
            <span className={styles.detailCompare}>{money(product.compare_at_price)}</span>
          )}
        </div>

        <button className={styles.detailAddBtn} onClick={onAddToCart}>
          <ShoppingCart size={18} /> Add to Cart
        </button>

        {/* Delivery Info */}
        <div className={styles.detailDelivery}>
          <div className={styles.detailDeliveryIcon}>
            <MapPin size={18} />
          </div>
          <div className={styles.detailDeliveryInfo}>
            <h4>{city}, Sri Lanka</h4>
            <p className={styles.detailDeliveryHighlight}>
              <Clock size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              Arriving: Tomorrow, 2:00 PM
            </p>
            <p>Via Kapruka Express</p>
          </div>
        </div>

        {/* Gift Options */}
        <div className={styles.giftOptions}>
          <div
            className={clsx(styles.giftOption, giftWrap && styles.giftOptionActive)}
            onClick={onGiftWrapToggle}
          >
            <div className={styles.giftOptionHeader}>
              <Gift size={18} />
              <div className={styles.giftOptionCheck}>{giftWrap && <Check size={12} />}</div>
            </div>
            <h5>Gift Wrap</h5>
            <span className={styles.giftOptionSub}>+ Rs. 250</span>
          </div>

          <div
            className={clsx(styles.giftOption, personalNote && styles.giftOptionActive)}
            onClick={onPersonalNoteToggle}
          >
            <div className={styles.giftOptionHeader}>
              <Tag size={18} />
              <div className={styles.giftOptionCheck}>{personalNote && <Check size={12} />}</div>
            </div>
            <h5>Personal Note</h5>
            <span className={styles.giftOptionSub}>Included</span>
          </div>
        </div>

        {/* Delivery city/date inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              className={styles.checkoutInput}
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="Delivery city"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              className={styles.checkoutInput}
              type="date"
              min={today}
              value={deliveryDate}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
        </div>

        {product.description && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {product.description}
          </p>
        )}
      </div>
    </>
  );
}

/* ── Live Call Overlay Component ── */

function LiveCallOverlay({
  onClose,
  onShoppingRequest,
}: {
  onClose: () => void;
  onShoppingRequest: (text: string) => void;
}) {
  const [status, setStatus] = useState<"connecting" | "listening" | "speaking">("connecting");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState("Connecting to Kade AI...");
  const sessionRef = useRef<Awaited<ReturnType<GoogleGenAI["live"]["connect"]>> | null>(null);
  const mutedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const playingSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const closeRequestedRef = useRef(false);
  const voiceBriefRef = useRef<string[]>([]);
  const lastDispatchedVoiceRef = useRef("");
  const onShoppingRequestRef = useRef(onShoppingRequest);
  const statusRef = useRef(status);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    onShoppingRequestRef.current = onShoppingRequest;
  }, [onShoppingRequest]);

  const handleVoiceTranscript = useCallback((text: string) => {
    const normalizedText = text.trim();
    if (normalizedText.length < 3) return;

    const lower = normalizedText.toLowerCase();
    const isConfirmation =
      /\b(okay|ok|yes|yeah|yep|sure|correct|confirm|search|show me|show them|find them|go ahead|that's all|thats all|hari|ela|ow|oya)\b/.test(lower) ||
      /හරි|ඔව්|ඔයා|බලන්න|හොයන්න|පෙන්වන්න|ඒක තමයි|சரி|ஆம்|தேடு|காட்டு/.test(normalizedText);

    const hasShoppingSignal =
      /\b(cakes?|birthday|flowers?|roses?|bouquet|gifts?|chocolates?|biscuits?|cookies?|crackers?|hamper|delivery|colombo|kandy|galle|vanilla|chocolate|small|large|big|budget|under|rs|lkr)\b/.test(lower) ||
      /කේක්|උපන්දින|මල්|රෝස|තෑගි|චොකලට්|බිස්කට්|කොළඹ|වැනිලා|පොඩි|ලොකු|යට|கேக்|பிறந்தநாள்|பூ|மலர்|பரிசு|சாக்லேட்|பிஸ்கட்|கொழும்பு/.test(normalizedText);

    if (hasShoppingSignal && !isConfirmation) {
      const lastBrief = voiceBriefRef.current[voiceBriefRef.current.length - 1];
      if (lastBrief !== normalizedText) {
        voiceBriefRef.current = [...voiceBriefRef.current, normalizedText].slice(-6);
      }
      return;
    }

    if (!isConfirmation) return;

    const briefParts = voiceBriefRef.current.length ? voiceBriefRef.current : [normalizedText];
    const searchText = [...briefParts, normalizedText].join(". ");
    if (searchText.length < 3 || searchText === lastDispatchedVoiceRef.current) return;

    lastDispatchedVoiceRef.current = searchText;
    voiceBriefRef.current = [];
    onShoppingRequestRef.current(searchText);
  }, []);

  const stopQueuedAudio = useCallback(() => {
    for (const source of playingSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // Source may already have finished.
      }
      try {
        source.disconnect();
      } catch {
        // Source may already be disconnected.
      }
    }
    playingSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        // Start microphone first so the Live session receives audio quickly after opening.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
          },
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        // We must use an AudioContext to process the raw audio
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass({ sampleRate: 16000 });
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;

        const tokenResponse = await fetch("/api/live-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.token || !tokenData.model) {
          throw new Error(tokenData.error || "Could not start Gemini Live.");
        }

        const ai = new GoogleGenAI({
          apiKey: tokenData.token,
          httpOptions: { apiVersion: "v1alpha" },
        });
        const session = await ai.live.connect({
          model: tokenData.model,
          config: tokenData.liveConfig ?? {
            responseModalities: [Modality.AUDIO],
          },
          callbacks: {
            onopen: () => {
              if (!mounted) return;
              setStatus("listening");
              setTranscript("...");
            },
            onmessage: (message) => {
              if (!mounted) return;
              const serverContent = message.serverContent;
              if (!serverContent) return;

              if (serverContent.interrupted) {
                stopQueuedAudio();
              }

              const inputTranscript = serverContent.inputTranscription?.text;
              const outputTranscript = serverContent.outputTranscription?.text;
              if (inputTranscript) {
                setTranscript(inputTranscript);
                if (serverContent.inputTranscription?.finished) {
                  handleVoiceTranscript(inputTranscript);
                }
              }
              if (outputTranscript) {
                setTranscript(outputTranscript);
                setStatus("speaking");
              }

              for (const part of serverContent.modelTurn?.parts ?? []) {
                if (part.inlineData?.data) {
                  setStatus("speaking");
                  playAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                  setTranscript(part.text);
                  setStatus("speaking");
                }
              }

              if (serverContent.turnComplete || serverContent.waitingForInput) {
                setStatus("listening");
              }
            },
            onerror: (event) => {
              console.error("Gemini Live error", event);
              if (mounted) setTranscript("Gemini Live connection error.");
            },
            onclose: (event) => {
              if (!mounted) return;
              if (closeRequestedRef.current || event.code === 1000) {
                setTranscript("Call ended");
                setTimeout(onClose, 900);
              } else {
                setStatus("connecting");
                setTranscript("Voice connection closed. Please start a new call.");
              }
            },
          },
        });

        sessionRef.current = session;
        
        // ScriptProcessorNode is deprecated but easiest for raw PCM without a separate worklet file
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (mutedRef.current) return;
          if (!sessionRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);
          let audioLevel = 0;
          
          // Convert Float32 to Int16
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            audioLevel += Math.abs(s);
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          if (statusRef.current === "speaking" && audioLevel / inputData.length > 0.015) {
            stopQueuedAudio();
            setStatus("listening");
          }
          
          // Convert to base64
          const buffer = new Uint8Array(pcmData.buffer);
          let binary = '';
          for (let i = 0; i < buffer.byteLength; i++) {
            binary += String.fromCharCode(buffer[i]);
          }
          const base64 = btoa(binary);

          sessionRef.current.sendRealtimeInput({
            audio: {
              data: base64,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        };

        source.connect(processor);
        processor.connect(ctx.destination);

      } catch (err) {
        console.error("Setup error:", err);
        if (mounted) {
          setTranscript("Failed to access microphone or connect to server.");
        }
      }
    };

    init();

    return () => {
      mounted = false;
      closeRequestedRef.current = true;
      if (sessionRef.current) sessionRef.current.close();
      stopQueuedAudio();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (processorRef.current && sourceRef.current) {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
      }
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [handleVoiceTranscript, onClose, stopQueuedAudio]);

  // Decode base64 24kHz Int16 to Float32 and play
  const playAudioChunk = (base64: string) => {
    if (!audioContextRef.current) return;
    
    const binaryStr = atob(base64);
    const buffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      buffer[i] = binaryStr.charCodeAt(i);
    }
    
    const int16Array = new Int16Array(buffer.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    
    // Playback queuing logic
    const ctx = audioContextRef.current;
    const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    playingSourcesRef.current.push(source);
    source.onended = () => {
      playingSourcesRef.current = playingSourcesRef.current.filter((item) => item !== source);
      try {
        source.disconnect();
      } catch {
        // Source may already be disconnected.
      }
    };

    if (nextPlayTimeRef.current < ctx.currentTime) {
      nextPlayTimeRef.current = ctx.currentTime;
    }
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
  };

  const endCall = () => {
    closeRequestedRef.current = true;
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    onClose();
  };

  return (
    <div className={styles.liveCallOverlay}>
      <div className={styles.liveCallPanel}>
        <div className={styles.liveCallAvatar}>
          {status !== "connecting" && (
            <>
              <div className={styles.liveCallRing} />
              <div className={styles.liveCallRing} />
              <div className={styles.liveCallRing} />
            </>
          )}
          <div className={styles.liveCallAvatarInner}>
            <Bot size={22} />
          </div>
        </div>

        <div className={styles.liveCallInfo}>
          <h3>Kade AI</h3>
          <div className={styles.liveCallStatus}>
            <span 
              className={clsx(
                styles.liveCallStatusDot, 
                status === "listening" && styles.liveCallStatusDotListening,
                status === "speaking" && styles.liveCallStatusDotSpeaking,
                status === "connecting" && styles.liveCallStatusDotConnecting
              )} 
            />
            {status === "connecting" ? "Connecting..." : status === "speaking" ? "Speaking..." : "Listening..."}
          </div>
        </div>

        <div className={styles.liveCallTranscript}>
          {transcript}
        </div>

        <div className={styles.liveCallActions}>
          <button 
            className={clsx(styles.liveCallMuteBtn, muted && styles.muted)} 
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <Mic size={20} />
          </button>
          <button className={styles.liveCallEndBtn} onClick={endCall} aria-label="End call">
            <X size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
