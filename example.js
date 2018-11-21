const Endure = require("./Endure");
const http = require('http');
const querystring = require('querystring');
const data = new Endure();
if (!data.array) {
    data.array = [];
}

function htmlForm(data) {
    return `<!doctype html>
<html lang="en-us">
<title>Data Test</title>
<style>
form {padding-bottom: 8px; }
input {width: 80px; margin-right: 8px; }
</style>

<h1>Data Test</h1>
<pre>${JSON.stringify(data, null, "    ")}</pre>
<form action="" method="POST"><input name="array-push"><button>add to array</button></form>
<form action="" method="POST"><input name="key">: <input name="val"><button>set key: value</button></form>
`;
}

function routeMethods(req, rsp, body) {
    var requestBody;
    if (req.method === 'GET') {
        rsp.writeHead(200, {'Content-Type': 'text/html'});
        rsp.end(htmlForm(data));
        return;
    }

    if (req.method === 'POST') {
        requestBody = querystring.parse(body);
        if (requestBody) {
            if (requestBody["array-push"]) {
                data.array.push(requestBody["array-push"]);
                rsp.writeHead(200, {'Content-Type': 'text/plain'});
                rsp.end(`Added data '${requestBody["array-push"]}' to array.`);
                return;
            }
            if (requestBody["key"] && requestBody["val"]) {
                data[requestBody.key] = requestBody.val;
                rsp.writeHead(200, {'Content-Type': 'text/plain'});
                rsp.end(`Update key '${requestBody.key}' to '${requestBody.val}'.`);
                return;
            }
        }
        data.array.push(requestBody.data);
        rsp.writeHead(400, {'Content-Type': 'text/plain'});
        rsp.end(`No data found`);
    }

    rsp.writeHead(405, {'Content-Type': 'text/plain'});
    rsp.end(`Method "${req.method}" not allowed.`);
}

function collectReqBody(req, rsp) {
    var body = [];

    req.on('data', function (chunk) {
        body.push(chunk);
    }).on('end', function () {
        body = Buffer.concat(body).toString();
        routeMethods(req, rsp, body);
    });
}

http.createServer(collectReqBody).listen(4101, function () {
    console.log('Server started on port :4101');
});
