function prefixify(kNum, unit) {
  const [_, start] = (kNum + '').match(/(\d+)\.?/);
  if (start.length > 1) {
    kNum = start;
  } else {
    kNum = kNum.toFixed(1).replace(/\.0+$/, '');
  }
  return kNum + unit;
}

function shortenNumber(num) {
  if (!num) return '';
  // TODO: handle more than a million
  // For reference: k, m, b, t
  if (num >= 1000000) {
    return prefixify(num / 1000000, 'm');
  }
  if (num >= 1000) {
    return prefixify(num / 1000, 'k');
  }
  return num + '';
}

export default shortenNumber;
