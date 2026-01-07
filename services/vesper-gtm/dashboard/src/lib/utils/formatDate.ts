/**
 * Standardised Date formatting for IC ORIGIN deal timelines.
 */
export const formatDate = (date: Date | string | number) => {
    const d = new Date(date);

    if (isNaN(d.getTime())) return "N/A";

    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

/**
 * Short date format for mission logs.
 */
export const formatDateShort = (date: Date | string | number) => {
    const d = new Date(date);

    if (isNaN(d.getTime())) return "N/A";

    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    });
};
