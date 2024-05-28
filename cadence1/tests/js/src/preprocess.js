const { isString } = require('lodash');

const commentRegex = /\/\/.*?$/gimu;
const lineCommentRegex = /^\/\/.*?$/gimu;
const blockCommentRegex = /\*[^*]*\*+(?:[^/*][^*]*\*+)*/gimu;
const quoteRegex = /\\"|"(?:\\"|[^"])*"|(\+)/gimu;

const pubPrivRegex = /(pub|priv)\s+(contract|resource|struct|event|enum|case|entitlement|view|fun|var|let)/gimu;

function blankRegex(str, regex){
  let searchData = str;
  const matches = searchData.matchAll(regex);
  for (const match of matches) {
    const len = match[0].length;
    searchData = (searchData.substring(0, match.index) + ' '.repeat(len)+searchData.substring(match.index+ len, searchData.length));
  }
  return searchData;
}

function replaceSubstituted(data, searchData, regex, replace){
  const matches = searchData.matchAll(regex);
  let res = data;
  let pad = 0;
  for (const match of matches) {
    const len = match[0].length;
    const index = match.index+pad;
    const replaced = isString(replace)?replace:replace(match);
    pad += replaced.length - len;
    res = (res.substring(0, index) + replaced + res.substring(index + len, res.length));
  }
  return res;
}
function replaceSubstitutedEscaped(data, regex, replace){
  let searchData = blankRegex(data, lineCommentRegex);
  searchData = blankRegex(searchData, blockCommentRegex);
  searchData = blankRegex(searchData, quoteRegex);
  searchData = blankRegex(searchData, commentRegex);
  return replaceSubstituted(data, searchData, regex, replace)
}


function preProcessCadence1(data){
  // TODO breaks sometimes data = replaceSubstitutedEscaped(data, pubPrivRegex, (match)=>`access(${match[1]==='pub'?'all':'self'}) ${match[2]}`)
  data = replaceSubstituted(data, data, pubPrivRegex, (match)=>`access(${match[1]==='pub'?'all':'self'}) ${match[2]}`)
  return data;
}

function preProcess(data){
  return preProcessCadence1(data);
}
module.exports = preProcess;
