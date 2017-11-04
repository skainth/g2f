const map = {};

const add = (key, value) => {
    if(!map[key]){
        map[key] = [];
    }
    map[key].push(value);
};

const list = (type) => type? map[type]: map;

module.exports = {
    add,
    list
};