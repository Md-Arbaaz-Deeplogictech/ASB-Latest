/* 
 * rest_listener.js, REST API listener - for REST API support
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const urlMod = require("url");
const httpServerFactory = require(`${CONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, listener, messageContainer) => {
    if ((listener.flow.env[routeName] && listener.flow.env[routeName].server) || 
    (listener.flow.env[routeName] && listener.flow.env[routeName].creatingServer)) return; // already listening or creating

   listener.flow.env[routeName]= {"creatingServer" : true};


    httpServerFactory.createHTTPServer(listener, (err, server) => {
        if (err) { 
            LOG.error(`[REST_LISTENER] Unable to create server due to ${err}, disabling the flow`);
            delete listener.flow.env[routeName].creatingServer; throw (err);
        }

        listener.flow.env[routeName] = {server};
        delete listener.flow.env[routeName].creatingServer; // done

        listener.flow.env[routeName].server.on("request", (req, res) => {
            let endPoint = urlMod.parse(req.url, true).pathname;
            if (endPoint != listener.url) return;   // not ours to handle
    
            let data = "";
            req.on("data", chunk => data += chunk);
            
            req.on("end", _ => {
                let content;
                try {content = JSON.parse(data);} catch (err) {
                    LOG.error("[REST_LISTENER] Bad incoming request, dropping.");
                    res.writeHead(500, {"Content-Type": "text/plain"});
                    res.write("Bad request.\n");
                    res.end();
                    return;
                }
    
                const message = MESSAGE_FACTORY.newMessageAllocSafe();
                if (!message) {
                    LOG.error("[REST_LISTENER] Message creation error, throttling listener."); 
                    res.writeHead(429, {"Content-Type": "text/plain"});
                    res.write("Throttled.\n");
                    res.end();
                } else {
                    message.env.http_listener = {listener, req, res};
                    message.content = content;
                    message.addRouteDone(routeName);
                    messageContainer.add(message);
                    LOG.info(`[REST_LISTENER] Injected new message with timestamp: ${message.timestamp}`);
                    LOG.debug(`[REST_LISTENER] Incoming request: ${data}`);
                }
            });
        });
    });
}