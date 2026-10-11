/** Assert that two values are equal. */
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            message + ': expected ' + expected + ', received ' + actual
        );
    }
}

/** Assert that a value is true. */
function assertTrue(value, message) {
    if (!value) {
        throw new Error(message);
    }
}

/** Assert that a callback throws an error with the expected message. */
function assertThrows(callback, expectedMessage, message) {
    let error;

    try {
        callback();
    } catch (caughtError) {
        error = caughtError;
    }

    assertTrue(error != null, message + ': expected an error');
    assertEqual(error.message, expectedMessage, message);
}

/** Run all implemented local unit and workflow tests. */
function testAll() {
    testConfig();
    testGA4();
    testReport();
    testGemini();
    testEmail();
    testAutomation();

    Logger.log('testAll passed');
}

/** Test the configuration loading functionality. */
function testConfig() {
    const properties = PropertiesService.getScriptProperties();
    const original = properties.getProperties();
    const requiredValues = {
        GA4_PROPERTY_ID: 'properties/123456789',
        GEMINI_API_KEY: 'test-gemini-key',
        REPORT_EMAIL_TO: 'reports@example.com'
    };

    try {
        properties.setProperties(requiredValues, true);

        let config = getConfig();

        // The property ID should be normalized to just the numeric part, without the "properties/" prefix.
        assertEqual(config.propertyId, '123456789', 'Property ID should be normalized');
        // The Gemini API key and report recipient should be returned.
        assertEqual(
            config.geminiApiKey,
            'test-gemini-key',
            'Gemini API key should be returned'
        );
        assertEqual(
            config.emailTo,
            'reports@example.com',
            'Report recipient should be returned'
        );
        // The admin email is optional and should be null if not set.
        assertEqual(config.adminEmail, null, 'Admin email should be optional');

        // The admin email should be trimmed of whitespace.
        properties.setProperty('ADMIN_EMAIL', ' admin@example.com ');
        config = getConfig();
        assertEqual(
            config.adminEmail,
            'admin@example.com',
            'Admin email should be trimmed'
        );

        // The property ID should be accepted with or without the "properties/" prefix.
        properties.setProperty('GA4_PROPERTY_ID', '987654321');
        config = getConfig();
        assertEqual(
            config.propertyId,
            '987654321',
            'Unprefixed property ID should be accepted'
        );

        const requiredKeys = [
            'GA4_PROPERTY_ID',
            'GEMINI_API_KEY',
            'REPORT_EMAIL_TO'
        ];

        // Test that missing required properties throw errors.
        requiredKeys.forEach(function (key) {
            properties.setProperties(requiredValues, true);
            properties.setProperty(key, '   ');

            assertThrows(
                getConfig,
                'Missing required script property: ' + key,
                'Missing ' + key + ' should fail'
            );
        });

        // Test that an invalid GA4 property ID throws an error.
        properties.setProperties(requiredValues, true);
        properties.setProperty(
            'GA4_PROPERTY_ID',
            'not-a-numeric-property-id'
        );
        assertThrows(
            getConfig,
            'GA4_PROPERTY_ID must contain a numeric property ID',
            'Invalid GA4 property ID should fail'
        );

        // Test that the API key is not included in validation errors.
        properties.setProperties(requiredValues, true);
        properties.setProperty('GEMINI_API_KEY', 'secret-value');
        try {
            properties.setProperty('GA4_PROPERTY_ID', 'invalid');
            getConfig();
        } catch (error) {
            assertTrue(
                error.message.indexOf('secret-value') === -1,
                'Validation errors must not contain the API key'
            );
        }

        Logger.log('testConfig passed');
    } finally {
        properties.setProperties(original, true);
    }
}

