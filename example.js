const endure = require("./Endure");
const http = require('http');
const querystring = require('querystring');
const data = new endure("data");
if (!data.data) {
    data.data = [];
}

function routeMethods(req, rsp, body) {
    var requestBody;
    if (req.method === 'GET') {
        rsp.writeHead(200, {'Content-Type': 'text/html'});
        rsp.end(`<!doctype html>
        <html lang="en-us">
        <title>Data Test</title>

        <h1>Data Test</h1>
        <pre>${JSON.stringify(data, null, "    ")}</pre>
        <form action="" method="POST"><input name="data"><button>add data</button></form>
`);
        return;
    }

    if (req.method === 'POST') {
        requestBody = querystring.parse(body);
        data.data.push(requestBody.data);
        rsp.writeHead(200, {'Content-Type': 'text/plain'});
        rsp.end(`Added data ${requestBody.data}`);
        return;
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
