"use strict";
const map = {};

const add = (key, value, indexKey) => {
  if (!map[key]) {
    map[key] = {};
  }
  if(indexKey){
    map[key][value[indexKey]] = value;
    return;
  }
  map[key] = value;
};

const list = (type) => type ? map[type] : map;

module.exports = {
  add,
  list
};
