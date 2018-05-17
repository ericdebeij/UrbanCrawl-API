'use strict';

module.exports = function(Customer) {

	Customer.register = function(body, cb){

		var bcrypt = require('bcrypt');
		var moment = require("moment");
		var jwt = require('jsonwebtoken');
		var keypair = require('keypair');

		const saltRounds = 10;

		Customer.count({email: body.email},function(err, count){
			if(!err){
				if(count == 0){

					var plainPassword = body.password;

					bcrypt.hash(plainPassword, saltRounds, function(err, hash){
						if(!err){
							const uuidv1 = require('uuid/v1');
							
							var userId = uuidv1();
							var dateNow = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
							Customer.create(
								{userid: userId, email: body.email, password: hash, full_name: body.name, createdate: dateNow},
								function(err, createResult){
									if(!err){
										//create jwt token
										var pair = keypair();
										var cert = pair.private;
										jwt.sign({ userid: userId }, cert, { algorithm: 'RS256' }, function(err, token) {
										  cb(null, {status: "ok", token: token});
										});
									}else{
										cb(err, null);
									}
							});
						}else{
							cb(err, null);
						}
					});
				}else{
					cb(null, {status: "error", message: "Email already exists"});
				}
				return;
			}else{
				cb(err, null);
			}
		});
	}

	Customer.login = function(body, cb){

		if(body === undefined || 
			body.email === undefined ||
			body.password === undefined){
				var error = new Error("Insufficient parameters supplied");
				error.status = 500;
				cb(error, null);
				return;
		}

		Customer.find({where: {email: body.email}},
			function(err, findResults){
				if(!err){
					if(findResults.length > 0){

						var bcrypt = require('bcrypt');

						bcrypt.compare(body.password, findResults[0].password, function(err, valid) {
							if(!err){
							    if (valid == true) {
							        var jwt = require('jsonwebtoken');
									var keypair = require('keypair');
									
									var pair = keypair();
									var cert = pair.private;
									jwt.sign({ userid: findResults[0].userid }, cert, { algorithm: 'RS256' }, function(err, token) {
									  cb(null, {status: "ok", token: token});
									});

							    } else if (valid == false) {
							        cb(null, {status: "error", message: "Incorrect Password"});
							    }
							}else{
								cb(err, null);
							}
						});
					}else{
						cb(null, {status: "error", message: "email not found"});
					}
				}else{
					cb(err, null);
				}
			});
		
	}

	Customer.remoteMethod(
    'register', {
      http: {
        path: '/register',
        verb: 'post'
      },
      accepts: {
	      	arg: 'items', 
	      	type: 'object', 
	      	http: {
	      		source: 'body'
	      	}
	    },
      returns: {
	    arg: 'result',
	    description: 'Returns a JWT key when successful',
	    type: 'string'
      }
    }
  );

	Customer.remoteMethod(
    'login', {
      http: {
        path: '/login',
        verb: 'post'
      },
      accepts: {
	      	arg: 'items', 
	      	type: 'object', 
	      	http: {
	      		source: 'body'
	      	}
	    },
      returns: {
	    arg: 'result',
	    description: 'Returns a JWT key when successful',
	    type: 'string'
      }
    }
  );
};
