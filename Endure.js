function Endure(dataName, path) {
    dataName = dataName || "endure-data";
    path = path || "";

    const fs = require("fs");
    const dataPath = `${__dirname}/${path}${dataName}.json`;

    function init() {
        try {
            fs.writeFileSync(dataPath, '{}', {flag: 'wx'});
            console.log(`File '${dataName}.json' created.`);
        } catch (e) {}

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
                fs.writeFile(dataPath, JSON.stringify(data), function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                return true;
            }
        };

        const data = JSON.parse(fs.readFileSync(dataPath).toString());
        return new Proxy(data, handler);
    }
    return init();
}

module.exports = Endure;