/** Test the GA4 functionality. */
function testGA4() {
    const request = buildGA4Request();

    // The request should have the expected shape for the GA4 report.
    assertEqual(
        request.dateRanges[0].startDate,
        '30daysAgo',
        'GA4 start date should cover the previous 30 days'
    );
    assertEqual(
        request.dateRanges[0].endDate,
        'today',
        'GA4 end date should be today'
    );
    assertEqual(
        request.dimensions[0].name,
        'sessionSourceMedium',
        'GA4 dimension should be sessionSourceMedium'
    );
    assertEqual(
        request.metrics[0].name,
        'activeUsers',
        'GA4 first metric should be activeUsers'
    );
    assertEqual(
        request.metrics[1].name,
        'conversions',
        'GA4 second metric should be conversions'
    );

    const config = { propertyId: '123456789' };
    const metrics = fetchGA4Metrics(config);

    // The metrics should be mapped from the GA4 response to an array of objects with source, activeUsers, and conversions.
    assertEqual(metrics.length, 2, 'GA4 fixture row count should be mapped');
    assertEqual(
        metrics[0].source,
        'google / organic',
        'GA4 source should be mapped'
    );
    assertEqual(metrics[0].activeUsers, 80, 'Active users should be numeric');
    assertEqual(metrics[0].conversions, 12, 'Conversions should be numeric');

    assertEqual(
        mapGA4Response({ rows: [] }).length,
        0,
        'An empty GA4 response should produce no metrics'
    );

    assertEqual(
        mapGA4Response({ rows: undefined }).length,
        0,
        'A GA4 response without rows should produce no metrics'
    );

    // Test that invalid GA4 responses throw errors.
    assertThrows(
        function () {
            mapGA4Response({ rows: 'invalid' });
        },
        'GA4 response rows must be an array',
        'Non-array GA4 rows should fail'
    );

    // Test that GA4 API errors are handled correctly.
    assertThrows(
        function () {
            mapGA4Response({
                error: { code: 403, message: 'Permission denied' }
            });
        },
        'GA4 response contained an API error',
        'GA4 API errors should fail'
    );

    // Test that missing dimensions or metrics in GA4 rows throw errors.
    assertThrows(
        function () {
            mapGA4Response({
                dimensionHeaders: [{ name: 'sessionSourceMedium' }],
                metricHeaders: [
                    { name: 'activeUsers' },
                    { name: 'conversions' }
                ],
                rows: [{ dimensionValues: [], metricValues: [] }]
            });
        },
        'GA4 row 0 is missing dimension: sessionSourceMedium',
        'Missing GA4 dimensions should fail'
    );

    // Test that invalid metric values in GA4 rows throw errors.
    assertThrows(
        function () {
            mapGA4Response({
                dimensionHeaders: [{ name: 'sessionSourceMedium' }],
                metricHeaders: [
                    { name: 'activeUsers' },
                    { name: 'conversions' }
                ],
                rows: [{
                    dimensionValues: [{ value: 'google / organic' }],
                    metricValues: [{ value: 'not-a-number' }, { value: '12' }]
                }]
            });
        },
        'GA4 row 0 has an invalid metric: activeUsers',
        'Invalid GA4 metrics should fail'
    );

    // Test that missing GA4 configuration throws an error.
    assertThrows(
        function () {
            fetchGA4Metrics({});
        },
        'GA4 configuration requires propertyId',
        'Missing GA4 configuration should fail'
    );

    Logger.log('testGA4 passed');
}

