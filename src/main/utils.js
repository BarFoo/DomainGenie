export function dedupe(arr, key) {
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
export async function sleep(time) {
  await new Promise((r) => setTimeout(r, time));
}

export function chunkArray(arr, perChunk) {
  return arr.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
}
