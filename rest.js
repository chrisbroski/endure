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
    var buttonVerb = "Add";
    if (method === "PUT") {
        buttonVerb = "Update";
    }
    return `<form method="POST" action="">
    <p><label>First Name <input name="surname" value="${surname}"></label>
    <p><label>Last Name <input name="givenName" value="${givenName}"></label>
    <p><label>Email <input name="email" value="${email}"></label>
    <p><button>${buttonVerb} Customer</button>
        <input type="hidden" name="id" value="${id}">
        <input type="hidden" name="method" value="${method}">
</form>`;
}

function deleteForm(id) {
    return `<form method="POST" action="">
    <p><button>Delete Customer</button>
        <input type="hidden" name="id" value="${id}">
        <input type="hidden" name="method" value="DELETE">
</form>`;
}

function customerList(custData) {
    var custIds = Object.keys(custData), custUl = [];

    custIds.forEach(function (cust) {
        custUl.push(`<li><a href="/${cust}">${custData[cust].surname}, ${custData[cust].givenName}</a> ${custData[cust].email}</li>`);
    });
    return "<ul>" + custUl.join("\n") + "</ul>";
}

function badRequest(rsp, msg, status) {
    status = status || 400;
    rsp.writeHead(status, {'Content-Type': 'text/plain'});
    rsp.end(msg);
}

function emailExists(email, id) {
    var keys = Object.keys(data), ii, len = keys.length;

    for (ii = 0; ii < len; ii += 1) {
        if (data[keys[ii]].email === email && keys[ii] !== id) {
            return true;
        }
    }
    return false;
}

function cleanStr(str, maxlength) {
    str = str.trim();
    maxlength = maxlength || 255;
    if (str.length > maxlength) {
        str = str.slice(0, maxlength);
    }
    return str;
}

function getCustomer(req, rsp) {
    var id, getData, form, form2 = "", list = "";

    if (req.url === "/") {
        getData = data;
        form = htmlForm("", "", "", "");
        list = customerList(getData);
    } else {
        id = req.url.slice(1);
        getData = data[id];
        if (!getData) {
            return badRequest(rsp, "Customer not found.", 404);
        }
        form = htmlForm(id, getData.surname, getData.givenName, getData.email, "PUT");
        form2 = deleteForm(id);
    }

    if (req.headers.accept === 'application/json') {
        rsp.writeHead(200, {'Content-Type': 'application/json'});
        rsp.end(JSON.stringify(getData, null, "    "));
    } else {
        rsp.writeHead(200, {'Content-Type': 'text/html'});
        rsp.end(`<!doctype html><title>Customers</title>
            ${form}
            ${form2}
            ${list}
`);
    }
}

function validCustomer(rsp, formData) {
    if (!formData.email) {
        badRequest(rsp, "Email address is required.", 400);
        return false;
    }
    if (formData.email.indexOf("@") === -1 || formData.email.indexOf(".") === -1) {
        badRequest(rsp, "Email address is invalid.", 400);
        return false;
    }
    if (emailExists(formData.email, formData.id)) {
        badRequest(rsp, "Email already exists.", 400);
        return false;
    }
    return true;
}

function addCustomer(req, rsp, formData) {
    var id, cust = {
        "surname": "",
        "givenName": "",
        "email": "",
        "created": +(new Date())
    };

    if (!validCustomer(rsp, formData)) {
        return;
    }

    id = newId();
    cust.surname = cleanStr(formData.surname);
    cust.givenName = cleanStr(formData.givenName);
    cust.email = cleanStr(formData.email);
    data[id] = cust;

    rsp.writeHead(201, {'Content-Type': 'text/plain'});
    rsp.end(`Added customer ${id}.`);
}

function editCustomer(req, rsp, formData) {
    var id = req.url.slice(1);
    if (!data[id]) {
        return badRequest(rsp, "ID doesn't exist.", 400);
    }

    if (!validCustomer(rsp, formData)) {
        return;
    }

    data[id].surname = formData.surname;
    data[id].givenName = formData.givenName;
    data[id].email = formData.email;

    rsp.writeHead(200, {'Content-Type': 'text/plain'});
    rsp.end(`Updated customer ${id}.`);
}

function deleteCustomer(req, rsp) {
    var id = req.url.slice(1);
    if (!data[id]) {
        return badRequest(rsp, "ID doesn't exist.", 400);
    }
    delete data[id];
    rsp.writeHead(200, {'Content-Type': 'text/plain'});
    rsp.end(`Deleted customer ${id}.`);
}

function routeMethods(req, rsp, body) {
    var requestBody, formData;
    if (req.method === 'GET') {
        return getCustomer(req, rsp);
    }

    if (req.method === 'POST') {
        formData = qs.parse(body);
        if (formData.method === "PUT") {
            return editCustomer(req, rsp, formData);
        }
        if (formData.method === "DELETE") {
            return deleteCustomer(req, rsp);
        }
        return addCustomer(req, rsp, formData);
    }

    if (req.method === 'DELETE') {
        return deleteCustomer(req, rsp);
    }

    if (req.method === 'PUT') {
        return editCustomer(req, rsp, qs.parse(body));
    }

    if (req.method === 'OPTIONS') {
        rsp.writeHead(200, {
            'Content-Type': 'text/plain',
            'Allow': "GET,POST,PUT,DELETE,OPTIONS",
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Origin': '*',
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        });
        rsp.end('OK');
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

http.createServer(collectReqBody).listen(4102, function () {
    console.log('Server started on port :4102');
});