/** Test deterministic report calculations. */
function testReport() {
    const metrics = [
        {
            source: 'newsletter',
            activeUsers: 25,
            conversions: 4
        },
        {
            source: 'google / organic',
            activeUsers: 80,
            conversions: 12
        },
        {
            source: '(direct) / (none)',
            activeUsers: 70,
            conversions: 8
        }
    ];

    assertTrue(
        validateMetrics(metrics),
        'Valid metrics should pass validation'
    );

    const summary = summarizeMetrics(metrics);

    assertTrue(summary.hasData, 'A non-empty report should have data');
    assertEqual(
        summary.totalActiveUsers,
        175,
        'Total active users should be calculated'
    );
    assertEqual(
        summary.totalConversions,
        24,
        'Total conversions should be calculated'
    );
    assertEqual(
        summary.sourcesByActiveUsers[0].source,
        'google / organic',
        'Sources should be ranked by active users'
    );
    assertEqual(
        summary.sourcesByActiveUsers[1].source,
        '(direct) / (none)',
        'Second source should be ranked correctly'
    );
    assertEqual(
        summary.sourcesByActiveUsers.length,
        3,
        'All source rows should be retained'
    );

    const tied = sortSources([
        { source: 'first', activeUsers: 10, conversions: 1 },
        { source: 'second', activeUsers: 10, conversions: 2 }
    ]);
    assertEqual(
        tied[0].source,
        'first',
        'Tied sources should preserve their input order'
    );

    const emptySummary = summarizeMetrics([]);
    assertEqual(
        emptySummary.hasData,
        false,
        'An empty report should be marked as having no data'
    );
    assertEqual(
        emptySummary.totalActiveUsers,
        0,
        'Empty reports should have zero active users'
    );
    assertEqual(
        emptySummary.totalConversions,
        0,
        'Empty reports should have zero conversions'
    );
    assertEqual(
        emptySummary.sourcesByActiveUsers.length,
        0,
        'Empty reports should have no sources'
    );

    assertThrows(
        function() {
            validateMetrics(null);
        },
        'Metrics must be an array',
        'Non-array metrics should fail validation'
    );

    assertThrows(
        function() {
            validateMetrics([
                { activeUsers: 10, conversions: 1 }
            ]);
        },
        'Metric row 0 is missing source',
        'Metrics without a source should fail validation'
    );

    assertThrows(
        function() {
            validateMetrics([
                { source: 'source', activeUsers: '10', conversions: 1 }
            ]);
        },
        'Metric row 0 has an invalid activeUsers value',
        'Non-numeric active users should fail validation'
    );

    assertThrows(
        function() {
            validateMetrics([
                { source: 'source', activeUsers: 10, conversions: NaN }
            ]);
        },
        'Metric row 0 has an invalid conversions value',
        'Invalid conversions should fail validation'
    );

    Logger.log('testReport passed');
}

