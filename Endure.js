function Endure(dataName, path) {
    const fs = require("fs");
    path = path || "";

    function init() {
        try {
            fs.writeFileSync(`${__dirname}/${path}${dataName}.json`, '{}', {flag: 'wx'});
            console.log("File '${dataName}.json' created.");
        } catch (e) {}

        const data = JSON.parse(fs.readFileSync(`${__dirname}/../docs.json`).toString());

        return new Proxy(data, {
            set(obj) {
                fs.writeFile(
                    `${__dirname}/${path}${dataName}.json`,
                    JSON.stringify(data), (err) => {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
            }
        });
    }
}

module.exports = Endure;
