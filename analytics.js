const map = {};

const add = (key, value) => {
  if (!map[key]) {
    map[key] = [];
  }
  if(typeof value === 'string') {
    map[key].push(value);
  }else{
    for(let val of value){
      map[key].push(val);
    }
  }
};

const list = (type) => type ? map[type] : map;

module.exports = {
  add,
  list
};
