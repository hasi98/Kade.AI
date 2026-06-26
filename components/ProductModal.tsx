"use client";

import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Package, ShoppingCart, Truck, X } from "lucide-react";
import type { Product, ProductDetail, ProductVariant } from "@/lib/types";
import styles from "./ProductModal.module.css";

const CACHE_TTL = 5 * 60 * 1000;
const productCache = new Map<string, { data: ProductDetail; fetchedAt: number }>();

export function getCachedProduct(id: string) {
  const cached = productCache.get(id);
  if (!cached) return null;
  if (Date.now() - cached.fetchedAt > CACHE_TTL) {
    productCache.delete(id);
    return null;
  }
  return cached.data;
}

export function setCachedProduct(id: string, data: ProductDetail) {
  productCache.set(id, { data, fetchedAt: Date.now() });
}

export async function fetchProductDetail(id: string) {
  const cached = getCachedProduct(id);
  if (cached) return cached;
  const res = await fetch(`/api/product/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Product details unavailable");
  const data = (await res.json()) as ProductDetail;
  setCachedProduct(id, data);
  return data;
}

export function prefetchProductDetail(id: string) {
  if (getCachedProduct(id)) return;
  void fetchProductDetail(id).catch(() => {
    // Prefetch failures are non-blocking; the modal shows its own error state.
  });
}

function money(price?: { amount: number | null; currency: string }) {
  if (!price || price.amount == null) return "Price on request";
  return `Rs. ${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(price.amount)}`;
}

function firstImage(product: Product | ProductDetail) {
  return product.image_url || product.images?.[0] || "";
}

function stockLabel(level?: string) {
  if (level === "high") return "Available";
  if (level === "medium") return "Limited";
  if (level === "low") return "Only a few left!";
  return level || "Available";
}

function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function variantProduct(product: ProductDetail, variant: ProductVariant | null): Product {
  if (!variant) return product;
  return {
    ...product,
    id: variant.id,
    name: `${product.name} - ${variant.name}`,
    price: variant.price,
    in_stock: variant.in_stock,
    stock_level: variant.stock_level,
  };
}

export function ProductModal({
  open,
  productId,
  fallbackProduct,
  onClose,
  onAddToCart,
}: {
  open: boolean;
  productId: string | null;
  fallbackProduct: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [zoom, setZoom] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 50, y: 50 });

  useEffect(() => {
    if (!open || !productId) return;
    const cached = getCachedProduct(productId);
    setProduct(cached);
    setLoading(!cached);
    setError(false);
    setActiveImage(0);
    setZoom({ active: false, x: 50, y: 50 });
    setSelectedVariantId(null);
    setDescriptionOpen(false);

    let cancelled = false;
    if (!cached) {
      fetchProductDetail(productId)
        .then((data) => {
          if (cancelled) return;
          setProduct(data);
          setSelectedVariantId(data.variants?.find((variant) => variant.in_stock)?.id ?? data.variants?.[0]?.id ?? null);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setSelectedVariantId(cached.variants?.find((variant) => variant.in_stock)?.id ?? cached.variants?.[0]?.id ?? null);
    }

    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const visibleProduct = product ?? fallbackProduct;
  const images = useMemo(() => {
    if (!visibleProduct) return [];
    return Array.from(new Set([...(visibleProduct.images ?? []), firstImage(visibleProduct)].filter(Boolean)));
  }, [visibleProduct]);
  const variants = product?.variants ?? [];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const displayedPrice = selectedVariant?.price ?? visibleProduct?.price;
  const compareAmount = product?.compare_at_price?.amount ?? null;
  const savings = compareAmount != null && displayedPrice?.amount != null ? compareAmount - displayedPrice.amount : 0;
  const stockLevel = selectedVariant?.stock_level ?? product?.stock_level ?? visibleProduct?.stock_level;
  const inStock = selectedVariant?.in_stock ?? visibleProduct?.in_stock ?? false;
  const description = product?.description || product?.summary || fallbackProduct?.description || fallbackProduct?.summary || "";
  const categoryPath = product?.category?.path || product?.category?.name || fallbackProduct?.category?.name || "";
  const vendor = product?.attributes?.vendor;
  const attributes = [
    product?.attributes?.weight,
    product?.attributes?.type,
    product?.attributes?.subtype,
  ].filter((value): value is string => Boolean(value));

  if (!open || !productId || !visibleProduct) return null;

  const addProduct = () => {
    if (!product) {
      onAddToCart(visibleProduct);
      onClose();
      return;
    }
    onAddToCart(variantProduct(product, selectedVariant));
    onClose();
  };

  const moveZoom = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
    setZoom({ active: true, x, y });
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-label={visibleProduct.name} onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.close} type="button" onClick={onClose} aria-label="Close product details">
          <X size={20} />
        </button>

        {error && !product ? (
          <div className={styles.errorState}>
            <div className={styles.errorBox}>
              <AlertTriangle size={34} />
              <h2>Couldn't load full details</h2>
              <p>The product info is temporarily unavailable.</p>
              {visibleProduct.url && (
                <a className={styles.kaprukaLink} href={visibleProduct.url} target="_blank" rel="noreferrer">
                  View on Kapruka <ExternalLink size={16} />
                </a>
              )}
              <button className={styles.errorClose} type="button" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.media}>
              {loading && !product ? (
                <>
                  <div className={`${styles.skeleton} ${styles.skeletonImage}`} />
                  <span className={styles.loadingText}>Getting product details...</span>
                </>
              ) : (
                <>
                  <div
                    className={`${styles.mainImage} ${zoom.active ? styles.mainImageZooming : ""}`}
                    onMouseMove={moveZoom}
                    onMouseEnter={moveZoom}
                    onMouseLeave={() => setZoom((current) => ({ ...current, active: false }))}
                  >
                    {images[activeImage] ? (
                      <>
                        <img src={images[activeImage]} alt={visibleProduct.name} />
                        <div
                          className={styles.zoomPane}
                          style={{
                            backgroundImage: `url(${images[activeImage]})`,
                            backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                          }}
                        />
                      </>
                    ) : <div className={styles.imageFallback}><Package size={42} /></div>}
                  </div>
                  {images.length > 1 && (
                    <div className={styles.thumbs}>
                      {images.map((image, index) => (
                        <button key={image} className={`${styles.thumb} ${index === activeImage ? styles.thumbActive : ""}`} type="button" onClick={() => setActiveImage(index)}>
                          <img src={image} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                  {images.length > 1 && <span className={styles.counter}>{activeImage + 1} / {images.length}</span>}
                </>
              )}
            </div>

            <div className={styles.details}>
              {loading && !product ? (
                <>
                  <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} style={{ width: "62%" }} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonPrice}`} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} style={{ width: "78%" }} />
                </>
              ) : (
                <>
                  <header className={styles.header}>
                    {categoryPath && <span className={styles.muted}>{categoryPath}</span>}
                    <h2>{visibleProduct.name}</h2>
                    {vendor && <span className={styles.muted}>By {vendor}</span>}
                  </header>

                  <div className={styles.priceRow}>
                    <span className={styles.price}>{money(displayedPrice)}</span>
                    {product?.compare_at_price?.amount && <span className={styles.compare}>{money(product.compare_at_price)}</span>}
                    {savings > 0 && <span className={styles.save}>Save Rs. {new Intl.NumberFormat("en-LK").format(savings)}</span>}
                  </div>

                  <div className={styles.stock}>
                    <span className={`${styles.dot} ${!inStock ? styles.dotOut : ""}`} />
                    <span>{inStock ? "In Stock" : "Out of Stock"}</span>
                    {inStock && <span className={`${styles.stockPill} ${stockLevel === "low" ? styles.stockLow : ""}`}>{stockLabel(stockLevel)}</span>}
                  </div>

                  {variants.length > 0 && (
                    <div className={styles.variants}>
                      <strong>Choose option:</strong>
                      <div className={styles.variantList}>
                        {variants.map((variant) => (
                          <button
                            key={variant.id}
                            type="button"
                            className={`${styles.variant} ${variant.id === selectedVariantId ? styles.variantSelected : ""} ${!variant.in_stock ? styles.variantOut : ""}`}
                            onClick={() => setSelectedVariantId(variant.id)}
                            disabled={!variant.in_stock}
                          >
                            {variant.name}{variant.price.amount !== product?.price.amount ? ` - ${money(variant.price)}` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {description && (
                    <section className={styles.description}>
                      <div className={styles.descriptionHeader}>
                        <span className={styles.descriptionTitle}>About this product</span>
                        <button className={styles.toggle} type="button" onClick={() => setDescriptionOpen((value) => !value)}>
                          {descriptionOpen ? "Show less" : "Show more"} {descriptionOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                      {hasHtml(description) ? (
                        <div
                          className={`${styles.descriptionText} ${descriptionOpen ? "" : styles.descriptionCollapsed}`}
                          dangerouslySetInnerHTML={{ __html: description }}
                        />
                      ) : (
                        <p className={`${styles.descriptionText} ${descriptionOpen ? "" : styles.descriptionCollapsed}`}>{description}</p>
                      )}
                    </section>
                  )}

                  {attributes.length > 0 && (
                    <div className={styles.attributes}>
                      {attributes.map((attribute) => <span key={attribute}>{attribute}</span>)}
                    </div>
                  )}

                  {product?.shipping && (
                    <div className={styles.shipping}>
                      <Truck size={18} />
                      <div>
                        <strong>Ships from {product.shipping.ships_from || "Kapruka"}</strong>
                        <p>{product.shipping.ships_internationally ? "International delivery available" : "Sri Lanka only"}</p>
                      </div>
                    </div>
                  )}

                  <div className={styles.actions}>
                    <button className={styles.add} type="button" onClick={addProduct} disabled={!inStock}>
                      <ShoppingCart size={18} /> Add to cart
                    </button>
                    {visibleProduct.url && (
                      <>
                        <a className={styles.kaprukaLink} href={visibleProduct.url} target="_blank" rel="noreferrer">
                          View on Kapruka <ExternalLink size={16} />
                        </a>
                        <span className={styles.smallNote}>Opens kapruka.com</span>
                      </>
                    )}
                  </div>

                  <span className={styles.bottomNote}>Prices and availability checked live from Kapruka</span>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
