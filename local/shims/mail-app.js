'use strict';

/**
 * MailApp stub. Logs the outbound message and does not send email.
 *
 * Supports both positional arguments and the object form:
 *   MailApp.sendEmail(recipient, subject, body)
 *   MailApp.sendEmail({ to, subject, body, htmlBody, ... })
 */

function describeMessage(args) {
  if (args.length === 1 && args[0] && typeof args[0] === 'object') {
    const message = args[0];
    return {
      to: message.to,
      subject: message.subject,
      body: message.body,
      htmlBody: message.htmlBody,
      cc: message.cc,
      bcc: message.bcc,
      name: message.name,
      replyTo: message.replyTo,
    };
  }

  return {
    to: args[0],
    subject: args[1],
    body: args[2],
    ...(args[3] || {}),
  };
}

function installMailApp(globalTarget = globalThis) {
  globalTarget.MailApp = {
    sendEmail(...args) {
      console.log('[MailApp.sendEmail] stub', describeMessage(args));
    },
    getRemainingDailyQuota() {
      return 100;
    },
  };
}

module.exports = { installMailApp };
