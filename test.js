/*jshint esversion: 6 */
const initial = {
    arr: [],
    thing: {}
};

const Endure = require("./Endure");
const data = new Endure("test-data", initial, null, "    ");

data.test = 1;
data.test2 = "abc";
