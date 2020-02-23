const express = require('express');
const app = express();
let close = null;

try {
    const { NODE_ENV } = process.env;

    if (!NODE_ENV || NODE_ENV === 'development') {
        require('custom-env').env(process.env.NODE_ENV || 'development');
    }

    const path = require('path');
    const http = require('http').createServer(app);
    const io = require('socket.io')(http);
    const redisAdapter = require('socket.io-redis');
    const keys = require('./backend/config/keys.js');
    const bodyParser = require('body-parser');
    const cors = require('cors');

    console.log('REDIS URL: '+keys.redisURL+' PORT: '+process.env.REDIS_PORT);

    io.adapter(redisAdapter({
        host: keys.redisURL || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }));

    global.io = io;
    
    app.use(cors());

    app.use(function (req, res, next) {
        if (typeof (req.body) === 'string') {
            req.body = JSON.parse(req.body);
        }
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept,Authorization');
        next();
    });
   
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // const { RATE_LIMITTER_ENABLED } = process.env;
    // if (RATE_LIMITTER_ENABLED === 'true') {
    //     const rateLimiter = require('./backend/middlewares/rateLimit');
    //     app.use(rateLimiter);
    // }
    // //View engine setup
    // app.set('views', path.join(__dirname, 'views'));
    // app.set('view engine', 'ejs');

    // app.use(express.static(path.join(__dirname, 'views')));

    // app.use(require('./backend/middlewares/auditLogs').log);
    
    
    // Routes(API)
    // app.use('/server', require('./backend/api/server'));
    // app.use('/alert', require('./backend/api/alert'));
    // app.use('/user', require('./backend/api/user'));
    // app.use('/token', require('./backend/api/token'));
    // app.use('/team', require('./backend/api/team'));
    // app.use('/project', require('./backend/api/project'));
    // app.use('/invoice', require('./backend/api/invoice'));
    // app.use('/schedule', require('./backend/api/schedule'));
    // app.use('/monitor', require('./backend/api/monitor'));
    // app.use('/statusPage', require('./backend/api/statusPage'));
    // app.use('/file', require('./backend/api/file'));
    // app.use('/incident', require('./backend/api/incident'));
    // app.use('/reports', require('./backend/api/report'));
    // app.use('/lead', require('./backend/api/lead'));
    // app.use('/feedback', require('./backend/api/feedback'));
    // app.use('/twilio', require('./backend/api/twilio'));
    // app.use('/zapier', require('./backend/api/zapier'));
    // app.use('/slack', require('./backend/api/slack'));
    // app.use('/webhook', require('./backend/api/webHook'));
    // app.use('/notification', require('./backend/api/notification'));
    // app.use('/stripe', require('./backend/api/stripe'));
    // app.use('/subscriber', require('./backend/api/subscriber'));
    // app.use('/subscriberAlert', require('./backend/api/subscriberAlert'));
    // app.use('/emailTemplate', require('./backend/api/emailTemplate'));
    // app.use('/emailSmtp', require('./backend/api/emailSmtp'));
    // app.use('/smsTemplate', require('./backend/api/smsTemplate'));
    // app.use('/smsSmtp', require('./backend/api/smsSmtp'));
    // app.use('/monitorCategory', require('./backend/api/monitorCategory'));
    // app.use('/monitorCriteria', require('./backend/api/monitorCriteria'));
    // app.use('/scheduledEvent', require('./backend/api/scheduledEvent'));
    // app.use('/probe', require('./backend/api/probe'));
    // app.use('/version', require('./backend/api/version'));
    // app.use('/tutorial', require('./backend/api/tutorial'));
    // app.use('/audit-logs', require('./backend/api/auditLogs'));
    app.set('port', process.env.PORT || 3002);
    
    const server = http.listen(app.get('port'), function () {
        // eslint-disable-next-line
        console.log('Server Started on port ' + app.get('port'));
    });

    app.get('/', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            status: 200,
            message: 'Service Status - OK',
            serviceType: 'fyipe-api'
        }));
    });
    
    app.use('/*', function (req, res) {
        res.status(404).render('notFound.ejs', {});
    });

    close = function () {
        server.close();
    };

    //attach cron jobs
    require('./backend/workers/main');
} catch (error) {
    // IMPORTANT: Cannot start server. 
    // eslint-disable-next-line no-console
    console.error(error);
}

module.exports = app;
module.exports.close = close;

