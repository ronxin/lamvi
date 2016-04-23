export function startsWith(s: string, prefix: string): boolean {
  return s.substr(0, prefix.length) == prefix;
}

export function endsWith(s: string, suffix: string): boolean {
  return s.substr(-suffix.length) === suffix;
}

// http://stackoverflow.com/questions/1701898/
export function isUrl(s: string) {
   var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
   return regexp.test(s);
}
