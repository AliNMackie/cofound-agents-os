/**
 * Standardised GBP formatting for IC ORIGIN.
 * Uses Pound Sterling (£) with proper comma separation.
 */
export const formatPrice = (price: number | string) => {
    const amount = typeof price === "string" ? parseFloat(price.replace(/[^\d.]/g, "")) : price;

    if (isNaN(amount)) return "£0.00";

    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
    }).format(amount);
};

/**
 * Concise price formatter (e.g., £5.5M) for high-density tables.
 */
export const formatPriceCompact = (price: number | string) => {
    const amount = typeof price === "string" ? parseFloat(price.replace(/[^\d.]/g, "")) : price;

    if (isNaN(amount)) return "£0";

    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(amount);
};
