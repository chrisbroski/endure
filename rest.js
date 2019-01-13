/*jshint esversion: 6 */
const Endure = require("./Endure");
const http = require('http');
const qs = require('querystring');
const crypto = require("crypto");
const data = new Endure("customers", {});

function newId() {
    const id = crypto.randomBytes(24).toString("base64");
    // make base64 URL-safe
    return id.replace(/\+/g, "-").replace(/\//g, "_").replace(/\=/, ".");
}

function htmlForm(id, surname, givenName, email, method) {
    method = method || "POST";
    return `<form method="${method}" action="">
    <p><label>First Name <input name="surname" value="${surname}"></label>
    <p><label>Last Name <input name="givenName" value="${givenName}"></label>
    <p><label>Email <input name="email" value="${email}"></label>
    <p><button>Submit</button><input type="hidden" name="id" value="${id}">
</form>`;
}
// GET all
// GET id
// POST new (auth)
// PUT edit (auth)
// DELETE (auth)
// OPTIONS (for CORS)

// HTML and JSON

function badRequest(rsp, msg, status) {
    status = status || 400;
    rsp.writeHead(status, {'Content-Type': 'text/plain'});
    rsp.end(msg);
}

function emailExists(email) {
    var keys = Object.keys(data), ii, len = keys.length;
    for (ii = 0; ii < len; ii += 1) {
        if (data[keys[ii]].email === email) {
            return true;
        }
    }
    return false;
}

function getCustomer(req, rsp) {
    var id, getData, template;

    if (req.url === "/") {
        getData = data;
    } else {
        id = req.url.slice(1);
        getData = data[id];
        if (!getData) {
            return badRequest(rsp, "Customer not found.", 404);
        }
    }

    if (req.headers.accept === 'application/json') {
        rsp.writeHead(200, {'Content-Type': 'application/json'});
        rsp.end(JSON.stringify(data, null, "    "));
    } else {
        rsp.writeHead(200, {'Content-Type': 'text/html'});
        rsp.end(`<!doctype html><title>Customers</title>
            ${htmlForm("", "", "", "")}
            <pre>${JSON.stringify(data, null, "    ")}</pre>`);
    }
}

function addCustomer(req, rsp, body) {
    var id, cust = {
        "surname": "",
        "givenName": "",
        "email": "",
        "created": +(new Date())
    };
    var formData = qs.parse(body);

    if (!formData.email) {
        return badRequest(rsp, "Email address is required.", 400);
    }
    if (formData.email.indexOf("@") === -1 || formData.email.indexOf(".") === -1) {
        return badRequest(rsp, "Email address is invalid.", 400);
    }
    if (emailExists(formData.email)) {
        return badRequest(rsp, "Email already exists.", 400);
    }
    id = newId();

    cust.surname = formData.surname;
    cust.givenName = formData.givenName;
    cust.email = formData.email;
    data[id] = cust;

    rsp.writeHead(201, {'Content-Type': 'text/plain'});
    rsp.end(`Added customer ${id}`);
}

function routeMethods(req, rsp, body) {
    var requestBody;
    if (req.method === 'GET') {
        return getCustomer(req, rsp);
    }

    if (req.method === 'POST') {
        return addCustomer(req, rsp, body);
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

http.createServer(collectReqBody).listen(4102, function () {
    console.log('Server started on port :4102');
});
