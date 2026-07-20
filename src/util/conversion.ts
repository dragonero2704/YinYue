export function isUrl(url: string) {
  try {
    return new Boolean(new URL(url));
  } catch (e) {
    return false;
  }
}

type Timestamp = `${number}:${number}:${number}`;

export function TimestampToSeconds(timestamp: Timestamp) {
  const bases = [3600, 60, 1];
  let seconds = 0;
  timestamp
    .split(":")
    .slice(0, 3)
    .forEach((v,i) => (seconds += Number(v) * (bases[i] ?? 0)));
  return seconds;
}

export function SecondsToTimestamp(seconds:number)
{
    let res = [
      String(Math.floor(seconds % 60)).padStart(2, "0"),
      String(Math.floor((seconds / 60) % 60)).padStart(2, "0"),
    ];
    const hours = Math.floor(seconds / 3600);
    if (hours > 0) res.push(String(hours).padStart(2, "0"));
    res.reverse();
    return res.join(":");
}
