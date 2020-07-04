export const titleFromDesc = (desc: string): string => {
    if (!desc) {
        return "";
    }
    const sliced = desc.slice(0, 10);
    const suffix = desc.length >= 10 ? "..." : "";
    return sliced + suffix;
};

export const date2Epoch = (date: Date): number => {
    return Math.round(date.getTime() / 1000);
};

export const epoch2date = (epoch: number): Date => {
    let d = new Date(0);
    d.setUTCSeconds(epoch);
    return d;
};