/** Test Gemini prompt construction and response handling. */
function testGemini() {
    const reportData = {
        hasData: true,
        totalActiveUsers: 150,
        totalConversions: 20,
        sourcesByActiveUsers: [
            {
                source: 'google / organic',
                activeUsers: 100,
                conversions: 15
            }
        ]
    };
    const prompt = buildSummaryPrompt(reportData);

    assertTrue(
        prompt.indexOf('The Big Picture') !== -1,
        'Prompt should contain the Big Picture section'
    );
    assertTrue(
        prompt.indexOf('What Is Working vs. What Needs Attention') !== -1,
        'Prompt should contain the working and attention section'
    );
    assertTrue(
        prompt.indexOf('Recommended Action Steps') !== -1,
        'Prompt should contain the action section'
    );
    assertTrue(
        prompt.indexOf('"totalActiveUsers": 150') !== -1,
        'Prompt should contain serialized report data'
    );
    assertTrue(
        prompt.indexOf('do not fabricate results') !== -1,
        'Prompt should define zero-data behavior'
    );

    const request = buildGeminiRequest(prompt);
    assertEqual(
        request.contents[0].parts[0].text,
        prompt,
        'Gemini request should contain the prompt text'
    );

    const summary = callGemini(prompt, {
        geminiApiKey: 'test-gemini-key'
    });
    assertTrue(
        summary.indexOf('Local Gemini stub') !== -1,
        'Canned Gemini response should be parsed'
    );

    assertThrows(
        function() {
            buildSummaryPrompt(null);
        },
        'Report data is required to build the Gemini prompt',
        'Missing report data should fail'
    );
    assertThrows(
        function() {
            buildGeminiRequest('');
        },
        'Gemini prompt must be a non-empty string',
        'Empty Gemini prompts should fail'
    );
    assertThrows(
        function() {
            callGemini(prompt, {});
        },
        'Gemini configuration requires an API key',
        'Missing Gemini API keys should fail'
    );

    assertThrows(
        function() {
            parseGeminiResponse({ candidates: [] });
        },
        'Gemini response did not contain generated text',
        'Empty Gemini candidates should fail'
    );
    assertThrows(
        function() {
            parseGeminiResponse({
                candidates: [{ content: { parts: [] } }]
            });
        },
        'Gemini response did not contain generated text',
        'Missing Gemini parts should fail'
    );
    assertThrows(
        function() {
            parseGeminiResponse({
                candidates: [{
                    content: { parts: [{ text: '   ' }] }
                }]
            });
        },
        'Gemini response did not contain generated text',
        'Blank Gemini text should fail'
    );

    const originalUrlFetchApp = UrlFetchApp;
    try {
        UrlFetchApp = {
            fetch: function() {
                return {
                    getResponseCode: function() {
                        return 429;
                    },
                    getContentText: function() {
                        return '{"error":{"code":429}}';
                    }
                };
            }
        };

        assertThrows(
            function() {
                callGemini(prompt, { geminiApiKey: 'secret-key' });
            },
            'Gemini API request failed with status 429',
            'Non-success Gemini responses should fail'
        );

        UrlFetchApp = {
            fetch: function() {
                return {
                    getResponseCode: function() {
                        return 200;
                    },
                    getContentText: function() {
                        return '{not-valid-json';
                    }
                };
            }
        };

        assertThrows(
            function() {
                callGemini(prompt, { geminiApiKey: 'secret-key' });
            },
            'Gemini response was not valid JSON',
            'Malformed Gemini JSON should fail'
        );
    } finally {
        UrlFetchApp = originalUrlFetchApp;
    }

    Logger.log('testGemini passed');
}

/** Test report email construction and failure notification. */
function testEmail() {
    const message = buildReportEmail(
        'The report summary.',
        { emailTo: ' reports@example.com ' }
    );

    assertEqual(
        message.to,
        'reports@example.com',
        'Report recipient should be trimmed'
    );
    assertEqual(
        message.subject,
        'Your Monthly Website Performance Update',
        'Report subject should be defined'
    );
    assertEqual(
        message.body,
        'The report summary.',
        'Report body should contain the summary'
    );

    assertThrows(
        function() {
            buildReportEmail('', { emailTo: 'reports@example.com' });
        },
        'Report summary must be a non-empty string',
        'Empty report summaries should fail'
    );
    assertThrows(
        function() {
            buildReportEmail('Summary', {});
        },
        'Email configuration requires a recipient',
        'Missing email recipients should fail'
    );

    const originalMailApp = MailApp;
    const originalLogger = Logger;
    const sentMessages = [];
    const logMessages = [];
    MailApp = {
        sendEmail: function(messageToSend) {
            sentMessages.push(messageToSend);
        }
    };
    Logger = {
        log: function(message) {
            logMessages.push(String(message));
        }
    };

    try {
        sendReportEmail('Summary body', {
            emailTo: 'reports@example.com'
        });
        assertEqual(
            sentMessages.length,
            1,
            'Report email should be sent once'
        );
        assertEqual(
            sentMessages[0].body,
            'Summary body',
            'Sent email should contain the summary'
        );

        const notified = handleAutomationFailure(
            new Error('GA4 request failed with secret-key'),
            {
                adminEmail: 'admin@example.com',
                geminiApiKey: 'secret-key'
            }
        );
        assertEqual(
            notified,
            true,
            'Admin notification should be sent when configured'
        );
        assertEqual(
            sentMessages.length,
            2,
            'Failure notification should be sent once'
        );
        assertEqual(
            sentMessages[1].to,
            'admin@example.com',
            'Failure notification should use the admin address'
        );
        assertTrue(
            sentMessages[1].body.indexOf('GA4 request failed') === -1,
            'Failure notification should not expose internal error details'
        );
        assertTrue(
            logMessages.some(function(message) {
                return message.indexOf(
                    'Monthly analytics automation failed: GA4 request failed'
                ) !== -1;
            }),
            'Expected failure should be logged'
        );

        const notNotified = handleAutomationFailure(
            new Error('Failure without admin'),
            { adminEmail: null }
        );
        assertEqual(
            notNotified,
            false,
            'No notification should be sent without an admin address'
        );
        assertEqual(
            sentMessages.length,
            2,
            'No-admin failure should not send an email'
        );

        MailApp = {
            sendEmail: function() {
                throw new Error('Mail service unavailable');
            }
        };
        assertEqual(
            handleAutomationFailure(
                new Error('Original failure'),
                { adminEmail: 'admin@example.com' }
            ),
            false,
            'Notification failure should be handled safely'
        );
        assertTrue(
            logMessages.some(function(message) {
                return message.indexOf(
                    'Failure notification could not be sent'
                ) !== -1;
            }),
            'Notification failure should be logged'
        );
    } finally {
        MailApp = originalMailApp;
        Logger = originalLogger;
    }

    Logger.log('testEmail passed');
}

