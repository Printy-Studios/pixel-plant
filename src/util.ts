import globals from './globals';

export function rangeOverlap(x1: number, x2: number, y1: number, y2: number) {
    return Math.max(0, Math.min (x2, y2) - Math.max (x1, y1) + 1);
}

export function secondsToTime(secs: number) {
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}

export function getTicksBySeconds(seconds: number) {
    return seconds / globals.seconds_per_tick
}