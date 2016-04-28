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

// Input: neural excitement level, can be positive, negative
// Output: a value between 0 and 1, for display
export function exciteValueToNum(x: number): number {
  x = x * 5;  // exaggerate it a bit
  return 1 / (1+Math.exp(-x));  // sigmoid
}

export function exciteValueToColor(x: number): any {
  return numToColor(exciteValueToNum(x));
}

let colors: any;
colors = ["#427DA8", "#6998BB", "#91B3CD", "#BAD0E0",
                "#E1ECF3", "#FADEE0", "#F2B5BA", "#EA8B92",
                "#E2636C", "#DB3B47"];
let numToColor = d3.scale.linear()
    .domain(d3.range(0, 1, 1 / (colors.length - 1)))
    .range(colors);