/** Test the complete monthly workflow and its failure boundary. */
function testAutomation() {
    const originalMailApp = MailApp;
    const originalLogger = Logger;
    const sentMessages = [];

    MailApp = {
        sendEmail: function(messageToSend) {
            sentMessages.push(messageToSend);
        }
    };
    Logger = {
        log: function() {}
    };

    // Test the complete monthly summary generation workflow with a stubbed Gemini response.
    try {
        const summary = generateMonthlySummary();

        assertTrue(
            summary.indexOf('Local Gemini stub') !== -1,
            'Automation should return the generated summary'
        );
        assertEqual(
            sentMessages.length,
            1,
            'Successful automation should send one report email'
        );
        assertEqual(
            sentMessages[0].to,
            'dev@example.com',
            'Automation should use the configured recipient'
        );
        assertTrue(
            sentMessages[0].body.indexOf('Local Gemini stub') !== -1,
            'Report email should contain the generated summary'
        );
    } finally {
        MailApp = originalMailApp;
        Logger = originalLogger;
    }

    const originalAnalyticsData = AnalyticsData;
    const failureLogs = [];
    const properties = PropertiesService.getScriptProperties();
    const originalProperties = properties.getProperties();
    const failureMessages = [];
    MailApp = {
        sendEmail: function(messageToSend) {
            failureMessages.push(messageToSend);
        }
    };
    Logger = {
        log: function(message) {
            failureLogs.push(String(message));
        }
    };
    properties.setProperty('ADMIN_EMAIL', 'admin@example.com');

    AnalyticsData = {
        Properties: {
            runReport: function() {
                throw new Error('Simulated GA4 failure');
            }
        }
    };

    // Test that a simulated GA4 failure is handled correctly by the automation workflow.
    try {
        assertThrows(
            generateMonthlySummary,
            'Simulated GA4 failure',
            'Automation should rethrow the original failure'
        );
        assertEqual(
            failureMessages.length,
            1,
            'Automation failure should notify the configured admin'
        );
        assertEqual(
            failureMessages[0].to,
            'admin@example.com',
            'Failure notification should use the configured admin'
        );
        assertTrue(
            failureLogs.some(function(message) {
                return message.indexOf(
                    'Monthly analytics automation failed: Simulated GA4 failure'
                ) !== -1;
            }),
            'Simulated workflow failure should be logged'
        );
    } finally {
        AnalyticsData = originalAnalyticsData;
        MailApp = originalMailApp;
        Logger = originalLogger;
        properties.setProperties(originalProperties, true);
    }

    Logger.log('testAutomation passed');
}