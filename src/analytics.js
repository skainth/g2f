"use strict";
const map = {};

const fn = (key, value, indexKey) => {
  if (!map[key]) {
    map[key] = {};
  }
  if(indexKey){
    map[key][value[indexKey]] = value;
    return;
  }
  map[key][value] = value;
};

const add = (key, value, indexKey) => {
  if(Array.isArray(value)){
    value.forEach(val => fn(key, val, indexKey));
  }else{
    fn(key, value, indexKey);
  }
};

const list = (type) => type ? map[type]? map[type]: {} : map;

module.exports = {
  add,
  list
};
