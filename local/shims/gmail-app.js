'use strict';

/**
 * GmailApp stub. Logs the outbound message and does not send email.
 */

function attachmentNames(options) {
  const attachments = options && options.attachments;
  if (!attachments || !attachments.length) {
    return [];
  }

  return attachments.map((item) => {
    if (item && typeof item.getName === 'function') {
      return item.getName();
    }
    return '(blob)';
  });
}

function describeEmail(recipient, subject, body, options) {
  const opts = options || {};
  return {
    to: recipient,
    subject,
    body,
    htmlBody: opts.htmlBody,
    cc: opts.cc,
    bcc: opts.bcc,
    name: opts.name,
    replyTo: opts.replyTo,
    attachments: attachmentNames(opts),
  };
}

function installGmailApp(globalTarget = globalThis) {
  globalTarget.GmailApp = {
    sendEmail(recipient, subject, body, options) {
      console.log(
        '[GmailApp.sendEmail] stub',
        describeEmail(recipient, subject, body, options)
      );
    },
    createDraft(recipient, subject, body, options) {
      console.log(
        '[GmailApp.createDraft] stub',
        describeEmail(recipient, subject, body, options)
      );

      return {
        getId() {
          return 'local-draft-id';
        },
        send() {
          console.log('[GmailApp.Draft.send] stub');
          return {
            getId() {
              return 'local-message-id';
            },
          };
        },
      };
    },
  };
}

module.exports = { installGmailApp };
