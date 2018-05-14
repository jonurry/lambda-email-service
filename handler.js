'use strict';

const AWS = require('aws-sdk');
const SES = new AWS.SES();
const VALID_ORIGINS = require('./origins.json').origins;

function validateOrigin(testOrigin) {
  return VALID_ORIGINS.filter(origin => origin === testOrigin)[0] || null;
}

function sendEmail(formData, callback) {
  const emailParams = {
    Source: formData.ses_address, // SES SENDING EMAIL
    ReplyToAddresses: [formData.email],
    Destination: {
      ToAddresses: [formData.ses_address] // SES RECEIVING EMAIL
    },
    Message: {
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: `${formData.message}\n\nName: ${formData.name}\nCompany: ${
            formData.company
          }\nEmail: ${formData.email}\nTel: ${formData.phone}`
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: formData.subject
      }
    }
  };

  SES.sendEmail(emailParams, callback);
}

module.exports.sendMessageViaEmail = (event, context, callback) => {
  const origin = validateOrigin(event.headers.Origin || event.headers.origin);
  const formData = JSON.parse(event.body);

  if (origin) {
    sendEmail(formData, function(err, data) {
      const response = {
        statusCode: err ? 500 : 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: err ? err.message : data
        })
      };
      callback(null, response);
    });
  } else {
    callback('Unauthorised access');
  }
};
