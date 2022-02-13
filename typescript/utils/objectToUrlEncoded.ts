export function objectToUrlEncoded(obj: { [x: string]: string }) {
  /**
   * Converts an object to url encoded string
   *
   * for each property create a key value pair
   * encode the key and value
   * Append that to the result
   * remove trailing ampersand
   * return result
   */
  let urlencoded = "";
  // If Object has no keys, return empty string
  if (Object.keys(obj).length == 0) return urlencoded;
  Object.keys(obj).forEach((key) => {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(obj[key]);
    let keyValuePair = `${encodedKey}=${encodedValue}&`;
    urlencoded += keyValuePair;
  });
  urlencoded = urlencoded.substring(0, urlencoded.length - 1); //Remove the last ampersand
  return urlencoded;
}
