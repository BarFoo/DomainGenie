export function dedupe(arr: any[], key: string): any[] {
  const unique = [];
  arr.map((c) =>
    unique.filter((u) => u[key] == c[key]).length > 0 ? null : unique.push(c)
  );
  return unique;
}

/**
 * Sleep the current process for the given amount of time
 * @param {number} time Time in milliseconds
 */
export async function sleep(time: number) {
  await new Promise((r) => setTimeout(r, time));
}

/**
 * Turn an array into chunks of x size
 * @param arr The array
 * @param perChunk Number of items per a chunk
 */
export function chunkArray(arr: any[], perChunk: number): any[] {
  return arr.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
}
