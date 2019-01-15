/*jshint esversion: 6 */
function Endure(dataName, initial, path, indent) {
    dataName = dataName || "endure-data";
    initial = initial || {};
    path = path || "";
    indent = indent || "";

    const fs = require("fs");
    const dataPath = `${path}${dataName}.json`;
    var saveTimer;

    function save(data, maxSize) {
        if (!saveTimer) {
            saveTimer = setTimeout(function () {
                saveTimer = null;
                const strData = JSON.stringify(data, null, indent);
                if (maxSize && strData.length > maxSize) {
                    console.log("Data > 5MB. Not saved");
                    return;
                }
                fs.writeFile(dataPath, strData, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }, 2000);
        }
    }

    function init() {
        try {
            fs.writeFileSync(dataPath, JSON.stringify(initial, null, indent), {flag: 'wx'});
            console.log(`File '${dataName}.json' created.`);
        } catch (e) {}

        // I don't fully understand this handler. I got it from StackOverflow:
        // https://stackoverflow.com/questions/41299642/#50723478
        const handler = {
            get(target, key) {
                if (key == 'isProxy') {
                    return true;
                }

                const prop = target[key];
                if (typeof prop == 'undefined') {
                    return;
                }

                if (!prop.isBindingProxy && typeof prop === 'object') {
                    target[key] = new Proxy(prop, handler);
                }
                return target[key];
            },
            set(target, key, value) {
                target[key] = value;
                save(data, 5000000);
                return true;
            },
            deleteProperty(target, key) {
                if (key in target) {
                    delete target[key];
                    save(data);
                }
            }
        };

        const data = JSON.parse(fs.readFileSync(dataPath).toString());
        return new Proxy(data, handler);
    }
    return init();
}

module.exports = Endure;
