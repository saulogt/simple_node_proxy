var http = require("http");


var listen_port;
var dest_port;


var argmode = 0;
process.argv.forEach(function (val, index, array) {
	if (argmode != 0)
	{
		if (argmode == 1)
		{
			dest_port = val;
		}
		else if (argmode == 2)
		{
			listen_port = val;
		}
		argmode = 0;
	}
	else if (val == "-destport")
	{
		argmode = 1;
	}
	else if(val == "-listenport")
	{
		argmode = 2;
	}
});

if (listen_port == null ||
	dest_port == null)
{
	console.log("listenport and destport must be defined\nusage: node nodeproxy.js -listenport <portnumber> -destport <portnumber>");
	process.exit(-1);
}

console.log("Listening on port "+ listen_port + ". forwarding to localhost:" + dest_port);


var server = http.createServer();

server.on('request', function(request, response) {

    var headers = request.headers;

    console.log('New request: ');
    console.log(headers);

    var newheader = {
        "content-type": headers["content-type"],
    };

   

    var clientOpt = {
        host: "localhost",
        port: dest_port,
        method: request.method,
        path: request.url,
        headers: newheader
    };

    var body = [];
    request.on('data', function(chunk) {
        body.push(chunk);
    });
    request.on('end', function() {

        var clireq = http.request(clientOpt, function(res) {
            console.log('SERVER STATUS: ' + res.statusCode);

            var responseData = [];
            res.on('data', function(chunk) {
                console.log('SERVER DATA');
                responseData.push(chunk);
                
            });
            res.on('end', function(){
            	console.log('SERVER END');
            	var buffer = Buffer.concat(responseData);

				var acceptencoding = res.headers['accept-encoding'];
				if (acceptencoding != null)
				{
					response.setHeader('accept-encoding', acceptencoding);
				}
				var acceptlanguage = res.headers['accept-language'];
				if (acceptlanguage != null)
				{
					response.setHeader('accept-language', acceptlanguage);
				}

            	response.setHeader('content-type', res.headers['content-type']);
            	response.setHeader('content-length', buffer.length);
            	response.write(buffer);
            	response.end();
            	responseData = [];
            });

        }).on('error', function(e) {
            console.log('problem with request: ' + e.message);

        });

        clireq.write(Buffer.concat(body));
        clireq.end();

        body = [];

    });

    request.on('close', function() {
        console.log('client disconnected');

    });

});

server.on('error', function(e) {
    console.log('error happened' + e);
});

server.listen(listen_port);
